import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { api, authHeader, loginAs, prisma, resetDb, seedFixture } from './helpers.js'

describe('candidates & campaigns', () => {
  beforeEach(resetDb)
  afterAll(async () => prisma.$disconnect())

  it('lets a candidate participate in more than one campaign without duplicating the person', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.recruiter.email)
    const secondCampaign = await api.post('/api/v1/campaigns').set(authHeader(token)).send({ companyId: fx.company.id, name: 'Second campaign' })
    expect(secondCampaign.status).toBe(201)

    const candidate = await api.post('/api/v1/candidates').set(authHeader(token)).send({ fullName: 'Multi Campaign Candidate', email: 'multi@example.com' })
    expect(candidate.status).toBe(201)

    const add1 = await api.post(`/api/v1/candidates/campaign/${fx.campaign.id}`).set(authHeader(token)).send({ candidateId: candidate.body.id })
    const add2 = await api.post(`/api/v1/candidates/campaign/${secondCampaign.body.id}`).set(authHeader(token)).send({ candidateId: candidate.body.id })
    expect(add1.status).toBe(201)
    expect(add2.status).toBe(201)

    // Exactly one Candidate row, two CampaignCandidate rows.
    const dbCount = await prisma.candidate.count({ where: { email: 'multi@example.com' } })
    expect(dbCount).toBe(1)
    const rows = await prisma.campaignCandidate.findMany({ where: { candidateId: candidate.body.id } })
    expect(rows).toHaveLength(2)
  })

  it('rejects adding the same candidate to the same campaign twice', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.recruiter.email)
    const candidate = await api.post('/api/v1/candidates').set(authHeader(token)).send({ fullName: 'Dup Candidate' })
    await api.post(`/api/v1/candidates/campaign/${fx.campaign.id}`).set(authHeader(token)).send({ candidateId: candidate.body.id })
    const again = await api.post(`/api/v1/candidates/campaign/${fx.campaign.id}`).set(authHeader(token)).send({ candidateId: candidate.body.id })
    expect(again.status).toBe(409)
  })

  describe('OD-4: email-match suggestion — suggestion only, never automatic', () => {
    it('suggests an existing candidate by normalized email', async () => {
      const fx = await seedFixture()
      const token = await loginAs(fx.recruiter.email)
      await api.post('/api/v1/candidates').set(authHeader(token)).send({ fullName: 'Existing Person', email: 'Same.Person@Example.com' })

      const suggest = await api.get('/api/v1/candidates/suggest-match').query({ email: 'same.person@example.com' }).set(authHeader(token))
      expect(suggest.status).toBe(200)
      expect(suggest.body.suggestions).toHaveLength(1)
      expect(suggest.body.suggestions[0].fullName).toBe('Existing Person')
    })

    it('creating a candidate with a matching email does NOT automatically merge — two separate rows exist until a human confirms', async () => {
      const fx = await seedFixture()
      const token = await loginAs(fx.recruiter.email)
      const first = await api.post('/api/v1/candidates').set(authHeader(token)).send({ fullName: 'Person One', email: 'dup@example.com' })
      const second = await api.post('/api/v1/candidates').set(authHeader(token)).send({ fullName: 'Person One Again', email: 'dup@example.com' })
      expect(first.status).toBe(201)
      expect(second.status).toBe(201)
      expect(first.body.id).not.toBe(second.body.id)
      const count = await prisma.candidate.count({ where: { normalizedEmail: 'dup@example.com' } })
      expect(count).toBe(2)
    })

    it('an explicit merge call moves campaign participation onto the target and removes the source — only when a human calls it', async () => {
      const fx = await seedFixture()
      const token = await loginAs(fx.recruiter.email)
      const source = await api.post('/api/v1/candidates').set(authHeader(token)).send({ fullName: 'Source Person', email: 'dup2@example.com' })
      const target = await api.post('/api/v1/candidates').set(authHeader(token)).send({ fullName: 'Target Person', email: 'dup2@example.com' })
      await api.post(`/api/v1/candidates/campaign/${fx.campaign.id}`).set(authHeader(token)).send({ candidateId: source.body.id })

      const merge = await api.post('/api/v1/candidates/merge').set(authHeader(token)).send({ sourceCandidateId: source.body.id, targetCandidateId: target.body.id })
      expect(merge.status).toBe(200)
      expect(merge.body.mergedInto).toBe(target.body.id)

      const sourceGone = await prisma.candidate.findUnique({ where: { id: source.body.id } })
      expect(sourceGone).toBeNull()
      const rows = await prisma.campaignCandidate.findMany({ where: { candidateId: target.body.id } })
      expect(rows).toHaveLength(1)
    })
  })

  it('a recruiter cannot list another company\'s campaign roster', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.otherCompanyRecruiter.email)
    const res = await api.get(`/api/v1/candidates/campaign/${fx.campaign.id}`).set(authHeader(token))
    // requireCompanyScope throws AFTER fetching the campaign — that fetch
    // succeeds (campaigns aren't secret), but scope check on the OWN
    // company id rejects it.
    expect(res.status).toBe(403)
  })

  describe('PATCH /:id/email — Pagina A email sync (the record "INVIA LINK TEST" actually reads)', () => {
    it('updates the email and its normalized mirror', async () => {
      const fx = await seedFixture()
      const token = await loginAs(fx.recruiter.email)
      const candidate = await api.post('/api/v1/candidates').set(authHeader(token)).send({ fullName: 'Email Sync Candidate' }) // no email yet

      const updated = await api.patch(`/api/v1/candidates/${candidate.body.id}/email`).set(authHeader(token)).send({ email: 'Synced.Person@Example.com' })
      expect(updated.status).toBe(200)
      expect(updated.body.email).toBe('Synced.Person@Example.com')

      const row = await prisma.candidate.findUnique({ where: { id: candidate.body.id } })
      expect(row?.email).toBe('Synced.Person@Example.com')
      expect(row?.normalizedEmail).toBe('synced.person@example.com')
    })

    it('clears the email (empty string) — a legitimate value, matching the local-only mirror it replaces', async () => {
      const fx = await seedFixture()
      const token = await loginAs(fx.recruiter.email)
      const candidate = await api.post('/api/v1/candidates').set(authHeader(token)).send({ fullName: 'Clear Email Candidate', email: 'before@example.com' })

      const cleared = await api.patch(`/api/v1/candidates/${candidate.body.id}/email`).set(authHeader(token)).send({ email: '' })
      expect(cleared.status).toBe(200)
      expect(cleared.body.email).toBeNull()

      const row = await prisma.candidate.findUnique({ where: { id: candidate.body.id } })
      expect(row?.email).toBeNull()
      expect(row?.normalizedEmail).toBeNull()
    })

    it('rejects a malformed email and does not touch the record', async () => {
      const fx = await seedFixture()
      const token = await loginAs(fx.recruiter.email)
      const candidate = await api.post('/api/v1/candidates').set(authHeader(token)).send({ fullName: 'Bad Email Candidate', email: 'good@example.com' })

      const bad = await api.patch(`/api/v1/candidates/${candidate.body.id}/email`).set(authHeader(token)).send({ email: 'not-an-email' })
      expect(bad.status).toBe(400)

      const row = await prisma.candidate.findUnique({ where: { id: candidate.body.id } })
      expect(row?.email).toBe('good@example.com')
    })

    it('404s for a candidate that does not exist', async () => {
      const fx = await seedFixture()
      const token = await loginAs(fx.recruiter.email)
      const res = await api.patch('/api/v1/candidates/00000000-0000-0000-0000-000000000099/email').set(authHeader(token)).send({ email: 'x@example.com' })
      expect(res.status).toBe(404)
    })
  })

  it('stores the actual CV retention choice (2 years / 6 months) with a computed expiry', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.recruiter.email)
    const candidate = await api.post('/api/v1/candidates').set(authHeader(token)).send({ fullName: 'Retention Candidate' })

    const twoYears = await api.patch(`/api/v1/candidates/${candidate.body.id}/retention`).set(authHeader(token)).send({ cvRetentionChoice: 'TWO_YEARS' })
    expect(twoYears.status).toBe(200)
    expect(twoYears.body.cvRetentionChoice).toBe('TWO_YEARS')
    const expiresYears = new Date(twoYears.body.cvRetentionExpiresAt).getUTCFullYear()
    expect(expiresYears).toBeGreaterThanOrEqual(new Date().getUTCFullYear() + 1)

    const sixMonths = await api.patch(`/api/v1/candidates/${candidate.body.id}/retention`).set(authHeader(token)).send({ cvRetentionChoice: 'SIX_MONTHS' })
    expect(sixMonths.body.cvRetentionChoice).toBe('SIX_MONTHS')
  })
})
