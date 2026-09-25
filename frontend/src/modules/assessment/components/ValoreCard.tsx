import { AlertTriangle, CheckCircle2, CircleMinus } from 'lucide-react'
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

// Remembered per browser so the panel reopens the way the user left it.
// Storage can throw (private mode, blocked site data): fall back to closed.
const STORAGE_KEY = 'sv-assessment-home-valore-open'

function readOpen(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeOpen(open: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, open ? '1' : '0')
  } catch {
    // not persisted — the toggle still works for this session
  }
}

const signed = (n: number) => `${n > 0 ? '+' : ''}${fmt1it(n)}`

// Q1 — Il Valore. The "Skill Vision" pill toggles the detail panel (the
// three headline metrics + the Ottimale/Moderato/Critico split). Every
// number is passed in from AssessmentHomePage, which derives it from the
// same homeStats() partition the rest of the page uses.
export function ValoreCard({ ui, overallPct, roleCovPct, benchmark, avgGap, avgGapPct, breakdown, actions }: Props) {
  const [isActive, setIsActive] = useState(readOpen)
  const panelId = useId()

  function toggle() {
    setIsActive((prev) => {
      writeOpen(!prev)
      return !prev
    })
  }

  const levels = [
    { key: 'ottimale', label: ui.homeQ1GreenSub, pct: breakdown.ottimale, chip: 'chip-green', Icon: CheckCircle2 },
    { key: 'moderato', label: ui.homeQ1YellowSub, pct: breakdown.moderato, chip: 'chip-amber', Icon: CircleMinus },
    { key: 'critico', label: ui.homeQ1RedSub, pct: breakdown.critico, chip: 'chip-red', Icon: AlertTriangle },
  ] as const

  return (
    <div className={`quad valore-card${isActive ? ' is-active' : ''}`}>
      <div className="valore-head">
        <div>
          <div className="card-eyebrow">{ui.homeQ1Kicker}</div>
          <h3 className="valore-title">{ui.homeQ1Title}</h3>
        </div>
        <button type="button" className="sv-pill" aria-pressed={isActive} aria-expanded={isActive} aria-controls={panelId} onClick={toggle}>
          Skill Vision
        </button>
      </div>

      <div className="valore-headline">
        <span className="kpi-value">{overallPct}%</span>
        <span className="small-note">{ui.homeQ1LevelCaption(fmt1it(benchmark), signed(avgGap))}</span>
      </div>

      <div id={panelId} className="valore-panel" aria-hidden={!isActive} inert={!isActive}>
        <div className="valore-panel-inner">
          <div className="valore-metrics">
            <div className="neu-tile">
              <div className="card-eyebrow">{ui.homeQ1Score}</div>
              <div className="valore-metric">
                {overallPct}%<span className="valore-metric-den"> / 100</span>
              </div>
            </div>
            <div className="neu-tile">
              <div className="card-eyebrow">{ui.homeQ1Coverage}</div>
              <div className="valore-metric">
                {roleCovPct}%<span className="valore-metric-den"> / 100</span>
              </div>
            </div>
            <div className="neu-tile">
              <div className="card-eyebrow">{ui.homeQ1Gap}</div>
              <div className="valore-metric">{signed(avgGap)}</div>
              <div className="small-note">{signed(avgGapPct)}% vs {fmt1it(benchmark)}/10</div>
            </div>
          </div>

          <div className="valore-breakdown">
            <div className="valore-breakdown-q">{ui.homeQ1ExpandQuestion}</div>
            <ul>
              {levels.map(({ key, label, pct, chip, Icon }) => (
                <li key={key}>
                  <span className={`chip ${chip}`}>
                    <Icon size={13} aria-hidden="true" />
                    {label}
                  </span>
                  <span className="valore-level-pct">{pct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="valore-actions">{actions}</div>
    </div>
  )
}
