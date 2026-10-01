import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

// L'intestazione di una pagina o di una sezione di pagina: titolo,
// sottotitolo, azioni a destra (vanno a capo sotto su schermi stretti).
// `level="page"` è il titolo della schermata (24/600), `section` quello di
// una parte della pagina (18/600), `subsection` di un gruppo dentro una
// sezione (16/500). `eyebrow`: un sovratitolo in stile label.
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  level = 'section',
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  level?: 'page' | 'section' | 'subsection'
  className?: string
}) {
  const Heading = level === 'page' ? 'h1' : level === 'section' ? 'h2' : 'h3'
  return (
    <div data-slot="page-header" className={cn('mb-4 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="label-mono mb-1 text-muted-foreground">{eyebrow}</p> : null}
        <Heading className={cn('text-foreground', level === 'page' ? 'text-app-title' : level === 'section' ? 'text-app-section' : 'text-app-subtitle')}>{title}</Heading>
        {description ? <p className="mt-1 max-w-prose text-app-small text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
