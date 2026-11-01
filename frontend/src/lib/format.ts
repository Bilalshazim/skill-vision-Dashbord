// Numeri a schermo in italiano: virgola decimale e un numero fisso di
// decimali (uno di default), così le colonne si allineano. Le esportazioni
// CSV non passano da qui: tengono il punto, come prima.
const formatters = new Map<number, Intl.NumberFormat>()

export function fmtDec(n: number, digits = 1): string {
  if (!isFinite(n)) return '–'
  let f = formatters.get(digits)
  if (!f) {
    f = new Intl.NumberFormat('it-IT', { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false })
    formatters.set(digits, f)
  }
  return f.format(n)
}

/**
 * Un valore già scritto ("6,0", "17%", "12.345", 42) scomposto per
 * AnimatedNumber; null se non è un numero da solo ("—", "3/5", "in attesa").
 * `grouping` dice se il testo separava le migliaia, per riscriverlo uguale.
 */
export function parseDisplayedNumber(value: unknown): { value: number; decimals: number; suffix: string; grouping: boolean } | null {
  if (typeof value === 'number') return Number.isFinite(value) && Number.isInteger(value) ? { value, decimals: 0, suffix: '', grouping: true } : null
  if (typeof value !== 'string') return null
  const m = /^(-?)(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?(\s?%)?$/.exec(value.trim())
  if (!m) return null
  return {
    value: Number(`${m[1]}${m[2].replace(/\./g, '')}.${m[3] ?? '0'}`),
    decimals: m[3]?.length ?? 0,
    suffix: m[4] ?? '',
    grouping: m[2].includes('.'),
  }
}
