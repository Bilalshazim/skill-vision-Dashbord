import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type BandTone = 'strong' | 'success' | 'neutral' | 'warning' | 'destructive'

export type BandPerson = {
  id: string
  name: string
  /** La riga sotto il nome: la mansione (Assessment), la provenienza (Recruiting). */
  meta?: ReactNode
  /** Il punteggio già formattato, con la sua unità ("6,8 /10"). */
  score: ReactNode
  onClick?: () => void
  /** Un'azione accanto al punteggio, quando il dettaglio ha un suo bottone. */
  action?: ReactNode
}

// Una fascia dice chi c'è dentro (CLAUDE.md, Fase 5): il nome con il suo
// tono (la parola accanto al colore, regola 10), una riga che dice cosa
// significa con la soglia, quante persone e che quota del totale, le prime
// tre per punteggio, e "Vedi tutte" verso l'elenco filtrato. Superficie
// neutra: il colore sta solo nel badge della fascia. Le persone arrivano già
// ordinate; qui se ne mostrano tre.
export function BandCard({
  label,
  tone,
  description,
  count,
  total,
  unit = { one: 'persona', many: 'persone' },
  people,
  onSeeAll,
  seeAllLabel = 'Vedi tutte',
  emptyText = 'Nessuno in questa fascia.',
  className,
}: {
  label: string
  tone: BandTone
  /** Cosa significa la fascia, con la soglia ("Punteggio complessivo da 7,0 a 8,3 su 10"). */
  description: ReactNode
  count: number
  total: number
  unit?: { one: string; many: string }
  people: BandPerson[]
  onSeeAll?: () => void
  seeAllLabel?: string
  emptyText?: string
  className?: string
}) {
  const pct = total ? Math.round((count / total) * 100) : 0
  const top = people.slice(0, 3)
  return (
    <Card data-slot="band-card" className={cn('gap-3', className)}>
      <div className="flex flex-col gap-1">
        <Badge tone={tone} dot className="self-start">
          {label}
        </Badge>
        <p className="text-app-small text-muted-foreground">{description}</p>
      </div>
      <p className="text-app-body text-foreground">
        <span className="font-semibold tabular-nums">{count}</span> {count === 1 ? unit.one : unit.many}
        <span className="text-muted-foreground"> · {pct}%</span>
      </p>
      {top.length ? (
        <ul className="flex flex-col">
          {top.map((p) => {
            const body = (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-app-small font-medium text-foreground">{p.name}</span>
                  {p.meta ? <span className="block truncate text-app-caption text-muted-foreground">{p.meta}</span> : null}
                </span>
                <span className="shrink-0 font-mono text-app-small text-foreground tabular-nums">{p.score}</span>
              </>
            )
            return (
              <li key={p.id} className="flex items-center gap-2 border-b border-border last:border-b-0">
                {p.onClick ? (
                  <button
                    type="button"
                    onClick={p.onClick}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xs px-1 py-2 text-left outline-none transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {body}
                  </button>
                ) : (
                  <div className="flex min-w-0 flex-1 items-center gap-3 px-1 py-2">{body}</div>
                )}
                {p.action ? <span className="shrink-0">{p.action}</span> : null}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-app-small text-muted-foreground">{emptyText}</p>
      )}
      {onSeeAll && count > 0 ? (
        <Button type="button" variant="ghost" size="sm" className="mt-auto self-start" onClick={onSeeAll}>
          {seeAllLabel}
          <ArrowRight />
        </Button>
      ) : null}
    </Card>
  )
}
