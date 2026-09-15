// Shapes mirror the legacy globals exactly (see modules/recruiting.html) —
// not redesigned, just typed.

export type Candidate = {
  id: string
  name: string
  src?: string
  role?: string
  job?: string
  icv: number
  scores: Record<string, number>
  bf: Record<string, number>
  /** Legacy/import records have no field at all and count as completed
   *  (see ranking()/pendingCandidates() — checked as `!== false` / `=== false`). */
  testCompleted?: boolean
  email?: string
  /** Phase 14 (Partita Interna) — only ever present on the synthetic
   *  "internal talent" records getInternalTalents() derives from the first
   *  5 real candidates (modules/recruiting.html ~4890, `window.INTERNAL_TALENTS`).
   *  Never true on a real CANDIDATES record. */
  isInternalTalent?: boolean
  /** Phase 14 (Ask's local archive/prescreening search) — read-only fields
   *  _psLocalArchiveRecords()/_psEvaluate()/_psContact() consult (modules/
   *  recruiting.html ~5204-5283). Optional: no current write path in this
   *  migration populates them; absent on every seed/demo record, exactly
   *  like legacy's own `||` fallbacks treat them as unknown, not an error.
   *  On a CANDIDATES record specifically, legacy derives the normalized
   *  `profile` (education/experienceYears/nativeLanguages) from this raw
   *  `cvData` inline every time (line ~5223) rather than storing `profile`
   *  directly — reproduced the same way in lib/ask.ts. */
  phone?: string
  consent?: 'explicit' | 'implicit' | 'declined' | 'unknown'
  cvData?: { education?: string; experienceYears?: number; nativeLanguages?: string[] }
  file?: { originalName?: string }
  source?: string
  /** Phase 16 (CV & Esportazione) — set only via the cross-sync inside
   *  addCandidateToActiveOpening() (modules/recruiting.html ~1771-1774),
   *  which patches these two fields onto the CANDIDATES record matching a
   *  just-created pool entry's id, so the source tag follows the candidate
   *  into ranking/compare/profile views. Absent on every pre-existing
   *  candidate. */
  sourceTag?: 'ARCHIVE' | 'NEW_APPLICANT'
  campaignId?: string
  /** Phase 16 — set only by runPipeline() when a real file was attached to
   *  the upload (modules/recruiting.html ~3191-3195). `fileUrl` is a
   *  session-only `URL.createObjectURL()` reference — it does not survive a
   *  reload and no durable/backend file storage exists; never invent a
   *  permanent replacement for it. */
  fileName?: string
  fileUrl?: string
  /** Phase 31 §4/§15 — set only on a candidate created through the new
   *  backend-backed CV upload flow (lib/backend-sync.ts). Its presence is
   *  what every backend-backed action (send-test, shortlist, evaluators,
   *  candidate profile) checks before calling the API — a candidate with
   *  none of these fields predates this phase (legacy/local-only demo data)
   *  and those actions fall back to the pre-existing local-only behavior
   *  instead of guessing a backend identity for it. Never invented/backfilled
   *  for pre-existing records — see MIGRATION.md for the deliberate,
   *  separate one-time cutover path for those. */
  backendCandidateId?: string
  backendCampaignId?: string
  backendCampaignCandidateId?: string
  backendCvId?: string
}

export type SoftSkillLevel = 1 | 2 | 3

export type RoleProfile = {
  flags: Record<string, SoftSkillLevel>
  bf: Record<string, number>
  bench: {
    name: string
    role: string
    apex: number
    scores: Record<string, number>
  }
}

export type Interview = {
  id: string
  candidateId?: string
  name?: string
  scheduledAt: string
  completed: boolean
  scorecard?: { overall: number | null; notes: string }
}

// Ported from addPrescreenedEntry() (modules/recruiting.html ~2183-2216) —
// every field it writes onto a new record, unchanged.
//
// Status values (Phase 8 investigation — the complete, verified set, found
// via addPrescreenedEntry()'s default ('da_inviare'/'inviato') and every
// setPrescreenStatus() call site, modules/recruiting.html lines 2047-2048):
//   'da_inviare' — default, set by addPrescreenedEntry() when auto=false.
//   'inviato'    — set by addPrescreenedEntry() when auto=true, or by
//                  setPrescreenStatus(id,'inviato') (the "Segna inviato"
//                  button). No side effects beyond this field.
//   'completato' — set only via setPrescreenStatus(id,'completato') (the
//                  "Segna completato" button). NOT a pure status write: it
//                  also cascades into completeCandidateTest(candidateId),
//                  which fabricates demo soft-skill scores/Big Five and
//                  flips testCompleted on the CANDIDATES record — a second,
//                  separate localStorage key. See lib/pipeline.ts
//                  setPrescreenStatus() for why this transition is NOT
//                  implemented in Phase 8.
// Phase 31 §8 — 'ha_risposto'/'non_ha_risposto' are ADDITIVE: the backend's
// real ShortlistStatus enum (prisma/schema.prisma) has all 4 states
// (DA_INVIARE/INVIATO/HA_RISPOSTO/NON_HA_RISPOSTO), confirmed by reading the
// schema directly this phase — the Phase 8 investigation above only found 3
// because the REACT PORT of that point in the migration hadn't reached the
// other two yet, not because they don't exist. Both new values are
// reachable ONLY by reconciling with real backend data (lib/backend-sync.ts
// refreshShortlistStatuses()) — nothing in this codebase sets either one
// locally/optimistically, since 'ha_risposto' requires a real test-provider
// webhook (§10, no real provider wired) and 'non_ha_risposto' requires
// OD-8's still-unresolved day-count. A record with no backendShortlistId
// (below) can never reach either value.
export type PrescreenStatus = 'da_inviare' | 'inviato' | 'completato' | 'ha_risposto' | 'non_ha_risposto'

