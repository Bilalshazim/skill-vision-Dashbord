import { type VariantProps, cva } from 'class-variance-authority'
import { X } from 'lucide-react'
import type * as React from 'react'

import { cn } from '@/lib/utils'

// Il badge della libreria. Un tag è stile label (Geist Mono maiuscolo,
// 11px): tre o quattro parole al massimo. Raggio full, come da scala.
// I toni di stato usano i fondi tenui del sistema (12% di superficie, 20%
// di bordo) e vanno sempre con la parola: il colore accompagna, non
// sostituisce (regola 10). Nessun tono decorativo.
// `onRemove`: un tag che si toglie (un valutatore, una persona nel
// confronto). La ✕ è un bottone vero, con `removeLabel` come nome.
const badgeVariants = cva('label-mono inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1', {
  variants: {
    tone: {
      neutral: 'border border-border bg-secondary text-muted-foreground',
      // Neutro pieno: la fascia più alta di performance, che non è uno stato
      // (CLAUDE.md cap. 7). Si distingue dal neutro tenue per il riempimento.
      strong: 'border border-foreground bg-foreground text-background',
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
  onRemove,
  removeLabel = 'Rimuovi',
  className,
  children,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { dot?: boolean; onRemove?: () => void; removeLabel?: string }) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ tone }), onRemove && 'pr-1', className)} {...props}>
      {dot && <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="-my-1 inline-flex size-5 items-center justify-center rounded-full outline-none hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
        >
          <X className="size-3" aria-hidden="true" />
        </button>
      )}
    </span>
  )
}

export { Badge, type BadgeTone }
