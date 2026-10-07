import { ITEMS_5P } from '@/modules/assessment/gestione5p/items'
import { buildXlsx, colL, simpleSheet, XS, type XCell, type XSheet } from '@/modules/assessment/gestione5p/xlsx-writer'
import { CODES, PS, SRC, type Assign, type Result, type SourceKey, type State5p, blank, cellStr, compute, edit, gapOf, level, nameList, normalizeState, norm, peerN, people, personByName, preparePlan, slug, today, typeOf, uid } from '@/modules/assessment/gestione5p/model'
import schedaTemplate from '@/modules/assessment/gestione5p/scheda-valutatore.template.html?raw'

// Download e lettura dei file del modello Valutazione 5P: schede Excel
// precompilate (uno ZIP, un file per valutatore), scheda vuota, modello per
// Forms, anagrafica, piano ed esportazione dei risultati. Le librerie
// (xlsx, jszip) si caricano alla prima richiesta, non all'apertura della pagina.
type XlsxMod = typeof import('xlsx')
const loadXlsx = () => import('xlsx')

export function saveFile(name: string, data: Blob) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(data)
  a.download = name
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    URL.revokeObjectURL(a.href)
    a.remove()
  }, 2000)
}
const wbBlob = (X: XlsxMod, wb: import('xlsx').WorkBook) => new Blob([X.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

function sheetFor(X: XlsxMod, valutato: string, ruolo: string, tipo: SourceKey, valutatore: string) {
  const aoa: unknown[][] = [
    [, 'VALUTAZIONE 5P – ' + SRC[tipo].lab.toUpperCase()],
    [, 'Valutazione multi-fonte delle competenze professionali percepite · SKILL-VISION'],
    [],
    [, 'Dipendente valutato:', valutato || ''],
    [, 'Ruolo:', ruolo || ''],
    [, 'Data:', ''],
    [, 'Valutatore:', tipo === 'AUTO' ? valutato || '' : valutatore || ''],
    [, 'Tipo valutazione:', SRC[tipo].lab],
    [, 'Scala: 1–2 Non adeguato · 3–4 In sviluppo · 5–6 Adeguato · 7–8 Avanzato · 9–10 Eccellente. Inserire un voto intero da 1 a 10 in SCORE e un esempio concreto in NOTE.'],
  ]
  PS.forEach((P) => {
    aoa.push([])
    aoa.push([, `DIMENSIONE ${P.k} – ${P.n.toUpperCase()}   ${P.d}`])
    aoa.push([, 'COD', 'AREA', 'ITEM – DOMANDA', 'INDICE COMPORTAMENTALE', 'SCORE (1–10)', 'NOTE – ESEMPIO CONCRETO'])
    ITEMS_5P.filter((i) => i.cod[0] === P.k).forEach((i) => aoa.push([, i.cod, i.area, i.q, `1=${i.low} | 5=${i.mid} | 10=${i.high}`, null, '']))
  })
  const ws = X.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [{ wch: 2 }, { wch: 20 }, { wch: 26 }, { wch: 60 }, { wch: 60 }, { wch: 12 }, { wch: 50 }]
  return ws
}
function safeSheet(n: string, used: Set<string>) {
  const b = String(n).replace(/[[\]:*?/\\]/g, ' ').slice(0, 28).trim() || 'Foglio'
  let s = b
  let i = 2
  while (used.has(s.toLowerCase())) s = `${b.slice(0, 26)} ${i++}`
  used.add(s.toLowerCase())
  return s
}

export async function downloadSchede(S: State5p) {
  const [X, { default: JSZip }] = await Promise.all([loadXlsx(), import('jszip')])
  const zip = new JSZip()
  const by: Record<string, State5p['plan']> = {}
  S.plan.forEach((x) => (by[x.valutatore] = by[x.valutatore] || []).push(x))
  const order = { AUTO: 0, DIR: 1, PEER: 2 }
  Object.entries(by).forEach(([v, list]) => {
    const wb = X.utils.book_new()
    const used = new Set<string>()
    list.sort((a, b) => order[a.tipo] - order[b.tipo])
    list.forEach((x) => {
      const p = personByName(S, x.valutato)
      X.utils.book_append_sheet(wb, sheetFor(X, x.valutato, p?.ruolo || '', x.tipo, v), safeSheet((x.tipo === 'AUTO' ? 'AUTO ' : x.tipo === 'DIR' ? 'DIR ' : 'PEER ') + x.valutato, used))
    })
    zip.file(`Valutatore_${slug(v)}.xlsx`, X.write(wb, { bookType: 'xlsx', type: 'array' }))
  })
  zip.file('LEGGIMI.txt', `Schede Valutazione 5P - ${S.company || ''}\r\nUn file per valutatore. Ogni foglio = una persona da valutare.\r\nCompilare SCORE (1-10) e NOTE, salvare e restituire il file a HR.\r\n`)
  saveFile(`Schede_5P_${slug(S.company)}_${today()}.zip`, await zip.generateAsync({ type: 'blob' }))
}
export async function downloadBlank() {
  const X = await loadXlsx()
  const wb = X.utils.book_new()
  ;(['DIR', 'PEER', 'AUTO'] as SourceKey[]).forEach((t) => X.utils.book_append_sheet(wb, sheetFor(X, '', '', t, ''), SRC[t].lab.toUpperCase()))
  saveFile('Scheda_5P_vuota.xlsx', wbBlob(X, wb))
}
export async function downloadFlat() {
  const X = await loadXlsx()
  const head = ['Valutato', 'Tipo valutazione', 'Valutatore', 'Data', ...ITEMS_5P.map((i) => `${i.cod} – ${i.area}`), 'Note']
  const ex = ['Mario Rossi', 'Peer', 'Anna Verdi', today(), ...CODES.map(() => 7), 'Esempio: ha guidato il passaggio al nuovo gestionale']
  const wb = X.utils.book_new()
  X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([head, ex]), 'Risposte')
  const info = X.utils.aoa_to_sheet([
    ['Come usarlo con Microsoft Forms o Google Forms'],
    ['1. Domanda "Valutato" (elenco a discesa con i nomi)'],
    ['2. Domanda "Tipo valutazione": Dirigente / Peer / Autovalutazione'],
    ['3. Domanda "Valutatore" (nome di chi compila)'],
    ['4. 25 domande con scala 1-10, il cui titolo INIZIA con il codice: "A1 – Competenze tecniche", "A2 – ..." fino a "E5"'],
    ['5. Esportare le risposte in Excel e caricarle nel passo 3: il sistema riconosce le colonne dai codici A1…E5'],
  ])
  X.utils.book_append_sheet(wb, info, 'Istruzioni')
  saveFile('Modello_Forms_5P.xlsx', wbBlob(X, wb))
}
export async function downloadAnaTpl() {
  const sh = simpleSheet('Anagrafica', 'ANAGRAFICA · una riga per persona', ['Nome e cognome', 'Ruolo', 'Reparto', 'Responsabile', 'Email'], [['Laura Bianchi', 'Direttrice di stabilimento', 'Direzione', '', 'l.bianchi@azienda.it'], ['Mario Rossi', 'Responsabile produzione', 'Produzione', 'Laura Bianchi', 'm.rossi@azienda.it'], ['Giulia Neri', 'Operatrice CNC', 'Produzione', 'Mario Rossi', 'g.neri@azienda.it']], [26, 28, 20, 26, 28])
  saveFile('Modello_anagrafica_5P.xlsx', (await buildXlsx([sh])) as Blob)
}
export async function exportResults(S: State5p): Promise<boolean> {
  const R = compute(S).filter((r) => r.ev.length)
  if (!R.length) return false
  const X = await loadXlsx()
  const wb = X.utils.book_new()
  const r2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100)
  const h1 = ['Valutato', 'Ruolo', 'Reparto', 'Responsabile', 'N. Dirigente', 'N. Peer', 'N. Auto', ...PS.map((p) => `${p.k} ${p.n}`), 'Punteggio 5P', 'Livello', 'Competenze (A-D)', 'Potenziale (E)', 'Gap Auto vs altri']
  const d1 = R.map((r: Result) => [r.nome, r.ruolo, r.reparto, r.resp, r.cnt.DIR, r.cnt.PEER, r.cnt.AUTO, ...PS.map((p) => r2(r.fin[p.k])), r2(r.score), level(r.score).t, r2(r.comp), r2(r.pot), r2(gapOf(S, r).d)])
  const ws1 = X.utils.aoa_to_sheet([h1, ...d1])
  ws1['!cols'] = h1.map((_, i) => ({ wch: i < 4 ? 24 : 14 }))
  X.utils.book_append_sheet(wb, ws1, 'Punteggi 5P')
  const h2 = ['Valutato']
  PS.forEach((p) => ['Dir', 'Peer', 'Auto', 'Unico'].forEach((t) => h2.push(`${p.k} ${t}`)))
  X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([h2, ...R.map((r) => { const a: unknown[] = [r.nome]; PS.forEach((p) => { const s = r.src[p.k]; a.push(r2(s.DIR), r2(s.PEER), r2(s.AUTO), r2(r.fin[p.k])) }); return a })]), 'Per fonte')
  const d3: unknown[][] = []
  R.forEach((r) => CODES.forEach((c) => { const s = r.items[c]; d3.push([r.nome, c, ITEMS_5P.find((i) => i.cod === c)!.area, r2(s.DIR), r2(s.PEER), r2(s.AUTO)]) }))
  X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([['Valutato', 'Item', 'Descrizione', 'Dirigente', 'Peer', 'Auto'], ...d3]), 'Dettaglio item')
  X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([['Valutato', 'Tipo', 'Valutatore', 'Data', 'Origine', ...CODES], ...S.evals.map((e) => [e.valutato, SRC[e.tipo].lab, e.valutatore, e.data, e.source, ...CODES.map((c) => e.scores[c] ?? null)])]), 'Schede caricate (riservato)')
  const st = S.set
  X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([
    ['Azienda', S.company],
    ['Data elaborazione', today()],
    ['Metodo', { fonti: 'Media delle 3 fonti', semplice: 'Media semplice di tutte le schede', pesata: 'Media pesata' }[st.method]],
    ['Autovalutazione nel punteggio', st.incAuto ? 'Sì' : 'No'],
    ['Pesi Dir/Peer/Auto', st.method === 'pesata' ? `${st.w.DIR}/${st.w.PEER}/${st.w.AUTO}` : 'n.a.'],
    ['Livelli', '<3 Non adeguato; 3-5 In sviluppo; 5-7 Adeguato; 7-9 Avanzato; >=9 Eccellente'],
    ['Soglia gap', st.gap],
  ]), 'Parametri')
  saveFile(`Risultati_5P_${slug(S.company)}_${today()}.xlsx`, wbBlob(X, wb))
  return true
}
export async function readWorkbook(file: File) {
  const X = await loadXlsx()
  const wb = X.read(await file.arrayBuffer(), { type: 'array' })
  return { X, wb }
}

