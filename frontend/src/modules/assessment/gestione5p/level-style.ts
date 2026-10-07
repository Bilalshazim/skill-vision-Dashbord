import type { SourceKey } from '@/modules/assessment/gestione5p/model'

// I cinque livelli del protocollo come toni del Badge: la fascia più bassa e la
// seconda sui toni di stato, la centrale neutra, la quarta di successo e la più
// alta neutra piena (non è uno stato: CLAUDE.md cap. 7). Sempre con la parola.
export const LEVEL_TONE = ['neutral', 'destructive', 'warning', 'neutral', 'success', 'strong'] as const
// Fondo delle celle di punteggio per livello (stessa regola, tenue).
export const LEVEL_CELL = ['', 'surface-danger', 'surface-warning', 'bg-muted', 'surface-success', 'border border-foreground bg-card font-semibold'] as const

// Le tre fonti si distinguono per lettera e per parola, il colore le accompagna.
export const SOURCE_LETTER: Record<SourceKey, string> = { DIR: 'D', PEER: 'P', AUTO: 'A' }
