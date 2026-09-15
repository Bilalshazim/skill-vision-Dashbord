import { BF, DEFAULT_FLAGS, DEFAULT_ROLE, ROLES, W } from '@/modules/recruiting/lib/constants'
import type { Candidate } from '@/modules/recruiting/lib/types'

// Ported verbatim from modules/recruiting.html (fitFC/affAB/redFlags/ahi/
// ranking/pendingCandidates, lines ~2477-2520). Only the variable capture
// changed (legacy reads the bare globals `flags`/`currentRole`; this takes
// them as parameters, fixed to DEFAULT_FLAGS/DEFAULT_ROLE for the Home-only
// migration — see constants.ts for why that matches the legacy boot value).
// The arithmetic is untouched — do not "improve" it here.

export type RedFlag = { sk: string; s: number; t: number; hard: boolean }

export function redFlags(c: Candidate, flags = DEFAULT_FLAGS): RedFlag[] {
  const out: RedFlag[] = []
  for (const [sk, lv] of Object.entries(flags)) {
    if (lv === 3) {
      const s = c.scores[sk] || 0
      const t = W[3].t
      if (s < 0.6 * t) out.push({ sk, s, t, hard: true })
      else if (s < 0.75 * t) out.push({ sk, s, t, hard: false })
    }
  }
  return out
}

export function fitFC(c: Candidate, flags = DEFAULT_FLAGS): number {
  let num = 0
  let den = 0
  for (const [sk, lv] of Object.entries(flags)) {
    const { w, t } = W[lv]
    num += w * Math.min((c.scores[sk] || 0) / t, 1)
    den += w
  }
  return den ? (num / den) * 100 : 0
}

export function affAB(c: Candidate, role = DEFAULT_ROLE): number {
  const ideal = ROLES[role].bf
  let d = 0
  BF.forEach((k) => (d += Math.abs((c.bf[k] || 50) - ideal[k])))
  return Math.max(0, 100 - d / BF.length)
}

export type AhiResult = {
  v: number
  fc: number
  ab: number
  icv: number
  capped: boolean
  rf: RedFlag[]
}

export function ahi(c: Candidate): AhiResult {
  const fc = fitFC(c)
  const ab = affAB(c)
  const icv = c.icv
  let v = 0.55 * fc + 0.3 * ab + 0.15 * icv
  const rf = redFlags(c).filter((r) => r.hard)
  const capped = rf.length > 0 && v > 59
  if (capped) v = 59
  return {
    v: Math.round(v * 10) / 10,
    fc: Math.round(fc * 10) / 10,
    ab: Math.round(ab * 10) / 10,
    icv,
    capped,
    rf: redFlags(c),
  }
}

/** "Chi è il candidato migliore?" only ever ranks candidates who actually
 *  completed the soft-skill test (testCompleted !== false — legacy/import
 *  records have no such field and count as completed). */
export function ranking(candidates: Candidate[]): { c: Candidate; r: AhiResult }[] {
  return candidates
    .filter((c) => c.testCompleted !== false)
    .map((c) => ({ c, r: ahi(c) }))
    .sort((a, b) => b.r.v - a.r.v)
}

export function pendingCandidates(candidates: Candidate[]): Candidate[] {
  return candidates
    .filter((c) => c.testCompleted === false)
    .slice()
    .sort((a, b) => (b.icv || 0) - (a.icv || 0))
}

export type Fascia = { key: 'excellent' | 'developable' | 'gap' | 'not-recommended'; txt: string }

// Ported verbatim from modules/recruiting.html fasce() (line ~2850). Home
// (Phase 4) only needed the bucket thresholds inline; Ranking (Phase 5)
// needs the same thresholds AND the exact label text per band, so this adds
// fasce() to the shared module rather than duplicating the 85/70/60
// thresholds a second time in a Ranking-only file. Same thresholds as the
// Home quality-distribution buckets — not a coincidence, both read the same
// severity scale; kept in one place now. Legacy returned a CSS color string
// per band (`cl: 'var(--green)'` etc.) — the `key` here is that same
// severity band, consumed by React components via the success/warning/
// destructive tokens rather than an embedded color value.
export type SkillTierSums = {
  essential: { sum: number; pct: number; count: number }
  important: { sum: number; pct: number; count: number }
  useful: { sum: number; pct: number; count: number }
  total: { sum: number; pct: number; count: number }
}

