import crypto from 'node:crypto'

import type { Prisma } from '@prisma/client'
import type { Request } from 'express'
import { Router } from 'express'
import { z } from 'zod'

import { audit } from '../../lib/audit.js'
import { BadGatewayError, BadRequestError, ConflictError, NotFoundError } from '../../lib/errors.js'
import { LOGO_CID, readLogoBuffer, renderCustomTestInvitation, renderDefaultTestInvitation } from '../../lib/emailTemplates.js'
import { sendMail, smtpConfigured } from '../../lib/mailer.js'
import { prisma } from '../../lib/prisma.js'
import { requireAuth, requireCompanyScope, requireRole } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'

export const shortlistRouter = Router()

shortlistRouter.use(requireAuth)

// Phase 34 §7/§8/§15/§16 — REAL BUG FOUND AND FIXED during final QA: this
// entire module had no company scoping anywhere — the same gap class found
// and fixed in cv/, candidateProfiles/, and evaluators/routes.ts moments
// earlier. A recruiter from any company could read or act on ANY other
// company's shortlist entries/test invitations by id. Resolved through
// shortlist -> campaignCandidate -> campaign, the same path every other
// fix in this pass uses, and applied to every route below.
async function requireShortlistCompanyScope(req: Request, shortlistId: string): Promise<{ campaignCandidate: { campaignId: string; id: string } }> {
  const shortlist = await prisma.shortlist.findUnique({ where: { id: shortlistId }, include: { campaignCandidate: true } })
  if (!shortlist) throw new NotFoundError('Shortlist entry not found')
  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: shortlist.campaignCandidate.campaignId } })
  requireCompanyScope(req, campaign.companyId)
  return shortlist
}

// "Selezionato per approfondimento" — links the EXISTING candidate record
// via campaignCandidateId (unique on Shortlist), never creates a new one.
// §21 / OD-6: the internal enum value stays CV_ELABORATI regardless of
// what the screen ends up being called in the UI — see routes comment
// below for where that label lives instead of here.
const createSchema = z.object({ campaignCandidateId: z.string().uuid(), selectedFrom: z.enum(['CV_ELABORATI', 'MANUAL']) })

shortlistRouter.post('/', requireRole('RECRUITER', 'COMPANY_ADMIN'), validateBody(createSchema), async (req, res, next) => {
  try {
    const cc = await prisma.campaignCandidate.findUnique({ where: { id: req.body.campaignCandidateId } })
    if (!cc) throw new NotFoundError('Campaign candidate not found')
    const owningCampaign = await prisma.campaign.findUniqueOrThrow({ where: { id: cc.campaignId } })
    requireCompanyScope(req, owningCampaign.companyId)
    const existing = await prisma.shortlist.findUnique({ where: { campaignCandidateId: cc.id } })
    if (existing) throw new ConflictError('Already shortlisted')

    const [shortlist] = await prisma.$transaction([
      prisma.shortlist.create({
        data: { campaignCandidateId: cc.id, selectedFrom: req.body.selectedFrom, addedById: req.auth!.sub },
      }),
      prisma.campaignCandidate.update({ where: { id: cc.id }, data: { status: 'TEST_DA_INVIARE' } }),
    ])
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'shortlist.added', entityType: 'Shortlist', entityId: shortlist.id })
    res.status(201).json(shortlist)
  } catch (err) {
    next(err)
  }
})

shortlistRouter.get('/campaign/:campaignId', requireRole('RECRUITER', 'COMPANY_ADMIN'), async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: req.params.campaignId } })
    requireCompanyScope(req, campaign.companyId)
    const where: Record<string, unknown> = { campaignCandidate: { campaignId: req.params.campaignId } }
    if (req.query.status) where.status = req.query.status
    const rows = await prisma.shortlist.findMany({
      where,
      include: { campaignCandidate: { include: { candidate: true } } },
      orderBy: { addedAt: 'desc' },
    })
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

// POST /shortlist/:id/send-test — the "INVIA LINK TEST" action (§9).
// Recruiter-facing surface only: candidate/recipient/link/message/send —
// technical email config (SMTP host/credentials) is looked up here, never
// exposed in the request/response (§10, §19) — see lib/mailer.ts, the only
// module that ever reads the SMTP password.
//
// REAL SENDING (this task): a real SMTP send now happens here — the
// invitation is written as PENDING first (a durable record even if the
// send fails), the send is attempted OUTSIDE any DB transaction (network
// I/O has no place inside a Prisma transaction — it would hold a lock for
// the duration of an external round-trip), and the final status reflects
// what ACTUALLY happened: SENT only on a real provider success, FAILED
// with a real reason otherwise. On failure this route returns a 502, not
// 201 — the existing frontend already treats any non-2xx as an error (see
// lib/backend-sync.ts sendTestLinkViaBackend()), so it never has to guess
// "did this actually send" from a 200 body; no frontend change was needed
// or made for this.
const sendTestSchema = z.object({ templateId: z.string().uuid().optional(), senderConfigId: z.string().uuid().optional() })

