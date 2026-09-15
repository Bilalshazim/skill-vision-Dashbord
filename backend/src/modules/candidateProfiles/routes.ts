import crypto from 'node:crypto'

import { Router } from 'express'
import { z } from 'zod'

import type { Request } from 'express'

import { audit } from '../../lib/audit.js'
import { ConflictError, NotFoundError } from '../../lib/errors.js'
import { prisma } from '../../lib/prisma.js'
import { requireAuth, requireCompanyScope, requireRole } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'

export const candidateProfilesRouter = Router()

candidateProfilesRouter.use(requireAuth)

// Phase 34 §11/§15/§16 — REAL BUG FOUND AND FIXED during final QA: every
// route in this module resolved a profile by its own id (or a caller-
// supplied campaignCandidateId) with NO check that it belongs to the
// caller's own company — the exact same gap found and fixed in cv/routes.ts
// moments earlier, just across a different module. A company admin could
// read, approve, or publish another company's candidate profile by id.
// Fixed by resolving the owning company through campaignCandidate.campaign
// and scoping every route against it.
async function requireProfileCompanyScope(req: Request, campaignCandidateId: string): Promise<void> {
  const cc = await prisma.campaignCandidate.findUnique({ where: { id: campaignCandidateId }, include: { campaign: true } })
  if (cc) requireCompanyScope(req, cc.campaign.companyId)
}

const upsertSchema = z.object({ campaignCandidateId: z.string().uuid(), content: z.record(z.string(), z.unknown()) })

candidateProfilesRouter.post('/', requireRole('RECRUITER', 'COMPANY_ADMIN'), validateBody(upsertSchema), async (req, res, next) => {
  try {
    await requireProfileCompanyScope(req, req.body.campaignCandidateId)
    const profile = await prisma.candidateProfile.upsert({
      where: { campaignCandidateId: req.body.campaignCandidateId },
      create: { campaignCandidateId: req.body.campaignCandidateId, content: req.body.content, status: 'DRAFT' },
      update: { content: req.body.content, status: 'SAVED' },
    })
    res.status(201).json(profile)
  } catch (err) {
    next(err)
  }
})

// §13: ONE content-serving path, used both by a "preview" screen (before
// publish) and the published page itself (after) — no second copy of the
// content lives anywhere else, so they can never drift apart.
candidateProfilesRouter.get('/:id', requireRole('RECRUITER', 'COMPANY_ADMIN', 'PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const profile = await prisma.candidateProfile.findUnique({ where: { id: req.params.id } })
    if (!profile) throw new NotFoundError('Candidate profile not found')
    await requireProfileCompanyScope(req, profile.campaignCandidateId)
    res.json(profile)
  } catch (err) {
    next(err)
  }
})

candidateProfilesRouter.post('/:id/approve', requireRole('COMPANY_ADMIN'), async (req, res, next) => {
  try {
    const profile = await prisma.candidateProfile.findUnique({ where: { id: req.params.id } })
    if (!profile) throw new NotFoundError('Candidate profile not found')
    await requireProfileCompanyScope(req, profile.campaignCandidateId)
    if (profile.status !== 'SAVED') throw new ConflictError('Profile must be saved before it can be approved')
    const approved = await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: { status: 'APPROVED', approvedById: req.auth!.sub, approvedAt: new Date() },
    })
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'candidate_profile.approved', entityType: 'CandidateProfile', entityId: profile.id })
    res.json(approved)
  } catch (err) {
    next(err)
  }
})

candidateProfilesRouter.post('/:id/mark-publication-ready', requireRole('COMPANY_ADMIN'), async (req, res, next) => {
  try {
    const profile = await prisma.candidateProfile.findUnique({ where: { id: req.params.id } })
    if (!profile) throw new NotFoundError('Candidate profile not found')
    await requireProfileCompanyScope(req, profile.campaignCandidateId)
    if (profile.status !== 'APPROVED') throw new ConflictError('Profile must be approved first')
    const updated = await prisma.candidateProfile.update({ where: { id: profile.id }, data: { status: 'PUBLICATION_READY' } })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

candidateProfilesRouter.post('/:id/publish', requireRole('COMPANY_ADMIN'), async (req, res, next) => {
  try {
    const profile = await prisma.candidateProfile.findUnique({ where: { id: req.params.id } })
    if (!profile) throw new NotFoundError('Candidate profile not found')
    await requireProfileCompanyScope(req, profile.campaignCandidateId)
    if (profile.status !== 'APPROVED' && profile.status !== 'PUBLICATION_READY') throw new ConflictError('Profile must be approved first')
    const publicationLink = `https://dashboard.skill-vision.it/p/${crypto.randomBytes(12).toString('hex')}`
    const published = await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: { status: 'PUBLISHED', publicationLink, publishedAt: new Date() },
    })
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'candidate_profile.published', entityType: 'CandidateProfile', entityId: profile.id })
    res.json(published)
  } catch (err) {
    next(err)
  }
})
