import rolesSeed from '@/modules/recruiting/data/roles-seed.json'
import type { RoleProfile, SoftSkillLevel } from '@/modules/recruiting/lib/types'

// Ported verbatim from modules/recruiting.html (lines ~1380-1449). Not
// redesigned — this is the same weighting table, dimension list and role
// profile data the legacy Recruiting module uses everywhere (Profilo,
// Ranking, Pipeline, Home).
export const BF = ['Estroversione', 'Coscienziosità', 'Apertura', 'Amicalità', 'Stabilità emotiva'] as const

export const W: Record<SoftSkillLevel, { w: number; t: number; label: string }> = {
  1: { w: 1, t: 18, label: 'Utile' },
  2: { w: 2, t: 21, label: 'Importante' },
  3: { w: 3, t: 24, label: 'Essenziale' },
}

export const ROLES: Record<string, RoleProfile> = rolesSeed as Record<string, RoleProfile>

// Boot-time default in the legacy app (modules/recruiting.html:1514-1515).
// `flags` is initialized from ROLES[currentRole].flags BEFORE the persisted
// ROLE_SOFTSKILL_MEMORY override is even loaded (that happens a few lines
// later, at line 1523) — so on a fresh load the Home dashboard's ranking
// always uses this raw default, never a memorized per-role customization.
// Role switching lives on the Profilo screen, out of scope for the Home-only
// migration, so this constant intentionally does not read that memory key.
export const DEFAULT_ROLE = 'Sales Account Manager'
export const DEFAULT_FLAGS: Record<string, SoftSkillLevel> = { ...ROLES[DEFAULT_ROLE].flags }

// Ported verbatim from modules/recruiting.html (line ~1381) — sub-trait
// labels shown next to each Big Five dimension on Ranking.
export const BF_SUB: Record<string, string[]> = {
  Estroversione: ['Socievolezza', 'Assertività', 'Energia'],
  Coscienziosità: ['Ordine', 'Autodisciplina', 'Orient. al risultato'],
  Apertura: ['Curiosità', 'Creatività', 'Flessibilità'],
  Amicalità: ['Cooperazione', 'Fiducia', 'Empatia'],
  'Stabilità emotiva': ['Gestione stress', 'Controllo impulsi', 'Sicurezza di sé'],
}

// Ported from modules/recruiting.html's CONFIG.testDispatch.matchThreshold
// default (line ~1159). Same category as DEFAULT_ROLE above: this value is
// only ever changed through the Admin panel's "Esporta file" flow, which
// regenerates the whole legacy HTML file — it is never read from
// localStorage — so on a fresh load (same boot state this whole app
// mirrors) it is always this hardcoded 70.
export const DEFAULT_MATCH_THRESHOLD = 70

// Ported verbatim from modules/recruiting.html line 1376 — the full static
// list of all 35 APEX soft skills, independent of any role's flags (unlike
// DEFAULT_FLAGS above, which is only the SUBSET the default role flags).
// Phase 14 (Ask) needs the complete list for its free-text "skill: X"
// lookup branch (_composeAnswer, modules/recruiting.html ~5144-5150), which
// searches across all 35, not just the currently-flagged ones.
// Ported verbatim from modules/recruiting.html line 1377 — the same 35
// skills as SKILLS above, grouped into the 5 labeled columns the legacy
// soft-skill picker (renderSkillsInto(), "Le 35 soft skill APEX 5D" modal)
// renders them in. Phase 20 (Profilo della ricerca hub) needs this grouping
// for its read-only soft-skill display; nothing before it did.
export const SKILL_MATRIX: { label: string; full: string; items: string[] }[] = [
  {
    label: 'Personali',
    full: 'COMPETENZE PERSONALI',
    items: [
      'Altruismo sul lavoro',
      'Autocontrollo',
      'Autonomia',
      'Fiducia in se stessi',
      'Flessibilità/Adattabilità',
      'Dedizione al lavoro',
      'Innovazione',
      'Intelligenza emotiva',
      'Motivazione ed efficacia personale',
      'Persistenza',
      'Precisione e disciplina',
      'Resistenza allo stress',
      'Formazione sulla sensibilità',
    ],
  },
  {
    label: 'Realizzative',
    full: 'COMPETENZE REALIZZATIVE',
    items: ['Attenzione ai dettagli', 'Conseguimento degli obiettivi', 'Controllare', 'Gestione delle informazioni', 'Risultati/impegno', 'Spirito di iniziativa'],
  },
  {
    label: 'Sociali',
    full: 'COMPETENZE SOCIALI',
    items: ['Cooperazione', 'Esperienza del cliente', 'Orientamento al cliente', 'Orientamento sociale', 'Sensibilità verso le relazioni'],
  },
  {
    label: 'Di Influenza',
    full: 'COMPETENZE DI INFLUENZA',
    items: ['Comunicazione', 'Influenza e persuasione', 'Leadership'],
  },
  {
    label: 'Manageriali',
    full: 'COMPETENZE MANAGERIALI',
    items: ['Il processo decisionale', 'Delegazione', 'Direzione', 'Pensiero analitico', 'Pianificazione e organizzazione', 'Risoluzione dei problemi', 'Strategia', 'Lavoro di squadra'],
  },
]

// Ported verbatim from modules/recruiting.html line 1378 — the extra
// "Sottofattori" informational column the skill-matrix modal renders
// alongside the 5 skill-group columns above. Independent of BF_SUB (which
// is Ranking's per-Big-Five-dimension breakdown) — this is a flat list with
// no per-skill mapping, shown as-is.
export const SUBFACTORS = [
  'Fiducia',
  'Empatia',
  'Emozionalità',
  'Riservatezza',
  'Calma',
  'Interessi artistici',
  'Cooperazione',
  'Immaginazione',
  'Forza interiore',
  'Freddezza',
  'Intellettualità',
  'Stabilità',
  'Ottimismo',
  'Altruismo',
  'Integrità',
  'Cordialità',
  'Senso del dovere',
  'Rendimento',
  'Liberalismo',
  'Motivazione al successo',
  'Fiducia in se stessi',
  'Autodisciplina',
  'Audacia',
  'Metodicità',
  'Ricerca di stimoli',
  'Prudenza',
  'Assertività',
  'Socievolezza',
  'Controllo',
  'Attività',
] as const

export const SKILLS = [
  'Altruismo sul lavoro',
  'Autocontrollo',
  'Autonomia',
  'Fiducia in se stessi',
  'Flessibilità/Adattabilità',
  'Dedizione al lavoro',
  'Innovazione',
  'Intelligenza emotiva',
  'Motivazione ed efficacia personale',
  'Persistenza',
  'Precisione e disciplina',
  'Resistenza allo stress',
  'Formazione sulla sensibilità',
  'Attenzione ai dettagli',
  'Conseguimento degli obiettivi',
  'Controllare',
  'Gestione delle informazioni',
  'Risultati/impegno',
  'Spirito di iniziativa',
  'Cooperazione',
  'Esperienza del cliente',
  'Orientamento al cliente',
  'Orientamento sociale',
  'Sensibilità verso le relazioni',
  'Comunicazione',
  'Influenza e persuasione',
  'Leadership',
  'Il processo decisionale',
  'Delegazione',
  'Direzione',
  'Pensiero analitico',
  'Pianificazione e organizzazione',
  'Risoluzione dei problemi',
  'Strategia',
  'Lavoro di squadra',
] as const
