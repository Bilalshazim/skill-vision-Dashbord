import { DEFAULT_FLAGS } from '@/modules/recruiting/lib/constants'
import { readCandidates, readCvMatchingState, writeCandidates, writeCvMatchingState } from '@/modules/recruiting/lib/storage'
import type { Candidate, CandidatePoolEntry, Company, CvMatchingState, Interview, JobOpening, JobProfile, Pipeline, PipelineWinner, PrescreenedEntry, PrescreenStatus, TestResult } from '@/modules/recruiting/lib/types'

// Ported verbatim from modules/recruiting.html (ensurePipeline/pipelineStage/
// plDateFmt, lines ~1936-1957). ensurePipeline mutates the opening in place
// in the legacy code (self-healing older/partial records); kept identical
// here since Home reads (never persists) this data in Phase 4.
export function ensurePipeline(opening: JobOpening): Pipeline {
  if (!opening.pipeline || typeof opening.pipeline !== 'object') {
    opening.pipeline = { prescreened: [], testResults: [], interviews: [], winner: null }
  }
  const p = opening.pipeline
  if (!Array.isArray(p.prescreened)) p.prescreened = []
  if (!Array.isArray(p.testResults)) p.testResults = []
  if (!Array.isArray(p.interviews)) p.interviews = []
  if (p.winner === undefined) p.winner = null
  return p
}

export function plDateFmt(iso?: string): string {
  try {
    return iso ? new Date(iso).toLocaleDateString('it-IT') : '—'
  } catch {
    return '—'
  }
}

// Ported verbatim from getActiveContext() (modules/recruiting.html
// ~1739-1744) — read-only: resolves the currently-selected company/opening,
// falling back to the first of each if activeContext points at nothing (or
// nothing was ever selected). Used by the Phase 6 CV Match dialog to check
// whether a candidate is already prescreened for the active opening.
export function getActiveOpening(state: CvMatchingState): { company?: Company; opening?: JobOpening } {
  const company = state.companies.find((c) => c.id === state.activeContext?.companyId) || state.companies[0]
  const opening = company?.jobOpenings?.find((o) => o.id === state.activeContext?.openingId) || company?.jobOpenings?.[0]
  return { company, opening }
}

// PHASE 16 WRITE CONTRACT — ported verbatim from setActiveContext()
// (modules/recruiting.html ~1746-1754), the function behind CV & Export's
// company/opening <select> onchange handlers (handleCvContextChange()).
// React becomes the real owner of activeContext here — this is the ONLY
// place in the whole migration that changes it (every other consumer —
// CvMatchDialog, Pagina A, Pipeline's own fallback — only reads it via
// getActiveOpening() above).
//
//  - Storage key: apex5d_cv_matching_state only.
//  - Resolution: same fallback cascade as getActiveOpening() — an unknown/
//    stale companyId falls back to companies[0]; an unknown/stale openingId
//    (e.g. still pointing at the PREVIOUS company's opening, exactly what
//    legacy's own two independent <select> elements produce when only the
//    company one has just changed) falls back to that company's own
//    jobOpenings[0]. This is not a special case to add — it is the exact
//    mechanism legacy relies on for "switching company resets the opening
//    to that company's first one": the caller doesn't need to special-case
//    it either, just pass whatever opening id it currently has (stale or
//    not), same as legacy's DOM read does.
//  - Always succeeds and always persists — legacy has no guard for "no
//    companies at all" (activeContext just ends up `{companyId:'',
//    openingId:''}` in that unreachable-in-practice edge case).
//  - No other localStorage key touched, no API/network call.
//
// Concurrency: fresh readCvMatchingState() on every call, same discipline
// as every other mutation in this file — never trusts a company/opening
// object captured at an earlier render.
export function setActiveContext(companyId: string, openingId: string): { company?: Company; opening?: JobOpening } {
  const state = readCvMatchingState()
  const company = state.companies.find((c) => c.id === companyId) || state.companies[0]
  const opening = company?.jobOpenings?.find((o) => o.id === openingId) || company?.jobOpenings?.[0]
  state.activeContext = { companyId: company?.id || '', openingId: opening?.id || '' }
  writeCvMatchingState(state)
  return { company, opening }
}

// Ported verbatim from plId() (modules/recruiting.html line ~1947).
function plId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export type AddPrescreenedResult =
  | { ok: true; created: true; entry: PrescreenedEntry }
  | { ok: true; created: false; entry: PrescreenedEntry } // legacy dedupe hit — existing record returned, untouched except maybe email
  | { ok: false; reason: 'no-active-opening' }
  | { ok: false; reason: 'storage-unavailable'; message: string }

// A caller-supplied target opening, used in place of activeContext — see
// PHASE 11C-1 note below.
export type PipelineTarget = { companyId: string; openingId: string }

