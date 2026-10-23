import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

// La card di un blocco di contenuto con i suoi controlli: in testa l'icona
// (Lucide, 20px, accanto al titolo, solo se dice l'oggetto della card), il
// titolo Geist 18/600 in minuscolo (regola 8) e i controlli a destra
// (`aside`); sotto `kicker` e il contenuto. Tutto allineato a sinistra.
// Superficie `card`, bordo 1px, nessuna ombra, nessuna tinta (CLAUDE.md,
// Fase 6, verificato il 2026-10-23: via il bordo lime di 2px, il rilievo,
// le tinte dalla famiglia dei grafici, l'icona grande e il testo al centro
// del concept della vecchia Home di Assessment — DECISIONI).
export function FolderCard({
  icon: Icon,
  title,
  kicker,
  aside,
  size = 'default',
  className,
  children,
}: {
  icon?: LucideIcon
  title: ReactNode
  kicker?: ReactNode
  aside?: ReactNode
  /** `tall`: corpo più alto, per una riga di card che deve riempire la pagina. */
  size?: 'default' | 'tall'
  className?: string
  children?: ReactNode
}) {
  return (
    <section
      data-slot="folder-card"
      className={cn('flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-card p-6 text-left text-card-foreground', size === 'tall' ? 'min-h-56' : 'min-h-40', className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="flex min-w-0 items-center gap-2 text-app-section break-words text-card-foreground">
          {Icon ? <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
          {title}
        </h3>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
      {kicker ? <div className="text-app-small text-muted-foreground">{kicker}</div> : null}
      {children}
    </section>
  )
}
