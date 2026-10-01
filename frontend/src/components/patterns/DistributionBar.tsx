import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type DistributionTone = 'success' | 'warning' | 'destructive' | 'neutral' | 'muted'

const FILL: Record<DistributionTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  neutral: 'bg-foreground',
  muted: 'bg-muted-foreground',
}

// Come si divide un insieme fra fasce (es. i dipendenti per fascia di
// idoneità): una barra a segmenti e, sotto, ogni fascia con la sua
// percentuale e il suo nome. Il colore è quello dello stato della fascia e
// accompagna la parola, non la sostituisce (regola 10): la legenda sta
// sotto la barra, nello stesso ordine. Le percentuali arrivano calcolate.
export function DistributionBar({
  label,
  segments,
  className,
}: {
  label?: ReactNode
  /** `display`: il valore da scrivere nella legenda al posto della percentuale (es. un conteggio). */
  segments: { key: string; label: string; pct: number; tone: DistributionTone; display?: string }[]
  className?: string
}) {
  const visible = segments.filter((s) => s.pct > 0)
  return (
    <figure data-slot="distribution-bar" className={cn('flex flex-col gap-2', className)}>
      {label ? <figcaption className="label-mono text-muted-foreground">{label}</figcaption> : null}
      <div className="flex h-3 gap-1" role="img" aria-label={segments.map((s) => `${s.label} ${s.display ?? `${Math.round(s.pct)}%`}`).join(', ')}>
        {visible.map((s) => (
          <span key={s.key} className={cn('h-full rounded-full', FILL[s.tone])} style={{ width: `${s.pct}%` }} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-app-small text-muted-foreground">
        {segments.map((s) => (
          <li key={s.key} className="inline-flex items-center gap-2">
            <span className={cn('size-2 shrink-0 rounded-full', FILL[s.tone])} aria-hidden="true" />
            <span className="font-medium text-foreground tabular-nums">{s.display ?? `${Math.round(s.pct)}%`}</span>
            {s.label}
          </li>
        ))}
      </ul>
    </figure>
  )
}
