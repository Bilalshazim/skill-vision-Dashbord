import type { BadgeTone } from '@/components/ui/badge'

// Dalle vecchie classi `.chip-*` di Assessment (ancora nei dati: fasce di
// performance, pesi delle competenze, soglie) al tono del Badge.
// La scala delle fasce resta di cinque toni distinti:
// top (gold) → strong, neutro pieno (la fascia più alta non è uno stato:
// CLAUDE.md cap. 7) · valorizzare (green) → success · adeguata (blue) →
// neutral, neutro tenue · sviluppo (amber) → warning · critica (red) →
// destructive. La parola accanto c'è sempre.
const TONES: Record<string, BadgeTone> = {
  'chip-gold': 'strong',
  'chip-green': 'success',
  'chip-blue': 'neutral',
  'chip-amber': 'warning',
  'chip-red': 'destructive',
  'chip-gray': 'neutral',
  // Scarto fra valutazioni (gapInterpretation / ccGapTag): la parola è
  // nell'etichetta (allineato, moderato, significativo).
  'gap-ok': 'success',
  'gap-warn': 'warning',
  'gap-bad': 'destructive',
}

export function chipTone(chipClass: string | undefined | null): BadgeTone {
  return (chipClass && TONES[chipClass]) || 'neutral'
}

// Dal colore delle ancore di livello (getLevelAnchors) al tono del Badge:
// la parola del livello c'è già (Non adeguato … Eccellente). Il livello più
// alto è neutro pieno, come la fascia più alta di performance.
const LEVEL_TONES: Record<string, BadgeTone> = {
  'var(--danger)': 'destructive',
  'var(--warning)': 'warning',
  'var(--primary)': 'neutral',
  'var(--success)': 'success',
  'var(--gold)': 'strong',
}
export function levelTone(color: string): BadgeTone {
  return LEVEL_TONES[color] || 'neutral'
}
