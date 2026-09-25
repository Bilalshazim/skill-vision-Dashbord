import { CircleDollarSign } from 'lucide-react'
import { useId, useState } from 'react'

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

// Q1 — Il Valore, per the client concept (E.pdf): a folder-shaped card with
// two pills. "Oggi" shows today's snapshot inside the card; "Skill Vision"
// opens the value panel beside it (the three headline metrics + the
// Ottimale/Moderato/Critico split). Every number is passed in from
// AssessmentHomePage, derived from the same homeStats() partition the rest
// of the page uses.
export function ValoreCard({ ui, overallPct, roleCovPct, benchmark, avgGap, avgGapPct, breakdown, actions }: Props) {
  const [view, setView] = useState<View>(readView)
  const panelId = useId()
  const isActive = view === 'skillvision'

  function select(next: View) {
    setView(next)
    writeView(next)
  }

  const levels = [
    { key: 'ottimale', label: ui.homeQ1GreenSub, color: ui.homeQ1Green, pct: breakdown.ottimale },
    { key: 'moderato', label: ui.homeQ1YellowSub, color: ui.homeQ1Yellow, pct: breakdown.moderato },
    { key: 'critico', label: ui.homeQ1RedSub, color: ui.homeQ1Red, pct: breakdown.critico },
  ] as const

  return (
    <div className={`valore-block${isActive ? ' is-active' : ''}`}>
      <div className="valore-folder">
        <span className="valore-folder-icon" aria-hidden="true">
          <CircleDollarSign />
        </span>
        <div className="valore-folder-tab">
          <div className="valore-pills" role="group" aria-label={ui.homeQ1Title}>
            <button type="button" className="valore-pill" aria-pressed={!isActive} onClick={() => select('oggi')}>
              oggi
            </button>
            <button type="button" className="valore-pill valore-pill-sv" aria-pressed={isActive} aria-expanded={isActive} aria-controls={panelId} onClick={() => select(isActive ? 'oggi' : 'skillvision')}>
              Skill Vision
            </button>
          </div>
          <h3 className="valore-title">{ui.homeQ1Title}</h3>
        </div>
        <div className="valore-folder-body">
          <div className="valore-kicker">{ui.homeQ1Kicker}</div>
          {isActive ? (
            <p className="valore-question">{ui.homeQ1ExpandQuestion.replace(/\?$/, '')}</p>
          ) : (
            <div className="valore-today">
              <p className="valore-question">{ui.homeQ1Sub}</p>
              <div className="valore-today-value">{overallPct}%</div>
              <div className="small-note">{ui.homeQ1TeaserCompare(signed(avgGap), fmt1it(benchmark))}</div>
            </div>
          )}
          <div className="valore-actions">{actions}</div>
        </div>
      </div>

      {isActive && (
        <div id={panelId} className="valore-panel">
          <div className="valore-tile valore-tile-main">
            <div className="valore-tile-label">{ui.homeQ1Score}</div>
            <div className="valore-tile-value valore-tile-value-lg">
              {overallPct}% <span className="valore-tile-den">/100</span>
            </div>
          </div>
          <div className="valore-tile valore-tile-side">
            <div className="valore-tile-label">{ui.homeQ1Coverage}</div>
            <div className="valore-tile-value">
              {roleCovPct}% <span className="valore-tile-den">/ 100</span>
            </div>
          </div>
          <div className="valore-tile valore-tile-side">
            <div className="valore-tile-label">{ui.homeQ1Gap}</div>
            <div className="valore-tile-value">
              {signed(avgGap)}% = {signed(avgGapPct)}%
            </div>
          </div>
          <div className="valore-levels">
            {levels.map(({ key, label, color, pct }) => (
              <div key={key} className={`valore-tile valore-level valore-level-${key}`}>
                <div className="valore-tile-label">{label}</div>
                <div className="valore-level-value">
                  {pct}% {color}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
