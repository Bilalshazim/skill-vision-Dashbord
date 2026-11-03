import { Router } from 'express'
import { z } from 'zod'

import { audit } from '../../lib/audit.js'
import { BadRequestError, ConflictError, NotFoundError } from '../../lib/errors.js'
import { hashPassword, passwordProblem } from '../../lib/password.js'
import { prisma } from '../../lib/prisma.js'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'

// Gestione utenti dalle Impostazioni del guscio: elenco, nuovo utente,
// modifica (ruolo, società, stato, dati), nuova password. Solo lo staff
// Skill-Vision (PLATFORM_ADMIN). La password non torna mai indietro: nel
// database c'è solo l'hash bcrypt.
// Un cambio di password, ruolo, società o stato fa crescere sessionVersion e
// revoca i refresh token: l'utente esce subito (middleware/auth.ts), anche
// quando è chi fa la modifica.
export const usersRouter = Router()

usersRouter.use(requireAuth)
usersRouter.use(requireRole('PLATFORM_ADMIN'))

const ROLES = ['PLATFORM_ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'EVALUATOR', 'READONLY'] as const

const publicFields = {
  id: true,
  email: true,
  username: true,
  fullName: true,
  designation: true,
  role: true,
  companyId: true,
  company: { select: { name: true } },
  status: true,
  lastLoginAt: true,
  createdAt: true,
} as const

const password = z.string().superRefine((pw, ctx) => {
  const problem = passwordProblem(pw)
  if (problem) ctx.addIssue({ code: z.ZodIssueCode.custom, message: problem })
})
// Lettere minuscole, cifre e . _ - : niente @, così non si confonde con un'email.
const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._-]{3,40}$/, 'Il nome utente va da 3 a 40 caratteri: lettere, cifre, punto, trattino o trattino basso.')
const optionalText = z.string().trim().max(120).nullable().optional().transform((v) => (v ? v : null))

const createSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  username: username.nullable().optional(),
  fullName: z.string().trim().min(1),
  designation: optionalText,
  role: z.enum(ROLES),
  companyId: z.string().uuid().nullable().optional(),
  password,
})

const updateSchema = z.object({
  email: z.string().trim().toLowerCase().email().optional(),
  username: username.nullable().optional(),
  fullName: z.string().trim().min(1).optional(),
  designation: optionalText,
  role: z.enum(ROLES).optional(),
  companyId: z.string().uuid().nullable().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
})

const passwordSchema = z.object({ password })

async function checkCompany(role: string, companyId: string | null) {
  if (role === 'PLATFORM_ADMIN' && companyId) throw new BadRequestError('Un amministratore di piattaforma non ha società')
  if (role !== 'PLATFORM_ADMIN' && !companyId) throw new BadRequestError('Scegli la società dell’utente')
  if (companyId && !(await prisma.company.findUnique({ where: { id: companyId }, select: { id: true } }))) throw new NotFoundError('Società non trovata')
}

async function checkUnique(email: string | undefined, username: string | null | undefined, exceptId?: string) {
  if (email) {
    const other = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (other && other.id !== exceptId) throw new ConflictError('Esiste già un utente con questa email')
  }
  if (username) {
    const other = await prisma.user.findUnique({ where: { username }, select: { id: true } })
    if (other && other.id !== exceptId) throw new ConflictError('Esiste già un utente con questo nome utente')
  }
}

usersRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await prisma.user.findMany({ select: publicFields, orderBy: [{ fullName: 'asc' }, { email: 'asc' }] }))
  } catch (err) {
    next(err)
  }
})

usersRouter.post('/', validateBody(createSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof createSchema>
    const companyId = body.role === 'PLATFORM_ADMIN' ? null : (body.companyId ?? null)
    await checkCompany(body.role, companyId)
    await checkUnique(body.email, body.username)

    const user = await prisma.user.create({
      data: {
        email: body.email,
        username: body.username ?? null,
        fullName: body.fullName,
        designation: body.designation,
        role: body.role,
        companyId,
        passwordHash: await hashPassword(body.password),
      },
      select: publicFields,
    })
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'user.created', entityType: 'User', entityId: user.id, metadata: { email: user.email, role: user.role, companyId } })
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
})

usersRouter.patch('/:id', validateBody(updateSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof updateSchema>
    const target = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!target) throw new NotFoundError('Utente non trovato')

    const role = body.role ?? target.role
    const companyId = role === 'PLATFORM_ADMIN' ? null : body.companyId !== undefined ? body.companyId : target.companyId
    const status = body.status ?? target.status
    await checkCompany(role, companyId)
    await checkUnique(body.email, body.username, target.id)

    // Mai restare senza uno staff di piattaforma attivo: chiuderebbe fuori tutti.
    const losesAdmin = target.role === 'PLATFORM_ADMIN' && target.status === 'ACTIVE' && (role !== 'PLATFORM_ADMIN' || status !== 'ACTIVE')
    if (losesAdmin) {
      const others = await prisma.user.count({ where: { role: 'PLATFORM_ADMIN', status: 'ACTIVE', id: { not: target.id } } })
      if (others === 0) throw new BadRequestError('Serve almeno un amministratore di piattaforma attivo')
    }

    const accessChanged = role !== target.role || companyId !== target.companyId || status !== target.status
    const user = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: target.id },
        data: {
          email: body.email,
          username: body.username,
          fullName: body.fullName,
          designation: body.designation,
          role,
          companyId,
          status,
          ...(accessChanged ? { sessionVersion: { increment: 1 } } : {}),
        },
        select: publicFields,
      })
      if (accessChanged) await tx.refreshToken.updateMany({ where: { userId: target.id, revokedAt: null }, data: { revokedAt: new Date() } })
      return updated
    })
    await audit(prisma, {
      actorUserId: req.auth!.sub,
      action: 'user.updated',
      entityType: 'User',
      entityId: target.id,
      metadata: { email: user.email, changed: Object.keys(body), signedOut: accessChanged },
    })
    res.json(user)
  } catch (err) {
    next(err)
  }
})

usersRouter.patch('/:id/password', validateBody(passwordSchema), async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, email: true } })
    if (!target) throw new NotFoundError('Utente non trovato')

    const passwordHash = await hashPassword((req.body as z.infer<typeof passwordSchema>).password)
    await prisma.$transaction([
      prisma.user.update({ where: { id: target.id }, data: { passwordHash, sessionVersion: { increment: 1 } } }),
      prisma.refreshToken.updateMany({ where: { userId: target.id, revokedAt: null }, data: { revokedAt: new Date() } }),
    ])
    const self = target.id === req.auth!.sub
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'user.password_changed', entityType: 'User', entityId: target.id, metadata: { email: target.email, self } })
    res.json({ signedOut: true, self })
  } catch (err) {
    next(err)
  }
})
