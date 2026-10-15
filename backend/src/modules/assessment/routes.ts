import { randomBytes } from 'node:crypto'

import { Prisma } from '@prisma/client'
import { Router, type Request } from 'express'
import { z } from 'zod'

import { audit } from '../../lib/audit.js'
import { env } from '../../lib/env.js'
import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors.js'
import { prisma } from '../../lib/prisma.js'
import { requireAuth, requireCompanyScope, requireRole } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'
import {
  assignmentSchema,
  clientIdSchema,
  companyProfileSchema,
  employeeSchema,
  interviewSchema,
  periodSchema,
  readAssignment,
  readEmployee,
  readState,
  roleProfileData,
  roleProfileSchema,
  settingsData,
  settingsSchema,
  toDbSource,
  writeEmployee,
} from './shape.js'

// Assessment sul server (PROGETTO-ASSESSMENT-SERVER.md §8.4). Tutte le rotte
// sono per società: /companies/:companyId/... Le risorse si salvano intere,
// nella forma del browser (shape.ts), con PUT idempotenti sul `clientId`.

export const assessmentRouter = Router()

assessmentRouter.use(requireAuth)

const READ_ROLES = ['PLATFORM_ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'READONLY'] as const
const WRITE_ROLES = ['PLATFORM_ADMIN', 'COMPANY_ADMIN', 'RECRUITER'] as const
// Decisione 3 del 2026-10-14: la RAL la vedono solo questi due ruoli.
const RAL_ROLES = new Set(['PLATFORM_ADMIN', 'COMPANY_ADMIN'])
const canSeeRal = (req: Request) => RAL_ROLES.has(req.auth!.role)

// Le transazioni che salvano un dipendente intero o un import sono più lunghe
// del limite di 5 s di Prisma.
const TX = { timeout: 60_000, maxWait: 10_000 }

// Società nel proprio perimetro e con il modulo Assessment acquistato.
async function companyFor(req: Request) {
  const companyId = req.params.companyId
  requireCompanyScope(req, companyId)
  const company = await prisma.company.findUnique({ where: { id: companyId } })
  if (!company) throw new NotFoundError('Società non trovata')
  if (!company.purchasedModules.includes('ASSESSMENT')) throw new ForbiddenError('Il modulo Assessment non è attivo per questa società')
  return company
}

function clientIdParam(req: Request, name = 'clientId') {
  const parsed = clientIdSchema.safeParse(req.params[name])
  if (!parsed.success) throw new NotFoundError('Elemento non trovato')
  return parsed.data
}

const newToken = () => randomBytes(32).toString('base64url')

const log = (req: Request, action: string, entityType: string, entityId: string, metadata?: Record<string, unknown>) =>
  audit(prisma, { actorUserId: req.auth!.sub, action, entityType, entityId, metadata })

// ---------- lettura ----------

assessmentRouter.get('/companies/:companyId/state', requireRole(...READ_ROLES), async (req, res, next) => {
  try {
    const company = await companyFor(req)
    res.json(await readState(prisma, company.id, canSeeRal(req)))
  } catch (err) {
    next(err)
  }
})

// ---------- dipendenti ----------

assessmentRouter.put('/companies/:companyId/employees/:clientId', requireRole(...WRITE_ROLES), validateBody(employeeSchema), async (req, res, next) => {
  try {
    const company = await companyFor(req)
    const clientId = clientIdParam(req)
    const row = await prisma.$transaction((tx) => writeEmployee(tx, company.id, clientId, req.body, canSeeRal(req)), TX)
    await log(req, 'assessment.employee.saved', 'Employee', row.id)
    res.json(await readEmployee(prisma, company.id, clientId, canSeeRal(req)))
  } catch (err) {
    next(err)
  }
})

// ---------- periodi ----------

assessmentRouter.put('/companies/:companyId/periods/:clientId', requireRole(...WRITE_ROLES), validateBody(periodSchema), async (req, res, next) => {
  try {
    const company = await companyFor(req)
    const clientId = clientIdParam(req)
    const { label, date } = req.body as z.infer<typeof periodSchema>
    const data = { label, date: new Date(`${date.slice(0, 10)}T00:00:00.000Z`) }
    const p = await prisma.assessmentPeriod.upsert({ where: { companyId_clientId: { companyId: company.id, clientId } }, create: { companyId: company.id, clientId, ...data }, update: data })
    await log(req, 'assessment.period.saved', 'AssessmentPeriod', p.id)
    res.json({ id: p.clientId, label: p.label, date: date.slice(0, 10) })
  } catch (err) {
    next(err)
  }
})

assessmentRouter.delete('/companies/:companyId/periods/:clientId', requireRole(...WRITE_ROLES), async (req, res, next) => {
  try {
    const company = await companyFor(req)
    const clientId = clientIdParam(req)
    const p = await prisma.assessmentPeriod.findUnique({ where: { companyId_clientId: { companyId: company.id, clientId } }, include: { _count: { select: { assignments: true } } } })
    if (!p) throw new NotFoundError('Periodo non trovato')
    if (p._count.assignments) throw new ConflictError('Il periodo ha valutazioni assegnate: toglierle prima')
    await prisma.assessmentPeriod.delete({ where: { id: p.id } })
    await log(req, 'assessment.period.deleted', 'AssessmentPeriod', p.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

// ---------- profili di mansione ----------

const roleNameParam = (req: Request) => {
  const name = req.params.roleName?.trim()
  if (!name || name.length > 200) throw new NotFoundError('Mansione non trovata')
  return name
}

assessmentRouter.put('/companies/:companyId/role-profiles/:roleName', requireRole(...WRITE_ROLES), validateBody(roleProfileSchema), async (req, res, next) => {
  try {
    const company = await companyFor(req)
    const roleName = roleNameParam(req)
    const data = roleProfileData(req.body)
    const r = await prisma.jobRoleProfile.upsert({ where: { companyId_roleName: { companyId: company.id, roleName } }, create: { companyId: company.id, roleName, ...data }, update: data })
    await log(req, 'assessment.roleProfile.saved', 'JobRoleProfile', r.id)
    res.json(req.body)
  } catch (err) {
    next(err)
  }
})

assessmentRouter.delete('/companies/:companyId/role-profiles/:roleName', requireRole(...WRITE_ROLES), async (req, res, next) => {
  try {
    const company = await companyFor(req)
    const roleName = roleNameParam(req)
    const r = await prisma.jobRoleProfile.findUnique({ where: { companyId_roleName: { companyId: company.id, roleName } } })
    if (!r) throw new NotFoundError('Mansione non trovata')
    await prisma.jobRoleProfile.delete({ where: { id: r.id } })
    await log(req, 'assessment.roleProfile.deleted', 'JobRoleProfile', r.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

// ---------- assegnazioni delle valutazioni ----------

// Alla creazione il token lo genera il server (quello del browser è debole e
// si ignora); la risposta lo restituisce e il frontend lo sostituisce al suo.
assessmentRouter.put('/companies/:companyId/assignments/:clientId', requireRole(...WRITE_ROLES), validateBody(assignmentSchema), async (req, res, next) => {
  try {
    const company = await companyFor(req)
    const clientId = clientIdParam(req)
    const a = req.body as z.infer<typeof assignmentSchema>
    const [period, target] = await Promise.all([
      prisma.assessmentPeriod.findUnique({ where: { companyId_clientId: { companyId: company.id, clientId: a.periodId } } }),
      prisma.employee.findUnique({ where: { companyId_clientId: { companyId: company.id, clientId: a.targetEmployeeId } } }),
    ])
    if (!period) throw new ConflictError('Periodo sconosciuto: salvarlo prima dell’assegnazione')
    if (!target) throw new ConflictError('Dipendente sconosciuto: salvarlo prima dell’assegnazione')
    const completed = a.status === 'completed'
    const data = {
      periodId: period.id,
      targetEmployeeId: target.id,
      source: toDbSource(a.templateType),
      evaluatorName: a.evaluatorName,
      evaluatorEmail: a.evaluatorEmail,
      status: completed ? ('COMPLETED' as const) : ('PENDING' as const),
      completedAt: completed ? (a.completedAt ? new Date(a.completedAt) : new Date()) : null,
    }
    const row = await prisma.employeeEvaluationAssignment.upsert({
      where: { companyId_clientId: { companyId: company.id, clientId } },
      create: { companyId: company.id, clientId, accessToken: newToken(), ...data, ...(a.createdAt ? { createdAt: new Date(a.createdAt) } : {}) },
      update: data,
    })
    await log(req, 'assessment.assignment.saved', 'EmployeeEvaluationAssignment', row.id)
    res.json(await readAssignment(prisma, company.id, clientId))
  } catch (err) {
    next(err)
  }
})

assessmentRouter.delete('/companies/:companyId/assignments/:clientId', requireRole(...WRITE_ROLES), async (req, res, next) => {
  try {
    const company = await companyFor(req)
    const clientId = clientIdParam(req)
    const row = await prisma.employeeEvaluationAssignment.findUnique({ where: { companyId_clientId: { companyId: company.id, clientId } } })
    if (!row) throw new NotFoundError('Assegnazione non trovata')
    await prisma.employeeEvaluationAssignment.delete({ where: { id: row.id } })
    await log(req, 'assessment.assignment.deleted', 'EmployeeEvaluationAssignment', row.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

// ---------- documenti unici per società ----------

assessmentRouter.put('/companies/:companyId/settings', requireRole(...WRITE_ROLES), validateBody(settingsSchema), async (req, res, next) => {
  try {
    const company = await companyFor(req)
    const data = settingsData(req.body)
    const s = await prisma.assessmentSettings.upsert({ where: { companyId: company.id }, create: { companyId: company.id, ...data }, update: data })
    await log(req, 'assessment.settings.saved', 'AssessmentSettings', s.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

assessmentRouter.put('/companies/:companyId/company-profile', requireRole(...WRITE_ROLES), validateBody(companyProfileSchema), async (req, res, next) => {
  try {
    const company = await companyFor(req)
    const data = req.body as Prisma.AssessmentCompanyProfileUncheckedCreateInput
    const p = await prisma.assessmentCompanyProfile.upsert({ where: { companyId: company.id }, create: { ...data, companyId: company.id }, update: { ...data, companyId: company.id } })
    await log(req, 'assessment.companyProfile.saved', 'AssessmentCompanyProfile', p.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

assessmentRouter.put('/companies/:companyId/interview', requireRole(...WRITE_ROLES), validateBody(interviewSchema), async (req, res, next) => {
  try {
    const company = await companyFor(req)
    const data = { data: req.body as Prisma.InputJsonValue, completed: req.body.completed === true }
    const i = await prisma.executiveInterview.upsert({ where: { companyId: company.id }, create: { companyId: company.id, ...data }, update: data })
    await log(req, 'assessment.interview.saved', 'ExecutiveInterview', i.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

// ---------- Valutazione 5P: documento con versione ----------

assessmentRouter.get('/companies/:companyId/valutazione-5p', requireRole(...READ_ROLES), async (req, res, next) => {
  try {
    const company = await companyFor(req)
    const doc = await prisma.valutazione5p.findUnique({ where: { companyId: company.id } })
    res.json(doc ? { state: doc.state, version: doc.version } : { state: null, version: 0 })
  } catch (err) {
    next(err)
  }
})

const fivePSchema = z.object({ state: z.record(z.unknown()), version: z.number().int().nonnegative() })

// `version` è quella letta: se nel frattempo qualcuno ha salvato, 409 e il
// frontend ricarica invece di sovrascrivere il lavoro dell'altro.
assessmentRouter.put('/companies/:companyId/valutazione-5p', requireRole(...WRITE_ROLES), validateBody(fivePSchema), async (req, res, next) => {
  try {
    const company = await companyFor(req)
    const { state, version } = req.body as z.infer<typeof fivePSchema>
    const saved = await prisma.$transaction(async (tx) => {
      const current = await tx.valutazione5p.findUnique({ where: { companyId: company.id } })
      if ((current?.version ?? 0) !== version) throw new ConflictError('La Valutazione 5P è stata modificata da un altro utente: ricaricare')
      const data = { state: state as Prisma.InputJsonValue, version: version + 1 }
      return tx.valutazione5p.upsert({ where: { companyId: company.id }, create: { companyId: company.id, ...data }, update: data })
    })
    await log(req, 'assessment.valutazione5p.saved', 'Valutazione5p', saved.id, { version: saved.version })
    res.json({ version: saved.version })
  } catch (err) {
    next(err)
  }
})

// ---------- import dal browser e reset della demo ----------

const importSchema = z.object({
  state: z.object({
    settings: z.record(z.unknown()).optional(),
    employees: z.array(z.record(z.unknown())).default([]),
    evaluators: z.array(z.string()).optional(),
    roleProfiles: z.record(z.unknown()).default({}),
    evalAssignments: z.array(z.record(z.unknown())).default([]),
    evalPeriods: z.array(z.record(z.unknown())).default([]),
    analisiIniziale: z.record(z.unknown()).optional(),
    company: z.record(z.unknown()).optional(),
  }),
  dryRun: z.boolean().default(false),
})

type ImportReport = { employees: number; periods: number; roleProfiles: number; assignments: number; skipped: { what: string; id: string; reason: string }[] }

// Decisione 4 del 2026-10-14: i dati di oggi si importano. Idempotente sul
// clientId: rifarlo aggiorna, non duplica. I token dei link dei valutatori si
// rigenerano (quelli del browser funzionavano solo nel browser dell'HR).
// Con `dryRun` fa tutto in una transazione che poi annulla, e riporta i conti.
async function importState(tx: Prisma.TransactionClient, companyId: string, body: z.infer<typeof importSchema>['state'], canWriteRal: boolean): Promise<ImportReport> {
  const report: ImportReport = { employees: 0, periods: 0, roleProfiles: 0, assignments: 0, skipped: [] }
  const skip = (what: string, id: string, reason: string) => report.skipped.push({ what, id: String(id), reason })

  if (body.settings) {
    const s = settingsSchema.safeParse({ ...body.settings, evaluators: body.evaluators ?? [] })
    if (s.success) {
      const data = settingsData(s.data)
      await tx.assessmentSettings.upsert({ where: { companyId }, create: { companyId, ...data }, update: data })
    } else skip('settings', '-', s.error.issues[0]?.message ?? 'non valido')
  }
  if (body.company) {
    const p = companyProfileSchema.safeParse(body.company)
    if (p.success) await tx.assessmentCompanyProfile.upsert({ where: { companyId }, create: { companyId, ...p.data } as Prisma.AssessmentCompanyProfileUncheckedCreateInput, update: p.data as Prisma.AssessmentCompanyProfileUncheckedUpdateInput })
    else skip('company', '-', p.error.issues[0]?.message ?? 'non valido')
  }
  if (body.analisiIniziale) {
    const data = { data: body.analisiIniziale as Prisma.InputJsonValue, completed: body.analisiIniziale.completed === true }
    await tx.executiveInterview.upsert({ where: { companyId }, create: { companyId, ...data }, update: data })
  }
  for (const raw of body.evalPeriods) {
    const id = clientIdSchema.safeParse(raw.id)
    const p = periodSchema.safeParse(raw)
    if (!id.success || !p.success) {
      skip('periodo', String(raw.id), 'id o data non validi')
      continue
    }
    const data = { label: p.data.label, date: new Date(`${p.data.date.slice(0, 10)}T00:00:00.000Z`) }
    await tx.assessmentPeriod.upsert({ where: { companyId_clientId: { companyId, clientId: id.data } }, create: { companyId, clientId: id.data, ...data }, update: data })
    report.periods++
  }
  for (const [roleName, raw] of Object.entries(body.roleProfiles)) {
    const r = roleProfileSchema.safeParse(raw)
    if (!r.success || !roleName.trim()) {
      skip('mansione', roleName, 'profilo non valido')
      continue
    }
    const data = roleProfileData(r.data)
    await tx.jobRoleProfile.upsert({ where: { companyId_roleName: { companyId, roleName } }, create: { companyId, roleName, ...data }, update: data })
    report.roleProfiles++
  }
  for (const raw of body.employees) {
    const id = clientIdSchema.safeParse(raw.id)
    const e = employeeSchema.safeParse(raw)
    if (!id.success || !e.success) {
      skip('dipendente', String(raw.id), e.success ? 'id non valido' : `${e.error.issues[0]?.path.join('.')}: ${e.error.issues[0]?.message}`)
      continue
    }
    await writeEmployee(tx, companyId, id.data, e.data, canWriteRal)
    report.employees++
  }
  for (const raw of body.evalAssignments) {
    const id = clientIdSchema.safeParse(raw.id)
    const a = assignmentSchema.safeParse(raw)
    if (!id.success || !a.success) {
      skip('assegnazione', String(raw.id), 'non valida')
      continue
    }
    const [period, target] = await Promise.all([
      tx.assessmentPeriod.findUnique({ where: { companyId_clientId: { companyId, clientId: a.data.periodId } } }),
      tx.employee.findUnique({ where: { companyId_clientId: { companyId, clientId: a.data.targetEmployeeId } } }),
    ])
    if (!period || !target) {
      skip('assegnazione', id.data, 'periodo o dipendente mancante')
      continue
    }
    const completed = a.data.status === 'completed'
    const data = {
      periodId: period.id,
      targetEmployeeId: target.id,
      source: toDbSource(a.data.templateType),
      evaluatorName: a.data.evaluatorName,
      evaluatorEmail: a.data.evaluatorEmail,
      status: completed ? ('COMPLETED' as const) : ('PENDING' as const),
      completedAt: completed ? (a.data.completedAt ? new Date(a.data.completedAt) : new Date()) : null,
    }
    await tx.employeeEvaluationAssignment.upsert({
      where: { companyId_clientId: { companyId, clientId: id.data } },
      create: { companyId, clientId: id.data, accessToken: newToken(), ...data, ...(a.data.createdAt ? { createdAt: new Date(a.data.createdAt) } : {}) },
      update: data,
    })
    report.assignments++
  }
  return report
}

class DryRunRollback extends Error {
  constructor(readonly report: ImportReport) {
    super('dry run')
  }
}

assessmentRouter.post('/companies/:companyId/import', requireRole('PLATFORM_ADMIN', 'COMPANY_ADMIN'), validateBody(importSchema), async (req, res, next) => {
  try {
    const company = await companyFor(req)
    const { state, dryRun } = req.body as z.infer<typeof importSchema>
    let report: ImportReport
    try {
      report = await prisma.$transaction(async (tx) => {
        const r = await importState(tx, company.id, state, canSeeRal(req))
        if (dryRun) throw new DryRunRollback(r)
        return r
      }, TX)
    } catch (err) {
      if (err instanceof DryRunRollback) return res.json({ dryRun: true, ...err.report })
      throw err
    }
    await log(req, 'assessment.imported', 'Company', company.id, { employees: report.employees, periods: report.periods, assignments: report.assignments, skipped: report.skipped.length })
    res.json({ dryRun: false, ...report })
  } catch (err) {
    next(err)
  }
})

// "Reset demo": solo per le società in ASSESSMENT_DEMO_COMPANY_IDS. Toglie i
// dati di Assessment della società; il frontend poi importa i dati di prova.
assessmentRouter.post('/companies/:companyId/reset', requireRole('PLATFORM_ADMIN', 'COMPANY_ADMIN'), async (req, res, next) => {
  try {
    const company = await companyFor(req)
    if (!env.assessmentDemoCompanyIds.includes(company.id)) throw new ForbiddenError('Il reset è ammesso solo per una società demo')
    const companyId = company.id
    await prisma.$transaction(
      async (tx) => {
        const invited = await tx.testInvitation.findMany({ where: { employee: { companyId } }, select: { id: true } })
        await tx.testResponse.deleteMany({ where: { testInvitationId: { in: invited.map((i) => i.id) } } })
        await tx.testInvitation.deleteMany({ where: { id: { in: invited.map((i) => i.id) } } })
        await tx.employeeEvaluationAssignment.deleteMany({ where: { companyId } })
        await tx.employee.deleteMany({ where: { companyId } })
        await tx.assessmentPeriod.deleteMany({ where: { companyId } })
        await tx.jobRoleProfile.deleteMany({ where: { companyId } })
        await tx.assessmentSettings.deleteMany({ where: { companyId } })
        await tx.assessmentCompanyProfile.deleteMany({ where: { companyId } })
        await tx.executiveInterview.deleteMany({ where: { companyId } })
        await tx.valutazione5p.deleteMany({ where: { companyId } })
      },
      TX,
    )
    await log(req, 'assessment.demoReset', 'Company', companyId)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})
