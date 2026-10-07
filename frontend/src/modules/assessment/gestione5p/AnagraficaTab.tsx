import { Trash2 } from 'lucide-react'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { downloadAnaTpl, readWorkbook } from '@/modules/assessment/gestione5p/files'
import { type Person, type State5p, blank, parseAnagrafica, uid } from '@/modules/assessment/gestione5p/model'

// 1 · Anagrafica. Il campo Responsabile decide chi fa la valutazione Dirigente;
// il Reparto decide chi sono i colleghi Peer. Si inserisce a mano o si importa
// da Excel/CSV (con il modello da scaricare).
export function AnagraficaTab({ state, update, toast }: { state: State5p; update: (fn: (s: State5p) => State5p) => void; toast: (m: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const reparti = new Set(state.people.map((p) => p.reparto).filter(Boolean))

  function patch(i: number, field: keyof Person, value: string) {
    update((s) => ({ ...s, people: s.people.map((p, j) => (j === i ? { ...p, [field]: value.trim() } : p)) }))
  }
  async function onFile(f: File) {
    try {
      const { X, wb } = await readWorkbook(f)
      const list = parseAnagrafica(X, wb)
      if (!list.length) {
        toast('Nessun nominativo trovato nel file')
        return
      }
      update((s) => ({ ...(s.demo ? blank() : s), people: list, plan: [] }))
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
          <p className="text-app-small text-muted-foreground">
            Il campo <b className="font-semibold text-foreground">Responsabile</b> decide chi fa la valutazione Dirigente. Il <b className="font-semibold text-foreground">Reparto</b> decide chi sono i colleghi Peer.
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
            <TableHead>Nome e cognome</TableHead>
            <TableHead>Ruolo</TableHead>
            <TableHead>Reparto</TableHead>
            <TableHead>Responsabile</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.people.map((p, i) => (
            <TableRow key={p.id}>
              {(['nome', 'ruolo', 'reparto', 'resp'] as const).map((f) => (
                <TableCell key={f}>
                  <Input size="sm" list={f === 'resp' ? 'dl5p-names' : undefined} aria-label={`${f} riga ${i + 1}`} defaultValue={p[f]} onBlur={(e) => e.target.value.trim() !== p[f] && patch(i, f, e.target.value)} />
                </TableCell>
              ))}
              <TableCell>
                <Button variant="ghost" size="icon" aria-label={`Rimuovi ${p.nome || 'riga'}`} onClick={() => update((s) => ({ ...s, people: s.people.filter((_, j) => j !== i) }))}>
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
        <Button variant="outline" onClick={() => update((s) => ({ ...s, people: [...s.people, { id: uid(), nome: '', ruolo: '', reparto: '', resp: '' }] }))}>
          + Aggiungi dipendente
        </Button>
        <span className="text-app-small text-muted-foreground">
          {state.people.length} dipendenti · {reparti.size} reparti
        </span>
      </div>
    </section>
  )
}
