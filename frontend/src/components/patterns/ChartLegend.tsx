import { cn } from '@/lib/utils'

export type LegendItem = { label: string; color: string; reference?: boolean; kind?: 'line' | 'bar' }

// I nomi delle serie di un grafico, subito sotto il grafico (non a lato:
// CLAUDE.md, Fase 5), ciascuno con un campione della sua forma — linea piena,
// linea tratteggiata per un riferimento, quadrato per una barra — così la
// serie si riconosce anche senza distinguere il colore (regola 10).
export function ChartLegend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <ul data-slot="chart-legend" className={cn('flex flex-wrap gap-x-4 gap-y-1 text-app-small text-muted-foreground', className)}>
      {items.map((it) => (
        <li key={it.label} className="inline-flex items-center gap-2">
          {it.kind === 'bar' ? (
            <span aria-hidden="true" className="size-2.5 shrink-0 rounded-xs" style={{ background: it.color }} />
          ) : (
            <svg width="16" height="8" aria-hidden="true" className="shrink-0">
              <line x1="0" y1="4" x2="16" y2="4" stroke={it.color} strokeWidth="2" strokeDasharray={it.reference ? '4 3' : undefined} />
            </svg>
          )}
          <span className={cn(!it.reference && 'font-medium text-foreground')}>{it.label}</span>
        </li>
      ))}
    </ul>
  )
}
