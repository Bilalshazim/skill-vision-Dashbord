import crypto from 'node:crypto'

import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { api, authHeader, loginAs, prisma, resetDb, seedFixture } from './helpers.js'

function signWebhook(body: unknown, secret: string) {
  const raw = JSON.stringify(body)
  return { raw, signature: crypto.createHmac('sha256', secret).update(raw).digest('hex') }
}

describe('Shortlist ("Migliori Candidati") + test invitation + webhook', () => {
  beforeEach(resetDb)
  afterAll(async () => prisma.$disconnect())

  async function setupCampaignCandidate() {
    const fx = await seedFixture()
    const token = await loginAs(fx.recruiter.email)
    const candidate = await api.post('/api/v1/candidates').set(authHeader(token)).send({ fullName: 'Shortlist Candidate', email: 'sl@example.com' })
    const add = await api.post(`/api/v1/candidates/campaign/${fx.campaign.id}`).set(authHeader(token)).send({ candidateId: candidate.body.id })
    return { fx, token, candidateId: candidate.body.id, campaignCandidateId: add.body.id }
  }

  it('"Selezionato per approfondimento" links the existing candidate — no duplicate record', async () => {
    const { fx, token, campaignCandidateId, candidateId } = await setupCampaignCandidate()
    const shortlist = await api.post('/api/v1/shortlist').set(authHeader(token)).send({ campaignCandidateId, selectedFrom: 'CV_ELABORATI' })
    expect(shortlist.status).toBe(201)
    expect(shortlist.body.status).toBe('DA_INVIARE')
    expect(shortlist.body.campaignCandidateId).toBe(campaignCandidateId)

    const candidateCount = await prisma.candidate.count({ where: { id: candidateId } })
    expect(candidateCount).toBe(1)

    // Adding the same campaign-candidate to the shortlist twice is a conflict.
    const again = await api.post('/api/v1/shortlist').set(authHeader(token)).send({ campaignCandidateId, selectedFrom: 'MANUAL' })
    expect(again.status).toBe(409)
    void fx
  })

  it('walks the full state machine: Da inviare -> Inviato -> Ha risposto', async () => {
    const { fx, token, campaignCandidateId } = await setupCampaignCandidate()
    const shortlist = await api.post('/api/v1/shortlist').set(authHeader(token)).send({ campaignCandidateId, selectedFrom: 'CV_ELABORATI' })
    expect(shortlist.body.status).toBe('DA_INVIARE')

    const sent = await api.post(`/api/v1/shortlist/${shortlist.body.id}/send-test`).set(authHeader(token)).send({})
    expect(sent.status).toBe(201)
    expect(sent.body.sentStatus).toBe('SENT')

    let after = await prisma.shortlist.findUnique({ where: { id: shortlist.body.id } })
    expect(after?.status).toBe('INVIATO')
    let cc = await prisma.campaignCandidate.findUnique({ where: { id: campaignCandidateId } })
    expect(cc?.status).toBe('TEST_INVIATO')

    // Sending again is a conflict — it's already sent.
    const again = await api.post(`/api/v1/shortlist/${shortlist.body.id}/send-test`).set(authHeader(token)).send({})
    expect(again.status).toBe(409)

    const { raw, signature } = signWebhook({ eventId: 'evt-1', testLink: sent.body.testLink, score: 88 }, process.env.TEST_PROVIDER_WEBHOOK_SECRET!)
    const webhook = await api.post('/api/v1/webhooks/test-provider').set('Content-Type', 'application/json').set('X-Signature', signature).send(raw)
    expect(webhook.status).toBe(200)

    after = await prisma.shortlist.findUnique({ where: { id: shortlist.body.id } })
    expect(after?.status).toBe('HA_RISPOSTO')
    cc = await prisma.campaignCandidate.findUnique({ where: { id: campaignCandidateId } })
    expect(cc?.status).toBe('TEST_HA_RISPOSTO')
    void fx
  })

  it('"INVIA LINK TEST" fails clearly when no sender is configured for the company', async () => {
    const { token, campaignCandidateId, fx } = await setupCampaignCandidate()
    await prisma.senderConfig.deleteMany({ where: { companyId: fx.company.id } })
    const shortlist = await api.post('/api/v1/shortlist').set(authHeader(token)).send({ campaignCandidateId, selectedFrom: 'MANUAL' })
    const sent = await api.post(`/api/v1/shortlist/${shortlist.body.id}/send-test`).set(authHeader(token)).send({})
    expect(sent.status).toBe(400)
    expect(sent.body.error.message).toMatch(/sender/i)
  })

  it('"INVIA LINK TEST" fails clearly when the candidate has no email on file — never a silent/fake send', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.recruiter.email)
    const candidate = await api.post('/api/v1/candidates').set(authHeader(token)).send({ fullName: 'No Email Candidate' }) // no email field
    const add = await api.post(`/api/v1/candidates/campaign/${fx.campaign.id}`).set(authHeader(token)).send({ candidateId: candidate.body.id })
    const shortlist = await api.post('/api/v1/shortlist').set(authHeader(token)).send({ campaignCandidateId: add.body.id, selectedFrom: 'MANUAL' })

    const sent = await api.post(`/api/v1/shortlist/${shortlist.body.id}/send-test`).set(authHeader(token)).send({})
    expect(sent.status).toBe(400)
    expect(sent.body.error.message).toMatch(/email/i)

    // Nothing advanced — the shortlist stays exactly where it was, not a
    // false "sent" state.
    const after = await prisma.shortlist.findUnique({ where: { id: shortlist.body.id } })
    expect(after?.status).toBe('DA_INVIARE')
  })

  it('"INVIA LINK TEST" uses the email set via PATCH /candidates/:id/email (Pagina A sync) — fails, then succeeds once synced', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.recruiter.email)
    const candidate = await api.post('/api/v1/candidates').set(authHeader(token)).send({ fullName: 'Synced Then Sent Candidate' }) // no email yet
    const add = await api.post(`/api/v1/candidates/campaign/${fx.campaign.id}`).set(authHeader(token)).send({ candidateId: candidate.body.id })
    const shortlist = await api.post('/api/v1/shortlist').set(authHeader(token)).send({ campaignCandidateId: add.body.id, selectedFrom: 'MANUAL' })

    const firstAttempt = await api.post(`/api/v1/shortlist/${shortlist.body.id}/send-test`).set(authHeader(token)).send({})
    expect(firstAttempt.status).toBe(400)

    const synced = await api.patch(`/api/v1/candidates/${candidate.body.id}/email`).set(authHeader(token)).send({ email: 'synced-then-sent@example.com' })
    expect(synced.status).toBe(200)

    const secondAttempt = await api.post(`/api/v1/shortlist/${shortlist.body.id}/send-test`).set(authHeader(token)).send({})
    expect(secondAttempt.status).toBe(201)
    expect(secondAttempt.body.sentStatus).toBe('SENT')
    expect(secondAttempt.body.providerMessageId).toBeTruthy()
  })

  it('"INVIA LINK TEST" really sends via SMTP (JSON transport in tests — see lib/mailer.ts) and persists a real provider message id', async () => {
    const { fx, token, campaignCandidateId } = await setupCampaignCandidate()
    const shortlist = await api.post('/api/v1/shortlist').set(authHeader(token)).send({ campaignCandidateId, selectedFrom: 'MANUAL' })

    const sent = await api.post(`/api/v1/shortlist/${shortlist.body.id}/send-test`).set(authHeader(token)).send({})
    expect(sent.status).toBe(201)
    expect(sent.body.sentStatus).toBe('SENT')
    expect(sent.body.provider).toBe('smtp')
    expect(sent.body.providerMessageId).toBeTruthy()

    // The response never carries anything SMTP-credential-shaped.
    expect(JSON.stringify(sent.body)).not.toMatch(/password/i)
    void fx
  })

  describe('webhook security', () => {
    it('rejects a request with no signature', async () => {
      const res = await api.post('/api/v1/webhooks/test-provider').send({ eventId: 'x', testLink: 'y' })
      expect(res.status).toBe(401)
    })

    it('rejects a request with an invalid signature', async () => {
      const res = await api.post('/api/v1/webhooks/test-provider').set('X-Signature', 'deadbeef'.repeat(8)).send({ eventId: 'x', testLink: 'y' })
      expect(res.status).toBe(401)
    })

    it('is idempotent — replaying the same event id does not create a second TestResponse', async () => {
      const { token, campaignCandidateId } = await setupCampaignCandidate()
      const shortlist = await api.post('/api/v1/shortlist').set(authHeader(token)).send({ campaignCandidateId, selectedFrom: 'MANUAL' })
      const sent = await api.post(`/api/v1/shortlist/${shortlist.body.id}/send-test`).set(authHeader(token)).send({})

      const payload = { eventId: 'evt-replay', testLink: sent.body.testLink, score: 77 }
      const { raw, signature } = signWebhook(payload, process.env.TEST_PROVIDER_WEBHOOK_SECRET!)

      const first = await api.post('/api/v1/webhooks/test-provider').set('Content-Type', 'application/json').set('X-Signature', signature).send(raw)
      const second = await api.post('/api/v1/webhooks/test-provider').set('Content-Type', 'application/json').set('X-Signature', signature).send(raw)
      expect(first.status).toBe(200)
      expect(second.status).toBe(200)
      expect(second.body.duplicate).toBe(true)

      const count = await prisma.testResponse.count({ where: { webhookEventId: 'evt-replay' } })
      expect(count).toBe(1)
    })
  })

  describe('Phase 34 §7/§8/§15/§16: cross-company isolation (real bugs found + fixed in final QA)', () => {
    it('a user from a different company cannot create, read, send-test, mark-sent, or manual-respond to another company\'s shortlist', async () => {
      const { fx, token, campaignCandidateId } = await setupCampaignCandidate()
      const otherToken = await loginAs(fx.otherCompanyRecruiter.email)

      // Cannot even CREATE a shortlist entry against another company's campaignCandidate.
      const crossCreate = await api.post('/api/v1/shortlist').set(authHeader(otherToken)).send({ campaignCandidateId, selectedFrom: 'MANUAL' })
      expect(crossCreate.status).toBe(403)

      // Owning company creates + sends normally.
      const shortlist = await api.post('/api/v1/shortlist').set(authHeader(token)).send({ campaignCandidateId, selectedFrom: 'MANUAL' })
      expect(shortlist.status).toBe(201)

      const crossList = await api.get(`/api/v1/shortlist/campaign/${fx.campaign.id}`).set(authHeader(otherToken))
      expect(crossList.status).toBe(403)

      const crossSend = await api.post(`/api/v1/shortlist/${shortlist.body.id}/send-test`).set(authHeader(otherToken)).send({})
      expect(crossSend.status).toBe(403)

      const crossMarkSent = await api.post(`/api/v1/shortlist/${shortlist.body.id}/mark-sent`).set(authHeader(otherToken)).send()
      expect(crossMarkSent.status).toBe(403)

      const sent = await api.post(`/api/v1/shortlist/${shortlist.body.id}/send-test`).set(authHeader(token)).send({})
      expect(sent.status).toBe(201)

      const crossInvitation = await api.get(`/api/v1/shortlist/invitations/${sent.body.id}`).set(authHeader(otherToken))
      expect(crossInvitation.status).toBe(403)

      const crossManual = await api.post(`/api/v1/shortlist/${shortlist.body.id}/manual-response`).set(authHeader(otherToken)).send({ score: 50 })
      expect(crossManual.status).toBe(403)

      const crossManualDelete = await api.delete(`/api/v1/shortlist/${shortlist.body.id}/manual-response`).set(authHeader(otherToken))
      expect(crossManualDelete.status).toBe(403)
    })
  })

  describe('Phase 32 §6: manual test response (ReceivedVia.MANUAL)', () => {
    it('records a recruiter-entered score, moves status to Ha risposto, and replaces on re-entry (latest wins)', async () => {
      const { token, campaignCandidateId } = await setupCampaignCandidate()
      const shortlist = await api.post('/api/v1/shortlist').set(authHeader(token)).send({ campaignCandidateId, selectedFrom: 'MANUAL' })
      await api.post(`/api/v1/shortlist/${shortlist.body.id}/send-test`).set(authHeader(token)).send({})

      const first = await api.post(`/api/v1/shortlist/${shortlist.body.id}/manual-response`).set(authHeader(token)).send({ score: 72, note: 'phone screen' })
      expect(first.status).toBe(201)
      expect(first.body.score).toBe(72)
      expect(first.body.receivedVia).toBe('MANUAL')

      let after = await prisma.shortlist.findUnique({ where: { id: shortlist.body.id } })
      expect(after?.status).toBe('HA_RISPOSTO')

      // Latest wins — same rule as the frontend's addTestResult() replace-on-add.
      const second = await api.post(`/api/v1/shortlist/${shortlist.body.id}/manual-response`).set(authHeader(token)).send({ score: 91 })
      expect(second.status).toBe(201)
      expect(second.body.score).toBe(91)
      const count = await prisma.testResponse.count({ where: { testInvitationId: second.body.testInvitationId } })
      expect(count).toBe(1)

      const removed = await api.delete(`/api/v1/shortlist/${shortlist.body.id}/manual-response`).set(authHeader(token))
      expect(removed.status).toBe(204)
      const afterRemove = await prisma.testResponse.count({ where: { testInvitationId: second.body.testInvitationId } })
      expect(afterRemove).toBe(0)
      after = await prisma.shortlist.findUnique({ where: { id: shortlist.body.id } })
      void after
    })

    it('rejects a manual response before any test was sent', async () => {
      const { token, campaignCandidateId } = await setupCampaignCandidate()
      const shortlist = await api.post('/api/v1/shortlist').set(authHeader(token)).send({ campaignCandidateId, selectedFrom: 'MANUAL' })
      const res = await api.post(`/api/v1/shortlist/${shortlist.body.id}/manual-response`).set(authHeader(token)).send({ score: 50 })
      expect(res.status).toBe(400)
    })
  })

  describe('OD-8: no invented day-count for "Non ha risposto"', () => {
    it('the threshold config exists but starts unset, and nothing transitions a shortlist to NON_HA_RISPOSTO automatically', async () => {
      const { fx, token, campaignCandidateId } = await setupCampaignCandidate()
      const shortlist = await api.post('/api/v1/shortlist').set(authHeader(token)).send({ campaignCandidateId, selectedFrom: 'MANUAL' })
      await api.post(`/api/v1/shortlist/${shortlist.body.id}/send-test`).set(authHeader(token)).send({})

      const config = await prisma.nonResponseThresholdConfig.findUnique({ where: { campaignId: fx.campaign.id } })
      expect(config).toBeNull() // no row, no invented default

      // Even a shortlist entry "sent" a long time ago stays INVIATO — no
      // scheduled job exists in this codebase to flip it.
      await prisma.shortlist.update({ where: { id: shortlist.body.id }, data: { addedAt: new Date('2000-01-01') } })
      const after = await prisma.shortlist.findUnique({ where: { id: shortlist.body.id } })
      expect(after?.status).toBe('INVIATO')
    })
  })
})
