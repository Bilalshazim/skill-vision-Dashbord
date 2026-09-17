// Phase 31 §4/§6/§7/§8/§9/§10/§15 — the real backend-backed replacements
// for CV upload and the "INVIA LINK TEST" / shortlist-status actions,
// built as a thin orchestration layer ON TOP OF the existing local
// lib/pipeline.ts + lib/cv-upload.ts functions (unchanged) rather than a
// parallel rewrite of them — see each function below for exactly which
// backend calls happen first (source of truth) and which existing local
// write mirrors the result afterward (write-through cache, §15) so every
// existing screen (Ranking, Pipeline, CvMatchDialog) keeps rendering
// exactly as it did before this phase, unaware that its data now
// originates on a server.
//
// HONESTY NOTE carried over from cv-upload.ts: the actual CV *parsing*
// (buildSimulatedCvData()) is still simulated — this phase makes the
// MATCH/AHI computation and its storage real (persisted server-side via
// the exact ported formula, src/lib/scoring.ts), but does not add real
// OCR/ML text extraction, which no approved document describes and this
// phase's brief does not ask for. Never claim otherwise in the UI.
import { DEFAULT_MATCH_THRESHOLD, DEFAULT_ROLE } from '@/modules/recruiting/lib/constants'
import { setCandidateEmail } from '@/modules/recruiting/lib/candidates'
import { buildSimulatedCvData, matchCandidateToProfile } from '@/modules/recruiting/lib/cv-upload'
import { addCandidateToPool, addPrescreenedEntry, buildDefaultJobProfile, getActiveOpening, setPrescreenStatus } from '@/modules/recruiting/lib/pipeline'
import { getAllCachedBackendLinks, getCachedBackendLink, resolveBackendLink } from '@/modules/recruiting/lib/backend-link'
import { readCandidates, readCvMatchingState, writeCandidates, writeCvMatchingState } from '@/modules/recruiting/lib/storage'
import type { Candidate, PrescreenedEntry, PrescreenStatus } from '@/modules/recruiting/lib/types'
import type { JdState } from '@/modules/recruiting/lib/jd-types'
import { candidatesApi, cvApi, jobProfilesApi, shortlistApi } from '@/lib/api/endpoints'
import { apiBaseUrl, ApiError } from '@/lib/api/client'
import type { BackendShortlistStatus } from '@/lib/api/types'

const NEUTRAL_BIG_FIVE = { Estroversione: 50, Coscienziosità: 50, Apertura: 50, Amicalità: 50, 'Stabilità emotiva': 50 }

// Legacy's own guard message for this exact failure (sendCvMatchTestLink,
// modules/recruiting.html line 3076) — same string CvMatchDialog.tsx /
// PaginaAPage.tsx already show for this case, reused here rather than a
// third copy drifting out of sync.
const NO_ACTIVE_OPENING_MESSAGE = 'Seleziona prima una company/opening nella pagina CV & Esportazione'

function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.network ? 'Impossibile contattare il server backend.' : err.message
  return err instanceof Error ? err.message : 'Errore sconosciuto'
}

// Detects the specific "no mail provider configured on this backend" 502
// (lib/mailer.ts's own message, thrown as-is by POST /shortlist/:id/send-
// test — see backend/src/modules/shortlist/routes.ts) as distinct from any
// other backend-failed reason. There is no dedicated error code for this on
// the wire (just a generic "bad_gateway"), so this matches the exact,
// stable substring the backend always emits for this one condition —
// narrow on purpose, so an unrelated 502 is never mistaken for it.
function isMailNotConfiguredError(message: string): boolean {
  return message.includes('RESEND_API_KEY') || message.includes('MAIL_FROM')
}

export type UploadCvViaBackendResult =
  | { ok: true; candidateName: string; icv: number; companyName: string; openingTitle: string; autoSent: boolean; cvSyncFailed?: boolean; backendCandidateId: string }
  | { ok: false; reason: 'no-active-opening' }
  | { ok: false; reason: 'backend-link'; message: string }
  | { ok: false; reason: 'backend-error'; message: string }

