import { CheckSquare, Gem, TrendingDown, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { CrossModuleBanner } from '@/components/CrossModuleBanner'
import { Icon } from '@/modules/assessment/components/Icon'
import { OrgScoreTrendChart } from '@/modules/assessment/components/OrgScoreTrendChart'
import { useAssessment, useTopbarActions } from '@/modules/assessment/lib/AssessmentContext'
import {
  areasList,
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

  // Ported from renderHome()'s setTopbarActions() call (js/assessment.js
  // ~4471) — the pulsing "Sistema Attivo" chip was missing entirely here.
  useTopbarActions(
    <span className="chip chip-green" style={{ gap: 7 }}>
      <span className="pulse-dot" />
      {ui.homeSystemActive}
    </span>,
    [ui],
  )

  const hs = homeStats(state, lang)
  const f = { A: state.settings.modulo === 'A' || state.settings.modulo === 'AB', B: state.settings.modulo === 'B' || state.settings.modulo === 'AB' }
  const totalEmp = state.employees.length
  const both = bothActive(state)
  const modeLabel = both ? ui.homeModuleCompleteLabel : f.A ? ui.homeModuleALabel : ui.homeModuleBLabel

  // Phase 3: no real monthly history exists anywhere in demo-data.ts, so
  // this is the same "illustrative walk anchored to today's real number"
  // treatment as AssessmentCustomerCarePage.tsx's customerCareModel()
  // trend — the last point is always exactly the live hs.orgAvg, the 5
  // before it are a deterministic seeded walk backward from it.
  const orgTrendSeries = buildOrgTrendSeries(hs.orgAvg)
  const orgTrendDelta = round1(orgTrendSeries[orgTrendSeries.length - 1] - orgTrendSeries[orgTrendSeries.length - 2])

  const overallPct = Math.round((hs.orgAvg / 10) * 100)
  const roleCovPct = roleCoveragePct(state, lang)
  const avgGap = round1(hs.orgAvg - hs.benchmark)
  // Green/Amber/Red now reads the SAME tier partition as the rest of the
  // page (Talenti / Nella Norma / A Rischio) instead of its own 7/5 cutoff —
  // that old cutoff didn't line up with the tier breakpoints (7.0/5.5), so
  // this band's percentages could disagree with "Talenti"/"A Rischio" counts
  // shown elsewhere on the same screen. Deriving from hs.tiers guarantees
  // green+amber+red always sums to 100% of the same population.
  const gPct = totalEmp ? Math.round((hs.valueCount / totalEmp) * 100) : 0
  const aPct = totalEmp ? Math.round((hs.nellaNormaCount / totalEmp) * 100) : 0
  const rPct = 100 - gPct - aPct
  const statusTier = hs.orgAvg >= hs.benchmark ? { label: ui.statusGood, variant: 'success' } : hs.orgAvg >= hs.benchmark - 1 ? { label: ui.statusModerate, variant: 'warning' } : { label: ui.statusBelow, variant: 'danger' }

  // Lime border is now reserved for the single most urgent tile instead of
  // decorating all 4 uniformly. Each score is that tile's own severity
  // signal normalized to a 0..1 share of the workforce, so the 4 are
  // comparable on one scale despite covering different data: how far the
  // org average sits below benchmark (Q1), the share with a severe gap
  // (Q2), the share in the Critica tier (Q3), the share flagged for a
  // training/reorg action (Q4). Whichever is highest gets the border —
  // this is recomputed from live data, so it moves as the data does.
  const urgencyScores: Record<'q1' | 'q2' | 'q3' | 'q4', number> = {
    q1: hs.benchmark ? Math.max(0, -avgGap) / hs.benchmark : 0,
    q2: totalEmp ? hs.severeGapCount / totalEmp : 0,
    q3: totalEmp ? hs.criticiCount / totalEmp : 0,
    q4: totalEmp ? hs.riskCount / totalEmp : 0,
  }
  const mostUrgentQuad = (['q1', 'q2', 'q3', 'q4'] as const).reduce((best, key) => (urgencyScores[key] > urgencyScores[best] ? key : best))

  const worstArea = orgCriticalAreas(state, lang, 1)[0]
  const worstRole = orgCriticalRoles(state, lang, 1)[0]
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
  const rowDotColor = (gapVal: number) => (gapVal <= -2 ? 'var(--danger)' : gapVal < 0 ? 'var(--warning)' : 'var(--success)')

  const tiers = hs.tiers
  const azioni = [
    { key: 'training', label: ui.azioniTraining, desc: ui.azioniTrainingDesc(worstSkill ? worstSkill.name : ui.worstSkillFallback), count: tiers.sviluppo.length, variant: 'warning' },
    { key: 'coaching', label: ui.azioniCoaching, desc: ui.azioniCoachingDesc, count: tiers.valorizzare.length, variant: 'success' },
    { key: 'reorg', label: ui.azioniReorgShort, desc: ui.azioniReorgDesc, count: tiers.critica.length, variant: 'danger' },
    { key: 'talent', label: ui.azioniTalentShort, desc: ui.azioniTalentDesc, count: tiers.top.length, variant: 'accent' },
  ] as const

  function setModuleExclusive(mode: 'A' | 'B' | 'AB') {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, modulo: mode } }))
  }

  function saveActionNote(key: string, value: string) {
    if (!canEdit) return
    setState((prev) => ({ ...prev, settings: { ...prev.settings, actionNotes: { ...prev.settings.actionNotes, [key]: value } } }))
  }

  const [openCards, setOpenCardsState] = usePersistentAccordion()
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
        <div className="small-note" style={{ textAlign: 'right' }}>
          {ui.homeActiveFilter} <b style={{ color: 'var(--text-1)' }}>{modeLabel}</b>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div className="merge-diagram" style={{ margin: 0, flexShrink: 0 }}>
          <div className={`merge-circle merge-a ${both ? '' : f.A ? 'merge-emphasized' : 'merge-dimmed'}`} onClick={() => setModuleExclusive('A')} title={ui.homeModuleALabel}>
            <span className="n">{fmt1(computeAvgMetric(state, lang, 'soft'))}</span>
            <span>{ui.homeModuleALabel}</span>
          </div>
          <div className="merge-plus" onClick={() => setModuleExclusive('AB')} title={ui.homeModuleCompleteLabel}>
            +
          </div>
          <div className={`merge-circle merge-b ${both ? '' : f.B ? 'merge-emphasized' : 'merge-dimmed'}`} onClick={() => setModuleExclusive('B')} title={ui.homeModuleBLabel}>
            <span className="n">{fmt1(computeAvgMetric(state, lang, 'hard'))}</span>
            <span>{ui.homeModuleBLabel}</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="card-eyebrow">{ui.homeConfigActiveEyebrow}</div>
          <div style={{ fontSize: 16, fontWeight: 800, margin: '2px 0 8px 0' }}>{modeLabel}</div>
          <div className="small-note" style={{ maxWidth: 480 }} dangerouslySetInnerHTML={{ __html: ui.homeSwitchHint }} />
          <div className="segmented" style={{ marginTop: 12 }}>
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
        </div>
      </div>

      {/* Phase 3: a new sibling chart, not a reuse of AndamentoChart's
          Trasversali/Professionali pairing (AssessmentValorePage.tsx) —
          this one plots the single org-wide average against the fixed
          benchmark. */}
      <div className="card" style={{ marginBottom: 18, position: 'relative' }}>
        <div className="card-title-row">
          <div className="card-title">{ui.homeOrgTrendTitle}</div>
        </div>
        <div className="small-note" style={{ marginBottom: 14 }}>{ui.homeOrgTrendSub(fmt1it(hs.benchmark))}</div>
        <div style={{ position: 'absolute', top: 18, right: 20, textAlign: 'right' }}>
          <div className="kpi-value" style={{ fontSize: 22 }}>
            {fmt1it(hs.orgAvg)}
          </div>
          <div className="small-note" style={{ fontSize: 10.5, color: orgTrendDelta < 0 ? 'var(--danger)' : orgTrendDelta > 0 ? 'var(--success)' : 'var(--text-3)' }}>
            {orgTrendDelta > 0 ? '▲' : orgTrendDelta < 0 ? '▼' : '→'} {orgTrendDelta > 0 ? '+' : ''}
            {fmt1it(orgTrendDelta)} {ui.homeOrgTrendDeltaCaption}
          </div>
        </div>
        <div style={{ position: 'relative', height: 220 }}>
          <OrgScoreTrendChart months={ui.homeAndamentoMonths} series={orgTrendSeries} benchmark={hs.benchmark} />
        </div>
      </div>

      <div className="home-hero">
        {/* Q1 — Il Valore: always-expanded per the client concept (Phase 2),
            no more accordion/teaser. The old Score/Coverage/Gap 3-tile grid
            is replaced by the concept's own "Persone Valutate" + "Copertura
            Ruoli" pair + one big headline %; the Green/Yellow/Red band below
            is real, already-computed data the concept doesn't mention
            removing, so it stays. */}
        <div className={`quad${mostUrgentQuad === 'q1' ? ' quad-urgent' : ''}`}>
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
              <span className={`chip chip-${statusTier.variant === 'success' ? 'green' : statusTier.variant === 'warning' ? 'amber' : 'red'}`}>{statusTier.label}</span>
            </div>
            <p className="home-card-desc">{ui.homeQ1Sub}</p>

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
            <div style={{ margin: '10px 0 14px' }}>
              <div className="small-note" style={{ fontWeight: 700, marginBottom: 6 }}>
                {ui.homeQ1LevelCaption(fmt1it(hs.benchmark), `${avgGap > 0 ? '+' : ''}${fmt1it(avgGap)}`)}
              </div>
              <div className="pbar" style={{ height: 10 }}>
                <i style={{ width: `${overallPct}%`, background: 'var(--success)' }} />
              </div>
            </div>

            <div className="grid grid-3" style={{ gap: 8, marginBottom: 14 }}>
              <div className="tinted-tile success" style={{ textAlign: 'center', padding: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--success)' }}>
                  {gPct}% {ui.homeQ1Green}
                </div>
                <div className="small-note" style={{ fontSize: 10, marginTop: 2 }}>
                  {ui.homeQ1GreenSub}
                </div>
              </div>
              <div className="tinted-tile warning" style={{ textAlign: 'center', padding: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--warning)' }}>
                  {aPct}% {ui.homeQ1Yellow}
                </div>
                <div className="small-note" style={{ fontSize: 10, marginTop: 2 }}>
                  {ui.homeQ1YellowSub}
                </div>
              </div>
              <div className="tinted-tile danger" style={{ textAlign: 'center', padding: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--danger)' }}>
                  {rPct}% {ui.homeQ1Red}
                </div>
                <div className="small-note" style={{ fontSize: 10, marginTop: 2 }}>
                  {ui.homeQ1RedSub}
                </div>
              </div>
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

        {/* Q2 */}
        <div className={`quad${mostUrgentQuad === 'q2' ? ' quad-urgent' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span className="home-card-icon">
                <TrendingDown />
              </span>
              <div>
                <h3 className="home-card-title">{ui.homeQ2Title}</h3>
                <div className="home-card-kicker">{ui.homeQ2Kicker}</div>
              </div>
            </div>
            <button type="button" className="home-card-action" onClick={() => setOpenCardsState('q2')}>
              <span className="quad-collapse-hint">{ui.homeQ2ExpandQuestion}</span>
              <span className={`quad-chevron${openCards.q2 ? ' open' : ''}`}>
                <Icon name="chevron" />
              </span>
            </button>
          </div>
          <p className="home-card-desc">{ui.homeQ2Sub}</p>
          <div style={{ marginTop: 14 }}>
            <div className="kpi-value" style={{ fontSize: 28, color: 'var(--danger)' }}>
              {hs.severeGapCount}
            </div>
            <div className="kpi-label">{ui.homeQ2TeaserCompare(totalEmp ? Math.round((hs.severeGapCount / totalEmp) * 100) : 0)}</div>
          </div>
          {worstRole && (
            <div className="small-note" style={{ marginTop: 8 }}>
              {ui.homeQ2TeaserHidden(fmt1(round1(worstRole.avg - hs.benchmark)))}
            </div>
          )}
          <div className={`home-quad-body${openCards.q2 ? ' open' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span className="chip chip-red">{ui.homeQ2CriticalIssues(hs.severeGapCount)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface-alt)' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: worstArea ? rowDotColor(round1(worstArea.avg - hs.benchmark)) : 'var(--text-3)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="small-note">
                    <b>{ui.homeQ2MostCriticalArea}</b>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 12.8, marginTop: 2 }}>{worstArea ? worstArea.area : '—'}</div>
                </div>
                <span className="chip chip-red" style={{ flexShrink: 0 }}>
                  {ui.homeQ2Gap(worstArea ? fmt1(round1(worstArea.avg - hs.benchmark)) : '—')}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface-alt)' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: worstRole ? rowDotColor(round1(worstRole.avg - hs.benchmark)) : 'var(--text-3)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="small-note">
                    <b>{ui.homeQ2RoleAtRisk}</b>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 12.8, marginTop: 2 }}>{worstRole ? worstRole.ruolo : '—'}</div>
                </div>
                <span className="chip chip-red" style={{ flexShrink: 0 }}>
                  {ui.homeQ2Gap(worstRole ? fmt1(round1(worstRole.avg - hs.benchmark)) : '—')}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface-alt)' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: worstSkill ? rowDotColor(worstSkill.gap) : 'var(--text-3)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="small-note">
                    <b>{ui.homeQ2WeakestCompetency}</b>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 12.8, marginTop: 2 }}>{worstSkill ? worstSkill.name : '—'}</div>
                </div>
                <span className="chip chip-red" style={{ flexShrink: 0 }}>
                  {worstSkill ? (worstSkill.gap > 0 ? '+' : '') + fmt1(worstSkill.gap) : '—'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <span className="small-note">
                {ui.homeQ2SevereGapLabel} <b style={{ color: 'var(--text-1)' }}>{ui.homeQ2People(hs.severeGapCount)}</b>
              </span>
              <a className="linklike" style={{ fontSize: 11.5 }} onClick={() => navigate(`/assessment/${detailPage}`)}>
                {ui.homeQ2ViewDetail}
              </a>
            </div>
          </div>
        </div>

        {/* Q3 — Il Capitale Umano: always-expanded per the client concept
            (Phase 2), no more accordion/teaser. The 5-tile TIER_DEFS grid
            (a superset of the concept's 3 requested tiles — Top Talent/Da
            Valorizzare/Critica — that already existed here) stays, since
            it's real data and the reconciliation note below it depends on
            all 5; the concept's new stacked bar is added underneath it. */}
        <div className={`quad${mostUrgentQuad === 'q3' ? ' quad-urgent' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span className="home-card-icon">
                <Users />
              </span>
              <div>
                <h3 className="home-card-title">{ui.homeQ3Title}</h3>
                <div className="home-card-kicker">{ui.homeQ3Kicker}</div>
              </div>
            </div>
            <span className="small-note">
              {totalEmp} · {ui.homeQ3UpdatedNow}
            </span>
          </div>
          <p className="home-card-desc">{ui.homeQ3Sub}</p>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span className="chip chip-gray">{ui.homeQ3ResourceMapping}</span>
            </div>
            <div className="grid grid-2" style={{ gap: 10 }}>
              {quadDefs(ui).map((q) => {
                const count = tiers[q.key].length
                const colorVar = q.variant === 'accent' ? 'accent-dark' : q.variant === 'neutral' ? 'text-2' : q.variant
                return (
                  <div
                    key={q.key}
                    className={`tinted-tile clickable ${q.variant}`}
                    style={q.span ? { gridColumn: '1 / -1' } : undefined}
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: `var(--${colorVar})` }}>{q.label}</span>
                      <span style={{ width: 16, height: 16, color: `var(--${colorVar})` }}>
                        <Icon name={q.icon as never} />
                      </span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)' }}>{count}</div>
                    <div className="small-note" style={{ fontSize: 10.5, marginTop: 2 }}>
                      {q.caption}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 14 }}>
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
            </div>
            {/* Reconciliation line: the 5 tiles above are the full TIER_DEFS
                partition, so this should always read N/N — makes the
                coverage explicit rather than leaving the reader to add up
                4 tiles and wonder where the rest of the population went. */}
            <div className="small-note" style={{ marginTop: 10, textAlign: 'right' }}>
              {ui.homeQ3CoverageNote(quadDefs(ui).reduce((sum, q) => sum + tiers[q.key].length, 0), totalEmp)}
            </div>
            <div style={{ textAlign: 'right', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <a
                className="linklike"
                style={{ fontSize: 11.5 }}
                onClick={(e) => {
                  e.stopPropagation()
                  navigate('/assessment/valore')
                }}
              >
                {ui.homeQ3OpenMatrix}
              </a>
            </div>
          </div>
        </div>

        {/* Q4 */}
        <div className={`quad${mostUrgentQuad === 'q4' ? ' quad-urgent' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span className="home-card-icon">
                <CheckSquare />
              </span>
              <div>
                <h3 className="home-card-title">{ui.homeQ4Title}</h3>
                <div className="home-card-kicker">{ui.homeQ4Kicker}</div>
              </div>
            </div>
            <button type="button" className="home-card-action" onClick={() => setOpenCardsState('q4')}>
              <span className="quad-collapse-hint">{ui.homeQ4ExpandQuestion}</span>
              <span className={`quad-chevron${openCards.q4 ? ' open' : ''}`}>
                <Icon name="chevron" />
              </span>
            </button>
          </div>
          <p className="home-card-desc">{ui.homeQ4Sub}</p>
          <div style={{ marginTop: 14 }}>
            <div className="kpi-value" style={{ fontSize: 28 }}>
              {hs.feedbackDue}
            </div>
            <div className="kpi-label">{ui.homeQ4TeaserCompare(totalEmp)}</div>
          </div>
          {worstSkill && (
            <div className="small-note" style={{ marginTop: 8 }}>
              {ui.homeQ4TeaserHidden((worstSkill.gap > 0 ? '+' : '') + fmt1(worstSkill.gap))}
            </div>
          )}
          <div className={`home-quad-body${openCards.q4 ? ' open' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <span className="chip chip-gray">{ui.homeQ4AiPriorities}</span>
              <div className="segmented" onClick={(e) => e.stopPropagation()}>
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
            </div>
            {decisioniTab === 'completate' ? (
              <div className="small-note" style={{ padding: '10px 12px' }}>
                {ui.homeQ4NoCompleted}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(decisioniTab === 'urgenti' ? azioni.filter((a) => a.variant === 'danger') : azioni).map((a) => (
                  <div key={a.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    <span className={`action-tag ${a.variant}`} style={{ marginTop: 1 }}>
                      {a.label}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <textarea
                        className="small-note action-note-input"
                        rows={1}
                        readOnly={!canEdit}
                        value={state.settings.actionNotes?.[a.key] ?? a.desc}
                        onChange={(e) => saveActionNote(a.key, e.target.value)}
                      />
                    </div>
                    <span className="chip chip-gray" style={{ flexShrink: 0 }}>
                      {a.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <span className="small-note">{ui.homeQ4RealTime}</span>
              <a
                className="linklike"
                style={{ fontSize: 11.5 }}
                onClick={(e) => {
                  e.stopPropagation()
                  exportActionPlan(state, lang, ui)
                }}
              >
                {ui.homeQ4Export}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="card-eyebrow">{ui.homeKpiFeedback}</div>
          <div className="kpi-value">{hs.feedbackDue}</div>
          <div className="kpi-label">{ui.homeKpiFeedbackSub}</div>
        </div>
        <div className="card">
          <div className="card-eyebrow">{ui.homeKpiTalent}</div>
          <div className="kpi-value" style={{ color: 'var(--success)' }}>
            {hs.valueCount}
          </div>
          <div className="kpi-label">{ui.homeKpiTalentSub(state.employees.length)}</div>
        </div>
        <div className="card">
          <div className="card-eyebrow">{ui.homeKpiRisk}</div>
          <div className="kpi-value" style={{ color: 'var(--danger)' }}>
            {hs.riskCount}
          </div>
          {/* Makes the "a rischio" union explicit: this KPI is Persona da
              Sviluppare + Persona Critica combined, so the subset that's
              specifically critical is now spelled out with its real count
              instead of a static "or critical" that gave no way to tell
              how much of the total was which tier. */}
          <div className="kpi-label">{ui.homeKpiRiskSub(hs.criticiCount)}</div>
        </div>
        <div className="card">
          <div className="card-eyebrow">{ui.homeKpiAreas}</div>
          <div className="kpi-value">{areasList(state).length}</div>
          <div className="kpi-label">{ui.homeKpiAreasSub}</div>
        </div>
      </div>

      {f.A && <ModuleATotalizer />}

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

function ModuleATotalizer() {
  const { state, ui } = useAssessment()
  const acquired = Number(state.settings.testsAcquired) || 0
  const dispatched = Number(state.settings.testsDispatched) || 0
  const pct = acquired > 0 ? Math.min(100, Math.round((dispatched / acquired) * 100)) : 0
  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="card-eyebrow" style={{ marginBottom: 2 }}>
            {ui.homeTotalizerTitle}
          </div>
          <div className="small-note">{ui.homeTotalizerSub}</div>
        </div>
        <span className="module-title-pill a">{ui.moduleASoft}</span>
      </div>
      <div className="grid grid-3" style={{ gap: 10, marginBottom: 12 }}>
        <div className="neu-tile">
          <div className="card-eyebrow">{ui.testsAcquiredLabel}</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>
            {acquired}
          </div>
        </div>
        <div className="neu-tile">
          <div className="card-eyebrow">{ui.testsDispatchedLabel}</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>
            {dispatched}
          </div>
        </div>
        <div className="neu-tile">
          <div className="card-eyebrow">{ui.testsRemainingLabel}</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>
            {Math.max(0, acquired - dispatched)}
          </div>
        </div>
      </div>
      <div className="pbar" style={{ height: 10 }}>
        <i style={{ width: `${pct}%`, background: 'var(--accent)' }} />
      </div>
      <div className="small-note" style={{ marginTop: 6 }}>
        {ui.testsUsedPct(pct)}
      </div>
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

// Simple local accordion state — legacy's HOME_OPEN_CARDS module global,
// reproduced as a plain useState hook (collapsed by default, matching
// HOME_OPEN_CARDS = {q1:false,...}).
function usePersistentAccordion() {
  const [open, setOpen] = useState({ q1: false, q2: false, q3: false, q4: false })
  function toggle(key: 'q1' | 'q2' | 'q3' | 'q4') {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }))
  }
  return [open, toggle] as const
}
