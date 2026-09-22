import { useEffect, useRef } from 'react'

import { BRAND_CHART, Chart, ensureChartDefaults } from '@/modules/assessment/lib/brand-chart'

// Migrated from renderCustomerCareOverview()'s Chart.js dual-axis chart
// (js/assessment.js ~7780-7799) — CSAT (line, left axis) + resolved tickets
// (bar, right axis) over 8 weeks, using the same ccChartTheme() palette.
export function CustomerCareTrendChart({ weeks, csatSeries, resolvedSeries, csatLabel, resolvedLabel }: { weeks: string[]; csatSeries: number[]; resolvedSeries: number[]; csatLabel: string; resolvedLabel: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    ensureChartDefaults()
    if (!canvasRef.current) return
    // CSAT trending up is a "good" signal, so it takes the same green used
    // for every other good/attention/critical read in the app instead of
    // the brand lime — charts stay off lime entirely (see brand-chart.ts).
    const cc = {
      accent: BRAND_CHART.success(),
      accentSoft: BRAND_CHART.successSoft,
      neutralBar: 'rgba(171,167,154,0.5)',
      grid: BRAND_CHART.grid,
      muted: BRAND_CHART.text,
      text: BRAND_CHART.strong,
    }
    chartRef.current?.destroy()
    chartRef.current = new Chart(canvasRef.current, {
      data: {
        labels: weeks,
        datasets: [
          { type: 'line', label: csatLabel, data: csatSeries, yAxisID: 'y', borderColor: cc.accent, backgroundColor: cc.accentSoft, pointBackgroundColor: cc.accent, borderWidth: 2, tension: 0.3, fill: true, pointRadius: 3 },
          { type: 'bar', label: resolvedLabel, data: resolvedSeries, yAxisID: 'y1', backgroundColor: cc.neutralBar, borderRadius: 6, maxBarThickness: 34 },
        ],
      },
      options: {
        maintainAspectRatio: false,
        scales: {
          y: { position: 'left', min: 60, max: 100, title: { display: true, text: csatLabel, font: { size: 11 }, color: cc.muted }, ticks: { color: cc.muted }, grid: { color: cc.grid } },
          y1: { position: 'right', beginAtZero: true, title: { display: true, text: resolvedLabel, font: { size: 11 }, color: cc.muted }, ticks: { color: cc.muted }, grid: { display: false } },
          x: { ticks: { color: cc.muted }, grid: { display: false } },
        },
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, color: cc.text } } },
      },
    })
    return () => chartRef.current?.destroy()
  }, [weeks, csatSeries, resolvedSeries, csatLabel, resolvedLabel])

  return <canvas ref={canvasRef} />
}
