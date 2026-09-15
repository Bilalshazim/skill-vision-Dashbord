import { describe, expect, it } from 'vitest'

import { ahi, DEFAULT_FLAGS, fasce, W } from '../src/lib/scoring.js'

// OD-5 verification: src/lib/scoring.ts is a verbatim port of
// frontend/src/modules/recruiting/lib/scoring.ts (`fitFC`/`affAB`/
// `redFlags`/`ahi`/`fasce`), confirmed by direct line-by-line comparison —
// every constant/weight/threshold here is copied from that file (itself a
// verbatim port of modules/recruiting.html ~2477-2520/2850). These tests
// check the port's own internal correctness against hand-computed
// expectations for the exact DEFAULT_ROLE ('Sales Account Manager') data
// both sides share (src/data/roles-seed.json is a byte-for-byte copy of
// the frontend's own seed file).

describe('ahi (AHI formula, unchanged from the frontend)', () => {
  it('scores 100 when every input exactly meets its threshold/ideal', () => {
    // Every flagged skill's score set to exactly its own tier threshold
    // (t) -> fitFC = 100. bf identical to the role's ideal -> affAB = 100.
    // icv = 100. No red flags (scores meet threshold, not below it).
    const scores: Record<string, number> = {}
    for (const [sk, lvl] of Object.entries(DEFAULT_FLAGS)) scores[sk] = W[lvl].t
    const bf = { Estroversione: 75, Coscienziosità: 62, Apertura: 58, Amicalità: 55, 'Stabilità emotiva': 70 }

    const result = ahi({ scores, bf, icv: 100 })

    expect(result.fc).toBe(100)
    expect(result.ab).toBe(100)
    expect(result.icv).toBe(100)
    expect(result.capped).toBe(false)
    expect(result.rf).toHaveLength(0)
    // v = 0.55*100 + 0.30*100 + 0.15*100 = 100
    expect(result.v).toBe(100)
  })

  it('caps at exactly 59 when a hard red flag is present, even if the raw weighted score is much higher', () => {
    const scores: Record<string, number> = {}
    for (const [sk, lvl] of Object.entries(DEFAULT_FLAGS)) scores[sk] = W[lvl].t
    // "Comunicazione" is an essential (level 3, t=24) skill in the default
    // role's flags — dropping it to 10 is below 0.6*24=14.4, a HARD red flag.
    scores['Comunicazione'] = 10
    const bf = { Estroversione: 75, Coscienziosità: 62, Apertura: 58, Amicalità: 55, 'Stabilità emotiva': 70 }

    const result = ahi({ scores, bf, icv: 100 })

    expect(result.rf.some((r) => r.sk === 'Comunicazione' && r.hard)).toBe(true)
    expect(result.capped).toBe(true)
    // Uncapped this would be ~95.6 — the cap forces exactly 59, not "close to 59".
    expect(result.v).toBe(59)
  })

  it('flags a soft (not hard) red flag between 60% and 75% of threshold, and does not cap', () => {
    const scores: Record<string, number> = {}
    for (const [sk, lvl] of Object.entries(DEFAULT_FLAGS)) scores[sk] = W[lvl].t
    // 24 * 0.7 = 16.8 — between 0.6*24=14.4 (hard) and 0.75*24=18 (soft ceiling).
    scores['Comunicazione'] = 16.8
    const bf = { Estroversione: 75, Coscienziosità: 62, Apertura: 58, Amicalità: 55, 'Stabilità emotiva': 70 }

    const result = ahi({ scores, bf, icv: 100 })

    const flag = result.rf.find((r) => r.sk === 'Comunicazione')
    expect(flag?.hard).toBe(false)
    expect(result.capped).toBe(false)
  })

  it('affAB penalizes Big Five distance from the role ideal', () => {
    const scores: Record<string, number> = {}
    for (const [sk, lvl] of Object.entries(DEFAULT_FLAGS)) scores[sk] = W[lvl].t
    // Every dimension 20 points off the ideal -> ab = 100 - 20 = 80.
    const bf = { Estroversione: 55, Coscienziosità: 42, Apertura: 38, Amicalità: 35, 'Stabilità emotiva': 50 }

    const result = ahi({ scores, bf, icv: 100 })
    expect(result.ab).toBe(80)
  })
})

describe('fasce (tier thresholds, unchanged from the frontend)', () => {
  it.each([
    [90, false, 'excellent'],
    [85, false, 'excellent'],
    [84.9, false, 'developable'],
    [70, false, 'developable'],
    [69.9, false, 'gap'],
    [60, false, 'gap'],
    [59.9, false, 'not-recommended'],
    [95, true, 'not-recommended'], // capped always wins regardless of v
  ])('fasce(%s, capped=%s) -> %s', (v, capped, expectedKey) => {
    expect(fasce(v, capped).key).toBe(expectedKey)
  })
})
