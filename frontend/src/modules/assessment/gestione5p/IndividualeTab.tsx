import { ProfileRadar } from '@/components/patterns/ProfileRadar'
import { Field } from '@/components/patterns/Field'
import { SelectField } from '@/components/patterns/SelectField'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ITEMS_5P } from '@/modules/assessment/gestione5p/items'
import { PersonDashboard } from '@/modules/assessment/gestione5p/dashboard/PersonDashboard'
import { saveDashboardPayload } from '@/modules/assessment/gestione5p/files'
import { CODES, PS, SRC, type State5p, compute, dd, fmt100, gapOf, get5pDashboardPayload, level, rd } from '@/modules/assessment/gestione5p/model'
import { ScoreCell } from '@/modules/assessment/gestione5p/ScoreCell'
import { SourceTag } from '@/modules/assessment/gestione5p/SourceTag'

const itemName = (c: string) => ITEMS_5P.find((i) => i.cod === c)!.area
const sg = (d: number | null) => (d == null ? '–' : d > 0 ? `+${d}` : d < 0 ? `−${Math.abs(d)}` : '±0')

// 5 · Scheda individuale: il punteggio unico e il livello, il radar a tre
// fonti più il punteggio unico, punti di forza e aree di sviluppo, il gap di
// percezione, il dettaglio dei 25 item e il registro delle note (esempi
// concreti). I Peer restano anonimi: le loro note compaiono come "Collega".
export function IndividualeTab({ state, selected, onSelect }: { state: State5p; selected: string; onSelect: (key: string) => void }) {
  const R = compute(state).filter((r) => r.ev.length).sort((a, b) => a.nome.localeCompare(b.nome))
  const r = R.find((x) => x.k === selected) || R[0]
  if (!r) return <p className="text-app-small text-muted-foreground">Nessuna scheda caricata.</p>
  const st = state.set
  const payload = get5pDashboardPayload(state, r.k)
  const g = gapOf(state, r)
  const notes = r.ev.flatMap((e) => Object.entries(e.notes || {}).map(([c, n]) => ({ c, n, t: e.tipo, who: e.tipo === 'PEER' ? 'Collega' : e.tipo === 'AUTO' ? 'Autovalutazione' : `Responsabile${e.valutatore ? ` · ${e.valutatore}` : ''}` }))).sort((a, b) => a.c.localeCompare(b.c))
  const axes = PS.map((p) => ({ key: p.k, label: `${p.k} · ${p.n}` }))
  const vals = (get: (k: string) => number | null) => Object.fromEntries(PS.map((p) => [p.k, rd(get(p.k)) ?? 0]))
  const series = [
    { label: 'Voto (Dirigente + Peer)', values: vals((k) => r.fin[k]) },
    ...(['DIR', 'PEER', 'AUTO'] as const).filter((t) => PS.every((p) => r.src[p.k][t] != null)).map((t) => ({ label: SRC[t].lab, values: vals((k) => r.src[k][t]), reference: t === 'AUTO' })),
  ]
  const gapRows = PS.map((p) => {
    const s = r.src[p.k]
    const d = dd(s.AUTO, r.fin[p.k])
    const it = d == null ? '–' : Math.abs(d) < Math.round(st.gap * 10) ? 'Percezione allineata' : d > 0 ? 'Si sopravvaluta' : 'Si sottovaluta'
    return { p, s, it }
  })

  return (
    <section className="flex flex-col gap-4">
      <Field label="Persona" className="max-w-sm">
        <SelectField value={r.k} onValueChange={onSelect}>
          {R.map((x) => (
            <option key={x.k} value={x.k}>
              {x.nome}
            </option>
          ))}
        </SelectField>
      </Field>

      {payload ? <PersonDashboard payload={payload} onExport={() => saveDashboardPayload(payload)} /> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <h3 className="text-app-section text-foreground">Profilo per fonte</h3>
          <ProfileRadar title={`Profilo 5P di ${r.nome}`} axes={axes} series={series} max={100} format={(n) => String(Math.round(n))} />
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <h3 className="text-app-section text-foreground">Voto per P</h3>
          <Table frame>
            <TableHeader>
              <TableRow>
                <TableHead>P</TableHead>
                <TableHead className="text-center">Dir.</TableHead>
                <TableHead className="text-center">Peer</TableHead>
                <TableHead className="text-center">Auto</TableHead>
                <TableHead className="text-center">Voto</TableHead>
                <TableHead>Livello</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PS.map((p) => {
                const s = r.src[p.k]
                return (
                  <TableRow key={p.k}>
                    <TableCell>
                      {p.k} {p.n}
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums">{fmt100(s.DIR)}</TableCell>
                    <TableCell className="text-center font-mono tabular-nums">{fmt100(s.PEER)}</TableCell>
                    <TableCell className="text-center font-mono tabular-nums">{fmt100(s.AUTO)}</TableCell>
                    <ScoreCell value={r.fin[p.k]} />
                    <TableCell>{level(r.fin[p.k]).t}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <h3 className="text-app-section text-foreground">Gap di percezione</h3>
          <p className="text-app-caption text-muted-foreground">Differenze tra fonti. Positivo nelle prime due colonne = gli altri valutano più alto di quanto si valuti la persona.{g.d != null ? ` Gap complessivo autovalutazione meno voto: ${sg(g.d)} punti.` : ''}</p>
          <Table frame>
            <TableHeader>
              <TableRow>
                <TableHead>P</TableHead>
                <TableHead className="text-center">Dir − Auto</TableHead>
                <TableHead className="text-center">Peer − Auto</TableHead>
                <TableHead className="text-center">Dir − Peer</TableHead>
                <TableHead>Lettura</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gapRows.map(({ p, s, it }) => (
                <TableRow key={p.k}>
                  <TableCell>
                    {p.k} {p.n}
                  </TableCell>
                  <TableCell className="text-center font-mono tabular-nums">{sg(dd(s.DIR, s.AUTO))}</TableCell>
                  <TableCell className="text-center font-mono tabular-nums">{sg(dd(s.PEER, s.AUTO))}</TableCell>
                  <TableCell className="text-center font-mono tabular-nums">{sg(dd(s.DIR, s.PEER))}</TableCell>
                  <TableCell>
                    <Badge tone={it === 'Percezione allineata' ? 'success' : it === '–' ? 'neutral' : 'warning'}>{it}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <h3 className="text-app-section text-foreground">Dettaglio dei 25 item</h3>
          <div className="max-h-[26rem] overflow-auto">
            <Table frame>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Dir.</TableHead>
                  <TableHead className="text-center">Peer</TableHead>
                  <TableHead className="text-center">Auto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CODES.map((c) => {
                  const s = r.items[c]
                  return (
                    <TableRow key={c}>
                      <TableCell>
                        <span className="font-mono">{c}</span> {itemName(c)}
                      </TableCell>
                      <TableCell className="text-center font-mono tabular-nums">{fmt100(s.DIR)}</TableCell>
                      <TableCell className="text-center font-mono tabular-nums">{fmt100(s.PEER)}</TableCell>
                      <TableCell className="text-center font-mono tabular-nums">{fmt100(s.AUTO)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <h3 className="text-app-section text-foreground">Esempi concreti dalle note ({notes.length})</h3>
        {notes.length ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {notes.map((n, i) => (
              <div key={i} className="rounded-sm border-l-4 border-border-strong bg-muted px-3 py-2 text-app-small">
                <small className="mb-1 flex items-center gap-2 text-app-caption text-muted-foreground">
                  <SourceTag source={n.t} />
                  {n.c === 'GEN' ? 'Nota generale' : `${n.c} ${itemName(n.c)}`} · {n.who}
                </small>
                {n.n}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-app-small text-muted-foreground">Nessuna nota nelle schede. Il protocollo prevede un esempio concreto per ogni voto.</p>
        )}
      </div>
    </section>
  )
}
