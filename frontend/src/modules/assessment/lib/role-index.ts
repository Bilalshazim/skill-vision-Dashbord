import { computeHardSummary, evaluatedEmployees } from '@/modules/assessment/lib/calculations'
import { getSoftSkills, type AssessmentLang } from '@/modules/assessment/lib/legacy-utils'
import type { AssessmentState, Employee } from '@/modules/assessment/lib/types'

// L'indice a 100 (CLAUDE.md, Fase 6, "Euro dal motore ROI", Roberto 2026-11-03):
// 100 = la persona raggiunge l'atteso su tutte le competenze scelte per il suo
// ruolo. Per ogni competenza rilevato ÷ atteso × 100, poi la media; soft e
// professionali con lo stesso peso. La scala è una sola, da 1 a 10, per tutte e
// due (comitato scientifico, 2026-11-04). I confronti fra persone usano solo la
// parte soft sulle competenze del ruolo; i sottofattori non entrano mai.

/** L'atteso delle competenze professionali: lo stesso benchmark della Panoramica. */
const HARD_EXPECTED = 7

export type RoleSkill = { id: string; name: string; cluster: string; weight: 1 | 2 | 3 }

/** Le competenze trasversali scelte per un ruolo, dalla più importante. Vuoto se il ruolo non ne ha. */
export function roleSkills(state: AssessmentState, role: string, lang: AssessmentLang): RoleSkill[] {
  const rp = state.roleProfiles[role]
  const weights = rp?.skillWeights ?? Object.fromEntries((rp?.requiredSkills ?? []).map((id) => [id, 3 as const]))
  return getSoftSkills(lang)
    .filter((s) => weights[s.id])
    .map((s) => ({ id: s.id, name: s.name, cluster: s.cluster, weight: weights[s.id] as 1 | 2 | 3 }))
    .sort((a, b) => b.weight - a.weight)
}

/** L'atteso di una competenza: quello del ruolo, altrimenti quello registrato sulla persona. */
export function expectedSoft(state: AssessmentState, emp: Employee, role: string, id: string): number {
  return state.roleProfiles[role]?.skillExpected?.[id] ?? emp.soft[id]?.atteso ?? 8
}

const mean = (l: number[]) => l.reduce((n, v) => n + v, 0) / l.length

/** La media di rilevato ÷ atteso × 100 sulle competenze indicate. `null` se nessuna è stata misurata. */
export function softIndex(state: AssessmentState, emp: Employee, role: string, ids: string[]): number | null {
  const parts = ids
    .map((id) => {
      const got = emp.soft[id]?.ottenuto ?? 0
      const expected = expectedSoft(state, emp, role, id)
      return got > 0 && expected > 0 ? (got / expected) * 100 : null
    })
    .filter((v): v is number => v != null)
  return parts.length ? mean(parts) : null
}

function hardIndex(emp: Employee, lang: AssessmentLang): number | null {
  const hasHard = Object.values(emp.hard || {}).some((src) => Object.values(src || {}).some((v) => v > 0))
  if (!hasHard) return null
  const dims = computeHardSummary(emp, lang).dims.filter((d) => d.mediaTotale > 0)
  return dims.length ? mean(dims.map((d) => (d.mediaTotale / HARD_EXPECTED) * 100)) : null
}

/** L'indice di una persona nella vista scelta (CT, CP o Completo). Un ruolo senza competenze scelte usa tutte le 35. */
export function personIndex(emp: Employee, state: AssessmentState, lang: AssessmentLang): number | null {
  const m = state.settings.modulo
  const skills = roleSkills(state, emp.ruolo, lang)
  const ids = skills.length ? skills.map((s) => s.id) : getSoftSkills(lang).map((s) => s.id)
  const parts = [m !== 'B' ? softIndex(state, emp, emp.ruolo, ids) : null, m !== 'A' ? hardIndex(emp, lang) : null].filter((v): v is number => v != null)
  return parts.length ? Math.round(mean(parts)) : null
}

/** L'indice dell'azienda: la media delle persone valutate. */
export function orgIndex(state: AssessmentState, lang: AssessmentLang): number | null {
  const all = evaluatedEmployees(state)
    .map((e) => personIndex(e, state, lang))
    .filter((v): v is number => v != null)
  return all.length ? Math.round(mean(all)) : null
}
