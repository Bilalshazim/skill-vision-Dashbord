import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { getBackendUser } from '@/lib/api/client'
import { RECRUITING_NAV_ITEMS } from '@/modules/recruiting/nav-config'

const itemClass =
  'flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:whitespace-normal'

// This is the Recruiting module's OWN navigation — distinct from, and
// nested inside, the global AppShell Sidebar (which only switches between
// Home/Recruiting/Assessment — see Phase 3). Ported from the legacy #side
// list (modules/recruiting.html). PHASE 22 — every item is now a real
// React route (the migration's last two gaps, Profilo della ricerca and
// its Protocollo di Intervista, landed in Phases 20-21), so this is a
// plain NavLink list — no more legacy-bridge branch to maintain here.
export function RecruitingNav() {
  // Phase 33 §2/§3/§7 — a nav item with `roles` is a convenience filter
  // only (see nav-config.ts's own comment) — the backend enforces the real
  // boundary regardless of whether this hides the link.
  const role = getBackendUser()?.role
  const items = RECRUITING_NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)))

  return (
    <nav
      aria-label="Recruiting navigation"
      className="flex gap-1 overflow-x-auto border-b border-border pb-2 lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4"
    >
      {items.map((item) => (
        <NavLink
          key={item.screen}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              itemClass,
              isActive
                ? 'border border-primary/20 bg-primary/10 text-foreground'
                : 'border border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )
          }
        >
          <item.icon className="size-4 shrink-0" aria-hidden="true" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
