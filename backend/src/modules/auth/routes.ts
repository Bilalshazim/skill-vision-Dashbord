import { Router } from 'express'
import { z } from 'zod'

import { UnauthorizedError } from '../../lib/errors.js'
import { generateRefreshToken, hashToken, signAccessToken } from '../../lib/jwt.js'
import { verifyPassword } from '../../lib/password.js'
import { prisma } from '../../lib/prisma.js'
import { requireAuth } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'

export const authRouter = Router()

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })

// POST /api/v1/auth/login — Blueprint §4.1.
authRouter.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new UnauthorizedError('Invalid email or password')
    if (user.status === 'DISABLED') throw new UnauthorizedError('Account disabled')
    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) throw new UnauthorizedError('Invalid email or password')

    const accessToken = signAccessToken({ sub: user.id, role: user.role, companyId: user.companyId })
    const refreshToken = generateRefreshToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({ data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt } })
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, companyId: user.companyId },
    })
  } catch (err) {
    next(err)
  }
})

const refreshSchema = z.object({ refreshToken: z.string().min(1) })

authRouter.post('/refresh', validateBody(refreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>
    const tokenHash = hashToken(refreshToken)
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } })
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) throw new UnauthorizedError('Refresh token expired or revoked')
    const accessToken = signAccessToken({ sub: stored.user.id, role: stored.user.role, companyId: stored.user.companyId })
    res.json({ accessToken })
  } catch (err) {
    next(err)
  }
})

authRouter.post('/logout', validateBody(refreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>
    await prisma.refreshToken.updateMany({ where: { tokenHash: hashToken(refreshToken) }, data: { revokedAt: new Date() } })
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth!.sub } })
    if (!user) throw new UnauthorizedError()
    res.json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role, companyId: user.companyId })
  } catch (err) {
    next(err)
  }
})
