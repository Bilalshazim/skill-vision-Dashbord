import type { AssessmentState, Employee, RoleProfile } from '@/modules/assessment/lib/types'

// L'importazione dell'anagrafica da Excel (Decisioni di Roberto del 2026-11-12), senza interfaccia:
// lettura delle righe, controlli, confronto con le persone già presenti e il piano di quello che
// entra. L'interfaccia sta in components/AnagraficaImport.tsx, il salvataggio sul server è uno solo
// (POST …/employees/import, tutto o niente).
//
// LE COLONNE: è l'unico punto da cambiare quando arriva il modello di Roberto. Ogni campo ha il nome
// della colonna nel modello (`header`) e gli altri nomi che si accettano (`aliases`). Finché il
// modello non c'è, le colonne seguono i campi dell'Anagrafica, con le loro etichette a schermo.

export type ImportField = 'nome' | 'cognome' | 'email' | 'sesso' | 'area' | 'reparto' | 'ruolo' | 'mansione' | 'tipoContratto' | 'livelloCcnl' | 'ral' | 'benefit'

export const IMPORT_COLUMNS: { field: ImportField; header: string; aliases: string[]; required?: boolean; hint: string }[] = [
  { field: 'nome', header: 'Nome', aliases: [], required: true, hint: 'Obbligatorio.' },
  { field: 'cognome', header: 'Cognome', aliases: [], required: true, hint: 'Obbligatorio.' },
  { field: 'email', header: 'Email aziendale', aliases: ['Email', 'E-mail', 'Mail'], hint: 'Facoltativa. Se c’è, riconosce la persona già presente.' },
  { field: 'sesso', header: 'Sesso', aliases: ['Genere'], hint: 'M o F (anche Maschile / Femminile).' },
  { field: 'area', header: 'Area', aliases: [], hint: 'Facoltativa.' },
  { field: 'reparto', header: 'Reparto', aliases: [], hint: 'Facoltativo.' },
  { field: 'ruolo', header: 'Mansione', aliases: ['Ruolo'], required: true, hint: 'Obbligatoria. Una mansione nuova si aggiunge da sola.' },
  { field: 'mansione', header: 'Attività svolte', aliases: ['Descrizione mansione', 'Attività'], hint: 'Facoltative.' },
  { field: 'tipoContratto', header: 'Tipo rapporto', aliases: ['Tipo contratto', 'Contratto'], hint: 'Dipendente, Co.co.co., Partita IVA o Esterno. Vuoto: Dipendente.' },
  { field: 'livelloCcnl', header: 'Livello CCNL', aliases: ['Livello'], hint: 'Facoltativo.' },
  { field: 'ral', header: 'RAL lorda annua', aliases: ['RAL'], hint: 'In euro, senza decimali. La importano solo gli amministratori.' },
  { field: 'benefit', header: 'Benefit riconosciuti', aliases: ['Benefit'], hint: 'Facoltativi.' },
]

const norm = (s: unknown) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
const CONTRACTS: Record<string, Employee['tipoContratto']> = {
  dipendente: 'dipendente',
  dipendenti: 'dipendente',
  'dipendenti (forza lavoro)': 'dipendente',
  'co.co.co.': 'cocopro',
  cococo: 'cocopro',
  'co.co.co': 'cocopro',
  cocopro: 'cocopro',
  'co.co.pro.': 'cocopro',
  'partita iva': 'partitaIva',
  'p.iva': 'partitaIva',
  piva: 'partitaIva',
  esterno: 'esterno',
  esterni: 'esterno',
  'esterni / outsourcing': 'esterno',
  outsourcing: 'esterno',
}
const GENDERS: Record<string, 'M' | 'F'> = { m: 'M', maschile: 'M', maschio: 'M', uomo: 'M', f: 'F', femminile: 'F', femmina: 'F', donna: 'F' }

