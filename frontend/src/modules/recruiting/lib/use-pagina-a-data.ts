import { useMemo } from 'react'

import { getActiveOpening } from '@/modules/recruiting/lib/pipeline'
import { pendingCandidates } from '@/modules/recruiting/lib/scoring'
import { readCandidates, readCvMatchingState } from '@/modules/recruiting/lib/storage'
import type { Candidate, Company, JobOpening } from '@/modules/recruiting/lib/types'

export type PaginaAData = {
  pending: Candidate[]
  company?: Company
  opening?: JobOpening
}

// Faithful port of renderPaginaA()'s data pass (modules/recruiting.html
// ~2241-2257): the pending-candidate list (pendingCandidates() — shared
// with Home's KPI, not duplicated) plus the currently active company/
// opening (getActiveContext(), ~2251 — reproduced here via the exact same
// getActiveOpening() fallback cascade CvMatchDialog already uses, see
// lib/pipeline.ts). Pagina A intentionally reads global activeContext, NOT
// a Pipeline-style local selector — see pagina-a/PaginaAPage.tsx for why.
//
// `refreshKey` forces a fresh re-read after a mutation (email edit, bulk
// send) succeeds — same "fresh read after every mutation" discipline as
// usePipelineData().
export function usePaginaAData(refreshKey: number = 0): PaginaAData {
  return useMemo(() => {
    // Deliberately unread — its only job is forcing this memo to
    // recompute when it changes; see the comment above.
    void refreshKey
    const candidates = readCandidates()
    const pending = pendingCandidates(candidates)
    const { company, opening } = getActiveOpening(readCvMatchingState())
    return { pending, company, opening }
  }, [refreshKey])
}
