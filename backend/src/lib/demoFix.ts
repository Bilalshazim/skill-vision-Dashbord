import type { Prisma, PrismaClient } from '@prisma/client'

import { env } from './env.js'
import { logger } from './logger.js'

// La correzione dei dati dimostrativi di Acme sul server, all'avvio del backend (Section A del
// 2026-11-12). Il 12/11 in produzione la correzione fatta dal browser non è partita: il browser
// riconosce la società demo solo da `VITE_DEMO_COMPANY_IDS`, che nella build di produzione è vuota
// (il distintivo «Dati dimostrativi» dipende solo da `VITE_DEMO_MODE`). Per lo stesso motivo il
// bilancio dimostrativo non si è mai caricato in produzione. Qui non dipende dal browser.
//
// Quali società: quelle di ASSESSMENT_DEMO_COMPANY_IDS (la lista del «Reset demo»), più «Acme Corp»
// se porta ancora l'impronta dei dati dimostrativi (email @democompany.com o «Demo Company S.r.l.»
// nell'Intervista). Una società vera non ha né l'una né l'altra cosa e non è nella lista.
//
// Cosa cambia, e solo quello: il sesso delle persone con un nome dell'elenco demo, il dominio delle
// email (persone, contatti, ruoli chiave, dati dell'azienda), «Demo Company S.r.l.» → «Acme Corp»
// nell'Intervista, e il bilancio dimostrativo se la società non ne ha uno. Punteggi, RAL, valutazioni
// e il resto non si toccano. Ogni passo è idempotente: al riavvio successivo non trova niente da fare.

const OLD_DOMAIN = '@democompany.com'
const NEW_DOMAIN = '@acme.example'
const OLD_NAME = 'Demo Company S.r.l.'
const DEMO_NAME = 'Acme Corp'
const DEMO_FILE = 'Bilancio dimostrativo (cifre inventate)'

// Gli stessi nomi del generatore dei dati demo (frontend, modules/assessment/lib/demo-data.ts).
const DEMO_NOMI = ['Marco', 'Giulia', 'Alessandro', 'Francesca', 'Andrea', 'Chiara', 'Matteo', 'Sara', 'Davide', 'Elena', 'Luca', 'Valentina', 'Simone', 'Martina', 'Federico', 'Alessia', 'Riccardo', 'Silvia', 'Giovanni', 'Laura', 'Stefano', 'Elisa', 'Nicola', 'Federica', 'Antonio', 'Ilaria']
const DEMO_FEMALE = new Set(['Giulia', 'Francesca', 'Chiara', 'Sara', 'Elena', 'Valentina', 'Martina', 'Alessia', 'Silvia', 'Laura', 'Elisa', 'Federica', 'Ilaria'])
export const demoGenderOf = (nome: string): 'F' | 'M' | null => (DEMO_NOMI.includes(nome) ? (DEMO_FEMALE.has(nome) ? 'F' : 'M') : null)

// Il bilancio dimostrativo: lo stesso del frontend (modules/assessment/lib/demo-roi.ts), cifre inventate.
const DEMO_STATEMENT = { ric: 9400000, vdp: 9650000, costiProd: 8700000, cp: 2100000, sal: 1520000, amm: 310000, acc: 40000, ebit: 950000, ebitda: 1300000, un: 610000, ante: 870000, imposte: 260000 }
const DEMO_MANUAL = { inv: 18000, turn: 6, ass: 4.5 }

export const fixMail = (v: unknown): unknown => (typeof v === 'string' && v.toLowerCase().endsWith(OLD_DOMAIN) ? v.slice(0, -OLD_DOMAIN.length) + NEW_DOMAIN : v)

/** Le email dentro un oggetto o un elenco di oggetti JSON (contatti, ruoli chiave, dati dell'azienda). */
function fixMailsIn(json: Prisma.JsonValue): { value: Prisma.JsonValue; changed: boolean } {
  let changed = false
  const walk = (v: Prisma.JsonValue): Prisma.JsonValue => {
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') {
      return Object.fromEntries(
        Object.entries(v).map(([k, x]) => {
          const fixed = fixMail(x)
          if (fixed !== x) changed = true
          return [k, fixed !== x ? (fixed as Prisma.JsonValue) : walk(x as Prisma.JsonValue)]
        }),
      )
    }
    return v
  }
  return { value: walk(json), changed }
}

