import { Router } from 'express'
import { z } from 'zod'

import { audit } from '../../lib/audit.js'
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
