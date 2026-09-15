import candidatesSeed from '@/modules/recruiting/data/candidates-seed.json'
import cvMatchingStateSeed from '@/modules/recruiting/data/cv-matching-state-seed.json'
import type { InterviewProtocolState } from '@/modules/recruiting/lib/interview-protocol-types'
import type { JdState, SalaryBenefitsRecord } from '@/modules/recruiting/lib/jd-types'
import type { Candidate, CvMatchingState, SurveyState } from '@/modules/recruiting/lib/types'

// Data-access boundary for Recruiting. Reads the exact same keys the
// legacy app persists to (see modules/recruiting.html
// _candidatesStateKey()/_cvStateKey()), so a recruiter's real saved data
// (candidate imports, pipeline progress) shows up identically here — this
// is the same underlying data, not a copy that can drift.
//
// If a key is empty (nothing persisted yet — persistCandidates()/
// persistCvMatchingState() are only called on a *mutation* in the legacy
// app, never on initial boot), we fall back to a verbatim copy of the same
// embedded seed data modules/recruiting.html initializes CANDIDATES/
// CV_MATCHING_STATE with, so a fresh install's Home dashboard shows the
// same numbers the legacy Home dashboard shows on a fresh load.
//
// NOTE: this intentionally does not implement SANDBOX_MODE (the legacy
// `?sandbox=1` query param, which switches to a separate, empty dataset
// under different keys) — out of scope for the phases migrated so far.
//
// WRITES: through Phase 6 this file was read-only. Phase 7 adds exactly one
// write primitive, writeCvMatchingState() — the sole place in the whole
// frontend that calls localStorage.setItem for CV_STATE_KEY, mirroring
// persistCvMatchingState() (modules/recruiting.html ~1615-1617) exactly:
// same key, same {companies, activeContext} shape. It is a raw persist
// primitive only — callers (see lib/pipeline.ts addPrescreenedEntry) are
// responsible for reading fresh state, applying the legacy-compatible
// mutation, and handling failures; this function does not swallow errors
// (unlike legacy's silent try/catch), so a write failure is observable.
//
// PHASE 13 adds the second (and, so far, last) write primitive,
// writeCandidates() — the sole place that calls localStorage.setItem for
// CANDIDATES_KEY, mirroring persistCandidates() (modules/recruiting.html
// ~1501-1503) exactly: same key, same whole-array shape. Same raw-persist-
// only discipline — see lib/candidates.ts setCandidateEmail() for the
// caller that reads fresh, mutates, and handles failures.
//
// PHASE 18 (Profilo di Lavoro / JD) adds three more, all in the same
// raw-persist-only style: writeJdTemplates() (apex5d_jd_templates, mirrors
// saveJdTemplateForRole(), modules/recruiting.html ~5627-5644),
// writeJobPostingSummaries() (apex5d_job_postings_summaries — the JD save
// action's own real cross-write, see lib/jd.ts saveJdTemplate()), and
// writeSalaryBenefits() (apex5d_salary_benefits, mirrors saveSalForm()/
// clearSalForm(), ~4407-4473) — a separate sub-feature's own key, never
// merged with the JD templates store. None of these three interact with
// CV_STATE_KEY/CANDIDATES_KEY in any way (verified in the Phase 17 audit).
//
// PHASE 20 (Profilo della ricerca hub) adds readSurveyState()/
// writeSurveyState() (apex5d_survey_state, mirrors loadSurveyLinkState()/
// persistSurveyLinkState(), ~2704-2718). It reuses readJobPostingSummaries()/
// writeJobPostingSummaries() above as-is for its own Job Posting summary
// field — confirmed (Phase 19) to be the exact same key JD's save action
// writes, last-writer-wins, no separate key ever created for it. The Job
// Posting URL itself (CONFIG.jobPostings[currentRole]) is NOT added here:
// exhaustively re-verified (Phase 19 and again at the start of Phase 20)
// that legacy never persists it to any storage key — it stays a plain
// in-memory React state in profile-hub/JobPostingSection.tsx, matching
// legacy's own un-persisted CONFIG.jobPostings object exactly.

const CANDIDATES_KEY = 'skillvision_candidates_data'
const CV_STATE_KEY = 'apex5d_cv_matching_state'
const JD_TEMPLATES_KEY = 'apex5d_jd_templates'
const JOB_POSTING_SUMMARIES_KEY = 'apex5d_job_postings_summaries'
const SALARY_BENEFITS_KEY = 'apex5d_salary_benefits'
const SURVEY_STATE_KEY = 'apex5d_survey_state'
const INTERVIEW_PROTOCOL_KEY = 'apex5d_interview_protocol'

export function readCandidates(): Candidate[] {
  try {
    const raw = localStorage.getItem(CANDIDATES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed as Candidate[]
    }
  } catch {
    /* fall through to seed */
  }
  return candidatesSeed as unknown as Candidate[]
}

export function readCvMatchingState(): CvMatchingState {
  try {
    const raw = localStorage.getItem(CV_STATE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.companies) && parsed.companies.length) {
        return {
          companies: parsed.companies,
          activeContext: parsed.activeContext || cvMatchingStateSeed.activeContext,
        }
      }
    }
  } catch {
    /* fall through to seed */
  }
  return cvMatchingStateSeed as CvMatchingState
}

