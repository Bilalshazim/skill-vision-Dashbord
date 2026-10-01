import type * as React from 'react'

import { cn } from '@/lib/utils'

// Tabella della libreria (shadcn). Corpo small (14) con cifre tabulari,
// intestazioni in stile label su `muted` (la superficie di servizio),
// righe separate da un bordo di 1px, nessuna ombra. Il contenitore scorre
// in orizzontale: una tabella larga non allarga mai la pagina.
// `size="sm"` stringe le celle per le tabelle dentro un dialog o un modulo.
// `frame` la chiude in un bordo (raggio sm) quando non sta già in una card
// a filo; `minWidth` le dà una larghezza minima sotto la quale scorre
// invece di schiacciare le colonne (md 448, lg 512).
function Table({
  className,
  size = 'md',
  frame = false,
  minWidth,
  ...props
}: React.ComponentProps<'table'> & { size?: 'md' | 'sm'; frame?: boolean; minWidth?: 'md' | 'lg' }) {
  return (
    <div data-slot="table-container" className={cn('relative w-full overflow-x-auto', frame && 'rounded-sm border border-border')}>
      <table
        data-slot="table"
        data-size={size}
        className={cn('group/table w-full caption-bottom border-collapse text-app-small tabular-nums', minWidth === 'md' && 'min-w-md', minWidth === 'lg' && 'min-w-lg', className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead data-slot="table-header" className={cn('bg-muted [&_tr]:border-b [&_tr]:hover:bg-transparent', className)} {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return <tfoot data-slot="table-footer" className={cn('border-t border-border font-medium [&>tr]:last:border-b-0', className)} {...props} />
}

// Una riga con `onClick` è cliccabile per intero (apre il dettaglio):
// prende il puntatore e il fondo di hover. Le altre restano ferme.
function TableRow({ className, onClick, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      onClick={onClick}
      className={cn('border-b border-border transition-colors data-[state=selected]:bg-accent', onClick && 'cursor-pointer hover:bg-accent', className)}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'label-mono h-10 px-3 text-left align-middle whitespace-nowrap text-muted-foreground group-data-[size=sm]/table:h-8 group-data-[size=sm]/table:px-2 [&:has([role=checkbox])]:pr-0',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn('px-3 py-2 align-middle text-foreground group-data-[size=sm]/table:px-2 group-data-[size=sm]/table:py-1 [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return <caption data-slot="table-caption" className={cn('mt-4 text-app-caption text-muted-foreground', className)} {...props} />
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
