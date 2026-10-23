import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useActivePosition } from '@/modules/recruiting/lib/active-position'
import { syncRankingFromBackend } from '@/modules/recruiting/lib/backend-sync'
import { resolvePipelineOpening } from '@/modules/recruiting/lib/pipeline'
import { usePipelineData } from '@/modules/recruiting/lib/use-pipeline-data'

// La posizione che le pagine dell'avanzamento stanno guardando è la posizione
// attiva, la stessa di tutte le altre pagine (lib/active-position.tsx;
// CLAUDE.md, Fase 6, 2026-10-23). Prima queste pagine tenevano una scelta
// loro nell'indirizzo, separata dalla posizione attiva (la regola del vecchio
// Recruiting): era il difetto per cui Classifica e Podio mostravano una
// posizione e Risultati un'altra. Un indirizzo con ?companyId=&openingId=
// (un segnalibro, un link di una versione precedente) diventa la posizione
// attiva all'apertura, poi si toglie dall'indirizzo. Scegliere una posizione
// qui (`select`, le card di Avanzamento) cambia la posizione attiva.
export function usePipelineSelection() {
  const [searchParams, setSearchParams] = useSearchParams()
  // Bumped after every successful mutation to force usePipelineData() to
  // re-read storage fresh — see that hook's own comment.
  const [refreshKey, setRefreshKey] = useState(0)
  const onMutated = useCallback(() => setRefreshKey((k) => k + 1), [])
  const { state, cards } = usePipelineData(refreshKey)
  const { company: activeCompany, opening: activeOpening, setPosition } = useActivePosition()

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
  useEffect(() => {
    if (!urlCompanyId && !urlOpeningId) return
    const { company, opening } = resolvePipelineOpening(state, urlCompanyId, urlOpeningId)
    const next = new URLSearchParams(searchParams)
    next.delete('companyId')
    next.delete('openingId')
    setSearchParams(next, { replace: true })
    if (company && opening && (company.id !== activeCompany?.id || opening.id !== activeOpening?.id)) setPosition(company.id, opening.id)
  }, [urlCompanyId, urlOpeningId, state, searchParams, setSearchParams, activeCompany?.id, activeOpening?.id, setPosition])

  // Gli oggetti freschi dei dati letti qui (dopo ogni modifica), sulla posizione attiva.
  const { company, opening } = resolvePipelineOpening(state, activeCompany?.id ?? null, activeOpening?.id ?? null)

  const select = useCallback((companyId: string, openingId: string) => setPosition(companyId, openingId), [setPosition])

  // Resta per i link fra le pagine dell'avanzamento: vuoto, perché la
  // posizione è già quella attiva.
  const query = ''

  return { cards, company, opening, onMutated, select, query }
}
