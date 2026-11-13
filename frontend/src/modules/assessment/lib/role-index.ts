import { computeHardSummary, evaluatedEmployees } from '@/modules/assessment/lib/calculations'
import { getSoftSkills, type AssessmentLang } from '@/modules/assessment/lib/legacy-utils'
import type { AssessmentState, Employee } from '@/modules/assessment/lib/types'

// Il valore espresso rispetto al ruolo (CLAUDE.md, Fase 6, "Euro dal motore ROI",
// formula di Roberto, 2026-11-05): somma dei valori rilevati ÷ somma dei valori
// attesi × 100 sulle competenze del ruolo, non la media dei rapporti. 100 = la
// persona raggiunge l'atteso su tutte; oltre 100 è un'eccedenza, non un errore. Ogni
// competenza, soft o professionale, conta uguale: nessun peso per ora. Una
// competenza non ancora misurata non entra in nessuna delle due somme. La scala è
// una sola, da 1 a 10 (comitato scientifico, 2026-11-04). I valori qui sono esatti:
// si arrotondano solo a schermo. I confronti fra persone usano solo la parte soft
// sulle competenze del ruolo; i sottofattori non entrano mai.

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

/**
 * L'atteso di una competenza per il ruolo di riferimento: quello del profilo del ruolo.
 * Se il profilo non lo dice, chi ricopre il ruolo tiene il suo; chi viene da un altro
 * ruolo si misura con la regola del ruolo, 8 sulle sue competenze e 6 sulle altre (la
 * stessa di new-employee.ts), mai con l'atteso del proprio: confronterebbe ognuno con un
 * metro diverso (Federico Longo 36/38 e Davide Longo 38/40 davano tutti e due 95%).
 */
export function expectedSoft(state: AssessmentState, emp: Employee, role: string, id: string): number {
  const rp = state.roleProfiles[role]
  const fixed = rp?.skillExpected?.[id]
  if (fixed != null) return fixed
  if (emp.ruolo === role) return emp.soft[id]?.atteso ?? 8
  return (rp?.skillWeights ? rp.skillWeights[id] : rp?.requiredSkills?.includes(id)) ? 8 : 6
}

type Totals = { got: number; expected: number }

const ratio = ({ got, expected }: Totals) => (expected > 0 ? (got / expected) * 100 : null)
const addTotals = (a: Totals, b: Totals): Totals => ({ got: a.got + b.got, expected: a.expected + b.expected })

function softTotals(state: AssessmentState, emp: Employee, role: string, ids: string[]): Totals {
  return ids.reduce<Totals>(
    (t, id) => {
      const got = emp.soft[id]?.ottenuto ?? 0
      const expected = expectedSoft(state, emp, role, id)
      return got > 0 && expected > 0 ? addTotals(t, { got, expected }) : t
    },
    { got: 0, expected: 0 },
  )
}

function hardTotals(emp: Employee, lang: AssessmentLang): Totals {
  const hasHard = Object.values(emp.hard || {}).some((src) => Object.values(src || {}).some((v) => v > 0))
  if (!hasHard) return { got: 0, expected: 0 }
  const dims = computeHardSummary(emp, lang).dims.filter((d) => d.mediaTotale > 0)
  return { got: dims.reduce((n, d) => n + d.mediaTotale, 0), expected: dims.length * HARD_EXPECTED }
}

/** Le due somme di una persona nella vista scelta (CT, CP o Completo). Un ruolo senza competenze scelte usa tutte le 35. */
function personTotals(emp: Employee, state: AssessmentState, lang: AssessmentLang): Totals {
  const m = state.settings.modulo
  const skills = roleSkills(state, emp.ruolo, lang)
  const ids = skills.length ? skills.map((s) => s.id) : getSoftSkills(lang).map((s) => s.id)
  const soft = m !== 'B' ? softTotals(state, emp, emp.ruolo, ids) : { got: 0, expected: 0 }
  return m !== 'A' ? addTotals(soft, hardTotals(emp, lang)) : soft
}

/** Il valore espresso sulle competenze indicate, solo parte soft. `null` se nessuna è stata misurata. */
export function softIndex(state: AssessmentState, emp: Employee, role: string, ids: string[]): number | null {
  return ratio(softTotals(state, emp, role, ids))
}

