import { ITEMS_5P } from '@/modules/assessment/gestione5p/items'
import { buildXlsx, colL, simpleSheet, XS, type XCell, type XSheet } from '@/modules/assessment/gestione5p/xlsx-writer'
import {
  CODES,
  DEF_BODY,
  DEF_SUBJ,
  ITEM_NAME,
  PS,
  SRC,
  THR,
  type Dash5pPayload,
  type Evaluator,
  type Person,
  type SourceKey,
  type State5p,
  allEvaluators,
  allResults,
  cap,
  dd,
  dn,
  evaluatorsOf,
  groups,
  listFor,
  normalizeState,
  personByName,
  planChecks,
  rd,
  resultOf,
  slug,
  today,
} from '@/modules/assessment/gestione5p/model'
import schedaTemplate from '@/modules/assessment/gestione5p/scheda-valutatore.template.html?raw'

// Download e lettura dei file della Valutazione 5P: modello del piano e piano
// corretto (Excel a più fogli, menu a tendina dei nomi), schede HTML dei
// valutatori, email pronte (.eml) in uno ZIP, alternative Excel e Forms,
// esportazione dei risultati e del report di una persona, progetto. Le
// librerie (xlsx, jszip) si caricano alla prima richiesta.
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
export async function readWorkbook(file: File) {
  const X = await loadXlsx()
  const wb = X.read(await file.arrayBuffer(), { type: 'array' })
  return { X, wb }
}
const wbBlob = (X: XlsxMod, wb: import('xlsx').WorkBook) => new Blob([X.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

// ---------- Excel del piano: modello vuoto e piano corretto ----------
const ISTRUZIONI = [
  'Il file ha 4 fogli da compilare: ELENCO NOMINATIVI, VALUTATORI DIRIGENTI, VALUTATORI PEER (Colleghi), AUTOVALUTAZIONI. Il foglio VALORI ATTESI è facoltativo.',
  'ELENCO NOMINATIVI: una riga per ogni persona coinvolta, come valutato o come valutatore. COGNOME e NOME in colonne separate, senza ripetere la stessa persona.',
  'Colonne RUOLO: scrivi DIRIGENTE se la persona valuta i propri collaboratori, PEER se valuta dei colleghi. Una persona può avere entrambi i ruoli.',
  'EMAIL serve per inviare la scheda a chi valuta. AREA / GRUPPO serve per il Valore Atteso (per esempio Amministrazione, Produzione). MANSIONE è facoltativa e compare nella scheda.',
  'VALUTATORI DIRIGENTI: una riga per ogni dirigente. Nelle colonne 1, 2, 3… le persone che quel dirigente valuta.',
  'VALUTATORI PEER (Colleghi): una riga per ogni collega che valuta. Nelle colonne 1, 2, 3… le persone che valuta.',
  "Nelle colonne dei valutatori scegli i nomi dal menu a tendina: sono presi dall'ELENCO NOMINATIVI e sono già scritti in modo corretto (COGNOME Nome). Così si evitano errori di battitura.",
  "AUTOVALUTAZIONI: una X accanto a chi compila anche la propria autovalutazione (di norma tutti). L'autovalutazione resta visibile nei risultati ma non entra nella media.",
  'Non mettere una persona nella propria riga (la sua autovalutazione è già nel foglio AUTOVALUTAZIONI) e non ripetere lo stesso nome nella stessa riga: la piattaforma li ignora e li segnala.',
  "Perché la media dei colleghi resti anonima, ogni persona dovrebbe essere valutata da almeno 3 colleghi. Chi non è valutato da nessun dirigente o collega avrà solo l'autovalutazione e nessun voto finale.",
  "VALORI ATTESI (facoltativo): per ogni voce il livello richiesto dall'azienda, su scala 0–100. La colonna Base vale per tutti; aggiungi una colonna per ogni area/gruppo solo dove il valore è diverso. Non compare nelle schede dei valutatori e si può inserire o cambiare anche dopo la raccolta, direttamente nella piattaforma.",
  'Quando hai finito, salva il file e importalo nella piattaforma: pagina 1 Piano → Importa file Excel. La piattaforma controlla il file e segnala nomi non riconosciuti, doppioni e persone senza valutatori.',
]
export function controlRows(S: State5p): (string | number)[][] {
  const L = S.log
  const out: (string | number)[][] = []
  const ch = planChecks(S)
  if (L) {
    L.verify.forEach((x) => out.push(['Da verificare', x.sheet, x.cell, x.raw, x.res || '', x.note || '']))
    L.unknown.forEach((x) => out.push(['Non riconosciuto', x.sheet, x.cell, x.raw, '—', `Non trovato in ELENCO NOMINATIVI${x.cand?.length ? `. Forse: ${x.cand.join(', ')}` : ''}`]))
    L.auto.forEach((x) => out.push(['Corretto', x.sheet, x.cell, x.raw, x.res || '', x.confirmed ? 'confermato' : 'errore di battitura corretto']))
    L.fixed.forEach((x) => out.push(['Corretto', x.sheet, x.cell, x.raw, x.res || '', x.note || '']))
    L.ignored.forEach((x) => out.push(['Ignorato', x.sheet, x.cell, x.raw, '—', x.note || '']))
    L.merged.forEach((x) => out.push(['Unito', x.sheet, x.cell, x.raw, '—', x.note || '']))
    L.added.forEach((x) => out.push(['Aggiunto', x.sheet, x.cell, x.raw, '—', x.note || '']))
  }
  ch.noOthers.forEach((n) => out.push(['Da decidere', '', '', n, '—', "Nessun dirigente o collega la valuta: avrà solo l'autovalutazione e nessun voto finale"]))
  ch.fewPeers.forEach((n) => out.push(['Da decidere', '', '', n, '—', 'Meno di 3 colleghi: la media dei colleghi non è anonima']))
  ch.multiDir.forEach((n) => out.push(['Da controllare', '', '', n, '—', 'Valutato da più di un dirigente']))
  return out
}
export async function exportPlan(S: State5p, empty: boolean) {
  const P = empty ? [] : [...S.people].filter((p) => p.cog).sort((a, b) => dn(a).localeCompare(dn(b)))
  const NN = 500
  const nomiRef = "'ELENCO NOMINATIVI'"
  const el: XSheet = {
    name: 'ELENCO NOMINATIVI',
    cols: [24, 20, 20, 16, 32, 24, 26],
    heights: { 0: 26, 1: 30 },
    merges: ['A1:G1'],
    freeze: { r: 2, c: 2 },
    landscape: true,
    rows: [
      [{ v: `ELENCO NOMINATIVI${S.company && !empty ? ` · ${S.company}` : ''}`, s: XS.title }, ...Array.from({ length: 6 }, () => ({ v: '', s: XS.title }))],
      ['COGNOME', 'NOME', 'RUOLO: DIRIGENTE', 'RUOLO: PEER', 'EMAIL', 'AREA / GRUPPO', 'MANSIONE (facoltativa)'].map((v) => ({ v, s: XS.colHead })),
    ],
  }
  P.forEach((p) => el.rows.push([{ v: String(p.cog).toUpperCase(), s: XS.cellB }, { v: p.nom ? cap(p.nom) : '', s: XS.cell }, { v: p.roles.dir ? 'DIRIGENTE' : '', s: XS.num }, { v: p.roles.peer ? 'PEER' : '', s: XS.num }, { v: p.email || '', s: XS.edit }, { v: p.gruppo || '', s: XS.edit }, { v: p.mans || '', s: XS.cell }]))
  for (let k = 0; k < (empty ? 60 : 15); k++) el.rows.push([{ v: '', s: XS.cellB }, { v: '', s: XS.cell }, { v: '', s: XS.num }, { v: '', s: XS.num }, { v: '', s: XS.edit }, { v: '', s: XS.edit }, { v: '', s: XS.cell }])
  const nomi: XSheet = {
    name: 'NOMI',
    hidden: true,
    cols: [40],
    rows: Array.from({ length: NN }, (_, i) => [{ f: `IF(TRIM(${nomiRef}!A${i + 3})="","",UPPER(TRIM(${nomiRef}!A${i + 3}))&IF(TRIM(${nomiRef}!B${i + 3})="",""," "&PROPER(TRIM(${nomiRef}!B${i + 3}))))` }]),
  }
  const valSheet = (name: string, tipo: SourceKey, minCols: number): XSheet => {
    const evs = empty ? [] : evaluatorsOf(S, tipo)
    const N = Math.max(minCols, ...evs.map((e) => e.list.length + 2))
    const L = colL(1 + N)
    const g = tipo === 'DIR' ? XS.gDir : XS.gPeer
    const sh: XSheet = {
      name,
      cols: [24, 18, ...Array(N).fill(26)],
      heights: { 0: 26, 1: 22 },
      merges: ['A1:B1', `C1:${L}1`],
      freeze: { r: 2, c: 2 },
      landscape: true,
      rows: [
        [{ v: name, s: g }, { v: '', s: g }, { v: 'CHI VALUTANO →  scegli i nomi dal menu a tendina', s: XS.gPerson }, ...Array.from({ length: N - 1 }, () => ({ v: '', s: XS.gPerson }))],
        [{ v: 'COGNOME', s: XS.colHead }, { v: 'NOME', s: XS.colHead }, ...Array.from({ length: N }, (_, i) => ({ v: i + 1, s: XS.colHead }))],
      ],
    }
    evs.forEach((e) => {
      const p = personByName(S, e.name) || { cog: e.name, nom: '' }
      sh.rows.push([{ v: String(p.cog).toUpperCase(), s: XS.cellB }, { v: p.nom ? cap(p.nom) : '', s: XS.cell }, ...Array.from({ length: N }, (_, i) => ({ v: e.list[i] || '', s: XS.edit }))])
    })
    for (let k = 0; k < (empty ? 40 : 10); k++) sh.rows.push([{ v: '', s: XS.cellB }, { v: '', s: XS.cell }, ...Array.from({ length: N }, () => ({ v: '', s: XS.edit }))])
    sh.dv = [{ sqref: `C3:${L}${sh.rows.length + 20}`, f: 'Nomi', errTitle: 'Nome non in elenco', err: "Questo nome non è nell'ELENCO NOMINATIVI. Controlla come è scritto o aggiungi la persona all'elenco.", pTitle: 'Scegli dal menu', prompt: 'Clicca la freccia e scegli la persona da valutare.' }]
    return sh
  }
  const au: XSheet = {
    name: 'AUTOVALUTAZIONI',
    cols: [24, 20, 22],
    heights: { 0: 26 },
    merges: ['A1:C1'],
    freeze: { r: 2, c: 0 },
    rows: [[{ v: 'AUTOVALUTAZIONI · X = compila anche la propria scheda', s: XS.gAuto }, { v: '', s: XS.gAuto }, { v: '', s: XS.gAuto }], ['COGNOME', 'NOME', 'AUTOVALUTAZIONE (X)'].map((v) => ({ v, s: XS.colHead }))],
  }
  P.forEach((p) => au.rows.push([{ v: String(p.cog).toUpperCase(), s: XS.cellB }, { v: p.nom ? cap(p.nom) : '', s: XS.cell }, { v: p.auto ? 'X' : '', s: XS.auto }]))
  for (let k = 0; k < (empty ? 60 : 10); k++) au.rows.push([{ v: '', s: XS.cellB }, { v: '', s: XS.cell }, { v: '', s: XS.auto }])
  const G = empty ? [] : groups(S)
  const ex100 = (v: number | undefined) => (v == null ? '' : Math.round(v * 10))
  const gcols = G.length ? G : ['']
  const at: XSheet = {
    name: 'VALORI ATTESI',
    cols: [9, 18, 40, 12, ...G.map(() => 16)],
    heights: { 0: 26, 1: 30 },
    merges: [`A1:${colL(3 + Math.max(G.length, 1))}1`],
    freeze: { r: 2, c: 3 },
    landscape: true,
    rows: [
      [{ v: 'VALORI ATTESI · scala 0–100 · non visibili ai valutatori', s: XS.title }, ...Array.from({ length: 3 + Math.max(G.length, 1) }, () => ({ v: '', s: XS.title }))],
      ['Codice', 'Area 5P', 'Voce', 'Base (tutti)', ...(G.length ? G : ['(nome area/gruppo)'])].map((v) => ({ v, s: XS.colHead })),
    ],
  }
  ITEMS_5P.forEach((it) => {
    const P5 = PS.find((x) => x.k === it.cod[0])!
    at.rows.push([{ v: it.cod, s: XS.num }, { v: `${P5.k} · ${P5.n}`, s: XS.cell }, { v: it.area, s: XS.cell }, { v: ex100(S.exp.base[it.cod]), s: XS.edit }, ...gcols.map((g) => ({ v: g ? ex100(S.exp.groups[g]?.[it.cod]) : '', s: XS.edit }))])
  })
  const ist: XSheet = { name: 'ISTRUZIONI', cols: [6, 120], heights: { 0: 26 }, merges: ['A1:B1'], landscape: true, rows: [[{ v: 'COME COMPILARE IL FILE', s: XS.title }, { v: '', s: XS.title }], ...ISTRUZIONI.map((t, i): XCell[] => [{ v: i + 1, s: XS.num }, { v: t, s: XS.wrap }])] }
  const sheets = [el, valSheet('VALUTATORI DIRIGENTI', 'DIR', 15), valSheet('VALUTATORI PEER (Colleghi)', 'PEER', 10), au, at, ist]
  if (!empty) {
    const cr = controlRows(S)
    if (cr.length) sheets.push(simpleSheet('CONTROLLO', `CONTROLLO DEL PIANO · correzioni e punti da decidere${S.log ? ` · le celle si riferiscono al file importato: ${S.log.file}` : ''}`, ['Esito', 'Foglio', 'Cella', 'Scritto nel file', 'Interpretato come', 'Nota'], cr, [18, 26, 8, 30, 32, 60]))
  }
  sheets.push(nomi)
  const blob = (await buildXlsx(sheets, [{ name: 'Nomi', ref: `NOMI!$A$1:$A$${NN}` }])) as Blob
  saveFile(empty ? 'Modello_piano_valutazione_5P.xlsx' : `Piano_valutazione_5P_${slug(S.company)}_${today()}.xlsx`, blob)
}

// ---------- schede HTML per i valutatori ----------
// Un file per valutatore, che si apre con il browser: guida (benvenuto, modello
// 5P, come dare il voto, domande frequenti), le persone da valutare con le 25
// domande, «Non so valutare», «Concludi e invia». I colori si leggono dai token
// della piattaforma al momento di generarla (chiaro e scuro).
export const evalFile = (v: string) => `Scheda_5P_${slug(v)}.html`
const escHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c as '&'])
const TOKENS = ['background', 'foreground', 'card', 'muted', 'muted-foreground', 'border', 'border-strong', 'primary', 'primary-foreground', 'success', 'warning', 'destructive', 'ring']
function readTokens(): { light: string; dark: string } {
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
  return { light, dark }
}
export function buildEval(S: State5p, v: string, force?: 'light' | 'dark'): string {
  const tk = readTokens()
  const css = `:root{${tk.light}}@media (prefers-color-scheme:dark){:root{${tk.dark}}}` + (force ? `:root{${force === 'dark' ? tk.dark : tk.light}}` : '')
  const data = { pianoId: S.pianoId, azienda: S.company || '', valutatore: v, scadenza: S.mail.scad || '', emailHR: S.mail.emailHR || '', PS: PS.map((p) => ({ k: p.k, n: p.n, d: p.d })), ITEMS: ITEMS_5P.map((i) => [i.cod, i.area, i.q, `1=${i.low} | 5=${i.mid} | 10=${i.high}`]), persone: listFor(S, v) }
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return schedaTemplate.replace('/*SVTOKENS*/', () => css).replace('/*SVDATA*/null', () => json).replace('<title>Scheda di valutazione 5P</title>', () => `<title>Scheda 5P – ${escHtml(v)}</title>`)
}

