import { Ring, RingChart } from '@/components/charts'
import { cn } from '@/lib/utils'

// Una percentuale di completamento come anello (Bklit Ring — G6,
// DECISIONI): un solo anello in `chart-mono` sul binario `muted`. Il numero
// lo scrive chi lo usa (StatCard): dentro una card non si ripete al centro
// (CLAUDE.md, "il numero si scrive una volta"). Nessun alone.
const RING_COLOR = { mono: 'var(--chart-mono)', success: 'var(--success)', warning: 'var(--warning)', destructive: 'var(--destructive)' } as const

// `tone`: `mono` di default; success / warning / destructive solo per una
// fascia con la parola accanto (il colore non è l'unico segnale).
export function CompletionRing({ value, label, tone = 'mono', className }: { value: number; label: string; tone?: keyof typeof RING_COLOR; className?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div data-slot="completion-ring" role="img" aria-label={`${label}: ${Math.round(v)}%`} className={cn('mx-auto size-24', className)}>
      <RingChart data={[{ label, value: v, maxValue: 100, color: RING_COLOR[tone] }]} strokeWidth={8} baseInnerRadius={32} size={96}>
        <Ring index={0} />
      </RingChart>
    </div>
  )
}
