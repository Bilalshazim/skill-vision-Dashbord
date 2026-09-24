import type { FunnelStage } from '@/modules/recruiting/lib/use-recruiting-home-data'

// A real cross-opening funnel — no equivalent existed before (Phase 5):
// usePipelineData() only ever gave per-opening stage estimates, never an
// aggregate. bg-chart-2 keeps this off the lime accent, same convention as
// every other chart in the app (see CrossModuleBanner.tsx's own comments).
export function SelectionFunnel({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.count))
  const note = stages.find((s) => s.note)?.note

  return (
    <div className="flex flex-col gap-3">
      {stages.map((s) => {
        const pct = (s.count / max) * 100
        return (
          <div key={s.key}>
            <div className="flex items-baseline justify-between text-[12.5px]">
              <span className="font-medium text-foreground">{s.label}</span>
              <span className="font-mono font-bold tabular-nums text-foreground">{s.count}</span>
            </div>
            <div className="mt-1 h-2.5 w-full rounded-full bg-secondary">
              <div className="h-full rounded-full bg-chart-2" style={{ width: `${Math.max(pct, s.count > 0 ? 4 : 0)}%` }} />
            </div>
          </div>
        )
      })}
      {note && <p className="mt-0.5 text-[11px] text-muted-foreground">* {note}</p>}
    </div>
  )
}
