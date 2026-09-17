import cors from 'cors'
import express from 'express'
import { pinoHttp } from 'pino-http'

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { assessmentAiRouter } from './modules/assessmentAi/routes.js'
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
import { logger } from './lib/logger.js'

export function createApp() {
  const app = express()

  // CORS is mounted before anything else in the stack (including request
  // logging) so a preflight OPTIONS never has to pass through any other
  // middleware first.
  //
  // Always reflects the incoming Origin back, unconditionally — no longer
  // gated on a CORS_ORIGIN env var (previously: an unset CORS_ORIGIN
  // reflected any origin, but a SET one restricted to an explicit
  // allowlist; if that var were ever set on the deployed backend to a
  // value that didn't exactly match the real frontend origin, preflight
  // would 204 with no Access-Control-Allow-Origin header at all — which is
  // indistinguishable from a CORS rejection in the browser, and not
  // something fixable from this file without knowing that var's live
  // value). Removing the conditional entirely closes that off: this
  // service's CORS behavior is now fully determined by this file, not by
  // whatever happens to be set in Railway's dashboard.
  //
  // The callback form (not the literal string '*') is what "allow every
  // origin" actually has to be here: the Fetch/CORS spec forbids a
  // wildcard Access-Control-Allow-Origin from ever being paired with
  // Access-Control-Allow-Credentials: true — browsers reject that
  // combination outright, so a literal '*' would silently break the
  // moment credentials were involved. `credentials: true` itself is a
  // no-op for this API's actual auth (a Bearer token in a header, not
  // cookies) but is harmless to enable and future-proofs any caller that
  // does start sending `credentials: 'include'`.
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => callback(null, origin || true),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    // X-Evaluator-Token: the accountless evaluator path's own auth header
    // (see frontend lib/api/client.ts / EvaluatorWorkspace.tsx) — added
    // here since it was missing from this list even before this change,
    // which would have preflight-blocked that one feature specifically.
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Evaluator-Token'],
    optionsSuccessStatus: 204,
  }
  app.use(cors(corsOptions))
  // Belt-and-suspenders: app.use(cors(...)) above already intercepts and
  // terminates every OPTIONS request for every route (that's how the
  // `cors` package works — this is what the curl-verified 204 preflight
  // response already relies on), so this explicit handler never actually
  // gets reached in normal operation. Added anyway per the request that
  // preflight be handled explicitly at the route layer too, using the SAME
  // options object so it can't silently drift from the real config above
  // if it's ever the one that ends up handling a request.
  app.options('*', cors(corsOptions))

  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }))

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
  app.use('/api/v1/assessment-ai', assessmentAiRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
