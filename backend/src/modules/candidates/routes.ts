import { Router } from 'express'
import { z } from 'zod'

import { audit } from '../../lib/audit.js'
import { ConflictError, NotFoundError } from '../../lib/errors.js'
import { prisma } from '../../lib/prisma.js'
import { requireAuth, requireCompanyScope, requireRole } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'

export const candidatesRouter = Router()

candidatesRouter.use(requireAuth)

function normalizeEmail(email?: string | null): string | null {
  return email ? email.trim().toLowerCase() : null
}

// OD-4, approved: email-match SUGGESTION only — never an automatic merge.
// Called before creating a new candidate so the recruiter can choose to
// link to an existing person instead.
candidatesRouter.get('/suggest-match', requireRole('RECRUITER', 'COMPANY_ADMIN'), async (req, res, next) => {
  try {
    const email = normalizeEmail(req.query.email as string | undefined)
    if (!email) return res.json({ suggestions: [] })
    const suggestions = await prisma.candidate.findMany({ where: { normalizedEmail: email }, take: 5 })
    res.json({ suggestions })
  } catch (err) {
    next(err)
  }
})

const createCandidateSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  source: z.enum(['ARCHIVE', 'NEW_APPLICANT', 'MANUAL']).optional(),
})

candidatesRouter.post('/', requireRole('RECRUITER', 'COMPANY_ADMIN'), validateBody(createCandidateSchema), async (req, res, next) => {
  try {
    const candidate = await prisma.candidate.create({
      data: { ...req.body, normalizedEmail: normalizeEmail(req.body.email) },
    })
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'candidate.created', entityType: 'Candidate', entityId: candidate.id })
    res.status(201).json(candidate)
  } catch (err) {
    next(err)
  }
})

// §12: stores the candidate's actual retention choice. Only the two values
// the brief specifies — 2 years or 6 months — no additional legal wording
// invented (OD-10 stays a tracking-only concern, see cv/routes.ts's
// /retention/review for the "no automatic action" half of this).
const retentionSchema = z.object({ cvRetentionChoice: z.enum(['TWO_YEARS', 'SIX_MONTHS']) })

candidatesRouter.patch('/:id/retention', requireRole('RECRUITER', 'COMPANY_ADMIN'), validateBody(retentionSchema), async (req, res, next) => {
  try {
    const choice = req.body.cvRetentionChoice as 'TWO_YEARS' | 'SIX_MONTHS'
    const months = choice === 'TWO_YEARS' ? 24 : 6
    const expires = new Date()
    expires.setMonth(expires.getMonth() + months)
    const candidate = await prisma.candidate.update({
      where: { id: req.params.id },
      data: { cvRetentionChoice: choice, cvRetentionExpiresAt: expires },
    })
    res.json(candidate)
  } catch (err) {
    next(err)
  }
})

// Pagina A's per-row email input (frontend lib/candidates.ts
// setCandidateEmail()) used to write only the local mirror — the backend
// Candidate.email was never updated, so a real send from "INVIA LINK TEST"
// later failed with "no email address on file" even for a backend-linked
// candidate. This syncs the email the recruiter actually typed to the one
// record send-test reads from. Same shape as PATCH /:id/retention just
// above: one field, no company-scope check (Candidate has none — same as
// every other route in this file except the campaign-scoped ones).
// Clearing the email (empty string) is a legitimate value, matching the
// local-only behavior it mirrors — stored as null, same as POST /'s own
// normalizeEmail() treatment of an absent email.
const updateEmailSchema = z.object({ email: z.union([z.string().email(), z.literal('')]) })

candidatesRouter.patch('/:id/email', requireRole('RECRUITER', 'COMPANY_ADMIN'), validateBody(updateEmailSchema), async (req, res, next) => {
  try {
    const existing = await prisma.candidate.findUnique({ where: { id: req.params.id } })
    if (!existing) throw new NotFoundError('Candidate not found')
    const email = req.body.email || null
    const candidate = await prisma.candidate.update({
      where: { id: req.params.id },
      data: { email, normalizedEmail: normalizeEmail(email) },
    })
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'candidate.email_updated', entityType: 'Candidate', entityId: candidate.id })
    res.json(candidate)
  } catch (err) {
    next(err)
  }
})

