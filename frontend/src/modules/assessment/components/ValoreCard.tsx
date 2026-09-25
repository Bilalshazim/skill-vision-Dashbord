import { CurrencyCircleDollar } from '@phosphor-icons/react'
import { AlertTriangle, CheckCircle2, CircleMinus, Gauge, Target, TrendingDown, TrendingUp } from 'lucide-react'

import { SkillVisionCard } from '@/modules/assessment/components/SkillVisionCard'
import { ToneTile } from '@/modules/assessment/components/ToneTile'
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
  actions: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  style?: React.CSSProperties
}

const signed = (n: number) => `${n > 0 ? '+' : ''}${fmt1it(n)}`

// Q1 — Il Valore, per the client concept (E.pdf). The card carries only
// text; "Skill Vision" opens the value panel beside it (the three headline
// metrics + the Ottimale/Moderato/Critico split). Every number is passed in
// from AssessmentHomePage, derived from the same homeStats() partition the
// rest of the page uses.
export function ValoreCard({ ui, overallPct, roleCovPct, benchmark, avgGap, avgGapPct, breakdown, actions, open, onOpenChange, style }: Props) {
  return (
    <SkillVisionCard
      tone="valore"
      Icon={CurrencyCircleDollar}
      title={ui.homeQ1Title}
      subtitle={ui.homeQ1Kicker}
      lines={ui.homeQ1CardLines}
      open={open}
      onOpenChange={onOpenChange}
      style={style}
      panelClassName="sv-panel-stack"
      actions={actions}
      panel={
        <>
          <div className="folder-tiles-3">
            <ToneTile tone="peach" Icon={Gauge} label={ui.homeQ1Score} value={`${overallPct}%`} den="/100" pct={overallPct} />
            <ToneTile tone="gold" Icon={Target} label={ui.homeQ1Coverage} value={`${roleCovPct}%`} den="/100" pct={roleCovPct} />
            <ToneTile
              tone="gold"
              Icon={avgGap < 0 ? TrendingDown : TrendingUp}
              label={ui.homeQ1Gap}
              value={`${signed(avgGap)} punti`}
              sub={`${signed(avgGapPct)}% · Benchmark ${fmt1it(benchmark)}/10`}
            />
          </div>
          <div className="folder-tiles-3">
            <ToneTile tone="green" Icon={CheckCircle2} label={ui.homeQ1GreenSub} value={`${breakdown.ottimale}%`} sub={ui.homeQ1Green} pct={breakdown.ottimale} />
            <ToneTile tone="yellow" Icon={CircleMinus} label={ui.homeQ1YellowSub} value={`${breakdown.moderato}%`} sub={ui.homeQ1Yellow} pct={breakdown.moderato} />
            <ToneTile tone="red" Icon={AlertTriangle} label={ui.homeQ1RedSub} value={`${breakdown.critico}%`} sub={ui.homeQ1Red} pct={breakdown.critico} />
          </div>
        </>
      }
    />
  )
}
