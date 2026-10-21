import express, { Router, type Request } from 'express'
import { z } from 'zod'

import { audit } from '../../lib/audit.js'
import { BadRequestError, ConflictError, ForbiddenError } from '../../lib/errors.js'
import { prisma } from '../../lib/prisma.js'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'

// Recruiting sul server (PROGETTO-TUTTO-SUL-SERVER.md, Parti 4–9). I dati che
// Recruiting teneva nel browser stanno qui, un documento per area, con la
// stessa forma (il testo JSON di prima): le schermate non cambiano e nel
// browser non resta niente. Ogni documento ha una versione: chi salva su una
// versione vecchia riceve 409 e ricarica, invece di cancellare il lavoro di
// un collega. Per le modifiche dei colleghi in tempo reale il frontend chiede
// spesso le sole versioni (`/versions`) e scarica solo i documenti cambiati.

export const recruitingStoreRouter = Router()

// Il JSON di questi documenti può superare il limite generale (2 MB): qui ne
// vale uno suo. app.ts salta il lettore generale per questo percorso.
recruitingStoreRouter.use(express.json({ limit: '10mb' }))
recruitingStoreRouter.use(requireAuth)

const READ_ROLES = ['PLATFORM_ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'READONLY'] as const
const WRITE_ROLES = ['PLATFORM_ADMIN', 'COMPANY_ADMIN', 'RECRUITER'] as const

// Le sole aree ammesse: le chiavi che Recruiting usava nel browser.
export const RECRUITING_KEYS = [
  'apex5d_cv_matching_state',
  'skillvision_candidates_data',
  'apex5d_jd_templates',
  'apex5d_job_postings_summaries',
  'apex5d_salary_benefits',
  'apex5d_survey_state',
  'apex5d_interview_protocol',
  'sv_recruiting_skill_flags_v1',
  'apex5d_backend_link_map',
] as const
const keySchema = z.enum(RECRUITING_KEYS)
const MAX_BYTES = 8 * 1024 * 1024

// Lo spazio dei dati: la società dell'utente; lo staff di Skill Vision
// (PLATFORM_ADMIN senza società) ne ha uno suo, condiviso fra lo staff.
function scopeOf(req: Request): string {
  if (req.auth!.companyId) return req.auth!.companyId
  if (req.auth!.role === 'PLATFORM_ADMIN') return 'platform'
  throw new ForbiddenError('Nessuna società associata a questo account')
}

function keyParam(req: Request) {
  const k = keySchema.safeParse(req.params.key)
  if (!k.success) throw new BadRequestError('Area di dati sconosciuta')
  return k.data
}

recruitingStoreRouter.get('/versions', requireRole(...READ_ROLES), async (req, res, next) => {
  try {
    const rows = await prisma.recruitingDocument.findMany({ where: { scope: scopeOf(req) }, select: { key: true, version: true } })
    res.set('Cache-Control', 'no-store').json(Object.fromEntries(rows.map((r) => [r.key, r.version])))
  } catch (err) {
    next(err)
  }
})

// Tutti i documenti, o solo quelli in `?keys=a,b`.
recruitingStoreRouter.get('/', requireRole(...READ_ROLES), async (req, res, next) => {
  try {
    const wanted = typeof req.query.keys === 'string' && req.query.keys ? req.query.keys.split(',').filter((k) => keySchema.safeParse(k).success) : null
    const rows = await prisma.recruitingDocument.findMany({ where: { scope: scopeOf(req), ...(wanted ? { key: { in: wanted } } : {}) } })
    res.set('Cache-Control', 'no-store').json(Object.fromEntries(rows.map((r) => [r.key, { data: r.data, version: r.version }])))
  } catch (err) {
    next(err)
  }
})

const putSchema = z.object({ data: z.string(), version: z.number().int().nonnegative() })

// `version` è quella che il browser ha letto (0 = documento nuovo).
recruitingStoreRouter.put('/:key', requireRole(...WRITE_ROLES), validateBody(putSchema), async (req, res, next) => {
  try {
    const key = keyParam(req)
    const scope = scopeOf(req)
    const { data, version } = req.body as z.infer<typeof putSchema>
    if (Buffer.byteLength(data) > MAX_BYTES) throw new BadRequestError('Dati troppo grandi')
    try {
      JSON.parse(data)
    } catch {
      throw new BadRequestError('Dati non validi')
    }
    const saved = await prisma.$transaction(async (tx) => {
      const current = await tx.recruitingDocument.findUnique({ where: { scope_key: { scope, key } } })
      if ((current?.version ?? 0) !== version) throw new ConflictError('Un collega ha modificato questi dati nel frattempo: ricaricare')
      return current
        ? tx.recruitingDocument.update({ where: { id: current.id }, data: { data, version: version + 1, updatedById: req.auth!.sub } })
        : tx.recruitingDocument.create({ data: { scope, key, data, version: 1, updatedById: req.auth!.sub } })
    })
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'recruiting.document.saved', entityType: 'RecruitingDocument', entityId: saved.id, metadata: { key, version: saved.version } })
    res.json({ version: saved.version })
  } catch (err) {
    next(err)
  }
})

recruitingStoreRouter.delete('/:key', requireRole(...WRITE_ROLES), async (req, res, next) => {
  try {
    const key = keyParam(req)
    const scope = scopeOf(req)
    const version = Number(req.query.version)
    const current = await prisma.recruitingDocument.findUnique({ where: { scope_key: { scope, key } } })
    if (!current) return res.json({ version: 0 })
    if (current.version !== version) throw new ConflictError('Un collega ha modificato questi dati nel frattempo: ricaricare')
    await prisma.recruitingDocument.delete({ where: { id: current.id } })
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'recruiting.document.deleted', entityType: 'RecruitingDocument', entityId: current.id, metadata: { key } })
    res.json({ version: 0 })
  } catch (err) {
    next(err)
  }
})
