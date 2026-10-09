import type { GapState, Perception } from '@/modules/assessment/gestione5p/model'

// Lo skill gap è uno stato (CLAUDE.md cap. 7): token di stato, sempre con la
// parola. Il segno del numero porta il verso senza il colore.
export const GAP_TONE = { raggiunto: 'success', vicino: 'warning', 'da-sviluppare': 'destructive' } as const satisfies Record<GapState, 'success' | 'warning' | 'destructive'>
export const GAP_LABEL: Record<GapState, string> = { raggiunto: 'Livello raggiunto', vicino: 'Vicino al livello', 'da-sviluppare': 'Da sviluppare' }
export const PERCEPTION_LABEL: Record<Perception, string> = { allineata: 'Percezione allineata', sopravvaluta: 'Si sopravvaluta', sottovaluta: 'Si sottovaluta' }

export const fmtScore = (v: number | null | undefined) => (v == null ? '–' : String(v))
// Scarto con segno: + / − (meno vero) / ±0.
export const fmtSigned = (d: number | null | undefined) => (d == null ? '–' : d > 0 ? `+${d}` : d < 0 ? `−${Math.abs(d)}` : '±0')
