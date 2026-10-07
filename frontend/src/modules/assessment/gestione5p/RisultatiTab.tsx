import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { StatCard } from '@/components/patterns/StatCard'
import { SelectField } from '@/components/patterns/SelectField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { exportResults } from '@/modules/assessment/gestione5p/files'
import { LEVEL_TONE } from '@/modules/assessment/gestione5p/level-style'
import { type Method, PS, type State5p, compute, fmt, fmt1, gapOf, level, mean } from '@/modules/assessment/gestione5p/model'
import { NineBox } from '@/modules/assessment/gestione5p/NineBox'
import { ScoreCell } from '@/modules/assessment/gestione5p/ScoreCell'
import { SourceTag } from '@/modules/assessment/gestione5p/SourceTag'

const METHOD_TXT: Record<Method, string> = {
  fonti: 'Per ogni P: media dei voti di ciascuna fonte, poi media tra le fonti. Ogni fonte pesa uguale, indipendentemente da quanti colleghi hanno votato.',
  semplice: 'Per ogni P: somma di tutti i voti ricevuti divisa per il numero di schede. Le fonti con più schede (di solito i Peer) pesano di più.',
  pesata: 'Per ogni P: media di ogni fonte moltiplicata per il suo peso. Se una fonte manca, i pesi delle altre vengono riproporzionati.',
}

// 4 · Risultati: il punteggio unico per ogni P (con tre modi di calcolo), la
// media aziendale, la matrice Competenze × Potenziale a nove quadranti, e la
// tabella delle persone con livello. Un clic su una riga apre la scheda.
export function RisultatiTab({ state, update, toast, onOpen }: { state: State5p; update: (fn: (s: State5p) => State5p) => void; toast: (m: string) => void; onOpen: (key: string) => void }) {
  const [q, setQ] = useState('')
  const st = state.set
  const R = compute(state).filter((r) => r.ev.length)
  const Rf = (q.trim() ? R.filter((r) => `${r.nome} ${r.reparto}`.toLowerCase().includes(q.trim().toLowerCase())) : R).sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
  const all = mean(R.map((r) => r.score))
  const setSet = (patch: Partial<typeof st>) => update((s) => ({ ...s, set: { ...s.set, ...patch } }))

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-app-section text-foreground">Punteggio unico per ogni P</h3>
            <p className="max-w-3xl text-app-small text-muted-foreground">
              {METHOD_TXT[st.method]}
              {st.incAuto ? ' Autovalutazione inclusa.' : ' Autovalutazione esclusa dal punteggio.'}
            </p>
          </div>
          <Button
            onClick={async () => {
              if (!(await exportResults(state))) toast('Nessun risultato da esportare')
            }}
          >
            Esporta risultati (Excel)
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="g5p-method" className="text-app-small text-muted-foreground">
            Calcolo
          </label>
          <SelectField id="g5p-method" value={st.method} onValueChange={(v) => setSet({ method: v as Method })} className="w-72">
            <option value="fonti">Media delle 3 fonti (protocollo)</option>
            <option value="semplice">Media semplice di tutte le schede</option>
            <option value="pesata">Media pesata per fonte</option>
          </SelectField>
          <label className="flex items-center gap-2 text-app-small">
            <Checkbox checked={st.incAuto} onCheckedChange={(c) => setSet({ incAuto: c === true })} />
            Includi autovalutazione nel punteggio
          </label>
          {st.method === 'pesata' ? (
            <span className="flex flex-wrap items-center gap-2 text-app-small text-muted-foreground">
              Pesi % ·
              {(['DIR', 'PEER', 'AUTO'] as const).map((t) => (
                <label key={t} className="flex items-center gap-1">
                  {t === 'DIR' ? 'Dirigente' : t === 'PEER' ? 'Peer' : 'Auto'}
                  <Input type="number" min={0} max={100} size="sm" className="w-20" value={st.w[t]} onChange={(e) => setSet({ w: { ...st.w, [t]: Math.max(0, +e.target.value || 0) } })} />
                </label>
              ))}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Persone valutate" value={R.length} />
        <StatCard label="Schede elaborate" value={state.evals.length} />
        <StatCard label="Punteggio 5P medio" value={fmt(all)} />
        <StatCard label="Sotto 5 (in sviluppo o meno)" value={R.filter((r) => r.score != null && r.score < 5).length} />
        <StatCard label={`Gap auto ≥ ${fmt1(st.gap)}`} value={R.filter((r) => gapOf(state, r).flag).length} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <h3 className="text-app-section text-foreground">Media aziendale per P</h3>
          <div className="flex flex-col gap-2.5">
            {PS.map((p) => {
              const v = mean(R.map((r) => r.fin[p.k]))
              return (
                <div key={p.k} className="grid grid-cols-[9.5rem_1fr_2.75rem] items-center gap-3 text-app-small">
                  <span>
                    {p.k} · {p.n}
                  </span>
                  <div className="h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${p.n}: ${fmt1(v)} su 10`}>
                    <div className="h-full rounded-full bg-(--chart-mono)" style={{ width: `${(v || 0) * 10}%` }} />
                  </div>
                  <span className="text-right font-mono font-semibold tabular-nums">{fmt1(v)}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <h3 className="text-app-section text-foreground">Matrice Competenze × Potenziale</h3>
          <p className="text-app-caption text-muted-foreground">Asse orizzontale: media di Professionalità, Performance, Predisposizione, Pensiero. Asse verticale: Potenziale. Soglie 5 e 7.</p>
          <NineBox rows={R} onOpen={onOpen} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input aria-label="Cerca nome o reparto" placeholder="Cerca nome o reparto" className="w-64" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="text-app-small text-muted-foreground">Clicca una riga per aprire la scheda individuale.</span>
      </div>
      <Table frame minWidth="lg">
        <TableHeader>
          <TableRow>
            <TableHead>Valutato</TableHead>
            <TableHead>Reparto</TableHead>
            <TableHead>Schede</TableHead>
            {PS.map((p) => (
              <TableHead key={p.k} className="text-center" title={p.d}>
                {p.k} {p.n}
              </TableHead>
            ))}
            <TableHead className="text-center">Punteggio 5P</TableHead>
            <TableHead>Livello</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Rf.map((r) => {
            const l = level(r.score)
            return (
              <TableRow key={r.k} onClick={() => onOpen(r.k)}>
                <TableCell>
                  <b className="font-semibold">{r.nome}</b>
                  <div className="text-app-caption text-muted-foreground">{r.ruolo}</div>
                </TableCell>
                <TableCell>{r.reparto}</TableCell>
                <TableCell>
                  <span className="flex gap-2">
                    <SourceTag source="DIR" count={r.cnt.DIR} />
                    <SourceTag source="PEER" count={r.cnt.PEER} />
                    <SourceTag source="AUTO" count={r.cnt.AUTO} />
                  </span>
                </TableCell>
                {PS.map((p) => (
                  <ScoreCell key={p.k} value={r.fin[p.k]} />
                ))}
                <ScoreCell value={r.score} />
                <TableCell>
                  <Badge tone={LEVEL_TONE[l.c]}>{l.t}</Badge>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </section>
  )
}
