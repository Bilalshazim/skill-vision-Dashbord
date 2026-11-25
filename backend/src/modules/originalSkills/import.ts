// Importazione delle persone dai test (Original Skills) nell'Anagrafica di una
// società, 2026-11-20. Per ora è una prova: le persone più recenti entrano in
// una società scelta da un PLATFORM_ADMIN (Acme Corp), con tutti i dati
// anagrafici del test e i punteggi delle competenze trasversali. Le
// competenze professionali non si toccano: si compilano a mano.
//
// Una nuova importazione aggiorna, non duplica: ogni persona porta
// l'identificativo del test (`externalId` = numero intervista).

import { Prisma } from '@prisma/client'
import { z } from 'zod'

import { fetchExport, MAX_RANGE_DAYS, type OsConfig } from './client.js'
import { skillIdFor } from './skills.js'

export const SOURCE = 'original-skills'
const DAY = 86_400_000
const DEFAULT_ATTESO = 6 // lo stesso dell'inserimento a mano (SoftEvalModal)

// ---------- lettura completa di una riga ----------

const str = z.union([z.string(), z.number()]).transform((v) => String(v).trim()).catch('')
const rawRow = z
  .object({
    Nome: str,
    Cognome: str,
    Sesso: str,
    'Anno nascita': str,
    Paese: str,
    Regione: str,
    Provincia: str,
    email: str,
    risultato: str,
    'numero intervista': str,
    'ultima modifica': str,
    lingua: str,
    sede: str,
    'ragione sociale': str,
    'tipo candidatura': str,
    codAzienda: str,
    'titolo di studio': str,
    livello: str,
    area: str,
    ruolo: str,
    esperienza: str,
    istruzione: str,
    'data assunzione': str,
    'data dimissioni': str,
    ral: str,
    competenze: z.array(z.object({ nome: str, punteggio: str }).passthrough()).catch([]),
    'competenze ruolo': z.array(z.object({ nome: str, punteggio: str, 'valore atteso': str, diff: str }).passthrough()).catch([]),
  })
  .passthrough()

// I nomi dei campi arrivano con maiuscole non uniformi (`Cognome` ma `email`): se un campo atteso non c'è
// con il suo nome, si cerca lo stesso nome senza maiuscole e spazi ai lati («Area», « ruolo »).
const SCHEMA_KEYS = Object.keys(rawRow.shape)
function canon(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw
  const src = raw as Record<string, unknown>
  const lower = new Map(Object.entries(src).map(([k, v]) => [k.trim().toLowerCase(), v]))
  const out: Record<string, unknown> = { ...src }
  for (const k of SCHEMA_KEYS) if (out[k] === undefined && lower.has(k.toLowerCase())) out[k] = lower.get(k.toLowerCase())
  return out
}

