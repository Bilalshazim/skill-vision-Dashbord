import { useEffect, useRef } from 'react'

import { useTheme } from '@/hooks/use-theme'
import { Chart, ensureChartDefaults, token } from '@/modules/assessment/lib/brand-chart'

// Same recipe as AndamentoChart.tsx (fill:true, tension 0.4, 4px points,
// --chart-2 so no lime touches a chart), but one series instead of two —
// the org-wide average against the fixed benchmark, drawn as a dashed
// target line (same technique as GroupedBarsChart.tsx's targetLine plugin)
// rather than a second dataset, since the benchmark is a constant, not a
// second real series.
export function OrgScoreTrendChart({ months, series, benchmark }: { months: string[]; series: number[]; benchmark: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!canvasRef.current || !series.length) return
    const el = canvasRef.current
    const palette = ensureChartDefaults(el)
    const color = token(el, '--chart-2', '#5B7FA6')
    const ring = token(el, '--surface', '#FFFFFF')
    const min = Math.floor(Math.min(...series, benchmark) * 2) / 2 - 0.5
    const max = Math.ceil(Math.max(...series, benchmark) * 2) / 2 + 0.5

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
          },
        },
      ],
    })
    return () => chartRef.current?.destroy()
  }, [months, series, benchmark, theme])

  return <canvas ref={canvasRef} />
}
