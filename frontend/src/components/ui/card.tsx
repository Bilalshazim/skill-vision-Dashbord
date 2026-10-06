import { type VariantProps, cva } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

// La card della libreria. Superficie elevata + bordo, raggio lg (24),
// nessuna ombra. Il padding è una prop, non una classe passata da fuori:
// `md` (16, il padding di card della scala) è il default, `lg` (24) per
// i pannelli larghi, `none` quando il contenuto va a filo (tabelle).
// Le parti interne non hanno padding proprio: stanno dentro quello della
// card, così il raggio annidato torna (24 − 16 = 8 per gli elementi dentro).
const cardVariants = cva('flex flex-col rounded-lg border border-border bg-card text-card-foreground transition-colors hover:border-primary', {
  variants: {
    padding: {
      md: 'p-4',
      lg: 'p-6',
      none: 'overflow-hidden',
    },
  },
  defaultVariants: {
    padding: 'md',
  },
})

function Card({ className, padding, ...props }: React.ComponentProps<'div'> & VariantProps<typeof cardVariants>) {
  return <div data-slot="card" className={cn(cardVariants({ padding }), className)} {...props} />
}

// Riga d'intestazione: titolo (ed eventuale label sopra) a sinistra,
// CardAction a destra.
function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('flex flex-wrap items-center gap-3 pb-4', className)} {...props} />
}

// Titolo di card: Geist 18/600, minuscolo (regola 8).
function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-title" className={cn('flex items-center gap-2 text-app-section text-card-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground', className)} {...props} />
}

// Sovratitolo in stile label.
function CardLabel({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-label" className={cn('label-mono text-muted-foreground', className)} {...props} />
}

// Testo secondario (neutral-600 in chiaro, 400 in scuro: sopra soglia anche
// sulla superficie elevata).
function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-description" className={cn('text-app-small text-muted-foreground', className)} {...props} />
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-action" className={cn('ml-auto flex items-center gap-2', className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('min-w-0', className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-footer" className={cn('flex items-center gap-2 pt-4', className)} {...props} />
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardLabel, CardTitle }