// PHASE 7 WRITE CONTRACT — ported verbatim from addPrescreenedEntry()
// (modules/recruiting.html ~2183-2216). Legacy calls this from THREE places
// with different argument shapes:
//   - sendCvMatchTestLink() (~3073-3080): candidateId/name/email from a real
//     CANDIDATES record, auto=true, matchScore=candidate.icv — the "Invia
//     link test ora" button (CvMatchDialog.tsx, Phase 7).
//   - addPrescreenedFromPool() (~2159-2167): candidateId/name/email from an
//     opening.candidatePool record, auto/matchScore both OMITTED (undefined
//     in legacy — falsy, so status stays 'da_inviare').
//   - addPrescreenedManual() (~2168-2177): NO candidateId at all (undefined
//     in legacy), just name/email typed by the recruiter; auto/matchScore
//     also omitted.
// matchScore is optional here for exactly that reason — the pool/manual
// call sites (PHASE 11C-1, pipeline/PrescreenedList.tsx) have none to pass.
//
//  - Storage key: apex5d_cv_matching_state (via writeCvMatchingState below —
//    same key readCvMatchingState() already reads, see storage.ts).
//  - Write shape: the ENTIRE {companies, activeContext} tree, not a patch —
//    matches persistCvMatchingState()'s JSON.stringify of the whole state.
//  - Dedupe: scoped to ONE opening's pipeline.prescreened array, keyed by
//    candidateId — but ONLY when a candidateId was actually given (legacy:
//    `if(candidateId){ const existing = ...; ... }`, modules/recruiting.html
//    line 2191). PHASE 11C-1 restores this guard (previously unconditional
//    here, which happened to be harmless through Phase 7-9 since
//    CvMatchDialog always passes a real, truthy candidateId — but would
//    have been wrong the moment a falsy one reached this function, which
//    addPrescreenedManual's call now does on purpose). A hit patches
//    `email` (only if the existing record has none and a new one was
//    given) and returns the existing record untouched otherwise — no new
//    record, no status/testLink/autoSent/matchScore change. The SAME
//    candidate added under a DIFFERENT opening is NOT deduped (separate
//    array) — preserved as-is, not "fixed" into a global dedupe.
//  - New record fields: id (plId('pre')), candidateId (falls back to the
//    new record's own id when none was given — a synthetic prescreened-only
//    identity, exactly legacy's `candidateId||id`; NOT "fixed" into
//    requiring a real one), name, email, testLink (a locally-generated
//    https://dashboard.skill-vision.it/t/... URL — never actually
//    transmitted anywhere, no fetch/network call exists in this chain),
//    status ('inviato' if auto else 'da_inviare'), autoSent (=auto),
//    matchScore, addedAt (ISO now). unshift (newest first).
//  - Side effects NOT reproduced here: renderPipelineScreen() (a legacy-only
//    DOM refresh — the React caller re-renders itself after a successful
//    result) and the legacy toast() call (this function returns a result
//    instead; the caller decides how to present it — see cv/CvMatchDialog.tsx
//    and pipeline/PrescreenedList.tsx for the actual user-facing wording,
//    which deliberately does NOT claim a link was "sent", since nothing
//    here ever transmits it anywhere).
//
// Concurrency: re-reads CV_MATCHING_STATE fresh from localStorage on every
// call (never trusts a React state value captured earlier) — the legacy
// app or another tab may have changed it since this component last read it.
//
// PHASE 11C-1 — opening resolution: `target`, when given, is resolved via
// resolvePipelineOpening() (the Pipeline screen's own selected company/
// opening) instead of getActiveOpening() (activeContext). Omitted (as every
// Phase 7-9 call site still does), this is 100% unchanged — target
// defaults to undefined, so `target ? … : getActiveOpening(state)` takes
// the exact same branch it always has. This is how CvMatchDialog and
// PrescreenedList share one mutation implementation without forking it:
// each supplies the opening it means, instead of the function guessing.
export function addPrescreenedEntry(
  candidateId: string,
  name: string,
  email: string,
  auto: boolean,
  matchScore?: number,
  target?: PipelineTarget,
): AddPrescreenedResult {
  const state = readCvMatchingState()
  const { opening } = target ? resolvePipelineOpening(state, target.companyId, target.openingId) : getActiveOpening(state)
  if (!opening) return { ok: false, reason: 'no-active-opening' }

  const p = ensurePipeline(opening)

  const existing = candidateId ? p.prescreened.find((r) => r.candidateId === candidateId) : undefined
  if (existing) {
    if (email && !existing.email) existing.email = email
    try {
      writeCvMatchingState(state)
    } catch (err) {
      return { ok: false, reason: 'storage-unavailable', message: err instanceof Error ? err.message : String(err) }
    }
    return { ok: true, created: false, entry: existing }
  }

  const id = plId('pre')
  const slug =
    String(name || 'candidato')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 40) || 'candidato'
  const record: PrescreenedEntry = {
    id,
    candidateId: candidateId || id,
    name,
    email,
    testLink: `https://dashboard.skill-vision.it/t/${opening.id}/${slug}-${id.slice(-5)}`,
    status: auto ? 'inviato' : 'da_inviare',
    autoSent: Boolean(auto),
    matchScore: typeof matchScore === 'number' && Number.isFinite(matchScore) ? matchScore : null,
    addedAt: new Date().toISOString(),
  }
  p.prescreened.unshift(record)

  try {
    writeCvMatchingState(state)
  } catch (err) {
    return { ok: false, reason: 'storage-unavailable', message: err instanceof Error ? err.message : String(err) }
  }
  return { ok: true, created: true, entry: record }
}

export type SetPrescreenStatusResult =
  | { ok: true; entry: PrescreenedEntry }
  | { ok: false; reason: 'no-active-opening' }
  | { ok: false; reason: 'entry-not-found' }
  | { ok: false; reason: 'storage-unavailable'; message: string }

