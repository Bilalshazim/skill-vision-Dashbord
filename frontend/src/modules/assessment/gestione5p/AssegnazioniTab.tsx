import { useMemo, useRef, useState } from 'react'

import { ModalDialog } from '@/components/patterns/ModalDialog'
import { Field } from '@/components/patterns/Field'
import { StatCard } from '@/components/patterns/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { exportAssign, importAssign } from '@/modules/assessment/gestione5p/files'
import { type Person, SRC, type State5p, edit, fillSlots, loadMap, nameList, norm, okPeer, peerN, people, personByName, repOf, rowCheck } from '@/modules/assessment/gestione5p/model'
import { cn } from '@/lib/utils'

type Slot = { pid: string; slot: string }

// 2 · Assegnazioni. Una riga per dipendente; accanto al nome, chi lo valuta.
// L'autovalutazione è sempre inclusa; responsabile e colleghi si scelgono con un
// clic dalla casella (elenco con ricerca, suggeriti in cima, carico accanto).
export function AssegnazioniTab({ state, update, toast, onGo }: { state: State5p; update: (fn: (s: State5p) => State5p) => void; toast: (m: string) => void; onGo: () => void }) {
  const [q, setQ] = useState('')
  const [onlyWarn, setOnlyWarn] = useState(false)
  const [picker, setPicker] = useState<Slot | null>(null)
  const [autoMenu, setAutoMenu] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const N = peerN(state)
  const P = people(state)
  const ld = loadMap(state)

  const rows = P.map((p, idx) => {
    const a = state.assign[p.id]
    const c = rowCheck(state, p, a)
    return { p, a, c, idx, bad: c.e.length > 0 || c.w.length > 0 }
  })
  const nWarn = rows.filter((r) => r.bad).length
  const nErr = rows.filter((r) => r.c.e.length).length
  const shown = rows.filter((r) => (!q.trim() || `${r.p.nome} ${r.p.ruolo || ''} ${repOf(r.p)}`.toLowerCase().includes(q.trim().toLowerCase())) && (!onlyWarn || r.bad))
  const ks = Object.keys(ld)
  const top = ks.reduce<string | null>((t, k) => (t == null || ld[k] > ld[t] ? k : t), null)
  const topName = top ? nameList(state).find((o) => norm(o.nome) === top)?.nome ?? '' : ''

  function setPeerN(n: number) {
    update((s) =>
      edit(s, (d) => {
        d.set.peerN = Math.max(0, Math.min(6, Math.round(n || 0)))
        people(d).forEach((p) => {
          const a = d.assign[p.id]
          if (!a || a.auto) return
          const old = a.peers.length
          if (d.set.peerN > old) fillSlots(d, p, a, old)
        })
      }),
    )
  }
  function auto(act: 'empty' | 'all') {
    setAutoMenu(false)
    update((s) =>
      edit(s, (d) => {
        if (act === 'all') {
          d.assign = {}
          d.assignSig = ''
        }
      }),
    )
    if (act === 'empty')
      update((s) =>
        edit(s, (d) =>
          people(d).forEach((p) => {
            const x = d.assign[p.id]
            if (!x.resp && p.resp) x.resp = p.resp
            fillSlots(d, p, x, 0)
          }),
        ),
      )
    toast(act === 'empty' ? 'Caselle vuote completate dove possibile' : 'Proposta automatica rifatta per tutti')
  }
  function choose(slot: Slot, v: string) {
    update((s) =>
      edit(s, (d) => {
        const a = d.assign[slot.pid]
        if (slot.slot === 'resp') a.resp = v
        else a.peers[+slot.slot.slice(1)] = v
        a.auto = false
      }),
    )
    setPicker(null)
  }
  async function onFile(f: File) {
    try {
      const r = await importAssign(state, f)
      if ('error' in r) toast(r.error)
      else {
        update(() => r.state)
        toast(r.msg)
      }
    } catch (e) {
      toast(`File non leggibile: ${e instanceof Error ? e.message : ''}`)
    }
  }

  const byVal: Record<string, { tipo: keyof typeof SRC; valutato: string }[]> = {}
  state.plan.forEach((x) => (byVal[x.valutatore] = byVal[x.valutatore] || []).push(x))

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div>
          <h3 className="text-app-section text-foreground">Chi valuta chi</h3>
          <p className="max-w-3xl text-app-small text-muted-foreground">
            Una riga per ogni dipendente. Accanto al nome ci sono le persone che lo valuteranno: l&apos;<b className="font-semibold text-foreground">autovalutazione</b> è sempre inclusa, il <b className="font-semibold text-foreground">responsabile</b> e i <b className="font-semibold text-foreground">colleghi</b> li scegli tu. Il sistema ha già preparato una proposta: per cambiare un valutatore <b className="font-semibold text-foreground">clicca sulla casella e scegli il nome</b>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-app-caption text-muted-foreground">
          <span>Casella piena: scelta</span>
          <span>Tratteggiata: da scegliere</span>
          <Badge tone="warning">Da controllare</Badge>
          <Badge tone="destructive">Errore da correggere</Badge>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Colleghi per dipendente" className="w-44">
            <Input type="number" min={0} max={6} value={N} onChange={(e) => setPeerN(+e.target.value)} />
          </Field>
          {N < 3 ? <span className="pb-2 text-app-caption text-muted-foreground">Con meno di 3 colleghi la media dei colleghi diventa riconoscibile.</span> : null}
          {autoMenu ? (
            <span className="flex flex-wrap items-center gap-2 pb-0.5 text-app-small">
              Proposta automatica:
              <Button size="sm" variant="outline" onClick={() => auto('empty')}>
                Completa solo le caselle vuote
              </Button>
              <Button size="sm" variant="destructive" onClick={() => auto('all')}>
                Rifai tutto da capo
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAutoMenu(false)}>
                Annulla
              </Button>
            </span>
          ) : (
            <Button variant="outline" onClick={() => setAutoMenu(true)}>
              Proposta automatica
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input aria-label="Cerca dipendente, ruolo o reparto" placeholder="Cerca dipendente, ruolo o reparto" className="w-72" value={q} onChange={(e) => setQ(e.target.value)} />
          <label className="flex items-center gap-2 text-app-small">
            <Checkbox checked={onlyWarn} onCheckedChange={(c) => setOnlyWarn(c === true)} />
            Mostra solo le righe da controllare
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard label="Dipendenti" value={P.length} />
          <StatCard label="Schede da raccogliere" value={state.plan.length} />
          <StatCard label="Valutatori" value={ks.length} />
          <StatCard label="Righe da controllare" value={nWarn} note={nErr ? `${nErr} con errori` : undefined} tone={nErr ? 'destructive' : nWarn ? 'warning' : 'neutral'} />
          <StatCard label="Carico massimo" value={top ? `${ld[top]} schede` : '–'} note={topName || undefined} />
        </div>
      </div>

      <div className="max-h-[72vh] overflow-auto rounded-sm border border-border">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow>
              <TableHead className="sticky left-0 z-20 bg-muted">Dipendente da valutare</TableHead>
              <TableHead>Autovalutazione</TableHead>
              <TableHead>Responsabile</TableHead>
              {Array.from({ length: N }, (_, i) => (
                <TableHead key={i}>Collega {i + 1}</TableHead>
              ))}
              <TableHead>Controllo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!P.length ? (
              <TableRow>
                <TableCell colSpan={N + 4} className="py-5 text-muted-foreground">
                  Nessun dipendente: inserisci prima l&apos;anagrafica (passo 1).
                </TableCell>
              </TableRow>
            ) : !shown.length ? (
              <TableRow>
                <TableCell colSpan={N + 4} className="text-muted-foreground">
                  Nessuna riga con questi filtri.
                </TableCell>
              </TableRow>
            ) : (
              shown.map(({ p, a, c, idx, bad }) => (
                <TableRow key={p.id} className="align-middle">
                  <TableCell className="sticky left-0 z-10 min-w-48 bg-card">
                    <span className="mr-2 float-left font-mono text-app-caption text-muted-foreground">{idx + 1}</span>
                    <b className="block font-semibold">{p.nome}</b>
                    <small className="block text-app-caption text-muted-foreground">{[p.ruolo, p.reparto].filter(Boolean).join(' · ')}</small>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-app-small font-medium">✓ sé stesso</TableCell>
                  <TableCell>
                    <PickBtn value={a.resp} label="Responsabile" kind="resp" state={c.cell.resp} onClick={() => setPicker({ pid: p.id, slot: 'resp' })} />
                  </TableCell>
                  {a.peers.slice(0, N).map((v, i) => (
                    <TableCell key={i}>
                      <PickBtn value={v} label={`Collega ${i + 1}`} kind="peer" state={c.cell[`p${i}`]} onClick={() => setPicker({ pid: p.id, slot: `p${i}` })} />
                    </TableCell>
                  ))}
                  <TableCell className="min-w-44 text-app-caption">
                    {!bad ? <Badge tone="success">OK</Badge> : null}
                    {c.e.map((m) => (
                      <span key={m} className="block font-semibold text-destructive">✕ {m}</span>
                    ))}
                    {c.w.map((m) => (
                      <span key={m} className="block text-warning">! {m}</span>
                    ))}
                    {c.i.map((m) => (
                      <span key={m} className="block text-muted-foreground">{m}</span>
                    ))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
        <div className="min-w-0 flex-1 basis-80">
          <h3 className="text-app-subtitle font-semibold text-foreground">Preferisci lavorare in Excel?</h3>
          <p className="text-app-small text-muted-foreground">Scarica la stessa tabella in Excel: una riga per dipendente, caselle gialle con il menu a tendina dei nomi. Puoi farla compilare a chi conosce l&apos;organizzazione e poi reimportarla qui.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void exportAssign(state)}>
            Scarica tabella in Excel
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            Importa tabella compilata
          </Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = '' }} />
        </div>
      </div>

      <details className="rounded-lg border border-border p-4">
        <summary className="cursor-pointer text-app-small">
          <b className="font-semibold">Vista per valutatore</b> <span className="text-muted-foreground">· quante schede riceverà ognuno e chi deve valutare</span>
        </summary>
        {state.plan.length ? (
          <Table frame className="mt-3">
            <TableHeader>
              <TableRow>
                <TableHead>Valutatore</TableHead>
                <TableHead className="text-center">Schede</TableHead>
                <TableHead>Deve valutare</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(byVal).sort((a, b) => a[0].localeCompare(b[0])).map(([v, l]) => (
                <TableRow key={v}>
                  <TableCell className="font-semibold">{v}</TableCell>
                  <TableCell className="text-center font-mono tabular-nums">{l.length}</TableCell>
                  <TableCell className="text-app-caption">
                    {l.map((x, i) => (
                      <span key={`${x.tipo}-${x.valutato}`}>
                        {i ? ' · ' : ''}
                        <span className="whitespace-nowrap">
                          {x.tipo === 'AUTO' ? 'sé stesso' : x.valutato} <span className="font-mono">({x.tipo === 'AUTO' ? 'auto' : x.tipo === 'DIR' ? 'resp.' : 'collega'})</span>
                        </span>
                      </span>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </details>

      <div className="flex justify-end">
        <Button onClick={onGo}>Avanti: invio schede →</Button>
      </div>
      {picker ? <PickerDialog state={state} slot={picker} onChoose={(v) => choose(picker, v)} onClose={() => setPicker(null)} /> : null}
    </section>
  )
}

function PickBtn({ value, label, kind, state, onClick }: { value: string; label: string; kind: 'resp' | 'peer'; state?: 'warn' | 'err'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${label}: ${value || 'da scegliere'}`}
      className={cn(
        'block w-full min-w-36 max-w-56 overflow-hidden rounded-sm border border-l-4 px-2.5 py-1.5 text-left text-app-small text-ellipsis whitespace-nowrap outline-none transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        kind === 'resp' ? 'border-l-foreground' : 'border-l-border-strong',
        value ? 'border-border bg-card' : 'border-dashed border-border text-muted-foreground',
        state === 'warn' && 'surface-warning',
        state === 'err' && 'surface-danger border-destructive',
      )}
    >
      {value || '+ Scegli'}
    </button>
  )
}

// L'elenco con ricerca: in cima i suggeriti (per i colleghi, stesso reparto, prima
// i meno carichi), accanto a ogni nome quante schede deve già compilare; le scelte
// sbagliate (la persona stessa, o qualcuno già scelto nella riga) non si selezionano.
function PickerDialog({ state, slot, onChoose, onClose }: { state: State5p; slot: Slot; onChoose: (v: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [act, setAct] = useState(-1)
  const p = state.people.find((x) => x.id === slot.pid) as Person
  const a = state.assign[p.id]
  const isR = slot.slot === 'resp'
  const N = peerN(state)
  const me = norm(p.nome)
  const cur = isR ? a.resp : a.peers[+slot.slot.slice(1)] || ''
  const list = useMemo(() => {
    const taken = new Map<string, string>()
    if (a.resp) taken.set(norm(a.resp), 'responsabile')
    a.peers.slice(0, N).forEach((v, i) => { if (v && !taken.has(norm(v))) taken.set(norm(v), `collega ${i + 1}`) })
    const ld = loadMap(state)
    const mgr = new Set(state.people.map((x) => norm(x.resp)).filter(Boolean))
    return nameList(state).map((o) => {
      const n = norm(o.nome)
      const x = personByName(state, o.nome)
      let dis = ''
      let tag = ''
      if (n === me) dis = 'è la persona da valutare'
      else if (taken.has(n) && n !== norm(cur)) dis = `già scelto come ${taken.get(n)}`
      if (!dis) {
        if (isR && n === norm(p.resp)) tag = 'responsabile in anagrafica'
        else if (!isR && x && norm(x.resp) === me) tag = 'suo collaboratore'
        else if (!isR && x && repOf(x) === repOf(p)) tag = 'stesso reparto'
        else if (o.ext) tag = "esterno all'anagrafica"
      }
      const sug = !dis && (isR ? n === norm(p.resp) || mgr.has(n) : !!(x && repOf(x) === repOf(p) && okPeer(p, x)))
      return { ...o, n, dis, tag, sug, cur: !!cur && n === norm(cur), ld: ld[n] || 0 }
    })
  }, [state, a, N, me, cur, isR, p])
  const raw = q.trim()
  const f = list.filter((o) => !raw || `${o.nome} ${o.ruolo} ${o.reparto}`.toLowerCase().includes(raw.toLowerCase()))
  const sug = f.filter((o) => o.sug).sort((x, y) => x.ld - y.ld || x.nome.localeCompare(y.nome))
  const oth = f.filter((o) => !o.sug).sort((x, y) => Number(!!x.dis) - Number(!!y.dis) || x.nome.localeCompare(y.nome))
  const enabled = [...sug, ...oth].filter((o) => !o.dis)

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!enabled.length) return
      setAct((i) => (e.key === 'ArrowDown' ? Math.min(i + 1, enabled.length - 1) : Math.max(i - 1, 0)))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const o = enabled[act >= 0 ? act : 0]
      if (o && (act >= 0 || raw)) onChoose(o.nome)
    }
  }
  const opt = (o: (typeof list)[number]) => (
    <button
      key={o.n}
      type="button"
      role="option"
      aria-selected={o.cur}
      disabled={!!o.dis}
      onClick={() => onChoose(o.nome)}
      className={cn('grid w-full grid-cols-[1fr_auto] gap-x-3 rounded-sm px-3 py-2 text-left hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60', o.cur && 'border-l-4 border-l-foreground', enabled[act] === o && 'bg-accent')}
    >
      <b className="text-app-small font-semibold">{o.nome}{o.cur ? ' · scelto ora' : ''}</b>
      <span className="row-span-2 self-center font-mono text-app-caption text-muted-foreground">{o.ld} {o.ld === 1 ? 'scheda' : 'schede'}</span>
      <small className="text-app-caption text-muted-foreground">{[o.ruolo, o.reparto].filter(Boolean).join(' · ')}{o.dis ? ` — ${o.dis}` : o.tag ? ` — ${o.tag}` : ''}</small>
    </button>
  )

  return (
    <ModalDialog
      title={`Chi valuta ${p.nome} ${isR ? 'come responsabile' : 'come collega'}?`}
      sub={[p.ruolo, p.reparto].filter(Boolean).join(' · ') || undefined}
      onClose={onClose}
      footer={
        <>
          <span className="mr-auto text-app-caption text-muted-foreground">↑ ↓ per scorrere · Invio per scegliere · Esc per chiudere</span>
          <Button variant="outline" onClick={() => onChoose('')}>
            Lascia la casella vuota
          </Button>
        </>
      }
    >
      <Input autoFocus aria-label="Cerca valutatore" placeholder="Cerca per nome, ruolo o reparto" value={q} onChange={(e) => { setQ(e.target.value); setAct(-1) }} onKeyDown={onKey} />
      <div role="listbox" className="mt-3 flex flex-col gap-0.5">
        {sug.length ? <div className="label-mono px-3 pt-2 pb-1 text-muted-foreground">{isR ? 'Suggeriti: responsabili' : 'Suggeriti: stesso reparto, prima i meno carichi'}</div> : null}
        {sug.map(opt)}
        {oth.length ? <div className="label-mono px-3 pt-2 pb-1 text-muted-foreground">{sug.length ? 'Tutti gli altri' : 'Persone'}</div> : null}
        {oth.map(opt)}
        {raw && !f.length ? (
          <button type="button" role="option" aria-selected={false} onClick={() => onChoose(raw)} className="rounded-sm px-3 py-2 text-left hover:bg-accent">
            <b className="block text-app-small font-semibold">Usa «{raw}»</b>
            <small className="text-app-caption text-muted-foreground">Valutatore esterno all&apos;anagrafica</small>
          </button>
        ) : null}
        {!list.length ? <p className="p-2 text-app-small text-muted-foreground">Nessun nome in elenco.</p> : null}
      </div>
    </ModalDialog>
  )
}
