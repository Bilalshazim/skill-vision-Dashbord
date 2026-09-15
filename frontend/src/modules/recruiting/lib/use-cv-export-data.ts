import { useMemo } from 'react'

import { getActiveOpening } from '@/modules/recruiting/lib/pipeline'
import { readCandidates, readCvMatchingState } from '@/modules/recruiting/lib/storage'
import type { Candidate, Company, JobOpening } from '@/modules/recruiting/lib/types'

export type CvExportData = {
  companies: Company[]
  company?: Company
  opening?: JobOpening
  candidates: Candidate[]
}

// Faithful port of CV & Export's data needs: renderCvContextSelectors()'s
// company/opening list + the resolved active one (modules/recruiting.html
// ~1781-1801, via getActiveContext()) and CANDIDATES for the "CV caricati"
// list (renderUploadedCVs(), ~4279-4301). `refreshKey` forces a fresh
// re-read after a mutation (context change, upload) — same convention as
// every other Recruiting data hook.
export function useCvExportData(refreshKey: number = 0): CvExportData {
  return useMemo(() => {
    void refreshKey
    const state = readCvMatchingState()
    const { company, opening } = getActiveOpening(state)
    const candidates = readCandidates()
    return { companies: state.companies, company, opening, candidates }
  }, [refreshKey])
}
