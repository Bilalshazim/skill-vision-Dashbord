import { LogOut, Moon, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Hint } from '@/components/patterns/Hint'
import { ModuleSwitcher } from '@/components/patterns/ModuleSwitcher'
import { Button } from '@/components/ui/button'
import { usePurchasedModules } from '@/hooks/use-purchased-modules'
import { useTheme } from '@/hooks/use-theme'
import { Logo } from '@/layouts/Logo'
// Ponte verso la sessione del guscio legacy (non specifico di Assessment
// malgrado il percorso): l'accesso di oggi resta com'è fino alla Fase 8.
import { logoutFromShell } from '@/modules/assessment/lib/shell-bridge'

// La barra superiore del guscio unico: marchio (porta alla `/`, la scelta
// del modulo), il
// commutatore Recruiting / Assessment — solo se la società ha tutti e due i
// moduli —, tema e uscita. Nessuno switch della lingua: l'interfaccia è in
// italiano (CLAUDE.md cap. 7, "Lingua"). `menuTrigger`: il bottone che apre
// la barra laterale su mobile.
export function Topbar({ menuTrigger }: { menuTrigger?: ReactNode }) {
  const { theme, setTheme } = useTheme()
  const dark = theme === 'dark'
  const modules = usePurchasedModules()
  const both = !!modules && modules.includes('RECRUITING') && modules.includes('ASSESSMENT')

  return (
    <header className="sticky top-0 z-(--z-header) flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 sm:px-6">
      {menuTrigger}
      <Link to="/" aria-label="Skill Vision — scelta del modulo" className="flex shrink-0 items-center rounded-xs outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <Logo />
      </Link>
      {both ? <ModuleSwitcher className="ml-2" /> : null}
      <div className="ml-auto flex items-center gap-2">
        <Hint label={dark ? 'Modalità chiara' : 'Modalità scura'}>
          <Button variant="outline" size="icon" onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={dark ? 'Passa alla modalità chiara' : 'Passa alla modalità scura'}>
            {dark ? <Sun /> : <Moon />}
          </Button>
        </Hint>
        <Hint label="Esci">
          <Button variant="outline" size="icon" onClick={logoutFromShell} aria-label="Esci">
            <LogOut />
          </Button>
        </Hint>
      </div>
    </header>
  )
}
