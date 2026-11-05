import { CompletionRing } from '@/components/patterns/CompletionRing'
import { DistributionBar } from '@/components/patterns/DistributionBar'
import { InfoTip } from '@/components/patterns/InfoTip'
import { ResultsPage } from '@/components/patterns/ResultsPage'
import { StaggerList } from '@/components/patterns/StaggerList'
import { StatCard } from '@/components/patterns/StatCard'
import { Card } from '@/components/ui/card'
import { AssessmentModeSwitch } from '@/modules/assessment/components/AssessmentModeSwitch'
import { roiFigure } from '@/modules/assessment/components/RoiFigure'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { TIER_DIST_TONE, TIER_ORDER, tierLabels } from '@/modules/assessment/lib/tier-display'
import { useAssessmentResults } from '@/modules/assessment/lib/use-results'
import { useRoi } from '@/modules/assessment/lib/use-roi'

// 01 · Il valore (formula di Roberto, 2026-11-05; DECISIONI). Sotto la frase, come
// «Stato attuale» e «Fasce» della Panoramica: quattro riquadri in riga — valore
// espresso, gap di adeguatezza, copertura mansioni, gap medio — e la distribuzione
// per fascia. Ogni numero una volta: nell'impatto resta solo la cifra in euro.
export default function IlValorePage() {
  const { ui } = useAssessment()
  const { res, data, win, f, crumbs, home, demoNote } = useAssessmentResults('il-valore')
  const labels = tierLabels(ui)
  const roi = useRoi()
  const label = (name: string, hint: string) => (
    <span className="inline-flex items-center gap-1">
      {name}
      <InfoTip label={`Che cosa misura: ${name}`}>{hint}</InfoTip>
    </span>
  )
  const worst = data.worstRoleByGap
  return (
    <ResultsPage
      actions={<AssessmentModeSwitch />}
      crumbs={crumbs}
      number={win.number}
      title={win.title}
      question={win.q}
      why={res.valoreWhy}
      empty={data.total && data.index != null ? undefined : { title: res.noTestsTitle, description: res.noTests }}
      situation={{
        text: res.valoreSituation(data.total, data.index ?? 0),
        wide: true,
        chart: (
          <div className="flex flex-col gap-4">
            <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label={label(res.indexLabel, res.indexHint)} value={res.indexPct(data.index)} />
              <StatCard label={label(res.gapLabel, res.gapHint)} value={res.gapPct(data.gap)} />
              <StatCard label={ui.panoCoverage} value={data.coverage} unit="%" note={ui.panoCoverageNote}>
                <CompletionRing value={data.coverage} label={ui.panoCoverage} className="mx-0" />
              </StatCard>
              <StatCard label={label(res.gapMedioLabel, res.gapMedioHint)} value={res.gapPct(data.gapMedio)} />
            </StaggerList>
            <Card className="gap-3">
              <p className="label-mono text-muted-foreground">{res.valoreBands}</p>
              <DistributionBar
                segments={TIER_ORDER.map((k) => ({
                  key: k,
                  label: labels[k],
                  pct: data.total ? (data.byTier[k].length / data.total) * 100 : 0,
                  tone: TIER_DIST_TONE[k],
                  display: `${data.byTier[k].length} · ${data.total ? Math.round((data.byTier[k].length / data.total) * 100) : 0}%`,
                }))}
              />
            </Card>
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
      impact={{ euro: roiFigure(res, roi, 'valore') }}
      suggestion={{ text: res.valoreSuggest(worst?.label ?? null), link: { label: res.goDove, to: '/assessment/dove-intervenire' } }}
      deepDives={[
        { label: res.deep.valore, to: '/assessment/valore' },
        { label: res.deep.risultati, to: f.A ? '/assessment/soft-risultati' : '/assessment/hard-risultati' },
        { label: res.deep.anagrafica, to: '/assessment/anagrafica' },
      ]}
      home={home}
      demoNote={demoNote}
    />
  )
}
