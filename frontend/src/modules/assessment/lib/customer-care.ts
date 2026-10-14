import { CSV_TYPE, downloadText } from '@/lib/download'
import { fmtDec } from '@/lib/format'
import { avg, fmt1csv, round1 } from '@/modules/assessment/lib/legacy-utils'
import { hashSeed, seedRandom } from '@/modules/assessment/lib/seeded-random'
import type { Employee } from '@/modules/assessment/lib/types'

// Il modello della pagina Customer Care, tolto dalla pagina così com'era
// (js/assessment.js ~7602-7690, ccHashId()/customerCareModel()): un modello
// illustrativo con seme per persona — ticket, tempo di prima risposta, CSAT,
// risoluzione e le 5 competenze di Customer Care. Stesse formule, stesso
// seme. La pagina lo dice (ui.ccDemoNote): non sono dati di un help desk.

export const CC_COMPETENCY_IDS = ['so2', 'so3', 'in1', 'ps8', 'ps2']
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

export type GapTag = 'gap-ok' | 'gap-warn' | 'gap-bad'

/** Scarto di una competenza dall'atteso: in linea fino a −0,3, da seguire fino a −1,5. */
export function ccGapTag(obtained: number, expected: number): GapTag {
  const g = obtained - expected
  if (g >= -0.3) return 'gap-ok'
  if (g >= -1.5) return 'gap-warn'
  return 'gap-bad'
}

/** Variazione di un indicatore fra due periodi: verso (migliora, peggiora, stabile) e ampiezza scritta. */
export function ccDeltaBadge(cur: number, prev: number, opts: { eps?: number; lowerIsBetter?: boolean; dec?: number; unit?: string } = {}) {
  const d = round1(cur - prev)
  const cls = Math.abs(d) < (opts.eps ?? 0.05) ? 'flat' : (opts.lowerIsBetter ? d < 0 : d > 0) ? 'up' : 'down'
  const mag = fmtDec(Math.abs(d), opts.dec == null ? 1 : opts.dec) + (opts.unit || '')
  return { cls, mag }
}

export function customerCareModel(employees: Employee[], ui: { ccWeekPrefix: string }) {
  // «Customer Service» resta per i dati demo salvati prima della traduzione.
  let agents = employees.filter((e) => e.area === 'Assistenza clienti' || e.area === 'Customer Service')
  if (agents.length < 2) agents = [...employees].slice(0, 6)
  agents = [...agents].sort((a, b) => a.cognome.localeCompare(b.cognome))

  const rows = agents.map((a) => {
    const r = seedRandom(hashSeed(a.id))
    const tickets = Math.round(60 + r() * 170)
    const frt = round1(6 + r() * 30)
    const frtPrev = round1(clamp(frt + (r() * 8 - 3.2), 4, 48))
    const csat = Math.round(clamp(78 + r() * 20, 60, 100))
    const csatPrev = Math.round(clamp(csat + (r() * 10 - 5.5), 60, 100))
    const resolution = Math.round(clamp(84 + r() * 14, 70, 100))
    const comps = CC_COMPETENCY_IDS.map((id) => {
      const s = (a.soft && a.soft[id]) || { ottenuto: round1(5 + r() * 3.4), atteso: 7 }
      return { id, ottenuto: round1(s.ottenuto || 0), atteso: round1(s.atteso || 7) }
    })
    const compOtt = round1(avg(comps.map((c) => c.ottenuto)))
    const compAtt = round1(avg(comps.map((c) => c.atteso)))
    const matchPct = Math.round(clamp(compAtt ? (compOtt / compAtt) * 100 : 0, 0, 145))
    return { emp: a, tickets, frt, frtPrev, csat, csatPrev, resolution, comps, compOtt, compAtt, matchPct }
  })

  const org = {
    frt: round1(avg(rows.map((r) => r.frt))),
    frtPrev: round1(avg(rows.map((r) => r.frtPrev))),
    csat: round1(avg(rows.map((r) => r.csat))),
    csatPrev: round1(avg(rows.map((r) => r.csatPrev))),
    volume: rows.reduce((s, r) => s + r.tickets, 0),
    match: round1(avg(rows.map((r) => r.matchPct))),
  }

  const tr = seedRandom(hashSeed('cc-trend-v1'))
  const weeks: string[] = []
  const csatSeries: number[] = []
  const resolvedSeries: number[] = []
  let csatWalk = org.csat - 3.5
  const weeklyBase = org.volume / 4
  for (let i = 0; i < 8; i++) {
    weeks.push(`${ui.ccWeekPrefix} ${i + 1}`)
    csatWalk = clamp(csatWalk + (tr() * 2.6 - 1.0), 70, 99)
    csatSeries.push(round1(csatWalk))
    resolvedSeries.push(Math.round(weeklyBase * (0.82 + tr() * 0.3)))
  }

  return { rows, org, weeks, csatSeries, resolvedSeries }
}

export type CustomerCareModel = ReturnType<typeof customerCareModel>

export function exportCustomerCareCsv(model: CustomerCareModel, competencyName: (id: string) => string) {
  const head = ['Agent', 'Ruolo', 'Ticket', 'FRT_min', 'CSAT_%', 'Resolution_%', 'Match_%', ...CC_COMPETENCY_IDS.map(competencyName)]
  let csv = head.join(';') + '\n'
  model.rows.forEach((r) => {
    csv += [`${r.emp.cognome} ${r.emp.nome}`, r.emp.ruolo, r.tickets, fmt1csv(r.frt), Math.round(r.csat), Math.round(r.resolution), r.matchPct, ...r.comps.map((c) => fmt1csv(c.ottenuto))].join(';') + '\n'
  })
  downloadText('customer_care_logic.csv', csv, CSV_TYPE)
}
