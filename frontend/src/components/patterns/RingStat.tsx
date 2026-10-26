import type { ReactNode } from 'react'

import { Ring, RingChart } from '@/components/charts'
import { fmtDec } from '@/lib/format'
import { cn } from '@/lib/utils'

// Un punteggio singolo in un riquadro piccolo, con l'anello accanto (Bklit
// Ring — "punteggio singolo → Gauge o Ring", CLAUDE.md, Fase 5). Anello
// esterno: il punteggio in `chart-mono`; anello interno, se c'è, l'atteso
// in `chart-compare`, che arretra. Il numero si scrive una volta, a fianco
// e non al centro; testo a sinistra. Il colore non porta significato: la
// riga sotto dice atteso e scarto a parole. Per griglie di competenze, dove
// un elenco di barre sarebbe troppo lungo.
export function RingStat({
  label,
  value,
  max = 10,
  reference,
  note,
  className,
}: {
  label: ReactNode
  value: number
  max?: number
  /** Il valore atteso, sulla stessa scala: secondo anello, tenue. */
  reference?: number
  note?: ReactNode
  className?: string
}) {
  const pct = (n: number) => Math.max(0, Math.min(100, (n / max) * 100))
  // Bklit disegna il primo anello all'interno: l'atteso va per primo.
  const rings = [
    ...(reference !== undefined ? [{ label: 'Atteso', value: pct(reference), maxValue: 100, color: 'var(--chart-compare)' }] : []),
    { label: 'Punteggio', value: pct(value), maxValue: 100, color: 'var(--chart-mono)' },
  ]
  return (
    <div data-slot="ring-stat" className={cn('flex min-w-0 items-center gap-4 rounded-md border border-border bg-card p-4', className)}>
      <div className="size-16 shrink-0" aria-hidden="true">
        <RingChart data={rings} size={64} strokeWidth={reference !== undefined ? 7 : 10} ringGap={2} baseInnerRadius={reference !== undefined ? 16 : 22}>
          {rings.map((r, i) => (
            <Ring key={r.label} index={i} />
          ))}
        </RingChart>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-app-small text-foreground">{label}</span>
        <span className="text-app-subtitle tabular-nums text-foreground">
          {fmtDec(value)}
          <span className="ml-1 text-app-small font-normal text-muted-foreground">/{max}</span>
        </span>
        {note ? <span className="text-app-small text-muted-foreground">{note}</span> : null}
      </div>
    </div>
  )
}