// Ported verbatim from persistCvMatchingState() (modules/recruiting.html
// ~1615-1617) — same key, same shape (only companies + activeContext are
// persisted, matching legacy exactly). Throws on failure instead of
// swallowing it, per Phase 7's error-handling requirement — the caller
// decides how to surface that to the user.
export function writeCvMatchingState(state: CvMatchingState): void {
  localStorage.setItem(CV_STATE_KEY, JSON.stringify({ companies: state.companies, activeContext: state.activeContext }))
}

// Ported verbatim from persistCandidates() (modules/recruiting.html
// ~1501-1503) — same key, same shape (the whole CANDIDATES array,
// re-serialized). Throws on failure instead of swallowing it, same as
// writeCvMatchingState() above — the caller decides how to surface that.
export function writeCandidates(candidates: Candidate[]): void {
  localStorage.setItem(CANDIDATES_KEY, JSON.stringify(candidates))
}

export function readJdTemplates(): Record<string, JdState> {
  try {
    const raw = localStorage.getItem(JD_TEMPLATES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed as Record<string, JdState>
    }
  } catch {
    /* fall through to empty */
  }
  return {}
}

// Ported verbatim from the `localStorage.setItem('apex5d_jd_templates', ...)`
// call inside saveJdTemplateForRole() (modules/recruiting.html line 5635) —
// same key, same shape (the whole per-role template map, re-serialized).
export function writeJdTemplates(templates: Record<string, JdState>): void {
  localStorage.setItem(JD_TEMPLATES_KEY, JSON.stringify(templates))
}

export function readJobPostingSummaries(): Record<string, string> {
  try {
    const raw = localStorage.getItem(JOB_POSTING_SUMMARIES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed as Record<string, string>
    }
  } catch {
    /* fall through to empty */
  }
  return {}
}

// Ported verbatim from the `localStorage.setItem('apex5d_job_postings_summaries', ...)`
// call inside saveJdTemplateForRole() (modules/recruiting.html line 5640) —
// JD's own real cross-write, see lib/jd.ts saveJdTemplate().
export function writeJobPostingSummaries(summaries: Record<string, string>): void {
  localStorage.setItem(JOB_POSTING_SUMMARIES_KEY, JSON.stringify(summaries))
}

export function readSalaryBenefits(): Record<string, SalaryBenefitsRecord> {
  try {
    const raw = localStorage.getItem(SALARY_BENEFITS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed as Record<string, SalaryBenefitsRecord>
    }
  } catch {
    /* fall through to empty */
  }
  return {}
}

// Ported verbatim from persistSalaryBenefitsState() (modules/recruiting.html
// ~4411-4413) — same key, same shape (the whole per-role salary/benefits
// map). A separate sub-feature from JD templates — never merge the two.
export function writeSalaryBenefits(records: Record<string, SalaryBenefitsRecord>): void {
  localStorage.setItem(SALARY_BENEFITS_KEY, JSON.stringify(records))
}

export function readSurveyState(): SurveyState {
  try {
    const raw = localStorage.getItem(SURVEY_STATE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        return { surveyLink: parsed.surveyLink || '', surveyLinks: parsed.surveyLinks && typeof parsed.surveyLinks === 'object' ? parsed.surveyLinks : {} }
      }
    }
  } catch {
    /* fall through to empty */
  }
  return { surveyLink: '', surveyLinks: {} }
}

// Ported verbatim from persistSurveyLinkState() (modules/recruiting.html
// ~2704-2709) — same key, same {surveyLink, surveyLinks} shape.
export function writeSurveyState(state: SurveyState): void {
  localStorage.setItem(SURVEY_STATE_KEY, JSON.stringify(state))
}

// PHASE 21 (Protocollo di Intervista) — mirrors loadInterviewProtocolState()/
// persistInterviewProtocolState() (modules/recruiting.html ~4393-4401)
// exactly: one key, all 3 forms (verbale/valutazione/report) share it,
// each keyed by currentRole within its own sub-object. This is the ONLY
// place in the frontend that touches INTERVIEW_PROTOCOL_KEY — every
// Protocollo component goes through lib/interview-protocol.ts, which calls
// these two primitives, never localStorage directly.
export function readInterviewProtocol(): InterviewProtocolState {
  try {
    const raw = localStorage.getItem(INTERVIEW_PROTOCOL_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        return {
          verbale: parsed.verbale && typeof parsed.verbale === 'object' ? parsed.verbale : {},
          valutazione: parsed.valutazione && typeof parsed.valutazione === 'object' ? parsed.valutazione : {},
          report: parsed.report && typeof parsed.report === 'object' ? parsed.report : {},
        }
      }
    }
  } catch {
    /* fall through to empty */
  }
  return { verbale: {}, valutazione: {}, report: {} }
}

export function writeInterviewProtocol(state: InterviewProtocolState): void {
  localStorage.setItem(INTERVIEW_PROTOCOL_KEY, JSON.stringify(state))
}