shortlistRouter.post('/:id/send-test', requireRole('RECRUITER', 'COMPANY_ADMIN'), validateBody(sendTestSchema), async (req, res, next) => {
  try {
    const shortlist = await prisma.shortlist.findUnique({
      where: { id: req.params.id },
      include: { campaignCandidate: { include: { candidate: true, campaign: { include: { company: true } } } } },
    })
    if (!shortlist) throw new NotFoundError('Shortlist entry not found')
    if (shortlist.status !== 'DA_INVIARE') throw new ConflictError(`Already ${shortlist.status.toLowerCase()}`)

    const companyId = shortlist.campaignCandidate.campaign.companyId
    requireCompanyScope(req, companyId)

    const candidate = shortlist.campaignCandidate.candidate
    if (!candidate.email) throw new BadRequestError('This candidate has no email address on file — add one before sending the test link')

    const senderConfig = req.body.senderConfigId
      ? await prisma.senderConfig.findUniqueOrThrow({ where: { id: req.body.senderConfigId } })
      : await prisma.senderConfig.findFirst({ where: { companyId }, orderBy: { createdAt: 'asc' } })
    if (!senderConfig) throw new BadRequestError('No sender configured for this company — set up "Configurazione mittente" first')

    const template = req.body.templateId
      ? await prisma.emailTemplate.findUnique({ where: { id: req.body.templateId } })
      : await prisma.emailTemplate.findFirst({ where: { campaignId: shortlist.campaignCandidate.campaignId }, orderBy: { createdAt: 'desc' } })

    // No real test-provider issues links yet (§11) — a random, unguessable
    // token stands in for "the link a real provider would give us", so the
    // rest of the flow (send/status/webhook shape) is real and testable
    // even though no test-taking service is wired. Email DELIVERY of this
    // link, however, is now real (this task).
    const testLink = `https://dashboard.skill-vision.it/t/${crypto.randomBytes(16).toString('hex')}`

    const invitation = await prisma.testInvitation.create({
      data: {
        shortlistId: shortlist.id,
        testLink,
        messageTemplateId: template?.id,
        senderConfigId: senderConfig.id,
        sentStatus: 'PENDING',
        createdById: req.auth!.sub,
      },
    })

    // §6/§9/§10 — one branded template either way: a real HTML + text
    // email always goes out, whether or not this campaign has a custom
    // EmailTemplate, and the same {{candidateName}}/{{companyName}}/
    // {{jobTitle}}/{{testLink}} placeholders work in both (see
    // lib/emailTemplates.ts).
    const vars = {
      candidateName: candidate.fullName,
      companyName: shortlist.campaignCandidate.campaign.company.name,
      jobTitle: shortlist.campaignCandidate.campaign.name,
      testLink,
    }
    const rendered = template ? renderCustomTestInvitation(template.subject, template.body, vars) : renderDefaultTestInvitation(vars)

    const result = await sendMail({
      to: candidate.email,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
      replyTo: senderConfig.replyToEmail,
      attachments: [{ filename: 'skillvision-logo.png', content: readLogoBuffer(), cid: LOGO_CID, contentType: 'image/png' }],
    })

    if (!result.ok) {
      await prisma.testInvitation.update({
        where: { id: invitation.id },
        data: { sentStatus: 'FAILED', failureReason: result.reason, provider: smtpConfigured ? 'smtp' : 'smtp (not configured)' },
      })
      await audit(prisma, { actorUserId: req.auth!.sub, action: 'test_invitation.send_failed', entityType: 'TestInvitation', entityId: invitation.id, metadata: { reason: result.reason } })
      throw new BadGatewayError(`Impossibile inviare l'email: ${result.reason}`)
    }

    const sent = await prisma.$transaction(async (tx) => {
      const updated = await tx.testInvitation.update({
        where: { id: invitation.id },
        data: { sentStatus: 'SENT', sentAt: new Date(), provider: 'smtp', providerMessageId: result.messageId },
      })
      await tx.shortlist.update({ where: { id: shortlist.id }, data: { status: 'INVIATO' } })
      await tx.campaignCandidate.update({ where: { id: shortlist.campaignCandidateId }, data: { status: 'TEST_INVIATO' } })
      return updated
    })

    await audit(prisma, { actorUserId: req.auth!.sub, action: 'test_invitation.sent', entityType: 'TestInvitation', entityId: sent.id })
    res.status(201).json(sent)
  } catch (err) {
    next(err)
  }
})

