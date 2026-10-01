import { ArrowUpRight, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CrossModuleBanner } from '@/components/patterns/CrossModuleBanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OpeningsList } from '@/modules/recruiting/components/OpeningsList'
import { QualityStackedBar } from '@/modules/recruiting/components/QualityStackedBar'
import { SelectionFunnel } from '@/modules/recruiting/components/SelectionFunnel'
import { UpcomingList } from '@/modules/recruiting/components/UpcomingList'
import { downloadFile } from '@/modules/recruiting/lib/download'
import { useRecruitingHomeData, type RecruitingHomeData } from '@/modules/recruiting/lib/use-recruiting-home-data'

const csvEsc = (v: unknown) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`

// Same plain client-side CSV Blob pattern as candidateExport.ts's
// downloadCandidateReport() — a summary across all openings instead of one
// candidate, feeding the cross-module banner's "Report completo" button.
function exportHomeSummary(data: RecruitingHomeData): void {
  const rows: [string, string | number][] = [
    ['Candidati in archivio', data.kpis[0].value],
    ['In attesa di test', data.kpis[1].value],
    ['Posizioni aperte', data.kpis[2].value],
    ['Colloqui programmati', data.kpis[3].value],
  ]
  let csv = '﻿' + rows.map((r) => r.map(csvEsc).join(';')).join('\r\n') + '\r\n\r\nPosizione;Azienda;Fase;Avanzamento %;Assegnata\r\n'
  csv += data.openings.map((o) => [o.openingTitle, o.companyName, o.stageLabel, o.stagePct, o.won ? 'SI' : 'NO'].map(csvEsc).join(';')).join('\r\n')
  downloadFile('report_recruiting.csv', csv, 'text/csv;charset=utf-8;')
}

// Client-requested nav rename: this route (index, now labeled "Inizia" —
// see nav-config.ts) is asked to be "the 'From Search to Talent' landing
// page" (Fase 6: claim inglese e alone tolti, CLAUDE.md §7). The KPI dashboard below is real, working functionality that isn't
// named anywhere else in the client's 10-item index, so rather than discard
// it, this hero is added ON TOP of it — "Inizia" becomes a real landing
// moment for the module without losing the dashboard.
function StartHero() {
  return (
    <div className="rounded-lg border border-border bg-card px-6 py-8 sm:px-8">
      <div className="flex items-center gap-2">
        {/* The official Recruiting module icon — the exact same glyph as
            the legacy landing page's "Cruscotto Recruiting" card and the
            top-bar module switcher (see nav-config.ts). currentColor +
            text-foreground makes it theme-adaptive for free: --foreground
            is a dark near-black in light mode and a light cream in dark
            mode, so this never needs a separate light/dark SVG asset. */}
        <Users className="size-4 shrink-0 text-foreground" aria-hidden="true" />
<p className="label-mono text-muted-foreground">Skill Vision · Recruiting</p>
      </div>
      <h1 className="mt-2 text-app-title font-semibold tracking-tight">Dalla ricerca alla selezione</h1>
      <p className="mt-2 max-w-2xl text-app-small text-muted-foreground">
        Dalla definizione del profilo alla selezione finale: un unico percorso guidato per trasformare una ricerca aperta nel talento giusto.
      </p>
    </div>
  )
}

// Migrated from modules/recruiting.html #scr-home (renderHomeDashboard()).
// Same KPI values, same quality-distribution buckets/thresholds, same
// open-positions list, same upcoming-interviews list — see
// lib/use-recruiting-home-data.ts for the ported calculation layer and
// lib/storage.ts for the read-only localStorage boundary.
export default function RecruitingHome() {
  const data = useRecruitingHomeData()
  const [interviewsTab, setInterviewsTab] = useState<'arrivo' | 'completati'>('arrivo')

  // Cross-module banner stats — all derived from the same real data already
  // computed above, no new sources invented (see CrossModuleBanner.tsx).
  const openOpenings = data.openings.filter((o) => !o.won)
  const urgentOpening = openOpenings.length ? openOpenings.reduce((a, b) => (b.stagePct < a.stagePct ? b : a)) : undefined
  const suitableCount = data.buckets[0].count + data.buckets[1].count
  const suitablePct = data.kpis[0].value ? Math.round((suitableCount / data.kpis[0].value) * 100) : 0
  const closedCount = data.openings.filter((o) => o.won).length

  return (
    <div className="flex flex-col gap-4">
      <StartHero />

      {/* "Il Talento in Pipeline" hero (correction pass matches the
          concept exactly): candidate count as the headline, exactly 2
          mini-stats (Posizioni aperte/Colloqui programmati — "in attesa
          di test" folds into the caption line instead of a 3rd
          mini-stat), plus 3 real actions. The concept's "+7 questa
          settimana" delta chip has no real source anywhere — Candidate
          has no creation timestamp in lib/types.ts — so it's honestly
          omitted rather than fabricated. KpiCard.tsx (now StatCard) was left in place,
          unused. */}
      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="label-mono text-muted-foreground">Panoramica Candidati</div>
            <div className="mt-1 flex items-center gap-3">
              <Users className="size-8 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <div className="font-mono text-app-title font-semibold leading-none tabular-nums text-foreground">{data.kpis[0].value}</div>
                <div className="mt-1 text-app-caption text-muted-foreground">
                  {data.kpis[0].label} · {data.kpis[1].value} {data.kpis[1].label.toLowerCase()}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-6">
            {[data.kpis[2], data.kpis[3]].map((k) => (
              <div key={k.key}>
                <div className="font-mono text-app-section font-semibold tabular-nums text-foreground">{k.value}</div>
                <div className="label-mono mt-1 text-muted-foreground">{k.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/recruiting/pipeline">Vedi Pipeline</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/recruiting/job-profile">Nuova Ricerca</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/recruiting/cv">Esporta Elenco</Link>
          </Button>
        </div>
      </Card>

      {/* 4 direct grid children instead of 2 flex-col column stacks — each
          ROW's height is now independent (Candidati/Imbuto vs Posizioni/
          Prossimi), so a tall card only affects its own row's gap instead
          of the whole column accumulating one large dead zone at the
          bottom before the cross-module banner (the ring chart made that
          column-stack gap severe enough to look broken). Visual position
          is identical to before — grid auto-placement fills row-major,
          same as the two stacks did. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Candidati per fascia di idoneità</CardTitle>
              <p className="mt-0.5 text-app-caption text-muted-foreground">
                {data.rankedCount} candidati · posizione attiva: <b className="font-semibold text-foreground">{data.roleLabel}</b>
              </p>
            </div>
            <Link to="/recruiting/ranking" className="flex shrink-0 items-center gap-1 text-app-caption font-medium text-foreground hover:underline">
              Vedi ranking <ArrowUpRight className="size-3.5" />
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
              <p className="py-1 text-app-small text-muted-foreground">
                Nessun candidato ancora in classifica per questo ruolo. Carica i primi CV dalla pagina CV &amp;
                Export.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imbuto di Selezione</CardTitle>
          </CardHeader>
          <CardContent>
            <SelectionFunnel stages={data.funnel} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Posizioni aperte</CardTitle>
          </CardHeader>
          <CardContent>
            <OpeningsList openings={data.openings} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prossimi colloqui</CardTitle>
            <p className="mt-0.5 text-app-caption text-muted-foreground">Ordinati per data</p>
          </CardHeader>
          <Tabs value={interviewsTab} onValueChange={(v) => setInterviewsTab(v as typeof interviewsTab)}>
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
            {interviewsTab === 'arrivo' ? (
              <UpcomingList upcoming={data.upcoming} />
            ) : (
              <UpcomingList upcoming={data.completed} emptyText="Nessun colloquio completato ancora." />
            )}
            <Link
              to="/recruiting/pipeline"
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-sm border border-border py-2 text-app-small font-semibold text-foreground hover:bg-secondary"
            >
              Vedi tutti i colloqui <ArrowUpRight className="size-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <CrossModuleBanner
        heading="Una sola lettura, mai due sistemi diversi."
        body="Assessment e Recruiting condividono gli stessi indicatori e le stesse priorità: un'unica decisione da prendere, non due strumenti da confrontare."
        ctaLabel="Apri Assessment"
        ctaTo="/assessment"
        secondaryLabel="Report completo"
        onSecondary={() => exportHomeSummary(data)}
        stats={[
          { label: 'POSIZIONE PIÙ URGENTE', value: urgentOpening ? urgentOpening.openingTitle : '—', sub: urgentOpening?.stageLabel },
          { label: 'CANDIDATI IDONEI', value: suitableCount, sub: `${suitablePct}% del bacino` },
          { label: 'COLLOQUI QUESTA SETTIMANA', value: data.interviewsThisWeek.count, sub: `${data.interviewsThisWeek.companies} aziende coinvolte` },
          { label: 'POSIZIONI CHIUSE', value: closedCount, sub: `su ${data.openings.length} posizioni aperte` },
        ]}
      />
    </div>
  )
}
