// Ported verbatim from modules/recruiting.html fmtIT100()/fmtITpct()
// (lines ~2848-2849) — Italian-locale decimal comma formatting, unchanged.
export function fmtIT100(n: number): string {
  return (Math.round((n || 0) * 10) / 10).toFixed(1).replace('.', ',') + '/100'
}

export function fmtITpct(n: number): string {
  return (Math.round((n || 0) * 10) / 10).toFixed(1).replace('.', ',') + '%'
}

// L'origine del candidato a schermo. «Excel import · …» è il valore salvato
// nei dati importati: si traduce solo nella visualizzazione, il dato resta.
export function sourceLabel(src: string | undefined): string {
  return (src ?? '').replace(/^Excel import ·/, 'Importato da Excel ·')
}
