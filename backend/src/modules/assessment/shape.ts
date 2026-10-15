import { Prisma, type PrismaClient } from '@prisma/client'
import { z } from 'zod'

// Assessment sul server (PROGETTO-ASSESSMENT-SERVER.md §8). Il frontend
// conosce un solo oggetto, `AssessmentState` (frontend/src/modules/assessment/
// lib/types.ts), che finora stava in localStorage. Qui c'è la traduzione fra
// quella forma e le tabelle: l'API riceve e restituisce la forma del browser,
// così le schermate non cambiano, e il database resta interrogabile.
//
// Gli `id` che il frontend vede sono i `clientId` (unici per società), mai gli
// uuid del database.

type Tx = Prisma.TransactionClient | PrismaClient

// ---------- valori enumerati: browser ↔ database ----------

const CONTRACT = { dipendente: 'DIPENDENTE', cocopro: 'COCOPRO', partitaIva: 'PARTITA_IVA', esterno: 'ESTERNO' } as const
const ARCHIVE = { pensione: 'PENSIONE', licenziamento: 'LICENZIAMENTO', probation: 'PROBATION', altro: 'ALTRO' } as const
const SOURCE = { resp: 'RESP', peer: 'PEER', auto: 'AUTO' } as const
const ABSENCE = { ferie: 'FERIE', permesso: 'PERMESSO', formazione: 'FORMAZIONE', congedo: 'CONGEDO', altro: 'ALTRO' } as const
const SENDER = { referente: 'REFERENTE', admin: 'ADMIN' } as const

const invert = <T extends Record<string, string>>(m: T) => Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k])) as { [K in keyof T as T[K]]: K }
const CONTRACT_OUT = invert(CONTRACT)
const ARCHIVE_OUT = invert(ARCHIVE)
const SOURCE_OUT = invert(SOURCE)
const ABSENCE_OUT = invert(ABSENCE)
const SENDER_OUT = invert(SENDER)

export type SourceKey = keyof typeof SOURCE
export const toDbSource = (s: SourceKey) => SOURCE[s]
export const fromDbSource = (s: keyof typeof SOURCE_OUT) => SOURCE_OUT[s]

// Decisione 3 del 2026-10-14: il motivo di un'assenza diventa una categoria.
// Un motivo scritto a mano (dati di oggi, import) si riconduce alla categoria e
// il testo non si salva: potrebbe essere un dato sanitario.
export function absenceCategory(motivo: string): keyof typeof ABSENCE {
  const m = motivo.toLowerCase()
  if (/ferie|vacanz/.test(m)) return 'ferie'
  if (/permess/.test(m)) return 'permesso'
  if (/formazion|corso|master/.test(m)) return 'formazione'
  if (/congedo|maternit|paternit|parental/.test(m)) return 'congedo'
  return 'altro'
}

// ---------- schemi d'ingresso: tolleranti come hydrate() del frontend ----------

export const clientIdSchema = z.string().regex(/^[A-Za-z0-9_.-]{1,64}$/, 'id non valido')
const str = z.string().default('')
const isoDateTime = z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'data non valida')
const sourceKey = z.enum(['resp', 'peer', 'auto'])

const hardHistoryEntry = z.object({
  module: z.literal('professional').default('professional'),
  periodId: str,
  periodLabel: str,
  date: isoDateTime,
  source: sourceKey,
  apexScore: z.number(),
  dims: z.array(z.object({ code: z.string(), name: z.string(), score: z.number() })).default([]),
})
const softHistoryEntry = z.object({
  module: z.literal('transversal').default('transversal'),
  date: isoDateTime,
  source: z.string().default('manual'),
  overallOttenuto: z.number(),
  overallAtteso: z.number(),
})

