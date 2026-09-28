import { type VariantProps, cva } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

// Il badge della libreria. Un tag è stile label (Geist Mono maiuscolo,
// 11px): tre o quattro parole al massimo. Raggio full, come da scala.
// I toni di stato usano i fondi tenui del sistema (12% di superficie, 20%
// di bordo) e vanno sempre con la parola: il colore accompagna, non
// sostituisce (regola 10). Nessun tono decorativo.
const badgeVariants = cva('label-mono inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1', {
  variants: {
    tone: {
      neutral: 'border border-border bg-secondary text-muted-foreground',
      accent: 'surface-accent text-foreground',
      success: 'surface-success text-success',
      warning: 'surface-warning text-warning',
      destructive: 'surface-danger text-destructive',
    },
  },
  defaultVariants: {
    tone: 'neutral',
  },
})

type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>

function Badge({
  tone,
  dot = false,
  className,
  children,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
}

export { Badge, type BadgeTone }
