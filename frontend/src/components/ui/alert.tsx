import { type VariantProps, cva } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

// Avviso nel flusso della pagina. Fondi tenui del sistema (surface-*),
// raggio sm, icona a sinistra. Gli avvisi d'errore e di attenzione hanno
// role="alert" (letti subito), gli altri role="status".
const alertVariants = cva('grid grid-cols-[auto_1fr] items-start gap-x-2 gap-y-1 rounded-sm px-3 py-2 text-app-small [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0', {
  variants: {
    tone: {
      info: 'border border-border bg-muted text-foreground [&>svg]:text-muted-foreground',
      success: 'surface-success text-foreground [&>svg]:text-success',
      warning: 'surface-warning text-foreground [&>svg]:text-warning',
      destructive: 'surface-danger text-destructive',
    },
  },
  defaultVariants: { tone: 'info' },
})

function Alert({ className, tone, ...props }: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  const urgent = tone === 'destructive' || tone === 'warning'
  return <div data-slot="alert" role={urgent ? 'alert' : 'status'} className={cn(alertVariants({ tone }), className)} {...props} />
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="alert-title" className={cn('col-start-2 font-medium', className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="alert-description" className={cn('col-start-2', className)} {...props} />
}

export { Alert, AlertDescription, AlertTitle }
