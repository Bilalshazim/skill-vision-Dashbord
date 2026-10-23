import { ArrowUpRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QualityStackedBar } from '@/modules/recruiting/components/QualityStackedBar'
import { SelectionFunnel } from '@/modules/recruiting/components/SelectionFunnel'
import { UpcomingList } from '@/modules/recruiting/components/UpcomingList'
import type { RecruitingHomeData } from '@/modules/recruiting/lib/use-recruiting-home-data'

// I riquadri di "Stato dell'arte" che hanno anche una pagina loro
// nell'indice a quattro livelli (documento del cliente, 2026-10-23):
// Candidati per fascia di idoneità, Imbuto di selezione, Prossimi colloqui.
// Stesso contenuto nei due posti, scritto una volta.

export function QualityBucketsCard({ data }: { data: RecruitingHomeData }) {
  return (
    <Card>
      <CardHeader>
        <p className="text-app-caption text-muted-foreground">
          {data.rankedCount} candidati · posizione attiva: <b className="font-semibold text-foreground">{data.roleLabel}</b>
        </p>
        <Link to="/recruiting/ranking" className="flex shrink-0 items-center gap-1 text-app-caption font-medium text-foreground hover:underline">
          Vedi classifica <ArrowUpRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {data.rankedCount ? (
          <>
            {/* 3 of the 4 real buckets get a KPI tile, matching the
                concept's own choice — "Gap Strutturali" (buckets[2])
                stays bar-only, same as the concept. */}
            <div className="mb-4 grid grid-cols-3 gap-3">
              {[data.buckets[0], data.buckets[1], data.buckets[3]].map((b) => (
                <div key={b.label} className="rounded-lg border border-border bg-secondary/40 p-3">
                  <div className="label-mono text-muted-foreground">{b.label}</div>
                  <div className="mt-1 font-mono text-app-section font-semibold tabular-nums text-foreground">{b.count}</div>
                </div>
              ))}
            </div>
            <QualityStackedBar buckets={data.buckets} total={data.rankedCount} />
          </>
        ) : (
          <p className="py-1 text-app-small text-muted-foreground">Nessun candidato ancora in classifica per questo ruolo. Carica i primi CV dalla pagina CV &amp; Esportazione.</p>
        )}
      </CardContent>
    </Card>
  )
}

export function SelectionFunnelCard({ data }: { data: RecruitingHomeData }) {
  return (
    <Card>
      <CardContent>
        <SelectionFunnel stages={data.funnel} />
      </CardContent>
    </Card>
  )
}

export function InterviewAgendaCard({ data }: { data: RecruitingHomeData }) {
  const [tab, setTab] = useState<'arrivo' | 'completati'>('arrivo')
  return (
    <Card>
      <CardHeader>
        <p className="text-app-caption text-muted-foreground">Ordinati per data</p>
      </CardHeader>
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="w-full">
          <TabsTrigger value="arrivo" className="flex-1">
            In arrivo
          </TabsTrigger>
          <TabsTrigger value="completati" className="flex-1">
            Completati
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <CardContent className="pt-3">
        {tab === 'arrivo' ? <UpcomingList upcoming={data.upcoming} /> : <UpcomingList upcoming={data.completed} emptyText="Nessun colloquio completato ancora." />}
      </CardContent>
    </Card>
  )
}
