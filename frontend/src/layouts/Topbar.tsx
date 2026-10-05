import { LogOut, Moon, Settings, Sun } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'

import { Hint } from '@/components/patterns/Hint'
import { LanguageSwitch } from '@/components/patterns/LanguageSwitch'
import { ModuleSwitcher } from '@/components/patterns/ModuleSwitcher'
import { SettingsDialog } from '@/components/patterns/SettingsDialog'
import { Button } from '@/components/ui/button'
import { usePurchasedModules } from '@/hooks/use-purchased-modules'
import { useTheme } from '@/hooks/use-theme'
import { Logo } from '@/layouts/Logo'
// Ponte verso la sessione del guscio legacy (non specifico di Assessment
// malgrado il percorso): l'accesso di oggi resta com'è fino alla Fase 8.
import { isBackendAuth } from '@/lib/auth/auth-mode'
import { logout } from '@/lib/auth/session'
import { logoutFromShell } from '@/modules/assessment/lib/shell-bridge'

// La barra superiore del guscio unico: marchio (porta alla `/`, la scelta
// del modulo), il
// commutatore Recruiting / Assessment — solo se la società ha tutti e due i
// moduli —, selettore della lingua, impostazioni, tema e uscita.
// `menuTrigger`: il bottone che apre la barra laterale su mobile.
export function Topbar({ menuTrigger }: { menuTrigger?: ReactNode }) {
  const { theme, setTheme } = useTheme()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const dark = theme === 'dark'
  const modules = usePurchasedModules()
  const both = !!modules && modules.includes('RECRUITING') && modules.includes('ASSESSMENT')

  // Fase 8: in modalità `backend` il server revoca il refresh token e
  // cancella il cookie, poi si torna a /login. In `legacy`, come prima.
  async function handleLogout() {
    if (!isBackendAuth()) return logoutFromShell()
    await logout()
    window.location.replace('/login')
  }

  return (
    <header className="sticky top-0 z-(--z-header) flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 sm:px-6">
      {menuTrigger}
      <Link to="/" aria-label="Skill Vision — scelta del modulo" className="flex shrink-0 items-center rounded-xs outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <Logo />
      </Link>
      {both ? <ModuleSwitcher className="ml-2" /> : null}
      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitch />
        <Hint label="Impostazioni">
          <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)} aria-label="Impostazioni">
            <Settings />
          </Button>
        </Hint>
        <Hint label={dark ? 'Modalità chiara' : 'Modalità scura'}>
          <Button variant="outline" size="icon" onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={dark ? 'Passa alla modalità chiara' : 'Passa alla modalità scura'}>
            {dark ? <Sun /> : <Moon />}
          </Button>
        </Hint>
        <Hint label="Esci">
          <Button variant="outline" size="icon" onClick={handleLogout} aria-label="Esci">
            <LogOut />
          </Button>
        </Hint>
      </div>
      {settingsOpen ? <SettingsDialog onClose={() => setSettingsOpen(false)} /> : null}
    </header>
  )
}
