import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { api, authHeader, loginAs, prisma, resetDb, seedFixture } from './helpers.js'

describe('Email configuration — recruiter flow vs. system credentials kept apart', () => {
  beforeEach(resetDb)
  afterAll(async () => prisma.$disconnect())

  it('"Configurazione mittente" is company-scoped and company-admin editable', async () => {
    const fx = await seedFixture()
    const adminToken = await loginAs(fx.companyAdmin.email)
    const res = await api
      .patch(`/api/v1/email-config/companies/${fx.company.id}/sender-config`)
      .set(authHeader(adminToken))
      .send({ senderType: 'SKILLVISION_ADMIN', displayName: 'Skill Vision Admin', replyToEmail: 'admin@skill-vision.it' })
    expect(res.status).toBe(201)
    expect(res.body.senderType).toBe('SKILLVISION_ADMIN')

    const recruiterToken = await loginAs(fx.recruiter.email)
    const forbidden = await api
      .patch(`/api/v1/email-config/companies/${fx.company.id}/sender-config`)
      .set(authHeader(recruiterToken))
      .send({ senderType: 'COMPANY_HR', displayName: 'x', replyToEmail: 'x@x.com' })
    expect(forbidden.status).toBe(403)
  })

  it('"Email questionario" subject/body can be set per campaign', async () => {
    const fx = await seedFixture()
    const adminToken = await loginAs(fx.companyAdmin.email)
    const res = await api
      .patch(`/api/v1/email-config/campaigns/${fx.campaign.id}/email-template`)
      .set(authHeader(adminToken))
      .send({ subject: 'Il tuo test è pronto', body: 'Ciao {{candidate_name}}, ecco il link: {{test_link}}' })
    expect(res.status).toBe(201)
    const fetched = await api.get(`/api/v1/email-config/campaigns/${fx.campaign.id}/email-template`).set(authHeader(adminToken))
    expect(fetched.body.subject).toBe('Il tuo test è pronto')
  })

  describe('"Servizio di invio email" — OD-7 GLOBAL default, platform-admin only, credentials never exposed', () => {
    it('a company admin cannot read or write the email service config', async () => {
      const fx = await seedFixture()
      const adminToken = await loginAs(fx.companyAdmin.email)
      const read = await api.get('/api/v1/email-config/admin/email-service').set(authHeader(adminToken))
      expect(read.status).toBe(403)
      const write = await api
        .patch('/api/v1/email-config/admin/email-service')
        .set(authHeader(adminToken))
        .send({ providerName: 'x', apiEndpointUrl: 'https://example.com', apiKeySecretRef: 'secret-ref' })
      expect(write.status).toBe(403)
    })

    it('a platform admin can configure it, defaults to GLOBAL scope, and the raw key is never returned', async () => {
      const fx = await seedFixture()
      const token = await loginAs(fx.platformAdmin.email)
      const res = await api
        .patch('/api/v1/email-config/admin/email-service')
        .set(authHeader(token))
        .send({ providerName: 'ExampleMail', apiEndpointUrl: 'https://api.examplemail.test/v1/send', apiKeySecretRef: 'secrets-manager://examplemail/key' })
      expect(res.status).toBe(201)
      expect(res.body.scope).toBe('GLOBAL')
      expect(res.body.apiKeySecretRef).toBeUndefined()
      expect(res.body.apiKeySecretRefConfigured).toBe(true)
      expect(JSON.stringify(res.body)).not.toContain('secrets-manager://examplemail/key')

      // The raw key really isn't anywhere in the HTTP layer, even though it
      // is (correctly) sitting in the database as the reference we stored.
      const dbRow = await prisma.emailServiceConfig.findUnique({ where: { id: res.body.id } })
      expect(dbRow?.apiKeySecretRef).toBe('secrets-manager://examplemail/key')

      const list = await api.get('/api/v1/email-config/admin/email-service').set(authHeader(token))
      expect(JSON.stringify(list.body)).not.toContain('secrets-manager://examplemail/key')
    })
  })

  describe('Real SMTP mailer — status + safe test-send (platform-admin only, never touches candidate data)', () => {
    it('a company admin cannot see SMTP status or trigger a test-send', async () => {
      const fx = await seedFixture()
      const adminToken = await loginAs(fx.companyAdmin.email)
      const status = await api.get('/api/v1/email-config/admin/smtp-status').set(authHeader(adminToken))
      expect(status.status).toBe(403)
      const testSend = await api.post('/api/v1/email-config/admin/email-service/test-send').set(authHeader(adminToken)).send({})
      expect(testSend.status).toBe(403)
    })

    it('a platform admin sees SMTP is configured (JSON transport in tests) and can verify the connection without sending, or send one real test email', async () => {
      const fx = await seedFixture()
      const token = await loginAs(fx.platformAdmin.email)

      const status = await api.get('/api/v1/email-config/admin/smtp-status').set(authHeader(token))
      expect(status.status).toBe(200)
      expect(status.body.configured).toBe(true)

      const connectionOnly = await api.post('/api/v1/email-config/admin/email-service/test-send').set(authHeader(token)).send({})
      expect(connectionOnly.status).toBe(200)
      expect(connectionOnly.body).toEqual({ connection: 'ok', sent: false })

      const withSend = await api.post('/api/v1/email-config/admin/email-service/test-send').set(authHeader(token)).send({ to: 'qa@example.com' })
      expect(withSend.status).toBe(200)
      expect(withSend.body.sent).toBe(true)
      expect(withSend.body.messageId).toBeTruthy()
      expect(JSON.stringify(withSend.body)).not.toMatch(/password/i)
    })

    it('rejects an invalid `to` address without attempting to send', async () => {
      const fx = await seedFixture()
      const token = await loginAs(fx.platformAdmin.email)
      const res = await api.post('/api/v1/email-config/admin/email-service/test-send').set(authHeader(token)).send({ to: 'not-an-email' })
      expect(res.status).toBe(400)
    })
  })
})
