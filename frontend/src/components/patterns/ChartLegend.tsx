import { cn } from '@/lib/utils'

export type MarkerShape = 'circle' | 'square' | 'diamond' | 'triangle' | 'triangle-down'
export type LegendItem = { label: string; color: string; reference?: boolean; kind?: 'line' | 'bar' | 'shape'; shape?: MarkerShape }

// La forma di un punto, centrata in (cx, cy): la stessa nel grafico e nella
// legenda, così una fascia si riconosce anche senza il colore.
export function markerPath(shape: MarkerShape, cx: number, cy: number, r: number): string {
  switch (shape) {
    case 'square':
      return `M${cx - r * 0.85},${cy - r * 0.85}h${r * 1.7}v${r * 1.7}h${-r * 1.7}Z`
    case 'diamond':
      return `M${cx},${cy - r * 1.15}L${cx + r * 1.15},${cy}L${cx},${cy + r * 1.15}L${cx - r * 1.15},${cy}Z`
    case 'triangle':
      return `M${cx},${cy - r * 1.15}L${cx + r * 1.1},${cy + r * 0.85}L${cx - r * 1.1},${cy + r * 0.85}Z`
    case 'triangle-down':
      return `M${cx},${cy + r * 1.15}L${cx + r * 1.1},${cy - r * 0.85}L${cx - r * 1.1},${cy - r * 0.85}Z`
    default:
      return `M${cx - r},${cy}a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 ${-r * 2},0`
  }
}

// I nomi delle serie di un grafico, subito sotto il grafico (non a lato:
// CLAUDE.md, Fase 5), ciascuno con un campione della sua forma — linea piena,
// linea tratteggiata per un riferimento, quadrato per una barra, la forma
// del punto in una dispersione — così la
// serie si riconosce anche senza distinguere il colore (regola 10).
export function ChartLegend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <ul data-slot="chart-legend" className={cn('flex flex-wrap gap-x-4 gap-y-1 text-app-small text-muted-foreground', className)}>
      {items.map((it) => (
        <li key={it.label} className="inline-flex items-center gap-2">
          {it.kind === 'shape' ? (
            <svg width="12" height="12" aria-hidden="true" className="shrink-0">
              <path d={markerPath(it.shape ?? 'circle', 6, 6, 4.5)} fill={it.color} />
            </svg>
          ) : it.kind === 'bar' ? (
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
