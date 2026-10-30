import { BarChart3, Users } from 'lucide-react'
import { motion } from 'motion/react'
import { NavLink } from 'react-router-dom'

import { SNAPPY_TAB_SPRING, TAP_SCALE } from '@/lib/motion'
import { cn } from '@/lib/utils'

const MODULES = [
  { to: '/recruiting', label: 'Recruiting', icon: Users },
  { to: '/assessment', label: 'Assessment', icon: BarChart3 },
] as const

const MotionNavLink = motion.create(NavLink)

// Il commutatore fra i due moduli, nella barra superiore. Stessa forma del
// ToggleGroup (voce accesa su `accent`, neutro), ma sono link: cambiano
// sezione. Chi lo usa lo mostra solo se la società ha tutti e due i moduli.
// Sotto i 640px resta l'icona, con il nome per i lettori di schermo, e le voci
// si stringono: con la barra superiore intera la riga sta in 390px.
//
// Il fondo della voce accesa è una pillola sola (`layoutId`) che scorre sulla
// voce nuova con SNAPPY_TAB_SPRING: la barra superiore si rimonta con il
// modulo, la pillola riparte dalla posizione di prima.
export function ModuleSwitcher({ className }: { className?: string }) {
  return (
    <nav aria-label="Moduli" className={cn('inline-flex items-center gap-1 rounded-md border border-border bg-card p-1', className)}>
      {MODULES.map((m) => (
        <MotionNavLink
          key={m.to}
          to={m.to}
          whileTap={TAP_SCALE}
          className={({ isActive }) =>
            cn(
              'relative inline-flex touch-manipulation items-center gap-2 rounded-sm px-2 py-1 text-app-small sm:px-3 font-medium whitespace-nowrap outline-none select-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:size-4',
              isActive ? 'text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive ? <motion.span aria-hidden="true" layoutId="activeModuleShellPill" transition={SNAPPY_TAB_SPRING} className="absolute inset-0 rounded-sm bg-accent" /> : null}
              <m.icon aria-hidden="true" className="relative" />
              <span className="relative max-sm:sr-only">{m.label}</span>
            </>
          )}
        </MotionNavLink>
      ))}
    </nav>
  )
}