export type PrescreenedEntry = {
  id: string
  candidateId: string
  name?: string
  email?: string
  testLink: string
  status: PrescreenStatus
  autoSent: boolean
  matchScore: number | null
  addedAt: string
  /** Phase 31 §8/§9 — present only when this entry was created (or later
   *  reconciled) via the real backend Shortlist. Its presence is the signal
   *  every backend-backed shortlist action checks — see backend-sync.ts. */
  backendShortlistId?: string
}

// Ported from addTestResult() (modules/recruiting.html ~2378-2394) — one
// result per candidateId (re-adding replaces the previous one, "latest
// wins"), score clamped 0-100 by the writer, not here.
export type TestResult = {
  id: string
  candidateId: string
  name?: string
  score: number
  note?: string
  addedAt: string
}

// Ported from confirmPipelineWinner() (modules/recruiting.html ~2441-2453).
export type PipelineWinner = {
  candidateId: string
  name: string
  decidedAt: string
}

export type Pipeline = {
  prescreened: PrescreenedEntry[]
  testResults: TestResult[]
  interviews: Interview[]
  winner: PipelineWinner | null
}

// Ported from buildDefaultJobProfile() (modules/recruiting.html ~1643-1656)
// — only the fields the Pipeline detail header actually reads (jp.criteria).
// A real stored jobProfile (written by the legacy/Phase-6 CV routing flow,
// not yet ported) may carry more, hence everything optional here.
export type JobProfile = {
  id?: string
  title?: string
  criteria?: {
    skills?: string[]
    experienceYears?: number
    education?: string
    certifications?: string[]
  }
  weighting?: Record<string, number>
}

// Ported from addCandidateToActiveOpening() (modules/recruiting.html
// ~1756-1776) — only the fields addPrescreenedFromPool() actually reads
// (opening.candidatePool.find(...).id/name/email). Real records also carry
// createdAt/companyId/openingId/sourceTag/campaignId (and whatever the CV
// upload flow spread in — cvData/match/source), not modeled here since
// nothing in this migration reads them yet.
export type CandidatePoolEntry = {
  id: string
  name?: string
  email?: string
  /** Phase 14 (Ask's local archive/prescreening search) — read-only fields
   *  _psLocalArchiveRecords() also merges in from a pool record when
   *  present (modules/recruiting.html ~5230-5251), same optionality
   *  reasoning as the matching fields on Candidate above. Unlike a plain
   *  Candidate, a pool record may carry an already-normalized `profile`
   *  directly (`r.profile`) — legacy only falls back to deriving one from
   *  `r.cvData` when neither `r.profile` nor the merged base's is present. */
  role?: string
  job?: string
  src?: string
  phone?: string
  icv?: number | null
  consent?: 'explicit' | 'implicit' | 'declined' | 'unknown'
  profile?: { education?: string | null; experienceYears?: number | null; nativeLanguages?: string[] }
  cvData?: { education?: string; experienceYears?: number; nativeLanguages?: string[] }
  file?: { originalName?: string }
  source?: string
  sourceTag?: 'ARCHIVE' | 'NEW_APPLICANT'
  campaignId?: string
  /** Phase 16 (CV & Esportazione) — the remaining fields
   *  addCandidateToActiveOpening() actually writes onto every real pool
   *  record (modules/recruiting.html ~1760-1768), not modeled until now
   *  since nothing read them yet. */
  createdAt?: string
  companyId?: string
  openingId?: string
  match?: {
    scorePercent: number
    breakdown?: Record<string, number>
    matchedSkills?: string[]
    candidateSignals?: { skills?: string[]; experienceYears?: number; education?: string; certifications?: string[] }
    profileId?: string | null
    profileName?: string
  }
}

export type JobOpening = {
  id: string
  title: string
  active?: boolean
  jobProfile?: JobProfile
  candidatePool?: CandidatePoolEntry[]
  pipeline?: Pipeline
}

export type Company = {
  id: string
  name: string
  jobOpenings: JobOpening[]
}

export type CvMatchingState = {
  companies: Company[]
  activeContext: { companyId: string; openingId: string }
}

// Ported from persistSurveyLinkState()/loadSurveyLinkState() (modules/
// recruiting.html ~2704-2718) — `surveyLink` is a top-level "current" value
// legacy keeps in sync with `surveyLinks[currentRole]` on every write
// (setSurveyLink() always sets both together), and `surveyLinks` is the
// durable per-role map. Kept as two fields for storage-shape fidelity, even
// though with a single fixed role (no role-switcher in this migration) the
// two are always equivalent in practice — see lib/profile-hub.ts.
export type SurveyState = {
  surveyLink: string
  surveyLinks: Record<string, string>
}
