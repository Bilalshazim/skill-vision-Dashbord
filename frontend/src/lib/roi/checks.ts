import type { RoiModel, RoiState } from './model.ts'

// I controlli del motore ROI che fermano il calcolo (repository Skill-Vision-ROI,
// core/validate.js, livello "bad"), con gli stessi testi: senza questi dati il
// motore non produce un risultato, e la dashboard non mostra una cifra. Gli
// avvisi di quadratura del bilancio restano nel motore, dove si controlla il file.
export function blockingProblems(s: RoiState, m: RoiModel): string[] {
  const out: string[] = []
  const miss: string[] = []
  if (!(s.N > 0)) miss.push('numero dipendenti')
  if (!(s.vdp > 0)) miss.push('valore della produzione')
  if (!(s.costiProd > 0)) miss.push('totale costi della produzione')
  if (!(s.cp > 0)) miss.push('costo del personale')
  if (!(s.inv > 0)) miss.push('corrispettivo dell’assessment')
  if (miss.length) out.push('Dati essenziali mancanti: ' + miss.join(', ') + '.')
  if (s.cp > 0 && s.vdp > 0 && s.cp > s.vdp) out.push('Il costo del personale supera il valore della produzione: verifica le voci o l’unità di misura.')
  if (s.sal > 0 && s.cp > 0 && s.sal > s.cp) out.push('Salari e stipendi superano il costo del personale: le due voci sono invertite o in unità diverse.')
  if (m.hasAB && s.cp > 0 && m.HCVA <= 0) out.push('L’HCVA è negativo o nullo: il capitale umano non genera valore aggiunto positivo e la leva di produttività non è applicabile.')
  const ranges: [keyof RoiState, string, number, number][] = [
    ['comp', 'Valore competenze', 0, 100],
    ['cov', 'Copertura ruoli', 0, 100],
    ['turn', 'Turnover', 0, 100],
    ['ass', 'Assenteismo', 0, 50],
    ['gap', 'GAP', 0, 50],
  ]
  for (const [k, label, lo, hi] of ranges) {
    const v = Number(s[k])
    if (v < lo || v > hi) out.push(`${label} fuori dall’intervallo ammesso (${lo}–${hi}).`)
  }
  if (m.atteso > 100) out.push('Valore competenze + GAP supera 100: i due dati non sono sulla stessa scala.')
  return out
}

/** Le voci di bilancio che scorrono nell'anno: un esercizio di durata diversa da 12 mesi si riporta all'anno. */
export const FLOW_KEYS = ['ric', 'vdp', 'costiProd', 'cp', 'sal', 'amm', 'acc', 'ebit', 'ebitda', 'un', 'ante', 'imposte'] as const

/** Riporta le voci all'anno. Mai un periodo parziale usato come annuo (CLAUDE.md, Fase 6). */
export function annualize(statement: Record<string, number>, months: number): Record<string, number> {
  const f = months > 0 ? 12 / months : 1
  const out = { ...statement }
  for (const k of FLOW_KEYS) if (out[k] != null) out[k] = out[k] * f
  return out
}
