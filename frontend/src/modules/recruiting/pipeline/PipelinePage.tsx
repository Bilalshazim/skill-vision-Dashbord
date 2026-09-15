import { Workflow } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { resolvePipelineOpening } from '@/modules/recruiting/lib/pipeline'
import { syncRankingFromBackend } from '@/modules/recruiting/lib/backend-sync'
import { usePipelineData } from '@/modules/recruiting/lib/use-pipeline-data'
import { PipelineDashboard } from '@/modules/recruiting/pipeline/PipelineDashboard'
import { PipelineDetail } from '@/modules/recruiting/pipeline/PipelineDetail'

// Migrated from modules/recruiting.html #scr-pipeline (renderPipelineScreen()
// = renderPipelineDashboard() + renderPipelineDetail(), ~1975-2156).
// PHASE 11B built this as read-only. PHASE 11C-1 wired up the Prescreened
// CV section's four actions (+ Dal pool CV, + Aggiungi manual, Segna
// inviato, remove) — see pipeline/PrescreenedList.tsx. PHASE 11C-2 wired up
// Ranking post-test (+ Aggiungi risultato, remove) — see
// pipeline/TestResultList.tsx. PHASE 11C-3 wired up Colloqui (+ Aggiungi
// colloquio, scorecard save, remove) — see pipeline/InterviewList.tsx.
// PHASE 11C-4 wires up Candidato vincitore (confirm/clear) — see
// pipeline/WinnerCard.tsx. The only thing still not implemented is
// "completato" — see lib/pipeline.ts setPrescreenStatus() for exactly why
// (permanently deferred pending the Phase 10 Assessment architecture
// decision, not a migration-order gap).
//
// SELECTION ARCHITECTURE — the one thing this phase had to get right before
// any future write phase can build on it: legacy keeps the Pipeline
// screen's selected company/opening in its own module-level `pipelineState`
// variable (modules/recruiting.html ~1934, ~1959-1974), completely
// independent of the CV & Export/Ranking screens' `activeContext`
// (~1930-1933's own comment explains why — switching which opening you're
// *inspecting* in Pipeline must never change what CV uploads route to
// elsewhere). `activeContext` is consulted ONLY as a one-time fallback, the
// very first time a company/opening resolves with nothing else selected.
//
// This page reproduces that with the URL's own search params
// (?companyId=&openingId=) as the Pipeline-local selection store, instead
// of a module-level variable (React has no equivalent that would survive
// this component unmounting/remounting the way a legacy module global
// survives an entire tab's lifetime) or component state (which Step 11 of
// this phase's spec ruled out — it doesn't survive a refresh, and the spec
// explicitly asks for refresh-stable deep links). The URL is never written
// to CV_MATCHING_STATE or any localStorage key — it is exactly as
// "not persisted" as legacy's own in-memory pipelineState, just persisted
// across reloads the way a URL naturally is, which legacy's variable is not
// (a hard reload of the legacy app also loses pipelineState, falling back
// to activeContext again — the closest thing to a strict superset of that
// behavior here is that a *specific* deep link survives reload, while
// visiting with no params at all still falls back exactly like legacy).
export default function PipelinePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  // Bumped after every successful Prescreened mutation (PrescreenedList's
  // onMutated) to force usePipelineData() to re-read storage fresh — see
  // that hook's own comment for why this beats hand-patching local state.
  const [refreshKey, setRefreshKey] = useState(0)
  const handleMutated = useCallback(() => setRefreshKey((k) => k + 1), [])
  const { state, cards } = usePipelineData(refreshKey)

  // Phase 32 §3/§8 — same backend-primary match-score reconciliation as
  // Ranking/Pagina A/CV & Esportazione, so "CV Elaborati"'s candidate pool
  // here reflects backend-verified data too.
  useEffect(() => {
    let cancelled = false
    void syncRankingFromBackend().then((result) => {
      if (!cancelled && result.ok && result.updated > 0) handleMutated()
    })
    return () => {
      cancelled = true
    }
  }, [handleMutated])

  const urlCompanyId = searchParams.get('companyId')
  const urlOpeningId = searchParams.get('openingId')
  const { company, opening } = resolvePipelineOpening(state, urlCompanyId, urlOpeningId)

  // Mirrors getPipelineOpening()'s self-assignment back into pipelineState
  // once resolved (line ~1965) — keeps the URL a canonical reflection of
  // what's actually being shown (first visit, a stale/bad deep link, or an
  // opening that no longer exists all resolve to *something* real; this
  // syncs the address bar to match rather than silently showing content the
  // URL doesn't describe).
  useEffect(() => {
    if (!company || !opening) return
    if (urlCompanyId === company.id && urlOpeningId === opening.id) return
    const next = new URLSearchParams(searchParams)
    next.set('companyId', company.id)
    next.set('openingId', opening.id)
    setSearchParams(next, { replace: true })
  }, [company, opening, urlCompanyId, urlOpeningId, searchParams, setSearchParams])

  function handleSelect(companyId: string, openingId: string) {
    const next = new URLSearchParams(searchParams)
    next.set('companyId', companyId)
    next.set('openingId', openingId)
    setSearchParams(next, { replace: true })
  }

  const selectedKey = company && opening ? `${company.id}:${opening.id}` : ''

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary">
          <Workflow className="size-[22px] text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Pipeline di selezione</h2>
          <p className="text-[13px] text-muted-foreground">
            Stato di avanzamento e tracciamento per ogni posizione aperta — pre-screening, test, colloqui, vincitore.
          </p>
        </div>
      </div>

      <p className="rounded-md border border-border bg-secondary px-3 py-2 text-[12px] text-muted-foreground">
        "Segna completato" resta disponibile solo nell'app corrente.
      </p>

      <PipelineDashboard cards={cards} selectedKey={selectedKey} onSelect={handleSelect} />

      {company && opening && <PipelineDetail company={company} opening={opening} onMutated={handleMutated} />}
    </div>
  )
}
