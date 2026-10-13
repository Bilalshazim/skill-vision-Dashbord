import { computeHardSummary, primaryScore, tierFor } from '@/modules/assessment/lib/calculations'
import type { AssessmentLang } from '@/modules/assessment/lib/legacy-utils'
import { getApex5dDimensions, getSoftSkills, round1 } from '@/modules/assessment/lib/legacy-utils'
import type { AssessmentState, Employee } from '@/modules/assessment/lib/types'

// Cambio ruolo / trasferimenti (documento del cliente, 2026-10-13): chi può
// sostituire una persona che lascia il ruolo, prima di cercare fuori.
// Tutto il calcolo sta qui, puro, con i dati già presenti; la pagina mostra.
//
// I requisiti del ruolo (DECISIONI, "Cambio ruolo: requisiti e compatibilità"):
//  - competenze trasversali: quelle del censimento del ruolo, con il loro peso
//    (essenziale 3, importante 2, utile 1) e il valore atteso;
//  - competenze professionali: le cinque P (APEX 5D), al livello a cui la
//    persona che lascia svolge oggi il ruolo; se non ha una valutazione, al
//    benchmark aziendale (7/10). Peso importante (2).
// Compatibilità di una persona: la quota pesata delle competenze richieste che
// possiede, come nel documento ("ha il 92% delle competenze richieste").
// Posseduta conta 1; da sviluppare conta in proporzione a quanto manca
// (1 − gap / 4: a 2 punti dal richiesto vale metà); mancante o non valutata 0.
// Trasversali e professionali pesano metà ciascuna quando ci sono entrambe.

export const BENCHMARK = 7
/** Sotto il richiesto di non più di tanti punti: «da sviluppare»; oltre: «mancante». */
export const PARTIAL_BAND = 2

export type ReqKind = 'soft' | 'hard'
export type ReqStatus = 'posseduta' | 'da-sviluppare' | 'mancante' | 'non-valutata'
export type Ease = 'alta' | 'media' | 'bassa'

export type Requirement = {
  key: string
  kind: ReqKind
  name: string
  /** Cluster (trasversali) o dimensione (professionali). */
  group: string
  weight: 1 | 2 | 3
  /** Livello richiesto, 0–10. */
  target: number
}
export type ReqResult = Requirement & {
  /** Livello della persona, 0–10; `null` se non valutata. */
  value: number | null
  status: ReqStatus
  /** Punti che mancano al livello richiesto (0 se posseduta). */
  gap: number
  /** Punti sopra il richiesto (0 se sotto). */
  margin: number
}
export type RoleBrief = {
  leaverId: string
  role: string
  tasks: string
  area: string
  level: string
  /** Solo persone della stessa area. */
  sameArea: boolean
}
export type Candidate = {
  emp: Employee
  /** Compatibilità con il ruolo, 0–100. */
  compat: number
  softPct: number | null
  hardPct: number | null
  results: ReqResult[]
  /** Competenze già possedute, dalle più pesanti. */
  strengths: ReqResult[]
  /** Le più coerenti: possedute con il margine più alto, fra le essenziali e importanti. */
  consistent: ReqResult[]
  /** Da sviluppare e mancanti, dalle più pesanti. */
  gaps: ReqResult[]
  /** Somma dei punti da recuperare. */
  devPoints: number
  ease: Ease
  /** Valutazione complessiva già fatta (0–10) e la sua fascia. */
  overall: number
  tierLabel: string
}
export type RoleChangeResult = {
  requirements: Requirement[]
  /** Da dove vengono i requisiti professionali. */
  hardSource: 'persona' | 'benchmark'
  /** Il ruolo non ha competenze trasversali nel censimento. */
  noSoftProfile: boolean
  pool: number
  top: Candidate[]
}

const active = (s: AssessmentState) => s.employees.filter((e) => !e.archived)
const hasHard = (e: Employee) => Object.values(e.hard || {}).some((src) => Object.values(src || {}).some((v) => v > 0))
const hasSoft = (e: Employee, id: string) => e.soft[id] != null && e.soft[id].ottenuto > 0

