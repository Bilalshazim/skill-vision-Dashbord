import { useState } from 'react'
import { fmtDec } from '@/lib/format'

import { CategoryBars } from '@/components/patterns/CategoryBars'
import { Note } from '@/components/patterns/Note'
import { SelectField } from '@/components/patterns/SelectField'
import { StatCard } from '@/components/patterns/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { GAP_LABEL, PERCEPTION_LABEL } from '@/modules/assessment/gestione5p/dashboard/gap-style'
import { exportResults } from '@/modules/assessment/gestione5p/files'
import { CODES, PS, THR, type ResMode, type Result, type State5p, allResults, dd, edit, fmt10, fmtSigned, gapState, groups, mean, perceptionOf, rd } from '@/modules/assessment/gestione5p/model'
import { ScoreCell } from '@/modules/assessment/gestione5p/ScoreCell'

const MODES: [ResMode, string][] = [
  ['voto', 'Voto'],
  ['gap', 'Skill gap'],
  ['auto', 'Diff. autovalutazione'],
]
const CAPTION: Record<ResMode, string> = {
  voto: 'Voto ottenuto (media di dirigente e colleghi), scala 0–10',
  gap: 'Skill gap = voto − valore atteso. Da 0 in su livello raggiunto, da −1 a −9 vicino al livello, da −10 da sviluppare',
  auto: 'Differenza = autovalutazione − voto. Entro ±9 percezione allineata, da +10 si sopravvaluta, da −10 si sottovaluta',
}
const GAP_CELL = { raggiunto: 'surface-success', vicino: 'surface-warning', 'da-sviluppare': 'surface-danger' } as const

