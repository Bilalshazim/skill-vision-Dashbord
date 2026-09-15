import { useEffect, useRef } from 'react'

import { BRAND_CHART, Chart, ensureChartDefaults } from '@/modules/assessment/lib/brand-chart'
import { fmt1, fmtCurrency } from '@/modules/assessment/lib/legacy-utils'
import type { Employee } from '@/modules/assessment/lib/types'

type Row = { e: Employee; soft: number; hard: number; combined: number; tier: { key: string; label: string } }

// Migrated from renderValore()'s two Chart.js canvases (js/assessment.js
// ~7525-7582): a ranked-value connected line (both modules active, one
// point per employee ordered by combined score, colored by tier, RAL shown
// in the tooltip) or a horizontal tier-distribution bar chart (single
// module active). Uses the real `chart.js` npm package (same major version
// as legacy's CDN Chart.js 4.4.0).
export function ValoreScatterChart({ rows, tierColors, onOpenDrawer, axisHardLabel, axisSoftLabel }: { rows: Row[]; tierColors: Record<string, string>; onOpenDrawer: (id: string) => void; axisHardLabel: string; axisSoftLabel: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    ensureChartDefaults()
    if (!canvasRef.current) return
    // Reads .sv-assessment-shell, not document.documentElement — Assessment's
    // data-theme lives on its own root div (Phase 24 scoping), not <html>, so
    // a documentElement read here always missed it and this chart silently
    // always rendered its light-mode colors.
    const isDark = canvasRef.current.closest('.sv-assessment-shell')?.getAttribute('data-theme') === 'dark'
    const chartMuted = isDark ? '#7C8496' : '#767369'
    const chartGrid = isDark ? 'rgba(231,234,242,0.18)' : 'rgba(43,41,38,0.12)'
    const ringColor = isDark ? '#2B2926' : '#F8F9FA'
    chartRef.current?.destroy()
    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: rows.map((_r, i) => String(i + 1)),
        datasets: [
          {
            data: rows.map((r) => r.combined),
            borderColor: BRAND_CHART.lime(),
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBorderWidth: 2,
            pointBorderColor: ringColor,
            pointBackgroundColor: rows.map((r) => tierColors[r.tier.key]),
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        layout: { padding: { top: 18 } },
        scales: {
          x: { title: { display: true, text: axisHardLabel, font: { size: 11 }, color: chartMuted }, ticks: { color: chartMuted, autoSkip: true, maxTicksLimit: 12, maxRotation: 0 }, grid: { display: false }, border: { color: chartGrid } },
          y: { min: 0, max: 10, title: { display: true, text: axisSoftLabel, font: { size: 11 }, color: chartMuted }, ticks: { color: chartMuted }, grid: { color: chartGrid }, border: { color: chartGrid } },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const r = rows[ctx.dataIndex]
                const p = r.e
                return `${p.nome} ${p.cognome} — ${r.tier.label} · ${fmt1(r.combined)} (A:${fmt1(r.soft)} B:${fmt1(r.hard)})` + (p.ral ? ` · RAL ${fmtCurrency(p.ral)}` : '')
              },
            },
          },
        },
        onClick: (_evt, elements) => {
          if (elements.length) onOpenDrawer(rows[elements[0].index].e.id)
        },
      },
      plugins: [
        {
          id: 'valueLabels',
          afterDatasetsDraw(chart) {
            const meta = chart.getDatasetMeta(0)
            const data = chart.data.datasets[0].data as number[]
            const c = chart.ctx
            c.save()
            c.font = '600 10px Geist, -apple-system, sans-serif'
            c.fillStyle = chartMuted
            c.textAlign = 'center'
            meta.data.forEach((point, i) => {
              c.fillText(fmt1(data[i]), point.x, point.y - 12)
            })
            c.restore()
          },
        },
      ],
    })
    return () => chartRef.current?.destroy()
  }, [rows, tierColors, onOpenDrawer, axisHardLabel, axisSoftLabel])

  return <canvas ref={canvasRef} />
}

export function ValoreTierDistChart({ labels, counts, colors }: { labels: string[]; counts: number[]; colors: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)
  useEffect(() => {
    ensureChartDefaults()
    if (!canvasRef.current) return
    chartRef.current?.destroy()
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: { labels, datasets: [{ data: counts, backgroundColor: colors, borderRadius: 6 }] },
      options: { maintainAspectRatio: false, indexAxis: 'y', scales: { x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: BRAND_CHART.grid } }, y: { grid: { display: false } } }, plugins: { legend: { display: false } } },
    })
    return () => chartRef.current?.destroy()
  }, [labels, counts, colors])
  return <canvas ref={canvasRef} />
}
