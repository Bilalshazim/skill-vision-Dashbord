import type { ReactNode } from 'react'

import { Ring, RingChart } from '@/components/charts'
import { fmtDec } from '@/lib/format'
import { cn } from '@/lib/utils'

// Un punteggio singolo in un riquadro piccolo, con l'anello accanto (Bklit
// Ring — "punteggio singolo → Gauge o Ring", CLAUDE.md, Fase 5). Un anello
// solo, il punteggio in `chart-mono`, traccia di default. L'atteso non è un
// secondo anello (sarebbe la "seconda barra" che le regole del 2026-10-26
// tolgono): si scrive a parole sotto il punteggio, con lo scarto se chi usa
// il pattern lo passa in `note`. Il numero si scrive una volta, a fianco e
// non al centro; testo a sinistra. Per griglie di competenze, dove
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
  /** Il valore atteso, sulla stessa scala: scritto sotto il punteggio se `note` non c'è. */
  reference?: number
  note?: ReactNode
  className?: string
}) {
  const pct = (n: number) => Math.max(0, Math.min(100, (n / max) * 100))
  // Bklit disegna il primo anello all'interno: l'atteso va per primo.
  const rings = [{ label: 'Punteggio', value: pct(value), maxValue: 100, color: 'var(--chart-mono)' }]
  return (
    <div data-slot="ring-stat" className={cn('flex min-w-0 items-center gap-4 rounded-md border border-border bg-card p-4', className)}>
      <div className="size-16 shrink-0" aria-hidden="true">
        <RingChart data={rings} size={64} strokeWidth={10} ringGap={2} baseInnerRadius={22}>
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
        {note ? <span className="text-app-small text-muted-foreground">{note}</span> : reference !== undefined ? <span className="text-app-small text-muted-foreground">Atteso {fmtDec(reference)}</span> : null}
      </div>
    </div>
  )
}
