import { useEffect, useRef, useState } from 'react'
import { Area, AreaChart, CartesianGrid, Label, ReferenceLine, XAxis, YAxis } from 'recharts'

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { useTheme } from '@/hooks/use-theme'
import { fmt1it } from '@/modules/assessment/lib/legacy-utils'

const IT_MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

// "Ultimi 6 mesi" — the concept's own framing (its example spans Apr–Set,
// i.e. the 6 months ending on the current one) — real calendar months
// from today, not a fixed illustrative Gen–Giu range.
export function lastSixMonthLabels(): string[] {
  const now = new Date()
  const labels: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    labels.push(IT_MONTHS[d.getMonth()])
  }
  return labels
}

const chartConfig: ChartConfig = {
  value: { label: 'Punteggio medio' },
}

// Recharts area chart via the shadcn chart primitives already scaffolded in
// components/ui/chart.tsx (ChartContainer/ChartTooltip) but never used
// elsewhere yet — replaces the previous Chart.js canvas version. Gradient
// fill (50% at the top fading to 5%) instead of a flat fill, same 2px
// stroke. The benchmark stays a real target line — Recharts' own
// ReferenceLine draws and labels it natively, no custom canvas plugin
// needed. Assessment's tokens (--chart-2 etc.) are scoped to
// .sv-assessment-shell, not :root, so the stroke/fill color is resolved
// from this component's own DOM node rather than assumed as a literal.
export function OrgScoreTrendChart({
  months,
  series,
  benchmark,
}: {
  months: string[]
  series: number[]
  benchmark: number
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const [color, setColor] = useState('#5B7FA6')

  useEffect(() => {
    if (!wrapRef.current) return
    const v = getComputedStyle(wrapRef.current).getPropertyValue('--chart-2').trim()
    if (v) setColor(v)
  }, [theme])

  const data = months.map((m, i) => ({ month: m, value: series[i] }))
  const min = Math.floor(Math.min(...series, benchmark) * 2) / 2 - 0.5
  const max = Math.ceil(Math.max(...series, benchmark) * 2) / 2 + 0.5
  const gradientId = 'orgTrendFill'

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%' }}>
      <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.5} />
              <stop offset="95%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} stroke="var(--text-3)" />
          <YAxis domain={[min, max]} tickLine={false} axisLine={false} tickMargin={8} fontSize={11} stroke="var(--text-3)" width={40} />
          <ReferenceLine y={benchmark} stroke="var(--text-3)" strokeDasharray="4 4">
            <Label value={`Benchmark ${fmt1it(benchmark)}`} position="insideTopLeft" fill="var(--text-3)" fontSize={11} fontWeight={600} />
          </ReferenceLine>
          <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${fmt1it(Number(value))} / 10`} />} />
          <Area
            dataKey="value"
            type="monotone"
            stroke={color}
            fill={`url(#${gradientId})`}
            fillOpacity={1}
            strokeWidth={2}
            dot={{ r: 4, fill: color, strokeWidth: 2, stroke: 'var(--surface)' }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
