import type * as React from 'react'

import { cn } from '@/lib/utils'

// Segnaposto di caricamento: la superficie di servizio (`muted`) che pulsa.
// Raggio xs, perché sta dentro card e righe. Non porta testo: chi lo usa
// mette accanto un'etichetta per i lettori di schermo (vedi LoadingState).
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="skeleton" aria-hidden="true" className={cn('animate-pulse rounded-xs bg-muted', className)} {...props} />
}

export { Skeleton }
