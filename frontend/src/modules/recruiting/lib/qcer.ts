import type { JdItemTool, JdQcer } from '@/modules/recruiting/lib/jd-types'

// Le lingue del Profilo candidato sul Quadro comune europeo (QCER), richiesta di Roberto del
// 2026-11-19: per ogni lingua il livello desiderato in tre dimensioni (comprensione, parlato,
// scritto), sui sei livelli ufficiali, e la certificazione di riferimento per le lingue che ne
// hanno una propria.

export const QCER_LEVELS = [
  { code: 'A1', name: 'Principiante', desc: 'Comprende e utilizza espressioni molto semplici.' },
  { code: 'A2', name: 'Elementare', desc: 'Comunica in situazioni quotidiane semplici.' },
  { code: 'B1', name: 'Intermedio', desc: 'Sostiene conversazioni su argomenti familiari e lavorativi comuni.' },
  { code: 'B2', name: 'Intermedio avanzato', desc: 'Comunica con buona autonomia anche in ambito professionale.' },
  { code: 'C1', name: 'Avanzato', desc: 'Utilizza la lingua con scioltezza in contesti professionali complessi.' },
  { code: 'C2', name: 'Padronanza', desc: 'Comprende praticamente tutto e si esprime con grande precisione.' },
] as const

export const QCER_DIMS = [
  { key: 'comprensione', label: 'Comprensione' },
  { key: 'parlato', label: 'Parlato' },
  { key: 'scritto', label: 'Scritto' },
] as const satisfies readonly { key: keyof JdQcer; label: string }[]

/** Le lingue con una certificazione propria, al posto di quelle sul QCER. */
export const LANGUAGE_CERTIFICATIONS: Record<string, string> = {
  'Cinese mandarino': 'HSK',
  Giapponese: 'JLPT',
  Coreano: 'TOPIK',
  Russo: 'TORFL / TRKI',
  Arabo: 'Diverse certificazioni',
  Hindi: 'Diverse certificazioni',
}

/** Le lingue proposte nella scheda: le generiche e quelle con certificazione propria. */
export const QCER_LANGUAGES = ['Italiano', 'Inglese', 'Francese', 'Spagnolo', 'Tedesco', ...Object.keys(LANGUAGE_CERTIFICATIONS)]

export const certificationFor = (label: string) => LANGUAGE_CERTIFICATIONS[label.trim()] ?? null

// Le schede salvate prima avevano un livello solo (Base · Intermedio · Avanzato · Madrelingua):
// si legge come lo stesso livello nelle tre dimensioni, finché non si cambia.
const OLD_LEVEL: Record<string, string> = { Base: 'A2', Intermedio: 'B1', Avanzato: 'C1', Madrelingua: 'C2' }
const EMPTY: JdQcer = { comprensione: '', parlato: '', scritto: '' }

export function qcerOf(item: JdItemTool): JdQcer {
  if (item.qcer) return item.qcer
  const lv = OLD_LEVEL[item.level]
  return lv ? { comprensione: lv, parlato: lv, scritto: lv } : EMPTY
}

/** Il livello riassuntivo che leggono le parti che conoscono un livello solo: «Non richiesto» se vuoto. */
export const summaryLevel = (q: JdQcer) => (q.comprensione || q.parlato || q.scritto ? 'QCER' : 'Non richiesto')

export const isRequired = (item: JdItemTool) => {
  const q = qcerOf(item)
  return !!(q.comprensione || q.parlato || q.scritto)
}

/** «Comprensione B2 · Parlato B1 · Scritto B1»: le sole dimensioni scelte. */
export function qcerText(q: JdQcer) {
  return QCER_DIMS.filter((d) => q[d.key])
    .map((d) => `${d.label} ${q[d.key]}`)
    .join(' · ')
}