// ---------- tabella delle assegnazioni in Excel ----------
// Una riga per dipendente, colonne colorate (autovalutazione, responsabile,
// colleghi), caselle con menu a tendina dei nomi, riquadri fissi, righe vuote
// in fondo per i nuovi assunti, foglio di istruzioni e vista per valutatore.
export async function exportAssign(S0: State5p) {
  const S = edit(S0, () => {})
  const P = people(S)
  const N = peerN(S)
  const NL = nameList(S)
  const last = 5 + N
  const L = colL(last)
  const extra = 10
  const full = (v: string, s: number): XCell[] => Array.from({ length: last + 1 }, (_, i) => ({ v: i ? '' : v, s }))
  const grp: XCell[] = Array.from({ length: last + 1 }, (_, i) => ({ v: i === 0 ? 'DIPENDENTE DA VALUTARE' : i === 4 ? 'AUTOVALUTAZIONE' : i === 5 ? 'RESPONSABILE' : i === 6 ? 'COLLEGHI' : '', s: i < 4 ? XS.gPerson : i === 4 ? XS.gAuto : i === 5 ? XS.gDir : XS.gPeer }))
  const head: XCell[] = ['N.', 'Dipendente valutato', 'Ruolo', 'Reparto', 'Si autovaluta', 'Responsabile', ...Array.from({ length: N }, (_, i) => `Collega ${i + 1}`)].map((v) => ({ v, s: XS.colHead }))
  const rows: XSheet['rows'] = [
    full(`TABELLA ASSEGNAZIONI · CHI VALUTA CHI${S.company ? ` · ${S.company}` : ''}`, XS.title),
    full("Una riga per ogni dipendente. Nelle caselle gialle scegli dal menu a tendina chi lo valuta: il responsabile e i colleghi. L'autovalutazione è sempre inclusa. Poi salva il file e importalo nella piattaforma: pagina 2 Assegnazioni → Importa tabella compilata.", XS.sub),
    grp,
    head,
  ]
  P.forEach((p, i) => {
    const a = S.assign[p.id]
    rows.push([{ v: i + 1, s: XS.num }, { v: p.nome, s: XS.cellB }, { v: p.ruolo || '', s: XS.cell }, { v: p.reparto || '', s: XS.cell }, { v: 'SÌ', s: XS.auto }, { v: a.resp || '', s: XS.edit }, ...Array.from({ length: N }, (_, k) => ({ v: a.peers[k] || '', s: XS.edit }))])
  })
  for (let k = 0; k < extra; k++) rows.push([{ v: '', s: XS.num }, { v: '', s: XS.cellB }, { v: '', s: XS.cell }, { v: '', s: XS.cell }, { v: '', s: XS.auto }, { v: '', s: XS.edit }, ...Array.from({ length: N }, () => ({ v: '', s: XS.edit }))])
  const merges = [`A1:${L}1`, `A2:${L}2`, 'A3:D3', ...(N > 1 ? [`G3:${L}3`] : [])]
  const sh1: XSheet = {
    name: 'Assegnazioni',
    rows,
    merges,
    cols: [5, 26, 28, 16, 17, 26, ...Array(N).fill(24)],
    heights: { 0: 28, 1: 48, 2: 22, 3: 22 },
    freeze: { r: 4, c: 2 },
    landscape: true,
    dv: [{ sqref: `F5:${L}${4 + P.length + extra}`, f: 'Nomi', errTitle: 'Nome non in elenco', err: "Questo nome non è nell'elenco. Puoi usarlo comunque (per esempio un dirigente esterno) oppure scegliere dal menu a tendina.", pTitle: 'Scegli dal menu', prompt: 'Clicca la freccia e scegli chi valuta questa persona.' }],
  }
  const by: Record<string, { auto: boolean; dir: string[]; peer: string[] }> = {}
  S.plan.forEach((x) => {
    const o = (by[x.valutatore] = by[x.valutatore] || { auto: false, dir: [], peer: [] })
    if (x.tipo === 'AUTO') o.auto = true
    else (x.tipo === 'DIR' ? o.dir : o.peer).push(x.valutato)
  })
  const vrows = Object.keys(by).sort((a, b) => a.localeCompare(b)).map((v) => {
    const o = by[v]
    return [v, (o.auto ? 1 : 0) + o.dir.length + o.peer.length, o.dir.join(', ') || '—', o.peer.join(', ') || '—', o.auto ? 'SÌ' : '—'] as (string | number)[]
  })
  const sh2 = simpleSheet('Vista per valutatore', 'VISTA PER VALUTATORE · solo consultazione, le modifiche si fanno nel foglio Assegnazioni', ['Valutatore', 'Schede', 'Valuta come responsabile', 'Valuta come collega', 'Si autovaluta'], vrows, [26, 9, 46, 46, 13])
  const sh3 = simpleSheet('Elenco nomi', 'ELENCO NOMI · usato dai menu a tendina', ['Nome e cognome', 'Ruolo', 'Reparto'], NL.map((o) => [o.nome, o.ruolo || (o.ext ? "esterno all'anagrafica" : ''), o.reparto]), [28, 30, 20])
  const ist = [
    'Ogni riga del foglio Assegnazioni è un dipendente da valutare. Accanto al nome si indica chi lo valuta.',
    'Colonna "Si autovaluta": è sempre SÌ. Ogni dipendente compila anche la propria scheda.',
    'Colonna "Responsabile": chi valuta il dipendente come superiore diretto. Si lascia vuota solo per il vertice aziendale.',
    'Colonne "Collega": colleghi di pari livello che conoscono il lavoro della persona. Ne servono almeno 3 perché la media dei colleghi resti anonima.',
    'Nelle caselle gialle c\'è il menu a tendina con i nomi del foglio "Elenco nomi". Si può scrivere anche un nome esterno (per esempio un dirigente non in elenco): Excel chiede conferma.',
    'Non scegliere la stessa persona due volte nella stessa riga e non mettere il responsabile anche tra i colleghi: la piattaforma lo segnala come errore.',
    "Se manca un dipendente, aggiungilo nelle righe vuote in fondo: all'importazione la piattaforma lo aggiunge all'anagrafica.",
    'Per avere più o meno colleghi per persona, cambia il numero nella piattaforma (pagina 2) prima di scaricare il file.',
    'Quando hai finito, salva il file e importalo nella piattaforma: pagina 2 Assegnazioni → Importa tabella compilata.',
    'Il foglio "Vista per valutatore" mostra quante schede riceverà ciascuno. Serve solo come controllo.',
  ]
  const sh4: XSheet = { name: 'Istruzioni', cols: [6, 110], heights: { 0: 26 }, merges: ['A1:B1'], landscape: true, rows: [[{ v: 'COME COMPILARE LA TABELLA', s: XS.title }, { v: '', s: XS.title }], ...ist.map((t, i): XCell[] => [{ v: i + 1, s: XS.num }, { v: t, s: XS.wrap }])] }
  const blob = (await buildXlsx([sh1, sh2, sh3, sh4], [{ name: 'Nomi', ref: `'Elenco nomi'!$A$3:$A$${Math.max(3, NL.length + 2)}` }])) as Blob
  saveFile(`Assegnazioni_5P_${slug(S.company)}_${today()}.xlsx`, blob)
}

