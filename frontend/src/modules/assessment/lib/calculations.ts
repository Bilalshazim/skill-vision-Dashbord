import { ROLE_FOCUS_SKILLS } from '@/modules/assessment/lib/demo-data'
import { avg, getApex5dDimensions, getSoftClusters, getSoftSkills, getTierDefs, getUI, round1, type AssessmentLang } from '@/modules/assessment/lib/legacy-utils'
import type { AssessmentState, ApexSourceKey, Employee } from '@/modules/assessment/lib/types'

// Ported verbatim from js/assessment.js's CALCULATION FUNCTIONS block
// (~2947-3156) — same formulas, same weighting, same rounding (round1 =
// one-decimal rounding), same defaults. Every function that read the
// mutable globals STATE/lang now takes them explicitly.

// Ported verbatim from getEmployeePeriodSnapshots()/getEmployeeSoftHistorySorted()
// (js/assessment.js ~7056-7068) — hard: one (latest) snapshot per period id,
// ascending by date. Soft: every softHistory entry ascending by date (no
// period concept on the transversal-competencies side). Kept as two
// separate functions/arrays, exactly like legacy, so a hard-skills
// assessment can never affect the soft-skills "last assessment" date.
export function getEmployeePeriodSnapshots(emp: Employee) {
  const byPeriod: Record<string, Employee['hardHistory'][number]> = {}
  ;(emp.hardHistory || []).forEach((h) => {
    if (!byPeriod[h.periodId] || h.date > byPeriod[h.periodId].date) byPeriod[h.periodId] = h
  })
  return Object.values(byPeriod).sort((a, b) => a.date.localeCompare(b.date))
}
export function getEmployeeSoftHistorySorted(emp: Employee) {
  return (emp.softHistory || []).slice().sort((a, b) => a.date.localeCompare(b.date))
}

export function moduleActive(state: AssessmentState, letter: 'A' | 'B'): boolean {
  const m = state.settings.modulo
  if (m === 'AB') return true
  return m === letter
}
export function bothActive(state: AssessmentState): boolean {
  return state.settings.modulo === 'AB'
}

export function computeSoftSummary(emp: Employee, lang: AssessmentLang) {
  const SOFT_SKILLS = getSoftSkills(lang)
  const SOFT_CLUSTERS = getSoftClusters(lang)
  const perSkill = SOFT_SKILLS.map((s) => {
    const rec = emp.soft[s.id] || { ottenuto: 0, atteso: 6 }
    return { ...s, ottenuto: rec.ottenuto, atteso: rec.atteso, gap: round1(rec.ottenuto - rec.atteso) }
  })
  const perCluster = SOFT_CLUSTERS.map((c) => {
    const items = perSkill.filter((s) => s.cluster === c)
    return { cluster: c, ottenuto: round1(avg(items.map((i) => i.ottenuto))), atteso: round1(avg(items.map((i) => i.atteso))), items }
  })
  const overallOttenuto = round1(avg(perSkill.map((s) => s.ottenuto)))
  const overallAtteso = round1(avg(perSkill.map((s) => s.atteso)))
  return { perSkill, perCluster, overallOttenuto, overallAtteso, gapOverall: round1(overallOttenuto - overallAtteso) }
}

export function computeBigFive(emp: Employee, lang: AssessmentLang) {
  const SOFT_SKILLS = getSoftSkills(lang)
  const out: Record<string, number> = {}
  const BIGFIVE_ORDER = ['O', 'C', 'E', 'A', 'S']
  BIGFIVE_ORDER.forEach((dim) => {
    const ids = SOFT_SKILLS.filter((s) => s.dim === dim).map((s) => s.id)
    const vals = ids.map((id) => (emp.soft[id] || { ottenuto: 0 }).ottenuto)
    out[dim] = round1(avg(vals))
  })
  out.overall = round1(avg(BIGFIVE_ORDER.map((d) => out[d])))
  return out
}
export function computeBigFiveExpected(emp: Employee, lang: AssessmentLang) {
  const SOFT_SKILLS = getSoftSkills(lang)
  const out: Record<string, number> = {}
  const BIGFIVE_ORDER = ['O', 'C', 'E', 'A', 'S']
  BIGFIVE_ORDER.forEach((dim) => {
    const ids = SOFT_SKILLS.filter((s) => s.dim === dim).map((s) => s.id)
    const vals = ids.map((id) => (emp.soft[id] || { atteso: 6 }).atteso)
    out[dim] = round1(avg(vals))
  })
  out.overall = round1(avg(BIGFIVE_ORDER.map((d) => out[d])))
  return out
}

