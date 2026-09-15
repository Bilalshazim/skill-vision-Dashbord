import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { Topbar as GlobalTopbar } from '@/layouts/Topbar'
import { Icon } from '@/modules/assessment/components/Icon'
import { MethodologyModal } from '@/modules/assessment/components/MethodologyModal'
import { ToastHost } from '@/modules/assessment/components/ToastHost'
import { AssessmentProvider, useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { generateDemoData } from '@/modules/assessment/lib/demo-data'
import { getNavConfig, getPageMeta } from '@/modules/assessment/lib/legacy-utils'
import { SHELL_ENTRY_URL, isShellAuthenticated } from '@/modules/assessment/lib/shell-bridge'
import '@/modules/assessment/styles/assessment-scoped.css'

// PHASE 24 GROUP A — Assessment's own shell (sidebar/topbar/nav), reproducing
// the DOM structure of modules/assessment.html's #app (~54-110) and
// renderNav()/navigateTo() (js/assessment.js ~3268-3327). Deliberately NOT
// forced into Recruiting's sidebar/AppShell — Assessment keeps its own
// look, its own nav list, its own header — per the phase's explicit "do not
// force Assessment into the Recruiting navigation structure" instruction.
//
// AUTH — no second login. If the shell's own login (index.html) was never
// completed this session (`sessionStorage.sv_shell_auth !== '1'`), this
// redirects to the shell instead of rendering anything, mirroring exactly
// what a direct, unauthenticated visit to the legacy iframe URL would leave
// the user looking at: the real login, not a React approximation of one.
function AssessmentAuthGuard({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null)
  useEffect(() => {
    setAuthed(isShellAuthenticated())
  }, [])
  useEffect(() => {
    if (authed === false) window.location.replace(SHELL_ENTRY_URL)
  }, [authed])
  if (authed !== true) return null
  return <>{children}</>
}

function NavList() {
  const { lang, ui, state, persist, canEdit, toast } = useAssessment()
  const location = useLocation()
  const navigate = useNavigate()
  const currentPage = location.pathname.split('/')[2] || 'home'
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const [showMethodology, setShowMethodology] = useState(false)
  const nav = getNavConfig(lang)
  const flags = { A: state.settings.modulo === 'A' || state.settings.modulo === 'AB', B: state.settings.modulo === 'B' || state.settings.modulo === 'AB' }
  const moduleRequirementMet = (req: string | null | undefined) => {
    if (!req) return true
    if (req === 'AB') return flags.A && flags.B
    return req === 'A' ? flags.A : flags.B
  }
  const feedbackBadge = state.employees.filter((e) => e.feedbackNeeded).length

  // Ported from confirmResetDemo() (js/assessment.js ~4230-4239) — a native
  // confirm() dialog, exactly like legacy (not a custom modal).
  function resetDemo() {
    if (!canEdit) {
      toast(ui.viewerReadOnly, 'err')
      return
    }
    if (!window.confirm(ui.confirmResetDemo)) return
    persist(generateDemoData())
    navigate('/assessment/home')
  }

  return (
    <nav className="mainnav">
      {nav.map((entry, i) => {
        if (entry.type === 'section') {
          return (
            <div key={i} className="nav-section-title">
              {entry.label}
            </div>
          )
        }
        if (entry.type === 'link') {
          if (!moduleRequirementMet(entry.requires)) return null
          return (
            <NavLink key={entry.id} to={`/assessment/${entry.id}`} className={() => `nav-item${entry.id === currentPage ? ' active' : ''}`}>
              <span className="ic">
                <Icon name={entry.icon as never} />
              </span>
              {entry.label}
              {entry.badge && feedbackBadge > 0 ? <span className="badge">{feedbackBadge}</span> : null}
            </NavLink>
          )
        }
        if (entry.type === 'action') {
          // Methodology and Reset Demo are wired for real. Excel/PDF bulk
          // import (openImportModal) is the one item still deferred this
          // phase — its fuzzy multi-language column-matching logic is
          // substantial enough to warrant its own dedicated pass; rendered
          // inert with an honest tooltip rather than a fake working button.
          if (entry.action === 'openImportModal') {
            return (
              <div key={entry.id} className="nav-item" style={{ opacity: 0.5, cursor: 'default' }} title={ui.toastEnableModule || 'Not yet available in this build'}>
                <span className="ic">
                  <Icon name={entry.icon as never} />
                </span>
                {entry.label}
              </div>
            )
          }
          const handler = entry.action === 'openMethodologyModal' ? () => setShowMethodology(true) : entry.action === 'confirmResetDemo' ? resetDemo : undefined
          return (
            <div key={entry.id} className="nav-item" onClick={handler}>
              <span className="ic">
                <Icon name={entry.icon as never} />
              </span>
              {entry.label}
            </div>
          )
        }
        // group
        const visibleItems = entry.items.filter((it) => moduleRequirementMet(it.requires))
        if (!visibleItems.length) return null
        const containsActive = visibleItems.some((it) => it.id === currentPage)
        const isOpen = containsActive || !!openGroups[entry.groupId]
        return (
          <div key={entry.groupId}>
            <div className="nav-item" onClick={() => setOpenGroups((p) => ({ ...p, [entry.groupId]: !p[entry.groupId] }))}>
              <span className="ic">
                <Icon name={entry.icon as never} />
              </span>
              {entry.label}
              <span className={`chevron${isOpen ? ' open' : ''}`}>
                <Icon name="chevron" />
              </span>
            </div>
            <div className={`nav-sublist${isOpen ? ' open' : ''}`}>
              {visibleItems.map((it) => (
                <NavLink key={it.id} to={`/assessment/${it.id}`} className={() => `nav-subitem${it.id === currentPage ? ' active' : ''}`}>
                  {it.label}
                </NavLink>
              ))}
            </div>
          </div>
        )
      })}
      {showMethodology && <MethodologyModal onClose={() => setShowMethodology(false)} />}
    </nav>
  )
}

function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const { state, ui } = useAssessment()
  const flags = { A: state.settings.modulo === 'A' || state.settings.modulo === 'AB', B: state.settings.modulo === 'B' || state.settings.modulo === 'AB' }
  return (
    <>
      <div className={`drawer-overlay${mobileOpen ? ' open' : ''}`} onClick={onCloseMobile} />
      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
        {/* The secondary Skill-Vision logo + "VALUTAZIONE DELLE COMPETENZE"
            tagline that used to sit here were removed (global top bar already
            carries the one Skill-Vision logo) — module-pill-row is now the
            sidebar's first element, no leftover empty header block. */}
        <div className="module-pill-row">
          <span className="module-pill-label">{ui.activeModules}</span>
          <div className="module-pills">
            <div className={`module-pill${flags.A ? ' active' : ''}`}>
              <span className="dot" /> {ui.moduleASoft}
            </div>
            <div className={`module-pill${flags.B ? ' active' : ''}`}>
              <span className="dot" /> {ui.moduleBHard}
            </div>
          </div>
        </div>
        <NavList />
        <div className="sidebar-footer">
          <div>
            <b>{state.settings.companyName}</b>
          </div>
          <div>{ui.employeesRecorded ? ui.employeesRecorded(state.employees.length) : `${state.employees.length}`}</div>
        </div>
      </aside>
    </>
  )
}

