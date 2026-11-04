import { CategoryBars } from '@/components/patterns/CategoryBars'
import { ResultsPage } from '@/components/patterns/ResultsPage'
import { AssessmentModeSwitch } from '@/modules/assessment/components/AssessmentModeSwitch'
import { fmt1it } from '@/modules/assessment/lib/legacy-utils'
import { useAssessmentResults } from '@/modules/assessment/lib/use-results'

// 04 · Dove intervenire (CLAUDE.md, Fase 6, tabella "04 · Dove intervenire").
// Persone per tipo di intervento (Bar Chart orizzontale di Bklit, barre in
// inchiostro, la più lunga in evidenza; un tipo a zero resta con "0"). I
// colloqui di restituzione sono le persone con il colloquio segnato in Piani di
// sviluppo (`feedbackNeeded`), lo stesso numero della Panoramica: l'"incongruenza"
// 10 contro 23 era l'etichetta dell'interruttore, scritta su ogni scheda
// (DECISIONI).
export default function DoveIntervenirePage() {
  const { res, data, win, crumbs, home, demoNote } = useAssessmentResults('dove-intervenire')
  const name = (k: keyof typeof res.interventi) => res.interventi[k] as string
  const top = data.mostFrequent
  const critical = data.byTier.critica.length
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
        text: res.doveSituation(data.withIntervention, top ? name(top.key) : ''),
        chartTitle: res.doveChart,
        chart: (
          <CategoryBars
            title={res.doveChart}
            orientation="horizontal"
            height="sm"
            valueMax={Math.max(1, ...data.interventi.map((i) => i.count))}
            format={(n) => String(Math.round(n))}
            series={[{ key: 'n', label: res.doveChart }]}
            rows={data.interventi.map((i) => ({ label: name(i.key), values: { n: i.count } }))}
            highlight={top ? name(top.key) : undefined}
          />
        ),
      }}
      issues={{
        items: [
          { tone: 'destructive' as const, title: res.doveCritical, value: critical ? res.people(critical) : res.nobody, body: res.doveCriticalBody, link: { label: res.seeList, to: '/assessment/valore?fascia=critica' } },
          { title: res.doveFeedback, value: data.feedbackDue ? res.people(data.feedbackDue) : res.nobody, body: res.doveFeedbackBody, link: { label: res.open, to: '/assessment/feedback' } },
          { title: res.doveRole, value: data.worstRole ? data.worstRole.label : res.perditeNoRole, body: data.worstRole ? res.pointsBelow(fmt1it(data.worstRole.gap)) : undefined, link: { label: res.open, to: '/assessment/valore' } },
        ],
        opportunity: res.doveOpportunity(top ? name(top.key) : null, top?.count ?? 0),
        opportunityLabel: res.opportunityLabel,
      }}
      impact={{ pct: data.withInterventionPct, label: res.doveImpact, hint: res.doveHint(data.withIntervention, data.total), euroNote: res.doveEuro }}
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
