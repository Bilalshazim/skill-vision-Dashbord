import { BarChart3, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

const MODULES = [
  { to: '/recruiting', label: 'Recruiting', icon: Users },
  { to: '/assessment', label: 'Assessment', icon: BarChart3 },
] as const

// Il commutatore fra i due moduli, nella barra superiore. Stessa forma del
// ToggleGroup (voce accesa su `accent`, neutro), ma sono link: cambiano
// sezione. Chi lo usa lo mostra solo se la società ha tutti e due i moduli.
// Sotto i 640px resta l'icona, con il nome per i lettori di schermo.
export function ModuleSwitcher({ className }: { className?: string }) {
  return (
    <nav aria-label="Moduli" className={cn('inline-flex items-center gap-1 rounded-md border border-border bg-card p-1', className)}>
      {MODULES.map((m) => (
        <NavLink
          key={m.to}
          to={m.to}
          className={({ isActive }) =>
            cn(
              'inline-flex items-center gap-2 rounded-sm px-3 py-1 text-app-small font-medium whitespace-nowrap outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:size-4',
              isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )
          }
        >
          <m.icon aria-hidden="true" />
          <span className="max-sm:sr-only">{m.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
