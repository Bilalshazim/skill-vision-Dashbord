import { ITEMS_5P } from '@/modules/assessment/gestione5p/items'

// Il modulo "Gestione valutazioni" (Foglio 7, Roberto Feliciani): porting del
// file SKILL-VISION_Valutazione_5P.html. Stessa logica di piano, lettura delle
// schede, calcolo e livelli; la logica sta qui, pura, senza React. Lo stato
// resta nel browser (chiave sv5p_state_v1, come nel modello).

export type SourceKey = 'DIR' | 'PEER' | 'AUTO'
export type Person = { id: string; nome: string; ruolo: string; reparto: string; resp: string }
export type PlanItem = { valutatore: string; tipo: SourceKey; valutato: string }
export type Eval5p = {
  id: string
  valutato: string
  tipo: SourceKey
  valutatore: string
  ruolo: string
  data: string
  scores: Record<string, number>
  notes: Record<string, string>
  source: string
}
export type Method = 'fonti' | 'semplice' | 'pesata'
export type Settings = { method: Method; incAuto: boolean; w: Record<SourceKey, number>; peerN: number; peerMin: number; gap: number }
export type State5p = { company: string; people: Person[]; plan: PlanItem[]; evals: Eval5p[]; set: Settings; demo: boolean }

export const PS = [
  { k: 'A', n: 'Professionalità', d: 'Competenze tecniche, conoscenze, strumenti, decisioni' },
  { k: 'B', n: 'Performance', d: 'Obiettivi misurabili, qualità, scadenze, autonomia' },
  { k: 'C', n: 'Predisposizione', d: 'Adattabilità, flessibilità, apprendimento continuo' },
  { k: 'D', n: 'Pensiero', d: 'Coinvolgimento, motivazione, relazioni, contributo' },
  { k: 'E', n: 'Potenziale', d: 'Migliorabilità, feedback, autosviluppo, nuove tecnologie' },
] as const
export const CODES = ITEMS_5P.map((i) => i.cod)
export const SRC: Record<SourceKey, { lab: string; sh: string }> = {
  DIR: { lab: 'Dirigente', sh: 'D' },
  PEER: { lab: 'Peer', sh: 'P' },
  AUTO: { lab: 'Autovalutazione', sh: 'A' },
}
export const SOURCES: SourceKey[] = ['DIR', 'PEER', 'AUTO']
export const STORAGE_KEY = 'sv5p_state_v1'

// ---------- utilità ----------
export const norm = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ')
export const fmt = (v: number | null | undefined) => (v == null || Number.isNaN(v) ? '–' : v.toFixed(2).replace('.', ','))
export const fmt1 = (v: number | null | undefined) => (v == null || Number.isNaN(v) ? '–' : v.toFixed(1).replace('.', ','))
export const mean = (a: (number | null | undefined)[]): number | null => {
  const x = a.filter((v): v is number => v != null && !Number.isNaN(v))
  return x.length ? x.reduce((s, v) => s + v, 0) / x.length : null
}
export const uid = () => Math.random().toString(36).slice(2, 10)
export const today = () => new Date().toISOString().slice(0, 10)
export const slug = (s: string) => String(s || 'azienda').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'azienda'

function num(v: unknown): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number') return v
  const t = String(v).trim().replace(',', '.')
  if (!/^-?\d+(\.\d+)?$/.test(t)) return Number.NaN
  return parseFloat(t)
}

// I cinque livelli del protocollo: sotto 3, 3–5, 5–7, 7–9, 9 e oltre.
export function level(v: number | null | undefined): { t: string; c: 0 | 1 | 2 | 3 | 4 | 5 } {
  if (v == null || Number.isNaN(v)) return { t: '–', c: 0 }
  if (v < 3) return { t: 'Non adeguato', c: 1 }
  if (v < 5) return { t: 'In sviluppo', c: 2 }
  if (v < 7) return { t: 'Adeguato', c: 3 }
  if (v < 9) return { t: 'Avanzato', c: 4 }
  return { t: 'Eccellente', c: 5 }
}

function typeOf(s: unknown): SourceKey | null {
  const t = String(s || '').toUpperCase()
  if (/AUTO/.test(t)) return 'AUTO'
  if (/PEER|COLLEG|PARI/.test(t)) return 'PEER'
  if (/RESPONSAB|DIRIGEN|MANAGER|CAPO|SUPERIOR|DIRETT/.test(t)) return 'DIR'
  return null
}

