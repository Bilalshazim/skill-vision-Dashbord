import { useState } from 'react'

import { ModalDialog } from '@/components/patterns/ModalDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ITEMS_5P } from '@/modules/assessment/gestione5p/items'
import { LEVEL_TONE } from '@/modules/assessment/gestione5p/level-style'
import { type Eval5p, PS, SRC, type PlanItem, level, norm, today, uid } from '@/modules/assessment/gestione5p/model'
import { ScoreBar } from '@/modules/assessment/gestione5p/ScoreBar'

const BANDS = [2, 4, 6, 8, 10]

// La scheda del valutatore, compilata direttamente sulla piattaforma (nessun
// file): per ogni voce la domanda, la barra 1–10 numerata e colorata, gli
// ancoraggi per 1, 5 e 10 sempre visibili e le note con l'esempio concreto
// (facoltative). Salva una valutazione come quelle lette da Excel.
export function CompilaDialog({ item, existing, onSave, onClose }: { item: PlanItem; existing?: Eval5p; onSave: (e: Eval5p) => void; onClose: () => void }) {
  const [scores, setScores] = useState<Record<string, number>>(existing?.scores ?? {})
  const [notes, setNotes] = useState<Record<string, string>>(existing?.notes ?? {})
  const [error, setError] = useState('')

  function save() {
    if (ITEMS_5P.some((i) => !(scores[i.cod] > 0))) {
      setError('Dai un voto a tutte le 25 voci prima di salvare.')
      return
    }
    onSave({ id: existing?.id ?? uid(), valutato: item.valutato, tipo: item.tipo, valutatore: item.valutatore, ruolo: existing?.ruolo ?? '', data: today(), scores, notes: Object.fromEntries(Object.entries(notes).filter(([, t]) => t.trim())), source: 'compilata sulla piattaforma' })
  }

  return (
    <ModalDialog
      size="xl"
      dirty={Object.keys(scores).length > 0 && !existing}
      title={`Valutazione 5P · ${SRC[item.tipo].lab}`}
      sub={`${item.tipo === 'AUTO' ? 'Autovalutazione di' : 'Da valutare:'} ${item.valutato}${item.tipo === 'AUTO' ? '' : ` · valutatore ${item.valutatore}`}`}
      onClose={onClose}
      footer={
        <>
          {error ? <span className="mr-auto text-app-small font-medium text-destructive">{error}</span> : null}
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={save}>Salva la scheda</Button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2 text-app-caption text-muted-foreground">
        Scala:
        {BANDS.map((b) => (
          <Badge key={b} tone={LEVEL_TONE[level(b).c]}>
            {b - 1}–{b} {level(b).t}
          </Badge>
        ))}
      </div>
      {PS.map((P) => (
        <section key={P.k} className="mb-6">
          <h4 className="label-mono mb-1 border-b border-border pb-2 text-muted-foreground">
            Dimensione {P.k} — {P.n}
          </h4>
          <p className="mb-2 text-app-caption text-muted-foreground">{P.d}</p>
          {ITEMS_5P.filter((i) => i.cod[0] === P.k).map((i) => (
            <div key={i.cod} className="flex flex-col gap-2 border-b border-border py-3 last:border-b-0">
              <div>
                <div className="text-app-small font-semibold text-foreground">
                  {i.cod} · {i.area}
                </div>
                <div className="text-app-caption text-muted-foreground">{i.q}</div>
              </div>
              <ScoreBar label={`${i.cod} ${i.area}: voto da 1 a 10`} value={scores[i.cod] ?? 0} onChange={(n) => { setError(''); setScores((p) => ({ ...p, [i.cod]: n })) }} />
              <dl className="grid grid-cols-1 gap-2 text-app-caption md:grid-cols-3">
                {(
                  [
                    ['1', i.low],
                    ['5', i.mid],
                    ['10', i.high],
                  ] as const
                ).map(([n, t]) => (
                  <div key={n} className="flex gap-2 rounded-sm bg-muted px-2 py-1">
                    <dt className="w-5 shrink-0 font-mono font-semibold text-foreground">{n}</dt>
                    <dd className="text-muted-foreground">{t}</dd>
                  </div>
                ))}
              </dl>
              <Input size="sm" aria-label={`Note ed esempio concreto per ${i.cod}`} placeholder="Note ed esempio concreto (facoltativo)" value={notes[i.cod] ?? ''} onChange={(e) => setNotes((p) => ({ ...p, [i.cod]: e.target.value }))} />
            </div>
          ))}
        </section>
      ))}
    </ModalDialog>
  )
}
export const evalKey = (e: { tipo: string; valutato: string; valutatore: string }) => `${e.tipo}|${norm(e.valutato)}|${norm(e.valutatore)}`
