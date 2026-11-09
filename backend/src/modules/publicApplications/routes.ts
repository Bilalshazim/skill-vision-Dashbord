import { Router, type Request } from 'express'
import { z } from 'zod'

import { audit } from '../../lib/audit.js'
import { env } from '../../lib/env.js'
import { BadRequestError, NotFoundError } from '../../lib/errors.js'
import { prisma } from '../../lib/prisma.js'
import { requireAuth, requireCompanyScope, requireRole } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'

// Le candidature dal link pubblico, lato piattaforma (Decisioni del 2026-11-09, Parte C).
// - `settings`: i contatti privacy della società (Amministrazione) e se il link di
//   candidatura si può creare: solo per la società demo, e solo con i contatti compilati.
// - l'elenco delle candidature ancora da portare nei dati di Recruiting della posizione,
//   e la conferma che lo sono state. Candidato, iscrizione e CV sono già sul server dal
//   momento dell'invio: qui si segna solo il passaggio.
export const publicApplicationsRouter = Router()
publicApplicationsRouter.use(requireAuth)

const READ = ['PLATFORM_ADMIN', 'COMPANY_ADMIN', 'RECRUITER'] as const

function companyOf(req: Request): string {
  const id = (req.query.companyId as string | undefined) || (req.body as { companyId?: string } | undefined)?.companyId || req.auth!.companyId
  if (!id) throw new BadRequestError('Società non indicata')
  requireCompanyScope(req, id)
  return id
}

publicApplicationsRouter.get('/settings', requireRole(...READ), async (req, res, next) => {
  try {
    const companyId = companyOf(req)
    const c = await prisma.company.findUnique({ where: { id: companyId }, select: { candidatePrivacyController: true, candidatePrivacyEmail: true } })
    if (!c) throw new NotFoundError('Società non trovata')
    const privacyController = c.candidatePrivacyController ?? ''
    const privacyEmail = c.candidatePrivacyEmail ?? ''
    const demo = env.assessmentDemoCompanyIds.includes(companyId)
    res.set('Cache-Control', 'no-store').json({ companyId, demo, privacyController, privacyEmail, ready: demo && !!privacyController.trim() && !!privacyEmail.trim() })
  } catch (err) {
    next(err)
  }
})

const settingsSchema = z.object({
  companyId: z.string().uuid().optional(),
  privacyController: z.string().trim().max(200),
  privacyEmail: z.union([z.string().trim().email('Scrivi un indirizzo email valido'), z.literal('')]),
})

publicApplicationsRouter.put('/settings', requireRole('PLATFORM_ADMIN', 'COMPANY_ADMIN'), validateBody(settingsSchema), async (req, res, next) => {
  try {
    const companyId = companyOf(req)
    const body = req.body as z.infer<typeof settingsSchema>
    await prisma.company.update({ where: { id: companyId }, data: { candidatePrivacyController: body.privacyController || null, candidatePrivacyEmail: body.privacyEmail || null } })
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'company.candidatePrivacy.updated', entityType: 'Company', entityId: companyId })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

// Le candidature da portare in piattaforma, per campagna (la posizione attiva).
publicApplicationsRouter.get('/', requireRole(...READ), async (req, res, next) => {
  try {
    const campaignId = z.string().uuid().safeParse(req.query.campaignId)
    if (!campaignId.success) throw new BadRequestError('Campagna non indicata')
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId.data } })
    if (!campaign) throw new NotFoundError('Campagna non trovata')
    requireCompanyScope(req, campaign.companyId)
    const rows = await prisma.publicApplication.findMany({
      where: { campaignId: campaign.id, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      select: { id: true, candidateId: true, campaignCandidateId: true, cvId: true, fullName: true, email: true, phone: true, retention: true, createdAt: true },
    })
    res.set('Cache-Control', 'no-store').json(rows)
  } catch (err) {
    next(err)
  }
})

publicApplicationsRouter.post('/:id/imported', requireRole(...READ), async (req, res, next) => {
  try {
    const row = await prisma.publicApplication.findUnique({ where: { id: req.params.id } })
    if (!row) throw new NotFoundError('Candidatura non trovata')
    requireCompanyScope(req, row.companyId)
    if (row.status === 'PENDING') await prisma.publicApplication.update({ where: { id: row.id }, data: { status: 'IMPORTED', importedAt: new Date() } })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})
