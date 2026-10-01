import { IdoneitaBadge } from '@/components/patterns/IdoneitaBadge'
import type { Idoneita } from '@/lib/idoneita'
import { W } from '@/modules/recruiting/lib/constants'
import type { Candidate } from '@/modules/recruiting/lib/types'

const MAX = 31

// Fascia di idoneità della skill rispetto al target (stessa soglia di prima:
// raggiunto / oltre il 75% / sotto), con il suo nome accanto alla barra.
function fasciaFor(s: number, t: number): Idoneita {
  if (s >= t) return 'idoneo'
  if (s >= 0.75 * t) return 'da-valutare'
  return 'non-idoneo'
}
const FILL: Record<Idoneita, string> = { idoneo: 'bg-success', 'da-valutare': 'bg-warning', 'non-idoneo': 'bg-destructive' }

// Ported from legacy's essential-skills ApexCharts3D.renderCapsuleBars call
// (renderRanking(), modules/recruiting.html ~2934-2942) — same values, same
// target, same per-skill pass/near/fail color rule (severity per skill, so
// success/warning/destructive tokens are correct here — this is grading,
// not category identity). Reimplemented as plain Tailwind bars rather than
// the vanilla-JS SVG helper, keeping migrated screens on one consistent
// (React-owned) bar implementation instead of re-coupling to the legacy
// apex-charts.js global script.
//
// Shared component: used by Ranking's card body (Phase 5) AND the CV Match
// dialog (Phase 6) — same underlying legacy computation in both places
// (renderRanking()'s capsule bars and openCvMatchModal()'s .dual bars use
// the exact same s/t/color rule, just different chart widgets), so this is
// one implementation rather than two near-identical copies.
export function EssentialSkillBars({ candidate, essentialSkills }: { candidate: Candidate; essentialSkills: string[] }) {
  const t = W[3].t

  if (!essentialSkills.length) {
    return <div className="py-2 text-app-small text-muted-foreground">Nessuna skill essenziale flaggata per questa posizione.</div>
  }

  return (
    <div className="flex flex-col gap-2.5">
      {essentialSkills.map((sk) => {
        const s = candidate.scores[sk] || 0
        // Always keep a visible minimum sliver, even at 0 — same reasoning
        // as legacy's capsule bars (Math.max(pillW*0.55, ...)): a 0-width
        // fill looks like a rendering bug, not "the value is zero".
        const pct = Math.max(Math.min((s / MAX) * 100, 100), 2)
        const targetPct = Math.min((t / MAX) * 100, 100)
        return (
          <div key={sk} className="grid grid-cols-[minmax(0,9.5rem)_1fr_auto_auto] items-center gap-3 text-app-small">
            <span className="truncate font-medium text-muted-foreground" title={sk}>
              {sk}
            </span>
            <div className="relative h-3.5 rounded-full border border-border bg-secondary">
              <div className={`h-full rounded-full ${FILL[fasciaFor(s, t)]}`} style={{ width: `${pct}%` }} />
              <div
                className="absolute top-1/2 size-2.5 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-foreground bg-card"
                style={{ left: `${targetPct}%` }}
                title={`Target: ${t}`}
              />
            </div>
            <span className="text-right font-mono font-medium tabular-nums">{s.toFixed(1)}</span>
            <IdoneitaBadge fascia={fasciaFor(s, t)} />
          </div>
        )
      })}
    </div>
  )
}