// ---------- stato ----------
export function blank(): State5p {
  return { company: '', people: [], plan: [], evals: [], set: { method: 'fonti', incAuto: true, w: { DIR: 50, PEER: 30, AUTO: 20 }, peerN: 3, peerMin: 3, gap: 1.5 }, demo: false }
}
export function loadState(): State5p | null {
  try {
    const r = localStorage.getItem(STORAGE_KEY)
    if (r) return { ...blank(), ...(JSON.parse(r) as Partial<State5p>) }
  } catch {
    /* archivio non disponibile */
  }
  return null
}
export function saveState(s: State5p) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    /* archivio non disponibile */
  }
}

export const personByName = (s: State5p, n: string) => s.people.find((p) => norm(p.nome) === norm(n))
function allNames(s: State5p) {
  const m = new Map<string, string>()
  s.people.forEach((p) => m.set(norm(p.nome), p.nome))
  s.evals.forEach((e) => {
    const k = norm(e.valutato)
    if (!m.has(k)) m.set(k, e.valutato)
  })
  return [...m.entries()].map(([k, n]) => ({ k, n }))
}

// ---------- piano ----------
// Ognuno si valuta da sé; il responsabile lo valuta (fonte Dirigente); N colleghi
// dello stesso reparto, a rotazione, escluso il responsabile, lo valutano (Peer).
export function buildPlan(s: State5p): PlanItem[] {
  const N = s.set.peerN
  const plan: PlanItem[] = []
  s.people.forEach((p) => {
    plan.push({ valutatore: p.nome, tipo: 'AUTO', valutato: p.nome })
    if (p.resp) plan.push({ valutatore: p.resp, tipo: 'DIR', valutato: p.nome })
  })
  const reps: Record<string, Person[]> = {}
  s.people.forEach((p) => (reps[p.reparto || '—'] = reps[p.reparto || '—'] || []).push(p))
  Object.values(reps).forEach((list) => {
    const m = list.length
    list.forEach((p, i) => {
      let got = 0
      for (let k = 1; k < m && got < N; k++) {
        const q = list[(i + k) % m]
        if (norm(q.nome) === norm(p.resp)) continue
        plan.push({ valutatore: q.nome, tipo: 'PEER', valutato: p.nome })
        got++
      }
    })
  })
  return plan
}

// ---------- calcolo ----------
export type Result = {
  k: string
  nome: string
  ruolo: string
  reparto: string
  resp: string
  cnt: Record<SourceKey, number>
  ev: Eval5p[]
  src: Record<string, Record<SourceKey, number | null>>
  fin: Record<string, number | null>
  items: Record<string, Record<SourceKey, number | null>>
  inAna: boolean
  score: number | null
  comp: number | null
  pot: number | null
  exp: Record<SourceKey, number> | null
}
const evalP = (e: Eval5p, P: string) => mean(CODES.filter((c) => c[0] === P).map((c) => e.scores[c] ?? null))
function expected(s: State5p, nome: string) {
  if (!s.plan.length) return null
  const k = norm(nome)
  const e: Record<SourceKey, number> = { DIR: 0, PEER: 0, AUTO: 0 }
  s.plan.forEach((x) => {
    if (norm(x.valutato) === k) e[x.tipo]++
  })
  return e
}
export function compute(s: State5p): Result[] {
  const st = s.set
  const byP = new Map<string, Eval5p[]>()
  s.evals.forEach((e) => {
    const k = norm(e.valutato)
    if (!byP.has(k)) byP.set(k, [])
    byP.get(k)!.push(e)
  })
  return allNames(s).map(({ k, n }) => {
    const ev = byP.get(k) || []
    const p = personByName(s, n) || { nome: n, ruolo: '', reparto: '', resp: '' }
    const cnt: Record<SourceKey, number> = { DIR: 0, PEER: 0, AUTO: 0 }
    ev.forEach((e) => cnt[e.tipo]++)
    const r: Result = { k, nome: p.nome, ruolo: p.ruolo || ev.find((e) => e.ruolo)?.ruolo || '', reparto: p.reparto || '', resp: p.resp || '', cnt, ev, src: {}, fin: {}, items: {}, inAna: !!personByName(s, n), score: null, comp: null, pot: null, exp: null }
    PS.forEach(({ k: P }) => {
      const sv = {} as Record<SourceKey, number | null>
      SOURCES.forEach((t) => (sv[t] = mean(ev.filter((e) => e.tipo === t).map((e) => evalP(e, P)))))
      r.src[P] = sv
      const use: SourceKey[] = st.incAuto ? ['DIR', 'PEER', 'AUTO'] : ['DIR', 'PEER']
      let f: number | null
      if (st.method === 'fonti') f = mean(use.map((t) => sv[t]))
      else if (st.method === 'semplice') f = mean(ev.filter((e) => use.includes(e.tipo)).map((e) => evalP(e, P)))
      else {
        let sw = 0
        let sv2 = 0
        use.forEach((t) => {
          if (sv[t] != null) {
            sw += +st.w[t] || 0
            sv2 += (+st.w[t] || 0) * (sv[t] as number)
          }
        })
        f = sw ? sv2 / sw : null
      }
      r.fin[P] = f
    })
    CODES.forEach((c) => {
      const sv = {} as Record<SourceKey, number | null>
      SOURCES.forEach((t) => (sv[t] = mean(ev.filter((e) => e.tipo === t).map((e) => e.scores[c] ?? null))))
      r.items[c] = sv
    })
    r.score = mean(PS.map((x) => r.fin[x.k]))
    r.comp = mean(['A', 'B', 'C', 'D'].map((x) => r.fin[x]))
    r.pot = r.fin.E
    r.exp = expected(s, r.nome)
    return r
  })
}
// Gap di percezione: l'autovalutazione contro la media di Dirigente e Peer.
export function gapOf(s: State5p, r: Result) {
  const others = mean(PS.map((p) => mean([r.src[p.k].DIR, r.src[p.k].PEER])))
  const au = mean(PS.map((p) => r.src[p.k].AUTO))
  if (others == null || au == null) return { d: null as number | null, flag: false }
  const d = au - others
  return { d, flag: Math.abs(d) >= s.set.gap }
}

