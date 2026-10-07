import crypto from 'node:crypto'

import type { Prisma } from '@prisma/client'
import type { Request } from 'express'
import { Router } from 'express'
import { z } from 'zod'

import { askClaude } from '../../lib/ai.js'
import { audit } from '../../lib/audit.js'
import { LOGO_CID, readLogoBuffer, renderEvaluatorInvitation } from '../../lib/emailTemplates.js'
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, TooManyRequestsError, UnauthorizedError } from '../../lib/errors.js'
import { hashToken } from '../../lib/jwt.js'
import { sendMail } from '../../lib/mailer.js'
import { prisma } from '../../lib/prisma.js'
import { createLimiter } from '../../lib/rateLimit.js'
import { optionalAuth, requireAuth, requireCompanyScope, requireRole } from '../../middleware/auth.js'
import { validateBody } from '../../middleware/validate.js'

export const evaluatorsRouter = Router()

// OD-9, approved: support BOTH a full login AND an accountless evaluator
// authorized by a scoped, single-use token instead — never widen what that
// evaluator can see beyond their own assignment.
async function resolveEvaluatorAccess(req: Request): Promise<{ evaluatorId: string }> {
  const scopedToken = req.header('x-evaluator-token')
  if (scopedToken) {
    const evaluator = await prisma.evaluator.findUnique({ where: { accessTokenHash: hashToken(scopedToken) } })
    if (!evaluator || !evaluator.accessTokenExpiresAt || evaluator.accessTokenExpiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired evaluator access token')
    }
    return { evaluatorId: evaluator.id }
  }
  if (!req.auth) throw new UnauthorizedError()
  const evaluator = await prisma.evaluator.findUnique({ where: { userId: req.auth.sub } })
  if (!evaluator) throw new ForbiddenError('No evaluator record for this account')
  return { evaluatorId: evaluator.id }
}

const createEvaluatorSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['HR', 'MANAGER', 'DIRETTORE_HR', 'ALTRO']),
  altroLabel: z.string().optional(),
  companyId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
})

// Phase 34 §12/§15/§16 — REAL BUG FOUND AND FIXED during final QA: same gap
// class as cv/routes.ts and candidateProfiles/routes.ts, found here too —
// a COMPANY_ADMIN could create an evaluator (and, below, assign one, or
// issue an access token for one) under ANOTHER company's companyId, since
// nothing checked the body's companyId against the caller's own.
evaluatorsRouter.post('/', requireAuth, requireRole('COMPANY_ADMIN', 'PLATFORM_ADMIN'), validateBody(createEvaluatorSchema), async (req, res, next) => {
  try {
    if (req.body.companyId) requireCompanyScope(req, req.body.companyId)
    const evaluator = await prisma.evaluator.create({ data: req.body })
    await audit(prisma, { actorUserId: req.auth!.sub, action: 'evaluator.created', entityType: 'Evaluator', entityId: evaluator.id })
    res.status(201).json(evaluator)
  } catch (err) {
    next(err)
  }
})

// Issues a scoped, single-use access token for an accountless evaluator
// (OD-9) — a real system would email this as a link; here it's returned
// directly to the caller (company admin), who is responsible for
// delivering it, matching how the frontend's own SurveyLink flow already
// works (a link the admin copies and sends themselves).
evaluatorsRouter.post('/:id/issue-access-token', requireAuth, requireRole('COMPANY_ADMIN', 'PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const evaluator = await prisma.evaluator.findUnique({ where: { id: req.params.id } })
    if (!evaluator) throw new NotFoundError('Evaluator not found')
    if (evaluator.companyId) requireCompanyScope(req, evaluator.companyId)
    const token = crypto.randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
    await prisma.evaluator.update({ where: { id: evaluator.id }, data: { accessTokenHash: hashToken(token), accessTokenExpiresAt: expiresAt } })
    res.json({ token, expiresAt })
  } catch (err) {
    next(err)
  }
})

