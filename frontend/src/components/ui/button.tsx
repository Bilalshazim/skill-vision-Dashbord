import { Slot } from 'radix-ui'
import { type VariantProps, cva } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

// Il bottone della libreria, per Recruiting e Assessment insieme.
// Raggio md (16) per le taglie piene, sm (10) per quelle piccole, come da
// scala. Hover sui token (--primary-hover è accent-500 in chiaro e
// accent-300 in scuro), mai sull'opacità. Focus ring accent-600, 2px,
// offset 2px. Peso 500: il 600 è dei titoli.
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        outline: 'border border-border bg-card text-muted-foreground hover:border-primary hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-border-strong',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'surface-danger text-destructive hover:bg-destructive/20',
        warning: 'surface-warning text-foreground hover:bg-warning/20',
        link: 'text-foreground underline-offset-4 hover:underline',
      },
      size: {
        default: 'rounded-md px-4 py-2 text-app-body',
        sm: 'rounded-sm px-3 py-1 text-app-small [&_svg]:size-3.5',
        lg: 'rounded-md px-6 py-3 text-app-body',
        icon: 'size-9 rounded-md',
        'icon-sm': 'size-8 rounded-sm [&_svg]:size-3.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? 'default'}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
