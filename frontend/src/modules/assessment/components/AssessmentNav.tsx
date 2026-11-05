import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight, Brain, ChevronDown, ClipboardList, Coins, FileText, Home, LayoutDashboard, type LucideIcon, MessageSquareText, RotateCcw, Sparkles, Upload, Users, Wrench } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { CompanySwitcher } from '@/components/patterns/CompanySwitcher'
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@/components/ui/sidebar'
import { useConfirm } from '@/hooks/use-confirm'
import { assessmentApi } from '@/lib/api/assessment'
import { isDemoAccount, isDemoMode } from '@/lib/demo-mode'
import { MethodologyModal } from '@/modules/assessment/components/MethodologyModal'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { getNavConfig } from '@/modules/assessment/lib/legacy-utils'
import { errorReason } from '@/modules/assessment/lib/server-sync'
import { clearBrowserAssessment, readBrowser5p, readBrowserAssessment } from '@/modules/assessment/lib/browser-import'

// Le icone della navigazione di Assessment: erano SVG del vecchio modulo
// iniettati come HTML (Icon.tsx); qui Lucide, per nome della voce.
const ICONS: Record<string, LucideIcon> = {
  home: Home,
  overview: LayoutDashboard,
  soft: Brain,
  hard: Wrench,
  users: Users,
  notes: FileText,
  value: Coins,
  feedback: MessageSquareText,
  ai: Sparkles,
  transfer: ArrowLeftRight,
}
const iconFor = (name?: string) => (name && ICONS[name]) || ClipboardList

