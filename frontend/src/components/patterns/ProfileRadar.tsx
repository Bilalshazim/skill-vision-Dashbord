import { RadarArea, RadarAxis, RadarChart, RadarGrid, RadarLabels } from '@/components/charts'
import { ChartDataTable } from '@/components/patterns/ChartDataTable'
import { ChartLegend } from '@/components/patterns/ChartLegend'
import { seriesColors } from '@/lib/chart-colors'
import { cn } from '@/lib/utils'

export type RadarSeries = {
  label: string
  /** Valori per asse, già nella scala del dato (es. 0–10). */
  values: Record<string, number>
  /** `reference`: il profilo atteso o il benchmark, disegnato solo come contorno tratteggiato. */
  reference?: boolean
}

// Il profilo di competenza di una persona (Bklit Radar — DECISIONI, "Grafici
// approvati", R1–R6). Colori dalle regole della Fase 5 (chart-colors.ts):
// una serie principale in `chart-mono`, il riferimento in
// `chart-compare`, solo contorno tratteggiato; tre o più serie principali
// nella famiglia categorica, in ordine. Il valore di ogni asse è scritto
// nella tabella sotto il grafico: si legge senza il colore (regola 10) ed è
// l'alternativa per i lettori di schermo. `max`: il fondo scala del dato (10
// per Assessment, 100 per i Big Five di Recruiting); Bklit lavora in 0–100 e
// la conversione è qui. Il radar è grande abbastanza da leggere le
// etichette degli assi senza sovrapposizioni; se non ci stanno si passa
// `short`, non si rimpicciolisce il radar (CLAUDE.md).
export function ProfileRadar({
  title,
  axes,
  series,
  max = 10,
  format,
  size = 'md',
  className,
}: {
  title: string
  /** `short`: l'etichetta nel grafico quando quella intera non ci sta (la tabella usa sempre `label`). */
  axes: { key: string; label: string; short?: string }[]
  series: RadarSeries[]
  max?: number
  format?: (n: number) => string
  size?: 'sm' | 'md'
  className?: string
}) {
  // Il riferimento va disegnato per primo, sotto la persona.
  const ordered = [...series.filter((s) => s.reference), ...series.filter((s) => !s.reference)]
  const colors = seriesColors(ordered)
  const data = ordered.map((s, i) => ({
    label: s.label,
    color: colors[i],
    values: Object.fromEntries(axes.map((a) => [a.key, Math.max(0, Math.min(100, ((s.values[a.key] ?? 0) / max) * 100))])),
  }))

  return (
    <figure data-slot="profile-radar" className={cn('flex flex-col gap-3', className)}>
      <div className={cn('w-full', size === 'md' ? 'h-112' : 'h-96')} aria-hidden="true">
        <RadarChart data={data} metrics={axes.map((a) => ({ key: a.key, label: a.short ?? a.label }))} margin={64} levels={5} className="mx-auto h-full w-auto max-w-full">
          <RadarGrid showLabels={false} />
          <RadarAxis />
          <RadarLabels fontSize={12} />
          {ordered.map((s, i) => (
            <RadarArea key={s.label} index={i} showPoints={!s.reference} fillOpacity={s.reference ? 0 : 0.15} strokeDasharray={s.reference ? '4 4' : undefined} />
          ))}
        </RadarChart>
      </div>
      <figcaption>
        <ChartLegend items={ordered.map((s, i) => ({ label: s.label, color: colors[i], reference: s.reference }))} />
      </figcaption>
      <ChartDataTable
        visible
        title={title}
        rowHeader="Dimensione"
        columns={ordered.map((s) => ({ label: s.label, reference: s.reference }))}
        rows={axes.map((a) => ({ label: a.label, values: ordered.map((s) => s.values[a.key] ?? null) }))}
        format={format}
      />
    </figure>
  )
}
