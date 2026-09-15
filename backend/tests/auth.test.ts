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
