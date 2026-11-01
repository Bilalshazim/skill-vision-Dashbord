import { Fragment } from 'react'
import { Link } from 'react-router-dom'

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils'

export type Crumb = { label: string; to: string }

// La riga del percorso in cima a ogni pagina (CLAUDE.md, Fase 6): in
// Assessment parte da "Home", in Recruiting da "Profilo della ricerca"
// ("Profilo della ricerca / Chi cerchiamo / Profilo candidato"). Le voci prima
// della corrente sono link; la corrente è testo (`aria-current`). Riceve la
// riga già fatta: la calcola il modulo dal suo menu.
export function PageBreadcrumb({ items, current, className }: { items: Crumb[]; current: string; className?: string }) {
  return (
    <Breadcrumb className={cn('mb-4', className)}>
      <BreadcrumbList>
        {items.map((c, i) => (
          <Fragment key={`${c.to}-${i}`}>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={c.to}>{c.label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>{current}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
