import { cn } from '@/lib/utils'

// La cascata "dal valore a rischio al rischio residuo" (CLAUDE.md, Fase 6,
// Sintesi della Panoramica) finché non c'è la formula degli euro: la forma
// della cascata, con i passi scritti e i valori come segnaposto dichiarato
// («€ [—]»), a contorno tratteggiato e senza riempimento. Non è un grafico: non
// porta numeri, quindi non disegna altezze vere; quando la formula c'è, al
// suo posto va un grafico (Bklit non ha la cascata: Bar Chart con barre
// sospese o visx, DECISIONI). Primo e ultimo passo partono dalla base, quelli
// in mezzo scendono a gradini.
const SHAPE = [
  { bar: 'h-32', lift: 'mb-0' },
  { bar: 'h-8', lift: 'mb-24' },
  { bar: 'h-8', lift: 'mb-16' },
  { bar: 'h-4', lift: 'mb-12' },
]

export function CascadePlaceholder({ steps, note }: { steps: string[]; note: string }) {
  return (
    <figure data-slot="cascade-placeholder" className="flex flex-col gap-3">
      <div aria-hidden="true" className="flex h-40 items-end gap-2">
        {steps.map((s, i) => {
          const last = i === steps.length - 1
          const shape = last ? { bar: 'h-12', lift: 'mb-0' } : SHAPE[Math.min(i, SHAPE.length - 1)]
          return <div key={s} className={cn('min-w-0 flex-1 rounded-xs border border-dashed border-border-strong', shape.bar, shape.lift)} />
        })}
      </div>
      <ul className="flex gap-2">
        {steps.map((s) => (
          <li key={s} className="min-w-0 flex-1">
            <span className="block font-mono text-app-caption text-foreground">€ [—]</span>
            <span className="block truncate text-app-caption text-muted-foreground">{s}</span>
          </li>
        ))}
      </ul>
      <figcaption className="text-app-caption text-muted-foreground">{note}</figcaption>
    </figure>
  )
}
