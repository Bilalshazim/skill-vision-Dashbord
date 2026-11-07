import { DistributionBar } from '@/components/patterns/DistributionBar'
import { ResultsPage } from '@/components/patterns/ResultsPage'
import { AssessmentModeSwitch } from '@/modules/assessment/components/AssessmentModeSwitch'
import { roiFigure } from '@/modules/assessment/components/RoiFigure'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { useRoi } from '@/modules/assessment/lib/use-roi'
import { fmt1it } from '@/modules/assessment/lib/legacy-utils'
import { TIER_DIST_TONE, TIER_ORDER, tierLabels } from '@/modules/assessment/lib/tier-display'
import { useAssessmentResults } from '@/modules/assessment/lib/use-results'

// 03 · Il potenziale (CLAUDE.md, Fase 6, tabella "03 · Il potenziale").
// Sopra la norma = Alto potenziale + Alto valore, sulle persone valutate. Il
// grafico è la barra di distribuzione per fascia (pattern della Fase 5), le
// cinque fasce con nome, numero e quota. Parla solo delle risorse interne (Decisioni
// del 2026-11-06): niente suggerimento né approfondimenti.
export default function PotenzialePage() {
  const { ui } = useAssessment()
  const { res, data, win, theme, crumbs, home, demoNote, topThree } = useAssessmentResults('potenziale')
  const labels = tierLabels(ui)
  const roi = useRoi()
  const band = (k: 'valorizzare' | 'top') => {
    const list = data.byTier[k]
    return {
      title: labels[k],
      value: list.length ? res.people(list.length) : res.nobody,
      list: topThree(list),
      link: { label: res.seeList, to: `/assessment/valore?fascia=${k}` },
    }
  }
  return (
    <ResultsPage
      actions={<AssessmentModeSwitch />}
      crumbs={crumbs}
      number={win.number}
      theme={theme}
      title={win.title}
      question={win.q}
      why={res.potenzialeWhy}
      empty={data.total ? undefined : { title: res.noTestsTitle, description: res.noTests }}
      situation={{
        text: res.potenzialeSituation(data.above, data.total),
        chart: (
          <DistributionBar
            segments={TIER_ORDER.map((k) => ({
              key: k,
              label: labels[k],
              pct: data.total ? (data.byTier[k].length / data.total) * 100 : 0,
              tone: TIER_DIST_TONE[k],
              display: `${data.byTier[k].length} · ${data.total ? Math.round((data.byTier[k].length / data.total) * 100) : 0}%`,
            }))}
          />
        ),
      }}
      issues={{
        items: [
          band('valorizzare'),
          band('top'),
          {
            title: res.potenzialeSkill,
            value: data.bestSoft ? data.bestSoft.name : res.potenzialeNoSkill,
            body: data.bestSoft ? res.pointsAbove(fmt1it(data.bestSoft.gap)) : undefined,
            link: { label: res.open, to: '/assessment/soft-overview' },
          },
        ],
        opportunity: res.potenzialeOpportunity(data.above),
        opportunityLabel: res.opportunityLabel,
      }}
      impact={{ pct: data.abovePct, label: res.potenzialeImpact, hint: res.potenzialeHint(data.above, data.total), index: { value: data.index, label: res.indexLabel, hint: res.indexHint }, euro: roiFigure(res, roi, 'potenziale') }}
      home={home}
      demoNote={demoNote}
    />
  )
}
