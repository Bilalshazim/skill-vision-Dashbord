import { Ring, RingCenter, RingChart } from '@/components/charts'
import { cn } from '@/lib/utils'

// Una percentuale di completamento come anello (Bklit Ring — G6,
// DECISIONI): un solo anello in `chart-mono` sul binario `muted`, il numero
// al centro. Nessun alone.
export function CompletionRing({ value, label, className }: { value: number; label: string; className?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div data-slot="completion-ring" role="img" aria-label={`${label}: ${Math.round(v)}%`} className={cn('mx-auto size-24', className)}>
      <RingChart data={[{ label, value: v, maxValue: 100, color: 'var(--chart-mono)' }]} strokeWidth={8} baseInnerRadius={32} size={96}>
        <Ring index={0} />
        <RingCenter defaultLabel="su 100" formatOptions={{ style: 'decimal', maximumFractionDigits: 0 }} />
      </RingChart>
    </div>
  )
}
