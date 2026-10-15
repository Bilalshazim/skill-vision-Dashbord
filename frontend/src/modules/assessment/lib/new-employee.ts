import { getApex5dDimensions, getApexSources, getSoftSkills, uid } from '@/modules/assessment/lib/legacy-utils'
import { ensureRoleProfile } from '@/modules/assessment/lib/role-census'
import type { ApexSourceKey, AssessmentState, Employee } from '@/modules/assessment/lib/types'

export type NewEmployeeFields = Partial<Omit<Employee, 'id' | 'soft' | 'hard' | 'hardEvaluatedBy' | 'hardHistory' | 'softHistory' | 'createdAt'>> &
  Pick<Employee, 'nome' | 'cognome'>

// Un dipendente nuovo, come lo crea "Aggiungi dipendente": punteggi a zero, il
// valore atteso delle soft skill dal profilo della sua mansione (che si crea
// se manca). Modifica `state` (una copia): lo usano il modulo di inserimento e
// l'import del piano 5P, che aggiunge all'elenco le persone che non ci sono.
export function addNewEmployee(state: AssessmentState, fields: NewEmployeeFields): Employee {
  const ruolo = (fields.ruolo ?? '').trim()
  const rp = ruolo ? ensureRoleProfile(state, ruolo) : undefined
  const soft: Employee['soft'] = {}
  getSoftSkills('it').forEach((s) => {
    const weighted = rp?.skillWeights?.[s.id]
    soft[s.id] = { ottenuto: 0, atteso: weighted ? (rp?.skillExpected?.[s.id] ?? 8) : 6 }
  })
  const hard: Employee['hard'] = { resp: {}, peer: {}, auto: {} }
  getApex5dDimensions('it').forEach((d) => d.items.forEach((it) => getApexSources('it').forEach((src) => (hard[src.key as ApexSourceKey][it.cod] = 0))))
  const emp: Employee = {
    email: '',
    area: 'Unassigned',
    reparto: '',
    mansione: '',
    tipoProfilo: 'Employee',
    sesso: '',
    tipoContratto: 'dipendente',
    livelloCcnl: '',
    ral: 0,
    benefit: '',
    assenzeProgrammate: [],
    archived: null,
    feedbackNeeded: false,
    developmentPlan: { azioni: '', formazione: '', coaching: '', obiettivi: '' },
    ...fields,
    id: uid('emp'),
    ruolo,
    soft,
    hard,
    hardEvaluatedBy: { resp: '', peer: '', auto: '' },
    hardHistory: [],
    softHistory: [],
    createdAt: new Date().toISOString(),
  }
  state.employees.push(emp)
  return emp
}
