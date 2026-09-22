import { Chart } from 'chart.js/auto'

// Ported from BRAND_CHART (js/assessment.js ~2528-2545) — Skill Vision's
// lime-on-Neutral-950 Chart.js palette, registered as Chart.js global
// defaults exactly like legacy does, so every Chart.js instance in
// Assessment (Valore's ranked-value chart, Customer Care's weekly trend)
// inherits the same tick/legend text and gridline colors without repeating
// them per chart config.
// Legacy reads document.documentElement (its own <html>, where applyTheme()
// sets data-theme) — correct there since Assessment owns its whole document.
// React hosts Assessment inside the shared SPA document instead, where
// data-theme is scoped to .sv-assessment-shell (Phase 24), not <html>, so
// the same document.documentElement read here always missed it.
// Exported so a chart that needs one more token than chartPalette() covers
// (e.g. --chart-2, the multi-series categorical hue — see AndamentoChart.tsx)
// can reuse the same .sv-assessment-shell-aware lookup instead of a second
// copy of it.
export function token(el: Element, name: string, fallback: string): string {
  return getComputedStyle(el.closest('.sv-assessment-shell') ?? el).getPropertyValue(name).trim() || fallback
}

export function chartPalette(el: Element) {
  return {
    lime: token(el, '--accent', '#DDEE1C'),
    limeSoft: token(el, '--accent-soft', 'rgba(221,238,28,0.14)'),
    success: token(el, '--success', '#3FBF7F'),
    successSoft: token(el, '--success-soft', 'rgba(63,191,127,0.14)'),
    grid: token(el, '--border', '#E5E7EB'),
    text: token(el, '--text-2', '#4B5563'),
    strong: token(el, '--text-1', '#111827'),
    guide: token(el, '--text-3', '#6B7280'),
  }
}

export function ensureChartDefaults(el: Element) {
  const palette = chartPalette(el)
  Chart.defaults.color = palette.text
  Chart.defaults.borderColor = palette.grid
  Chart.defaults.font.family = "'Gudea', -apple-system, 'Segoe UI', Roboto, sans-serif"
  return palette
}

export { Chart }
