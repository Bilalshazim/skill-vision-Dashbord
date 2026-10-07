import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { Toaster } from '@/components/ui/sonner'
import AssessmentLayout from '@/modules/assessment/AssessmentLayout'
import RecruitingLayout from '@/modules/recruiting/RecruitingLayout'

// Code-splitting — every routed page is its own chunk, loaded only when
// visited. The main driver was the Assessment pages that pull in ApexCharts
// AND Chart.js (both were being bundled eagerly for every visitor, even to
// pages with no charts at all) — see App.tsx's prior version, which
// statically imported all of these. Applied uniformly to every page here
// rather than hand-picking "heavy" ones, since that's a moving target and
// lazy() has no real downside for a route-level component.
const ModuleChooserPage = lazy(() => import('@/pages/ModuleChooserPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const JobPostingPublicPage = lazy(() => import('@/modules/recruiting/public/JobPostingPublicPage'))
const RecruitingHome = lazy(() => import('@/modules/recruiting/RecruitingHome'))
const CipAdminPage = lazy(() => import('@/modules/recruiting/admin/CipAdminPage'))
const EmailConfigAdminPage = lazy(() => import('@/modules/recruiting/admin/EmailConfigAdminPage'))
const OriginalSkillsPreviewPage = lazy(() => import('@/modules/recruiting/admin/OriginalSkillsPreviewPage'))
const AskPage = lazy(() => import('@/modules/recruiting/ask/AskPage'))
const CvExportPage = lazy(() => import('@/modules/recruiting/cv-export/CvExportPage'))
const EvaluateStandalonePage = lazy(() => import('@/modules/recruiting/evaluate/EvaluateStandalonePage'))
const RecruitingEvaluatePage = lazy(() => import('@/modules/recruiting/evaluate/RecruitingEvaluatePage'))
const JobProfilePage = lazy(() => import('@/modules/recruiting/job-profile/JobProfilePage'))
const MatchPage = lazy(() => import('@/modules/recruiting/match/MatchPage'))
const MetodoPage = lazy(() => import('@/modules/recruiting/metodo/MetodoPage'))
const PaginaAPage = lazy(() => import('@/modules/recruiting/pagina-a/PaginaAPage'))
const PipelinePage = lazy(() => import('@/modules/recruiting/pipeline/PipelinePage'))
const ProfileHubPage = lazy(() => import('@/modules/recruiting/profile-hub/ProfileHubPage'))
const RankingPage = lazy(() => import('@/modules/recruiting/ranking/RankingPage'))

const AssessmentAiPage = lazy(() => import('@/modules/assessment/pages/AssessmentAiPage'))
const AssessmentAnagraficaPage = lazy(() => import('@/modules/assessment/pages/AssessmentAnagraficaPage'))
const AssessmentAnalisiPage = lazy(() => import('@/modules/assessment/pages/AssessmentAnalisiPage'))
const AssessmentCompanyPage = lazy(() => import('@/modules/assessment/pages/AssessmentCompanyPage'))
const AssessmentCustomerCarePage = lazy(() => import('@/modules/assessment/pages/AssessmentCustomerCarePage'))
const AssessmentEvaluatePage = lazy(() => import('@/modules/assessment/pages/AssessmentEvaluatePage'))
const AssessmentFeedbackPage = lazy(() => import('@/modules/assessment/pages/AssessmentFeedbackPage'))
const AssessmentHardOverviewPage = lazy(() => import('@/modules/assessment/pages/AssessmentHardOverviewPage'))
const AssessmentGestioneValutazioniPage = lazy(() => import('@/modules/assessment/pages/AssessmentGestioneValutazioniPage'))
const AssessmentHardPage = lazy(() => import('@/modules/assessment/pages/AssessmentHardPage'))
const AssessmentHardRisultatiPage = lazy(() => import('@/modules/assessment/pages/AssessmentHardRisultatiPage'))
const AssessmentHomePage = lazy(() => import('@/modules/assessment/pages/AssessmentHomePage'))
const AssessmentSoftOverviewPage = lazy(() => import('@/modules/assessment/pages/AssessmentSoftOverviewPage'))
const AssessmentSoftPage = lazy(() => import('@/modules/assessment/pages/AssessmentSoftPage'))
const AssessmentSoftRisultatiPage = lazy(() => import('@/modules/assessment/pages/AssessmentSoftRisultatiPage'))
const AssessmentValorePage = lazy(() => import('@/modules/assessment/pages/AssessmentValorePage'))

// Catalogo dei componenti: in sviluppo sempre; in una build solo con
// l'impostazione esplicita VITE_ENABLE_COMPONENT_CATALOG=true (l'anteprima su
// Railway, finché la produzione è solo interna — CLAUDE.md, Fase 3). Senza,
// la condizione è falsa già in compilazione e il modulo non entra nella build.
// Va tolta prima del primo cliente reale (Fase 8).
const ComponentCatalog = import.meta.env.DEV || import.meta.env.VITE_ENABLE_COMPONENT_CATALOG === 'true' ? lazy(() => import('@/dev/ComponentCatalog')) : null

function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Suspense fallback={null}>
        <Routes>
          {ComponentCatalog && <Route path="dev/components" element={<ComponentCatalog />} />}
          {/* La radice: la scelta del modulo dopo l'accesso (era la landing del
              guscio legacy, che ora dopo il login rimanda qui). Recruiting e
              Assessment rendono ciascuno lo stesso AppShell dal proprio
              layout, dentro i propri provider — vedi AppShell.tsx. */}
          <Route path="/login" element={<LoginPage />} />
          {/* L'annuncio pubblicato: pubblico, fuori dalla guardia d'accesso. */}
          <Route path="/jd/:token" element={<JobPostingPublicPage />} />
          <Route path="/" element={<ModuleChooserPage />} />
          <Route>
            <Route path="recruiting" element={<RecruitingLayout />}>
              {/* Entrando in Recruiting si apre "Profilo della ricerca", la prima
                  pagina; "Stato dell'arte" (la vecchia home) ha un indirizzo suo. */}
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="stato-dell-arte" element={<RecruitingHome />} />
              <Route path="ranking" element={<RankingPage />} />
              <Route path="pagina-a" element={<PaginaAPage />} />
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="match" element={<MatchPage />} />
              <Route path="metodo" element={<MetodoPage />} />
              <Route path="ask" element={<AskPage />} />
              <Route path="cv" element={<CvExportPage />} />
              <Route path="job-profile" element={<JobProfilePage />} />
              <Route path="profile" element={<ProfileHubPage />} />
              {/* Phase 33 — admin UIs for backend functionality that already
                  existed but had no screen (CIP, email config), plus the
                  JWT-authenticated evaluator workspace. Each page gates its
                  own content by role (see their own files); the backend is
                  still the real authority on every request either way. */}
              <Route path="admin/cip" element={<CipAdminPage />} />
              <Route path="admin/email" element={<EmailConfigAdminPage />} />
              <Route path="admin/comitato-scientifico" element={<OriginalSkillsPreviewPage />} />
              {/* Il vecchio indirizzo (preferiti): stessa pagina, nome nuovo. */}
              <Route path="admin/original-skills" element={<Navigate to="/recruiting/admin/comitato-scientifico" replace />} />
              <Route path="evaluate" element={<RecruitingEvaluatePage />} />
            </Route>
          </Route>
          {/* Accountless evaluator (OD-9 scoped-token path) — its own
              top-level route, no shell/topbar chrome, same reasoning as
              assessment/evaluate below. See EvaluateStandalonePage.tsx. */}
          <Route path="evaluate" element={<EvaluateStandalonePage />} />
          {/* Assessment renders the same AppShell as Recruiting, from
              AssessmentLayout (inside AssessmentProvider, where its nav data
              lives). */}
          <Route path="assessment" element={<AssessmentLayout />}>
            <Route index element={<AssessmentHomePage />} />
            <Route path="home" element={<AssessmentHomePage />} />
            {/* "Competenze Trasversali/Professionali" (nav positions 2/3) —
                new landing pages; "soft"/"hard" (evaluation entry, 7/8) and
                "soft-risultati"/"hard-risultati" (results, 9/10) are the
                same underlying page/tabs opened on a different default tab
                — see each page file's own comment for why. */}
            <Route path="soft-overview" element={<AssessmentSoftOverviewPage />} />
            <Route path="hard-overview" element={<AssessmentHardOverviewPage />} />
            <Route path="company" element={<AssessmentCompanyPage />} />
            <Route path="anagrafica" element={<AssessmentAnagraficaPage />} />
            <Route path="analisi" element={<AssessmentAnalisiPage />} />
            <Route path="soft" element={<AssessmentSoftPage />} />
            <Route path="hard" element={<AssessmentHardPage />} />
            {/* Foglio 7: la Valutazione 5P multi-fonte (sei schede di lavoro), nell'Area Valutazioni professionali. */}
            <Route path="gestione-valutazioni" element={<AssessmentGestioneValutazioniPage />} />
            <Route path="soft-risultati" element={<AssessmentSoftRisultatiPage />} />
            <Route path="hard-risultati" element={<AssessmentHardRisultatiPage />} />
            <Route path="valore" element={<AssessmentValorePage />} />
            {/* Removed from the nav menu per the client's 14-item list, but
                the page itself stays reachable by direct URL — no
                functionality deleted, only unlisted. */}
            <Route path="customercare" element={<AssessmentCustomerCarePage />} />
            <Route path="feedback" element={<AssessmentFeedbackPage />} />
            <Route path="ai" element={<AssessmentAiPage />} />
          </Route>
          {/* Restricted evaluator takeover (?token=) — deliberately its OWN
              top-level route, no sidebar/topbar/AssessmentProvider, matching
              legacy's enterRestrictedEvaluatorMode() full-page swap exactly
              (js/assessment.js ~4247-4250, ~6676-6734). */}
          <Route path="assessment/evaluate" element={<AssessmentEvaluatePage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
