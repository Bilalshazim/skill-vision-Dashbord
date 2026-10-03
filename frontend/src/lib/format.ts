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