export const employeeSchema = z.object({
  nome: str,
  cognome: str,
  email: str,
  area: str,
  reparto: str,
  ruolo: str,
  mansione: str,
  tipoProfilo: z.string().default('Employee'),
  tipoContratto: z.enum(['dipendente', 'cocopro', 'partitaIva', 'esterno']).default('dipendente'),
  sesso: str,
  livelloCcnl: str,
  // null o assente: chi non vede la RAL non la tocca (vedi writeEmployee).
  ral: z.number().nonnegative().nullable().optional(),
  benefit: str,
  assenzeProgrammate: z
    .array(z.object({ dal: str, al: str, category: z.enum(['ferie', 'permesso', 'formazione', 'congedo', 'altro']).optional(), motivo: z.string().optional() }))
    .default([]),
  archived: z.object({ reason: z.string(), note: str, date: z.string() }).nullable().default(null),
  soft: z.record(z.object({ ottenuto: z.number(), atteso: z.number() })).default({}),
  hard: z.record(sourceKey, z.record(z.number())).default({}),
  hardEvaluatedBy: z.record(sourceKey, z.string()).default({}),
  hardNotes: z.record(sourceKey, z.record(z.string())).optional(),
  hardHistory: z.array(hardHistoryEntry).default([]),
  softHistory: z.array(softHistoryEntry).default([]),
  feedbackNeeded: z.boolean().default(false),
  developmentPlan: z.record(z.string()).default({}),
  createdAt: isoDateTime.optional(),
  softSkillOverrides: z.array(z.string()).optional(),
  responsabileId: z.string().optional(),
  surveySentAt: isoDateTime.optional(),
})
export type EmployeeInput = z.infer<typeof employeeSchema>

export const periodSchema = z.object({ label: z.string().min(1), date: z.string().regex(/^\d{4}-\d{2}-\d{2}/) })

export const roleProfileSchema = z.object({
  requiredSkills: z.array(z.string()).default([]),
  skillWeights: z.record(z.union([z.literal(1), z.literal(2), z.literal(3)])).optional(),
  skillExpected: z.record(z.number()).optional(),
})

export const assignmentSchema = z.object({
  periodId: clientIdSchema,
  targetEmployeeId: clientIdSchema,
  templateType: sourceKey,
  evaluatorName: z.string().min(1),
  evaluatorEmail: str,
  status: z.enum(['pending', 'completed']).default('pending'),
  createdAt: isoDateTime.optional(),
  completedAt: isoDateTime.nullable().optional(),
})

export const settingsSchema = z.object({
  modulo: z.enum(['A', 'B', 'AB']).default('AB'),
  companyName: str,
  testsAcquired: z.number().int().nonnegative().default(0),
  testsDispatched: z.number().int().nonnegative().default(0),
  surveyLink: str,
  softSkillTargets: z.record(z.number()).default({}),
  surveySenderMode: z.enum(['referente', 'admin']).default('referente'),
  adminSenderEmail: str,
  actionNotes: z.record(z.string()).default({}),
  preTestLetter: str,
  surveyEmailSubject: str,
  surveyEmailBody: str,
  evaluators: z.array(z.string()).default([]),
  // Arrivano dal browser di oggi e si scartano: l'invio passa dal server.
  emailApiEndpoint: z.string().optional(),
  emailApiKey: z.string().optional(),
})

// Documenti letti solo dall'interfaccia: il server li conserva come sono.
export const companyProfileSchema = z.object({
  locations: z.array(z.record(z.unknown())).default([]),
  contacts: z.array(z.record(z.unknown())).default([]),
  referente: z.record(z.unknown()).default({}),
  ceo: z.record(z.unknown()).default({}),
  cfo: z.record(z.unknown()).default({}),
})
export const interviewSchema = z.record(z.unknown())

// ---------- lettura: database → forma del browser ----------

const dayString = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '')

const employeeInclude = {
  absences: { orderBy: { createdAt: 'asc' } },
  softScores: true,
  hardSources: true,
  softSnapshots: { orderBy: { date: 'asc' } },
  hardSnapshots: { orderBy: { date: 'asc' } },
} satisfies Prisma.EmployeeInclude
type EmployeeRow = Prisma.EmployeeGetPayload<{ include: typeof employeeInclude }>