// Phase 33 §4/§5 — the missing READ side the evaluator-facing UI needs:
// nothing in Phase 30/32 exposed "who am I, and what am I assigned to
// evaluate" to the evaluator themselves (every existing route either
// creates/assigns evaluators as an admin, or upserts/submits ONE specific
// evaluation the caller already knows the campaignCandidateId for). This
// uses only the already-modeled relationship — CampaignEvaluatorAssignment
// (campaign-level, Phase 30 schema) -> that campaign's CampaignCandidate
// rows — same resolveEvaluatorAccess() dual-auth boundary as every other
// evaluator-scoped route, so it can never widen what a given evaluator
// (whether logged in or holding a scoped token) sees beyond their own
// assignments. No candidate filtering beyond "which campaigns is this
// evaluator assigned to" — that IS the full scope the schema defines;
// narrowing further (e.g. "only shortlisted candidates") would be an
// invented rule, not one that's already there.
evaluatorsRouter.get('/me', optionalAuth, async (req, res, next) => {
  try {
    const { evaluatorId } = await resolveEvaluatorAccess(req)
    const evaluator = await prisma.evaluator.findUniqueOrThrow({ where: { id: evaluatorId } })
    res.json({ id: evaluator.id, fullName: evaluator.fullName, email: evaluator.email, role: evaluator.role, altroLabel: evaluator.altroLabel })
  } catch (err) {
    next(err)
  }
})

evaluatorsRouter.get('/me/assignments', optionalAuth, async (req, res, next) => {
  try {
    const { evaluatorId } = await resolveEvaluatorAccess(req)
    const assignments = await prisma.campaignEvaluatorAssignment.findMany({
      where: { evaluatorId },
      include: {
        campaign: {
          include: {
            company: true,
            candidates: { include: { candidate: true } },
          },
        },
      },
    })

    const myEvaluations = await prisma.evaluation.findMany({ where: { evaluatorId } })
    const evalByCandidate = new Map(myEvaluations.map((e) => [e.campaignCandidateId, e]))

    const result = assignments.flatMap((a) =>
      a.campaign.candidates.map((cc) => ({
        campaignCandidateId: cc.id,
        campaignId: a.campaign.id,
        campaignName: a.campaign.name,
        companyName: a.campaign.company.name,
        candidate: { id: cc.candidate.id, fullName: cc.candidate.fullName },
        status: cc.status,
        myEvaluation: evalByCandidate.get(cc.id) || null,
      })),
    )
    res.json(result)
  } catch (err) {
    next(err)
  }
})

const assignSchema = z.object({ evaluatorId: z.string().uuid() })

evaluatorsRouter.post('/campaigns/:campaignId/assign', requireAuth, requireRole('COMPANY_ADMIN', 'PLATFORM_ADMIN'), validateBody(assignSchema), async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: req.params.campaignId } })
    requireCompanyScope(req, campaign.companyId)
    const existing = await prisma.campaignEvaluatorAssignment.findUnique({
      where: { campaignId_evaluatorId: { campaignId: req.params.campaignId, evaluatorId: req.body.evaluatorId } },
    })
    if (existing) throw new ConflictError('Evaluator already assigned to this campaign')
    const assignment = await prisma.campaignEvaluatorAssignment.create({
      data: { campaignId: req.params.campaignId, evaluatorId: req.body.evaluatorId },
    })
    res.status(201).json(assignment)
  } catch (err) {
    next(err)
  }
})

// Evaluations — one row per (campaignCandidate, evaluator), independent by
// construction (§6): a submitted evaluation is immutable, and this route
// only ever touches the CALLING evaluator's own row, whether they arrived
// via a full login or a scoped token.
const upsertEvaluationSchema = z.object({
  campaignCandidateId: z.string().uuid(),
  scores: z.record(z.string(), z.unknown()).default({}),
  finalScore: z.number().optional(),
  recommendation: z.enum(['PROCEDI', 'RISERVA', 'CONFRONTA', 'NO']).optional(),
  notes: z.string().optional(),
})

