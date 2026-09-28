import type { BadgeTone } from '@/components/ui/badge'

// Dalle vecchie classi `.chip-*` di Assessment (ancora nei dati: fasce di
// performance, pesi delle competenze, soglie) al tono del Badge.
// La scala delle fasce resta di cinque toni distinti:
// top (gold) → accent · valorizzare (green) → success · adeguata (blue,
// che era la tinta lime) → neutral · sviluppo (amber) → warning ·
// critica (red) → destructive. La parola accanto c'è sempre.
const TONES: Record<string, BadgeTone> = {
  'chip-gold': 'accent',
  'chip-green': 'success',
  'chip-blue': 'neutral',
  'chip-amber': 'warning',
  'chip-red': 'destructive',
  'chip-gray': 'neutral',
}

export function chipTone(chipClass: string | undefined | null): BadgeTone {
  return (chipClass && TONES[chipClass]) || 'neutral'
}
