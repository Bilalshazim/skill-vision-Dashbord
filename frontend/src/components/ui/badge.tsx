import { type VariantProps, cva } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

// Harmonized with Assessment's .chip/.chip-* system (frontend/src/modules/
// assessment/styles/assessment-scoped.css:347-359) — same pill shape, gap,
// font-size/weight, and small leading dot, so a status pill looks
// identical whether it's rendered by Assessment's own markup or by this
// component in Recruiting. Recruiting had no shared badge component before
// this — every status pill was a hand-composed Tailwind string, drifting
// in size/casing from file to file (see PrescreenedList.tsx's old inline
// "auto" pill for one example) — this replaces those call sites.
const badgeVariants = cva('inline-flex items-center gap-[5px] whitespace-nowrap rounded-full px-[9px] py-[3px] text-[11px] font-bold', {
  variants: {
    tone: {
      green: 'bg-success/16 text-success',
      amber: 'bg-warning/16 text-warning',
      red: 'bg-destructive/16 text-destructive',
      blue: 'bg-primary/12 text-ring',
      gray: 'border border-border bg-secondary text-muted-foreground',
    },
  },
  defaultVariants: {
    tone: 'gray',
  },
})

export function Badge({ tone, dot = true, className, children, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className="size-[6px] shrink-0 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
}
