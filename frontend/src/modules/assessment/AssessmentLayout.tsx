import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { ModuleLockGate } from '@/components/ModuleLockGate'
import { PageHeader } from '@/components/patterns/PageHeader'
import { AppShell } from '@/layouts/AppShell'
import { AssessmentNav } from '@/modules/assessment/components/AssessmentNav'
import { AssessmentProvider, useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { getPageMeta } from '@/modules/assessment/lib/legacy-utils'
import { SHELL_ENTRY_URL, isShellAuthenticated } from '@/modules/assessment/lib/shell-bridge'
import '@/modules/assessment/styles/assessment-print.css'

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

// Assessment nel guscio unico (Fase 4): lo stesso AppShell di Recruiting,
// con la barra laterale del modulo. Il vecchio tema del modulo
// (`.sv-assessment-shell`, `data-theme`, il ponte) è stato tolto in Fase 6:
// resta `data-module` per la spaziatura dei campi e la stampa, e
// `data-portal-scope` per aprire dialog e pannelli dentro il modulo. Titolo e azioni di pagina,
// che stavano nella barra superiore del modulo, sono l'intestazione della
// pagina: stessi testi (`getPageMeta`) e stesso slot (`useTopbarActions`).
function AssessmentShell() {
  const { lang, topbarActions } = useAssessment()
  const location = useLocation()
  const pageId = location.pathname.split('/')[2] || 'home'
  const meta = getPageMeta(lang, pageId)
  return (
    <AppShell section="assessment" sidebarLabel="Assessment" sidebar={<AssessmentNav />}>
      <div data-module="assessment" data-portal-scope>
        <PageHeader level="page" title={meta.title} description={meta.sub} actions={topbarActions} className="mb-6" />
        <ModuleLockGate module="ASSESSMENT">
          <Outlet />
        </ModuleLockGate>
        <div id="report-print-container" className="report-print-only" />
      </div>
    </AppShell>
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
