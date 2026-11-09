import { Router } from 'express'
import multer from 'multer'
import { z } from 'zod'

import { audit } from '../../lib/audit.js'
import { env } from '../../lib/env.js'
import { BadRequestError, NotFoundError, TooManyRequestsError } from '../../lib/errors.js'
import { scanUpload } from '../../lib/fileScan.js'
import { createLimiter } from '../../lib/rateLimit.js'
import { prisma } from '../../lib/prisma.js'
import { checksumSha256, makeStorageKey, storage } from '../../lib/storage.js'

// Fase 5 (Roberto Feliciani) — la pagina pubblica dell'annuncio. Il link di
// pubblicazione che l'approvazione di un profilo di lavoro genera
// (`.../jd/<codice>`) finora non portava da nessuna parte: questo è il
// pezzo che mancava. Senza accesso, per costruzione: chi ha il link vede
// l'annuncio, e solo se il profilo è ancora approvato (togliere l'approvazione
// spegne il link).
//
// Si espone il minimo: titolo, intestazione, sezioni, competenze, richieste
// aggiuntive. Non escono fasce retributive, id, autori, date né la campagna.
//
// Parte C (Decisioni del 2026-11-09): dalla stessa pagina ci si candida. Il modulo c'è solo
// se la società ha i contatti privacy compilati in Amministrazione e, per ora, solo per la
// società demo (ASSESSMENT_DEMO_COMPANY_IDS, la stessa lista del "Reset demo").
export const publicJobPostingsRouter = Router()

const limiter = createLimiter({ max: 60, windowMs: 60_000 })
// Le candidature: poche per indirizzo, per non riempire l'archivio di file.
const applyLimiter = createLimiter({ max: 5, windowMs: 60 * 60_000 })
const TOKEN = /^[a-f0-9]{24}$/
const MAX_BYTES = 10 * 1024 * 1024
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 1 } })

async function findPosting(token: string) {
  if (!TOKEN.test(token)) throw new NotFoundError('Annuncio non trovato')
  const profile = await prisma.jobProfile.findFirst({
    where: { approved: true, publicationLink: { endsWith: `/jd/${token}` } },
    include: { campaign: { include: { company: true } } },
  })
  if (!profile) throw new NotFoundError('Annuncio non trovato')
  return profile
}

/** La candidatura è aperta: società demo e contatti privacy compilati. */
function applicationInfo(company: { id: string; candidatePrivacyController: string | null; candidatePrivacyEmail: string | null }) {
  const controller = company.candidatePrivacyController?.trim() || ''
  const email = company.candidatePrivacyEmail?.trim() || ''
  const enabled = env.assessmentDemoCompanyIds.includes(company.id) && !!controller && !!email
  return enabled ? { enabled: true as const, privacyController: controller, privacyEmail: email } : { enabled: false as const }
}

publicJobPostingsRouter.get('/:token', async (req, res, next) => {
  try {
    if (!limiter.hit(req.ip ?? 'unknown').allowed) throw new TooManyRequestsError('Troppe richieste, riprova fra poco.')
    const p = await findPosting(req.params.token)
    res.set('Cache-Control', 'no-store').json({
      title: p.title,
      header: p.header,
      sections: p.sections,
      hardSkillGroups: p.hardSkillGroups,
      extraRequirements: p.extraRequirements,
      application: applicationInfo(p.campaign.company),
    })
  } catch (err) {
    next(err)
  }
})

const applySchema = z.object({
  fullName: z.string().trim().min(2, 'Scrivi nome e cognome').max(120),
  email: z.string().trim().toLowerCase().email('Scrivi un indirizzo email valido').max(200),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  // 24 mesi di base; 6 mesi se il candidato lo sceglie.
  retention: z.enum(['TWO_YEARS', 'SIX_MONTHS']).default('TWO_YEARS'),
  consent: z.literal('true', { errorMap: () => ({ message: 'Serve il consenso al trattamento dei dati' }) }),
})

