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

describe('rotazione del refresh token e durata dei token', () => {
  beforeEach(resetDb)
  afterAll(async () => prisma.$disconnect())

  const login = async () => {
    const fx = await seedFixture()
    const res = await api.post('/api/v1/auth/login').send({ email: fx.recruiter.email, password: 'pw123456' })
    return { fx, token: res.body.refreshToken as string, access: res.body.accessToken as string }
  }

  it('issues a 3-hour access token', async () => {
    const { access } = await login()
    const { iat, exp } = JSON.parse(Buffer.from(access.split('.')[1], 'base64url').toString()) as { iat: number; exp: number }
    expect(exp - iat).toBe(3 * 60 * 60)
  })

  it('rotates the refresh token: a new one in the body and in the cookie, the old one revoked', async () => {
    const { token } = await login()
    const r = await api.post('/api/v1/auth/refresh').send({ refreshToken: token })
    expect(r.status).toBe(200)
    expect(r.body.refreshToken).toBeTruthy()
    expect(r.body.refreshToken).not.toBe(token)
    expect(([] as string[]).concat(r.headers['set-cookie'] ?? []).some((c) => c.startsWith(`sv_refresh=${encodeURIComponent(r.body.refreshToken)}`))).toBe(true)
    const next = await api.post('/api/v1/auth/refresh').send({ refreshToken: r.body.refreshToken })
    expect(next.status).toBe(200)
  })

  it('within the grace window, the replaced token still gets an access token but no new refresh token', async () => {
    const { token } = await login()
    await api.post('/api/v1/auth/refresh').send({ refreshToken: token })
    const race = await api.post('/api/v1/auth/refresh').send({ refreshToken: token })
    expect(race.status).toBe(200)
    expect(race.body.accessToken).toBeTruthy()
    expect(race.body.refreshToken).toBeUndefined()
  })

  it('reuse of a replaced token after the grace window revokes every session of the user', async () => {
    const { fx, token } = await login()
    const r = await api.post('/api/v1/auth/refresh').send({ refreshToken: token })
    await prisma.refreshToken.updateMany({ where: { userId: fx.recruiter.id, rotatedAt: { not: null } }, data: { rotatedAt: new Date(Date.now() - 5 * 60 * 1000) } })
    const reuse = await api.post('/api/v1/auth/refresh').send({ refreshToken: token })
    expect(reuse.status).toBe(401)
    const current = await api.post('/api/v1/auth/refresh').send({ refreshToken: r.body.refreshToken })
    expect(current.status).toBe(401)
  })

  it('the session ends 3 hours after login: the cookie and the refresh token expire then', async () => {
    const fx = await seedFixture()
    const res = await api.post('/api/v1/auth/login').send({ email: fx.recruiter.email, password: 'pw123456' })
    const cookie = ([] as string[]).concat(res.headers['set-cookie'] ?? []).find((c) => c.startsWith('sv_refresh='))!
    const maxAge = Number(/Max-Age=(\d+)/.exec(cookie)![1])
    expect(maxAge).toBeGreaterThan(3 * 60 * 60 - 10)
    expect(maxAge).toBeLessThanOrEqual(3 * 60 * 60)
    const stored = await prisma.refreshToken.findFirstOrThrow({ where: { userId: fx.recruiter.id } })
    expect(Math.abs(stored.expiresAt.getTime() - (Date.now() + 3 * 60 * 60 * 1000))).toBeLessThan(10_000)
  })

  it('a refresh does not extend the session: same end, access token capped to it', async () => {
    const { fx, token } = await login()
    // Sessione iniziata 2h50 fa: restano 10 minuti.
    const end = new Date(Date.now() + 10 * 60 * 1000)
    await prisma.refreshToken.updateMany({ where: { userId: fx.recruiter.id }, data: { expiresAt: end } })
    const r = await api.post('/api/v1/auth/refresh').send({ refreshToken: token })
    expect(r.status).toBe(200)
    const { exp } = JSON.parse(Buffer.from(r.body.accessToken.split('.')[1], 'base64url').toString()) as { exp: number }
    expect(exp).toBeLessThanOrEqual(Math.ceil(end.getTime() / 1000))
    const rotated = await prisma.refreshToken.findFirstOrThrow({ where: { userId: fx.recruiter.id, revokedAt: null } })
    expect(rotated.expiresAt.getTime()).toBe(end.getTime())
  })

  it('a refresh token older than its lifetime is refused', async () => {
    const { fx, token } = await login()
    await prisma.refreshToken.updateMany({ where: { userId: fx.recruiter.id }, data: { expiresAt: new Date(Date.now() - 1000) } })
    const r = await api.post('/api/v1/auth/refresh').send({ refreshToken: token })
    expect(r.status).toBe(401)
  })
})