// PHASE 8 WRITE CONTRACT — ported from setPrescreenStatus() (modules/
// recruiting.html ~2217-2232), the function behind the Pipeline detail
// screen's "Segna inviato" / "Segna completato" buttons (~2047-2048).
//
// IMPORTANT — 'completato' is intentionally NOT implemented here. Tracing
// the full legacy function revealed it is not a pure status write:
//
//   if(status==='completato' && rec.candidateId){
//     try{completeCandidateTest(rec.candidateId);}catch(e){}
//   }
//
// completeCandidateTest() (modules/recruiting.html ~2325-2337) fabricates a
// full soft-skill score set via mkScores() — a demo-data generator seeded
// by Math.random() (non-deterministic, regenerated on every call, over ALL
// 35 skills, not just the ones flagged for the role) — plus a fixed,
// identical-for-every-candidate Big Five profile, flips
// CANDIDATES[i].testCompleted from false to true, and persists that to a
// SECOND, separate localStorage key (skillvision_candidates_data) — not
// CV_MATCHING_STATE. That is a materially different and riskier write than
// anything scoped or approved so far (it invents placeholder assessment
// data and feeds it straight into the AHI ranking scoring functions this
// migration has been careful to keep byte-verified against legacy). Per
// this phase's own STOP conditions ("important side effects not yet
// understood" / "cannot be reproduced without changing unrelated
// behavior"), implementing only the CV_MATCHING_STATE half for
// 'completato' would silently diverge from legacy (a record marked
// "completato" whose candidate never actually leaves Pagina A) — worse
// than not implementing it. See the Phase 8 report for the recommended
// next step.
//
// Only 'inviato' is reachable through this function's type — 'completato'
// is a compile-time error, not just a convention, until a future phase
// deliberately designs the CANDIDATES-side mutation.
//
// Legacy lookup note: setPrescreenStatus() resolves its opening via
// getPipelineOpening() — Pipeline-screen-local state (pipelineState.
// companyId/openingId). PHASE 11C-1 gives React that same capability: an
// optional `target` (the Pipeline page's own selected company/opening,
// resolved via resolvePipelineOpening()) takes priority when supplied.
// CvMatchDialog's call site still omits it and keeps resolving through
// getActiveOpening() (activeContext) exactly as before — that substitution
// was correct for a record created under the active opening, and nothing
// about it changes here; Pipeline's own "Segna inviato" button (Phase
// 11C-1, pipeline/PrescreenedList.tsx) is what now supplies `target`.
export function setPrescreenStatus(
  recordId: string,
  status: Extract<PrescreenStatus, 'inviato'>,
  target?: PipelineTarget,
): SetPrescreenStatusResult {
  const state = readCvMatchingState()
  const { opening } = target ? resolvePipelineOpening(state, target.companyId, target.openingId) : getActiveOpening(state)
  if (!opening) return { ok: false, reason: 'no-active-opening' }

  const p = ensurePipeline(opening)
  const rec = p.prescreened.find((r) => r.id === recordId)
  if (!rec) return { ok: false, reason: 'entry-not-found' }

  // Only this field changes — id/candidateId/name/email/testLink/autoSent/
  // matchScore/addedAt are untouched, exactly like legacy's `rec.status =
  // status` (modules/recruiting.html line 2223).
  rec.status = status

  try {
    writeCvMatchingState(state)
  } catch (err) {
    return { ok: false, reason: 'storage-unavailable', message: err instanceof Error ? err.message : String(err) }
  }
  return { ok: true, entry: rec }
}

export type RemovePrescreenedResult =
  | { ok: true; removed: true }
  | { ok: true; removed: false } // opening resolved, but no record had this id — legacy still persists unconditionally, see below
  | { ok: false; reason: 'no-active-opening' }
  | { ok: false; reason: 'storage-unavailable'; message: string }

// PHASE 9 WRITE CONTRACT — ported verbatim from removePrescreenedCandidate()
// (modules/recruiting.html ~2369-2376), the function behind the Pipeline
// detail screen's "✕" button (~2049). Investigated in full per this
// phase's mandatory gate — genuinely isolated, no STOP condition applies:
//
//   function removePrescreenedCandidate(id){
//     const { opening } = getPipelineOpening();
//     if(!opening) return;
//     const p = ensurePipeline(opening);
//     p.prescreened = p.prescreened.filter(r=>r.id!==id);
//     persistCvMatchingState();
//     renderPipelineScreen();
//   }
//
//  - Storage key: apex5d_cv_matching_state only. Confirmed by reading the
//    complete function body: no reference to CANDIDATES,
//    persistCandidates(), completeCandidateTest(), or any other key/
//    function anywhere in this chain. This is the simplest of the three
//    writes migrated so far — a pure array filter, one key, no cascade.
//  - Record identity: the prescreened entry's own `id` (not candidateId) —
//    same identification method as Phase 8's setPrescreenStatus().
//  - Scope: filters ONE opening's pipeline.prescreened array. A record
//    under a different opening (even for the same candidateId) is a
//    separate array entirely and is never touched.
//  - Missing opening: `if(!opening) return` — no persist call at all.
//  - Missing record: legacy has NO guard here (unlike setPrescreenStatus's
//    `if(!rec) return`) — filter() on a non-matching id just returns an
//    equivalent array, and persistCvMatchingState() is still called
//    unconditionally. Reproduced exactly: this function always persists
//    once an opening is resolved, even if nothing actually matched — the
//    `removed` flag in the result exists only so the CALLER (the UI) can
//    tell the two cases apart, it does not change what gets written.
//  - No confirmation prompt in legacy (bare onclick, no confirm()) — not
//    added here either, for parity.
//  - No toast()/success message in legacy — the only observable feedback is
//    the row disappearing from the list. React mirrors that: the caller
//    removes the row from view on success rather than showing an invented
//    "removed" message legacy never displays (see cv/CvMatchDialog.tsx).
//  - No API/network call anywhere in this chain.
//
// Concurrency: fresh readCvMatchingState() on every call, same as Phase 7/8.
// Opening resolution: `target` (Pipeline's own selection, PHASE 11C-1) when
// supplied, else getActiveOpening() exactly as before — same dual-resolution
// pattern as addPrescreenedEntry()/setPrescreenStatus() above.
export function removePrescreenedCandidate(recordId: string, target?: PipelineTarget): RemovePrescreenedResult {
  const state = readCvMatchingState()
  const { opening } = target ? resolvePipelineOpening(state, target.companyId, target.openingId) : getActiveOpening(state)
  if (!opening) return { ok: false, reason: 'no-active-opening' }

  const p = ensurePipeline(opening)
  const before = p.prescreened.length
  p.prescreened = p.prescreened.filter((r) => r.id !== recordId)
  const removed = p.prescreened.length !== before

  try {
    writeCvMatchingState(state)
  } catch (err) {
    return { ok: false, reason: 'storage-unavailable', message: err instanceof Error ? err.message : String(err) }
  }
  return { ok: true, removed }
}

