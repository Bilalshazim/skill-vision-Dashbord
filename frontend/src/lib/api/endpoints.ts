// Phase 31 §2 — one typed function per backend route the Recruiting
// frontend actually calls, grouped by domain. Thin wrappers over
// apiGet/apiPost/apiPatch/apiUpload (client.ts) — no fetch() elsewhere.
import { apiDelete, apiGet, apiPatch, apiPost, apiPostAnonymous, apiRequest, apiUpload } from '@/lib/api/client'
import type {
  BackendCampaign,
  BackendCampaignCandidate,
  BackendCandidate,
  BackendCandidateProfile,
  BackendCip,
  BackendCompany,
  BackendCv,
  BackendCvMatchResult,
  BackendCvWithDownload,
  BackendEmailServiceConfig,
  BackendEmailTemplate,
  BackendEvaluation,
  BackendEvaluator,
  BackendEvaluatorRole,
  BackendJobProfile,
  BackendPlatform,
  BackendSenderConfig,
  BackendShortlist,
  BackendTestInvitation,
  BackendTestResponse,
} from '@/lib/api/types'
import type { BackendUser } from '@/lib/api/client'

export const authApi = {
  login: (email: string, password: string) => apiPostAnonymous<{ accessToken: string; refreshToken: string; user: BackendUser }>('/auth/login', { email, password }),
  me: () => apiGet<BackendUser>('/auth/me'),
}

export const platformsApi = {
  list: () => apiGet<BackendPlatform[]>('/platforms'),
  create: (name: string) => apiPost<BackendPlatform>('/platforms', { name }),
  activate: (id: string) => apiPost<BackendPlatform>(`/platforms/${id}/activate`),
}

export const companiesApi = {
  list: () => apiGet<BackendCompany[]>('/companies'),
  get: (id: string) => apiGet<BackendCompany>(`/companies/${id}`),
}

export type BackendCampaignEvaluator = {
  id: string
  fullName: string
  email: string
  role: BackendEvaluatorRole
  altroLabel: string | null
  hasLogin: boolean
  hasAccessToken: boolean
  assignedAt: string
}

export const campaignsApi = {
  list: (companyId?: string) => apiGet<BackendCampaign[]>('/campaigns', { companyId }),
  create: (companyId: string, name: string) => apiPost<BackendCampaign>('/campaigns', { companyId, name }),
  evaluatorReadiness: (campaignId: string) => apiGet<{ assignedEvaluators: number; meetsMinimum: boolean }>(`/campaigns/${campaignId}/evaluator-readiness`),
  // Phase 35 §1/§2 — the admin roster read (survives a reload; see
  // campaigns/routes.ts's own comment on why this was missing).
  evaluators: (campaignId: string) => apiGet<BackendCampaignEvaluator[]>(`/campaigns/${campaignId}/evaluators`),
}

export const candidatesApi = {
  suggestMatch: (email: string) => apiGet<{ suggestions: BackendCandidate[] }>('/candidates/suggest-match', { email }),
  create: (input: { fullName: string; email?: string; phone?: string; source?: 'ARCHIVE' | 'NEW_APPLICANT' | 'MANUAL' }) => apiPost<BackendCandidate>('/candidates', input),
  get: (id: string) => apiGet<BackendCandidate>(`/candidates/${id}`),
  setRetention: (id: string, choice: 'TWO_YEARS' | 'SIX_MONTHS') => apiPatch<BackendCandidate>(`/candidates/${id}/retention`, { cvRetentionChoice: choice }),
  updateEmail: (id: string, email: string) => apiPatch<BackendCandidate>(`/candidates/${id}/email`, { email }),
  merge: (sourceCandidateId: string, targetCandidateId: string) => apiPost<{ mergedInto: string }>('/candidates/merge', { sourceCandidateId, targetCandidateId }),
  campaignRoster: (campaignId: string, status?: string) => apiGet<BackendCampaignCandidate[]>(`/candidates/campaign/${campaignId}`, { status }),
  addToCampaign: (campaignId: string, candidateId: string, roleApplied?: string) => apiPost<BackendCampaignCandidate>(`/candidates/campaign/${campaignId}`, { candidateId, roleApplied }),
}

