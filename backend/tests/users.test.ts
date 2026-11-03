import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { api, authHeader, loginAs, prisma, resetDb, seedFixture } from './helpers.js'

const GOOD = 'NuovaChiave2026x'

describe('gestione utenti', () => {
  beforeEach(resetDb)
  afterAll(async () => prisma.$disconnect())

  it('il PLATFORM_ADMIN vede tutti gli utenti, senza hash', async () => {
    await seedFixture()
    const res = await api.get('/api/v1/users').set(authHeader(await loginAs('admin@test.local')))
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(4)
    expect(res.body[0].passwordHash).toBeUndefined()
  })

  it('nessun altro ruolo accede, nemmeno il COMPANY_ADMIN', async () => {
    await seedFixture()
    expect((await api.get('/api/v1/users').set(authHeader(await loginAs('companyadmin@test.local')))).status).toBe(403)
    expect((await api.get('/api/v1/users').set(authHeader(await loginAs('recruiter@test.local')))).status).toBe(403)
  })

  it('crea un utente che entra con email o nome utente', async () => {
    const fx = await seedFixture()
    const token = await loginAs('admin@test.local')
    const res = await api
      .post('/api/v1/users')
      .set(authHeader(token))
      .send({ email: 'Nuovo@Test.local', username: 'Mario.Rossi', fullName: 'Mario Rossi', designation: 'Responsabile HR', role: 'RECRUITER', companyId: fx.company.id, password: GOOD })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ email: 'nuovo@test.local', username: 'mario.rossi', designation: 'Responsabile HR' })
    await loginAs('nuovo@test.local', GOOD)
    await loginAs('mario.rossi', GOOD)

    const dup = await api.post('/api/v1/users').set(authHeader(token)).send({ email: 'altro@test.local', username: 'mario.rossi', fullName: 'X', role: 'RECRUITER', companyId: fx.company.id, password: GOOD })
    expect(dup.status).toBe(409)
  })

  it('rifiuta una password debole', async () => {
    const fx = await seedFixture()
    const res = await api
      .post('/api/v1/users')
      .set(authHeader(await loginAs('admin@test.local')))
      .send({ email: 'debole@test.local', fullName: 'Debole', role: 'RECRUITER', companyId: fx.company.id, password: 'corta' })
    expect(res.status).toBe(400)
  })

  it('cambia la password: la vecchia non vale più e l’utente esce subito', async () => {
    const fx = await seedFixture()
    const login = await api.post('/api/v1/auth/login').send({ email: 'recruiter@test.local', password: 'pw123456' })
    expect((await api.get('/api/v1/auth/me').set(authHeader(login.body.accessToken))).status).toBe(200)

    const res = await api.patch(`/api/v1/users/${fx.recruiter.id}/password`).set(authHeader(await loginAs('admin@test.local'))).send({ password: GOOD })
    expect(res.status).toBe(200)

    expect((await api.get('/api/v1/auth/me').set(authHeader(login.body.accessToken))).status).toBe(401)
    expect((await api.post('/api/v1/auth/refresh').send({ refreshToken: login.body.refreshToken })).status).toBe(401)
    expect((await api.post('/api/v1/auth/login').send({ email: 'recruiter@test.local', password: 'pw123456' })).status).toBe(401)
    await loginAs('recruiter@test.local', GOOD)
  })

  it('anche chi cambia la propria password esce subito', async () => {
    const fx = await seedFixture()
    const token = await loginAs('admin@test.local')
    const res = await api.patch(`/api/v1/users/${fx.platformAdmin.id}/password`).set(authHeader(token)).send({ password: GOOD })
    expect(res.body).toEqual({ signedOut: true, self: true })
    expect((await api.get('/api/v1/users').set(authHeader(token))).status).toBe(401)
  })

  it('disattivare un utente lo fa uscire; l’ultimo amministratore di piattaforma non si toglie', async () => {
    const fx = await seedFixture()
    const recruiterToken = await loginAs('recruiter@test.local')
    const token = await loginAs('admin@test.local')
    const off = await api.patch(`/api/v1/users/${fx.recruiter.id}`).set(authHeader(token)).send({ status: 'DISABLED' })
    expect(off.status).toBe(200)
    expect((await api.get('/api/v1/auth/me').set(authHeader(recruiterToken))).status).toBe(401)

    const last = await api.patch(`/api/v1/users/${fx.platformAdmin.id}`).set(authHeader(token)).send({ role: 'RECRUITER', companyId: fx.company.id })
    expect(last.status).toBe(400)
  })

  it('modificare nome e mansione non fa uscire nessuno', async () => {
    const fx = await seedFixture()
    const recruiterToken = await loginAs('recruiter@test.local')
    const res = await api.patch(`/api/v1/users/${fx.recruiter.id}`).set(authHeader(await loginAs('admin@test.local'))).send({ fullName: 'Giulia Neri', designation: 'Selezionatrice' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ fullName: 'Giulia Neri', designation: 'Selezionatrice' })
    expect((await api.get('/api/v1/auth/me').set(authHeader(recruiterToken))).status).toBe(200)
  })
})

