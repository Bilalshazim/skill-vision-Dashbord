import { useState } from 'react'

import { CategoryBars } from '@/components/patterns/CategoryBars'
import { MetricListCard } from '@/components/patterns/MetricListCard'
import { ResultsPage } from '@/components/patterns/ResultsPage'
import { AssessmentModeSwitch } from '@/modules/assessment/components/AssessmentModeSwitch'
import { EmployeeDrawer } from '@/modules/assessment/components/EmployeeDrawer'
import { roiFigure } from '@/modules/assessment/components/RoiFigure'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { fmt1it } from '@/modules/assessment/lib/legacy-utils'
import { ATTESO } from '@/modules/assessment/lib/results'
import { tierLabels } from '@/modules/assessment/lib/tier-display'
import { useAssessmentResults } from '@/modules/assessment/lib/use-results'
import { useRoi } from '@/modules/assessment/lib/use-roi'

// 02 · Le perdite invisibili (CLAUDE.md, Fase 6; Decisioni di Roberto del 2026-11-26).
// 1 · La situazione oggi: le aree, ottenuto contro l'atteso 7,0 tratteggiato, con lo scarto in
// fondo alla barra (le persone senza area stanno sotto «Area non indicata»: prima la loro barra
// non aveva nome). 2 · quattro finestre — Aree, Ruoli, Persone, Competenze — con il dato medio
// in alto e l'elenco dal peggiore al migliore; Persone elenca solo Da potenziare e Critici.
// 3 · L'impatto: la quota da potenziare e «Quanto posso recuperare» (le leve del motore ROI che
// erano in Il valore).
export default function PerditeInvisibiliPage() {
  const { ui } = useAssessment()
  const { res, data, win, theme, crumbs, home, demoNote } = useAssessmentResults('perdite-invisibili')
  const roi = useRoi()
  const labels = tierLabels(ui)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const ten = (n: number) => res.winOutOf10(fmt1it(n))
  const attesoText = fmt1it(ATTESO)
  return (
    <>
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
          // Roberto, 2026-11-26: via la riga «Cinque aree restano sotto…»; resta dove è la distanza maggiore.
          text: res.perditeDetail(data.worstArea?.label ?? null),
          chartTitle: res.perditeChart,
          hint: { label: res.perditeChart, text: res.perditeChartHint },
          chart: data.areas.length ? (
            <CategoryBars
              title={res.perditeChart}
              orientation="horizontal"
              compact
              hoverHighlight
              valueMax={10}
              format={fmt1it}
              series={[
                { key: 'avg', label: res.lossSeries },
                { key: 'atteso', label: res.lossRef(attesoText), reference: true },
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
          content: (
            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricListCard
                hover
                title={res.winAreas}
                value={data.areaAvg != null ? ten(data.areaAvg) : undefined}
                caption={res.winAvgCaption(attesoText)}
                listTitle={res.listAreas}
                items={data.areaList.map((a) => ({ id: a.label, label: a.label, meta: res.winCount(a.count), value: ten(a.avg) }))}
                emptyText={res.noArea}
              />
              <MetricListCard
                hover
                title={res.winRoles}
                value={data.roleAvg != null ? ten(data.roleAvg) : undefined}
                caption={res.winAvgCaption(attesoText)}
                listTitle={res.listRoles}
                items={data.roleList.map((r) => ({ id: r.label, label: r.label, meta: res.winCount(r.count), value: ten(r.avg) }))}
                emptyText={res.noRole}
              />
              <MetricListCard
                hover
                title={res.winPeople}
                value={data.peopleAvg != null ? ten(data.peopleAvg) : undefined}
                caption={res.winPeopleCaption(data.belowList.length, attesoText)}
                listTitle={res.listPeople}
                listSub={res.listOpenHint}
                items={data.belowList.map((r) => ({
                  id: r.e.id,
                  label: `${r.e.nome} ${r.e.cognome}`,
                  meta: [r.e.ruolo || r.e.mansione, labels[r.tier]].filter(Boolean).join(' · '),
                  value: ten(r.score),
                  onClick: () => setDrawerId(r.e.id),
                }))}
                emptyText={res.nobody}
              />
              <MetricListCard
                hover
                title={res.winSkills}
                value={data.skillAvg != null ? ten(data.skillAvg) : undefined}
                caption={res.winAvgCaption(attesoText)}
                listTitle={res.listSkills}
                items={data.skillList.map((s) => ({ id: s.label, label: s.label, meta: res.expectedAt(fmt1it(s.expected)), value: ten(s.avg) }))}
                emptyText={res.noSkill}
              />
            </div>
          ),
          opportunity: res.perditeOpportunity(data.worstArea?.label ?? null),
          opportunityLabel: res.opportunityLabel,
        }}
        impact={{
          pct: data.belowPct,
          title: res.perditeImpactTitle,
          label: res.perditeImpact,
          hint: res.perditeHint(data.below, data.total),
          euroTitle: res.perditeRecoverTitle,
          euro: roiFigure(res, roi, 'perdite'),
        }}
        home={home}
        demoNote={demoNote}
        hoverCards
      />
      {drawerId ? <EmployeeDrawer employeeId={drawerId} onClose={() => setDrawerId(null)} /> : null}
    </>
  )
}