// Real replacement for lib/cv-upload.ts's uploadCvToActiveOpening() (§6) —
// same orchestration shape (create candidate -> add to pool/campaign ->
// conditionally auto-shortlist+send), but every write that matters now
// happens on the backend FIRST, with the local mirror using the backend's
// own candidate id so every existing screen keyed by Candidate.id keeps
// working against the same identity the backend knows about.
//
// SYNC FIX (send-test investigation): candidate creation + campaign
// enrollment is split from CV upload/match/shortlist into its own try/catch
// below. Once candidatesApi.create()/addToCampaign() succeed, a REAL
// backend Candidate + CampaignCandidate exist — the local mirror is
// persisted and linked (backendCampaignCandidateId set) immediately,
// before anything else runs. Previously the entire chain shared one
// try/catch, so a later step failing (CV upload, match, or auto-shortlist)
// discarded that already-created backend record entirely: the function
// returned ok:false, the caller (CvExportPage.tsx) fell back to a fully
// local-only candidate with no backendCampaignCandidateId, and that
// candidate could never have a real email sent for it again — exactly the
// orphaned-candidate bug "INVIA LINK TEST" silently hit. Now a later-step
// failure is caught separately and still returns ok:true (the candidate is
// real and linked), with cvSyncFailed:true so the caller can show an
// honest, non-blocking note instead of duplicating the candidate locally.
export async function uploadCvViaBackend(file: File): Promise<UploadCvViaBackendResult> {
  const state = readCvMatchingState()
  const { company, opening } = getActiveOpening(state)
  if (!company || !opening) return { ok: false, reason: 'no-active-opening' }

  const link = await resolveBackendLink(company.name, opening.id, opening.title)
  if (!link.ok) return { ok: false, reason: 'backend-link', message: link.message }

  const candidateName = 'Nuovo candidato (da CV)' // same fixed literal as the local-only flow — see lib/candidates.ts createCandidateFromCv()

  let backendCandidate: { id: string }
  let campaignCandidate: { id: string }
  try {
    backendCandidate = await candidatesApi.create({ fullName: candidateName, source: 'NEW_APPLICANT' })
    campaignCandidate = await candidatesApi.addToCampaign(link.campaignId, backendCandidate.id)
  } catch (err) {
    // Nothing durable was created on the backend — the pre-existing
    // fully-local fallback in the caller remains correct here.
    return { ok: false, reason: 'backend-error', message: apiErrorMessage(err) }
  }

  const parsedCv = buildSimulatedCvData()
  const jobProfile = opening.jobProfile || buildDefaultJobProfile(DEFAULT_ROLE)
  const matchResult = matchCandidateToProfile(parsedCv, jobProfile)

  // Local mirror (§15 write-through) — same Candidate shape
  // createCandidateFromCv() would have produced, but with the REAL backend
  // id and the new backend* fields populated. Persisted and linked now,
  // before any step that could still fail.
  const candidates = readCandidates()
  const candidate: Candidate = {
    id: backendCandidate.id,
    name: candidateName,
    src: 'CV caricato ora · parsing ML · in attesa del test soft skill',
    icv: matchResult.scorePercent,
    testCompleted: false,
    email: '',
    scores: {},
    bf: NEUTRAL_BIG_FIVE,
    fileName: file.name,
    backendCandidateId: backendCandidate.id,
    backendCampaignId: link.campaignId,
    backendCampaignCandidateId: campaignCandidate.id,
  }
  candidates.push(candidate)
  writeCandidates(candidates)

  addCandidateToPool({ id: backendCandidate.id, name: candidateName, cvData: parsedCv, match: matchResult, source: 'cv-pipeline' })

  let autoSent = false
  try {
    const backendCv = await cvApi.upload(backendCandidate.id, file, link.campaignId)
    await cvApi.match(backendCv.id, {
      campaignId: link.campaignId,
      matchScorePercent: matchResult.scorePercent,
      softSkillScores: {},
      bigFive: NEUTRAL_BIG_FIVE,
    })
    patchCandidateBackendCvId(candidate.id, backendCv.id)
  } catch (err) {
    // The candidate already exists and is linked to the backend (see
    // above) — a genuine CV upload/match failure is reported to the caller
    // (cvSyncFailed, shown as "sincronizzazione del CV non è riuscita") but
    // must never trigger a duplicate local-only candidate; the recruiter
    // can retry the CV sync from the same already-linked candidate.
    console.error('[uploadCvViaBackend] CV upload/match failed:', err)
    return {
      ok: true,
      candidateName,
      icv: matchResult.scorePercent,
      companyName: company.name,
      openingTitle: opening.title,
      autoSent,
      cvSyncFailed: true,
      backendCandidateId: backendCandidate.id,
    }
  }

  // CV SYNC FIX: the auto-shortlist/auto-send below is NOT part of "CV
  // sync" — it used to share one try/catch with the CV upload/match above,
  // so any failure here was misreported as a failed CV sync. The
  // always-reachable case: a fresh CV candidate has NO email yet (the
  // recruiter only adds one later in Pagina A), and POST
  // /shortlist/:id/send-test 400s with "This candidate has no email address
  // on file" (shortlist/routes.ts) — so EVERY above-threshold upload showed
  // "salvato e collegato al server, ma la sincronizzazione del CV non è
  // riuscita" even though the CV upload + match had already succeeded and
  // persisted. Now the shortlist/send failure is handled on its own: the
  // real shortlist row stays (DA_INVIARE server-side), gets linked locally,
  // and the candidate lands in Pagina A as "Da inviare" — the recruiter
  // adds an email there and re-sends from CvMatchDialog/Pagina A
  // (sendTestLinkViaBackend reuses the same shortlist id via
  // findLocalBackendShortlistId). Only a real CV upload/match failure
  // reports cvSyncFailed.
  if (matchResult.scorePercent >= DEFAULT_MATCH_THRESHOLD) {
    try {
      const shortlist = await shortlistApi.add(campaignCandidate.id, 'CV_ELABORATI')
      try {
        await shortlistApi.sendTest(shortlist.id)
        const added = addPrescreenedEntry(backendCandidate.id, candidateName, '', true, matchResult.scorePercent)
        if (added.ok) patchPrescreenedBackendId(opening.id, added.entry.id, shortlist.id)
        autoSent = true
      } catch (err) {
        console.error('[uploadCvViaBackend] auto send-test failed — candidate kept in Pagina A as pending:', err)
        const added = addPrescreenedEntry(backendCandidate.id, candidateName, '', false, matchResult.scorePercent)
        if (added.ok) patchPrescreenedBackendId(opening.id, added.entry.id, shortlist.id)
      }
    } catch (err) {
      // Shortlist creation itself failed — candidate + CV + match are still
      // real and linked on the backend; the shortlist can still be created
      // manually from CvMatchDialog ("INVIA LINK TEST" -> shortlistApi.add).
      console.error('[uploadCvViaBackend] auto shortlist failed:', err)
    }
  }

  return { ok: true, candidateName, icv: matchResult.scorePercent, companyName: company.name, openingTitle: opening.title, autoSent, cvSyncFailed: false, backendCandidateId: backendCandidate.id }
}