export function employeeOut(e: EmployeeRow, canSeeRal: boolean) {
  const hard: Record<SourceKey, Record<string, number>> = { resp: {}, peer: {}, auto: {} }
  const hardEvaluatedBy: Record<SourceKey, string> = { resp: '', peer: '', auto: '' }
  const hardNotes: Partial<Record<SourceKey, Record<string, string>>> = {}
  for (const h of e.hardSources) {
    const k = fromDbSource(h.source)
    hard[k] = h.scores as Record<string, number>
    hardEvaluatedBy[k] = h.evaluatedBy
    const notes = h.notes as Record<string, string>
    if (Object.keys(notes).length) hardNotes[k] = notes
  }
  return {
    id: e.clientId,
    nome: e.nome,
    cognome: e.cognome,
    email: e.email ?? '',
    area: e.area,
    reparto: e.reparto,
    ruolo: e.ruolo,
    mansione: e.mansione,
    tipoProfilo: e.tipoProfilo,
    tipoContratto: CONTRACT_OUT[e.tipoContratto],
    sesso: e.sesso,
    livelloCcnl: e.livelloCcnl,
    // null = nascosta a questo ruolo. Non inserita = 0, come nel browser.
    ral: canSeeRal ? (e.ral !== null ? Number(e.ral) : 0) : null,
    benefit: e.benefit,
    assenzeProgrammate: e.absences.map((a) => ({ dal: dayString(a.dal), al: dayString(a.al), category: ABSENCE_OUT[a.category] })),
    archived: e.archivedAt ? { reason: ARCHIVE_OUT[e.archiveReason ?? 'ALTRO'], note: e.archiveNote ?? '', date: dayString(e.archivedAt) } : null,
    soft: Object.fromEntries(e.softScores.map((s) => [s.skillId, { ottenuto: s.ottenuto, atteso: s.atteso }])),
    hard,
    hardEvaluatedBy,
    ...(Object.keys(hardNotes).length ? { hardNotes } : {}),
    hardHistory: e.hardSnapshots.map((h) => ({
      module: 'professional' as const,
      periodId: h.periodClientId,
      periodLabel: h.periodLabel,
      date: h.date.toISOString(),
      source: fromDbSource(h.source),
      apexScore: h.apexScore,
      dims: h.dims,
    })),
    softHistory: e.softSnapshots.map((s) => ({ module: 'transversal' as const, date: s.date.toISOString(), source: s.source, overallOttenuto: s.overallOttenuto, overallAtteso: s.overallAtteso })),
    feedbackNeeded: e.feedbackNeeded,
    developmentPlan: e.developmentPlan,
    createdAt: e.createdAt.toISOString(),
    ...(e.softSkillOverrides !== null ? { softSkillOverrides: e.softSkillOverrides } : {}),
    ...(e.responsabileClientId ? { responsabileId: e.responsabileClientId } : {}),
    ...(e.surveySentAt ? { surveySentAt: e.surveySentAt.toISOString() } : {}),
  }
}

type AssignmentRow = Prisma.EmployeeEvaluationAssignmentGetPayload<{ include: { period: true; targetEmployee: true } }>
export function assignmentOut(a: AssignmentRow) {
  return {
    id: a.clientId,
    token: a.accessToken,
    periodId: a.period.clientId,
    targetEmployeeId: a.targetEmployee.clientId,
    templateType: fromDbSource(a.source),
    evaluatorName: a.evaluatorName,
    evaluatorEmail: a.evaluatorEmail,
    status: a.status === 'COMPLETED' ? ('completed' as const) : ('pending' as const),
    createdAt: a.createdAt.toISOString(),
    completedAt: a.completedAt ? a.completedAt.toISOString() : null,
  }
}

export async function readEmployee(tx: Tx, companyId: string, clientId: string, canSeeRal: boolean) {
  const e = await tx.employee.findUnique({ where: { companyId_clientId: { companyId, clientId } }, include: employeeInclude })
  return e ? employeeOut(e, canSeeRal) : null
}

export async function readAssignment(tx: Tx, companyId: string, clientId: string) {
  const a = await tx.employeeEvaluationAssignment.findUnique({ where: { companyId_clientId: { companyId, clientId } }, include: { period: true, targetEmployee: true } })
  return a ? assignmentOut(a) : null
}

