import { CategoryBars } from '@/components/patterns/CategoryBars'
import { ResultsPage } from '@/components/patterns/ResultsPage'
import { fmt1it } from '@/modules/assessment/lib/legacy-utils'
import { useAssessmentResults } from '@/modules/assessment/lib/use-results'

// 02 · Le perdite invisibili (CLAUDE.md, Fase 6). È il modello delle sette
// pagine (tavola «Assessment · 2 Risultati · Le perdite invisibili»): la tavola
// non è nel repository, quindi i testi qui sono provvisori (DECISIONI) e i
// numeri vengono dagli stessi calcoli della Panoramica: persone sotto la norma
// (Da potenziare + Critici), aree, mansioni e competenze sotto l'atteso 7,0.
export default function PerditeInvisibiliPage() {
  const { res, data, win, f, crumbs, home, demoNote } = useAssessmentResults('perdite-invisibili')
  const competenze = f.A ? '/assessment/soft-overview' : '/assessment/hard-overview'
  return (
    <ResultsPage
      crumbs={crumbs}
      number={win.number}
      title={win.title}
      question={win.q}
      why={res.perditeWhy}
      empty={data.total ? undefined : { title: res.noTestsTitle, description: res.noTests }}
      situation={{
        text: res.perditeSituation(data.below, data.total),
        chart: data.areasBelow.length ? (
          <CategoryBars
            title={res.perditeChart}
            orientation="horizontal"
            height="auto"
            valueMax={Math.max(2, Math.ceil(data.areasBelow[0].gap))}
            format={fmt1it}
            series={[{ key: 'gap', label: res.perditeChart }]}
            rows={data.areasBelow.map((a) => ({ label: a.label, values: { gap: a.gap } }))}
            highlight={data.areasBelow[0].label}
          />
        ) : undefined,
        chartEmpty: res.perditeNoArea,
      }}
      issues={{
        items: [
          { title: res.perditeArea, value: data.worstArea ? data.worstArea.label : res.perditeNoArea, body: data.worstArea ? res.pointsBelow(fmt1it(data.worstArea.gap)) : undefined, link: { label: res.open, to: competenze } },
          { title: res.perditeRole, value: data.worstRole ? data.worstRole.label : res.perditeNoRole, body: data.worstRole ? res.pointsBelow(fmt1it(data.worstRole.gap)) : undefined, link: { label: res.open, to: '/assessment/valore' } },
          { title: res.perditeSkill, value: data.worstSkill ? data.worstSkill.name : res.perditeNoSkill, body: data.worstSkill ? res.pointsBelow(fmt1it(-data.worstSkill.gap)) : undefined, link: { label: res.open, to: competenze } },
        ],
        opportunity: res.perditeOpportunity(data.worstArea?.label ?? null),
      }}
      impact={{ pct: data.belowPct, label: res.perditeImpact, hint: res.perditeHint(data.below, data.total), euroNote: res.perditeEuro }}
      suggestion={{ text: res.perditeSuggest, link: { label: res.goDove, to: '/assessment/dove-intervenire' } }}
      deepDives={[
        { label: res.deep.soft, to: '/assessment/soft-overview' },
        { label: res.deep.hard, to: '/assessment/hard-overview' },
        { label: res.deep.valore, to: '/assessment/valore' },
      ]}
      home={home}
      demoNote={demoNote}
    />
  )
}