export function computeHardSummary(emp: Employee, lang: AssessmentLang) {
  const APEX5D_DIMENSIONS = getApex5dDimensions(lang)
  const APEX_SOURCES = [
    { key: 'resp' as ApexSourceKey },
    { key: 'peer' as ApexSourceKey },
    { key: 'auto' as ApexSourceKey },
  ]
  const dims = APEX5D_DIMENSIONS.map((dim) => {
    const perSource: Record<string, number> = {}
    APEX_SOURCES.forEach((src) => {
      const vals = dim.items.map((it) => (emp.hard[src.key] || {})[it.cod] || 0)
      perSource[src.key] = round1(avg(vals))
    })
    const mediaTotale = round1(avg(APEX_SOURCES.map((s) => perSource[s.key])))
    const gapRespAuto = round1(perSource.resp - perSource.auto)
    const gapPeerAuto = round1(perSource.peer - perSource.auto)
    const gapRespPeer = round1(perSource.resp - perSource.peer)
    return { code: dim.code, name: dim.name, desc: dim.desc, perSource, mediaTotale, gapRespAuto, gapPeerAuto, gapRespPeer }
  })
  const apexScore = round1(avg(dims.map((d) => d.mediaTotale)))
  return { dims, apexScore }
}

export function gapInterpretation(delta: number, lang: AssessmentLang) {
  const UI = getUI(lang)
  const a = Math.abs(delta)
  if (a < 0.8) return { label: UI.gapAligned, tag: 'gap-ok' }
  if (a < 1.8) return { label: UI.gapModerate, tag: 'gap-warn' }
  return { label: UI.gapSignificant, tag: 'gap-bad' }
}
export function matchCellClasses(values: number[]): string[] {
  if (values.length < 2) return values.map(() => '')
  const max = Math.max(...values)
  const min = Math.min(...values)
  if (round1(max - min) <= 0.5) return values.map(() => 'match-overlap')
  return values.map((v) => (v === max ? 'match-high' : v === min ? 'match-low' : ''))
}

export function tierFor(score: number, lang: AssessmentLang) {
  const TIER_DEFS = getTierDefs(lang)
  for (const t of TIER_DEFS) {
    if (score >= t.min) return t
  }
  return TIER_DEFS[TIER_DEFS.length - 1]
}

export function primaryScore(emp: Employee, state: AssessmentState, lang: AssessmentLang): number {
  const m = state.settings.modulo
  if (m === 'A') return computeSoftSummary(emp, lang).overallOttenuto
  if (m === 'B') return computeHardSummary(emp, lang).apexScore
  const soft = computeSoftSummary(emp, lang).overallOttenuto
  const hard = computeHardSummary(emp, lang).apexScore
  return round1(soft * 0.5 + hard * 0.5)
}
export function primaryScoreLabel(state: AssessmentState, lang: AssessmentLang): string {
  const UI = getUI(lang)
  const m = state.settings.modulo
  if (m === 'A') return UI.primaryScoreSoft
  if (m === 'B') return UI.primaryScoreHard
  return UI.primaryScoreOverall
}

export function activeEmployees(state: AssessmentState): Employee[] {
  return state.employees.filter((e) => !e.archived)
}
export function filterByArea(state: AssessmentState, area: string): Employee[] {
  return state.employees.filter((e) => e.area === area)
}
export function areasList(state: AssessmentState): string[] {
  return [...new Set(state.employees.map((e) => e.area))]
}
export function repartiList(state: AssessmentState): string[] {
  return [...new Set(state.employees.map((e) => e.reparto).filter(Boolean))]
}

export function rankedEmployees(state: AssessmentState, lang: AssessmentLang) {
  return [...state.employees].map((e) => ({ emp: e, score: primaryScore(e, state, lang) })).sort((a, b) => b.score - a.score)
}

export function classifyPopulation(state: AssessmentState, lang: AssessmentLang): Record<string, Employee[]> {
  const TIER_DEFS = getTierDefs(lang)
  const counts: Record<string, Employee[]> = {}
  TIER_DEFS.forEach((t) => (counts[t.key] = []))
  state.employees.forEach((e) => {
    const s = primaryScore(e, state, lang)
    const t = tierFor(s, lang)
    counts[t.key].push(e)
  })
  return counts
}

