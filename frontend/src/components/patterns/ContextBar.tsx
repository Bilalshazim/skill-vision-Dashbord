import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

// La barra del contesto: dice su cosa sta lavorando la pagina (per esempio
// società e posizione attiva) ed è sempre visibile sopra il contenuto, con
// l'azione per cambiarlo a destra. Una riga di coppie etichetta / valore in
// stile label, superficie neutra, bordo sottile. Riceve i valori: non li va a
// prendere (è un pattern, vale per tutti i moduli).
export function ContextBar({ items, action, className }: { items: { label: string; value: ReactNode }[]; action?: ReactNode; className?: string }) {
  return (
    <div data-slot="context-bar" className={cn('flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-border bg-card px-4 py-3', className)}>
      <dl className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-2">
        {items.map((it) => (
          <div key={it.label} className="flex min-w-0 flex-col">
            <dt className="label-mono text-muted-foreground">{it.label}</dt>
            <dd className="min-w-0 truncate text-app-small font-medium text-foreground">{it.value}</dd>
          </div>
        ))}
      </dl>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  )
}