async function demoCompanyIds(prisma: PrismaClient): Promise<string[]> {
  const ids = new Set(env.assessmentDemoCompanyIds)
  const acme = await prisma.company.findMany({ where: { name: DEMO_NAME }, select: { id: true } })
  for (const { id } of acme) {
    if (ids.has(id)) continue
    const marked =
      (await prisma.employee.count({ where: { companyId: id, email: { endsWith: OLD_DOMAIN, mode: 'insensitive' } } })) > 0 ||
      (await prisma.executiveInterview.count({ where: { companyId: id, data: { path: ['azienda'], equals: OLD_NAME } } })) > 0
    if (marked) ids.add(id)
  }
  return [...ids]
}

export async function fixDemoCompanies(prisma: PrismaClient): Promise<void> {
  const ids = await demoCompanyIds(prisma)
  if (!ids.length) {
    logger.info('demoFix: nessuna società demo (ASSESSMENT_DEMO_COMPANY_IDS vuota e nessuna Acme Corp con dati demo)')
    return
  }
  for (const companyId of ids) {
    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true } })
    if (!company) continue
    const report = await prisma.$transaction(async (tx) => {
      const r = { persone: 0, email: 0, sesso: 0, intervista: false, contatti: false, bilancio: false }
      const employees = await tx.employee.findMany({ where: { companyId }, select: { id: true, nome: true, sesso: true, email: true } })
      for (const e of employees) {
        const sesso = demoGenderOf(e.nome)
        const email = fixMail(e.email) as string | null
        const data: Prisma.EmployeeUpdateInput = {}
        if (sesso && e.sesso !== sesso) {
          data.sesso = sesso
          r.sesso++
        }
        if (email !== e.email) {
          data.email = email
          r.email++
        }
        if (Object.keys(data).length) {
          await tx.employee.update({ where: { id: e.id }, data })
          r.persone++
        }
      }
      const iv = await tx.executiveInterview.findUnique({ where: { companyId } })
      const ivData = iv?.data as Record<string, unknown> | undefined
      if (iv && ivData && ivData.azienda === OLD_NAME) {
        await tx.executiveInterview.update({ where: { companyId }, data: { data: { ...ivData, azienda: company.name } as Prisma.InputJsonValue } })
        r.intervista = true
      }
      const prof = await tx.assessmentCompanyProfile.findUnique({ where: { companyId } })
      if (prof) {
        const parts = { contacts: fixMailsIn(prof.contacts), referente: fixMailsIn(prof.referente), ceo: fixMailsIn(prof.ceo), cfo: fixMailsIn(prof.cfo), details: fixMailsIn(prof.details) }
        if (Object.values(parts).some((x) => x.changed)) {
          await tx.assessmentCompanyProfile.update({
            where: { companyId },
            data: Object.fromEntries(Object.entries(parts).map(([k, x]) => [k, x.value as Prisma.InputJsonValue])),
          })
          r.contatti = true
        }
      }
      const roi = await tx.assessmentRoi.findUnique({ where: { companyId } })
      const roiData = (roi?.data ?? {}) as Record<string, unknown>
      const statement = roiData.statement as Record<string, unknown> | undefined
      if (!statement || !Object.keys(statement).length) {
        // I valori a mano già salvati (durata, compenso, turnover, assenze) restano; mancano, quelli demo.
        const data = { months: 12, ...DEMO_MANUAL, ...roiData, statement: DEMO_STATEMENT, fileName: DEMO_FILE, loadedAt: new Date().toISOString() } as Prisma.InputJsonValue
        await tx.assessmentRoi.upsert({ where: { companyId }, create: { companyId, data }, update: { data } })
        r.bilancio = true
      }
      return r
    })
    logger.info({ companyId, company: company.name, ...report }, 'demoFix: società demo controllata')
  }
}
