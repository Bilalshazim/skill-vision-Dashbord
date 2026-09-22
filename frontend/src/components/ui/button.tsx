import { Slot } from 'radix-ui'
import { type VariantProps, cva } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

// Harmonized with Assessment's .btn/.btn-primary/.btn-sm/.btn-ghost/
// .btn-danger-outline (frontend/src/modules/assessment/styles/
// assessment-scoped.css:298-313) — pill shape (999px radius, not
// rounded-md), padding-driven height rather than a fixed h-9/h-8/h-10,
// bold 12.5px/11.5px type, and a 0.4 disabled opacity (Assessment's own
// value) instead of Tailwind's default 0.5. Colors still resolve through
// the shared shadcn tokens (bg-primary/bg-card/etc.), which were already
// numerically identical to Assessment's own dark-mode palette before this
// change — only the SHAPE was diverging, not the color system.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full text-[12.5px] font-bold transition-colors disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:brightness-95',
        destructive: 'border border-destructive/50 bg-transparent text-destructive hover:bg-destructive/10',
        outline: 'border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'border border-transparent bg-transparent hover:bg-accent hover:text-accent-foreground',
        link: 'text-foreground underline-offset-4 hover:underline',
        // Recruiting's own hand-rolled "gold" action button (WinnerCard's
        // confirm, CvExportPage's JSON export, PaginaAPage's bulk send) —
        // promoted from a duplicated local className string to a real
        // variant so it's one definition instead of N copies.
        warning: 'border border-warning/40 bg-warning/15 text-foreground hover:bg-warning/25',
      },
      size: {
        default: 'px-4 py-2',
        sm: 'px-2.5 py-[5px] text-[11.5px]',
        lg: 'px-6 py-2.5',
        icon: 'size-9',
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
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
