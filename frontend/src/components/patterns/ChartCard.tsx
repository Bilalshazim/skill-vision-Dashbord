import type { ReactNode } from 'react'

import { EmptyState } from '@/components/patterns/EmptyState'
import { LoadingState } from '@/components/patterns/LoadingState'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Il riquadro di un grafico: titolo, una riga di contesto (periodo, unità),
// il numero di sintesi con il suo scarto, i controlli (ToggleGroup) a
// destra, il grafico sotto ad altezza fissa, una nota in fondo. Gli stati
// sono qui: `loading` (scheletro), `empty` (cosa comparirà e come).
// `surface="none"` quando il riquadro sta già dentro un'altra superficie.
// Il grafico si passa come figlio: la palette la decide il grafico (Fase 5,
// Bklit), non il riquadro.
export function ChartCard({
  title,
  description,
  headline,
  actions,
  footer,
  height = 'md',
  loading = false,
  empty,
  surface = 'card',
  elevated = false,
  className,
  children,
}: {
  title: ReactNode
  description?: ReactNode
  headline?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  height?: 'sm' | 'md' | 'lg'
  loading?: boolean
  /** Se dato, il grafico non si disegna e compare lo stato vuoto con questo testo. */
  empty?: { title: ReactNode; description?: ReactNode }
  surface?: 'card' | 'none'
  /** Bordo `primary` di 2px e rilievo, come le card della Home (eccezione alla regola 3, DECISIONI). */
  elevated?: boolean
  className?: string
  children?: ReactNode
}) {
  const body = (
    <>
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="label-mono text-muted-foreground">{title}</h3>
          {description ? <p className="mt-1 text-app-small text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {headline ? <div className="flex flex-wrap items-baseline gap-3">{headline}</div> : null}
      {loading ? (
        <LoadingState rows={4} />
      ) : empty ? (
        <EmptyState size="sm" title={empty.title} description={empty.description} />
      ) : (
        <div className={cn('relative min-w-0', height === 'sm' ? 'h-40' : height === 'md' ? 'h-60' : 'h-80')}>{children}</div>
      )}
      {footer ? <div className="text-app-small text-muted-foreground">{footer}</div> : null}
    </>
  )
  return surface === 'card' ? (
    <Card data-slot="chart-card" className={cn('gap-4', elevated && 'border-2 border-primary shadow-[0_8px_16px_0_var(--border-strong)]', className)}>
      {body}
    </Card>
  ) : (
    <div data-slot="chart-card" className={cn('flex flex-col gap-4', className)}>
      {body}
    </div>
  )
}
