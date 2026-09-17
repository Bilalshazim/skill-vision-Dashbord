import { BarChart3, Home, type LucideIcon, Users } from 'lucide-react'

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
  // Users / BarChart3 — the exact same glyphs as the legacy landing page's
  // own module cards (legacy-shell/index.html's .sv-feature icons for
  // data-enter-module="recruiting"/"assessment"), not a different icon
  // invented for this switcher.
  { to: '/recruiting', label: 'Recruiting', icon: Users },
  { to: '/assessment', label: 'Assessment', icon: BarChart3 },
]