// GDPR retention consent (§6 of this phase's brief): best-effort, non-
// blocking — the CV upload itself has already fully succeeded by the time
// this runs, so a retention-save failure is logged, never surfaced as an
// upload failure. Called once, right after a successful uploadCvViaBackend().
export async function setCvRetentionChoice(backendCandidateId: string, choice: 'TWO_YEARS' | 'SIX_MONTHS'): Promise<void> {
  try {
    await candidatesApi.setRetention(backendCandidateId, choice)
  } catch (err) {
    console.error('[setCvRetentionChoice] failed to save retention choice:', err)
  }
}

export type SetCandidateEmailWithSyncResult =
  | { ok: true; candidate: Candidate; backendSync: 'not-linked' | 'synced' }
  | { ok: true; candidate: Candidate; backendSync: 'failed'; backendMessage: string }
  | { ok: false; reason: 'candidate-not-found' }
  | { ok: false; reason: 'storage-unavailable'; message: string }

// Real replacement for lib/candidates.ts's setCandidateEmail() everywhere
// the caller can also reach the backend — Pagina A's per-row email input
// (PaginaACandidateRow.tsx). The local write ALWAYS happens first and
// ALWAYS wins (§15's write-through discipline: never block/revert a local
// save on a network outcome) — this only ADDS a best-effort backend PATCH
// on top, for candidates that are actually backend-linked
// (backendCandidateId set — see uploadCvViaBackend() above). Fixes the gap
// found while verifying the send-test fix: "INVIA LINK TEST" reads
// candidate.email from the BACKEND Candidate record at send time (see
// shortlist/routes.ts), which the local-only setCandidateEmail() never
// touched — a recruiter could type a correct email here and a real send
// would still fail with "no email address on file". A candidate with no
// backendCandidateId (not yet linked, or genuinely local-only) is reported
// as 'not-linked', not a failure — there is nothing to sync yet.
export async function setCandidateEmailWithBackendSync(candidateId: string, email: string): Promise<SetCandidateEmailWithSyncResult> {
  const localResult = setCandidateEmail(candidateId, email)
  if (!localResult.ok) return localResult

  const backendCandidateId = localResult.candidate.backendCandidateId
  if (!backendCandidateId) return { ok: true, candidate: localResult.candidate, backendSync: 'not-linked' }

  try {
    await candidatesApi.updateEmail(backendCandidateId, email)
    return { ok: true, candidate: localResult.candidate, backendSync: 'synced' }
  } catch (err) {
    return { ok: true, candidate: localResult.candidate, backendSync: 'failed', backendMessage: apiErrorMessage(err) }
  }
}

export type LinkExistingCandidateResult =
  | { ok: true; candidate: Candidate }
  | { ok: false; reason: 'no-active-opening' }
  | { ok: false; reason: 'backend-link'; message: string }
  | { ok: false; reason: 'backend-error'; message: string }

