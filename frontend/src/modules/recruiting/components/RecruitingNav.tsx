import { NavLink, useLocation } from 'react-router-dom'

import { CompanySwitcher } from '@/components/patterns/CompanySwitcher'
import { SidebarContent, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { getBackendUser } from '@/lib/api/client'
import { RECRUITING_NAV_ITEMS } from '@/modules/recruiting/nav-config'
import { getActiveOpening, setActiveContext } from '@/modules/recruiting/lib/pipeline'
import { readCvMatchingState } from '@/modules/recruiting/lib/storage'

// Il contenuto della barra laterale di Recruiting nel guscio unico: in
// testa la società attiva (struttura gruppo → società), sotto le voci del
// modulo. Il filtro per ruolo del backend resta (una comodità: il limite
// vero lo mette il server — vedi nav-config.ts). Cambiare società usa lo
// stesso `setActiveContext` del selettore di CV & Esportazione: nessun
// salvataggio nuovo. `onCompanyChange` avvisa il layout, che ridisegna la
// pagina aperta sulla società scelta.
export function RecruitingNav({ onCompanyChange }: { onCompanyChange: () => void }) {
  const role = getBackendUser()?.role
  const items = RECRUITING_NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)))
  const { pathname } = useLocation()
  const state = readCvMatchingState()
  const { company, opening } = getActiveOpening(state)

  return (
    <>
      <SidebarHeader>
        <CompanySwitcher
          companies={state.companies.map((c) => ({ id: c.id, name: c.name }))}
          activeId={company?.id}
          onChange={(id) => {
            setActiveContext(id, opening?.id ?? '')
            onCompanyChange()
          }}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {items.map((item) => {
              const active = item.end ? pathname === item.to || pathname === `${item.to}/` : pathname.startsWith(item.to)
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
      </SidebarContent>
    </>
  )
}