// Phase 34 §12/§16 — REAL BUG FOUND AND FIXED: resolveEvaluatorAccess()
// verifies WHO is calling, but nothing then checked that this evaluator is
// actually ASSIGNED (via CampaignEvaluatorAssignment) to the campaign that
// owns the campaignCandidateId they're submitting for — any evaluator
// (logged in or via a valid scoped token for a DIFFERENT campaign) could
// upsert an evaluation for a candidate they were never assigned to, just
// by knowing/guessing the campaignCandidateId. Fixed by requiring a real
// assignment row to exist first — the same relationship /me/assignments
// already reads, now also enforced as a write guard, not just a filter.
async function requireEvaluatorAssignedToCandidate(evaluatorId: string, campaignCandidateId: string): Promise<void> {
  const cc = await prisma.campaignCandidate.findUnique({ where: { id: campaignCandidateId } })
  if (!cc) throw new NotFoundError('Campaign candidate not found')
  const assignment = await prisma.campaignEvaluatorAssignment.findUnique({
    where: { campaignId_evaluatorId: { campaignId: cc.campaignId, evaluatorId } },
  })
  if (!assignment) throw new ForbiddenError('Not assigned to evaluate this candidate')
}

evaluatorsRouter.post('/evaluations', optionalAuth, async (req, res, next) => {
  try {
    const { evaluatorId } = await resolveEvaluatorAccess(req)
    const parsed = upsertEvaluationSchema.parse(req.body)
    await requireEvaluatorAssignedToCandidate(evaluatorId, parsed.campaignCandidateId)

    const existing = await prisma.evaluation.findUnique({
      where: { campaignCandidateId_evaluatorId: { campaignCandidateId: parsed.campaignCandidateId, evaluatorId } },
    })
    if (existing?.status === 'SUBMITTED') throw new ConflictError('This evaluation was already submitted and is immutable')

    const scores = parsed.scores as Prisma.InputJsonValue
    const evaluation = await prisma.evaluation.upsert({
      where: { campaignCandidateId_evaluatorId: { campaignCandidateId: parsed.campaignCandidateId, evaluatorId } },
      create: { ...parsed, scores, evaluatorId, status: 'DRAFT' },
      update: { ...parsed, scores },
    })
    res.status(existing ? 200 : 201).json(evaluation)
  } catch (err) {
    next(err)
  }
})

evaluatorsRouter.post('/evaluations/:id/submit', optionalAuth, async (req, res, next) => {
  try {
    const { evaluatorId } = await resolveEvaluatorAccess(req)
    const evaluation = await prisma.evaluation.findUnique({ where: { id: req.params.id } })
    if (!evaluation) throw new NotFoundError('Evaluation not found')
    if (evaluation.evaluatorId !== evaluatorId) throw new ForbiddenError('Not your evaluation')
    if (evaluation.status === 'SUBMITTED') throw new ConflictError('Already submitted')
    const submitted = await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: { status: 'SUBMITTED', submittedAt: new Date(), signedAt: new Date() },
    })
    res.json(submitted)
  } catch (err) {
    next(err)
  }
})

