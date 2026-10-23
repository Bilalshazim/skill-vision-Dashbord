import { FunnelChart } from '@/components/charts'
import { ChartDataTable } from '@/components/patterns/ChartDataTable'
import { EmptyState } from '@/components/patterns/EmptyState'
import { PREVIOUS, type StageCounts, STAGES } from '@/modules/recruiting/lib/position-funnel'

/** La quota di una fase sulla precedente, in percentuale intera; `null` per la prima o se la precedente è vuota. */
export function shareOfPrevious(counts: StageCounts, key: keyof StageCounts): number | null {
  const prev = PREVIOUS[key]
  if (!prev || !counts[prev]) return null
  return Math.round((counts[key] / counts[prev]) * 100)
}

// G8 (DECISIONI): l'imbuto di selezione con il Funnel di Bklit, sulle fasi del
// menu (lib/position-funnel.ts). Ogni fase porta il numero e la quota sulla
// fase precedente (CLAUDE.md, Fase 6): la percentuale di Bklit, che è sempre
// sulla prima fase, è spenta; la quota sul totale sta nella tabella. Una
// serie sola: `chart-mono`, senza aloni. Se oltre la prima fase è tutto a zero
// non si disegna un grafico di zeri: stato vuoto.
export function SelectionFunnel({ counts, height = 'md' }: { counts: StageCounts; height?: 'md' | 'lg' }) {
  if (!counts.cv) {
    return <EmptyState size="sm" title="Nessun CV caricato." description="L'imbuto compare quando arrivano i primi CV, da CV & Esportazione." />
  }
  if (STAGES.slice(1).every((s) => !counts[s.key])) {
    return (
      <EmptyState
        size="sm"
        title={`${counts.cv} CV caricati, nessuno ancora preselezionato.`}
        description="L'imbuto si disegna dalla preselezione in poi: si preselezionano i CV da CV preselezionati."
      />
    )
  }
  return (
    <figure className="flex flex-col gap-3">
      <div aria-hidden="true" className={height === 'lg' ? 'h-72 w-full' : 'h-56 w-full'}>
        <FunnelChart
          data={STAGES.map((s) => {
            const share = shareOfPrevious(counts, s.key)
            return { label: s.label, value: counts[s.key], displayValue: share == null ? counts[s.key].toLocaleString('it-IT') : `${counts[s.key].toLocaleString('it-IT')} · ${share}%` }
          })}
          color="var(--chart-mono)"
          layers={1}
          orientation="horizontal"
          showLabels
          showValues
          showPercentage={false}
          className="h-full"
        />
      </div>
      <figcaption className="text-app-caption text-muted-foreground">Accanto al numero, la quota sulla fase precedente.</figcaption>
      <ChartDataTable
        title="Imbuto di selezione"
        rowHeader="Fase"
        columns={[{ label: 'Persone' }, { label: '% sulla precedente' }, { label: '% sui CV caricati' }]}
        rows={STAGES.map((s) => ({ label: s.label, values: [counts[s.key], shareOfPrevious(counts, s.key) ?? 100, Math.round((counts[s.key] / counts.cv) * 100)] }))}
        format={(n) => n.toLocaleString('it-IT')}
      />
    </figure>
  )
}