export const cvApi = {
  upload: (candidateId: string, file: File, campaignId?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (campaignId) form.append('campaignId', campaignId)
    return apiUpload<BackendCv>(`/cv/candidates/${candidateId}`, form)
  },
  get: (id: string) => apiGet<BackendCvWithDownload>(`/cv/${id}`),
  match: (cvId: string, input: { campaignId: string; matchScorePercent: number; softSkillScores?: Record<string, number>; bigFive?: Record<string, number>; jobProfileId?: string }) =>
    apiPost<BackendCvMatchResult>(`/cv/${cvId}/match`, input),
  ranking: (campaignId: string) => apiGet<BackendCvMatchResult[]>(`/cv/campaigns/${campaignId}/ranking`),
  retentionReview: () => apiGet<{ action: string; files: unknown[] }>('/cv/retention/review'),
}

export const shortlistApi = {
  add: (campaignCandidateId: string, selectedFrom: 'CV_ELABORATI' | 'MANUAL' = 'CV_ELABORATI') => apiPost<BackendShortlist>('/shortlist', { campaignCandidateId, selectedFrom }),
  listByCampaign: (campaignId: string, status?: string) => apiGet<BackendShortlist[]>(`/shortlist/campaign/${campaignId}`, { status }),
  sendTest: (shortlistId: string, opts?: { templateId?: string; senderConfigId?: string }) => apiPost<BackendTestInvitation>(`/shortlist/${shortlistId}/send-test`, opts || {}),
  markSent: (shortlistId: string) => apiPost<BackendShortlist>(`/shortlist/${shortlistId}/mark-sent`),
  getInvitation: (invitationId: string) => apiGet<BackendTestInvitation>(`/shortlist/invitations/${invitationId}`),
  // Phase 32 §6 — recruiter-entered test score (ReceivedVia.MANUAL), the
  // real backend counterpart of Pipeline's "+ Aggiungi risultato".
  recordManualResponse: (shortlistId: string, score: number, note?: string) => apiPost<BackendTestResponse>(`/shortlist/${shortlistId}/manual-response`, { score, note }),
  deleteManualResponse: (shortlistId: string) => apiDelete<void>(`/shortlist/${shortlistId}/manual-response`),
}

export const jobProfilesApi = {
  getForCampaign: (campaignId: string) => apiGet<BackendJobProfile | null>(`/job-profiles/campaign/${campaignId}`),
  save: (
    campaignId: string,
    input: { title?: string; header: Record<string, unknown>; sections: Record<string, unknown>; hardSkillGroups: unknown[]; extraRequirements: unknown[]; salaryBenefits: Record<string, unknown> },
  ) => apiPatch<BackendJobProfile>(`/job-profiles/campaign/${campaignId}`, input),
}

export const cipApi = {
  listSellerCodes: () => apiGet<{ id: string; code: string; label: string; active: boolean }[]>('/cip/seller-codes'),
  createSellerCode: (code: string, label: string) => apiPost('/cip/seller-codes', { code, label }),
  // CIP codes contain a literal "/" (e.g. "26/VR 09-01") — must be encoded
  // as one path segment or Express's :code param splits on it.
  get: (code: string) => apiGet<BackendCip>(`/cip/${encodeURIComponent(code)}`),
  list: (owner?: { ownerType: 'PLATFORM' | 'COMPANY' | 'CAMPAIGN'; ownerId: string }) => apiGet<BackendCip[]>('/cip', owner),
  generate: (input: { ownerType: 'PLATFORM' | 'COMPANY' | 'CAMPAIGN'; ownerId: string; sellerCodeId: string }) => apiPost<BackendCip>('/cip', input),
  void: (id: string, reason: string) => apiPost<BackendCip>(`/cip/${id}/void`, { reason }),
}

export type BackendMyAssignment = {
  campaignCandidateId: string
  campaignId: string
  campaignName: string
  companyName: string
  candidate: { id: string; fullName: string }
  status: string
  myEvaluation: BackendEvaluation | null
}