evaluatorsRouter.get('/campaign-candidates/:id/evaluations', requireAuth, requireRole('RECRUITER', 'COMPANY_ADMIN', 'PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    const cc = await prisma.campaignCandidate.findUnique({ where: { id: req.params.id }, include: { campaign: true } })
    if (!cc) throw new NotFoundError('Campaign candidate not found')
    requireCompanyScope(req, cc.campaign.companyId)
    const evaluations = await prisma.evaluation.findMany({ where: { campaignCandidateId: req.params.id }, include: { evaluator: true } })
    res.json(evaluations)
  } catch (err) {
    next(err)
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Fase "Foglio 2", Area Valutatore (Roberto Feliciani)
// ─────────────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = { HR: 'HR', MANAGER: 'Manager', DIRETTORE_HR: 'Direttore HR', ALTRO: 'Altro' }
const ACCESS_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000

// Invio via email del link alle schede (Intervista strutturata + Valutazione
// candidato) a uno o più valutatori della campagna. Per ognuno si emette un
// nuovo token di accesso (14 giorni): quello precedente, se c'era, smette di
// valere — il token è uno per valutatore. Il link punta alla stessa origine
// da cui il responsabile sta lavorando: `appUrl` deve coincidere con l'header
// Origin della richiesta, così nessuno può far partire email con un link
// verso un sito qualunque.
const sendFormsSchema = z.object({
  evaluatorIds: z.array(z.string().uuid()).min(1).max(20),
  appUrl: z.string().url(),
})

evaluatorsRouter.post('/campaigns/:campaignId/send-forms', requireAuth, requireRole('COMPANY_ADMIN', 'PLATFORM_ADMIN'), validateBody(sendFormsSchema), async (req, res, next) => {
  try {
    const { evaluatorIds, appUrl } = req.body as z.infer<typeof sendFormsSchema>
    const origin = req.header('origin')
    const appOrigin = new URL(appUrl).origin
    if (!origin || origin !== appOrigin) throw new BadRequestError('Indirizzo dell’applicazione non valido.')

    const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: req.params.campaignId }, include: { company: true } })
    requireCompanyScope(req, campaign.companyId)
    const assignments = await prisma.campaignEvaluatorAssignment.findMany({
      where: { campaignId: campaign.id, evaluatorId: { in: evaluatorIds } },
      include: { evaluator: true },
    })
    const byId = new Map(assignments.map((a) => [a.evaluatorId, a.evaluator]))

    const results: { evaluatorId: string; ok: boolean; reason?: string }[] = []
    for (const evaluatorId of evaluatorIds) {
      const evaluator = byId.get(evaluatorId)
      if (!evaluator) {
        results.push({ evaluatorId, ok: false, reason: 'Valutatore non assegnato a questa campagna' })
        continue
      }
      const token = crypto.randomBytes(32).toString('base64url')
      const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS)
      const link = `${appOrigin}/evaluate?evaluatorToken=${encodeURIComponent(token)}`
      const rendered = renderEvaluatorInvitation({
        evaluatorName: evaluator.fullName,
        companyName: campaign.company.name,
        campaignName: campaign.name,
        link,
        expiresOn: expiresAt.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      })
      const sent = await sendMail({
        to: evaluator.email,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
        attachments: [{ filename: 'skillvision-logo.png', content: readLogoBuffer(), cid: LOGO_CID, contentType: 'image/png' }],
      })
      if (!sent.ok) {
        // Il token nuovo non viene salvato: se l'email non è partita, quello
        // vecchio (se c'era) continua a funzionare.
        results.push({ evaluatorId, ok: false, reason: sent.reason })
        continue
      }
      await prisma.evaluator.update({ where: { id: evaluator.id }, data: { accessTokenHash: hashToken(token), accessTokenExpiresAt: expiresAt } })
      await audit(prisma, { actorUserId: req.auth!.sub, action: 'evaluator.forms_sent', entityType: 'Evaluator', entityId: evaluator.id, metadata: { campaignId: campaign.id } })
      results.push({ evaluatorId, ok: true })
    }
    res.json({ results })
  } catch (err) {
    next(err)
  }
})

// ── Sintesi IA delle valutazioni di un candidato ──
// Legge TUTTE le valutazioni inviate per il candidato e chiede al modello un
// riepilogo con quattro parti: elementi rilevanti, convergenze, divergenze,
// aspetti critici. Non salva niente: il responsabile verifica, modifica e poi
// riporta il testo nel Report finale valutativo (lato interfaccia).
//
// Minimizzazione: al modello non vanno nome del candidato, nomi/email dei
// valutatori, firme, riferimenti di candidatura né le retribuzioni. Solo
// punteggi, raccomandazioni e testi di giudizio, con i valutatori indicati come
// "Valutatore N — Ruolo". I testi liberi possono comunque contenere nomi
// scritti dai valutatori: non si possono filtrare.
const synthesisLimiter = createLimiter({ max: 20, windowMs: 10 * 60_000 })

const clip = (v: unknown, max = 1500): string => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const asRecord = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {})