shortlistRouter.post('/:id/mark-sent', requireRole('RECRUITER', 'COMPANY_ADMIN'), async (req, res, next) => {
  try {
    await requireShortlistCompanyScope(req, req.params.id)
    const shortlist = await prisma.shortlist.findUnique({ where: { id: req.params.id } })
    if (!shortlist) throw new NotFoundError('Shortlist entry not found')
    if (shortlist.status !== 'DA_INVIARE') throw new ConflictError(`Already ${shortlist.status.toLowerCase()}`)
    const updated = await prisma.shortlist.update({ where: { id: req.params.id }, data: { status: 'INVIATO' } })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

shortlistRouter.get('/invitations/:id', requireRole('RECRUITER', 'COMPANY_ADMIN'), async (req, res, next) => {
  try {
    const invitation = await prisma.testInvitation.findUnique({ where: { id: req.params.id }, include: { response: true } })
    if (!invitation) throw new NotFoundError('Test invitation not found')
    await requireShortlistCompanyScope(req, invitation.shortlistId)
    res.json(invitation)
  } catch (err) {
    next(err)
  }
})

// Phase 32 §6 — the frontend's Pipeline "Ranking post-test" section lets a
// recruiter manually type in a candidate's test score (no real test
// provider is wired, see webhooks/routes.ts) — this is NOT the webhook
// path; it's the ALREADY-APPROVED `ReceivedVia.MANUAL` value Phase 30's own
// schema defined for exactly this case (prisma/schema.prisma), which had no
// route yet. Upsert-by-testInvitationId mirrors the frontend's existing
// "replace on add, latest wins" rule for the same candidate (lib/pipeline.ts
// addTestResult()) — not a new rule, the same one, just enforced by the
// TestResponse.testInvitationId unique constraint instead of an array
// filter.
const manualResponseSchema = z.object({ score: z.number().min(0).max(100), note: z.string().optional() })

shortlistRouter.post('/:id/manual-response', requireRole('RECRUITER', 'COMPANY_ADMIN'), validateBody(manualResponseSchema), async (req, res, next) => {
  try {
    const shortlist = await requireShortlistCompanyScope(req, req.params.id)
    const invitation = await prisma.testInvitation.findFirst({ where: { shortlistId: req.params.id }, orderBy: { createdAt: 'desc' } })
    if (!invitation) throw new BadRequestError('No test invitation exists for this shortlist entry yet — send the test link first')

    const body = req.body as z.infer<typeof manualResponseSchema>
    const response = await prisma.$transaction(async (tx) => {
      const saved = await tx.testResponse.upsert({
        where: { testInvitationId: invitation.id },
        create: {
          testInvitationId: invitation.id,
          completedAt: new Date(),
          score: body.score,
          rawResult: body.note ? ({ note: body.note } as Prisma.InputJsonValue) : undefined,
          receivedVia: 'MANUAL',
        },
        update: { completedAt: new Date(), score: body.score, rawResult: body.note ? ({ note: body.note } as Prisma.InputJsonValue) : undefined },
      })
      await tx.shortlist.update({ where: { id: req.params.id }, data: { status: 'HA_RISPOSTO' } })
      await tx.campaignCandidate.update({ where: { id: shortlist.campaignCandidate.id }, data: { status: 'TEST_HA_RISPOSTO' } })
      return saved
    })

    await audit(prisma, { actorUserId: req.auth!.sub, action: 'test_response.recorded_manually', entityType: 'TestResponse', entityId: response.id })
    res.status(201).json(response)
  } catch (err) {
    next(err)
  }
})

shortlistRouter.delete('/:id/manual-response', requireRole('RECRUITER', 'COMPANY_ADMIN'), async (req, res, next) => {
  try {
    await requireShortlistCompanyScope(req, req.params.id)
    const invitation = await prisma.testInvitation.findFirst({ where: { shortlistId: req.params.id }, orderBy: { createdAt: 'desc' } })
    if (!invitation) return res.status(204).send()
    await prisma.testResponse.deleteMany({ where: { testInvitationId: invitation.id, receivedVia: 'MANUAL' } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})
