import { Router } from 'express'
import { z } from 'zod'

import { audit } from '../../lib/audit.js'
import { prisma } from '../../lib/prisma.js'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'

export const platformsRouter = Router()

platformsRouter.use(requireAuth)

// Blueprint §4.2 — platform admin only.
platformsRouter.get('/', requireRole('PLATFORM_ADMIN'), async (_req, res, next) => {
  try {
    res.json(await prisma.platform.findMany({ orderBy: { createdAt: 'desc' } }))
  } catch (err) {
    next(err)
  }
})

const createSchema = z.object({ name: z.string().min(1) })

platformsRouter.post('/', requireRole('PLATFORM_ADMIN'), validateBody(createSchema), async (req, res, next) => {
  try {
    const platform = await prisma.platform.create({ data: { name: req.body.name } })
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'platform.created', entityType: 'Platform', entityId: platform.id })
    res.status(201).json(platform)
  } catch (err) {
    next(err)
  }
})

// Marks a Platform active. Deliberately does NOT generate a CIP here — see
// src/lib/cip.ts for why that's a separate, explicit call rather than a
// side effect of this endpoint (OD-1's generation trigger is unresolved).
platformsRouter.post('/:id/activate', requireRole('PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const platform = await prisma.platform.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE', activatedAt: new Date() },
    })
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'platform.activated', entityType: 'Platform', entityId: platform.id })
    res.json(platform)
  } catch (err) {
    next(err)
  }
})
