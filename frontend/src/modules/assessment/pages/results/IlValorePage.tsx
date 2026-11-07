import { CompletionRing } from '@/components/patterns/CompletionRing'
import { EuroFigure } from '@/components/patterns/EuroFigure'
import { ResultsPage } from '@/components/patterns/ResultsPage'
import { RoleFitRanking } from '@/components/patterns/RoleFitRanking'
import { ScoreGauge } from '@/components/patterns/ScoreGauge'
import { Card } from '@/components/ui/card'
import { AssessmentModeSwitch } from '@/modules/assessment/components/AssessmentModeSwitch'
import { roiFigure } from '@/modules/assessment/components/RoiFigure'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { useAssessmentResults } from '@/modules/assessment/lib/use-results'
import { useRoi } from '@/modules/assessment/lib/use-roi'

// 01 · Il valore (CLAUDE.md, Fase 6, Decisioni del 2026-11-06). Parla solo dei
// risultati: due sezioni, «1 La situazione oggi», con dentro L'impatto, e «2 Criticità
// e opportunità». In alto il Gauge (un terzo) e le persone per valore espresso (due
// terzi); sotto, a metà riga, il Ring della copertura e L'impatto. Niente sparkline:
// il valore espresso non ha uno storico. Il gap medio compare solo se è diverso dal
// gap di adeguatezza.
export default function IlValorePage() {
  const { ui } = useAssessment()
  const { res, data, win, theme, crumbs, home, demoNote } = useAssessmentResults('il-valore')
  const roi = useRoi()
  const worst = data.worstRoleByGap
  const index = data.index ?? 0
  const rows = [...data.ranked]
    .filter((r) => r.index != null)
    .sort((a, b) => (b.index ?? 0) - (a.index ?? 0))
    .map((r) => ({ id: r.e.id, name: `${r.e.nome} ${r.e.cognome}`, meta: r.e.ruolo || r.e.mansione, value: Math.round(r.index ?? 0), color: 'var(--chart-mono)' }))
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
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="gap-3">
                <p className="label-mono text-muted-foreground">{res.indexLabel}</p>
                <ScoreGauge value={index} max={100} unit="%" decimals={0} tone="highlight" label={res.valoreGaugeCenter} />
                <p className="text-app-body text-foreground">{res.valoreGaugeNote(data.gap ?? 0)}</p>
                {data.gapMedio !== data.gap ? <p className="text-app-small text-muted-foreground">{`${res.gapMedioLabel}: ${res.gapPct(data.gapMedio)}`}</p> : null}
              </Card>
              <RoleFitRanking className="lg:col-span-2" label={res.valoreBarsTitle} sentence={res.valoreBars(data.belowExpected, data.aboveExpected)} rows={rows} referenceLabel={res.cmpReference} valueLabel={res.indexLabel} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="gap-3">
                <p className="label-mono text-muted-foreground">{ui.panoCoverage}</p>
                <CompletionRing value={data.coverage} label={ui.panoCoverage} center={res.valoreRingCenter} className="mx-0" />
                <p className="text-app-small text-muted-foreground">{ui.panoCoverageNote}</p>
              </Card>
              <Card className="gap-3">
                <p className="label-mono text-muted-foreground">{res.impactLabel}</p>
                <EuroFigure euro={roiFigure(res, roi, 'valore')} />
              </Card>
            </div>
          </div>
        ),
      }}
      issues={{
        items: [
          { title: res.valoreWorstRole, value: worst ? worst.label : res.valoreNoRole, body: worst ? res.gapPct(worst.gap) : undefined },
          { title: res.valoreBelow, value: data.belowExpected ? res.people(data.belowExpected) : res.nobody, body: res.valoreBelowBody },
          { title: res.valoreAbove, value: data.aboveExpected ? res.people(data.aboveExpected) : res.nobody, body: res.valoreAboveBody },
        ],
        opportunity: res.valoreOpportunity(worst?.label ?? null),
        opportunityLabel: res.opportunityLabel,
      }}
      home={home}
      demoNote={demoNote}
    />
  )
}
