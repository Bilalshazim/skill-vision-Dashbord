import { Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

// Una scelta a riquadro, accesa o spenta (scelta multipla): la testata è un
// bottone con `aria-pressed`, raggiungibile da tastiera, con la spunta; i
// controlli che dipendono dalla scelta (un cursore, un campo) stanno sotto,
// fuori dal bottone, e compaiono solo da accesa. Accesa: bordo 2px
// `primary` e fondo `surface-accent`, più la spunta — non il solo colore.
export function ChoiceCard({
  selected,
  onSelectedChange,
  title,
  description,
  icon: Icon,
  align = 'start',
  children,
}: {
  selected: boolean
  onSelectedChange: (selected: boolean) => void
  title: ReactNode
  description?: ReactNode
  icon?: LucideIcon
  align?: 'start' | 'center'
  children?: ReactNode
}) {
  return (
    <div
      data-slot="choice-card"
      data-state={selected ? 'on' : 'off'}
      className={cn('flex flex-col rounded-sm border transition-colors', selected ? 'surface-accent border-2! border-primary!' : 'border-border bg-background hover:border-border-strong')}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onSelectedChange(!selected)}
        className={cn(
          'flex w-full gap-3 rounded-sm p-3 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          align === 'center' ? 'flex-col items-center text-center' : 'items-start',
        )}
      >
        <span
          aria-hidden="true"
          className={cn('flex size-5 shrink-0 items-center justify-center rounded-xs border', selected ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background', align === 'center' && 'hidden')}
        >
          {selected ? <Check className="size-3.5" /> : null}
        </span>
        {Icon ? <Icon className={cn('size-6 shrink-0 text-muted-foreground', align === 'start' && 'hidden')} aria-hidden="true" /> : null}
        <span className="min-w-0">
          <span className="block text-app-small font-medium text-foreground">{title}</span>
          {description ? <span className="mt-1 block text-app-caption text-muted-foreground">{description}</span> : null}
        </span>
        {align === 'center' && selected ? <Check className="size-4 text-foreground" aria-hidden="true" /> : null}
      </button>
      {selected && children ? <div className="px-3 pb-3">{children}</div> : null}
    </div>
  )
}
