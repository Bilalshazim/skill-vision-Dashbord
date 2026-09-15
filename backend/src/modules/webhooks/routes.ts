import crypto from 'node:crypto'

import type { Prisma } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

import { UnauthorizedError, NotFoundError, BadRequestError } from '../../lib/errors.js'
import { prisma } from '../../lib/prisma.js'
import { env } from '../../lib/env.js'

export const webhooksRouter = Router()

// §11: the test-provider integration boundary. No real provider is named
// anywhere in the approved documents (Blueprint, decision sheet, or this
// phase's brief), so this route defines the SHAPE of what a provider must
// send and verifies it the way any provider integration would — HMAC
// signature + idempotency key — without claiming a specific vendor is
// wired. `TEST_PROVIDER_WEBHOOK_SECRET` in .env.example documents exactly
// what production activation needs (see final report §12).
//
// No requireAuth here on purpose — a webhook can't carry this platform's
// JWT. Authentication is the signature check below instead.
const payloadSchema = z.object({
  eventId: z.string().min(1),
  testLink: z.string().min(1),
  completedAt: z.string().datetime().optional(),
  score: z.number().optional(),
  raw: z.record(z.string(), z.unknown()).optional(),
})

webhooksRouter.post('/test-provider', async (req, res, next) => {
  try {
    if (!env.testProviderWebhookSecret) {
      throw new BadRequestError('No test-provider webhook secret configured — see TestProviderConfig / .env.example')
    }
    const signature = req.header('x-signature')
    if (!signature) throw new UnauthorizedError('Missing X-Signature header')
    if (!req.rawBody) throw new BadRequestError('Missing request body')

    // Signed over the exact bytes received (see app.ts's express.json
    // `verify` hook) — never a re-serialized JSON.stringify(req.body),
    // which can differ from what the sender actually signed.
    const expected = crypto.createHmac('sha256', env.testProviderWebhookSecret).update(req.rawBody).digest('hex')
    const sigBuf = Buffer.from(signature)
    const expBuf = Buffer.from(expected)
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      throw new UnauthorizedError('Invalid signature')
    }

    const parsed = payloadSchema.safeParse(req.body)
    if (!parsed.success) throw new BadRequestError('Invalid webhook payload shape')
    const body = parsed.data

    // Idempotency: a replayed event with the same id is a no-op, never a
    // duplicate TestResponse row (§11, §19).
    const already = await prisma.testResponse.findUnique({ where: { webhookEventId: body.eventId } })
    if (already) return res.status(200).json({ received: true, duplicate: true })

    const invitation = await prisma.testInvitation.findFirst({ where: { testLink: body.testLink } })
    if (!invitation) throw new NotFoundError('No matching test invitation for this link')

    await prisma.$transaction(async (tx) => {
      await tx.testResponse.create({
        data: {
          testInvitationId: invitation.id,
          completedAt: body.completedAt ? new Date(body.completedAt) : new Date(),
          score: body.score,
          rawResult: body.raw as Prisma.InputJsonValue | undefined,
          receivedVia: 'WEBHOOK',
          webhookEventId: body.eventId,
        },
      })
      const shortlist = await tx.shortlist.findUnique({ where: { id: invitation.shortlistId } })
      if (shortlist) {
        await tx.shortlist.update({ where: { id: shortlist.id }, data: { status: 'HA_RISPOSTO' } })
        await tx.campaignCandidate.update({ where: { id: shortlist.campaignCandidateId }, data: { status: 'TEST_HA_RISPOSTO' } })
      }
    })

    res.status(200).json({ received: true })
  } catch (err) {
    next(err)
  }
})