// Backfills backendCandidateId/backendCampaignId/backendCampaignCandidateId
// for a candidate that predates the backend-link mechanism (Phase 31) or
// was otherwise never linked — demo/seed data, or a candidate whose
// original uploadCvViaBackend() call genuinely failed before any backend
// record existed. "INVIA LINK TEST" used to permanently refuse these with
// an honest "non collegato al server" error (see CvMatchDialog.tsx /
// PaginaAPage.tsx) — this is what those callers now try FIRST, so an old
// candidate can send for real without a CV re-upload. Deliberately does
// NOT touch CVs at all: POST /shortlist/:id/send-test never reads one
// (confirmed in shortlist/routes.ts — only candidate.email, the shortlist,
// and the sender config matter), so linking alone is sufficient.
//
// Same company/campaign resolution as uploadCvViaBackend() (resolveBackendLink,
// scoped to the CURRENTLY ACTIVE opening — matches Pagina A's own "Invio nel
// contesto attivo" convention, since these candidates aren't tied to one
// specific opening locally) and the SAME de-duplication rule the rest of
// the backend already uses (candidatesApi.suggestMatch by normalized
// email, OD-4) — never a second, weaker matching heuristic. A candidate
// with no email can't be de-duplicated this way (the same documented
// limitation as the offline migrate-localstorage script, MIGRATION.md §4)
// — a fresh backend Candidate is created for them rather than guessing a
// match by name. Only the backend* fields are ever written here — every
// other field on the local record (name, email, icv, scores, cvData, …)
// is left exactly as it was, preserving existing candidate/CV data.
export async function linkExistingCandidateToBackend(candidateId: string): Promise<LinkExistingCandidateResult> {
  const existing = readCandidates().find((c) => c.id === candidateId)
  if (!existing) return { ok: false, reason: 'backend-error', message: 'Candidato non trovato.' }
  if (existing.backendCampaignCandidateId) return { ok: true, candidate: existing } // already linked — idempotent, nothing to do

  const { company, opening } = getActiveOpening(readCvMatchingState())
  if (!company || !opening) return { ok: false, reason: 'no-active-opening' }

  const link = await resolveBackendLink(company.name, opening.id, opening.title)
  if (!link.ok) return { ok: false, reason: 'backend-link', message: link.message }

  try {
    const email = existing.email?.trim()
    let backendCandidateId: string
    if (email) {
      const { suggestions } = await candidatesApi.suggestMatch(email)
      backendCandidateId = suggestions[0]?.id ?? (await candidatesApi.create({ fullName: existing.name, email, source: 'ARCHIVE' })).id
    } else {
      backendCandidateId = (await candidatesApi.create({ fullName: existing.name, source: 'ARCHIVE' })).id
    }

    let campaignCandidateId: string
    try {
      campaignCandidateId = (await candidatesApi.addToCampaign(link.campaignId, backendCandidateId)).id
    } catch (err) {
      // Already in this campaign (409) — a real, legitimate case (e.g. the
      // suggest-match found an existing Candidate already enrolled here
      // through a different path) — reuse that CampaignCandidate instead
      // of treating it as a failure or creating a duplicate.
      if (!(err instanceof ApiError && err.status === 409)) throw err
      const roster = await candidatesApi.campaignRoster(link.campaignId)
      const already = roster.find((r) => r.candidateId === backendCandidateId)
      if (!already) throw err
      campaignCandidateId = already.id
    }

    const fresh = readCandidates()
    const target = fresh.find((c) => c.id === candidateId)
    if (target) {
      target.backendCandidateId = backendCandidateId
      target.backendCampaignId = link.campaignId
      target.backendCampaignCandidateId = campaignCandidateId
      writeCandidates(fresh)
    }
    return { ok: true, candidate: target ?? existing }
  } catch (err) {
    return { ok: false, reason: 'backend-error', message: apiErrorMessage(err) }
  }
}

export type ResolveCandidateCvUrlResult = { ok: true; url: string } | { ok: false; reason: 'no-cv' } | { ok: false; reason: 'error'; message: string }

// Resolves a fresh, short-lived signed download URL for a candidate's
// backend-stored CV — the SAME storage/signed-link mechanism the backend
// already exposes for every CV read (cv/routes.ts's GET /:id for the
// short-lived token + GET /:id/file for the actual bytes), not a new
// endpoint. Fetched fresh on every call rather than cached, since each
// token expires (see the backend's signFileToken()). A candidate with no
// backendCvId (no CV was ever uploaded through the backend flow for them)
// is reported as 'no-cv', not an error — there's genuinely nothing to open.
export async function resolveCandidateCvUrl(backendCvId: string | undefined): Promise<ResolveCandidateCvUrlResult> {
  if (!backendCvId) return { ok: false, reason: 'no-cv' }
  try {
    const cv = await cvApi.get(backendCvId)
    // download.url is server-relative (e.g. "/api/v1/cv/:id/file?token=…")
    // — resolving it against apiBaseUrl() takes only that base's ORIGIN
    // (a leading "/" path always replaces the base's own path per URL
    // resolution rules), so this is correct whether or not the configured
    // base URL itself already ends in "/api/v1".
    return { ok: true, url: new URL(cv.download.url, apiBaseUrl()).toString() }
  } catch (err) {
    return { ok: false, reason: 'error', message: apiErrorMessage(err) }
  }
}

// Patches ONLY the backendCvId field onto one local Candidate record, same
// fresh-read/write discipline as every other write here — used by
// uploadCvViaBackend() to record the CV's backend id once it uploads
// successfully, after the candidate row itself was already persisted.
function patchCandidateBackendCvId(candidateId: string, backendCvId: string): void {
  const candidates = readCandidates()
  const c = candidates.find((x) => x.id === candidateId)
  if (c) {
    c.backendCvId = backendCvId
    writeCandidates(candidates)
  }
}

