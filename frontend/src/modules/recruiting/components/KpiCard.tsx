import type { LucideIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'

export function KpiCard({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon
  value: number
  label: string
}) {
  return (
    <Card className="flex-row items-center gap-3 p-6">
      <Icon className="size-6 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div>
        <div className="font-mono text-2xl font-black leading-none tracking-[-.045em] tabular-nums text-foreground">{value}</div>
        {/* Label token: 11px Geist Mono, uppercase, tracking-wider — distinct
            from the metric number's own font-mono treatment above (larger,
            not uppercase) so the two never read as the same visual weight. */}
        <div className="mt-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
    </Card>
  )
}
