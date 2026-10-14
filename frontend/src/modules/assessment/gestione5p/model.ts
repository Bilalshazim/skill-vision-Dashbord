import { ITEMS_5P } from '@/modules/assessment/gestione5p/items'

// Valutazione 5P Multi-Fonte (modello "VALUTAZONI 5P", versione 5, Roberto
// Feliciani, 2026-10-12): porting della logica del file HTML del cliente. Il
// processo segue sette pagine — Piano, Invio schede, Raccolta, Valori attesi,
// Risultati, Report persona, Metodo. Il piano non si costruisce più dal
// responsabile in anagrafica: si importa da un Excel a quattro fogli (ELENCO
// NOMINATIVI, VALUTATORI DIRIGENTI, VALUTATORI PEER, AUTOVALUTAZIONI, più
// VALORI ATTESI facoltativo), con i nomi corretti e un controllo del piano.
// La logica sta qui, pura, senza React. Lo stato resta nel browser.

export type SourceKey = 'DIR' | 'PEER' | 'AUTO'
export type Person = { id: string; cog: string; nom: string; email: string; gruppo: string; mans: string; roles: { dir: boolean; peer: boolean }; auto: boolean }
export type PlanItem = { valutatore: string; tipo: SourceKey; valutato: string }
export type Eval5p = {
  id: string
  valutato: string
  tipo: SourceKey
  valutatore: string
  ruolo?: string
  data: string
  scores: Record<string, number>
  notes: Record<string, string>
  /** Voci segnate «Non so valutare»: non entrano nella media. */
  no?: string[]
  source: string
}
export type Mail = { emailHR: string; scad: string; subj: string; body: string }
// Valori attesi: il livello richiesto per ogni voce, su scala 1–10. `base` vale per tutti,
// `groups` (per area/gruppo) lo sostituisce dove è diverso. Non compaiono nelle schede dei valutatori.
export type Targets = { base: Record<string, number>; groups: Record<string, Record<string, number>> }
export type LogEntry = { sheet: string; cell: string; raw: string; res?: string; note?: string; ev?: string; tipo?: SourceKey; cand?: string[]; confirmed?: boolean }
export type PlanLog = { file: string; date: string; auto: LogEntry[]; verify: LogEntry[]; unknown: LogEntry[]; ignored: LogEntry[]; fixed: LogEntry[]; merged: LogEntry[]; added: LogEntry[]; expected?: number }
export type ResMode = 'voto' | 'gap' | 'auto'
export type State5p = {
  v: 5
  company: string
  people: Person[]
  plan: PlanItem[]
  evals: Eval5p[]
  log: PlanLog | null
  /** Valutatore (chiave normalizzata) → data in cui la scheda è stata segnata come inviata. */
  sent: Record<string, string>
  mail: Mail
  exp: Targets
  set: { mode: ResMode; rep: string }
  pianoId: string
  demo: boolean
}

export const PS = [
  { k: 'A', n: 'Professionalità', d: 'Competenze tecniche, conoscenze, strumenti, decisioni' },
  { k: 'B', n: 'Performance', d: 'Obiettivi misurabili, qualità, scadenze, autonomia' },
  { k: 'C', n: 'Predisposizione', d: 'Adattabilità, flessibilità, apprendimento continuo' },
  { k: 'D', n: 'Pensiero', d: 'Coinvolgimento, motivazione, relazioni, contributo' },
  { k: 'E', n: 'Potenziale', d: 'Migliorabilità, feedback, autosviluppo, nuove tecnologie' },
] as const
export const CODES = ITEMS_5P.map((i) => i.cod)
export const ITEM_NAME: Record<string, string> = Object.fromEntries(ITEMS_5P.map((i) => [i.cod, i.area]))
export const SRC: Record<SourceKey, { lab: string; as: string; sh: string }> = {
  DIR: { lab: 'Dirigente', as: 'come dirigente', sh: 'D' },
  PEER: { lab: 'Collega', as: 'come collega', sh: 'P' },
  AUTO: { lab: 'Autovalutazione', as: 'sé stesso', sh: 'A' },
}
export const STORAGE_KEY = 'sv5p_state_v1'
/** Sotto questo numero di colleghi la loro media è riconoscibile. */
export const PEER_MIN = 3
/** Soglia in punti 0–100 per lo skill gap («da sviluppare» da −10) e per la percezione (allineata entro ±9). */
export const THR = 10
/** Più di queste schede per valutatore: carico da segnalare. */
export const HEAVY_LOAD = 12

// ---------- utilità ----------
export const toks = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
export const norm = (s: unknown) => toks(s).sort().join(' ')
export const same = (a: unknown, b: unknown) => norm(a) === norm(b)
export const mean = (a: (number | null | undefined)[]): number | null => {
  const x = a.filter((v): v is number => v != null && !Number.isNaN(v))
  return x.length ? x.reduce((s, v) => s + v, 0) / x.length : null
}
export const uid = () => Math.random().toString(36).slice(2, 10)
export const today = () => new Date().toISOString().slice(0, 10)
export const itDate = (d: string) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : '')
export const slug = (s: string) =>
  String(s || 'azienda')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\- ]+/g, '')
    .trim()
    .replace(/\s+/g, '_') || 'azienda'
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
export const cap = (s: string) => String(s || '').toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, a: string, b: string) => a + b.toUpperCase())
export const cellStr = (v: unknown) => (v == null ? '' : String(v).trim())
export function num(v: unknown): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number') return v
  const t = String(v).trim().replace(',', '.')
  if (!/^-?\d+(\.\d+)?$/.test(t)) return Number.NaN
  return parseFloat(t)
}
function lev(a: string, b: string) {
  if (a === b) return 0
  let p = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const c = [i]
    for (let j = 1; j <= b.length; j++) c.push(Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0)))
    p = c
  }
  return p[b.length]
}
const simT = (a: string, b: string) => 1 - lev(a, b) / Math.max(a.length, b.length, 1)

// I cinque livelli del protocollo, sulla scala 0–100: sotto 30, 30–50, 50–70,
// 70–90, 90 e oltre. Si confronta il valore già arrotondato come si legge a schermo.
export function level(v: number | null | undefined): { t: string; c: 0 | 1 | 2 | 3 | 4 | 5 } {
  if (v == null || Number.isNaN(v)) return { t: '–', c: 0 }
  const r = Math.round(v * 10 + 1e-9)
  if (r < 30) return { t: 'Non adeguato', c: 1 }
  if (r < 50) return { t: 'In sviluppo', c: 2 }
  if (r < 70) return { t: 'Adeguato', c: 3 }
  if (r < 90) return { t: 'Avanzato', c: 4 }
  return { t: 'Eccellente', c: 5 }
}
export function typeOf(s: unknown): SourceKey | null {
  const t = String(s || '').toUpperCase()
  if (/AUTO/.test(t)) return 'AUTO'
  if (/PEER|COLLEG|PARI/.test(t)) return 'PEER'
  if (/RESPONSAB|DIRIGEN|MANAGER|CAPO|SUPERIOR|DIRETT/.test(t)) return 'DIR'
  return null
}

