import {
  ArrowLeftRight,
  CalendarDays,
  FileBarChart,
  FileBarChart2,
  Files,
  Brain,
  FileText,
  Filter,
  CircleCheck,
  RotateCcw,
  Scale,
  Search,
  Home,
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
  Send,
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
  /** Nascosta a chi ha il ruolo di valutatore (EVALUATOR), anche dentro l'Area valutatori. */
  staffOnly?: boolean
  /** Solo per l'account demo (lib/demo-mode.ts). */
  demoOnly?: boolean
}

// Menu di Recruiting (CLAUDE.md, Fase 6, Decisioni del 2026-11-06, che sostituiscono il menu
// del 2026-10-23: il livello 4 entra in «Chi scegliamo?», Imbuto una volta sola; «Classifica
// dopo il test» esce dal menu e la sua rotta resta, DECISIONI). Panoramica seconda voce. In testa il Profilo della ricerca, pagina d'ingresso di
// /recruiting, poi la Panoramica. Ogni livello ha una pagina principale
// (`main`), prima voce del livello, e sotto le sottopagine, che si raggiungono
// solo dal menu. Il titolo del livello apre la pagina dei risultati (`results`).
//
// «Ranking» è /pagina-a (chi non ha ancora fatto il test, per match CV); «Migliori candidati» è
// /ranking (la classifica dopo il test). "Posizioni aperte" non è una voce (la rotta e il codice
// restano, DECISIONI).
//
// Un valutatore vede solo «Chi scegliamo?» e, dentro, solo le tre schede (`staffOnly` sulle
// altre; niente pagina dei risultati): come prima, il menu non gli mostra elenchi di candidati
// che prima non vedeva.
// `screen` resta stabile dove la voce esisteva già.
export type RecruitingNavGroup = {
  /** Assente per il blocco in testa. */
  label?: string
  /** Con l'icona il titolo è una voce del menu, con sotto le sue pagine (i tre livelli). Senza, un'etichetta. */
  icon?: LucideIcon
  /** La pagina principale del livello: la prima voce. */
  main?: RecruitingNavItem
  /** La pagina dei risultati del livello: ci porta il titolo, come la card del Profilo della ricerca (CLAUDE.md, Fase 6, 2026-11-02). */
  results?: string
  /** `evaluator`: la sola sezione che vede chi ha il ruolo di valutatore. */
  audience?: 'evaluator'
  items: RecruitingNavItem[]
}

/**
 * La riga del percorso di una pagina di Recruiting, dal menu: "Profilo della
 * ricerca / Chi cerchiamo / CV elaborati". Il livello porta alla sua pagina
 * principale (o alla prima voce, per le sezioni che non ne hanno). `null` per
 * il Profilo della ricerca stesso e per le pagine che non sono nel menu (le
 * pagine dei risultati hanno la loro riga). Con due voci sulla stessa pagina
 * (l'Imbuto) vale la prima, come nel menu.
 */
export function recruitingTrail(pathname: string): { items: { label: string; to: string }[]; current: string } | null {
  const root = { label: 'Profilo della ricerca', to: '/recruiting/profile' }
  for (const g of RECRUITING_NAV_GROUPS) {
    const items = [...(g.main ? [g.main] : []), ...g.items]
    const hit = items.find((i) => pathname === i.to || pathname.startsWith(`${i.to}/`))
    if (!hit) continue
    if (hit.to === root.to) return null
    if (!g.label) return { items: [root], current: hit.label }
    const level = { label: g.label.split(' · ')[0].replace(/\?$/, ''), to: g.results ?? (g.main ?? items[0]).to }
    return { items: [root, level], current: hit.label }
  }
  return null
}

