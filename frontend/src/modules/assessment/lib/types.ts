// Shapes mirror js/assessment.js's STATE exactly (loadState()/generateDemoData(),
// ~2637-2945) — not redesigned, just typed. Assessment's own storage key
// (sv_assessment_state_v1) is completely independent of every Recruiting key.

export type SoftScore = { ottenuto: number; atteso: number }
export type ApexSourceKey = 'resp' | 'peer' | 'auto'
export type HardScores = Record<ApexSourceKey, Record<string, number>>

export type Absence = { dal: string; al: string; motivo: string }

export type DevelopmentPlan = { azioni: string; formazione: string; coaching: string; obiettivi: string }

export type ArchiveInfo = { reason: string; note: string; date: string } | null

export type Employee = {
  id: string
  nome: string
  cognome: string
  email: string
  area: string
  reparto: string
  ruolo: string
  mansione: string
  tipoProfilo: string
  tipoContratto: 'dipendente' | 'cocopro' | 'partitaIva' | 'esterno'
  sesso: string
  livelloCcnl: string
  ral: number
  benefit: string
  assenzeProgrammate: Absence[]
  archived: ArchiveInfo
  soft: Record<string, SoftScore>
  hard: HardScores
  hardEvaluatedBy: { resp: string; peer: string; auto: string }
  hardHistory: HardHistoryEntry[]
  softHistory: SoftHistoryEntry[]
  feedbackNeeded: boolean
  developmentPlan: DevelopmentPlan
  createdAt?: string
  _archetype?: string
  /**
   * Per-individual Soft Skill assignment (skill ids), on top of whatever
   * role-census.ts's role-level requiredSkills already assigns. Undefined
   * means "use the role's list as-is"; once set (even to an empty array),
   * it's this specific person's own list, independent of their Ruolo AND
   * Mansione — see components/EmployeeSoftSkillModal.tsx.
   */
  softSkillOverrides?: string[]
  /** ISO timestamp of the last successful "INVIA LINK TEST" send to this employee — see components/SurveyLinkModal.tsx. */
  surveySentAt?: string
}

// Two genuinely different shapes in legacy (not a single unified snapshot):
// emp.hardHistory entries come from submitHardEval()/submitRestrictedEval()
// (js/assessment.js ~6754-6763), emp.softHistory entries from
// submitSoftEval() (~6618-6624) — different fields, no periodId on the soft
// side. Reproduced as their real shapes rather than one generic type.
export type HardHistoryEntry = {
  module: 'professional'
  periodId: string
  periodLabel: string
  date: string
  source: ApexSourceKey
  apexScore: number
  dims: { code: string; name: string; score: number }[]
}
export type SoftHistoryEntry = {
  module: 'transversal'
  date: string
  source: 'manual'
  overallOttenuto: number
  overallAtteso: number
}

// Field names match sv_assessment_state_v1's real JSON exactly (verified
// against submitCreateAssignments(), js/assessment.js ~6890-6896) —
// targetEmployeeId/templateType/completedAt, not renamed equivalents.
export type EvalAssignment = {
  id: string
  token: string
  periodId: string
  targetEmployeeId: string
  templateType: ApexSourceKey
  evaluatorName: string
  evaluatorEmail: string
  status: 'pending' | 'completed'
  createdAt: string
  completedAt: string | null
}
export type EvalPeriod = { id: string; label: string; date: string }

export type AssessmentSettings = {
  modulo: 'A' | 'B' | 'AB'
  companyName: string
  testsAcquired: number
  testsDispatched: number
  surveyLink: string
  softSkillTargets: Record<string, number>
  surveySenderMode: 'referente' | 'admin'
  adminSenderEmail: string
  actionNotes: Record<string, string>
  preTestLetter: string
  surveyEmailSubject: string
  surveyEmailBody: string
  emailApiEndpoint: string
  emailApiKey: string
}

export type CompanyContact = { label: string; name: string; email: string; phone: string }
export type CompanyLocation = { name: string; address: string; city: string }
export type CompanyProfile = {
  locations: CompanyLocation[]
  contacts: CompanyContact[]
  referente: { name: string; email: string; phone: string }
  ceo: { name: string; email: string }
  cfo: { name: string; email: string }
}

// Executive Human Capital Interview (Interview/Analisi screen). Ported from
// exiDefaultData()/exiBlankData() (js/assessment.js ~5844-5875).
export type ExiData = {
  completed: boolean
  azienda: string
  settore: string
  intervistato: string
  ruolo: number
  dipendenti: string
  data: string
  q1: number
  q1c: string
  q2: number
  q2c: string
  aree: Record<string, number>
  q3c: string
  /** 3 free-text "Altro" fields for a custom area not in the fixed 12-area list. */
  q3Altro: string[]
  q4: number
  q4c: string
  q5: number
  rischi: string[]
  q6: number
  obiettivi: string[]
  decisioni: number[]
  q7c: string
  /** 2 free-text "Altro" fields for a custom decision not in the fixed decisions list. */
  q7Altro: string[]
}

export type RoleProfile = { requiredSkills: string[]; skillWeights?: Record<string, 1 | 2 | 3>; skillExpected?: Record<string, number> }

export type AssessmentState = {
  settings: AssessmentSettings
  employees: Employee[]
  evaluators: string[]
  roleProfiles: Record<string, RoleProfile>
  evalAssignments: EvalAssignment[]
  evalPeriods: EvalPeriod[]
  analisiIniziale: ExiData
  company: CompanyProfile
}
