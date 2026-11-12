import assert from 'node:assert/strict'
import { test } from 'node:test'

import { type CreateEmployee, planImport, readSheet } from './anagrafica-import.ts'
import type { AssessmentState, Employee } from './types.ts'

// L'importazione dell'anagrafica da Excel (Decisioni di Roberto del 2026-11-12): lettura delle
// colonne, controlli riga per riga, riconoscimento per email, probabili doppioni, RAL solo per gli
// amministratori, mansioni nuove. Il salvataggio (tutto o niente) è sul server.

const person = (over: Partial<Employee>): Employee =>
  ({ id: 'e-' + (over.email ?? over.nome), nome: 'Mario', cognome: 'Rossi', email: '', area: 'Area', reparto: '', ruolo: 'Addetto vendite', mansione: '', tipoProfilo: 'Employee', tipoContratto: 'dipendente', sesso: 'M', livelloCcnl: '', ral: 30000, benefit: '', assenzeProgrammate: [], archived: null, soft: { a1: { ottenuto: 7, atteso: 6 } }, hard: { resp: {}, peer: {}, auto: {} }, hardEvaluatedBy: { resp: '', peer: '', auto: '' }, hardHistory: [], softHistory: [], feedbackNeeded: false, developmentPlan: { azioni: '', formazione: '', coaching: '', obiettivi: '' }, ...over }) as Employee

const state = (employees: Employee[]) => ({ employees, roleProfiles: { 'Addetto vendite': { requiredSkills: [] } } }) as unknown as AssessmentState

let n = 0
const create: CreateEmployee = (draft, fields) => {
  if (fields.ruolo && !draft.roleProfiles[fields.ruolo]) draft.roleProfiles[fields.ruolo] = { requiredSkills: [] }
  return person({ ...fields, id: 'new-' + ++n } as Partial<Employee>)
}

const HEAD = ['Nome', 'Cognome', 'Email aziendale', 'Sesso', 'Area', 'Reparto', 'Mansione', 'Attività svolte', 'Tipo rapporto', 'Livello CCNL', 'RAL lorda annua', 'Benefit riconosciuti']

test('legge le colonne del modello, anche con nomi alternativi, e segnala quelle sconosciute', () => {
  const s = readSheet([['nome', 'COGNOME', 'E-mail', 'Ruolo', 'Colore preferito'], ['Ada', 'Bianchi', 'ada@x.it', 'Analista', 'blu'], ['', '', '', '', '']])
  assert.equal(s.rows.length, 1)
  assert.deepEqual(s.rows[0].values, { nome: 'Ada', cognome: 'Bianchi', email: 'ada@x.it', ruolo: 'Analista' })
  assert.equal(s.rows[0].row, 2)
  assert.deepEqual(s.unknownColumns, ['Colore preferito'])
})

test('errori riga per riga: obbligatori, email, sesso, contratto, RAL, email ripetuta', () => {
  const s = readSheet([HEAD, ['', 'Bianchi', 'x', 'Q', '', '', '', '', 'Stagista', '', 'tanti', ''], ['Ada', 'Neri', 'ada@x.it', 'F', '', '', 'Analista', '', '', '', '', ''], ['Bea', 'Neri', 'ADA@x.it', 'F', '', '', 'Analista', '', '', '', '', '']])
  const p = planImport(state([]), s, true, create)
  const at = (row: number) => p.errors.filter((e) => e.row === row).map((e) => e.field)
  assert.deepEqual(at(2), ['Nome', 'Mansione', 'Email aziendale', 'Sesso', 'Tipo rapporto', 'RAL lorda annua'])
  assert.deepEqual(at(4), ['Email aziendale'])
  assert.match(p.errors.find((e) => e.row === 4)!.problem, /riga 3/)
})

test('manca una colonna obbligatoria: un errore e nessun piano', () => {
  const p = planImport(state([]), readSheet([['Nome', 'Cognome'], ['Ada', 'Bianchi']]), true, create)
  assert.deepEqual(p.errors.map((e) => e.field), ['Mansione'])
  assert.equal(p.creates.length, 0)
})

test('email: la persona presente si aggiorna nei campi del file e tiene le valutazioni', () => {
  const old = person({ nome: 'Mario', email: 'mario@x.it', reparto: 'Vecchio' })
  const p = planImport(state([old]), readSheet([HEAD, ['Mario', 'Rossi', 'MARIO@x.it', 'M', '', 'Nuovo', 'Addetto vendite', '', '', '', '', '']]), true, create)
  assert.equal(p.updates.length, 1)
  assert.equal(p.updates[0].after.reparto, 'Nuovo')
  assert.deepEqual(p.updates[0].after.soft, old.soft)
  assert.equal(p.updates[0].after.id, old.id)
  assert.equal(p.creates.length, 0)
})

test('senza email: stesso nome, cognome e mansione è un probabile doppione, non si tocca', () => {
  const old = person({ nome: 'Mario', email: '' })
  const p = planImport(state([old]), readSheet([HEAD, ['mario', 'ROSSI', '', '', '', '', 'Addetto vendite', '', '', '', '', '']]), true, create)
  assert.equal(p.duplicates.length, 1)
  assert.equal(p.updates.length + p.creates.length, 0)
})

test('persona nuova con mansione nuova: la mansione entra con lei', () => {
  const p = planImport(state([]), readSheet([HEAD, ['Ada', 'Bianchi', 'ada@x.it', 'Femminile', '', '', 'Data analyst', '', 'Partita IVA', '', '€ 42.000', '']]), true, create)
  assert.equal(p.creates.length, 1)
  assert.equal(p.creates[0].sesso, 'F')
  assert.equal(p.creates[0].tipoContratto, 'partitaIva')
  assert.equal(p.creates[0].ral, 42000)
  assert.deepEqual(p.roleProfiles.map((r) => r.roleName), ['Data analyst'])
})

test('la RAL la importa solo chi la può scrivere', () => {
  const old = person({ email: 'mario@x.it', ral: 30000 })
  const p = planImport(state([old]), readSheet([HEAD, ['Mario', 'Rossi', 'mario@x.it', '', '', '', 'Addetto vendite', '', '', '', '50000', '']]), false, create)
  assert.equal(p.ralIgnored, true)
  assert.equal(p.updates[0].after.ral, 30000)
})