// Patches ONLY the backendShortlistId field onto one local prescreened
// record, same fresh-read/write discipline as every other Pipeline mutation
// in lib/pipeline.ts (never trusts a value captured earlier). Exported
// (Phase 32 §4) so PaginaAPage's bulk send can reuse the exact same patch
// instead of re-implementing it inline.
export function patchPrescreenedBackendId(openingId: string, entryId: string, backendShortlistId: string): void {
  const state = readCvMatchingState()
  for (const c of state.companies) {
    const o = c.jobOpenings.find((op) => op.id === openingId)
    const rec = o?.pipeline?.prescreened.find((p) => p.id === entryId)
    if (rec) {
      rec.backendShortlistId = backendShortlistId
      writeCvMatchingState(state)
      return
    }
  }
}

// Finds a local prescreened record (any opening) already carrying a
// backendShortlistId for this candidate — set either by the auto-shortlist
// branch of uploadCvViaBackend() or a previous call to
// sendTestLinkViaBackend() below. Reused instead of calling
// POST /shortlist again (which 409s on an already-shortlisted
// campaignCandidateId — shortlistApi.add() is NOT idempotent by design,
// see shortlist/routes.ts's own uniqueness check).
function findLocalBackendShortlistId(candidateId: string): string | undefined {
  return findLocalPrescreenedEntry(candidateId)?.backendShortlistId
}

// Same traversal as findLocalBackendShortlistId() above, but returns the
// whole entry — used by Pagina A / Migliori Candidati (§5) to derive each
// candidate's dispatch-status badge (Da inviare/Inviato/Ha risposto al
// test/Non ha ancora risposto) from the SAME record Pipeline already
// maintains, rather than a second local shortlist-status store.
export function findLocalPrescreenedEntry(candidateId: string): PrescreenedEntry | undefined {
  const state = readCvMatchingState()
  for (const c of state.companies) {
    for (const o of c.jobOpenings) {
      const rec = o.pipeline?.prescreened.find((p) => p.candidateId === candidateId && p.backendShortlistId)
      if (rec) return rec
    }
  }
  return undefined
}

// Self-heals the "already shortlisted on the backend (409), no local
// record of it" case — previously a terminal failure telling the recruiter
// to "reload the page", which doesn't actually help once localStorage
// itself is what's missing the link (reloading reads the same empty
// state). The backend's own uniqueness rule (one Shortlist per
// campaignCandidateId) means the row we tried to create already exists —
// this looks it up by listing the candidate's backend campaign and
// matching on campaignCandidateId, then hands back its real id so the
// caller can proceed exactly as if POST /shortlist had just succeeded.
async function recoverShortlistIdOnConflict(
  candidateId: string,
  campaignCandidateId: string,
): Promise<{ ok: true; shortlistId: string } | { ok: false; message: string }> {
  const stillUnrecoverable = 'Candidato già in shortlist sul server, ma non è stato possibile recuperarne il riferimento — ricarica la pagina.'
  const campaignId = readCandidates().find((c) => c.id === candidateId)?.backendCampaignId
  if (!campaignId) return { ok: false, message: stillUnrecoverable }
  try {
    const rows = await shortlistApi.listByCampaign(campaignId)
    const existing = rows.find((r) => r.campaignCandidateId === campaignCandidateId)
    if (!existing) return { ok: false, message: stillUnrecoverable }
    return { ok: true, shortlistId: existing.id }
  } catch (err) {
    return { ok: false, message: apiErrorMessage(err) }
  }
}

export type AddToShortlistViaBackendResult = { ok: true; backendShortlistId: string } | { ok: false; message: string }

// Client §4 — "Selezionato per approfondimento" (Pipeline/CV Elaborati):
// flags a candidate into the real Shortlist (Migliori Candidati) WITHOUT
// sending a test yet — the distinct "Invia Lettera e Link Test" trigger
// (Pagina A / Migliori Candidati, §5) is the separate action that does
// that. Deliberately a subset of sendTestLinkViaBackend() below (same
// shortlist-creation/409-handling logic, minus the sendTest call) rather
// than that function with a flag, so a reader of either doesn't have to
// reason about a send-vs-no-send branch inside one function.
export async function addToShortlistViaBackend(candidateId: string, campaignCandidateId: string): Promise<AddToShortlistViaBackendResult> {
  try {
    let shortlistId = findLocalBackendShortlistId(candidateId)
    if (!shortlistId) {
      try {
        const shortlist = await shortlistApi.add(campaignCandidateId, 'CV_ELABORATI')
        shortlistId = shortlist.id
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 409)) throw err
        const recovered = await recoverShortlistIdOnConflict(candidateId, campaignCandidateId)
        if (!recovered.ok) return recovered
        shortlistId = recovered.shortlistId
      }
    }
    return { ok: true, backendShortlistId: shortlistId }
  } catch (err) {
    return { ok: false, message: apiErrorMessage(err) }
  }
}

