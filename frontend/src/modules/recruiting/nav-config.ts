import {
  ArrowLeftRight,
  CalendarDays,
  ClipboardCheck,
  FileBarChart,
  FileBarChart2,
  FileCheck2,
  Files,
  FileText,
  Filter,
  IdCard,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
  Mail,
  Medal,
  Mic,
  NotebookPen,
  ScanSearch,
  Sigma,
  Sparkles,
  Trophy,
  Upload,
  Users,
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

// Indice a quattro livelli (documento del cliente "Recruiting Module",
// 2026-10-23): in testa "Profilo della ricerca", poi i quattro livelli del
// percorso, poi gli strumenti. Le voci che erano sezioni di una pagina
// (preselezionati, classifica dopo il test, colloqui, podio, le tre schede
// dei valutatori) hanno ora un indirizzo loro. "Posizioni aperte" è tolta.
// `screen` resta stabile dove la voce esisteva già.
export type RecruitingNavGroup = {
  /** Assente per il blocco in testa. */
  label?: string
  items: RecruitingNavItem[]
}

export const RECRUITING_NAV_GROUPS: RecruitingNavGroup[] = [
  {
    items: [
      // Era "Menu": la voce prende il nome della sua destinazione (CLAUDE.md, Fase 6).
      { screen: 'profilo', label: 'Profilo della ricerca', icon: FileBarChart, to: '/recruiting/profile' },
    ],
  },
  {
    label: 'Chi cerchiamo · Livello 1',
    items: [
      { screen: 'jd', label: 'Profilo Candidato', icon: FileText, to: '/recruiting/job-profile' },
      { screen: 'cv', label: 'CV & Esportazione', icon: Upload, to: '/recruiting/cv' },
      { screen: 'cvElaborati', label: 'CV Elaborati', icon: Files, to: '/recruiting/cv-elaborati' },
      { screen: 'pipeline', label: 'Avanzamento della selezione', icon: Workflow, to: '/recruiting/pipeline' },
      { screen: 'preselezionati', label: 'CV preselezionati', icon: ListChecks, to: '/recruiting/preselezionati' },
      { screen: 'classificaTest', label: 'Classifica dopo il test', icon: FileCheck2, to: '/recruiting/classifica-test' },
    ],
  },
  {
    label: 'Chi è più adatto · Livello 2',
    items: [
      { screen: 'ranking', label: 'Risultati', icon: Trophy, to: '/recruiting/ranking' },
      { screen: 'match', label: 'Confronto interno', icon: ArrowLeftRight, to: '/recruiting/match' },
      { screen: 'home', label: "Stato dell'arte", icon: LayoutDashboard, to: '/recruiting/stato-dell-arte' },
      { screen: 'imbuto', label: 'Imbuto di selezione', icon: Filter, to: '/recruiting/imbuto' },
    ],
  },
  {
    label: 'Chi scegliamo · Livello 3',
    items: [
      { screen: 'paginaA', label: 'Migliori candidati', icon: ClipboardCheck, to: '/recruiting/pagina-a' },
      { screen: 'fasce', label: 'Candidati per fascia di idoneità', icon: Users, to: '/recruiting/fasce-idoneita' },
      { screen: 'imbutoScelta', label: 'Imbuto di selezione', icon: Filter, to: '/recruiting/imbuto-scelta' },
    ],
  },
  {
    label: 'Area valutatori · Livello 4',
    items: [
      { screen: 'colloqui', label: 'Prossimi colloqui', icon: CalendarDays, to: '/recruiting/colloqui' },
      { screen: 'podio', label: 'Candidati al podio', icon: Medal, to: '/recruiting/podio' },
      { screen: 'ivNotes', label: 'Intervista strutturata', icon: Mic, to: '/recruiting/valutatori/intervista' },
      { screen: 'ivEval', label: 'Valutazione candidato', icon: NotebookPen, to: '/recruiting/valutatori/valutazione' },
      { screen: 'ivReport', label: 'Report finale di valutazione', icon: FileBarChart2, to: '/recruiting/valutatori/report' },
    ],
  },
  {
    label: 'Strumenti',
    items: [
      { screen: 'formule', label: 'Metodo', icon: Sigma, to: '/recruiting/metodo' },
      { screen: 'ai', label: 'Assistente IA', icon: Sparkles, to: '/recruiting/ask' },
      { screen: 'cipAdmin', label: 'CIP', icon: IdCard, to: '/recruiting/admin/cip', roles: ['PLATFORM_ADMIN'] },
      { screen: 'emailAdmin', label: 'Email', icon: Mail, to: '/recruiting/admin/email', roles: ['PLATFORM_ADMIN', 'COMPANY_ADMIN'] },
      { screen: 'originalSkills', label: 'Comitato scientifico', icon: ScanSearch, to: '/recruiting/admin/comitato-scientifico', roles: ['PLATFORM_ADMIN'] },
    ],
  },
]