// Il voto sulla scala 0–100: voto 1–10 × 10, arrotondato all’intero (decisione del 2026-10-09).
export const DASH_SCALE = 10
export const rd = (v: number | null | undefined): number | null => (v == null || Number.isNaN(v) ? null : Math.round(v * DASH_SCALE + 1e-9))
export const fmt100 = (v: number | null | undefined) => {
  const r = rd(v)
  return r == null ? '–' : String(r)
}
export const dd = (a: number | null | undefined, b: number | null | undefined): number | null => {
  const ra = rd(a)
  const rb = rd(b)
  return ra == null || rb == null ? null : ra - rb
}
export const fmtSigned = (d: number | null | undefined) => (d == null ? '–' : d > 0 ? `+${d}` : d < 0 ? `−${Math.abs(d)}` : '±0')
export type GapState = 'raggiunto' | 'vicino' | 'da-sviluppare'
export type Perception = 'allineata' | 'sopravvaluta' | 'sottovaluta'
export const gapState = (d: number | null): GapState | null => (d == null ? null : d >= 0 ? 'raggiunto' : d <= -THR ? 'da-sviluppare' : 'vicino')
export const perceptionOf = (d: number | null): Perception | null => (d == null ? null : Math.abs(d) < THR ? 'allineata' : d > 0 ? 'sopravvaluta' : 'sottovaluta')

// ---------- stato ----------
export const DEF_SUBJ = 'Valutazione delle competenze professionali 5P'
export const DEF_BODY =
  'Gentile {NOME},\n\nin allegato trovi la tua scheda di valutazione delle competenze professionali (modello 5P).\n\nTi chiediamo di valutare:\n{ELENCO}\n\nCome fare:\n1. Salva il file allegato sul computer e aprilo con un doppio clic: si apre nel browser, non serve installare nulla. Usa un computer: sul telefono l\'allegato spesso si apre solo in anteprima.\n2. Leggi la guida iniziale (circa 5 minuti): spiega il modello 5P, la scala da 1 a 10 con esempi e come dare voti equi.\n3. Per ogni persona rispondi alle 25 domande con un voto da 1 a 10. Sotto ogni domanda trovi la guida al punteggio e che cosa osservare. Se non hai elementi per una domanda, premi "Non so valutare".\n4. Le risposte si salvano da sole: puoi interrompere e riprendere riaprendo lo stesso file.\n5. Alla fine vai su "Concludi e invia", scarica il file delle risposte e invialo a {EMAIL_HR}.\n\nTi chiediamo di completare entro il {SCADENZA}.\n\nLe valutazioni dei colleghi restano anonime: le persone valutate vedono solo medie aggregate.\n\nGrazie per la collaborazione.'

export function blank(): State5p {
  return { v: 5, company: '', people: [], plan: [], evals: [], log: null, sent: {}, mail: { emailHR: '', scad: '', subj: '', body: '' }, exp: { base: {}, groups: {} }, set: { mode: 'voto', rep: '' }, pianoId: uid(), demo: false }
}
/** Modifica una copia dello stato: tutte le schermate passano da qui. */
export function edit(s: State5p, fn: (d: State5p) => void): State5p {
  const d = structuredClone(s)
  fn(d)
  return d
}

