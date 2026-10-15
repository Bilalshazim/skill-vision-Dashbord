import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { env } from '../src/lib/env.js'
import { hashPassword } from '../src/lib/password.js'
import { api, authHeader, loginAs, prisma, resetDb, seedFixture, type Fixture } from './helpers.js'

// Assessment sul server (PROGETTO-ASSESSMENT-SERVER.md §8). L'API riceve e
// restituisce la forma che il browser teneva in localStorage
// (frontend/src/modules/assessment/lib/types.ts): il controllo principale è
// che un dipendente salvato torni identico.

const base = (companyId: string) => `/api/v1/assessment/companies/${companyId}`

// Un dipendente con tutto quello che il browser salva, come lo scrive oggi.
const legacyEmployee = {
  id: 'emp_ab12cd3',
  nome: 'Giulia',
  cognome: 'Rossi',
  email: 'giulia.rossi@test.local',
  area: 'Commerciale',
  reparto: 'Vendite',
  ruolo: 'Account',
  mansione: 'Account manager',
  tipoProfilo: 'Employee',
  tipoContratto: 'partitaIva',
  sesso: 'F',
  livelloCcnl: 'Q1',
  ral: 42000.5,
  benefit: 'Auto aziendale',
  assenzeProgrammate: [{ dal: '2026-08-10', al: '2026-08-24', motivo: 'Ferie estive' }],
  archived: null,
  soft: { ma1: { ottenuto: 6.5, atteso: 7 }, so2: { ottenuto: 8, atteso: 7.5 } },
  hard: { resp: { A1: 7, A2: 8 }, peer: { A1: 6 }, auto: {} },
  hardEvaluatedBy: { resp: 'Mario Bianchi', peer: 'Luca Verdi', auto: '' },
  hardNotes: { resp: { A1: 'Puntuale nelle consegne' } },
  hardHistory: [
    { module: 'professional', periodId: 'period_q1', periodLabel: 'Q1 2026', date: '2026-03-31T10:00:00.000Z', source: 'resp', apexScore: 7.5, dims: [{ code: 'A', name: 'Professionalità', score: 7.5 }] },
  ],
  softHistory: [{ module: 'transversal', date: '2026-02-01T09:30:00.000Z', source: 'manual', overallOttenuto: 7.2, overallAtteso: 7.1 }],
  feedbackNeeded: true,
  developmentPlan: { azioni: 'Affiancamento', formazione: 'Corso negoziazione', coaching: '', obiettivi: 'Chiudere 3 contratti' },
  createdAt: '2026-01-15T08:00:00.000Z',
  softSkillOverrides: [],
  responsabileId: 'emp_boss001',
  surveySentAt: '2026-02-01T08:00:00.000Z',
}

