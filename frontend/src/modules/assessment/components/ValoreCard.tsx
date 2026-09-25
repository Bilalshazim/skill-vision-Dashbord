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
}

const signed = (n: number) => `${n > 0 ? '+' : ''}${fmt1it(n)}`

// Q1 — Il Valore, per the client concept (E.pdf). "Oggi" shows the card
// alone; "Skill Vision" opens the value panel beside it (the three headline
// metrics + the Ottimale/Moderato/Critico split). Every number is passed in
// from AssessmentHomePage, derived from the same homeStats() partition the
// rest of the page uses.
export function ValoreCard({ ui, overallPct, roleCovPct, benchmark, avgGap, avgGapPct, breakdown, actions }: Props) {
  return (
    <SkillVisionCard
      storageKey="sv-assessment-home-valore-view"
      tone="valore"
      Icon={CurrencyCircleDollar}
      title={ui.homeQ1Title}
      kicker={ui.homeQ1Kicker}
      className="valore-folder"
      panelClassName="valore-panel"
      body={(isActive) =>
        isActive ? (
          <p className="sv-question">{ui.homeQ1ExpandQuestion.replace(/\?$/, '')}</p>
        ) : (
          <div className="valore-today">
            <p className="sv-question">{ui.homeQ1Sub}</p>
            <div className="small-note">{ui.homeQ1TeaserCompare(signed(avgGap), fmt1it(benchmark))}</div>
          </div>
        )
      }
      actions={actions}
      panel={
        <>
          <ToneTile tone="peach" size="lg" className="valore-panel-main" Icon={Gauge} label={ui.homeQ1Score} value={`${overallPct}%`} den="/100" pct={overallPct} />
          <ToneTile tone="gold" Icon={Target} label={ui.homeQ1Coverage} value={`${roleCovPct}%`} den="/ 100" pct={roleCovPct} />
          <ToneTile
            tone="gold"
            Icon={avgGap < 0 ? TrendingDown : TrendingUp}
            label={ui.homeQ1Gap}
            value={`${signed(avgGap)} punti = ${signed(avgGapPct)}%`}
            sub={`Benchmark ${fmt1it(benchmark)}/10`}
          />
          <div className="valore-levels">
            <ToneTile tone="green" size="sm" Icon={CheckCircle2} label={ui.homeQ1GreenSub} value={`${breakdown.ottimale}% ${ui.homeQ1Green}`} pct={breakdown.ottimale} />
            <ToneTile tone="yellow" size="sm" Icon={CircleMinus} label={ui.homeQ1YellowSub} value={`${breakdown.moderato}% ${ui.homeQ1Yellow}`} pct={breakdown.moderato} />
            <ToneTile tone="red" size="sm" Icon={AlertTriangle} label={ui.homeQ1RedSub} value={`${breakdown.critico}% ${ui.homeQ1Red}`} pct={breakdown.critico} />
          </div>
        </>
      }
    />
  )
}
