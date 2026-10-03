// Traduzione della risposta ExportData nel formato dell'anteprima (§3.2).
// L'API restituisce tutto come stringa; qui si convertono i numeri, si tolgono
// gli spazi dai nomi, si scartano le voci ripetute nella stessa persona e,
// soprattutto, le righe di un codAzienda non richiesto: l'API restituisce
// SEMPRE anche le righe dell'account API (authCompany), qualunque codice si
// chieda, e non devono finire nella vista di nessuno.
//
// Minimizzazione: sesso, anno di nascita, luogo, email, RAL, date di
// assunzione/dimissioni e titolo di studio non escono dal server.

import { z } from 'zod'

const str = z.union([z.string(), z.number()]).transform((v) => String(v).trim()).catch('')
const rawComp = z.object({ nome: str, punteggio: str }).passthrough()
const rawRoleComp = z.object({ nome: str, punteggio: str, 'valore atteso': str, diff: str }).passthrough()
const rawRow = z
  .object({
    Nome: str,
    Cognome: str,
    codAzienda: str,
    'numero intervista': str,
    'ultima modifica': str,
    sede: str,
    risultato: str,
    competenze: z.array(rawComp).catch([]),
    'competenze ruolo': z.array(rawRoleComp).catch([]),
  })
  .passthrough()

export type OsCompetency = { name: string; score: number | null }
export type OsRoleCompetency = OsCompetency & { expected: number | null; diff: number | null }
export type OsPerson = {
  interviewId: string
  firstName: string
  lastName: string
  companyKey: string
  site: string
  updatedAt: string | null
  result: number | null
  competencies: OsCompetency[]
  roleCompetencies: OsRoleCompetency[]
}
export type OsNormalized = { people: OsPerson[]; discardedRows: number; invalidRows: number; duplicateEntries: number }

const num = (s: string): number | null => {
  if (!s) return null
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
// "2026-09-30 10:12:44.0" → ISO, senza assumere un fuso che l'API non dichiara.
const when = (s: string): string | null => (/^\d{4}-\d{2}-\d{2}/.test(s) ? s.replace(' ', 'T').replace(/\.\d+$/, '') : null)

function dedupe<T extends { name: string }>(list: T[]): { items: T[]; dropped: number } {
  const seen = new Set<string>()
  const items: T[] = []
  for (const c of list) {
    if (!c.name || seen.has(c.name)) continue
    seen.add(c.name)
    items.push(c)
  }
  return { items, dropped: list.length - items.length }
}

export function normalizeExport(body: unknown, companies: { key: string; code: string }[]): OsNormalized {
  const keyByCode = new Map(companies.map((c) => [c.code, c.key]))
  const rows = Array.isArray(body) ? body : []
  const people: OsPerson[] = []
  let discardedRows = 0
  let invalidRows = 0
  let duplicateEntries = 0
  for (const raw of rows) {
    const parsed = rawRow.safeParse(raw)
    if (!parsed.success) {
      invalidRows++
      continue
    }
    const r = parsed.data
    const companyKey = keyByCode.get(r.codAzienda)
    if (!companyKey) {
      discardedRows++
      continue
    }
    const comp = dedupe(r.competenze.map((c) => ({ name: c.nome, score: num(c.punteggio) })))
    const role = dedupe(
      r['competenze ruolo'].map((c) => ({ name: c.nome, score: num(c.punteggio), expected: num(c['valore atteso']), diff: num(c.diff) })),
    )
    duplicateEntries += comp.dropped + role.dropped
    people.push({
      interviewId: r['numero intervista'],
      firstName: r.Nome,
      lastName: r.Cognome,
      companyKey,
      site: r.sede,
      updatedAt: when(r['ultima modifica']),
      result: num(r.risultato),
      competencies: comp.items,
      roleCompetencies: role.items,
    })
  }
  people.sort((a, b) => (b.result ?? -Infinity) - (a.result ?? -Infinity) || a.lastName.localeCompare(b.lastName, 'it'))
  return { people, discardedRows, invalidRows, duplicateEntries }
}
