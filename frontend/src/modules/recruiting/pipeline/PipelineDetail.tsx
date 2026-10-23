import { FileCheck2, ListChecks, Medal, MessageSquare, Trophy } from 'lucide-react'

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
//
// Indice a quattro livelli (documento del cliente, 2026-10-23): le quattro
// fasi non stanno più tutte in "Avanzamento della selezione", ognuna ha la
// sua pagina (PipelineSectionPage.tsx). Qui restano il riepilogo della
// posizione e la card di ciascuna fase, con le stesse liste di prima.
type PipelineProps = {
  company: Company
  opening: JobOpening
  /** Called after any successful mutation so the page can re-read storage
   *  fresh (see PipelinePage.tsx/use-pipeline-data.ts). */
  onMutated: () => void
}

export type PipelineSection = 'preselezionati' | 'classifica' | 'colloqui' | 'podio'

// La card del profilo della posizione, con il vincitore e «Annulla decisione».
export function PipelineOpeningSummary({ company, opening, onMutated }: PipelineProps) {
  const p = ensurePipeline(opening)
  const jp = opening.jobProfile || buildDefaultJobProfile(opening.title)
  const skills = jp.criteria?.skills?.join(', ') || '—'
  const experienceYears = jp.criteria?.experienceYears ?? '—'
  const education = jp.criteria?.education || '—'

  return (
    <Card className="max-w-3xl">
      {/* The raw source literal here is "Job Profile" (line ~2098), but
          legacy's applyLanguage('it') — which runs by default, on every
          screen navigation — rewrites that exact stray English string back
          to "Profilo di Lavoro" via IT_EN_PAIRS' reverse map (~1214,
          ~1258-1262). What a default user actually sees is Italian; ported
          verbatim here rather than the pre-translation literal. */}
      <div className="label-mono text-muted-foreground">{company.name} · Profilo di Lavoro</div>
      <h3 className="text-app-section font-semibold">{opening.title}</h3>
      <p className="text-app-small leading-relaxed text-muted-foreground">
        Competenze richieste: <b className="font-semibold text-foreground">{skills}</b>
        <br />
        Esperienza target: <b className="font-semibold text-foreground">{experienceYears} anni</b> · Titolo:{' '}
        <b className="font-semibold text-foreground">{education}</b>
      </p>
      {p.winner && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-success/35 bg-success/10 px-4 py-3 text-app-small">
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
  )
}

// La card di una fase, con la sua lista.
export function PipelineSectionCard({ section, company, opening, onMutated }: PipelineProps & { section: PipelineSection }) {
  const p = ensurePipeline(opening)
  const target = { companyId: company.id, openingId: opening.id, onMutated }

  if (section === 'preselezionati') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <ListChecks className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            CV preselezionati — {p.prescreened.length}
          </CardTitle>
          <p className="mt-0.5 text-app-caption font-normal text-muted-foreground">Candidati passati alla preselezione, con il link al test automatizzato.</p>
        </CardHeader>
        <CardContent>
          <PrescreenedList entries={p.prescreened} candidatePool={opening.candidatePool || []} {...target} />
        </CardContent>
      </Card>
    )
  }

  if (section === 'classifica') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <FileCheck2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            Classifica dopo il test — {p.testResults.length}
          </CardTitle>
          <p className="mt-0.5 text-app-caption font-normal text-muted-foreground">Punteggi del test dei candidati preselezionati, in ordine di classifica.</p>
        </CardHeader>
        <CardContent>
          <TestResultList results={p.testResults} prescreened={p.prescreened} {...target} />
        </CardContent>
      </Card>
    )
  }

  if (section === 'colloqui') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <MessageSquare className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            Colloqui — {p.interviews.length}{' '}
            <span className="font-normal text-muted-foreground">({p.interviews.filter((iv) => iv.completed).length} con scheda)</span>
          </CardTitle>
          <p className="mt-0.5 text-app-caption font-normal text-muted-foreground">Elenco dei candidati in colloquio, con la scheda di valutazione.</p>
        </CardHeader>
        <CardContent>
          <InterviewList interviews={p.interviews} testResults={p.testResults} {...target} />
        </CardContent>
      </Card>
    )
  }

  // Era "Candidato vincitore" (documento del cliente, 2026-10-23).
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Medal className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          Candidati al podio
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <WinnerCard winner={p.winner} interviews={p.interviews} {...target} />
        {p.winner ? (
          <div className="flex justify-end">
            <ClearWinnerButton {...target} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
