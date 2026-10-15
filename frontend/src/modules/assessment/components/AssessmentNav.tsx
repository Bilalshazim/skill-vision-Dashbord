import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight, Brain, ClipboardList, Coins, FileText, Home, type LucideIcon, MessageSquareText, RotateCcw, Sparkles, Upload, Users, Wrench } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

import { CompanySwitcher } from '@/components/patterns/CompanySwitcher'
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@/components/ui/sidebar'
import { useConfirm } from '@/hooks/use-confirm'
import { assessmentApi } from '@/lib/api/assessment'
import { isDemoMode } from '@/lib/demo-mode'
import { MethodologyModal } from '@/modules/assessment/components/MethodologyModal'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { generateDemoData } from '@/modules/assessment/lib/demo-data'
import { loadState as load5pState } from '@/modules/assessment/gestione5p/model'
import { getNavConfig } from '@/modules/assessment/lib/legacy-utils'
import { errorReason } from '@/modules/assessment/lib/server-sync'
import { readStoredAssessmentState } from '@/modules/assessment/lib/storage'

// Le icone della navigazione di Assessment: erano SVG del vecchio modulo
// iniettati come HTML (Icon.tsx); qui Lucide, per nome della voce.
const ICONS: Record<string, LucideIcon> = {
  home: Home,
  soft: Brain,
  hard: Wrench,
  users: Users,
  notes: FileText,
  value: Coins,
  feedback: MessageSquareText,
  ai: Sparkles,
  refresh: RotateCcw,
  transfer: ArrowLeftRight,
}
const iconFor = (name?: string) => (name && ICONS[name]) || ClipboardList

// Il contenuto della barra laterale di Assessment nel guscio unico. Stesse
// voci, stesse sezioni, l'evidenziazione per vista (CT/CP) al posto del filtro per modulo, stesso contatore dei
// piani di sviluppo, stesse voci-azione (Note metodologiche, Reset demo) di
// prima; il Reset demo compare solo in demo (lib/demo-mode.ts). In testa la
// società (struttura gruppo → società: oggi Assessment ne conosce una, il
// nome dalle impostazioni del modulo); in fondo il conteggio dei dipendenti.
export function AssessmentNav() {
  const { lang, ui, state, persist, canEdit, isAdmin, toast, storage, companies, company, setCompanyId, retry } = useAssessment()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [confirm, confirmDialog] = useConfirm()
  const location = useLocation()
  const navigate = useNavigate()
  const currentPage = location.pathname.split('/')[2] || 'home'
  // "Area Valutazioni" e "Area Risultati" partono aperte: le loro voci si
  // vedono subito sotto (richiesta del cliente, 2026-10-13). Si possono chiudere.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ valutazioni: true, risultati: true })
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

  async function resetDemo() {
    if (!canEdit) {
      toast(ui.viewerReadOnly, 'err')
      return
    }
    if (!(await confirm({ title: ui.resetDemo, description: ui.confirmResetDemo, confirmLabel: ui.resetDemo, cancelLabel: ui.confirmCancel, destructive: true }))) return
    if (storage === 'server' && company) {
      // Sul server: si tolgono i dati della società demo e si importano quelli di prova.
      setBusy(true)
      try {
        await assessmentApi.resetDemo(company.id)
        await assessmentApi.importState(company.id, generateDemoData(), false)
        await queryClient.invalidateQueries({ queryKey: ['assessment', 'state', company.id] })
      } catch (err) {
        toast(ui.serverSaveFailed(errorReason(err, ui.serverOffline)), 'err')
        retry()
        return
      } finally {
        setBusy(false)
      }
    } else persist(generateDemoData())
    navigate('/assessment/home')
  }

  // Sul server, una volta per società: i dati che finora stavano in questo
  // browser vanno sul server (decisione 4 del 2026-10-14). Prima una prova
  // che non salva niente e dice cosa entrerà, poi la conferma.
  // Il 5P del browser (sv5p_state_v1) si porta solo se è un progetto vero, non i dati di esempio.
  const readLocal5p = () => {
    const s = load5pState()
    return s && !s.demo && s.people.length ? s : null
  }
  const browserData = useMemo(() => (storage === 'server' && isAdmin && company ? readStoredAssessmentState() || readLocal5p() : null), [storage, isAdmin, company])
  async function importBrowserData() {
    if (!company) return
    const local = readStoredAssessmentState()
    const local5p = readLocal5p()
    if (!local && !local5p) {
      toast(ui.importNothing)
      return
    }
    setBusy(true)
    try {
      const preview = local ? await assessmentApi.importState(company.id, local, true) : null
      setBusy(false)
      const description = ((preview ? ui.importConfirmBody(preview, company.name) : '') + (local5p ? ui.importConfirm5p : '')).trim()
      if (!(await confirm({ title: ui.importConfirmTitle, description, confirmLabel: ui.importConfirmBtn, cancelLabel: ui.confirmCancel }))) return
      setBusy(true)
      const done = local ? await assessmentApi.importState(company.id, local, false) : null
      // Il 5P va sul server solo se lì non ce n'è ancora uno: non si sovrascrive il lavoro di un collega.
      if (local5p && (await assessmentApi.get5p(company.id)).version === 0) await assessmentApi.put5p(company.id, local5p, 0)
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
  // Un gruppo che resterebbe vuoto (es. "Strumenti amministrazione" fuori
  // dalla demo) non compare.
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
      if (entry.action === 'confirmResetDemo' && !demo) return null
      const Icon = iconFor(entry.icon)
      const handler = entry.action === 'openMethodologyModal' ? () => setShowMethodology(true) : entry.action === 'confirmResetDemo' ? resetDemo : undefined
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
      return (
        <SidebarMenuItem key={entry.groupId}>
          <SidebarMenuButton type="button" aria-expanded={isOpen} onClick={() => setOpenGroups((p) => ({ ...p, [entry.groupId]: !p[entry.groupId] }))}>
            <Icon aria-hidden="true" />
            <span className="min-w-0 flex-1">{entry.label}</span>
          </SidebarMenuButton>
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
        {storage === 'server' ? (
          <CompanySwitcher companies={companies.map((c) => ({ id: c.id, name: c.name }))} activeId={company?.id} onChange={setCompanyId} />
        ) : (
          <CompanySwitcher companies={[{ id: 'assessment', name: state.settings.companyName }]} activeId="assessment" />
        )}
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
