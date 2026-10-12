import { Mail, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Note } from '@/components/patterns/Note'
import { StatCard } from '@/components/patterns/StatCard'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/hooks/use-confirm'
import { cn } from '@/lib/utils'
import { readWorkbook } from '@/modules/assessment/gestione5p/files'
import { CODES, PS, SRC, type Parsed, type ResponsesPayload, type State5p, allEvaluators, allResults, cap, codeToJson, edit, evStatus, fmt100, fromPayload, mean, mergeEvals, parseWorkbook, personByName, plural } from '@/modules/assessment/gestione5p/model'
import { SourceTag } from '@/modules/assessment/gestione5p/SourceTag'

type Update = (fn: (s: State5p) => State5p) => void
type LogLine = { c: 'ok' | 'warn' | 'bad'; t: string }

// 3 · Raccolta. I valutatori rimandano il file delle risposte; si caricano
// tutti insieme (anche le schede Excel e gli export di Forms). Si vede chi
// manca, con un promemoria pronto, e l'elenco delle valutazioni caricate.
export function RaccoltaTab({ state, update, toast, incoming, onConsumed }: { state: State5p; update: Update; toast: (m: string) => void; incoming: File[] | null; onConsumed: () => void }) {
  const [log, setLog] = useState<{ lines: LogLine[]; summary: string } | null>(null)
  const [over, setOver] = useState(false)
  const [code, setCode] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirm, confirmDialog] = useConfirm()

  // Le risposte inviate dall'anteprima di una scheda (pagina Invio) arrivano qui.
  useEffect(() => {
    if (incoming?.length) {
      void handle(incoming)
      onConsumed()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming])

  async function handle(files: File[]) {
    const lines: LogLine[] = []
    const all: Parsed[] = []
    let empty = 0
    let bad = 0
    for (const f of files) {
      try {
        let res: Parsed[]
        if (/\.(json|txt)$/i.test(f.name)) {
          const r = fromPayload(state, JSON.parse(await f.text()) as ResponsesPayload, f.name)
          if (r.warn) lines.push({ c: 'warn', t: r.warn })
          res = r.res
        } else {
          const { X, wb } = await readWorkbook(f)
          res = parseWorkbook(X, wb, f.name)
        }
        if (!res.length) {
          empty++
          lines.push({ c: 'warn', t: `${f.name}: nessuna scheda compilata trovata (voti assenti o formato non riconosciuto)` })
          continue
        }
        all.push(...res)
      } catch (err) {
        bad++
        const m = err instanceof Error ? err.message : ''
        lines.push({ c: 'bad', t: `${f.name}: ${/^(è un file|non è un file|questo è)/.test(m) ? m : `file non leggibile (${m})`}` })
      }
    }
    let r = { lines: [] as LogLine[], added: 0, repl: 0, bad: 0 }
    const next = edit(state, (d) => {
      r = mergeEvals(d, all)
    })
    update(() => next)
    setLog({ lines: [...r.lines, ...lines], summary: `${r.added} nuove · ${r.repl} aggiornate · ${r.bad + bad} scartate${empty ? ` · ${empty} file vuoti` : ''}` })
    const n = r.added + r.repl
    toast(n === 1 ? '1 valutazione caricata' : `${n} valutazioni caricate`)
  }

  const evs = allEvaluators(state)
  const sts = evs.map((e) => ({ e, ...evStatus(state, e.name) }))
  const exp = sts.reduce((n, x) => n + x.exp, 0)
  const rec = sts.reduce((n, x) => n + x.rec, 0)
  const done = sts.filter((x) => x.exp && x.rec >= x.exp).length
  const withRes = allResults(state).filter((r) => r.oth.length).length
  const late = sts.filter((x) => x.rec < x.exp)

  return (
    <section className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <h3 className="text-app-section text-foreground">Carica le schede compilate</h3>
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
            onDragEnter={(e) => { e.preventDefault(); setOver(true) }}
            onDragOver={(e) => { e.preventDefault(); setOver(true) }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) void handle([...e.dataTransfer.files]) }}
            className={cn('flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed bg-muted px-4 py-8 text-center outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring', over ? 'border-primary' : 'border-border')}
          >
            <Upload className="size-6 text-muted-foreground" aria-hidden="true" />
            <b className="text-app-subtitle">Trascina qui i file ricevuti dai valutatori</b>
            <span className="text-app-caption text-muted-foreground">Tutti insieme, anche decine. Accetta i file risposte delle schede (Risposte_5P_….json), le schede Excel e gli export di Microsoft Forms o Google Forms.</span>
            <span className="rounded-sm border border-border-strong px-3 py-1 text-app-small font-medium">Scegli file</span>
          </div>
          <input ref={fileRef} type="file" accept=".json,.txt,.xlsx,.xls,.csv" multiple hidden onChange={(e) => { if (e.target.files?.length) void handle([...e.target.files]); e.target.value = '' }} />
          <Accordion type="single" collapsible>
            <AccordionItem value="code" className="border-b-0">
              <AccordionTrigger className="py-2 text-app-caption">Un valutatore ha mandato il codice nel testo dell&apos;email?</AccordionTrigger>
              <AccordionContent className="flex flex-col items-start gap-2">
                <Textarea aria-label="Codice delle risposte" placeholder="Incolla qui il codice che inizia con SV5P:" className="font-mono" value={code} onChange={(e) => setCode(e.target.value)} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    try {
                      const payload = codeToJson(code)
                      void handle([new File([JSON.stringify(payload)], 'codice_incollato.json', { type: 'application/json' })])
                      setCode('')
                    } catch {
                      toast('Codice non valido: copialo per intero, da SV5P: alla fine')
                    }
                  }}
                >
                  Carica codice
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
          <h3 className="text-app-section text-foreground">Esito dell&apos;ultimo caricamento</h3>
          <div className="max-h-72 overflow-auto text-app-caption">
            {log ? (
              <>
                <p className="mb-2 text-app-small">{log.summary}</p>
                {log.lines.map((l, i) => (
                  <div key={i} className="flex items-start gap-2 border-b border-border py-2 last:border-b-0">
                    <Badge tone={l.c === 'ok' ? 'success' : l.c === 'warn' ? 'warning' : 'destructive'}>{l.c === 'ok' ? 'OK' : l.c === 'warn' ? 'Controlla' : 'Errore'}</Badge>
                    <span className="min-w-0 flex-1 break-words">{l.t}</span>
                  </div>
                ))}
              </>
            ) : (
              <Note size="caption">Nessun file caricato in questa sessione.</Note>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Valutatori che hanno restituito" value={`${done}/${evs.length}`} tone={done && done === evs.length ? 'success' : 'neutral'} note={done && done === evs.length ? 'Tutti' : undefined} />
        <StatCard label="Valutazioni ricevute" value={`${rec}/${exp}`} />
        <StatCard label="Completamento" value={exp ? `${Math.round((rec / exp) * 100)}%` : '–'} progress={exp ? (rec / exp) * 100 : undefined} />
        <StatCard label="Persone con un voto" value={withRes} note="valutate da almeno un altro" />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-app-section text-foreground">Chi deve ancora restituire</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const em = late.map((x) => personByName(state, x.e.name)?.email).filter(Boolean)
              if (!em.length) {
                toast('Nessuna email da copiare')
                return
              }
              navigator.clipboard?.writeText(em.join('; ')).then(
                () => toast(`${em.length} email copiate`),
                () => toast('Copia non riuscita'),
              )
            }}
          >
            Copia le email per il promemoria
          </Button>
        </div>
        {late.length ? (
          <div className="max-h-[60vh] overflow-auto rounded-sm border border-border">
            <Table minWidth="lg">
              <TableHeader className="sticky top-0 z-10">
                <TableRow>
                  <TableHead>Valutatore</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Ricevute</TableHead>
                  <TableHead>Mancano</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {late.map((x) => {
                  const p = personByName(state, x.e.name)
                  const body = `Gentile ${p?.nom ? cap(p.nom) : x.e.name},\n\nti ricordiamo la valutazione 5P${state.mail.scad ? ` da completare entro il ${state.mail.scad}` : ''}. Mancano: ${x.miss.join(', ')}.\n\nQuando hai finito, invia il file delle risposte${state.mail.emailHR ? ` a ${state.mail.emailHR}` : ''}.\n\nGrazie.`
                  const href = p?.email ? `mailto:${encodeURIComponent(p.email)}?subject=${encodeURIComponent('Promemoria: valutazione 5P')}&body=${encodeURIComponent(body)}` : ''
                  return (
                    <TableRow key={x.e.name}>
                      <TableCell className="font-semibold">{x.e.name}</TableCell>
                      <TableCell className="text-app-caption">{p?.email || '—'}</TableCell>
                      <TableCell className="text-center font-mono tabular-nums">
                        {x.rec}/{x.exp}
                      </TableCell>
                      <TableCell className="text-app-caption">{x.miss.join(', ')}</TableCell>
                      <TableCell>
                        {href ? (
                          <Button variant="outline" size="sm" asChild>
                            <a href={href}>
                              <Mail aria-hidden="true" />
                              Promemoria
                            </a>
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : evs.length ? (
          <p className="text-app-small">
            <Badge tone="success">Tutti hanno restituito</Badge>
          </p>
        ) : (
          <Note>Nessun piano: prepara prima il piano.</Note>
        )}
      </div>

      <Accordion type="single" collapsible className="rounded-lg border border-border px-4">
        <AccordionItem value="ev" className="border-b-0">
          <AccordionTrigger>
            <span className="flex flex-wrap items-baseline gap-3">
              <span className="text-app-section text-foreground">Valutazioni caricate</span>
              <span className="text-app-small font-normal text-muted-foreground">{plural(state.evals.length, 'valutazione', 'valutazioni')}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-3">
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (await confirm({ title: 'Eliminare tutte le valutazioni caricate?', confirmLabel: 'Sì, svuota', destructive: true })) update((s) => ({ ...s, evals: [] }))
                }}
              >
                Svuota le valutazioni caricate
              </Button>
            </div>
            <div className="max-h-[26rem] overflow-auto rounded-sm border border-border">
              <Table minWidth="lg">
                <TableHeader className="sticky top-0 z-10">
                  <TableRow>
                    <TableHead>Valutato</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valutatore</TableHead>
                    {PS.map((p) => (
                      <TableHead key={p.k} className="text-center">
                        {p.k}
                      </TableHead>
                    ))}
                    <TableHead className="text-center">Voci</TableHead>
                    <TableHead>Origine</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.evals.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.valutato}</TableCell>
                      <TableCell>
                        <SourceTag source={e.tipo} long />
                      </TableCell>
                      <TableCell>{e.valutatore || '—'}</TableCell>
                      {PS.map((p) => (
                        <TableCell key={p.k} className="text-center font-mono tabular-nums">
                          {fmt100(mean(CODES.filter((c) => c[0] === p.k).map((c) => e.scores[c] ?? null)))}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-mono whitespace-nowrap tabular-nums">
                        {Object.keys(e.scores).length}/25
                        {e.no?.length ? <span className="text-app-caption text-muted-foreground" title="non so valutare"> · {e.no.length} n.v.</span> : null}
                      </TableCell>
                      <TableCell className="text-app-caption text-muted-foreground">{e.source}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" aria-label={`Rimuovi la valutazione ${SRC[e.tipo].lab.toLowerCase()} su ${e.valutato}`} onClick={() => update((s) => ({ ...s, evals: s.evals.filter((x) => x.id !== e.id) }))}>
                          <X aria-hidden="true" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {confirmDialog}
    </section>
  )
}
