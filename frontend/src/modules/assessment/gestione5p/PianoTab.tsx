import { Plus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'

import { Note } from '@/components/patterns/Note'
import { StatCard } from '@/components/patterns/StatCard'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useConfirm } from '@/hooks/use-confirm'
import { cn } from '@/lib/utils'
import { exportPlan, readWorkbook } from '@/modules/assessment/gestione5p/files'
import {
  PEER_MIN,
  SRC,
  type LogEntry,
  type PlanLog,
  type SourceKey,
  type State5p,
  addEntry,
  addPerson,
  coverage,
  dn,
  edit,
  evaluatorsOf,
  groups,
  hasEntry,
  importPlan,
  loadOf,
  people,
  personByName,
  planChecks,
  plural,
  removeEntry,
  removePerson,
  renamePerson,
  same,
  syncAuto,
  toks,
} from '@/modules/assessment/gestione5p/model'
import { type PickItem, PersonPicker } from '@/modules/assessment/gestione5p/PersonPicker'

type Update = (fn: (s: State5p) => State5p) => void
type Picker = { role?: SourceKey; title: string; sub?: string; sugLabel?: string; q?: string; items: (s: State5p) => PickItem[]; onPick: (v: string) => void }

const covTxt = (c: Record<SourceKey, number>) => `D${c.DIR} · P${c.PEER}`
function personItems(s: State5p, exclude: string | null, extra?: (n: string, c: Record<SourceKey, number>) => Partial<PickItem>): PickItem[] {
  return people(s)
    .map((p) => {
      const n = dn(p)
      const c = coverage(s, n)
      return { v: n, info: [p.gruppo, p.mans].filter(Boolean).join(' · '), right: `valutato da ${covTxt(c)}`, ...(extra ? extra(n, c) : {}) }
    })
    .filter((o) => !exclude || !same(o.v, exclude))
}
const where = (x: LogEntry) => (
  <span className="min-w-40 font-mono text-app-caption text-muted-foreground">
    {x.sheet}
    {x.cell ? ` · ${x.cell}` : ''}
  </span>
)
const Group = ({ tone, title, children }: { tone: 'destructive' | 'warning' | 'success' | 'neutral'; title: React.ReactNode; children: React.ReactNode }) => (
  <div className={cn('flex flex-col gap-1 border-l-4 py-1 pl-4', { destructive: 'border-l-destructive', warning: 'border-l-warning', success: 'border-l-success', neutral: 'border-l-border-strong' }[tone])}>
    <h4 className="text-app-small font-semibold text-foreground">{title}</h4>
    {children}
  </div>
)
const Line = ({ children }: { children: React.ReactNode }) => <div className="flex flex-wrap items-center gap-3 border-b border-border py-2 text-app-small last:border-b-0">{children}</div>

