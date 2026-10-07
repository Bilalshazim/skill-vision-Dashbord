import { useState } from 'react'

import { Field } from '@/components/patterns/Field'
import { StatCard } from '@/components/patterns/StatCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { downloadBlank, downloadFlat, downloadPlan, downloadSchede } from '@/modules/assessment/gestione5p/files'
import { type PlanItem, SRC, type State5p, buildPlan, encodeSheet, sheetFor } from '@/modules/assessment/gestione5p/model'

// 2 · Piano e schede. Ogni dipendente riceve: 1 autovalutazione, 1 valutazione
// dal proprio responsabile, N valutazioni da colleghi dello stesso reparto, a
// rotazione. Le schede si scaricano precompilate (Excel, uno ZIP) oppure si
// compilano subito sulla piattaforma dal pulsante accanto a ogni nome.
export function PianoTab({ state, update, toast }: { state: State5p; update: (fn: (s: State5p) => State5p) => void; toast: (m: string) => void }) {
  const [peerN, setPeerN] = useState(String(state.set.peerN))
  const c = { DIR: 0, PEER: 0, AUTO: 0 }
  state.plan.forEach((x) => c[x.tipo]++)
  const valutatori = new Set(state.plan.map((x) => x.valutatore))
  const by: Record<string, PlanItem[]> = {}
  state.plan.forEach((x) => (by[x.valutatore] = by[x.valutatore] || []).push(x))
  const linkFor = (v: string) => `${window.location.origin}/assessment/scheda-5p#d=${encodeSheet(sheetFor(state, v))}`
  const need = (): boolean => {
    if (!state.plan.length) toast('Genera prima il piano')
    return state.plan.length > 0
  }

  function generate() {
    if (!state.people.length) {
      toast("Prima inserisci l'anagrafica")
      return
    }
    const n = Math.max(1, Math.min(8, +peerN || 3))
    update((s) => {
      const next = { ...s, set: { ...s.set, peerN: n } }
      return { ...next, plan: buildPlan(next) }
    })
    toast('Piano generato')
  }
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-app-section text-foreground">Chi valuta chi</h3>
            <p className="max-w-3xl text-app-small text-muted-foreground">Ogni dipendente riceve: 1 autovalutazione, 1 valutazione dal proprio responsabile, N valutazioni da colleghi dello stesso reparto (assegnate a rotazione, così ognuno ha un carico simile).</p>
          </div>
          <div className="flex items-end gap-2">
            <Field label="Colleghi per persona" className="w-32">
              <Input type="number" min={1} max={8} value={peerN} onChange={(e) => setPeerN(e.target.value)} />
            </Field>
            <Button onClick={generate}>Genera piano</Button>
          </div>
        </div>
        {state.plan.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatCard label="Valutazioni totali" value={state.plan.length} />
            <StatCard label="Valutatori" value={valutatori.size} />
            <StatCard label="Dirigente" value={c.DIR} />
            <StatCard label="Peer" value={c.PEER} />
            <StatCard label="Autovalutazioni" value={c.AUTO} />
          </div>
        ) : (
          <p className="text-app-small text-muted-foreground">Nessun piano. Premi &quot;Genera piano&quot;.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => need() && void downloadPlan(state)}>
            Scarica piano (Excel)
          </Button>
          <Button onClick={() => need() && void downloadSchede(state)}>Scarica schede precompilate (ZIP)</Button>
          <Button variant="outline" onClick={() => void downloadBlank()}>
            Scheda vuota
          </Button>
          <Button variant="outline" onClick={() => void downloadFlat()}>
            Modello per Microsoft/Google Forms
          </Button>
        </div>
        <p className="text-app-caption text-muted-foreground">Lo ZIP contiene un file Excel per ogni valutatore, con un foglio per ciascuna persona che deve valutare: nome, ruolo e tipo di valutazione sono già scritti. Il valutatore compila solo SCORE (1–10) e NOTE, poi restituisce il file. In alternativa il valutatore compila la scheda online dal link della riga: le risposte tornano come file, o direttamente qui se la apri da questo browser.</p>
      </div>
      {state.plan.length ? (
        <Table frame minWidth="lg">
          <TableHeader>
            <TableRow>
              <TableHead>Valutatore</TableHead>
              <TableHead className="text-center">Schede</TableHead>
              <TableHead>Deve valutare</TableHead>
              <TableHead>Scheda online</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(by)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([v, list]) => (
                <TableRow key={v} className="align-top">
                  <TableCell className="font-semibold">{v}</TableCell>
                  <TableCell className="text-center font-mono tabular-nums">{list.length}</TableCell>
                  <TableCell>
                    {list.map((x, i) => (
                      <span key={`${x.tipo}-${x.valutato}`}>
                        {i ? ' · ' : ''}
                        <span className="whitespace-nowrap">
                          {x.tipo === 'AUTO' ? 'sé stesso' : x.valutato} <span className="font-mono">({SRC[x.tipo].sh})</span>
                        </span>
                      </span>
                    ))}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => window.open(linkFor(v), '_blank', 'noopener')}>
                        Apri
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(linkFor(v)).then(() => toast('Link copiato'), () => toast('Copia non riuscita'))}>
                        Copia link
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      ) : null}
    </section>
  )
}
