import { ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/patterns/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

export type ActionItem = {
  key: string
  /** L'azione che l'utente compie ("Colloqui di restituzione da fare"). */
  label: string
  description?: ReactNode
  count: number
  unit?: string
  /** La pagina dove si fa la cosa. */
  to: string
  linkLabel?: string
  icon?: LucideIcon
  /** Una nota modificabile sul posto, salvata da chi usa la riga. */
  note?: { value: string; onChange: (value: string) => void; readOnly?: boolean }
}

// "Da fare adesso" della Panoramica (CLAUDE.md, Fase 6): un elenco di righe,
// ognuna un'azione dell'utente, non un indicatore. Testo a sinistra, il
// conteggio, il link alla pagina dove si fa. L'ordine (per urgenza) lo
// decide chi la usa; le righe a zero non compaiono. Superficie neutra:
// l'urgenza la dice l'ordine e la parola, non il colore.
export function ActionList({ items, empty, className }: { items: ActionItem[]; empty: { title: ReactNode; description?: ReactNode }; className?: string }) {
  const visible = items.filter((it) => it.count > 0)
  return (
    <Card padding="none" data-slot="action-list" className={className}>
      {visible.length ? (
        <ul className="flex flex-col">
          {visible.map((it) => (
            <li key={it.key} className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
              {it.icon ? <it.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
              <div className="min-w-0 flex-1 basis-60">
                <p className="text-app-small font-medium text-foreground">{it.label}</p>
                {it.note ? (
                  <Textarea
                    variant="inline"
                    size="sm"
                    rows={1}
                    readOnly={it.note.readOnly}
                    aria-label={`Nota: ${it.label}`}
                    value={it.note.value}
                    onChange={(e) => it.note?.onChange(e.target.value)}
                    className="-mx-1 text-muted-foreground"
                  />
                ) : it.description ? (
                  <p className="text-app-small text-muted-foreground">{it.description}</p>
                ) : null}
              </div>
              <Badge className="shrink-0">
                {it.count}
                {it.unit ? ` ${it.unit}` : ''}
              </Badge>
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link to={it.to}>
                  {it.linkLabel ?? 'Apri'}
                  <ArrowRight />
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState size="sm" title={empty.title} description={empty.description} className="px-4" />
      )}
    </Card>
  )
}
