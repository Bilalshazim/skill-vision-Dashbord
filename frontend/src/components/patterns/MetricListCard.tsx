import { List } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { HoverHighlightCard } from '@/components/patterns/HoverHighlightCard'
import { ModalDialog } from '@/components/patterns/ModalDialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type MetricListItem = {
  id: string
  label: string
  /** Una riga sotto il nome: la mansione di una persona, il numero di persone di un'area. */
  meta?: string
  /** Il valore già scritto con la sua unità: «5,3 /10», «68%». */
  value: string
  onClick?: () => void
}

// Una finestra con un dato in alto e, sotto, «Vedi elenco» che apre l'elenco ordinato
// (Decisioni di Roberto del 2026-11-26: le finestre Aree · Ruoli · Persone · Competenze
// di Le perdite invisibili, Top Talent · Alto potenziale · Nella norma di Il potenziale,
// Personale da potenziare · Personale complesso di Dove intervenire). L'ordine dell'elenco
// lo decide chi la usa: il pattern riceve le righe già ordinate e non va a prendere dati.
export function MetricListCard({
  title,
  value,
  caption,
  items,
  listTitle,
  listSub,
  seeLabel = 'Vedi elenco',
  emptyText,
  hover = false,
  className,
}: {
  title: string
  /** Il dato in alto, già scritto: «5,6 /10», «7 persone · 30%». Assente: la finestra dice `emptyText`. */
  value?: ReactNode
  caption?: ReactNode
  items: MetricListItem[]
  listTitle: string
  listSub?: ReactNode
  seeLabel?: string
  /** Senza righe: la frase al posto del dato e del pulsante («Nessuno oggi»). */
  emptyText: string
  /** Bordo lime al passaggio del mouse, come le altre finestre delle pagine dei risultati. */
  hover?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const body = (
    <>
      <p className="label-mono text-muted-foreground">{title}</p>
      {items.length && value != null ? (
        <>
          <p className="text-site-h3 tabular-nums text-foreground">{value}</p>
          {caption ? <p className="text-app-small text-muted-foreground">{caption}</p> : null}
          <Button type="button" variant="outline" size="sm" className="mt-auto self-start" onClick={() => setOpen(true)}>
            <List aria-hidden="true" />
            {seeLabel}
          </Button>
        </>
      ) : (
        <p className="text-app-body text-muted-foreground">{emptyText}</p>
      )}
    </>
  )
  return (
    <>
      {hover ? (
        <HoverHighlightCard className={className}>{body}</HoverHighlightCard>
      ) : (
        <Card className={cn('h-full gap-3', className)}>{body}</Card>
      )}
      {open ? (
        <ModalDialog title={listTitle} sub={listSub} onClose={() => setOpen(false)}>
          <ol className="flex flex-col">
            {items.map((it, i) => {
              const row = (
                <>
                  <span className="w-8 shrink-0 font-mono text-app-small text-muted-foreground tabular-nums">{i + 1}</span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-app-body text-foreground">{it.label}</span>
                    {it.meta ? <span className="truncate text-app-caption text-muted-foreground">{it.meta}</span> : null}
                  </span>
                  <span className="shrink-0 font-mono text-app-body text-foreground tabular-nums">{it.value}</span>
                </>
              )
              return (
                <li key={it.id} className="border-b border-border last:border-0">
                  {it.onClick ? (
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        it.onClick?.()
                      }}
                      className="flex w-full items-center gap-3 py-2 text-left transition-colors outline-none hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {row}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 py-2">{row}</div>
                  )}
                </li>
              )
            })}
          </ol>
        </ModalDialog>
      ) : null}
    </>
  )
}
