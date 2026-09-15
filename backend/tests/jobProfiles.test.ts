import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { api, authHeader, loginAs, prisma, resetDb, seedFixture } from './helpers.js'

describe('Job Profile (Phase 32 §5 — already-approved schema, new routes)', () => {
  beforeEach(resetDb)
  afterAll(async () => prisma.$disconnect())

  it('CREATE -> API SAVE -> DATABASE -> REFRESH -> API READ -> UI DISPLAY -> UPDATE -> REFRESH', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.recruiter.email)

    const empty = await api.get(`/api/v1/job-profiles/campaign/${fx.campaign.id}`).set(authHeader(token))
    expect(empty.status).toBe(200)
    expect(empty.body).toBeNull()

    const saved = await api
      .patch(`/api/v1/job-profiles/campaign/${fx.campaign.id}`)
      .set(authHeader(token))
      .send({ title: 'Sales Account Manager', header: { titolo: 'Sales Account Manager' }, sections: { responsabilita: { items: [] } }, hardSkillGroups: [], extraRequirements: [], salaryBenefits: {} })
    expect(saved.status).toBe(201)

    const dbRow = await prisma.jobProfile.findUnique({ where: { id: saved.body.id } })
    expect(dbRow?.campaignId).toBe(fx.campaign.id)

    // REFRESH -> API READ -> UI DISPLAY: a fresh GET (simulating page reload) returns the just-saved version.
    const read = await api.get(`/api/v1/job-profiles/campaign/${fx.campaign.id}`).set(authHeader(token))
    expect(read.body.id).toBe(saved.body.id)
    expect(read.body.header.titolo).toBe('Sales Account Manager')

    // UPDATE -> REFRESH: saving again creates a new version; GET returns the latest, not the first.
    const updated = await api
      .patch(`/api/v1/job-profiles/campaign/${fx.campaign.id}`)
      .set(authHeader(token))
      .send({ title: 'Sales Account Manager', header: { titolo: 'Senior Sales Account Manager' }, sections: {}, hardSkillGroups: [], extraRequirements: [], salaryBenefits: {} })
    expect(updated.status).toBe(201)
    expect(updated.body.id).not.toBe(saved.body.id)

    const readAgain = await api.get(`/api/v1/job-profiles/campaign/${fx.campaign.id}`).set(authHeader(token))
    expect(readAgain.body.id).toBe(updated.body.id)
    expect(readAgain.body.header.titolo).toBe('Senior Sales Account Manager')
  })

  it('a recruiter from a different company cannot read or write another company\'s Job Profile', async () => {
    const fx = await seedFixture()
    const ownToken = await loginAs(fx.recruiter.email)
    await api
      .patch(`/api/v1/job-profiles/campaign/${fx.campaign.id}`)
      .set(authHeader(ownToken))
      .send({ header: {}, sections: {}, hardSkillGroups: [], extraRequirements: [], salaryBenefits: {} })

    const otherToken = await loginAs(fx.otherCompanyRecruiter.email)
    const blockedRead = await api.get(`/api/v1/job-profiles/campaign/${fx.campaign.id}`).set(authHeader(otherToken))
    expect(blockedRead.status).toBe(403)
    const blockedWrite = await api
      .patch(`/api/v1/job-profiles/campaign/${fx.campaign.id}`)
      .set(authHeader(otherToken))
      .send({ header: {}, sections: {}, hardSkillGroups: [], extraRequirements: [], salaryBenefits: {} })
    expect(blockedWrite.status).toBe(403)
  })

  it('rejects an unauthenticated request', async () => {
    const fx = await seedFixture()
    const res = await api.get(`/api/v1/job-profiles/campaign/${fx.campaign.id}`)
    expect(res.status).toBe(401)
  })
})
