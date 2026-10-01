import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { KeyboardEvent, ReactNode } from 'react'

import { LoadingState } from '@/components/patterns/LoadingState'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type DataTableColumn<T> = {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /** `end` per le colonne numeriche e le azioni. */
  align?: 'start' | 'end'
  /** `muted` per i dati di contorno (email, reparto…): testo secondario. */
  emphasis?: 'default' | 'muted'
  /** Taglia il testo lungo con i puntini: sm 160px, md 224px. */
  truncate?: 'sm' | 'md'
  nowrap?: boolean
}

export type DataTablePagination = {
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  labels: {
    showing: (from: number, to: number, total: number) => string
    pageOf: (page: number, pages: number) => string
    prev: string
    next: string
  }
}

// Tabella con pagine, stato vuoto e caricamento (DECISIONI, "Tabelle"):
// riceve le righe già filtrate e ordinate da chi la usa — la logica di
// ricerca e ordinamento resta nella pagina, qui c'è solo la vista.
// Le colonne si dichiarano con props (allineamento, enfasi, troncamento),
// non con classi. Una riga con `onRowClick` si apre anche da tastiera
// (Invio o Spazio sulla riga a fuoco).
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  onRowClick,
  rowLabel,
  pagination,
  selection,
  loading = false,
  loadingLabel,
  empty,
  className,
}: {
  columns: DataTableColumn<T>[]
  rows: T[]
  getRowId: (row: T) => string
  onRowClick?: (row: T) => void
  /** Nome accessibile di una riga cliccabile ("Apri scheda di …"). */
  rowLabel?: (row: T) => string
  pagination?: DataTablePagination
  /** Colonna di selezione (es. per "Invia link test"): gli id selezionati e
   *  il loro cambio. `rowLabel` dà il nome a ogni casella. */
  selection?: { selected: ReadonlySet<string>; onChange: (next: Set<string>) => void; label?: string }
  loading?: boolean
  loadingLabel?: string
  empty?: ReactNode
  className?: string
}) {
  const total = rows.length
  const pageSize = pagination?.pageSize ?? Math.max(total, 1)
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const page = pagination ? Math.min(Math.max(pagination.page, 1), pages) : 1
  const start = (page - 1) * pageSize
  const visible = pagination ? rows.slice(start, start + pageSize) : rows

  const allIds = rows.map(getRowId)
  const selectedCount = selection ? allIds.filter((id) => selection.selected.has(id)).length : 0
  const toggleAll = (on: boolean) => selection?.onChange(on ? new Set([...selection.selected, ...allIds]) : new Set([...selection.selected].filter((id) => !allIds.includes(id))))
  const toggleOne = (id: string, on: boolean) => {
    if (!selection) return
    const next = new Set(selection.selected)
    if (on) next.add(id)
    else next.delete(id)
    selection.onChange(next)
  }

  const onKey = (row: T) => (ev: KeyboardEvent<HTMLTableRowElement>) => {
    if (ev.target !== ev.currentTarget) return
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault()
      onRowClick?.(row)
    }
  }

  return (
    <Card padding="none" className={className}>
      {loading ? (
        <LoadingState label={loadingLabel} rows={5} className="px-4" />
      ) : !total ? (
        empty
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                {selection ? (
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label={selection.label ?? 'Seleziona tutti'}
                      checked={selectedCount === 0 ? false : selectedCount === allIds.length ? true : 'indeterminate'}
                      onCheckedChange={(c) => toggleAll(c === true)}
                    />
                  </TableHead>
                ) : null}
                {columns.map((c) => (
                  <TableHead key={c.key} className={cn(c.align === 'end' && 'text-right')}>
                    {c.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((row) => (
                <TableRow
                  key={getRowId(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? onKey(row) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-label={onRowClick && rowLabel ? rowLabel(row) : undefined}
                  className={onRowClick ? 'focus-visible:-outline-offset-2' : undefined}
                  data-state={selection?.selected.has(getRowId(row)) ? 'selected' : undefined}
                >
                  {selection ? (
                    <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        aria-label={rowLabel ? `Seleziona: ${rowLabel(row)}` : 'Seleziona'}
                        checked={selection.selected.has(getRowId(row))}
                        onCheckedChange={(c) => toggleOne(getRowId(row), c === true)}
                      />
                    </TableCell>
                  ) : null}
                  {columns.map((c) => (
                    <TableCell
                      key={c.key}
                      className={cn(
                        c.align === 'end' && 'text-right',
                        c.emphasis === 'muted' && 'text-muted-foreground',
                        c.nowrap && 'whitespace-nowrap',
                        c.truncate && 'truncate',
                        c.truncate === 'sm' && 'max-w-40',
                        c.truncate === 'md' && 'max-w-56',
                      )}
                    >
                      {c.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pagination && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
              <p className="text-app-small text-muted-foreground">{pagination.labels.showing(start + 1, Math.min(start + pageSize, total), total)}</p>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon-sm" aria-label={pagination.labels.prev} disabled={page <= 1} onClick={() => pagination.onPageChange(page - 1)}>
                  <ChevronLeft />
                </Button>
                <span className="text-app-small font-medium text-foreground">{pagination.labels.pageOf(page, pages)}</span>
                <Button variant="outline" size="icon-sm" aria-label={pagination.labels.next} disabled={page >= pages} onClick={() => pagination.onPageChange(page + 1)}>
                  <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
