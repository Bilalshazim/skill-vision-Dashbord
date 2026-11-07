import { getBackendUser } from '@/lib/api/client'
import { isOnDemoCompany } from '@/lib/demo-mode'
import { getPreference, setPreference } from '@/lib/preferences'
import { BF, DEFAULT_ROLE, ROLES, SKILL_MATRIX, SKILLS, W } from '@/modules/recruiting/lib/constants'
import { hasSkillConfig, saveSkillConfig } from '@/modules/recruiting/lib/skill-flags'
import { readCandidates, readCvMatchingState, writeCandidates, writeCvMatchingState } from '@/modules/recruiting/lib/storage'
import type { SoftSkillLevel, Candidate, CandidatePoolEntry, Interview, JobOpening, PipelineWinner, PrescreenedEntry, TestResult } from '@/modules/recruiting/lib/types'

// I dati dimostrativi di Recruiting (CLAUDE.md, Fase 6, verifica del
// 2026-11-02): una posizione di Acme con candidati in tutti e cinque gli stati,
// test completati e in attesa, finalisti e un colloquio in programma. Si caricano
// da soli all'ingresso in Recruiting (`preloadRecruitingDemo`), solo in modalità
// demo e solo sulla società demo, sulla posizione «Senior Frontend Engineer» (decisione
// del 2026-11-06); nessun seed del backend. Una posizione con candidati veri non si
// tocca. Ripristinarli (amministrazione dell'account demo) sostituisce solo quelli
// dimostrativi.

export const DEMO_COMPANY_ID = 'company-acme'
const DEMO_OPENING_ID = 'opening-senior-fe'
// La posizione a parte delle prime versioni: se c'è ancora, si toglie.
const LEGACY_OPENING_ID = 'opening-demo-account-manager'
const DEMO_PREFIX = 'demo-'
export const DEMO_OPENING_TITLE = 'Senior Frontend Engineer'
const DEMO_SEEN_PREF = 'recruitingDemoSeen'
const WRITE_ROLES = new Set(['PLATFORM_ADMIN', 'COMPANY_ADMIN', 'RECRUITER'])

type Stage = 'acquisita' | 'valutazione' | 'test-da-inviare' | 'test-inviato' | 'test-completato' | 'colloquio-fissato' | 'colloquio-fatto' | 'assunto'

// `q`: quanto il candidato copre l'atteso delle competenze scelte nel profilo.
// `icv`: la corrispondenza CV / profilo, su 100. Persone inventate.
const PEOPLE: { name: string; stage: Stage; q: number; icv: number }[] = [
  { name: 'Marta Bellini', stage: 'assunto', q: 1.06, icv: 92 },
  { name: 'Davide Sartori', stage: 'colloquio-fissato', q: 1.02, icv: 88 },
  { name: 'Chiara Valenti', stage: 'colloquio-fatto', q: 0.96, icv: 84 },
  { name: 'Paolo Gentile', stage: 'test-completato', q: 0.85, icv: 79 },
  { name: 'Irene Fabbri', stage: 'test-completato', q: 0.68, icv: 71 },
  { name: 'Tommaso Riva', stage: 'test-inviato', q: 1, icv: 76 },
  { name: 'Giorgia Conti', stage: 'test-inviato', q: 1, icv: 74 },
  { name: 'Luca Ferrante', stage: 'test-da-inviare', q: 1, icv: 72 },
  { name: 'Silvia Mancuso', stage: 'valutazione', q: 1, icv: 69 },
  { name: 'Andrea Lombardo', stage: 'acquisita', q: 1, icv: 61 },
  { name: 'Elena Marchetti', stage: 'acquisita', q: 1, icv: 58 },
  { name: 'Matteo Barbieri', stage: 'acquisita', q: 1, icv: 52 },
]

const DAY = 24 * 60 * 60 * 1000
const round2 = (n: number) => Math.round(n * 100) / 100

// Il profilo dimostrativo: 6 essenziali, 4 importanti e 2 utili fra le 35 competenze, le sole che
// si possono scegliere. Parte dal profilo di partenza e completa nell'ordine dell'elenco.
function demoProfile(): Record<string, SoftSkillLevel> {
  const all = SKILL_MATRIX.flatMap((g) => g.items)
  const seed = ROLES[DEFAULT_ROLE].flags
  const flags: Record<string, SoftSkillLevel> = Object.fromEntries(Object.entries(seed).filter(([k]) => all.includes(k)))
  const free = all.filter((k) => !flags[k])
  const wanted: [SoftSkillLevel, number][] = [[3, 6], [2, 4], [1, 2]]
  for (const [level, n] of wanted) {
    while (Object.values(flags).filter((v) => v === level).length < n && free.length) flags[free.shift() as string] = level
  }
  return flags
}

