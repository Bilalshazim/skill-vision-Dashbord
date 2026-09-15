import { Router } from 'express'
import { z } from 'zod'

import { audit } from '../../lib/audit.js'
import { prisma } from '../../lib/prisma.js'
import { requireAuth, requireCompanyScope, requireRole } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'

export const campaignsRouter = Router()

campaignsRouter.use(requireAuth)

campaignsRouter.get('/', requireRole('COMPANY_ADMIN', 'RECRUITER', 'PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const companyId = req.query.companyId as string | undefined
    if (companyId) requireCompanyScope(req, companyId)
    const where: Record<string, unknown> = {}
    if (companyId) where.companyId = companyId
    else if (req.auth!.role !== 'PLATFORM_ADMIN') where.companyId = req.auth!.companyId ?? '__none__'
    if (req.query.status) where.status = req.query.status
    res.json(await prisma.campaign.findMany({ where, orderBy: { createdAt: 'desc' } }))
  } catch (err) {
    next(err)
  }
})

const createSchema = z.object({ companyId: z.string().uuid(), name: z.string().min(1) })

campaignsRouter.post('/', requireRole('COMPANY_ADMIN', 'RECRUITER'), validateBody(createSchema), async (req, res, next) => {
  try {
    requireCompanyScope(req, req.body.companyId)
    const campaign = await prisma.campaign.create({ data: { companyId: req.body.companyId, name: req.body.name } })
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'campaign.created', entityType: 'Campaign', entityId: campaign.id })
    res.status(201).json(campaign)
  } catch (err) {
    next(err)
  }
})

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED']).optional(),
})

campaignsRouter.patch('/:id', requireRole('COMPANY_ADMIN', 'RECRUITER'), validateBody(patchSchema), async (req, res, next) => {
  try {
    const existing = await prisma.campaign.findUniqueOrThrow({ where: { id: req.params.id } })
    requireCompanyScope(req, existing.companyId)
    const campaign = await prisma.campaign.update({ where: { id: req.params.id }, data: req.body })
    res.json(campaign)
  } catch (err) {
    next(err)
  }
})

// Minimum-3-evaluators check lives at the application layer, not the
// schema, per Blueprint §6 — this is where a "move to evaluation" action
// would enforce it once that workflow step exists; exposed here as a
// read-only check other endpoints/tests can call.
campaignsRouter.get('/:id/evaluator-readiness', requireRole('COMPANY_ADMIN', 'RECRUITER'), async (req, res, next) => {
  try {
    const existing = await prisma.campaign.findUniqueOrThrow({ where: { id: req.params.id } })
    requireCompanyScope(req, existing.companyId)
    const count = await prisma.campaignEvaluatorAssignment.count({ where: { campaignId: req.params.id } })
    res.json({ assignedEvaluators: count, meetsMinimum: count >= 3 })
  } catch (err) {
    next(err)
  }
})

// Phase 35 §1/§2 — the missing READ the "Area Valutatore" admin panel
// needs to show its roster ("Valutatore 1 — HR", "Valutatore 2 —
// Manager", …) after a reload, not just a bare count. Same relationship
// /me/assignments (Phase 33) already reads from the other direction
// (CampaignEvaluatorAssignment -> Evaluator), exposed here for the admin
// side — not a new evaluator architecture, the same one, just a second
// read over it.
campaignsRouter.get('/:id/evaluators', requireRole('COMPANY_ADMIN', 'RECRUITER'), async (req, res, next) => {
  try {
    const existing = await prisma.campaign.findUniqueOrThrow({ where: { id: req.params.id } })
    requireCompanyScope(req, existing.companyId)
    const assignments = await prisma.campaignEvaluatorAssignment.findMany({
      where: { campaignId: req.params.id },
      include: { evaluator: true },
      orderBy: { assignedAt: 'asc' },
    })
    res.json(
      assignments.map((a) => ({
        id: a.evaluator.id,
        fullName: a.evaluator.fullName,
        email: a.evaluator.email,
        role: a.evaluator.role,
        altroLabel: a.evaluator.altroLabel,
        hasLogin: Boolean(a.evaluator.userId),
        hasAccessToken: Boolean(a.evaluator.accessTokenHash),
        assignedAt: a.assignedAt,
      })),
    )
  } catch (err) {
    next(err)
  }
})
