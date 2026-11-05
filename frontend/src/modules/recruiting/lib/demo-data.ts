import { getBackendUser } from '@/lib/api/client'
import { isOnDemoCompany } from '@/lib/demo-mode'
import { getPreference, setPreference } from '@/lib/preferences'
import { BF, DEFAULT_FLAGS, DEFAULT_ROLE, ROLES, SKILLS, W } from '@/modules/recruiting/lib/constants'
import { readCandidates, readCvMatchingState, writeCandidates, writeCvMatchingState } from '@/modules/recruiting/lib/storage'
import type { Candidate, CandidatePoolEntry, Interview, JobOpening, PipelineWinner, PrescreenedEntry, TestResult } from '@/modules/recruiting/lib/types'

// I dati dimostrativi di Recruiting (CLAUDE.md, Fase 6, verifica del
// 2026-11-02): una posizione di Acme con candidati in tutti e cinque gli stati,
// test completati e in attesa, finalisti e un colloquio in programma. Si caricano
// da soli all'ingresso in Recruiting (`preloadRecruitingDemo`), solo in modalità
// demo e solo sulla società demo; nessun seed del backend. Aggiungono la posizione
// e i suoi candidati senza toccare il resto; ripristinarli (amministrazione
// dell'account demo) sostituisce solo quelli dimostrativi.

export const DEMO_COMPANY_ID = 'company-acme'
const DEMO_OPENING_ID = 'opening-demo-account-manager'
const DEMO_PREFIX = 'demo-'
export const DEMO_OPENING_TITLE = 'Account Manager · posizione dimostrativa'
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

export function buildRecruitingDemo(now = Date.now()): { candidates: Candidate[]; opening: JobOpening } {
  const at = (days: number) => new Date(now + days * DAY).toISOString()
  const completed = new Set<Stage>(['test-completato', 'colloquio-fissato', 'colloquio-fatto', 'assunto'])
  const idealBf = ROLES[DEFAULT_ROLE].bf

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
      ;[...new Set([...SKILLS, ...Object.keys(DEFAULT_FLAGS)])].forEach((sk, j) => {
        const level = DEFAULT_FLAGS[sk]
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

/** Mette la posizione dimostrativa in Acme e la rende attiva. Il resto dei dati resta com'è. */
export function loadRecruitingDemo(): { companyId: string; openingId: string } {
  const state = readCvMatchingState()
  const company = state.companies.find((c) => c.id === DEMO_COMPANY_ID)
  if (!company) throw new Error('La società demo non c’è in questi dati')
  const { candidates, opening } = buildRecruitingDemo()
  writeCandidates([...readCandidates().filter((c) => !c.id.startsWith(DEMO_PREFIX)), ...candidates])
  const companies = state.companies.map((c) => (c.id === DEMO_COMPANY_ID ? { ...c, jobOpenings: [...c.jobOpenings.filter((o) => o.id !== DEMO_OPENING_ID), opening] } : c))
  const activeContext = { companyId: DEMO_COMPANY_ID, openingId: DEMO_OPENING_ID }
  writeCvMatchingState({ companies, activeContext })
  return activeContext
}

/**
 * All'ingresso in Recruiting: se manca, mette la posizione dimostrativa. Fa niente
 * fuori dalla modalità demo, fuori dalla società demo e per chi non può scrivere.
 * La prima volta di ogni utente la rende attiva, se la sua posizione è vuota; poi la
 * scelta resta la sua. `true` se è cambiato qualcosa da ridisegnare.
 */
export function preloadRecruitingDemo(): boolean {
  if (!isOnDemoCompany() || !WRITE_ROLES.has(getBackendUser()?.role ?? '')) return false
  const state = readCvMatchingState()
  const company = state.companies.find((c) => c.id === DEMO_COMPANY_ID)
  if (!company) return false
  const exists = company.jobOpenings.some((o) => o.id === DEMO_OPENING_ID)
  const firstVisit = !getPreference<boolean>(DEMO_SEEN_PREF, false)
  if (exists && !firstVisit) return false

  const active = state.activeContext
  const activeOpening = active.companyId === DEMO_COMPANY_ID ? company.jobOpenings.find((o) => o.id === active.openingId) : undefined
  const activate = firstVisit && active.companyId === DEMO_COMPANY_ID && !activeOpening?.candidatePool?.length
  const activeContext = activate ? { companyId: DEMO_COMPANY_ID, openingId: DEMO_OPENING_ID } : active
  if (exists) {
    writeCvMatchingState({ companies: state.companies, activeContext })
  } else {
    const { candidates, opening } = buildRecruitingDemo()
    writeCandidates([...readCandidates().filter((c) => !c.id.startsWith(DEMO_PREFIX)), ...candidates])
    writeCvMatchingState({ companies: state.companies.map((c) => (c.id === DEMO_COMPANY_ID ? { ...c, jobOpenings: [...c.jobOpenings, opening] } : c)), activeContext })
  }
  setPreference(DEMO_SEEN_PREF, true)
  return true
}
