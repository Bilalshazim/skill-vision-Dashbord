import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

// La barra del contesto: dice su cosa sta lavorando la pagina (per esempio
// società e posizione attiva) ed è sempre visibile sopra il contenuto.
// Due varianti:
//  - `full`: una riga di coppie etichetta / valore in stile label, superficie
//    neutra, bordo sottile, con l'azione per cambiare il contesto a destra.
//    Solo nella pagina dove il contesto si cambia.
//  - `inline`: il sovratitolo di sola lettura delle altre pagine, i valori in
//    fila separati da « · » ("ACME CORP · SENIOR FRONTEND ENGINEER"). Niente
//    campi né azioni: le etichette restano per i lettori di schermo.
// Riceve i valori: non li va a prendere (è un pattern, vale per tutti i moduli).
export function ContextBar({
  items,
  action,
  variant = 'full',
  className,
}: {
  items: { label: string; value: ReactNode }[]
  action?: ReactNode
  variant?: 'full' | 'inline'
  className?: string
}) {
  if (variant === 'inline') {
    return (
      <dl data-slot="context-bar" data-variant="inline" className={cn('label-mono flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground', className)}>
        {items.map((it, i) => (
          <div key={it.label} className="flex min-w-0 items-center gap-2">
            {i > 0 ? <span aria-hidden="true">·</span> : null}
            <dt className="sr-only">{it.label}</dt>
            <dd className="min-w-0 truncate">{it.value}</dd>
          </div>
        ))}
      </dl>
    )
  }
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
