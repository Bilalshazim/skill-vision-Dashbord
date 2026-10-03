import { AlertTriangle, CheckCircle2, CircleDollarSign, CircleMinus, Gauge, Target, TrendingDown, TrendingUp } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

import { SkillVisionCard } from '@/components/patterns/SkillVisionCard'
import { CompletionRing } from '@/components/patterns/CompletionRing'
import { ScoreGauge } from '@/components/patterns/ScoreGauge'
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
  actions: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  style?: CSSProperties
}

const signed = (n: number) => `${n > 0 ? '+' : ''}${fmt1it(n)}`

// Q1 — Il Valore, dal concept del cliente (E.pdf). La card porta solo il
// testo; "Skill Vision" apre accanto il pannello del valore: il Punteggio
// Complessivo come numero principale (due colonne per due righe, l'unico
// in evidenza), copertura e scarto dal benchmark, e la divisione
// Ottimale / Moderato / Critico con la parola della fascia accanto al colore.
// Tutti i numeri arrivano da AssessmentHomePage (homeStats()).
export function ValoreCard({ ui, overallPct, roleCovPct, benchmark, avgGap, avgGapPct, breakdown, actions, open, onOpenChange, style }: Props) {
  return (
    <SkillVisionCard
      icon={CircleDollarSign}
      title={ui.homeQ1Title}
      subtitle={ui.homeQ1Kicker}
      lines={ui.homeQ1CardLines}
      open={open}
      onOpenChange={onOpenChange}
      style={style}
      actions={actions}
      panel={
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* G5 / G6 (DECISIONI): il punteggio complessivo come indicatore ad
              arco e la copertura delle mansioni come anello, al posto delle
              barre. Il numero si scrive una volta, nella card; la legenda dice il
              nome della fascia, mai il colore (CLAUDE.md). */}
          <StatCard tone="accent" size="lg" className="sm:col-span-2 sm:row-span-2" icon={Gauge} label={ui.homeQ1Score} value={`${overallPct}%`}>
            <ScoreGauge value={overallPct} label={ui.homeQ1Score} />
          </StatCard>
          <StatCard icon={Target} label={ui.homeQ1Coverage} value={`${roleCovPct}%`}>
            <CompletionRing value={roleCovPct} label={ui.homeQ1Coverage} />
          </StatCard>
          <StatCard
            icon={avgGap < 0 ? TrendingDown : TrendingUp}
            label={ui.homeQ1Gap}
            value={`${signed(avgGap)} punti`}
            note={`${signed(avgGapPct)}% · ${ui.homeOrgTrendModeBenchmark} ${fmt1it(benchmark)}/10`}
          />
          <StatCard tone="success" icon={CheckCircle2} label={ui.homeQ1GreenSub} value={`${breakdown.ottimale}%`} progress={breakdown.ottimale} />
          <StatCard tone="warning" icon={CircleMinus} label={ui.homeQ1YellowSub} value={`${breakdown.moderato}%`} progress={breakdown.moderato} />
          <StatCard tone="destructive" icon={AlertTriangle} label={ui.homeQ1RedSub} value={`${breakdown.critico}%`} progress={breakdown.critico} />
        </div>
      }
    />
  )
}