// Tutto lo stato di una società nella forma del browser. Le parti che non
// esistono ancora sul server tornano assenti o vuote: il frontend le completa
// con la stessa hydrate() che usava per localStorage.
export async function readState(tx: Tx, companyId: string, canSeeRal: boolean) {
  const [employees, periods, roles, assignments, settings, profile, interview] = await Promise.all([
    tx.employee.findMany({ where: { companyId }, include: employeeInclude, orderBy: { createdAt: 'asc' } }),
    tx.assessmentPeriod.findMany({ where: { companyId }, orderBy: { createdAt: 'asc' } }),
    tx.jobRoleProfile.findMany({ where: { companyId }, orderBy: { roleName: 'asc' } }),
    tx.employeeEvaluationAssignment.findMany({ where: { companyId }, include: { period: true, targetEmployee: true }, orderBy: { createdAt: 'asc' } }),
    tx.assessmentSettings.findUnique({ where: { companyId } }),
    tx.assessmentCompanyProfile.findUnique({ where: { companyId } }),
    tx.executiveInterview.findUnique({ where: { companyId } }),
  ])
  return {
    settings: settings
      ? {
          modulo: settings.modulo,
          companyName: settings.companyName,
          testsAcquired: settings.testsAcquired,
          testsDispatched: settings.testsDispatched,
          surveyLink: settings.surveyLink,
          softSkillTargets: settings.softSkillTargets,
          surveySenderMode: SENDER_OUT[settings.surveySenderMode],
          adminSenderEmail: settings.adminSenderEmail,
          actionNotes: settings.actionNotes,
          preTestLetter: settings.preTestLetter,
          surveyEmailSubject: settings.surveyEmailSubject,
          surveyEmailBody: settings.surveyEmailBody,
          emailApiEndpoint: '',
          emailApiKey: '',
        }
      : null,
    employees: employees.map((e) => employeeOut(e, canSeeRal)),
    evaluators: settings?.evaluators ?? [],
    roleProfiles: Object.fromEntries(
      roles.map((r) => [
        r.roleName,
        {
          requiredSkills: r.requiredSkills,
          ...(r.skillWeights !== null ? { skillWeights: r.skillWeights } : {}),
          ...(r.skillExpected !== null ? { skillExpected: r.skillExpected } : {}),
        },
      ]),
    ),
    evalAssignments: assignments.map(assignmentOut),
    evalPeriods: periods.map((p) => ({ id: p.clientId, label: p.label, date: dayString(p.date) })),
    analisiIniziale: interview ? interview.data : null,
    company: profile ? { locations: profile.locations, contacts: profile.contacts, referente: profile.referente, ceo: profile.ceo, cfo: profile.cfo } : null,
  }
}

// ---------- scrittura: forma del browser → database ----------

const json = (v: unknown) => v as Prisma.InputJsonValue
const date = (s: string) => new Date(s)
const dayOrNull = (s: string) => (/^\d{4}-\d{2}-\d{2}/.test(s) ? new Date(`${s.slice(0, 10)}T00:00:00.000Z`) : null)

