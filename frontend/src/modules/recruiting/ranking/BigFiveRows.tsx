import { BF, BF_SUB } from '@/modules/recruiting/lib/constants'
import type { Candidate, RoleProfile } from '@/modules/recruiting/lib/types'

function toneClass(diff: number) {
  if (diff <= 10) return 'bg-success'
  if (diff <= 25) return 'bg-warning'
  return 'bg-destructive'
}

// Ported from legacy's Big Five ApexCharts3D.renderBarRow calls
// (renderRanking(), modules/recruiting.html ~2944-2962) — same five
// dimensions, same "distance from role ideal" severity grading (<=10 pts
// green / <=25 amber / else red), same target-ideal marker. Same
// reimplementation decision as EssentialSkillBars.tsx (plain Tailwind bars,
// not the vanilla-JS chart helper).
export function BigFiveRows({ candidate, role }: { candidate: Candidate; role: RoleProfile }) {
  return (
    <div className="flex flex-col gap-2.5">
      {BF.map((k) => {
        const p = candidate.bf[k] ?? 50
        const ideal = role.bf[k] ?? 50
        const diff = Math.abs(p - ideal)
        return (
          <div key={k} className="grid grid-cols-[minmax(0,152px)_1fr_34px] items-center gap-3 text-[12.5px]">
            <span className="truncate font-semibold text-muted-foreground" title={`${k} (${BF_SUB[k].join(', ')})`}>
              {k}
            </span>
            <div className="relative h-3.5 rounded-full border border-border bg-secondary">
              <div className={`h-full rounded-full ${toneClass(diff)}`} style={{ width: `${Math.max(Math.min(p, 100), 2)}%` }} />
              <div
                className="absolute top-1/2 size-2.5 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-foreground bg-card"
                style={{ left: `${Math.min(ideal, 100)}%` }}
                title={`Ideale per il ruolo: ${ideal}`}
              />
            </div>
            <span className="text-right font-mono font-semibold tabular-nums">{p}</span>
          </div>
        )
      })}
    </div>
  )
}
