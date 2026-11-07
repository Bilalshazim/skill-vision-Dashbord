import { Bar, BarChart, BarReference, BarXAxis, BarYAxis, ChartTooltip, Grid } from '@/components/charts'
import { ChartDataTable } from '@/components/patterns/ChartDataTable'
import { ChartLegend } from '@/components/patterns/ChartLegend'
import { seriesColors } from '@/lib/chart-colors'
import { fmtDec } from '@/lib/format'
import { cn } from '@/lib/utils'

const HL_KEY = '__highlight'

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
//
// Una serie `reference` (atteso, benchmark) non è una seconda barra: è un
// segno tratteggiato sulla barra, in `chart-reference` (BarReference;
// fondamenta, "Riferimento"; CLAUDE.md, Fase 5, rivisto il 2026-10-26).
export function CategoryBars({
  title,
  rows,
  series,
  valueMax,
  orientation = 'vertical',
  height = 'md',
  wrapLabels = false,
  format,
  highlight,
  compact = false,
  barNote,
  className,
}: {
  title: string
  rows: { label: string; values: Record<string, number | null | undefined> }[]
  series: BarSeries[]
  valueMax?: number
  orientation?: 'vertical' | 'horizontal'
  /** `xl` / `2xl`: elenchi lunghi in orizzontale (fino a ~20 e ~40 righe); `auto` sceglie dal numero di righe. */
  height?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'auto'
  /** In verticale: nomi lunghi su più righe sotto ogni gruppo invece che su una (che si sovrappone). */
  wrapLabels?: boolean
  format?: (n: number) => string
  /** Con una serie sola: l'etichetta della riga da mettere in evidenza (il valore che conta, uno per grafico) in `chart-highlight`. */
  highlight?: string
  /** In orizzontale: barre sottili e nomi allineati a sinistra (tavola «Colori dei grafici»), senza griglia. Il nome in evidenza è in grassetto. */
  compact?: boolean
  /** Al posto del valore in fondo alla barra: lo scarto dall'atteso («−1,2»). Il valore resta nel tooltip e in tabella. */
  barNote?: (rowLabel: string) => string
  className?: string
}) {
  const colors = seriesColors(series)
  const fmt = (v: number) => (format ? format(v) : fmtDec(v))
  const endLabel = (v: number, d: Record<string, unknown>) => (barNote ? barNote(String(d.name)) : fmt(v))
  const bars = series.filter((s) => !s.reference)
  const refs = series.filter((s) => s.reference)
  // Senza fondo scala fisso, il riferimento deve stare nel grafico: Bklit
  // calcola il massimo solo sulle barre.
  const max = valueMax ?? (refs.length ? Math.max(0, ...rows.flatMap((r) => series.map((s) => r.values[s.key] ?? 0))) || undefined : undefined)
  // Il valore che conta (CLAUDE.md, Fase 5): la riga in evidenza va in una
  // seconda serie impilata, così Bklit la colora a parte senza toccare la
  // barra. Nella serie principale quella riga vale -0, che somma come zero e
  // non scrive l'etichetta (le altre righe a zero scrivono "0").
  const hl = highlight !== undefined && bars.length === 1 ? bars[0].key : null
  const data = rows.map((r) => {
    const base = Object.fromEntries(series.map((s) => [s.key, r.values[s.key] ?? 0]))
    if (!hl) return { name: r.label, ...base }
    const on = r.label === highlight
    return { name: r.label, ...base, [hl]: on ? -0 : base[hl], [HL_KEY]: on ? base[hl] : 0 }
  })
  return (
    <figure data-slot="category-bars" className={cn('flex flex-col gap-3', className)}>
      <div aria-hidden="true" className={cn('w-full', !compact && HEIGHT[height === 'auto' ? autoHeight(rows.length) : height])} style={compact ? { height: rows.length * 32 + 16 } : undefined}>
        <BarChart
          data={data}
          xDataKey="name"
          aspectRatio="auto"
          className="h-full"
          orientation={orientation}
          barWidth={compact ? 16 : undefined}
          valueMax={max}
          stacked={!!hl}
          margin={compact ? { top: 8, right: 40, bottom: 8, left: 150 } : orientation === 'horizontal' ? { top: 8, right: 40, bottom: 8, left: 208 } : { top: 24, right: 8, bottom: wrapLabels ? 64 : 40, left: 32 }}
        >
          {compact ? null : <Grid horizontal={orientation === 'vertical'} vertical={orientation === 'horizontal'} fadeHorizontal={false} />}
          {bars.map((s) => (
            <Bar key={s.key} dataKey={s.key} fill={colors[series.indexOf(s)]} lineCap={4} valueLabel={(v, d) => (Object.is(v, -0) ? '' : endLabel(v, d))} valueLabelPast={refs[0]?.key} />
          ))}
          {hl ? <Bar dataKey={HL_KEY} fill="var(--chart-highlight)" outline="var(--chart-highlight-stroke)" lineCap={4} valueLabel={(v, d) => (v ? endLabel(v, d) : '')} valueLabelPast={refs[0]?.key} /> : null}
          {refs.map((s) => (
            <BarReference key={s.key} referenceKey={s.key} />
          ))}
          {orientation === 'horizontal' ? <BarYAxis alignLeft={compact} emphasize={compact ? highlight : undefined} /> : <BarXAxis showAllLabels wrapLabels={wrapLabels} />}
          {/* Il nome della serie, non la chiave del dato, e il valore nel formato del grafico. La riga in evidenza sta nella serie a parte. */}
          <ChartTooltip rows={(p) => series.map((s, i) => ({ color: colors[i], label: s.label, value: fmt(Number((s.key === hl && p[HL_KEY]) || p[s.key]) || 0) }))} />
        </BarChart>
      </div>
      {series.length > 1 ? (
        <figcaption>
          <ChartLegend items={series.map((s, i) => ({ label: s.label, color: colors[i], reference: s.reference, kind: s.reference ? 'line' : 'bar' }))} />
        </figcaption>
      ) : null}
      <ChartDataTable title={title} columns={series} rows={rows.map((r) => ({ label: r.label, values: series.map((s) => r.values[s.key]) }))} format={format} />
    </figure>
  )
}