type OldPerson = { id?: string; nome?: string; ruolo?: string; reparto?: string; email?: string }
type OldState = { company?: string; people?: OldPerson[]; plan?: PlanItem[]; evals?: Eval5p[]; set?: { emailHR?: string; scad?: string }; exp?: Targets; pianoId?: string; demo?: boolean }
// I progetti della versione precedente (anagrafica con responsabile e tabella
// delle assegnazioni) si riaprono: le persone diventano l'elenco, il piano
// resta quello che era, le schede restano. Il nome intero va nel cognome.
export function normalizeState(o: Partial<State5p> | OldState): State5p {
  const b = blank()
  if ((o as Partial<State5p>).v === 5) {
    const n = o as Partial<State5p>
    return { ...b, ...n, v: 5, mail: { ...b.mail, ...(n.mail ?? {}) }, set: { ...b.set, ...(n.set ?? {}) }, exp: { base: { ...(n.exp?.base ?? {}) }, groups: { ...(n.exp?.groups ?? {}) } }, sent: { ...(n.sent ?? {}) }, pianoId: n.pianoId || b.pianoId }
  }
  const old = o as OldState
  const s = b
  s.company = old.company || ''
  s.evals = old.evals || []
  s.plan = (old.plan || []).map((x) => ({ valutatore: x.valutatore, tipo: x.tipo, valutato: x.valutato }))
  s.people = (old.people || [])
    .filter((p) => p && p.nome)
    .map((p) => ({ id: p.id || uid(), cog: String(p.nome), nom: '', email: p.email || '', gruppo: p.reparto || '', mans: p.ruolo || '', roles: { dir: false, peer: false }, auto: true }))
  s.mail.emailHR = old.set?.emailHR || ''
  s.mail.scad = old.set?.scad || ''
  s.exp = { base: { ...(old.exp?.base ?? {}) }, groups: { ...(old.exp?.groups ?? {}) } }
  s.pianoId = old.pianoId || s.pianoId
  s.demo = !!old.demo
  s.plan.forEach((x) => {
    const p = personByName(s, x.valutatore)
    if (p && x.tipo === 'DIR') p.roles.dir = true
    if (p && x.tipo === 'PEER') p.roles.peer = true
  })
  return s
}
export function loadState(): State5p | null {
  try {
    const r = localStorage.getItem(STORAGE_KEY)
    if (r) return normalizeState(JSON.parse(r) as Partial<State5p>)
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

// ---------- persone e nomi ----------
/** Il nome come si scrive ovunque: COGNOME Nome (o il nome intero, se il nome non c'è). */
export const dn = (p: Pick<Person, 'cog' | 'nom'>) => (p.nom ? `${String(p.cog).trim().toUpperCase()} ${cap(String(p.nom).trim())}` : String(p.cog).trim())
const pTok = (p: Person) => toks(`${p.cog} ${p.nom}`)
export const personByName = (s: Pick<State5p, 'people'>, n: string) => {
  const k = norm(n)
  return k ? s.people.find((p) => norm(dn(p)) === k) : undefined
}
export const people = (s: State5p) => s.people.filter((p) => p.cog)
export function repairName(raw: unknown) {
  let s = String(raw ?? '')
  if (/\d/.test(s)) s = s.replace(/[+=]?\$?[A-Za-z]{1,3}\$?\d+(?::\$?[A-Za-z]{1,3}\$?\d+)?/g, '')
  return s.replace(/\s+/g, ' ').trim()
}
const camelSplit = (s: string) => String(s || '').replace(/([A-ZÀ-Ý])([A-ZÀ-Ý][a-zà-ÿ])/g, '$1 $2')
export type Resolved = { p?: Person; how: 'vuoto' | 'esatto' | 'corretto' | 'verifica' | 'nessuno'; note?: string; cand?: Person[] }
// Riconosce un nome scritto in modo diverso dall'elenco: prima esatto, poi
// abbreviato, poi cognome e nome con errori di battitura.
export function resolveName(pool: Person[], raw: string): Resolved {
  const fixed = camelSplit(repairName(raw))
  const t = toks(fixed)
  if (!t.length) return { how: 'vuoto' }
  const key = [...t].sort().join(' ')
  let c = pool.filter((p) => norm(dn(p)) === key)
  if (c.length === 1) return { p: c[0], how: 'esatto' }
  c = pool.filter((p) => {
    const pt = pTok(p)
    return t.every((x) => pt.includes(x))
  })
  if (c.length === 1) {
    const p = c[0]
    const nt = toks(p.nom)
    const ct = toks(p.cog)
    const onlyFirst = t.every((x) => nt.includes(x)) && !t.some((x) => ct.includes(x))
    return onlyFirst ? { p, how: 'verifica', note: 'scritto solo il nome' } : { p, how: 'esatto' }
  }
  const words = fixed.split(' ').filter(Boolean)
  const isUp = (w: string) => /\p{L}/u.test(w) && w === w.toUpperCase()
  let sw = words.filter(isUp)
  let fw = words.filter((w) => !isUp(w))
  if (!sw.length || !fw.length) {
    sw = words
    fw = []
  }
  const st = toks(sw.join(' '))
  const ft = toks(fw.join(' '))
  const best = (xs: string[], ys: string[]) => (ys.length ? Math.min(...xs.map((x) => Math.max(...ys.map((y) => simT(x, y))))) : 0)
  const sc = pool
    .map((p) => {
      const pc = toks(p.cog)
      const pn = toks(p.nom)
      const sS = best(st, pc.length ? pc : pTok(p))
      const sF = ft.length ? best(ft, pn.length ? pn : pTok(p)) : null
      return { p, sS, sF, s: sF == null ? sS : sS * 0.65 + sF * 0.35 }
    })
    .sort((a, b) => b.s - a.s)
  const b = sc[0]
  const b2 = sc[1] || { s: 0 }
  if (!b) return { how: 'nessuno', cand: [] }
  const cand = sc.slice(0, 4).filter((x) => x.s > 0.45).map((x) => x.p)
  if (b.sS >= 0.8 && (b.sF == null || b.sF >= 0.7) && b.s - b2.s >= 0.12) return { p: b.p, how: 'corretto' }
  if (b.sS >= 0.999 && b.sF != null && b.sF < 0.7 && sc.filter((x) => x.sS >= 0.999).length === 1) return { p: b.p, how: 'verifica', note: 'stesso cognome, nome diverso' }
  if (!fw.length) {
    const fn = pool.filter((p) => t.every((x) => toks(p.nom).includes(x)))
    if (fn.length === 1) return { p: fn[0], how: 'verifica', note: 'scritto solo il nome' }
  }
  if (b.s >= 0.75 && b.s - b2.s >= 0.12) return { p: b.p, how: 'verifica', note: 'nome simile' }
  return { how: 'nessuno', cand }
}
export function newPerson(cog: string, nom: string, extra?: Partial<Person>): Person {
  return { id: uid(), cog: String(cog || '').trim(), nom: String(nom || '').trim(), email: '', gruppo: '', mans: '', roles: { dir: false, peer: false }, auto: true, ...extra }
}
export function addPerson(s: State5p, cog: string, nom: string, extra?: Partial<Person>) {
  const p = newPerson(cog, nom, extra)
  s.people.push(p)
  return p
}
/** Rinomina la persona anche nel piano, nelle schede caricate e nello stato di invio. */
export function renamePerson(s: State5p, p: Person, cog: string, nom: string) {
  const old = dn(p)
  p.cog = cog
  p.nom = nom
  const nw = dn(p)
  if (old === nw) return
  const k = norm(old)
  s.plan.forEach((x) => {
    if (norm(x.valutatore) === k) x.valutatore = nw
    if (norm(x.valutato) === k) x.valutato = nw
  })
  s.evals.forEach((e) => {
    if (norm(e.valutatore) === k) e.valutatore = nw
    if (norm(e.valutato) === k) e.valutato = nw
  })
  if (s.sent[k]) {
    s.sent[norm(nw)] = s.sent[k]
    delete s.sent[k]
  }
}
export function removePerson(s: State5p, id: string) {
  const p = s.people.find((x) => x.id === id)
  if (!p) return
  const k = norm(dn(p))
  s.people = s.people.filter((x) => x !== p)
  s.plan = s.plan.filter((x) => norm(x.valutatore) !== k && norm(x.valutato) !== k)
}
export const groups = (s: State5p) => [...new Set(s.people.map((p) => (p.gruppo || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))

// ---------- piano ----------
export const hasEntry = (s: State5p, v: string, t: SourceKey, d: string) => s.plan.some((x) => x.tipo === t && same(x.valutatore, v) && same(x.valutato, d))
export function addEntry(s: State5p, v: string, t: SourceKey, d: string) {
  if (!v || !d || (t !== 'AUTO' && same(v, d)) || hasEntry(s, v, t, d)) return false
  s.plan.push({ valutatore: v, tipo: t, valutato: d })
  const p = personByName(s, v)
  if (p && t === 'DIR') p.roles.dir = true
  if (p && t === 'PEER') p.roles.peer = true
  return true
}
export const removeEntry = (s: State5p, v: string, t: SourceKey, d: string) => {
  s.plan = s.plan.filter((x) => !(x.tipo === t && same(x.valutatore, v) && same(x.valutato, d)))
}
/** Le autovalutazioni del piano seguono la spunta «Auto» delle persone. */
export function syncAuto(s: State5p) {
  s.plan = s.plan.filter((x) => x.tipo !== 'AUTO')
  s.people.forEach((p) => {
    if (p.auto && p.cog) s.plan.push({ valutatore: dn(p), tipo: 'AUTO', valutato: dn(p) })
  })
}
export function evaluatorsOf(s: State5p, t: SourceKey) {
  const m = new Map<string, { name: string; list: string[] }>()
  s.plan.forEach((x) => {
    if (x.tipo !== t) return
    const k = norm(x.valutatore)
    if (!m.has(k)) m.set(k, { name: x.valutatore, list: [] })
    m.get(k)!.list.push(x.valutato)
  })
  return [...m.values()].sort((a, b) => a.name.localeCompare(b.name))
}
export type Evaluator = { name: string; DIR: string[]; PEER: string[]; AUTO: boolean }
export function allEvaluators(s: State5p): Evaluator[] {
  const m = new Map<string, Evaluator>()
  s.plan.forEach((x) => {
    const k = norm(x.valutatore)
    if (!m.has(k)) m.set(k, { name: x.valutatore, DIR: [], PEER: [], AUTO: false })
    const o = m.get(k)!
    if (x.tipo === 'AUTO') o.AUTO = true
    else o[x.tipo].push(x.valutato)
  })
  return [...m.values()].sort((a, b) => a.name.localeCompare(b.name))
}
export function coverage(s: State5p, name: string) {
  const k = norm(name)
  const c: Record<SourceKey, number> = { DIR: 0, PEER: 0, AUTO: 0 }
  s.plan.forEach((x) => {
    if (norm(x.valutato) === k) c[x.tipo]++
  })
  return c
}
export const loadOf = (s: State5p, name: string) => {
  const k = norm(name)
  return s.plan.filter((x) => norm(x.valutatore) === k).length
}
export function planChecks(s: State5p) {
  const out = { noOthers: [] as string[], fewPeers: [] as string[], multiDir: [] as string[], heavy: [] as string[], noEmail: [] as string[] }
  people(s).forEach((p) => {
    const n = dn(p)
    const c = coverage(s, n)
    if (c.DIR + c.PEER === 0) out.noOthers.push(n)
    else if (c.PEER > 0 && c.PEER < PEER_MIN) out.fewPeers.push(`${n} (${c.PEER})`)
    if (c.DIR > 1) out.multiDir.push(`${n} (${c.DIR})`)
  })
  allEvaluators(s).forEach((e) => {
    const l = e.DIR.length + e.PEER.length + (e.AUTO ? 1 : 0)
    if (l > HEAVY_LOAD) out.heavy.push(`${e.name} (${l})`)
    const p = personByName(s, e.name)
    if (!p || !p.email) out.noEmail.push(e.name)
  })
  return out
}
/** Quante valutazioni del piano di questo valutatore sono già state caricate, e quali mancano. */
export function evStatus(s: State5p, name: string) {
  const k = norm(name)
  const entries = s.plan.filter((x) => norm(x.valutatore) === k)
  let rec = 0
  const miss: string[] = []
  entries.forEach((x) => {
    if (s.evals.some((e) => e.tipo === x.tipo && same(e.valutato, x.valutato) && (x.tipo === 'AUTO' || same(e.valutatore, name)))) rec++
    else miss.push(x.tipo === 'AUTO' ? 'sé stesso' : x.valutato)
  })
  return { exp: entries.length, rec, miss }
}
export const ORD: Record<SourceKey, number> = { AUTO: 0, DIR: 1, PEER: 2 }
export function listFor(s: State5p, v: string) {
  const k = norm(v)
  return s.plan
    .filter((x) => norm(x.valutatore) === k)
    .sort((a, b) => ORD[a.tipo] - ORD[b.tipo] || a.valutato.localeCompare(b.valutato))
    .map((x) => ({ valutato: x.valutato, tipo: x.tipo, ruolo: personByName(s, x.valutato)?.mans || '' }))
}

// ---------- import del piano (file Excel a 4 fogli) ----------
type XlsxMod = typeof import('xlsx')
type Row = unknown[]
const SH: Record<string, RegExp> = { elenco: /elenco|nominativ|anagraf|persone/i, dir: /dirigent|responsabil/i, peer: /peer|colleg/i, auto: /autovalut/i, att: /attes/i }
function findSheet(names: string[], k: string) {
  return names.find((n) => SH[k].test(n) && !(k === 'dir' && /peer|colleg/i.test(n)) && !(k === 'elenco' && /valutator/i.test(n)) && !(k === 'auto' && /valutatori/i.test(n)))
}
const HEAD_RE = /^(cognome|nome|elenco.*|nominativ.*|ruolo.*|e-?mail|area.*|gruppo.*|reparto|team|ufficio|mansione.*|qualifica|autovalutazion.*|valutatori.*|chi valutano.*|n\.?)$/i
function headerIndex(rows: Row[]) {
  let h = -1
  for (let i = 0; i < Math.min(6, rows.length); i++) {
    const r = (rows[i] || []).map(cellStr)
    if (!r.some(Boolean)) continue
    const isH = r.some((c) => HEAD_RE.test(c)) && !r.some((c) => /@/.test(c))
    const filled = r.filter(Boolean)
    const numeric = filled.length > 1 && filled.every((c) => /^\d+$/.test(c))
    if (isH || numeric) h = i
    else break
  }
  return h
}
function splitFull(s: string): [string, string] {
  const w = camelSplit(repairName(s)).split(' ').filter(Boolean)
  const isUp = (x: string) => /\p{L}/u.test(x) && x === x.toUpperCase()
  const up = w.filter(isUp)
  const lo = w.filter((x) => !isUp(x))
  return up.length && lo.length ? [up.join(' '), lo.join(' ')] : [w.join(' '), '']
}
const keyCN = (c: string, n: string) => norm(`${c} ${n}`)

/** Legge il piano. Valutazioni raccolte, email, testo, valori attesi e invii restano; le persone già note conservano email e gruppo. */
export function importPlan(X: XlsxMod, wb: import('xlsx').WorkBook, fileName: string, prev: State5p): { state: State5p } | { error: string } {
  const names = wb.SheetNames
  const sh: Record<string, string | undefined> = {}
  ;['elenco', 'dir', 'peer', 'auto', 'att'].forEach((k) => (sh[k] = findSheet(names, k)))
  if (!sh.elenco && !sh.dir && !sh.peer) return { error: 'Il file non ha la struttura attesa: servono i fogli ELENCO NOMINATIVI, VALUTATORI DIRIGENTI, VALUTATORI PEER, AUTOVALUTAZIONI' }
  const sheetRows = (n: string) => {
    const ws = wb.Sheets[n]
    const rows = X.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true, blankrows: true }) as Row[]
    const rg = ws['!ref'] ? X.utils.decode_range(ws['!ref']) : { s: { r: 0, c: 0 } }
    return { rows, addr: (i: number, j: number) => X.utils.encode_cell({ r: rg.s.r + i, c: rg.s.c + j }) }
  }
  const old = new Map((prev.demo ? [] : prev.people).map((p) => [norm(dn(p)), p]))
  const base = prev.demo ? blank() : prev
  const S: State5p = { ...blank(), evals: base.evals, mail: base.mail, exp: base.exp, set: base.set, company: base.company, sent: base.sent, pianoId: base.pianoId }
  const L: PlanLog = (S.log = { file: fileName, date: today(), auto: [], verify: [], unknown: [], ignored: [], fixed: [], merged: [], added: [] })
  const findP = (cog: string, nom: string) => S.people.find((q) => norm(dn(q)) === keyCN(cog, nom))

  // 1. elenco nominativi
  if (sh.elenco) {
    const { rows, addr } = sheetRows(sh.elenco)
    const h = headerIndex(rows)
    const hd = (rows[h] || []).map((c) => cellStr(c).toLowerCase())
    const fi = (re: RegExp) => hd.findIndex((s) => re.test(s))
    let cC = fi(/^cognome/)
    let cN = fi(/^nome/)
    if (cC < 0) cC = 0
    if (cN < 0) cN = cC + 1
    const cE = fi(/mail/)
    const cG = fi(/area|gruppo|reparto|team|ufficio/)
    const cM = fi(/mansione|qualifica/)
    const roleCols = hd.map((s, j) => (/ruolo|dirigent|peer|colleg/.test(s) && j !== cG && j !== cM ? j : -1)).filter((j) => j >= 0)
    for (let i = h + 1; i < rows.length; i++) {
      const r = rows[i] || []
      const rc = cellStr(r[cC])
      const rn = cellStr(r[cN])
      if (!rc && !rn) continue
      if (/@/.test(rc)) continue
      let cog = repairName(rc)
      let nom = repairName(rn)
      if (!nom && cog.includes(' ')) [cog, nom] = splitFull(cog)
      if (cog !== rc.replace(/\s+/g, ' ').trim() && /\d/.test(rc)) L.fixed.push({ sheet: sh.elenco, cell: addr(i, cC), raw: rc, res: cog, note: 'caratteri estranei nel cognome' })
      const roles = { dir: false, peer: false }
      roleCols.forEach((j) => {
        const v = cellStr(r[j])
        if (!v) return
        if (/dirigen|responsab/i.test(v) || (/x|si|sì/i.test(v) && /dirigen/.test(hd[j]))) roles.dir = true
        if (/peer|colleg/i.test(v) || (/x|si|sì/i.test(v) && /peer|colleg/.test(hd[j]))) roles.peer = true
      })
      let email = cE >= 0 ? cellStr(r[cE]) : ''
      if (!email) email = r.map(cellStr).find((x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)) || ''
      const ex = findP(cog, nom)
      if (ex) {
        ex.roles.dir ||= roles.dir
        ex.roles.peer ||= roles.peer
        if (!ex.email) ex.email = email
        L.merged.push({ sheet: sh.elenco, cell: addr(i, cC), raw: dn(ex), note: 'riga ripetuta, unita alla precedente' })
        continue
      }
      const o = old.get(keyCN(cog, nom))
      addPerson(S, cog, nom, { email: email || o?.email || '', gruppo: (cG >= 0 ? cellStr(r[cG]) : '') || o?.gruppo || '', mans: (cM >= 0 ? cellStr(r[cM]) : '') || o?.mans || '', roles, auto: !sh.auto })
    }
  }
  // 2. autovalutazioni
  if (sh.auto) {
    const { rows, addr } = sheetRows(sh.auto)
    const h = headerIndex(rows)
    const hd = (rows[h] || []).map((c) => cellStr(c).toLowerCase())
    let cC = hd.findIndex((s) => /^cognome/.test(s))
    let cN = hd.findIndex((s) => /^nome/.test(s))
    if (cC < 0) cC = 0
    if (cN < 0) cN = cC + 1
    let cX = hd.findIndex((s, j) => j > cN && /autovalut|^x$|si|compila/.test(s))
    if (cX < 0) cX = cN + 1
    for (let i = h + 1; i < rows.length; i++) {
      const r = rows[i] || []
      const rc = cellStr(r[cC])
      const rn = cellStr(r[cN])
      if (!rc && !rn) continue
      let cog = repairName(rc)
      let nom = repairName(rn)
      if (!nom && cog.includes(' ')) [cog, nom] = splitFull(cog)
      const mark = cellStr(r[cX])
      let p = findP(cog, nom)
      if (!p) {
        const rr = resolveName(S.people, `${cog.toUpperCase()} ${cap(nom)}`)
        if (rr.p) {
          p = rr.p
          if (rr.how !== 'esatto') L.auto.push({ sheet: sh.auto, cell: addr(i, cC), raw: `${rc} ${rn}`, res: dn(p) })
        }
      }
      if (!p) {
        p = addPerson(S, cog, nom, { auto: false })
        L.added.push({ sheet: sh.auto, cell: addr(i, cC), raw: dn(p), note: 'non era in ELENCO NOMINATIVI: aggiunto' })
      }
      if (mark && !/^(no|n|0|-)$/i.test(mark)) p.auto = true
    }
  }
  // 3. valutatori dirigenti e peer
  for (const [k, tipo] of [['dir', 'DIR'], ['peer', 'PEER']] as const) {
    const sn = sh[k]
    if (!sn) continue
    const { rows, addr } = sheetRows(sn)
    const h = headerIndex(rows)
    const hd = (rows[h] || []).map((c) => cellStr(c).toLowerCase())
    let cC = hd.findIndex((s) => /^cognome/.test(s))
    let cN = hd.findIndex((s) => /^nome/.test(s))
    if (cC < 0) cC = 0
    if (cN < 0) cN = cC + 1
    const first = Math.max(cC, cN) + 1
    for (let i = h + 1; i < rows.length; i++) {
      const r = rows[i] || []
      const rc = cellStr(r[cC])
      const rn = cellStr(r[cN])
      if (!rc && !rn) continue
      if (HEAD_RE.test(rc)) continue
      let cog = repairName(rc)
      let nom = repairName(rn)
      if (!nom && cog.includes(' ')) [cog, nom] = splitFull(cog)
      let ev = findP(cog, nom)
      if (!ev) {
        const rr = resolveName(S.people, `${cog.toUpperCase()} ${cap(nom)}`)
        if (rr.p && (rr.how === 'esatto' || rr.how === 'corretto')) {
          ev = rr.p
          if (rr.how !== 'esatto') L.auto.push({ sheet: sn, cell: addr(i, cC), raw: `${rc} ${rn}`, res: dn(ev) })
        }
      }
      if (!ev) {
        ev = addPerson(S, cog, nom, { auto: false })
        L.added.push({ sheet: sn, cell: addr(i, cC), raw: dn(ev), note: 'valutatore non presente in ELENCO NOMINATIVI: aggiunto' })
      }
      if (tipo === 'DIR') ev.roles.dir = true
      else ev.roles.peer = true
      const seen = new Set<string>()
      for (let j = first; j < r.length; j++) {
        const raw = cellStr(r[j])
        if (!raw) continue
        const cell = addr(i, j)
        if (/^\d+$/.test(raw)) {
          L.ignored.push({ sheet: sn, cell, raw, note: 'numero, non un nome' })
          continue
        }
        const res = resolveName(S.people, raw)
        if (!res.p) {
          L.unknown.push({ sheet: sn, cell, raw, ev: dn(ev), tipo, cand: (res.cand || []).map(dn) })
          continue
        }
        const p = res.p
        const pk = norm(dn(p))
        if (p === ev) {
          L.ignored.push({ sheet: sn, cell, raw, note: `${dn(ev)} è nella propria riga: l'autovalutazione è già nel suo foglio` })
          continue
        }
        if (seen.has(pk)) {
          L.ignored.push({ sheet: sn, cell, raw, note: `ripetuto nella riga di ${dn(ev)}` })
          continue
        }
        seen.add(pk)
        const other: SourceKey = tipo === 'DIR' ? 'PEER' : 'DIR'
        if (hasEntry(S, dn(ev), other, dn(p))) {
          L.ignored.push({ sheet: sn, cell, raw, note: `${dn(ev)} valuta già ${dn(p)} ${SRC[other].as}` })
          continue
        }
        addEntry(S, dn(ev), tipo, dn(p))
        if (res.how === 'corretto') L.auto.push({ sheet: sn, cell, raw, res: dn(p) })
        else if (res.how === 'verifica') L.verify.push({ sheet: sn, cell, raw, res: dn(p), note: res.note, ev: dn(ev), tipo })
      }
    }
  }
  // 4. valori attesi (facoltativo)
  if (sh.att) {
    const n = importExpected(S, sheetRows(sh.att).rows)
    if (n) L.expected = n
  }
  S.people.forEach((p) => {
    const o = old.get(norm(dn(p)))
    if (o) {
      if (!p.email) p.email = o.email || ''
      if (!p.gruppo) p.gruppo = o.gruppo || ''
    }
  })
  syncAuto(S)
  S.demo = false
  return { state: S }
}
function importExpected(S: State5p, rows: Row[]) {
  const h = rows.findIndex((r) => (r || []).some((c) => /^(codice|voce|cod\.?)$/i.test(cellStr(c))))
  if (h < 0) return 0
  const hd = rows[h].map(cellStr)
  const known = /^(codice|cod\.?|voce|area 5p|p|descrizione)$/i
  const cBase = hd.findIndex((s) => /base|tutti/i.test(s))
  const gcols = hd.map((s, j) => (s && j !== cBase && !known.test(s) && !s.startsWith('(') ? j : -1)).filter((j) => j >= 0)
  const vals: number[] = []
  for (let i = h + 1; i < rows.length; i++) {
    const r = rows[i] || []
    ;[cBase, ...gcols].forEach((j) => {
      if (j < 0) return
      const v = num(r[j])
      if (v != null && !Number.isNaN(v)) vals.push(v)
    })
  }
  const div = vals.some((v) => v > 10) ? 10 : 1
  let n = 0
  for (let i = h + 1; i < rows.length; i++) {
    const r = (rows[i] || []).map(cellStr)
    const code = r.find((c) => /^[A-E][1-5]?$/i.test(c))
    if (!code) continue
    const codes = code.length === 1 ? CODES.filter((c) => c[0] === code.toUpperCase()) : [code.toUpperCase()]
    const setv = (obj: Record<string, number>, j: number) => {
      const v = num(rows[i][j])
      if (v == null || Number.isNaN(v)) return
      codes.forEach((c) => {
        obj[c] = v / div
        n++
      })
    }
    if (cBase >= 0) setv(S.exp.base, cBase)
    gcols.forEach((j) => {
      const g = hd[j]
      S.exp.groups[g] = S.exp.groups[g] || {}
      setv(S.exp.groups[g], j)
    })
  }
  return n
}

// ---------- calcolo ----------
// Il calcolo unico (decisioni del 2026-10-09): media di ogni voce sulle schede
// date → media delle voci di ogni P → media delle cinque P. Con le schede di
// Dirigente e Colleghi insieme, una per una e senza pesi, è il voto;
// l'autovalutazione resta fuori e si mostra a parte.
type Means = { it: Record<string, number | null>; P: Record<string, number | null>; T: number | null }
export function pMeans(evs: Eval5p[]): Means {
  const it = Object.fromEntries(CODES.map((c) => [c, mean(evs.map((e) => e.scores[c] ?? null))])) as Means['it']
  const P = Object.fromEntries(PS.map((x) => [x.k, mean(CODES.filter((c) => c[0] === x.k).map((c) => it[c]))])) as Means['P']
  return { it, P, T: mean(PS.map((x) => P[x.k])) }
}
/** Il valore atteso di una voce: prima quello del gruppo, poi quello di base. */
export function expOf(s: State5p, gruppo: string | undefined, code: string): { value: number; from: 'group' | 'base' } | null {
  const g = (gruppo || '').trim()
  const gv = g ? s.exp.groups[g]?.[code] : undefined
  if (gv != null) return { value: gv, from: 'group' }
  const bv = s.exp.base[code]
  return bv != null ? { value: bv, from: 'base' } : null
}
export const expCount = (s: State5p) => Object.keys(s.exp.base).length + Object.values(s.exp.groups).reduce((n, o) => n + Object.keys(o).length, 0)

type Trio = { o: number | null; a: number | null; x: number | null }
export type Result = { p: Person; name: string; ev: Eval5p[]; oth: Eval5p[]; au: Eval5p[]; nDir: number; nPeer: number; nAuto: number; it: Record<string, Trio & { n: number }>; P: Record<string, Trio>; T: Trio }
export function resultOf(s: State5p, p: Person): Result {
  const name = dn(p)
  const k = norm(name)
  const ev = s.evals.filter((e) => norm(e.valutato) === k)
  const has = (e: Eval5p) => Object.keys(e.scores || {}).length > 0
  const oth = ev.filter((e) => e.tipo !== 'AUTO' && has(e))
  const au = ev.filter((e) => e.tipo === 'AUTO' && has(e))
  const fo = pMeans(oth)
  const fa = pMeans(au)
  const it = Object.fromEntries(CODES.map((c) => [c, { o: fo.it[c], a: fa.it[c], x: expOf(s, p.gruppo, c)?.value ?? null, n: oth.filter((e) => e.scores[c] != null).length }])) as Result['it']
  const P = Object.fromEntries(
    PS.map(({ k: K }) => {
      const cs = CODES.filter((c) => c[0] === K)
      return [K, { o: fo.P[K], a: fa.P[K], x: cs.every((c) => it[c].x != null) ? mean(cs.map((c) => it[c].x)) : null }]
    }),
  ) as Result['P']
  const T = { o: fo.T, a: fa.T, x: PS.every((x) => P[x.k].x != null) ? mean(PS.map((x) => P[x.k].x)) : null }
  return { p, name, ev, oth, au, nDir: oth.filter((e) => e.tipo === 'DIR').length, nPeer: oth.filter((e) => e.tipo === 'PEER').length, nAuto: au.length, it, P, T }
}
export const allResults = (s: State5p) => people(s).map((p) => resultOf(s, p)).filter((r) => r.ev.length)

/** Alfa di Cronbach per una P, sulle schede di Dirigente e Colleghi complete delle sue 5 voci. */
export function cronbach(s: State5p, K: string): { n: number; a: number | null } {
  const cs = CODES.filter((c) => c[0] === K)
  const rows = s.evals.filter((e) => e.tipo !== 'AUTO').map((e) => cs.map((c) => e.scores[c])).filter((r) => r.every((v) => v != null && !Number.isNaN(v)))
  const n = rows.length
  if (n < 10) return { n, a: null }
  const vr = (a: number[]) => {
    const m = mean(a) as number
    return a.reduce((acc, x) => acc + (x - m) ** 2, 0) / (a.length - 1)
  }
  const k = cs.length
  const iv = cs.map((_, j) => vr(rows.map((r) => r[j])))
  const tv = vr(rows.map((r) => r.reduce((acc, x) => acc + x, 0)))
  return tv ? { n, a: (k / (k - 1)) * (1 - iv.reduce((acc, x) => acc + x, 0) / tv) } : { n, a: null }
}

// ---------- lettura delle schede compilate (JSON, Excel, Forms) ----------
const CODE_RE = /^\s*([A-E])\s*[.-]?\s*([1-5])(?![0-9])/i
export type Parsed = { e: Eval5p; errs: string[]; missing: number; noNotes: number; nNo?: number }
function metaVal(rows: (Row | null)[], re: RegExp): string {
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
function parseFormSheet(name: string, rows: (Row | null)[], file: string): Parsed | { skip: true } | null {
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
  if (tipo === 'AUTO' && !valutatore) valutatore = valutato
  const e: Eval5p = { id: uid(), valutato, tipo: tipo as SourceKey, valutatore, ruolo: metaVal(rows, /^ruolo/i), data: metaVal(rows, /^data\s*:/i), scores, notes, source: `${file} › ${name}` }
  if (!valutato) errs.unshift('manca il nome del dipendente valutato')
  if (!tipo) errs.unshift('tipo di valutazione non riconosciuto')
  return { e, errs, missing: 25 - filled, noNotes: Object.keys(scores).filter((c) => !notes[c]).length }
}
function parseFlatSheet(name: string, rows: (Row | null)[], file: string): Parsed[] | null {
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
    const e: Eval5p = { id: uid(), valutato, tipo: tipo as SourceKey, valutatore, data: cD >= 0 ? cellStr(r[cD]) : '', scores, notes, source: `${file} › ${name} riga ${i + 1}` }
    if (!valutato) errs.unshift('manca il nome del valutato')
    if (!tipo) errs.unshift('tipo di valutazione non riconosciuto')
    res.push({ e, errs, missing: 25 - filled, noNotes: 0 })
  }
  return res
}
export function parseWorkbook(X: XlsxMod, wb: import('xlsx').WorkBook, file: string): Parsed[] {
  const out: Parsed[] = []
  wb.SheetNames.forEach((n) => {
    const rows = X.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: null, blankrows: true }) as (Row | null)[]
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
// La scheda del valutatore (un file HTML) restituisce un file JSON, oppure un
// codice "SV5P:…" da incollare nell'email.
export type ResponsesPayload = { format: string; pianoId?: string; azienda?: string; valutatore: string; creato?: string; valutazioni: { valutato: string; tipo: string; ruolo?: string; scores?: Record<string, unknown>; notes?: Record<string, string>; no?: string[] }[] }
export function fromPayload(s: State5p, o: ResponsesPayload, fname: string): { res: Parsed[]; warn?: string } {
  if (o && o.format === 'sv5p-progetto') throw new Error('è un file progetto: aprilo con "Apri progetto" in alto')
  if (!o || o.format !== 'sv5p-risposte' || !Array.isArray(o.valutazioni)) throw new Error('non è un file risposte 5P')
  const warn = s.pianoId && o.pianoId && o.pianoId !== s.pianoId ? `${fname}: la scheda proviene da un altro progetto (caricata comunque)` : undefined
  const res = o.valutazioni.map((x): Parsed => {
    const tipo = (['DIR', 'PEER', 'AUTO'] as string[]).includes(x.tipo) ? (x.tipo as SourceKey) : typeOf(x.tipo)
    const scores: Record<string, number> = {}
    const errs: string[] = []
    Object.entries(x.scores || {}).forEach(([c, v]) => {
      const n = num(v)
      if (CODES.includes(c) && n != null && n >= 1 && n <= 10) scores[c] = n
      else errs.push(`${c}: voto non valido`)
    })
    const filled = Object.keys(scores).length
    const no = Array.isArray(x.no) ? x.no.filter((c) => CODES.includes(c) && !(c in scores)) : []
    const notes = x.notes || {}
    return {
      e: { id: uid(), valutato: x.valutato, tipo: tipo as SourceKey, valutatore: tipo === 'AUTO' ? x.valutato : o.valutatore, ruolo: x.ruolo || '', data: (o.creato || '').slice(0, 10), scores, notes, no, source: `${fname} › ${tipo === 'AUTO' ? 'autovalutazione' : x.valutato}` },
      errs,
      missing: Math.max(0, 25 - filled - no.length),
      nNo: no.length,
      noNotes: Object.keys(scores).filter((c) => !notes[c]).length,
    }
  })
  return { res, warn }
}
export function codeToJson(t: string): ResponsesPayload {
  const raw = String(t).trim().replace(/^SV5P:/, '').replace(/\s+/g, '')
  return JSON.parse(decodeURIComponent(escape(atob(raw)))) as ResponsesPayload
}
/** Aggiunge le schede lette: sostituisce quella dello stesso valutatore sulla stessa persona e tipo. */
export function mergeEvals(s: State5p, res: Parsed[]) {
  const lines: { c: 'ok' | 'warn' | 'bad'; t: string }[] = []
  let added = 0
  let repl = 0
  let bad = 0
  res.forEach((x) => {
    const e = x.e
    if (!e.valutato || !e.tipo) {
      bad++
      lines.push({ c: 'bad', t: `${e.source}: scartata, ${x.errs.join('; ')}` })
      return
    }
    let pv = personByName(s, e.valutato)
    if (!pv) {
      const rr = resolveName(s.people, e.valutato)
      if (rr.how === 'corretto') pv = rr.p
    }
    if (pv) e.valutato = dn(pv)
    if (e.valutatore) {
      const pr = personByName(s, e.valutatore)
      if (pr) e.valutatore = dn(pr)
    }
    const k = `${e.tipo}|${norm(e.valutato)}|${norm(e.valutatore)}`
    const i = e.valutatore ? s.evals.findIndex((o) => `${o.tipo}|${norm(o.valutato)}|${norm(o.valutatore)}` === k) : -1
    if (i >= 0) {
      s.evals[i] = e
      repl++
    } else {
      s.evals.push(e)
      added++
    }
    const w: string[] = []
    if (x.missing) w.push(plural(x.missing, 'voce senza voto', 'voci senza voto'))
    if (x.noNotes) w.push(plural(x.noNotes, 'voce senza nota', 'voci senza nota'))
    w.push(...x.errs)
    if (!pv) w.push(`“${e.valutato}” non è nell'elenco nominativi`)
    const inf = x.nNo ? ` · ${x.nNo} ${x.nNo === 1 ? 'voce' : 'voci'} «non so valutare»` : ''
    lines.push({ c: w.length ? 'warn' : 'ok', t: `${e.source} → ${SRC[e.tipo].lab} su ${e.valutato}${e.tipo !== 'AUTO' && e.valutatore ? ` (da ${e.valutatore})` : ''}${i >= 0 ? ' · sostituisce la versione precedente' : ''}${inf}${w.length ? ` · ${w.join('; ')}` : ''}` })
  })
  return { lines, added, repl, bad }
}

// ---------- dati di esempio ----------
export function demoState(): State5p {
  const S = blank()
  S.demo = true
  S.company = 'Esempio Industrie S.p.A.'
  S.mail.emailHR = 'hr@esempio.it'
  S.mail.scad = '31/10/2026'
  const T: [string, string, string, [string, string, string][]][] = [
    ['BIANCHI', 'Laura', 'Produzione', [['NERI', 'Giulia', 'Operatrice CNC'], ['CONTI', 'Andrea', 'Manutentore'], ['GALLO', 'Sara', 'Addetta qualità'], ['MORETTI', 'Luca', 'Operatore di linea']]],
    ['FERRI', 'Marco', 'Amministrazione', [['COSTA', 'Davide', 'Contabile'], ['FONTANA', 'Chiara', 'Addetta paghe'], ['GRECO', 'Andrea', 'Impiegato acquisti'], ['VILLA', 'Marta', 'Impiegata contabilità']]],
    ['GALLI', 'Paolo', 'Commerciale', [['RIZZI', 'Elena', 'Key account'], ['ROMANO', 'Fabio', 'Commerciale estero'], ['MARINO', 'Silvia', 'Customer service'], ['BRUNO', 'Alessio', 'Commerciale Italia']]],
  ]
  const em = (c: string, n: string) => `${n}.${c}`.toLowerCase().replace(/[^a-z.]/g, '') + '@esempio.it'
  const boss = T.map((t) => addPerson(S, t[0], t[1], { gruppo: 'Dirigenti', mans: `Responsabile ${t[2].toLowerCase()}`, email: em(t[0], t[1]) }))
  T.forEach((t, i) => {
    const team = t[3].map((m) => addPerson(S, m[0], m[1], { gruppo: t[2], mans: m[2], email: em(m[0], m[1]) }))
    team.forEach((m) => addEntry(S, dn(boss[i]), 'DIR', dn(m)))
    team.forEach((m, j) => [1, 2, 3].forEach((k) => addEntry(S, dn(team[(j + k) % 4]), 'PEER', dn(m))))
  })
  boss.forEach((b, i) => boss.forEach((o, j) => { if (i !== j) addEntry(S, dn(o), 'PEER', dn(b)) }))
  syncAuto(S)
  const prof: Record<string, number[]> = { 'NERI Giulia': [7.5, 8, 6.5, 7, 8], 'CONTI Andrea': [8, 7, 5, 6, 4.5], 'GALLO Sara': [6, 6.5, 7, 7.5, 8], 'MORETTI Luca': [4.5, 5, 4, 5, 4], 'COSTA Davide': [7, 8, 6, 6, 5.5], 'FONTANA Chiara': [6.5, 7, 7, 8, 7.5], 'GRECO Andrea': [5, 5.5, 6, 5, 6.5], 'VILLA Marta': [6.5, 7, 6.5, 7, 6], 'RIZZI Elena': [8, 8, 7, 7.5, 7], 'ROMANO Fabio': [6, 6, 7, 8, 7], 'MARINO Silvia': [7, 7.5, 8, 7, 8.5], 'BRUNO Alessio': [5.5, 6, 6.5, 6, 7], 'BIANCHI Laura': [8, 8, 7, 7, 7], 'FERRI Marco': [7, 7.5, 6, 6.5, 6], 'GALLI Paolo': [7.5, 7, 7.5, 8, 7] }
  const selfB: Record<string, number> = { 'MORETTI Luca': 2.2, 'FONTANA Chiara': -1.4, 'CONTI Andrea': 1.6 }
  let seed = 11
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280
  const ib: Record<string, number> = {}
  Object.keys(prof).forEach((n) => CODES.forEach((c) => (ib[n + c] = (rnd() - 0.5) * 1.6)))
  S.plan.forEach((x) => {
    if (same(x.valutatore, 'ROMANO Fabio')) return
    if (same(x.valutatore, 'GRECO Andrea') && x.tipo !== 'AUTO') return
    const b = prof[x.valutato]
    if (!b) return
    const scores: Record<string, number> = {}
    const notes: Record<string, string> = {}
    CODES.forEach((c) => {
      const pi = 'ABCDE'.indexOf(c[0])
      const v = b[pi] + ib[x.valutato + c] + (x.tipo === 'AUTO' ? (selfB[x.valutato] ?? 0.8) : x.tipo === 'DIR' ? -0.3 : 0) + (rnd() - 0.5) * 1.6
      scores[c] = Math.max(1, Math.min(10, Math.round(v)))
    })
    if (x.tipo === 'DIR') {
      notes.B1 = 'Ha rispettato tutte le consegne del trimestre'
      notes.E5 = 'Concordare un piano di crescita scritto'
    }
    if (x.tipo === 'PEER' && rnd() < 0.3) notes.D5 = "Disponibile quando c'è da coprire un turno"
    S.evals.push({ id: uid(), valutato: x.valutato, tipo: x.tipo, valutatore: x.valutatore, data: today(), scores, notes, source: 'esempio' })
  })
  allEvaluators(S).forEach((e, i) => {
    if (!same(e.name, 'ROMANO Fabio') || i % 2) S.sent[norm(e.name)] = today()
  })
  CODES.forEach((c) => (S.exp.base[c] = 7))
  S.exp.groups = { Produzione: {}, Commerciale: {}, Amministrazione: {}, Dirigenti: {} }
  CODES.forEach((c) => {
    if (c[0] === 'A') S.exp.groups.Produzione[c] = 7.5
    if (c[0] === 'B') S.exp.groups.Produzione[c] = 8
    if (c[0] === 'D') S.exp.groups.Commerciale[c] = 8
    S.exp.groups.Dirigenti[c] = 8
  })
  S.exp.groups.Commerciale.C4 = 8
  S.exp.groups.Amministrazione.B2 = 8.5
  S.exp.groups.Amministrazione.A3 = 7.5
  S.set.rep = S.people.find((p) => p.cog === 'MORETTI')?.id || ''
  return S
}

// ---------- profilo della persona (Report persona) ----------
// Un solo calcolo per il profilo di una persona: lo stesso di `resultOf`, con
// i valori arrotondati sulla scala 0–100 e gli scarti sui valori arrotondati.
export type DashMetric = { actual: number | null; self: number | null; target: number | null; gap: number | null; gapState: GapState | null; selfDiff: number | null; perception: Perception | null }
export type DashLevel = { label: string; index: 1 | 2 | 3 | 4 | 5 }
export type DashItemRef = { code: string; name: string; actual: number | null; target: number | null; gap: number | null; self: number | null; selfDiff: number | null }
export type Dash5pPayload = {
  schemaVersion: 1
  generatedAt: string
  source: { company: string | null; pianoId: string | null }
  scale: { max: 100; conversion: string; gapBand: number; perceptionThreshold: number }
  person: { id: string | null; key: string; name: string; group: string | null; role: string | null; targetProfile: { group: string | null; definedItems: number; totalItems: number; complete: boolean; fromGroup: number; fromBase: number } }
  raters: { dir: number; peer: number; self: number; hasScore: boolean; peerAnonymityRisk: boolean; peerMin: number }
  summary: DashMetric & { level: DashLevel | null }
  categories: (DashMetric & { code: string; name: string; description: string; level: DashLevel | null })[]
  items: (DashItemRef & DashMetric & { category: string; level: DashLevel | null; responses: number; selfAnswered: boolean })[]
  insights: { basis: 'gap' | 'voto'; strengths: DashItemRef[]; developmentPriorities: DashItemRef[]; allStrengthsBelowTarget: boolean; perceptionDiscrepancies: (DashItemRef & { direction: 'sopravvaluta' | 'sottovaluta' })[] }
  /** Solo il tipo di fonte, mai il nome di chi scrive: i colleghi restano anonimi. */
  notes: { code: string; item: string | null; source: SourceKey; text: string }[]
}
const levelOf = (v: number | null): DashLevel | null => {
  const l = level(v)
  return l.c === 0 ? null : { label: l.t, index: l.c }
}
/** Il profilo di una persona, per id o nome. `null` se la persona non c'è. */
export function get5pDashboardPayload(s: State5p, idOrName: string): Dash5pPayload | null {
  const q = String(idOrName ?? '').trim()
  if (!q) return null
  const p = s.people.find((x) => x.id === q) ?? personByName(s, q)
  if (!p || !p.cog) return null
  const r = resultOf(s, p)
  const from = (c: string) => expOf(s, p.gruppo, c)?.from ?? null
  const metric = (o: number | null, a: number | null, x: number | null): DashMetric => {
    const gap = dd(o, x)
    const selfDiff = dd(a, o)
    return { actual: rd(o), self: rd(a), target: rd(x), gap, gapState: gapState(gap), selfDiff, perception: perceptionOf(selfDiff) }
  }
  const rows = CODES.map((c) => ({ c, ...r.it[c], g: dd(r.it[c].o, r.it[c].x), d: dd(r.it[c].a, r.it[c].o) }))
  const ref = (x: (typeof rows)[number]): DashItemRef => ({ code: x.c, name: ITEM_NAME[x.c], actual: rd(x.o), target: rd(x.x), gap: x.g, self: rd(x.a), selfDiff: x.d })
  const withO = rows.filter((x) => x.o != null)
  const hasX = rows.some((x) => x.g != null)
  const pool = hasX ? withO.filter((x) => x.g != null) : withO
  const best = [...pool].sort((a, b) => (hasX ? (b.g as number) - (a.g as number) : (b.o as number) - (a.o as number)))
  const worst = [...pool].sort((a, b) => (hasX ? (a.g as number) - (b.g as number) : (a.o as number) - (b.o as number)))
  const defined = CODES.filter((c) => r.it[c].x != null)
  const notes: Dash5pPayload['notes'] = []
  r.ev.forEach((e) =>
    Object.entries(e.notes || {}).forEach(([code, t]) => {
      const text = String(t || '').trim()
      if (text) notes.push({ code, item: code === 'GEN' ? null : (ITEM_NAME[code] ?? null), source: e.tipo, text })
    }),
  )
  notes.sort((a, b) => a.code.localeCompare(b.code))
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: { company: s.company || null, pianoId: s.pianoId || null },
    scale: { max: 100, conversion: 'voto 1–10 × 10, arrotondato all’intero', gapBand: THR, perceptionThreshold: THR },
    person: {
      id: p.id,
      key: norm(r.name),
      name: r.name,
      group: (p.gruppo || '').trim() || null,
      role: p.mans || null,
      targetProfile: { group: (p.gruppo || '').trim() || null, definedItems: defined.length, totalItems: CODES.length, complete: defined.length === CODES.length, fromGroup: defined.filter((c) => from(c) === 'group').length, fromBase: defined.filter((c) => from(c) === 'base').length },
    },
    raters: { dir: r.nDir, peer: r.nPeer, self: r.nAuto, hasScore: r.oth.length > 0, peerAnonymityRisk: r.nPeer > 0 && r.nPeer < PEER_MIN, peerMin: PEER_MIN },
    summary: { ...metric(r.T.o, r.T.a, r.T.x), level: levelOf(r.T.o) },
    categories: PS.map((P) => ({ code: P.k, name: P.n, description: P.d, ...metric(r.P[P.k].o, r.P[P.k].a, r.P[P.k].x), level: levelOf(r.P[P.k].o) })),
    items: rows.map((x) => ({ ...ref(x), ...metric(x.o, x.a, x.x), category: x.c[0], level: levelOf(x.o), responses: x.n, selfAnswered: r.au.some((e) => e.scores[x.c] != null) })),
    insights: {
      basis: hasX ? 'gap' : 'voto',
      strengths: best.slice(0, 3).map(ref),
      developmentPriorities: worst.slice(0, 3).map(ref),
      allStrengthsBelowTarget: hasX && best.length > 0 && (best[0].g as number) < 0,
      perceptionDiscrepancies: rows
        .filter((x) => x.d != null && Math.abs(x.d) >= THR)
        .sort((a, b) => Math.abs(b.d as number) - Math.abs(a.d as number))
        .map((x) => ({ ...ref(x), direction: (x.d as number) > 0 ? ('sopravvaluta' as const) : ('sottovaluta' as const) })),
    },
    notes,
  }
}
