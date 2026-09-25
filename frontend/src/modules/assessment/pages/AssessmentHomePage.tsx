import { ChartLineUp, ListChecks, UsersThree } from '@phosphor-icons/react'
import { AlertTriangle, Award, ArrowUpRight, GraduationCap, Sparkles, TrendingUp, UserX } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { CrossModuleBanner } from '@/components/CrossModuleBanner'
import { lastSixMonthLabels, OrgScoreTrendChart } from '@/modules/assessment/components/OrgScoreTrendChart'
import { FolderCard, FolderPill } from '@/modules/assessment/components/FolderCard'
import { SkillVisionCard } from '@/modules/assessment/components/SkillVisionCard'
import { ToneTile } from '@/modules/assessment/components/ToneTile'
import type { TileTone } from '@/modules/assessment/components/ToneTile'
import { ValoreCard } from '@/modules/assessment/components/ValoreCard'
import { useAssessment, useTopbarActions } from '@/modules/assessment/lib/AssessmentContext'
import {
  bothActive,
  computeAvgMetric,
  homeStats,
  orgCriticalAreas,
  orgCriticalRoles,
  primaryScore,
  quadDefs,
  roleCoveragePct,
  worstCompetenza,
} from '@/modules/assessment/lib/calculations'
import { fmt1, fmt1it, round1 } from '@/modules/assessment/lib/legacy-utils'
import type { AssessmentLang } from '@/modules/assessment/lib/legacy-utils'
import type { getUI } from '@/modules/assessment/lib/legacy-utils'
import type { AssessmentState } from '@/modules/assessment/lib/types'

