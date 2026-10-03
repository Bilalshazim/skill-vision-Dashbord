import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { api, loginAs, prisma, resetDb, seedFixture } from './helpers.js'

describe('authentication', () => {
  beforeEach(resetDb)
  afterAll(async () => prisma.$disconnect())

  it('logs in with correct credentials and returns a working access token', async () => {
    const fx = await seedFixture()
    const res = await api.post('/api/v1/auth/login').send({ email: fx.recruiter.email, password: 'pw123456' })
    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeTruthy()
    expect(res.body.refreshToken).toBeTruthy()
    expect(res.body.user.role).toBe('RECRUITER')

    const me = await api.get('/api/v1/auth/me').set('Authorization', `Bearer ${res.body.accessToken}`)
    expect(me.status).toBe(200)
    expect(me.body.email).toBe(fx.recruiter.email)
  })

  it('rejects a wrong password', async () => {
    const fx = await seedFixture()
    const res = await api.post('/api/v1/auth/login').send({ email: fx.recruiter.email, password: 'wrong-password' })
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('unauthorized')
  })

  it('rejects an unknown email the same way as a wrong password (no user enumeration)', async () => {
    const res = await api.post('/api/v1/auth/login').send({ email: 'nobody@test.local', password: 'whatever123' })
    expect(res.status).toBe(401)
  })

  it('rejects a disabled account', async () => {
    const fx = await seedFixture()
    await prisma.user.update({ where: { id: fx.recruiter.id }, data: { status: 'DISABLED' } })
    const res = await api.post('/api/v1/auth/login').send({ email: fx.recruiter.email, password: 'pw123456' })
    expect(res.status).toBe(401)
  })

  it('refreshes an access token from a valid refresh token', async () => {
    const fx = await seedFixture()
    const login = await api.post('/api/v1/auth/login').send({ email: fx.recruiter.email, password: 'pw123456' })
    const refresh = await api.post('/api/v1/auth/refresh').send({ refreshToken: login.body.refreshToken })
    expect(refresh.status).toBe(200)
    expect(refresh.body.accessToken).toBeTruthy()
  })

  it('revokes a refresh token on logout — it can no longer be used to refresh', async () => {
    const fx = await seedFixture()
    const login = await api.post('/api/v1/auth/login').send({ email: fx.recruiter.email, password: 'pw123456' })
    const logout = await api.post('/api/v1/auth/logout').send({ refreshToken: login.body.refreshToken })
    expect(logout.status).toBe(204)
    const refresh = await api.post('/api/v1/auth/refresh').send({ refreshToken: login.body.refreshToken })
    expect(refresh.status).toBe(401)
  })

  it('rejects requests with no token, a malformed token, and an expired-looking token', async () => {
    const noToken = await api.get('/api/v1/auth/me')
    expect(noToken.status).toBe(401)

    const badToken = await api.get('/api/v1/auth/me').set('Authorization', 'Bearer not-a-real-jwt')
    expect(badToken.status).toBe(401)
  })

  it('supports concurrent sessions — two logins for the same user both work independently', async () => {
    const fx = await seedFixture()
    const tokenA = await loginAs(fx.recruiter.email)
    const tokenB = await loginAs(fx.recruiter.email)
    const meA = await api.get('/api/v1/auth/me').set('Authorization', `Bearer ${tokenA}`)
    const meB = await api.get('/api/v1/auth/me').set('Authorization', `Bearer ${tokenB}`)
    expect(meA.status).toBe(200)
    expect(meB.status).toBe(200)
  })
})

describe('Fase 8 — limite ai tentativi e cookie di refresh', () => {
  beforeEach(resetDb)
  afterAll(async () => prisma.$disconnect())

  it('blocks the 6th failed attempt for the same email with 429 and Retry-After, without saying if the email exists', async () => {
    const fx = await seedFixture()
    for (let i = 0; i < 5; i++) {
      const r = await api.post('/api/v1/auth/login').send({ email: fx.recruiter.email, password: 'wrong-password' })
      expect(r.status).toBe(401)
    }
    const blocked = await api.post('/api/v1/auth/login').send({ email: fx.recruiter.email, password: 'pw123456' })
    expect(blocked.status).toBe(429)
    expect(blocked.body.error.code).toBe('too_many_requests')
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0)
    const unknown = await api.post('/api/v1/auth/login').send({ email: 'nobody@test.local', password: 'x' })
    expect(unknown.status).toBe(401)
  })

  it('a successful login resets the failure count', async () => {
    const fx = await seedFixture()
    for (let i = 0; i < 4; i++) await api.post('/api/v1/auth/login').send({ email: fx.recruiter.email, password: 'wrong-password' })
    const ok = await api.post('/api/v1/auth/login').send({ email: fx.recruiter.email, password: 'pw123456' })
    expect(ok.status).toBe(200)
    for (let i = 0; i < 4; i++) {
      const r = await api.post('/api/v1/auth/login').send({ email: fx.recruiter.email, password: 'wrong-password' })
      expect(r.status).toBe(401)
    }
  })

  it('sets the refresh token as an httpOnly, SameSite=Strict cookie scoped to the auth routes', async () => {
    const fx = await seedFixture()
    const res = await api.post('/api/v1/auth/login').send({ email: fx.recruiter.email, password: 'pw123456' })
    const cookie = ([] as string[]).concat(res.headers['set-cookie'] ?? []).find((c) => c.startsWith('sv_refresh='))
    expect(cookie).toBeTruthy()
    expect(cookie).toMatch(/HttpOnly/)
    expect(cookie).toMatch(/SameSite=Strict/)
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/)
  })

  it('refreshes with the cookie from the same origin, refuses it from another origin, and still accepts the body token', async () => {
    const fx = await seedFixture()
    const login = await api.post('/api/v1/auth/login').send({ email: fx.recruiter.email, password: 'pw123456' })
    const cookie = ([] as string[]).concat(login.headers['set-cookie']).find((c) => c.startsWith('sv_refresh='))!.split(';')[0]
    const sameOrigin = await api.post('/api/v1/auth/refresh').set('Cookie', cookie).set('Host', 'app.test').set('Origin', 'https://app.test').send({})
    expect(sameOrigin.status).toBe(200)
    expect(sameOrigin.body.accessToken).toBeTruthy()
    const otherOrigin = await api.post('/api/v1/auth/refresh').set('Cookie', cookie).set('Host', 'app.test').set('Origin', 'https://evil.test').send({})
    expect(otherOrigin.status).toBe(403)
    const noOrigin = await api.post('/api/v1/auth/refresh').set('Cookie', cookie).send({})
    expect(noOrigin.status).toBe(403)
    const body = await api.post('/api/v1/auth/refresh').send({ refreshToken: login.body.refreshToken })
    expect(body.status).toBe(200)
  })

  it('logout with the cookie revokes the token and clears the cookie', async () => {
    const fx = await seedFixture()
    const login = await api.post('/api/v1/auth/login').send({ email: fx.recruiter.email, password: 'pw123456' })
    const cookie = ([] as string[]).concat(login.headers['set-cookie']).find((c) => c.startsWith('sv_refresh='))!.split(';')[0]
    const out = await api.post('/api/v1/auth/logout').set('Cookie', cookie).set('Host', 'app.test').set('Origin', 'https://app.test').send({})
    expect(out.status).toBe(204)
    expect(([] as string[]).concat(out.headers['set-cookie']).some((c) => /^sv_refresh=;.*Max-Age=0/.test(c))).toBe(true)
    const again = await api.post('/api/v1/auth/refresh').send({ refreshToken: login.body.refreshToken })
    expect(again.status).toBe(401)
  })
})