// `labels`: i testi riscritti dal valutatore per le domande fisse (softLabels);
// `extras`: le domande che ha aggiunto (extraQuestions). Senza, la sintesi
// leggerebbe le domande originali al posto di quelle usate nel colloquio.
function rowsToText(rows: unknown, labelKey: string | null, labels?: unknown, extras?: unknown): string[] {
  const out: string[] = []
  const custom = asRecord(labels)
  for (const [key, raw] of Object.entries(asRecord(rows))) {
    const r = asRecord(raw)
    const label = labelKey ? clip(r[labelKey], 120) || key : clip(custom[key], 120) || key
    const score = clip(r.score, 10)
    const note = clip(r.note, 400)
    if (score || note) out.push(`- ${label}${score ? `: ${score}/5` : ''}${note ? ` — ${note}` : ''}`)
  }
  for (const raw of Array.isArray(extras) ? extras : []) {
    const r = asRecord(raw)
    const score = clip(r.score, 10)
    const note = clip(r.note, 400)
    if (score || note) out.push(`- ${clip(r.label, 120) || 'Domanda aggiunta'}${score ? `: ${score}/5` : ''}${note ? ` — ${note}` : ''}`)
  }
  return out
}

function describeEvaluation(index: number, evaluator: { role: string; altroLabel: string | null }, ev: { finalScore: number | null; recommendation: string | null; notes: string | null; scores: unknown }): string {
  const scores = asRecord(ev.scores)
  const v = asRecord(scores.verbale)
  const w = asRecord(scores.valutazione)
  const lines: string[] = [`### Valutatore ${index} — ${ROLE_LABEL[evaluator.role] ?? evaluator.role}${evaluator.altroLabel ? ` (${clip(evaluator.altroLabel, 60)})` : ''}`]
  if (ev.finalScore != null) lines.push(`Punteggio finale: ${ev.finalScore}`)
  if (ev.recommendation) lines.push(`Raccomandazione: ${ev.recommendation}`)
  if (ev.notes) lines.push(`Note: ${clip(ev.notes)}`)

  const esiti = [v.esitoProcedi && 'procedere', v.esitoStandby && 'stand-by', v.esitoAlternativo && 'ruolo alternativo', v.esitoNonIdoneo && 'non idoneo'].filter(Boolean)
  const verbale: string[] = []
  if (clip(v.faseProcesso, 60)) verbale.push(`Fase: ${clip(v.faseProcesso, 60)}`)
  if (clip(v.percorso)) verbale.push(`Percorso: ${clip(v.percorso)}`)
  verbale.push(...rowsToText(asRecord(v.tecnica), 'area'), ...rowsToText(v.soft, null, v.softLabels, v.extraQuestions))
  verbale.push(...rowsToText(v.riepilogo, null))
  if (clip(v.puntiForza)) verbale.push(`Punti di forza: ${clip(v.puntiForza)}`)
  if (clip(v.areeMiglioramento)) verbale.push(`Miglioramenti e rischi: ${clip(v.areeMiglioramento)}`)
  if (clip(v.qa)) verbale.push(`Domande e risposte chiave: ${clip(v.qa)}`)
  if (clip(v.giudizioSintetico)) verbale.push(`Giudizio sintetico: ${clip(v.giudizioSintetico)}`)
  if (clip(v.punteggioComplessivo, 10)) verbale.push(`Punteggio complessivo: ${clip(v.punteggioComplessivo, 10)}/5`)
  if (esiti.length) verbale.push(`Esito colloquio: ${esiti.join(', ')}`)
  if (clip(v.motivazioneDecisione)) verbale.push(`Motivazione: ${clip(v.motivazioneDecisione)}`)
  if (clip(v.noteAggiuntive)) verbale.push(`Note aggiuntive: ${clip(v.noteAggiuntive)}`)
  if (verbale.length) lines.push('Scheda intervista strutturata:', ...verbale)

  const valutazione: string[] = []
  valutazione.push(...rowsToText(asRecord(w.tecnica), 'label'), ...rowsToText(w.soft, null, w.softLabels, w.extraQuestions))
  for (const raw of Array.isArray(w.considerazioni) ? w.considerazioni : []) {
    const r = asRecord(raw)
    if (clip(r.emerso) || clip(r.approfondire)) valutazione.push(`Considerazioni dell'HR: ${clip(r.emerso, 600)}${clip(r.approfondire) ? ` — da approfondire: ${clip(r.approfondire, 400)}` : ''}`)
  }
  if (clip(w.finalScore, 10)) valutazione.push(`Punteggio finale (0–5): ${clip(w.finalScore, 10)}`)
  if (clip(w.motivazione)) valutazione.push(`Motivazione: ${clip(w.motivazione)}`)
  if (valutazione.length) lines.push('Scheda valutazione candidato:', ...valutazione)
  return lines.join('\n')
}

