import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { api, authHeader, loginAs, prisma, resetDb, seedFixture } from './helpers.js'

// Tutto sul server, Parte 2: le preferenze dell'interfaccia stanno
// sull'utente, non nel browser.
describe('preferenze dell’utente', () => {
  let admin: string
  let recruiter: string

  beforeEach(async () => {
    await resetDb()
    await seedFixture()
    admin = await loginAs('companyadmin@test.local')
    recruiter = await loginAs('recruiter@test.local')
  })
  afterAll(async () => prisma.$disconnect())

  const get = (t: string) => api.get('/api/v1/auth/me/preferences').set(authHeader(t))
  const patch = (t: string, body: unknown) => api.patch('/api/v1/auth/me/preferences').set(authHeader(t)).send(body)

  it('parte vuoto, unisce le chiavi e toglie con null', async () => {
    expect((await get(admin)).body).toEqual({})
    expect((await patch(admin, { theme: 'dark', lang: 'it' })).body).toEqual({ theme: 'dark', lang: 'it' })
    expect((await patch(admin, { theme: 'light', 'view.home': true })).body).toEqual({ theme: 'light', lang: 'it', 'view.home': true })
    expect((await patch(admin, { lang: null })).body).toEqual({ theme: 'light', 'view.home': true })
    expect((await get(admin)).body).toEqual({ theme: 'light', 'view.home': true })
  })

  it('ogni utente ha le sue', async () => {
    await patch(admin, { theme: 'dark' })
    expect((await get(recruiter)).body).toEqual({})
  })

  it('senza accesso no; oltre i limiti no', async () => {
    expect((await api.get('/api/v1/auth/me/preferences')).status).toBe(401)
    expect((await patch(admin, { big: 'x'.repeat(20_000) })).status).toBe(400)
    expect((await patch(admin, Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`k${i}`, 1])))).status).toBe(400)
  })
})
