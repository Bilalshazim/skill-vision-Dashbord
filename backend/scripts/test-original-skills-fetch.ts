// Chiamata di prova all'API Original Skills (PROPOSTA-ORIGINAL-SKILLS.md).
// Stampa SOLO la struttura della risposta: esito HTTP, tempi, campi, tipi,
// conteggi, intervalli numerici, formati mascherati e le verifiche fra campi.
// Mai nomi, email, date di nascita o altri dati di persone; mai credenziali
// né codici azienda. Non scrive niente, da nessuna parte.
//
// Credenziali e codici arrivano solo dall'ambiente: con `railway run` li
// inietta Railway, senza che passino da file, Git o cronologia.
//
// Uso (da backend/, dopo `npm run build`):
//   railway run --service Backend node dist/scripts/test-original-skills-fetch.js
//   railway run --service Backend node dist/scripts/test-original-skills-fetch.js --from 2026-07-05 --to 2026-10-01
//
// Variabili lette:
//   ORIGINAL_SKILLS_API_URL, ORIGINAL_SKILLS_AUTH_KEY, ORIGINAL_SKILLS_AUTH_COMPANY
//   ORIGINAL_SKILLS_COMPANY_MAP   JSON {"<companyId>": "<codAzienda>", …}: la fonte normale dei codici
//   ORIGINAL_SKILLS_TEST_CODES    ripiego temporaneo finché la mappa non c'è: codici separati da virgola,
//                                 passati solo sulla riga di comando, mai scritti in un file
// Intervallo di default: gli ultimi 30 giorni. L'API rifiuta 90 giorni o più.

type Json = null | boolean | number | string | Json[] | { [k: string]: Json }

const MAX_DAYS = 89

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : undefined
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10)

function codesFromEnv(): { codes: string[]; source: string } {
  const map = process.env.ORIGINAL_SKILLS_COMPANY_MAP
  if (map) {
    try {
      const parsed = JSON.parse(map) as Record<string, string>
      const codes = [...new Set(Object.values(parsed).filter((c) => typeof c === 'string' && c.trim()))]
      return { codes, source: `ORIGINAL_SKILLS_COMPANY_MAP (${Object.keys(parsed).length} società)` }
    } catch {
      throw new Error('ORIGINAL_SKILLS_COMPANY_MAP non è un JSON valido: atteso {"<companyId>": "<codAzienda>", …}')
    }
  }
  const test = (process.env.ORIGINAL_SKILLS_TEST_CODES || '').split(',').map((c) => c.trim()).filter(Boolean)
  return { codes: test, source: 'ORIGINAL_SKILLS_TEST_CODES (ripiego temporaneo)' }
}

// Forma di una stringa senza il suo contenuto.
function kindOf(v: Json): string {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  if (typeof v !== 'string') return typeof v
  if (v === '') return 'string(vuota)'
  if (/^\d{4}-\d{2}-\d{2}([T ][\d:.]+)?(Z|[+-]\d{2}:?\d{2})?$/.test(v)) return 'string(data/ora)'
  if (/^[^@\s]+@[^@\s]+$/.test(v)) return 'string(email)'
  if (/^-?\d+([.,]\d+)?$/.test(v)) return 'string(numero)'
  return 'string(testo)'
}
const mask = (s: string) => s.replace(/[0-9]/g, '9').replace(/[A-Za-zÀ-ÿ]/g, 'a')

type Stat = { n: number; kinds: Map<string, number>; min: number; max: number; ints: boolean; lenMin: number; lenMax: number; arrMin: number; arrMax: number; masks: Set<string> }

function walk(v: Json, p: string, stats: Map<string, Stat>) {
  let s = stats.get(p)
  if (!s) {
    s = { n: 0, kinds: new Map(), min: Infinity, max: -Infinity, ints: true, lenMin: Infinity, lenMax: 0, arrMin: Infinity, arrMax: 0, masks: new Set() }
    stats.set(p, s)
  }
  const k = kindOf(v)
  s.n++
  s.kinds.set(k, (s.kinds.get(k) || 0) + 1)
  const num = typeof v === 'number' ? v : k === 'string(numero)' ? Number(String(v).replace(',', '.')) : NaN
  if (!Number.isNaN(num)) {
    s.min = Math.min(s.min, num)
    s.max = Math.max(s.max, num)
    if (!Number.isInteger(num)) s.ints = false
  }
  if (typeof v === 'string') {
    s.lenMin = Math.min(s.lenMin, v.length)
    s.lenMax = Math.max(s.lenMax, v.length)
    // Il formato mascherato si mostra solo per date e numeri: non rivela niente.
    if ((k === 'string(data/ora)' || k === 'string(numero)') && s.masks.size < 4) s.masks.add(mask(v))
  }
  if (Array.isArray(v)) {
    s.arrMin = Math.min(s.arrMin, v.length)
    s.arrMax = Math.max(s.arrMax, v.length)
    for (const x of v) walk(x, `${p}[]`, stats)
  } else if (v && typeof v === 'object') {
    for (const [kk, vv] of Object.entries(v)) walk(vv, `${p}.${kk}`, stats)
  }
}

