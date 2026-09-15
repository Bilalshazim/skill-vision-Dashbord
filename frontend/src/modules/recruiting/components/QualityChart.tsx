import { useState } from 'react'

import type { QualityBucket } from '@/modules/recruiting/lib/use-recruiting-home-data'

// Hand-built inline SVG (no chart library) — an ApexCharts column-chart
// build was tried first (matching the requested "modern chart card" look
// more directly), but apexcharts@7.3.0's bundled build silently mis-scales
// vertical bar/column charts under Vite/Rollup: verified with a bare
// series+chart+xaxis config that a real value of 54 on an auto-scaled 0-60
// axis rendered at ~20-50% height instead of ~90%, reproduced identically
// in the production build (rules out React StrictMode), and confirmed
// correct only via the raw standalone apexcharts.min.js file outside this
// bundle — a genuine upstream bug in this build, not a config issue. An SVG
// built by hand sidesteps it entirely while still hitting every requested
// visual: rounded bars, value labels, gridlines/axis, hover tooltip,
// legend-free single-series clarity, and true responsiveness via a
// viewBox instead of a JS resize listener.
const TONE_VAR: Record<QualityBucket['tone'], string> = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  destructive: 'var(--destructive)',
}

// "Nice" round axis ceiling (1/2/5 x 10^n) above the real max, so the
// tallest real bar never touches the very top of the chart.
function niceMax(value: number): number {
  if (value <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(value)))
  const n = value / pow
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * pow
}

const WIDTH = 560
const HEIGHT = 200
const PADDING = { top: 28, right: 12, bottom: 28, left: 30 }
const PLOT_W = WIDTH - PADDING.left - PADDING.right
const PLOT_H = HEIGHT - PADDING.top - PADDING.bottom
const TICKS = 4

export function QualityChart({ buckets, max }: { buckets: QualityBucket[]; max: number }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const total = Math.max(max, 1)
  const axisMax = niceMax(Math.max(...buckets.map((b) => b.count), 1))

  const slot = PLOT_W / buckets.length
  const barWidth = Math.min(56, slot * 0.5)

  const yFor = (v: number) => PADDING.top + PLOT_H * (1 - v / axisMax)

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[220px] w-full min-w-[420px]" role="img" aria-label={buckets.map((b) => `${b.label}: ${b.count}`).join(', ')}>
        {/* Y-axis gridlines + tick labels */}
        {Array.from({ length: TICKS + 1 }, (_, i) => {
          const v = (axisMax / TICKS) * i
          const y = yFor(v)
          return (
            <g key={i}>
              <line x1={PADDING.left} y1={y} x2={WIDTH - PADDING.right} y2={y} stroke="var(--border)" strokeDasharray="3 3" strokeWidth={1} />
              <text x={PADDING.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="var(--muted-foreground)">
                {Math.round(v)}
              </text>
            </g>
          )
        })}
        {/* Baseline */}
        <line x1={PADDING.left} y1={yFor(0)} x2={WIDTH - PADDING.right} y2={yFor(0)} stroke="var(--border)" strokeWidth={1} />

        {buckets.map((b, i) => {
          const cx = PADDING.left + slot * i + slot / 2
          const barH = b.count > 0 ? Math.max(3, PLOT_H * (b.count / axisMax)) : 0
          const barY = yFor(0) - barH
          const color = TONE_VAR[b.tone]
          const isHovered = hovered === i
          return (
            <g
              key={b.label}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
              className="cursor-default"
            >
              {/* Wider invisible hit-area so hovering near a zero-height bar still works */}
              <rect x={cx - slot / 2} y={PADDING.top} width={slot} height={PLOT_H} fill="transparent" />
              <rect
                x={cx - barWidth / 2}
                y={b.count > 0 ? barY : yFor(0) - 3}
                width={barWidth}
                height={b.count > 0 ? barH : 3}
                rx={6}
                fill={color}
                opacity={isHovered ? 1 : 0.88}
                style={{ transition: 'opacity .15s ease' }}
              />
              <text x={cx} y={barY - 8} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--foreground)">
                {b.count}
              </text>
              <text x={cx} y={HEIGHT - 8} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">
                {b.label}
              </text>
            </g>
          )
        })}
      </svg>

      {hovered !== null && (
        <div
          className="pointer-events-none absolute top-1 -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: `${((PADDING.left + slot * hovered + slot / 2) / WIDTH) * 100}%` }}
        >
          <div className="font-semibold text-popover-foreground">{buckets[hovered].label}</div>
          <div className="text-muted-foreground">
            {buckets[hovered].count} candidat{buckets[hovered].count === 1 ? 'o' : 'i'}
            {total > 0 ? ` · ${Math.round((buckets[hovered].count / total) * 100)}%` : ''}
          </div>
        </div>
      )}
    </div>
  )
}
