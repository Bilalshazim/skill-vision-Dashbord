import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { BandCard } from '@/components/patterns/BandCard'

import { InlineAlert } from '@/components/patterns/InlineAlert'
import { Note } from '@/components/patterns/Note'
import { PageHeader } from '@/components/patterns/PageHeader'
import { Initials } from '@/components/ui/avatar'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScatterMatrix } from '@/components/patterns/ScatterMatrix'
import { TrendChart } from '@/components/patterns/TrendChart'
import { EmployeeDrawer } from '@/modules/assessment/components/EmployeeDrawer'
import { Icon } from '@/modules/assessment/components/Icon'
import { useAssessment, useTopbarActions } from '@/modules/assessment/lib/AssessmentContext'
import { bothActive, classifyPopulation, computeHardSummary, computeSoftSummary, primaryScore, primaryScoreLabel, tierFor } from '@/modules/assessment/lib/calculations'
import { fmt1, fmt1csv, fmt1it, getTierDefs, round1 } from '@/modules/assessment/lib/legacy-utils'
import { TIER_BAND_TONE, TIER_COLORS, TIER_ORDER, type TierKey, tierDescription, tierLabels } from '@/modules/assessment/lib/tier-display'
import { CSV_TYPE, downloadText } from '@/lib/download'

// Colori, toni e nomi delle cinque fasce: lib/tier-display.ts, gli stessi
// della Panoramica (una classificazione sola, CLAUDE.md Fase 5).

// Client-supplied reference (skillvision-chart.html) hardcodes these exact
// 6 monthly points for each module rather than deriving them from any real
// per-month history — this app has no such history (every employee record
// is a single current snapshot, see demo-data.ts), so there's nothing to
// compute here differently. Kept verbatim as the demo trend, same as the
// rest of the app's demo data is also a fixed illustrative snapshot.
const ANDAMENTO_SOFT = [6.1, 6.2, 6.1, 6.3, 6.3, 6.4]
const ANDAMENTO_HARD = [6.0, 6.1, 6.3, 6.2, 6.4, 6.5]

function exportValoreCsv(rows: { e: { cognome: string; nome: string; area: string; ruolo: string }; soft: number; hard: number; combined: number; tier: { label: string } }[], csvHeader: string) {
  let csv = csvHeader + '\n'
  rows.forEach((r) => {
    csv += [r.e.cognome, r.e.nome, r.e.area, r.e.ruolo, fmt1csv(r.soft), fmt1csv(r.hard), fmt1csv(r.combined), r.tier.label].join(';') + '\n'
  })
  downloadText('overall_value.csv', csv, CSV_TYPE)
}

