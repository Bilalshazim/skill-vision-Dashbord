import { DEFAULT_MATCH_THRESHOLD, DEFAULT_ROLE } from '@/modules/recruiting/lib/constants'
import { createCandidateFromCv } from '@/modules/recruiting/lib/candidates'
import { addCandidateToPool, addPrescreenedEntry, buildDefaultJobProfile, getActiveOpening } from '@/modules/recruiting/lib/pipeline'
import { readCvMatchingState } from '@/modules/recruiting/lib/storage'
import type { JobProfile } from '@/modules/recruiting/lib/types'

// Migrated from modules/recruiting.html's single-CV upload flow
// (runPipeline(), ~3165-3234) plus the pure CV/Job-Profile matching it
// depends on (matchCandidateToProfile()/extractCvSignals()/toStringArray(),
// ~1662-1737). This is the REAL upload path behind the "Tocca per caricare
// un CV" drop zone — NOT the same as the separate, redundant
// "Parse CV & Match" button (parseAndMatchCurrentCv()), which this phase's
// audit found depends on the permanently-dead `UPLOADED_CVS` array and is
// therefore left as a legacy bridge rather than reproduced here (see
// cv-export/CvExportPage.tsx's own note on that decision).

// Ported verbatim from normalizeText() (modules/recruiting.html ~1658-1660)
// — NOT the same function as lib/ask.ts's own normalizeText() (Ask's strips
// only accented vowels; this one strips every non-alphanumeric run to a
// single space). Legacy genuinely has two differently-behaved functions
// with the same name in two different parts of the file — verified by
// reading both definitions — so this is named differently here to avoid
// conflating them.
function normalizeMatchText(value: unknown): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Ported verbatim from toStringArray() (modules/recruiting.html ~1662-1666).
function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(/[,;|]/).map((v) => v.trim()).filter(Boolean)
  return []
}

// Ported from the generic shape extractCvSignals() actually reads (modules/
// recruiting.html ~1668-1700) — every field is optional because legacy's
// own function is duck-typed to accept several possible parsed-CV shapes,
// even though the ONLY current caller (buildSimulatedCvData(), below) only
// ever populates name/skills/experienceYears/education/certifications/
// summary. Typed broadly here rather than narrowed to just that one
// caller's shape, so this stays a faithful, independently reusable port of
// the actual function rather than one silently specialized to its single
// current call site.
export type CvParseData = {
  name?: string
  summary?: string
  objective?: string
  profile?: string
  experienceText?: string
  rawText?: string
  text?: string
  experience?: string[]
  skills?: string[] | string
  experienceYears?: number
  education?: string
  certifications?: string[]
}

export type SimulatedCvData = CvParseData & { name: string; skills: string[]; experienceYears: number; education: string; certifications: string[]; summary: string }

export type CvSignals = { skills: string[]; experienceYears: number; education: string; certifications: string[] }

// Ported verbatim from extractCvSignals() (modules/recruiting.html
// ~1668-1700) — derives comparable signals from a parsed-CV-shaped object.
// `rawText` is assembled from every text-bearing field the real function
// checks (not just skills) — reproduced in full even though the one actual
// caller in this codebase only ever populates `summary` and `skills` of
// that list, since this is exported as an independently reusable, faithful
// port of the real function, not narrowed to today's single caller.
export function extractCvSignals(cvData: CvParseData | undefined, dynamicJobProfile: JobProfile | undefined): CvSignals {
  const profile = dynamicJobProfile || buildDefaultJobProfile(DEFAULT_ROLE)
  const requiredSkills = toStringArray(profile?.criteria?.skills || [])
  const rawText = [
    cvData?.summary,
    cvData?.objective,
    cvData?.profile,
    cvData?.experienceText,
    cvData?.rawText,
    cvData?.text,
    Array.isArray(cvData?.experience) ? cvData.experience.join(' ') : '',
    Array.isArray(cvData?.skills) ? cvData.skills.join(' ') : typeof cvData?.skills === 'string' ? cvData.skills : '',
  ]
    .filter(Boolean)
    .join(' ')
  const normalizedText = normalizeMatchText(rawText)
  const candidateSkills = toStringArray(cvData?.skills || [])
  const detectedSkills = [...new Set([...candidateSkills, ...requiredSkills.filter((skill) => normalizedText.includes(normalizeMatchText(skill)))])]
  const explicitYears = Number(cvData?.experienceYears)
  const parsedYears = Number.isFinite(explicitYears) ? explicitYears : 0

  return {
    skills: detectedSkills,
    experienceYears: Number(parsedYears || 0),
    education: cvData?.education || '',
    certifications: toStringArray(cvData?.certifications || []),
  }
}

export type MatchResult = {
  scorePercent: number
  breakdown: { skills: number; experience: number; education: number; certifications: number }
  matchedSkills: string[]
  candidateSignals: CvSignals
  profileId: string | null
  profileName: string
}

