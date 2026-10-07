import { ITEMS_5P } from '@/modules/assessment/gestione5p/items'
import { CODES, PS, SRC, type Result, type SourceKey, type State5p, compute, gapOf, level, personByName, slug, today } from '@/modules/assessment/gestione5p/model'

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
  const X = await loadXlsx()
  const ws = X.utils.aoa_to_sheet([['Nome e cognome', 'Ruolo', 'Reparto', 'Responsabile'], ['Mario Rossi', 'Responsabile produzione', 'Produzione', 'Laura Bianchi'], ['Giulia Neri', 'Operatrice CNC', 'Produzione', 'Mario Rossi']])
  ws['!cols'] = [{ wch: 26 }, { wch: 28 }, { wch: 20 }, { wch: 26 }]
  const wb = X.utils.book_new()
  X.utils.book_append_sheet(wb, ws, 'Anagrafica')
  saveFile('Modello_anagrafica_5P.xlsx', wbBlob(X, wb))
}
export async function downloadPlan(S: State5p) {
  const X = await loadXlsx()
  const ws = X.utils.aoa_to_sheet([
    ['Valutatore', 'Tipo valutazione', 'Valutato', 'Ruolo valutato', 'Reparto'],
    ...S.plan.map((x) => {
      const p = personByName(S, x.valutato)
      return [x.valutatore, SRC[x.tipo].lab, x.valutato, p?.ruolo || '', p?.reparto || '']
    }),
  ])
  ws['!cols'] = [{ wch: 24 }, { wch: 18 }, { wch: 24 }, { wch: 28 }, { wch: 18 }]
  const wb = X.utils.book_new()
  X.utils.book_append_sheet(wb, ws, 'Piano')
  saveFile(`Piano_valutazioni_5P_${slug(S.company)}.xlsx`, wbBlob(X, wb))
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
