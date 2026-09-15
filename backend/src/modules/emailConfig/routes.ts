import { Router } from 'express'
import { z } from 'zod'

import { audit } from '../../lib/audit.js'
import { BadGatewayError, NotFoundError } from '../../lib/errors.js'
import { sendMail, smtpConfigured, verifySmtpConnection } from '../../lib/mailer.js'
import { prisma } from '../../lib/prisma.js'
import { requireAuth, requireCompanyScope, requireRole } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'

export const emailConfigRouter = Router()

emailConfigRouter.use(requireAuth)

// "Configurazione mittente" — company-scoped, company-admin editable (§5.1).
const senderConfigSchema = z.object({ senderType: z.enum(['COMPANY_HR', 'SKILLVISION_ADMIN']), displayName: z.string().min(1), replyToEmail: z.string().email() })

emailConfigRouter.get('/companies/:companyId/sender-config', requireRole('COMPANY_ADMIN', 'RECRUITER', 'PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    requireCompanyScope(req, req.params.companyId)
    res.json(await prisma.senderConfig.findMany({ where: { companyId: req.params.companyId } }))
  } catch (err) {
    next(err)
  }
})

emailConfigRouter.patch('/companies/:companyId/sender-config', requireRole('COMPANY_ADMIN'), validateBody(senderConfigSchema), async (req, res, next) => {
  try {
    requireCompanyScope(req, req.params.companyId)
    const config = await prisma.senderConfig.create({
      data: { companyId: req.params.companyId, ...req.body, createdById: req.auth!.sub },
    })
    res.status(201).json(config)
  } catch (err) {
    next(err)
  }
})

// "Email questionario" — subject/body, company- or campaign-scoped (§5.1).
const templateSchema = z.object({ companyId: z.string().uuid().optional(), campaignId: z.string().uuid().optional(), subject: z.string().min(1), body: z.string().min(1) })

emailConfigRouter.get('/campaigns/:campaignId/email-template', requireRole('COMPANY_ADMIN', 'RECRUITER'), async (req, res, next) => {
  try {
    const template = await prisma.emailTemplate.findFirst({ where: { campaignId: req.params.campaignId }, orderBy: { createdAt: 'desc' } })
    res.json(template)
  } catch (err) {
    next(err)
  }
})

emailConfigRouter.patch('/campaigns/:campaignId/email-template', requireRole('COMPANY_ADMIN'), validateBody(templateSchema), async (req, res, next) => {
  try {
    const template = await prisma.emailTemplate.create({
      data: { campaignId: req.params.campaignId, companyId: req.body.companyId, subject: req.body.subject, body: req.body.body, createdById: req.auth!.sub },
    })
    res.status(201).json(template)
  } catch (err) {
    next(err)
  }
})

// "Servizio di invio email" — §10/§19: PLATFORM ADMIN ONLY. The raw key
// never enters a response body, masked or otherwise — only a reference to
// where the real value lives in a secrets manager.
const serviceConfigSchema = z.object({
  providerName: z.string().min(1),
  apiEndpointUrl: z.string().url(),
  apiKeySecretRef: z.string().min(1),
  scope: z.enum(['GLOBAL', 'PLATFORM']).default('GLOBAL'),
  platformId: z.string().uuid().optional(),
})

function redact<T extends { apiKeySecretRef: string }>(config: T) {
  const { apiKeySecretRef: _omit, ...rest } = config
  return { ...rest, apiKeySecretRefConfigured: true }
}

emailConfigRouter.get('/admin/email-service', requireRole('PLATFORM_ADMIN'), async (_req, res, next) => {
  try {
    const configs = await prisma.emailServiceConfig.findMany()
    res.json(configs.map(redact))
  } catch (err) {
    next(err)
  }
})

emailConfigRouter.patch('/admin/email-service', requireRole('PLATFORM_ADMIN'), validateBody(serviceConfigSchema), async (req, res, next) => {
  try {
    const config = await prisma.emailServiceConfig.create({ data: { ...req.body, createdById: req.auth!.sub } })
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'email_service_config.created', entityType: 'EmailServiceConfig', entityId: config.id })
    res.status(201).json(redact(config))
  } catch (err) {
    next(err)
  }
})

emailConfigRouter.post('/admin/email-service/:id/activate', requireRole('PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const config = await prisma.emailServiceConfig.findUnique({ where: { id: req.params.id } })
    if (!config) throw new NotFoundError('Email service config not found')
    const updated = await prisma.emailServiceConfig.update({ where: { id: config.id }, data: { active: true } })
    res.json(redact(updated))
  } catch (err) {
    next(err)
  }
})

// Real SMTP config (SMTP_HOST/SMTP_USER/SMTP_PASSWORD/MAIL_FROM in the
// backend .env, see lib/mailer.ts) — a SEPARATE, env-based mailer from the
// DB-backed EmailServiceConfig abstraction above. This is the "status"
// half: never returns the password, only whether it's configured.
emailConfigRouter.get('/admin/smtp-status', requireRole('PLATFORM_ADMIN'), (_req, res) => {
  res.json({ configured: smtpConfigured })
})

// §7/§8 — a safe verification mechanism: confirms the SMTP connection +
// authentication (transporter.verify(), no message sent) and, only if a
// `to` address is explicitly given, sends one real test email. Never
// touches candidate/shortlist/campaign data — this is the only route in
// the app that can send an email with no TestInvitation/candidate/company
// behind it at all, which is exactly why it's platform-admin-only.
const testSendSchema = z.object({ to: z.string().email().optional() })

emailConfigRouter.post('/admin/email-service/test-send', requireRole('PLATFORM_ADMIN'), validateBody(testSendSchema), async (req, res, next) => {
  try {
    const connection = await verifySmtpConnection()
    if (!connection.ok) throw new BadGatewayError(`SMTP connection/authentication failed: ${connection.reason}`)

    if (!req.body.to) {
      res.json({ connection: 'ok', sent: false })
      return
    }

    const result = await sendMail({
      to: req.body.to,
      subject: 'Skill Vision — test email di configurazione SMTP',
      text: `Questa è una email di test inviata dal pannello di amministrazione Skill Vision per verificare la configurazione SMTP.\n\nInviata da: ${req.auth!.sub}\nData: ${new Date().toISOString()}`,
    })
    if (!result.ok) throw new BadGatewayError(`SMTP send failed: ${result.reason}`)

    await audit(prisma, { actorUserId: req.auth!.sub, action: 'smtp.test_send', entityType: 'SmtpTest', entityId: result.messageId, metadata: { to: req.body.to } })
    res.json({ connection: 'ok', sent: true, messageId: result.messageId })
  } catch (err) {
    next(err)
  }
})
