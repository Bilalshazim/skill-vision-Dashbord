import { Download } from 'lucide-react'

import { InlineAlert } from '@/components/patterns/InlineAlert'
import { Note } from '@/components/patterns/Note'
import { StatCard } from '@/components/patterns/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DashboardCharts } from '@/modules/assessment/gestione5p/dashboard/DashboardCharts'
import { DashboardInsights } from '@/modules/assessment/gestione5p/dashboard/DashboardInsights'
import { DashboardItemsTable } from '@/modules/assessment/gestione5p/dashboard/DashboardItemsTable'
import { GAP_LABEL, GAP_TONE, PERCEPTION_LABEL, fmtScore, fmtSigned } from '@/modules/assessment/gestione5p/dashboard/gap-style'
import { LEVEL_TONE } from '@/modules/assessment/gestione5p/level-style'
import type { Dash5pPayload } from '@/modules/assessment/gestione5p/model'
import { SourceTag } from '@/modules/assessment/gestione5p/SourceTag'

// Il profilo di una persona, composto dal payload di `get5pDashboardPayload`:
// intestazione, quattro riquadri (voto, autovalutazione, valore atteso, skill
// gap), profilo a barre e radar, tre riquadri di lettura, tabella delle voci.
// Non calcola niente: riceve il payload.
export function PersonDashboard({ payload, onExport }: { payload: Dash5pPayload; onExport?: () => void }) {
  const { person, raters, summary: sm } = payload
  const tp = person.targetProfile
  const dir = (d: number | null) => (d == null ? 'flat' : d > 0 ? 'up' : d < 0 ? 'down' : 'flat')
  return (
    <section className="flex flex-col gap-4" aria-label={`Profilo 5P di ${person.name}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-app-title text-foreground">{person.name}</h3>
          <Note>{[person.role ? `Mansione: ${person.role}` : '', person.group ? `Reparto: ${person.group}` : ''].filter(Boolean).join(' · ') || 'Mansione e reparto non indicati'}</Note>
          <p className="mt-2 flex flex-wrap gap-3">
            <SourceTag source="DIR" count={raters.dir} long />
            <SourceTag source="PEER" count={raters.peer} long />
            <SourceTag source="AUTO" count={raters.self} long />
          </p>
        </div>
        {onExport ? (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download aria-hidden="true" />
            Scarica dati (JSON)
          </Button>
        ) : null}
      </div>

      {!raters.hasScore ? (
        <InlineAlert tone="warning">
          {raters.self
            ? 'Per questa persona c’è solo l’autovalutazione: senza le schede di Dirigente o Peer non c’è un voto. Carica le schede mancanti nella pagina Caricamento.'
            : 'Nessuna scheda caricata per questa persona. Carica le risposte dei valutatori nella pagina Caricamento.'}
        </InlineAlert>
      ) : (
        <>
          {raters.peerAnonymityRisk ? (
            <InlineAlert tone="warning">
              {raters.peer === 1 ? 'Solo 1 collega: la sua valutazione è riconoscibile.' : `Solo ${raters.peer} colleghi: la loro media è riconoscibile.`} Nel colloquio mostra solo i valori complessivi (minimo {raters.peerMin} colleghi).
            </InlineAlert>
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Voto 5P (0–100)"
              value={fmtScore(sm.actual)}
              tone="accent"
              note={sm.level ? <Badge tone={LEVEL_TONE[sm.level.index]}>{sm.level.label}</Badge> : undefined}
            />
            <StatCard
              label="Autovalutazione"
              value={fmtScore(sm.self)}
              delta={sm.selfDiff == null ? undefined : { label: fmtSigned(sm.selfDiff), direction: dir(sm.selfDiff) }}
              note={sm.perception ? PERCEPTION_LABEL[sm.perception] : 'Autovalutazione non caricata'}
            />
            <StatCard
              label="Valore atteso"
              value={fmtScore(sm.target)}
              note={sm.target == null ? 'Non definito per tutte le P' : tp.group ? `Reparto ${tp.group}` : 'Valore di base'}
            />
            <StatCard
              label="Skill gap"
              value={fmtSigned(sm.gap)}
              tone={sm.gapState ? GAP_TONE[sm.gapState] : 'neutral'}
              note={sm.gapState ? GAP_LABEL[sm.gapState] : 'Serve il valore atteso'}
            />
          </div>
          {!tp.complete ? (
            <Note size="caption">
              {tp.definedItems
                ? `Valore atteso definito per ${tp.definedItems} voci su ${tp.totalItems}: dove manca, lo skill gap non è calcolato.`
                : 'Nessun valore atteso definito per questa persona: lo skill gap compare dopo averlo inserito nella pagina Valori attesi.'}
            </Note>
          ) : null}
          <DashboardCharts payload={payload} />
          <DashboardInsights insights={payload.insights} threshold={payload.scale.perceptionThreshold} />
          <DashboardItemsTable items={payload.items} />
        </>
      )}
    </section>
  )
}
