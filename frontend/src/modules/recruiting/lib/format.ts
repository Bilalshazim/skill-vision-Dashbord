import { fmtDec } from '@/lib/format'

// I punteggi del metodo (AHI, FC, AB, ICV, CI, risultato del test) si
// calcolano e si salvano su 100, con le soglie del codice (85 / 70 / 60). A
// schermo si leggono su 10, con un decimale: 85 → "8,5 /10" (DECISIONI,
// "Punteggi di Recruiting su 10"). Il decimale si tronca, non si arrotonda:
// 84,9 resta 8,4, così il numero letto non scavalca mai la soglia della sua
// fascia ("da 8,5"). `unit: false` per il solo numero.
export function fmtScore10(n100: number | null | undefined, unit = true): string {
  if (n100 == null || !Number.isFinite(n100)) return '–'
  const s = fmtDec(Math.floor(n100 + 1e-9) / 10)
  return unit ? `${s} /10` : s
}

// Ported verbatim from modules/recruiting.html fmtITpct() (~2849) —
// Italian-locale decimal comma formatting, unchanged.

export function fmtITpct(n: number): string {
  return (Math.round((n || 0) * 10) / 10).toFixed(1).replace('.', ',') + '%'
}

// L'origine del candidato a schermo. «Excel import · …» è il valore salvato
// nei dati importati: si traduce solo nella visualizzazione, il dato resta.
export function sourceLabel(src: string | undefined): string {
  return (src ?? '').replace(/^Excel import ·/, 'Importato da Excel ·')
}
