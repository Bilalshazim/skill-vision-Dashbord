import { Gauge } from '@/components/charts'
import { cn } from '@/lib/utils'

// Un punteggio singolo come indicatore ad arco (Bklit Gauge — G5, DECISIONI),
// usato come è fatto (CLAUDE.md, Fase 5, verificato il 2026-10-23): arco
// intero (135°–405°, il default), il numero al centro in `centerValue` con
// la sua etichetta (`defaultLabel`) e l'unità in `suffix`, traccia di default
// (`--border`), nessun contenitore che lo ritagli. Unico scostamento: le
// tacche piene in `chart-mono` invece di `chart-1`, perché una serie sola
// prende `chart-mono` (regole di colore della Fase 5) — in DECISIONI.
// Il punteggio è su 10 (`max`); il numero non si ripete fuori dal grafico.
// Misura fissa (il rapporto 21/16 di Bklit): il default di Bklit chiede almeno
// 300px di larghezza, che in una colonna stretta scorre. `md` 240 × 183,
// `sm` 192 × 146 per una riga di quattro card.
export function ScoreGauge({ value, max = 10, label, size = 'md', className }: { value: number; max?: number; label: string; size?: 'sm' | 'md'; className?: string }) {
  const [w, h] = size === 'sm' ? [192, 146] : [240, 183]
  const v = Math.max(0, Math.min(max, value))
  const shown = Math.round(v * 10) / 10
  return (
    <div data-slot="score-gauge" role="img" aria-label={`${label}: ${shown.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} su ${max}`} className={cn('flex justify-start', className)}>
      <Gauge
        width={w}
        height={h}
        value={(v / max) * 100}
        activeFill="var(--chart-mono)"
        centerValue={shown}
        defaultLabel={label}
        suffix={` /${max}`}
        formatOptions={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
      />
    </div>
  )
}
