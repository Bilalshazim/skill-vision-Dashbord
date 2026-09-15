import crypto from 'node:crypto'

import type { Prisma } from '@prisma/client'
import type { Request } from 'express'
import { Router } from 'express'
import { z } from 'zod'

import { audit } from '../../lib/audit.js'
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../lib/errors.js'
import { hashToken } from '../../lib/jwt.js'
import { prisma } from '../../lib/prisma.js'
import { optionalAuth, requireAuth, requireCompanyScope, requireRole } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'

export const evaluatorsRouter = Router()

// OD-9, approved: support BOTH a full login AND an accountless evaluator
// authorized by a scoped, single-use token instead — never widen what that
// evaluator can see beyond their own assignment.
async function resolveEvaluatorAccess(req: Request): Promise<{ evaluatorId: string }> {
  const scopedToken = req.header('x-evaluator-token')
  if (scopedToken) {
    const evaluator = await prisma.evaluator.findUnique({ where: { accessTokenHash: hashToken(scopedToken) } })
    if (!evaluator || !evaluator.accessTokenExpiresAt || evaluator.accessTokenExpiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired evaluator access token')
    }
    return { evaluatorId: evaluator.id }
  }
  if (!req.auth) throw new UnauthorizedError()
  const evaluator = await prisma.evaluator.findUnique({ where: { userId: req.auth.sub } })
  if (!evaluator) throw new ForbiddenError('No evaluator record for this account')
  return { evaluatorId: evaluator.id }
}

const createEvaluatorSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['HR', 'MANAGER', 'DIRETTORE_HR', 'ALTRO']),
  altroLabel: z.string().optional(),
  companyId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
})

// Phase 34 §12/§15/§16 — REAL BUG FOUND AND FIXED during final QA: same gap
// class as cv/routes.ts and candidateProfiles/routes.ts, found here too —
// a COMPANY_ADMIN could create an evaluator (and, below, assign one, or
// issue an access token for one) under ANOTHER company's companyId, since
// nothing checked the body's companyId against the caller's own.
evaluatorsRouter.post('/', requireAuth, requireRole('COMPANY_ADMIN', 'PLATFORM_ADMIN'), validateBody(createEvaluatorSchema), async (req, res, next) => {
  try {
    if (req.body.companyId) requireCompanyScope(req, req.body.companyId)
    const evaluator = await prisma.evaluator.create({ data: req.body })
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'evaluator.created', entityType: 'Evaluator', entityId: evaluator.id })
    res.status(201).json(evaluator)
  } catch (err) {
    next(err)
  }
})

// Issues a scoped, single-use access token for an accountless evaluator
// (OD-9) — a real system would email this as a link; here it's returned
// directly to the caller (company admin), who is responsible for
// delivering it, matching how the frontend's own SurveyLink flow already
// works (a link the admin copies and sends themselves).
evaluatorsRouter.post('/:id/issue-access-token', requireAuth, requireRole('COMPANY_ADMIN', 'PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const evaluator = await prisma.evaluator.findUnique({ where: { id: req.params.id } })
    if (!evaluator) throw new NotFoundError('Evaluator not found')
    if (evaluator.companyId) requireCompanyScope(req, evaluator.companyId)
    const token = crypto.randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
    await prisma.evaluator.update({ where: { id: evaluator.id }, data: { accessTokenHash: hashToken(token), accessTokenExpiresAt: expiresAt } })
    res.json({ token, expiresAt })
  } catch (err) {
    next(err)
  }
})

// Phase 33 §4/§5 — the missing READ side the evaluator-facing UI needs:
// nothing in Phase 30/32 exposed "who am I, and what am I assigned to
// evaluate" to the evaluator themselves (every existing route either
// creates/assigns evaluators as an admin, or upserts/submits ONE specific
// evaluation the caller already knows the campaignCandidateId for). This
// uses only the already-modeled relationship — CampaignEvaluatorAssignment
// (campaign-level, Phase 30 schema) -> that campaign's CampaignCandidate
// rows — same resolveEvaluatorAccess() dual-auth boundary as every other
// evaluator-scoped route, so it can never widen what a given evaluator
// (whether logged in or holding a scoped token) sees beyond their own
// assignments. No candidate filtering beyond "which campaigns is this
// evaluator assigned to" — that IS the full scope the schema defines;
// narrowing further (e.g. "only shortlisted candidates") would be an
// invented rule, not one that's already there.
evaluatorsRouter.get('/me', optionalAuth, async (req, res, next) => {
  try {
    const { evaluatorId } = await resolveEvaluatorAccess(req)
    const evaluator = await prisma.evaluator.findUniqueOrThrow({ where: { id: evaluatorId } })
    res.json({ id: evaluator.id, fullName: evaluator.fullName, email: evaluator.email, role: evaluator.role, altroLabel: evaluator.altroLabel })
  } catch (err) {
    next(err)
  }
})

evaluatorsRouter.get('/me/assignments', optionalAuth, async (req, res, next) => {
  try {
    const { evaluatorId } = await resolveEvaluatorAccess(req)
    const assignments = await prisma.campaignEvaluatorAssignment.findMany({
      where: { evaluatorId },
      include: {
        campaign: {
          include: {
            company: true,
            candidates: { include: { candidate: true } },
          },
        },
      },
    })

    const myEvaluations = await prisma.evaluation.findMany({ where: { evaluatorId } })
    const evalByCandidate = new Map(myEvaluations.map((e) => [e.campaignCandidateId, e]))

    const result = assignments.flatMap((a) =>
      a.campaign.candidates.map((cc) => ({
        campaignCandidateId: cc.id,
        campaignId: a.campaign.id,
        campaignName: a.campaign.name,
        companyName: a.campaign.company.name,
        candidate: { id: cc.candidate.id, fullName: cc.candidate.fullName },
        status: cc.status,
        myEvaluation: evalByCandidate.get(cc.id) || null,
      })),
    )
    res.json(result)
  } catch (err) {
    next(err)
  }
})