publicJobPostingsRouter.post('/:token/apply', (req, res, next) => {
  if (!applyLimiter.hit(req.ip ?? 'unknown').allowed) return next(new TooManyRequestsError('Troppe candidature da questo indirizzo, riprova più tardi.'))
  upload.single('file')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') return next(new BadRequestError('Il file supera 10 MB.'))
    if (err) return next(err)
    void apply(req, res).catch(next)
  })
})

async function apply(req: import('express').Request, res: import('express').Response) {
  const p = await findPosting(req.params.token)
  const company = p.campaign.company
  if (!applicationInfo(company).enabled) throw new NotFoundError('Le candidature per questo annuncio non sono aperte.')

  const parsed = applySchema.safeParse(req.body)
  if (!parsed.success) throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Dati non validi')
  const body = parsed.data

  const file = req.file
  if (!file) throw new BadRequestError('Allega il CV (PDF, DOC o DOCX).')
  const scan = scanUpload(file.buffer, file.originalname)
  if (!scan.ok) {
    if (scan.reason === 'infected') {
      await audit(prisma, { actorUserId: null, action: 'publicApplication.rejected_infected', entityType: 'JobProfile', entityId: p.id, metadata: { filename: file.originalname } })
      throw new BadRequestError('Il file non ha superato il controllo antivirus e non è stato salvato.')
    }
    throw new BadRequestError('Il CV deve essere un file PDF, DOC o DOCX.')
  }
  const mime = { pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }[scan.kind]

  // Chi carica: nessun account. Il file si registra a nome di chi ha approvato l'annuncio
  // (o di chi l'ha creato), come fa ogni CV della campagna; l'origine resta nella candidatura.
  const uploaderId = p.approvedById ?? p.createdById
  const months = body.retention === 'TWO_YEARS' ? 24 : 6
  const expires = new Date()
  expires.setMonth(expires.getMonth() + months)
  const now = new Date()

  const application = await prisma.$transaction(async (tx) => {
    const candidate = await tx.candidate.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        normalizedEmail: body.email,
        phone: body.phone || null,
        consentStatus: 'EXPLICIT',
        cvRetentionChoice: body.retention,
        cvRetentionExpiresAt: expires,
        source: 'NEW_APPLICANT',
      },
    })
    const enrolment = await tx.campaignCandidate.create({ data: { campaignId: p.campaignId, candidateId: candidate.id, roleApplied: p.title ?? undefined } })
    const fileRow = await tx.storedFile.create({
      data: {
        storageKey: `pending-${candidate.id}`,
        originalFilename: file.originalname,
        mimeType: mime,
        sizeBytes: file.size,
        checksumSha256: checksumSha256(file.buffer),
        candidateId: candidate.id,
        campaignId: p.campaignId,
        uploadedById: uploaderId,
        retentionExpiresAt: expires,
      },
    })
    const key = makeStorageKey(candidate.id, fileRow.id, file.originalname)
    await tx.storedFile.update({ where: { id: fileRow.id }, data: { storageKey: key } })
    await storage.save(key, file.buffer)
    const cv = await tx.cv.create({ data: { candidateId: candidate.id, campaignId: p.campaignId, fileId: fileRow.id, status: 'UPLOADED', uploadedById: uploaderId } })
    return tx.publicApplication.create({
      data: {
        companyId: company.id,
        campaignId: p.campaignId,
        jobProfileId: p.id,
        candidateId: candidate.id,
        campaignCandidateId: enrolment.id,
        cvId: cv.id,
        fullName: body.fullName,
        email: body.email,
        phone: body.phone || null,
        retention: body.retention,
        consentAt: now,
      },
    })
  })

  await audit(prisma, { actorUserId: null, action: 'publicApplication.received', entityType: 'PublicApplication', entityId: application.id })
  res.status(201).json({ ok: true })
}
