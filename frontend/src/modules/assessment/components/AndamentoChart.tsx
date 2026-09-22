import { useEffect, useRef } from 'react'

import { useTheme } from '@/hooks/use-theme'
import { Chart, ensureChartDefaults, token } from '@/modules/assessment/lib/brand-chart'

// Ported from the client-supplied "Competenze per Mese" bar-chart reference
// (skillvision-barchart.html) — same data/recipe as the line-chart version
// this replaces (skillvision-chart.html: 6 monthly points, Trasversali vs
// Professionali), just as grouped bars instead of a filled line: 6px
// rounded corners, borderSkipped:false, barPercentage 0.4/categoryPercentage
// 0.8 (thin bars with breathing room), and the reference's own grow-from-
// bottom bar animation (y/height, 800ms easeOutQuart, no x animation).
// Off the reference's lime bar color for Trasversali and its hardcoded
// #2a78d6 for Professionali — both series reuse the exact colors
// ValoreAreaChart.tsx already assigned this same pairing elsewhere in
// Assessment (--chart-2 / --success), same reasoning as the line-chart
// version had. Default bars sit at 85% opacity, hover snaps to the solid
// color — matches the reference's backgroundColor/hoverBackgroundColor
// split exactly, just via color-mix() against the two theme tokens instead
// of a hardcoded rgba().
export function AndamentoChart({
  months,
  softSeries,
  hardSeries,
  softLabel,
  hardLabel,
}: {
  months: string[]
  softSeries: number[]
  hardSeries: number[]
  softLabel: string
  hardLabel: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!canvasRef.current) return
    const el = canvasRef.current
    const palette = ensureChartDefaults(el)
    const soft = token(el, '--chart-2', '#5B7FA6')
    const hard = palette.success
    const min = Math.floor(Math.min(...softSeries, ...hardSeries) * 2) / 2 - 0.5
    const max = Math.ceil(Math.max(...softSeries, ...hardSeries) * 2) / 2 + 0.5

    chartRef.current?.destroy()
    chartRef.current = new Chart(el, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: softLabel,
            data: softSeries,
            backgroundColor: `color-mix(in srgb, ${soft} 85%, transparent)`,
            hoverBackgroundColor: soft,
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.4,
            categoryPercentage: 0.8,
          },
          {
            label: hardLabel,
            data: hardSeries,
            backgroundColor: `color-mix(in srgb, ${hard} 85%, transparent)`,
            hoverBackgroundColor: hard,
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.4,
            categoryPercentage: 0.8,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeOutQuart' },
        animations: {
          x: { duration: 0 },
          y: { from: (ctx) => ctx.chart.scales.y.getPixelForValue(min), duration: 800, easing: 'easeOutQuart' },
          height: { from: 0, duration: 800, easing: 'easeOutQuart' },
        },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${(ctx.parsed.y as number).toFixed(1)}` } },
        },
        scales: {
          x: { ticks: { color: palette.text, font: { size: 12 } }, grid: { display: false }, border: { display: false } },
          y: { min, max, ticks: { color: palette.text, font: { size: 11 }, stepSize: 0.5 }, grid: { color: palette.grid }, border: { display: false } },
        },
      },
    })
    return () => chartRef.current?.destroy()
  }, [months, softSeries, hardSeries, softLabel, hardLabel, theme])

  return <canvas ref={canvasRef} />
}
