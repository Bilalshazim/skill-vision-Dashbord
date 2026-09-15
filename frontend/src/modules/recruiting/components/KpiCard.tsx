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
    <Card className="flex-row items-center gap-3 px-4 py-4">
      <Icon className="size-6 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div>
        <div className="font-mono text-2xl font-semibold leading-none tabular-nums">{value}</div>
        <div className="mt-1 text-[11.5px] text-muted-foreground">{label}</div>
      </div>
    </Card>
  )
}
