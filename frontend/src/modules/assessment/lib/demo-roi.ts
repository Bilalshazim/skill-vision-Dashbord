import type { RoiData } from '@/lib/api/assessment'

// Il bilancio dimostrativo della società demo (correzioni del 2026-11-09, «Gli euro
// nella demo»): cifre inventate, dichiarate tali a schermo («Dati dimostrativi» e il
// nome del file). Si carica da solo sulla società demo (lib/use-roi.ts), oppure dagli
// strumenti demo dell'amministrazione. Mai sulle società vere, mai con il seed.
export const DEMO_STATEMENT: Record<string, number> = { ric: 9400000, vdp: 9650000, costiProd: 8700000, cp: 2100000, sal: 1520000, amm: 310000, acc: 40000, ebit: 950000, ebitda: 1300000, un: 610000, ante: 870000, imposte: 260000 }
export const DEMO_MANUAL = { inv: 18000, turn: 6, ass: 4.5 }

export function demoRoiData(fileName: string): RoiData {
  return { statement: DEMO_STATEMENT, months: 12, fileName, loadedAt: new Date().toISOString(), ...DEMO_MANUAL }
}