export type RowError = { row: number; field: string; problem: string }
export type ImportRow = { row: number; values: Partial<Record<ImportField, string>> }
export type ImportPlan = {
  /** Le colonne del modello che nel file mancano; se manca una obbligatoria non si va avanti. */
  missingColumns: string[]
  /** Le colonne del file che non corrispondono a un campo: si ignorano, e l'anteprima lo dice. */
  unknownColumns: string[]
  errors: RowError[]
  creates: Employee[]
  updates: { before: Employee; after: Employee }[]
  /** Senza email, stesso nome, cognome e mansione di una persona presente: non si aggiorna e non si aggiunge. */
  duplicates: { row: number; name: string; existing: Employee }[]
  /** Le mansioni nuove che servono alle persone nuove: entrano con loro. */
  roleProfiles: { roleName: string; profile: RoleProfile }[]
  /** La RAL nel file ma chi importa non la può scrivere: si ignora. */
  ralIgnored: boolean
  total: number
}

/** Dalle righe del foglio (la prima è l'intestazione) alle righe con i campi. */
export function readSheet(rows: unknown[][]): { rows: ImportRow[]; missingColumns: string[]; unknownColumns: string[] } {
  const headerIdx = rows.findIndex((r) => r.some((c) => norm(c)))
  if (headerIdx < 0) return { rows: [], missingColumns: IMPORT_COLUMNS.filter((c) => c.required).map((c) => c.header), unknownColumns: [] }
  const header = rows[headerIdx].map(norm)
  const colOf = new Map<ImportField, number>()
  for (const c of IMPORT_COLUMNS) {
    const names = [c.header, ...c.aliases].map(norm)
    const i = header.findIndex((h) => names.includes(h))
    if (i >= 0) colOf.set(c.field, i)
  }
  const known = new Set(colOf.values())
  const unknownColumns = rows[headerIdx].flatMap((h, i) => (norm(h) && !known.has(i) ? [String(h).trim()] : []))
  const missingColumns = IMPORT_COLUMNS.filter((c) => !colOf.has(c.field)).map((c) => c.header)
  const out: ImportRow[] = []
  rows.slice(headerIdx + 1).forEach((r, k) => {
    if (!r.some((c) => norm(c))) return
    const values: Partial<Record<ImportField, string>> = {}
    for (const [field, i] of colOf) values[field] = String(r[i] ?? '').trim()
    out.push({ row: headerIdx + k + 2, values })
  })
  return { rows: out, missingColumns, unknownColumns }
}

/**
 * Il piano dell'importazione: niente si scrive qui. Le persone presenti si riconoscono per email; senza
 * email, nome + cognome + mansione danno un «probabile doppione», che non si aggiorna da solo. Una
 * persona trovata si aggiorna nei campi del file e tiene valutazioni e storico; una non trovata si
 * aggiunge. Chi non è nel file resta com'è (nessuna archiviazione).
 */
export type CreateEmployee = (draft: AssessmentState, fields: Partial<Employee> & Pick<Employee, 'nome' | 'cognome'>) => Employee

