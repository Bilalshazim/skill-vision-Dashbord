// I colori delle serie di un grafico, dalle regole della Fase 5 (CLAUDE.md):
// una serie → `chart-mono`; una serie più un riferimento (atteso,
// benchmark) → `chart-mono` e `muted-foreground`; tre o più serie → la
// famiglia categorica `chart-1…6` nell'ordine dato, con il riferimento che
// resta `muted-foreground`. Il lime non entra nella famiglia categorica.
export function seriesColors(series: readonly { reference?: boolean }[]): string[] {
  const primaries = series.filter((s) => !s.reference)
  // Due serie senza un riferimento dichiarato: la seconda è il confronto.
  const pairNoRef = series.length === 2 && primaries.length === 2
  let n = 0
  return series.map((s, i) => {
    if (s.reference) return 'var(--muted-foreground)'
    if (pairNoRef) return i === 0 ? 'var(--chart-mono)' : 'var(--muted-foreground)'
    if (primaries.length === 1) return 'var(--chart-mono)'
    return `var(--chart-${(n++ % 6) + 1})`
  })
}
