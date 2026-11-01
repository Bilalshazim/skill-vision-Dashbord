import { Link, NavLink, useLocation } from 'react-router-dom'

import { CompanySwitcher } from '@/components/patterns/CompanySwitcher'
import { SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { getBackendUser } from '@/lib/api/client'
import { BrowserImportEntry } from '@/modules/recruiting/components/BrowserImportEntry'
import { RECRUITING_NAV_GROUPS, type RecruitingNavItem } from '@/modules/recruiting/nav-config'
import { useActivePosition } from '@/modules/recruiting/lib/active-position'

// Il contenuto della barra laterale di Recruiting nel guscio unico: in
// testa la società attiva (struttura gruppo → società), sotto le voci del
// modulo. Qui la società si legge e basta: società e posizione attiva si
// cambiano solo nel Profilo della ricerca (RecruitingContextBar), un solo
// posto per lo stesso stato (lib/active-position.tsx).
//
// Voci per ruolo (CLAUDE.md, Fase 6, "Menu di Recruiting"): un valutatore
// vede solo l'Area valutatori, senza le voci `staffOnly`; le voci con `roles`
// (amministrazione) solo i ruoli elencati. È una comodità: il limite vero lo
// mette il server (vedi nav-config.ts).
//
// Ogni livello ha la sua pagina principale come prima voce, e il titolo del
// livello porta lì. Una voce accesa sola: l'Imbuto di selezione è ai livelli 2
// e 3 sulla stessa pagina, e la pillola della voce attiva è una sola, quindi
// si accende la prima voce del menu che corrisponde all'indirizzo.
export function RecruitingNav() {
  const role = getBackendUser()?.role
  const evaluator = role === 'EVALUATOR'
  const visible = (item: RecruitingNavItem) => (!item.roles || (role && item.roles.includes(role))) && !(evaluator && item.staffOnly)
  const groups = RECRUITING_NAV_GROUPS.filter((g) => !evaluator || g.audience === 'evaluator')
    .map((g) => ({ ...g, items: [...(g.main ? [g.main] : []), ...g.items].filter(visible) }))
    .filter((g) => g.items.length > 0)
  const { pathname } = useLocation()
  const { company, companies } = useActivePosition()
  // Corrispondenza sul segmento intero: "/imbuto" non accende "/imbuto-scelta".
  const activeScreen = groups.flatMap((g) => g.items).find((item) => (item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`)))?.screen

  return (
    <>
      <SidebarHeader>
        <CompanySwitcher companies={companies.map((c) => ({ id: c.id, name: c.name }))} activeId={company?.id} />
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label ?? group.items[0].screen}>
            {group.label ? (
              <SidebarGroupLabel>
                {group.main && group.items[0] === group.main ? (
                  <Link to={group.main.to} className="hover:text-sidebar-foreground">
                    {group.label}
                  </Link>
                ) : (
                  group.label
                )}
              </SidebarGroupLabel>
            ) : null}
            <SidebarMenu>
              {group.items.map((item) => {
                return (
                  <SidebarMenuItem key={item.screen}>
                    <SidebarMenuButton asChild isActive={item.screen === activeScreen}>
                      <NavLink to={item.to} end={item.end}>
                        <item.icon aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
        <BrowserImportEntry />
      </SidebarContent>
    </>
  )
}