export type AddTestResultResult =
  | { ok: true; result: TestResult }
  | { ok: false; reason: 'no-active-opening' }
  | { ok: false; reason: 'candidate-not-found' } // legacy: no prescreened record has this id ("Seleziona un candidato pre-screened")
  | { ok: false; reason: 'invalid-score' } // legacy: Number(scoreRaw) is NaN ("Inserisci un punteggio valido (0-100)")
  | { ok: false; reason: 'storage-unavailable'; message: string }

// PHASE 11C-2 WRITE CONTRACT — ported verbatim from addTestResult()
// (modules/recruiting.html ~2378-2394), the function behind the Pipeline
// detail screen's "+ Aggiungi risultato" button (~2133). Unlike
// addPrescreenedEntry/setPrescreenStatus/removePrescreenedCandidate, this
// function has never had another call site — it's Pipeline-only in legacy
// (no CvMatchDialog equivalent exists), so `target` is REQUIRED here rather
// than optional-with-an-activeContext-fallback; there is no prior behavior
// to preserve for a missing target.
//
//  - Storage key: apex5d_cv_matching_state only (writeCvMatchingState).
//  - Candidate source/identity: `prescreenedRecordId` is looked up against
//    THIS opening's pipeline.prescreened array by the record's own `id`
//    (legacy: `document.getElementById('pl-test-cand')?.value`, whose
//    <option value> is `r.id`, not r.candidateId — confirmed by reading
//    renderPipelineDetail()'s prescreenedOptions, ~2030). The stored result
//    then uses that record's `candidateId` and `name` — NOT the prescreened
//    record's own id. A missing/invalid selection (`!src`) is reported as
//    'candidate-not-found', matching legacy's toast('Seleziona un
//    candidato pre-screened') — no persist happens.
//  - Score: reproduced exactly as `Math.max(0, Math.min(100,
//    Math.round(Number(scoreRaw))))`, then `Number.isFinite(score)`. This
//    is NOT the same as "score must be non-empty" — Number('') is 0, which
//    IS finite, so an empty score field legacy-silently registers a score
//    of 0 rather than blocking submission. Only genuinely non-numeric text
//    (Number(text) === NaN) is rejected. Reproduced as-is, not "fixed" into
//    requiring a non-empty value — scoreRaw is passed through as the exact
//    string a controlled <input> holds, so this exact coercion applies.
//  - Note: trimmed, defaults to '' (never undefined) — matches legacy's
//    `(el?.value||'').trim()`.
//  - REPLACE-ON-ADD ("latest wins"), confirmed from source, not assumed:
//    `p.testResults = p.testResults.filter(r=>r.candidateId!==src.candidateId)`
//    then `.push(...)` — ANY existing result for the same candidateId is
//    fully discarded (not patched), and the new record gets a BRAND NEW id
//    (plId('test')) and a fresh addedAt — the old id/timestamp are never
//    reused. Also note: push (append), not unshift — the stored array's
//    order is insertion order; only the UI's ranked display is sorted by
//    score (see TestResultList.tsx, unchanged from Phase 11B).
//  - Side effects NOT reproduced: renderPipelineScreen() (DOM refresh — the
//    caller re-renders itself) and toast() (caller decides how to present
//    the result — legacy's own success toast text is IDENTICAL whether this
//    was a first-time add or a replace, so this result type doesn't
//    distinguish the two either).
//  - No other localStorage key touched, no CANDIDATES/skillvision_candidates_data
//    reference anywhere in this chain, no API/network call.
//
// Concurrency: fresh readCvMatchingState() on every call, same discipline
// as every other Pipeline mutation.
export function addTestResult(prescreenedRecordId: string, scoreRaw: string, note: string, target: PipelineTarget): AddTestResultResult {
  const state = readCvMatchingState()
  const { opening } = resolvePipelineOpening(state, target.companyId, target.openingId)
  if (!opening) return { ok: false, reason: 'no-active-opening' }

  const p = ensurePipeline(opening)
  const src = p.prescreened.find((r) => r.id === prescreenedRecordId)
  if (!src) return { ok: false, reason: 'candidate-not-found' }

  const score = Math.max(0, Math.min(100, Math.round(Number(scoreRaw))))
  if (!Number.isFinite(score)) return { ok: false, reason: 'invalid-score' }

  p.testResults = p.testResults.filter((r) => r.candidateId !== src.candidateId)
  const result: TestResult = {
    id: plId('test'),
    candidateId: src.candidateId,
    name: src.name,
    score,
    note: note.trim(),
    addedAt: new Date().toISOString(),
  }
  p.testResults.push(result)

  try {
    writeCvMatchingState(state)
  } catch (err) {
    return { ok: false, reason: 'storage-unavailable', message: err instanceof Error ? err.message : String(err) }
  }
  return { ok: true, result }
}

