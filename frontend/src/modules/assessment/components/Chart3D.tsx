import { useEffect, useRef } from 'react'

import { renderIsometricBars, renderBarRow, renderCapsuleBars, type IsometricGroup, type BarRowSeries, type CapsuleItem } from '@/modules/assessment/lib/apex-charts-3d'

// Thin React wrappers around apex-charts-3d.ts's render*() functions — each
// mounts a div, re-runs the legacy render function into it whenever inputs
// change (mirrors legacy's own pattern of re-calling renderX() after
// `.innerHTML` is replaced on navigation/data change).
export function IsometricBarsChart({ groups, seriesNames, seriesColors, max, dec }: { groups: IsometricGroup[]; seriesNames?: string[]; seriesColors?: string[]; max?: number; dec?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    renderIsometricBars(ref.current, { groups, seriesNames, seriesColors, max, dec })
  })
  return <div ref={ref} />
}

export function BarRowChart({ series, label, max, unit, dec, target, targetLabel }: { series: BarRowSeries[]; label?: string; max?: number; unit?: string; dec?: number; target?: number; targetLabel?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    renderBarRow(ref.current, { series, label, max, unit, dec, target, targetLabel })
  })
  return <div ref={ref} />
}

export function CapsuleBarsChart({ items, max, unit, dec, pillWidth, gap, height }: { items: CapsuleItem[]; max?: number; unit?: string; dec?: number; pillWidth?: number; gap?: number; height?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    renderCapsuleBars(ref.current, { items, max, unit, dec, pillWidth, gap, height })
  })
  return <div ref={ref} />
}