// Migrated from renderHome() (js/assessment.js ~4464-4726) — same 4 KPI
// quadrants (Q1 status / Q2 problem areas / Q3 talent classification / Q4
// priority actions), same module A/B merge-diagram toggle, same bottom KPI
// row + Module A totalizer. Collapse/expand accordion state is real React
// state now instead of the DOM class toggle toggleHomeCard() used.
export default function AssessmentHomePage() {
  const { state, setState, lang, ui, canEdit } = useAssessment()
  const navigate = useNavigate()

  const hs = homeStats(state, lang)
  const f = { A: state.settings.modulo === 'A' || state.settings.modulo === 'AB', B: state.settings.modulo === 'B' || state.settings.modulo === 'AB' }
  const totalEmp = state.employees.length
  const both = bothActive(state)

  // Concept correction pass: the Modulo A/B/Completo toggle now lives in
  // the topbar (next to "Sistema Attivo"), matching the concept's single
  // header row — no more separate circle-diagram card below the title.
  // setModuleExclusive is a hoisted function declaration (defined further
  // down), so it's safely callable here despite the textual order.
  useTopbarActions(
    <>
      <div className="segmented">
        <button className={!both && f.A ? 'active' : ''} onClick={() => setModuleExclusive('A')}>
          {ui.homeModuleALabel}
        </button>
        <button className={!both && f.B ? 'active' : ''} onClick={() => setModuleExclusive('B')}>
          {ui.homeModuleBLabel}
        </button>
        <button className={both ? 'active' : ''} onClick={() => setModuleExclusive('AB')}>
          {ui.homeModuleCompleteLabel}
        </button>
      </div>
      <span className="chip chip-green" style={{ gap: 7 }}>
        <span className="pulse-dot" />
        {ui.homeSystemActive}
      </span>
    </>,
    [ui, both, f.A, f.B],
  )

  // Phase 3: no real monthly history exists anywhere in demo-data.ts, so
  // this is the same "illustrative walk anchored to today's real number"
  // treatment as AssessmentCustomerCarePage.tsx's customerCareModel()
  // trend — the last point is always exactly the live hs.orgAvg, the 5
  // before it are a deterministic seeded walk backward from it.
  const orgTrendSeries = buildOrgTrendSeries(hs.orgAvg)
  const trendMonths = lastSixMonthLabels()
  const [trendMode, setTrendMode] = useState<'media' | 'benchmark'>('media')
  const trendLast = orgTrendSeries[orgTrendSeries.length - 1]
  const trendPrev = orgTrendSeries[orgTrendSeries.length - 2] ?? trendLast
  const trendDeltaVsPrev = round1(trendLast - trendPrev)
  const trendDeltaVsBenchmark = round1(trendLast - hs.benchmark)
  const trendDelta = trendMode === 'benchmark' ? trendDeltaVsBenchmark : trendDeltaVsPrev
  const trendDeltaBase = trendMode === 'benchmark' ? hs.benchmark : trendPrev
  const trendDeltaPct = trendDeltaBase ? round1((trendDelta / trendDeltaBase) * 100) : 0
  const trendDeltaTone = Math.abs(trendDelta) < 0.05 ? 'text-3' : trendDelta > 0 ? 'success' : 'danger'
  const trendDeltaArrow = Math.abs(trendDelta) < 0.05 ? '→' : trendDelta > 0 ? '▲' : '▼'

  const overallPct = Math.round((hs.orgAvg / 10) * 100)
  const roleCovPct = roleCoveragePct(state, lang)
  const avgGap = round1(hs.orgAvg - hs.benchmark)
  const avgGapPct = hs.benchmark ? round1(((hs.orgAvg - hs.benchmark) / hs.benchmark) * 100) : 0
  // Share of the workforce in the "Da Valorizzare" tier — used by the
  // cross-module banner's "Da Valorizzare" stat.
  const gPct = totalEmp ? Math.round((hs.valueCount / totalEmp) * 100) : 0
  // Il Valore breakdown — same exhaustive tier union homeStats() documents:
  // Ottimale = top + valorizzare, Moderato = adeguata, Critico = the rest
  // (sviluppo + critica), so the three always sum to 100.
  const ottimalePct = gPct
  const moderatoPct = totalEmp ? Math.round((hs.nellaNormaCount / totalEmp) * 100) : 0
  const valoreBreakdown = { ottimale: ottimalePct, moderato: moderatoPct, critico: totalEmp ? 100 - ottimalePct - moderatoPct : 0 }

  const worstArea = orgCriticalAreas(state, lang, 1)[0]
  // Cross-module banner stat: a real count of roles below benchmark, not
  // just the top-1 "worst role" above — orgCriticalRoles(n) always returns
  // its top n regardless of severity, so getting every role and filtering
  // by the same benchmark used everywhere else on this page is what makes
  // this an honest "at risk" count instead of a fixed top-3.
  const rolesAtRiskCount = orgCriticalRoles(state, lang, Number.MAX_SAFE_INTEGER).filter((r) => r.avg < hs.benchmark).length
  const pendingEvalsCount = state.evalAssignments.filter((a) => a.status === 'pending').length
  const worstSkill = worstCompetenza(state, lang, f)
  // Bug fix: this used to always land on 'valore' ("Valori Complessivi")
  // when both modules were active — a different screen entirely (overall
  // individual value, not an organizational problem breakdown), so "Vedi
  // Analisi Dettagliata" never actually showed the detailed analysis of
  // the critical area this card itself just computed. Now routes to
  // whichever domain's results page (soft/hard) is the more critical one —
  // the lower of the two average metrics — or the single active module's
  // results page when only one is active.
  const softAvgForDetail = computeAvgMetric(state, lang, 'soft')
  const hardAvgForDetail = computeAvgMetric(state, lang, 'hard')
  const detailPage = both ? (softAvgForDetail <= hardAvgForDetail ? 'soft-risultati' : 'hard-risultati') : f.A ? 'soft-risultati' : 'hard-risultati'

  const tiers = hs.tiers
  const azioni = [
    { key: 'training', label: ui.azioniTraining, desc: ui.azioniTrainingDesc(worstSkill ? worstSkill.name : ui.worstSkillFallback), count: tiers.sviluppo.length, variant: 'warning', Icon: GraduationCap },
    { key: 'coaching', label: ui.azioniCoaching, desc: ui.azioniCoachingDesc, count: tiers.valorizzare.length, variant: 'success', Icon: TrendingUp },
    { key: 'reorg', label: ui.azioniReorgShort, desc: ui.azioniReorgDesc, count: tiers.critica.length, variant: 'danger', Icon: AlertTriangle },
    { key: 'talent', label: ui.azioniTalentShort, desc: ui.azioniTalentDesc, count: tiers.top.length, variant: 'accent', Icon: Award },
  ] as const

  function setModuleExclusive(mode: 'A' | 'B' | 'AB') {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, modulo: mode } }))
  }

  function saveActionNote(key: string, value: string) {
    if (!canEdit) return
    setState((prev) => ({ ...prev, settings: { ...prev.settings, actionNotes: { ...prev.settings.actionNotes, [key]: value } } }))
  }

  // Phase 4: Le Decisioni tab filter. "Completate" has no real source —
  // no action/note carries a completion flag anywhere in AssessmentState —
  // so it ships as an honest empty state rather than a fabricated count.
  const [decisioniTab, setDecisioniTab] = useState<'tutte' | 'urgenti' | 'completate'>('tutte')

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>{ui.homeStatusTitle}</h2>
          <p>{ui.homeStatusSub}</p>
        </div>
      </div>

      <div className="home-grid">
        <ValoreCard
          ui={ui}
          overallPct={overallPct}
          roleCovPct={roleCovPct}
          benchmark={hs.benchmark}
          avgGap={avgGap}
          avgGapPct={avgGapPct}
          breakdown={valoreBreakdown}
          actions={
            <>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate(`/assessment/${detailPage}`)}>
                {ui.homeQ1ViewDetails}
              </button>
              <button type="button" className="btn btn-sm" onClick={() => navigate(`/assessment/${detailPage === 'soft-risultati' ? 'soft' : 'hard'}?view=area`)}>
                {ui.homeQ1CompareAreas}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => exportValoreReport(state, lang, ui)}>
                {ui.homeQ1ExportReport}
              </button>
            </>
          }
        />

        {/* Q3 — Il Capitale Umano, same pattern as Il Valore: the card
            alone on "oggi"; "Skill Vision" opens the 3 tier tiles (Alto
            Potenziale / Alto Valore / Critici) and the 5-tier distribution. */}
        <SkillVisionCard
          storageKey="sv-assessment-home-capitale-view"
          tone="capitale"
          Icon={UsersThree}
          title={ui.homeQ3Title}
          kicker={ui.homeQ3Kicker}
          panelClassName="sv-panel-stack"
          body={() => <p className="sv-question">{ui.homeQ3ExpandQuestion}</p>}
          actions={
            <button type="button" className="btn btn-sm" onClick={() => navigate('/assessment/valore')}>
              {ui.homeQ3ViewAnalysis} <ArrowUpRight size={14} />
            </button>
          }
          panel={
            <>
              <div className="folder-tiles-3">
                {quadDefs(ui)
                  .filter((q) => q.key === 'valorizzare' || q.key === 'top' || q.key === 'critica')
                  .map((q) => {
                    const count = tiers[q.key].length
                    const pct = totalEmp ? Math.round((count / totalEmp) * 100) : 0
                    return <ToneTile key={q.key} tone={TIER_TILE[q.key].tone} Icon={TIER_TILE[q.key].Icon} label={q.label} value={count} sub={`${pct}%`} pct={pct} />
                  })}
              </div>
              <div className="folder-dist sv-panel-box">
                <div className="folder-dist-label">{ui.homeQ3DistributionLabel}</div>
                <div className="folder-dist-bar">
                  {quadDefs(ui).map((q) => {
                    const pct = totalEmp ? (tiers[q.key].length / totalEmp) * 100 : 0
                    return pct ? <i key={q.key} className={`dist-${q.key}`} style={{ width: `${pct}%` }} /> : null
                  })}
                </div>
                <div className="folder-dist-legend">
                  {quadDefs(ui).map((q) => {
                    const pct = totalEmp ? Math.round((tiers[q.key].length / totalEmp) * 100) : 0
                    return (
                      <span key={q.key}>
                        <i className={`dist-${q.key}`} aria-hidden="true" />
                        {pct}% {q.label}
                      </span>
                    )
                  })}
                </div>
              </div>
            </>
          }
        />

        {/* Andamento: org score trend vs benchmark. The last point is the
            live org average; see buildOrgTrendSeries(). */}
        <FolderCard
          tone="andamento"
          Icon={ChartLineUp}
          title={ui.homeOrgTrendTitle}
          kicker={ui.homeOrgTrendSub(fmt1it(hs.benchmark))}
        >
          <div className="folder-trend-head">
            <span className="folder-trend-value">{fmt1it(trendLast)}/10</span>
            <span className={`folder-trend-delta tone-tile-${trendDeltaTone === 'success' ? 'green' : trendDeltaTone === 'danger' ? 'red' : 'yellow'}`}>
              {trendDeltaArrow} {trendDelta > 0 ? '+' : ''}
              {fmt1it(trendDelta)} · {trendDeltaPct > 0 ? '+' : ''}
              {fmt1it(trendDeltaPct)}%
            </span>
            <span className="folder-trend-period">
              {trendMonths[0]} — {trendMonths[trendMonths.length - 1]}
            </span>
            <div className="folder-pill-row folder-pill-row-inline" role="group" aria-label={ui.homeOrgTrendTitle}>
              <FolderPill active={trendMode === 'media'} onClick={() => setTrendMode('media')}>
                {ui.homeOrgTrendModeAvg}
              </FolderPill>
              <FolderPill active={trendMode === 'benchmark'} onClick={() => setTrendMode('benchmark')}>
                {ui.homeOrgTrendModeBenchmark}
              </FolderPill>
            </div>
          </div>
          <div className="folder-chart">
            <OrgScoreTrendChart months={trendMonths} series={orgTrendSeries} benchmark={hs.benchmark} colorVar="--fc-accent" />
          </div>
        </FolderCard>

        <FolderCard tone="decisioni" Icon={ListChecks} title={ui.homeQ4Title} kicker={ui.homeQ4PrioritiesKicker}>
          <div className="folder-pill-row" role="group" aria-label={ui.homeQ4Title}>
            <FolderPill active={decisioniTab === 'tutte'} onClick={() => setDecisioniTab('tutte')}>
              {ui.homeQ4TabAll}
            </FolderPill>
            <FolderPill active={decisioniTab === 'urgenti'} onClick={() => setDecisioniTab('urgenti')}>
              {ui.homeQ4TabUrgent}
            </FolderPill>
            <FolderPill active={decisioniTab === 'completate'} onClick={() => setDecisioniTab('completate')}>
              {ui.homeQ4TabCompleted}
            </FolderPill>
          </div>
          {decisioniTab === 'completate' ? (
            <div className="small-note" style={{ padding: '8px 0' }}>
              {ui.homeQ4NoCompleted}
            </div>
          ) : (
            <div className="decision-list">
              {(decisioniTab === 'urgenti' ? azioni.filter((a) => a.variant === 'danger') : azioni).map((a) => (
                <div key={a.key} className={`decision-row tone-tile-${ACTION_TONE[a.variant]}`}>
                  <span className="tone-tile-icon" aria-hidden="true">
                    <a.Icon />
                  </span>
                  <div className="decision-text">
                    <div className="decision-label">{a.label}</div>
                    <textarea
                      className="small-note action-note-input"
                      rows={1}
                      readOnly={!canEdit}
                      value={state.settings.actionNotes?.[a.key] ?? a.desc}
                      onChange={(e) => saveActionNote(a.key, e.target.value)}
                    />
                  </div>
                  <span className="decision-count">
                    {a.count} {ui.homeQ4PeopleUnit}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="folder-actions folder-actions-split">
            <button type="button" className="folder-link" onClick={() => exportActionPlan(state, lang, ui)}>
              {ui.homeQ4Export}
            </button>
            <button type="button" className="btn btn-sm" onClick={() => navigate('/assessment/feedback')}>
              {ui.homeQ4ViewAll} <ArrowUpRight size={14} />
            </button>
          </div>
        </FolderCard>
      </div>

      <CrossModuleBanner
        heading={ui.crossBannerHeading}
        body={ui.crossBannerBody}
        ctaLabel={ui.crossBannerCtaToRecruiting}
        ctaTo="/recruiting"
        secondaryLabel={ui.crossBannerReport}
        onSecondary={() => exportActionPlan(state, lang, ui)}
        stats={[
          { label: ui.crossBannerCriticalArea, value: worstArea ? worstArea.area : '—', sub: worstArea ? ui.crossBannerCriticalAreaSub(fmt1(round1(worstArea.avg - hs.benchmark))) : undefined },
          { label: ui.crossBannerToValorize, value: hs.valueCount, sub: ui.crossBannerToValorizeSub(gPct) },
          { label: ui.crossBannerRolesAtRisk, value: rolesAtRiskCount, sub: ui.crossBannerRolesAtRiskSub(roleCovPct) },
          { label: ui.crossBannerEvalsInProgress, value: pendingEvalsCount, sub: ui.crossBannerEvalsInProgressSub },
        ]}
      />
    </div>
  )
}

// Tile tone + icon for the three Capitale Umano tiers, and the tile tone
// for each Le Decisioni action variant.
const TIER_TILE: Record<'valorizzare' | 'top' | 'critica', { tone: TileTone; Icon: LucideIcon }> = {
  valorizzare: { tone: 'green', Icon: Sparkles },
  top: { tone: 'gold', Icon: Award },
  critica: { tone: 'red', Icon: UserX },
}
const ACTION_TONE: Record<'warning' | 'success' | 'danger' | 'accent', TileTone> = {
  warning: 'yellow',
  success: 'green',
  danger: 'red',
  accent: 'gold',
}

// Same seeded-PRNG shape as AssessmentCustomerCarePage.tsx's seedRandom()
// — deterministic per fixed seed so the trend doesn't reshuffle on every
// render/reload.
function seedRandom(seed: number) {
  let t = seed
  return function () {
    t |= 0
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

// Builds backward from the real live org average so the series always
// ends exactly on today's real number (see orgTrendSeries above) — the 5
// months before it are an illustrative bounded walk, not real history.
function buildOrgTrendSeries(orgAvg: number): number[] {
  const r = seedRandom(20260724)
  const series = [orgAvg]
  for (let i = 0; i < 5; i++) {
    const prev = series[0]
    const next = Math.max(0, Math.min(10, prev - (r() * 0.6 - 0.3)))
    series.unshift(Math.round(next * 10) / 10)
  }
  return series
}

// Ported from exportActionPlan() (js/assessment.js ~4409-4427) — a plain
// client-side CSV Blob download, no backend, same 4 rows/columns and same
// download filename (action_plan.csv).
function exportActionPlan(state: AssessmentState, lang: AssessmentLang, ui: ReturnType<typeof getUI>) {
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
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'action_plan.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// "Esporta Report" on the new always-expanded Il Valore card (Phase 2) —
// same plain CSV Blob pattern as exportActionPlan() above, one row per
// employee with their org-wide value score, feeding the same real numbers
// the card itself shows (overall %, benchmark, role coverage).
function exportValoreReport(state: AssessmentState, lang: AssessmentLang, ui: ReturnType<typeof getUI>) {
  const hs = homeStats(state, lang)
  const roleCovPct = roleCoveragePct(state, lang)
  const overallPct = Math.round((hs.orgAvg / 10) * 100)
  let csv = ui.exportValoreCsvHeader + '\n'
  csv += [overallPct + '%', fmt1it(hs.benchmark), roleCovPct + '%', state.employees.length].join(';') + '\n\n'
  csv += ui.exportValoreCsvEmployeeHeader + '\n'
  state.employees.forEach((e) => {
    csv += [e.cognome, e.nome, e.ruolo, e.area, fmt1(primaryScore(e, state, lang))].join(';') + '\n'
  })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'report_valore.csv'
  a.click()
  URL.revokeObjectURL(url)
}

