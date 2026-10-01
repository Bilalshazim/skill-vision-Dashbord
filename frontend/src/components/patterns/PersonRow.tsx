import type { ReactNode } from 'react'

import { Initials } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

// Una persona in un elenco: iniziali, nome, una riga di contesto (ruolo,
// area), un valore a destra (di solito un Badge). Con `onClick` la riga
// intera è un bottone che apre il dettaglio (tastiera e focus compresi).
// Righe separate da un bordo sottile, l'ultima senza.
export function PersonRow({ first, last, meta, trailing, onClick }: { first: string; last: string; meta?: ReactNode; trailing?: ReactNode; onClick?: () => void }) {
  const Root = onClick ? 'button' : 'div'
  return (
    <Root
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      data-slot="person-row"
      className={cn(
        'flex w-full items-center gap-3 border-b border-border px-1 py-2 text-left last:border-b-0',
        onClick && 'rounded-xs outline-none transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
      )}
    >
      <Initials first={first} last={last} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-app-small font-medium text-foreground">
          {first} {last}
        </span>
        {meta ? <span className="block truncate text-app-caption text-muted-foreground">{meta}</span> : null}
      </span>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </Root>
  )
}
