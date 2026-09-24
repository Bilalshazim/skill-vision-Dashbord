import { AlertTriangle, Award, ArrowUpRight, GraduationCap, Gem, TrendingUp, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { CrossModuleBanner } from '@/components/CrossModuleBanner'
import { lastSixMonthLabels, OrgScoreTrendChart } from '@/modules/assessment/components/OrgScoreTrendChart'
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
  const statusTier = hs.orgAvg >= hs.benchmark ? { variant: 'success' } : hs.orgAvg >= hs.benchmark - 1 ? { variant: 'warning' } : { variant: 'danger' }

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

      <div className="home-hero">
        {/* Q1 — Il Valore: matches the concept exactly (correction pass) —
            two stat tiles, one headline %, one benchmark caption, 3
            buttons. No description line, no progress bar, no RGB band —
            none of those are in the concept. */}
        <div className="quad">
          <div className="blur-decor" style={{ background: 'var(--success-soft)' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span className="home-card-icon">
                  <Gem />
                </span>
                <div>
                  <h3 className="home-card-title">{ui.homeQ1Title}</h3>
                  <div className="home-card-kicker">{ui.homeQ1Kicker}</div>
                </div>
              </div>
              <span className={`chip chip-${statusTier.variant === 'success' ? 'green' : statusTier.variant === 'warning' ? 'amber' : 'red'}`}>{ui.homeQ1DeltaChip(`${avgGapPct > 0 ? '+' : ''}${fmt1it(avgGapPct)}%`)}</span>
            </div>

            <div className="grid grid-2" style={{ gap: 10, margin: '14px 0' }}>
              <div className="neu-tile" style={{ textAlign: 'center' }}>
                <div className="card-eyebrow">{ui.homeQ1EvaluatedPeople}</div>
                <div className="kpi-value" style={{ fontSize: 23 }}>
                  {totalEmp}
                </div>
              </div>
              <div className="neu-tile" style={{ textAlign: 'center' }}>
                <div className="card-eyebrow">{ui.homeQ1Coverage}</div>
                <div className="kpi-value" style={{ fontSize: 23 }}>
                  {roleCovPct}%
                </div>
              </div>
            </div>

            <div className="kpi-value" style={{ fontSize: 40 }}>
              {overallPct}%
            </div>
            <div className="small-note" style={{ fontWeight: 700, marginTop: 10, marginBottom: 14 }}>
              {ui.homeQ1LevelCaption(fmt1it(hs.benchmark), `${avgGap > 0 ? '+' : ''}${fmt1it(avgGap)}`)}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate(`/assessment/${detailPage}`)}>
                {ui.homeQ1ViewDetails}
              </button>
              <button type="button" className="btn btn-sm" onClick={() => navigate(`/assessment/${detailPage === 'soft-risultati' ? 'soft' : 'hard'}?view=area`)}>
                {ui.homeQ1CompareAreas}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => exportValoreReport(state, lang, ui)}>
                {ui.homeQ1ExportReport}
              </button>
            </div>
          </div>
        </div>


        {/* Q3 — Il Capitale Umano: matches the concept exactly (correction
            pass) — 3 tiles (Top Talent/Da Valorizzare/Critica), a
            top-right "Vedi analisi" link, and the stacked bar with a full
            5-tier inline legend. No description line, no chip tag, no
            reconciliation note, no bottom link — none are in the concept. */}
        <div className="quad">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className="home-card-icon">
                <Users />
              </span>
              <h3 className="home-card-title" style={{ margin: 0 }}>
                {ui.homeQ3Title}
              </h3>
            </div>
            <a
              className="linklike"
              style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}
              onClick={(e) => {
                e.stopPropagation()
                navigate('/assessment/valore')
              }}
            >
              {ui.homeQ3ViewAnalysis} <ArrowUpRight size={14} />
            </a>
          </div>
          <div className="small-note" style={{ marginTop: 2, marginBottom: 14 }}>
            {totalEmp} {ui.homeQ3PeopleUnit} · {ui.homeQ3UpdatedNow}
          </div>
          <div className="grid grid-3" style={{ gap: 10 }}>
            {quadDefs(ui)
              .filter((q) => q.key === 'top' || q.key === 'valorizzare' || q.key === 'critica')
              .map((q) => {
                const count = tiers[q.key].length
                const colorVar = q.variant === 'accent' ? 'accent-dark' : q.variant
                return (
                  <div key={q.key} className="neu-tile" style={{ textAlign: 'center' }}>
                    <div className="card-eyebrow">{q.label}</div>
                    <div className="kpi-value" style={{ fontSize: 23, color: `var(--${colorVar})` }}>
                      {count}
                    </div>
                  </div>
                )
              })}
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="small-note" style={{ fontWeight: 700, marginBottom: 6 }}>
              {ui.homeQ3DistributionLabel}
            </div>
            <div className="pbar" style={{ height: 10, display: 'flex' }}>
              {quadDefs(ui).map((q) => {
                const count = tiers[q.key].length
                const colorVar = q.variant === 'accent' ? 'accent-dark' : q.variant === 'neutral' ? 'text-2' : q.variant
                const pct = totalEmp ? (count / totalEmp) * 100 : 0
                return pct ? <i key={q.key} style={{ width: `${pct}%`, background: `var(--${colorVar})` }} /> : null
              })}
            </div>
            <div className="small-note" style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {quadDefs(ui).map((q) => {
                const count = tiers[q.key].length
                const pct = totalEmp ? Math.round((count / totalEmp) * 100) : 0
                return (
                  <span key={q.key}>
                    {pct}% {q.label}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Correction pass: matches the concept's second row exactly — the
          trend chart (left, wider) paired with Le Decisioni (right),
          instead of Le Decisioni living inside the 4-quad hero grid. The
          bottom KPI row and Module A totalizer are removed entirely per
          the concept (confirmed with the user) — their real numbers
          still surface elsewhere (Le Decisioni's own counts, the
          cross-module banner, Il Capitale Umano's tiles). */}
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 18 }}>
        <div className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div className="card-title-row" style={{ alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div className="card-title">{ui.homeOrgTrendTitle}</div>
              <div className="small-note" style={{ marginTop: 2 }}>
                {ui.homeOrgTrendSub(fmt1it(hs.benchmark))} · <strong style={{ color: 'var(--text-1)' }}>{fmt1it(trendLast)}/10</strong>{' '}
                <span style={{ color: `var(--${trendDeltaTone})`, fontWeight: 700 }}>
                  {trendDeltaArrow} {trendDelta > 0 ? '+' : ''}
                  {fmt1it(trendDelta)} · {trendDeltaPct > 0 ? '+' : ''}
                  {fmt1it(trendDeltaPct)}%
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
              <div className="segmented">
                <button className={trendMode === 'media' ? 'active' : ''} onClick={() => setTrendMode('media')}>
                  {ui.homeOrgTrendModeAvg}
                </button>
                <button className={trendMode === 'benchmark' ? 'active' : ''} onClick={() => setTrendMode('benchmark')}>
                  {ui.homeOrgTrendModeBenchmark}
                </button>
              </div>
              <span className="small-note" style={{ fontSize: 10.5, whiteSpace: 'nowrap' }}>{trendMonths[0]} — {trendMonths[trendMonths.length - 1]}</span>
            </div>
          </div>
          <div style={{ position: 'relative', flex: 1, minHeight: 220, marginTop: 8 }}>
            <OrgScoreTrendChart months={trendMonths} series={orgTrendSeries} benchmark={hs.benchmark} />
          </div>
        </div>

        <div className="quad" style={{ minHeight: 0 }}>
          <div>
            <h3 className="home-card-title">{ui.homeQ4Title}</h3>
            <div className="home-card-kicker">{ui.homeQ4PrioritiesKicker}</div>
          </div>
          <div className="segmented" style={{ margin: '12px 0' }}>
            <button className={decisioniTab === 'tutte' ? 'active' : ''} onClick={() => setDecisioniTab('tutte')}>
              {ui.homeQ4TabAll}
            </button>
            <button className={decisioniTab === 'urgenti' ? 'active' : ''} onClick={() => setDecisioniTab('urgenti')}>
              {ui.homeQ4TabUrgent}
            </button>
            <button className={decisioniTab === 'completate' ? 'active' : ''} onClick={() => setDecisioniTab('completate')}>
              {ui.homeQ4TabCompleted}
            </button>
          </div>
          {decisioniTab === 'completate' ? (
            <div className="small-note" style={{ padding: '10px 0' }}>
              {ui.homeQ4NoCompleted}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(decisioniTab === 'urgenti' ? azioni.filter((a) => a.variant === 'danger') : azioni).map((a) => {
                const colorVar = a.variant === 'accent' ? 'accent-dark' : a.variant
                return (
                  <div key={a.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        flexShrink: 0,
                        background: `var(--${colorVar}-soft)`,
                        color: `var(--${colorVar})`,
                      }}
                    >
                      <a.Icon size={15} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{a.label}</div>
                      <textarea
                        className="small-note action-note-input"
                        rows={1}
                        readOnly={!canEdit}
                        value={state.settings.actionNotes?.[a.key] ?? a.desc}
                        onChange={(e) => saveActionNote(a.key, e.target.value)}
                      />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: `var(--${colorVar})`, flexShrink: 0 }}>
                      {a.count} {ui.homeQ4PeopleUnit}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ textAlign: 'right', marginTop: 10 }}>
            <a className="linklike" style={{ fontSize: 11.5 }} onClick={() => exportActionPlan(state, lang, ui)}>
              {ui.homeQ4Export}
            </a>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 4, marginTop: 10 }}
            onClick={() => navigate('/assessment/feedback')}
          >
            {ui.homeQ4ViewAll} <ArrowUpRight size={14} />
          </button>
        </div>
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

