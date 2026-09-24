import { Briefcase, CalendarClock, Hourglass, Users } from 'lucide-react'

import { CrossModuleBanner } from '@/components/CrossModuleBanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard } from '@/modules/recruiting/components/KpiCard'
import { OpeningsList } from '@/modules/recruiting/components/OpeningsList'
import { QualityChart } from '@/modules/recruiting/components/QualityChart'
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
// page". The KPI dashboard below is real, working functionality that isn't
// named anywhere else in the client's 10-item index, so rather than discard
// it, this hero is added ON TOP of it — "Inizia" becomes a real landing
// moment for the module without losing the dashboard.
function StartHero() {
  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-primary/10 via-card to-card px-6 py-8 sm:px-8 sm:py-10">
      <div className="flex items-center gap-2">
        {/* The official Recruiting module icon — the exact same glyph as
            the legacy landing page's "Cruscotto Recruiting" card and the
            top-bar module switcher (see nav-config.ts). currentColor +
            text-foreground makes it theme-adaptive for free: --foreground
            is a dark near-black in light mode and a light cream in dark
            mode, so this never needs a separate light/dark SVG asset. */}
        <Users className="size-4 shrink-0 text-foreground" aria-hidden="true" />
        {/* text-primary (the lime brand color) reads fine as text in dark
            mode but fails contrast as bare text on the light background —
            index.css's own token comment says as much ("--primary only
            for fills... lime is a fill color, not a body-text color, in
            light mode"). Dark near-black in light mode, lime in dark
            mode, matching every other heading's contrast in light mode. */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground dark:text-primary">Skill Vision · Recruiting</p>
      </div>
      <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">From Search to Talent</h1>
      <p className="mt-2 max-w-2xl text-[13.5px] text-muted-foreground">
        Dalla definizione del profilo alla selezione finale: un unico percorso guidato per trasformare una ricerca aperta nel talento giusto.
      </p>
    </div>
  )
}

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