describe('primo accesso', () => {
  beforeEach(resetDb)
  afterAll(async () => prisma.$disconnect())

  it('senza password il server ne genera una provvisoria; al primo accesso l’utente ne sceglie una sua', async () => {
    const fx = await seedFixture()
    const created = await api
      .post('/api/v1/users')
      .set(authHeader(await loginAs('admin@test.local')))
      .send({ email: 'primo@test.local', fullName: 'Primo Accesso', role: 'RECRUITER', companyId: fx.company.id })
    expect(created.status).toBe(201)
    const temp = created.body.temporaryPassword as string
    expect(temp).toHaveLength(18)
    expect(created.body.mustChangePassword).toBe(true)
    expect((await api.get('/api/v1/users').set(authHeader(await loginAs('admin@test.local')))).body.some((u: { temporaryPassword?: string }) => u.temporaryPassword)).toBe(false)

    const login = await api.post('/api/v1/auth/login').send({ email: 'primo@test.local', password: temp })
    expect(login.status).toBe(200)
    expect(login.body.user.mustChangePassword).toBe(true)
    const token = login.body.accessToken as string
    // Fino alla password nuova passa solo /auth/me.
    expect((await api.get('/api/v1/auth/me').set(authHeader(token))).status).toBe(200)
    const blocked = await api.get('/api/v1/companies').set(authHeader(token))
    expect(blocked.status).toBe(403)
    expect(blocked.body.error.code).toBe('password_change_required')

    expect((await api.post('/api/v1/auth/me/password').set(authHeader(token)).send({ currentPassword: 'sbagliata', newPassword: GOOD })).status).toBe(400)
    expect((await api.post('/api/v1/auth/me/password').set(authHeader(token)).send({ currentPassword: temp, newPassword: 'corta' })).status).toBe(400)
    const set = await api.post('/api/v1/auth/me/password').set(authHeader(token)).send({ currentPassword: temp, newPassword: GOOD })
    expect(set.status).toBe(200)
    expect(set.body.user.mustChangePassword).toBe(false)
    // Il token vecchio è chiuso, quello nuovo funziona; la provvisoria non vale più.
    expect((await api.get('/api/v1/auth/me').set(authHeader(token))).status).toBe(401)
    expect((await api.get('/api/v1/auth/me').set(authHeader(set.body.accessToken))).body.mustChangePassword).toBe(false)
    expect((await api.post('/api/v1/auth/login').send({ email: 'primo@test.local', password: temp })).status).toBe(401)
    await loginAs('primo@test.local', GOOD)
  })

  it('una password data dall’amministratore a un altro è provvisoria; la propria no', async () => {
    const fx = await seedFixture()
    const token = await loginAs('admin@test.local')
    await api.patch(`/api/v1/users/${fx.recruiter.id}/password`).set(authHeader(token)).send({ password: GOOD })
    const login = await api.post('/api/v1/auth/login').send({ email: 'recruiter@test.local', password: GOOD })
    expect(login.body.user.mustChangePassword).toBe(true)

    await api.patch(`/api/v1/users/${fx.platformAdmin.id}/password`).set(authHeader(token)).send({ password: GOOD })
    const self = await api.post('/api/v1/auth/login').send({ email: 'admin@test.local', password: GOOD })
    expect(self.body.user.mustChangePassword).toBe(false)
  })
})
