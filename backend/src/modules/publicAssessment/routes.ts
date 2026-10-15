import { Prisma } from '@prisma/client'
import { Router, type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'

import { audit } from '../../lib/audit.js'
import { ConflictError, NotFoundError, TooManyRequestsError } from '../../lib/errors.js'
import { prisma } from '../../lib/prisma.js'
import { createLimiter } from '../../lib/rateLimit.js'
import { validateBody } from '../../middleware/validate.js'
import { APEX_ITEM_CODES, apexSummary } from '../assessment/apex.js'
import { fromDbSource } from '../assessment/shape.js'

// Il valutatore esterno di Assessment (PROGETTO-ASSESSMENT-SERVER.md §8.4,
// Parte 2). Il link `/assessment/evaluate?evalToken=` finora funzionava solo
// nel browser dell'HR, che aveva i dati; ora la pagina chiede qui. Senza
// accesso, per costruzione: il token dell'assegnazione è la credenziale, vale
// per un dipendente e una fonte, e si chiude con l'invio.
//
// Si espone il minimo: nome del dipendente, fonte, periodo, nome del
// valutatore e i voti già dati da quella fonte. Niente altri dipendenti, niente
// voti delle altre fonti, niente anagrafica.
export const publicAssessmentRouter = Router()

const limiter = createLimiter({ max: 60, windowMs: 60_000 })
// 32 byte casuali in base64url (routes.ts, newToken).
const TOKEN = /^[A-Za-z0-9_-]{43}$/

// Prima di tutto il resto, anche della lettura del corpo: limite e forma del token.
function guard(req: Request, _res: Response, next: NextFunction) {
  if (!limiter.hit(req.ip ?? 'unknown').allowed) return next(new TooManyRequestsError('Troppe richieste, riprova fra poco.'))
  if (!TOKEN.test(req.params.token)) return next(new NotFoundError('Link non valido'))
  next()
}

const findAssignment = (tx: Prisma.TransactionClient | typeof prisma, token: string) =>
  tx.employeeEvaluationAssignment.findUnique({
    where: { accessToken: token },
    include: { period: true, company: true, targetEmployee: { include: { hardSources: true } } },
  })

type Found = NonNullable<Awaited<ReturnType<typeof findAssignment>>>

// Un link vale finché la società ha Assessment e non è scaduto.
function usable(a: Found | null): a is Found {
  if (!a || !a.company.purchasedModules.includes('ASSESSMENT')) return false
  return !a.tokenExpiresAt || a.tokenExpiresAt > new Date()
}

publicAssessmentRouter.get('/:token', guard, async (req, res, next) => {
  try {
    const a = await findAssignment(prisma, req.params.token)
    if (!usable(a)) throw new NotFoundError('Link non valido')
    const base = { status: a.status === 'COMPLETED' ? 'completed' : 'pending', completedAt: a.completedAt?.toISOString() ?? null }
    if (a.status === 'COMPLETED') return res.set('Cache-Control', 'no-store').json(base)
    const own = a.targetEmployee.hardSources.find((h) => h.source === a.source)
    res.set('Cache-Control', 'no-store').json({
      ...base,
      source: fromDbSource(a.source),
      evaluatorName: a.evaluatorName,
      periodLabel: a.period.label,
      employee: { nome: a.targetEmployee.nome, cognome: a.targetEmployee.cognome },
      scores: (own?.scores ?? {}) as Record<string, number>,
      notes: (own?.notes ?? {}) as Record<string, string>,
    })
  } catch (err) {
    next(err)
  }
})

const score = z.number().int().min(1).max(10)
const submitSchema = z.object({
  // Tutte le 25 voci, come chiede il modulo ("Dai un voto a tutte le 25 voci").
  scores: z.object(Object.fromEntries(APEX_ITEM_CODES.map((c) => [c, score])) as Record<string, typeof score>).strict(),
  notes: z.record(z.string().max(2000)).default({}),
})

// Lo stesso che faceva il browser (AssessmentEvaluatePage, submit): voti e note
// della fonte sul dipendente, chi ha valutato, il valutatore fra quelli noti,
// una riga nello storico con il punteggio APEX ricalcolato, assegnazione chiusa.
publicAssessmentRouter.post('/:token', guard, validateBody(submitSchema), async (req, res, next) => {
  try {
    const { scores, notes } = req.body as z.infer<typeof submitSchema>
    const now = new Date()
    const done = await prisma.$transaction(async (tx) => {
      const a = await findAssignment(tx, req.params.token)
      if (!usable(a)) throw new NotFoundError('Link non valido')
      // Il token si chiude con l'invio: un secondo invio non sovrascrive.
      const closed = await tx.employeeEvaluationAssignment.updateMany({
        where: { id: a.id, status: 'PENDING' },
        data: { status: 'COMPLETED', completedAt: now },
      })
      if (!closed.count) throw new ConflictError('Questa valutazione è già stata inviata')

      const emp = a.targetEmployee
      const own = emp.hardSources.find((h) => h.source === a.source)
      const keptNotes = Object.fromEntries(Object.entries(notes).filter(([, t]) => t.trim()))
      const data = {
        scores: { ...((own?.scores ?? {}) as Record<string, number>), ...scores },
        notes: { ...((own?.notes ?? {}) as Record<string, string>), ...keptNotes },
        evaluatedBy: a.source === 'AUTO' ? `${emp.nome} ${emp.cognome}` : a.evaluatorName,
      }
      await tx.employeeHardSource.upsert({
        where: { employeeId_source: { employeeId: emp.id, source: a.source } },
        create: { employeeId: emp.id, source: a.source, ...data },
        update: data,
      })

      if (a.source !== 'AUTO' && a.evaluatorName) {
        const settings = await tx.assessmentSettings.findUnique({ where: { companyId: a.companyId } })
        const known = settings?.evaluators ?? []
        if (!known.some((n) => n.toLowerCase() === a.evaluatorName.toLowerCase()))
          await tx.assessmentSettings.upsert({ where: { companyId: a.companyId }, create: { companyId: a.companyId, evaluators: [a.evaluatorName] }, update: { evaluators: [...known, a.evaluatorName] } })
      }

      const hard = Object.fromEntries(
        emp.hardSources.filter((h) => h.source !== a.source).map((h) => [fromDbSource(h.source), h.scores as Record<string, number>]),
      )
      hard[fromDbSource(a.source)] = data.scores
      const summary = apexSummary(hard)
      await tx.hardAssessmentSnapshot.create({
        data: {
          employeeId: emp.id,
          periodClientId: a.period.clientId,
          periodLabel: a.period.label,
          date: now,
          source: a.source,
          apexScore: summary.apexScore,
          dims: summary.dims as Prisma.InputJsonValue,
        },
      })
      return a
    })
    await audit(prisma, { actorUserId: null, action: 'assessment.assignment.submitted', entityType: 'EmployeeEvaluationAssignment', entityId: done.id })
    res.json({ status: 'completed', completedAt: now.toISOString() })
  } catch (err) {
    next(err)
  }
})
