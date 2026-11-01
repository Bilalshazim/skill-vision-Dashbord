// I colori delle serie di un grafico, dalle regole della Fase 5 (CLAUDE.md,
// riviste il 2026-10-26; fondamenta, "Ruolo nel grafico"): i dati in
// inchiostro (`chart-mono`); un riferimento (atteso, benchmark) in
// `chart-reference`, tratteggiato da chi lo disegna; due serie di dati vere
// → inchiostro per la prima e `chart-1` (petrolio) per l'altra; tre o più →
// la famiglia categorica `chart-1…6` nell'ordine dato. Il lime non entra
// qui: segna un solo valore per grafico (`chart-highlight`), lo sceglie chi
// usa il grafico. `chart-compare` resta solo per "nella norma" in una
// distribuzione.
export function seriesColors(series: readonly { reference?: boolean }[]): string[] {
  const primaries = series.filter((s) => !s.reference)
  let n = 0
  return series.map((s) => {
    if (s.reference) return 'var(--chart-reference)'
    if (primaries.length === 1) return 'var(--chart-mono)'
    if (primaries.length === 2) return n++ === 0 ? 'var(--chart-mono)' : 'var(--chart-1)'
    return `var(--chart-${(n++ % 6) + 1})`
  })
}
