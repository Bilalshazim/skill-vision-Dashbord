import { LogOut, Menu, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { useTheme } from '@/hooks/use-theme'
import { Logo } from '@/layouts/Logo'
import { NAV_ITEMS } from '@/layouts/nav-config'
import { cn } from '@/lib/utils'
// Cross-module import, same pattern the auth guards already use — not
// module-specific despite the path, just the legacy shell's session bridge.
import { logoutFromShell } from '@/modules/assessment/lib/shell-bridge'
import { useSharedLang } from '@/hooks/use-shared-lang'

// The ONE global app shell nav: logo + module switcher (Home/Recruiting/
// Assessment) + language/theme/logout. Rendered once by AppShell (for Home
// and Recruiting) and once more directly by AssessmentLayout's own shell
// (Assessment deliberately sits outside AppShell — see its comment in
// App.tsx) — same component both times, never a second implementation.
// Harmonized with Assessment's own tab-switcher pattern, .view-tab
// (frontend/src/modules/assessment/styles/assessment-scoped.css:423-425) —
// pill shape (rounded-full, not rounded-md), 12.5px/600-weight type, and a
// solid primary fill (not a tinted 10%-opacity background) for the active
// state, matching .view-tab.active's `background: var(--accent); color:
// #0D0C0A` exactly (bg-primary/text-primary-foreground resolve to the same
// values here). This is the ONE Topbar instance shared by both Home/
// Recruiting and Assessment (see the module comment above), so this single
// change makes the switcher look the same everywhere it renders.
const navLinkBase = cn(
  'flex items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] font-semibold whitespace-nowrap transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
)
const navLinkInactive = 'border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
const navLinkActive = 'border border-primary bg-primary font-bold text-primary-foreground'

function ModuleLinks({ onNavigate, layout = 'row' }: { onNavigate?: () => void; layout?: 'row' | 'column' }) {
  return (
    <nav aria-label="Module navigation" className={cn('flex items-center gap-1', layout === 'column' && 'flex-col items-stretch')}>
      {NAV_ITEMS.map((item) =>
        item.external ? (
          // Home: no React route of its own (see nav-config.ts) — a plain
          // anchor forces a real browser navigation to the legacy shell
          // instead of React Router swallowing it as a client-side route.
          <a key={item.to} href={item.to} onClick={onNavigate} className={cn(navLinkBase, navLinkInactive)}>
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </a>
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) => cn(navLinkBase, isActive ? navLinkActive : navLinkInactive)}
          >
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ),
      )}
    </nav>
  )
}

function GlobalControls({ onNavigate, layout = 'row' }: { onNavigate?: () => void; layout?: 'row' | 'column' }) {
  const { lang, setLang } = useSharedLang()
  const { theme, setTheme } = useTheme()
  const dark = theme === 'dark'

  function toggleLang() {
    setLang(lang === 'it' ? 'en' : 'it')
    onNavigate?.()
  }
  function toggleTheme() {
    setTheme(dark ? 'light' : 'dark')
    onNavigate?.()
  }
  function signOut() {
    onNavigate?.()
    logoutFromShell()
  }

  return (
    <div className={cn('flex items-center gap-2', layout === 'column' && 'flex-col items-stretch')}>
      <Button variant="outline" size="sm" onClick={toggleLang} aria-label="Italiano / English" title="Italiano / English">
        {lang.toUpperCase()}
      </Button>
      <Button variant="outline" size="icon" onClick={toggleTheme} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
        {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
      <Button variant="outline" size="icon" onClick={signOut} aria-label="Sign out" title="Sign out">
        <LogOut className="size-4" />
      </Button>
    </div>
  )
}

export function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-card px-4 sm:px-6">
      {/* Same "no React route" reasoning as the Home nav item above — a
          real navigation to the legacy shell, not a client-side route. */}
      <a href="/index.html" aria-label="Skill-Vision — Home" className="flex shrink-0 items-center">
        <Logo />
      </a>

      <div className="hidden md:flex md:min-w-0 md:flex-1 md:items-center md:gap-4">
        <ModuleLinks />
        <div className="ml-auto">
          <GlobalControls />
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="ml-auto md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="p-0">
          <div className="flex h-16 items-center border-b border-border px-4">
            <SheetTitle className="flex items-center">
              <Logo />
            </SheetTitle>
            <SheetDescription className="sr-only">Global navigation</SheetDescription>
          </div>
          <div className="flex flex-col gap-4 overflow-y-auto p-4">
            <ModuleLinks layout="column" onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-border pt-4">
              <GlobalControls layout="column" onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
