import type { QualityBucket } from '@/modules/recruiting/lib/use-recruiting-home-data'

const TONE_VAR: Record<QualityBucket['tone'], string> = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  destructive: 'var(--destructive)',
}

// Replaces QualityChart.tsx's hand-built inline-SVG column chart with a
// single stacked horizontal bar (Phase 5) — same pattern as Assessment
// Home's "Distribuzione per fascia" bar (AssessmentHomePage.tsx's Il
// Capitale Umano card), ported to this module's plain Tailwind classes
// since Recruiting doesn't use assessment-scoped.css's .pbar. QualityChart
// itself is left in place, unused, rather than deleted.
export function QualityStackedBar({ buckets, total }: { buckets: QualityBucket[]; total: number }) {
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary">
        {buckets.map((b, i) => {
          const pct = total ? (b.count / total) * 100 : 0
          return pct ? <div key={i} style={{ width: `${pct}%`, background: TONE_VAR[b.tone] }} /> : null
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {buckets.map((b, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: TONE_VAR[b.tone] }} />
            <span className="font-semibold text-foreground">{b.count}</span> {b.label}
          </div>
        ))}
      </div>
    </div>
  )
}
