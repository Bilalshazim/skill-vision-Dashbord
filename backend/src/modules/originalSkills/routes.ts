import { Prisma } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

import { audit } from '../../lib/audit.js'
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors.js'
import { prisma } from '../../lib/prisma.js'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'
import { fetchExport, MAX_RANGE_DAYS, readConfig, type OsConfig } from './client.js'
import { applyImport, collectRecent, SOURCE } from './import.js'
import { normalizeExport } from './normalize.js'

// Anteprima in sola lettura di Original Skills (PROPOSTA-ORIGINAL-SKILLS.md):
// legge al momento, non salva niente. Solo PLATFORM_ADMIN, finché i dati non
// hanno una società vera nella piattaforma a cui appartenere; spenta salvo
// ORIGINAL_SKILLS_ENABLED=true.
export const originalSkillsRouter = Router()

originalSkillsRouter.use(requireAuth)

// Le chiavi della mappa sono companyId della piattaforma o etichette
// provvisorie: per i primi si mostra il nome della società. Il codAzienda
// non esce mai dal server.
async function companyLabels(cfg: OsConfig) {
  const ids = cfg.companies.map((c) => c.key).filter((k) => /^[0-9a-f-]{36}$/i.test(k))
  const found = ids.length ? await prisma.company.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }) : []
  const names = new Map(found.map((c) => [c.id, c.name]))
  return cfg.companies.map((c) => ({ key: c.key, label: names.get(c.key) ?? c.key, linked: names.has(c.key) }))
}

originalSkillsRouter.get('/companies', requireRole('PLATFORM_ADMIN'), async (_req, res, next) => {
  try {
    const cfg = readConfig()
    res.json({ companies: await companyLabels(cfg), maxRangeDays: MAX_RANGE_DAYS })
  } catch (err) {
    next(err)
  }
})

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const querySchema = z.object({ from: day.optional(), to: day.optional(), company: z.string().min(1).optional() })
const isoDay = (d: Date) => d.toISOString().slice(0, 10)

originalSkillsRouter.get('/results', requireRole('PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const cfg = readConfig()
    const q = querySchema.safeParse(req.query)
    if (!q.success) throw new BadRequestError('from/to: formato atteso AAAA-MM-GG')
    const to = q.data.to ?? isoDay(new Date())
    const from = q.data.from ?? isoDay(new Date(Date.parse(to) - 30 * 86_400_000))
    const span = (Date.parse(to) - Date.parse(from)) / 86_400_000
    if (!Number.isFinite(span) || span < 0) throw new BadRequestError('Intervallo non valido: «dal» deve precedere «al»')
    if (span > MAX_RANGE_DAYS) throw new BadRequestError(`Intervallo troppo lungo: al massimo ${MAX_RANGE_DAYS} giorni`)

    const selected = q.data.company ? cfg.companies.filter((c) => c.key === q.data.company) : cfg.companies
    if (!selected.length) throw new BadRequestError('Società non configurata')

    const body = await fetchExport(cfg, from, to, selected.map((c) => c.code))
    const out = normalizeExport(body, selected)
    await audit(prisma, {
      actorUserId: req.auth!.sub,
      action: 'originalSkills.previewed',
      entityType: 'OriginalSkills',
      metadata: { from, to, companies: selected.map((c) => c.key), people: out.people.length, discardedRows: out.discardedRows },
    })
    res.json({ from, to, companies: await companyLabels({ ...cfg, companies: selected }), ...out })
  } catch (err) {
    next(err)
  }
})

// Importazione delle persone più recenti nell'Anagrafica di una società
// (2026-11-20, prova su Acme Corp). Prima l'anteprima (dryRun), poi la
// conferma: tutto in una transazione, o niente. Solo PLATFORM_ADMIN. Le
// letture all'API sono quelle dell'anteprima, a finestre di 89 giorni.
const importSchema = z.object({
  companyId: z.string().uuid(),
  limit: z.number().int().min(1).max(200).default(100),
  dryRun: z.boolean().default(true),
})

const PREVIEW_TTL_MS = 10 * 60_000
const previewCache = new Map<string, { at: number; found: Awaited<ReturnType<typeof collectRecent>> }>()

async function assessmentCompany(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true, purchasedModules: true } })
  if (!company) throw new NotFoundError('Società non trovata')
  if (!company.purchasedModules.includes('ASSESSMENT')) throw new ForbiddenError('Il modulo Assessment non è attivo per questa società')
  return company
}

originalSkillsRouter.post('/import', requireRole('PLATFORM_ADMIN'), validateBody(importSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof importSchema>
    const cfg = readConfig()
    const company = await assessmentCompany(body.companyId)
    // La conferma importa le stesse persone dell'anteprima, senza rileggere l'API: l'elenco resta in
    // memoria 10 minuti, per chi l'ha chiesto, per società e numero. Dopo, si rilegge.
    const cacheKey = `${req.auth!.sub}|${company.id}|${body.limit}`
    const cached = previewCache.get(cacheKey)
    const found = !body.dryRun && cached && cached.at > Date.now() - PREVIEW_TTL_MS ? cached.found : await collectRecent(cfg, body.limit)
    if (body.dryRun) previewCache.set(cacheKey, { at: Date.now(), found })
    else previewCache.delete(cacheKey)
    const report = body.dryRun
      ? await prisma.$transaction((tx) => applyImport(tx, company.id, found.people, true))
      : await prisma.$transaction((tx) => applyImport(tx, company.id, found.people, false), { timeout: 180_000, maxWait: 10_000 })
    if (!body.dryRun) {
      // Solo conteggi: nessun nome, email o codice azienda nel registro.
      await audit(prisma, {
        actorUserId: req.auth!.sub,
        action: 'originalSkills.imported',
        entityType: 'Company',
        entityId: company.id,
        metadata: { from: found.from, windows: found.windows, people: report.people, created: report.created, updated: report.updated },
      })
    }
    res.json({ ...report, from: found.from, windows: found.windows, failedWindows: found.failedWindows, invalidRows: found.invalidRows })
  } catch (err) {
    next(err)
  }
})

// Toglie dalla società tutte le persone importate dai test, con i loro
// punteggi e il loro storico. Le persone inserite a mano restano.
originalSkillsRouter.delete('/import/:companyId', requireRole('PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const company = await assessmentCompany(String(req.params.companyId))
    let removed = 0
    try {
      removed = (await prisma.employee.deleteMany({ where: { companyId: company.id, externalSource: SOURCE } })).count
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new ConflictError('Alcune persone importate hanno un invito al test collegato: toglilo prima di rimuoverle')
      }
      throw err
    }
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'originalSkills.importRemoved', entityType: 'Company', entityId: company.id, metadata: { removed } })
    res.json({ removed })
  } catch (err) {
    next(err)
  }
})