export type SendTestLinkViaBackendResult = { ok: true; backendShortlistId: string } | { ok: false; message: string }

// Real replacement for CvMatchDialog's "INVIA LINK TEST" click (§9) — only
// usable for a candidate created through uploadCvViaBackend() above (i.e.
// one that actually has a backendCampaignCandidateId); the caller
// (CvMatchDialog) falls back to the pre-existing local-only
// addPrescreenedEntry() call for any candidate that doesn't, exactly as
// before this phase — see CvMatchDialog.tsx's own comment on that branch.
export async function sendTestLinkViaBackend(candidateId: string, campaignCandidateId: string): Promise<SendTestLinkViaBackendResult> {
  try {
    let shortlistId = findLocalBackendShortlistId(candidateId)
    if (!shortlistId) {
      try {
        const shortlist = await shortlistApi.add(campaignCandidateId, 'CV_ELABORATI')
        shortlistId = shortlist.id
      } catch (err) {
        // Already shortlisted on the backend (409) with no local record of
        // it (e.g. local storage was cleared, or the same candidate email
        // got de-duped onto an existing backend Candidate) — recovered by
        // looking the real row up server-side instead of dead-ending here,
        // so the send below still goes out for real.
        if (!(err instanceof ApiError && err.status === 409)) throw err
        const recovered = await recoverShortlistIdOnConflict(candidateId, campaignCandidateId)
        if (!recovered.ok) return recovered
        shortlistId = recovered.shortlistId
      }
    }
    try {
      await shortlistApi.sendTest(shortlistId)
    } catch (err) {
      // Already sent (409, status !== DA_INVIARE) — this is a real,
      // reachable case: e.g. a candidate auto-sent above-threshold during
      // upload, then re-selected on Pagina A's bulk send. The backend
      // correctly refuses a duplicate send; from the recruiter's intent
      // ("this candidate should have a test link out"), that intent is
      // already satisfied, so this is treated as idempotent success rather
      // than a failure — never a SECOND real send, just not reported as an
      // error for a state that's already correct.
      if (!(err instanceof ApiError && err.status === 409)) throw err
    }
    return { ok: true, backendShortlistId: shortlistId }
  } catch (err) {
    return { ok: false, message: apiErrorMessage(err) }
  }
}

export type SendTestLinkForCandidateResult =
  | { ok: true; backendShortlistId: string }
  | { ok: false; reason: 'missing-email' }
  | { ok: false; reason: 'unlinked'; message: string }
  // No mail provider configured on this backend (local dev only — see
  // isMailNotConfiguredError above): the real send genuinely can't go out,
  // but a real local PrescreenedEntry + testLink WAS generated (status
  // 'link_pronto'), so the caller can open the manual-send modal on it
  // immediately instead of dead-ending on a plain error.
  | { ok: false; reason: 'mail-not-configured'; message: string; entry: PrescreenedEntry }
  | { ok: false; reason: 'backend-failed'; message: string }

// Client §5 (Migliori Candidati) — the single-candidate "Invia Lettera e
// Link Test" trigger, factored out of PaginaAPage's bulk-send loop (which
// this phase's brief asks to keep working unchanged) so a per-row button
// can call the exact same real logic instead of a second implementation.
// Fresh-reads candidates itself (same discipline as every other mutation
// here) rather than trusting a value the caller captured earlier.
export async function sendTestLinkForCandidate(candidateId: string): Promise<SendTestLinkForCandidateResult> {
  const c = readCandidates().find((x) => x.id === candidateId)
  if (!c?.email) return { ok: false, reason: 'missing-email' }

  let campaignCandidateId = c.backendCampaignCandidateId
  if (!campaignCandidateId) {
    const linked = await linkExistingCandidateToBackend(c.id)
    if (!linked.ok) {
      const message = linked.reason === 'no-active-opening' ? NO_ACTIVE_OPENING_MESSAGE : linked.message
      return { ok: false, reason: 'unlinked', message }
    }
    if (!linked.candidate.backendCampaignCandidateId) return { ok: false, reason: 'unlinked', message: 'Candidato non collegato al server.' }
    campaignCandidateId = linked.candidate.backendCampaignCandidateId
  }

  const result = await sendTestLinkViaBackend(c.id, campaignCandidateId)
  if (!result.ok) {
    if (isMailNotConfiguredError(result.message)) {
      const added = addPrescreenedEntry(c.id, c.name, c.email, false, c.icv)
      if (added.ok) {
        const marked = setPrescreenStatus(added.entry.id, 'link_pronto')
        return { ok: false, reason: 'mail-not-configured', message: result.message, entry: marked.ok ? marked.entry : added.entry }
      }
    }
    return { ok: false, reason: 'backend-failed', message: result.message }
  }

  const { opening } = getActiveOpening(readCvMatchingState())
  const added = addPrescreenedEntry(c.id, c.name, c.email, true, c.icv)
  if (added.ok && opening) patchPrescreenedBackendId(opening.id, added.entry.id, result.backendShortlistId)
  return { ok: true, backendShortlistId: result.backendShortlistId }
}

