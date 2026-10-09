import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { StatCard } from '@/components/patterns/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { exportResults } from '@/modules/assessment/gestione5p/files'
import { LEVEL_TONE } from '@/modules/assessment/gestione5p/level-style'
import { PS, type State5p, compute, fmt100, gapOf, level, mean, rd } from '@/modules/assessment/gestione5p/model'
import { NineBox } from '@/modules/assessment/gestione5p/NineBox'
import { ScoreCell } from '@/modules/assessment/gestione5p/ScoreCell'
import { SourceTag } from '@/modules/assessment/gestione5p/SourceTag'

// 5 · Risultati: il voto per ogni P, la media aziendale, la matrice
// Competenze × Potenziale a nove quadranti, e la tabella delle persone con
// livello. Il voto è quello di tutte le schede: media piatta di Dirigente e
// Peer, autovalutazione esclusa, scala 0–100 (voto 1–10 × 10). Un clic su una
// riga apre la scheda.
export function RisultatiTab({ state, toast, onOpen }: { state: State5p; toast: (m: string) => void; onOpen: (key: string) => void }) {
  const [q, setQ] = useState('')
  const st = state.set
  const R = compute(state).filter((r) => r.ev.length)
  const Rf = (q.trim() ? R.filter((r) => `${r.nome} ${r.reparto}`.toLowerCase().includes(q.trim().toLowerCase())) : R).sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
  const all = mean(R.map((r) => r.score))

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-app-section text-foreground">Voto per ogni P</h3>
            <p className="max-w-3xl text-app-small text-muted-foreground">Per ogni P: media di tutte le schede di Dirigente e Peer, una per una. L&apos;autovalutazione non entra nel voto. Scala 0–100 (voto 1–10 × 10).</p>
          </div>
          <Button
            onClick={async () => {
              if (!(await exportResults(state))) toast('Nessun risultato da esportare')
            }}
          >
            Esporta risultati (Excel)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Persone valutate" value={R.length} />
        <StatCard label="Schede elaborate" value={state.evals.length} />
        <StatCard label="Voto 5P medio" value={fmt100(all)} />
        <StatCard label="Sotto 50 (in sviluppo o meno)" value={R.filter((r) => r.score != null && (rd(r.score) as number) < 50).length} />
        <StatCard label={`Gap auto ≥ ${Math.round(st.gap * 10)}`} value={R.filter((r) => gapOf(state, r).flag).length} />
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
                  <div className="h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${p.n}: ${fmt100(v)} su 100`}>
                    <div className="h-full rounded-full bg-(--chart-mono)" style={{ width: `${rd(v) ?? 0}%` }} />
                  </div>
                  <span className="text-right font-mono font-semibold tabular-nums">{fmt100(v)}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <h3 className="text-app-section text-foreground">Matrice Competenze × Potenziale</h3>
          <p className="text-app-caption text-muted-foreground">Asse orizzontale: media di Professionalità, Performance, Predisposizione, Pensiero. Asse verticale: Potenziale. Soglie 50 e 70 su 100.</p>
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
            <TableHead className="text-center">Voto 5P</TableHead>
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
