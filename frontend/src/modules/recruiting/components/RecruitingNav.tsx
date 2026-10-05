import { NavLink, useLocation } from 'react-router-dom'

import { Briefcase } from 'lucide-react'

import { CompanySwitcher } from '@/components/patterns/CompanySwitcher'
import { SelectField } from '@/components/patterns/SelectField'
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
// salvataggio nuovo. Con più posizioni aperte, sotto la società c'è anche la
// scelta della posizione attiva (prima stava in CV & Esportazione, nel
// riquadro "Posizione e archivio", tolto su richiesta di Roberto Feliciani).
// `onCompanyChange` avvisa il layout, che ridisegna la
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
        {company && company.jobOpenings.length > 1 ? (
          <div className="flex min-w-0 flex-col gap-1 px-1">
            <div className="label-mono flex items-center gap-2 text-muted-foreground">
              <Briefcase className="size-3.5 shrink-0" aria-hidden="true" />
              Posizione aperta
            </div>
            <SelectField
              size="sm"
              className="w-full"
              value={opening?.id ?? ''}
              onValueChange={(id) => {
                setActiveContext(company.id, id)
                onCompanyChange()
              }}
              aria-label="Posizione aperta attiva"
            >
              {company.jobOpenings.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </SelectField>
          </div>
        ) : null}
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
