import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { api, authHeader, loginAs, prisma, resetDb, seedFixture } from './helpers.js'

// Recruiting sul server: i dati che stavano nel browser, un documento per
// area, con la versione che impedisce di sovrascrivere il lavoro di un collega.
describe('dati di Recruiting sul server', () => {
  let admin: string
  let recruiter: string
  let other: string
  let platform: string

  beforeEach(async () => {
    await resetDb()
    await seedFixture()
    await prisma.recruitingDocument.deleteMany()
    admin = await loginAs('companyadmin@test.local')
    recruiter = await loginAs('recruiter@test.local')
    other = await loginAs('otherrecruiter@test.local')
    platform = await loginAs('admin@test.local')
  })
  afterAll(async () => prisma.$disconnect())

  const base = '/api/v1/recruiting-store'
  const put = (t: string, key: string, data: string, version: number) => api.put(`${base}/${key}`).set(authHeader(t)).send({ data, version })

  it('salva, rilegge e numera le versioni; i colleghi della stessa società vedono gli stessi dati', async () => {
    const doc = JSON.stringify({ companies: [{ id: 'c1', name: 'Acme', jobOpenings: [] }], activeContext: { companyId: 'c1', openingId: '' } })
    expect((await put(recruiter, 'apex5d_cv_matching_state', doc, 0)).body).toEqual({ version: 1 })
    expect((await api.get(`${base}/versions`).set(authHeader(admin))).body).toEqual({ apex5d_cv_matching_state: 1 })
    const all = await api.get(base).set(authHeader(admin))
    expect(all.body.apex5d_cv_matching_state).toEqual({ data: doc, version: 1 })
    expect((await put(admin, 'apex5d_cv_matching_state', '{"companies":[]}', 1)).body).toEqual({ version: 2 })
  })

  it('un salvataggio su una versione vecchia riceve 409 e non sovrascrive', async () => {
    await put(recruiter, 'skillvision_candidates_data', '[1]', 0)
    await put(admin, 'skillvision_candidates_data', '[2]', 1)
    expect((await put(recruiter, 'skillvision_candidates_data', '[3]', 1)).status).toBe(409)
    expect((await api.get(`${base}?keys=skillvision_candidates_data`).set(authHeader(admin))).body.skillvision_candidates_data.data).toBe('[2]')
  })

  it('società diverse e staff hanno spazi separati', async () => {
    await put(recruiter, 'apex5d_jd_templates', '{"a":1}', 0)
    expect((await api.get(base).set(authHeader(other))).body).toEqual({})
    expect((await api.get(base).set(authHeader(platform))).body).toEqual({})
    await put(platform, 'apex5d_jd_templates', '{"p":1}', 0)
    expect((await api.get(base).set(authHeader(recruiter))).body.apex5d_jd_templates.data).toBe('{"a":1}')
  })

  it('rifiuta aree sconosciute, testo non JSON, e chi non ha accesso', async () => {
    expect((await put(recruiter, 'qualunque_chiave', '{}', 0)).status).toBe(400)
    expect((await put(recruiter, 'apex5d_survey_state', 'non json', 0)).status).toBe(400)
    expect((await api.get(base)).status).toBe(401)
  })

  it('cancella con la versione giusta', async () => {
    await put(recruiter, 'sv_recruiting_skill_flags_v1', '{}', 0)
    expect((await api.delete(`${base}/sv_recruiting_skill_flags_v1?version=5`).set(authHeader(recruiter))).status).toBe(409)
    expect((await api.delete(`${base}/sv_recruiting_skill_flags_v1?version=1`).set(authHeader(recruiter))).body).toEqual({ version: 0 })
    expect((await api.get(`${base}/versions`).set(authHeader(recruiter))).body).toEqual({})
  })

  it('accetta documenti più grandi del limite generale di 2 MB', async () => {
    const big = JSON.stringify(Array.from({ length: 30_000 }, (_, i) => ({ id: `cand_${i}`, name: 'Nome Cognome di prova', scores: { a: 1, b: 2, c: 3 } })))
    expect(Buffer.byteLength(big)).toBeGreaterThan(2 * 1024 * 1024)
    expect((await put(recruiter, 'skillvision_candidates_data', big, 0)).body).toEqual({ version: 1 })
  })
})
