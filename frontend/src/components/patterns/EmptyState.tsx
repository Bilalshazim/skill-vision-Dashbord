import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

// Stato vuoto. Dice cosa comparirà lì e come farlo comparire (checklist §8):
// `title` è la cosa che manca, `description` il modo per farla comparire,
// `action` un bottone quando l'azione si fa da qui. Neutro: un'area vuota
// non è un errore e non si colora. `size="sm"` dentro card e liste.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = 'md',
  className,
}: {
  icon?: LucideIcon
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  size?: 'md' | 'sm'
  className?: string
}) {
  return (
    <div data-slot="empty-state" className={cn('flex flex-col items-center gap-2 text-center text-muted-foreground', size === 'md' ? 'px-6 py-12' : 'px-2 py-4', className)}>
      {Icon ? <Icon className={cn('text-muted-foreground', size === 'md' ? 'size-8' : 'size-6')} aria-hidden="true" /> : null}
      {title ? <p className="text-app-body font-medium text-foreground">{title}</p> : null}
      {description ? <p className="max-w-prose text-app-small">{description}</p> : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  )
}
