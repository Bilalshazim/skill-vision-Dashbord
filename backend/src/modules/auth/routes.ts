import { Router } from 'express'
import { z } from 'zod'

import { clearRefreshCookie, cookieRequestOriginAllowed, readRefreshCookie, setRefreshCookie } from '../../lib/authCookie.js'
import { ForbiddenError, TooManyRequestsError, UnauthorizedError } from '../../lib/errors.js'
import { generateRefreshToken, hashToken, signAccessToken } from '../../lib/jwt.js'
import { verifyPassword } from '../../lib/password.js'
import { prisma } from '../../lib/prisma.js'
import { createLimiter } from '../../lib/rateLimit.js'
import { requireAuth } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'

export const authRouter = Router()

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })

// Fase 8 — limite ai tentativi di login. Due chiavi:
//  - per IP + email: 5 tentativi falliti in 15 minuti, poi 429 fino alla
//    fine della finestra. Un accesso riuscito azzera il conto.
//  - per IP: 30 tentativi (riusciti o no) in 15 minuti, contro chi prova
//    molte email diverse dallo stesso indirizzo.
//  - per email, da qualunque IP: 20 tentativi falliti in 15 minuti, contro
//    chi distribuisce i tentativi su molti indirizzi. Più alto del limite
//    per IP + email, perché blocca anche il titolare dell'account.
// La risposta 429 porta Retry-After. Il messaggio non dice se l'email esiste.
const WINDOW_MS = 15 * 60 * 1000
export const loginFailLimiter = createLimiter({ max: 5, windowMs: WINDOW_MS })
export const loginIpLimiter = createLimiter({ max: 30, windowMs: WINDOW_MS })
export const loginEmailLimiter = createLimiter({ max: 20, windowMs: WINDOW_MS })

/** Solo per i test: ogni file parte con i limiti a zero. */
export function resetLoginLimiters(): void {
  loginFailLimiter.clear()
  loginIpLimiter.clear()
  loginEmailLimiter.clear()
}

// POST /api/v1/auth/login — Blueprint §4.1.
authRouter.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>
    const ip = req.ip || 'unknown'
    const failKey = `${ip}|${email.toLowerCase()}`
    const ipHit = loginIpLimiter.hit(ip)
    const emailKey = email.toLowerCase()
    const failState = loginFailLimiter.blocked(failKey)
    const emailState = loginEmailLimiter.blocked(emailKey)
    if (!ipHit.allowed || failState.blocked || emailState.blocked) {
      res.set('Retry-After', String(Math.max(ipHit.retryAfterSec, failState.retryAfterSec, emailState.retryAfterSec)))
      throw new TooManyRequestsError()
    }
    const fail = (message: string) => {
      loginFailLimiter.hit(failKey)
      loginEmailLimiter.hit(emailKey)
      return new UnauthorizedError(message)
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw fail('Invalid email or password')
    if (user.status === 'DISABLED') throw fail('Account disabled')
    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) throw fail('Invalid email or password')
    loginFailLimiter.reset(failKey)
    loginEmailLimiter.reset(emailKey)

    const accessToken = signAccessToken({ sub: user.id, role: user.role, companyId: user.companyId })
    const refreshToken = generateRefreshToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({ data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt } })
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    // Il refresh token va anche nel cookie httpOnly (modalità `backend` del
    // frontend). Resta nel corpo per il ponte del guscio legacy, finché c'è.
    setRefreshCookie(res, refreshToken)
    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, companyId: user.companyId },
    })
  } catch (err) {
    next(err)
  }
})

// Il refresh token arriva nel corpo (ponte del guscio legacy) oppure nel
// cookie httpOnly (modalità `backend`). Col cookie, l'origine deve essere
// ammessa (difesa CSRF, lib/authCookie.ts).
const refreshSchema = z.object({ refreshToken: z.string().min(1).optional() })

function refreshTokenFrom(req: import('express').Request): string {
  const fromBody = (req.body as z.infer<typeof refreshSchema>)?.refreshToken
  if (fromBody) return fromBody
  const fromCookie = readRefreshCookie(req)
  if (!fromCookie) throw new UnauthorizedError('Missing refresh token')
  if (!cookieRequestOriginAllowed(req)) throw new ForbiddenError('Origin not allowed')
  return fromCookie
}

authRouter.post('/refresh', validateBody(refreshSchema), async (req, res, next) => {
  try {
    const refreshToken = refreshTokenFrom(req)
    const tokenHash = hashToken(refreshToken)
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } })
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) throw new UnauthorizedError('Refresh token expired or revoked')
    // Un account disattivato non rinnova più: senza questo controllo un refresh
    // token ancora valido (30 giorni) continuerebbe a emettere token d'accesso.
    if (stored.user.status === 'DISABLED') throw new UnauthorizedError('Account disabled')
    const accessToken = signAccessToken({ sub: stored.user.id, role: stored.user.role, companyId: stored.user.companyId })
    res.json({ accessToken })
  } catch (err) {
    next(err)
  }
})

authRouter.post('/logout', validateBody(refreshSchema), async (req, res, next) => {
  try {
    const refreshToken = refreshTokenFrom(req)
    await prisma.refreshToken.updateMany({ where: { tokenHash: hashToken(refreshToken) }, data: { revokedAt: new Date() } })
    clearRefreshCookie(res)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } })
    if (!user || user.status === 'DISABLED') throw new UnauthorizedError()
    res.json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role, companyId: user.companyId })
  } catch (err) {
    next(err)
  }
})