// ---------- email ----------
function fillText(S: State5p, t: string, ev: Evaluator) {
  const p = personByName(S, ev.name)
  const first = p && p.nom ? cap(p.nom) : ev.name
  const lines: string[] = []
  if (ev.DIR.length) lines.push(`- come responsabile: ${ev.DIR.join(', ')}`)
  if (ev.PEER.length) lines.push(`- come collega: ${ev.PEER.join(', ')}`)
  if (ev.AUTO) lines.push('- te stesso (autovalutazione)')
  let s = t
    .split('\n')
    .filter((l) => S.mail.scad || !l.includes('{SCADENZA}'))
    .join('\n')
  if (!S.mail.emailHR) s = s.replace(/\ba \{EMAIL_HR\}/g, "all'ufficio HR")
  return s
    .replace(/\{NOME\}/g, first)
    .replace(/\{ELENCO\}/g, lines.join('\n'))
    .replace(/\{SCADENZA\}/g, S.mail.scad || '')
    .replace(/\{EMAIL_HR\}/g, S.mail.emailHR || "l'ufficio HR")
}
export function mailFor(S: State5p, ev: Evaluator) {
  return { subj: (S.mail.subj || DEF_SUBJ) + (S.company ? ` – ${S.company}` : ''), body: fillText(S, S.mail.body || DEF_BODY, ev) }
}
const b64 = (s: string) => btoa(unescape(encodeURIComponent(s)))
const wrap76 = (s: string) => s.replace(/.{1,76}/g, '$&\r\n')
const ascii = (s: string) => /^[\x20-\x7e]*$/.test(s)
const encW = (s: string) => (ascii(s) ? s : `=?UTF-8?B?${b64(s)}?=`)
function buildEml(to: string, name: string, subj: string, body: string, fname: string, html: string) {
  const B = `----=_SV5P_${Math.random().toString(36).slice(2, 10)}`
  return [
    'X-Unsent: 1',
    `To: ${ascii(name) ? `"${name.replace(/"/g, '')}"` : encW(name)} <${to}>`,
    `Subject: ${encW(subj)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${B}"`,
    '',
    `--${B}`,
    'Content-Type: text/plain; charset="utf-8"',
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(b64(body)),
    `--${B}`,
    `Content-Type: text/html; charset="utf-8"; name="${fname}"`,
    `Content-Disposition: attachment; filename="${fname}"`,
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(b64(html)),
    `--${B}--`,
    '',
  ].join('\r\n')
}
const INVIO_HEAD = ['Valutatore', 'Email', 'Email pronta', 'Scheda allegata', 'Valuta come dirigente', 'Valuta come collega', 'Autovalutazione']
function invioRows(S: State5p, evs: Evaluator[]) {
  return evs.map((ev) => {
    const p = personByName(S, ev.name)
    return [ev.name, p?.email || '— manca —', p?.email ? `${slug(ev.name)}.eml` : '', evalFile(ev.name), ev.DIR.join(', ') || '—', ev.PEER.join(', ') || '—', ev.AUTO ? 'SÌ' : '—']
  })
}
const invioSheet = (S: State5p, evs: Evaluator[], title: string) => simpleSheet('Elenco invii', title, INVIO_HEAD, invioRows(S, evs), [26, 30, 26, 30, 50, 50, 14])
/** ZIP con un'email .eml per valutatore (destinatario, testo e scheda allegata), le schede e l'elenco invii. Restituisce chi non ha l'email. */
export async function downloadEmails(S: State5p): Promise<{ n: number; miss: string[] } | null> {
  const evs = allEvaluators(S)
  if (!evs.length) return null
  const { default: JSZip } = await import('jszip')
  const z = new JSZip()
  let n = 0
  const miss: string[] = []
  evs.forEach((ev) => {
    const p = personByName(S, ev.name)
    const html = buildEval(S, ev.name)
    const fname = evalFile(ev.name)
    z.file(`Schede/${fname}`, html)
    if (p && p.email) {
      const m = mailFor(S, ev)
      z.file(`Email/${slug(ev.name)}.eml`, buildEml(p.email, ev.name, m.subj, m.body, fname, html))
      n++
    } else miss.push(ev.name)
  })
  z.file('00_Elenco_invii.xlsx', (await buildXlsx([invioSheet(S, evs, `ELENCO INVII · ${S.company || ''} · una email per valutatore`)], [], 'uint8array')) as Uint8Array)
  z.file(
    '00_LEGGIMI.txt',
    (
      "Email pronte per l'invio delle schede 5P\n\nCartella Email: un file .eml per ogni valutatore, con destinatario, testo e scheda allegata.\n- Con Outlook per Windows: doppio clic sul file, si apre il messaggio pronto, premi Invia.\n- Con altri programmi di posta il file si apre come messaggio ricevuto: usa \"Modifica come nuovo\" o \"Inoltra\", oppure usa il pulsante Email della piattaforma e allega la scheda.\n\nCartella Schede: le schede in HTML, una per valutatore.\n" +
      (miss.length ? `\nSENZA EMAIL (${miss.length}), da inviare a mano allegando la scheda:\n${miss.join('\n')}\n` : '')
    ).replace(/\n/g, '\r\n'),
  )
  saveFile(`Email_valutatori_5P_${slug(S.company)}_${today()}.zip`, await z.generateAsync({ type: 'blob', compression: 'DEFLATE' }))
  return { n, miss }
}
export async function downloadSchedeZip(S: State5p): Promise<boolean> {
  const evs = allEvaluators(S)
  if (!evs.length) return false
  const { default: JSZip } = await import('jszip')
  const z = new JSZip()
  evs.forEach((ev) => z.file(evalFile(ev.name), buildEval(S, ev.name)))
  z.file('00_Elenco_invii.xlsx', (await buildXlsx([invioSheet(S, evs, `ELENCO INVII · ${S.company || ''}`)], [], 'uint8array')) as Uint8Array)
  saveFile(`Schede_valutatori_5P_${slug(S.company)}_${today()}.zip`, await z.generateAsync({ type: 'blob', compression: 'DEFLATE' }))
  return true
}

