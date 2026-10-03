import { Router } from 'express'
import { z } from 'zod'

import { audit } from '../../lib/audit.js'
import { BadRequestError } from '../../lib/errors.js'
import { prisma } from '../../lib/prisma.js'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { fetchExport, MAX_RANGE_DAYS, readConfig, type OsConfig } from './client.js'
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
