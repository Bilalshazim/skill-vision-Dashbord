import { CalendarCheck } from 'lucide-react'

import { EmptyState } from '@/modules/recruiting/components/EmptyState'
import type { UpcomingRow } from '@/modules/recruiting/lib/use-recruiting-home-data'

export function UpcomingList({ upcoming }: { upcoming: UpcomingRow[] }) {
  if (!upcoming.length) {
    return <EmptyState icon={CalendarCheck} text="Nessun colloquio programmato al momento." />
  }

  return (
    <div>
      {upcoming.map((iv) => (
        <div key={iv.id} className="flex gap-3 border-b border-border py-2.5 last:border-0">
          <div className="min-w-[62px] shrink-0 font-mono text-[11.5px] text-muted-foreground">{iv.date}</div>
          <div>
            <div className="text-[13px] font-semibold">{iv.name}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{iv.meta}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