// Il contenuto della barra laterale di Assessment nel guscio unico. Stesse
// voci, stesse sezioni, l'evidenziazione per vista (CT/CP) al posto del filtro per modulo, stesso contatore dei
// piani di sviluppo, stessa voce-azione (Note metodologiche) di prima. Gli strumenti
// demo stanno in Amministrazione → Dati dimostrativi, solo per l'account demo
// (CLAUDE.md §9). In testa la
// società (struttura gruppo → società: oggi Assessment ne conosce una, il
// nome dalle impostazioni del modulo); in fondo il conteggio dei dipendenti.
export function AssessmentNav() {
  const { lang, ui, state, isAdmin, toast, companies, company, setCompanyId } = useAssessment()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [confirm, confirmDialog] = useConfirm()
  const location = useLocation()
  // Il confronto è una vista dei risultati trasversali: nel menu resta accesa quella voce.
  const pathPage = location.pathname.split('/')[2] || 'home'
  const currentPage = pathPage === 'confronto' ? 'soft-risultati' : pathPage
  // "Area Valutazioni" e "Area Risultati" partono aperte: le loro voci si
  // vedono subito sotto (richiesta del cliente, 2026-10-13). Si possono chiudere.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ home: true, valutazioni: true, risultati: true })
  const [showMethodology, setShowMethodology] = useState(false)
  const demo = isDemoMode()
  const nav = getNavConfig(lang)
  const flags = { A: state.settings.modulo === 'A' || state.settings.modulo === 'AB', B: state.settings.modulo === 'B' || state.settings.modulo === 'AB' }
  // Foglio 3 (Roberto Feliciani): la vista scelta nella Home (CT, CP o
  // Completo) si vede anche nell'indice. Con CT le voci delle competenze
  // trasversali stanno in evidenza e quelle delle professionali si attenuano;
  // con CP il contrario; con CT + CP tutte uguali. Le voci attenuate restano
  // visibili e si possono aprire (prima, con una sola vista, sparivano).
  const SOFT_ITEMS = ['soft-overview', 'soft', 'soft-risultati']
  const HARD_ITEMS = ['hard-overview', 'hard', 'gestione-valutazioni', 'hard-risultati']
  const onlyOneView = flags.A !== flags.B
  const emphasisFor = (id: string): 'on' | 'off' | 'none' => {
    if (!onlyOneView) return 'none'
    const soft = SOFT_ITEMS.includes(id)
    const hard = HARD_ITEMS.includes(id)
    if (!soft && !hard) return 'none'
    return (soft && flags.A) || (hard && flags.B) ? 'on' : 'off'
  }
  const emphasisClass = (id: string) => {
    const e = emphasisFor(id)
    return e === 'on' ? 'font-semibold text-sidebar-foreground' : e === 'off' ? 'text-sidebar-foreground/45 hover:text-sidebar-foreground' : undefined
  }
  const feedbackBadge = state.employees.filter((e) => e.feedbackNeeded).length

  // Una volta per società: i dati che le versioni precedenti tenevano in questo
  // browser vanno sul server (decisione 4 del 2026-10-14) e poi si cancellano
  // dal browser (PROGETTO-TUTTO-SUL-SERVER.md). Prima una prova che non salva
  // niente e dice cosa entrerà, poi la conferma.
  // `cleared` nasconde la voce appena il browser è stato svuotato.
  const [cleared, setCleared] = useState(false)
  const browserData = useMemo(() => (!cleared && isAdmin && company ? readBrowserAssessment() || readBrowser5p() : null), [cleared, isAdmin, company])
  async function importBrowserData() {
    if (!company) return
    const local = readBrowserAssessment()
    const local5p = readBrowser5p()
    if (!local && !local5p) {
      toast(ui.importNothing)
      return
    }
    setBusy(true)
    try {
      const preview = local ? await assessmentApi.importState(company.id, local, true) : null
      // Il 5P va sul server solo se lì non ce n'è ancora uno: non si sovrascrive il lavoro di un collega.
      const server5pExists = local5p ? (await assessmentApi.get5p(company.id)).version > 0 : false
      setBusy(false)
      const description = ((preview ? ui.importConfirmBody(preview, company.name) : '') + (local5p ? (server5pExists ? ui.importConfirm5pSkipped : ui.importConfirm5p) : '')).trim()
      if (!(await confirm({ title: ui.importConfirmTitle, description, confirmLabel: ui.importConfirmBtn, cancelLabel: ui.confirmCancel }))) return
      setBusy(true)
      const done = local ? await assessmentApi.importState(company.id, local, false) : null
      if (local5p && !server5pExists) await assessmentApi.put5p(company.id, local5p, 0)
      clearBrowserAssessment()
      setCleared(true)
      await queryClient.invalidateQueries({ queryKey: ['assessment', 'state', company.id] })
      await queryClient.invalidateQueries({ queryKey: ['assessment', '5p', company.id] })
      toast(ui.importDone(done?.employees ?? 0), 'ok')
    } catch (err) {
      toast(ui.importFailed(errorReason(err, ui.serverOffline)), 'err')
    } finally {
      setBusy(false)
    }
  }

  // Raggruppa per sezione: una voce `section` apre un gruppo con etichetta.
  // Un gruppo che resterebbe vuoto non compare.
  type Entry = (typeof nav)[number]
  const groups: { label?: string; entries: Entry[] }[] = [{ entries: [] }]
  for (const entry of nav) {
    if (entry.type === 'section') groups.push({ label: entry.label, entries: [] })
    else groups[groups.length - 1].entries.push(entry)
  }

  function renderEntry(entry: Entry) {
    if (entry.type === 'link') {
      const Icon = iconFor(entry.icon)
      return (
        <SidebarMenuItem key={entry.id}>
          <SidebarMenuButton asChild isActive={entry.id === currentPage} className={emphasisClass(entry.id)}>
            <NavLink to={`/assessment/${entry.id}`}>
              <Icon aria-hidden="true" />
              <span className="min-w-0 flex-1">{entry.label}</span>
              {entry.badge && feedbackBadge > 0 ? <SidebarMenuBadge aria-label={`${feedbackBadge}`}>{feedbackBadge}</SidebarMenuBadge> : null}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    }
    if (entry.type === 'action') {
      const Icon = iconFor(entry.icon)
      const handler = entry.action === 'openMethodologyModal' ? () => setShowMethodology(true) : undefined
      return (
        <SidebarMenuItem key={entry.id}>
          <SidebarMenuButton type="button" onClick={handler} disabled={!handler || busy}>
            <Icon aria-hidden="true" />
            <span className="min-w-0 flex-1">{entry.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    }
    if (entry.type === 'group') {
      const visibleItems = entry.items
      if (!visibleItems.length) return null
      const containsActive = visibleItems.some((it) => it.id === currentPage)
      const isOpen = containsActive || !!openGroups[entry.groupId]
      const Icon = iconFor(entry.icon)
      const toggle = () => setOpenGroups((p) => ({ ...p, [entry.groupId]: !p[entry.groupId] }))
      // "Home" apre la home e ha sotto le pagine dei risultati (CLAUDE.md, Fase 6,
      // 2026-11-02): il titolo è un link, quindi si apre e chiude con la freccia.
      const homeActive = entry.homeId === currentPage
      return (
        <SidebarMenuItem key={entry.groupId}>
          {entry.homeId ? (
            <>
              <SidebarMenuButton asChild isActive={homeActive}>
                <NavLink to={`/assessment/${entry.homeId}`}>
                  <Icon aria-hidden="true" />
                  <span className="min-w-0 flex-1">{entry.label}</span>
                </NavLink>
              </SidebarMenuButton>
              {containsActive ? null : (
                <SidebarMenuAction isActive={homeActive} aria-expanded={isOpen} aria-label={entry.label} onClick={toggle}>
                  <ChevronDown aria-hidden="true" className={isOpen ? 'rotate-180' : undefined} />
                </SidebarMenuAction>
              )}
            </>
          ) : (
            <SidebarMenuButton type="button" aria-expanded={isOpen} onClick={toggle}>
              <Icon aria-hidden="true" />
              <span className="min-w-0 flex-1">{entry.label}</span>
            </SidebarMenuButton>
          )}
          {isOpen ? (
            <SidebarMenuSub>
              {visibleItems.map((it) => (
                <SidebarMenuItem key={it.id}>
                  <SidebarMenuButton asChild isActive={it.id === currentPage} className={emphasisClass(it.id)}>
                    <NavLink to={`/assessment/${it.id}`}>{it.label}</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenuSub>
          ) : null}
        </SidebarMenuItem>
      )
    }
    return null
  }

  return (
    <>
      <SidebarHeader>
        <CompanySwitcher companies={companies.map((c) => ({ id: c.id, name: c.name }))} activeId={company?.id} onChange={setCompanyId} note={demo ? ui.res.demoBadge : undefined} />
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g, i) => {
          const items = g.entries.map(renderEntry).filter(Boolean)
          if (!items.length) return null
          return (
            <SidebarGroup key={i}>
              {g.label ? <SidebarGroupLabel>{g.label}</SidebarGroupLabel> : null}
              <SidebarMenu>{items}</SidebarMenu>
            </SidebarGroup>
          )
        })}
        {isDemoAccount() ? (
          <SidebarGroup>
            <SidebarGroupLabel>{ui.res.adminLabel}</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/recruiting/admin/dati-dimostrativi">
                    <RotateCcw aria-hidden="true" />
                    <span className="min-w-0 flex-1">{ui.res.demoBadge}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        ) : null}
        {browserData ? (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton type="button" onClick={importBrowserData} disabled={busy}>
                  <Upload aria-hidden="true" />
                  <span className="min-w-0 flex-1">{ui.importBrowserData}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
      <SidebarFooter>{ui.employeesRecorded ? ui.employeesRecorded(state.employees.length) : `${state.employees.length}`}</SidebarFooter>
      {showMethodology && <MethodologyModal onClose={() => setShowMethodology(false)} />}
      {confirmDialog}
    </>
  )
}
