// Assessment sul server (PROGETTO-ASSESSMENT-SERVER.md §8.4): una funzione per
// rotta di backend/src/modules/assessment/routes.ts. Le risorse viaggiano nella
// forma del browser (AssessmentState): la traduzione verso le tabelle la fa il
// backend (shape.ts).
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api/client'
import type { AssessmentSettings, AssessmentState, CompanyProfile, EvalAssignment, EvalPeriod, Employee, ExiData, RoleProfile } from '@/modules/assessment/lib/types'

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
}
