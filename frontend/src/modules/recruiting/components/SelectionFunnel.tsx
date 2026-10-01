import { FunnelChart } from '@/components/charts'
import { ChartDataTable } from '@/components/patterns/ChartDataTable'
import { EmptyState } from '@/components/patterns/EmptyState'
import type { FunnelStage } from '@/modules/recruiting/lib/use-recruiting-home-data'

// G8 (DECISIONI): l'imbuto di selezione con il Funnel di Bklit. Le fasi
// (Candidature → Screening → Test → Colloqui → Assunti) sono conteggi
// cumulativi, quindi un imbuto vero le legge com'è: ogni fase con il suo
// numero e la percentuale sulla prima. Una serie sola: `chart-mono`, senza
// aloni (un solo strato). Prima era un anello di "persi per fase" con
// cinque colori categorici.
export function SelectionFunnel({ stages }: { stages: FunnelStage[] }) {
  const total = stages[0]?.count ?? 0
  const note = stages.find((s) => s.note)?.note
  if (!total) {
    return <EmptyState size="sm" description="L'imbuto compare quando ci sono candidature per le posizioni aperte." />
  }
  return (
    <figure className="flex flex-col gap-3">
      <div aria-hidden="true" className="h-56 w-full">
        <FunnelChart
          data={stages.map((s) => ({ label: s.label, value: s.count, displayValue: s.count.toLocaleString('it-IT') }))}
          color="var(--chart-mono)"
          layers={1}
          orientation="horizontal"
          showLabels
          showValues
          showPercentage
          formatPercentage={(p) => `${Math.round(p)}%`}
          className="h-full"
        />
      </div>
      <ChartDataTable
        title="Imbuto di selezione"
        rowHeader="Fase"
        columns={[{ label: 'Persone' }, { label: '% sulle candidature' }]}
        rows={stages.map((s) => ({ label: s.label, values: [s.count, total ? Math.round((s.count / total) * 100) : 0] }))}
        format={(n) => n.toLocaleString('it-IT')}
      />
      {note ? <figcaption className="text-app-caption text-muted-foreground">* {note}</figcaption> : null}
    </figure>
  )
}