export function orgCriticalAreas(state: AssessmentState, lang: AssessmentLang, n = 3) {
  return areasList(state)
    .map((area) => {
      const emps = filterByArea(state, area)
      const scores = emps.map((e) => primaryScore(e, state, lang))
      return { area, avg: round1(avg(scores)), count: emps.length }
    })
    .sort((a, b) => a.avg - b.avg)
    .slice(0, n)
}
export function orgWorstSoftSkills(state: AssessmentState, lang: AssessmentLang, n = 5) {
  const SOFT_SKILLS = getSoftSkills(lang)
  return SOFT_SKILLS.map((s) => {
    const vals = state.employees.map((e) => e.soft[s.id] || { ottenuto: 0, atteso: 6 })
    const ott = round1(avg(vals.map((v) => v.ottenuto)))
    const att = round1(avg(vals.map((v) => v.atteso)))
    return { ...s, ottenuto: ott, atteso: att, gap: round1(ott - att) }
  })
    .sort((a, b) => a.gap - b.gap)
    .slice(0, n)
}
export function orgWorstHardDims(state: AssessmentState, lang: AssessmentLang, n = 3) {
  const APEX5D_DIMENSIONS = getApex5dDimensions(lang)
  return APEX5D_DIMENSIONS.map((dim) => {
    const vals = state.employees.map((e) => computeHardSummary(e, lang).dims.find((d) => d.code === dim.code)!.mediaTotale)
    return { code: dim.code, name: dim.name, avg: round1(avg(vals)) }
  })
    .sort((a, b) => a.avg - b.avg)
    .slice(0, n)
}

// Single source of truth for every Home-page population count (KPI row, the
// Q1 Verde/Giallo/Rosso band, the Q2 "gap severo" chip, the Q3 tier map).
// Everything below is derived from ONE partition — the 5-tier classification
// (classifyPopulation, which already covers 100% of employees by construction:
// TIER_DEFS' last bucket has min:-1) — plus one deliberately separate axis
// (severeGapCount). Previously each widget recomputed its own thresholds
// in-place (Q1's band used a 7/5 cutoff, Q2's "gap severo" used a fresh
// benchmark-2 filter), which drifted from the tier cutpoints (8.3/7.0/5.5/4.0)
// and from each other, producing counts that didn't reconcile on screen.
// riskCount/valueCount are exhaustive tier unions (talenti + nellaNorma +
// aRischio = total, always), so no widget should invent a different split.
export function homeStats(state: AssessmentState, lang: AssessmentLang) {
  const ranked = rankedEmployees(state, lang)
  const orgAvg = round1(avg(ranked.map((r) => r.score)))
  const benchmark = 7.0
  const tiers = classifyPopulation(state, lang)
  const riskCount = tiers.critica.length + tiers.sviluppo.length
  const valueCount = tiers.top.length + tiers.valorizzare.length
  const nellaNormaCount = tiers.adeguata.length
  const criticiCount = tiers.critica.length
  // A genuinely different axis from the tiers above: distance from the
  // benchmark target, not an absolute score band. Kept separate on purpose
  // (see calculations.ts comment above) rather than folded into a tier —
  // but computed once, here, so every widget that shows "gap severo" reads
  // the same number instead of re-deriving it.
  const severeGapCount = ranked.filter((r) => round1(r.score - benchmark) <= -2).length
  const feedbackDue = state.employees.filter((e) => e.feedbackNeeded).length
  let biggestGaps: { emp: Employee; dim: string; gap: number }[] = []
  if (moduleActive(state, 'B')) {
    state.employees.forEach((e) => {
      const hs = computeHardSummary(e, lang)
      hs.dims.forEach((d) => {
        biggestGaps.push({ emp: e, dim: d.name, gap: Math.abs(d.gapRespAuto) })
      })
    })
    biggestGaps.sort((a, b) => b.gap - a.gap)
    biggestGaps = biggestGaps.slice(0, 3)
  }
  return { orgAvg, benchmark, tiers, riskCount, valueCount, nellaNormaCount, criticiCount, severeGapCount, feedbackDue, ranked, biggestGaps }
}

export type PriorityAction = { icon: string; text: string }

// Ported from priorityActions() (~3131-3154). LEGACY QUIRK, preserved
// exactly: unlike everything else in the app, these 5 action strings are
// hardcoded English literals in the source — never routed through UI_IT/
// UI_EN — so this list stays in English even when the Assessment UI is
// switched to Italian. Not a bug this port should "fix": reproduced as-is.
// Legacy builds an HTML string with inline <b> tags via esc(); reproduced
// here as parts + a `bold` slice so the caller renders real JSX <b> instead
// of raw HTML.
export function priorityActions(state: AssessmentState, lang: AssessmentLang): { icon: string; parts: (string | { bold: string })[] }[] {
  const hs = homeStats(state, lang)
  const actions: { icon: string; parts: (string | { bold: string })[] }[] = []
  const critAreas = orgCriticalAreas(state, lang, 2)
  critAreas.forEach((a) => {
    if (a.avg < 6.0) {
      actions.push({ icon: '📌', parts: ['Schedule a targeted training program for the ', { bold: a.area }, ` area (average ${a.avg.toFixed(1)}/10).`] })
    }
  })
  if (moduleActive(state, 'A')) {
    const worst = orgWorstSoftSkills(state, lang, 2)
    worst.forEach((w) => {
      if (w.gap < -1) {
        actions.push({ icon: '🎯', parts: ['Invest in ', { bold: w.name }, `: average gap of ${w.gap.toFixed(1)} points versus the expected level.`] })
      }
    })
  }
  if (hs.tiers.critica.length) {
    actions.push({ icon: '🗣️', parts: ['Schedule feedback debrief meetings with the ', { bold: String(hs.tiers.critica.length) }, ' people in the critical tier.'] })
  }
  if (hs.tiers.top.length) {
    actions.push({ icon: '⭐', parts: ['Define a retention/development plan for the ', { bold: String(hs.tiers.top.length) }, ' Top Talent identified.'] })
  }
  if (hs.biggestGaps.length) {
    const g = hs.biggestGaps[0]
    actions.push({ icon: '🔍', parts: ['Look into the perception gap for ', { bold: `${g.emp.nome} ${g.emp.cognome}` }, ` on ${g.dim} (Δ ${g.gap.toFixed(1)}).`] })
  }
  if (!actions.length) actions.push({ icon: '✅', parts: ['No significant issues found: maintain periodic monitoring.'] })
  return actions.slice(0, 5)
}