export type RemoveTestResultResult =
  | { ok: true; removed: true }
  | { ok: true; removed: false } // opening resolved, but no result had this id — legacy still persists unconditionally, same as removePrescreenedCandidate
  | { ok: false; reason: 'no-active-opening' }
  | { ok: false; reason: 'storage-unavailable'; message: string }

// PHASE 11C-2 — ported verbatim from removeTestResult() (modules/
// recruiting.html ~2395-2402), the function behind each test-result row's
// "✕" button (~2065). Structurally identical to Phase 9's
// removePrescreenedCandidate(): filter by the record's own `id`, no guard
// for a non-matching id (persists unconditionally once the opening
// resolves), no confirmation prompt, no toast, no other key touched.
// `target` is required for the same reason as addTestResult() above — no
// prior call site to stay compatible with.
export function removeTestResult(resultId: string, target: PipelineTarget): RemoveTestResultResult {
  const state = readCvMatchingState()
  const { opening } = resolvePipelineOpening(state, target.companyId, target.openingId)
  if (!opening) return { ok: false, reason: 'no-active-opening' }

  const p = ensurePipeline(opening)
  const before = p.testResults.length
  p.testResults = p.testResults.filter((r) => r.id !== resultId)
  const removed = p.testResults.length !== before

  try {
    writeCvMatchingState(state)
  } catch (err) {
    return { ok: false, reason: 'storage-unavailable', message: err instanceof Error ? err.message : String(err) }
  }
  return { ok: true, removed }
}

export type AddInterviewResult =
  | { ok: true; interview: Interview }
  | { ok: false; reason: 'no-active-opening' }
  | { ok: false; reason: 'candidate-not-found' } // legacy: no test result has this id ("Seleziona un candidato testato")
  | { ok: false; reason: 'storage-unavailable'; message: string }

// PHASE 11C-3 WRITE CONTRACT — ported verbatim from addInterview()
// (modules/recruiting.html ~2404-2417), the function behind "+ Aggiungi
// colloquio" (~2144). Like addTestResult()/removeTestResult(), this has
// never had another call site, so `target` is required (no activeContext
// fallback to preserve).
//
//  - Storage key: apex5d_cv_matching_state only.
//  - Candidate source/identity: `testResultId` is looked up against THIS
//    opening's pipeline.testResults array by the result's own `id` (legacy:
//    document.getElementById('pl-iv-cand')?.value, whose <option value> is
//    r.id — confirmed by reading renderPipelineDetail()'s testedOptions,
//    ~2032 — not candidateId). The stored interview then uses that result's
//    candidateId/name. Missing/invalid selection -> 'candidate-not-found',
//    matching legacy's toast('Seleziona un candidato testato') — no persist.
//  - scheduledAt: `dateVal ? new Date(dateVal).toISOString() : new
//    Date().toISOString()` — reproduced exactly. A date IS transformed (a
//    bare YYYY-MM-DD from the <input type="date"> becomes a full ISO
//    timestamp), and an EMPTY date does NOT block submission — it silently
//    defaults to "now", not null/undefined. Not "fixed" into requiring a
//    date.
//  - REPLACE-ON-ADD ("latest wins"), confirmed from source:
//    `p.interviews = p.interviews.filter(r=>r.candidateId!==src.candidateId)`
//    then `.push(...)` — identical pattern to addTestResult(): any existing
//    interview for the same candidateId is fully discarded, the new record
//    gets a brand-new id (plId('iv')) and a fresh scheduledAt/scorecard —
//    nothing from the old record is preserved. Push (append), not unshift —
//    stored order is insertion order; legacy applies NO sort when
//    rendering interviewRows either (unlike testResults' ranked display),
//    so InterviewList.tsx maps the array as-is.
//  - New record defaults: completed:false, scorecard:{overall:null,notes:''}
//    — confirmed exactly, no additional fields.
//  - No other localStorage key, no CANDIDATES reference, no API/network
//    call anywhere in this chain.
export function addInterview(testResultId: string, dateVal: string, target: PipelineTarget): AddInterviewResult {
  const state = readCvMatchingState()
  const { opening } = resolvePipelineOpening(state, target.companyId, target.openingId)
  if (!opening) return { ok: false, reason: 'no-active-opening' }

  const p = ensurePipeline(opening)
  const src = p.testResults.find((r) => r.id === testResultId)
  if (!src) return { ok: false, reason: 'candidate-not-found' }

  p.interviews = p.interviews.filter((r) => r.candidateId !== src.candidateId)
  const interview: Interview = {
    id: plId('iv'),
    candidateId: src.candidateId,
    name: src.name,
    scheduledAt: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
    completed: false,
    scorecard: { overall: null, notes: '' },
  }
  p.interviews.push(interview)

  try {
    writeCvMatchingState(state)
  } catch (err) {
    return { ok: false, reason: 'storage-unavailable', message: err instanceof Error ? err.message : String(err) }
  }
  return { ok: true, interview }
}