export function buildRecruitingDemo(now = Date.now()): { candidates: Candidate[]; opening: Pick<JobOpening, 'id' | 'title' | 'active' | 'candidatePool' | 'pipeline'> } {
  const at = (days: number) => new Date(now + days * DAY).toISOString()
  const completed = new Set<Stage>(['test-completato', 'colloquio-fissato', 'colloquio-fatto', 'assunto'])
  const idealBf = ROLES[DEFAULT_ROLE].bf
  const demoFlags = demoProfile()

  const candidates: Candidate[] = []
  const candidatePool: CandidatePoolEntry[] = []
  const prescreened: PrescreenedEntry[] = []
  const testResults: TestResult[] = []
  const interviews: Interview[] = []
  let winner: PipelineWinner | null = null

  PEOPLE.forEach((p, i) => {
    const id = `${DEMO_PREFIX}${i + 1}`
    const email = `${p.name.toLowerCase().replace(/\s+/g, '.')}@example.com`
    const done = completed.has(p.stage)
    // Punteggi dall'atteso delle competenze scelte nel profilo: una piccola
    // variazione fissa per competenza, così due caricamenti danno gli stessi dati.
    const scores: Record<string, number> = {}
    if (done) {
      // Anche le competenze del profilo fuori dall'elenco generale (Negoziazione…):
      // senza punteggio farebbero scattare lo sbarramento dell'indice.
      ;[...new Set([...SKILLS, ...Object.keys(demoFlags)])].forEach((sk, j) => {
        const level = demoFlags[sk]
        const base = level ? W[level].t : 18
        scores[sk] = round2(Math.min(31, base * p.q * (0.96 + ((i + j) % 5) * 0.03)))
      })
    }
    const bf = Object.fromEntries(BF.map((k, j) => [k, done ? Math.round(idealBf[k] + ((i + j) % 3) * 4 - 4) : 50]))
    candidates.push({ id, name: p.name, src: 'Dati dimostrativi', role: DEFAULT_ROLE, job: DEMO_OPENING_TITLE, icv: p.icv, scores, bf, testCompleted: done, email, consent: 'explicit' })
    candidatePool.push({
      id,
      name: p.name,
      email,
      role: DEFAULT_ROLE,
      job: DEMO_OPENING_TITLE,
      src: 'Dati dimostrativi',
      icv: p.icv,
      consent: 'explicit',
      createdAt: at(-30 + i),
      companyId: DEMO_COMPANY_ID,
      openingId: DEMO_OPENING_ID,
      sourceTag: 'NEW_APPLICANT',
      campaignId: DEMO_OPENING_ID,
      match: { scorePercent: p.icv },
    })
    if (p.stage === 'acquisita') return

    const status = p.stage === 'valutazione' || p.stage === 'test-da-inviare' ? 'da_inviare' : p.stage === 'test-inviato' ? 'inviato' : 'completato'
    prescreened.push({ id: `${id}-pre`, candidateId: id, name: p.name, email, testLink: '', status, autoSent: false, matchScore: p.icv, addedAt: at(-20) })
    if (done) testResults.push({ id: `${id}-test`, candidateId: id, name: p.name, score: Math.round(Math.min(100, p.q * 80)), addedAt: at(-12) })

    if (p.stage === 'colloquio-fissato') interviews.push({ id: `${id}-iv`, candidateId: id, name: p.name, scheduledAt: at(5), completed: false })
    if (p.stage === 'colloquio-fatto' || p.stage === 'assunto') {
      interviews.push({ id: `${id}-iv`, candidateId: id, name: p.name, scheduledAt: at(-4), completed: true, scorecard: { overall: p.stage === 'assunto' ? 9 : 7, notes: 'Colloquio dimostrativo.' } })
    }
    if (p.stage === 'assunto') winner = { candidateId: id, name: p.name, decidedAt: at(-1) }
  })

  return {
    candidates,
    opening: { id: DEMO_OPENING_ID, title: DEMO_OPENING_TITLE, active: true, candidatePool, pipeline: { prescreened, testResults, interviews, winner } },
  }
}