// 1 · Piano. Il piano si prepara in Excel (4 fogli) e si importa: la
// piattaforma lo legge, corregge i nomi scritti male e segnala quello che va
// deciso. Si può anche correggere qui: valutatori dirigenti e colleghi (una
// riga per valutatore, le persone che valuta accanto) e l'elenco delle persone.
export function PianoTab({ state, update, toast, onGo }: { state: State5p; update: Update; toast: (m: string) => void; onGo: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [picker, setPicker] = useState<Picker | null>(null)
  const [q, setQ] = useState('')
  const [confirm, confirmDialog] = useConfirm()
  const P = people(state)
  const nOth = state.plan.filter((x) => x.tipo !== 'AUTO').length
  const nAuto = state.plan.filter((x) => x.tipo === 'AUTO').length
  const nEval = new Set(state.plan.map((x) => toks(x.valutatore).sort().join(' '))).size

  async function onFile(f: File) {
    if (!state.demo && state.plan.some((x) => x.tipo !== 'AUTO')) {
      const ok = await confirm({ title: 'Sostituire il piano attuale?', description: `Il piano viene sostituito con ${f.name}. Valutazioni raccolte, email e valori attesi restano.`, confirmLabel: 'Sì, sostituisci', destructive: true })
      if (!ok) return
    }
    try {
      const { X, wb } = await readWorkbook(f)
      const r = importPlan(X, wb, f.name, state)
      if ('error' in r) {
        toast(r.error)
        return
      }
      update(() => r.state)
      const L = r.state.log as PlanLog
      toast(`Piano importato: ${plural(people(r.state).length, 'persona', 'persone')}${L.verify.length ? ` · ${L.verify.length} nomi da verificare` : ''}${L.unknown.length ? ` · ${L.unknown.length} nomi non riconosciuti` : ''}`)
    } catch (e) {
      toast(`File non leggibile: ${e instanceof Error ? e.message : ''}`)
    }
  }
  function pickValutato(ev: string, tipo: SourceKey) {
    setPicker({
      role: tipo,
      title: `Chi valuta ${ev} ${SRC[tipo].as}?`,
      sub: 'Scegli la persona da aggiungere alla sua riga',
      sugLabel: tipo === 'DIR' ? 'Suggeriti: ancora senza dirigente' : `Suggeriti: meno di ${PEER_MIN} colleghi, prima i meno coperti`,
      items: (s) => personItems(s, ev, (n, c) => ({ dis: hasEntry(s, ev, 'DIR', n) ? 'già valutato come dirigente' : hasEntry(s, ev, 'PEER', n) ? 'già valutato come collega' : '', sug: tipo === 'DIR' ? c.DIR === 0 : c.PEER < PEER_MIN, rank: c.PEER })),
      onPick: (v) => update((s) => edit(s, (d) => void addEntry(d, ev, tipo, v))),
    })
  }
  function addEvaluator(tipo: SourceKey) {
    setPicker({
      role: tipo,
      title: tipo === 'DIR' ? 'Quale dirigente vuoi aggiungere come valutatore?' : 'Quale collega vuoi aggiungere come valutatore?',
      sub: 'Poi sceglierai la prima persona che valuta',
      items: (s) => personItems(s, null, (n) => ({ dis: evaluatorsOf(s, tipo).some((e) => same(e.name, n)) ? 'ha già una riga' : '', right: `valuta ${loadOf(s, n)}` })),
      onPick: (v) => setTimeout(() => pickValutato(v, tipo), 0),
    })
  }
  // Sposta una voce del controllo fra i corretti (confermata).
  const logMove = (d: State5p, list: 'verify' | 'unknown', x: LogEntry, extra: Partial<LogEntry>) => {
    const L = d.log as PlanLog
    const i = L[list].findIndex((y) => y.sheet === x.sheet && y.cell === x.cell && y.raw === x.raw)
    if (i < 0) return
    const [m] = L[list].splice(i, 1)
    L.auto.push({ ...m, ...extra })
  }
  function changeVerify(x: LogEntry) {
    setPicker({
      role: x.tipo,
      title: `Chi intendeva “${x.raw}”?`,
      sub: `Nella riga di ${x.ev} · ${x.sheet} ${x.cell}`,
      q: toks(x.raw)[0] || '',
      items: (s) => personItems(s, x.ev || null, (n) => ({ cur: same(n, x.res), dis: !same(n, x.res) && (hasEntry(s, x.ev!, 'DIR', n) || hasEntry(s, x.ev!, 'PEER', n)) ? 'già nella sua riga' : '' })),
      onPick: (v) =>
        update((s) =>
          edit(s, (d) => {
            removeEntry(d, x.ev!, x.tipo!, x.res!)
            addEntry(d, x.ev!, x.tipo!, v)
            logMove(d, 'verify', x, { res: v, confirmed: true })
          }),
        ),
    })
  }
  function pickUnknown(x: LogEntry) {
    setPicker({
      role: x.tipo,
      title: `Chi intendeva “${x.raw}”?`,
      sub: `Nella riga di ${x.ev} · ${x.sheet} ${x.cell}`,
      sugLabel: 'Nomi simili',
      items: (s) => personItems(s, x.ev || null, (n) => ({ sug: (x.cand || []).some((c) => same(c, n)), dis: hasEntry(s, x.ev!, 'DIR', n) || hasEntry(s, x.ev!, 'PEER', n) ? 'già nella sua riga' : '' })),
      onPick: (v) => resolveUnknown(x, v),
    })
  }
  const resolveUnknown = (x: LogEntry, v: string) =>
    update((s) =>
      edit(s, (d) => {
        addEntry(d, x.ev!, x.tipo!, v)
        logMove(d, 'unknown', x, { res: v, confirmed: true })
      }),
    )

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 basis-96">
            <h3 className="text-app-section text-foreground">Piano di valutazione</h3>
            <Note className="mt-1 max-w-3xl">
              Il piano si prepara in Excel con 4 fogli: <b className="font-semibold text-foreground">ELENCO NOMINATIVI</b>, <b className="font-semibold text-foreground">VALUTATORI DIRIGENTI</b>, <b className="font-semibold text-foreground">VALUTATORI PEER</b>, <b className="font-semibold text-foreground">AUTOVALUTAZIONI</b>. Nei fogli dei valutatori c&apos;è una riga per ogni valutatore e, accanto, le persone che valuta. Importa il file: la piattaforma lo legge, corregge i nomi scritti male e segnala quello che va deciso.
            </Note>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => fileRef.current?.click()}>Importa file Excel</Button>
            <Button variant="outline" onClick={() => void exportPlan(state, true)}>
              Scarica modello vuoto
            </Button>
            <Button variant="outline" onClick={() => (P.length ? void exportPlan(state, false) : toast("Non c'è ancora un piano: importa il file o scarica il modello vuoto"))}>
              Scarica piano corretto
            </Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = '' }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Persone" value={P.length} />
          <StatCard label="Dirigenti valutatori" value={evaluatorsOf(state, 'DIR').length} />
          <StatCard label="Colleghi valutatori" value={evaluatorsOf(state, 'PEER').length} />
          <StatCard label="Autovalutazioni" value={nAuto} />
          <StatCard label="Valutazioni da altri" value={nOth} note="dirigenti + colleghi" />
          <StatCard label="Schede da inviare" value={nEval} note="una per valutatore" />
        </div>
        <Note size="caption">{state.log ? `Ultimo file importato: ${state.log.file} il ${state.log.date.split('-').reverse().join('/')}` : state.demo ? '' : 'Nessun file importato: importa il piano o aggiungi le persone a mano.'}</Note>
      </div>

      <Checks state={state} update={update} onVerifyChange={changeVerify} onUnknownPick={pickUnknown} onUnknownResolve={resolveUnknown} logMove={logMove} />

      <Accordion type="multiple" defaultValue={['DIR']} className="flex flex-col gap-4">
        {(['DIR', 'PEER'] as const).map((t) => {
          const evs = evaluatorsOf(state, t)
          return (
            <AccordionItem key={t} value={t} className="rounded-lg border border-border px-4 last:border-b">
              <AccordionTrigger>
                <span className="flex flex-wrap items-baseline gap-3">
                  <span className="text-app-section text-foreground">{t === 'DIR' ? 'Valutatori dirigenti' : 'Valutatori peer (colleghi)'}</span>
                  <span className="text-app-small font-normal text-muted-foreground">
                    {plural(evs.length, 'valutatore', 'valutatori')} · {plural(evs.reduce((n, e) => n + e.list.length, 0), 'valutazione', 'valutazioni')}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-3">
                <Note>{t === 'DIR' ? 'Come nel foglio VALUTATORI DIRIGENTI: una riga per ogni dirigente e, accanto, le persone che valuta. ✕ toglie una persona, «Aggiungi» ne aggiunge una.' : 'Come nel foglio VALUTATORI PEER: una riga per ogni collega che valuta e, accanto, le persone che valuta.'}</Note>
                <Table frame minWidth="lg">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Valutatore</TableHead>
                      <TableHead>Chi valuta</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evs.length ? (
                      evs.map((e) => {
                        const p = personByName(state, e.name)
                        return (
                          <TableRow key={e.name}>
                            <TableCell className="min-w-52 align-top">
                              <b className="block font-semibold">{e.name}</b>
                              <small className="text-app-caption text-muted-foreground">
                                {plural(e.list.length, 'persona', 'persone')}
                                {p?.email ? '' : ' · '}
                                {p?.email ? null : <span className="text-warning">senza email</span>}
                              </small>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-2">
                                {[...e.list].sort((a, b) => a.localeCompare(b)).map((v) => {
                                  const c = coverage(state, v)
                                  const few = t === 'PEER' && c.PEER < PEER_MIN
                                  return (
                                    <Badge key={v} tone={few ? 'warning' : 'neutral'} title={`${v} è valutato da ${c.DIR} dirigente/i e ${c.PEER} colleghi`} className="normal-case tracking-normal" onRemove={() => update((s) => edit(s, (d) => removeEntry(d, e.name, t, v)))} removeLabel={`Togli ${v}`}>
                                      {v}
                                    </Badge>
                                  )
                                })}
                                <Button variant="ghost" size="sm" onClick={() => pickValutato(e.name, t)}>
                                  <Plus aria-hidden="true" />
                                  Aggiungi
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  if (await confirm({ title: `Togliere tutta la riga di ${e.name}?`, description: `${plural(e.list.length, 'valutazione', 'valutazioni')} ${SRC[t].as} escono dal piano.`, confirmLabel: 'Togli la riga', destructive: true }))
                                    update((s) => edit(s, (d) => { d.plan = d.plan.filter((x) => !(x.tipo === t && same(x.valutatore, e.name))) }))
                                }}
                              >
                                Rimuovi riga
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="py-4 text-muted-foreground">
                          Nessun valutatore {t === 'DIR' ? 'dirigente' : 'collega'}.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <div>
                  <Button variant="outline" size="sm" onClick={() => addEvaluator(t)}>
                    <Plus aria-hidden="true" />
                    {t === 'DIR' ? 'Aggiungi un dirigente valutatore' : 'Aggiungi un collega valutatore'}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
        <AccordionItem value="ppl" className="rounded-lg border border-border px-4 last:border-b">
          <AccordionTrigger>
            <span className="flex flex-wrap items-baseline gap-3">
              <span className="text-app-section text-foreground">Persone</span>
              <span className="text-app-small font-normal text-muted-foreground">
                {plural(P.length, 'persona', 'persone')} · {state.people.filter((p) => p.email).length} con email · {plural(groups(state).length, 'gruppo', 'gruppi')}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-3">
            <PeopleTable state={state} update={update} q={q} setQ={setQ} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-end">
        <Button onClick={onGo}>Avanti: invio schede →</Button>
      </div>
      {picker ? (
        <PersonPicker
          role={picker.role}
          title={picker.title}
          sub={picker.sub}
          sugLabel={picker.sugLabel}
          initialQuery={picker.q}
          items={picker.items(state)}
          onClose={() => setPicker(null)}
          onPick={(v) => {
            const fn = picker.onPick
            setPicker(null)
            fn(v)
          }}
        />
      ) : null}
      {confirmDialog}
    </section>
  )
}

// Il controllo del piano: nomi non riconosciuti e da verificare (da sistemare a
// mano), copertura, corretti automaticamente, celle ignorate o unite.
function Checks({
  state,
  update,
  onVerifyChange,
  onUnknownPick,
  onUnknownResolve,
  logMove,
}: {
  state: State5p
  update: Update
  onVerifyChange: (x: LogEntry) => void
  onUnknownPick: (x: LogEntry) => void
  onUnknownResolve: (x: LogEntry, v: string) => void
  logMove: (d: State5p, list: 'verify' | 'unknown', x: LogEntry, extra: Partial<LogEntry>) => void
}) {
  const L = state.log || { auto: [], verify: [], unknown: [], ignored: [], fixed: [], merged: [], added: [] }
  const ch = planChecks(state)
  const ok = [...L.auto, ...L.fixed]
  const inf = [...L.ignored, ...L.merged, ...L.added]
  const nothing = !L.unknown.length && !L.verify.length && !ch.noOthers.length && !ch.fewPeers.length && !ch.multiDir.length && !ch.heavy.length
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-app-section text-foreground">Controllo del piano</h3>
        <span className="flex gap-2">
          {L.unknown.length ? <Badge tone="destructive">{L.unknown.length} da sistemare</Badge> : null}
          {L.verify.length ? <Badge tone="warning">{L.verify.length} da verificare</Badge> : null}
          {!L.unknown.length && !L.verify.length && state.people.length ? <Badge tone="success">Nomi a posto</Badge> : null}
        </span>
      </div>
      {L.unknown.length ? (
        <Group tone="destructive" title={`Nomi non riconosciuti (${L.unknown.length})`}>
          <Note size="caption">Non corrispondono a nessuno dell&apos;elenco: scegli tu la persona o ignora la cella.</Note>
          {L.unknown.map((x) => (
            <Line key={`${x.sheet}${x.cell}`}>
              {where(x)}
              <span>
                “{x.raw}” nella riga di <b className="font-semibold">{x.ev}</b> ({x.tipo ? SRC[x.tipo].lab.toLowerCase() : ''})
              </span>
              {(x.cand || []).slice(0, 2).map((c) => (
                <Button key={c} size="sm" variant="outline" onClick={() => onUnknownResolve(x, c)}>
                  È {c}
                </Button>
              ))}
              <Button size="sm" variant="outline" onClick={() => onUnknownPick(x)}>
                Scegli la persona
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  update((s) =>
                    edit(s, (d) => {
                      const LL = d.log as PlanLog
                      const i = LL.unknown.findIndex((y) => y.sheet === x.sheet && y.cell === x.cell)
                      if (i >= 0) LL.ignored.push({ ...LL.unknown.splice(i, 1)[0], note: 'ignorato a mano' })
                    }),
                  )
                }
              >
                Ignora
              </Button>
            </Line>
          ))}
        </Group>
      ) : null}
      {L.verify.length ? (
        <Group tone="warning" title={`Nomi da verificare (${L.verify.length})`}>
          <Note size="caption">La piattaforma ha trovato una sola persona compatibile, ma il nome scritto è diverso: conferma o cambia.</Note>
          {L.verify.map((x, i) => {
            const sameRaw = L.verify.filter((y) => y.raw === x.raw)
            return (
              <Line key={`${x.sheet}${x.cell}`}>
                {where(x)}
                <span>
                  “{x.raw}” → <b className="font-semibold">{x.res}</b> <span className="text-app-caption text-muted-foreground">({x.note})</span>
                </span>
                <Button size="sm" variant="outline" onClick={() => update((s) => edit(s, (d) => logMove(d, 'verify', x, { confirmed: true })))}>
                  Conferma
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onVerifyChange(x)}>
                  Cambia
                </Button>
                {sameRaw.length > 1 && L.verify.findIndex((y) => y.raw === x.raw) === i ? (
                  <Button size="sm" variant="ghost" title="Conferma tutte le righe con lo stesso nome scritto" onClick={() => update((s) => edit(s, (d) => sameRaw.forEach((y) => logMove(d, 'verify', y, { confirmed: true }))))}>
                    Conferma tutti i {sameRaw.length} “{x.raw}”
                  </Button>
                ) : null}
              </Line>
            )
          })}
        </Group>
      ) : null}
      {ch.noOthers.length || ch.fewPeers.length || ch.multiDir.length || ch.heavy.length ? (
        <Group tone="warning" title="Copertura">
          {ch.noOthers.length ? (
            <>
              <p className="text-app-small">
                <b className="font-semibold">{plural(ch.noOthers.length, 'persona non è valutata', 'persone non sono valutate')}</b> da nessun dirigente o collega: avranno solo l&apos;autovalutazione e nessun voto finale. Se devono essere valutate, aggiungile alla riga di un valutatore.
              </p>
              <div className="flex flex-wrap gap-2">
                {ch.noOthers.map((n) => (
                  <Badge key={n} tone="warning" className="normal-case tracking-normal">{n}</Badge>
                ))}
              </div>
            </>
          ) : null}
          {ch.fewPeers.length ? (
            <>
              <p className="text-app-small">
                <b className="font-semibold">{plural(ch.fewPeers.length, 'persona ha', 'persone hanno')} meno di {PEER_MIN} colleghi</b> valutatori: la media dei colleghi resta riconoscibile. Tra parentesi quanti sono.
              </p>
              <div className="flex flex-wrap gap-2">
                {ch.fewPeers.map((n) => (
                  <Badge key={n} tone="neutral" className="normal-case tracking-normal">{n}</Badge>
                ))}
              </div>
            </>
          ) : null}
          {ch.multiDir.length ? <p className="text-app-small">Valutati da più di un dirigente: {ch.multiDir.join(', ')}. Va bene se è voluto.</p> : null}
          {ch.heavy.length ? <p className="text-app-small">Valutatori con più di 12 schede da compilare: {ch.heavy.join(', ')}.</p> : null}
        </Group>
      ) : null}
      {ok.length || inf.length ? (
        <Accordion type="multiple">
          {ok.length ? (
            <AccordionItem value="ok">
              <AccordionTrigger className="py-2 text-app-small">
                <span>
                  <b className="font-semibold">Corretti automaticamente ({ok.length})</b> <span className="font-normal text-muted-foreground">errori di battitura nei nomi, già sistemati</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                {ok.map((x, i) => (
                  <Line key={i}>
                    {where(x)}
                    <span>
                      “{x.raw}” → <b className="font-semibold">{x.res}</b>
                    </span>
                    {x.confirmed ? <Badge tone="success">Confermato</Badge> : null}
                  </Line>
                ))}
              </AccordionContent>
            </AccordionItem>
          ) : null}
          {inf.length ? (
            <AccordionItem value="inf">
              <AccordionTrigger className="py-2 text-app-small">
                <span>
                  <b className="font-semibold">Ignorati, uniti o aggiunti ({inf.length})</b> <span className="font-normal text-muted-foreground">celle che non sono entrate nel piano così com&apos;erano</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                {inf.map((x, i) => (
                  <Line key={i}>
                    {where(x)}
                    <span>
                      “{x.raw}”: {x.note}
                    </span>
                  </Line>
                ))}
              </AccordionContent>
            </AccordionItem>
          ) : null}
        </Accordion>
      ) : null}
      {nothing ? (
        <p className="text-app-small">
          <Badge tone="success">Nessun problema</Badge> Il piano è pronto per l&apos;invio.
        </p>
      ) : null}
    </div>
  )
}

// Elenco nominativi: l'email serve per inviare la scheda, l'area/gruppo per il
// valore atteso, la spunta Auto per chi compila anche l'autovalutazione.
function PeopleTable({ state, update, q, setQ }: { state: State5p; update: Update; q: string; setQ: (v: string) => void }) {
  const G = groups(state)
  const rows = state.people.map((p, i) => ({ p, i })).filter(({ p }) => !q.trim() || `${dn(p)} ${p.gruppo || ''}`.toLowerCase().includes(q.trim().toLowerCase()))
  const patch = (id: string, fn: (d: State5p, p: State5p['people'][number]) => void) =>
    update((s) =>
      edit(s, (d) => {
        const p = d.people.find((x) => x.id === id)
        if (p) fn(d, p)
      }),
    )
  return (
    <>
      <Note>
        Elenco nominativi. L&apos;<b className="font-semibold text-foreground">email</b> serve per inviare la scheda; l&apos;<b className="font-semibold text-foreground">area/gruppo</b> serve per il Valore Atteso; la spunta <b className="font-semibold text-foreground">Auto</b> indica chi compila anche l&apos;autovalutazione.
      </Note>
      <div className="flex flex-wrap items-center gap-3">
        <Input aria-label="Cerca persona" placeholder="Cerca nome o area" className="w-60" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setQ('')
            update((s) => edit(s, (d) => void addPerson(d, '', '', { auto: true })))
          }}
        >
          <Plus aria-hidden="true" />
          Aggiungi persona
        </Button>
      </div>
      <datalist id="dl5p-groups">
        {G.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>
      <div className="max-h-[70vh] overflow-auto rounded-sm border border-border">
        <Table minWidth="lg">
          <TableHeader className="sticky top-0 z-10">
            <TableRow>
              <TableHead className="text-center">#</TableHead>
              <TableHead>Cognome</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Valuta come</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Area / gruppo</TableHead>
              <TableHead className="text-center">Auto</TableHead>
              <TableHead>Valutato da</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ p, i }) => {
              const n = dn(p)
              const c = coverage(state, n)
              const oth = c.DIR + c.PEER
              const inp = (f: 'cog' | 'nom' | 'email' | 'gruppo', label: string, extra?: { type?: string; list?: string; placeholder?: string }) => (
                <Input
                  size="sm"
                  aria-label={label}
                  key={`${p.id}-${f}-${p[f]}`}
                  defaultValue={p[f]}
                  {...extra}
                  onBlur={(e) => {
                    const v = e.target.value.trim()
                    if (v === (p[f] || '')) return
                    patch(p.id, (d, x) => {
                      if (f === 'cog' || f === 'nom') {
                        renamePerson(d, x, f === 'cog' ? v : x.cog, f === 'nom' ? v : x.nom)
                        syncAuto(d)
                      } else x[f] = v
                    })
                  }}
                />
              )
              return (
                <TableRow key={p.id}>
                  <TableCell className="text-center font-mono text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="min-w-36">{inp('cog', 'Cognome')}</TableCell>
                  <TableCell className="min-w-32">{inp('nom', 'Nome')}</TableCell>
                  <TableCell>
                    <span className="flex gap-1">
                      {p.roles.dir ? <Badge>Dirigente</Badge> : null}
                      {p.roles.peer ? <Badge>Collega</Badge> : null}
                    </span>
                  </TableCell>
                  <TableCell className="min-w-52">{inp('email', 'Email', { type: 'email', placeholder: 'nome@azienda.it' })}</TableCell>
                  <TableCell className="min-w-40">{inp('gruppo', 'Area o gruppo', { list: 'dl5p-groups', placeholder: '—' })}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox aria-label={`Autovalutazione di ${n}`} checked={p.auto} onCheckedChange={(v) => patch(p.id, (d, x) => { x.auto = v === true; syncAuto(d) })} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-app-caption">
                    {oth ? (
                      <span className="flex items-center gap-2">
                        {c.DIR ? `${plural(c.DIR, 'dirigente', 'dirigenti')} · ` : ''}
                        {plural(c.PEER, 'collega', 'colleghi')}
                        {c.PEER > 0 && c.PEER < PEER_MIN ? <Badge tone="warning">Meno di 3</Badge> : null}
                      </span>
                    ) : (
                      <Badge tone="warning">Solo auto</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DeleteButton name={n || 'riga'} onConfirm={() => update((s) => edit(s, (d) => removePerson(d, p.id)))} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
function DeleteButton({ name, onConfirm }: { name: string; onConfirm: () => void }) {
  const [confirm, dialog] = useConfirm()
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Elimina ${name}`}
        onClick={async () => {
          if (await confirm({ title: `Eliminare ${name}?`, description: 'La persona esce dall’elenco e dal piano, come valutato e come valutatore.', confirmLabel: 'Elimina', destructive: true })) onConfirm()
        }}
      >
        <Trash2 aria-hidden="true" />
      </Button>
      {dialog}
    </>
  )
}
