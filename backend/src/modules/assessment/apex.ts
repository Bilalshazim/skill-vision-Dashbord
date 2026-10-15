// Il riepilogo APEX 5D di un dipendente, calcolato sul server quando un
// valutatore esterno invia la sua valutazione. È lo stesso calcolo di
// computeHardSummary() del frontend (frontend/src/modules/assessment/lib/
// calculations.ts): media delle 5 voci per fonte, media delle 3 fonti per
// dimensione, media delle 5 dimensioni. Le due devono restare uguali.

export const APEX_DIMENSIONS = [
  { code: 'A', name: 'Professionalità' },
  { code: 'B', name: 'Performance' },
  { code: 'C', name: 'Predisposizione' },
  { code: 'D', name: 'Pensiero' },
  { code: 'E', name: 'Potenziale' },
] as const

/** Le 25 voci: A1…A5, B1…B5, … E1…E5. */
export const APEX_ITEM_CODES = APEX_DIMENSIONS.flatMap((d) => [1, 2, 3, 4, 5].map((n) => `${d.code}${n}`))

const SOURCES = ['resp', 'peer', 'auto'] as const
type Scores = Partial<Record<(typeof SOURCES)[number], Record<string, number>>>

const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
const round1 = (n: number) => Math.round(n * 10) / 10

export function apexSummary(hard: Scores) {
  const dims = APEX_DIMENSIONS.map((dim) => {
    const perSource = SOURCES.map((s) => round1(avg([1, 2, 3, 4, 5].map((n) => hard[s]?.[`${dim.code}${n}`] || 0))))
    return { code: dim.code, name: dim.name, score: round1(avg(perSource)) }
  })
  return { dims, apexScore: round1(avg(dims.map((d) => d.score))) }
}
