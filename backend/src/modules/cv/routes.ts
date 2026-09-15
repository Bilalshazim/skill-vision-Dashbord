import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'

import { audit } from '../../lib/audit.js'
import { BadRequestError, ForbiddenError, NotFoundError } from '../../lib/errors.js'
import { prisma } from '../../lib/prisma.js'
import { ahi, DEFAULT_FLAGS, DEFAULT_ROLE, fasce, fasciaToDbEnum } from '../../lib/scoring.js'
import { checksumSha256, makeStorageKey, signFileToken, storage, verifyFileToken } from '../../lib/storage.js'
import { requireAuth, requireCompanyScope, requireRole } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'

export const cvRouter = Router()

// No router-level requireAuth here on purpose: GET /:id/file (below) is
// authorized by its signed token alone (§7, §19) — it's meant to work as a
// standalone link, not a second bearer-token request. Every other route on
// this router lists requireAuth explicitly instead.

const ALLOWED_MIME = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } })

// POST /api/v1/cv/candidates/:candidateId — Blueprint §4.3. Real server-side
// storage (§7) — this candidate's CV survives a reload, unlike today's
// frontend `URL.createObjectURL()` which never persists at all.
cvRouter.post(
  '/candidates/:candidateId',
  requireAuth,
  requireRole('RECRUITER', 'COMPANY_ADMIN'),
  upload.single('file'),
  async (req, res, next) => {
    try {
      const file = req.file
      if (!file) throw new BadRequestError('No file uploaded (expected multipart field "file")')
      if (!ALLOWED_MIME.has(file.mimetype)) throw new BadRequestError(`Unsupported file type: ${file.mimetype}`)

      const candidate = await prisma.candidate.findUnique({ where: { id: req.params.candidateId } })
      if (!candidate) throw new NotFoundError('Candidate not found')

      const campaignId = (req.body as { campaignId?: string }).campaignId || undefined
      // Phase 34 §15/§16 — found alongside the GET /:id fix below: an
      // arbitrary campaignId in the body was trusted with no check that it
      // belongs to the caller's own company, which would let a recruiter
      // attach a CV upload to another company's campaign.
      if (campaignId) {
        const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
        if (campaign) requireCompanyScope(req, campaign.companyId)
      }

      const stored = await prisma.$transaction(async (tx) => {
        const fileRow = await tx.storedFile.create({
          data: {
            storageKey: 'pending',
            originalFilename: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            checksumSha256: checksumSha256(file.buffer),
            candidateId: candidate.id,
            campaignId,
            uploadedById: req.auth!.sub,
            retentionExpiresAt: candidate.cvRetentionExpiresAt,
          },
        })
        const key = makeStorageKey(candidate.id, fileRow.id, file.originalname)
        await tx.storedFile.update({ where: { id: fileRow.id }, data: { storageKey: key } })
        await storage.save(key, file.buffer)

        return tx.cv.create({
          data: {
            candidateId: candidate.id,
            campaignId,
            fileId: fileRow.id,
            status: 'UPLOADED',
            uploadedById: req.auth!.sub,
          },
        })
      })

      await audit(prisma, { actorUserId: req.auth!.sub, action: 'cv.uploaded', entityType: 'Cv', entityId: stored.id })
      res.status(201).json(stored)
    } catch (err) {
      next(err)
    }
  },
)

// GET /api/v1/cv/:id — metadata + a short-lived signed download URL, never
// a permanent public link (§7, §19).
//
// Phase 34 §5/§15/§16 — REAL BUG FOUND AND FIXED during final QA: this
// route had no company scoping at all — any authenticated
// RECRUITER/COMPANY_ADMIN could fetch metadata (and therefore a valid
// signed download URL) for ANY candidate's CV in the entire system, not
// just their own company's, just by knowing/guessing a UUID. Every sibling
// route in this codebase that touches company-owned data calls
// requireCompanyScope() — this one silently didn't. Fixed by resolving the
// owning company through the CV's campaign when one exists; a CV with no
// campaign yet (Cv.campaignId is nullable — e.g. an archived/pool upload
// not yet assigned to a campaign, a real and already-tested case) falls
// back to scoping against the UPLOADER's own company instead of either
// leaving it open or over-restricting it to platform admins only, which
// would have broken that legitimate case.
cvRouter.get('/:id', requireAuth, requireRole('RECRUITER', 'COMPANY_ADMIN', 'PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const cv = await prisma.cv.findUnique({ where: { id: req.params.id }, include: { file: true } })
    if (!cv) throw new NotFoundError('CV not found')
    if (cv.campaignId) {
      const campaign = await prisma.campaign.findUnique({ where: { id: cv.campaignId } })
      if (campaign) requireCompanyScope(req, campaign.companyId)
    } else if (req.auth!.role !== 'PLATFORM_ADMIN') {
      const uploader = await prisma.user.findUnique({ where: { id: cv.uploadedById } })
      requireCompanyScope(req, uploader?.companyId ?? '__none__')
    }
    const { token, expiresAt } = signFileToken(cv.fileId)
    res.json({ ...cv, download: { url: `/api/v1/cv/${cv.id}/file?token=${token}`, expiresAt } })
  } catch (err) {
    next(err)
  }
})