// Migrated from renderValore()/exportValoreCsv() (js/assessment.js
// ~7462-7592) — 5-tier classification list, tier matrix, ranked employee
// table, the "Esporta CSV" topbar action, and (Phase 25) the Chart.js
// ranked-value/tier-distribution canvas + real employee-drawer wiring
// (Phase 24 had a leftover placeholder card instead of the chart, and
// neither the matrix rows nor the table rows opened the employee drawer).
export default function AssessmentValorePage() {
  const { state, lang, ui } = useAssessment()
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const both = bothActive(state)
  const TIER_DEFS = getTierDefs(lang)
  const tiers = classifyPopulation(state, lang)
  // Memoized: this used to be rebuilt (new array reference) on every render
  // and fed straight into useTopbarActions' deps below, which made that
  // effect re-fire every render -> setTopbarActions -> context update ->
  // re-render -> rebuilt again, an infinite loop that froze this tab.
  const rows = useMemo(
    () =>
      state.employees
        .map((e) => ({ e, soft: computeSoftSummary(e, lang).overallOttenuto, hard: computeHardSummary(e, lang).apexScore, combined: primaryScore(e, state, lang) }))
        .map((r) => ({ ...r, tier: tierFor(r.combined, lang) }))
        .sort((a, b) => b.combined - a.combined),
    [state, lang],
  )
  const colors = TIER_COLORS
  const labels = tierLabels(ui)

  // "Vedi tutte" di una fascia filtra l'elenco per dipendente (`?fascia=`,
  // così ci si arriva anche dalla Panoramica) e lo porta in vista.
  const [params, setParams] = useSearchParams()
  const fascia = TIER_ORDER.find((k) => k === params.get('fascia')) ?? null
  const tableRef = useRef<HTMLDivElement>(null)
  const shownRows = fascia ? rows.filter((r) => r.tier.key === fascia) : rows
  function showBand(key: TierKey | null) {
    const next = new URLSearchParams(params)
    if (key) next.set('fascia', key)
    else next.delete('fascia')
    setParams(next, { replace: true })
    if (key) requestAnimationFrame(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  // "Score medio" for the trend footer blends both series equally at each
  // point, same as the reference's own single trend line/label — compares
  // the blended first vs. last month to decide the rising/falling/stable
  // wording (a >=0.05 move either way counts as a real trend, not noise).
  const andamentoBlendFirst = (ANDAMENTO_SOFT[0] + ANDAMENTO_HARD[0]) / 2
  const andamentoBlendLast = (ANDAMENTO_SOFT[ANDAMENTO_SOFT.length - 1] + ANDAMENTO_HARD[ANDAMENTO_HARD.length - 1]) / 2
  const andamentoDelta = round1(andamentoBlendLast - andamentoBlendFirst)
  const andamentoTrend = andamentoDelta > 0.05 ? 'up' : andamentoDelta < -0.05 ? 'down' : 'flat'

  useTopbarActions(
    <Button variant="outline" size="sm" onClick={() => exportValoreCsv(rows, ui.csvHeaderValore)}>
      <Icon name="download" />
      {ui.valoreExportCsv}
    </Button>,
    [rows, ui],
  )

  return (
    <div>
      <PageHeader title={primaryScoreLabel(state, lang)} description={both ? ui.valoreSubBoth : state.settings.modulo === 'A' ? ui.valoreSubAOnly : ui.valoreSubBOnly} />

      {!both && (
        <InlineAlert tone="warning" className="mb-4">
          {ui.valoreOnlyModuleNote(state.settings.modulo === 'A' ? ui.valoreModuleALabel : ui.valoreModuleBLabel)}
        </InlineAlert>
      )}

      {/* Le cinque fasce: ognuna dice chi c'è dentro (CLAUDE.md, Fase 5) — cosa
          significa con la soglia, quante persone e che quota, le prime tre per
          punteggio (il clic apre la scheda), "Vedi tutte" filtra l'elenco
          sotto. Prende il posto delle "Classi di performance" (solo i
          conteggi) e delle cinque colonne con tutti i nomi. */}
      <section className="mb-4">
        <PageHeader level="subsection" title={ui.bandsTitle} description={ui.valoreIndexNote(both ? ui.valoreIndexBoth : state.settings.modulo === 'A' ? ui.valoreIndexAOnly : ui.valoreIndexBOnly)} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TIER_ORDER.map((k) => (
            <BandCard
              key={k}
              label={labels[k]}
              tone={TIER_BAND_TONE[k]}
              description={tierDescription(k, ui, lang)}
              count={tiers[k].length}
              total={state.employees.length}
              unit={{ one: ui.bandPersonOne, many: ui.homeQ4PeopleUnit }}
              people={rows
                .filter((r) => r.tier.key === k)
                .map((r) => ({ id: r.e.id, name: `${r.e.nome} ${r.e.cognome}`, meta: r.e.mansione || r.e.ruolo, score: `${fmt1it(r.combined)} /10`, onClick: () => setDrawerId(r.e.id) }))}
              onSeeAll={() => showBand(k)}
              seeAllLabel={ui.bandSeeAll}
              emptyText={ui.bandEmpty}
            />
          ))}
        </div>
      </section>

      <div className="mb-4">
        <Card>
          <CardHeader>
            <CardTitle>{ui.homeAndamentoTitle}</CardTitle>
          </CardHeader>
          <Note className="mb-4">
            {ui.homeAndamentoSub(state.employees.length)}
          </Note>
          {/* G3 — andamento delle due competenze nel tempo: due linee, la
              principale in chart-mono e l'altra in muted-foreground (DECISIONI). */}
          <TrendChart
            title={ui.homeAndamentoTitle}
            scale={{ left: [0, 10] }}
            height="lg"
            series={[
              { key: 'soft', label: ui.moduleASoft },
              { key: 'hard', label: ui.moduleBHard },
            ]}
            points={ui.homeAndamentoMonths.map((m: string, i: number) => ({ date: new Date(2026, i, 1), label: m, values: { soft: ANDAMENTO_SOFT[i], hard: ANDAMENTO_HARD[i] } }))}
          />
          <p className="mt-4 flex items-center gap-2 text-app-small font-medium text-foreground">
            {andamentoTrend === 'up' ? <TrendingUp className="size-4 text-success" aria-hidden="true" /> : andamentoTrend === 'down' ? <TrendingDown className="size-4 text-destructive" aria-hidden="true" /> : <Minus className="size-4 text-muted-foreground" aria-hidden="true" />}
            {andamentoTrend === 'up' ? ui.homeAndamentoRising : andamentoTrend === 'down' ? ui.homeAndamentoFalling : ui.homeAndamentoStable}
            <span className="font-normal text-muted-foreground">· {ui.homeAndamentoPeriod}</span>
          </p>
        </Card>
      </div>

      {/* G4 (DECISIONI): la matrice come dispersione soft × hard, un punto
          per persona nel colore della sua fascia; il clic apre la scheda.
          Solo con i due moduli: con uno solo non c'è il secondo asse. */}
      {both ? (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{ui.valoreMatrixTitle}</CardTitle>
            <CardDescription className="w-full">{ui.valoreMatrixSub}</CardDescription>
          </CardHeader>
          <ScatterMatrix
            className="mt-4"
            title={ui.valoreMatrixTitle}
            xLabel={ui.moduleASoft}
            yLabel={ui.moduleBHard}
            groups={TIER_DEFS.map((t) => ({ key: t.key, label: t.label, color: colors[t.key as TierKey] }))}
            points={rows.map((r) => ({ id: r.e.id, label: `${r.e.nome} ${r.e.cognome}`, x: r.soft, y: r.hard, group: r.tier.key }))}
            thresholds={TIER_DEFS.filter((t) => t.min > 0).map((t) => ({ value: t.min, label: t.label }))}
            onPointClick={setDrawerId}
          />
        </Card>
      ) : null}

      <Card padding="none" ref={tableRef} className="scroll-mt-24">
        <CardHeader className="px-4 pt-4">
          <CardTitle>{ui.valoreByEmployeeTitle}</CardTitle>
          {fascia ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={TIER_BAND_TONE[fascia]} dot>
                {ui.bandFilterNote(labels[fascia])}
              </Badge>
              <Button type="button" variant="ghost" size="sm" onClick={() => showBand(null)}>
                {ui.bandFilterReset}
              </Button>
            </div>
          ) : null}
        </CardHeader>
        <Table frame>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{ui.colEmployee}</TableHead>
                <TableHead>{ui.colArea}</TableHead>
                <TableHead>{ui.colRole}</TableHead>
                {both ? (
                  <>
                    <TableHead>{ui.colSoftA}</TableHead>
                    <TableHead>{ui.colHardB}</TableHead>
                    <TableHead>{ui.colCombined}</TableHead>
                  </>
                ) : (
                  <TableHead>{primaryScoreLabel(state, lang)}</TableHead>
                )}
                <TableHead>{ui.colClassification}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shownRows.map((r) => (
                <TableRow key={r.e.id} onClick={() => setDrawerId(r.e.id)}>
                  <TableCell>{rows.indexOf(r) + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Initials first={r.e.nome} last={r.e.cognome} size="sm" />
                      <b>
                        {r.e.nome} {r.e.cognome}
                      </b>
                    </div>
                  </TableCell>
                  <TableCell>{r.e.area}</TableCell>
                  <TableCell>{r.e.ruolo}</TableCell>
                  {both ? (
                    <>
                      <TableCell>{fmt1(r.soft)}</TableCell>
                      <TableCell>{fmt1(r.hard)}</TableCell>
                      <TableCell>
                        <b>{fmt1(r.combined)}</b>
                      </TableCell>
                    </>
                  ) : (
                    <TableCell>
                      <b>{fmt1(r.combined)}</b>
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge tone={TIER_BAND_TONE[r.tier.key as TierKey]} dot>
                      {r.tier.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </Card>

      {drawerId && <EmployeeDrawer employeeId={drawerId} onClose={() => setDrawerId(null)} />}
    </div>
  )
}
