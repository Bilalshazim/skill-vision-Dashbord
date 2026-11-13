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
            {data.skillValues.length ? (
              <Collapsible className="flex flex-col gap-3">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="group self-center">
                    {res.valoreBySkill}
                    <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
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
      home={home}
      demoNote={demoNote}
    />
  )
}
