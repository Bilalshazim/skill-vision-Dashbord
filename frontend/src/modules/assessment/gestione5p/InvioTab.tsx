import { Mail } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Field } from '@/components/patterns/Field'
import { InlineAlert } from '@/components/patterns/InlineAlert'
import { Note } from '@/components/patterns/Note'
import { SelectField } from '@/components/patterns/SelectField'
import { StatCard } from '@/components/patterns/StatCard'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { buildEval, downloadBlank, downloadEmails, downloadFlat, downloadSchedeXlsx, downloadSchedeZip, evalFile, mailFor, saveFile } from '@/modules/assessment/gestione5p/files'
import { DEF_BODY, DEF_SUBJ, type Evaluator, type State5p, allEvaluators, edit, evStatus, itDate, norm, personByName, today } from '@/modules/assessment/gestione5p/model'

type Update = (fn: (s: State5p) => State5p) => void

function Status({ state, ev }: { state: State5p; ev: Evaluator }) {
  const st = evStatus(state, ev.name)
  const p = personByName(state, ev.name)
  const sent = state.sent[norm(ev.name)]
  if (st.exp && st.rec >= st.exp) return <Badge tone="success">Restituita</Badge>
  if (st.rec > 0) return <Badge tone="warning">Parziale {st.rec}/{st.exp}</Badge>
  if (sent) return <Badge tone="neutral">Inviata {itDate(sent)}</Badge>
  if (!p || !p.email) return <Badge tone="destructive">Manca email</Badge>
  return <Badge tone="neutral">Da inviare</Badge>
}

