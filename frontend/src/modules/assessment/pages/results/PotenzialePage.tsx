import { DistributionBar } from '@/components/patterns/DistributionBar'
import { ResultsPage } from '@/components/patterns/ResultsPage'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { fmt1it } from '@/modules/assessment/lib/legacy-utils'
import { TIER_DIST_TONE, TIER_ORDER, tierLabels } from '@/modules/assessment/lib/tier-display'
import { useAssessmentResults } from '@/modules/assessment/lib/use-results'

// 03 · Il potenziale (CLAUDE.md, Fase 6, tabella "03 · Il potenziale").
// Sopra la norma = Alto potenziale + Alto valore, sulle persone valutate. Il
// grafico è la barra di distribuzione per fascia (pattern della Fase 5), le
// cinque fasce con nome, numero e quota.
export default function PotenzialePage() {
  const { ui } = useAssessment()
  const { res, data, win, crumbs, home, demoNote, topThree } = useAssessmentResults('potenziale')
  const labels = tierLabels(ui)
  const band = (k: 'valorizzare' | 'top') => {
    const list = data.byTier[k]
    return {
      tone: 'success' as const,
      title: labels[k],
      value: list.length ? res.people(list.length) : res.nobody,
      list: topThree(list),
      link: { label: res.seeList, to: `/assessment/valore?fascia=${k}` },
    }
  }
  return (
    <ResultsPage
      crumbs={crumbs}
      number={win.number}
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
      impact={{ pct: data.abovePct, label: res.potenzialeImpact, hint: res.potenzialeHint(data.above, data.total), euroNote: res.potenzialeEuro }}
      suggestion={{ text: res.potenzialeSuggest, link: { label: res.goDove, to: '/assessment/dove-intervenire' } }}
      deepDives={[
        { label: res.deep.valore, to: '/assessment/valore' },
        { label: res.deep.piani, to: '/assessment/feedback' },
        { label: res.deep.cambio, to: '/assessment/cambio-ruolo' },
      ]}
      home={home}
      demoNote={demoNote}
    />
  )
}