export type SaveScorecardResult =
  | { ok: true; interview: Interview }
  | { ok: false; reason: 'no-active-opening' }
  | { ok: false; reason: 'interview-not-found' }
  | { ok: false; reason: 'storage-unavailable'; message: string }

// PHASE 11C-3 — ported verbatim from saveInterviewScorecard()
// (modules/recruiting.html ~2418-2431), the function behind each
// interview row's "💾 Salva scorecard" button (~2085).
//
//  - Targets by the interview's own `id` (not candidateId).
//  - Changes EXACTLY: rec.scorecard = {overall, notes}, rec.completed=true.
//    Nothing else on the record is touched (id/candidateId/name/scheduledAt
//    untouched) — confirmed by reading the complete function body.
//  - overall: `Number(el?.value)`, kept only if Number.isFinite, else null.
//    In practice this select only ever offers values 1-5 (legacy renders
//    <option value="1">..<option value="5">, ~2081), so this guard mainly
//    covers a missing DOM element, not real user input — reproduced as-is.
//  - notes: trimmed, defaults to '' (never undefined).
//  - completed is set to true UNCONDITIONALLY, every save, regardless of
//    the scorecard values — there is no way to revert it to false through
//    this function (legacy has no such control either).
//  - Missing interview: legacy's `if(!rec) return` is completely silent (no
//    toast) — this port still returns a typed 'interview-not-found' result
//    so the UI can show an honest message for this edge case (effectively
//    unreachable — the button only renders for interviews already in the
//    array being mapped — but not silently ignored either, consistent with
//    every other Pipeline write action's "accurate error state" bar).
//  - No other localStorage key, no CANDIDATES reference, no API/network.
export function saveInterviewScorecard(interviewId: string, overallRaw: string, notes: string, target: PipelineTarget): SaveScorecardResult {
  const state = readCvMatchingState()
  const { opening } = resolvePipelineOpening(state, target.companyId, target.openingId)
  if (!opening) return { ok: false, reason: 'no-active-opening' }

  const p = ensurePipeline(opening)
  const rec = p.interviews.find((r) => r.id === interviewId)
  if (!rec) return { ok: false, reason: 'interview-not-found' }

  const overall = Number(overallRaw)
  rec.scorecard = { overall: Number.isFinite(overall) ? overall : null, notes: notes.trim() }
  rec.completed = true

  try {
    writeCvMatchingState(state)
  } catch (err) {
    return { ok: false, reason: 'storage-unavailable', message: err instanceof Error ? err.message : String(err) }
  }
  return { ok: true, interview: rec }
}

export type RemoveInterviewResult =
  | { ok: true; removed: true }
  | { ok: true; removed: false } // opening resolved, but no interview had this id — persists unconditionally, same as every other Pipeline remove
  | { ok: false; reason: 'no-active-opening' }
  | { ok: false; reason: 'storage-unavailable'; message: string }

// PHASE 11C-3 — ported verbatim from removeInterview() (modules/
// recruiting.html ~2432-2439), the function behind each interview row's
// "✕" button (~2086). Structurally identical to removeTestResult()/
// removePrescreenedCandidate(): filter by the record's own `id`, no guard
// for a non-matching id, no confirmation prompt, no toast, no other key.
export function removeInterview(interviewId: string, target: PipelineTarget): RemoveInterviewResult {
  const state = readCvMatchingState()
  const { opening } = resolvePipelineOpening(state, target.companyId, target.openingId)
  if (!opening) return { ok: false, reason: 'no-active-opening' }

  const p = ensurePipeline(opening)
  const before = p.interviews.length
  p.interviews = p.interviews.filter((r) => r.id !== interviewId)
  const removed = p.interviews.length !== before

  try {
    writeCvMatchingState(state)
  } catch (err) {
    return { ok: false, reason: 'storage-unavailable', message: err instanceof Error ? err.message : String(err) }
  }
  return { ok: true, removed }
}

// Ported from renderPipelineDetail()'s winner-candidate derivation (modules/
// recruiting.html ~2090-2091) — shared here so the UI (building the
// <select> options) and confirmPipelineWinner() (validating a submission)
// use the exact same computation rather than two hand-kept copies of it.
export function getWinnerCandidates(interviews: Interview[]): Interview[] {
  const completed = interviews.filter((r) => r.completed)
  return completed.length ? completed : interviews
}

export type ConfirmWinnerResult =
  | { ok: true; winner: PipelineWinner }
  | { ok: false; reason: 'no-active-opening' }
  | { ok: false; reason: 'candidate-not-found' } // legacy: no eligible candidate matches ("Seleziona un candidato intervistato")
  | { ok: false; reason: 'storage-unavailable'; message: string }

