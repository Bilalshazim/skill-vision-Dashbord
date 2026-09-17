import { Router } from 'express'
import { z } from 'zod'

import { audit } from '../../lib/audit.js'
import { ConflictError, NotFoundError } from '../../lib/errors.js'
import { prisma } from '../../lib/prisma.js'
import { requireAuth, requireCompanyScope, requireRole } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'

export const companiesRouter = Router()

companiesRouter.use(requireAuth)

// Blueprint §4.2 — scoped to caller's company unless platform admin.
companiesRouter.get('/', async (req, res, next) => {
  try {
    const where = req.auth!.role === 'PLATFORM_ADMIN' ? {} : { id: req.auth!.companyId ?? '__none__' }
    res.json(await prisma.company.findMany({ where, orderBy: { name: 'asc' } }))
  } catch (err) {
    next(err)
  }
})

companiesRouter.get('/:id', async (req, res, next) => {
  try {
    requireCompanyScope(req, req.params.id)
    const company = await prisma.company.findUniqueOrThrow({ where: { id: req.params.id } })
    res.json(company)
  } catch (err) {
    next(err)
  }
})

const createSchema = z.object({ name: z.string().min(1), platformId: z.string().uuid().optional(), vatNumber: z.string().optional() })

companiesRouter.post('/', requireRole('PLATFORM_ADMIN'), validateBody(createSchema), async (req, res, next) => {
  try {
    const company = await prisma.company.create({ data: req.body })
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'company.created', entityType: 'Company', entityId: company.id })
    res.status(201).json(company)
  } catch (err) {
    next(err)
  }
})

const redeemAccessCodeSchema = z.object({ code: z.string().min(1) })

// Any authenticated user of the company can redeem — this is the "unlock
// prompt" a locked module shows in the frontend, not an admin-only action.
// A code is single-use: once redeemedAt/companyId are set, it can never be
// redeemed again (by this or any other company), and it's tied
// permanently to whichever company redeemed it first.
companiesRouter.post('/:id/redeem-access-code', validateBody(redeemAccessCodeSchema), async (req, res, next) => {
  try {
    requireCompanyScope(req, req.params.id)
    const accessCode = await prisma.accessCode.findUnique({ where: { code: req.body.code } })
    if (!accessCode) throw new NotFoundError('Invalid access code')
    if (accessCode.redeemedAt) throw new ConflictError('This access code has already been redeemed')

    const company = await prisma.$transaction(async (tx) => {
      await tx.accessCode.update({ where: { id: accessCode.id }, data: { companyId: req.params.id, redeemedAt: new Date() } })
      const existing = await tx.company.findUniqueOrThrow({ where: { id: req.params.id } })
      const purchasedModules = existing.purchasedModules.includes(accessCode.module)
        ? existing.purchasedModules
        : [...existing.purchasedModules, accessCode.module]
      return tx.company.update({ where: { id: req.params.id }, data: { purchasedModules } })
    })
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'accessCode.redeemed', entityType: 'Company', entityId: req.params.id })
    res.json(company)
  } catch (err) {
    next(err)
  }
})