/** `create`: chi crea la persona nuova sul modello del resto dell'app (addNewEmployee), passato da fuori così il modulo si prova da solo. */
export function planImport(state: AssessmentState, sheet: ReturnType<typeof readSheet>, canWriteRal: boolean, create: CreateEmployee): ImportPlan {
  const errors: RowError[] = []
  const requiredMissing = IMPORT_COLUMNS.filter((c) => c.required && sheet.missingColumns.includes(c.header))
  const plan: ImportPlan = { missingColumns: sheet.missingColumns, unknownColumns: sheet.unknownColumns, errors, creates: [], updates: [], duplicates: [], roleProfiles: [], ralIgnored: false, total: sheet.rows.length }
  if (requiredMissing.length) {
    requiredMissing.forEach((c) => errors.push({ row: 1, field: c.header, problem: 'La colonna manca nel file: usa il modello.' }))
    return plan
  }
  const byEmail = new Map(state.employees.filter((e) => e.email).map((e) => [norm(e.email), e]))
  const byName = (r: ImportRow['values']) => state.employees.find((e) => norm(e.nome) === norm(r.nome) && norm(e.cognome) === norm(r.cognome) && norm(e.ruolo) === norm(r.ruolo))
  const seenEmails = new Map<string, number>()
  const draft = structuredClone(state)
  const newRoles = new Set<string>()
  const header = (f: ImportField) => IMPORT_COLUMNS.find((c) => c.field === f)!.header

  for (const { row, values: v } of sheet.rows) {
    const rowErrors: RowError[] = []
    const err = (f: ImportField, problem: string) => rowErrors.push({ row, field: header(f), problem })
    if (!v.nome) err('nome', 'Manca il nome.')
    if (!v.cognome) err('cognome', 'Manca il cognome.')
    if (!v.ruolo) err('ruolo', 'Manca la mansione.')
    const email = (v.email ?? '').trim()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) err('email', `«${email}» non è un indirizzo email.`)
    if (email) {
      const prev = seenEmails.get(norm(email))
      if (prev) err('email', `La stessa email è già alla riga ${prev}.`)
      else seenEmails.set(norm(email), row)
    }
    const sesso = v.sesso ? GENDERS[norm(v.sesso)] : ''
    if (v.sesso && !sesso) err('sesso', `«${v.sesso}»: scrivi M o F.`)
    const contratto = v.tipoContratto ? CONTRACTS[norm(v.tipoContratto)] : 'dipendente'
    if (v.tipoContratto && !contratto) err('tipoContratto', `«${v.tipoContratto}»: scrivi Dipendente, Co.co.co., Partita IVA o Esterno.`)
    let ral: number | undefined
    if (v.ral) {
      const n = Number(v.ral.replace(/[€\s.]/g, '').replace(',', '.'))
      if (!Number.isFinite(n) || n < 0) err('ral', `«${v.ral}» non è un importo.`)
      else if (canWriteRal) ral = Math.round(n)
      else plan.ralIgnored = true
    }
    if (rowErrors.length) {
      errors.push(...rowErrors)
      continue
    }
    const fields = {
      nome: v.nome!,
      cognome: v.cognome!,
      ...(v.email !== undefined ? { email } : {}),
      ...(v.sesso !== undefined ? { sesso: sesso || '' } : {}),
      ...(v.area ? { area: v.area } : {}),
      ...(v.reparto !== undefined ? { reparto: v.reparto } : {}),
      ruolo: v.ruolo!,
      ...(v.mansione !== undefined ? { mansione: v.mansione } : {}),
      ...(v.tipoContratto !== undefined ? { tipoContratto: contratto as Employee['tipoContratto'] } : {}),
      ...(v.livelloCcnl !== undefined ? { livelloCcnl: v.livelloCcnl } : {}),
      ...(ral !== undefined ? { ral } : {}),
      ...(v.benefit !== undefined ? { benefit: v.benefit } : {}),
    }
    const found = email ? byEmail.get(norm(email)) : undefined
    if (found) {
      plan.updates.push({ before: found, after: { ...found, ...fields } })
      continue
    }
    if (!email) {
      const same = byName(v)
      if (same) {
        plan.duplicates.push({ row, name: `${v.nome} ${v.cognome}`, existing: same })
        continue
      }
    }
    if (!draft.roleProfiles[fields.ruolo]) newRoles.add(fields.ruolo)
    plan.creates.push(create(draft, { ...fields, ral: ral ?? (canWriteRal ? 0 : null), area: fields.area || 'Unassigned' }))
  }
  plan.roleProfiles = [...newRoles].map((roleName) => ({ roleName, profile: draft.roleProfiles[roleName] }))
  return plan
}

/** Il modello vuoto, finché non arriva quello di Roberto: le colonne di IMPORT_COLUMNS e un foglio di istruzioni. */
export async function buildTemplate(): Promise<Blob> {
  const X = await import('xlsx')
  const wb = X.utils.book_new()
  X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([IMPORT_COLUMNS.map((c) => c.header)]), 'Anagrafica')
  X.utils.book_append_sheet(
    wb,
    X.utils.aoa_to_sheet([['Colonna', 'Obbligatoria', 'Come si compila'], ...IMPORT_COLUMNS.map((c) => [c.header, c.required ? 'Sì' : 'No', c.hint])]),
    'Istruzioni',
  )
  const out = X.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