type Rows = unknown[][]
function importWide(S: State5p, rows: Rows): { n: number; added: number; bad: number } | null {
  const isName = (s: string) => /^(dipendente valutato|dipendente|valutato|nome e cognome|nominativo)$/i.test(s)
  const h = rows.findIndex((r) => {
    const t = (r || []).map(cellStr)
    return t.some(isName) && t.some((s) => /^responsabile/i.test(s)) && t.some((s) => /^collega/i.test(s))
  })
  if (h < 0) return null
  const hd = rows[h].map(cellStr)
  const cN = hd.findIndex(isName)
  const cR = hd.findIndex((s) => /^ruolo/i.test(s))
  const cP = hd.findIndex((s) => /^reparto/i.test(s))
  const cS = hd.findIndex((s) => /^responsabile/i.test(s))
  const cC = hd.map((s, j) => (/^collega/i.test(s) ? j : -1)).filter((j) => j >= 0)
  const canon = (v: unknown) => {
    const t = cellStr(v)
    const q = t && personByName(S, t)
    return q ? q.nome : t
  }
  let n = 0
  let added = 0
  const data = rows.slice(h + 1).filter((r) => r && cellStr(r[cN]))
  data.forEach((r) => {
    const nome = cellStr(r[cN])
    if (!personByName(S, nome)) {
      S.people.push({ id: uid(), nome, ruolo: cR >= 0 ? cellStr(r[cR]) : '', reparto: cP >= 0 ? cellStr(r[cP]) : '', resp: '', email: '' })
      added++
    }
  })
  data.forEach((r) => {
    const p = personByName(S, cellStr(r[cN]))!
    if (!p.resp && cellStr(r[cS])) p.resp = canon(r[cS])
    S.assign[p.id] = { resp: canon(r[cS]), peers: cC.map((j) => canon(r[j])), auto: false }
    n++
  })
  if (!n) return null
  S.set.peerN = Math.min(6, cC.length)
  if (!S.company)
    rows.slice(0, h).some((r) => {
      const m = (r || []).map(cellStr).join(' ').match(/CHI VALUTA CHI\s*·\s*(.+)$/i)
      if (m) {
        S.company = m[1].trim()
        return true
      }
      return false
    })
  return { n, added, bad: 0 }
}
function importLong(S: State5p, rows: Rows): { n: number; added: number; bad: number } | null {
  const h = rows.findIndex((r) => (r || []).some((c) => /^valutatore$/i.test(cellStr(c))))
  if (h < 0) return null
  const hd = rows[h].map(cellStr)
  const cV = hd.findIndex((s) => /^valutatore$/i.test(s))
  const cT = hd.findIndex((s) => /tipo/i.test(s))
  const cD = hd.findIndex((s) => /^valutat[oa]$|persona valutata|da valutare/i.test(s))
  if (cT < 0 || cD < 0) return null
  const by: Record<string, { nome: string; l: { v: string; t: SourceKey }[] }> = {}
  let bad = 0
  rows.slice(h + 1).forEach((r) => {
    if (!r) return
    const v = cellStr(r[cV])
    const d = cellStr(r[cD])
    if (!v && !d) return
    let t = typeOf(r[cT])
    if (!t && v && d && norm(v) === norm(d)) t = 'AUTO'
    if (!v || !d || !t) { bad++; return }
    ;(by[norm(d)] = by[norm(d)] || { nome: d, l: [] }).l.push({ v, t })
  })
  let n = 0
  let added = 0
  let mx = 0
  Object.values(by).forEach(({ nome, l }) => {
    let p = personByName(S, nome)
    if (!p) {
      p = { id: uid(), nome, ruolo: '', reparto: '', resp: '', email: '' }
      S.people.push(p)
      added++
    }
    const a: Assign = { resp: l.find((x) => x.t === 'DIR')?.v || '', peers: l.filter((x) => x.t === 'PEER').map((x) => x.v), auto: false }
    mx = Math.max(mx, a.peers.length)
    S.assign[p.id] = a
    n++
  })
  if (!n) return null
  S.set.peerN = Math.min(6, mx)
  return { n, added, bad }
}
// Reimporta la tabella compilata: corregge le maiuscole dei nomi, aggiunge
// all'anagrafica i nuovi dipendenti, segnala gli errori nella tabella.
export async function importAssign(S0: State5p, file: File): Promise<{ state: State5p; msg: string } | { error: string }> {
  const { X, wb } = await readWorkbook(file)
  const sheets = wb.SheetNames.map((sn) => X.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: '' }) as Rows)
  const isTable = (rows: Rows) => rows.some((r) => {
    const t = (r || []).map(cellStr)
    return (t.some((s) => /^responsabile/i.test(s)) && t.some((s) => /^collega/i.test(s))) || (t.some((s) => /^valutatore$/i.test(s)) && t.some((s) => /tipo/i.test(s)))
  })
  if (!sheets.some(isTable)) return { error: 'Non trovo la tabella: servono le colonne Dipendente valutato, Responsabile e Collega 1, 2, 3…' }
  const wasDemo = S0.demo
  const S = structuredClone(wasDemo ? blank() : S0)
  let res: { n: number; added: number; bad: number } | null = null
  for (const rows of sheets) {
    res = importWide(S, rows) || importLong(S, rows)
    if (res) break
  }
  if (!res) return { error: 'La tabella non contiene righe con un dipendente' }
  preparePlan(S)
  return { state: S, msg: `Tabella importata: ${res.n} dipendenti${res.added ? ` · ${res.added} aggiunti in anagrafica` : ''}${res.bad ? ` · ${res.bad} righe scartate` : ''}${wasDemo ? ' · dati di esempio rimossi' : ''}` }
}