// Ported verbatim from the inline computation inside renderRanking()
// (modules/recruiting.html lines ~2870-2885) — raw point sums per flag tier
// (each flagged skill 0-31 points), normalized to % of that tier's own
// achievable max (count * 31) so the four boxes read on a consistent scale.
export function skillTierSums(c: Candidate, flags = DEFAULT_FLAGS): SkillTierSums {
  const entries = Object.entries(flags)
  const sE = entries.filter(([, l]) => l === 3).reduce((a, [sk]) => a + (c.scores[sk] || 0), 0)
  const sI = entries.filter(([, l]) => l === 2).reduce((a, [sk]) => a + (c.scores[sk] || 0), 0)
  const sU = entries.filter(([, l]) => l === 1).reduce((a, [sk]) => a + (c.scores[sk] || 0), 0)
  const sT = sE + sI + sU
  const essCount = Object.values(flags).filter((l) => l === 3).length
  const impCount = Object.values(flags).filter((l) => l === 2).length
  const usfCount = Object.values(flags).filter((l) => l === 1).length
  const totCount = essCount + impCount + usfCount
  return {
    essential: { sum: sE, pct: essCount ? (sE / (essCount * 31)) * 100 : 0, count: essCount },
    important: { sum: sI, pct: impCount ? (sI / (impCount * 31)) * 100 : 0, count: impCount },
    useful: { sum: sU, pct: usfCount ? (sU / (usfCount * 31)) * 100 : 0, count: usfCount },
    total: { sum: sT, pct: totCount ? (sT / (totCount * 31)) * 100 : 0, count: totCount },
  }
}

// Ported verbatim from modules/recruiting.html ci() (lines ~2521-2531) —
// "compatibilità interna vs benchmark": how close a candidate's flagged
// skills are to the role's benchmark employee, on a 0-100 scale. Used by
// exportOneJSON() (Phase 6 — per-candidate JSON export) and nowhere else
// in Home/Ranking, which is why it wasn't ported until now.
export function ci(c: Candidate, role = DEFAULT_ROLE, flags = DEFAULT_FLAGS): number {
  const b = ROLES[role].bench
  let num = 0
  let den = 0
  for (const [sk, lv] of Object.entries(flags)) {
    const w = W[lv].w
    const bs = b.scores[sk] !== undefined ? b.scores[sk] : 21
    num += w * Math.abs((c.scores[sk] || 0) - bs)
    den += w * 31
  }
  return den ? Math.round((100 - (num / den) * 100) * 10) / 10 : 0
}

// Ported verbatim from `window.INTERNAL_TALENTS` (modules/recruiting.html
// ~4890-4895) for Phase 14 (Partita Interna). NOT a real, separate employee
// database — confirmed by reading the full definition: it is a synthetic
// re-labeling of the first 5 real CANDIDATES records (`id:'it'+(i+1)`,
// `name` suffixed " [INTERNAL]", a fixed `src`, `isInternalTalent:true`),
// regenerated fresh from whatever CANDIDATES currently holds. No separate
// storage key, no upload/import path feeds it. Reproduced exactly as this
// derivation, not as new fabricated data — the "employee" that appears in
// Partita Interna IS one of the same candidate records, same scores/bf.
export function getInternalTalents(candidates: Candidate[]): Candidate[] {
  return candidates.slice(0, 5).map((c, i) => ({
    ...c,
    id: `it${i + 1}`,
    name: `${c.name} [INTERNAL]`,
    src: 'Internal Talent · dipendente in ruolo',
    role: c.role,
    isInternalTalent: true,
  }))
}

export function fasce(v: number, capped: boolean): Fascia {
  if (capped) return { key: 'not-recommended', txt: 'Sconsigliato per questo ruolo' }
  if (v >= 85) return { key: 'excellent', txt: 'Assumibile subito' }
  if (v >= 70) return { key: 'developable', txt: 'Assumibile con piano di sviluppo' }
  if (v >= 60) return { key: 'gap', txt: 'Gap strutturali: valutare' }
  return { key: 'not-recommended', txt: 'Sconsigliato per questo ruolo' }
}
