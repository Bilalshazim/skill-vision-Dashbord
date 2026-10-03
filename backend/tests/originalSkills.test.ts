import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api, authHeader, loginAs, prisma, resetDb, seedFixture } from './helpers.js'

// Anteprima Original Skills: l'API esterna è finta, i dati sono inventati.
const ENV = {
  ORIGINAL_SKILLS_ENABLED: 'true',
  ORIGINAL_SKILLS_API_URL: 'https://os.invalid/Api/Data/ExportData',
  ORIGINAL_SKILLS_AUTH_KEY: 'k-test',
  ORIGINAL_SKILLS_AUTH_COMPANY: 'APIACC',
  ORIGINAL_SKILLS_COMPANY_MAP: JSON.stringify({ societa1: 'AAA111', societa2: 'BBB222' }),
}

const person = (code: string, over: Record<string, unknown> = {}) => ({
  Cognome: ' Rossi ', Nome: 'Maria', Sesso: 'F', 'Anno nascita': '1990', email: 'm@example.invalid', ral: '30000',
  codAzienda: code, 'numero intervista': '100001', 'ultima modifica': '2026-09-30 10:12:44.0', sede: 'Milano', risultato: '1.142',
  competenze: [{ nome: 'Ascolto', punteggio: '6.50' }, { nome: 'Ascolto', punteggio: '6.50' }, { nome: 'Empatia', punteggio: '5.10' }],
  'competenze ruolo': [{ nome: 'Ascolto', punteggio: '6.50', 'valore atteso': '5.00', diff: '1.50' }],
  ...over,
})

let fetchMock: ReturnType<typeof vi.fn>
function upstream(body: unknown, status = 200) {
  fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))
  vi.stubGlobal('fetch', fetchMock)
}

describe('Original Skills — anteprima in sola lettura', () => {
  beforeEach(async () => {
    await resetDb()
    Object.assign(process.env, ENV)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    for (const k of Object.keys(ENV)) delete process.env[k]
  })
  afterAll(async () => prisma.$disconnect())

  it('richiede un token e il ruolo PLATFORM_ADMIN', async () => {
    const fx = await seedFixture()
    expect((await api.get('/api/v1/original-skills/results')).status).toBe(401)
    const token = await loginAs(fx.recruiter.email)
    const res = await api.get('/api/v1/original-skills/results').set(authHeader(token))
    expect(res.status).toBe(403)
  })

  it('è spenta senza ORIGINAL_SKILLS_ENABLED=true, senza chiamare l’API', async () => {
    const fx = await seedFixture()
    upstream([])
    delete process.env.ORIGINAL_SKILLS_ENABLED
    const token = await loginAs(fx.platformAdmin.email)
    const res = await api.get('/api/v1/original-skills/results').set(authHeader(token))
    expect(res.status).toBe(503)
    expect(res.body.error.code).toBe('service_disabled')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('normalizza, scarta le righe non richieste e non espone dati non necessari né codici', async () => {
    const fx = await seedFixture()
    upstream([person('AAA111'), person('APIACC', { 'numero intervista': '999' }), person('BBB222', { risultato: '', Nome: 'Luca' })])
    const token = await loginAs(fx.platformAdmin.email)
    const res = await api.get('/api/v1/original-skills/results?from=2026-09-01&to=2026-09-30').set(authHeader(token))
    expect(res.status).toBe(200)

    const sent = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(sent).toEqual({ dataDa: '2026-09-01', dataA: '2026-09-30', lingua: 'IT', codAzienda: ['AAA111', 'BBB222'] })
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ authKey: 'k-test', authCompany: 'APIACC' })

    expect(res.body.people).toHaveLength(2)
    expect(res.body.discardedRows).toBe(1)
    expect(res.body.duplicateEntries).toBe(2) // «Ascolto» ripetuta, in due persone
    const [first, second] = res.body.people
    expect(first).toMatchObject({ lastName: 'Rossi', companyKey: 'societa1', result: 1.142, updatedAt: '2026-09-30T10:12:44' })
    expect(first.competencies).toEqual([{ name: 'Ascolto', score: 6.5 }, { name: 'Empatia', score: 5.1 }])
    expect(first.roleCompetencies).toEqual([{ name: 'Ascolto', score: 6.5, expected: 5, diff: 1.5 }])
    expect(second.result).toBeNull()

    const text = JSON.stringify(res.body)
    for (const leak of ['AAA111', 'BBB222', 'APIACC', 'k-test', 'm@example.invalid', '1990', '30000', 'Sesso']) expect(text).not.toContain(leak)

    const log = await prisma.auditLog.findFirst({ where: { action: 'originalSkills.previewed' } })
    expect(log?.actorUserId).toBe(fx.platformAdmin.id)
  })

  it('filtra per società e mostra il nome della società collegata', async () => {
    const fx = await seedFixture()
    process.env.ORIGINAL_SKILLS_COMPANY_MAP = JSON.stringify({ [fx.company.id]: 'AAA111', societa2: 'BBB222' })
    upstream([person('AAA111')])
    const token = await loginAs(fx.platformAdmin.email)
    const res = await api.get(`/api/v1/original-skills/results?company=${fx.company.id}`).set(authHeader(token))
    expect(res.status).toBe(200)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).codAzienda).toEqual(['AAA111'])
    expect(res.body.companies).toEqual([{ key: fx.company.id, label: 'Test Co', linked: true }])

    const list = await api.get('/api/v1/original-skills/companies').set(authHeader(token))
    expect(list.body.companies.map((c: { label: string }) => c.label)).toEqual(['Test Co', 'societa2'])
  })

  it('rifiuta intervalli oltre 89 giorni e date malformate', async () => {
    const fx = await seedFixture()
    upstream([])
    const token = await loginAs(fx.platformAdmin.email)
    expect((await api.get('/api/v1/original-skills/results?from=2026-01-01&to=2026-06-01').set(authHeader(token))).status).toBe(400)
    expect((await api.get('/api/v1/original-skills/results?from=01/09/2026').set(authHeader(token))).status).toBe(400)
    expect((await api.get('/api/v1/original-skills/results?company=altro').set(authHeader(token))).status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('un errore dell’API diventa 502 senza dettagli interni', async () => {
    const fx = await seedFixture()
    upstream({ Cause: 'x', Detail: 'stack interno' }, 500)
    const token = await loginAs(fx.platformAdmin.email)
    const res = await api.get('/api/v1/original-skills/results').set(authHeader(token))
    expect(res.status).toBe(502)
    expect(JSON.stringify(res.body)).not.toContain('stack interno')
  })
})