// Ported from js/assessment.js's HOME section (~4360-4392, 4750-4776).
export function orgCriticalRoles(state: AssessmentState, lang: AssessmentLang, n = 3) {
  const roles = [...new Set(state.employees.map((e) => e.ruolo))]
  return roles
    .map((ruolo) => {
      const emps = state.employees.filter((e) => e.ruolo === ruolo)
      const scores = emps.map((e) => primaryScore(e, state, lang))
      return { ruolo, avg: round1(avg(scores)), count: emps.length }
    })
    .sort((a, b) => a.avg - b.avg)
    .slice(0, n)
}

export function allRolesKnown(state: AssessmentState): string[] {
  const s = new Set(Object.keys(ROLE_FOCUS_SKILLS))
  Object.keys(state.roleProfiles || {}).forEach((r) => s.add(r))
  state.employees.forEach((e) => s.add(e.ruolo))
  return [...s].sort((a, b) => a.localeCompare(b))
}
export function censusRolesList(state: AssessmentState): string[] {
  return Object.keys(state.roleProfiles || {}).sort((a, b) => a.localeCompare(b))
}

export function roleCoveragePct(state: AssessmentState, lang: AssessmentLang): number {
  const roles = allRolesKnown(state)
  if (!roles.length) return 0
  const adequate = new Set<string>()
  state.employees.forEach((e) => {
    if (primaryScore(e, state, lang) >= 5.5) adequate.add(e.ruolo)
  })
  const covered = roles.filter((r) => adequate.has(r)).length
  return Math.round((covered / roles.length) * 100)
}

export function worstCompetenza(state: AssessmentState, lang: AssessmentLang, f: { A: boolean; B: boolean }): { name: string; gap: number } | null {
  const candidates: { name: string; gap: number }[] = []
  if (f.A) {
    const s = orgWorstSoftSkills(state, lang, 1)[0]
    if (s) candidates.push({ name: s.name, gap: s.gap })
  }
  if (f.B) {
    const d = orgWorstHardDims(state, lang, 1)[0]
    if (d) candidates.push({ name: d.name, gap: round1(d.avg - 7) })
  }
  if (!candidates.length) return null
  candidates.sort((a, b) => a.gap - b.gap)
  return candidates[0]
}

// The 4 highlighted tiles (talent + risk extremes) plus a 5th "on track"
// tile for the tier this map used to leave out entirely (Persona Adeguata —
// see calculations.ts's homeStats comment). All 5 keys are TIER_DEFS keys,
// so their counts always sum to the full employee total: nothing here is
// invented, it's the same partition classifyPopulation already produces.
export function quadDefs(ui: ReturnType<typeof getUI>) {
  return [
    { key: 'valorizzare', label: ui.quadHighPotential, variant: 'success', icon: 'sparkles', caption: ui.quadReadyToGrow, span: false },
    { key: 'top', label: ui.quadHighValue, variant: 'accent', icon: 'award', caption: ui.quadOperationalPillars, span: false },
    { key: 'critica', label: ui.quadCritical, variant: 'danger', icon: 'userX', caption: ui.quadUrgentAction, span: false },
    { key: 'sviluppo', label: ui.quadNeedsDevelopment, variant: 'warning', icon: 'alertCircle', caption: ui.quadNeedsSupport, span: false },
    { key: 'adeguata', label: ui.quadOnTrack, variant: 'neutral', icon: 'activity', caption: ui.quadOnTrackCaption, span: true },
  ] as const
}

export function computeAvgMetric(state: AssessmentState, lang: AssessmentLang, type: 'soft' | 'hard'): number {
  if (type === 'soft') return avg(state.employees.map((e) => computeSoftSummary(e, lang).overallOttenuto))
  return avg(state.employees.map((e) => computeHardSummary(e, lang).apexScore))
}