export function roleRequirements(state: AssessmentState, brief: RoleBrief, lang: AssessmentLang): Pick<RoleChangeResult, 'requirements' | 'hardSource' | 'noSoftProfile'> {
  const skills = getSoftSkills(lang)
  const rp = state.roleProfiles[brief.role]
  const weights = rp?.skillWeights ?? Object.fromEntries((rp?.requiredSkills ?? []).map((id) => [id, 3 as const]))
  const soft: Requirement[] = Object.entries(weights)
    .map(([id, w]): Requirement | null => {
      const s = skills.find((x) => x.id === id)
      return s ? { key: `soft:${id}`, kind: 'soft', name: s.name, group: s.cluster, weight: w as 1 | 2 | 3, target: rp?.skillExpected?.[id] ?? 8 } : null
    })
    .filter((x): x is Requirement => !!x)
    .sort((a, b) => b.weight - a.weight || b.target - a.target)

  const leaver = state.employees.find((e) => e.id === brief.leaverId)
  const fromPerson = !!leaver && hasHard(leaver)
  const dims = fromPerson ? computeHardSummary(leaver!, lang).dims : null
  const hard: Requirement[] = getApex5dDimensions(lang).map((d) => {
    const own = dims?.find((x) => x.code === d.code)?.mediaTotale
    return { key: `hard:${d.code}`, kind: 'hard', name: `${d.code} · ${d.name}`, group: d.desc, weight: 2, target: round1(fromPerson && own ? own : BENCHMARK) }
  })
  return { requirements: [...soft, ...hard], hardSource: fromPerson ? 'persona' : 'benchmark', noSoftProfile: soft.length === 0 }
}

function evaluate(emp: Employee, req: Requirement[], lang: AssessmentLang): ReqResult[] {
  const hardDims = hasHard(emp) ? computeHardSummary(emp, lang).dims : null
  return req.map((r) => {
    let value: number | null
    if (r.kind === 'soft') {
      const id = r.key.slice(5)
      value = hasSoft(emp, id) ? emp.soft[id].ottenuto : null
    } else {
      const code = r.key.slice(5)
      value = hardDims ? (hardDims.find((d) => d.code === code)?.mediaTotale ?? null) : null
    }
    const gap = value == null ? r.target : round1(Math.max(0, r.target - value))
    const status: ReqStatus = value == null ? 'non-valutata' : value >= r.target ? 'posseduta' : r.target - value <= PARTIAL_BAND ? 'da-sviluppare' : 'mancante'
    return { ...r, value, status, gap, margin: value == null ? 0 : round1(Math.max(0, value - r.target)) }
  })
}

/** Quanto vale un requisito nella compatibilità, 0–1. */
const credit = (r: ReqResult) => (r.status === 'posseduta' ? 1 : r.status === 'da-sviluppare' ? Math.max(0, 1 - r.gap / (PARTIAL_BAND * 2)) : 0)
const coverage = (rs: ReqResult[]) => {
  const tw = rs.reduce((t, r) => t + r.weight, 0)
  if (!tw) return null
  return rs.reduce((t, r) => t + r.weight * credit(r), 0) / tw
}

function easeOf(gaps: ReqResult[], devPoints: number): Ease {
  const missing = gaps.filter((g) => g.status === 'mancante' || g.status === 'non-valutata')
  if (!missing.length && devPoints <= 3) return 'alta'
  if (!missing.some((g) => g.weight === 3)) return 'media'
  return 'bassa'
}

export function computeRoleChange(state: AssessmentState, brief: RoleBrief, lang: AssessmentLang, count = 3): RoleChangeResult {
  const base = roleRequirements(state, brief, lang)
  const leaver = state.employees.find((e) => e.id === brief.leaverId)
  const area = (brief.area || leaver?.area || '').trim().toLowerCase()
  const pool = active(state).filter((e) => e.id !== brief.leaverId && (!brief.sameArea || !area || e.area.trim().toLowerCase() === area))
  const ranked = pool
    .map((emp): Candidate => {
      const results = evaluate(emp, base.requirements, lang)
      const soft = coverage(results.filter((r) => r.kind === 'soft'))
      const hard = coverage(results.filter((r) => r.kind === 'hard'))
      const parts = [soft, hard].filter((x): x is number => x != null)
      const compat = parts.length ? Math.round((parts.reduce((t, x) => t + x, 0) / parts.length) * 100) : 0
      const strengths = results.filter((r) => r.status === 'posseduta').sort((a, b) => b.weight - a.weight || b.margin - a.margin)
      const consistent = strengths.filter((r) => r.weight >= 2).sort((a, b) => b.margin - a.margin || b.weight - a.weight).slice(0, 3)
      const gaps = results.filter((r) => r.status !== 'posseduta').sort((a, b) => b.weight * b.gap - a.weight * a.gap)
      const devPoints = round1(gaps.reduce((t, g) => t + g.gap, 0))
      const overall = primaryScore(emp, state, lang)
      return {
        emp,
        compat,
        softPct: soft == null ? null : Math.round(soft * 100),
        hardPct: hard == null ? null : Math.round(hard * 100),
        results,
        strengths,
        consistent: consistent.length ? consistent : strengths.slice(0, 3),
        gaps,
        devPoints,
        ease: easeOf(gaps, devPoints),
        overall,
        tierLabel: tierFor(overall, lang).label,
      }
    })
    .sort((a, b) => b.compat - a.compat || a.devPoints - b.devPoints || b.overall - a.overall)
  return { ...base, pool: pool.length, top: ranked.slice(0, count) }
}
