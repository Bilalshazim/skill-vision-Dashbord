import { CalendarCheck, CalendarDays } from 'lucide-react'

import { EmptyState } from '@/modules/recruiting/components/EmptyState'
import type { UpcomingRow } from '@/modules/recruiting/lib/use-recruiting-home-data'

// Row layout matches the concept: a calendar-icon square, then name/meta,
// then the date on the far right — used by both the "In arrivo" and
// "Completati" tabs on Home (RecruitingHome.tsx).
export function UpcomingList({ upcoming, emptyText }: { upcoming: UpcomingRow[]; emptyText?: string }) {
  if (!upcoming.length) {
    return <EmptyState icon={CalendarCheck} text={emptyText ?? 'Nessun colloquio programmato al momento.'} />
  }

  return (
    <div>
      {upcoming.map((iv) => (
        <div key={iv.id} className="flex items-center gap-3 border-b border-border py-2.5 last:border-0">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <CalendarDays className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold">{iv.name}</div>
            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{iv.meta}</div>
          </div>
          <div className="shrink-0 font-mono text-[11.5px] text-muted-foreground">{iv.date}</div>
        </div>
      ))}
    </div>
  )
}
