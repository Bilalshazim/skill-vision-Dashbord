import { CurrencyCircleDollar } from '@phosphor-icons/react'
import { AlertTriangle, CheckCircle2, CircleMinus, Gauge, Target, TrendingDown, TrendingUp } from 'lucide-react'
import { useId, useState } from 'react'

import { FolderCard, FolderPill } from '@/modules/assessment/components/FolderCard'
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

type View = 'oggi' | 'skillvision'

// Remembered per browser so the card reopens the way the user left it.
// Storage can throw (private mode, blocked site data): fall back to "oggi".
const STORAGE_KEY = 'sv-assessment-home-valore-view'

function readView(): View {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'skillvision' ? 'skillvision' : 'oggi'
  } catch {
    return 'oggi'
  }
}

function writeView(view: View) {
  try {
    window.localStorage.setItem(STORAGE_KEY, view)
  } catch {
    // not persisted — the toggle still works for this session
  }
}

const signed = (n: number) => `${n > 0 ? '+' : ''}${fmt1it(n)}`

// Q1 — Il Valore, per the client concept (E.pdf). "Oggi" shows today's
// snapshot inside the card; "Skill Vision" opens the value panel beside it
// (the three headline metrics + the Ottimale/Moderato/Critico split). Every
// number is passed in from AssessmentHomePage, derived from the same
// homeStats() partition the rest of the page uses.
export function ValoreCard({ ui, overallPct, roleCovPct, benchmark, avgGap, avgGapPct, breakdown, actions }: Props) {
  const [view, setView] = useState<View>(readView)
  const panelId = useId()
  const isActive = view === 'skillvision'

  function select(next: View) {
    setView(next)
    writeView(next)
  }

  return (
    <div className={`valore-block${isActive ? ' is-active' : ''}`}>
      <FolderCard
        tone="valore"
        Icon={CurrencyCircleDollar}
        title={ui.homeQ1Title}
        kicker={ui.homeQ1Kicker}
        className="valore-folder"
        aside={
          <>
            <FolderPill active={!isActive} onClick={() => select('oggi')}>
              oggi
            </FolderPill>
            <FolderPill active={isActive} aria-expanded={isActive} aria-controls={panelId} onClick={() => select(isActive ? 'oggi' : 'skillvision')}>
              SKILL VISION
            </FolderPill>
          </>
        }
      >
        {isActive ? (
          <p className="valore-question">{ui.homeQ1ExpandQuestion.replace(/\?$/, '')}</p>
        ) : (
          <div className="valore-today">
            <p className="valore-question">{ui.homeQ1Sub}</p>
            <div className="small-note">{ui.homeQ1TeaserCompare(signed(avgGap), fmt1it(benchmark))}</div>
          </div>
        )}
        <div className="folder-actions">{actions}</div>
      </FolderCard>

      {isActive && (
        <div id={panelId} className="valore-panel">
          <ToneTile tone="peach" size="lg" className="valore-panel-main" Icon={Gauge} label={ui.homeQ1Score} value={`${overallPct}%`} den="/100" pct={overallPct} />
          <ToneTile tone="gold" Icon={Target} label={ui.homeQ1Coverage} value={`${roleCovPct}%`} den="/ 100" pct={roleCovPct} />
          <ToneTile
            tone="gold"
            Icon={avgGap < 0 ? TrendingDown : TrendingUp}
            label={ui.homeQ1Gap}
            value={`${signed(avgGap)}% = ${signed(avgGapPct)}%`}
            sub={`Benchmark ${fmt1it(benchmark)}/10`}
          />
          <div className="valore-levels">
            <ToneTile tone="green" size="sm" Icon={CheckCircle2} label={ui.homeQ1GreenSub} value={`${breakdown.ottimale}% ${ui.homeQ1Green}`} pct={breakdown.ottimale} />
            <ToneTile tone="yellow" size="sm" Icon={CircleMinus} label={ui.homeQ1YellowSub} value={`${breakdown.moderato}% ${ui.homeQ1Yellow}`} pct={breakdown.moderato} />
            <ToneTile tone="red" size="sm" Icon={AlertTriangle} label={ui.homeQ1RedSub} value={`${breakdown.critico}% ${ui.homeQ1Red}`} pct={breakdown.critico} />
          </div>
        </div>
      )}
    </div>
  )
}
