import { buildJdStateFromPreset, generateJobPostingSummary, loadJdTemplate } from '@/modules/recruiting/lib/jd'
import { readJobPostingSummaries, readSurveyState, writeJobPostingSummaries, writeSurveyState } from '@/modules/recruiting/lib/storage'

// Domain logic behind /recruiting/profile (the "Profilo della ricerca" hub —
// nav-labeled "Report", modules/recruiting.html #scr-profilo). Migrated
// per the Phase 19 audit's boundary (Phase 20 scope: hub shell, Profilo
// Candidato bridge, Soft Skill read-only, Survey Link, Job Posting —
// Protocollo di Intervista/Area Valutatore stays deferred to Phase 21).
//
// Every write here follows the same fresh-read -> mutate one role's entry
// -> persist-the-whole-map discipline as jd.ts/pipeline.ts.

// Ported verbatim from isValidUrl() (modules/recruiting.html line 2703/4306
// — defined twice, identically, in legacy; reproduced once here). Shared by
// both the Survey Link and Job Posting dialogs, same as legacy.
export function isValidUrl(u: string): boolean {
  try {
    const x = new URL(u)
    return x.protocol === 'http:' || x.protocol === 'https:'
  } catch {
    return false
  }
}

// Ported from setSurveyLink()/loadSurveyForRole() (modules/recruiting.html
// ~2731-2757). Legacy keeps `CONFIG.surveyLink` (a "current" scratch value)
// in sync with `CONFIG.surveyLinks[currentRole]` on every read/write; with
// this migration's single fixed role the two are always equivalent, so
// reads here go straight to the role-keyed map.
export function loadSurveyLink(role: string): string {
  return readSurveyState().surveyLinks[role] || ''
}

// Ported verbatim from setSurveyLink() (modules/recruiting.html ~2731-2739)
// — always overwrites the top-level `surveyLink` mirror with the trimmed
// value (even '' when clearing), and only conditionally writes/deletes the
// role-keyed entry. Reproduced exactly rather than simplified to one field,
// for storage-shape fidelity (Step 15 — unrelated role entries must survive
// a save/clear for THIS role).
export function saveSurveyLink(role: string, url: string): void {
  const v = (url || '').trim()
  const state = readSurveyState()
  state.surveyLink = v
  if (v) state.surveyLinks[role] = v
  else delete state.surveyLinks[role]
  writeSurveyState(state)
}

// Ported from clearSvUrl() (modules/recruiting.html ~4374-4378), which
// simply calls setSurveyLink('').
export function clearSurveyLink(role: string): void {
  saveSurveyLink(role, '')
}

export function loadJobPostingSummary(role: string): string {
  return readJobPostingSummaries()[role] || ''
}

// Ported from the generateJobPostingFromJd(jdState) call inside
// openJobPosting() (modules/recruiting.html ~5589/4322) — legacy reads
// whatever the in-memory JD editor global happens to hold at that moment
// (possibly unsaved edits). This migration has no cross-page in-memory JD
// state to read (JobProfilePage owns its own local state, gone once you
// navigate away), so this falls back to the persisted template for the
// role — the same substitution JobProfilePage.tsx already documents for its
// own mount-time load, applied here for consistency rather than invented
// fresh.
export function generateJobPostingPreview(role: string): string {
  const jdState = loadJdTemplate(role) || buildJdStateFromPreset('sam')
  return generateJobPostingSummary(jdState)
}

// Ported verbatim from publishJpSummary() (modules/recruiting.html
// ~4345-4354) — UNLIKE every other "save" in this migration, an empty
// submission is refused outright (nothing persisted, nothing deleted)
// rather than deleting any existing record. Legacy has no "clear summary"
// action at all — do not invent one.
export function saveJobPostingSummary(role: string, text: string): { ok: boolean } {
  const txt = (text || '').trim()
  if (!txt) return { ok: false }
  const summaries = readJobPostingSummaries()
  summaries[role] = txt
  writeJobPostingSummaries(summaries)
  return { ok: true }
}
