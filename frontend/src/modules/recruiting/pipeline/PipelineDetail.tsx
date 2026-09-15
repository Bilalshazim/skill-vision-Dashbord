import { FileCheck2, MessageSquare, Search, Trophy } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buildDefaultJobProfile, ensurePipeline, plDateFmt } from '@/modules/recruiting/lib/pipeline'
import type { Company, JobOpening } from '@/modules/recruiting/lib/types'
import { InterviewList } from '@/modules/recruiting/pipeline/InterviewList'
import { PrescreenedList } from '@/modules/recruiting/pipeline/PrescreenedList'
import { TestResultList } from '@/modules/recruiting/pipeline/TestResultList'
import { ClearWinnerButton, WinnerCard } from '@/modules/recruiting/pipeline/WinnerCard'

// Migrated from renderPipelineDetail() (modules/recruiting.html
// ~2019-2156). PHASE 11C-1 wired up the Prescreened CV section (pool/manual
// add, "Segna inviato", "✕" remove); PHASE 11C-2 wired up Ranking post-test
// (+ Aggiungi risultato, "✕"); PHASE 11C-3 wired up Colloqui (+ Aggiungi
// colloquio, scorecard save, "✕"); PHASE 11C-4 wires up Candidato vincitore
// (confirm/clear) — see PrescreenedList.tsx/TestResultList.tsx/
// InterviewList.tsx/WinnerCard.tsx. Still unimplemented: "Segna completato"
// — see lib/pipeline.ts setPrescreenStatus() for exactly why.
export function PipelineDetail({
  company,
  opening,
  onMutated,
}: {
  company: Company
  opening: JobOpening
  /** Called after any successful Prescreened mutation so the page can
   *  re-read storage fresh (see PipelinePage.tsx/use-pipeline-data.ts). */
  onMutated: () => void
}) {
  const p = ensurePipeline(opening)
  const jp = opening.jobProfile || buildDefaultJobProfile(opening.title)
  const skills = jp.criteria?.skills?.join(', ') || '—'
  const experienceYears = jp.criteria?.experienceYears ?? '—'
  const education = jp.criteria?.education || '—'

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6">
        {/* The raw source literal here is "Job Profile" (line ~2098), but
            legacy's applyLanguage('it') — which runs by default, on every
            screen navigation — rewrites that exact stray English string back
            to "Profilo di Lavoro" via IT_EN_PAIRS' reverse map (~1214,
            ~1258-1262). What a default user actually sees is Italian; ported
            verbatim here rather than the pre-translation literal. */}
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{company.name} · Profilo di Lavoro</div>
        <h3 className="text-[17px] font-semibold">{opening.title}</h3>
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          Skill richieste: <b className="font-semibold text-foreground">{skills}</b>
          <br />
          Esperienza target: <b className="font-semibold text-foreground">{experienceYears} anni</b> · Titolo:{' '}
          <b className="font-semibold text-foreground">{education}</b>
        </p>
        {p.winner && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-success/35 bg-success/10 px-4 py-3 text-[13px]">
            <div className="flex items-center gap-2">
              <Trophy className="size-4 shrink-0 text-success" aria-hidden="true" />
              <span>
                <b className="font-semibold">Vincitore: {p.winner.name}</b>{' '}
                <span className="text-muted-foreground">— deciso il {plDateFmt(p.winner.decidedAt)}</span>
              </span>
            </div>
            <ClearWinnerButton companyId={company.id} openingId={opening.id} onMutated={onMutated} />
          </div>
        )}
      </Card>

      <Card className="p-6">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            Pre-screened CV — {p.prescreened.length}
          </CardTitle>
          <p className="mt-0.5 text-[11.5px] font-normal text-muted-foreground">
            Candidati passati al pre-screening, con link al test/assessment automatizzato.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <PrescreenedList
            entries={p.prescreened}
            candidatePool={opening.candidatePool || []}
            companyId={company.id}
            openingId={opening.id}
            onMutated={onMutated}
          />
        </CardContent>
      </Card>

      <Card className="p-6">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <FileCheck2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            Ranking post-test — {p.testResults.length}
          </CardTitle>
          <p className="mt-0.5 text-[11.5px] font-normal text-muted-foreground">
            Punteggi test dei candidati pre-screened, ordinati per ranking.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <TestResultList
            results={p.testResults}
            prescreened={p.prescreened}
            companyId={company.id}
            openingId={opening.id}
            onMutated={onMutated}
          />
        </CardContent>
      </Card>

      <Card className="p-6">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <MessageSquare className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            Colloqui — {p.interviews.length}{' '}
            <span className="font-normal text-muted-foreground">({p.interviews.filter((iv) => iv.completed).length} con scorecard)</span>
          </CardTitle>
          <p className="mt-0.5 text-[11.5px] font-normal text-muted-foreground">Elenco candidati in colloquio, con scorecard post-colloquio.</p>
        </CardHeader>
        <CardContent className="p-0">
          <InterviewList
            interviews={p.interviews}
            testResults={p.testResults}
            companyId={company.id}
            openingId={opening.id}
            onMutated={onMutated}
          />
        </CardContent>
      </Card>

      <Card className="p-6">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <Trophy className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            Candidato vincitore
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <WinnerCard
            winner={p.winner}
            interviews={p.interviews}
            companyId={company.id}
            openingId={opening.id}
            onMutated={onMutated}
          />
        </CardContent>
      </Card>
    </div>
  )
}
