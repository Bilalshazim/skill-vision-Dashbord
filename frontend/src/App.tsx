import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/layouts/AppShell'
import AssessmentLayout from '@/modules/assessment/AssessmentLayout'
import RecruitingLayout from '@/modules/recruiting/RecruitingLayout'

// Code-splitting — every routed page is its own chunk, loaded only when
// visited. The main driver was the Assessment pages that pull in ApexCharts
// AND Chart.js (both were being bundled eagerly for every visitor, even to
// pages with no charts at all) — see App.tsx's prior version, which
// statically imported all of these. Applied uniformly to every page here
// rather than hand-picking "heavy" ones, since that's a moving target and
// lazy() has no real downside for a route-level component.
const RecruitingHome = lazy(() => import('@/modules/recruiting/RecruitingHome'))
const CipAdminPage = lazy(() => import('@/modules/recruiting/admin/CipAdminPage'))
const EmailConfigAdminPage = lazy(() => import('@/modules/recruiting/admin/EmailConfigAdminPage'))
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
const AssessmentHardPage = lazy(() => import('@/modules/assessment/pages/AssessmentHardPage'))
const AssessmentHardRisultatiPage = lazy(() => import('@/modules/assessment/pages/AssessmentHardRisultatiPage'))
const AssessmentHomePage = lazy(() => import('@/modules/assessment/pages/AssessmentHomePage'))
const AssessmentSoftOverviewPage = lazy(() => import('@/modules/assessment/pages/AssessmentSoftOverviewPage'))
const AssessmentSoftPage = lazy(() => import('@/modules/assessment/pages/AssessmentSoftPage'))
const AssessmentSoftRisultatiPage = lazy(() => import('@/modules/assessment/pages/AssessmentSoftRisultatiPage'))
const AssessmentValorePage = lazy(() => import('@/modules/assessment/pages/AssessmentValorePage'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          {/* "Home" has no React route: the legacy shell's own landing page
              (index.html's #sv-landing) is the single source of truth for it
              — see nav-config.ts / Topbar.tsx. AppShell wraps Recruiting alone. */}
          <Route element={<AppShell />}>
            <Route path="recruiting" element={<RecruitingLayout />}>
              <Route index element={<RecruitingHome />} />
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
              <Route path="evaluate" element={<RecruitingEvaluatePage />} />
            </Route>
          </Route>
          {/* Accountless evaluator (OD-9 scoped-token path) — its own
              top-level route, no shell/topbar chrome, same reasoning as
              assessment/evaluate below. See EvaluateStandalonePage.tsx. */}
          <Route path="evaluate" element={<EvaluateStandalonePage />} />
          {/* Assessment deliberately sits OUTSIDE the global AppShell (Home/
              Recruiting/Assessment outer chrome) — it keeps its own complete
              shell (sidebar/topbar/branding), matching legacy's iframe-loaded
              standalone document exactly, instead of a second nested sidebar
              stacked under AppShell's. See AssessmentLayout.tsx. */}
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
