const IT_MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

// "Ultimi 6 mesi" — the concept's own framing (its example spans Apr–Set,
// i.e. the 6 months ending on the current one) — real calendar months
// from today, not a fixed illustrative Gen–Giu range.
export function lastSixMonthLabels(): string[] {
  const now = new Date()
  const labels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    labels.push(IT_MONTHS[d.getMonth()])
  }
  return labels
}
