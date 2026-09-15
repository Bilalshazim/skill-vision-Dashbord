import { useMemo } from 'react'

import { ensurePipeline, pipelineStage } from '@/modules/recruiting/lib/pipeline'
import { readCvMatchingState } from '@/modules/recruiting/lib/storage'
import type { CvMatchingState } from '@/modules/recruiting/lib/types'

export type PipelineOpeningCard = {
  companyId: string
  companyName: string
  openingId: string
  openingTitle: string
  stageLabel: string
  stagePct: number
  won: boolean
  prescreenedCount: number
  testResultsCount: number
  interviewsCount: number
}

export type PipelineData = {
  state: CvMatchingState
  cards: PipelineOpeningCard[]
}

// Faithful port of renderPipelineDashboard()'s data pass (modules/
// recruiting.html ~1983-2015). Unlike Home's dashboard (use-recruiting-
// home-data.ts), Pipeline does NOT filter out openings with active===false
// — confirmed by reading renderPipelineDashboard() in full: it iterates
// every company/opening unconditionally. Reproduced exactly, not
// "corrected" into consistency with Home.
//
// Read once per page visit (useMemo) — same convention as RankingPage/
// RecruitingHome: a snapshot for this render, not a live subscription.
// Returns the raw `state` alongside the card list so the page can resolve
// the selected opening's full record from the same snapshot (see
// PipelinePage.tsx) instead of re-reading storage a second time.
//
// PHASE 11C-1: `refreshKey` forces a fresh re-read (new useMemo deps) after
// a Pipeline mutation succeeds — the same "fresh read -> mutate -> write
// whole tree" discipline the mutations themselves follow, extended to the
// display layer: a successful add/status/remove re-reads storage instead of
// hand-patching this hook's cached result, so the dashboard counts, the
// detail sections, and any concurrent change made elsewhere (another tab,
// another part of the app) are all reflected from one real read, not a
// guess. Omit it (or reuse the same value) to get the old single-read
// behavior.
export function usePipelineData(refreshKey: number = 0): PipelineData {
  return useMemo(() => {
    // Deliberately unread — its only job is forcing this memo to
    // recompute when it changes; see the comment above.
    void refreshKey
    const state = readCvMatchingState()
    const cards: PipelineOpeningCard[] = []
    for (const company of state.companies || []) {
      for (const opening of company.jobOpenings || []) {
        const stage = pipelineStage(opening)
        const p = ensurePipeline(opening)
        cards.push({
          companyId: company.id,
          companyName: company.name,
          openingId: opening.id,
          openingTitle: opening.title,
          stageLabel: stage.label,
          stagePct: stage.pct,
          won: !!p.winner,
          prescreenedCount: p.prescreened.length,
          testResultsCount: p.testResults.length,
          interviewsCount: p.interviews.length,
        })
      }
    }
    return { state, cards }
  }, [refreshKey])
}
