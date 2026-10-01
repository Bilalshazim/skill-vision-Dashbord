import { Bar, BarChart, BarXAxis, BarYAxis, ChartTooltip, Grid } from '@/components/charts'
import { ChartDataTable } from '@/components/patterns/ChartDataTable'
import { ChartLegend } from '@/components/patterns/ChartLegend'
import { seriesColors } from '@/lib/chart-colors'
import { cn } from '@/lib/utils'

export type BarSeries = { key: string; label: string; reference?: boolean }

// Barre per categoria (Bklit BarChart): il confronto fra competenze, fra
// dimensioni o fra persone, e "ottenuto contro atteso" su dimensioni (il
// Composed di Bklit ha solo l'asse del tempo: DECISIONI, "Composed solo sul
// tempo"). Colori dalle regole della Fase 5 (lib/chart-colors.ts). Il fondo
// scala è fisso (`valueMax`, 10 per i punteggi): due grafici si confrontano.
// Nomi delle serie sotto il grafico, valori in tabella per i lettori di schermo.
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
  height?: 'sm' | 'md' | 'lg'
  format?: (n: number) => string
  className?: string
}) {
  const colors = seriesColors(series)
  const data = rows.map((r) => ({ name: r.label, ...Object.fromEntries(series.map((s) => [s.key, r.values[s.key] ?? 0])) }))
  return (
    <figure data-slot="category-bars" className={cn('flex flex-col gap-3', className)}>
      <div aria-hidden="true" className={cn('w-full', height === 'sm' ? 'h-44' : height === 'md' ? 'h-64' : 'h-80')}>
        <BarChart
          data={data}
          xDataKey="name"
          aspectRatio="auto"
          className="h-full"
          orientation={orientation}
          valueMax={valueMax}
          margin={orientation === 'horizontal' ? { top: 8, right: 16, bottom: 8, left: 208 } : { top: 16, right: 8, bottom: 40, left: 32 }}
        >
          <Grid horizontal={orientation === 'vertical'} vertical={orientation === 'horizontal'} />
          {series.map((s, i) => (
            <Bar key={s.key} dataKey={s.key} fill={colors[i]} lineCap={4} />
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
