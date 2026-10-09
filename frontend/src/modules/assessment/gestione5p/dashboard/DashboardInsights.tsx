import { Note } from '@/components/patterns/Note'
import { Card } from '@/components/ui/card'
import { fmtScore, fmtSigned } from '@/modules/assessment/gestione5p/dashboard/gap-style'
import type { Dash5pPayload, DashItemRef } from '@/modules/assessment/gestione5p/model'

const SHOWN = 5

function Row({ x, value }: { x: DashItemRef; value: string }) {
  return (
    <li className="flex items-baseline justify-between gap-3 border-b border-border py-2 text-app-small last:border-b-0">
      <span className="min-w-0">
        <span className="font-mono text-muted-foreground">{x.code}</span> {x.name}
      </span>
      <span className="shrink-0 font-medium tabular-nums">{value}</span>
    </li>
  )
}

// Tre riquadri: punti di forza, priorità di sviluppo, dove la percezione è
// diversa. Con il valore atteso si ordina per skill gap, senza per voto.
export function DashboardInsights({ insights, threshold }: { insights: Dash5pPayload['insights']; threshold: number }) {
  const byGap = insights.basis === 'gap'
  const val = (x: DashItemRef) => (byGap ? `${fmtSigned(x.gap)} sul valore atteso` : `voto ${fmtScore(x.actual)}`)
  const disc = insights.perceptionDiscrepancies
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="gap-3">
        <h3 className="text-app-section text-foreground">{insights.allStrengthsBelowTarget ? 'Le voci più vicine al valore atteso' : 'Punti di forza'}</h3>
        <ul>
          {insights.strengths.map((x) => (
            <Row key={x.code} x={x} value={val(x)} />
          ))}
        </ul>
      </Card>
      <Card className="gap-3">
        <h3 className="text-app-section text-foreground">Priorità di sviluppo</h3>
        <ul>
          {insights.developmentPriorities.map((x) => (
            <Row key={x.code} x={x} value={val(x)} />
          ))}
        </ul>
      </Card>
      <Card className="gap-3">
        <h3 className="text-app-section text-foreground">Dove la percezione è diversa</h3>
        {disc.length ? (
          <>
            <ul>
              {disc.slice(0, SHOWN).map((x) => (
                <Row key={x.code} x={x} value={`${fmtSigned(x.selfDiff)} · ${x.direction === 'sopravvaluta' ? 'si sopravvaluta' : 'si sottovaluta'}`} />
              ))}
            </ul>
            <Note size="caption">
              Scarto fra autovalutazione e voto, da {threshold} punti.{disc.length > SHOWN ? (disc.length - SHOWN === 1 ? ' Un’altra voce nella tabella.' : ` Altre ${disc.length - SHOWN} voci nella tabella.`) : ''}
            </Note>
          </>
        ) : (
          <Note>Autovalutazione allineata su tutte le voci.</Note>
        )}
      </Card>
    </div>
  )
}
