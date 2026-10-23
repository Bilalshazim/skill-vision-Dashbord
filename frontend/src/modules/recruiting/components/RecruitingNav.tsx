import { NavLink, useLocation } from 'react-router-dom'

import { CompanySwitcher } from '@/components/patterns/CompanySwitcher'
import { SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { getBackendUser } from '@/lib/api/client'
import { BrowserImportEntry } from '@/modules/recruiting/components/BrowserImportEntry'
import { RECRUITING_NAV_GROUPS } from '@/modules/recruiting/nav-config'
import { useActivePosition } from '@/modules/recruiting/lib/active-position'

// Il contenuto della barra laterale di Recruiting nel guscio unico: in
// testa la società attiva (struttura gruppo → società), sotto le voci del
// modulo. La posizione attiva non si sceglie più qui: sta nella barra del
// contesto sopra ogni pagina (RecruitingContextBar), un solo posto per lo
// stesso stato (lib/active-position.tsx).
//
// Voci per ruolo (CLAUDE.md, Fase 6, "Menu di Recruiting"): un valutatore
// vede solo l'Area valutatori; le voci con `roles` (amministrazione) solo i
// ruoli elencati. È una comodità: il limite vero lo mette il server (vedi
// nav-config.ts).
export function RecruitingNav() {
  const role = getBackendUser()?.role
  const evaluator = role === 'EVALUATOR'
  const groups = RECRUITING_NAV_GROUPS.filter((g) => !evaluator || g.audience === 'evaluator')
    .map((g) => ({ ...g, items: g.items.filter((item) => !item.roles || (role && item.roles.includes(role))) }))
    .filter((g) => g.items.length > 0)
  const { pathname } = useLocation()
  const { company, opening, companies, setPosition } = useActivePosition()

  return (
    <>
      <SidebarHeader>
        <CompanySwitcher
          companies={companies.map((c) => ({ id: c.id, name: c.name }))}
          activeId={company?.id}
          onChange={(id) => setPosition(id, opening?.id ?? '')}
        />
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label ?? group.items[0].screen}>
            {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
            <SidebarMenu>
              {group.items.map((item) => {
                // Corrispondenza sul segmento intero: "/imbuto" non accende "/imbuto-scelta".
                // Le voci `end` (la Panoramica, /recruiting) solo sul loro indirizzo
                // e sul vecchio /recruiting/home, non su ogni pagina del modulo.
                const active = item.end ? pathname === item.to || pathname === `${item.to}/home` : pathname === item.to || pathname.startsWith(`${item.to}/`)
                return (
                  <SidebarMenuItem key={item.screen}>
                    <SidebarMenuButton asChild isActive={active}>
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
