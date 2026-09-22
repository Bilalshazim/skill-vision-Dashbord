import { useEffect, useRef } from 'react'

import { useTheme } from '@/hooks/use-theme'
import { Chart, ensureChartDefaults } from '@/modules/assessment/lib/brand-chart'

// The 3 call sites pass colors as literal 'var(--chart-2)' strings, which
// worked fine for the old SVG renderer (SVG fill/stroke attributes resolve
// var() through the normal CSS cascade) but silently fails on a canvas —
// Canvas2D's fillStyle parser has no element context to resolve a CSS
// custom property against, so `ctx.fillStyle = "var(--chart-2)"` (or a
// color-mix() wrapping it) is simply invalid and Chart.js falls back to
// black. Resolving any var(--x) reference to its computed value up front
// (same technique as brand-chart.ts's own token()) is what actually makes
// it a real color canvas can use.
function resolveColor(el: Element, value: string): string {
  const match = /^var\((--[\w-]+)\)$/.exec(value.trim())
  if (!match) return value
  return getComputedStyle(el.closest('.sv-assessment-shell') ?? el).getPropertyValue(match[1]).trim() || value
}

// Replaces IsometricBarsChart's hand-rolled inline-SVG 3D bars (formerly
// apex-charts-3d.ts's renderIsometricBars) with a real Chart.js bar chart,
// restyled to match the client-supplied "Competenze per Mese" bar-chart
// reference's recipe (skillvision-barchart.html): 6px rounded corners,
// borderSkipped:false, default bars at 85% opacity with a solid
// hoverBackgroundColor, and the reference's own grow-from-bottom bar
// animation. Data and series colors are NOT replaced with the reference's
// — these 3 call sites (Big Five Ottenuto/Atteso on AssessmentSoftPage,
// APEX5D Manager/Peer/Self on AssessmentHardPage) each plot real state,
// not the reference's fixed 6-month demo numbers, so only the visual
// treatment moved over, not the content.
export type GroupedBarsGroup = { label: string; values: number[]; target?: number }

export function GroupedBarsChart({
  groups,
  seriesNames,
  seriesColors,
  max = 10,
  dec = 1,
}: {
  groups: GroupedBarsGroup[]
  seriesNames?: string[]
  seriesColors?: string[]
  max?: number
  dec?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!canvasRef.current || !groups.length) return
    const el = canvasRef.current
    const palette = ensureChartDefaults(el)
    const nSeries = groups[0].values.length
    // All 3 current call sites only ever set the same target on every
    // group (a single constant threshold, e.g. APEX5D's 6.5) — drawn as
    // one full-width dashed line rather than a per-group tick, which is
    // both simpler and visually identical for a constant target.
    const target = groups.find((g) => g.target != null)?.target

    const datasets = Array.from({ length: nSeries }, (_, i) => {
      const color = resolveColor(el, seriesColors?.[i] || palette.text)
      return {
        label: seriesNames?.[i] ?? '',
        data: groups.map((g) => g.values[i]),
        backgroundColor: `color-mix(in srgb, ${color} 85%, transparent)`,
        hoverBackgroundColor: color,
        borderRadius: 6,
        borderSkipped: false as const,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      }
    })

    chartRef.current?.destroy()
    chartRef.current = new Chart(el, {
      type: 'bar',
      data: { labels: groups.map((g) => g.label), datasets },
      options: {
        maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeOutQuart' },
        animations: {
          x: { duration: 0 },
          y: { from: (ctx) => ctx.chart.scales.y.getPixelForValue(0), duration: 800, easing: 'easeOutQuart' },
          height: { from: 0, duration: 800, easing: 'easeOutQuart' },
        },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: nSeries > 1 ? { display: true, position: 'top', align: 'center', labels: { color: palette.text, boxWidth: 10, font: { size: 11 } } } : { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${(ctx.parsed.y as number).toFixed(dec)}` } },
        },
        scales: {
          x: { ticks: { color: palette.text, font: { size: 11 } }, grid: { display: false }, border: { display: false } },
          y: { min: 0, max, ticks: { color: palette.text, font: { size: 11 } }, grid: { color: palette.grid }, border: { display: false } },
        },
      },
      plugins:
        target == null
          ? []
          : [
              {
                id: 'targetLine',
                afterDatasetsDraw(chart) {
                  const y = chart.scales.y.getPixelForValue(target)
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
                },
              },
            ],
    })
    return () => chartRef.current?.destroy()
  }, [groups, seriesNames, seriesColors, max, dec, theme])

  return <canvas ref={canvasRef} />
}
