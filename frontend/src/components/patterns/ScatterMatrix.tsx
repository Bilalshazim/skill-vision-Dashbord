import { ParentSize } from '@visx/responsive'
import { scaleLinear } from '@visx/scale'
import { useState } from 'react'

import { ChartDataTable } from '@/components/patterns/ChartDataTable'
import { ChartLegend } from '@/components/patterns/ChartLegend'
import { cn } from '@/lib/utils'

export type ScatterPoint = { id: string; label: string; x: number; y: number; group: string }
export type ScatterGroup = { key: string; label: string; color: string }

// Una persona per punto su due punteggi (G4, DECISIONI: la matrice di
// classificazione soft × hard). Lo Scatter di Bklit ha solo l'asse del
// tempo, quindi questo è disegnato con visx — la base su cui Bklit è
// costruito, già fra le dipendenze — con gli stessi token: griglia su
// `border`, testi `muted-foreground`, punti nel colore della loro fascia e
// con il nome della fascia nella legenda sotto (regola 10). Ogni punto è un
// bottone: al clic, `onPointClick` (il pannello del dipendente). I valori
// sono anche in tabella per i lettori di schermo.
export function ScatterMatrix({
  title,
  points,
  groups,
  xLabel,
  yLabel,
  max = 10,
  onPointClick,
  className,
}: {
  title: string
  points: ScatterPoint[]
  groups: ScatterGroup[]
  xLabel: string
  yLabel: string
  max?: number
  onPointClick?: (id: string) => void
  className?: string
}) {
  const [hover, setHover] = useState<string | null>(null)
  const colorOf = (g: string) => groups.find((x) => x.key === g)?.color ?? 'var(--muted-foreground)'
  const ticks = [0, 2, 4, 6, 8, 10].filter((t) => t <= max)
  return (
    <figure data-slot="scatter-matrix" className={cn('flex flex-col gap-3', className)}>
      <div className="h-80 w-full">
        <ParentSize debounceTime={10}>
          {({ width, height }) => {
            if (width < 40 || height < 40) return null
            const m = { top: 12, right: 16, bottom: 40, left: 44 }
            const w = width - m.left - m.right
            const h = height - m.top - m.bottom
            const x = scaleLinear({ domain: [0, max], range: [0, w] })
            const y = scaleLinear({ domain: [0, max], range: [h, 0] })
            const hovered = points.find((p) => p.id === hover)
            return (
              <svg width={width} height={height} role="group" aria-label={title}>
                <g transform={`translate(${m.left},${m.top})`}>
                  {ticks.map((t) => (
                    <g key={t}>
                      <line x1={0} x2={w} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" />
                      <line x1={x(t)} x2={x(t)} y1={0} y2={h} stroke="var(--chart-grid)" />
                      <text x={-8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={12} fill="var(--muted-foreground)">
                        {t}
                      </text>
                      <text x={x(t)} y={h + 18} textAnchor="middle" fontSize={12} fill="var(--muted-foreground)">
                        {t}
                      </text>
                    </g>
                  ))}
                  <text x={w / 2} y={h + 36} textAnchor="middle" fontSize={12} fill="var(--muted-foreground)">
                    {xLabel}
                  </text>
                  <text transform={`translate(-32,${h / 2}) rotate(-90)`} textAnchor="middle" fontSize={12} fill="var(--muted-foreground)">
                    {yLabel}
                  </text>
                  {points.map((p) => (
                    <circle
                      key={p.id}
                      cx={x(Math.max(0, Math.min(max, p.x)))}
                      cy={y(Math.max(0, Math.min(max, p.y)))}
                      r={hover === p.id ? 7 : 5}
                      fill={colorOf(p.group)}
                      stroke="var(--chart-background)"
                      strokeWidth={2}
                      role={onPointClick ? 'button' : undefined}
                      tabIndex={onPointClick ? 0 : undefined}
                      aria-label={`${p.label}: ${xLabel} ${p.x.toFixed(1)}, ${yLabel} ${p.y.toFixed(1)}`}
                      className={cn(onPointClick && 'cursor-pointer outline-none focus-visible:stroke-ring')}
                      onMouseEnter={() => setHover(p.id)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(p.id)}
                      onBlur={() => setHover(null)}
                      onClick={() => onPointClick?.(p.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onPointClick?.(p.id)
                        }
                      }}
                    />
                  ))}
                  {hovered ? (
                    <text x={x(hovered.x)} y={y(hovered.y) - 12} textAnchor="middle" fontSize={12} fontWeight={500} fill="var(--foreground)">
                      {hovered.label}
                    </text>
                  ) : null}
                </g>
              </svg>
            )
          }}
        </ParentSize>
      </div>
      <figcaption>
        <ChartLegend items={groups.map((g) => ({ label: g.label, color: g.color, kind: 'bar' }))} />
      </figcaption>
      <ChartDataTable title={title} rowHeader="Persona" columns={[{ label: xLabel }, { label: yLabel }]} rows={points.map((p) => ({ label: p.label, values: [p.x, p.y] }))} />
    </figure>
  )
}
