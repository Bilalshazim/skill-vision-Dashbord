import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

import { authHeader, loginAs, prisma, resetDb, seedFixture } from './helpers.js'

// Phase "SMTP" — a SEPARATE app instance built with SMTP deliberately
// unset, to integration-test the real "backend unavailable"/"not
// configured" path through the actual HTTP route (not just lib/mailer.ts
// in isolation — see tests/mailer.test.ts for that). The shared `app` in
// helpers.ts is already bound to .env.test's (fake-but-present) SMTP
// values by the time any other test file runs, so this needs its own
// fresh module graph via vi.resetModules() + a dynamic re-import.
describe('POST /shortlist/:id/send-test — SMTP not configured', () => {
  let api: ReturnType<typeof request>

  beforeEach(async () => {
    await resetDb()
    vi.stubEnv('SMTP_HOST', '')
    vi.stubEnv('SMTP_USER', '')
    vi.stubEnv('SMTP_PASSWORD', '')
    vi.stubEnv('MAIL_FROM', '')
    vi.resetModules()
    const { createApp } = await import('../src/app.js')
    api = request(createApp())
  })
  afterAll(async () => {
    vi.unstubAllEnvs()
    vi.resetModules()
    await prisma.$disconnect()
  })

  it('returns 502, marks the invitation FAILED with a real reason, and does NOT advance the shortlist — never a false success', async () => {
    const fx = await seedFixture()
    const token = await loginAs(fx.recruiter.email)
    const candidate = await api.post('/api/v1/candidates').set(authHeader(token)).send({ fullName: 'Unconfigured SMTP Candidate', email: 'nosmtp@example.com' })
    const add = await api.post(`/api/v1/candidates/campaign/${fx.campaign.id}`).set(authHeader(token)).send({ candidateId: candidate.body.id })
    const shortlist = await api.post('/api/v1/shortlist').set(authHeader(token)).send({ campaignCandidateId: add.body.id, selectedFrom: 'MANUAL' })

    const sent = await api.post(`/api/v1/shortlist/${shortlist.body.id}/send-test`).set(authHeader(token)).send({})
    expect(sent.status).toBe(502)
    expect(sent.body.error.code).toBe('bad_gateway')

    const invitation = await prisma.testInvitation.findFirst({ where: { shortlistId: shortlist.body.id } })
    expect(invitation?.sentStatus).toBe('FAILED')
    expect(invitation?.failureReason).toMatch(/not configured/i)

    const afterShortlist = await prisma.shortlist.findUnique({ where: { id: shortlist.body.id } })
    expect(afterShortlist?.status).toBe('DA_INVIARE') // unchanged — nothing was actually sent
    const cc = await prisma.campaignCandidate.findUnique({ where: { id: add.body.id } })
    expect(cc?.status).not.toBe('TEST_INVIATO')
  })
})
