import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { api, authHeader, loginAs, prisma, resetDb, seedFixture } from './helpers.js'

describe('Candidate Profile (Profilo Candidatura)', () => {
  beforeEach(resetDb)
  afterAll(async () => prisma.$disconnect())

  it('walks draft -> saved -> approved -> publication_ready -> published, rejecting out-of-order transitions', async () => {
    const fx = await seedFixture()
    const recruiterToken = await loginAs(fx.recruiter.email)
    const adminToken = await loginAs(fx.companyAdmin.email)
    const candidate = await api.post('/api/v1/candidates').set(authHeader(recruiterToken)).send({ fullName: 'Profile Candidate' })
    const cc = await api.post(`/api/v1/candidates/campaign/${fx.campaign.id}`).set(authHeader(recruiterToken)).send({ candidateId: candidate.body.id })

    // Approving before saving is a conflict.
    const draft = await api.post('/api/v1/candidate-profiles').set(authHeader(recruiterToken)).send({ campaignCandidateId: cc.body.id, content: { summary: 'Draft summary' } })
    expect(draft.status).toBe(201)
    expect(draft.body.status).toBe('DRAFT')
    const tooEarly = await api.post(`/api/v1/candidate-profiles/${draft.body.id}/approve`).set(authHeader(adminToken)).send()
    expect(tooEarly.status).toBe(409)

    const saved = await api.post('/api/v1/candidate-profiles').set(authHeader(recruiterToken)).send({ campaignCandidateId: cc.body.id, content: { summary: 'Final summary' } })
    expect(saved.body.status).toBe('SAVED')

    const approved = await api.post(`/api/v1/candidate-profiles/${draft.body.id}/approve`).set(authHeader(adminToken)).send()
    expect(approved.status).toBe(200)
    expect(approved.body.status).toBe('APPROVED')
    expect(approved.body.approvedById).toBeTruthy()

    const publicationReady = await api.post(`/api/v1/candidate-profiles/${draft.body.id}/mark-publication-ready`).set(authHeader(adminToken)).send()
    expect(publicationReady.body.status).toBe('PUBLICATION_READY')

    const published = await api.post(`/api/v1/candidate-profiles/${draft.body.id}/publish`).set(authHeader(adminToken)).send()
    expect(published.status).toBe(200)
    expect(published.body.status).toBe('PUBLISHED')
    expect(published.body.publicationLink).toMatch(/^https:\/\//)
  })

  it('preview (GET before publish) and the published record read the exact same stored content', async () => {
    const fx = await seedFixture()
    const recruiterToken = await loginAs(fx.recruiter.email)
    const adminToken = await loginAs(fx.companyAdmin.email)
    const candidate = await api.post('/api/v1/candidates').set(authHeader(recruiterToken)).send({ fullName: 'Content Consistency Candidate' })
    const cc = await api.post(`/api/v1/candidates/campaign/${fx.campaign.id}`).set(authHeader(recruiterToken)).send({ candidateId: candidate.body.id })

    const content = { summary: 'A distinctive summary used to check identity', skills: ['A', 'B', 'C'] }
    const created = await api.post('/api/v1/candidate-profiles').set(authHeader(recruiterToken)).send({ campaignCandidateId: cc.body.id, content })
    await api.post('/api/v1/candidate-profiles').set(authHeader(recruiterToken)).send({ campaignCandidateId: cc.body.id, content }) // -> SAVED

    const preview = await api.get(`/api/v1/candidate-profiles/${created.body.id}`).set(authHeader(recruiterToken))
    await api.post(`/api/v1/candidate-profiles/${created.body.id}/approve`).set(authHeader(adminToken)).send()
    const published = await api.post(`/api/v1/candidate-profiles/${created.body.id}/publish`).set(authHeader(adminToken)).send()
    const afterPublish = await api.get(`/api/v1/candidate-profiles/${created.body.id}`).set(authHeader(recruiterToken))

    expect(preview.body.content).toEqual(content)
    expect(published.body.content).toEqual(content)
    expect(afterPublish.body.content).toEqual(content)
  })

  describe('Phase 34 §11/§15/§16: cross-company isolation (real bug found + fixed in final QA)', () => {
    it('a user from a different company cannot create, read, approve, or publish another company\'s candidate profile', async () => {
      const fx = await seedFixture()
      const recruiterToken = await loginAs(fx.recruiter.email)
      const adminToken = await loginAs(fx.companyAdmin.email)
      const otherToken = await loginAs(fx.otherCompanyRecruiter.email)
      const candidate = await api.post('/api/v1/candidates').set(authHeader(recruiterToken)).send({ fullName: 'Isolation Profile Candidate' })
      const cc = await api.post(`/api/v1/candidates/campaign/${fx.campaign.id}`).set(authHeader(recruiterToken)).send({ candidateId: candidate.body.id })

      // Cannot create/upsert a profile against another company's campaignCandidate.
      const crossCreate = await api.post('/api/v1/candidate-profiles').set(authHeader(otherToken)).send({ campaignCandidateId: cc.body.id, content: { summary: 'hijack attempt' } })
      expect(crossCreate.status).toBe(403)

      const created = await api.post('/api/v1/candidate-profiles').set(authHeader(recruiterToken)).send({ campaignCandidateId: cc.body.id, content: { summary: 'real' } })
      await api.post('/api/v1/candidate-profiles').set(authHeader(recruiterToken)).send({ campaignCandidateId: cc.body.id, content: { summary: 'real' } })

      const crossRead = await api.get(`/api/v1/candidate-profiles/${created.body.id}`).set(authHeader(otherToken))
      expect(crossRead.status).toBe(403)

      const crossApprove = await api.post(`/api/v1/candidate-profiles/${created.body.id}/approve`).set(authHeader(otherToken)).send()
      expect(crossApprove.status).toBe(403)

      await api.post(`/api/v1/candidate-profiles/${created.body.id}/approve`).set(authHeader(adminToken)).send()
      const crossPublish = await api.post(`/api/v1/candidate-profiles/${created.body.id}/publish`).set(authHeader(otherToken)).send()
      expect(crossPublish.status).toBe(403)
    })
  })
})
