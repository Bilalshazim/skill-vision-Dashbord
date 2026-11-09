import { CategoryBars } from '@/components/patterns/CategoryBars'
import { CompletionRing } from '@/components/patterns/CompletionRing'
import { EuroFigure, TextLink } from '@/components/patterns/EuroFigure'
import { InfoTip } from '@/components/patterns/InfoTip'
import { ResultsPage } from '@/components/patterns/ResultsPage'
import { ScoreGauge } from '@/components/patterns/ScoreGauge'
import { Card } from '@/components/ui/card'
import { AssessmentModeSwitch } from '@/modules/assessment/components/AssessmentModeSwitch'
import { roiFigure } from '@/modules/assessment/components/RoiFigure'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import type { RankedPerson } from '@/modules/assessment/lib/results'
import { useAssessmentResults } from '@/modules/assessment/lib/use-results'
import { useRoi } from '@/modules/assessment/lib/use-roi'

const pct = (n: number) => `${Math.round(n)}%`

// 01 · Il valore (CLAUDE.md, Fase 6, Decisioni del 2026-11-06 e correzioni del
// 2026-11-09). Parla solo dei risultati: due sezioni, «1 La situazione oggi», con
// dentro L'impatto, e «2 Criticità e opportunità». In alto il Gauge (un terzo, l'unico
// lime della sezione) e, alla stessa altezza, il valore espresso per area (due terzi):
// una barra per area in inchiostro, l'atteso 100% tratteggiato, e il link alle persone.
// L'elenco delle 23 persone non sta più qui (colonna troppo lunga accanto al Gauge).
// Sotto, a metà riga, il Ring della copertura e L'impatto. Ogni riquadro della sezione 2
// ha il suo mini grafico, in inchiostro. Niente sparkline: il valore espresso non ha uno
// storico. Il gap medio compare solo se è diverso dal gap di adeguatezza.
export default function IlValorePage() {
  const { ui } = useAssessment()
  const { res, data, win, theme, crumbs, home, demoNote } = useAssessmentResults('il-valore')
  const roi = useRoi()
  const worst = data.worstRoleByGap
  const index = data.index ?? 0
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
        text: res.valoreSituation(data.total, index, data.belowExpected, data.aboveExpected),
        wide: true,
        chart: (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
              <Card className="h-full gap-3">
                <p className="label-mono text-muted-foreground">{res.indexLabel}</p>
                <ScoreGauge value={index} max={100} unit="%" decimals={0} tone="highlight" label={res.valoreGaugeCenter} />
                <p className="text-app-body text-foreground">{res.valoreGaugeNote(data.gap ?? 0)}</p>
                {data.gapMedio !== data.gap ? <p className="text-app-small text-muted-foreground">{`${res.gapMedioLabel}: ${res.gapPct(data.gapMedio)}`}</p> : null}
              </Card>
              <Card className="h-full gap-3 lg:col-span-2">
                <p className="flex items-center gap-2">
                  <span className="label-mono text-muted-foreground">{res.valoreAreaTitle}</span>
                  <InfoTip label={res.valoreAreaTitle}>{res.valoreAreaHint}</InfoTip>
                </p>
                <p className="text-app-body text-foreground">{res.valoreBars(data.belowExpected, data.aboveExpected)}</p>
                {data.areaValues.length ? (
                  <CategoryBars
                    title={res.valoreAreaTitle}
                    orientation="horizontal"
                    compact
                    valueMax={120}
                    format={pct}
                    series={[
                      { key: 'value', label: res.indexLabel },
                      { key: 'atteso', label: res.cmpReference, reference: true },
                    ]}
                    rows={data.areaValues.map((a) => ({ label: a.label, values: { value: a.value, atteso: 100 } }))}
                  />
                ) : null}
                <TextLink link={{ label: res.valoreSeeAll, to: '/assessment/valore' }} className="mt-auto" />
              </Card>
            </div>
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
            title: res.valoreBelow,
            value: data.belowExpected ? res.people(data.belowExpected) : res.nobody,
            body: res.valoreBelowBody,
            chart: data.belowPeople.length ? { kind: 'people', rows: people(data.belowPeople), ...scale } : undefined,
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
