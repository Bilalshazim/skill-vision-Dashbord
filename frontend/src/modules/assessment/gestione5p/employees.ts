import { type State5p, cap, edit, norm, people } from '@/modules/assessment/gestione5p/model'
import { addNewEmployee } from '@/modules/assessment/lib/new-employee'
import type { AssessmentState } from '@/modules/assessment/lib/types'

// Le persone del 5P sono i dipendenti dell'anagrafica (decisione 2 del
// 2026-10-14). Ogni persona si collega al suo dipendente per email o per nome;
// chi nell'Excel non è in anagrafica si aggiunge all'elenco dei dipendenti
// (decisione del 2026-10-15). I dati di esempio del 5P non toccano l'anagrafica.
//
// Restituisce i due stati aggiornati, oppure `null` se non c'è niente da fare.
export function linkPeopleToEmployees(s5: State5p, assessment: AssessmentState): { s5: State5p; assessment: AssessmentState; added: number } | null {
  if (s5.demo) return null
  const byId = new Set(assessment.employees.map((e) => e.id))
  const todo = people(s5).filter((p) => !p.empId || !byId.has(p.empId))
  if (!todo.length) return null

  const nextA = structuredClone(assessment)
  const links = new Map<string, string>()
  let added = 0
  for (const p of todo) {
    const email = p.email.trim().toLowerCase()
    const name = norm(`${p.cog} ${p.nom}`)
    // Prima chi è in organico, poi gli archiviati: un nome che torna non crea un doppione.
    const candidates = [...nextA.employees.filter((e) => !e.archived), ...nextA.employees.filter((e) => e.archived)]
    const match =
      (email && candidates.find((e) => e.email.trim().toLowerCase() === email)) || (name && candidates.find((e) => norm(`${e.cognome} ${e.nome}`) === name))
    if (match) {
      links.set(p.id, match.id)
      continue
    }
    const emp = addNewEmployee(nextA, { cognome: cap(p.cog.trim()), nome: cap(p.nom.trim()), email: p.email.trim(), area: p.gruppo.trim() || 'Unassigned', ruolo: p.mans.trim() })
    links.set(p.id, emp.id)
    added++
  }
  const nextS5 = edit(s5, (d) => {
    for (const p of d.people) if (links.has(p.id)) p.empId = links.get(p.id)
  })
  return { s5: nextS5, assessment: added ? nextA : assessment, added }
}
