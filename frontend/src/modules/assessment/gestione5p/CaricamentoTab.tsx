import { Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useConfirm } from '@/hooks/use-confirm'
import { cn } from '@/lib/utils'
import { readWorkbook } from '@/modules/assessment/gestione5p/files'
import { PS, SRC, SOURCES, type Eval5p, type Parsed, type ResponsesPayload, type State5p, codeToJson, compute, fmt100, fromPayload, norm, parseWorkbook, personByName } from '@/modules/assessment/gestione5p/model'
import { Textarea } from '@/components/ui/textarea'
import { SourceTag } from '@/modules/assessment/gestione5p/SourceTag'

type LogLine = { c: 'ok' | 'warn' | 'bad'; t: string }
const evalP = (e: Eval5p, P: string) => {
  const v = Object.entries(e.scores).filter(([c]) => c[0] === P).map(([, x]) => x)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}

// 3 · Caricamento. Si trascinano insieme tutti i file Excel o CSV compilati: il
// sistema legge nomi, tipo e voti, segnala errori e doppioni, e la tabella di
// avanzamento mostra chi manca rispetto al piano.
export function CaricamentoTab({ state, update, toast, incoming, onConsumed }: { state: State5p; update: (fn: (s: State5p) => State5p) => void; toast: (m: string) => void; incoming: File[] | null; onConsumed: () => void }) {
  const [log, setLog] = useState<LogLine[] | null>(null)
  const [summary, setSummary] = useState('')
  const [over, setOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirm, confirmDialog] = useConfirm()
  const R = compute(state)
  const [code, setCode] = useState('')

  // Le risposte inviate dall'anteprima di una scheda (pagina 3) arrivano qui.
  useEffect(() => {
    if (incoming?.length) {
      void handle(incoming)
      onConsumed()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming])

  async function handle(files: File[]) {
    const lines: LogLine[] = []
    let added = 0
    let repl = 0
    let bad = 0
    let empty = 0
    const evals = [...state.evals]
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
        res.forEach((x: Parsed) => {
          const e = x.e
          if (!e.valutato || !e.tipo) {
            bad++
            lines.push({ c: 'bad', t: `${e.source}: scartata, ${x.errs.join('; ')}` })
            return
          }
          const k = `${e.tipo}|${norm(e.valutato)}|${norm(e.valutatore)}`
          const i = e.valutatore ? evals.findIndex((o) => `${o.tipo}|${norm(o.valutato)}|${norm(o.valutatore)}` === k) : -1
          if (i >= 0) {
            evals[i] = e
            repl++
          } else {
            evals.push(e)
            added++
          }
          const w: string[] = []
          if (x.missing) w.push(`${x.missing} item senza voto`)
          if (x.noNotes) w.push(`${x.noNotes} item senza nota`)
          w.push(...x.errs)
          if (!personByName(state, e.valutato)) w.push(`"${e.valutato}" non è in anagrafica`)
          lines.push({ c: w.length ? 'warn' : 'ok', t: `${e.source} → ${SRC[e.tipo].lab} su ${e.valutato}${e.tipo !== 'AUTO' && e.valutatore ? ` (da ${e.valutatore})` : ''}${i >= 0 ? ' · sostituisce la versione precedente' : ''}${w.length ? ` · ${w.join('; ')}` : ''}` })
        })
      } catch (err) {
        bad++
        const m = err instanceof Error ? err.message : ''
        lines.push({ c: 'bad', t: `${f.name}: ${/^(è un file|non è un file|questo è)/.test(m) ? m : `file non leggibile (${m})`}` })
      }
    }
    update((s) => ({ ...s, evals }))
    setLog(lines)
    setSummary(`${added} nuove · ${repl} aggiornate · ${bad} scartate${empty ? ` · ${empty} file vuoti` : ''}`)
    toast(`${added + repl} schede caricate`)
  }

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
            <b className="text-app-subtitle">Trascina qui i file Excel o CSV</b>
            <span className="text-app-caption text-muted-foreground">Tutti insieme, anche decine. Accetta i file risposte delle schede (Risposte_5P_….json), le schede Excel, il vostro modulo a 3 fogli e gli export di Microsoft Forms o Google Forms.</span>
            <span className="rounded-sm border border-border-strong px-3 py-1 text-app-small font-medium">Scegli file</span>
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.json,.txt" multiple hidden onChange={(e) => { if (e.target.files?.length) void handle([...e.target.files]); e.target.value = '' }} />
          <details>
            <summary className="cursor-pointer text-app-caption">Un valutatore ha mandato il codice nel testo dell&apos;email?</summary>
            <Textarea aria-label="Codice delle risposte" placeholder="Incolla qui il codice che inizia con SV5P:" className="mt-2 font-mono" value={code} onChange={(e) => setCode(e.target.value)} />
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
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
          </details>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-app-small text-muted-foreground">{state.evals.length} schede nel sistema</span>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (await confirm({ title: 'Eliminare tutte le schede caricate?', confirmLabel: 'Sì, procedi', destructive: true })) update((s) => ({ ...s, evals: [] }))
              }}
            >
              Svuota schede caricate
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
          <h3 className="text-app-section text-foreground">Esito dell&apos;ultimo caricamento</h3>
          <div className="max-h-72 overflow-auto text-app-caption">
            {log ? (
              <>
                <p className="mb-2 text-app-small">{summary}</p>
                {log.map((l, i) => (
                  <div key={i} className="flex items-start gap-2 border-b border-border py-1.5 last:border-b-0">
                    <Badge tone={l.c === 'ok' ? 'success' : l.c === 'warn' ? 'warning' : 'destructive'}>{l.c === 'ok' ? 'OK' : l.c === 'warn' ? 'Controllare' : 'Scartata'}</Badge>
                    <span className="min-w-0 flex-1 break-words">{l.t}</span>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-muted-foreground">Nessun file caricato in questa sessione.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-app-section text-foreground">Avanzamento raccolta</h3>
          <span className="text-app-caption text-muted-foreground">Schede ricevute rispetto al piano</span>
        </div>
        <Table frame minWidth="lg">
          <TableHeader>
            <TableRow>
              <TableHead>Valutato</TableHead>
              <TableHead>Reparto</TableHead>
              {SOURCES.map((t) => (
                <TableHead key={t} className="text-center">
                  {SRC[t].lab}
                </TableHead>
              ))}
              <TableHead>Stato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {R.map((r) => {
              const e = r.exp
              const st = e ? (SOURCES.every((t) => r.cnt[t] >= e[t]) ? 'ok' : r.ev.length ? 'warn' : 'bad') : r.ev.length ? 'n' : 'bad'
              const lab = { ok: 'Completa', warn: 'Parziale', bad: 'Nessuna scheda', n: 'Senza piano' }[st]
              return (
                <TableRow key={r.k}>
                  <TableCell>
                    {r.nome} {r.inAna ? null : <Badge tone="warning">Non in anagrafica</Badge>}
                  </TableCell>
                  <TableCell>{r.reparto}</TableCell>
                  {SOURCES.map((t) => (
                    <TableCell key={t} className="text-center font-mono tabular-nums">
                      {r.cnt[t]}
                      {e ? ` / ${e[t]}` : ''}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Badge tone={st === 'ok' ? 'success' : st === 'warn' ? 'warning' : st === 'bad' ? 'destructive' : 'neutral'}>{lab}</Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <h3 className="text-app-section text-foreground">Tutte le schede nel sistema</h3>
        <div className="max-h-[26rem] overflow-auto">
          <Table frame minWidth="lg">
            <TableHeader>
              <TableRow>
                <TableHead>Valutato</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valutatore</TableHead>
                {PS.map((p) => (
                  <TableHead key={p.k} className="text-center">
                    {p.k}
                  </TableHead>
                ))}
                <TableHead className="text-center">Item</TableHead>
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
                      {fmt100(evalP(e, p.k))}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-mono tabular-nums">{Object.keys(e.scores).length}/25</TableCell>
                  <TableCell className="text-app-caption text-muted-foreground">{e.source}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" aria-label="Rimuovi scheda" onClick={() => update((s) => ({ ...s, evals: s.evals.filter((x) => x.id !== e.id) }))}>
                      <X aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      {confirmDialog}
    </section>
  )
}
