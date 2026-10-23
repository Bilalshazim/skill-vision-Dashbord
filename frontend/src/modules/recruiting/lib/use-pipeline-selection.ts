import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { syncRankingFromBackend } from '@/modules/recruiting/lib/backend-sync'
import { resolvePipelineOpening } from '@/modules/recruiting/lib/pipeline'
import { usePipelineData } from '@/modules/recruiting/lib/use-pipeline-data'

// La posizione che le pagine dell'avanzamento stanno guardando: quella
// dell'indirizzo (?companyId=&openingId=), altrimenti la posizione attiva —
// la stessa logica che PipelinePage aveva da sola (vedi il suo commento
// "SELECTION ARCHITECTURE"), condivisa ora con le pagine di ciascuna fase
// (PipelineSectionPage.tsx). Scegliere una posizione qui non cambia mai la
// posizione attiva.
export function usePipelineSelection() {
  const [searchParams, setSearchParams] = useSearchParams()
  // Bumped after every successful mutation to force usePipelineData() to
  // re-read storage fresh — see that hook's own comment.
  const [refreshKey, setRefreshKey] = useState(0)
  const onMutated = useCallback(() => setRefreshKey((k) => k + 1), [])
  const { state, cards } = usePipelineData(refreshKey)

  // Phase 32 §3/§8 — same backend-primary match-score reconciliation as
  // Ranking/Pagina A/CV & Esportazione.
  useEffect(() => {
    let cancelled = false
    void syncRankingFromBackend().then((result) => {
      if (!cancelled && result.ok && result.updated > 0) onMutated()
    })
    return () => {
      cancelled = true
    }
  }, [onMutated])

  const urlCompanyId = searchParams.get('companyId')
  const urlOpeningId = searchParams.get('openingId')
  const { company, opening } = resolvePipelineOpening(state, urlCompanyId, urlOpeningId)

  // Keeps the URL a canonical reflection of what's actually being shown
  // (first visit, a stale/bad deep link, or an opening that no longer exists
  // all resolve to *something* real).
  useEffect(() => {
    if (!company || !opening) return
    if (urlCompanyId === company.id && urlOpeningId === opening.id) return
    const next = new URLSearchParams(searchParams)
    next.set('companyId', company.id)
    next.set('openingId', opening.id)
    setSearchParams(next, { replace: true })
  }, [company, opening, urlCompanyId, urlOpeningId, searchParams, setSearchParams])

  const select = useCallback(
    (companyId: string, openingId: string) => {
      const next = new URLSearchParams(searchParams)
      next.set('companyId', companyId)
      next.set('openingId', openingId)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  // Da passare ai link verso le altre pagine dell'avanzamento, per restare
  // sulla stessa posizione.
  const query = company && opening ? `?companyId=${encodeURIComponent(company.id)}&openingId=${encodeURIComponent(opening.id)}` : ''

  return { cards, company, opening, onMutated, select, query }
}
