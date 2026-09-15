import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/layouts/AppShell'
import AssessmentLayout from '@/modules/assessment/AssessmentLayout'
import AssessmentAiPage from '@/modules/assessment/pages/AssessmentAiPage'
import AssessmentAnagraficaPage from '@/modules/assessment/pages/AssessmentAnagraficaPage'
import AssessmentAnalisiPage from '@/modules/assessment/pages/AssessmentAnalisiPage'
import AssessmentCompanyPage from '@/modules/assessment/pages/AssessmentCompanyPage'
import AssessmentCustomerCarePage from '@/modules/assessment/pages/AssessmentCustomerCarePage'
import AssessmentEvaluatePage from '@/modules/assessment/pages/AssessmentEvaluatePage'
import AssessmentFeedbackPage from '@/modules/assessment/pages/AssessmentFeedbackPage'
import AssessmentHardPage from '@/modules/assessment/pages/AssessmentHardPage'
import AssessmentHomePage from '@/modules/assessment/pages/AssessmentHomePage'
import AssessmentSoftPage from '@/modules/assessment/pages/AssessmentSoftPage'
import AssessmentValorePage from '@/modules/assessment/pages/AssessmentValorePage'
import RecruitingHome from '@/modules/recruiting/RecruitingHome'
import RecruitingLayout from '@/modules/recruiting/RecruitingLayout'
import CipAdminPage from '@/modules/recruiting/admin/CipAdminPage'
import EmailConfigAdminPage from '@/modules/recruiting/admin/EmailConfigAdminPage'
import AskPage from '@/modules/recruiting/ask/AskPage'
import CvExportPage from '@/modules/recruiting/cv-export/CvExportPage'
import EvaluateStandalonePage from '@/modules/recruiting/evaluate/EvaluateStandalonePage'
import RecruitingEvaluatePage from '@/modules/recruiting/evaluate/RecruitingEvaluatePage'
import JobProfilePage from '@/modules/recruiting/job-profile/JobProfilePage'
import MatchPage from '@/modules/recruiting/match/MatchPage'
import MetodoPage from '@/modules/recruiting/metodo/MetodoPage'
import PaginaAPage from '@/modules/recruiting/pagina-a/PaginaAPage'
import PipelinePage from '@/modules/recruiting/pipeline/PipelinePage'
import ProfileHubPage from '@/modules/recruiting/profile-hub/ProfileHubPage'
import RankingPage from '@/modules/recruiting/ranking/RankingPage'

function App() {
  return (
    <BrowserRouter>
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
          <Route path="company" element={<AssessmentCompanyPage />} />
          <Route path="anagrafica" element={<AssessmentAnagraficaPage />} />
          <Route path="analisi" element={<AssessmentAnalisiPage />} />
          <Route path="soft" element={<AssessmentSoftPage />} />
          <Route path="hard" element={<AssessmentHardPage />} />
          <Route path="valore" element={<AssessmentValorePage />} />
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
    </BrowserRouter>
  )
}

export default App
