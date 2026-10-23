import { ArrowRight, Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { ActionList, type ActionItem } from '@/components/patterns/ActionList'
import { CategoryBars } from '@/components/patterns/CategoryBars'
import { ChartCard } from '@/components/patterns/ChartCard'
import { DistributionBar } from '@/components/patterns/DistributionBar'
import { PageHeader } from '@/components/patterns/PageHeader'
import { StatCard } from '@/components/patterns/StatCard'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CSV_TYPE, downloadText } from '@/lib/download'
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
  primaryScore,
  roleCoveragePct,
  worstCompetenza,
} from '@/modules/assessment/lib/calculations'
import { fmt1csv, fmt1it, round1 } from '@/modules/assessment/lib/legacy-utils'
import type { AssessmentLang, getUI } from '@/modules/assessment/lib/legacy-utils'
import { TIER_DIST_TONE, TIER_ORDER, tierLabels } from '@/modules/assessment/lib/tier-display'
import type { AssessmentState } from '@/modules/assessment/lib/types'

type UI = ReturnType<typeof getUI>

const signed = (n: number) => `${n > 0 ? '+' : ''}${fmt1it(n)}`

// La Panoramica di Assessment (CLAUDE.md, Fase 6, deciso il 2026-10-23):
// sostituisce la Home a folder card. Tutto visibile all'apertura, testo a
// sinistra, superfici neutre, ogni numero una volta con un'unità sola (il
// punteggio su 10, i conteggi in persone, le quote in percentuale). Dall'alto:
// intestazione (titolo e riga dal layout, scelta CT / CP / Completo nelle
// azioni), Stato attuale, Da fare adesso, Dove guardare. "In programma" non
// c'è: Assessment non ha date future (Piani di sviluppo non ha scadenze), e
// un calendario non si inventa. La Panoramica riassume e rimanda: le analisi
// complete restano nelle loro pagine. Solo dati che l'applicazione ha già.
export default function AssessmentPanoramicaPage() {
  const { state, setState, lang, ui, canEdit, company } = useAssessment()
  const { state: s5 } = use5pState()

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
  const roleCovPct = roleCoveragePct(state, lang)
  const gap = round1(hs.orgAvg - hs.benchmark)
  const critical = hs.tiers.critica.length
  const criticalPct = total ? Math.round((critical / total) * 100) : 0

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

  // Dove guardare: aree e mansioni sotto il benchmark, dalla più lontana.
  const [gapView, setGapView] = useState<'aree' | 'mansioni'>('aree')
  const gapRows = useMemo(() => {
    const list = gapView === 'aree' ? orgCriticalAreas(state, lang, 6).map((a) => ({ label: a.area, avg: a.avg })) : orgCriticalRoles(state, lang, 6).map((r) => ({ label: r.ruolo, avg: r.avg }))
    return list
      .map((r) => ({ label: r.label, gap: round1(hs.benchmark - r.avg) }))
      .filter((r) => r.gap > 0.05)
      .sort((a, b) => b.gap - a.gap)
  }, [state, lang, gapView, hs.benchmark])
  const competenze = both ? (computeAvgMetric(state, lang, 'soft') <= computeAvgMetric(state, lang, 'hard') ? 'soft-overview' : 'hard-overview') : f.A ? 'soft-overview' : 'hard-overview'

  return (
    <div className="flex flex-col gap-8">
      <section>
        <PageHeader title={ui.panoStatusTitle} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {evaluated ? (
            <StatCard label={ui.panoScore} value={fmt1it(hs.orgAvg)} unit="/10" note={ui.panoScoreNote(fmt1it(hs.benchmark), signed(gap))} />
          ) : (
            <StatCard label={ui.panoScore} valueKind="text" value={ui.panoScorePending} note={ui.panoScorePendingNote} />
          )}
          <StatCard label={ui.panoCoverage} value={roleCovPct} unit="%" note={ui.panoCoverageNote} />
          <StatCard label={ui.panoEvaluated} value={evaluated} unit={people} note={ui.panoEvaluatedNote(total)} />
          <StatCard label={ui.panoCritical} value={critical} unit={people} tone={critical ? 'destructive' : 'neutral'} note={ui.panoCriticalNote(labels.critica, criticalPct)} />
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

      <section>
        <PageHeader
          title={ui.panoWhereTitle}
          description={ui.panoWhereSub}
          actions={
            <Button type="button" variant="ghost" size="sm" onClick={() => exportValoreReport(state, lang, ui)}>
              <Download aria-hidden="true" />
              {ui.panoExportReport}
            </Button>
          }
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard
            title={ui.panoDistTitle}
            description={ui.panoDistSub(total)}
            height="auto"
            empty={total ? undefined : { title: ui.panoEmptyTitle, description: ui.panoEmptySub }}
            footer={<SeeMore to="/assessment/valore">{ui.panoDistLink}</SeeMore>}
          >
            <DistributionBar
              segments={TIER_ORDER.map((k) => ({
                key: k,
                label: labels[k],
                pct: total ? (hs.tiers[k].length / total) * 100 : 0,
                tone: TIER_DIST_TONE[k],
                display: `${hs.tiers[k].length} · ${total ? Math.round((hs.tiers[k].length / total) * 100) : 0}%`,
              }))}
            />
          </ChartCard>
          <ChartCard
            title={ui.panoGapTitle}
            description={ui.panoGapSub(fmt1it(hs.benchmark))}
            height="md"
            actions={
              <ToggleGroup type="single" value={gapView} onValueChange={(v) => v && setGapView(v as typeof gapView)} aria-label={ui.panoGapTitle}>
                <ToggleGroupItem value="aree">{ui.panoGapAreas}</ToggleGroupItem>
                <ToggleGroupItem value="mansioni">{ui.panoGapRoles}</ToggleGroupItem>
              </ToggleGroup>
            }
            empty={!total ? { title: ui.panoEmptyTitle, description: ui.panoEmptySub } : gapRows.length ? undefined : { title: ui.panoGapNone }}
            footer={<SeeMore to={`/assessment/${competenze}`}>{ui.panoGapLink}</SeeMore>}
          >
            <CategoryBars
              title={ui.panoGapTitle}
              orientation="horizontal"
              valueMax={Math.max(2, Math.ceil(Math.max(...gapRows.map((r) => r.gap), 0)))}
              format={fmt1it}
              height="sm"
              className="h-full"
              series={[{ key: 'gap', label: ui.f3GapSeries }]}
              rows={gapRows.map((r) => ({ label: r.label, values: { gap: r.gap } }))}
            />
          </ChartCard>
        </div>
      </section>

    </div>
  )
}

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
