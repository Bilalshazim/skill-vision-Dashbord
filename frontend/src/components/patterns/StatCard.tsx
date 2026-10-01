import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export type StatTone = 'neutral' | 'strong' | 'accent' | 'success' | 'warning' | 'destructive'

const SURFACE: Record<StatTone, string> = {
  neutral: 'border border-border bg-card',
  strong: 'border-2 border-foreground bg-card',
  accent: 'surface-accent',
  success: 'surface-success',
  warning: 'surface-warning',
  destructive: 'surface-danger',
}
const INK: Record<StatTone, string> = {
  neutral: 'text-muted-foreground',
  strong: 'text-foreground',
  accent: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
}
const BAR: Record<StatTone, 'neutral' | 'strong' | 'primary' | 'success' | 'warning' | 'destructive'> = {
  neutral: 'neutral',
  strong: 'strong',
  accent: 'primary',
  success: 'success',
  warning: 'warning',
  destructive: 'destructive',
}

// Un numero per riquadro (DECISIONI, "Un solo StatCard"). L'etichetta è in
// stile label; il valore in cifre tabulari; opzionali l'icona, il
// denominatore (`/100`), lo scarto con segno e freccia, una barra, una nota.
// `tone`: `neutral` di default; `strong` (neutro pieno) per la fascia più
// alta di performance, che non è uno stato; `success` / `warning` / `destructive` solo
// per una fascia, con la parola nell'etichetta o nella nota (regola 10);
// `accent` solo per il valore in evidenza della schermata, uno per gruppo.
// `size`: sm / md / lg (lg è il numero principale di un pannello).
// `valueKind="text"` quando il valore è un nome (un'area, un ruolo).
// `surface="none"`: senza riquadro, per le metriche in riga dentro un'altra
// card (la striscia di CrossModuleBanner).
export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  tone = 'neutral',
  size = 'md',
  valueKind = 'number',
  surface = 'card',
  progress,
  progressTone,
  delta,
  note,
  children,
  onClick,
  className,
}: {
  label?: ReactNode
  value: ReactNode
  unit?: ReactNode
  icon?: LucideIcon
  tone?: StatTone
  size?: 'sm' | 'md' | 'lg'
  valueKind?: 'number' | 'text'
  surface?: 'card' | 'none'
  /** 0–100: una barra sotto il valore. */
  progress?: number
  /** La fascia del valore sulla barra, quando il riquadro resta neutro. */
  progressTone?: 'success' | 'warning' | 'destructive'
  /** Scarto già formattato, con la direzione per la freccia. */
  delta?: {
    label: ReactNode
    direction: 'up' | 'down' | 'flat'
    tone?: 'success' | 'destructive' | 'neutral'
  }
  note?: ReactNode
  children?: ReactNode
  /** Il riquadro apre un dettaglio: diventa un bottone (tastiera, focus). */
  onClick?: () => void
  className?: string
}) {
  const Root = onClick ? 'button' : 'div'
  const rootProps = onClick ? { type: 'button' as const, onClick } : {}
  const DeltaIcon = delta?.direction === 'up' ? ArrowUp : delta?.direction === 'down' ? ArrowDown : ArrowRight
  const deltaInk = delta?.tone === 'success' ? 'text-success' : delta?.tone === 'destructive' ? 'text-destructive' : 'text-muted-foreground'
  return (
    <Root
      data-slot="stat-card"
      data-tone={tone}
      {...rootProps}
      className={cn(
        'flex min-w-0 flex-col gap-2 text-left text-card-foreground',
        onClick && 'cursor-pointer transition-colors outline-none hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        surface === 'card' && ['rounded-md', SURFACE[tone], size === 'lg' ? 'gap-4 p-6' : 'p-4'],
        className,
      )}
    >
      {label || Icon || delta ? (
        <div className="flex min-w-0 flex-wrap items-start gap-x-2 gap-y-1">
          {Icon ? <Icon className={cn('shrink-0', INK[tone], size === 'lg' ? 'size-5' : 'size-4')} aria-hidden="true" /> : null}
          <span className="label-mono min-w-0 flex-1 basis-32 text-muted-foreground">{label}</span>
          {delta ? (
            <span className={cn('inline-flex shrink-0 items-center gap-1 text-app-small font-medium tabular-nums', deltaInk)}>
              <DeltaIcon className="size-3.5" aria-hidden="true" />
              {delta.label}
            </span>
          ) : null}
        </div>
      ) : null}
      <div
        className={cn('min-w-0 tabular-nums', valueKind === 'text' ? 'text-app-subtitle break-words' : size === 'lg' ? 'text-metric-lg' : size === 'sm' ? 'text-app-subtitle' : 'text-metric', size === 'lg' && 'mt-auto')}
      >
        {value}
        {unit ? <span className="ml-1 text-app-small font-normal text-muted-foreground">{unit}</span> : null}
      </div>
      {progress !== undefined ? <Progress value={Math.max(0, Math.min(100, progress))} tone={progressTone ?? BAR[tone]} className={size === 'lg' ? 'h-2.5' : undefined} /> : null}
      {note ? <p className="text-app-small text-muted-foreground">{note}</p> : null}
      {children}
    </Root>
  )
}
