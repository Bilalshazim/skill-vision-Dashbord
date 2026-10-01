import { Area, ChartTooltip, ComposedChart, Grid, Line, SeriesBar, XAxis, YAxis } from '@/components/charts'
import { ChartDataTable } from '@/components/patterns/ChartDataTable'
import { ChartLegend } from '@/components/patterns/ChartLegend'
import { seriesColors } from '@/lib/chart-colors'
import { cn } from '@/lib/utils'

export type TrendSeries = {
  key: string
  label: string
  /** `line` (default), `area` (linea con riempimento piatto e tenue), `bar`. */
  kind?: 'line' | 'area' | 'bar'
  /** Un riferimento (benchmark, obiettivo): linea tratteggiata in `muted-foreground`. */
  reference?: boolean
  /** Asse a destra, per una seconda unità di misura (es. ticket accanto a CSAT %). */
  axis?: 'left' | 'right'
}

// L'andamento nel tempo (Bklit ComposedChart: Line, Area e SeriesBar sullo
// stesso asse del tempo — DECISIONI, "Grafici approvati", G3, G10, G11).
// Ogni punto ha la sua data (`date`) e la sua etichetta (`label`, es. "Apr",
// "Sett. 3"), che l'asse e il tooltip mostrano al posto della data.
// Colori dalle regole della Fase 5; un riferimento è sempre tratteggiato.
// `scale`: per i punteggi l'asse copre l'intera scala del dato (0–10, 0–100
// per le percentuali, 1–5), non i soli valori presenti — una variazione di
// due decimi non deve sembrare un crollo (DECISIONI, "Asse y fisso").
// Per i conteggi (ticket) si lascia l'asse adattato ai dati.
// Riempimenti piatti (regola 4: niente sfumature). Nomi delle serie sotto il
// grafico, valori in tabella per i lettori di schermo.
export function TrendChart({
  title,
  points,
  series,
  height = 'md',
  scale,
  format,
  className,
}: {
  title: string
  points: { date: Date; label: string; values: Record<string, number | null | undefined> }[]
  series: TrendSeries[]
  height?: 'sm' | 'md' | 'lg'
  /** Scala fissa per asse: `{ left: [0, 10] }`, `{ right: [0, 100] }`. */
  scale?: { left?: [number, number]; right?: [number, number] }
  format?: (n: number) => string
  className?: string
}) {
  const colors = seriesColors(series)
  const data = points.map((p) => ({ date: p.date, label: p.label, ...Object.fromEntries(series.map((s) => [s.key, p.values[s.key] ?? 0])) }))
  const hasRight = series.some((s) => s.axis === 'right')
  // Con le barre, la prima e l'ultima sono centrate sul bordo del grafico:
  // margine ed etichette degli assi si scostano di mezza barra (maxBarSize
  // 32), così le barre non le coprono.
  const barPad = series.some((s) => s.kind === 'bar') ? 16 : 0
  return (
    <figure data-slot="trend-chart" className={cn('flex flex-col gap-3', className)}>
      <div aria-hidden="true" className={cn('w-full', height === 'sm' ? 'h-40' : height === 'md' ? 'h-60' : 'h-80')}>
        <ComposedChart data={data} xDataKey="date" aspectRatio="auto" className="h-full" maxBarSize={32} yDomains={scale} margin={{ top: 16, right: hasRight ? 48 + barPad : 16 + barPad, bottom: 32, left: 40 + barPad }}>
          <Grid horizontal />
          {series.map((s, i) => {
            const yAxisId = s.axis ?? 'left'
            if (s.kind === 'bar') return <SeriesBar key={s.key} dataKey={s.key} fill={colors[i]} radius={4} />
            if (s.kind === 'area' && !s.reference)
              return <Area key={s.key} dataKey={s.key} yAxisId={yAxisId} fill={colors[i]} stroke={colors[i]} fillOpacity={0.12} gradientToOpacity={0.12} strokeWidth={2} />
            return <Line key={s.key} dataKey={s.key} yAxisId={yAxisId} stroke={colors[i]} strokeWidth={2} fadeEdges={false} dashFromIndex={s.reference ? 0 : undefined} />
          })}
          <XAxis numTicks={Math.min(points.length, 8)} />
          <YAxis formatValue={format} labelInset={barPad} />
          {hasRight ? <YAxis yAxisId="right" orientation="right" formatValue={format} labelInset={barPad} /> : null}
          <ChartTooltip />
        </ComposedChart>
      </div>
      <figcaption>
        <ChartLegend items={series.map((s, i) => ({ label: s.label, color: colors[i], reference: s.reference, kind: s.kind === 'bar' ? 'bar' : 'line' }))} />
      </figcaption>
      <ChartDataTable title={title} rowHeader="Periodo" columns={series} rows={points.map((p) => ({ label: p.label, values: series.map((s) => p.values[s.key]) }))} format={format} />
    </figure>
  )
}
