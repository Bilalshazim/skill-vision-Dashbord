import type { ComponentType } from 'react'

import { cn } from '@/lib/utils'

// Qualunque icona che accetti className e spessore del tratto: una Lucide, o
// una composta come questa. È il tipo che le card della Home si aspettano.
export type IconComponent = ComponentType<{ className?: string; strokeWidth?: number }>

// Un'icona grande con un segno piccolo in basso a destra (una casa col
// simbolo dell'euro, una lampadina con un diamante…): le icone composte dei
// riquadri di "Profilo della ricerca". Fatte con due icone Lucide, nessun
// disegno nuovo. Il segno piccolo ha un fondo `card` che lo stacca dal tratto
// dell'icona grande.
export function compositeIcon(Main: IconComponent, Badge: IconComponent): IconComponent {
  return function CompositeIcon({ className, strokeWidth }) {
    return (
      <span className={cn('relative inline-flex', className)}>
        <Main className="size-full" strokeWidth={strokeWidth} />
        <span className="absolute -right-2 -bottom-2 grid size-6 place-items-center rounded-full bg-card">
          <Badge className="size-5" strokeWidth={strokeWidth} />
        </span>
      </span>
    )
  }
}
