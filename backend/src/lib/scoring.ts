// OD-5 (Blueprint §2.2 / decision sheet, "proceed now"): the existing AHI
// formula, ported UNCHANGED from
// frontend/src/modules/recruiting/lib/scoring.ts (`fitFC`/`affAB`/
// `redFlags`/`ahi`/`fasce`). Every constant, weight, and threshold below is
// copied verbatim from that file (which itself is a verbatim port of
// modules/recruiting.html ~2477-2520/2850) — do not "improve" the
// arithmetic here. tests/scoring.test.ts checks this produces the same
// numbers as the frontend for the same inputs.
import rolesSeed from '../data/roles-seed.json' with { type: 'json' }

export type SoftSkillLevel = 1 | 2 | 3

export const BF = ['Estroversione', 'Coscienziosità', 'Apertura', 'Amicalità', 'Stabilità emotiva'] as const

export const W: Record<SoftSkillLevel, { w: number; t: number }> = {
  1: { w: 1, t: 18 },
  2: { w: 2, t: 21 },
  3: { w: 3, t: 24 },
}

type RoleProfile = {
  flags: Record<string, SoftSkillLevel>
  bf: Record<string, number>
  bench: { name: string; role: string; apex: number; scores: Record<string, number> }
}

export const ROLES = rolesSeed as unknown as Record<string, RoleProfile>
export const DEFAULT_ROLE = 'Sales Account Manager'
export const DEFAULT_FLAGS: Record<string, SoftSkillLevel> = { ...ROLES[DEFAULT_ROLE]!.flags }

// Same minimal shape scoring.ts needs from a Candidate — this backend
// computes AHI from a CvMatchResult's own inputs, not the frontend's full
// Candidate type, so only these three fields are required here.
export type ScoringInput = {
  scores: Record<string, number>
  bf: Record<string, number>
  icv: number
}

export type RedFlag = { sk: string; s: number; t: number; hard: boolean }

export function redFlags(c: ScoringInput, flags: Record<string, SoftSkillLevel> = DEFAULT_FLAGS): RedFlag[] {
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

export function fitFC(c: ScoringInput, flags: Record<string, SoftSkillLevel> = DEFAULT_FLAGS): number {
  let num = 0
  let den = 0
  for (const [sk, lv] of Object.entries(flags)) {
    const { w, t } = W[lv]
    num += w * Math.min((c.scores[sk] || 0) / t, 1)
    den += w
  }
  return den ? (num / den) * 100 : 0
}

export function affAB(c: ScoringInput, role: string = DEFAULT_ROLE): number {
  const ideal = ROLES[role]!.bf
  let d = 0
  BF.forEach((k) => (d += Math.abs((c.bf[k] || 50) - (ideal[k] ?? 50))))
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

export function ahi(c: ScoringInput, role: string = DEFAULT_ROLE, flags: Record<string, SoftSkillLevel> = DEFAULT_FLAGS): AhiResult {
  const fc = fitFC(c, flags)
  const ab = affAB(c, role)
  const icv = c.icv
  let v = 0.55 * fc + 0.3 * ab + 0.15 * icv
  const rf = redFlags(c, flags).filter((r) => r.hard)
  const capped = rf.length > 0 && v > 59
  if (capped) v = 59
  return {
    v: Math.round(v * 10) / 10,
    fc: Math.round(fc * 10) / 10,
    ab: Math.round(ab * 10) / 10,
    icv,
    capped,
    rf: redFlags(c, flags),
  }
}

export type FasciaKey = 'excellent' | 'developable' | 'gap' | 'not-recommended'

export function fasce(v: number, capped: boolean): { key: FasciaKey; txt: string } {
  if (capped) return { key: 'not-recommended', txt: 'Sconsigliato per questo ruolo' }
  if (v >= 85) return { key: 'excellent', txt: 'Assumibile subito' }
  if (v >= 70) return { key: 'developable', txt: 'Assumibile con piano di sviluppo' }
  if (v >= 60) return { key: 'gap', txt: 'Gap strutturali: valutare' }
  return { key: 'not-recommended', txt: 'Sconsigliato per questo ruolo' }
}

// Prisma's Fascia enum is SCREAMING_SNAKE; this is the one seam between the
// ported frontend key format and the DB enum.
export function fasciaToDbEnum(key: FasciaKey): 'EXCELLENT' | 'DEVELOPABLE' | 'GAP' | 'NOT_RECOMMENDED' {
  switch (key) {
    case 'excellent':
      return 'EXCELLENT'
    case 'developable':
      return 'DEVELOPABLE'
    case 'gap':
      return 'GAP'
    case 'not-recommended':
      return 'NOT_RECOMMENDED'
  }
}
