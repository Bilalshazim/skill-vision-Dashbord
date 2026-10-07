import { useMemo, useState } from 'react'

import { Logo } from '@/layouts/Logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { ITEMS_5P } from '@/modules/assessment/gestione5p/items'
import { LEVEL_TONE } from '@/modules/assessment/gestione5p/level-style'
import { PS, type ResponsesPayload, type SourceKey, decodeSheet, deliverToPlatform, level, norm } from '@/modules/assessment/gestione5p/model'
import { ScoreBar } from '@/modules/assessment/gestione5p/ScoreBar'
import { readSharedTheme } from '@/modules/assessment/lib/shell-bridge'

const TIPO: Record<SourceKey, string> = { DIR: 'Valutazione del Responsabile', PEER: 'Valutazione del Collega', AUTO: 'Autovalutazione' }
const SCALE: [number, number, string, string][] = [
  [1, 2, 'Non adeguato', 'Il comportamento è assente o nettamente al di sotto delle aspettative del ruolo'],
  [3, 4, 'In sviluppo', 'Il comportamento è presente in modo discontinuo; richiede supporto frequente'],
  [5, 6, 'Adeguato', 'Il comportamento è stabile e coerente con le aspettative standard del ruolo'],
  [7, 8, 'Avanzato', 'Il comportamento supera le aspettative; è un punto di riferimento per il team'],
  [9, 10, 'Eccellente', 'Il comportamento è un benchmark aziendale; trasferisce valore agli altri'],
]
const SCALE_BG = ['surface-danger', 'surface-warning', 'bg-muted', 'surface-success', 'border-2 border-foreground bg-card'] as const
type Answers = Record<number, { scores: Record<string, number>; notes: Record<string, string> }>
type View = 'istr' | 'fine' | number

const hashId = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h).toString(36)
}