// Assessment's OWN topbar: page title/subtitle, its per-page action slot,
// and the toggle for ITS OWN internal sidebar (the Home/Company/Anagrafica/…
// nav below, Assessment's in-module navigation — not the global app nav).
// Language/theme/logout used to be duplicated here; they now live only in
// the global top bar rendered once above this (see AssessmentShell), so
// there's a single set of each control instead of two.
function Topbar({ onToggleMobile }: { onToggleMobile: () => void }) {
  const { lang, topbarActions } = useAssessment()
  const location = useLocation()
  const pageId = location.pathname.split('/')[2] || 'home'
  const meta = getPageMeta(lang, pageId)
  return (
    <div className="topbar">
      <button className="sidebar-toggle-btn" type="button" aria-label="Open sidebar" onClick={onToggleMobile}>
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" />
        </svg>
      </button>
      <div>
        <h1>{meta.title}</h1>
        <div className="sub">{meta.sub}</div>
      </div>
      <div className="topbar-spacer" />
      <div className="topbar-actions">{topbarActions}</div>
    </div>
  )
}

function AssessmentShell() {
  const { theme } = useAssessment()
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <>
      {/* Same global top bar component AppShell renders for Home/Recruiting —
          Assessment sits outside AppShell (its own complete shell below), so
          it renders this directly instead of a second implementation. */}
      <GlobalTopbar />
      <div className="sv-assessment-shell" data-theme={theme}>
        <div id="app" style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
          <div className="main">
            <Topbar onToggleMobile={() => setMobileOpen((v) => !v)} />
            <div className="content">
              <Outlet />
            </div>
          </div>
        </div>
        <ToastHost />
        <div id="report-print-container" className="report-print-only" />
      </div>
    </>
  )
}

export default function AssessmentLayout() {
  return (
    <AssessmentAuthGuard>
      <AssessmentProvider>
        <AssessmentShell />
      </AssessmentProvider>
    </AssessmentAuthGuard>
  )
}
