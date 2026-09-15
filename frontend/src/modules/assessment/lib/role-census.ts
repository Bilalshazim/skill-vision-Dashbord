import type { AssessmentLang } from '@/modules/assessment/lib/legacy-utils'
import { getUI } from '@/modules/assessment/lib/legacy-utils'
import type { AssessmentState, RoleProfile } from '@/modules/assessment/lib/types'

// Ported verbatim from ensureRoleProfile()/roleSkillCounts()/
// applyRoleSkillToEmployees()/cycleRoleSkillWeight()/setRoleSkillExpected()
// (js/assessment.js ~4898-5059) — the per-role expected-skill weighting
// (Essenziale/Importante/Utile) that feeds both the Role Census modal and
// the Employee Drawer/Report's "role expected profile" section.
export const SKILL_WEIGHT_LEVELS: Record<number, { labelKey: string; chip: string; min: number; countKey: string }> = {
  3: { labelKey: 'weightEssenziale', chip: 'chip-blue', min: 6, countKey: 'rcEssenzialiLabel' },
  2: { labelKey: 'weightImportante', chip: 'chip-amber', min: 4, countKey: 'rcImportantiLabel' },
  1: { labelKey: 'weightUtile', chip: 'chip-green', min: 2, countKey: 'rcUtiliLabel' },
}
export const SKILL_WEIGHT_CYCLE = [0, 3, 2, 1] as const

export function ensureRoleProfile(state: AssessmentState, role: string): RoleProfile {
  if (!state.roleProfiles[role]) state.roleProfiles[role] = { requiredSkills: [] }
  const rp = state.roleProfiles[role]
  if (!rp.skillWeights) {
    rp.skillWeights = {}
    ;(rp.requiredSkills || []).forEach((id) => {
      rp.skillWeights![id] = 3
    })
  }
  if (!rp.skillExpected) {
    rp.skillExpected = {}
    Object.keys(rp.skillWeights).forEach((id) => {
      rp.skillExpected![id] = 8
    })
  }
  rp.requiredSkills = Object.keys(rp.skillWeights)
  return rp
}

export function roleSkillCounts(state: AssessmentState, role: string): Record<number, number> {
  const rp = ensureRoleProfile(state, role)
  const counts: Record<number, number> = { 3: 0, 2: 0, 1: 0 }
  Object.values(rp.skillWeights || {}).forEach((w) => {
    if (counts[w] != null) counts[w]++
  })
  return counts
}

// Mutates the given state in place (fresh-read-mutate-persist caller
// discipline — always called from inside a setState updater over `prev`).
export function applyRoleSkillToEmployees(state: AssessmentState, role: string, skillId: string) {
  const rp = state.roleProfiles[role]
  if (!rp) return
  const weight = rp.skillWeights?.[skillId]
  const expected = weight ? (rp.skillExpected?.[skillId] ?? 8) : 6
  state.employees.filter((e) => e.ruolo === role).forEach((e) => {
    if (!e.soft[skillId]) e.soft[skillId] = { ottenuto: 6, atteso: 6 }
    e.soft[skillId].atteso = expected
  })
}

export function weightLabel(w: number, lang: AssessmentLang): string {
  const ui = getUI(lang) as unknown as Record<string, string>
  const lvl = SKILL_WEIGHT_LEVELS[w]
  return lvl ? ui[lvl.labelKey] : ui.weightNone
}
