import { ChevronDown } from 'lucide-react'

import { CategoryBars } from '@/components/patterns/CategoryBars'
import { CompletionRing } from '@/components/patterns/CompletionRing'
import { EuroFigure, TextLink } from '@/components/patterns/EuroFigure'
import { InfoTip } from '@/components/patterns/InfoTip'
import { ResultsPage } from '@/components/patterns/ResultsPage'
import { ScoreGauge } from '@/components/patterns/ScoreGauge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AssessmentModeSwitch } from '@/modules/assessment/components/AssessmentModeSwitch'
import { roiFigure } from '@/modules/assessment/components/RoiFigure'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import type { RankedPerson } from '@/modules/assessment/lib/results'
import { useAssessmentResults } from '@/modules/assessment/lib/use-results'
import { useRoi } from '@/modules/assessment/lib/use-roi'

const pct = (n: number) => `${Math.round(n)}%`

// 01 · Il valore (CLAUDE.md, Fase 6; Decisioni del 2026-11-09, che sostituiscono le correzioni
// del mattino). «1 La situazione oggi» non ha frase: il Gauge del valore espresso, grande e
// centrato, su una riga da solo (l'unico lime della sezione). Sotto, «Vedi per mansione»
// apre (chiuso all'apertura) il valore espresso per mansione, con l'atteso 100% tratteggiato
// e il link a tutte le persone. Poi, a metà riga, il Ring della copertura e L'impatto.
// «2 Criticità e opportunità»: mansione e area con il maggiore deficit, e chi va oltre le
// attese, ognuno con il suo mini grafico in inchiostro.
export default function IlValorePage() {
  const { ui } = useAssessment()
  const { res, data, win, theme, crumbs, home, demoNote } = useAssessmentResults('il-valore')
  const roi = useRoi()
  const worst = data.worstRoleByGap
  const worstArea = data.worstAreaByValue
  const index = data.index ?? 0
  // Lo skill-gap mancante: il gap medio senza segno. Se in media si supera l'atteso non manca niente.
  const gapMissing = Math.max(0, -(data.gapMedio ?? 0))
  const people = (list: RankedPerson[]) => list.map((r) => ({ id: r.e.id, name: `${r.e.nome} ${r.e.cognome}`, value: Math.round(r.index ?? 0) }))
  const scale = { min: 0, max: 120, expected: 100, expectedLabel: res.cmpReference, format: pct }
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
              <Card className="h-full gap-3">
                <p className="flex items-center gap-2">
                  <span className="label-mono text-muted-foreground">{res.valoreExpressedTitle}</span>
                  <InfoTip label={res.valoreExpressedTitle}>{res.indexHint}</InfoTip>
                </p>
                <ScoreGauge value={index} max={100} unit="%" decimals={0} tone="highlight" label={res.valoreGaugeCenter} className="justify-center" />
              </Card>
              <Card className="h-full gap-3">
                <p className="flex items-center gap-2">
                  <span className="label-mono text-muted-foreground">{res.valoreGapTitle}</span>
                  <InfoTip label={res.valoreGapTitle}>{res.valoreGapHint}</InfoTip>
                </p>
                <ScoreGauge value={gapMissing} max={100} unit="%" decimals={0} label={res.valoreGapCenter} className="justify-center" />
              </Card>
            </div>
            {data.roleValues.length ? (
              <Collapsible className="flex flex-col gap-3">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="group self-center">
                    {res.valoreByRole}
                    <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card className="gap-3">
                    <p className="flex items-center gap-2">
                      <span className="label-mono text-muted-foreground">{res.valoreRoleTitle}</span>
                      <InfoTip label={res.valoreRoleTitle}>{res.valoreRoleHint}</InfoTip>
                    </p>
                    <CategoryBars
                      title={res.valoreRoleTitle}
                      orientation="horizontal"
                      compact
                      hoverHighlight
                      valueMax={120}
                      format={pct}
                      series={[
                        { key: 'value', label: res.indexLabel },
                        { key: 'atteso', label: res.cmpReference, reference: true },
                      ]}
                      rows={data.roleValues.map((r) => ({ label: r.label, values: { value: r.value, atteso: 100 } }))}
                    />
                    <TextLink link={{ label: res.valoreSeeAll, to: '/assessment/valore' }} />
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            ) : null}
            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
              <Card className="h-full gap-3">
                <p className="label-mono text-muted-foreground">{ui.panoCoverage}</p>
                <CompletionRing value={data.coverage} label={ui.panoCoverage} center={res.valoreRingCenter} className="mx-0" />
                <p className="text-app-small text-muted-foreground">{ui.panoCoverageNote}</p>
              </Card>
              <Card className="h-full gap-3">
                <p className="label-mono text-muted-foreground">{res.impactLabel}</p>
                <EuroFigure euro={roiFigure(res, roi, 'valore')} />
              </Card>
            </div>
          </div>
        ),
      }}
      issues={{
        items: [
          {
            title: res.valoreWorstRole,
            value: worst ? worst.label : res.valoreNoRole,
            body: worst ? res.gapPct(worst.gap) : undefined,
            chart: worst ? { kind: 'scale', label: worst.label, value: 100 + worst.gap, ...scale } : undefined,
          },
          {
            title: res.valoreWorstArea,
            value: worstArea ? worstArea.label : res.valoreNoArea,
            body: worstArea ? res.gapPct(worstArea.gap) : undefined,
            chart: worstArea ? { kind: 'scale', label: worstArea.label, value: 100 + worstArea.gap, ...scale } : undefined,
          },
          {
            title: res.valoreAbove,
            value: data.aboveExpected ? res.people(data.aboveExpected) : res.nobody,
            body: res.valoreAboveBody,
            chart: data.abovePeople.length ? { kind: 'people', rows: people(data.abovePeople), ...scale } : undefined,
          },
        ],
        opportunity: res.valoreOpportunity(worst?.label ?? null),
        opportunityLabel: res.opportunityLabel,
      }}
      home={home}
      demoNote={demoNote}
    />
  )
}