// PHASE 11C-4 WRITE CONTRACT — ported from confirmPipelineWinner()
// (modules/recruiting.html ~2441-2453), the function behind "🏆 Conferma
// vincitore" (~2153).
//
//  - Storage key: apex5d_cv_matching_state only.
//  - Eligible candidate source (verified from source, not assumed):
//    `const completedInterviews = p.interviews.filter(r=>r.completed);
//     const winnerCandidates = completedInterviews.length ? completedInterviews : p.interviews;`
//    (~2090-2091) — completed interviews are PREFERRED, but if NONE are
//    completed, EVERY interview becomes eligible (not just completed ones).
//    Reproduced exactly, not simplified to "completed only".
//  - Candidate identity: legacy's <select value> is `r.candidateId||r.id`
//    (~2092) with the display name smuggled through a `data-name` DOM
//    attribute (a vanilla-JS workaround for a native <select> only holding
//    one string) — read back via `sel.selectedOptions[0].dataset.name`.
//    React has no DOM to read a second attribute off of, so this function
//    takes the already-resolved `selectedValue` (the same candidateId||id
//    string the <option value> would hold) and re-derives `name` itself by
//    re-finding that candidate inside a FRESHLY RECOMPUTED eligible pool —
//    not by trusting a name the caller captured from a possibly-stale
//    render. This is a stricter check than legacy actually performs (legacy
//    just trusts whatever's currently in the DOM, with no re-validation
//    against fresh p.interviews at write time — its single shared in-memory
//    state has no read/write staleness gap for this to matter) — required
//    here because React's fresh-read-per-mutation architecture (Phase
//    7 onward) does have that gap. A selection that's no longer part of
//    the freshly-computed eligible pool is rejected exactly like legacy's
//    own `!candidateId || !name` guard rejects an empty selection.
//  - Winner object: {candidateId, name, decidedAt: new Date().toISOString()}
//    — exactly 3 fields, no id of its own (single winner, not a collection).
//  - REPLACEMENT: p.winner is a single object slot, not an array — confirming
//    a new candidate simply overwrites it. No history, no multiple winners.
//  - No other field on Pipeline changes (interviews/testResults/prescreened
//    untouched), no CANDIDATES reference, no API/network call.
export function confirmPipelineWinner(selectedValue: string, target: PipelineTarget): ConfirmWinnerResult {
  const state = readCvMatchingState()
  const { opening } = resolvePipelineOpening(state, target.companyId, target.openingId)
  if (!opening) return { ok: false, reason: 'no-active-opening' }

  const p = ensurePipeline(opening)
  const winnerCandidates = getWinnerCandidates(p.interviews)
  const candidate = winnerCandidates.find((r) => (r.candidateId || r.id) === selectedValue)
  const name = candidate?.name || ''
  if (!selectedValue || !candidate || !name) return { ok: false, reason: 'candidate-not-found' }

  const winner: PipelineWinner = { candidateId: selectedValue, name, decidedAt: new Date().toISOString() }
  p.winner = winner

  try {
    writeCvMatchingState(state)
  } catch (err) {
    return { ok: false, reason: 'storage-unavailable', message: err instanceof Error ? err.message : String(err) }
  }
  return { ok: true, winner }
}

export type ClearWinnerResult =
  | { ok: true }
  | { ok: false; reason: 'no-active-opening' }
  | { ok: false; reason: 'storage-unavailable'; message: string }

// PHASE 11C-4 — ported verbatim from clearPipelineWinner() (modules/
// recruiting.html ~2454-2461), the function behind the header winner
// banner's "Annulla decisione" button (~2108). Unconditional — no guard for
// "was there even a winner" — and touches nothing else (interviews/
// testResults/prescreened untouched, no other localStorage key).
export function clearPipelineWinner(target: PipelineTarget): ClearWinnerResult {
  const state = readCvMatchingState()
  const { opening } = resolvePipelineOpening(state, target.companyId, target.openingId)
  if (!opening) return { ok: false, reason: 'no-active-opening' }

  const p = ensurePipeline(opening)
  p.winner = null

  try {
    writeCvMatchingState(state)
  } catch (err) {
    return { ok: false, reason: 'storage-unavailable', message: err instanceof Error ? err.message : String(err) }
  }
  return { ok: true }
}

export type PipelineStage = { key: string; label: string; pct: number }

export function pipelineStage(opening: JobOpening): PipelineStage {
  const p = ensurePipeline(opening)
  if (p.winner) return { key: 'decision', label: '🏆 Vincitore selezionato', pct: 100 }
  if (p.interviews.length) return { key: 'interviews', label: 'Colloqui in corso', pct: 75 }
  if (p.testResults.length) return { key: 'testing', label: 'Test completati — ranking pronto', pct: 55 }
  if (p.prescreened.length) return { key: 'prescreening', label: 'Pre-screening in corso', pct: 30 }
  return { key: 'sourcing', label: 'Sourcing candidati', pct: 8 }
}

// PHASE 11B — read-only port of getPipelineOpening()'s RESOLUTION logic
// (modules/recruiting.html ~1959-1967), minus its module-level
// pipelineState self-assignment side effect. Legacy keeps a screen-local
// `pipelineState` variable that survives across renders for the browser
// tab's lifetime; once set, it takes priority over activeContext on every
// subsequent call, and activeContext is consulted only as the fallback for
// whichever half (company/opening) pipelineState doesn't yet resolve. React
// has no equivalent module-level variable — see pipeline/PipelinePage.tsx,
// which sources selectedCompanyId/selectedOpeningId from the route's own
// search params instead (?companyId=&openingId=), the React-idiomatic
// substitute for a value that must survive across this screen's own
// navigations but stay independent of the global activeContext used
// elsewhere (CV & Export, Ranking's CvMatchDialog). Passing null/undefined
// for either id reproduces legacy's very-first-visit case, where
// pipelineState.companyId/openingId are still '' and neither matches any
// real company/opening.
export function resolvePipelineOpening(
  state: CvMatchingState,
  selectedCompanyId: string | null | undefined,
  selectedOpeningId: string | null | undefined,
): { company?: Company; opening?: JobOpening } {
  let company = state.companies.find((c) => c.id === selectedCompanyId)
  if (!company) {
    company = state.companies.find((c) => c.id === state.activeContext?.companyId) || state.companies[0]
  }
  let opening = company?.jobOpenings?.find((o) => o.id === selectedOpeningId)
  if (!opening) {
    opening = company?.jobOpenings?.find((o) => o.id === state.activeContext?.openingId) || company?.jobOpenings?.[0]
  }
  return { company, opening }
}

