import { type ReactNode, useState } from 'react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Una card di un grafico che si accende al passaggio del mouse (Il valore, richiesta di Bilal
// del 2026-11-16): il bordo diventa lime e il grafico, che riceve `active`, passa al lime e
// cresce un poco. Il lime è `chart-highlight-line`: accent-600 in chiaro (una linea lime su
// fondo chiaro non si legge sotto accent-600), accent-400 in scuro. Con
// `prefers-reduced-motion` il grafico non cresce; colore e bordo cambiano lo stesso.
// Nessuna ombra. La card non diventa cliccabile: è solo un'evidenza.
// `children` sopra il grafico (il titolo), `after` sotto (una nota). `origin`: da dove cresce il
// grafico, `center` se è centrato, `left` se sta a sinistra.
export function HoverHighlightCard({ children, chart, after, origin = 'center', className }: { children?: ReactNode; chart?: (active: boolean) => ReactNode; after?: ReactNode; origin?: 'center' | 'left'; className?: string }) {
  const [active, setActive] = useState(false)
  return (
    <Card
      data-active={active || undefined}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      className={cn('h-full gap-3 transition-colors duration-200 data-[active]:border-chart-highlight-line', className)}
    >
      {children}
      {chart ? (
        <div className={cn(origin === 'left' ? 'origin-left' : 'origin-center', 'transition-transform duration-300 ease-out motion-reduce:transition-none', active && 'scale-105 motion-reduce:scale-100')}>{chart(active)}</div>
      ) : null}
      {after}
    </Card>
  )
}