// ---------- lettura delle schede compilate (Excel / CSV) ----------
type Row = unknown[] | null | undefined
const CODE_RE = /^\s*([A-E])\s*[.-]?\s*([1-5])(?![0-9])/i
const cellStr = (v: unknown) => (v == null ? '' : String(v).trim())
export type Parsed = { e: Eval5p; errs: string[]; missing: number; noNotes: number }

function metaVal(rows: Row[], re: RegExp): string {
  for (const r of rows) {
    if (!r) continue
    for (let j = 0; j < r.length; j++) {
      const s = cellStr(r[j])
      if (re.test(s)) {
        const after = s.split(':').slice(1).join(':').trim()
        if (after && !/^[.…\s]+$/.test(after)) return after
        for (let k = j + 1; k < r.length; k++) {
          const v = cellStr(r[k])
          if (v) return v
        }
        return ''
      }
    }
  }
  return ''
}
function parseFormSheet(name: string, rows: Row[], file: string): Parsed | { skip: true } | null {
  let scol = 5
  let ncol = 6
  for (const r of rows) {
    if (!r) continue
    r.forEach((c, j) => {
      const s = cellStr(c).toUpperCase()
      if (/^SCORE/.test(s)) scol = j
      if (/^NOTE/.test(s)) ncol = j
    })
  }
  const scores: Record<string, number> = {}
  const notes: Record<string, string> = {}
  const errs: string[] = []
  let found = 0
  let filled = 0
  rows.forEach((r) => {
    if (!r) return
    for (let j = 0; j < Math.min(r.length, 4); j++) {
      const s = cellStr(r[j])
      if (/^[A-E][1-5]$/i.test(s)) {
        found++
        const c = s.toUpperCase()
        const v = num(r[scol])
        if (v == null) {
          /* voce senza voto */
        } else if (Number.isNaN(v) || v < 1 || v > 10) errs.push(`${c}: voto non valido "${cellStr(r[scol])}"`)
        else {
          scores[c] = v
          filled++
        }
        const n = cellStr(r[ncol])
        if (n) notes[c] = n
        break
      }
    }
  })
  if (found < 10) return null
  if (!filled) return { skip: true }
  const title = `${cellStr(rows[0] && rows[0].find((x) => x))} ${cellStr(rows[1] && rows[1].find((x) => x))}`
  const tipo = typeOf(metaVal(rows, /^tipo valutazione/i)) || typeOf(name) || typeOf(title)
  const valutato = metaVal(rows, /^dipendente valutato/i)
  let valutatore = metaVal(rows, /^valutatore/i)
  const ruolo = metaVal(rows, /^ruolo/i)
  const data = metaVal(rows, /^data\s*:/i)
  if (tipo === 'AUTO' && !valutatore) valutatore = valutato
  const e = { id: uid(), valutato, tipo: tipo as SourceKey, valutatore, ruolo, data, scores, notes, source: `${file} › ${name}` }
  if (!valutato) errs.unshift('manca il nome del dipendente valutato')
  if (!tipo) errs.unshift('tipo di valutazione non riconosciuto')
  return { e, errs, missing: 25 - filled, noNotes: Object.keys(scores).filter((c) => !notes[c]).length }
}
function parseFlatSheet(name: string, rows: Row[], file: string): Parsed[] | null {
  let h = -1
  let map: Record<string, number> = {}
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const r = rows[i] || []
    const m: Record<string, number> = {}
    r.forEach((c, j) => {
      const s = cellStr(c)
      const x = s.match(CODE_RE)
      if (x && !/nota|note|esempio/i.test(s.slice(3))) {
        const k = (x[1] + x[2]).toUpperCase()
        if (!(k in m)) m[k] = j
      }
    })
    if (Object.keys(m).length >= 15) {
      h = i
      map = m
      break
    }
  }
  if (h < 0) return null
  const hd = (rows[h] || []).map(cellStr)
  const find = (re: RegExp) => hd.findIndex((s) => re.test(s))
  const cV = find(/valutat[oa]\b|dipendente|persona valutata|chi stai valutando/i)
  const cT = find(/tipo|fonte|relazione|ruolo del valutatore|in qualit/i)
  let cR = find(/^valutatore|compilat|tuo nome|nome e cognome|^nome$/i)
  const cD = find(/^data|ora di completamento|timestamp|informazioni cronologiche/i)
  if (cR === cV) cR = -1
  const noteCols: Record<string, number> = {}
  hd.forEach((s, j) => {
    const x = s.match(CODE_RE)
    if (x && /nota|note|esempio/i.test(s)) noteCols[(x[1] + x[2]).toUpperCase()] = j
  })
  const cN = hd.findIndex((s) => /^note/i.test(s))
  const res: Parsed[] = []
  for (let i = h + 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r || !r.some((c) => cellStr(c))) continue
    const scores: Record<string, number> = {}
    const notes: Record<string, string> = {}
    const errs: string[] = []
    let filled = 0
    for (const [c, j] of Object.entries(map)) {
      const v = num(r[j])
      if (v == null) continue
      if (Number.isNaN(v) || v < 1 || v > 10) {
        errs.push(`${c}: voto non valido "${cellStr(r[j])}"`)
        continue
      }
      scores[c] = v
      filled++
    }
    for (const [c, j] of Object.entries(noteCols)) {
      const n = cellStr(r[j])
      if (n) notes[c] = n
    }
    if (cN >= 0 && cellStr(r[cN])) notes.GEN = cellStr(r[cN])
    if (!filled) continue
    const valutato = cV >= 0 ? cellStr(r[cV]) : ''
    const tipo = cT >= 0 ? typeOf(r[cT]) : null
    let valutatore = cR >= 0 ? cellStr(r[cR]) : ''
    if (tipo === 'AUTO' && !valutatore) valutatore = valutato
    const e = { id: uid(), valutato, tipo: tipo as SourceKey, valutatore, ruolo: '', data: cD >= 0 ? cellStr(r[cD]) : '', scores, notes, source: `${file} › ${name} riga ${i + 1}` }
    if (!valutato) errs.unshift('manca il nome del valutato')
    if (!tipo) errs.unshift('tipo di valutazione non riconosciuto')
    res.push({ e, errs, missing: 25 - filled, noNotes: 0 })
  }
  return res
}
type XlsxMod = typeof import('xlsx')
export function parseWorkbook(XLSX: XlsxMod, wb: import('xlsx').WorkBook, file: string): Parsed[] {
  const out: Parsed[] = []
  wb.SheetNames.forEach((n) => {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: null, blankrows: true }) as Row[]
    const flat = parseFlatSheet(n, rows, file)
    if (flat) {
      out.push(...flat)
      return
    }
    const f = parseFormSheet(n, rows, file)
    if (f && !('skip' in f)) out.push(f)
  })
  return out
}
export function parseAnagrafica(XLSX: XlsxMod, wb: import('xlsx').WorkBook): Person[] {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' }) as unknown[][]
  let h = rows.findIndex((r) => r.some((c) => /nome|nominativo|dipendente/i.test(cellStr(c))))
  if (h < 0) h = 0
  const hd = (rows[h] || []).map(cellStr)
  const fi = (re: RegExp) => hd.findIndex((s) => re.test(s))
  const cN = fi(/^(nome e cognome|nominativo|dipendente|nome|cognome e nome)/i)
  const cC = fi(/^cognome$/i)
  const cR = fi(/ruolo|mansione|qualifica/i)
  const cP = fi(/reparto|area|funzione|ufficio|team/i)
  const cS = fi(/responsabile|manager|capo|dirigente|superiore/i)
  const list: Person[] = []
  rows.slice(h + 1).forEach((r) => {
    let n = cellStr(r[cN >= 0 ? cN : 0])
    if (cC >= 0 && cC !== cN && cellStr(r[cC])) n = `${n} ${cellStr(r[cC])}`
    if (!n) return
    list.push({ id: uid(), nome: n, ruolo: cR >= 0 ? cellStr(r[cR]) : '', reparto: cP >= 0 ? cellStr(r[cP]) : '', resp: cS >= 0 ? cellStr(r[cS]) : '' })
  })
  return list
}