candidatesRouter.get('/:id', requireRole('RECRUITER', 'COMPANY_ADMIN', 'PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const candidate = await prisma.candidate.findUnique({ where: { id: req.params.id } })
    if (!candidate) throw new NotFoundError('Candidate not found')
    res.json(candidate)
  } catch (err) {
    next(err)
  }
})

// Explicit, recruiter-confirmed merge (OD-4's "manual merge confirmation
// required") — moves `sourceCandidateId`'s CampaignCandidate rows onto
// `targetCandidateId` and deletes the source record. Never called by
// suggest-match itself; always a separate, deliberate action.
const mergeSchema = z.object({ sourceCandidateId: z.string().uuid(), targetCandidateId: z.string().uuid() })

candidatesRouter.post('/merge', requireRole('RECRUITER', 'COMPANY_ADMIN'), validateBody(mergeSchema), async (req, res, next) => {
  try {
    const { sourceCandidateId, targetCandidateId } = req.body as z.infer<typeof mergeSchema>
    if (sourceCandidateId === targetCandidateId) throw new ConflictError('Cannot merge a candidate into itself')

    const [source, target] = await Promise.all([
      prisma.candidate.findUnique({ where: { id: sourceCandidateId }, include: { campaigns: true } }),
      prisma.candidate.findUnique({ where: { id: targetCandidateId } }),
    ])
    if (!source || !target) throw new NotFoundError('Candidate not found')

    await prisma.$transaction(async (tx) => {
      for (const cc of source.campaigns) {
        const clash = await tx.campaignCandidate.findUnique({
          where: { campaignId_candidateId: { campaignId: cc.campaignId, candidateId: targetCandidateId } },
        })
        if (clash) {
          // Target is already in that campaign — leave the source row as an
          // orphaned duplicate for manual review rather than silently
          // dropping data (§21: never invent a destructive default).
          continue
        }
        await tx.campaignCandidate.update({ where: { id: cc.id }, data: { candidateId: targetCandidateId } })
      }
      await tx.candidate.delete({ where: { id: sourceCandidateId } })
    })

    await audit(prisma, {
      actorUserId: req.auth!.sub,
      action: 'candidate.merged',
      entityType: 'Candidate',
      entityId: targetCandidateId,
      metadata: { mergedFrom: sourceCandidateId },
    })
    res.json({ mergedInto: targetCandidateId })
  } catch (err) {
    next(err)
  }
})

// Blueprint §4.3 — campaign roster.
candidatesRouter.get('/campaign/:campaignId', requireRole('RECRUITER', 'COMPANY_ADMIN'), async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: req.params.campaignId } })
    requireCompanyScope(req, campaign.companyId)
    const where: Record<string, unknown> = { campaignId: req.params.campaignId }
    if (req.query.status) where.status = req.query.status
    const rows = await prisma.campaignCandidate.findMany({
      where,
      include: { candidate: true },
      orderBy: { icvScore: 'desc' },
    })
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

const addToCampaignSchema = z.object({ candidateId: z.string().uuid(), roleApplied: z.string().optional() })

candidatesRouter.post('/campaign/:campaignId', requireRole('RECRUITER', 'COMPANY_ADMIN'), validateBody(addToCampaignSchema), async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: req.params.campaignId } })
    requireCompanyScope(req, campaign.companyId)
    const existing = await prisma.campaignCandidate.findUnique({
      where: { campaignId_candidateId: { campaignId: req.params.campaignId, candidateId: req.body.candidateId } },
    })
    if (existing) throw new ConflictError('Candidate already in this campaign')
    const row = await prisma.campaignCandidate.create({
      data: { campaignId: req.params.campaignId, candidateId: req.body.candidateId, roleApplied: req.body.roleApplied },
    })
    res.status(201).json(row)
  } catch (err) {
    next(err)
  }
})
