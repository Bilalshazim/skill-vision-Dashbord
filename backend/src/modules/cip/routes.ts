import { Router } from 'express'
import { z } from 'zod'

import { audit } from '../../lib/audit.js'
import { generateCip, voidCip } from '../../lib/cip.js'
import { NotFoundError } from '../../lib/errors.js'
import { prisma } from '../../lib/prisma.js'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'

export const cipRouter = Router()

cipRouter.use(requireAuth)

// OD-2, approved — admin-managed seller lookup table.
cipRouter.get('/seller-codes', async (_req, res, next) => {
  try {
    res.json(await prisma.sellerCode.findMany({ where: { active: true }, orderBy: { code: 'asc' } }))
  } catch (err) {
    next(err)
  }
})

const createSellerSchema = z.object({ code: z.string().min(1).max(8), label: z.string().min(1) })

cipRouter.post('/seller-codes', requireRole('PLATFORM_ADMIN'), validateBody(createSellerSchema), async (req, res, next) => {
  try {
    const seller = await prisma.sellerCode.create({ data: req.body })
    res.status(201).json(seller)
  } catch (err) {
    next(err)
  }
})

// Phase 33 §2 — the missing READ the CIP admin UI needs ("view current
// platform CIP"): nothing in Phase 30 listed CIPs by owner, only by exact
// `code` (below) — which the UI can't know in advance. Platform-admin only,
// per this phase's own explicit instruction ("CIP credentials/
// administration must respect platform-admin permissions") — not scoped
// per-company since CIP identifies a Platform (OD-1's approved half), and
// company-level CIP scoping isn't defined anywhere to safely narrow this to.
const listQuerySchema = z.object({ ownerType: z.enum(['PLATFORM', 'COMPANY', 'CAMPAIGN']).optional(), ownerId: z.string().uuid().optional() })

cipRouter.get('/', requireRole('PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query)
    const where: Record<string, unknown> = {}
    if (query.ownerType) where.ownerType = query.ownerType
    if (query.ownerId) where.ownerId = query.ownerId
    res.json(await prisma.cip.findMany({ where, include: { sellerCode: true }, orderBy: { generatedAt: 'desc' } }))
  } catch (err) {
    next(err)
  }
})

cipRouter.get('/:code', async (req, res, next) => {
  try {
    const cip = await prisma.cip.findUnique({ where: { code: req.params.code }, include: { sellerCode: true } })
    if (!cip) throw new NotFoundError('CIP not found')
    res.json(cip)
  } catch (err) {
    next(err)
  }
})

// OD-1 boundary: this is the explicit, manually-invoked generation call —
// see src/lib/cip.ts for why nothing wires it to an automatic trigger yet.
// Platform admin only: generating a CIP is an activation-level action.
const generateSchema = z.object({
  ownerType: z.enum(['PLATFORM', 'COMPANY', 'CAMPAIGN']),
  ownerId: z.string().uuid(),
  sellerCodeId: z.string().uuid(),
})

cipRouter.post('/', requireRole('PLATFORM_ADMIN'), validateBody(generateSchema), async (req, res, next) => {
  try {
    const cip = await generateCip(prisma, { ...req.body, generatedById: req.auth!.sub })
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'cip.generated', entityType: 'Cip', entityId: cip.id, metadata: { code: cip.code } })
    res.status(201).json(cip)
  } catch (err) {
    next(err)
  }
})

const voidSchema = z.object({ reason: z.string().min(1) })

cipRouter.post('/:id/void', requireRole('PLATFORM_ADMIN'), validateBody(voidSchema), async (req, res, next) => {
  try {
    const cip = await voidCip(prisma, req.params.id, req.auth!.sub, req.body.reason)
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'cip.voided', entityType: 'Cip', entityId: cip.id, metadata: { reason: req.body.reason } })
    res.json(cip)
  } catch (err) {
    next(err)
  }
})