const num = (s: string): number | null => {
  if (!s) return null
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
const round2 = (n: number) => Math.round(n * 100) / 100
// "2026-09-30 10:12:44.0" → Date; il fuso non è dichiarato, si legge come UTC.
const when = (s: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return null
  const d = new Date(`${s.replace(' ', 'T').replace(/\.\d+$/, '')}Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Il profilo del test che si conserva accanto alla persona: solo i campi con un valore. */
export type OsProfile = {
  testId: string
  completedAt: string | null
  lingua?: string
  paese?: string
  regione?: string
  provincia?: string
  sede?: string
  ragioneSociale?: string
  tipoCandidatura?: string
  titoloStudio?: string
  livello?: string
  area?: string
  ruolo?: string
  esperienza?: string
  istruzione?: string
  dataAssunzione?: string
  dataDimissioni?: string
  risultato?: number
  competenzeRuolo: { skillId: string | null; nome: string; punteggio: number | null; atteso: number | null; diff: number | null }[]
  competenzeNonCollegate: { nome: string; punteggio: number | null }[]
}

export type OsImportPerson = {
  testId: string
  nome: string
  cognome: string
  email: string
  sesso: '' | 'M' | 'F'
  birthYear: number | null
  completedAt: Date | null
  scores: Record<string, number>
  /** I campi dell'Anagrafica che il test può dare: vuoti = il test non li ha. */
  work: { area: string; ruolo: string; livello: string; ral: number | null }
  profile: OsProfile
}

export function readPeople(body: unknown, codes: Set<string>): { people: OsImportPerson[]; invalidRows: number; discardedRows: number } {
  const rows = Array.isArray(body) ? body : []
  const people: OsImportPerson[] = []
  let invalidRows = 0
  let discardedRows = 0
  for (const raw of rows) {
    const p = rawRow.safeParse(canon(raw))
    if (!p.success || !p.data['numero intervista']) {
      invalidRows++
      continue
    }
    const r = p.data
    // Le righe dell'account API arrivano sempre, qualunque codice si chieda.
    if (!codes.has(r.codAzienda)) {
      discardedRows++
      continue
    }
    const scores: Record<string, number> = {}
    const unmapped: OsProfile['competenzeNonCollegate'] = []
    for (const c of r.competenze) {
      const id = skillIdFor(c.nome)
      const v = num(c.punteggio)
      if (!id) {
        if (c.nome) unmapped.push({ nome: c.nome, punteggio: v })
        continue
      }
      if (v !== null && scores[id] === undefined) scores[id] = round2(v)
    }
    const year = Number(r['Anno nascita'])
    const sex = r.Sesso.toUpperCase()
    const completedAt = when(r['ultima modifica'])
    const opt = (v: string) => v || undefined
    const risultato = num(r.risultato)
    people.push({
      testId: r['numero intervista'],
      nome: r.Nome,
      cognome: r.Cognome,
      email: r.email.includes('@') ? r.email.toLowerCase() : '',
      sesso: sex === 'M' || sex === 'F' ? sex : '',
      birthYear: Number.isInteger(year) && year > 1900 && year < 2100 ? year : null,
      completedAt,
      scores,
      work: { area: r.area, ruolo: r.ruolo, livello: r.livello, ral: (() => { const v = num(r.ral.replace(/[€\s]/g, '')); return v !== null && v > 0 ? v : null })() },
      profile: {
        testId: r['numero intervista'],
        completedAt: completedAt?.toISOString() ?? null,
        lingua: opt(r.lingua),
        paese: opt(r.Paese),
        regione: opt(r.Regione),
        provincia: opt(r.Provincia),
        sede: opt(r.sede),
        ragioneSociale: opt(r['ragione sociale']),
        tipoCandidatura: opt(r['tipo candidatura']),
        titoloStudio: opt(r['titolo di studio']),
        livello: opt(r.livello),
        area: opt(r.area),
        ruolo: opt(r.ruolo),
        esperienza: opt(r.esperienza),
        istruzione: opt(r.istruzione),
        dataAssunzione: opt(r['data assunzione']),
        dataDimissioni: opt(r['data dimissioni']),
        ...(risultato !== null ? { risultato } : {}),
        competenzeRuolo: r['competenze ruolo'].map((c) => ({
          skillId: skillIdFor(c.nome),
          nome: c.nome,
          punteggio: num(c.punteggio),
          atteso: num(c['valore atteso']),
          diff: num(c.diff),
        })),
        competenzeNonCollegate: unmapped,
      },
    })
  }
  return { people, invalidRows, discardedRows }
}

// ---------- le più recenti ----------

const isoDay = (d: Date) => d.toISOString().slice(0, 10)

export type Fetcher = (cfg: OsConfig, from: string, to: string, codes: string[], timeoutMs?: number) => Promise<unknown>

// Le finestre più vecchie possono essere lente: per l'importazione si aspetta di più dell'anteprima.
const IMPORT_TIMEOUT_MS = 30_000

/**
 * Le `limit` persone con il test più recente. L'API non pagina e accetta meno
 * di 90 giorni per chiamata: si va indietro a finestre di 89 giorni finché le
 * persone bastano o le finestre finiscono. Una persona con più test conta una
 * volta, con il più recente (stessa email; senza email, lo stesso test).
 * Se una finestra più vecchia non risponde, si tiene quello che si ha già e
 * lo si dice (`failedWindows`); se non risponde la prima, l'errore sale.
 */
export async function collectRecent(cfg: OsConfig, limit: number, opts: { maxWindows?: number; now?: Date; fetcher?: Fetcher } = {}) {
  const maxWindows = opts.maxWindows ?? 8
  const fetcher = opts.fetcher ?? fetchExport
  const codes = cfg.companies.map((c) => c.code)
  const codeSet = new Set(codes)
  const byKey = new Map<string, OsImportPerson>()
  let to = opts.now ?? new Date()
  let windows = 0
  let invalidRows = 0
  let discardedRows = 0
  let failedWindows = 0
  let from = to
  while (windows < maxWindows && byKey.size < limit) {
    const start = new Date(to.getTime() - (MAX_RANGE_DAYS - 1) * DAY)
    let body: unknown
    try {
      body = await fetcher(cfg, isoDay(start), isoDay(to), codes, IMPORT_TIMEOUT_MS)
    } catch (err) {
      if (!windows) throw err
      failedWindows++
      break
    }
    from = start
    const out = readPeople(body, codeSet)
    windows++
    invalidRows += out.invalidRows
    discardedRows += out.discardedRows
    for (const p of out.people) {
      const key = p.email ? `e:${p.email}` : `t:${p.testId}`
      const prev = byKey.get(key)
      if (!prev || (p.completedAt?.getTime() ?? 0) > (prev.completedAt?.getTime() ?? 0)) byKey.set(key, p)
    }
    to = new Date(from.getTime() - DAY)
  }
  const people = [...byKey.values()].sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0)).slice(0, limit)
  return { people, windows, failedWindows, from: isoDay(from), invalidRows, discardedRows }
}

// ---------- scrittura ----------

export type OsImportReport = {
  dryRun: boolean
  people: number
  created: number
  updated: number
  withoutEmail: number
  withoutScores: number
  employees: number
  candidates: number
  unmappedSkills: string[]
  /** Quante persone hanno il campo compilato nel test: zero = il test non lo manda. */
  fieldsFound: { area: number; ruolo: number; livello: number; ral: number }
}

type Tx = Prisma.TransactionClient

/**
 * Crea o aggiorna le persone nella società. Si riconosce prima per test, poi
 * per email; mai per nome. Di una persona già presente si aggiornano nome,
 * dati del test e punteggi trasversali; area, mansione (`ruolo`), livello CCNL e
 * RAL solo quando il test li ha (Bilal, 2026-11-25: «riempiti nel campo
 * giusto»), altrimenti restano quelli di Skill-Vision. Reparto, attività,
 * benefit e competenze professionali il test non li ha: restano come sono. L'atteso di una
 * competenza già valutata resta; per una nuova vale l'obiettivo della società
 * o, senza, 6 come nell'inserimento a mano.
 */
export async function applyImport(tx: Tx, companyId: string, people: OsImportPerson[], dryRun: boolean): Promise<OsImportReport> {
  const existing = await tx.employee.findMany({
    where: { companyId },
    select: { id: true, clientId: true, email: true, externalSource: true, externalId: true, softScores: { select: { skillId: true, atteso: true } } },
  })
  const byTest = new Map(existing.filter((e) => e.externalSource === SOURCE && e.externalId).map((e) => [e.externalId!, e]))
  // Anche chi è già stato importato: con un test più recente il numero cambia, la persona no.
  const byEmail = new Map(existing.filter((e) => e.email).map((e) => [e.email!.toLowerCase(), e]))
  const clientIds = new Set(existing.map((e) => e.clientId))
  const settings = await tx.assessmentSettings.findUnique({ where: { companyId }, select: { softSkillTargets: true } })
  const targets = (settings?.softSkillTargets ?? {}) as Record<string, number>

  const report: OsImportReport = { dryRun, people: people.length, created: 0, updated: 0, withoutEmail: 0, withoutScores: 0, employees: 0, candidates: 0, unmappedSkills: [], fieldsFound: { area: 0, ruolo: 0, livello: 0, ral: 0 } }
  const unmapped = new Set<string>()

  for (const p of people) {
    if (!p.email) report.withoutEmail++
    if (!Object.keys(p.scores).length) report.withoutScores++
    if (/dipendente/i.test(p.profile.tipoCandidatura ?? '')) report.employees++
    else if (/candidatura/i.test(p.profile.tipoCandidatura ?? '')) report.candidates++
    for (const c of p.profile.competenzeNonCollegate) unmapped.add(c.nome)
    if (p.work.area) report.fieldsFound.area++
    if (p.work.ruolo) report.fieldsFound.ruolo++
    if (p.work.livello) report.fieldsFound.livello++
    if (p.work.ral !== null) report.fieldsFound.ral++

    const match = byTest.get(p.testId) ?? (p.email ? byEmail.get(p.email) : undefined)
    if (match) report.updated++
    else report.created++
    if (dryRun) continue

    const external = {
      externalSource: SOURCE,
      externalId: p.testId,
      externalUpdatedAt: p.completedAt,
      birthYear: p.birthYear,
      externalProfile: p.profile as unknown as Prisma.InputJsonValue,
      ...(p.work.area ? { area: p.work.area } : {}),
      ...(p.work.ruolo ? { ruolo: p.work.ruolo } : {}),
      ...(p.work.livello ? { livelloCcnl: p.work.livello } : {}),
      ...(p.work.ral !== null ? { ral: new Prisma.Decimal(p.work.ral) } : {}),
    }
    const oldAtteso = new Map((match?.softScores ?? []).map((s) => [s.skillId, s.atteso]))
    const scoreRows = Object.entries(p.scores).map(([skillId, ottenuto]) => ({ skillId, ottenuto, atteso: oldAtteso.get(skillId) ?? targets[skillId] ?? DEFAULT_ATTESO }))

    let employeeId: string
    if (match) {
      await tx.employee.update({
        where: { id: match.id },
        data: { nome: p.nome, cognome: p.cognome, ...(p.sesso ? { sesso: p.sesso } : {}), ...(!match.email && p.email ? { email: p.email } : {}), ...external },
      })
      employeeId = match.id
      if (scoreRows.length) {
        await tx.employeeSoftScore.deleteMany({ where: { employeeId, skillId: { in: scoreRows.map((s) => s.skillId) } } })
        await tx.employeeSoftScore.createMany({ data: scoreRows.map((s) => ({ employeeId, ...s })) })
      }
    } else {
      let clientId = `os-${p.testId}`.slice(0, 64)
      while (clientIds.has(clientId)) clientId = `${clientId.slice(0, 58)}-${Math.random().toString(36).slice(2, 6)}`
      clientIds.add(clientId)
      const row = await tx.employee.create({
        data: { companyId, clientId, nome: p.nome, cognome: p.cognome, email: p.email || null, sesso: p.sesso, ...external, softScores: { create: scoreRows } },
      })
      employeeId = row.id
    }

    // Lo storico delle trasversali: una voce per test, alla data del test.
    if (scoreRows.length && p.completedAt) {
      const already = await tx.softAssessmentSnapshot.findFirst({ where: { employeeId, source: SOURCE, date: p.completedAt } })
      if (!already) {
        const avg = (xs: number[]) => round2(xs.reduce((a, b) => a + b, 0) / xs.length)
        await tx.softAssessmentSnapshot.create({
          data: { employeeId, date: p.completedAt, source: SOURCE, overallOttenuto: avg(scoreRows.map((s) => s.ottenuto)), overallAtteso: avg(scoreRows.map((s) => s.atteso)) },
        })
      }
    }
  }
  report.unmappedSkills = [...unmapped].sort()
  return report
}
