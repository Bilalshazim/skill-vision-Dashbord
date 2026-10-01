import { Loader2 } from 'lucide-react'
import type * as React from 'react'

import { cn } from '@/lib/utils'

// Indicatore di attesa dentro un bottone o una riga. Prende il colore del
// testo accanto. Per un'area che carica si usa LoadingState (scheletri).
function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return <Loader2 data-slot="spinner" aria-hidden="true" className={cn('size-4 shrink-0 animate-spin', className)} {...props} />
}

export { Spinner }
