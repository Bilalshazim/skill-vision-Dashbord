import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { CategoryBars } from '@/components/patterns/CategoryBars'
import { CompletionRing } from '@/components/patterns/CompletionRing'
import { DataTable } from '@/components/patterns/DataTable'
import { EuroFigure, TextLink } from '@/components/patterns/EuroFigure'
import { HoverHighlightCard } from '@/components/patterns/HoverHighlightCard'
import { InfoTip } from '@/components/patterns/InfoTip'
import { ResultsPage } from '@/components/patterns/ResultsPage'
import { ScoreGauge } from '@/components/patterns/ScoreGauge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { AssessmentModeSwitch } from '@/modules/assessment/components/AssessmentModeSwitch'
import { EmployeeDrawer } from '@/modules/assessment/components/EmployeeDrawer'
import { roiFigure } from '@/modules/assessment/components/RoiFigure'
import { fmt1it } from '@/modules/assessment/lib/legacy-utils'
import { tierLabels } from '@/modules/assessment/lib/tier-display'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { useAssessmentResults } from '@/modules/assessment/lib/use-results'
import { useRoi } from '@/modules/assessment/lib/use-roi'

const pct = (n: number) => `${Math.round(n)}%`

// 01 · Il valore (CLAUDE.md, Fase 6; Roberto, 2026-11-13 e 2026-11-16). Una sezione sola,
// «1 La situazione oggi»: due finestre uguali, valore espresso (Gauge lime) e skill-gap
// mancante; «Vedi per competenze» apre il valore espresso per competenza, con l'atteso 100%
// tratteggiato; sotto, la copertura delle mansioni e L'impatto (produttività, turnover e
// assenteismo). «Criticità e opportunità» è passata in Le perdite invisibili.
export default function IlValorePage() {
  const { ui } = useAssessment()
  const labels = tierLabels(ui)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [openPeople, setOpenPeople] = useState(false)
  const [openSkills, setOpenSkills] = useState(false)
  const { res, data, win, theme, crumbs, home, demoNote } = useAssessmentResults('il-valore')
  const roi = useRoi()
  const index = data.index ?? 0
  // Lo skill-gap mancante: il gap medio senza segno. Se in media si supera l'atteso non manca niente.
  const gapMissing = Math.max(0, -(data.gapMedio ?? 0))
  return (
    <ResultsPage
      actions={<AssessmentModeSwitch />}
      crumbs={crumbs}
      number={win.number}
      theme={theme}
      title={win.title}
      question={win.q}
      why={res.valoreWhy}
      empty={data.total && data.index != null ? undefined : { title: res.noTestsTitle, description: res.noTests }}
      situation={{
        wide: true,
        chart: (
          <div className="flex flex-col gap-4">
            {/* Roberto, 2026-11-13: due finestre uguali affiancate, «80% valore espresso» e «20%
                skill-gap mancante», al posto del Gauge con il gap medio sotto. Il lime resta
                uno solo, sul valore espresso; lo skill-gap è il gap medio delle persone (il dato
                che va al ROI), in inchiostro. */}
            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
              {/* Al passaggio del mouse le quattro finestre si accendono: bordo lime, grafico lime
                  e un poco più grande (Bilal, 2026-11-16; HoverHighlightCard). */}
              <HoverHighlightCard chart={() => <ScoreGauge value={index} max={100} unit="%" decimals={0} tone="highlight" label={res.valoreGaugeCenter} className="justify-center" />}>
                <p className="flex items-center gap-2">
                  <span className="label-mono text-muted-foreground">{res.valoreExpressedTitle}</span>
                  <InfoTip label={res.valoreExpressedTitle}>{res.indexHint}</InfoTip>
                </p>
              </HoverHighlightCard>
              <HoverHighlightCard chart={(active) => <ScoreGauge value={gapMissing} max={100} unit="%" decimals={0} tone={active ? 'highlight' : 'mono'} label={res.valoreGapCenter} className="justify-center" />}>
                <p className="flex items-center gap-2">
                  <span className="label-mono text-muted-foreground">{res.valoreGapTitle}</span>
                  <InfoTip label={res.valoreGapTitle}>{res.valoreGapHint}</InfoTip>
                </p>
              </HoverHighlightCard>
            </div>
            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
              <HoverHighlightCard
                chart={(active) => <CompletionRing value={data.coverage} label={ui.panoCoverage} center={res.valoreRingCenter} tone={active ? 'highlight' : 'mono'} className="mx-auto" />}
                after={<p className="text-app-small text-muted-foreground">{ui.panoCoverageNote}</p>}
              >
                <p className="label-mono text-muted-foreground">{ui.panoCoverage}</p>
              </HoverHighlightCard>
              <HoverHighlightCard>
                <p className="label-mono text-muted-foreground">{res.valoreCostTitle}</p>
                <EuroFigure euro={roiFigure(res, roi, 'valore')} hoverScenarios />
              </HoverHighlightCard>
            </div>
            {/* Sotto le quattro finestre (Bilal, 2026-11-27: un 2×2 con lo stesso spazio fra tutte). Roberto, 2026-11-26 e 2026-11-27: al posto di «Vedi per competenze», l'elenco delle
                persone valutate, dal risultato più alto (il punteggio complessivo su 10, lo stesso delle
                fasce; un clic apre la scheda), e «Le competenze valutate». Tutti e due chiusi: «si deve
                aprire solo se interrogato» (Roberto, 2026-11-27). I due pulsanti stanno affiancati
                (Bilal, 2026-11-27); ognuno apre il suo elenco a tutta riga, sotto. */}
            {/* I due pulsanti seguono le colonne delle finestre (Bilal, 2026-11-27): il bordo destro di «Le persone
                valutate» sotto il bordo destro di Copertura mansioni, il bordo sinistro di «Le competenze valutate»
                sotto il bordo sinistro di Quanto mi sta costando. Su telefono, dove le finestre vanno in colonna, centrati. */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              <div className="flex justify-center md:justify-end">
                <Button variant="outline" className="group" aria-expanded={openPeople} aria-controls={openPeople ? 'valore-persone' : undefined} data-state={openPeople ? 'open' : 'closed'} onClick={() => setOpenPeople((v) => !v)}>
                  {res.valorePeopleTitle}
                  <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden />
                </Button>
              </div>
              <div className="flex justify-center md:justify-start">
                {data.skillValues.length ? (
                  <Button variant="outline" className="group" aria-expanded={openSkills} aria-controls={openSkills ? 'valore-competenze' : undefined} data-state={openSkills ? 'open' : 'closed'} onClick={() => setOpenSkills((v) => !v)}>
                    {res.valoreSkillsToggle}
                    <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden />
                  </Button>
                ) : null}
              </div>
            </div>
            {/* Un elenco chiuso non occupa posto nella colonna: altrimenti lascia uno spazio doppio sotto i pulsanti. */}
            {openPeople ? (
            <Collapsible open>
              <CollapsibleContent id="valore-persone">
                <Card className="gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="label-mono text-muted-foreground">{res.valorePeopleTitle}</p>
                    <p className="text-app-small text-muted-foreground">{res.valorePeopleSub(data.ranked.length)} {res.listOpenHint}</p>
                  </div>
                  <DataTable
                    rows={data.ranked}
                    getRowId={(r) => r.e.id}
                    rowLabel={(r) => `${r.e.nome} ${r.e.cognome}`}
                    onRowClick={(r) => setDrawerId(r.e.id)}
                    columns={[
                      { key: 'rank', header: res.colRank, nowrap: true, cell: (r) => data.ranked.indexOf(r) + 1 },
                      { key: 'name', header: res.colPerson, cell: (r) => `${r.e.nome} ${r.e.cognome}` },
                      { key: 'role', header: res.colRole, emphasis: 'muted', truncate: 'md', cell: (r) => r.e.ruolo || r.e.mansione || '—' },
                      { key: 'area', header: res.colArea, emphasis: 'muted', cell: (r) => r.e.area || '—' },
                      { key: 'band', header: res.colBand, nowrap: true, cell: (r) => labels[r.tier] },
                      { key: 'score', header: res.colScore, nowrap: true, cell: (r) => <span className="font-mono tabular-nums">{fmt1it(r.score)}</span> },
                      { key: 'value', header: res.colValue, nowrap: true, cell: (r) => <span className="font-mono tabular-nums">{r.index == null ? '—' : pct(r.index)}</span> },
                    ]}
                  />
                </Card>
              </CollapsibleContent>
            </Collapsible>
            ) : null}
            {data.skillValues.length && openSkills ? (
              <Collapsible open>
                <CollapsibleContent id="valore-competenze">
                  <Card className="gap-3">
                    <p className="flex items-center gap-2">
                      <span className="label-mono text-muted-foreground">{res.valoreSkillTitle}</span>
                      <InfoTip label={res.valoreSkillTitle}>{res.valoreSkillHint}</InfoTip>
                    </p>
                    <CategoryBars
                      title={res.valoreSkillTitle}
                      orientation="horizontal"
                      compact
                      hoverHighlight
                      valueMax={120}
                      format={pct}
                      series={[
                        { key: 'value', label: res.indexLabel },
                        { key: 'atteso', label: res.cmpReference, reference: true },
                      ]}
                      rows={data.skillValues.map((r) => ({ label: r.label, values: { value: r.value, atteso: 100 } }))}
                    />
                    <TextLink link={{ label: res.valoreSeeAll, to: '/assessment/valore' }} />
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            ) : null}
            {drawerId ? <EmployeeDrawer employeeId={drawerId} onClose={() => setDrawerId(null)} /> : null}
          </div>
        ),
      }}
      home={home}
      demoNote={demoNote}
    />
  )
}
