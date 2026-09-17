import crypto from 'node:crypto'

import type { Prisma } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

import { audit } from '../../lib/audit.js'
import { ConflictError, NotFoundError } from '../../lib/errors.js'
import { prisma } from '../../lib/prisma.js'
import { requireAuth, requireCompanyScope, requireRole } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'

export const jobProfilesRouter = Router()

jobProfilesRouter.use(requireAuth)

// Phase 32 §5 — the `JobProfile` model was already part of the Phase 29
// Blueprint / Phase 30 schema (campaign-scoped header/sections/
// hardSkillGroups/extraRequirements/salaryBenefits, all free-form Json —
// see prisma/schema.prisma), it simply had no route module yet. Adding
// these two routes is "using the already-approved backend architecture"
// (per this phase's own brief), not a new business rule.
//
// campaignId, not role: the frontend's JD editor is keyed by role (no
// campaign concept existed there before Phase 31), but the approved schema
// scopes JobProfile to a Campaign — the frontend maps its role-keyed local
// state onto whichever backend Campaign the active opening resolves to
// (see frontend lib/backend-link.ts), same pattern as CV/shortlist.
//
// No unique constraint on campaignId exists in the schema (multiple
// JobProfile rows per campaign are allowed — e.g. versioning), so this is
// "get the latest" + "always insert a new version on save", not an
// upsert-by-campaign that would require inventing a uniqueness rule the
// schema doesn't have.
jobProfilesRouter.get('/campaign/:campaignId', requireRole('RECRUITER', 'COMPANY_ADMIN', 'PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: req.params.campaignId } })
    requireCompanyScope(req, campaign.companyId)
    const latest = await prisma.jobProfile.findFirst({ where: { campaignId: req.params.campaignId }, orderBy: { createdAt: 'desc' } })
    res.json(latest)
  } catch (err) {
    next(err)
  }
})

const saveSchema = z.object({
  title: z.string().optional(),
  header: z.record(z.string(), z.unknown()).default({}),
  sections: z.record(z.string(), z.unknown()).default({}),
  hardSkillGroups: z.array(z.unknown()).default([]),
  extraRequirements: z.array(z.unknown()).default([]),
  salaryBenefits: z.record(z.string(), z.unknown()).default({}),
})

jobProfilesRouter.patch('/campaign/:campaignId', requireRole('RECRUITER', 'COMPANY_ADMIN'), validateBody(saveSchema), async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: req.params.campaignId } })
    requireCompanyScope(req, campaign.companyId)
    const body = req.body as z.infer<typeof saveSchema>
    const profile = await prisma.jobProfile.create({
      data: {
        campaignId: req.params.campaignId,
        title: body.title,
        header: body.header as Prisma.InputJsonValue,
        sections: body.sections as Prisma.InputJsonValue,
        hardSkillGroups: body.hardSkillGroups as Prisma.InputJsonValue,
        extraRequirements: body.extraRequirements as Prisma.InputJsonValue,
        salaryBenefits: body.salaryBenefits as Prisma.InputJsonValue,
        createdById: req.auth!.sub,
      },
    })
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'job_profile.saved', entityType: 'JobProfile', entityId: profile.id })
    res.status(201).json(profile)
  } catch (err) {
    next(err)
  }
})

// Client §3 — "Approvata" toggle + publication link, generated once on
// first approval and kept stable across a later unapprove/re-approve of
// this SAME row (a later edit creates a brand-new JobProfile row per the
// existing versioning scheme above, which starts unapproved again — that's
// intentional, not a gap: an edited profile needs a fresh approval).
async function requireJobProfileCompanyScope(req: Parameters<typeof requireCompanyScope>[0], jobProfileId: string) {
  const profile = await prisma.jobProfile.findUnique({ where: { id: jobProfileId }, include: { campaign: true } })
  if (!profile) throw new NotFoundError('Job profile not found')
  requireCompanyScope(req, profile.campaign.companyId)
  return profile
}

jobProfilesRouter.post('/:id/approve', requireRole('RECRUITER', 'COMPANY_ADMIN'), async (req, res, next) => {
  try {
    const profile = await requireJobProfileCompanyScope(req, req.params.id)
    if (profile.approved) {
      res.json(profile)
      return
    }
    const publicationLink = profile.publicationLink || `https://dashboard.skill-vision.it/jd/${crypto.randomBytes(12).toString('hex')}`
    const approved = await prisma.jobProfile.update({
      where: { id: profile.id },
      data: { approved: true, approvedById: req.auth!.sub, approvedAt: new Date(), publicationLink },
    })
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'job_profile.approved', entityType: 'JobProfile', entityId: profile.id })
    res.json(approved)
  } catch (err) {
    next(err)
  }
})

jobProfilesRouter.post('/:id/unapprove', requireRole('RECRUITER', 'COMPANY_ADMIN'), async (req, res, next) => {
  try {
    const profile = await requireJobProfileCompanyScope(req, req.params.id)
    if (!profile.approved) throw new ConflictError('Job profile is not approved')
    const updated = await prisma.jobProfile.update({ where: { id: profile.id }, data: { approved: false } })
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'job_profile.unapproved', entityType: 'JobProfile', entityId: profile.id })
    res.json(updated)
  } catch (err) {
    next(err)
  }
})