// 5 · Risultati. Voto di ogni P = media di tutte le valutazioni di dirigente e
// colleghi; l'autovalutazione è a parte. La tabella mostra, a scelta, il voto,
// lo skill gap o la differenza con l'autovalutazione. Un clic su una riga apre
// il report della persona.
export function RisultatiTab({ state, update, toast, onOpen }: { state: State5p; update: (fn: (s: State5p) => State5p) => void; toast: (m: string) => void; onOpen: (id: string) => void }) {
  const mode = state.set.mode
  const G = groups(state)
  const [q, setQ] = useState('')
  const [gf, setGf] = useState('')
  const setMode = (v: ResMode) => update((s) => edit(s, (d) => { d.set.mode = v }))
  const R0 = allResults(state).filter((r) => (!q.trim() || r.name.toLowerCase().includes(q.trim().toLowerCase())) && (!gf || (r.p.gruppo || '') === gf))
  const withV = R0.filter((r) => r.T.o != null)
  let below = 0
  let tot = 0
  R0.forEach((r) =>
    CODES.forEach((c) => {
      const d = dd(r.it[c].o, r.it[c].x)
      if (d != null) {
        tot++
        if (d < 0) below++
      }
    }),
  )
  const over = R0.filter((r) => {
    const d = dd(r.T.a, r.T.o)
    return d != null && d >= THR
  }).length
  const onlyAuto = R0.filter((r) => !r.oth.length).length
  const key = (r: Result) => (mode === 'gap' ? (dd(r.T.o, r.T.x) ?? 999) : mode === 'auto' ? -(dd(r.T.a, r.T.o) ?? -999) : -(r.T.o ?? -1))
  const R = [...R0].sort((a, b) => key(a) - key(b))
  const bars = PS.map((P) => ({ label: `${P.k} · ${P.n}`, values: { actual: rd(mean(withV.map((r) => r.P[P.k].o))), target: rd(mean(withV.map((r) => r.P[P.k].x))) } }))
  const withTarget = bars.every((b) => b.values.target != null)

  const cell = (k: string, x: { o: number | null; a: number | null; x: number | null }) => {
    if (mode === 'voto') return <ScoreCell key={k} value={x.o} />
    if (mode === 'gap') {
      const d = dd(x.o, x.x)
      const st = gapState(d)
      return (
        <TableCell key={k} title={`voto ${fmt10(x.o)} · atteso ${fmt10(x.x)}${st ? ` · ${GAP_LABEL[st]}` : ''}`} className={cn('font-mono font-semibold tabular-nums', st && GAP_CELL[st])}>
          {fmtSigned(d)}
        </TableCell>
      )
    }
    const d = dd(x.a, x.o)
    const p = perceptionOf(d)
    return (
      <TableCell key={k} title={`autovalutazione ${fmt10(x.a)} · voto ${fmt10(x.o)}${p ? ` · ${PERCEPTION_LABEL[p]}` : ''}`} className={cn('font-mono font-semibold tabular-nums', p === 'sopravvaluta' && 'text-warning')}>
        {fmtSigned(d)}
      </TableCell>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 basis-96">
            <h3 className="text-app-section text-foreground">Risultati</h3>
            <Note className="mt-1 max-w-3xl">Voto di ogni P = media di tutte le valutazioni ricevute da dirigente e colleghi. L&apos;autovalutazione è mostrata a parte e non entra nella media.</Note>
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
          <Input aria-label="Cerca nome" placeholder="Cerca nome" className="w-56" value={q} onChange={(e) => setQ(e.target.value)} />
          <SelectField aria-label="Filtra per gruppo" className="w-56" value={gf} onValueChange={(v) => setGf(String(v))}>
            <option value="">Tutti i gruppi</option>
            {G.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </SelectField>
          <span className="text-app-small text-muted-foreground">Mostra</span>
          <ToggleGroup type="single" aria-label="Cosa mostrare" value={mode} onValueChange={(v) => v && setMode(v as ResMode)}>
            {MODES.map(([m, l]) => (
              <ToggleGroupItem key={m} value={m}>
                {l}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Persone con un voto" value={withV.length} note={onlyAuto ? `${onlyAuto} con sola autovalutazione` : undefined} />
        <StatCard label="Voto medio 5P" value={fmt10(mean(withV.map((r) => r.T.o)))} unit="/10" tone="accent" />
        <StatCard label="Voci sotto il valore atteso" value={tot ? `${Math.round((below / tot) * 100)}%` : '–'} tone={tot && below / tot > 0.5 ? 'destructive' : 'neutral'} note={tot ? `${below} su ${tot}` : 'imposta i valori attesi'} />
        <StatCard label="Si sopravvalutano" value={over} tone={over ? 'warning' : 'neutral'} note={`autovalutazione da ${fmtDec(THR / 10)} punti sopra il voto`} />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <h3 className="text-app-section text-foreground">Media per P</h3>
        <Note size="caption">{withTarget ? 'Voto medio e valore atteso medio delle persone mostrate, scala 0–10.' : 'Voto medio delle persone mostrate, scala 0–10. Il valore atteso non è definito per tutte le P: non si disegna.'}</Note>
        <CategoryBars title="Media per P" rows={bars} series={[{ key: 'actual', label: 'Voto medio' }, ...(withTarget ? [{ key: 'target', label: 'Valore atteso medio', reference: true }] : [])]} valueMax={10} orientation="horizontal" height="md" format={(n) => fmtDec(n)} />
      </div>

      <div className="flex flex-col gap-2">
        <Note size="caption">{CAPTION[mode]}. Clicca una riga per aprire il report della persona.</Note>
        <div className="max-h-[75vh] overflow-auto rounded-sm border border-border">
          <Table minWidth="lg">
            <TableHeader className="sticky top-0 z-10">
              <TableRow>
                <TableHead>Persona</TableHead>
                <TableHead>Gruppo</TableHead>
                <TableHead>Valutazioni</TableHead>
                {PS.map((P) => (
                  <TableHead key={P.k} title={P.d}>
                    {P.k} {P.n}
                  </TableHead>
                ))}
                <TableHead>5P</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {R.map((r) => (
                <TableRow key={r.p.id} className="cursor-pointer" tabIndex={0} onClick={() => onOpen(r.p.id)} onKeyDown={(e) => e.key === 'Enter' && onOpen(r.p.id)}>
                  <TableCell className="font-semibold">{r.name}</TableCell>
                  <TableCell className="text-app-caption">{r.p.gruppo}</TableCell>
                  <TableCell className="font-mono text-app-caption whitespace-nowrap">
                    {r.oth.length ? `${r.nDir ? `D${r.nDir} ` : ''}P${r.nPeer}` : <Badge tone="warning">Solo auto</Badge>}
                    {r.nAuto ? ' · A' : ''}
                  </TableCell>
                  {PS.map((P) => cell(P.k, r.P[P.k]))}
                  {cell('T', r.T)}
                </TableRow>
              ))}
              {!R.length ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-4 text-muted-foreground">
                    Nessun risultato: carica le valutazioni nella pagina Raccolta.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  )
}
