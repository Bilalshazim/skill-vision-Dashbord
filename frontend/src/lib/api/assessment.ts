// Assessment sul server (PROGETTO-ASSESSMENT-SERVER.md §8.4): una funzione per
// rotta di backend/src/modules/assessment/routes.ts. Le risorse viaggiano nella
// forma del browser (AssessmentState): la traduzione verso le tabelle la fa il
// backend (shape.ts).
import { apiDelete, apiGet, apiGetAnonymous, apiPost, apiPostAnonymous, apiPut } from '@/lib/api/client'
import type { ApexSourceKey, AssessmentSettings, AssessmentState, CompanyProfile, EvalAssignment, EvalPeriod, Employee, ExiData, RoleProfile } from '@/modules/assessment/lib/types'

/** Lo stato come lo restituisce il server: le parti mai salvate sono `null`. */
export type ServerAssessmentState = Omit<AssessmentState, 'settings' | 'analisiIniziale' | 'company'> & {
  settings: AssessmentSettings | null
  analisiIniziale: ExiData | null
  company: CompanyProfile | null
}

export type AssessmentImportReport = {
  dryRun: boolean
  employees: number
  periods: number
  roleProfiles: number
  assignments: number
  skipped: { what: string; id: string; reason: string }[]
}

/** Il link del valutatore esterno: solo ciò che serve al modulo. */
export type PublicEvaluation =
  | { status: 'completed'; completedAt: string | null }
  | {
      status: 'pending'
      completedAt: null
      source: ApexSourceKey
      evaluatorName: string
      periodLabel: string
      employee: { nome: string; cognome: string }
      scores: Record<string, number>
      notes: Record<string, string>
    }

/** Il token di un'assegnazione emesso dal server (32 byte in base64url). Quello del browser non apre il link. */
export const isServerToken = (token: string) => /^[A-Za-z0-9_-]{43}$/.test(token)

const base = (companyId: string) => `/assessment/companies/${encodeURIComponent(companyId)}`
const id = (s: string) => encodeURIComponent(s)

export const assessmentApi = {
  state: (companyId: string) => apiGet<ServerAssessmentState>(`${base(companyId)}/state`),
  putEmployee: (companyId: string, e: Employee) => apiPut<Employee>(`${base(companyId)}/employees/${id(e.id)}`, e),
  putPeriod: (companyId: string, p: EvalPeriod) => apiPut<EvalPeriod>(`${base(companyId)}/periods/${id(p.id)}`, p),
  deletePeriod: (companyId: string, periodId: string) => apiDelete<void>(`${base(companyId)}/periods/${id(periodId)}`),
  putRoleProfile: (companyId: string, roleName: string, r: RoleProfile) => apiPut<RoleProfile>(`${base(companyId)}/role-profiles/${id(roleName)}`, r),
  deleteRoleProfile: (companyId: string, roleName: string) => apiDelete<void>(`${base(companyId)}/role-profiles/${id(roleName)}`),
  putAssignment: (companyId: string, a: EvalAssignment) => apiPut<EvalAssignment>(`${base(companyId)}/assignments/${id(a.id)}`, a),
  deleteAssignment: (companyId: string, assignmentId: string) => apiDelete<void>(`${base(companyId)}/assignments/${id(assignmentId)}`),
  putSettings: (companyId: string, settings: AssessmentSettings, evaluators: string[]) => apiPut<void>(`${base(companyId)}/settings`, { ...settings, evaluators }),
  putCompanyProfile: (companyId: string, profile: CompanyProfile) => apiPut<void>(`${base(companyId)}/company-profile`, profile),
  putInterview: (companyId: string, data: ExiData) => apiPut<void>(`${base(companyId)}/interview`, data),
  importState: (companyId: string, state: AssessmentState, dryRun: boolean) => apiPost<AssessmentImportReport>(`${base(companyId)}/import`, { state, dryRun }),
  resetDemo: (companyId: string) => apiPost<void>(`${base(companyId)}/reset`),
  /** Invio del link al test: il testo con {{NOME}} e {{LINK}}, li riempie il server per ogni destinatario. */
  sendInvitations: (companyId: string, employeeIds: string[], subject: string, body: string) =>
    apiPost<{ results: { id: string; email: string; success: boolean; error?: string }[] }>(`${base(companyId)}/invitations`, { employeeIds, subject, body }),
  // Pubbliche, senza accesso: il token è la credenziale.
  publicEvaluation: (token: string) => apiGetAnonymous<PublicEvaluation>(`/public/assessment-evaluations/${id(token)}`),
  submitPublicEvaluation: (token: string, scores: Record<string, number>, notes: Record<string, string>) =>
    apiPostAnonymous<{ status: 'completed'; completedAt: string }>(`/public/assessment-evaluations/${id(token)}`, { scores, notes }),
}
