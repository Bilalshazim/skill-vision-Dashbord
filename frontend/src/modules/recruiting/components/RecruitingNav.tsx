import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { CompanySwitcher } from '@/components/patterns/CompanySwitcher'
import { SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from '@/components/ui/sidebar'
import { getBackendUser } from '@/lib/api/client'
import { isDemoAccount, isDemoMode } from '@/lib/demo-mode'
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
// (amministrazione) solo i ruoli elencati; le voci `demoOnly` solo l'account
// demo. È una comodità: il limite vero lo mette il server (vedi nav-config.ts).
//
// Ogni livello è una voce come «Home» in Assessment, con sotto le sue pagine e la
// pagina principale per prima: il titolo apre la pagina dei risultati ed è attivo
// quando è aperta (CLAUDE.md, Fase 6, 2026-11-02), la freccia apre e chiude il
// gruppo, che parte aperto. L'Area valutatori non ha una pagina dei risultati: il
// titolo apre e chiude e basta. Una voce accesa sola: l'Imbuto di selezione è ai
// livelli 2 e 3 sulla stessa pagina, quindi si accende la prima voce del menu che
// corrisponde all'indirizzo. I nomi lunghi vanno a capo, non si tagliano.
export function RecruitingNav() {
  const role = getBackendUser()?.role
  const evaluator = role === 'EVALUATOR'
  const visible = (item: RecruitingNavItem) => (!item.roles || (role && item.roles.includes(role))) && !(evaluator && item.staffOnly) && (!item.demoOnly || isDemoAccount())
  const groups = RECRUITING_NAV_GROUPS.filter((g) => !evaluator || g.audience === 'evaluator')
    .map((g) => ({ ...g, items: [...(g.main ? [g.main] : []), ...g.items].filter(visible) }))
    .filter((g) => g.items.length > 0)
  const { pathname } = useLocation()
  const { company, companies } = useActivePosition()
  const [closed, setClosed] = useState<Record<string, boolean>>({})
  // Corrispondenza sul segmento intero: "/imbuto" non accende "/imbuto-scelta".
  const activeScreen = groups.flatMap((g) => g.items).find((item) => (item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`)))?.screen

  const renderItem = (item: RecruitingNavItem) => (
    <SidebarMenuItem key={item.screen}>
      <SidebarMenuButton asChild isActive={item.screen === activeScreen}>
        <NavLink to={item.to} end={item.end}>
          <item.icon aria-hidden="true" />
          <span className="min-w-0 flex-1">{item.label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )

  return (
    <>
      <SidebarHeader>
        <CompanySwitcher companies={companies.map((c) => ({ id: c.id, name: c.name }))} activeId={company?.id} note={isDemoMode() ? 'Dati dimostrativi' : undefined} />
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => {
          const key = group.label ?? group.items[0].screen
          if (!group.icon || !group.label) {
            return (
              <SidebarGroup key={key}>
                {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
                <SidebarMenu>{group.items.map(renderItem)}</SidebarMenu>
              </SidebarGroup>
            )
          }
          const containsActive = group.items.some((item) => item.screen === activeScreen)
          const isOpen = containsActive || !closed[key]
          const toggle = () => setClosed((c) => ({ ...c, [key]: !c[key] }))
          const titleActive = pathname === group.results
          return (
            <SidebarGroup key={key}>
              <SidebarMenu>
                <SidebarMenuItem>
                  {group.results ? (
                    <>
                      <SidebarMenuButton asChild isActive={titleActive} className={containsActive ? undefined : 'pr-9'}>
                        <NavLink to={group.results}>
                          <group.icon aria-hidden="true" />
                          <span className="min-w-0 flex-1">{group.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                      {containsActive ? null : (
                        <SidebarMenuAction isActive={titleActive} aria-expanded={isOpen} aria-label={group.label} onClick={toggle}>
                          <ChevronDown aria-hidden="true" className={isOpen ? 'rotate-180' : undefined} />
                        </SidebarMenuAction>
                      )}
                    </>
                  ) : (
                    <SidebarMenuButton type="button" aria-expanded={isOpen} onClick={toggle}>
                      <group.icon aria-hidden="true" />
                      <span className="min-w-0 flex-1">{group.label}</span>
                    </SidebarMenuButton>
                  )}
                  {isOpen ? <SidebarMenuSub>{group.items.map(renderItem)}</SidebarMenuSub> : null}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )
        })}
        <BrowserImportEntry />
      </SidebarContent>
    </>
  )
}
