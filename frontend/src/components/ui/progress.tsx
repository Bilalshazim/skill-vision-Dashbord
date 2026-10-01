import { Progress as ProgressPrimitive } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@/lib/utils'

// Barra di avanzamento. Riempimento `primary` (dove lo mette shadcn),
// binario `muted`. Il valore va scritto accanto con le parole
// ("Passo 3 di 8"): la barra da sola non basta.
// `tone` per una fascia (success / warning / destructive) o per un dato
// neutro (`neutral`, il testo secondario): una fascia è uno stato, non una
// serie, e si accompagna sempre alla sua parola.
const TONE = {
  primary: 'bg-primary',
  neutral: 'bg-muted-foreground',
  strong: 'bg-foreground',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
} as const

function Progress({
  className,
  value,
  tone = 'primary',
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { tone?: keyof typeof TONE }) {
  return (
    <ProgressPrimitive.Root data-slot="progress" className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)} value={value} {...props}>
      <ProgressPrimitive.Indicator data-slot="progress-indicator" className={cn('h-full w-full flex-1 transition-transform', TONE[tone])} style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
