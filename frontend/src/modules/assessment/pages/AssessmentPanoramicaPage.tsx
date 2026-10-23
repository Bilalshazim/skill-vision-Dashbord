import { ArrowRight, Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ActionList, type ActionItem } from '@/components/patterns/ActionList'
import { BandCard } from '@/components/patterns/BandCard'
import { CategoryBars } from '@/components/patterns/CategoryBars'
import { ChartCard } from '@/components/patterns/ChartCard'
import { CompletionRing } from '@/components/patterns/CompletionRing'
import { DistributionBar } from '@/components/patterns/DistributionBar'
import { PageHeader } from '@/components/patterns/PageHeader'
import { ScoreGauge } from '@/components/patterns/ScoreGauge'
import { StatCard } from '@/components/patterns/StatCard'
import { TrendChart } from '@/components/patterns/TrendChart'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CSV_TYPE, downloadText } from '@/lib/download'
import { EmployeeDrawer } from '@/modules/assessment/components/EmployeeDrawer'
import { ModeSwitch, type ModuleMode } from '@/modules/assessment/components/ModeSwitch'
import { allEvaluators, evStatus, norm } from '@/modules/assessment/gestione5p/model'
import { use5pState } from '@/modules/assessment/gestione5p/use5pState'
import { useAssessment, usePageDescription, useTopbarActions } from '@/modules/assessment/lib/AssessmentContext'
import {
  bothActive,
  computeAvgMetric,
  evaluatedEmployees,
  homeStats,
  lastDataUpdate,
  orgCriticalAreas,
  orgCriticalRoles,
  orgTrend,
  primaryScore,
  roleCoveragePct,
  tierFor,
  worstCompetenza,
} from '@/modules/assessment/lib/calculations'
import { fmt1csv, fmt1it, round1 } from '@/modules/assessment/lib/legacy-utils'
import type { AssessmentLang, getUI } from '@/modules/assessment/lib/legacy-utils'
import { TIER_BAND_TONE, TIER_DIST_TONE, TIER_ORDER, tierDescription, tierLabels } from '@/modules/assessment/lib/tier-display'
import type { AssessmentState } from '@/modules/assessment/lib/types'

type UI = ReturnType<typeof getUI>

const signed = (n: number) => `${n > 0 ? '+' : ''}${fmt1it(n)}`