const assignSchema = z.object({ evaluatorId: z.string().uuid() })

evaluatorsRouter.post('/campaigns/:campaignId/assign', requireAuth, requireRole('COMPANY_ADMIN', 'PLATFORM_ADMIN'), validateBody(assignSchema), async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: req.params.campaignId } })
    requireCompanyScope(req, campaign.companyId)
    const existing = await prisma.campaignEvaluatorAssignment.findUnique({
      where: { campaignId_evaluatorId: { campaignId: req.params.campaignId, evaluatorId: req.body.evaluatorId } },
    })
    if (existing) throw new ConflictError('Evaluator already assigned to this campaign')
    const assignment = await prisma.campaignEvaluatorAssignment.create({
      data: { campaignId: req.params.campaignId, evaluatorId: req.body.evaluatorId },
    })
    res.status(201).json(assignment)
  } catch (err) {
    next(err)
  }
})

// Evaluations — one row per (campaignCandidate, evaluator), independent by
// construction (§6): a submitted evaluation is immutable, and this route
// only ever touches the CALLING evaluator's own row, whether they arrived
// via a full login or a scoped token.
const upsertEvaluationSchema = z.object({
  campaignCandidateId: z.string().uuid(),
  scores: z.record(z.string(), z.unknown()).default({}),
  finalScore: z.number().optional(),
  recommendation: z.enum(['PROCEDI', 'RISERVA', 'CONFRONTA', 'NO']).optional(),
  notes: z.string().optional(),
})

// Phase 34 §12/§16 — REAL BUG FOUND AND FIXED: resolveEvaluatorAccess()
// verifies WHO is calling, but nothing then checked that this evaluator is
// actually ASSIGNED (via CampaignEvaluatorAssignment) to the campaign that
// owns the campaignCandidateId they're submitting for — any evaluator
// (logged in or via a valid scoped token for a DIFFERENT campaign) could
// upsert an evaluation for a candidate they were never assigned to, just
// by knowing/guessing the campaignCandidateId. Fixed by requiring a real
// assignment row to exist first — the same relationship /me/assignments
// already reads, now also enforced as a write guard, not just a filter.
async function requireEvaluatorAssignedToCandidate(evaluatorId: string, campaignCandidateId: string): Promise<void> {
  const cc = await prisma.campaignCandidate.findUnique({ where: { id: campaignCandidateId } })
  if (!cc) throw new NotFoundError('Campaign candidate not found')
  const assignment = await prisma.campaignEvaluatorAssignment.findUnique({
    where: { campaignId_evaluatorId: { campaignId: cc.campaignId, evaluatorId } },
  })
  if (!assignment) throw new ForbiddenError('Not assigned to evaluate this candidate')
}

evaluatorsRouter.post('/evaluations', optionalAuth, async (req, res, next) => {
  try {
    const { evaluatorId } = await resolveEvaluatorAccess(req)
    const parsed = upsertEvaluationSchema.parse(req.body)
    await requireEvaluatorAssignedToCandidate(evaluatorId, parsed.campaignCandidateId)

    const existing = await prisma.evaluation.findUnique({
      where: { campaignCandidateId_evaluatorId: { campaignCandidateId: parsed.campaignCandidateId, evaluatorId } },
    })
    if (existing?.status === 'SUBMITTED') throw new ConflictError('This evaluation was already submitted and is immutable')

    const scores = parsed.scores as Prisma.InputJsonValue
    const evaluation = await prisma.evaluation.upsert({
      where: { campaignCandidateId_evaluatorId: { campaignCandidateId: parsed.campaignCandidateId, evaluatorId } },
      create: { ...parsed, scores, evaluatorId, status: 'DRAFT' },
      update: { ...parsed, scores },
    })
    res.status(existing ? 200 : 201).json(evaluation)
  } catch (err) {
    next(err)
  }
})

evaluatorsRouter.post('/evaluations/:id/submit', optionalAuth, async (req, res, next) => {
  try {
    const { evaluatorId } = await resolveEvaluatorAccess(req)
    const evaluation = await prisma.evaluation.findUnique({ where: { id: req.params.id } })
    if (!evaluation) throw new NotFoundError('Evaluation not found')
    if (evaluation.evaluatorId !== evaluatorId) throw new ForbiddenError('Not your evaluation')
    if (evaluation.status === 'SUBMITTED') throw new ConflictError('Already submitted')
    const submitted = await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: { status: 'SUBMITTED', submittedAt: new Date(), signedAt: new Date() },
    })
    res.json(submitted)
  } catch (err) {
    next(err)
  }
})

evaluatorsRouter.get('/campaign-candidates/:id/evaluations', requireAuth, requireRole('RECRUITER', 'COMPANY_ADMIN', 'PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const cc = await prisma.campaignCandidate.findUnique({ where: { id: req.params.id }, include: { campaign: true } })
    if (!cc) throw new NotFoundError('Campaign candidate not found')
    requireCompanyScope(req, cc.campaign.companyId)
    const evaluations = await prisma.evaluation.findMany({ where: { campaignCandidateId: req.params.id }, include: { evaluator: true } })
    res.json(evaluations)
  } catch (err) {
    next(err)
  }
})
