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
function isAssessmentDark(): boolean {
  return document.querySelector('.sv-assessment-shell')?.getAttribute('data-theme') === 'dark'
}

export const BRAND_CHART = {
  // Kept for ValoreChart.tsx's unused legacy ValoreScatterChart (superseded
  // by ValoreAreaChart.tsx) — no live chart reads lime data-series color
  // anymore; live charts use `success` (the semantic "good" green) below.
  lime: () => (isAssessmentDark() ? '#DDEE1C' : '#B4C614'),
  limeSoft: 'rgba(221,238,28,0.14)',
  // --success is the same hex in both themes (assessment-scoped.css never
  // overrides it for light mode), so this needs no isAssessmentDark() branch.
  success: () => '#3FBF7F',
  successSoft: 'rgba(63,191,127,0.14)',
  grid: 'rgba(221,238,28,0.1)',
  text: '#ABA79A',
  strong: '#FAF5DF',
  guide: '#8C8779',
}

let configured = false
export function ensureChartDefaults() {
  if (configured) return
  configured = true
  Chart.defaults.color = BRAND_CHART.text
  Chart.defaults.borderColor = BRAND_CHART.grid
  Chart.defaults.font.family = "'Gudea', -apple-system, 'Segoe UI', Roboto, sans-serif"
}

export { Chart }