// La Panoramica di Assessment (CLAUDE.md, Fase 6, deciso il 2026-10-23):
// sostituisce la Home a folder card. Tutto visibile all'apertura, testo a
// sinistra, superfici neutre, ogni numero una volta con un'unità sola (il
// punteggio su 10, i conteggi in persone, le quote in percentuale). Dall'alto:
// intestazione (titolo e riga dal layout, scelta CT / CP / Completo nelle
// azioni), Stato attuale (quattro card, ognuna col suo piccolo grafico),
// Da fare adesso, Fasce (le cinque, con chi c'è dentro), Andamento (dallo
// storico vero delle valutazioni), Dove guardare. "In programma" non c'è:
// Assessment non ha date future (Piani di sviluppo non ha scadenze), e un
// calendario non si inventa. Solo dati che l'applicazione ha già.
export default function AssessmentPanoramicaPage() {
  const { state, setState, lang, ui, canEdit, company } = useAssessment()
  const { state: s5 } = use5pState()
  const navigate = useNavigate()
  const [drawerId, setDrawerId] = useState<string | null>(null)

  const hs = homeStats(state, lang)
  const total = state.employees.length
  const both = bothActive(state)
  const f = { A: state.settings.modulo === 'A' || state.settings.modulo === 'AB', B: state.settings.modulo === 'B' || state.settings.modulo === 'AB' }
  const mode: ModuleMode = both ? 'AB' : f.A ? 'A' : 'B'
  const labels = tierLabels(ui)

  function setMode(next: ModuleMode) {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, modulo: next } }))
  }
  useTopbarActions(<ModeSwitch value={mode} onChange={setMode} ui={ui} />, [ui, mode])

  const updated = lastDataUpdate(state)
  const updatedLabel = updated ? updated.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : null
  usePageDescription(ui.panoSub(company?.name ?? '', updatedLabel), [ui, company?.name, updatedLabel])

  // Stato attuale
  const evaluated = evaluatedEmployees(state).length
  const evaluatedPct = total ? Math.round((evaluated / total) * 100) : 0
  const roleCovPct = roleCoveragePct(state, lang)
  const gap = round1(hs.orgAvg - hs.benchmark)
  const critical = hs.tiers.critica.length
  const criticalPct = total ? Math.round((critical / total) * 100) : 0

  // L'andamento, dallo storico delle valutazioni (calculations.ts, orgTrend):
  // una linea per area attiva nella scelta CT / CP, il benchmark tratteggiato.
  const trend = useMemo(() => orgTrend(state), [state])
  const trendSeries = [
    ...(f.A ? [{ key: 'soft', label: ui.moduleASoft }] : []),
    ...(f.B ? [{ key: 'hard', label: ui.moduleBHard }] : []),
    { key: 'bench', label: `${ui.homeOrgTrendModeBenchmark} ${fmt1it(hs.benchmark)}`, reference: true },
  ]
  // Solo i mesi con un valore per ogni linea attiva: un buco disegnato a zero
  // sarebbe un dato falso.
  const trendPoints = trend.filter((t) => (!f.A || t.soft != null) && (!f.B || t.hard != null))
  const lastTwo = trendPoints.slice(-2).map((t) => avgOf([f.A ? t.soft : null, f.B ? t.hard : null]))
  const trendDelta = lastTwo.length === 2 && lastTwo[0] != null && lastTwo[1] != null ? round1(lastTwo[1] - lastTwo[0]) : null

  // Da fare adesso, dalla più urgente. Le schede 5P: un valutatore senza
  // risposte e non ancora segnato come inviato ha la scheda da inviare; uno
  // segnato come inviato ma con risposte mancanti ha valutazioni da
  // raccogliere (gli stessi stati di "Invio schede"). Più le valutazioni
  // esterne in attesa.
  const evaluators = allEvaluators(s5)
  const toSend = evaluators.filter((e) => !s5.sent[norm(e.name)] && evStatus(s5, e.name).rec === 0).length
  const toCollect =
    evaluators.filter((e) => {
      const st = evStatus(s5, e.name)
      return !!s5.sent[norm(e.name)] && st.rec < st.exp
    }).length + state.evalAssignments.filter((a) => a.status === 'pending').length
  const worstSkill = worstCompetenza(state, lang, f)
  const note = (key: string, fallback: string): ActionItem['note'] => ({
    value: state.settings.actionNotes?.[key] ?? fallback,
    onChange: (v) => canEdit && setState((prev) => ({ ...prev, settings: { ...prev.settings, actionNotes: { ...prev.settings.actionNotes, [key]: v } } })),
    readOnly: !canEdit,
  })
  const people = ui.homeQ4PeopleUnit
  const todo: ActionItem[] = [
    { key: 'critical', label: ui.panoTodoCritical, description: ui.panoTodoCriticalDesc, count: critical, unit: people, to: '/assessment/valore?fascia=critica', linkLabel: ui.panoOpen },
    { key: 'feedback', label: ui.panoTodoFeedback, description: ui.panoTodoFeedbackDesc, count: hs.feedbackDue, unit: people, to: '/assessment/feedback', linkLabel: ui.panoOpen },
    { key: 'collect', label: ui.panoTodoCollect, description: ui.panoTodoCollectDesc, count: toCollect, unit: ui.panoEvaluatorsUnit, to: '/assessment/gestione-valutazioni', linkLabel: ui.panoOpen },
    { key: 'send', label: ui.panoTodoSend, description: ui.panoTodoSendDesc, count: toSend, unit: ui.panoEvaluatorsUnit, to: '/assessment/gestione-valutazioni', linkLabel: ui.panoOpen },
    // Le azioni di sviluppo per tipo, con la loro nota modificabile (salvata
    // nelle impostazioni del modulo, come nella vecchia Home).
    { key: 'reorg', label: ui.azioniReorgShort, note: note('reorg', ui.azioniReorgDesc), count: hs.tiers.critica.length, unit: people, to: '/assessment/feedback', linkLabel: ui.panoOpen },
    { key: 'training', label: ui.azioniTraining, note: note('training', ui.azioniTrainingDesc(worstSkill ? worstSkill.name : ui.worstSkillFallback)), count: hs.tiers.sviluppo.length, unit: people, to: '/assessment/feedback', linkLabel: ui.panoOpen },
    { key: 'coaching', label: ui.azioniCoaching, note: note('coaching', ui.azioniCoachingDesc), count: hs.tiers.valorizzare.length, unit: people, to: '/assessment/feedback', linkLabel: ui.panoOpen },
    { key: 'talent', label: ui.azioniTalentShort, note: note('talent', ui.azioniTalentDesc), count: hs.tiers.top.length, unit: people, to: '/assessment/feedback', linkLabel: ui.panoOpen },
  ]

  // Le persone per fascia, dalla più alta in punteggio (per le prime tre).
  const ranked = useMemo(
    () =>
      state.employees
        .map((e) => ({ e, score: primaryScore(e, state, lang) }))
        .map((r) => ({ ...r, tier: tierFor(r.score, lang).key }))
        .sort((a, b) => b.score - a.score),
    [state, lang],
  )

  // Dove guardare: aree e mansioni sotto il benchmark, dalla più lontana.
  const gapRows = (list: { label: string; avg: number }[]) =>
    list
      .map((r) => ({ label: r.label, gap: round1(hs.benchmark - r.avg) }))
      .filter((r) => r.gap > 0.05)
      .sort((a, b) => b.gap - a.gap)
  const gapAreas = gapRows(orgCriticalAreas(state, lang, 6).map((a) => ({ label: a.area, avg: a.avg })))
  const gapRoles = gapRows(orgCriticalRoles(state, lang, 6).map((r) => ({ label: r.ruolo, avg: r.avg })))
  const competenze = both ? (computeAvgMetric(state, lang, 'soft') <= computeAvgMetric(state, lang, 'hard') ? 'soft-overview' : 'hard-overview') : f.A ? 'soft-overview' : 'hard-overview'

  return (
    <div className="flex flex-col gap-8">
      <section>
        <PageHeader title={ui.panoStatusTitle} />
        {/* Quattro card in riga, ognuna col suo grafico piccolo. Il numero si
            scrive una volta: nel punteggio lo porta il Gauge al centro, nelle
            altre la card (gli anelli non hanno numero al centro). */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {evaluated ? (
            <StatCard label={ui.panoScore} note={[ui.panoScoreGap(signed(gap)), trendDelta != null ? ui.panoTrendDelta(signed(trendDelta)) : null].filter(Boolean).join(' · ')}>
              <ScoreGauge size="sm" value={hs.orgAvg} label={ui.panoGaugeBench(fmt1it(hs.benchmark))} />
            </StatCard>
          ) : (
            <StatCard label={ui.panoScore} valueKind="text" value={ui.panoScorePending} note={ui.panoScorePendingNote} />
          )}
          <StatCard label={ui.panoCoverage} value={roleCovPct} unit="%" note={ui.panoCoverageNote}>
            <CompletionRing value={roleCovPct} label={ui.panoCoverage} className="mx-0" />
          </StatCard>
          <StatCard label={ui.panoEvaluated} value={evaluated} unit={people} note={ui.panoEvaluatedNote(total)}>
            <CompletionRing value={evaluatedPct} label={ui.panoEvaluated} className="mx-0" />
          </StatCard>
          <StatCard label={ui.panoCritical} value={critical} unit={people} tone={critical ? 'destructive' : 'neutral'} note={ui.panoCriticalNote(labels.critica, criticalPct)}>
            <CompletionRing tone="destructive" value={criticalPct} label={ui.panoCritical} className="mx-0" />
          </StatCard>
        </div>
      </section>

      <section>
        <PageHeader
          title={ui.panoTodoTitle}
          description={ui.panoTodoSub}
          actions={
            <Button type="button" variant="ghost" size="sm" onClick={() => exportActionPlan(state, lang, ui)}>
              <Download aria-hidden="true" />
              {ui.panoExportPlan}
            </Button>
          }
        />
        <ActionList items={todo} empty={{ title: ui.panoTodoEmpty, description: ui.panoTodoEmptySub }} />
      </section>

      {/* Le cinque fasce, una classificazione sola: ognuna dice chi c'è dentro
          (CLAUDE.md, Fase 5) — soglia, persone e quota, le prime tre per
          punteggio (il clic apre la scheda), "Vedi tutte" → Valori Complessivi
          filtrato sulla fascia. Sopra, la distribuzione. */}
      <section>
        <PageHeader title={ui.panoBandsTitle} description={ui.panoDistSub(total)} actions={<SeeMore to="/assessment/valore">{ui.panoDistLink}</SeeMore>} />
        {total ? (
          <div className="flex flex-col gap-4">
            <Card>
              <DistributionBar
                segments={TIER_ORDER.map((k) => ({
                  key: k,
                  label: labels[k],
                  pct: (hs.tiers[k].length / total) * 100,
                  tone: TIER_DIST_TONE[k],
                  display: `${hs.tiers[k].length} · ${Math.round((hs.tiers[k].length / total) * 100)}%`,
                }))}
              />
            </Card>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {TIER_ORDER.map((k) => (
                <BandCard
                  key={k}
                  label={labels[k]}
                  tone={TIER_BAND_TONE[k]}
                  description={tierDescription(k, ui, lang)}
                  count={hs.tiers[k].length}
                  total={total}
                  unit={{ one: ui.bandPersonOne, many: people }}
                  people={ranked.filter((r) => r.tier === k).map((r) => ({ id: r.e.id, name: `${r.e.nome} ${r.e.cognome}`, meta: r.e.mansione || r.e.ruolo, score: `${fmt1it(r.score)} /10`, onClick: () => setDrawerId(r.e.id) }))}
                  onSeeAll={() => navigate(`/assessment/valore?fascia=${k}`)}
                  seeAllLabel={ui.bandSeeAll}
                  emptyText={ui.bandEmpty}
                />
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <p className="text-app-small text-muted-foreground">{ui.panoEmptySub}</p>
          </Card>
        )}
      </section>

      {/* L'andamento a tutta riga: linee pulite, senza riempimento né sfumature. */}
      <section>
        <PageHeader title={ui.panoTrendTitle} description={ui.panoTrendSub} actions={<SeeMore to="/assessment/valore">{ui.panoDistLink}</SeeMore>} />
        <ChartCard
          title={ui.panoTrendTitle}
          description={trendPoints.length >= 2 ? `${monthLabel(trendPoints[0].date)} — ${monthLabel(trendPoints[trendPoints.length - 1].date)}` : undefined}
          height="lg"
          empty={trendPoints.length >= 2 ? undefined : { title: ui.panoTrendEmpty, description: ui.panoTrendEmptySub }}
        >
          <TrendChart
            title={ui.panoTrendTitle}
            scale={{ left: [0, 10] }}
            height="lg"
            format={fmt1it}
            series={trendSeries}
            points={trendPoints.map((t) => ({ date: t.date, label: monthLabel(t.date), values: { soft: t.soft, hard: t.hard, bench: hs.benchmark } }))}
          />
        </ChartCard>
      </section>

      <section>
        <PageHeader
          title={ui.panoWhereTitle}
          description={ui.panoGapSub(fmt1it(hs.benchmark))}
          actions={
            <Button type="button" variant="ghost" size="sm" onClick={() => exportValoreReport(state, lang, ui)}>
              <Download aria-hidden="true" />
              {ui.panoExportReport}
            </Button>
          }
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[
            { title: ui.panoGapAreasTitle, rows: gapAreas },
            { title: ui.panoGapRolesTitle, rows: gapRoles },
          ].map((c) => (
            <ChartCard
              key={c.title}
              title={c.title}
              height="md"
              empty={!total ? { title: ui.panoEmptyTitle, description: ui.panoEmptySub } : c.rows.length ? undefined : { title: ui.panoGapNone }}
              footer={<SeeMore to={`/assessment/${competenze}`}>{ui.panoGapLink}</SeeMore>}
            >
              <CategoryBars
                title={c.title}
                orientation="horizontal"
                valueMax={Math.max(2, Math.ceil(Math.max(...c.rows.map((r) => r.gap), 0)))}
                format={fmt1it}
                height="sm"
                className="h-full"
                series={[{ key: 'gap', label: ui.f3GapSeries }]}
                rows={c.rows.map((r) => ({ label: r.label, values: { gap: r.gap } }))}
              />
            </ChartCard>
          ))}
        </div>
      </section>

      {drawerId && <EmployeeDrawer employeeId={drawerId} onClose={() => setDrawerId(null)} />}
    </div>
  )
}

const avgOf = (vals: (number | null)[]): number | null => {
  const v = vals.filter((x): x is number => x != null)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}
const monthLabel = (d: Date) => d.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })

function SeeMore({ to, children }: { to: string; children: string }) {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link to={to}>
        {children}
        <ArrowRight />
      </Link>
    </Button>
  )
}

// Il piano d'azione in CSV (era "Esporta Piano d'Azione" della vecchia Home):
// stesse quattro righe, stesse colonne, stesso nome del file.
function exportActionPlan(state: AssessmentState, lang: AssessmentLang, ui: UI) {
  const hs = homeStats(state, lang)
  const f = { A: state.settings.modulo === 'A' || state.settings.modulo === 'AB', B: state.settings.modulo === 'B' || state.settings.modulo === 'AB' }
  const worstSkill = worstCompetenza(state, lang, f)
  const worstSkillLabel = worstSkill ? worstSkill.name : ui.worstSkillFallback
  const rows = [
    [ui.azioniTraining, ui.azioniTrainingDesc(worstSkillLabel), hs.tiers.sviluppo.length],
    [ui.azioniCoaching, ui.azioniCoachingDesc, hs.tiers.valorizzare.length],
    [ui.azioniReorgFull, ui.azioniReorgDesc, hs.tiers.critica.length],
    [ui.azioniTalentFull, ui.azioniTalentDesc, hs.tiers.top.length],
  ]
  let csv = ui.exportPlanCsvHeader + '\n'
  rows.forEach((r) => {
    csv += r.join(';') + '\n'
  })
  downloadText('action_plan.csv', csv, CSV_TYPE)
}

// Il report del valore in CSV (era "Esporta Report" della vecchia Home): stesse
// colonne e stesso nome del file. Il punteggio complessivo è su 10, come a
// schermo (prima era una percentuale, "60%").
function exportValoreReport(state: AssessmentState, lang: AssessmentLang, ui: UI) {
  const hs = homeStats(state, lang)
  const roleCovPct = roleCoveragePct(state, lang)
  let csv = ui.exportValoreCsvHeader + '\n'
  csv += [fmt1it(hs.orgAvg) + '/10', fmt1it(hs.benchmark), roleCovPct + '%', state.employees.length].join(';') + '\n\n'
  csv += ui.exportValoreCsvEmployeeHeader + '\n'
  state.employees.forEach((e) => {
    csv += [e.cognome, e.nome, e.ruolo, e.area, fmt1csv(primaryScore(e, state, lang))].join(';') + '\n'
  })
  downloadText('report_valore.csv', csv, CSV_TYPE)
}