cvRouter.get('/:id/file', async (req, res, next) => {
  try {
    const cv = await prisma.cv.findUnique({ where: { id: req.params.id }, include: { file: true } })
    if (!cv) throw new NotFoundError('CV not found')
    const token = req.query.token as string | undefined
    if (!token || !verifyFileToken(cv.fileId, token)) throw new ForbiddenError('Invalid or expired download link')
    if (cv.file.deletedAt) throw new NotFoundError('File no longer available')
    const buffer = await storage.read(cv.file.storageKey)
    res.setHeader('Content-Type', cv.file.mimeType)
    // A PDF opens inline in the new tab this link is meant for ("CV" button
    // -> GET /:id -> this route, see CvOpenButton.tsx); Word files still
    // download, since browsers can't render .doc/.docx inline anyway and
    // "attachment" is the correct behavior there.
    const disposition = cv.file.mimeType === 'application/pdf' ? 'inline' : 'attachment'
    res.setHeader('Content-Disposition', `${disposition}; filename="${cv.file.originalFilename}"`)
    res.send(buffer)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/cv/:id/match — OD-5: computes match + AHI using the exact
// ported formula (src/lib/scoring.ts), unchanged from the frontend. The
// candidate-facing "soft-skill scores"/"Big Five" inputs a real system
// would derive from a completed test are accepted directly here for now
// (this endpoint doesn't invent where those numbers come from — that's the
// test-completion flow in §11, still an integration boundary, not a real
// provider).
const matchSchema = z.object({
  campaignId: z.string().uuid(),
  jobProfileId: z.string().uuid().optional(),
  matchScorePercent: z.number().min(0).max(100),
  softSkillScores: z.record(z.string(), z.number()).default({}),
  bigFive: z.record(z.string(), z.number()).default({}),
})

cvRouter.post('/:id/match', requireAuth, requireRole('RECRUITER', 'COMPANY_ADMIN'), validateBody(matchSchema), async (req, res, next) => {
  try {
    const cv = await prisma.cv.findUnique({ where: { id: req.params.id } })
    if (!cv) throw new NotFoundError('CV not found')
    const body = req.body as z.infer<typeof matchSchema>
    // Phase 34 §15/§16 — same class of gap as GET /:id above: the body's
    // campaignId was trusted with no ownership check.
    const matchCampaign = await prisma.campaign.findUnique({ where: { id: body.campaignId } })
    if (matchCampaign) requireCompanyScope(req, matchCampaign.companyId)

    const result = ahi({ scores: body.softSkillScores, bf: body.bigFive, icv: body.matchScorePercent }, DEFAULT_ROLE, DEFAULT_FLAGS)
    const fasciaKey = fasce(result.v, result.capped)

    const match = await prisma.cvMatchResult.upsert({
      where: { cvId_campaignId: { cvId: cv.id, campaignId: body.campaignId } },
      create: {
        cvId: cv.id,
        campaignId: body.campaignId,
        jobProfileId: body.jobProfileId,
        matchScorePercent: body.matchScorePercent,
        matchBreakdown: { softSkillScores: body.softSkillScores, bigFive: body.bigFive },
        ahiScore: result.v,
        fascia: fasciaToDbEnum(fasciaKey.key),
        hardRedFlag: result.capped,
      },
      update: {
        matchScorePercent: body.matchScorePercent,
        matchBreakdown: { softSkillScores: body.softSkillScores, bigFive: body.bigFive },
        ahiScore: result.v,
        fascia: fasciaToDbEnum(fasciaKey.key),
        hardRedFlag: result.capped,
        computedAt: new Date(),
      },
    })
    await prisma.cv.update({ where: { id: cv.id }, data: { status: 'PROCESSED' } })
    res.json(match)
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/cv/campaigns/:campaignId/ranking — "Migliori Candidati"
// source, sorted by AHI descending, matching the frontend's own
// ranking()/ahi() ordering (highest first).
cvRouter.get('/campaigns/:campaignId/ranking', requireAuth, requireRole('RECRUITER', 'COMPANY_ADMIN'), async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: req.params.campaignId } })
    requireCompanyScope(req, campaign.companyId)
    const results = await prisma.cvMatchResult.findMany({
      where: { campaignId: req.params.campaignId },
      include: { cv: { include: { candidate: true } } },
      orderBy: [{ ahiScore: 'desc' }],
    })
    res.json(results)
  } catch (err) {
    next(err)
  }
})

// OD-10 boundary (§12/§21): retention is TRACKED only. This lists files
// whose retentionExpiresAt has passed so a human can review them — nothing
// here deletes, anonymizes, or otherwise acts on the file. See the model
// comment on StoredFile.retentionExpiresAt and the final report for why no
// scheduled job calls this automatically yet.
// Phase 34 §15/§16 — same class of gap: a COMPANY_ADMIN could see every
// OTHER company's expiring files too (candidate names, filenames), since
// this had no company filter despite being open to that role. PLATFORM_ADMIN
// still sees everything (there's no narrower scope that makes sense for
// them); a COMPANY_ADMIN now sees only files tied to their own company's
// campaigns. A file with no campaign (StoredFile.campaignId is nullable)
// has no company to check against — excluded from a COMPANY_ADMIN's view
// rather than guessed at; still visible to PLATFORM_ADMIN.
cvRouter.get('/retention/review', requireAuth, requireRole('PLATFORM_ADMIN', 'COMPANY_ADMIN'), async (req, res, next) => {
  try {
    const where: Record<string, unknown> = { retentionExpiresAt: { lt: new Date() }, deletedAt: null }
    if (req.auth!.role === 'COMPANY_ADMIN') {
      // StoredFile.campaignId is a plain column with no Prisma relation
      // (see schema) — resolved as an explicit id list rather than a
      // nested-relation filter, which this model doesn't support.
      const companyCampaigns = await prisma.campaign.findMany({ where: { companyId: req.auth!.companyId ?? '__none__' }, select: { id: true } })
      where.campaignId = { in: companyCampaigns.map((c) => c.id) }
    }
    const expired = await prisma.storedFile.findMany({
      where,
      orderBy: { retentionExpiresAt: 'asc' },
    })
    res.json({ action: 'flag_for_review_only', files: expired })
  } catch (err) {
    next(err)
  }
})
