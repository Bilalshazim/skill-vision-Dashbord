import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'

import { InlineAlert } from '@/components/patterns/InlineAlert'
import { Note } from '@/components/patterns/Note'
import { PersonRow } from '@/components/patterns/PersonRow'
import { PageHeader } from '@/components/patterns/PageHeader'
import { Initials } from '@/components/ui/avatar'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { chipTone } from '@/modules/assessment/lib/chip-tone'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScatterMatrix } from '@/components/patterns/ScatterMatrix'
import { TrendChart } from '@/components/patterns/TrendChart'
import { EmployeeDrawer } from '@/modules/assessment/components/EmployeeDrawer'
import { Icon } from '@/modules/assessment/components/Icon'
import { useAssessment, useTopbarActions } from '@/modules/assessment/lib/AssessmentContext'
import { bothActive, classifyPopulation, computeHardSummary, computeSoftSummary, primaryScore, primaryScoreLabel, tierFor } from '@/modules/assessment/lib/calculations'
import { fmt1, getTierDefs, round1 } from '@/modules/assessment/lib/legacy-utils'

// I colori delle cinque fasce di performance, sui token (CLAUDE.md cap. 7,
// "Colore di severità"): la fascia più alta non è uno stato ed è neutra
// piena (`foreground`), "adeguata" (nella norma) neutra tenue; le altre sui
// toni di stato. Il nome della fascia sta sempre accanto al colore. Prima:
// magenta e ottanio scritti a mano, diversi per modalità.
// Le stesse fasce come tono di Badge (la parola c'è sempre).
const TIER_TONE: Record<string, 'strong' | 'success' | 'neutral' | 'warning' | 'destructive'> = {
  top: 'strong',
  valorizzare: 'success',
  adeguata: 'neutral',
  sviluppo: 'warning',
  critica: 'destructive',
}

const TIER_COLORS: Record<string, string> = {
  top: 'var(--foreground)',
  valorizzare: 'var(--success)',
  adeguata: 'var(--muted-foreground)',
  sviluppo: 'var(--warning)',
  critica: 'var(--destructive)',
}

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
    csv += [r.e.cognome, r.e.nome, r.e.area, r.e.ruolo, fmt1(r.soft), fmt1(r.hard), fmt1(r.combined), r.tier.label].join(';') + '\n'
  })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'overall_value.csv'
  a.click()
  URL.revokeObjectURL(url)
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

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{ui.valoreClassificationTitle}</CardTitle>
          </CardHeader>
          <ul className="flex flex-col">
            {TIER_DEFS.map((t) => (
              <li className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0" key={t.key}>
                <Badge tone={TIER_TONE[t.key]} dot>
                  {t.label}
                </Badge>
                <span className="text-app-subtitle tabular-nums">{tiers[t.key].length}</span>
              </li>
            ))}
          </ul>
          <Note className="mt-3">
            {ui.valoreIndexNote(both ? ui.valoreIndexBoth : state.settings.modulo === 'A' ? ui.valoreIndexAOnly : ui.valoreIndexBOnly)}
          </Note>
        </Card>
        <Card className="lg:col-span-2">
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

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{ui.valoreMatrixTitle}</CardTitle>
          <CardDescription className="w-full">{ui.valoreMatrixSub}</CardDescription>
        </CardHeader>
        {/* G4 (DECISIONI): la matrice come dispersione soft × hard, un punto
            per persona nel colore della sua fascia; il clic apre la scheda.
            Solo con i due moduli: con uno solo non c'è il secondo asse. Gli
            elenchi per fascia sotto restano. */}
        {both ? (
          <ScatterMatrix
            className="mt-4"
            title={ui.valoreMatrixTitle}
            xLabel={ui.moduleASoft}
            yLabel={ui.moduleBHard}
            groups={TIER_DEFS.map((t) => ({ key: t.key, label: t.label, color: colors[t.key] }))}
            points={rows.map((r) => ({ id: r.e.id, label: `${r.e.nome} ${r.e.cognome}`, x: r.soft, y: r.hard, group: r.tier.key }))}
            onPointClick={setDrawerId}
          />
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3 mt-4 items-start">
          {TIER_DEFS.map((t) => (
            <div key={t.key} className="rounded-md border border-border bg-background p-3">
              <div className="mb-2 flex items-center gap-2">
                <Badge tone={TIER_TONE[t.key]} dot>
                  {t.label}
                </Badge>
                <span className="ml-auto text-app-small text-muted-foreground tabular-nums">{tiers[t.key].length}</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {tiers[t.key].length ? (
                  tiers[t.key].map((e) => {
                    const score = primaryScore(e, state, lang)
                    return (
                      <PersonRow key={e.id} first={e.nome} last={e.cognome} meta={e.ruolo} onClick={() => setDrawerId(e.id)} trailing={<Badge tone={score >= 7 ? 'success' : score >= 5 ? 'warning' : 'destructive'} dot>{fmt1(score)}</Badge>} />
                    )
                  })
                ) : (
                  <Note className="py-4 text-center">{ui.noEmployeesTitle}</Note>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="none">
        <CardHeader className="px-4 pt-4">
          <CardTitle>{ui.valoreByEmployeeTitle}</CardTitle>
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
              {rows.map((r, i) => (
                <TableRow key={r.e.id} onClick={() => setDrawerId(r.e.id)}>
                  <TableCell>{i + 1}</TableCell>
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
                    <Badge tone={chipTone(r.tier.chip)} dot>
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
