import { useState } from 'react'

import { DistributionBar } from '@/components/patterns/DistributionBar'
import { MetricListCard } from '@/components/patterns/MetricListCard'
import { ResultsPage } from '@/components/patterns/ResultsPage'
import { AssessmentModeSwitch } from '@/modules/assessment/components/AssessmentModeSwitch'
import { EmployeeDrawer } from '@/modules/assessment/components/EmployeeDrawer'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { fmt1it } from '@/modules/assessment/lib/legacy-utils'
import { TIER_DIST_TONE, TIER_ORDER, tierLabels, type TierKey } from '@/modules/assessment/lib/tier-display'
import { useAssessmentResults } from '@/modules/assessment/lib/use-results'

// 03 · Il potenziale (CLAUDE.md, Fase 6; Decisioni di Roberto del 2026-11-26).
// 1 · La situazione oggi invariata: la barra di distribuzione per fascia. 2 · Opportunità (non più
// «Criticità e opportunità»): tre finestre, Top Talent (la fascia Alto valore), Alto potenziale e
// Nella norma, ognuna con quante persone, la quota e «Vedi elenco». L'impatto e la sua stima in
// euro sono tolti.
export default function PotenzialePage() {
  const { ui } = useAssessment()
  const { res, data, win, theme, crumbs, home, demoNote } = useAssessmentResults('potenziale')
  const labels = tierLabels(ui)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const pctOf = (n: number) => (data.total ? Math.round((n / data.total) * 100) : 0)
  const bandWindow = (k: TierKey, title: string) => {
    const list = data.byTier[k]
    return (
      <MetricListCard
        hover
        title={title}
        value={res.countPct(list.length, pctOf(list.length))}
        caption={labels[k]}
        listTitle={res.listBandHigh(title)}
        listSub={res.listOpenHint}
        items={list.map((r) => ({ id: r.e.id, label: `${r.e.nome} ${r.e.cognome}`, meta: r.e.ruolo || r.e.mansione || undefined, value: res.winOutOf10(fmt1it(r.score)), onClick: () => setDrawerId(r.e.id) }))}
        emptyText={res.nobody}
      />
    )
  }
  return (
    <>
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
                display: `${data.byTier[k].length} · ${pctOf(data.byTier[k].length)}%`,
              }))}
            />
          ),
        }}
        issues={{
          title: res.potOppTitle,
          content: (
            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
              {bandWindow('top', res.topTalent)}
              {bandWindow('valorizzare', labels.valorizzare)}
              {bandWindow('adeguata', labels.adeguata)}
            </div>
          ),
          opportunity: res.potenzialeOpportunity(data.above),
          opportunityLabel: res.opportunityLabel,
        }}
        home={home}
        demoNote={demoNote}
        hoverCards
      />
      {drawerId ? <EmployeeDrawer employeeId={drawerId} onClose={() => setDrawerId(null)} /> : null}
    </>
  )
}
