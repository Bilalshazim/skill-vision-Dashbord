import type { AssessmentState, EvalAssignment, Employee } from '@/modules/assessment/lib/types'
import { uid } from '@/modules/assessment/lib/legacy-utils'

// Il piano di valutazione 5P (Foglio 6, Roberto Feliciani): per ogni
// dipendente attivo si assegnano le tre fonti del protocollo APEX 5D —
//  - Dirigente (`resp`): il responsabile diretto (Employee.responsabileId);
//  - Peer (`peer`): N colleghi dello stesso reparto (o, senza reparto,
//    della stessa area), a rotazione: a ogni persona si danno i colleghi con
//    meno schede già assegnate, così il carico si distribuisce;
//  - Autovalutazione (`auto`): la scheda a sé stesso.
// Le schede sono EvalAssignment come quelle create a mano (stesso link con
// token). Una scheda già presente per lo stesso periodo, persona, fonte e
// valutatore non si duplica. Funzione pura: non tocca lo stato.
export const DEFAULT_PEERS = 3

const full = (e: Employee) => `${e.nome} ${e.cognome}`.trim()
const groupKey = (e: Employee) => (e.reparto || e.area || '').trim().toLowerCase()

export type EvaluationPlan = {
  assignments: EvalAssignment[]
  /** Dipendenti senza responsabile (o con responsabile archiviato): niente scheda Dirigente. */
  noManager: string[]
  /** Dipendenti con meno colleghi nel reparto di quelli richiesti. */
  fewPeers: string[]
}

export function buildEvaluationPlan(state: AssessmentState, periodId: string, peersPerPerson = DEFAULT_PEERS): EvaluationPlan {
  const active = state.employees.filter((e) => !e.archived)
  const exists = new Set(state.evalAssignments.map((a) => `${a.periodId}|${a.targetEmployeeId}|${a.templateType}|${a.evaluatorName.toLowerCase()}`))
  const load = new Map<string, number>()
  state.evalAssignments.filter((a) => a.periodId === periodId && a.templateType === 'peer').forEach((a) => load.set(a.evaluatorName.toLowerCase(), (load.get(a.evaluatorName.toLowerCase()) || 0) + 1))

  const out: EvalAssignment[] = []
  const noManager: string[] = []
  const fewPeers: string[] = []
  const now = new Date().toISOString()
  function add(target: Employee, source: 'resp' | 'peer' | 'auto', evaluator: Employee) {
    const name = full(evaluator)
    const key = `${periodId}|${target.id}|${source}|${name.toLowerCase()}`
    if (exists.has(key)) return false
    exists.add(key)
    out.push({ id: uid('assign'), templateType: source, targetEmployeeId: target.id, evaluatorName: name, evaluatorEmail: evaluator.email || '', periodId, status: 'pending', token: uid('tok'), createdAt: now, completedAt: null })
    return true
  }

  const ordered = [...active].sort((a, b) => full(a).localeCompare(full(b), 'it'))
  ordered.forEach((emp, idx) => {
    add(emp, 'auto', emp)

    const manager = active.find((e) => e.id === emp.responsabileId && e.id !== emp.id)
    if (manager) add(emp, 'resp', manager)
    else noManager.push(full(emp))

    // Già assegnati in questo periodo: il piano si può rilanciare senza duplicare né cambiare i colleghi.
    const already = state.evalAssignments.filter((x) => x.periodId === periodId && x.targetEmployeeId === emp.id && x.templateType === 'peer').map((x) => x.evaluatorName.toLowerCase())
    const key = groupKey(emp)
    const pool = key ? ordered.filter((e) => e.id !== emp.id && e.id !== manager?.id && groupKey(e) === key && !already.includes(full(e).toLowerCase())) : []
    // Rotazione: si parte dal collega dopo di lui nell'elenco e si prendono i meno carichi.
    const rotated = pool.map((e) => ({ e, order: (ordered.indexOf(e) - idx + ordered.length) % ordered.length }))
    rotated.sort((a, b) => (load.get(full(a.e).toLowerCase()) || 0) - (load.get(full(b.e).toLowerCase()) || 0) || a.order - b.order)
    const need = Math.max(0, peersPerPerson - already.length)
    const chosen = rotated.slice(0, need).map((x) => x.e)
    if (chosen.length < need) fewPeers.push(full(emp))
    chosen.forEach((peer) => {
      if (add(emp, 'peer', peer)) load.set(full(peer).toLowerCase(), (load.get(full(peer).toLowerCase()) || 0) + 1)
    })
  })
  return { assignments: out, noManager, fewPeers }
}
