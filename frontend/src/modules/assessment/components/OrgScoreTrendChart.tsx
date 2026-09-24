import { useEffect, useRef, useState } from 'react'

import { useTheme } from '@/hooks/use-theme'
import { fmt1it, round1 } from '@/modules/assessment/lib/legacy-utils'
import { Chart, ensureChartDefaults, token } from '@/modules/assessment/lib/brand-chart'

const IT_MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

// "Ultimi 6 mesi" — the concept's own framing (its example spans Apr–Set,
// i.e. the 6 months ending on the current one) — real calendar months
// from today, not a fixed illustrative Gen–Giu range.
export function lastSixMonthLabels(): string[] {
  const now = new Date()
  const labels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    labels.push(IT_MONTHS[d.getMonth()])
  }
  return labels
}

type Badge = { leftPct: number; topPct: number; label: string; value: string; delta: string; deltaCls: 'up' | 'down' | 'flat' }

// Same recipe as AndamentoChart.tsx (fill:true, tension 0.4, 4px points,
// --chart-2 so no lime touches a chart), but one series instead of two —
// the org-wide average against the fixed benchmark, drawn as a dashed
// target line (same technique as GroupedBarsChart.tsx's targetLine
// plugin) with an inline "Benchmark X,X" label, rather than a second
// dataset, since the benchmark is a constant, not a second real series.
// The floating "current value" badge on the last point uses the same
// pixel-position-as-percentage technique QualityChart.tsx already uses
// for its hover tooltip, just permanently anchored to the last point
// instead of shown on hover.
export function OrgScoreTrendChart({
  months,
  series,
  benchmark,
  mode,
}: {
  months: string[]
  series: number[]
  benchmark: number
  mode: 'media' | 'benchmark'
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)
  const { theme } = useTheme()
  const [badge, setBadge] = useState<Badge | null>(null)

  useEffect(() => {
    if (!canvasRef.current || !series.length) return
    const el = canvasRef.current
    const palette = ensureChartDefaults(el)
    const color = token(el, '--chart-2', '#5B7FA6')
    const ring = token(el, '--surface', '#FFFFFF')
    const min = Math.floor(Math.min(...series, benchmark) * 2) / 2 - 0.5
    const max = Math.ceil(Math.max(...series, benchmark) * 2) / 2 + 0.5

    const last = series[series.length - 1]
    const prev = series[series.length - 2] ?? last
    const deltaVsPrev = round1(last - prev)
    const deltaVsBenchmark = round1(last - benchmark)
    const delta = mode === 'benchmark' ? deltaVsBenchmark : deltaVsPrev
    const deltaPct = mode === 'benchmark' ? (benchmark ? round1((deltaVsBenchmark / benchmark) * 100) : 0) : prev ? round1((deltaVsPrev / prev) * 100) : 0
    const deltaCls: Badge['deltaCls'] = Math.abs(delta) < 0.05 ? 'flat' : delta > 0 ? 'up' : 'down'
    const deltaArrow = deltaCls === 'flat' ? '→' : deltaCls === 'up' ? '▲' : '▼'
    const deltaText = `${deltaArrow} ${delta > 0 ? '+' : ''}${fmt1it(delta)} · ${deltaPct > 0 ? '+' : ''}${fmt1it(deltaPct)}%`

    chartRef.current?.destroy()
    chartRef.current = new Chart(el, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            data: series,
            borderColor: color,
            backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: color,
            pointBorderColor: ring,
            pointBorderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        layout: { padding: { top: 46 } },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${(ctx.parsed.y as number).toFixed(1)}` } },
        },
        scales: {
          x: { ticks: { color: palette.text, font: { size: 12 } }, grid: { display: false }, border: { display: false } },
          y: { min, max, ticks: { color: palette.text, font: { size: 11 }, stepSize: 0.5 }, grid: { color: palette.grid }, border: { display: false } },
        },
      },
      plugins: [
        {
          id: 'benchmarkLine',
          afterDatasetsDraw(chart) {
            const y = chart.scales.y.getPixelForValue(benchmark)
            const { left, right } = chart.chartArea
            const ctx = chart.ctx
            ctx.save()
            ctx.strokeStyle = palette.strong
            ctx.globalAlpha = 0.55
            ctx.setLineDash([4, 4])
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(left, y)
            ctx.lineTo(right, y)
            ctx.stroke()
            ctx.restore()
            ctx.save()
            ctx.globalAlpha = 0.85
            ctx.fillStyle = palette.strong
            ctx.font = '600 11px inherit'
            ctx.textBaseline = 'bottom'
            ctx.fillText(`Benchmark ${fmt1it(benchmark)}`, left + 4, y - 4)
            ctx.restore()
          },
        },
        {
          id: 'lastPointBadge',
          afterRender(chart) {
            const meta = chart.getDatasetMeta(0)
            const point = meta.data[meta.data.length - 1]
            if (!point || !chart.width || !chart.height) return
            const leftPct = (point.x / chart.width) * 100
            const topPct = (point.y / chart.height) * 100
            setBadge((prevBadge) => {
              const next: Badge = { leftPct, topPct, label: months[months.length - 1], value: `${fmt1it(last)} / 10`, delta: deltaText, deltaCls }
              if (
                prevBadge &&
                Math.abs(prevBadge.leftPct - next.leftPct) < 0.1 &&
                Math.abs(prevBadge.topPct - next.topPct) < 0.1 &&
                prevBadge.value === next.value &&
                prevBadge.delta === next.delta
              ) {
                return prevBadge
              }
              return next
            })
          },
        },
      ],
    })
    return () => chartRef.current?.destroy()
  }, [months, series, benchmark, mode, theme])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} />
      {badge && (
        <div
          style={{
            position: 'absolute',
            left: `${badge.leftPct}%`,
            top: `${badge.topPct}%`,
            transform: 'translate(-50%, calc(-100% - 12px))',
            background: 'var(--text-1)',
            color: 'var(--surface)',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 11.5,
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ opacity: 0.7, fontSize: 10 }}>{badge.label}</div>
          <div style={{ fontWeight: 800, fontSize: 13 }}>{badge.value}</div>
          <div style={{ color: badge.deltaCls === 'up' ? 'var(--success)' : badge.deltaCls === 'down' ? 'var(--danger)' : 'var(--text-3)', fontWeight: 700 }}>{badge.delta}</div>
        </div>
      )}
    </div>
  )
}