// Un dipendente si salva intero, come nel browser: anagrafica, punteggi,
// storico e assenze sostituiti nella stessa transazione. `canWriteRal` false
// lascia la RAL com'era (chi non la vede non la cancella salvando).
export async function writeEmployee(tx: Prisma.TransactionClient, companyId: string, clientId: string, e: EmployeeInput, canWriteRal: boolean) {
  const data = {
    nome: e.nome,
    cognome: e.cognome,
    email: e.email.trim() || null,
    sesso: e.sesso,
    area: e.area,
    reparto: e.reparto,
    ruolo: e.ruolo,
    mansione: e.mansione,
    tipoProfilo: e.tipoProfilo,
    tipoContratto: CONTRACT[e.tipoContratto],
    livelloCcnl: e.livelloCcnl,
    ...(canWriteRal && e.ral !== undefined ? { ral: e.ral === null || e.ral === 0 ? null : new Prisma.Decimal(e.ral) } : {}),
    benefit: e.benefit,
    feedbackNeeded: e.feedbackNeeded,
    developmentPlan: json(e.developmentPlan),
    softSkillOverrides: e.softSkillOverrides === undefined ? Prisma.DbNull : json(e.softSkillOverrides),
    responsabileClientId: e.responsabileId || null,
    archivedAt: e.archived ? dayOrNull(e.archived.date) ?? new Date() : null,
    archiveReason: e.archived ? ARCHIVE[(e.archived.reason in ARCHIVE ? e.archived.reason : 'altro') as keyof typeof ARCHIVE] : null,
    archiveNote: e.archived ? e.archived.note : null,
    surveySentAt: e.surveySentAt ? date(e.surveySentAt) : null,
  }
  const row = await tx.employee.upsert({
    where: { companyId_clientId: { companyId, clientId } },
    create: { companyId, clientId, ...data, ...(e.createdAt ? { createdAt: date(e.createdAt) } : {}) },
    update: data,
  })
  const employeeId = row.id

  await tx.employeeAbsence.deleteMany({ where: { employeeId } })
  await tx.employeeSoftScore.deleteMany({ where: { employeeId } })
  await tx.employeeHardSource.deleteMany({ where: { employeeId } })
  await tx.softAssessmentSnapshot.deleteMany({ where: { employeeId } })
  await tx.hardAssessmentSnapshot.deleteMany({ where: { employeeId } })

  const absences = e.assenzeProgrammate.filter((a) => a.dal || a.al || a.category || a.motivo?.trim())
  if (absences.length)
    await tx.employeeAbsence.createMany({
      data: absences.map((a, i) => ({
        employeeId,
        dal: dayOrNull(a.dal),
        al: dayOrNull(a.al),
        category: ABSENCE[a.category ?? absenceCategory(a.motivo ?? '')],
        // L'ordine dell'elenco si conserva con createdAt crescente.
        createdAt: new Date(Date.now() + i),
      })),
    })
  const soft = Object.entries(e.soft)
  if (soft.length) await tx.employeeSoftScore.createMany({ data: soft.map(([skillId, s]) => ({ employeeId, skillId, ottenuto: s.ottenuto, atteso: s.atteso })) })
  const sources = (['resp', 'peer', 'auto'] as const).filter((k) => e.hard[k] || e.hardEvaluatedBy[k] || e.hardNotes?.[k])
  if (sources.length)
    await tx.employeeHardSource.createMany({
      data: sources.map((k) => ({ employeeId, source: SOURCE[k], evaluatedBy: e.hardEvaluatedBy[k] ?? '', scores: json(e.hard[k] ?? {}), notes: json(e.hardNotes?.[k] ?? {}) })),
    })
  if (e.softHistory.length)
    await tx.softAssessmentSnapshot.createMany({
      data: e.softHistory.map((h) => ({ employeeId, date: date(h.date), source: h.source, overallOttenuto: h.overallOttenuto, overallAtteso: h.overallAtteso })),
    })
  if (e.hardHistory.length)
    await tx.hardAssessmentSnapshot.createMany({
      data: e.hardHistory.map((h) => ({ employeeId, periodClientId: h.periodId, periodLabel: h.periodLabel, date: date(h.date), source: SOURCE[h.source], apexScore: h.apexScore, dims: json(h.dims) })),
    })
  return row
}

export function settingsData(s: z.infer<typeof settingsSchema>) {
  return {
    modulo: s.modulo,
    companyName: s.companyName,
    testsAcquired: s.testsAcquired,
    testsDispatched: s.testsDispatched,
    surveyLink: s.surveyLink,
    softSkillTargets: json(s.softSkillTargets),
    surveySenderMode: SENDER[s.surveySenderMode],
    adminSenderEmail: s.adminSenderEmail,
    actionNotes: json(s.actionNotes),
    preTestLetter: s.preTestLetter,
    surveyEmailSubject: s.surveyEmailSubject,
    surveyEmailBody: s.surveyEmailBody,
    evaluators: s.evaluators,
  }
}

export function roleProfileData(r: z.infer<typeof roleProfileSchema>) {
  return {
    requiredSkills: r.requiredSkills,
    skillWeights: r.skillWeights === undefined ? Prisma.DbNull : json(r.skillWeights),
    skillExpected: r.skillExpected === undefined ? Prisma.DbNull : json(r.skillExpected),
  }
}
