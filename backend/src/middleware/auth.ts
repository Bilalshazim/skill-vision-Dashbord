import type { NextFunction, Request, Response } from 'express'

import { UnauthorizedError, ForbiddenError, PasswordChangeRequiredError, RoleForbiddenError } from '../lib/errors.js'
import { verifyAccessToken, type AccessTokenClaims } from '../lib/jwt.js'
import { prisma } from '../lib/prisma.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AccessTokenClaims
      // Raw request bytes as received, before JSON parsing — set by the
      // express.json() `verify` hook in app.ts. Webhook signature
      // verification (§5.3, §19) must use this, never a re-serialized body.
      rawBody?: Buffer
    }
  }
}

// §8: every endpoint requires a bearer JWT except the webhook (which uses
// signature verification instead — see src/modules/webhooks).
// Oltre alla firma, il token deve essere ancora attuale: utente attivo e
// stessa sessionVersion del database. Un cambio di password, ruolo o stato
// la fa crescere (modules/users), e da quel momento i token emessi prima
// sono rifiutati: l'utente esce subito, non alla scadenza del token.
// Con una password data dall’amministratore (mustChangePassword) passano solo
// le rotte che servono a sceglierne una propria: il resto risponde 403.
const FIRST_ACCESS_PATHS = new Set(['/api/v1/auth/me', '/api/v1/auth/me/password', '/api/v1/auth/me/preferences'])
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization')
  if (!header?.startsWith('Bearer ')) return next(new UnauthorizedError('Missing bearer token'))
  let claims: AccessTokenClaims
  try {
    claims = verifyAccessToken(header.slice('Bearer '.length))
  } catch {
    return next(new UnauthorizedError('Invalid or expired token'))
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: claims.sub }, select: { status: true, sessionVersion: true, mustChangePassword: true } })
    if (!user || user.status === 'DISABLED' || user.sessionVersion !== (claims.sv ?? 0)) return next(new UnauthorizedError('Session ended'))
    if (user.mustChangePassword && !FIRST_ACCESS_PATHS.has(req.originalUrl.split('?')[0])) return next(new PasswordChangeRequiredError())
    req.auth = claims
    next()
  } catch (err) {
    next(err)
  }
}

// Same as requireAuth, but a missing/invalid token is not an error — it
// just leaves req.auth unset. Used only where a second, non-JWT auth path
// exists for the same route (evaluators' scoped-token path, OD-9) and the
// route itself decides which one actually authorized the request.
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization')
  if (header?.startsWith('Bearer ')) {
    try {
      req.auth = verifyAccessToken(header.slice('Bearer '.length))
    } catch {
      /* fall through unauthenticated — the route's own token path may still authorize this request */
    }
  }
  next()
}

// §8: role check on top of authentication — the minimum role named in the
// Blueprint §4 "Auth" column for each route. Uses RoleForbiddenError (a
// distinctly-coded 403 — see errors.ts) rather than the generic
// ForbiddenError requireCompanyScope below uses, so the frontend can tell
// "wrong role for this JWT" apart from "wrong company" and react
// accordingly (a stale shell-bridged session can self-heal from the
// former; the latter is a real boundary that never should).
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(new UnauthorizedError())
    if (!roles.includes(req.auth.role)) return next(new RoleForbiddenError(`Requires role: ${roles.join(' or ')}`))
    next()
  }
}

// §8: every query a recruiter/company-admin makes is filtered by their own
// companyId — a platform_admin has no companyId claim and is exempt.
export function requireCompanyScope(req: Request, companyId: string): void {
  if (req.auth?.role === 'PLATFORM_ADMIN') return
  if (req.auth?.companyId !== companyId) throw new ForbiddenError('Not authorized for this company')
}
