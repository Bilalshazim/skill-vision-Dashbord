import type { BandTone } from '@/components/patterns/BandCard'
import type { DistributionTone } from '@/components/patterns/DistributionBar'
import { quadDefs, tierRange } from '@/modules/assessment/lib/calculations'
import { fmt1it, type AssessmentLang, type getUI } from '@/modules/assessment/lib/legacy-utils'

type UI = ReturnType<typeof getUI>

// Le cinque fasce di performance come si mostrano: una classificazione sola
// (CLAUDE.md, Fase 5). Le soglie sono quelle di TIER_DEFS (tierFor), i nomi
// quelli delle fasce ("Alto Valore", "Alto Potenziale", "Nella Norma", "Da
// Potenziare", "Critici", cap. 7). I tre livelli "Ottimale / Moderato /
// Critico" della vecchia Home erano un raggruppamento delle stesse fasce
// (Ottimale = Alto Valore + Alto Potenziale, Moderato = Nella Norma, Critico =
// Da Potenziare + Critici: homeStats) e sono tolti.
export const TIER_ORDER = ['top', 'valorizzare', 'adeguata', 'sviluppo', 'critica'] as const
export type TierKey = (typeof TIER_ORDER)[number]

// La fascia più alta non è uno stato: neutra piena; "nella norma" neutra
// tenue; le altre sui toni di stato. La parola sta sempre accanto al colore.
export const TIER_BAND_TONE: Record<TierKey, BandTone> = { top: 'strong', valorizzare: 'success', adeguata: 'neutral', sviluppo: 'warning', critica: 'destructive' }
export const TIER_DIST_TONE: Record<TierKey, DistributionTone> = { top: 'neutral', valorizzare: 'success', adeguata: 'muted', sviluppo: 'warning', critica: 'destructive' }
export const TIER_COLORS: Record<TierKey, string> = {
  top: 'var(--foreground)',
  valorizzare: 'var(--success)',
  adeguata: 'var(--chart-compare)',
  sviluppo: 'var(--warning)',
  critica: 'var(--destructive)',
}

export function tierLabels(ui: UI): Record<TierKey, string> {
  return Object.fromEntries(quadDefs(ui).map((q) => [q.key, q.label])) as Record<TierKey, string>
}

/** Cosa significa la fascia e la sua soglia, su 10: "Pronti a crescere. Punteggio complessivo da 7,0 a meno di 8,3 su 10". */
export function tierDescription(key: TierKey, ui: UI, lang: AssessmentLang): string {
  const caption = quadDefs(ui).find((q) => q.key === key)?.caption
  const r = tierRange(key, lang)
  const threshold = ui.bandThreshold(fmt1it(r.min), r.max == null ? null : fmt1it(r.max))
  return caption ? `${caption}. ${threshold}` : threshold
}
