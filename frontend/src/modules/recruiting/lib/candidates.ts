import { readCandidates, writeCandidates } from '@/modules/recruiting/lib/storage'
import type { Candidate } from '@/modules/recruiting/lib/types'

export type SetCandidateEmailResult =
  | { ok: true; candidate: Candidate }
  | { ok: false; reason: 'candidate-not-found' }
  | { ok: false; reason: 'storage-unavailable'; message: string }

// PHASE 13 WRITE CONTRACT — ported verbatim from setPendingCandidateEmail()
// (modules/recruiting.html ~2289-2295), the function behind Pagina A's
// per-row email <input>'s onchange handler.
//
//  - Storage key: skillvision_candidates_data only (persistCandidates()) —
//    confirmed by reading the complete function body: no reference to
//    CV_MATCHING_STATE/apex5d_cv_matching_state anywhere in this chain.
//  - Write shape: the ENTIRE CANDIDATES array, re-serialized — matches
//    persistCandidates()'s `JSON.stringify(CANDIDATES)` (whole-array
//    write), same discipline as writeCvMatchingState()'s whole-tree write.
//  - Candidate lookup: `CANDIDATES.find(x=>x.id===id)` — by the
//    candidate's own `id`. Missing candidate: legacy's `if(!c)return` — no
//    persist at all. Typed here as 'candidate-not-found' so the caller can
//    show an honest message rather than failing silently (practically
//    unreachable in normal use — Pagina A only ever calls this with an id
//    from the list it just rendered).
//  - Mutation: `c.email=(value||'').trim()` — ONLY the email field
//    changes; every other field (name/src/icv/scores/bf/testCompleted) is
//    read, found, and written back completely untouched, since this reads
//    the full array, patches one field on one record in place, and writes
//    the same array back.
//  - No validation beyond trim() — legacy has no email format check here,
//    so none is invented. An empty string is a valid, persisted value
//    (clears the email), matching legacy exactly.
//  - No other localStorage key touched, no API/network call anywhere in
//    this chain.
//
// Concurrency: fresh readCandidates() on every call — same discipline as
// every Pipeline mutation in lib/pipeline.ts.
export function setCandidateEmail(candidateId: string, email: string): SetCandidateEmailResult {
  const candidates = readCandidates()
  const candidate = candidates.find((c) => c.id === candidateId)
  if (!candidate) return { ok: false, reason: 'candidate-not-found' }

  candidate.email = (email || '').trim()

  try {
    writeCandidates(candidates)
  } catch (err) {
    return { ok: false, reason: 'storage-unavailable', message: err instanceof Error ? err.message : String(err) }
  }
  return { ok: true, candidate }
}

export type CreateCandidateFromCvInput = { icv: number; fileName?: string; fileUrl?: string }
export type CreateCandidateFromCvResult = { ok: true; candidate: Candidate } | { ok: false; reason: 'storage-unavailable'; message: string }

// PHASE 16 WRITE CONTRACT — ported verbatim from the CANDIDATES-side of
// runPipeline() (modules/recruiting.html ~3181-3196, ~3215), the function
// behind CV & Export's single-CV upload drop zone.
//
//  - Storage key: skillvision_candidates_data only.
//  - id: `c${candidates.length + 1}` — matches legacy's
//    `'c'+(CANDIDATES.length+1)` exactly, including its real collision risk
//    if a candidate is ever removed (never "fixed" into a UUID — this is
//    legacy's actual current id scheme, re-verified from source this phase).
//  - name/src: FIXED literals — "Nuovo candidato (da CV)" and "CV caricato
//    ora · parsing ML · in attesa del test soft skill" — never derived from
//    the uploaded file's name (legacy doesn't do this either; see
//    lib/cv-upload.ts for why the file name is only ever used for
//    fileName/fileUrl, never the candidate's display name).
//  - icv: passed in already-computed (matchCandidateToProfile()'s
//    scorePercent) — legacy's `nc` starts at icv:0 and gets patched to this
//    same value a few lines later, before anything is ever persisted; since
//    this function only persists once, taking the final value directly is
//    the same observable result, not a shortcut.
//  - testCompleted:false, email:'', scores:{}, bf: neutral 50s on all five
//    factors — exact literal values, not derived.
//  - fileName/fileUrl: only set when a real file was attached (matches
//    legacy's `if(uploadedFile){...}` guard) — fileUrl is a session-only
//    `URL.createObjectURL()` reference (created by the caller, see
//    lib/cv-upload.ts), never a durable/backend URL.
//  - No other localStorage key touched, no API/network call.
//
// Concurrency: fresh readCandidates() — the `id` scheme itself depends on
// reading the CURRENT array length fresh, not a value captured earlier.
export function createCandidateFromCv(input: CreateCandidateFromCvInput): CreateCandidateFromCvResult {
  const candidates = readCandidates()
  const candidate: Candidate = {
    id: `c${candidates.length + 1}`,
    name: 'Nuovo candidato (da CV)',
    src: 'CV caricato ora · parsing ML · in attesa del test soft skill',
    icv: input.icv,
    testCompleted: false,
    email: '',
    scores: {},
    bf: { Estroversione: 50, Coscienziosità: 50, Apertura: 50, Amicalità: 50, 'Stabilità emotiva': 50 },
  }
  if (input.fileName) candidate.fileName = input.fileName
  if (input.fileUrl) candidate.fileUrl = input.fileUrl

  candidates.push(candidate)
  try {
    writeCandidates(candidates)
  } catch (err) {
    return { ok: false, reason: 'storage-unavailable', message: err instanceof Error ? err.message : String(err) }
  }
  return { ok: true, candidate }
}