// ---------- schede HTML per i valutatori ----------
// Un file per valutatore, che si apre con il browser: istruzioni, scala, elenco
// delle persone, 25 domande per persona con barra 1–10. Il file è autonomo
// (non usa i token del sistema): è quello che arriva per email.
export const evalFile = (v: string) => `Scheda_5P_${slug(v)}.html`
export function valutatori(S: State5p): string[] {
  const m = new Map<string, string>()
  S.plan.forEach((x) => { const k = norm(x.valutatore); if (!m.has(k)) m.set(k, x.valutatore) })
  return [...m.values()].sort((a, b) => a.localeCompare(b))
}
const ORD = { AUTO: 0, DIR: 1, PEER: 2 }
export function listFor(S: State5p, v: string) {
  const k = norm(v)
  return S.plan.filter((x) => norm(x.valutatore) === k).sort((a, b) => ORD[a.tipo] - ORD[b.tipo]).map((x) => ({ valutato: x.valutato, tipo: x.tipo, ruolo: personByName(S, x.valutato)?.ruolo || '' }))
}
const escHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c as '&'])
// I colori della scheda non sono scritti nel file: si leggono dai token della
// piattaforma (chiaro e scuro) al momento di generarla e si iniettano nel CSS.
const TOKENS = ['background', 'foreground', 'card', 'muted', 'muted-foreground', 'border', 'border-strong', 'primary', 'primary-foreground', 'success', 'warning', 'destructive', 'ring']
function readTokens(): { light: string; dark: string; wasDark: boolean } {
  const root = document.documentElement
  const wasDark = root.classList.contains('dark')
  const read = (dark: boolean) => {
    root.classList.toggle('dark', dark)
    const cs = getComputedStyle(root)
    return TOKENS.map((t) => `--${t}:${cs.getPropertyValue(`--${t}`).trim()}`).join(';')
  }
  const light = read(false)
  const dark = read(true)
  root.classList.toggle('dark', wasDark)
  return { light, dark, wasDark }
}
export function buildEval(S: State5p, v: string, force?: 'light' | 'dark'): string {
  const tk = readTokens()
  const css = `:root{${tk.light}}@media (prefers-color-scheme:dark){:root{${tk.dark}}}` + (force ? `:root{${force === 'dark' ? tk.dark : tk.light}}` : '')
  const data = { pianoId: S.pianoId, azienda: S.company || '', valutatore: v, scadenza: S.set.scad || '', emailHR: S.set.emailHR || '', PS: PS.map((p) => ({ k: p.k, n: p.n, d: p.d })), ITEMS: ITEMS_5P.map((i) => [i.cod, i.area, i.q, `1=${i.low} | 5=${i.mid} | 10=${i.high}`]), persone: listFor(S, v) }
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return schedaTemplate.replace('/*SVTOKENS*/', () => css).replace('/*SVDATA*/null', () => json).replace('<title>Scheda di valutazione 5P</title>', () => `<title>Scheda 5P – ${escHtml(v)}</title>`)
}
export function mailText(S: State5p): string {
  return `Oggetto: Valutazione delle competenze professionali${S.company ? ` – ${S.company}` : ''}\n\nGentile collega,\n\nin allegato trovi la tua scheda di valutazione delle competenze professionali (5P).\n\nCome fare:\n1. Salva il file allegato e aprilo con un doppio clic: si apre nel browser, non serve installare nulla.\n2. Leggi la pagina "Istruzioni e scala".\n3. Per ogni persona in elenco rispondi alle 25 domande cliccando un voto da 1 a 10 sulla barra; sotto ogni barra trovi la guida al punteggio.\n4. Le risposte si salvano da sole: puoi interrompere e riprendere riaprendo lo stesso file.\n5. Alla fine vai su "Concludi e invia", scarica il file delle risposte e rispondi a questa email allegandolo${S.set.emailHR ? ` (oppure invialo a ${S.set.emailHR})` : ''}.\n\n${S.set.scad ? `Ti chiediamo di completare entro il ${S.set.scad}.\n\n` : ''}Le valutazioni dei colleghi restano anonime: le persone valutate vedono solo medie aggregate.\n\nGrazie per la collaborazione.`
}
export async function downloadSchedeHTML(S: State5p): Promise<boolean> {
  if (!S.plan.length) return false
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const vs = valutatori(S)
  vs.forEach((v) => zip.file(evalFile(v), buildEval(S, v)))
  const rows = vs.map((v) => {
    const l = listFor(S, v)
    return [v, personByName(S, v)?.email || '', evalFile(v), l.length, l.map((x) => `${x.tipo === 'AUTO' ? 'sé stesso' : x.valutato} (${SRC[x.tipo].lab})`).join('; ')] as (string | number)[]
  })
  zip.file('00_Elenco_invii.xlsx', (await buildXlsx([simpleSheet('Elenco invii', 'ELENCO INVII · una email per valutatore, con il suo file allegato', ['Valutatore', 'Email', 'File da allegare', 'N. persone', 'Persone da valutare'], rows, [24, 28, 34, 11, 90])], [], 'uint8array')) as Uint8Array)
  zip.file('00_Testo_email.txt', mailText(S).replace(/\n/g, '\r\n'))
  saveFile(`Schede_valutatori_5P_${slug(S.company)}_${today()}.zip`, await zip.generateAsync({ type: 'blob' }))
  return true
}

// ---------- progetto ----------
export function saveProject(S: State5p) {
  saveFile(`Progetto_5P_${slug(S.company)}_${today()}.json`, new Blob([JSON.stringify({ format: 'sv5p-progetto', v: 1, salvato: new Date().toISOString(), stato: S })], { type: 'application/json' }))
}
export async function openProject(f: File): Promise<State5p> {
  const o = JSON.parse(await f.text()) as { format?: string; stato?: Partial<State5p> }
  if (o && o.format === 'sv5p-risposte') throw new Error('questo è il file risposte di un valutatore: caricalo nella pagina Caricamento')
  if (!o || o.format !== 'sv5p-progetto' || !o.stato) throw new Error('non è un file progetto 5P')
  return normalizeState(o.stato)
}
