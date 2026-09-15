import { Briefcase, ClipboardList, Home, type LucideIcon } from 'lucide-react'

// Shell-level navigation = the module switcher (Home / Recruiting /
// Assessment) rendered by the global top bar (Topbar.tsx).
export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  /** True for links that must be a real browser navigation (full reload)
   * rather than a React Router client-side route. */
  external?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  // Home has no React route of its own — the legacy shell's own landing
  // page (index.html's #sv-landing, shown right after login) IS "Home".
  // A real navigation there re-runs the shell's own auth check, so an
  // unauthenticated visit correctly lands on login instead of landing.
  { to: '/index.html', label: 'Home', icon: Home, external: true },
  { to: '/recruiting', label: 'Recruiting', icon: Briefcase },
  { to: '/assessment', label: 'Assessment', icon: ClipboardList },
]
