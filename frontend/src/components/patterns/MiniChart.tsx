import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// I mini grafici dei riquadri delle pagine dei risultati (correzioni del
// 2026-11-09, «2 Criticità e opportunità»: ogni riquadro ha un mini grafico) e
// la barra del valore espresso nell'Impatto. In inchiostro (`chart-mono`); `tone="highlight"`
// solo per il mini grafico del primo riquadro di «Criticità e opportunità» e per i pallini
// dell'Impatto (correzioni di Roberto del 2026-11-10, «un verde per sezione»): verde con il
// bordo di 1,5px (`chart-highlight-stroke`), come le barre in evidenza di Bklit. L'atteso è un
// segno tratteggiato in `chart-reference` con il nome scritto, il valore è
// scritto accanto alla barra. Al passaggio del mouse (e con il fuoco) la barra
// dice cosa misura e il valore.
export type MiniTone = 'mono' | 'highlight'

export type MiniChartSpec = (
  | { kind: 'scale'; label: string; value: number; min?: number; max: number; expected: number; expectedLabel: string; format: (n: number) => string }
  | { kind: 'people'; rows: { id: string; name: string; value: number }[]; min?: number; max: number; expected: number; expectedLabel: string; format: (n: number) => string }
  | { kind: 'dots'; label: string; n: number; total: number }
) & { tone?: MiniTone }

/** Il bordo di 1,5px del verde (`chart-highlight-stroke`: `neutral-800` in chiaro, il verde stesso in scuro), dentro la forma. */
const HIGHLIGHT_EDGE = { outline: '1.5px solid var(--chart-highlight-stroke)', outlineOffset: '-1.5px' } as const

export function MiniChart({ spec, className }: { spec: MiniChartSpec; className?: string }) {
  if (spec.kind === 'dots') return <DotRow n={spec.n} total={spec.total} label={spec.label} tone={spec.tone} className={className} />
  if (spec.kind === 'scale') return <ScaleBar {...spec} className={className} />
  return (
    <ul data-slot="mini-people" className={cn('flex flex-col gap-2', className)}>
      {spec.rows.map((r) => (
        <li key={r.id} className="flex flex-col gap-1">
          <span className="truncate text-app-small text-foreground">{r.name}</span>
          <ScaleBar label={r.name} value={r.value} min={spec.min} max={spec.max} expected={spec.expected} expectedLabel={spec.expectedLabel} format={spec.format} tone={spec.tone} hideExpectedLabel />
        </li>
      ))}
      <li className="text-app-caption text-muted-foreground">
        <ExpectedKey label={spec.expectedLabel} />
      </li>
    </ul>
  )
}

/** Una barra su una scala, con l'atteso tratteggiato e il valore scritto. `size="md"`: la barra del valore espresso nell'Impatto. */
export function ScaleBar({
  label,
  value,
  min = 0,
  max,
  expected,
  expectedLabel,
  format,
  size = 'sm',
  hideExpectedLabel = false,
  tone = 'mono',
  className,
}: {
  label: string
  value: number
  min?: number
  max: number
  expected: number
  expectedLabel: string
  format: (n: number) => string
  size?: 'sm' | 'md'
  hideExpectedLabel?: boolean
  tone?: MiniTone
  className?: string
}) {
  const at = (v: number) => `${Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100))}%`
  return (
    <div data-slot="scale-bar" className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} role="img" aria-label={`${label}: ${format(value)} · ${expectedLabel}`} className={cn('relative block flex-1 rounded-xs bg-muted outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', size === 'md' ? 'h-4' : 'h-2')}>
              <span className={cn('block h-full rounded-xs', tone === 'highlight' ? 'bg-chart-highlight' : 'bg-chart-mono')} style={{ width: at(value), ...(tone === 'highlight' ? HIGHLIGHT_EDGE : null) }} />
              <span aria-hidden="true" className="absolute -inset-y-1 border-l-2 border-dashed border-chart-reference" style={{ left: at(expected) }} />
            </span>
          </TooltipTrigger>
          <TooltipContent>{`${label}: ${format(value)} · ${expectedLabel}`}</TooltipContent>
        </Tooltip>
        <span className={cn('shrink-0 font-mono tabular-nums text-foreground', size === 'md' ? 'text-app-body' : 'text-app-small')}>{format(value)}</span>
      </div>
      {hideExpectedLabel ? null : (
        <span className="text-app-caption text-muted-foreground">
          <ExpectedKey label={expectedLabel} />
        </span>
      )}
    </div>
  )
}

function ExpectedKey({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span aria-hidden="true" className="inline-block h-3 border-l-2 border-dashed border-chart-reference" />
      {label}
    </span>
  )
}

/** Una fila di pallini: `n` pieni su `total` (un conteggio sul totale), con il conto scritto. */
export function DotRow({ n, total, label, tone = 'mono', className }: { n: number; total: number; label: string; tone?: MiniTone; className?: string }) {
  return (
    <div data-slot="dot-row" className={cn('flex flex-col gap-1', className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} role="img" aria-label={`${label}: ${n} su ${total}`} className="flex flex-wrap gap-1 rounded-xs outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} aria-hidden="true" className={cn('size-2.5 rounded-full', i < n ? (tone === 'highlight' ? 'bg-chart-highlight' : 'bg-chart-mono') : 'border border-border-strong')} style={i < n && tone === 'highlight' ? HIGHLIGHT_EDGE : undefined} />
            ))}
          </span>
        </TooltipTrigger>
        <TooltipContent>{`${label}: ${n} su ${total}`}</TooltipContent>
      </Tooltip>
      <span className="text-app-caption tabular-nums text-muted-foreground">
        {n} su {total}
      </span>
    </div>
  )
}
