import { useMemo, useState } from 'react'

import type { FunnelStage } from '@/modules/recruiting/lib/use-recruiting-home-data'

type Segment = { key: string; label: string; value: number; color: string; note?: string }

// Never chart-1 (that's the lime UI accent — reserved for interactive
// controls, never a data series, see index.css's own token comment) and
// never a flat --danger red for "lost" volume — these are attrition
// counts, not a severity signal. --success stays reserved for the one
// real good outcome (Assunti), matching the old bar funnel's own
// bg-success/bg-chart-2 split.
const SEGMENT_COLORS = ['var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--success)']

// The funnel's own stages (Candidature/Screening/Test/Colloqui/Assunti)
// are cumulative pass-through counts, not mutually-exclusive slices of one
// whole — plotting them directly on a ring would visually claim they sum
// to 100% when they don't (anyone counted in "Colloqui" is also already
// counted in "Candidature"). This derives the one breakdown that IS a
// real, honest partition of the starting candidate pool: how many never
// made it past each stage, plus how many made it all the way to Assunti.
// Clamped at 0 so a data quirk (a later stage briefly exceeding an
// earlier one) never renders as negative attrition.
function buildAttritionSegments(stages: FunnelStage[]): Segment[] {
  const segments: Segment[] = []
  for (let i = 1; i < stages.length; i++) {
    const lost = Math.max(stages[i - 1].count - stages[i].count, 0)
    segments.push({ key: `lost-${stages[i].key}`, label: `Persi prima di ${stages[i].label}`, value: lost, color: SEGMENT_COLORS[i - 1] })
  }
  const last = stages[stages.length - 1]
  if (last) segments.push({ key: last.key, label: last.label, value: last.count, color: SEGMENT_COLORS[segments.length], note: last.note })
  return segments
}

const CX = 90
const CY = 90
const R = 70
const STROKE = 22
const CIRCUMFERENCE = 2 * Math.PI * R

export function SelectionFunnel({ stages }: { stages: FunnelStage[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const segments = useMemo(() => buildAttritionSegments(stages), [stages])
  const total = stages[0]?.count ?? 0
  const note = segments.find((s) => s.note)?.note

  const centerValue = hovered !== null ? segments[hovered].value : total
  const centerLabel = hovered !== null ? segments[hovered].label : (stages[0]?.label ?? '')

  let offset = 0
  const arcs = segments.map((s, i) => {
    const pct = total > 0 ? s.value / total : 0
    const dash = pct * CIRCUMFERENCE
    const startOffset = CIRCUMFERENCE - (offset * CIRCUMFERENCE) / (total || 1)
    offset += s.value
    return { ...s, dash, startOffset, index: i }
  })

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative size-32 shrink-0">
          <svg viewBox="0 0 180 180" className="size-32 -rotate-90">
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth={STROKE} />
            {arcs.map((a) =>
              a.value > 0 ? (
                <circle
                  key={a.key}
                  cx={CX}
                  cy={CY}
                  r={R}
                  fill="none"
                  stroke={a.color}
                  strokeWidth={hovered === a.index ? STROKE + 4 : STROKE}
                  strokeDasharray={`${a.dash} ${CIRCUMFERENCE - a.dash}`}
                  strokeDashoffset={a.startOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-width .15s, opacity .15s', opacity: hovered === null || hovered === a.index ? 1 : 0.3, cursor: 'pointer' }}
                  onMouseEnter={() => setHovered(a.index)}
                  onMouseLeave={() => setHovered(null)}
                />
              ) : null,
            )}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="font-mono text-xl font-black tabular-nums text-foreground">{centerValue}</div>
            <div className="mt-1 max-w-20 text-[10px] leading-tight text-muted-foreground">{centerLabel}</div>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          {segments.map((s, i) => {
            const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
            return (
              <div
                key={s.key}
                className="flex items-center gap-2.5 rounded-md px-1.5 py-1 transition-opacity hover:bg-secondary/60"
                style={{ opacity: hovered === null || hovered === i ? 1 : 0.4 }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-medium text-foreground">{s.label}</div>
                  <div className="mt-1 h-1 rounded-full bg-secondary">
                    <div className="h-1 rounded-full transition-[width]" style={{ width: `${pct}%`, background: s.color }} />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[12.5px] font-bold tabular-nums text-foreground">{s.value}</div>
                  <div className="text-[10.5px] text-muted-foreground">{pct}%</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {note && <p className="mt-3 text-[11px] text-muted-foreground">* {note}</p>}
    </div>
  )
}
