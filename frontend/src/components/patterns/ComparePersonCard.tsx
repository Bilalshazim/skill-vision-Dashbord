import type { ReactNode } from 'react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Una persona del confronto a due (tavola «Confronto a 2»): le iniziali nel colore
// della persona, nome, mansione e posizione rispetto al ruolo, la forma con cui
// compare nei grafici scritta a parole (cerchio o rombo: si distingue anche senza il
// colore) e l'azione per cambiarla. Clic sul nome: resta in evidenza.
export function ComparePersonCard({
  initials,
  name,
  meta,
  color,
  shape,
  shapeLabel,
  dimmed = false,
  pressed = false,
  onFocus,
  action,
}: {
  initials: string
  name: string
  meta: string
  color: string
  shape: 'circle' | 'diamond'
  shapeLabel: string
  dimmed?: boolean
  pressed?: boolean
  onFocus?: () => void
  action?: ReactNode
}) {
  return (
    <Card data-slot="compare-person-card" className={cn('flex-row flex-wrap items-center gap-3 transition-opacity', dimmed && 'opacity-40')}>
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full text-app-small font-semibold text-background" style={{ background: color }}>
        {initials}
      </span>
      <button type="button" aria-pressed={pressed} onClick={onFocus} className="min-w-0 flex-1 rounded-xs text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <span className="block truncate text-app-small font-semibold text-foreground">{name}</span>
        <span className="block truncate text-app-caption text-muted-foreground">{meta}</span>
      </button>
      <span className="inline-flex items-center gap-1 text-app-caption text-muted-foreground">
        <span aria-hidden="true" className={cn('size-3', shape === 'circle' ? 'rounded-full' : 'rotate-45')} style={{ background: color }} />
        {shapeLabel}
      </span>
      {action}
    </Card>
  )
}
