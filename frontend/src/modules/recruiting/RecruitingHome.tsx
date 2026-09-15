import { Briefcase, CalendarClock, Hourglass, Users } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard } from '@/modules/recruiting/components/KpiCard'
import { OpeningsList } from '@/modules/recruiting/components/OpeningsList'
import { QualityChart } from '@/modules/recruiting/components/QualityChart'
import { UpcomingList } from '@/modules/recruiting/components/UpcomingList'
import { useRecruitingHomeData } from '@/modules/recruiting/lib/use-recruiting-home-data'

// Same four icons as the legacy KPI row (group/hourglass_top/work/event,
// Material Symbols) — swapped to lucide-react equivalents, same order,
// same meaning.
const KPI_ICONS = [Users, Hourglass, Briefcase, CalendarClock]

// Migrated from modules/recruiting.html #scr-home (renderHomeDashboard()).
// Same KPI values, same quality-distribution buckets/thresholds, same
// open-positions list, same upcoming-interviews list — see
// lib/use-recruiting-home-data.ts for the ported calculation layer and
// lib/storage.ts for the read-only localStorage boundary.
export default function RecruitingHome() {
  const data = useRecruitingHomeData()

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {data.kpis.map((k, i) => (
          <KpiCard key={k.key} icon={KPI_ICONS[i]} value={k.value} label={k.label} />
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-sm">Candidati per fascia di idoneità</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ruolo attivo: <b className="font-semibold text-foreground">{data.roleLabel}</b>
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              {data.rankedCount ? (
                <QualityChart buckets={data.buckets} max={data.rankedCount} />
              ) : (
                <p className="py-1 text-[13px] text-muted-foreground">
                  Nessun candidato ancora in classifica per questo ruolo. Carica i primi CV dalla pagina CV &amp;
                  Export.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-sm">Posizioni aperte</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <OpeningsList openings={data.openings} />
            </CardContent>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-sm">Prossimi colloqui</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <UpcomingList upcoming={data.upcoming} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
