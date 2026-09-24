import type { FunnelStage } from '@/modules/recruiting/lib/use-recruiting-home-data'

// A real cross-opening funnel — no equivalent existed before (Phase 5):
// usePipelineData() only ever gave per-opening stage estimates, never an
// aggregate. Matches the concept's own bar style: label to the left, the
// count drawn inside the filled bar itself. Every stage but the last uses
// bg-chart-2 (never the lime accent, same convention as every other chart
// in the app — see CrossModuleBanner.tsx's own comments); the final
// "Assunti" stage is colored success-green, matching the concept's own
// visual distinction of the successful outcome.
export function SelectionFunnel({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.count))
  const note = stages.find((s) => s.note)?.note

  return (
    <div className="flex flex-col gap-2.5">
      {stages.map((s, i) => {
        const pct = Math.max((s.count / max) * 100, s.count > 0 ? 8 : 0)
        const isLast = i === stages.length - 1
        return (
          <div key={s.key} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-[12px] font-medium text-foreground">{s.label}</span>
            <div className="h-8 min-w-0 flex-1 rounded-md bg-secondary">
              <div
                className={`flex h-full items-center justify-end rounded-md px-2.5 ${isLast ? 'bg-success' : 'bg-chart-2'}`}
                style={{ width: `${pct}%` }}
              >
                <span className="font-mono text-[12.5px] font-bold tabular-nums text-white">{s.count}</span>
              </div>
            </div>
          </div>
        )
      })}
      {note && <p className="mt-0.5 text-[11px] text-muted-foreground">* {note}</p>}
    </div>
  )
}
