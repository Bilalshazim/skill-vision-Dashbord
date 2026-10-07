import { Trash2 } from 'lucide-react'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { downloadAnaTpl, readWorkbook } from '@/modules/assessment/gestione5p/files'
import { type Person, type State5p, blank, edit, norm, parseAnagrafica, preparePlan, renameEverywhere, uid } from '@/modules/assessment/gestione5p/model'

type Field = 'nome' | 'ruolo' | 'reparto' | 'resp' | 'email'
const COLS: [Field, string][] = [
  ['nome', 'Nome e cognome'],
  ['ruolo', 'Ruolo'],
  ['reparto', 'Reparto'],
  ['resp', 'Responsabile'],
  ['email', "Email (per l'invio)"],
]

// 1 · Anagrafica. Responsabile e Reparto servono a preparare la proposta di chi
// valuta chi (passo 2), che poi si cambia; l'Email serve per l'elenco invii.
// Chi valuta ma non è valutato (es. un dirigente) basta indicarlo come responsabile.
export function AnagraficaTab({ state, update, toast, onGo }: { state: State5p; update: (fn: (s: State5p) => State5p) => void; toast: (m: string) => void; onGo: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const names = new Set(state.people.map((p) => norm(p.nome)))
  const reparti = new Set(state.people.map((p) => p.reparto).filter(Boolean))

  function patch(i: number, field: Field, value: string) {
    update((s) =>
      edit(s, (d) => {
        const p = d.people[i]
        const old = p[field] ?? ''
        p[field] = value.trim()
        if (field === 'nome' && old && p.nome && norm(old) !== norm(p.nome)) renameEverywhere(d, old, p.nome)
      }),
    )
  }
  async function onFile(f: File) {
    try {
      const { X, wb } = await readWorkbook(f)
      const list = parseAnagrafica(X, wb)
      if (!list.length) {
        toast('Nessun nominativo trovato nel file')
        return
      }
      update((s) => {
        const d = s.demo ? blank() : structuredClone(s)
        d.people = list
        d.plan = []
        d.assign = {}
        d.assignSig = ''
        preparePlan(d)
        return d
      })
      toast(`${list.length} dipendenti importati`)
    } catch (e) {
      toast(`File non leggibile: ${e instanceof Error ? e.message : ''}`)
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-app-section text-foreground">Dipendenti da valutare</h3>
          <p className="max-w-3xl text-app-small text-muted-foreground">
            <b className="font-semibold text-foreground">Responsabile</b> e <b className="font-semibold text-foreground">Reparto</b> servono a preparare la proposta di chi valuta chi (passo 2), che poi puoi cambiare. L&apos;<b className="font-semibold text-foreground">Email</b> serve per l&apos;elenco invii. Chi valuta ma non è valutato (es. un dirigente) basta indicarlo come responsabile.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void downloadAnaTpl()}>
            Scarica modello anagrafica
          </Button>
          <Button onClick={() => fileRef.current?.click()}>Importa anagrafica Excel/CSV</Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = '' }} />
        </div>
      </div>
      <Table frame minWidth="lg">
        <TableHeader>
          <TableRow>
            {COLS.map(([k, l]) => (
              <TableHead key={k}>{l}</TableHead>
            ))}
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.people.map((p: Person, i) => (
            <TableRow key={p.id}>
              {COLS.map(([f]) => (
                <TableCell key={f}>
                  <div className="flex items-center gap-2">
                    <Input size="sm" type={f === 'email' ? 'email' : 'text'} list={f === 'resp' ? 'dl5p-names' : undefined} aria-label={`${f} riga ${i + 1}`} defaultValue={p[f] ?? ''} onBlur={(e) => e.target.value.trim() !== (p[f] ?? '') && patch(i, f, e.target.value)} />
                    {f === 'resp' && p.resp && !names.has(norm(p.resp)) ? <Badge tone="neutral">esterno</Badge> : null}
                  </div>
                </TableCell>
              ))}
              <TableCell>
                <Button variant="ghost" size="icon" aria-label={`Elimina ${p.nome || 'riga'}`} onClick={() => update((s) => edit(s, (d) => { d.people.splice(i, 1) }))}>
                  <Trash2 aria-hidden="true" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <datalist id="dl5p-names">
        {state.people.map((p) => (
          <option key={p.id} value={p.nome} />
        ))}
      </datalist>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => update((s) => edit(s, (d) => { d.people.push({ id: uid(), nome: '', ruolo: '', reparto: '', resp: '', email: '' }) }))}>
          + Aggiungi dipendente
        </Button>
        <span className="text-app-small text-muted-foreground">
          {state.people.length} dipendenti · {reparti.size} reparti
        </span>
      </div>
      <div className="flex justify-end">
        <Button onClick={onGo}>Avanti: assegnazioni →</Button>
      </div>
    </section>
  )
}
