import { Slot } from 'radix-ui'
import type * as React from 'react'

import { cn } from '@/lib/utils'

// shadcn/ui Breadcrumb, sui token del sistema. Separatore: la barra « / »
// (CLAUDE.md, Fase 6: "Home / Le perdite invisibili"), non la freccia di
// default. Comportamento invariato: `nav` con aria-label, voce corrente con
// aria-current="page".
function Breadcrumb({ ...props }: React.ComponentProps<'nav'>) {
  return <nav aria-label="Percorso" data-slot="breadcrumb" {...props} />
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<'ol'>) {
  return <ol data-slot="breadcrumb-list" className={cn('flex flex-wrap items-center gap-2 text-app-small break-words text-muted-foreground', className)} {...props} />
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li data-slot="breadcrumb-item" className={cn('inline-flex items-center gap-2', className)} {...props} />
}

function BreadcrumbLink({ asChild, className, ...props }: React.ComponentProps<'a'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'a'
  return <Comp data-slot="breadcrumb-link" className={cn('rounded-xs underline-offset-4 transition-colors hover:text-foreground hover:underline', className)} {...props} />
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
  return <span data-slot="breadcrumb-page" role="link" aria-disabled="true" aria-current="page" className={cn('font-medium text-foreground', className)} {...props} />
}

function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li data-slot="breadcrumb-separator" role="presentation" aria-hidden="true" className={className} {...props}>
      {children ?? '/'}
    </li>
  )
}

export { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator }
