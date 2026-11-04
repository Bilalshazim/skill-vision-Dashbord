import assert from 'node:assert/strict'
import { test } from 'node:test'

import { annualize, blockingProblems } from './checks.ts'
import { toNum, readRows, parseCsv } from './importer.ts'
import { model, type RoiState } from './model.ts'
import { SCEN, scenOverrides } from './scenarios.ts'

// Gli stessi valori di riferimento dei test del motore ROI
// (Skill-Vision-ROI, tests/unit/model.test.js): se una formula diverge da
// roi.skill-vision.it, questo test fallisce.
const SAMPLE: RoiState = {
  N: 169, nVal: 169, inv: 31000, invAz: 0,
  comp: 78, gap: 4.3, cov: 83, posPrev: 0, turn: 2.4, ass: 3.5,
  ric: 24103607, vdp: 25619746, costiProd: 20257407, cp: 7179874, sal: 5111582,
  amm: 1554454, acc: 100000, ebit: 5362339, ebitda: 7016793, un: 3630538, ante: 4938350, imposte: 1307812,
  conv: 'gest', base: 'hcva',
  el: 50, r1: 70, cs: 50, r2: 20, qa: 60, r3: 15, l4on: 0, posVac: 0, gg: 45, r4: 20,
}
const close = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} ≉ ${b}`)

test('ricostruzione contabile, come nel motore', () => {
  const m = model(SAMPLE)
  assert.equal(m.EBIT, 5362339)
  assert.equal(m.EBITDA, 7016793)
  assert.equal(m.HCVA, 5362339 + 7179874)
  assert.equal(m.VA, 7016793 + 7179874)
  close(m.taxRate, 1307812 / 4938350)
})

test('leve, ROI e rientro nello scenario base, come nel motore', () => {
  const m = model(SAMPLE)
  close(m.gapVal, 12542213 * 0.043)
  close(m.l1, 12542213 * 0.043 * 0.5 * 0.7)
  close(m.turnVal, 5111582 * 0.024 * 0.5)
  close(m.l2, 5111582 * 0.024 * 0.5 * 0.2)
  close(m.assVal, 7179874 * 0.035 * 0.6)
  close(m.l3, 7179874 * 0.035 * 0.6 * 0.15)
  assert.equal(m.l4, 0)
  close(m.benefit, m.l1 + m.l2 + m.l3)
  close(m.roi, 621.4345, 1e-5)
  close(m.roiCost, 12.5303, 1e-4)
  assert.ok(m.payback > 1.66 && m.payback < 1.67)
})

test('gli scenari cambiano solo le ipotesi', () => {
  const [prud, base, espa] = SCEN.map((x) => model(SAMPLE, scenOverrides(x)))
  assert.ok(prud.benefit < base.benefit && base.benefit < espa.benefit)
  assert.equal(prud.pool, espa.pool)
  close(base.benefit, model(SAMPLE).benefit)
})

test('un esercizio di 6 mesi si riporta all’anno; di 12 resta com’è', () => {
  const six = annualize({ vdp: 100, cp: 40, roce: 30 }, 6)
  assert.equal(six.vdp, 200)
  assert.equal(six.cp, 80)
  assert.equal(six.roce, 30)
  assert.deepEqual(annualize({ vdp: 100 }, 12), { vdp: 100 })
})

test('senza i dati essenziali il calcolo si ferma', () => {
  const s = { ...SAMPLE, cp: 0, inv: 0 }
  assert.match(blockingProblems(s, model(s))[0], /costo del personale, corrispettivo/)
  assert.deepEqual(blockingProblems(SAMPLE, model(SAMPLE)), [])
})

test('lettura del bilancio: formato italiano e prima cifra a destra', () => {
  assert.equal(toNum('25.619.746'), 25619746)
  assert.equal(toNum('4,3'), 4.3)
  const { values, seen } = readRows(parseCsv('Totale valore della produzione;A;25.619.746\nCosto del personale;B9;7.179.874\nDurata esercizio;6\nAltro;1'))
  assert.equal(values.vdp, 25619746)
  assert.equal(values.cp, 7179874)
  assert.equal(values.mesi, 6)
  assert.equal(seen.length, 3)
})