describe('Assessment sul server', () => {
  let fx: Fixture
  let admin: string
  let recruiter: string
  let other: string

  beforeEach(async () => {
    await resetDb()
    fx = await seedFixture()
    await prisma.company.update({ where: { id: fx.company.id }, data: { purchasedModules: ['ASSESSMENT'] } })
    await prisma.company.update({ where: { id: fx.otherCompany.id }, data: { purchasedModules: ['ASSESSMENT'] } })
    admin = await loginAs('companyadmin@test.local')
    recruiter = await loginAs('recruiter@test.local')
    other = await loginAs('otherrecruiter@test.local')
  })
  afterAll(async () => prisma.$disconnect())

  const putEmployee = (token: string, companyId: string, emp: Record<string, unknown>) =>
    api.put(`${base(companyId)}/employees/${emp.id}`).set(authHeader(token)).send(emp)

  it('una società senza il modulo Assessment riceve 403', async () => {
    await prisma.company.update({ where: { id: fx.company.id }, data: { purchasedModules: ['RECRUITING'] } })
    const res = await api.get(`${base(fx.company.id)}/state`).set(authHeader(admin))
    expect(res.status).toBe(403)
  })

  it('una società nuova parte vuota: il frontend completa i default', async () => {
    const res = await api.get(`${base(fx.company.id)}/state`).set(authHeader(admin))
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ settings: null, employees: [], evalPeriods: [], evalAssignments: [], roleProfiles: {}, analisiIniziale: null, company: null })
  })

  it('un dipendente salvato torna identico, salvo il motivo delle assenze che diventa categoria', async () => {
    const put = await putEmployee(admin, fx.company.id, legacyEmployee)
    expect(put.status).toBe(200)
    const state = await api.get(`${base(fx.company.id)}/state`).set(authHeader(admin))
    const { assenzeProgrammate, ...rest } = legacyEmployee
    expect(state.body.employees).toHaveLength(1)
    expect(state.body.employees[0]).toEqual({ ...rest, assenzeProgrammate: [{ dal: '2026-08-10', al: '2026-08-24', category: 'ferie' }] })
    expect(put.body).toEqual(state.body.employees[0])
  })

  it('il testo libero del motivo di assenza non arriva al database', async () => {
    await putEmployee(admin, fx.company.id, { ...legacyEmployee, assenzeProgrammate: [{ dal: '2026-05-01', al: '2026-05-10', motivo: 'Intervento chirurgico' }] })
    const rows = await prisma.$queryRawUnsafe<unknown[]>(`SELECT * FROM "EmployeeAbsence"`)
    expect(JSON.stringify(rows)).not.toMatch(/chirurgic/i)
    const state = await api.get(`${base(fx.company.id)}/state`).set(authHeader(admin))
    expect(state.body.employees[0].assenzeProgrammate).toEqual([{ dal: '2026-05-01', al: '2026-05-10', category: 'altro' }])
  })

  it('un salvataggio successivo sostituisce punteggi e storico, senza doppioni', async () => {
    await putEmployee(admin, fx.company.id, legacyEmployee)
    const changed = { ...legacyEmployee, soft: { ma1: { ottenuto: 9, atteso: 7 } }, softHistory: [], archived: { reason: 'pensione', note: 'Fine carriera', date: '2026-09-30' } }
    await putEmployee(admin, fx.company.id, changed)
    const state = await api.get(`${base(fx.company.id)}/state`).set(authHeader(admin))
    expect(state.body.employees).toHaveLength(1)
    expect(state.body.employees[0].soft).toEqual({ ma1: { ottenuto: 9, atteso: 7 } })
    expect(state.body.employees[0].softHistory).toEqual([])
    expect(state.body.employees[0].archived).toEqual({ reason: 'pensione', note: 'Fine carriera', date: '2026-09-30' })
  })

  describe('RAL (decisione 3): solo COMPANY_ADMIN e PLATFORM_ADMIN', () => {
    it('il recruiter la riceve nascosta e salvando non la cancella', async () => {
      await putEmployee(admin, fx.company.id, legacyEmployee)
      const seen = await api.get(`${base(fx.company.id)}/state`).set(authHeader(recruiter))
      expect(seen.body.employees[0].ral).toBeNull()
      // Il recruiter salva il dipendente così come lo ha ricevuto (ral: null).
      await putEmployee(recruiter, fx.company.id, { ...seen.body.employees[0], area: 'Marketing' })
      const after = await api.get(`${base(fx.company.id)}/state`).set(authHeader(admin))
      expect(after.body.employees[0].ral).toBe(42000.5)
      expect(after.body.employees[0].area).toBe('Marketing')
    })

    it('una RAL mai inserita torna 0 a chi può vederla, come nel browser', async () => {
      await putEmployee(admin, fx.company.id, { ...legacyEmployee, ral: 0 })
      const res = await api.get(`${base(fx.company.id)}/state`).set(authHeader(admin))
      expect(res.body.employees[0].ral).toBe(0)
    })
  })

  describe('perimetro della società', () => {
    it('un utente di un’altra società riceve 403, in lettura e in scrittura', async () => {
      expect((await api.get(`${base(fx.company.id)}/state`).set(authHeader(other))).status).toBe(403)
      expect((await putEmployee(other, fx.company.id, legacyEmployee)).status).toBe(403)
    })

    it('lo stesso id del browser in due società non si scontra', async () => {
      await putEmployee(admin, fx.company.id, legacyEmployee)
      await putEmployee(other, fx.otherCompany.id, { ...legacyEmployee, nome: 'Altra' })
      const a = await api.get(`${base(fx.company.id)}/state`).set(authHeader(admin))
      const b = await api.get(`${base(fx.otherCompany.id)}/state`).set(authHeader(other))
      expect(a.body.employees[0].nome).toBe('Giulia')
      expect(b.body.employees[0].nome).toBe('Altra')
    })

    it('READONLY legge e non scrive; EVALUATOR non legge', async () => {
      await prisma.user.create({ data: { email: 'ro@test.local', passwordHash: await hashPassword('pw123456'), fullName: 'RO', role: 'READONLY', companyId: fx.company.id } })
      await prisma.user.create({ data: { email: 'ev@test.local', passwordHash: await hashPassword('pw123456'), fullName: 'EV', role: 'EVALUATOR', companyId: fx.company.id } })
      const ro = await loginAs('ro@test.local')
      const ev = await loginAs('ev@test.local')
      expect((await api.get(`${base(fx.company.id)}/state`).set(authHeader(ro))).status).toBe(200)
      expect((await putEmployee(ro, fx.company.id, legacyEmployee)).status).toBe(403)
      expect((await api.get(`${base(fx.company.id)}/state`).set(authHeader(ev))).status).toBe(403)
    })
  })

  describe('assegnazioni e token del valutatore esterno', () => {
    const assignment = { id: 'assign_x1y2z3', periodId: 'period_q1', targetEmployeeId: legacyEmployee.id, templateType: 'peer', evaluatorName: 'Luca Verdi', evaluatorEmail: 'luca@test.local', status: 'pending', token: 'tok_weak123', createdAt: '2026-03-01T08:00:00.000Z', completedAt: null }

    it('chiede periodo e dipendente già salvati', async () => {
      const res = await api.put(`${base(fx.company.id)}/assignments/${assignment.id}`).set(authHeader(admin)).send(assignment)
      expect(res.status).toBe(409)
    })

    it('il token lo genera il server, resta lo stesso agli aggiornamenti e si può ricopiare', async () => {
      await api.put(`${base(fx.company.id)}/periods/period_q1`).set(authHeader(admin)).send({ label: 'Q1 2026', date: '2026-01-01' })
      await putEmployee(admin, fx.company.id, legacyEmployee)
      const created = await api.put(`${base(fx.company.id)}/assignments/${assignment.id}`).set(authHeader(admin)).send(assignment)
      expect(created.status).toBe(200)
      expect(created.body.token).not.toBe('tok_weak123')
      expect(created.body.token).toMatch(/^[A-Za-z0-9_-]{43}$/)
      const done = await api.put(`${base(fx.company.id)}/assignments/${assignment.id}`).set(authHeader(admin)).send({ ...assignment, status: 'completed' })
      expect(done.body.token).toBe(created.body.token)
      expect(done.body.status).toBe('completed')
      expect(done.body.completedAt).toBeTruthy()
      const state = await api.get(`${base(fx.company.id)}/state`).set(authHeader(admin))
      expect(state.body.evalAssignments[0]).toMatchObject({ id: assignment.id, token: created.body.token, periodId: 'period_q1', targetEmployeeId: legacyEmployee.id, templateType: 'peer' })
    })

    it('un periodo con assegnazioni non si cancella', async () => {
      await api.put(`${base(fx.company.id)}/periods/period_q1`).set(authHeader(admin)).send({ label: 'Q1 2026', date: '2026-01-01' })
      await putEmployee(admin, fx.company.id, legacyEmployee)
      await api.put(`${base(fx.company.id)}/assignments/${assignment.id}`).set(authHeader(admin)).send(assignment)
      expect((await api.delete(`${base(fx.company.id)}/periods/period_q1`).set(authHeader(admin))).status).toBe(409)
      expect((await api.delete(`${base(fx.company.id)}/assignments/${assignment.id}`).set(authHeader(admin))).status).toBe(204)
      expect((await api.delete(`${base(fx.company.id)}/periods/period_q1`).set(authHeader(admin))).status).toBe(204)
    })

    describe('link pubblico del valutatore (Parte 2)', () => {
      const pub = (token: string) => `/api/v1/public/assessment-evaluations/${token}`
      const allSix = Object.fromEntries(['A', 'B', 'C', 'D', 'E'].flatMap((d) => [1, 2, 3, 4, 5].map((n) => [`${d}${n}`, 6])))
      let token: string

      beforeEach(async () => {
        await api.put(`${base(fx.company.id)}/periods/period_q1`).set(authHeader(admin)).send({ label: 'Q1 2026', date: '2026-01-01' })
        await putEmployee(admin, fx.company.id, legacyEmployee)
        token = (await api.put(`${base(fx.company.id)}/assignments/${assignment.id}`).set(authHeader(admin)).send(assignment)).body.token
      })

      it('senza accesso mostra solo il dipendente da valutare e i voti della propria fonte', async () => {
        const res = await api.get(pub(token))
        expect(res.status).toBe(200)
        expect(res.body).toEqual({
          status: 'pending',
          completedAt: null,
          source: 'peer',
          evaluatorName: 'Luca Verdi',
          periodLabel: 'Q1 2026',
          employee: { nome: 'Giulia', cognome: 'Rossi' },
          scores: { A1: 6 },
          notes: {},
        })
      })

      it('l’invio salva voti, storico e valutatore, e chiude il link', async () => {
        const res = await api.post(pub(token)).send({ scores: allSix, notes: { B2: 'Sempre preciso', C1: '  ' } })
        expect(res.status).toBe(200)
        const state = await api.get(`${base(fx.company.id)}/state`).set(authHeader(admin))
        const emp = state.body.employees[0]
        expect(emp.hard.peer).toEqual(allSix)
        expect(emp.hard.resp).toEqual({ A1: 7, A2: 8 })
        expect(emp.hardEvaluatedBy.peer).toBe('Luca Verdi')
        expect(emp.hardNotes.peer).toEqual({ B2: 'Sempre preciso' })
        // Stesso calcolo di computeHardSummary(): A = media(3, 6, 0) = 3, B…E = media(0, 6, 0) = 2.
        expect(emp.hardHistory.at(-1)).toMatchObject({ periodId: 'period_q1', periodLabel: 'Q1 2026', source: 'peer', apexScore: 2.2 })
        expect(emp.hardHistory.at(-1).dims[0]).toEqual({ code: 'A', name: 'Professionalità', score: 3 })
        expect(state.body.evalAssignments[0]).toMatchObject({ status: 'completed' })
        expect(state.body.evaluators).toContain('Luca Verdi')
        expect((await api.get(pub(token))).body).toEqual({ status: 'completed', completedAt: expect.any(String) })
        expect((await api.post(pub(token)).send({ scores: allSix })).status).toBe(409)
      })

      it('rifiuta un modulo incompleto o un voto fuori scala', async () => {
        const { E5: _, ...missing } = allSix
        expect((await api.post(pub(token)).send({ scores: missing })).status).toBe(400)
        expect((await api.post(pub(token)).send({ scores: { ...allSix, A1: 11 } })).status).toBe(400)
        expect((await api.get(pub(token))).body.status).toBe('pending')
      })

      it('un token sconosciuto o di una società senza Assessment non apre niente', async () => {
        expect((await api.get(pub('x'.repeat(43)))).status).toBe(404)
        expect((await api.get(pub('tok_weak123'))).status).toBe(404)
        await prisma.company.update({ where: { id: fx.company.id }, data: { purchasedModules: ['RECRUITING'] } })
        expect((await api.get(pub(token))).status).toBe(404)
      })
    })
  })

  describe('invio del link al test (Parte 3)', () => {
    const send = (token: string, companyId: string, employeeIds: string[]) =>
      api.post(`${base(companyId)}/invitations`).set(authHeader(token)).send({ employeeIds, subject: 'Questionario per {{NOME}}', body: 'Ciao {{NOME}}, ecco il link: {{LINK}}' })
    const settings = { modulo: 'AB', surveyLink: 'https://questionario.test.local/abc', surveySenderMode: 'admin', adminSenderEmail: 'hr@test.local' }

    beforeEach(async () => {
      await putEmployee(admin, fx.company.id, legacyEmployee)
      await putEmployee(admin, fx.company.id, { ...legacyEmployee, id: 'emp_noemail', email: '' })
      await putEmployee(admin, fx.company.id, { ...legacyEmployee, id: 'emp_archived', email: 'old@test.local', archived: { reason: 'pensione', note: '', date: '2026-01-01' } })
    })

    it('invia solo ai selezionati con email, registra l’invito e la data', async () => {
      await api.put(`${base(fx.company.id)}/settings`).set(authHeader(admin)).send(settings)
      const res = await send(recruiter, fx.company.id, [legacyEmployee.id, 'emp_noemail', 'emp_archived'])
      expect(res.status).toBe(200)
      expect(res.body.results).toEqual([
        { id: legacyEmployee.id, email: legacyEmployee.email, success: true },
        { id: 'emp_noemail', email: '', success: false, error: 'Email del dipendente mancante o non valida' },
        { id: 'emp_archived', email: '', success: false, error: 'Dipendente non trovato o archiviato' },
      ])
      const invitations = await prisma.testInvitation.findMany({ include: { employee: true } })
      expect(invitations).toHaveLength(1)
      expect(invitations[0]).toMatchObject({ sentStatus: 'SENT', testLink: settings.surveyLink, shortlistId: null, senderConfigId: null })
      expect(invitations[0].employee?.clientId).toBe(legacyEmployee.id)
      const state = await api.get(`${base(fx.company.id)}/state`).set(authHeader(admin))
      expect(state.body.employees.find((e: { id: string }) => e.id === legacyEmployee.id).surveySentAt).not.toBe(legacyEmployee.surveySentAt)
    })

    it('senza link o senza mittente non parte niente', async () => {
      expect((await send(admin, fx.company.id, [legacyEmployee.id])).status).toBe(400)
      await api.put(`${base(fx.company.id)}/settings`).set(authHeader(admin)).send({ ...settings, adminSenderEmail: '' })
      expect((await send(admin, fx.company.id, [legacyEmployee.id])).status).toBe(400)
      expect(await prisma.testInvitation.count()).toBe(0)
    })

    it('un utente di un’altra società non invia ai dipendenti di questa', async () => {
      await api.put(`${base(fx.company.id)}/settings`).set(authHeader(admin)).send(settings)
      expect((await send(other, fx.company.id, [legacyEmployee.id])).status).toBe(403)
      expect(await prisma.testInvitation.count()).toBe(0)
    })
  })

  it('profili di mansione: pesi assenti restano assenti, non {}', async () => {
    await api.put(`${base(fx.company.id)}/role-profiles/${encodeURIComponent('Account manager')}`).set(authHeader(admin)).send({ requiredSkills: ['ma1', 'so2'] })
    await api.put(`${base(fx.company.id)}/role-profiles/Buyer`).set(authHeader(admin)).send({ requiredSkills: ['ma6'], skillWeights: { ma6: 3 }, skillExpected: { ma6: 8 } })
    const state = await api.get(`${base(fx.company.id)}/state`).set(authHeader(admin))
    expect(state.body.roleProfiles).toEqual({ 'Account manager': { requiredSkills: ['ma1', 'so2'] }, Buyer: { requiredSkills: ['ma6'], skillWeights: { ma6: 3 }, skillExpected: { ma6: 8 } } })
  })

  it('impostazioni: la chiave email del browser si scarta', async () => {
    const res = await api.put(`${base(fx.company.id)}/settings`).set(authHeader(admin)).send({ modulo: 'AB', companyName: 'Test Co', evaluators: ['Mario'], emailApiEndpoint: 'https://x', emailApiKey: 'segreta' })
    expect(res.status).toBe(204)
    const state = await api.get(`${base(fx.company.id)}/state`).set(authHeader(admin))
    expect(state.body.settings).toMatchObject({ companyName: 'Test Co', emailApiKey: '', emailApiEndpoint: '' })
    expect(state.body.evaluators).toEqual(['Mario'])
    const rows = await prisma.$queryRawUnsafe<unknown[]>(`SELECT * FROM "AssessmentSettings"`)
    expect(JSON.stringify(rows)).not.toContain('segreta')
  })

  describe('import dal browser (decisione 4)', () => {
    const exported = {
      settings: { modulo: 'AB', companyName: 'Demo Company S.r.l.' },
      employees: [legacyEmployee, { ...legacyEmployee, id: 'emp_boss001', nome: 'Mario', responsabileId: undefined }, { id: 'bad id!', nome: 'X' }],
      evaluators: ['Mario Bianchi'],
      roleProfiles: { 'Account manager': { requiredSkills: ['ma1'] } },
      evalAssignments: [{ id: 'assign_1', periodId: 'period_q1', targetEmployeeId: 'emp_ab12cd3', templateType: 'resp', evaluatorName: 'Mario Bianchi', evaluatorEmail: '', status: 'pending', token: 'tok_abc', createdAt: '2026-03-01T08:00:00.000Z', completedAt: null }],
      evalPeriods: [{ id: 'period_q1', label: 'Q1 2026', date: '2026-01-01' }],
      analisiIniziale: { completed: true, azienda: 'Demo', q1: 3 },
      company: { locations: [{ name: 'Sede', address: 'Via Roma 1', city: 'Milano' }], contacts: [], referente: { name: 'HR', email: '', phone: '' }, ceo: { name: '', email: '' }, cfo: { name: '', email: '' } },
    }

    it('la prova (dryRun) conta e non scrive niente', async () => {
      const res = await api.post(`${base(fx.company.id)}/import`).set(authHeader(admin)).send({ state: exported, dryRun: true })
      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ dryRun: true, employees: 2, periods: 1, roleProfiles: 1, assignments: 1 })
      expect(res.body.skipped).toEqual([expect.objectContaining({ what: 'dipendente', id: 'bad id!' })])
      expect(await prisma.employee.count()).toBe(0)
    })

    it('importa tutto, e rifarlo non crea doppioni', async () => {
      const first = await api.post(`${base(fx.company.id)}/import`).set(authHeader(admin)).send({ state: exported })
      expect(first.body).toMatchObject({ dryRun: false, employees: 2, assignments: 1 })
      const token = (await api.get(`${base(fx.company.id)}/state`).set(authHeader(admin))).body.evalAssignments[0].token
      await api.post(`${base(fx.company.id)}/import`).set(authHeader(admin)).send({ state: exported })
      const state = await api.get(`${base(fx.company.id)}/state`).set(authHeader(admin))
      expect(state.body.employees).toHaveLength(2)
      expect(state.body.evalAssignments).toHaveLength(1)
      expect(state.body.evalAssignments[0].token).toBe(token)
      expect(state.body.analisiIniziale).toEqual(exported.analisiIniziale)
      expect(state.body.company.locations).toEqual(exported.company.locations)
      expect(state.body.settings.companyName).toBe('Demo Company S.r.l.')
    })

    it('il recruiter non importa', async () => {
      expect((await api.post(`${base(fx.company.id)}/import`).set(authHeader(recruiter)).send({ state: exported })).status).toBe(403)
    })
  })

  it('Valutazione 5P: un salvataggio su una versione vecchia riceve 409', async () => {
    const empty = await api.get(`${base(fx.company.id)}/valutazione-5p`).set(authHeader(admin))
    expect(empty.body).toEqual({ state: null, version: 0 })
    const a = await api.put(`${base(fx.company.id)}/valutazione-5p`).set(authHeader(admin)).send({ state: { v: 5, people: [] }, version: 0 })
    expect(a.body).toEqual({ version: 1 })
    const stale = await api.put(`${base(fx.company.id)}/valutazione-5p`).set(authHeader(recruiter)).send({ state: { v: 5, people: [{}] }, version: 0 })
    expect(stale.status).toBe(409)
    const doc = await api.get(`${base(fx.company.id)}/valutazione-5p`).set(authHeader(admin))
    expect(doc.body).toEqual({ state: { v: 5, people: [] }, version: 1 })
  })

  it('il reset è vietato a una società che non è nell’elenco delle demo', async () => {
    await putEmployee(admin, fx.company.id, legacyEmployee)
    const res = await api.post(`${base(fx.company.id)}/reset`).set(authHeader(admin))
    expect(res.status).toBe(403)
    expect(await prisma.employee.count()).toBe(1)
  })

  it('il reset di una società demo toglie i suoi dati di Assessment e solo i suoi', async () => {
    await putEmployee(admin, fx.company.id, legacyEmployee)
    await putEmployee(other, fx.otherCompany.id, legacyEmployee)
    await api.put(`${base(fx.company.id)}/settings`).set(authHeader(admin)).send({ companyName: 'Demo' })
    env.assessmentDemoCompanyIds.push(fx.company.id)
    try {
      expect((await api.post(`${base(fx.company.id)}/reset`).set(authHeader(admin))).status).toBe(204)
    } finally {
      env.assessmentDemoCompanyIds.pop()
    }
    const state = await api.get(`${base(fx.company.id)}/state`).set(authHeader(admin))
    expect(state.body).toMatchObject({ settings: null, employees: [] })
    expect(await prisma.employee.count({ where: { companyId: fx.otherCompany.id } })).toBe(1)
  })
})
