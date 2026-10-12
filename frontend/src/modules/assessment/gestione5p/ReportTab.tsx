import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'

import { Note } from '@/components/patterns/Note'
import { SelectField } from '@/components/patterns/SelectField'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PersonDashboard } from '@/modules/assessment/gestione5p/dashboard/PersonDashboard'
import { exportRep, saveDashboardPayload } from '@/modules/assessment/gestione5p/files'
import { type State5p, dn, edit, get5pDashboardPayload, people, same } from '@/modules/assessment/gestione5p/model'
import { PersonPicker } from '@/modules/assessment/gestione5p/PersonPicker'
import { SourceTag } from '@/modules/assessment/gestione5p/SourceTag'

const WHO = { DIR: 'Responsabile', PEER: 'Collega', AUTO: 'Autovalutazione' } as const

// 6 · Report persona: il profilo di una persona da usare nel colloquio —
// voto, autovalutazione, valore atteso e skill gap, le cinque P a confronto,
// punti di forza, priorità di sviluppo, percezione, il dettaglio delle 25
// voci e gli esempi concreti dalle note. I colleghi restano anonimi.
export function ReportTab({ state, update }: { state: State5p; update: (fn: (s: State5p) => State5p) => void }) {
  const [search, setSearch] = useState(false)
  const L = people(state)
    .map((p) => ({ p, n: dn(p) }))
    .sort((a, b) => a.n.localeCompare(b.n))
  const fallback = L.find((x) => state.evals.some((e) => e.tipo !== 'AUTO' && same(e.valutato, x.n))) || L[0]
  const cur = L.find((x) => x.p.id === state.set.rep) || fallback
  const go = (id: string) => update((s) => edit(s, (d) => { d.set.rep = id }))
  const step = (k: number) => {
    if (!L.length || !cur) return
    const i = L.findIndex((x) => x.p.id === cur.p.id)
    go(L[(i + k + L.length) % L.length].p.id)
  }
  if (!cur) return <Note>Nessuna persona: prepara prima il piano.</Note>
  const payload = get5pDashboardPayload(state, cur.p.id)

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SelectField aria-label="Persona" className="w-72" value={cur.p.id} onValueChange={go}>
          {L.map((x) => (
            <option key={x.p.id} value={x.p.id}>
              {x.n}
            </option>
          ))}
        </SelectField>
        <Button variant="outline" size="sm" onClick={() => setSearch(true)}>
          <Search aria-hidden="true" />
          Cerca per nome
        </Button>
        <Button variant="outline" size="icon" aria-label="Persona precedente" onClick={() => step(-1)}>
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Persona successiva" onClick={() => step(1)}>
          <ChevronRight aria-hidden="true" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => void exportRep(state, cur.p)}>
          Scarica report (Excel)
        </Button>
      </div>

      {payload ? <PersonDashboard payload={payload} onExport={() => saveDashboardPayload(payload)} /> : null}

      {payload && payload.notes.length ? (
        <Card className="gap-3">
          <h3 className="text-app-section text-foreground">Esempi concreti dalle note ({payload.notes.length})</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {payload.notes.map((n, i) => (
              <div key={i} className="rounded-sm border-l-2 border-border-strong bg-muted px-3 py-2 text-app-small">
                <small className="mb-1 flex flex-wrap items-center gap-2 text-app-caption text-muted-foreground">
                  <SourceTag source={n.source} />
                  {n.code === 'GEN' ? 'Nota generale' : `${n.code} ${n.item ?? ''}`} · {WHO[n.source]}
                </small>
                {n.text}
              </div>
            ))}
          </div>
        </Card>
      ) : payload?.raters.hasScore ? (
        <Note>Nessuna nota nelle schede.</Note>
      ) : null}

      {search ? (
        <PersonPicker
          title="Di chi vuoi vedere il report?"
          items={L.map((x) => ({ v: x.n, info: [x.p.gruppo, x.p.mans].filter(Boolean).join(' · '), cur: x.p.id === cur.p.id }))}
          onClose={() => setSearch(false)}
          onPick={(v) => {
            setSearch(false)
            const x = L.find((y) => y.n === v)
            if (x) go(x.p.id)
          }}
        />
      ) : null}
    </section>
  )
}
