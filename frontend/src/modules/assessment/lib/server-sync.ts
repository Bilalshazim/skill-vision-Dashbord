import { assessmentApi, type ServerAssessmentState } from '@/lib/api/assessment'
import { ApiError } from '@/lib/api/client'
import { hydrate } from '@/modules/assessment/lib/storage'
import type { AssessmentState, EvalAssignment } from '@/modules/assessment/lib/types'

// Assessment sul server, passo 3 (PROGETTO-ASSESSMENT-SERVER.md §8.7). Le
// schermate continuano a restituire lo stato intero, come con localStorage;
// qui si confronta lo stato salvato sul server (`Baseline`) con quello nuovo e
// si mandano solo le parti cambiate, nell'ordine che il server richiede:
// periodi → dipendenti → mansioni → assegnazioni, poi le cancellazioni
// (assegnazioni prima dei periodi, che non si tolgono finché ne hanno).

/** Ciò che il server ha davvero: le parti mai salvate sono `null`. */
export type Baseline = ServerAssessmentState

/** Dallo stato del server allo stato completo delle schermate, e la sua base di confronto. */
export function fromServer(server: ServerAssessmentState, companyName: string): { state: AssessmentState; baseline: Baseline } {
  const baseline: Baseline = structuredClone(server)
  const state = hydrate(structuredClone({ ...server, settings: server.settings ?? undefined, analisiIniziale: server.analisiIniziale ?? undefined, company: server.company ?? undefined }))
  // Una società che non ha ancora salvato le impostazioni prende il suo nome
  // dal backend, non quello della demo.
  if (!server.settings) state.settings.companyName = companyName
  return { state, baseline }
}


/** Il motivo di un errore del server, detto in modo che si capisca. */
export function errorReason(err: unknown, offline: string): string {
  // 502–504: il server del frontend risponde ma il backend dietro no.
  if (err instanceof ApiError) return err.network || (err.status >= 502 && err.status <= 504) ? offline : err.message
  return err instanceof Error ? err.message : String(err)
}

const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b)
// Il token lo decide il server: non conta come modifica.
const assignmentBody = ({ token: _token, ...rest }: EvalAssignment) => rest
const settingsBody = (s: AssessmentState['settings'] | null, evaluators: string[]) => {
  return s ? { ...s, evaluators } : null
}

type Op = { label: string; run: (companyId: string) => Promise<unknown> }

/** Le chiamate che portano il server da `prev` a `next`, in ordine. */
export function planSync(prev: Baseline, next: AssessmentState): Op[] {
  const ops: Op[] = []

  const prevPeriods = new Map(prev.evalPeriods.map((p) => [p.id, p]))
  for (const p of next.evalPeriods) if (!same(prevPeriods.get(p.id), p)) ops.push({ label: 'periodo', run: (c) => assessmentApi.putPeriod(c, p) })

  const prevEmployees = new Map(prev.employees.map((e) => [e.id, e]))
  for (const e of next.employees) if (!same(prevEmployees.get(e.id), e)) ops.push({ label: 'dipendente', run: (c) => assessmentApi.putEmployee(c, e) })

  for (const [name, r] of Object.entries(next.roleProfiles)) {
    if (!same(prev.roleProfiles[name], r)) ops.push({ label: 'mansione', run: (c) => assessmentApi.putRoleProfile(c, name, r) })
  }

  const prevAssignments = new Map(prev.evalAssignments.map((a) => [a.id, a]))
  for (const a of next.evalAssignments) {
    const before = prevAssignments.get(a.id)
    if (!before || !same(assignmentBody(before), assignmentBody(a))) ops.push({ label: 'assegnazione', run: (c) => assessmentApi.putAssignment(c, a) })
  }

  if (!same(settingsBody(prev.settings, prev.evaluators), settingsBody(next.settings, next.evaluators)))
    ops.push({ label: 'impostazioni', run: (c) => assessmentApi.putSettings(c, next.settings, next.evaluators) })
  if (!same(prev.company, next.company)) ops.push({ label: 'profilo aziendale', run: (c) => assessmentApi.putCompanyProfile(c, next.company) })
  if (!same(prev.analisiIniziale, next.analisiIniziale)) ops.push({ label: 'intervista', run: (c) => assessmentApi.putInterview(c, next.analisiIniziale) })

  const nextAssignmentIds = new Set(next.evalAssignments.map((a) => a.id))
  for (const a of prev.evalAssignments) if (!nextAssignmentIds.has(a.id)) ops.push({ label: 'assegnazione', run: (c) => assessmentApi.deleteAssignment(c, a.id) })
  for (const name of Object.keys(prev.roleProfiles)) if (!(name in next.roleProfiles)) ops.push({ label: 'mansione', run: (c) => assessmentApi.deleteRoleProfile(c, name) })
  const nextPeriodIds = new Set(next.evalPeriods.map((p) => p.id))
  for (const p of prev.evalPeriods) if (!nextPeriodIds.has(p.id)) ops.push({ label: 'periodo', run: (c) => assessmentApi.deletePeriod(c, p.id) })
  // I dipendenti non si cancellano: si archiviano (nessuna schermata li toglie).

  return ops
}

/**
 * Esegue le chiamate una alla volta. Restituisce i token delle assegnazioni
 * nuove, che genera il server: il contesto li mette nello stato al posto di
 * quelli del browser.
 */
export async function runSync(companyId: string, prev: Baseline, next: AssessmentState): Promise<Map<string, string>> {
  const tokens = new Map<string, string>()
  for (const op of planSync(prev, next)) {
    const result = await op.run(companyId)
    const saved = result as Partial<EvalAssignment> | undefined
    if (op.label === 'assegnazione' && saved?.id && saved.token) tokens.set(saved.id, saved.token)
  }
  return tokens
}
