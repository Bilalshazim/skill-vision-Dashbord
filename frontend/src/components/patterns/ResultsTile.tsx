import type { ReactNode } from 'react'

import { type ResultsLink, TextLink } from '@/components/patterns/EuroFigure'
import { MiniChart, type MiniChartSpec } from '@/components/patterns/MiniChart'
import { Card } from '@/components/ui/card'

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
export function ResultsTile({ title, value, body, list, link, chart }: ResultsIssue) {
  return (
    <Card data-slot="results-tile" className="gap-1 bg-muted">
      <h3 className="label-mono text-muted-foreground">{title}</h3>
      <div className="text-app-subtitle font-semibold text-foreground">{value}</div>
      {body ? <div className="text-app-small text-muted-foreground">{body}</div> : null}
      {chart ? <MiniChart spec={chart} className="mt-2" /> : null}
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
