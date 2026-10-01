import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

// La card a cartella del concept della Home di Assessment (E.pdf): una
// linguetta rialzata con il titolo, l'icona nella tacca alla sua sinistra,
// il corpo sotto. Sui token: superficie `card`, bordo 1px, nessuna ombra;
// le quattro card si distinguono per icona e titolo, non per il fondo
// (DECISIONI, "i toni delle card"). Titolo Geist 18/600 in minuscolo
// (regola 8). `aside`: i controlli in alto a destra della linguetta.
// `kicker`: la riga sotto la linguetta.
export function FolderCard({
  icon: Icon,
  title,
  kicker,
  aside,
  className,
  children,
}: {
  icon: LucideIcon
  title: ReactNode
  kicker?: ReactNode
  aside?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section data-slot="folder-card" className={cn('flex min-w-0 flex-col', className)}>
      <div className="flex items-stretch">
        <span className="flex w-1/4 shrink-0 items-center justify-center text-foreground" aria-hidden="true">
          <Icon className="size-12" strokeWidth={1.5} />
        </span>
        <div className="relative z-(--z-sticky) -mb-px min-h-16 min-w-0 flex-1 rounded-t-lg border border-b-0 border-border-strong bg-card px-6 pt-4">
          {aside ? <div className="float-right mb-2 ml-3 flex flex-col items-end gap-2">{aside}</div> : null}
          <h3 className="mt-2 text-app-section break-words text-card-foreground">{title}</h3>
        </div>
      </div>
      <div className="flex flex-1 flex-col rounded-lg rounded-tr-none border border-border-strong bg-card px-6 pt-3 pb-6">
        {kicker ? <div className="text-app-subtitle font-normal text-muted-foreground">{kicker}</div> : null}
        {children}
      </div>
    </section>
  )
}
