import { Router } from 'express'

import { prisma } from '../../lib/prisma.js'

export const healthRouter = Router()

// §1: liveness (process up) vs. readiness (DB reachable) — a load balancer
// or orchestrator cares about both, and about telling them apart.
healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok' })
})

healthRouter.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ready', database: 'connected' })
  } catch {
    res.status(503).json({ status: 'not_ready', database: 'unreachable' })
  }
})
