import { ArrowUpRight, CalendarDays, Filter, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

import { CrossModuleBanner } from '@/components/patterns/CrossModuleBanner'
import { PageHeader } from '@/components/patterns/PageHeader'
import { SkillVisionCard } from '@/components/patterns/SkillVisionCard'
import { StatCard } from '@/components/patterns/StatCard'
import { Button } from '@/components/ui/button'
import { usePersistedFlag } from '@/hooks/use-persisted-flag'
import { homeCardLayout } from '@/lib/home-card-layout'
import { InterviewAgendaCard, QualityBucketsCard, SelectionFunnelCard } from '@/modules/recruiting/components/HomeSectionCards'
import { downloadText as downloadFile } from '@/lib/download'
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

// Migrated from modules/recruiting.html #scr-home (renderHomeDashboard()).
// Same KPI values, same quality-distribution buckets/thresholds, same
// open-positions list, same upcoming-interviews list — see
// lib/use-recruiting-home-data.ts for the ported calculation layer and
// lib/storage.ts for the read-only localStorage boundary.
export default function RecruitingHome() {
  const data = useRecruitingHomeData()
  // Aperto/chiuso di ogni finestra, ricordato nel browser come in Assessment;
  // all'inizio sono tutte chiuse (solo il titolo).
  const [openCandidati, setOpenCandidati] = usePersistedFlag('sv-recruiting-home-candidati-view')
  const [openImbuto, setOpenImbuto] = usePersistedFlag('sv-recruiting-home-imbuto-view')
  const [openColloqui, setOpenColloqui] = usePersistedFlag('sv-recruiting-home-colloqui-view')
  const cardLayout = homeCardLayout(
    [
      ['candidati', 'imbuto'],
      ['colloqui'],
    ] as const,
    { candidati: openCandidati, imbuto: openImbuto, colloqui: openColloqui },
  )

  // Cross-module banner stats — all derived from the same real data already
  // computed above, no new sources invented (see CrossModuleBanner.tsx).
  const openOpenings = data.openings.filter((o) => !o.won)
  const urgentOpening = openOpenings.length ? openOpenings.reduce((a, b) => (b.stagePct < a.stagePct ? b : a)) : undefined
  const suitableCount = data.buckets[0].count + data.buckets[1].count
  const suitablePct = data.kpis[0].value ? Math.round((suitableCount / data.kpis[0].value) * 100) : 0
  const closedCount = data.openings.filter((o) => o.won).length

  return (
    <div className="flex flex-col gap-4">
      {/* Intestazione della pagina e, sotto, i tre numeri della panoramica
          come StatCard in griglia (CLAUDE.md, Fase 6: un'intestazione sola,
          niente card a tutta riga per poco contenuto). Le azioni stanno
          nell'intestazione. */}
      <PageHeader
        level="page"
        className="mb-0"
        eyebrow="Skill Vision · Recruiting"
        title="Dalla ricerca alla selezione"
        description="Dalla definizione del profilo alla selezione finale: un unico percorso guidato per trasformare una ricerca aperta nel talento giusto."
        actions={
          <>
            <Button asChild size="sm">
              <Link to="/recruiting/pipeline">Vedi l&apos;avanzamento</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/recruiting/job-profile">Nuova ricerca</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/recruiting/cv">Esporta elenco</Link>
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label={data.kpis[0].label} value={data.kpis[0].value} note={`${data.kpis[1].value} ${data.kpis[1].label.toLowerCase()}`} />
        <StatCard label={data.kpis[2].label} value={data.kpis[2].value} />
        <StatCard label={data.kpis[3].label} value={data.kpis[3].value} />
      </div>

      {/* Le finestre (erano quattro: "Posizioni aperte" è tolta, documento
          del cliente del 2026-10-23), con la stessa struttura della Home di
          Assessment (Fase 3, Roberto Feliciani): ognuna ha titolo, sottotitolo,
          due righe e il pulsante (come in Assessment, ma con l'icona a
          sinistra); "Skill Vision" apre il dettaglio sulla destra, nella stessa
          riga (SkillVisionCard + homeCardLayout, gli stessi pattern). */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        <SkillVisionCard
          icon={Users}
          title="Candidati per fascia di idoneità"
          subtitle="quello che devi sapere"
          lines={[`${data.rankedCount} candidati in classifica`, `Posizione attiva: ${data.roleLabel}`]}
          actions={
            <Button asChild variant="outline" size="sm">
              <Link to="/recruiting/ranking">
                Vedi classifica <ArrowUpRight />
              </Link>
            </Button>
          }
          open={openCandidati}
          onOpenChange={setOpenCandidati}
          style={cardLayout.candidati}
          panel={<QualityBucketsCard data={data} />}
        />

        <SkillVisionCard
          icon={Filter}
          title="Imbuto di Selezione"
          subtitle="dove si fermano i candidati"
          lines={['Dal CV caricato alla selezione finale', 'Quanti candidati superano ogni fase']}
          actions={
            <Button asChild variant="outline" size="sm">
              <Link to="/recruiting/imbuto">
                Vedi l&apos;imbuto <ArrowUpRight />
              </Link>
            </Button>
          }
          open={openImbuto}
          onOpenChange={setOpenImbuto}
          style={cardLayout.imbuto}
          panel={<SelectionFunnelCard data={data} />}
        />

        <SkillVisionCard
          icon={CalendarDays}
          title="Prossimi colloqui"
          subtitle="quello che hai in agenda"
          lines={['I colloqui in arrivo, ordinati per data', 'Quelli già completati']}
          actions={
            <Button asChild variant="outline" size="sm">
              <Link to="/recruiting/colloqui">
                Vedi tutti i colloqui <ArrowUpRight />
              </Link>
            </Button>
          }
          open={openColloqui}
          onOpenChange={setOpenColloqui}
          style={cardLayout.colloqui}
          panel={<InterviewAgendaCard data={data} />}
        />
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
