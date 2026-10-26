import { Bar, BarChart, BarXAxis, BarYAxis, ChartTooltip, Grid } from '@/components/charts'
import { ChartDataTable } from '@/components/patterns/ChartDataTable'
import { ChartLegend } from '@/components/patterns/ChartLegend'
import { seriesColors } from '@/lib/chart-colors'
import { fmtDec } from '@/lib/format'
import { cn } from '@/lib/utils'

export type BarSeries = { key: string; label: string; reference?: boolean }

const HEIGHT = { sm: 'h-44', md: 'h-64', lg: 'h-80', xl: 'h-160', '2xl': 'h-240' } as const

// `auto`: l'altezza giusta per il numero di righe, perché le etichette non si sovrappongano.
const autoHeight = (n: number): keyof typeof HEIGHT => (n <= 6 ? 'md' : n <= 10 ? 'lg' : n <= 20 ? 'xl' : '2xl')

// Barre per categoria (Bklit BarChart): il confronto fra competenze, fra
// dimensioni o fra persone, e "ottenuto contro atteso" su dimensioni (il
// Composed di Bklit ha solo l'asse del tempo: DECISIONI, "Composed solo sul
// tempo"). Colori dalle regole della Fase 5 (lib/chart-colors.ts). Il fondo
// scala è fisso (`valueMax`, 10 per i punteggi): due grafici si confrontano.
// Ogni barra porta il suo valore (un decimale, o `format`): senza, una barra
// non si legge (CLAUDE.md, regole dei pattern dei grafici). Nomi delle serie
// sotto il grafico, valori in tabella per i lettori di schermo.
export function CategoryBars({
  title,
  rows,
  series,
  valueMax,
  orientation = 'vertical',
  height = 'md',
  format,
  className,
}: {
  title: string
  rows: { label: string; values: Record<string, number | null | undefined> }[]
  series: BarSeries[]
  valueMax?: number
  orientation?: 'vertical' | 'horizontal'
  /** `xl` / `2xl`: elenchi lunghi in orizzontale (fino a ~20 e ~40 righe); `auto` sceglie dal numero di righe. */
  height?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'auto'
  format?: (n: number) => string
  className?: string
}) {
  const colors = seriesColors(series)
  const data = rows.map((r) => ({ name: r.label, ...Object.fromEntries(series.map((s) => [s.key, r.values[s.key] ?? 0])) }))
  return (
    <figure data-slot="category-bars" className={cn('flex flex-col gap-3', className)}>
      <div aria-hidden="true" className={cn('w-full', HEIGHT[height === 'auto' ? autoHeight(rows.length) : height])}>
        <BarChart
          data={data}
          xDataKey="name"
          aspectRatio="auto"
          className="h-full"
          orientation={orientation}
          valueMax={valueMax}
          margin={orientation === 'horizontal' ? { top: 8, right: 40, bottom: 8, left: 208 } : { top: 24, right: 8, bottom: 40, left: 32 }}
        >
          <Grid horizontal={orientation === 'vertical'} vertical={orientation === 'horizontal'} fadeHorizontal={false} />
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} fill={colors[i]} lineCap={4} valueLabel={(v) => (format ? format(v) : fmtDec(v))} />
          ))}
          {orientation === 'horizontal' ? <BarYAxis /> : <BarXAxis showAllLabels />}
          <ChartTooltip />
        </BarChart>
      </div>
      {series.length > 1 ? (
        <figcaption>
          <ChartLegend items={series.map((s, i) => ({ label: s.label, color: colors[i], reference: s.reference, kind: 'bar' }))} />
        </figcaption>
      ) : null}
      <ChartDataTable title={title} columns={series} rows={rows.map((r) => ({ label: r.label, values: series.map((s) => r.values[s.key]) }))} format={format} />
    </figure>
  )
}