export type MarkSentViaBackendResult = { ok: true } | { ok: false; message: string }

// Real replacement for the "Segna inviato" click (CvMatchDialog.tsx /
// PrescreenedList.tsx) when the entry has a backendShortlistId — mirrors
// the local setPrescreenStatus(id,'inviato') call the caller already makes
// afterward, so this only needs to make the backend call itself.
export async function markSentViaBackend(backendShortlistId: string): Promise<MarkSentViaBackendResult> {
  try {
    await shortlistApi.markSent(backendShortlistId)
    return { ok: true }
  } catch (err) {
    return { ok: false, message: apiErrorMessage(err) }
  }
}

export type LoadJobProfileResult =
  | { ok: true; jdState: JdState; profileId: string; approved: boolean; publicationLink: string | null }
  | { ok: false; reason: 'no-link' | 'not-found' | 'incompatible-shape' | 'error'; message?: string }

// Phase 32 §5 — folds the local JdState's `scopo` field (which has no
// dedicated backend column — JobProfile.header is free-form Json, see
// jobProfiles/routes.ts) into `header.scopo` rather than inventing a new
// backend column for one string field. Reversed by backendProfileToJdState
// below — round-trips exactly, nothing lost.
function jdStateToBackendPayload(jd: JdState) {
  return {
    title: jd.header.titolo || undefined,
    header: { ...jd.header, scopo: jd.scopo } as Record<string, unknown>,
    sections: jd.sections as unknown as Record<string, unknown>,
    hardSkillGroups: jd.hardSkillGroups as unknown[],
    extraRequirements: jd.extra as unknown[],
    salaryBenefits: {},
  }
}
// Guards against a JobProfile row that isn't actually JD-editor-shaped —
// this DOES happen in practice: prisma/seed.ts (Phase 30) seeds a
// JobProfile per campaign in the older, simpler `{header:{title}, sections:
// {criteria:{skills,...}}}` shape (the same one lib/types.ts's own
// JobProfile/buildDefaultJobProfile() use for match-scoring criteria), not
// the rich 13-section JdState this editor renders. Trusting an
// incompatible row here would crash the page (`sections.responsabilita.items`
// on an object that has no `responsabilita` key at all) — checked instead
// of assumed, and treated as "nothing safely loadable" rather than
// silently reinterpreting someone else's data as this editor's own.
const JD_SECTION_KEYS: (keyof JdState['sections'])[] = ['responsabilita', 'attivita', 'softSkills', 'competenzeTecniche', 'esperienza']
function isJdShapedSections(sections: unknown): sections is JdState['sections'] {
  if (!sections || typeof sections !== 'object') return false
  return JD_SECTION_KEYS.every((key) => key in (sections as Record<string, unknown>))
}

function backendProfileToJdState(profile: { header: Record<string, unknown>; sections: Record<string, unknown>; hardSkillGroups: unknown[]; extraRequirements: unknown[] }): JdState | null {
  if (!isJdShapedSections(profile.sections)) return null
  const header = profile.header as JdState['header'] & { scopo?: string }
  return {
    header,
    scopo: header.scopo || '',
    sections: profile.sections,
    hardSkillGroups: profile.hardSkillGroups as JdState['hardSkillGroups'],
    extra: profile.extraRequirements as JdState['extra'],
  }
}

// GET-on-mount for JobProfilePage (§5): returns the backend's latest
// JobProfile for the opening's linked campaign, converted to the exact
// local JdState shape the editor already renders — no UI change needed to
// consume it. 'no-link' (no CV uploaded through the backend flow for this
// opening yet) and 'not-found' (linked, but nothing saved there yet) are
// both non-error, expected states — the caller falls back to the existing
// local loadJdTemplate()/preset behavior for either.
export async function loadJobProfileFromBackend(openingId: string): Promise<LoadJobProfileResult> {
  const link = getCachedBackendLink(openingId)
  if (!link) return { ok: false, reason: 'no-link' }
  try {
    const profile = await jobProfilesApi.getForCampaign(link.campaignId)
    if (!profile) return { ok: false, reason: 'not-found' }
    const jdState = backendProfileToJdState(profile)
    if (!jdState) return { ok: false, reason: 'incompatible-shape' }
    return { ok: true, jdState, profileId: profile.id, approved: profile.approved, publicationLink: profile.publicationLink }
  } catch (err) {
    return { ok: false, reason: 'error', message: apiErrorMessage(err) }
  }
}

export type SaveJobProfileResult = { ok: true; profileId: string } | { ok: false; reason: 'no-link' | 'error'; message?: string }

export async function saveJobProfileToBackend(openingId: string, jdState: JdState): Promise<SaveJobProfileResult> {
  const link = getCachedBackendLink(openingId)
  if (!link) return { ok: false, reason: 'no-link' }
  try {
    const profile = await jobProfilesApi.save(link.campaignId, jdStateToBackendPayload(jdState))
    return { ok: true, profileId: profile.id }
  } catch (err) {
    return { ok: false, reason: 'error', message: apiErrorMessage(err) }
  }
}

