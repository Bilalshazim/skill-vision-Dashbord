import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { ModuleLockGate } from '@/components/ModuleLockGate'
import { ErrorBoundary } from '@/components/patterns/ErrorBoundary'
import { PageBreadcrumb } from '@/components/patterns/PageBreadcrumb'
import { PageHeader } from '@/components/patterns/PageHeader'
import { AppShell } from '@/layouts/AppShell'
import { AuthGuard } from '@/layouts/AuthGuard'
import { PageTransition } from '@/layouts/PageTransition'
import { AssessmentDataGate } from '@/modules/assessment/components/AssessmentDataGate'
import { AssessmentModeSwitch } from '@/modules/assessment/components/AssessmentModeSwitch'
import { AssessmentNav } from '@/modules/assessment/components/AssessmentNav'
import { AssessmentProvider, useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { getPageMeta, getPageTrail } from '@/modules/assessment/lib/legacy-utils'
import '@/modules/assessment/styles/assessment-print.css'

// Assessment nel guscio unico (Fase 4): lo stesso AppShell di Recruiting,
// con la barra laterale del modulo. Il vecchio tema del modulo
// (`.sv-assessment-shell`, `data-theme`, il ponte) è stato tolto in Fase 6:
// resta `data-module` per la spaziatura dei campi e la stampa, e
// `data-portal-scope` per aprire dialog e pannelli dentro il modulo. Titolo e azioni di pagina,
// che stavano nella barra superiore del modulo, sono l'intestazione della
// pagina: stessi testi (`getPageMeta`) e stesso slot (`useTopbarActions`).
function AssessmentShell() {
  const { lang, topbarActions, pageDescription } = useAssessment()
  const location = useLocation()
  const pageId = location.pathname.split('/')[2] || 'home'
  const meta = getPageMeta(lang, pageId)
  const trail = getPageTrail(lang, pageId)
  // L'Intervista è la percezione della Direzione, non una misura per pacchetto: la
  // scelta CT / CP / Completo lì non c'è (Decisioni del 2026-11-09).
  // La pagina si apre dopo i dati: senza questo il suo codice partirebbe solo allora, in
  // serie. La Panoramica è la più pesante: il codice si scarica insieme ai dati.
  useEffect(() => {
    if (pageId === 'panoramica') void import('@/modules/assessment/pages/AssessmentPanoramicaPage')
  }, [pageId])
  return (
    <AppShell section="assessment" sidebarLabel="Assessment" sidebar={<AssessmentNav />}>
      <div data-module="assessment" data-portal-scope>
        {/* Le pagine dei risultati non hanno una voce qui: portano da sé
            percorso, titolo e domanda (ResultsPage). */}
        {trail ? <PageBreadcrumb items={trail.items} current={trail.current} /> : null}
        {meta.title ? <PageHeader level="page" title={meta.title} description={pageDescription ?? (meta.sub || undefined)} actions={<>{topbarActions}{pageId === 'analisi' ? null : <AssessmentModeSwitch />}</>} className="mb-6" /> : null}
        <ModuleLockGate module="ASSESSMENT">
          <ErrorBoundary>
            <AssessmentDataGate>
              <PageTransition />
            </AssessmentDataGate>
          </ErrorBoundary>
        </ModuleLockGate>
        <div id="report-print-container" className="report-print-only" />
      </div>
    </AppShell>
  )
}

export default function AssessmentLayout() {
  return (
    <AuthGuard>
      <AssessmentProvider>
        <AssessmentShell />
      </AssessmentProvider>
    </AuthGuard>
  )
}
