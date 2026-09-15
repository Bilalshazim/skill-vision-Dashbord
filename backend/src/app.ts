import cors from 'cors'
import express from 'express'
import { pinoHttp } from 'pino-http'

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { authRouter } from './modules/auth/routes.js'
import { campaignsRouter } from './modules/campaigns/routes.js'
import { candidateProfilesRouter } from './modules/candidateProfiles/routes.js'
import { candidatesRouter } from './modules/candidates/routes.js'
import { cipRouter } from './modules/cip/routes.js'
import { companiesRouter } from './modules/companies/routes.js'
import { cvRouter } from './modules/cv/routes.js'
import { emailConfigRouter } from './modules/emailConfig/routes.js'
import { evaluatorsRouter } from './modules/evaluators/routes.js'
import { healthRouter } from './modules/health/routes.js'
import { jobProfilesRouter } from './modules/jobProfiles/routes.js'
import { platformsRouter } from './modules/platforms/routes.js'
import { shortlistRouter } from './modules/shortlist/routes.js'
import { webhooksRouter } from './modules/webhooks/routes.js'
import { env } from './lib/env.js'
import { logger } from './lib/logger.js'

export function createApp() {
  const app = express()

  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }))
  // Phase 34 §16/§23 — open (reflect-all) by default, matching every prior
  // phase's local-dev behavior exactly (no behavior change here) — but now
  // configurable via CORS_ORIGIN so production can lock this to the real
  // frontend origin(s) without a code change. Comma-separated list; unset
  // keeps the original dev-friendly default. This does not itself pick a
  // production value — see the final report's production-configuration
  // checklist for what to actually set.
  app.use(cors(env.corsOrigins ? { origin: env.corsOrigins } : undefined))

  // `verify` stashes the exact raw bytes Express received, before JSON
  // parsing — the webhook route (§5.3, §19) signs/verifies against THIS,
  // never `JSON.stringify(req.body)`. A reparsed-then-restringified body
  // can differ from what the sender actually signed (key order, spacing),
  // which would make every real signature fail — this is what "verify
  // against the exact bytes" means in practice, not just in principle.
  app.use(
    express.json({
      limit: '2mb',
      verify: (req, _res, buf) => {
        ;(req as express.Request).rawBody = buf
      },
    }),
  )

  app.use('/health', healthRouter)
  app.use('/api/v1/auth', authRouter)
  app.use('/api/v1/platforms', platformsRouter)
  app.use('/api/v1/companies', companiesRouter)
  app.use('/api/v1/campaigns', campaignsRouter)
  app.use('/api/v1/cip', cipRouter)
  app.use('/api/v1/candidates', candidatesRouter)
  app.use('/api/v1/cv', cvRouter)
  app.use('/api/v1/shortlist', shortlistRouter)
  app.use('/api/v1/evaluators', evaluatorsRouter)
  app.use('/api/v1/candidate-profiles', candidateProfilesRouter)
  app.use('/api/v1/email-config', emailConfigRouter)
  app.use('/api/v1/job-profiles', jobProfilesRouter)
  app.use('/api/v1/webhooks', webhooksRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