/** Riporta la posizione dimostrativa allo stato iniziale e la rende attiva. Il resto dei dati resta com'è. */
export function loadRecruitingDemo(): { companyId: string; openingId: string } {
  const state = readCvMatchingState()
  const company = state.companies.find((c) => c.id === DEMO_COMPANY_ID)
  if (!company) throw new Error('La società demo non c’è in questi dati')
  const { candidates, opening } = buildRecruitingDemo()
  writeCandidates([...readCandidates().filter((c) => !c.id.startsWith(DEMO_PREFIX)), ...candidates])
  const companies = state.companies.map((c) => (c.id === DEMO_COMPANY_ID ? { ...c, jobOpenings: withDemoOpening(c.jobOpenings, opening) } : c))
  const activeContext = { companyId: DEMO_COMPANY_ID, openingId: DEMO_OPENING_ID }
  writeCvMatchingState({ companies, activeContext })
  saveSkillConfig(DEMO_OPENING_ID, { flags: demoProfile(), expected: {} })
  return activeContext
}

/** Le posizioni con quella dimostrativa al suo posto, i candidati veri conservati, senza la posizione a parte di prima. */
function withDemoOpening(list: JobOpening[], opening: ReturnType<typeof buildRecruitingDemo>['opening']): JobOpening[] {
  const kept = list.filter((o) => o.id !== LEGACY_OPENING_ID)
  const merge = (o?: JobOpening): JobOpening => ({ ...o, ...opening, candidatePool: [...(o?.candidatePool ?? []).filter((c) => !c.id.startsWith(DEMO_PREFIX)), ...(opening.candidatePool ?? [])] }) as JobOpening
  return kept.some((o) => o.id === DEMO_OPENING_ID) ? kept.map((o) => (o.id === DEMO_OPENING_ID ? merge(o) : o)) : [...kept, merge()]
}

/**
 * All'ingresso in Recruiting: se mancano, mette i dati dimostrativi sulla posizione
 * «Senior Frontend Engineer». Fa niente fuori dalla modalità demo, fuori dalla società
 * demo e per chi non può scrivere; se la posizione ha candidati veri, li lascia. La
 * prima volta di ogni utente la rende attiva, se la sua posizione è vuota; poi la scelta
 * resta la sua. `true` se è cambiato qualcosa da ridisegnare.
 */
export function preloadRecruitingDemo(): boolean {
  if (!isOnDemoCompany() || !WRITE_ROLES.has(getBackendUser()?.role ?? '')) return false
  const state = readCvMatchingState()
  const company = state.companies.find((c) => c.id === DEMO_COMPANY_ID)
  const target = company?.jobOpenings.find((o) => o.id === DEMO_OPENING_ID)
  if (!company || !target) return false

  const hadLegacy = company.jobOpenings.some((o) => o.id === LEGACY_OPENING_ID)
  const pool = target.candidatePool ?? []
  const hasDemo = pool.some((c) => c.id.startsWith(DEMO_PREFIX))
  const p = target.pipeline
  const hasReal = !hasDemo && (pool.length > 0 || !!(p?.prescreened.length || p?.testResults.length || p?.interviews.length))
  const needsData = !hasDemo && !hasReal

  const firstVisit = !getPreference<boolean>(DEMO_SEEN_PREF, false)
  const active = state.activeContext
  const activeOpening = active.companyId === DEMO_COMPANY_ID ? company.jobOpenings.find((o) => o.id === active.openingId) : undefined
  const activate = active.companyId === DEMO_COMPANY_ID && active.openingId !== DEMO_OPENING_ID && (active.openingId === LEGACY_OPENING_ID || (firstVisit && !activeOpening?.candidatePool?.length))
  const needsProfile = !hasReal && !hasSkillConfig(DEMO_OPENING_ID)
  if (needsProfile) saveSkillConfig(DEMO_OPENING_ID, { flags: demoProfile(), expected: {} })
  if (!needsData && !hadLegacy && !activate && !firstVisit) return needsProfile

  const others = readCandidates().filter((c) => !c.id.startsWith(DEMO_PREFIX))
  const { candidates, opening } = buildRecruitingDemo()
  if (needsData) writeCandidates([...others, ...candidates])
  else if (hadLegacy && hasReal) writeCandidates(others)
  const jobOpenings = needsData ? withDemoOpening(company.jobOpenings, opening) : company.jobOpenings.filter((o) => o.id !== LEGACY_OPENING_ID)
  writeCvMatchingState({
    companies: state.companies.map((c) => (c.id === DEMO_COMPANY_ID ? { ...c, jobOpenings } : c)),
    activeContext: activate ? { companyId: DEMO_COMPANY_ID, openingId: DEMO_OPENING_ID } : active,
  })
  setPreference(DEMO_SEEN_PREF, true)
  return true
}
