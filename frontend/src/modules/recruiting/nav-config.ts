import {
  ArrowLeftRight,
  ClipboardCheck,
  FileBarChart,
  FileText,
  IdCard,
  LayoutDashboard,
  type LucideIcon,
  Mail,
  Sigma,
  Sparkles,
  Trophy,
  Workflow,
} from 'lucide-react'

// Ported 1:1 from the legacy Recruiting module's own nav (#side in
// modules/recruiting.html, lines ~160-169) — same screen keys, same
// labels (kept in Italian, unchanged — see task section 2: don't change
// labels without a reason). Only the icon technology changed, from Google
// Material Symbols glyphs to lucide-react (same reasoning as the Phase 3
// AppShell Sidebar/Topbar: one icon system across the new React code).
//
// PHASE 22 — every item now carries a real React route (the last two,
// 'profilo' and its own "Protocollo di Intervista" sub-feature, landed in
// Phases 20-21). `to` is therefore required, not optional: the whole
// Recruiting nav is React now, and RecruitingNav.tsx no longer needs (or
// renders) a legacy-bridge fallback branch. Individual SUB-features inside
// a screen can still be genuinely deferred (CV bulk import, JD role
// switching, etc.) — those bridge locally via LegacyBridgeButton where they
// live, which is unrelated to this top-level nav.
// NOTE: the old LEGACY_RECRUITING_URL ('/modules/recruiting.html') bridge
// target is gone — that page was removed from the repo entirely, so nothing
// in the React app navigates to it anymore (LegacyBridgeButton is a real
// disabled control now; the top-level nav below has had real React routes
// since Phase 22).
export type RecruitingNavItem = {
  screen: string
  label: string
  icon: LucideIcon
  to: string
  /** Exact-match routing (only the Home index route needs this). */
  end?: boolean
  /** Phase 33 §2/§3/§7 — omitted = visible to everyone (every pre-existing
   *  item). Present only on the two new admin screens, which the backend
   *  itself restricts (CIP: PLATFORM_ADMIN only; email config's write half:
   *  COMPANY_ADMIN/PLATFORM_ADMIN) — this is a convenience so a recruiter
   *  never sees a nav entry that only 403s for them, NOT the real
   *  authorization boundary, which stays entirely server-side (see
   *  admin/CipAdminPage.tsx / EmailConfigAdminPage.tsx's own role checks
   *  and every backend route's requireRole()). */
  roles?: string[]
}

// Client-requested reorder/rename (10-item index) — same screens/routes as
// before, just a new order and new Italian labels. `screen` keys are kept
// stable (they're referenced elsewhere, e.g. page-local logic keyed off the
// active nav item) even where the label changed; only 'jd' picked up a
// clearer id-adjacent comment since its label change is the least obvious
// mapping (Profilo di Lavoro -> Profilo Candidatura).
export const RECRUITING_NAV_ITEMS: RecruitingNavItem[] = [
  { screen: 'home', label: 'Inizia', icon: LayoutDashboard, to: '/recruiting', end: true },
  { screen: 'profilo', label: 'Menu', icon: FileBarChart, to: '/recruiting/profile' },
  { screen: 'jd', label: 'Profilo Candidatura', icon: FileText, to: '/recruiting/job-profile' },
  { screen: 'cv', label: 'CV & Esportazione', icon: FileText, to: '/recruiting/cv' },
  { screen: 'pipeline', label: 'CV Elaborati', icon: Workflow, to: '/recruiting/pipeline' },
  { screen: 'paginaA', label: 'Migliori Candidati', icon: ClipboardCheck, to: '/recruiting/pagina-a' },
  { screen: 'ranking', label: 'Risultati', icon: Trophy, to: '/recruiting/ranking' },
  { screen: 'match', label: 'Partita interna', icon: ArrowLeftRight, to: '/recruiting/match' },
  { screen: 'formule', label: 'Metodo', icon: Sigma, to: '/recruiting/metodo' },
  { screen: 'ai', label: 'Ask', icon: Sparkles, to: '/recruiting/ask' },
  { screen: 'cipAdmin', label: 'CIP', icon: IdCard, to: '/recruiting/admin/cip', roles: ['PLATFORM_ADMIN'] },
  { screen: 'emailAdmin', label: 'Email', icon: Mail, to: '/recruiting/admin/email', roles: ['PLATFORM_ADMIN', 'COMPANY_ADMIN'] },
]