// ---------- dati di esempio ----------
export function demoState(): State5p {
  const s = blank()
  s.demo = true
  s.company = 'Esempio Meccanica S.r.l.'
  const P: [string, string, string, string][] = [
    ['Laura Bianchi', 'Direttrice di stabilimento', 'Direzione', ''],
    ['Marco Ferri', 'Responsabile produzione', 'Produzione', 'Laura Bianchi'],
    ['Giulia Neri', 'Operatrice CNC', 'Produzione', 'Marco Ferri'],
    ['Paolo Conti', 'Manutentore', 'Produzione', 'Marco Ferri'],
    ['Sara Gallo', 'Addetta qualità', 'Produzione', 'Marco Ferri'],
    ['Luca Moretti', 'Operatore linea', 'Produzione', 'Marco Ferri'],
    ['Elena Rizzi', 'Responsabile amministrazione', 'Amministrazione', 'Laura Bianchi'],
    ['Davide Costa', 'Contabile', 'Amministrazione', 'Elena Rizzi'],
    ['Chiara Fontana', 'Addetta paghe', 'Amministrazione', 'Elena Rizzi'],
    ['Andrea Greco', 'Impiegato acquisti', 'Amministrazione', 'Elena Rizzi'],
  ]
  s.people = P.map((p) => ({ id: uid(), nome: p[0], ruolo: p[1], reparto: p[2], resp: p[3] }))
  s.plan = buildPlan(s)
  let seed = 7
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280
  const base: Record<string, number[]> = { 'Giulia Neri': [7.5, 8, 6.5, 7, 8], 'Paolo Conti': [8, 7, 5, 6, 4.5], 'Sara Gallo': [6, 6.5, 7, 7.5, 8], 'Luca Moretti': [4.5, 5, 4, 5, 4], 'Marco Ferri': [7, 7.5, 6, 6.5, 6], 'Davide Costa': [7, 8, 6, 6, 5.5], 'Chiara Fontana': [6.5, 7, 7, 8, 7.5], 'Andrea Greco': [5, 5.5, 6, 5, 6.5], 'Elena Rizzi': [8, 8, 7, 7.5, 7] }
  const bias: Record<SourceKey, number> = { DIR: -0.3, PEER: 0, AUTO: 1 }
  s.plan.forEach((x, i) => {
    const b = base[x.valutato]
    if (!b) return
    if (i % 11 === 5) return
    const scores: Record<string, number> = {}
    const notes: Record<string, string> = {}
    CODES.forEach((c) => {
      const pi = 'ABCDE'.indexOf(c[0])
      const v = b[pi] + bias[x.tipo] * (x.valutato === 'Luca Moretti' && x.tipo === 'AUTO' ? 2 : 1) + (rnd() - 0.5) * 2.2
      scores[c] = Math.max(1, Math.min(10, Math.round(v)))
    })
    if (x.tipo === 'DIR') {
      notes.B1 = 'Ha rispettato tutte le consegne del trimestre'
      notes.E5 = 'Va definito un piano di crescita scritto'
    }
    if (x.tipo === 'PEER' && i % 3 === 0) notes.D5 = "Disponibile quando c'è da coprire un turno"
    s.evals.push({ id: uid(), valutato: x.valutato, tipo: x.tipo, valutatore: x.valutatore, ruolo: '', data: today(), scores, notes, source: 'esempio' })
  })
  return s
}