const SYNTHESIS_SYSTEM = `Sei un consulente HR che prepara la sintesi delle valutazioni di un candidato per il responsabile della selezione.
Scrivi in italiano, in modo sintetico e concreto. Usa SOLO quello che è scritto nelle schede: non inventare dati, non dedurre fatti che non ci sono. Se un punto non emerge dalle schede, dillo.
Rispondi esclusivamente con un oggetto JSON, senza testo prima o dopo e senza blocchi di codice, con queste quattro chiavi di tipo stringa:
- "rilevanti": gli elementi più rilevanti emersi (punti di forza, risultati, raccomandazioni) in 3-6 frasi o punti;
- "convergenze": in cosa i valutatori concordano; se c'è un solo valutatore scrivi che il confronto non è possibile;
- "divergenze": dove i valutatori differiscono (punteggi, raccomandazioni, giudizi), citandoli come "Valutatore N"; se non ce ne sono scrivilo;
- "criticita": gli aspetti critici o i rischi segnalati.`

const sectionsSchema = z.object({ rilevanti: z.string(), convergenze: z.string(), divergenze: z.string(), criticita: z.string() })

function parseSections(text: string): z.infer<typeof sectionsSchema> | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    const parsed = sectionsSchema.safeParse(JSON.parse(text.slice(start, end + 1)))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

evaluatorsRouter.post('/campaign-candidates/:id/synthesis', requireAuth, requireRole('RECRUITER', 'COMPANY_ADMIN', 'PLATFORM_ADMIN'), async (req, res, next) => {
  try {
    if (!synthesisLimiter.hit(req.auth!.sub).allowed) throw new TooManyRequestsError('Troppe sintesi richieste, riprova fra qualche minuto.')
    const cc = await prisma.campaignCandidate.findUnique({ where: { id: req.params.id }, include: { campaign: true } })
    if (!cc) throw new NotFoundError('Campaign candidate not found')
    requireCompanyScope(req, cc.campaign.companyId)
    const evaluations = await prisma.evaluation.findMany({
      where: { campaignCandidateId: cc.id, status: 'SUBMITTED' },
      include: { evaluator: true },
      orderBy: { submittedAt: 'asc' },
    })
    if (!evaluations.length) throw new BadRequestError('Non ci sono ancora valutazioni inviate da sintetizzare.')

    const body = evaluations.map((e, i) => describeEvaluation(i + 1, e.evaluator, e)).join('\n\n')
    const raw = await askClaude({ system: SYNTHESIS_SYSTEM, user: `Valutazioni inviate: ${evaluations.length}.\n\n${body}`.slice(0, 40_000) })
    // Se il modello non rispetta il formato, il testo non va perso: finisce
    // nella prima parte e il responsabile lo sistema a mano.
    const sections = parseSections(raw) ?? { rilevanti: raw.trim(), convergenze: '', divergenze: '', criticita: '' }

    await audit(prisma, { actorUserId: req.auth!.sub, action: 'evaluation.synthesis_generated', entityType: 'CampaignCandidate', entityId: cc.id, metadata: { evaluations: evaluations.length } })
    res.json({ sections, evaluationsUsed: evaluations.length, generatedAt: new Date().toISOString() })
  } catch (err) {
    next(err)
  }
})
