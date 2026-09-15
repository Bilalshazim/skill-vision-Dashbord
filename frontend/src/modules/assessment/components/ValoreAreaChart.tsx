import ApexCharts from 'apexcharts'
import { useEffect, useRef } from 'react'

import type { Employee } from '@/modules/assessment/lib/types'

type Row = { e: Employee; soft: number; hard: number; combined: number; tier: { key: string; label: string } }

// Reads from the given element, not document.documentElement — same reason
// as StatTile.tsx's cssVar(): Assessment's tokens (--accent/--success/
// --text-1/--text-2/--font) are scoped to .sv-assessment-shell (Phase 24),
// not :root, so a document.documentElement read here would silently miss
// them (empty string -> the hardcoded fallback below, never the real
// theme-correct value).
function cssVar(el: Element, name: string, fallback: string): string {
  const v = getComputedStyle(el).getPropertyValue(name).trim()
  return v || fallback
}

// Replaces the ranked-value Chart.js line (ValoreScatterChart) with an
// ApexCharts area chart, matching the supplied reference's exact visual
// recipe (gradient area, data labels, hidden axes, no grid/toolbar, visible
// legend, 6px stroke) — same real data as before: one point per employee,
// ranked by combined score (same `rows` AssessmentValorePage already builds
// from computeSoftSummary/computeHardSummary), now split into its two real
// series (soft, hard) instead of the old single blended line. Uses the
// `apexcharts` npm package directly (no react-apexcharts wrapper), same
// pattern as StatTile.tsx: create on mount/dep-change, destroy the previous
// instance first, clean up on unmount.
export function ValoreAreaChart({
  rows,
  softSeriesLabel,
  hardSeriesLabel,
  onOpenDrawer,
  theme,
}: {
  rows: Row[]
  softSeriesLabel: string
  hardSeriesLabel: string
  onOpenDrawer: (id: string) => void
  theme: 'light' | 'dark'
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ApexCharts | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const accent = cssVar(el, '--accent', '#B4C614')
    const success = cssVar(el, '--success', '#3FBF7F')
    const textPrimary = cssVar(el, '--text-1', '#111827')
    const textMuted = cssVar(el, '--text-2', '#4B5563')
    const surface = cssVar(el, '--surface', '#FFFFFF')
    const border = cssVar(el, '--border', '#E5E7EB')
    const font = cssVar(el, '--font', "'Gudea', -apple-system, sans-serif")

    chartRef.current?.destroy()
    chartRef.current = new ApexCharts(el, {
      series: [
        { name: softSeriesLabel, data: rows.map((r) => r.soft), color: accent },
        { name: hardSeriesLabel, data: rows.map((r) => r.hard), color: success },
      ],
      chart: {
        height: '100%',
        width: '100%',
        type: 'area',
        fontFamily: font,
        dropShadow: { enabled: false },
        toolbar: { show: false },
        animations: { enabled: true },
        events: {
          // Same click-to-open-drawer interaction the old chart offered.
          // dataPointSelection doesn't fire for area/line series (that event
          // is really for bar/pie-style "selection" interactions) — verified
          // empirically that markerClick is what actually fires here, with
          // the point index needed to resolve back to the employee.
          markerClick: (_event, _ctx, opts) => {
            const index = opts?.dataPointIndex
            const row = index !== undefined ? rows[index] : undefined
            if (row) onOpenDrawer(row.e.id)
          },
        },
      },
      dataLabels: {
        enabled: true,
        style: { colors: [textPrimary], fontSize: '10px', fontWeight: 600 },
        // ApexCharts defaults this box to white, which reads fine in light
        // mode but makes light-on-white-on-white text vanish in dark mode —
        // tying it to the theme's own surface/border keeps it legible both ways.
        background: { enabled: true, foreColor: textPrimary, backgroundColor: surface, borderColor: border, borderWidth: 1, borderRadius: 4, opacity: 0.95 },
      },
      grid: {
        show: false,
        strokeDashArray: 4,
        padding: { left: 16, right: 16, top: -26 },
      },
      tooltip: {
        enabled: true,
        // Unlike the reference (tooltip.x.show:false), the category here is
        // a real employee name — worth keeping visible rather than hiding
        // it purely to mirror the demo.
      },
      legend: {
        show: true,
        labels: { colors: textMuted },
      },
      fill: {
        type: 'gradient',
        gradient: { opacityFrom: 0.55, opacityTo: 0, shade: accent, gradientToColors: [accent, success] },
      },
      stroke: { width: 6, curve: 'smooth' },
      // Area/line series render no real per-point marker by default (just an
      // invisible template used for the hover highlight), so a click has
      // nothing to hit — an explicit size is what makes markerClick actually
      // fire, preserving the old chart's click-to-open-drawer.
      markers: { size: 4, hover: { size: 6 } },
      xaxis: {
        categories: rows.map((r) => `${r.e.nome} ${r.e.cognome}`),
        labels: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { show: false },
    })
    chartRef.current.render()

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
    // `theme` isn't read directly here, but it's what actually changes the
    // computed --accent/--success/--text-* values above — including it
    // forces a rebuild with the new theme's colors instead of a stale chart.
  }, [rows, softSeriesLabel, hardSeriesLabel, onOpenDrawer, theme])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