/** Il valore espresso di una persona. `null` se non ha niente di misurato. */
export function personIndex(emp: Employee, state: AssessmentState, lang: AssessmentLang): number | null {
  return ratio(personTotals(emp, state, lang))
}

/**
 * Il valore espresso per area (correzioni del 2026-11-09, «Il valore»): la stessa
 * formula dell'azienda, con le somme delle persone valutate dell'area. Le aree
 * senza niente di misurato non compaiono.
 */
export function areaValues(state: AssessmentState, lang: AssessmentLang): Map<string, number> {
  return groupValues(state, lang, (e) => e.area)
}

/** Il valore espresso per mansione (Decisioni del 2026-11-09, «Vedi per mansione»): la stessa formula, per mansione. */
export function roleValues(state: AssessmentState, lang: AssessmentLang): Map<string, number> {
  return groupValues(state, lang, (e) => e.ruolo)
}

/**
 * Il valore espresso per competenza («Vedi per competenze», Roberto, 2026-11-16): la stessa
 * formula, somma dei rilevati ÷ somma degli attesi, competenza per competenza, sulle persone
 * valutate. Trasversali: le competenze del ruolo di ognuno (tutte le 35 se il ruolo non ne ha
 * scelte). Professionali: le cinque dimensioni delle 5P, con l'atteso 7. Segue la vista scelta.
 */
export function skillValues(state: AssessmentState, lang: AssessmentLang): Map<string, number> {
  const m = state.settings.modulo
  const names = new Map(getSoftSkills(lang).map((s) => [s.id, s.name]))
  const byKey = new Map<string, Totals>()
  const add = (key: string, t: Totals) => byKey.set(key, addTotals(byKey.get(key) ?? { got: 0, expected: 0 }, t))
  for (const e of evaluatedEmployees(state)) {
    if (m !== 'B') {
      const skills = roleSkills(state, e.ruolo, lang)
      const ids = skills.length ? skills.map((s) => s.id) : [...names.keys()]
      for (const id of ids) {
        const got = e.soft[id]?.ottenuto ?? 0
        const expected = expectedSoft(state, e, e.ruolo, id)
        if (got > 0 && expected > 0) add(names.get(id) ?? id, { got, expected })
      }
    }
    if (m !== 'A' && Object.values(e.hard || {}).some((src) => Object.values(src || {}).some((v) => v > 0))) {
      for (const d of computeHardSummary(e, lang).dims) if (d.mediaTotale > 0) add(d.name, { got: d.mediaTotale, expected: HARD_EXPECTED })
    }
  }
  return new Map([...byKey.entries()].map(([k, t]) => [k, ratio(t)!]))
}

function groupValues(state: AssessmentState, lang: AssessmentLang, keyOf: (e: Employee) => string | undefined): Map<string, number> {
  const byKey = new Map<string, Totals>()
  for (const e of evaluatedEmployees(state)) {
    const t = personTotals(e, state, lang)
    const key = keyOf(e)
    if (!key || t.expected <= 0) continue
    byKey.set(key, addTotals(byKey.get(key) ?? { got: 0, expected: 0 }, t))
  }
  return new Map([...byKey.entries()].map(([k, t]) => [k, ratio(t)!]))
}

/**
 * I due dati dell'azienda, sulle persone valutate. `valore`: la stessa formula, con
 * le somme di tutti. `gapMedio`: la media dei gap di adeguatezza delle singole
 * persone (valore espresso − 100). `null` se nessuno ha niente di misurato.
 */
export function orgValue(state: AssessmentState, lang: AssessmentLang): { valore: number; gapMedio: number } | null {
  const totals = evaluatedEmployees(state)
    .map((e) => personTotals(e, state, lang))
    .filter((t) => t.expected > 0)
  if (!totals.length) return null
  const gaps = totals.map((t) => ratio(t)! - 100)
  return {
    valore: ratio(totals.reduce(addTotals))!,
    gapMedio: gaps.reduce((n, v) => n + v, 0) / gaps.length,
  }
}