// ---------- alternative: schede Excel e modulo Forms ----------
function sheetFor(X: XlsxMod, valutato: string, ruolo: string, tipo: SourceKey, valutatore: string) {
  const aoa: unknown[][] = [
    [, `VALUTAZIONE 5P – ${SRC[tipo].lab.toUpperCase()}`],
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
export async function downloadSchedeXlsx(S: State5p): Promise<boolean> {
  const evs = allEvaluators(S)
  if (!evs.length) return false
  const [X, { default: JSZip }] = await Promise.all([loadXlsx(), import('jszip')])
  const zip = new JSZip()
  evs.forEach((ev) => {
    const wb = X.utils.book_new()
    const used = new Set<string>()
    listFor(S, ev.name).forEach((x) => X.utils.book_append_sheet(wb, sheetFor(X, x.valutato, x.ruolo, x.tipo, ev.name), safeSheet((x.tipo === 'AUTO' ? 'AUTO ' : x.tipo === 'DIR' ? 'DIR ' : 'PEER ') + x.valutato, used)))
    zip.file(`Valutatore_${slug(ev.name)}.xlsx`, X.write(wb, { bookType: 'xlsx', type: 'array' }))
  })
  saveFile(`Schede_Excel_5P_${slug(S.company)}_${today()}.zip`, await zip.generateAsync({ type: 'blob' }))
  return true
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
  const ex = ['ROSSI Mario', 'Collega', 'VERDI Anna', today(), ...CODES.map(() => 7), 'Esempio: ha guidato il passaggio al nuovo gestionale']
  const wb = X.utils.book_new()
  X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([head, ex]), 'Risposte')
  const info = X.utils.aoa_to_sheet([
    ['Come usarlo con Microsoft Forms o Google Forms'],
    ['1. Domanda "Valutato" (elenco a discesa con i nomi)'],
    ['2. Domanda "Tipo valutazione": Dirigente / Collega / Autovalutazione'],
    ['3. Domanda "Valutatore" (nome di chi compila)'],
    ['4. 25 domande con scala 1-10, il cui titolo INIZIA con il codice: "A1 – Competenze tecniche", "A2 – ..." fino a "E5"'],
    ['5. Esportare le risposte in Excel e caricarle nella Raccolta: il sistema riconosce le colonne dai codici A1…E5'],
  ])
  X.utils.book_append_sheet(wb, info, 'Istruzioni')
  saveFile('Modello_Forms_5P.xlsx', wbBlob(X, wb))
}

// ---------- esportazione dei risultati e del report ----------
export async function exportResults(S: State5p): Promise<boolean> {
  const R = allResults(S)
  if (!R.length) return false
  const n = (v: number | null) => rd(v) ?? ''
  const head = ['Persona', 'Gruppo', 'Dirigenti', 'Colleghi', 'Autovalutazione']
  PS.forEach((P) => ['Voto', 'Atteso', 'Gap', 'Auto', 'Diff.'].forEach((t) => head.push(`${P.k} ${t}`)))
  ;['Voto', 'Atteso', 'Gap', 'Auto', 'Diff.'].forEach((t) => head.push(`5P ${t}`))
  const rows = R.map((r) => {
    const a: (string | number)[] = [r.name, r.p.gruppo || '', r.nDir, r.nPeer, r.nAuto ? 'SÌ' : 'NO']
    ;[...PS.map((P) => r.P[P.k]), r.T].forEach((x) => a.push(n(x.o), n(x.x), dd(x.o, x.x) ?? '', n(x.a), dd(x.a, x.o) ?? ''))
    return a
  })
  const det: (string | number)[][] = []
  R.forEach((r) =>
    CODES.forEach((c) => {
      const x = r.it[c]
      det.push([r.name, r.p.gruppo || '', c, ITEM_NAME[c], n(x.o), n(x.x), dd(x.o, x.x) ?? '', n(x.a), dd(x.a, x.o) ?? '', x.n])
    }),
  )
  const raw = S.evals.map((e) => [e.valutato, SRC[e.tipo].lab, e.valutatore || '', e.data || '', e.source || '', ...CODES.map((c) => e.scores[c] ?? '')])
  const par = [
    ['Azienda', S.company || ''],
    ['Data', today()],
    ['Scala', '0–100 (voto 1–10 × 10, arrotondato all’intero)'],
    ['Voto', 'media di tutte le valutazioni di dirigenti e colleghi; autovalutazione esclusa'],
    ['Skill gap', 'voto − valore atteso'],
    ['Differenza', 'autovalutazione − voto'],
    ['Soglie', `gap ≥ 0 raggiunto · da −1 a −${THR - 1} vicino · ≤ −${THR} da sviluppare`],
  ]
  const blob = (await buildXlsx([
    simpleSheet('Riepilogo 5P', `RISULTATI 5P · ${S.company || ''} · scala 0–100 · voto = media di dirigente e colleghi, autovalutazione esclusa`, head, rows, [28, 18, 10, 10, 14, ...Array(head.length - 5).fill(9)], { freeze: { r: 2, c: 1 } }),
    simpleSheet('Dettaglio voci', 'DETTAGLIO PER VOCE · gap = voto − atteso · diff. = autovalutazione − voto', ['Persona', 'Gruppo', 'Codice', 'Voce', 'Voto', 'Atteso', 'Skill gap', 'Autovalutazione', 'Differenza', 'N. valutazioni'], det, [28, 18, 8, 36, 9, 9, 10, 14, 11, 13]),
    simpleSheet('Valutazioni (riservato)', 'VALUTAZIONI CARICATE · riservato HR', ['Valutato', 'Tipo', 'Valutatore', 'Data', 'Origine', ...CODES], raw, [26, 14, 26, 11, 30, ...CODES.map(() => 5)]),
    simpleSheet('Parametri', 'PARAMETRI DI CALCOLO', ['Voce', 'Valore'], par, [18, 90]),
  ])) as Blob
  saveFile(`Risultati_5P_${slug(S.company)}_${today()}.xlsx`, blob)
  return true
}
export async function exportRep(S: State5p, p: Person) {
  const r = resultOf(S, p)
  const n = (v: number | null) => rd(v) ?? ''
  const head = ['Area', 'Voto', 'Valore atteso', 'Skill gap', 'Autovalutazione', 'Differenza']
  const rowsP = [...PS.map((P) => ({ l: `${P.k} · ${P.n}`, x: r.P[P.k] })), { l: 'Totale 5P', x: r.T }].map(({ l, x }) => [l, n(x.o), n(x.x), dd(x.o, x.x) ?? '', n(x.a), dd(x.a, x.o) ?? ''])
  const rowsI = CODES.map((c) => {
    const x = r.it[c]
    return [`${c} · ${ITEM_NAME[c]}`, n(x.o), n(x.x), dd(x.o, x.x) ?? '', n(x.a), dd(x.a, x.o) ?? '']
  })
  const sh = simpleSheet('Report', `REPORT 5P · ${r.name}${p.gruppo ? ` · ${p.gruppo}` : ''} · scala 0–100`, head, [...rowsP, ['', '', '', '', '', ''], ['DETTAGLIO PER VOCE', '', '', '', '', ''], ...rowsI], [40, 10, 14, 11, 16, 12])
  saveFile(`Report_5P_${slug(r.name)}.xlsx`, (await buildXlsx([sh])) as Blob)
}

// ---------- progetto ----------
export function saveProject(S: State5p) {
  saveFile(`Progetto_5P_${slug(S.company)}_${today()}.json`, new Blob([JSON.stringify({ format: 'sv5p-progetto', v: 5, salvato: new Date().toISOString(), stato: S })], { type: 'application/json' }))
}
export async function openProject(f: File): Promise<State5p> {
  let o: { format?: string; stato?: Partial<State5p> }
  try {
    o = JSON.parse(await f.text()) as typeof o
  } catch {
    throw new Error('il file non si legge: scegli il file .json salvato con «Salva progetto»')
  }
  if (o && o.format === 'sv5p-risposte') throw new Error('questo è il file risposte di un valutatore: caricalo nella pagina Raccolta')
  if (!o || o.format !== 'sv5p-progetto' || !o.stato) throw new Error('non è un file progetto 5P')
  const s = normalizeState(o.stato)
  s.demo = false
  return s
}

// ---------- dati del profilo di una persona ----------
export function saveDashboardPayload(p: Dash5pPayload) {
  saveFile(`Profilo_5P_${slug(p.person.name)}_${today()}.json`, new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' }))
}