export const RECRUITING_NAV_GROUPS: RecruitingNavGroup[] = [
  {
    items: [
      // Era "Menu": la voce prende il nome della sua destinazione (CLAUDE.md, Fase 6).
      { screen: 'profilo', label: 'Profilo della ricerca', icon: FileBarChart, to: '/recruiting/profile' },
      { screen: 'panoramica', label: 'Panoramica', icon: Home, to: '/recruiting/panoramica' },
    ],
  },
  {
    label: 'Chi cerchiamo?',
    icon: Search,
    results: '/recruiting/chi-cerchiamo',
    main: { screen: 'jd', label: 'Profilo candidato', icon: FileText, to: '/recruiting/job-profile' },
    items: [
      { screen: 'softSkills', label: 'Competenze trasversali', icon: Brain, to: '/recruiting/competenze-trasversali' },
      { screen: 'cv', label: 'CV & Esportazione', icon: Upload, to: '/recruiting/cv' },
      { screen: 'cvElaborati', label: 'CV elaborati', icon: Files, to: '/recruiting/cv-elaborati' },
      { screen: 'pipeline', label: 'Avanzamento della selezione', icon: Workflow, to: '/recruiting/pipeline' },
      { screen: 'preselezionati', label: 'CV preselezionati', icon: ListChecks, to: '/recruiting/preselezionati' },
    ],
  },
  {
    label: 'Chi è più adatto?',
    icon: Scale,
    results: '/recruiting/chi-e-piu-adatto',
    main: { screen: 'paginaA', label: 'Ranking', icon: Send, to: '/recruiting/pagina-a' },
    items: [
      { screen: 'ranking', label: 'Migliori candidati', icon: Trophy, to: '/recruiting/ranking' },
      { screen: 'match', label: 'Confronto interno', icon: ArrowLeftRight, to: '/recruiting/match' },
      { screen: 'statoArte', label: "Stato dell'arte", icon: LayoutDashboard, to: '/recruiting/stato-dell-arte' },
      { screen: 'imbuto', label: 'Imbuto di selezione', icon: Filter, to: '/recruiting/imbuto-scelta' },
    ],
  },
  {
    label: 'Chi scegliamo?',
    icon: CircleCheck,
    results: '/recruiting/chi-scegliamo',
    audience: 'evaluator',
    items: [
      { screen: 'colloqui', label: 'Prossimi colloqui', icon: CalendarDays, to: '/recruiting/colloqui', staffOnly: true },
      { screen: 'podio', label: 'Candidati al podio', icon: Medal, to: '/recruiting/podio', staffOnly: true },
      { screen: 'ivNotes', label: 'Intervista strutturata', icon: Mic, to: '/recruiting/valutatori/intervista' },
      { screen: 'ivEval', label: 'Valutazione candidato', icon: NotebookPen, to: '/recruiting/valutatori/valutazione' },
      { screen: 'ivReport', label: 'Report finale di valutazione', icon: FileBarChart2, to: '/recruiting/valutatori/report' },
      { screen: 'fasce', label: 'Candidati per fascia di idoneità', icon: Users, to: '/recruiting/fasce-idoneita', staffOnly: true },
    ],
  },
  {
    label: 'Strumenti',
    items: [
      { screen: 'formule', label: 'Metodo', icon: Sigma, to: '/recruiting/metodo' },
      { screen: 'ai', label: 'Assistente IA', icon: Sparkles, to: '/recruiting/ask' },
    ],
  },
  {
    label: 'Amministrazione',
    items: [
      { screen: 'cipAdmin', label: 'CIP', icon: IdCard, to: '/recruiting/admin/cip', roles: ['PLATFORM_ADMIN'] },
      { screen: 'emailAdmin', label: 'Email', icon: Mail, to: '/recruiting/admin/email', roles: ['PLATFORM_ADMIN', 'COMPANY_ADMIN'] },
      { screen: 'originalSkills', label: 'Comitato scientifico', icon: ScanSearch, to: '/recruiting/admin/comitato-scientifico', roles: ['PLATFORM_ADMIN'] },
      { screen: 'demoAdmin', label: 'Dati dimostrativi', icon: RotateCcw, to: '/recruiting/admin/dati-dimostrativi', demoOnly: true },
    ],
  },
]
