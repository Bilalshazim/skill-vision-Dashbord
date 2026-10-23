import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useActivePosition } from '@/modules/recruiting/lib/active-position'
import { DEFAULT_ROLE } from '@/modules/recruiting/lib/constants'
import { positionCandidateIds } from '@/modules/recruiting/lib/position-funnel'
import { ranking } from '@/modules/recruiting/lib/scoring'
import type { Candidate } from '@/modules/recruiting/lib/types'

export type RankingScope = 'posizione' | 'archivio'

// Di chi è la classifica (CLAUDE.md, Fase 6: la posizione attiva è una sola).
// "Questa posizione" — il default — sono i candidati che la posizione attiva
// conosce (bacino CV, preselezionati, test, colloqui); "Archivio CV" è tutto
// l'archivio, com'era prima. Mai i due mescolati senza dirlo. La classifica si
// calcola sempre sul profilo di riferimento salvato in Profilo Candidato
// (`DEFAULT_ROLE`, oggi uno solo per tutta Recruiting): lo si dice accanto.
// La scelta sta nell'indirizzo (`?ambito=archivio`), non nel browser.
export function useRankingScope(candidates: Candidate[]) {
  const [params, setParams] = useSearchParams()
  const scope: RankingScope = params.get('ambito') === 'archivio' ? 'archivio' : 'posizione'
  const { opening } = useActivePosition()
  const rk = useMemo(() => {
    if (scope === 'archivio') return ranking(candidates)
    const ids = positionCandidateIds(opening)
    return ranking(candidates.filter((c) => ids.has(c.id)))
  }, [scope, candidates, opening])
  function setScope(next: RankingScope) {
    const p = new URLSearchParams(params)
    if (next === 'archivio') p.set('ambito', 'archivio')
    else p.delete('ambito')
    setParams(p, { replace: true })
  }
  const description =
    scope === 'archivio'
      ? `Tutto l'archivio CV · profilo di riferimento: ${DEFAULT_ROLE}`
      : `Candidati della posizione «${opening?.title ?? '—'}» · profilo di riferimento: ${DEFAULT_ROLE}`
  return { scope, setScope, rk, description }
}

export function RankingScopeToggle({ scope, onChange }: { scope: RankingScope; onChange: (s: RankingScope) => void }) {
  return (
    <ToggleGroup type="single" value={scope} onValueChange={(v) => v && onChange(v as RankingScope)} aria-label="Di chi è la classifica">
      <ToggleGroupItem value="posizione">Questa posizione</ToggleGroupItem>
      <ToggleGroupItem value="archivio">Archivio CV</ToggleGroupItem>
    </ToggleGroup>
  )
}
