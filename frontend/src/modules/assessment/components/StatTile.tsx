import ApexCharts from 'apexcharts'
import { useEffect, useRef } from 'react'

import { useTheme } from '@/hooks/use-theme'
import { fmt1, round1 } from '@/modules/assessment/lib/legacy-utils'

// Reads from the given element, NOT document.documentElement — Assessment's
// --success/--warning/--danger tokens are scoped to .sv-assessment-shell
// (Phase 24 scoping), not :root, so a document.documentElement read here
// silently returned '' (no --danger at :root) or Recruiting's own
// differently-toned global --success/--warning (src/index.css) instead of
// Assessment's, making every sparkline bar's color wrong (empty --danger
// fell back to the hardcoded lime placeholder below).
function cssVar(el: Element, name: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim()
}

// Ported from statTileHtml()/renderStatTileChart() (js/assessment.js
// ~4305-4324, ~2554-2568) — a compact value/label/trend tile with a mini
// ApexCharts sparkline bar (green/amber/red vs benchmark), used throughout
// Soft/Hard/Employee-drawer screens. Uses the real `apexcharts` npm package
// (same library legacy loads from a CDN) so the sparkline's look, color
// logic, and render animation match exactly, instead of a CSS-only
// approximation.
export function StatTile({ label, value, benchmark, max = 10, children }: { label: string; value: number; benchmark: number; max?: number; children?: React.ReactNode }) {
  const chartRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const delta = round1(value - benchmark)
  const up = delta >= 0

  useEffect(() => {
    if (!chartRef.current) return
    const el = chartRef.current
    const color = value >= benchmark ? cssVar(el, '--success') : value >= benchmark - 1 ? cssVar(el, '--warning') : cssVar(el, '--danger')
    const chart = new ApexCharts(chartRef.current, {
      chart: { type: 'bar', height: 24, sparkline: { enabled: true }, animations: { enabled: true, easing: 'easeout', speed: 650 } },
      series: [{ data: [value] }],
      plotOptions: { bar: { horizontal: true, barHeight: '62%', borderRadius: 3 } },
      // Neutral fallback for the (in practice unreachable) case of an empty
      // CSS var read — was the lime brand hex, which has no place in a
      // green/amber/red severity sparkline.
      colors: [color || '#767369'],
      xaxis: { max },
      tooltip: { enabled: false },
    })
    chart.render()
    return () => {
      chart.destroy()
    }
  }, [value, benchmark, max, theme])

  return (
    <div className="stat-card compact">
      <div className="stat-head">
        <div>
          <h5 className="stat-value">{fmt1(value)}</h5>
          <p className="stat-label">{label}</p>
        </div>
        <div className={`stat-trend ${up ? 'up' : 'down'}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 6v13m0-13 4 4m-4-4-4 4" />
          </svg>
          {up ? '+' : ''}
          {fmt1(delta)}
        </div>
      </div>
      <div ref={chartRef} className="stat-mini-chart" />
      {children}
    </div>
  )
}
