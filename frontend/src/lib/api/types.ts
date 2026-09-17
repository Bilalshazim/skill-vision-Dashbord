// Phase 31 §2 — response shapes for the Phase 30 backend. Narrowed to the
// fields the Recruiting frontend actually reads; the backend returns full
// Prisma rows, so these are safe subsets, not the complete DB schema.

export type BackendRole = 'PLATFORM_ADMIN' | 'COMPANY_ADMIN' | 'RECRUITER' | 'EVALUATOR' | 'HIRING_MANAGER'

export type PlatformModule = 'RECRUITING' | 'ASSESSMENT'
export type BackendCompany = { id: string; name: string; platformId: string | null; vatNumber: string | null; purchasedModules: PlatformModule[] }

export type BackendCampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED'
export type BackendCampaign = { id: string; companyId: string; name: string; status: BackendCampaignStatus; createdAt: string }

export type BackendCandidate = {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  normalizedEmail: string | null
  source: 'ARCHIVE' | 'NEW_APPLICANT' | 'MANUAL'
  cvRetentionChoice: 'TWO_YEARS' | 'SIX_MONTHS' | null
  cvRetentionExpiresAt: string | null
}

export type BackendCampaignCandidateStatus =
  | 'IN_POOL'
  | 'SHORTLISTED'
  | 'TEST_DA_INVIARE'
  | 'TEST_INVIATO'
  | 'TEST_HA_RISPOSTO'
  | 'TEST_NON_HA_RISPOSTO'
  | 'INTERVIEW'
  | 'DECISION_WON'
  | 'DECISION_LOST'

export type BackendCampaignCandidate = {
  id: string
  campaignId: string
  candidateId: string
  status: BackendCampaignCandidateStatus
  icvScore: number | null
  roleApplied: string | null
  candidate?: BackendCandidate
}

export type BackendCv = { id: string; candidateId: string; campaignId: string | null; fileId: string; status: 'UPLOADED' | 'PROCESSED' | 'ARCHIVED' }
export type BackendCvWithDownload = BackendCv & { download: { url: string; expiresAt: string } }

export type BackendFascia = 'ECCELLENTE' | 'SVILUPPABILE' | 'GAP' | 'NON_CONSIGLIATO'

export type BackendCvMatchResult = {
  id: string
  cvId: string
  campaignId: string
  matchScorePercent: number
  ahiScore: number
  fascia: BackendFascia
  hardRedFlag: boolean
  cv?: BackendCv & { candidate?: BackendCandidate }
}

export type BackendShortlistStatus = 'DA_INVIARE' | 'INVIATO' | 'HA_RISPOSTO' | 'NON_HA_RISPOSTO'
export type BackendShortlist = {
  id: string
  campaignCandidateId: string
  selectedFrom: 'CV_ELABORATI' | 'MANUAL'
  status: BackendShortlistStatus
  addedAt: string
  campaignCandidate?: BackendCampaignCandidate & { candidate: BackendCandidate }
}

export type BackendTestInvitation = {
  id: string
  shortlistId: string
  testLink: string
  sentStatus: 'PENDING' | 'SENT' | 'FAILED'
  sentAt: string | null
  provider: string | null
}

export type BackendEvaluatorRole = 'HR' | 'MANAGER' | 'DIRETTORE_HR' | 'ALTRO'
export type BackendEvaluator = { id: string; fullName: string; email: string; role: BackendEvaluatorRole; altroLabel: string | null; companyId: string | null; userId: string | null }

export type BackendEvaluation = {
  id: string
  campaignCandidateId: string
  evaluatorId: string
  status: 'DRAFT' | 'SUBMITTED'
  finalScore: number | null
  recommendation: 'PROCEDI' | 'RISERVA' | 'CONFRONTA' | 'NO' | null
  notes: string | null
  evaluator?: BackendEvaluator
}

export type BackendCandidateProfileStatus = 'DRAFT' | 'SAVED' | 'APPROVED' | 'PUBLICATION_READY' | 'PUBLISHED'
export type BackendCandidateProfile = {
  id: string
  campaignCandidateId: string
  content: Record<string, unknown>
  status: BackendCandidateProfileStatus
  publicationLink: string | null
}

export type BackendSellerCode = { id: string; code: string; label: string; active: boolean }
export type BackendCip = {
  id: string
  code: string
  year2: number
  month2: number
  sequence: number
  ownerType: 'PLATFORM' | 'COMPANY' | 'CAMPAIGN'
  ownerId: string
  status: 'ACTIVE' | 'VOIDED'
  sellerCodeId: string
  sellerCode?: BackendSellerCode
  generatedAt: string
  voidedAt: string | null
  voidReason: string | null
}
export type BackendPlatform = { id: string; name: string; status: 'PENDING' | 'ACTIVE'; activatedAt: string | null }

export type BackendSenderConfig = { id: string; companyId: string; senderType: 'COMPANY_HR' | 'SKILLVISION_ADMIN'; displayName: string; replyToEmail: string }
export type BackendEmailTemplate = { id: string; campaignId: string | null; companyId: string | null; subject: string; body: string }
export type BackendEmailServiceConfig = { id: string; providerName: string; apiEndpointUrl: string; apiKeySecretRefConfigured: true; scope: 'GLOBAL' | 'PLATFORM'; active: boolean }

// Phase 32 §5 — mirrors the frontend's role-keyed JdState 1:1 (header/
// sections/hardSkillGroups/extra->extraRequirements/salaryBenefits), scoped
// to a Campaign instead of a role (see lib/backend-link.ts). Multiple rows
// per campaign are allowed by the schema (no unique constraint) — GET
// always returns the latest.
export type BackendJobProfile = {
  id: string
  campaignId: string
  title: string | null
  header: Record<string, unknown>
  sections: Record<string, unknown>
  hardSkillGroups: unknown[]
  extraRequirements: unknown[]
  salaryBenefits: Record<string, unknown>
  createdAt: string
  approved: boolean
  approvedAt: string | null
  publicationLink: string | null
}

// Phase 32 §6 — a recruiter-entered test score (ReceivedVia.MANUAL),
// distinct from the webhook path (ReceivedVia.WEBHOOK, no real provider
// wired). Same shape either way.
export type BackendTestResponse = { id: string; testInvitationId: string; score: number | null; completedAt: string | null; receivedVia: 'WEBHOOK' | 'MANUAL' }
