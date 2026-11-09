import { CategoryBars } from '@/components/patterns/CategoryBars'
import { ResultsPage } from '@/components/patterns/ResultsPage'
import { AssessmentModeSwitch } from '@/modules/assessment/components/AssessmentModeSwitch'
import { roiFigure } from '@/modules/assessment/components/RoiFigure'
import { fmt1it } from '@/modules/assessment/lib/legacy-utils'
import { ATTESO } from '@/modules/assessment/lib/results'
import { useAssessmentResults } from '@/modules/assessment/lib/use-results'
import { useRoi } from '@/modules/assessment/lib/use-roi'

// 02 · Le perdite invisibili (CLAUDE.md, Fase 6). È il modello delle sette
// pagine (tavola «Assessment · 2 Risultati · Le perdite invisibili»). I testi
// sono quelli della verifica in produzione del 2026-11-02; i numeri vengono
// dagli stessi calcoli della Panoramica: persone sotto la norma (Da potenziare
// + Critici), aree, mansioni e competenze sotto l'atteso 7,0. Parla solo delle perdite
// (Decisioni del 2026-11-06): per ogni area l'ottenuto, l'atteso tratteggiato con il
// valore e lo scarto in fondo alla barra; niente suggerimento né approfondimenti.
export default function PerditeInvisibiliPage() {
  const { res, data, win, theme, crumbs, home, demoNote } = useAssessmentResults('perdite-invisibili')
  const roi = useRoi()
  return (
    <ResultsPage
      actions={<AssessmentModeSwitch />}
      crumbs={crumbs}
      number={win.number}
      theme={theme}
      title={win.title}
      question={win.q}
      why={res.perditeWhy}
      empty={data.total ? undefined : { title: res.noTestsTitle, description: res.noTests }}
      situation={{
        text: res.perditeSituation(data.areasBelow.length),
        detail: res.perditeDetail(data.worstArea?.label ?? null),
        chartTitle: res.perditeChart,
        hint: { label: res.perditeChart, text: res.perditeChartHint },
        chart: data.areas.length ? (
          <CategoryBars
            title={res.perditeChart}
            orientation="horizontal"
            compact
            valueMax={10}
            format={fmt1it}
            series={[
              { key: 'avg', label: res.lossSeries },
              { key: 'atteso', label: res.lossRef(fmt1it(ATTESO)), reference: true },
            ]}
            rows={data.areas.map((a) => ({ label: a.label, values: { avg: a.avg, atteso: ATTESO } }))}
            highlight={data.worstArea?.label}
            barNote={(label) => {
              const gap = data.areas.find((a) => a.label === label)?.gap ?? 0
              return `${gap > 0 ? '+' : gap < 0 ? '−' : ''}${fmt1it(Math.abs(gap))}`
            }}
          />
        ) : undefined,
        chartEmpty: res.perditeNoArea,
      }}
      issues={{
        items: [
          { title: res.perditeArea, value: data.worstArea ? data.worstArea.label : res.perditeNoArea, body: data.worstArea ? res.pointsBelow(fmt1it(data.worstArea.gap)) : undefined, chart: data.worstArea ? { kind: 'scale' as const, label: data.worstArea.label, value: ATTESO - data.worstArea.gap, max: 10, expected: ATTESO, expectedLabel: res.expectedAt(fmt1it(ATTESO)), format: fmt1it } : undefined },
          { title: res.perditeRole, value: data.worstRole ? data.worstRole.label : res.perditeNoRole, body: data.worstRole ? res.pointsBelow(fmt1it(data.worstRole.gap)) : undefined, chart: data.worstRole ? { kind: 'scale' as const, label: data.worstRole.label, value: ATTESO - data.worstRole.gap, max: 10, expected: ATTESO, expectedLabel: res.expectedAt(fmt1it(ATTESO)), format: fmt1it } : undefined },
          { title: res.perditeSkill, value: data.worstSkill ? data.worstSkill.name : res.perditeNoSkill, body: data.worstSkill ? res.pointsBelow(fmt1it(-data.worstSkill.gap)) : undefined, chart: data.worstSkill ? { kind: 'scale' as const, label: data.worstSkill.name, value: data.worstSkill.value, max: 10, expected: data.worstSkill.expected, expectedLabel: res.expectedAt(fmt1it(data.worstSkill.expected)), format: fmt1it } : undefined },
        ],
        opportunity: res.perditeOpportunity(data.worstArea?.label ?? null),
        opportunityLabel: res.opportunityLabel,
      }}
      impact={{ pct: data.belowPct, label: res.perditeImpact, hint: res.perditeHint(data.below, data.total), index: { value: data.index, label: res.indexLabel, hint: res.indexHint }, euro: roiFigure(res, roi, 'perdite') }}
      home={home}
      demoNote={demoNote}
    />
  )
}
