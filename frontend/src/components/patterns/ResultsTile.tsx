import { type ReactNode, useState } from 'react'

import { type ResultsLink, TextLink } from '@/components/patterns/EuroFigure'
import { MiniChart, type MiniChartSpec } from '@/components/patterns/MiniChart'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type ResultsIssue = {
  title: string
  /** Il dato del riquadro, già scritto ("4 persone", "Assistenza clienti"). Un riquadro senza persone lo dice a parole ("Nessuno oggi."), non con uno zero. */
  value: ReactNode
  body?: ReactNode
  /** Righe brevi sotto il dato, per esempio le prime tre persone con mansione e punteggio. */
  list?: { id: string; text: string }[]
  link?: ResultsLink
  /** Il mini grafico sotto il dato (correzioni del 2026-11-09): una barra sulla sua scala, una riga per persona, o una fila di pallini. Sostituisce `list` quando ha le persone. */
  chart?: MiniChartSpec
}

// Un riquadro delle pagine dei risultati. L'etichetta è neutra: un riquadro di criticità non è
// una fascia (CLAUDE.md, Fase 6).
// `hover` (pagine dei risultati di Assessment, Bilal 2026-11-16): al passaggio del mouse il bordo
// e il mini grafico vanno in lime e il grafico cresce un poco, come HoverHighlightCard.
export function ResultsTile({ title, value, body, list, link, chart, hover }: ResultsIssue & { hover?: boolean }) {
  const [active, setActive] = useState(false)
  const on = !!hover && active
  return (
    <Card
      data-slot="results-tile"
      data-active={on || undefined}
      onPointerEnter={hover ? () => setActive(true) : undefined}
      onPointerLeave={hover ? () => setActive(false) : undefined}
      className={cn('gap-1 bg-muted', hover && 'transition-colors duration-200 data-[active]:border-chart-highlight-line')}
    >
      <h3 className="label-mono text-muted-foreground">{title}</h3>
      <div className="text-app-subtitle font-semibold text-foreground">{value}</div>
      {body ? <div className="text-app-small text-muted-foreground">{body}</div> : null}
      {chart ? (
        <div className={cn('mt-2 origin-center transition-transform duration-300 ease-out motion-reduce:transition-none', on && 'scale-105 motion-reduce:scale-100')}>
          <MiniChart spec={on ? { ...chart, tone: 'highlight' } : chart} />
        </div>
      ) : null}
      {list?.length && chart?.kind !== 'people' ? (
        <ul className="mt-1 flex flex-col gap-1 text-app-small text-muted-foreground">
          {list.map((l) => (
            <li key={l.id}>{l.text}</li>
          ))}
        </ul>
      ) : null}
      {link ? <TextLink link={link} className="mt-auto pt-2" /> : null}
    </Card>
  )
}