// Ported from buildDefaultJobProfile() (modules/recruiting.html
// ~1643-1656), called by renderPipelineDetail() as `opening.jobProfile ||
// buildDefaultJobProfile(opening.title)` — reproduced the same way here.
// Legacy seeds skills from the currently active role's flags (module-global
// `flags`, itself ROLES[currentRole].flags); the React app has no role
// switcher yet (DEFAULT_ROLE is fixed — see constants.ts), so DEFAULT_FLAGS
// is the exact current value that global would hold. Legacy also falls back
// to `currentRole` when no title is passed — not reproduced as a separate
// parameter here since every call site in this migration always has a real
// opening.title to pass.
//
// PHASE 16 CORRECTION: re-reading current source for the CV & Export audit
// found this port was missing the `weighting` field legacy's CURRENT
// buildDefaultJobProfile() actually returns (`{skills:0.5, experience:0.25,
// education:0.15, certifications:0.10}`). This had no observable effect on
// Pipeline (its header only ever reads `.criteria`), which is why it went
// unnoticed through Phases 11B-15 — but matchCandidateToProfile() (Phase 16)
// reads `.weighting` directly, so the field is added now for byte-fidelity
// with current source, not introduced as new behavior.
export function buildDefaultJobProfile(title: string): JobProfile {
  const seedSkills = Object.keys(DEFAULT_FLAGS).slice(0, 6)
  return {
    id: `profile-${(title || 'role').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    title: title || 'Dynamic Job Profile',
    criteria: {
      skills: seedSkills.length ? seedSkills : ['Communication', 'Leadership', 'Problem Solving'],
      experienceYears: 3,
      education: 'Bachelor',
      certifications: [],
    },
    weighting: { skills: 0.5, experience: 0.25, education: 0.15, certifications: 0.1 },
  }
}

export type AddCandidateToPoolInput = {
  id?: string
  name?: string
  email?: string
  cvData?: Candidate['cvData']
  match?: CandidatePoolEntry['match']
  source?: string
  sourceTag?: 'ARCHIVE' | 'NEW_APPLICANT'
  campaignId?: string
}

export type AddCandidateToPoolResult = { ok: true; record: CandidatePoolEntry } | { ok: false; reason: 'no-active-opening' }

// PHASE 16 WRITE CONTRACT — ported verbatim from addCandidateToActiveOpening()
// (modules/recruiting.html ~1756-1779), the function behind CV & Export's
// single-CV upload (runPipeline()) and the bridged "Parse CV & Match" button.
//
//  - Opening resolution: activeContext only (getActiveOpening) — CV & Export
//    has no Pipeline-style local selector, by design (Phase 15 audit).
//    Missing company/opening -> 'no-active-opening', no persist at all,
//    matching legacy's own `if(!company||!opening) return null`.
//  - New record: `{id, createdAt, companyId, openingId, sourceTag, campaignId,
//    ...input}` — defaults computed first (id falls back to
//    `candidate-${Date.now()}`, sourceTag to 'NEW_APPLICANT', campaignId to
//    the opening's own id), then spread OVER by `input` — so an `input`
//    that supplies its own sourceTag/campaignId wins, matching legacy's
//    `{...defaults, ...candidateRecord}` object-literal semantics exactly.
//  - CROSS-KEY SYNC (the one real cross-key side effect in this whole
//    domain): if `record.id` matches an EXISTING skillvision_candidates_data
//    record, this patches that candidate's OWN sourceTag/campaignId to match
//    and persists CANDIDATES too — "so the source tag follows the candidate
//    into ranking/compare/profile views" (legacy's own comment, line 1770).
//    Every other field on that candidate is left untouched. If no match is
//    found (the id is pool-only, or belongs to a candidate not yet created),
//    CANDIDATES is not touched at all.
//  - Pool cap: unshift (newest first), then pop from the END if the pool
//    exceeds 100 entries — reproduced exactly, not rounded to a different
//    number.
//  - No other localStorage key, no API/network call.
//
// Concurrency: fresh reads of BOTH readCvMatchingState() and (only when the
// cross-sync condition applies) readCandidates() — never trusts a value
// captured at an earlier render, same discipline as every other mutation.
export function addCandidateToPool(input: AddCandidateToPoolInput): AddCandidateToPoolResult {
  const state = readCvMatchingState()
  const { company, opening } = getActiveOpening(state)
  if (!company || !opening) return { ok: false, reason: 'no-active-opening' }

  opening.candidatePool = opening.candidatePool || []
  const record: CandidatePoolEntry = {
    id: input.id || `candidate-${Date.now()}`,
    createdAt: new Date().toISOString(),
    companyId: company.id,
    openingId: opening.id,
    sourceTag: input.sourceTag || 'NEW_APPLICANT',
    campaignId: input.campaignId || opening.id,
    ...input,
  }

  if (record.id) {
    const candidates = readCandidates()
    const idx = candidates.findIndex((c) => c.id === record.id)
    if (idx >= 0) {
      candidates[idx].sourceTag = record.sourceTag
      candidates[idx].campaignId = record.campaignId
      writeCandidates(candidates)
    }
  }

  opening.candidatePool.unshift(record)
  if (opening.candidatePool.length > 100) opening.candidatePool.pop()
  writeCvMatchingState(state)

  return { ok: true, record }
}
