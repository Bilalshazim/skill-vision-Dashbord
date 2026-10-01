import { Brain, ClipboardList, Coins, FileText, Home, type LucideIcon, MessageSquareText, RotateCcw, Sparkles, Users, Wrench } from 'lucide-react'
import { useState } from 'react'
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
import { isDemoMode } from '@/lib/demo-mode'
import { MethodologyModal } from '@/modules/assessment/components/MethodologyModal'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { generateDemoData } from '@/modules/assessment/lib/demo-data'
import { getNavConfig } from '@/modules/assessment/lib/legacy-utils'

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
}
const iconFor = (name?: string) => (name && ICONS[name]) || ClipboardList

// Il contenuto della barra laterale di Assessment nel guscio unico. Stesse
// voci, stesse sezioni, stesso filtro per modulo A/B, stesso contatore dei
// piani di sviluppo, stesse voci-azione (Note metodologiche, Reset demo) di
// prima; il Reset demo compare solo in demo (lib/demo-mode.ts). In testa la
// società (struttura gruppo → società: oggi Assessment ne conosce una, il
// nome dalle impostazioni del modulo); in fondo il conteggio dei dipendenti.
export function AssessmentNav() {
  const { lang, ui, state, persist, canEdit, toast } = useAssessment()
  const [confirm, confirmDialog] = useConfirm()
  const location = useLocation()
  const navigate = useNavigate()
  const currentPage = location.pathname.split('/')[2] || 'home'
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const [showMethodology, setShowMethodology] = useState(false)
  const demo = isDemoMode()
  const nav = getNavConfig(lang)
  const flags = { A: state.settings.modulo === 'A' || state.settings.modulo === 'AB', B: state.settings.modulo === 'B' || state.settings.modulo === 'AB' }
  const moduleRequirementMet = (req: string | null | undefined) => {
    if (!req) return true
    if (req === 'AB') return flags.A && flags.B
    return req === 'A' ? flags.A : flags.B
  }
  const feedbackBadge = state.employees.filter((e) => e.feedbackNeeded).length

  async function resetDemo() {
    if (!canEdit) {
      toast(ui.viewerReadOnly, 'err')
      return
    }
    if (!(await confirm({ title: ui.resetDemo, description: ui.confirmResetDemo, confirmLabel: ui.resetDemo, cancelLabel: ui.confirmCancel, destructive: true }))) return
    persist(generateDemoData())
    navigate('/assessment/home')
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
      if (!moduleRequirementMet(entry.requires)) return null
      const Icon = iconFor(entry.icon)
      return (
        <SidebarMenuItem key={entry.id}>
          <SidebarMenuButton asChild isActive={entry.id === currentPage}>
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
          <SidebarMenuButton type="button" onClick={handler} disabled={!handler}>
            <Icon aria-hidden="true" />
            <span className="min-w-0 flex-1">{entry.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    }
    if (entry.type === 'group') {
      const visibleItems = entry.items.filter((it) => moduleRequirementMet(it.requires))
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
                  <SidebarMenuButton asChild isActive={it.id === currentPage}>
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
        <CompanySwitcher companies={[{ id: 'assessment', name: state.settings.companyName }]} activeId="assessment" />
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
      </SidebarContent>
      <SidebarFooter>{ui.employeesRecorded ? ui.employeesRecorded(state.employees.length) : `${state.employees.length}`}</SidebarFooter>
      {showMethodology && <MethodologyModal onClose={() => setShowMethodology(false)} />}
      {confirmDialog}
    </>
  )
}
