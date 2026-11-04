import { FlowChart } from '@/components/patterns/FlowChart'
import { ResultsPage } from '@/components/patterns/ResultsPage'
import { AssessmentModeSwitch } from '@/modules/assessment/components/AssessmentModeSwitch'
import { roiFigure } from '@/modules/assessment/components/RoiFigure'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { fmt1it } from '@/modules/assessment/lib/legacy-utils'
import { TIER_COLORS, TIER_ORDER, tierLabels } from '@/modules/assessment/lib/tier-display'
import { useRoi } from '@/modules/assessment/lib/use-roi'
import { useAssessmentResults } from '@/modules/assessment/lib/use-results'

// 04 · Dove intervenire (CLAUDE.md, Fase 6, tabella "04 · Dove intervenire").
// Dalle fasce al piano di sviluppo (Sankey di Bklit, tavola del 2 novembre). I
// colloqui di restituzione sono le persone con il colloquio segnato in Piani di
// sviluppo (`feedbackNeeded`), lo stesso numero della Panoramica: l'"incongruenza"
// 10 contro 23 era l'etichetta dell'interruttore, scritta su ogni scheda
// (DECISIONI).
export default function DoveIntervenirePage() {
  const { res, data, win, crumbs, home, demoNote } = useAssessmentResults('dove-intervenire')
  const name = (k: keyof typeof res.interventi) => res.interventi[k] as string
  const top = data.mostFrequent
  const critical = data.byTier.critica.length
  const { ui } = useAssessment()
  const labels = tierLabels(ui)
  const roi = useRoi()
  // Dalle cinque fasce a cosa prevede il piano di sviluppo. Il colore della fascia
  // accompagna il suo nome; la fascia più alta e "nella norma" restano neutre.
  const n = TIER_ORDER.length
  const emptyBands = TIER_ORDER.filter((k) => !data.byTier[k].length).map((k) => labels[k])
  const highUntouched = data.flows.find((f) => f.tier === 'valorizzare')
  return (
    <ResultsPage
      actions={<AssessmentModeSwitch />}
      crumbs={crumbs}
      number={win.number}
      title={win.title}
      question={win.q}
      why={res.doveWhy}
      empty={data.total ? undefined : { title: res.noTestsTitle, description: res.noTests }}
      situation={{
        text: res.doveSituation(data.feedbackEvaluated, data.total, labels.valorizzare, highUntouched?.withFeedback ?? 0, (highUntouched?.withFeedback ?? 0) + (highUntouched?.without ?? 0)),
        wide: true,
        chart: (
          <FlowChart
            title={res.doveChart}
            nodes={[...TIER_ORDER.map((k) => ({ name: labels[k], color: TIER_COLORS[k] })), { name: res.doveFlowNone, color: 'var(--chart-compare)' }, { name: res.doveFlowFeedback, color: 'var(--chart-mono)' }]}
            links={data.flows.flatMap((f, i) => [
              { source: i, target: n, value: f.without },
              { source: i, target: n + 1, value: f.withFeedback },
            ])}
            note={res.doveFlowNote(emptyBands)}
            formatValue={res.people}
          />
        ),
      }}
      issues={{
        items: [
          { title: res.doveCritical, value: critical ? res.people(critical) : res.nobody, body: res.doveCriticalBody, link: { label: res.seeList, to: '/assessment/valore?fascia=critica' } },
          { title: res.doveFeedback, value: data.feedbackDue ? res.people(data.feedbackDue) : res.nobody, body: res.doveFeedbackBody, link: { label: res.open, to: '/assessment/feedback' } },
          { title: res.doveRole, value: data.worstRole ? data.worstRole.label : res.perditeNoRole, body: data.worstRole ? res.pointsBelow(fmt1it(data.worstRole.gap)) : undefined, link: { label: res.open, to: '/assessment/valore' } },
        ],
        opportunity: res.doveOpportunity(top ? name(top.key) : null, top?.count ?? 0, data.withIntervention),
        opportunityLabel: res.opportunityLabel,
      }}
      impact={{ pct: data.withInterventionPct, label: res.doveImpact, hint: res.doveHint(data.withIntervention, data.total), index: { value: data.index, label: res.indexLabel, hint: res.indexHint }, euro: roiFigure(res, roi, 'dove') }}
      suggestion={{ text: res.doveSuggest, link: { label: res.goPanoramica, to: '/assessment/panoramica' } }}
      deepDives={[
        { label: res.deep.piani, to: '/assessment/feedback' },
        { label: res.deep.panoramica, to: '/assessment/panoramica' },
      ]}
      home={home}
      demoNote={demoNote}
    />
  )
}