export type ManualResponseResult = { ok: true } | { ok: false; message: string }

// Phase 32 §6 — real backend counterpart of Pipeline's "+ Aggiungi
// risultato" (TestResultList.tsx). Requires the shortlist entry to already
// have sent a test (a real TestInvitation must exist — see
// shortlist/routes.ts's manual-response route) — the caller falls back to
// the pre-existing local-only addTestResult() otherwise, same pattern as
// every other backend-backed action in this file.
export async function recordManualResponseViaBackend(backendShortlistId: string, score: number, note?: string): Promise<ManualResponseResult> {
  try {
    await shortlistApi.recordManualResponse(backendShortlistId, score, note)
    return { ok: true }
  } catch (err) {
    return { ok: false, message: apiErrorMessage(err) }
  }
}

export async function deleteManualResponseViaBackend(backendShortlistId: string): Promise<ManualResponseResult> {
  try {
    await shortlistApi.deleteManualResponse(backendShortlistId)
    return { ok: true }
  } catch (err) {
    return { ok: false, message: apiErrorMessage(err) }
  }
}

const SHORTLIST_STATUS_MAP: Record<BackendShortlistStatus, PrescreenStatus> = {
  DA_INVIARE: 'da_inviare',
  INVIATO: 'inviato',
  HA_RISPOSTO: 'ha_risposto',
  NON_HA_RISPOSTO: 'non_ha_risposto',
}

export type SyncRankingResult = { ok: true; updated: number } | { ok: false; message: string }

// Phase 32 §2/§8 — READ side of "backend becomes primary for match scores":
// walks every opening this browser has linked to a backend Campaign,
// fetches that campaign's real ranking (GET /cv/campaigns/:id/ranking,
// server-computed via the exact same ported AHI/match formula — see
// src/lib/scoring.ts on the backend), and overwrites each matching local
// candidate's `icv` (CV/profile match %) with the backend's authoritative
// value. Deliberately does NOT touch `scores`/`bf` (the soft-skill/Big-Five
// inputs `ahi()` needs to compute a full score) — the backend does not
// store those per-skill (only the aggregate ahiScore/fascia), and nothing
// in this codebase populates them for a CV-uploaded candidate in the first
// place (only "Segna completato" would, and Phase 8's own investigation
// found that transition is explicitly NOT implemented — still true here,
// not a gap this phase invents a fix for). So this sync keeps the existing
// local ranking()/ahi() computation completely unchanged (per the brief's
// "preserve the existing AHI/scoring/ranking logic"), it just feeds it a
// backend-verified match percentage instead of the value computed once at
// upload time and never revisited.
export async function syncRankingFromBackend(): Promise<SyncRankingResult> {
  const links = getAllCachedBackendLinks()
  if (!links.length) return { ok: true, updated: 0 }

  try {
    const candidates = readCandidates()
    let updated = 0
    for (const link of links) {
      const rows = await cvApi.ranking(link.campaignId)
      for (const row of rows) {
        const backendCandidateId = row.cv?.candidate?.id
        if (!backendCandidateId) continue
        const local = candidates.find((c) => c.id === backendCandidateId)
        if (local && local.icv !== row.matchScorePercent) {
          local.icv = row.matchScorePercent
          updated++
        }
      }
    }
    if (updated) writeCandidates(candidates)
    return { ok: true, updated }
  } catch (err) {
    return { ok: false, message: apiErrorMessage(err) }
  }
}

export type RefreshShortlistResult = { ok: true; updated: number } | { ok: false; message: string }

// §10 — "React must reflect the updated state after refresh/reload": since
// no real test-provider webhook exists to push a change, this is the
// explicit pull side of that requirement — refetches every shortlist row
// for the given backend campaign and reconciles each local prescreened
// entry's status (matched by backendShortlistId) to whatever the backend
// currently reports. Never invents a transition locally; only ever copies
// what the backend already has.
export async function refreshShortlistStatuses(backendCampaignId: string, openingId: string): Promise<RefreshShortlistResult> {
  try {
    const rows = await shortlistApi.listByCampaign(backendCampaignId)
    const state = readCvMatchingState()
    let updated = 0
    for (const c of state.companies) {
      const o = c.jobOpenings.find((op) => op.id === openingId)
      if (!o?.pipeline) continue
      for (const rec of o.pipeline.prescreened) {
        if (!rec.backendShortlistId) continue
        const row = rows.find((r) => r.id === rec.backendShortlistId)
        if (row && SHORTLIST_STATUS_MAP[row.status] !== rec.status) {
          rec.status = SHORTLIST_STATUS_MAP[row.status]
          updated++
        }
      }
    }
    if (updated) writeCvMatchingState(state)
    return { ok: true, updated }
  } catch (err) {
    return { ok: false, message: apiErrorMessage(err) }
  }
}