// 2 · Invio schede. Ogni valutatore riceve una sola email con la sua scheda 5P
// allegata (un file HTML che si apre nel browser: guida completa ed elenco
// delle persone). «Prepara le email» scarica uno ZIP con un'email .eml pronta
// per ognuno; lo stato diventa «Restituita» quando le risposte sono caricate.
export function InvioTab({ state, update, toast, onGo, onAnswers }: { state: State5p; update: Update; toast: (m: string) => void; onGo: (t: 'piano') => void; onAnswers: (f: File) => void }) {
  const evs = allEvaluators(state)
  const [sel, setSel] = useState('')
  const [q, setQ] = useState('')
  const [onlyTodo, setOnlyTodo] = useState(false)
  const who = evs.some((e) => e.name === sel) ? sel : evs[0]?.name || ''
  const dark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const html = useMemo(() => (who ? buildEval(state, who, dark ? 'dark' : 'light') : ''), [state, who, dark])
  const unk = state.log?.unknown.length ?? 0
  const noEm = evs.filter((e) => !personByName(state, e.name)?.email).length
  const sentN = evs.filter((e) => state.sent[norm(e.name)]).length
  const ret = evs.filter((e) => {
    const s = evStatus(state, e.name)
    return s.exp && s.rec >= s.exp
  }).length
  const rows = evs.filter((e) => (!q.trim() || e.name.toLowerCase().includes(q.trim().toLowerCase())) && (!onlyTodo || (!state.sent[norm(e.name)] && evStatus(state, e.name).rec === 0)))

  // «Invia al sistema (anteprima)» dentro la scheda carica le risposte nella Raccolta.
  useEffect(() => {
    const h = (e: MessageEvent) => {
      const d = e.data as { sv5p?: { valutatore?: string } } | null
      if (d && d.sv5p) onAnswers(new File([JSON.stringify(d.sv5p)], `anteprima_${(d.sv5p.valutatore || 'valutatore').replace(/\W+/g, '_')}.json`, { type: 'application/json' }))
    }
    window.addEventListener('message', h)
    return () => window.removeEventListener('message', h)
  }, [onAnswers])

  const setMail = (f: 'emailHR' | 'scad' | 'subj' | 'body', v: string) =>
    update((s) =>
      edit(s, (d) => {
        let x = v.trim()
        if (f === 'subj' && x === DEF_SUBJ) x = ''
        if (f === 'body' && x === DEF_BODY.trim()) x = ''
        d.mail[f] = x
      }),
    )

  return (
    <section className="flex flex-col gap-4">
      {!evs.length ? (
        <InlineAlert tone="warning">
          Prima prepara il piano: importa il file Excel nella pagina Piano.{' '}
          <Button size="sm" variant="outline" onClick={() => onGo('piano')}>
            Vai al piano
          </Button>
        </InlineAlert>
      ) : null}
      {unk ? (
        <InlineAlert tone="destructive">
          {unk === 1 ? '1 nome del piano non è riconosciuto' : `${unk} nomi del piano non sono riconosciuti`}: sistemali prima di inviare, altrimenti quelle valutazioni mancheranno.{' '}
          <Button size="sm" variant="outline" onClick={() => onGo('piano')}>
            Vai al controllo
          </Button>
        </InlineAlert>
      ) : null}
      {noEm ? <InlineAlert tone="warning">{noEm === 1 ? '1 valutatore non ha' : `${noEm} valutatori non hanno`} l&apos;email: scrivila nella tabella qui sotto (o nella colonna EMAIL del file Excel).</InlineAlert> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
          <h3 className="text-app-section text-foreground">Invia le schede ai valutatori</h3>
          <Note>
            Ogni valutatore riceve <b className="font-semibold text-foreground">una sola email</b> con la sua scheda 5P allegata: dentro trova una guida completa (il modello 5P, la scala con esempi, che cosa osservare per ogni domanda, gli errori da evitare, le domande frequenti) e l&apos;elenco delle persone che deve valutare.
          </Note>
          <ol className="flex flex-col gap-3">
            {[
              <>Premi <b className="font-semibold">Prepara le email</b>: scarichi un file ZIP con un&apos;email pronta per ogni valutatore (destinatario, testo personalizzato e scheda allegata).</>,
              <>Apri ogni email con un doppio clic: in <b className="font-semibold">Outlook</b> si apre già compilata, basta premere <b className="font-semibold">Invia</b>. Con altri programmi usa il pulsante Email della tabella e allega la scheda.</>,
              <>Segna <b className="font-semibold">Inviata</b>. Quando la scheda torna compilata lo stato diventa <b className="font-semibold">Restituita</b> da solo.</>,
            ].map((t, i) => (
              <li key={i} className="grid grid-cols-[2rem_1fr] gap-3 text-app-small">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary font-mono text-app-caption font-semibold text-primary-foreground">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                const r = await downloadEmails(state)
                if (!r) toast('Prima prepara il piano')
                else if (r.miss.length) toast(`${r.n} email pronte · ${r.miss.length} valutatori senza email: aggiungila nella tabella`)
                else toast(`${r.n} email pronte`)
              }}
            >
              Prepara le email (ZIP)
            </Button>
            <Button variant="outline" onClick={async () => { if (!(await downloadSchedeZip(state))) toast('Prima prepara il piano') }}>
              Scarica solo le schede (ZIP)
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Valutatori" value={evs.length} />
            <StatCard label="Con email" value={evs.length - noEm} tone={noEm ? 'warning' : 'neutral'} note={noEm ? `${noEm} senza email` : undefined} />
            <StatCard label="Inviate" value={sentN} />
            <StatCard label="Restituite" value={ret} tone={ret && ret === evs.length ? 'success' : 'neutral'} note={ret && ret === evs.length ? 'Tutte' : undefined} />
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <h3 className="text-app-section text-foreground">Testo dell&apos;email</h3>
          <div className="flex flex-wrap gap-3">
            <Field label="Email a cui rimandare le risposte" className="min-w-56 flex-1">
              <Input type="email" placeholder="hr@azienda.it" defaultValue={state.mail.emailHR} key={`hr-${state.mail.emailHR}`} onBlur={(e) => e.target.value.trim() !== state.mail.emailHR && setMail('emailHR', e.target.value)} />
            </Field>
            <Field label="Scadenza" className="w-40">
              <Input placeholder="31/10/2026" defaultValue={state.mail.scad} key={`sc-${state.mail.scad}`} onBlur={(e) => e.target.value.trim() !== state.mail.scad && setMail('scad', e.target.value)} />
            </Field>
          </div>
          <Field label="Oggetto">
            <Input defaultValue={state.mail.subj || DEF_SUBJ} key={`su-${state.mail.subj}`} onBlur={(e) => setMail('subj', e.target.value)} />
          </Field>
          <Field label="Testo">
            <Textarea rows={11} defaultValue={state.mail.body || DEF_BODY} key={`bo-${state.mail.body}`} onBlur={(e) => setMail('body', e.target.value)} />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Note size="caption">Campi automatici: {'{NOME} {ELENCO} {SCADENZA} {EMAIL_HR}'}</Note>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                update((s) => edit(s, (d) => { d.mail.subj = ''; d.mail.body = '' }))
                toast('Testo ripristinato')
              }}
            >
              Ripristina testo
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-app-section text-foreground">Valutatori</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Input aria-label="Cerca valutatore" placeholder="Cerca valutatore" className="w-56" value={q} onChange={(e) => setQ(e.target.value)} />
            <label className="flex items-center gap-2 text-app-small">
              <Checkbox checked={onlyTodo} onCheckedChange={(c) => setOnlyTodo(c === true)} />
              Solo da inviare
            </label>
          </div>
        </div>
        <div className="max-h-[70vh] overflow-auto rounded-sm border border-border">
          <Table minWidth="lg">
            <TableHeader className="sticky top-0 z-10">
              <TableRow>
                <TableHead>Valutatore</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Deve valutare</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((ev) => {
                const p = personByName(state, ev.name)
                const k = norm(ev.name)
                const m = mailFor(state, ev)
                const href = p?.email ? `mailto:${encodeURIComponent(p.email)}?subject=${encodeURIComponent(m.subj)}&body=${encodeURIComponent(m.body)}` : ''
                const what = [ev.DIR.length ? `${ev.DIR.length} come dirigente` : '', ev.PEER.length ? `${ev.PEER.length} come collega` : '', ev.AUTO ? 'sé stesso' : ''].filter(Boolean).join(' · ')
                const title = [ev.DIR.length ? `Dirigente: ${ev.DIR.join(', ')}` : '', ev.PEER.length ? `Collega: ${ev.PEER.join(', ')}` : ''].filter(Boolean).join(' | ')
                return (
                  <TableRow key={k}>
                    <TableCell className="font-semibold">{ev.name}</TableCell>
                    <TableCell className="min-w-56">
                      <Input
                        size="sm"
                        type="email"
                        aria-label={`Email di ${ev.name}`}
                        placeholder="scrivi l'email"
                        defaultValue={p?.email || ''}
                        key={`${k}-${p?.email || ''}`}
                        disabled={!p}
                        onBlur={(e) => {
                          const v = e.target.value.trim()
                          if (v !== (p?.email || '')) update((s) => edit(s, (d) => { const x = personByName(d, ev.name); if (x) x.email = v }))
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-app-caption" title={title}>{what}</TableCell>
                    <TableCell>
                      <Status state={state} ev={ev} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-nowrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => saveFile(evalFile(ev.name), new Blob([buildEval(state, ev.name)], { type: 'text/html' }))}>
                          Scheda
                        </Button>
                        {href ? (
                          <Button variant="outline" size="sm" asChild>
                            <a href={href} title="Apre il tuo programma di posta (la scheda va allegata a mano)">
                              <Mail aria-hidden="true" />
                              Email
                            </a>
                          </Button>
                        ) : null}
                        <Button
                          variant={state.sent[k] ? 'default' : 'ghost'}
                          size="sm"
                          aria-pressed={!!state.sent[k]}
                          onClick={() => update((s) => edit(s, (d) => { if (d.sent[k]) delete d.sent[k]; else d.sent[k] = today() }))}
                        >
                          {state.sent[k] ? '✓ Inviata' : 'Segna inviata'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Anteprima della scheda di" className="w-72">
            <SelectField value={who} onValueChange={setSel}>
              {evs.map((e) => (
                <option key={e.name} value={e.name}>
                  {e.name}
                </option>
              ))}
            </SelectField>
          </Field>
          <Button variant="outline" size="sm" disabled={!who} onClick={() => who && saveFile(evalFile(who), new Blob([buildEval(state, who)], { type: 'text/html' }))}>
            Scarica questa scheda
          </Button>
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          {who ? (
            <iframe title="Anteprima scheda valutatore" sandbox="allow-scripts allow-downloads allow-modals allow-popups" srcDoc={html} className="block h-[45rem] w-full border-0 bg-background" />
          ) : (
            <p className="p-5 text-app-small text-muted-foreground">Nessun valutatore: prepara prima il piano.</p>
          )}
        </div>
        <Note size="caption">L&apos;anteprima si può compilare davvero: in fondo, «Concludi e invia» → «Invia al sistema (anteprima)» carica le risposte nella Raccolta, così vedi tutto il giro.</Note>
      </div>

      <Accordion type="single" collapsible className="rounded-lg border border-border px-4">
        <AccordionItem value="alt">
          <AccordionTrigger className="text-app-small">
            <span>
              <b className="font-semibold">Alternative</b>: schede in Excel o modulo Microsoft/Google Forms
            </span>
          </AccordionTrigger>
          <AccordionContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={async () => { if (!(await downloadSchedeXlsx(state))) toast('Prima prepara il piano') }}>
              Schede Excel precompilate (ZIP)
            </Button>
            <Button variant="outline" size="sm" onClick={() => void downloadBlank()}>
              Scheda Excel vuota
            </Button>
            <Button variant="outline" size="sm" onClick={() => void downloadFlat()}>
              Modello per Forms
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  )
}