// Ported verbatim from matchCandidateToProfile() (modules/recruiting.html
// ~1702-1737) — a REAL, deterministic scoring function (not random): given
// CV signals and a job profile's criteria/weighting, it computes a weighted
// 0-100 match score. Only its INPUT (the simulated CV data) is fabricated —
// this computation itself is genuine and re-verified from current source
// this phase, not assumed unchanged from Phase 15's audit.
export function matchCandidateToProfile(cvData: CvParseData, dynamicJobProfile: JobProfile | undefined): MatchResult {
  const profile = dynamicJobProfile || buildDefaultJobProfile(DEFAULT_ROLE)
  const criteria = profile?.criteria || {}
  const weights = profile?.weighting || {}
  const signals = extractCvSignals(cvData, profile)
  const requiredSkills = toStringArray(criteria.skills || [])
  const matchedSkills = requiredSkills.filter((skill) => signals.skills.some((item) => normalizeMatchText(item) === normalizeMatchText(skill)))
  const skillScore = requiredSkills.length ? (matchedSkills.length / requiredSkills.length) * 100 : 100
  const experienceTarget = Number(criteria.experienceYears || 0)
  const experienceScore = experienceTarget > 0 ? Math.min(100, (signals.experienceYears / experienceTarget) * 100) : 100
  const educationTarget = criteria.education ? String(criteria.education).trim() : ''
  const educationScore = educationTarget ? (signals.education && normalizeMatchText(signals.education).includes(normalizeMatchText(educationTarget)) ? 100 : 0) : 100
  const requiredCerts = toStringArray(criteria.certifications || [])
  const certificationScore = requiredCerts.length
    ? (signals.certifications.filter((cert) => requiredCerts.some((req) => normalizeMatchText(cert) === normalizeMatchText(req))).length / requiredCerts.length) * 100
    : 100

  const skillWeight = Number(weights.skills ?? 0.5)
  const experienceWeight = Number(weights.experience ?? 0.25)
  const educationWeight = Number(weights.education ?? 0.15)
  const certWeight = Number(weights.certifications ?? 0.1)
  const totalWeight = skillWeight + experienceWeight + educationWeight + certWeight || 1
  const scorePercent = Math.round((skillScore * skillWeight + experienceScore * experienceWeight + educationScore * educationWeight + certificationScore * certWeight) / totalWeight)

  return {
    scorePercent,
    breakdown: {
      skills: Math.round(skillScore),
      experience: Math.round(experienceScore),
      education: Math.round(educationScore),
      certifications: Math.round(certificationScore),
    },
    matchedSkills,
    candidateSignals: signals,
    profileId: profile.id || null,
    profileName: profile.title || 'Job Profile',
  }
}

// Ported verbatim from the simulated-CV-input literal inside runPipeline()
// (modules/recruiting.html ~3198-3205) — DEMO DATA, not real ML parsing.
// `experienceYears` is the ONE place this whole flow genuinely calls
// Math.random() (2 to 8 years) — reproduced exactly, not omitted or made
// deterministic, per this phase's explicit instruction to be honest about
// where randomness really exists in current source.
// Exported (Phase 31 §6) so lib/backend-sync.ts's real backend upload flow
// can feed the SAME simulated signals into the real, persisted AHI/match
// computation this phase adds server-side — nothing about the simulation
// itself changes; only where its output goes now differs (see
// backend-sync.ts's own header for why the underlying CV parsing is still
// honestly disclosed as simulated, not upgraded to real OCR/ML by this phase).
export function buildSimulatedCvData(): SimulatedCvData {
  return {
    name: 'Nuovo candidato (da CV)',
    skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'AWS'],
    experienceYears: 2 + Math.floor(Math.random() * 7),
    education: 'Bachelor',
    certifications: ['AWS'],
    summary: 'Imported from the CV workflow using the current job profile.',
  }
}

export type UploadCvResult =
  | { ok: true; candidateName: string; icv: number; companyName: string; openingTitle: string; autoSent: boolean }
  | { ok: false; reason: 'no-active-opening' }
  | { ok: false; reason: 'storage-unavailable'; message: string }

// PHASE 16 ORCHESTRATION — reproduces runPipeline()'s complete post-parsing
// sequence (modules/recruiting.html ~3196-3229): create the CANDIDATES
// record, insert it into the active opening's pool (which also performs the
// sourceTag/campaignId cross-sync — see addCandidateToPool()), then
// conditionally auto-dispatch prescreening exactly like legacy's own
// threshold check. Each step is its own fresh-read/write via the already-
// proven domain functions (createCandidateFromCv/addCandidateToPool/
// addPrescreenedEntry) — nothing here mutates a shared in-memory object
// across steps the way legacy's single `nc` reference does; since this
// entire sequence is synchronous, the net persisted result is identical.
//
// No `target` is passed to addPrescreenedEntry() — CV & Export uses
// activeContext, not a Pipeline-style local selector (Phase 15 finding),
// so the same activeContext-fallback path CvMatchDialog/Pagina A already
// use is correct here too.
export function uploadCvToActiveOpening(file: File | null): UploadCvResult {
  const state = readCvMatchingState()
  const { company, opening } = getActiveOpening(state)
  if (!company || !opening) return { ok: false, reason: 'no-active-opening' }

  const parsedCv = buildSimulatedCvData()
  const jobProfile = opening.jobProfile || buildDefaultJobProfile(DEFAULT_ROLE)
  const matchResult = matchCandidateToProfile(parsedCv, jobProfile)

  const created = createCandidateFromCv({
    icv: matchResult.scorePercent,
    fileName: file?.name,
    fileUrl: file ? URL.createObjectURL(file) : undefined,
  })
  if (!created.ok) return created

  addCandidateToPool({
    id: created.candidate.id,
    name: created.candidate.name,
    cvData: parsedCv,
    match: matchResult,
    source: 'cv-pipeline',
  })

  let autoSent = false
  if (matchResult.scorePercent >= DEFAULT_MATCH_THRESHOLD) {
    addPrescreenedEntry(created.candidate.id, created.candidate.name, '', true, matchResult.scorePercent)
    autoSent = true
  }

  return {
    ok: true,
    candidateName: created.candidate.name,
    icv: matchResult.scorePercent,
    companyName: company.name,
    openingTitle: opening.title,
    autoSent,
  }
}