async function main() {
  const url = process.env.ORIGINAL_SKILLS_API_URL
  const key = process.env.ORIGINAL_SKILLS_AUTH_KEY
  const company = process.env.ORIGINAL_SKILLS_AUTH_COMPANY
  const missing = [!url && 'ORIGINAL_SKILLS_API_URL', !key && 'ORIGINAL_SKILLS_AUTH_KEY', !company && 'ORIGINAL_SKILLS_AUTH_COMPANY'].filter(Boolean)
  if (missing.length) throw new Error(`Variabili mancanti: ${missing.join(', ')}. Lancia lo script con: railway run --service Backend …`)

  const { codes, source } = codesFromEnv()
  if (!codes.length) throw new Error('Nessun codice azienda: imposta ORIGINAL_SKILLS_COMPANY_MAP su Railway (o, solo per una prova, ORIGINAL_SKILLS_TEST_CODES sulla riga di comando).')

  const to = arg('--to') ?? isoDay(new Date())
  const from = arg('--from') ?? isoDay(new Date(Date.parse(to) - 30 * 86400000))
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) throw new Error('Date non valide: formato AAAA-MM-GG.')
  const days = Math.round((Date.parse(to) - Date.parse(from)) / 86400000)
  if (days < 0) throw new Error('--from è dopo --to.')
  if (days > MAX_DAYS) throw new Error(`Intervallo di ${days} giorni: l'API accetta meno di 90 giorni (massimo ${MAX_DAYS}).`)

  const endpoint = new URL(url!)
  console.log(`Endpoint: ${endpoint.origin}${endpoint.pathname}`)
  console.log(`Intervallo: ${from} → ${to} (${days} giorni) · codici azienda: ${codes.length}, da ${source}\n`)

  const t0 = Date.now()
  const res = await fetch(url!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authKey: key!, authCompany: company! },
    body: JSON.stringify({ dataDa: from, dataA: to, lingua: 'IT', codAzienda: codes }),
    signal: AbortSignal.timeout(30000),
  })
  const ms = Date.now() - t0
  const text = await res.text()
  console.log(`HTTP ${res.status} · ${ms} ms · ${res.headers.get('content-type') ?? '?'} · ${text.length} byte`)

  let body: Json
  try {
    body = JSON.parse(text) as Json
  } catch {
    console.log('La risposta non è JSON.')
    process.exitCode = 1
    return
  }
  if (!res.ok) {
    // Gli errori dell'API sono {Cause, Detail}: messaggi tecnici, non dati di persone.
    const err = body as Record<string, Json>
    for (const k of ['Cause', 'Detail']) if (typeof err?.[k] === 'string') console.log(`${k}: ${String(err[k]).slice(0, 200)}`)
    process.exitCode = 1
    return
  }
  if (!Array.isArray(body)) {
    console.log(`Forma inattesa: ${kindOf(body)} invece di un array.`)
    process.exitCode = 1
    return
  }
  console.log(`Persone: ${body.length}`)
  if (!body.length) {
    console.log('Nessun test completato nell’intervallo: prova un periodo più lungo (massimo 89 giorni).')
    return
  }

  const stats = new Map<string, Stat>()
  walk(body, '$', stats)
  console.log('\nCampo | occorrenze | tipi | dettagli')
  for (const [p, s] of stats) {
    if (p === '$') continue
    const kinds = [...s.kinds].map(([k, n]) => (s.kinds.size > 1 ? `${k}×${n}` : k)).join(', ')
    const det = [
      s.min !== Infinity ? `valori ${s.min} … ${s.max}${s.ints ? ' (interi)' : ''}` : '',
      s.lenMax ? `lunghezza ${s.lenMin} … ${s.lenMax}` : '',
      s.arrMax ? `elementi ${s.arrMin} … ${s.arrMax}` : '',
      s.masks.size ? `formato ${[...s.masks].join(' ')}` : '',
    ].filter(Boolean).join(' · ')
    console.log(`${p} | ${s.n} | ${kinds} | ${det}`)
  }

  // Le verifiche fra campi su cui si basa la traduzione nel server (§3.2).
  type Row = Record<string, Json>
  const rows = body as Row[]
  const num = (v: Json) => Number(String(v).replace(',', '.'))
  let sameRank = 0, diffOk = 0, diffN = 0, roleIn = 0, roleN = 0
  const names = new Set<string>()
  const perCode = new Map<string, number>()
  for (const r of rows) {
    if (r.risultato === r.graduatoria) sameRank++
    const comp = Array.isArray(r.competenze) ? (r.competenze as Row[]) : []
    const byName = new Map(comp.map((c) => [String(c.nome).trim(), c.punteggio]))
    for (const c of comp) names.add(String(c.nome).trim())
    for (const c of (Array.isArray(r['competenze ruolo']) ? r['competenze ruolo'] : []) as Row[]) {
      roleN++
      if (byName.get(String(c.nome).trim()) === c.punteggio) roleIn++
      diffN++
      if (Math.abs(num(c.punteggio) - num(c['valore atteso']) - num(c.diff)) < 0.011) diffOk++
    }
    const code = String(r.codAzienda ?? '')
    perCode.set(code, (perCode.get(code) || 0) + 1)
  }
  console.log('\nVerifiche:')
  console.log(`  risultato = graduatoria: ${sameRank} su ${rows.length}`)
  console.log(`  diff = punteggio − valore atteso: ${diffOk} su ${diffN}`)
  console.log(`  competenze ruolo presenti in competenze, stesso punteggio: ${roleIn} su ${roleN}`)
  console.log(`  competenze distinte: ${names.size}${names.size === 36 ? ' (come previsto)' : ' — ATTESE 36: controlla la tabella del §3.2'}`)
  // «società N» segue l'ordine dei codici nella configurazione: stabile fra
  // un'esecuzione e l'altra, e il codice non si stampa.
  // Le righe dell'account API (codAzienda = authCompany) l'API le restituisce
  // SEMPRE, qualunque codice si chieda (verificato il 2026-10-03): il server
  // dovrà scartarle, altrimenti finiscono nella vista di un cliente.
  const societa = (code: string) =>
    codes.indexOf(code) >= 0 ? `società ${codes.indexOf(code) + 1}` : code === company ? 'account API (authCompany)' : 'codice non richiesto'
  console.log(`  persone per società: ${codes.map((c) => `${societa(c)}: ${perCode.get(c) ?? 0}`).join(' · ')}`)
  const extra = rows.filter((r) => !codes.includes(String(r.codAzienda ?? '')))
  if (extra.length) {
    const own = extra.filter((r) => String(r.codAzienda) === company).length
    console.log(`  ATTENZIONE: ${extra.length} righe con un codAzienda non richiesto (${own} dell'account API): da scartare nel server`)
  }

  // Competenze per società: i nomi delle competenze non sono dati personali.
  // Se le società usano questionari diversi, la tabella del §3.2 va estesa.
  const namesByCode = new Map<string, Map<string, number>>()
  const countsByCode = new Map<string, Set<number>>()
  const dupes = new Set<string>()
  for (const r of rows) {
    const code = String(r.codAzienda ?? '')
    const comp = Array.isArray(r.competenze) ? (r.competenze as Row[]) : []
    if (!namesByCode.has(code)) namesByCode.set(code, new Map())
    if (!countsByCode.has(code)) countsByCode.set(code, new Set())
    countsByCode.get(code)!.add(comp.length)
    const seen = new Set<string>()
    for (const c of comp) {
      const n = String(c.nome).trim()
      if (seen.has(n)) dupes.add(`${societa(code)}: «${n}»`)
      seen.add(n)
      namesByCode.get(code)!.set(n, (namesByCode.get(code)!.get(n) || 0) + 1)
    }
  }
  if (namesByCode.size > 1 || names.size !== 36) {
    const label = new Map([...namesByCode.keys()].map((c) => [c, societa(c)]))
    console.log('\nCompetenze per società:')
    for (const [code, m] of namesByCode) console.log(`  ${label.get(code)}: ${m.size} competenze distinte; per persona: ${[...countsByCode.get(code)!].join(', ')}`)
    const all = [...namesByCode.values()]
    const common = [...names].filter((n) => all.every((m) => m.has(n)))
    console.log(`  in comune a tutte: ${common.length}`)
    if (dupes.size) console.log(`  voci ripetute nella stessa persona: ${[...dupes].join(' · ')}`)
    for (const [code, m] of namesByCode) {
      const only = [...m.keys()].filter((n) => !common.includes(n)).sort()
      if (only.length) console.log(`  solo ${label.get(code)}: ${only.join(' | ')}`)
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exitCode = 1
})
