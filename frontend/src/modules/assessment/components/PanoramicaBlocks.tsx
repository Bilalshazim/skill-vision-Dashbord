import { ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ActionList } from '@/components/patterns/ActionList'
import { BandCard } from '@/components/patterns/BandCard'
import { CategoryBars } from '@/components/patterns/CategoryBars'
import { ChartCard } from '@/components/patterns/ChartCard'
import { PageHeader } from '@/components/patterns/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmployeeDrawer } from '@/modules/assessment/components/EmployeeDrawer'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { areaLabel, bothActive, computeAvgMetric, homeStats, orgCriticalAreas, primaryScore, tierFor } from '@/modules/assessment/lib/calculations'
import { fmt1it } from '@/modules/assessment/lib/legacy-utils'
import { TIER_BAND_TONE, TIER_ORDER, tierDescription, tierLabels } from '@/modules/assessment/lib/tier-display'
import { roiEuro, useRoi } from '@/modules/assessment/lib/use-roi'
import { usePanoramicaTodo } from '@/modules/assessment/lib/use-panoramica-todo'

// I tre blocchi che erano nella Sintesi della Panoramica e che le Decisioni di Roberto del
// 2026-11-26 spostano in Dove intervenire, sotto «Cosa ti suggeriamo di fare»: Da fare adesso,
// Dove si perde valore, Le persone fascia per fascia. Stessi dati e stesse regole di prima
// (CLAUDE.md, Fase 6, «Panoramica»). I compiti di «Da fare adesso» li usa anche il Dettaglio
// della Panoramica: si calcolano qui, una volta sola.

export function TodoNowBlock() {
  const { ui } = useAssessment()
  const todo = usePanoramicaTodo()
  return (
    <section>
      <PageHeader title={ui.panoTodoTitle} description={ui.panoTodoSub} actions={<SeeMore to="/assessment/feedback">{ui.res.seeAll}</SeeMore>} />
      <ActionList items={todo} empty={{ title: ui.panoTodoEmpty, description: ui.panoTodoEmptySub }} />
    </section>
  )
}

/** Dove si perde valore: tutte le aree, dalla più bassa, contro l'atteso tratteggiato; in fondo il valore a rischio del motore. */
export function ValueLossBlock() {
  const { state, lang, ui } = useAssessment()
  const res = ui.res
  const hs = homeStats(state, lang)
  const roi = useRoi()
  const base = roi.status === 'ready' ? roi.scenarios?.base : undefined
  const f = { A: state.settings.modulo === 'A' || state.settings.modulo === 'AB', B: state.settings.modulo === 'B' || state.settings.modulo === 'AB' }
  const competenze = bothActive(state) ? (computeAvgMetric(state, lang, 'soft') <= computeAvgMetric(state, lang, 'hard') ? 'soft-risultati' : 'gestione-valutazioni') : f.A ? 'soft-risultati' : 'gestione-valutazioni'
  const lossRows = orgCriticalAreas(state, lang, 50).map((a) => ({ label: areaLabel(a.area, lang), values: { avg: a.avg, atteso: hs.benchmark } }))
  const worstLoss = lossRows[0] && lossRows[0].values.avg < hs.benchmark ? lossRows[0].label : undefined
  return (
    <section>
      <PageHeader title={res.lossTitle} description={res.lossSub(fmt1it(hs.benchmark))} actions={<SeeMore to={`/assessment/${competenze}`}>{ui.panoGapLink}</SeeMore>} />
      <ChartCard
        title={res.lossTitle}
        height="auto"
        empty={lossRows.length ? undefined : { title: res.lossNone }}
        footer={
          <p className="flex justify-between gap-2 text-app-small">
            <span className="font-semibold text-foreground">{res.lossTotal}</span>
            <span className="font-mono text-foreground">{base ? roiEuro(base.pool) : '€ [—]'}</span>
          </p>
        }
      >
        <CategoryBars
          title={res.lossTitle}
          orientation="horizontal"
          compact
          valueMax={10}
          format={fmt1it}
          series={[
            { key: 'avg', label: res.lossSeries },
            { key: 'atteso', label: res.lossRef(fmt1it(hs.benchmark)), reference: true },
          ]}
          rows={lossRows}
          highlight={worstLoss}
        />
      </ChartCard>
    </section>
  )
}

/** Le persone, fascia per fascia: le cinque fasce affiancate, con chi c'è dentro; «Nella norma» solo il conteggio. */
export function PeopleBandsBlock() {
  const { state, lang, ui } = useAssessment()
  const navigate = useNavigate()
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const hs = homeStats(state, lang)
  const labels = tierLabels(ui)
  const total = state.employees.length
  const ranked = useMemo(
    () =>
      state.employees
        .map((e) => ({ e, score: primaryScore(e, state, lang) }))
        .map((r) => ({ ...r, tier: tierFor(r.score, lang).key }))
        .sort((a, b) => b.score - a.score),
    [state, lang],
  )
  return (
    <section>
      <PageHeader title={ui.res.peopleTitle} description={ui.panoDistSub(total)} actions={<SeeMore to="/assessment/valore">{ui.panoDistLink}</SeeMore>} />
      <Card padding="lg">
        {total ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-5">
            {TIER_ORDER.map((k) => (
              <BandCard
                key={k}
                label={labels[k]}
                tone={TIER_BAND_TONE[k]}
                description={tierDescription(k, ui, lang)}
                count={hs.tiers[k].length}
                total={total}
                unit={{ one: ui.bandPersonOne, many: ui.homeQ4PeopleUnit }}
                people={ranked.filter((r) => r.tier === k).map((r) => ({ id: r.e.id, name: `${r.e.nome} ${r.e.cognome}`, meta: r.e.ruolo || r.e.mansione, score: `${fmt1it(r.score)} /10`, onClick: () => setDrawerId(r.e.id) }))}
                onSeeAll={() => navigate(`/assessment/valore?fascia=${k}`)}
                seeAllLabel={ui.bandSeeAll}
                emptyText={ui.bandEmpty}
                showPeople={k !== 'adeguata'}
                bare
              />
            ))}
          </div>
        ) : (
          <p className="text-app-small text-muted-foreground">{ui.panoEmptySub}</p>
        )}
      </Card>
      {drawerId ? <EmployeeDrawer employeeId={drawerId} onClose={() => setDrawerId(null)} /> : null}
    </section>
  )
}

export function SeeMore({ to, children }: { to: string; children: string }) {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link to={to}>
        {children}
        <ArrowRight />
      </Link>
    </Button>
  )
}
