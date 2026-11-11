import { Ring, RingCenter, RingChart } from '@/components/charts'
import { cn } from '@/lib/utils'

// Una percentuale di completamento come anello (Bklit Ring — G6,
// DECISIONI): un solo anello in `chart-mono` sul binario `muted`. Il numero
// lo scrive chi lo usa (StatCard): dentro una card non si ripete al centro
// (CLAUDE.md, "il numero si scrive una volta"). Nessun alone.
//
// `center`: quando l'anello è il grafico di una frase e non sta in una
// StatCard (pagine dei risultati), il numero va al centro con `centerValue`
// di Bklit, e l'anello è più grande perché il numero si legga.
const RING_COLOR = { mono: 'var(--chart-mono)', highlight: 'var(--chart-highlight-line)', success: 'var(--success)', warning: 'var(--warning)', destructive: 'var(--destructive)' } as const

// `tone`: `mono` di default; success / warning / destructive solo per una
// fascia con la parola accanto (il colore non è l'unico segnale). `highlight`: il
// numero della sezione nell'Impatto delle pagine dei risultati (correzioni del 2026-11-09).
export function CompletionRing({
  value,
  label,
  tone = 'mono',
  center,
  className,
}: {
  value: number
  label: string
  tone?: keyof typeof RING_COLOR
  /** La parola sotto il numero al centro ("in linea"); senza, nessun numero al centro. */
  center?: string
  className?: string
}) {
  const v = Math.max(0, Math.min(100, value))
  const big = center !== undefined
  return (
    <div data-slot="completion-ring" role="img" aria-label={`${label}: ${Math.round(v)}%`} className={cn(big ? 'size-40' : 'mx-auto size-24', className)}>
      <RingChart data={[{ label, value: v, maxValue: 100, color: RING_COLOR[tone] }]} strokeWidth={big ? 12 : 8} baseInnerRadius={big ? 60 : 32} size={big ? 160 : 96}>
        <Ring index={0} />
        {big ? <RingCenter defaultLabel={center} suffix="%" /> : null}
      </RingChart>
    </div>
  )
}