export const evaluatorsApi = {
  create: (input: { fullName: string; email: string; role: BackendEvaluatorRole; altroLabel?: string; companyId?: string; userId?: string }) =>
    apiPost<BackendEvaluator>('/evaluators', input),
  issueAccessToken: (evaluatorId: string) => apiPost<{ token: string; expiresAt: string }>(`/evaluators/${evaluatorId}/issue-access-token`),
  assignToCampaign: (campaignId: string, evaluatorId: string) => apiPost(`/evaluators/campaigns/${campaignId}/assign`, { evaluatorId }),
  submitEvaluation: (
    input: { campaignCandidateId: string; scores?: Record<string, unknown>; finalScore?: number; recommendation?: string; notes?: string },
    evaluatorToken?: string,
  ) => apiPost<BackendEvaluation>('/evaluators/evaluations', input, evaluatorToken),
  finalizeEvaluation: (evaluationId: string, evaluatorToken?: string) => apiPost<BackendEvaluation>(`/evaluators/evaluations/${evaluationId}/submit`, undefined, evaluatorToken),
  listForCampaignCandidate: (campaignCandidateId: string) => apiGet<BackendEvaluation[]>(`/evaluators/campaign-candidates/${campaignCandidateId}/evaluations`),
  // Phase 33 §4/§5 — the evaluator-facing reads (new backend routes).
  // `evaluatorToken`, when given, authorizes via X-Evaluator-Token instead
  // of the bearer JWT — apiGet has no header param, so these two go
  // through apiRequest directly to support that, mirroring apiPost's own
  // evaluatorToken parameter.
  me: (evaluatorToken?: string) => apiRequest<BackendEvaluator>('/evaluators/me', { headers: evaluatorToken ? { 'X-Evaluator-Token': evaluatorToken } : undefined }),
  myAssignments: (evaluatorToken?: string) =>
    apiRequest<BackendMyAssignment[]>('/evaluators/me/assignments', { headers: evaluatorToken ? { 'X-Evaluator-Token': evaluatorToken } : undefined }),
}

export const candidateProfilesApi = {
  upsert: (campaignCandidateId: string, content: Record<string, unknown>) => apiPost<BackendCandidateProfile>('/candidate-profiles', { campaignCandidateId, content }),
  get: (id: string) => apiGet<BackendCandidateProfile>(`/candidate-profiles/${id}`),
  approve: (id: string) => apiPost<BackendCandidateProfile>(`/candidate-profiles/${id}/approve`),
  markPublicationReady: (id: string) => apiPost<BackendCandidateProfile>(`/candidate-profiles/${id}/mark-publication-ready`),
  publish: (id: string) => apiPost<BackendCandidateProfile>(`/candidate-profiles/${id}/publish`),
}

export const emailConfigApi = {
  getSenderConfigs: (companyId: string) => apiGet<BackendSenderConfig[]>(`/email-config/companies/${companyId}/sender-config`),
  setSenderConfig: (companyId: string, input: { senderType: 'COMPANY_HR' | 'SKILLVISION_ADMIN'; displayName: string; replyToEmail: string }) =>
    apiPatch<BackendSenderConfig>(`/email-config/companies/${companyId}/sender-config`, input),
  getEmailTemplate: (campaignId: string) => apiGet<BackendEmailTemplate | null>(`/email-config/campaigns/${campaignId}/email-template`),
  setEmailTemplate: (campaignId: string, input: { companyId?: string; subject: string; body: string }) => apiPatch<BackendEmailTemplate>(`/email-config/campaigns/${campaignId}/email-template`, input),
  // Platform-admin-only — never surfaced to a company/recruiter session (§10/§19).
  getEmailServiceConfigs: () => apiGet<BackendEmailServiceConfig[]>('/email-config/admin/email-service'),
  setEmailServiceConfig: (input: { providerName: string; apiEndpointUrl: string; apiKeySecretRef: string; scope?: 'GLOBAL' | 'PLATFORM'; platformId?: string }) =>
    apiPatch<BackendEmailServiceConfig>('/email-config/admin/email-service', input),
  activateEmailServiceConfig: (id: string) => apiPost<BackendEmailServiceConfig>(`/email-config/admin/email-service/${id}/activate`),
}
