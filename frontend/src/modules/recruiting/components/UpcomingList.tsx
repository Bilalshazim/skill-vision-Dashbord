import { CalendarCheck, CalendarDays } from 'lucide-react'

import { EmptyState } from '@/components/patterns/EmptyState'
import type { UpcomingRow } from '@/modules/recruiting/lib/use-recruiting-home-data'

// Row layout matches the concept: a calendar-icon square, then name/meta,
// then the date on the far right — used by both the "In arrivo" and
// "Completati" tabs on Home (RecruitingHome.tsx).
export function UpcomingList({ upcoming, emptyText }: { upcoming: UpcomingRow[]; emptyText?: string }) {
  if (!upcoming.length) {
    return <EmptyState size="sm" icon={CalendarCheck} description={emptyText ?? 'Nessun colloquio programmato al momento.'} />
  }

  return (
    <div>
      {upcoming.map((iv) => (
        <div key={iv.id} className="flex items-center gap-3 border-b border-border py-2.5 last:border-0">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground dark:text-secondary-foreground">
            <CalendarDays className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-app-small font-semibold">{iv.name}</div>
            <div className="mt-0.5 truncate text-app-caption text-muted-foreground">{iv.meta}</div>
          </div>
          <div className="shrink-0 font-mono text-app-caption text-muted-foreground">{iv.date}</div>
        </div>
      ))}
    </div>
  )
}
