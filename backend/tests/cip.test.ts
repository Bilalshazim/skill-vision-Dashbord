import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { api, authHeader, loginAs, prisma, resetDb, seedFixture } from './helpers.js'

describe('CIP (Platform-level, OD-1 boundary)', () => {
  beforeEach(resetDb)
  afterAll(async () => prisma.$disconnect())

  it('generates a CIP in the CIP {yy}/{seller} {mm}-{seq} format', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.platformAdmin.email)
    const res = await api
      .post('/api/v1/cip')
      .set(authHeader(token))
      .send({ ownerType: 'PLATFORM', ownerId: fx.platform.id, sellerCodeId: fx.seller.id })
    expect(res.status).toBe(201)
    expect(res.body.code).toMatch(/^CIP \d{2}\/TS \d{2}-01$/)
    expect(res.body.sequence).toBe(1)
    expect(res.body.status).toBe('ACTIVE')
  })

  it('increments the sequence for the same seller+month across owners, scoped independently per seller', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.platformAdmin.email)
    const otherSeller = await prisma.sellerCode.create({ data: { code: 'ZZ', label: 'Other seller' } })

    const first = await api.post('/api/v1/cip').set(authHeader(token)).send({ ownerType: 'PLATFORM', ownerId: fx.platform.id, sellerCodeId: fx.seller.id })
    const second = await api.post('/api/v1/cip').set(authHeader(token)).send({ ownerType: 'COMPANY', ownerId: fx.company.id, sellerCodeId: fx.seller.id })
    const otherSellerFirst = await api.post('/api/v1/cip').set(authHeader(token)).send({ ownerType: 'PLATFORM', ownerId: fx.platform.id, sellerCodeId: otherSeller.id })

    expect(first.body.sequence).toBe(1)
    expect(second.body.sequence).toBe(2) // same seller+month -> keeps incrementing regardless of owner type
    expect(otherSellerFirst.body.sequence).toBe(1) // different seller -> its own sequence, starts fresh
  })

  it('is immutable once issued — no PATCH/edit endpoint exists, only void + reissue', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.platformAdmin.email)
    const cip = await api.post('/api/v1/cip').set(authHeader(token)).send({ ownerType: 'PLATFORM', ownerId: fx.platform.id, sellerCodeId: fx.seller.id })

    const voided = await api.post(`/api/v1/cip/${cip.body.id}/void`).set(authHeader(token)).send({ reason: 'Wrong owner selected' })
    expect(voided.status).toBe(200)
    expect(voided.body.status).toBe('VOIDED')
    expect(voided.body.voidReason).toBe('Wrong owner selected')

    // Voiding again is a conflict, not a silent no-op — a void is a
    // one-way, auditable action.
    const secondVoid = await api.post(`/api/v1/cip/${cip.body.id}/void`).set(authHeader(token)).send({ reason: 'again' })
    expect(secondVoid.status).toBe(409)

    // A fresh CIP still gets the next sequence — voiding doesn't free the
    // number for reuse.
    const reissued = await api.post('/api/v1/cip').set(authHeader(token)).send({ ownerType: 'PLATFORM', ownerId: fx.platform.id, sellerCodeId: fx.seller.id })
    expect(reissued.body.sequence).toBe(2)
  })

  it('only a platform admin can generate a CIP', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.recruiter.email)
    const res = await api.post('/api/v1/cip').set(authHeader(token)).send({ ownerType: 'PLATFORM', ownerId: fx.platform.id, sellerCodeId: fx.seller.id })
    expect(res.status).toBe(403)
  })

  describe('Phase 33 §2: GET /cip (list by owner, platform-admin only)', () => {
    it('lists CIPs for a given owner, including voided ones, and rejects a non-platform-admin', async () => {
      const fx = await seedFixture()
      const token = await loginAs(fx.platformAdmin.email)
      const cip = await api.post('/api/v1/cip').set(authHeader(token)).send({ ownerType: 'PLATFORM', ownerId: fx.platform.id, sellerCodeId: fx.seller.id })
      await api.post('/api/v1/cip').set(authHeader(token)).send({ ownerType: 'COMPANY', ownerId: fx.company.id, sellerCodeId: fx.seller.id })
      await api.post(`/api/v1/cip/${cip.body.id}/void`).set(authHeader(token)).send({ reason: 'test' })

      const all = await api.get('/api/v1/cip').set(authHeader(token))
      expect(all.status).toBe(200)
      expect(all.body.length).toBeGreaterThanOrEqual(2)

      const scoped = await api.get('/api/v1/cip').query({ ownerType: 'PLATFORM', ownerId: fx.platform.id }).set(authHeader(token))
      expect(scoped.body).toHaveLength(1)
      expect(scoped.body[0].status).toBe('VOIDED')

      const recruiterToken = await loginAs(fx.recruiter.email)
      const forbidden = await api.get('/api/v1/cip').set(authHeader(recruiterToken))
      expect(forbidden.status).toBe(403)
    })
  })

  it('lists active seller codes (OD-2)', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.recruiter.email)
    const res = await api.get('/api/v1/cip/seller-codes').set(authHeader(token))
    expect(res.status).toBe(200)
    expect(res.body.some((s: { code: string }) => s.code === 'TS')).toBe(true)
  })
})
