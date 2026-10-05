import { AlertTriangle, CheckCircle2, CircleMinus, Gauge, Scale, Target } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

import { CategoryBars } from '@/components/patterns/CategoryBars'
import { HouseValueIcon } from '@/components/patterns/CardIcons'
import { CompletionRing } from '@/components/patterns/CompletionRing'
import { ScoreGauge } from '@/components/patterns/ScoreGauge'
import { SkillVisionCard } from '@/components/patterns/SkillVisionCard'
import { StatCard } from '@/components/patterns/StatCard'
import type { getUI } from '@/modules/assessment/lib/legacy-utils'
import { fmt1it } from '@/modules/assessment/lib/legacy-utils'

type UI = ReturnType<typeof getUI>

export type ValoreBreakdown = { ottimale: number; moderato: number; critico: number }

type Props = {
  ui: UI
  overallPct: number
  roleCovPct: number
  benchmark: number
  avgGap: number
  avgGapPct: number
  breakdown: ValoreBreakdown
  /** I pulsanti di approfondimento (Vedi dettagli, Confronta aree, Esporta report): stanno nel pannello, non sulla card. */
  panelActions: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  style?: CSSProperties
}

const signed = (n: number) => `${n > 0 ? '+' : ''}${fmt1it(n)}`

// Finestra 1 — "Il valore che generi" (Foglio 3, Roberto Feliciani). La card
// mostra titolo, sottotitolo, domanda e spiegazione, senza pulsanti;
// "Skill Vision" apre accanto il pannello: ogni numero ha il suo grafico (arco,
// anelli, barre contro il benchmark), il numero è grande con "/100%" piccolo
// accanto, i riquadri hanno bordo e rilievo, e in fondo ci sono i tre pulsanti
// che prima stavano sulla card. Tutti i numeri arrivano da AssessmentHomePage
// (homeStats()).
export function ValoreCard({ ui, overallPct, roleCovPct, benchmark, avgGap, avgGapPct, breakdown, panelActions, open, onOpenChange, style }: Props) {
  return (
    <SkillVisionCard
      iconSide="end"
      icon={HouseValueIcon}
      title={ui.homeQ1Title}
      subtitle={ui.homeQ1Kicker}
      headline={ui.homeQ1Headline}
      description={ui.homeQ1Description}
      open={open}
      onOpenChange={onOpenChange}
      style={style}
      panel={
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* G5 / G6 (DECISIONI): il punteggio complessivo come indicatore ad
                arco e la copertura delle mansioni come anello. Il numero si
                scrive una volta, nel riquadro; la legenda dice il nome della
                fascia, mai il colore (CLAUDE.md). "/100%": richiesta del
                Foglio 3, un'unica unità. */}
            <StatCard elevated emphasis tone="accent" size="lg" className="sm:col-span-2" icon={Gauge} label={ui.homeQ1Score} value={overallPct} unit={ui.f3Scale100}>
              <ScoreGauge value={overallPct} label={ui.homeQ1Score} />
            </StatCard>
            <StatCard elevated emphasis icon={Target} label={ui.homeQ1Coverage} value={roleCovPct} unit={ui.f3Scale100}>
              <CompletionRing value={roleCovPct} label={ui.homeQ1Coverage} />
            </StatCard>
            <StatCard
              elevated
              emphasis
              className="sm:col-span-3"
              icon={Scale}
              label={ui.homeQ1Gap}
              value={signed(avgGap)}
              unit={ui.f3Points}
              note={`${signed(avgGapPct)}% · ${ui.homeOrgTrendModeBenchmark} ${fmt1it(benchmark)}/10`}
            >
              <CategoryBars
                title={ui.f3ScoreVsBenchmark}
                height="sm"
                valueMax={10}
                format={fmt1it}
                series={[
                  { key: 'score', label: ui.homeQ1Score },
                  { key: 'bench', label: ui.f3Benchmark, reference: true },
                ]}
                rows={[{ label: ui.f3ScoreVsBenchmark, values: { score: overallPct / 10, bench: benchmark } }]}
              />
            </StatCard>
            <StatCard elevated emphasis tone="success" icon={CheckCircle2} label={ui.homeQ1GreenSub} value={breakdown.ottimale} unit={ui.f3Scale100}>
              <CompletionRing tone="success" value={breakdown.ottimale} label={ui.homeQ1GreenSub} />
            </StatCard>
            <StatCard elevated emphasis tone="warning" icon={CircleMinus} label={ui.homeQ1YellowSub} value={breakdown.moderato} unit={ui.f3Scale100}>
              <CompletionRing tone="warning" value={breakdown.moderato} label={ui.homeQ1YellowSub} />
            </StatCard>
            <StatCard elevated emphasis tone="destructive" icon={AlertTriangle} label={ui.homeQ1RedSub} value={breakdown.critico} unit={ui.f3Scale100}>
              <CompletionRing tone="destructive" value={breakdown.critico} label={ui.homeQ1RedSub} />
            </StatCard>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-1">{panelActions}</div>
        </div>
      }
    />
  )
}
