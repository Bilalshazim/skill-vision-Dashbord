import { useEffect, useRef } from 'react'

import { useTheme } from '@/hooks/use-theme'
import { Chart, ensureChartDefaults, token } from '@/modules/assessment/lib/brand-chart'

// Ported from the client-supplied "Andamento Competenze Team" reference
// (skillvision-chart.html) — a 2-series filled line chart, monthly average
// score for Modulo A (Trasversali/Soft) vs Modulo B (Professionali/Hard).
// Same Chart.js recipe (fill:true, tension 0.4, 4px point radius), but
// ported onto this app's real theming instead of the reference's own
// isDark/gc()/tc() toggle, and off the reference's lime series color for
// Trasversali — charts stay off the brand accent entirely (see
// brand-chart.ts). Both series reuse the exact same colors
// ValoreAreaChart.tsx already assigned this same Trasversali/Professionali
// pairing elsewhere in Assessment (--chart-2 / --success), rather than
// picking a third scheme for the same two quantities.
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
    // Ring color around each point — matches the card's own surface (not
    // the reference's hardcoded '#fff') so the ring reads as a cutout
    // against the card in both themes instead of a fixed white dot.
    const ring = token(el, '--surface', '#FFFFFF')
    const min = Math.floor(Math.min(...softSeries, ...hardSeries) * 2) / 2 - 0.5
    const max = Math.ceil(Math.max(...softSeries, ...hardSeries) * 2) / 2 + 0.5

    chartRef.current?.destroy()
    chartRef.current = new Chart(el, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: softLabel,
            data: softSeries,
            borderColor: soft,
            backgroundColor: `color-mix(in srgb, ${soft} 15%, transparent)`,
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: soft,
            pointBorderColor: ring,
            pointBorderWidth: 2,
            fill: true,
            tension: 0.4,
          },
          {
            label: hardLabel,
            data: hardSeries,
            borderColor: hard,
            backgroundColor: `color-mix(in srgb, ${hard} 12%, transparent)`,
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: hard,
            pointBorderColor: ring,
            pointBorderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
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
