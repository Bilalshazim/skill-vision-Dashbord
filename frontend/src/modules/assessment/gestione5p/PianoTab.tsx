import { useState } from 'react'

import { Field } from '@/components/patterns/Field'
import { StatCard } from '@/components/patterns/StatCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CompilaDialog, evalKey } from '@/modules/assessment/gestione5p/CompilaDialog'
import { downloadBlank, downloadFlat, downloadPlan, downloadSchede } from '@/modules/assessment/gestione5p/files'
import { type Eval5p, type PlanItem, SRC, type State5p, buildPlan } from '@/modules/assessment/gestione5p/model'
import { SourceTag } from '@/modules/assessment/gestione5p/SourceTag'

// 2 · Piano e schede. Ogni dipendente riceve: 1 autovalutazione, 1 valutazione
// dal proprio responsabile, N valutazioni da colleghi dello stesso reparto, a
// rotazione. Le schede si scaricano precompilate (Excel, uno ZIP) oppure si
// compilano subito sulla piattaforma dal pulsante accanto a ogni nome.
export function PianoTab({ state, update, toast }: { state: State5p; update: (fn: (s: State5p) => State5p) => void; toast: (m: string) => void }) {
  const [peerN, setPeerN] = useState(String(state.set.peerN))
  const [compiling, setCompiling] = useState<PlanItem | null>(null)
  const c = { DIR: 0, PEER: 0, AUTO: 0 }
  state.plan.forEach((x) => c[x.tipo]++)
  const valutatori = new Set(state.plan.map((x) => x.valutatore))
  const by: Record<string, PlanItem[]> = {}
  state.plan.forEach((x) => (by[x.valutatore] = by[x.valutatore] || []).push(x))
  const done = new Set(state.evals.map(evalKey))
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
  function saveEval(e: Eval5p) {
    update((s) => {
      const k = evalKey(e)
      const i = s.evals.findIndex((o) => evalKey(o) === k)
      return { ...s, evals: i >= 0 ? s.evals.map((o, j) => (j === i ? e : o)) : [...s.evals, e] }
    })
    setCompiling(null)
    toast('Scheda salvata')
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
        <p className="text-app-caption text-muted-foreground">Lo ZIP contiene un file Excel per ogni valutatore, con un foglio per ciascuna persona che deve valutare: nome, ruolo e tipo di valutazione sono già scritti. Il valutatore compila solo SCORE (1–10) e NOTE, poi restituisce il file. In alternativa si compila qui, direttamente sulla piattaforma.</p>
      </div>
      {state.plan.length ? (
        <Table frame minWidth="lg">
          <TableHeader>
            <TableRow>
              <TableHead>Valutatore</TableHead>
              <TableHead className="text-center">Schede</TableHead>
              <TableHead>Deve valutare</TableHead>
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
                    <div className="flex flex-wrap gap-2">
                      {list.map((x) => (
                        <Button key={`${x.tipo}-${x.valutato}`} variant="outline" size="sm" onClick={() => setCompiling(x)} aria-label={`Compila: ${SRC[x.tipo].lab} su ${x.valutato}`}>
                          <SourceTag source={x.tipo} />
                          {x.tipo === 'AUTO' ? 'sé stesso' : x.valutato}
                          {done.has(evalKey(x)) ? <span className="text-success">· compilata</span> : null}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      ) : null}
      {compiling ? <CompilaDialog item={compiling} existing={state.evals.find((e) => evalKey(e) === evalKey(compiling))} onSave={saveEval} onClose={() => setCompiling(null)} /> : null}
    </section>
  )
}
