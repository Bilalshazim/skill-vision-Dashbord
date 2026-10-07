import { cn } from '@/lib/utils'
import { level } from '@/modules/assessment/gestione5p/model'

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
// Il colore di ogni voto è quello della sua fascia (1–2 non adeguato … 9–10
// eccellente); la fascia è anche scritta accanto alla barra e nella legenda.
const BAND = ['', 'surface-danger text-destructive', 'surface-warning text-warning', 'bg-muted text-foreground', 'surface-success text-success', 'border border-foreground bg-card text-foreground'] as const

// La barra di voto 1–10, numerata e colorata (Foglio 7). È un gruppo di
// opzioni: frecce e invio come i radio, il voto scelto ha il bordo marcato.
// `fill`: come nella scheda del valutatore, i voti fino a quello scelto restano colorati e gli altri si spengono.
export function ScoreBar({ value, onChange, label, fill = false }: { value: number; onChange: (n: number) => void; label: string; fill?: boolean }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-1">
      {SCORES.map((n) => {
        const on = value === n
        const lit = fill ? value > 0 && n <= value : true
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={on}
            title={level(n).t}
            onClick={() => onChange(n)}
            className={cn(
              'size-9 rounded-sm font-mono text-app-small tabular-nums outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              lit ? BAND[level(n).c] : 'bg-muted text-muted-foreground',
              on ? 'font-bold ring-2 ring-foreground ring-offset-2 ring-offset-background' : fill && lit ? 'opacity-70 hover:opacity-100' : fill ? 'hover:text-foreground' : 'opacity-70 hover:opacity-100',
            )}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}