// La scheda del valutatore (Scheda_5P_<nome>.html, Foglio 7): a sinistra
// "Istruzioni e scala", le "Persone da valutare" con l'avanzamento (0/25,
// 8/25, ✓) e "Concludi e invia"; al centro le istruzioni, poi le 25 domande
// delle 5P per persona con la barra 1–10 e gli ancoraggi 1, 5, 10. Si apre dal
// link del piano (i dati stanno nell'indirizzo, dopo il #); le risposte si
// salvano nel browser a ogni voto. Alla fine si inviano alla piattaforma (se
// la scheda è nello stesso browser del piano) oppure si scarica il file.
export default function AssessmentScheda5pPage() {
  const code = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('d') || ''
  const D = useMemo(() => decodeSheet(code), [code])
  const key = D ? `sv5p_ans_${hashId(code)}_${D.v}` : ''
  const [A, setA] = useState<Answers>(() => {
    try {
      return key ? (JSON.parse(localStorage.getItem(key) || '{}') as Answers) : {}
    } catch {
      return {}
    }
  })
  const [cur, setCur] = useState<View>('istr')
  const [msg, setMsg] = useState('')
  const theme = readSharedTheme()

  if (!D) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4" data-theme={theme} data-module="assessment" data-portal-scope>
        <p className="max-w-md rounded-lg border border-border p-6 text-app-small">Link non valido: è incompleto. Chiedi a chi te l&apos;ha inviato un link nuovo.</p>
      </div>
    )
  }
  const persone = D.p
  const get = (i: number) => A[i] || { scores: {}, notes: {} }
  const done = (i: number) => Object.keys(get(i).scores).length
  const total = persone.length * 25
  const filled = persone.reduce((s, _, i) => s + done(i), 0)
  const persist = (n: Answers) => {
    setA(n)
    try {
      localStorage.setItem(key, JSON.stringify(n))
    } catch {
      /* archivio non disponibile */
    }
  }
  const setScore = (i: number, c: string, v: number | null) => {
    const a = get(i)
    const scores = { ...a.scores }
    if (v == null) delete scores[c]
    else scores[c] = v
    persist({ ...A, [i]: { ...a, scores } })
  }
  const setNote = (i: number, c: string, t: string) => {
    const a = get(i)
    const notes = { ...a.notes }
    if (t.trim()) notes[c] = t.trim()
    else delete notes[c]
    persist({ ...A, [i]: { ...a, notes } })
  }
  const go = (v: View) => {
    setCur(v)
    window.scrollTo(0, 0)
  }
  const fname = `Risposte_5P_${String(D.v).replace(/[^\w]+/g, '_')}.json`
  const payload = (): ResponsesPayload => ({
    format: 'sv5p-risposte',
    v: 1,
    azienda: D.a,
    valutatore: D.v,
    creato: new Date().toISOString(),
    valutazioni: persone.map((p, i) => ({ valutato: p.n, tipo: p.t, ruolo: p.r, scores: get(i).scores, notes: get(i).notes })).filter((x) => Object.keys(x.scores).length),
  })
  const json = JSON.stringify(payload())
  const codeText = `SV5P:${btoa(unescape(encodeURIComponent(json)))}`
  const canDeliver = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('sv5p_state_v1') || 'null') as { plan?: { valutatore: string }[] } | null
      return !!s?.plan?.some((x) => norm(x.valutatore) === norm(D.v))
    } catch {
      return false
    }
  })()

  const sideBtn = (active: boolean) => cn('grid grid-cols-[1fr_auto] gap-x-2 rounded-md border px-3 py-2.5 text-left transition-colors hover:border-primary', active ? 'border-2 border-primary' : 'border-border')

  return (
    <div className="min-h-screen bg-background text-foreground" data-theme={theme} data-module="assessment" data-portal-scope>
      <header className="sticky top-0 z-(--z-sticky) border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Logo />
          <div>
            <h1 className="text-app-section">Scheda di valutazione 5P</h1>
            <div className="text-app-caption text-muted-foreground">
              Valutatore: {D.v}
              {D.a ? ` · ${D.a}` : ''}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3 text-app-caption">
            <span className="font-mono tabular-nums">
              {filled} / {total} voti
            </span>
            <div className="h-2 w-40 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${filled} voti su ${total}`}>
              <div className="h-full bg-success" style={{ width: `${total ? (filled / total) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-4 pt-5 pb-16 md:grid-cols-[17rem_1fr]">
        <aside className="flex min-w-0 flex-col gap-1.5" aria-label="Elenco">
          <button type="button" className={sideBtn(cur === 'istr')} aria-current={cur === 'istr'} onClick={() => go('istr')}>
            <span className="font-medium">Istruzioni e scala</span>
            <small className="col-start-1 text-app-caption text-muted-foreground">Da leggere prima di iniziare</small>
            <span className="col-start-2 row-span-2 row-start-1 self-center font-mono text-app-caption">ⓘ</span>
          </button>
          <h3 className="label-mono mt-3 text-muted-foreground">Persone da valutare ({persone.length})</h3>
          {persone.map((p, i) => {
            const d = done(i)
            return (
              <button key={`${p.t}-${p.n}`} type="button" className={sideBtn(cur === i)} aria-current={cur === i} onClick={() => go(i)}>
                <span className="font-medium">{p.t === 'AUTO' ? 'Me stesso/a' : p.n}</span>
                <small className="col-start-1 text-app-caption text-muted-foreground">
                  {TIPO[p.t]}
                  {p.r ? ` · ${p.r}` : ''}
                </small>
                <span className={cn('col-start-2 row-span-2 row-start-1 self-center font-mono text-app-caption', d === 25 ? 'text-success' : 'text-muted-foreground')}>{d === 25 ? '✓' : `${d}/25`}</span>
              </button>
            )
          })}
          <h3 className="label-mono mt-3 text-muted-foreground">Fine</h3>
          <button type="button" className={sideBtn(cur === 'fine')} aria-current={cur === 'fine'} onClick={() => go('fine')}>
            <span className="font-medium">Concludi e invia</span>
            <small className="col-start-1 text-app-caption text-muted-foreground">Invia le risposte a HR</small>
            <span className="col-start-2 row-span-2 row-start-1 self-center font-mono text-app-caption">→</span>
          </button>
        </aside>

        <main className="flex min-w-0 flex-col gap-4">
          {cur === 'istr' ? (
            <>
              <Card>
                <h2 className="text-app-title">Gentile {D.v},</h2>
                <p className="max-w-3xl text-app-small">
                  ti chiediamo di valutare le competenze professionali delle persone dell&apos;elenco{D.a ? <> per <b className="font-semibold">{D.a}</b></> : null}. La valutazione serve allo sviluppo professionale, non a sanzionare.
                </p>
                <p className="text-app-caption text-muted-foreground">Le tue risposte vengono salvate automaticamente su questo computer: puoi chiudere la scheda e riprendere più tardi, purché la riapra dallo stesso link e con lo stesso browser.</p>
              </Card>
              <Card>
                <h3 className="text-app-section">Come si compila</h3>
                <ol className="grid list-decimal gap-1.5 pl-5 text-app-small">
                  <li>Apri una persona dall&apos;elenco. Per ognuna ci sono <b className="font-semibold">25 domande</b>, divise nelle <b className="font-semibold">5 P</b>.</li>
                  <li>Leggi la <b className="font-semibold">domanda</b> e la <b className="font-semibold">guida al punteggio</b> sotto la barra: descrive cosa significa 1, 5 e 10 per quella domanda. Tutti i valutatori usano la stessa guida, così i voti sono confrontabili.</li>
                  <li>Clicca sulla barra il numero da <b className="font-semibold">1 a 10</b> che descrive meglio il comportamento che hai <b className="font-semibold">osservato direttamente</b> negli ultimi 12 mesi.</li>
                  <li>Scrivi nelle <b className="font-semibold">note</b> un esempio concreto che giustifica il voto. Non è obbligatorio, ma rende la valutazione molto più utile.</li>
                  <li>Alla fine vai su <b className="font-semibold">Concludi e invia</b> e invia le risposte all&apos;ufficio HR.</li>
                </ol>
              </Card>
              <Card>
                <h3 className="text-app-section">Scala di valutazione</h3>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-5">
                  {SCALE.map((s, i) => (
                    <div key={s[2]} className={cn('rounded-md p-2 text-app-caption', SCALE_BG[i])}>
                      <b className="block text-app-small font-semibold">
                        {s[0]}–{s[1]} {s[2]}
                      </b>
                      {s[3]}
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <h3 className="text-app-section">Le 5 P</h3>
                <table className="w-full text-app-small">
                  <thead>
                    <tr className="label-mono border-b border-border text-left text-muted-foreground">
                      <th className="py-1.5 pr-3 font-medium">P</th>
                      <th className="py-1.5 font-medium">Cosa misura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PS.map((p) => (
                      <tr key={p.k} className="border-b border-border last:border-b-0">
                        <td className="py-1.5 pr-3 font-semibold">
                          {p.k} – {p.n}
                        </td>
                        <td className="py-1.5 text-muted-foreground">{p.d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
              <Card>
                <h3 className="text-app-section">Regole per una valutazione equa</h3>
                <ul className="grid list-disc gap-1.5 pl-5 text-app-small">
                  <li>Valuta i <b className="font-semibold">fatti osservati</b>, non la simpatia o l&apos;impressione generale.</li>
                  <li>Valuta ogni domanda <b className="font-semibold">separatamente</b>: un punto forte non deve alzare tutti gli altri voti.</li>
                  <li>Usa <b className="font-semibold">tutta la scala</b>: 5–6 significa &quot;adeguato al ruolo&quot;, non &quot;insufficiente&quot;. Riserva 9–10 ai comportamenti che sono un esempio per tutta l&apos;azienda.</li>
                  <li>Considera gli <b className="font-semibold">ultimi 12 mesi</b>, non solo l&apos;ultimo episodio.</li>
                  <li>Se non hai mai osservato un comportamento, lascia la domanda <b className="font-semibold">senza voto</b> e scrivilo nelle note: non viene contata nella media.</li>
                  <li>Le valutazioni dei colleghi restano <b className="font-semibold">anonime</b>: la persona valutata vede solo medie aggregate.</li>
                  <li>Nell&apos;autovalutazione, riferisci ogni domanda a <b className="font-semibold">te stesso</b>.</li>
                </ul>
              </Card>
              <div className="flex justify-end">
                <Button onClick={() => go(0)}>Inizia dalla prima persona →</Button>
              </div>
            </>
          ) : cur === 'fine' ? (
            <>
              <Card>
                <h2 className="text-app-title">Concludi e invia</h2>
                {persone.some((_, i) => done(i) < 25) ? (
                  <p className="text-app-small">
                    <Badge tone="warning">Mancano dei voti</Badge> Puoi inviare lo stesso: le domande senza voto non vengono contate. Se puoi, completale.
                  </p>
                ) : (
                  <p className="text-app-small">
                    <Badge tone="success">Completo</Badge> Hai dato tutti i {total} voti. Grazie.
                  </p>
                )}
                <table className="w-full text-app-small">
                  <thead>
                    <tr className="label-mono border-b border-border text-left text-muted-foreground">
                      <th className="py-1.5 pr-3 font-medium">Persona</th>
                      <th className="py-1.5 pr-3 font-medium">Tipo</th>
                      <th className="py-1.5 font-medium">Voti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {persone.map((p, i) => (
                      <tr key={`${p.t}-${p.n}`} className="border-b border-border last:border-b-0">
                        <td className="py-1.5 pr-3">
                          <button type="button" className="underline" onClick={() => go(i)}>
                            {p.t === 'AUTO' ? 'Me stesso/a' : p.n}
                          </button>
                        </td>
                        <td className="py-1.5 pr-3">{TIPO[p.t]}</td>
                        <td className="py-1.5 font-mono tabular-nums">{done(i)} / 25</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
              <Card>
                <h3 className="text-app-section">1. Scarica il file delle risposte</h3>
                <p className="text-app-small">
                  Viene creato il file <b className="font-semibold">{fname}</b>.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      const u = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
                      const a = document.createElement('a')
                      a.href = u
                      a.download = fname
                      document.body.appendChild(a)
                      a.click()
                      setTimeout(() => {
                        URL.revokeObjectURL(u)
                        a.remove()
                      }, 1500)
                      setMsg(`File scaricato: ${fname}`)
                    }}
                  >
                    Scarica file risposte
                  </Button>
                  {canDeliver ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const n = deliverToPlatform(D.v, payload().valutazioni)
                        setMsg(n == null ? 'Nessun piano trovato in questo browser.' : `Risposte inviate alla piattaforma (${n} schede).`)
                      }}
                    >
                      Invia alla piattaforma
                    </Button>
                  ) : null}
                </div>
                <h3 className="text-app-section">2. Invialo</h3>
                <p className="text-app-small">Allega il file a un&apos;email per l&apos;ufficio HR. Non devi aprirlo né modificarlo.</p>
                <details>
                  <summary className="cursor-pointer text-app-caption">Il download non funziona?</summary>
                  <p className="my-2 text-app-caption text-muted-foreground">Copia questo codice e incollalo nel testo dell&apos;email: contiene le stesse risposte.</p>
                  <Textarea readOnly className="h-24 font-mono text-app-caption break-all" value={codeText} onFocus={(e) => e.target.select()} />
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => navigator.clipboard?.writeText(codeText).then(() => setMsg('Codice copiato'), () => setMsg('Seleziona il codice e premi Ctrl+C'))}>
                    Copia codice
                  </Button>
                </details>
                {msg ? <p className="text-app-small font-medium text-success">{msg}</p> : null}
              </Card>
            </>
          ) : (
            <>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-app-title">{persone[cur].t === 'AUTO' ? `Autovalutazione · ${persone[cur].n}` : persone[cur].n}</h2>
                    <p className="text-app-caption text-muted-foreground">
                      {TIPO[persone[cur].t]}
                      {persone[cur].r ? ` · Ruolo: ${persone[cur].r}` : ''}
                    </p>
                  </div>
                  <Badge tone={done(cur) === 25 ? 'success' : 'warning'}>{done(cur)} / 25 voti</Badge>
                </div>
                {persone[cur].t === 'AUTO' ? (
                  <p className="text-app-small">
                    Rispondi pensando a <b className="font-semibold">te stesso</b>: dove la domanda dice &quot;il dipendente&quot;, leggi &quot;io&quot;.
                  </p>
                ) : null}
              </Card>
              {PS.map((P) => (
                <div key={P.k} className="flex flex-col gap-3">
                  <div className="mt-2 flex flex-wrap items-baseline gap-3 border-b-2 border-primary pb-1.5">
                    <b className="text-app-section">
                      {P.k} – {P.n}
                    </b>
                    <span className="text-app-caption text-muted-foreground">{P.d}</span>
                  </div>
                  {ITEMS_5P.filter((it) => it.cod[0] === P.k).map((it) => {
                    const v = get(cur).scores[it.cod]
                    const b = v ? level(v) : null
                    return (
                      <div key={`${cur}-${it.cod}`} className={cn('flex flex-col gap-2.5 rounded-lg border p-4', v ? 'border-success/50' : 'border-border')}>
                        <div className="flex flex-wrap items-baseline gap-2.5">
                          <span className="rounded-sm bg-primary px-2 py-0.5 font-mono text-app-caption font-bold text-primary-foreground">{it.cod}</span>
                          <span className="font-semibold">{it.area}</span>
                        </div>
                        <div className="text-app-small">{it.q}</div>
                        <ScoreBar fill label={`Voto ${it.cod}`} value={v ?? 0} onChange={(n) => setScore(cur, it.cod, n)} />
                        <div className="grid grid-cols-1 gap-2 text-app-caption text-muted-foreground sm:grid-cols-3">
                          <div className="border-t-2 border-border pt-1">
                            <b className="text-foreground">1</b> · {it.low}
                          </div>
                          <div className="border-t-2 border-border pt-1 sm:text-center">
                            <b className="text-foreground">5</b> · {it.mid}
                          </div>
                          <div className="border-t-2 border-border pt-1 sm:text-right">
                            <b className="text-foreground">10</b> · {it.high}
                          </div>
                        </div>
                        <div className="flex min-h-5 flex-wrap items-center gap-2 text-app-caption">
                          {b && v ? (
                            <>
                              <span>
                                Voto <b className="font-semibold">{v}</b> · <Badge tone={LEVEL_TONE[b.c]}>{b.t}</Badge> —{' '}
                                <span className="text-muted-foreground">{SCALE.find((s) => v >= s[0] && v <= s[1])?.[3]}</span>
                              </span>
                              <Button variant="outline" size="sm" onClick={() => setScore(cur, it.cod, null)}>
                                Togli voto
                              </Button>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Nessun voto</span>
                          )}
                        </div>
                        <Textarea aria-label={`Note ${it.cod}`} placeholder="Note: esempio concreto che giustifica il voto (facoltativo)" defaultValue={get(cur).notes[it.cod] || ''} onChange={(e) => setNote(cur, it.cod, e.target.value)} />
                      </div>
                    )
                  })}
                </div>
              ))}
              <div className="flex flex-wrap justify-between gap-3">
                <Button variant="outline" onClick={() => go(cur > 0 ? cur - 1 : 'istr')}>
                  ← Indietro
                </Button>
                <Button onClick={() => go(cur + 1 < persone.length ? cur + 1 : 'fine')}>{cur + 1 < persone.length ? 'Persona successiva →' : 'Concludi e invia →'}</Button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">{children}</div>
}
