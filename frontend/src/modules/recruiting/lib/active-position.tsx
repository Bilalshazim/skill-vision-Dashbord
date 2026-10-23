import { createContext, type ReactNode, useCallback, useContext, useMemo } from 'react'

import { getActiveOpening, setActiveContext } from '@/modules/recruiting/lib/pipeline'
import { readCvMatchingState } from '@/modules/recruiting/lib/storage'
import type { Company, JobOpening } from '@/modules/recruiting/lib/types'

// La posizione attiva è una sola in tutta l'applicazione (CLAUDE.md, Fase 6,
// 2026-10-23): la società e la posizione aperta stanno in `activeContext`
// (preferenza dell'utente sul server, lib/storage.ts), e ogni pagina la legge
// da qui. Cambiarla passa da `setPosition`, che salva la scelta e fa
// ridisegnare la pagina aperta e la barra del contesto (`version` del layout).
// Prima le pagine dell'avanzamento tenevano una scelta loro nell'indirizzo,
// separata da quella delle altre pagine: chi navigava confrontava due
// posizioni senza saperlo.
export type ActivePosition = {
  company?: Company
  opening?: JobOpening
  companies: Company[]
  setPosition: (companyId: string, openingId: string) => void
}

const Ctx = createContext<ActivePosition | null>(null)

export function ActivePositionProvider({ version, onChange, children }: { version: string | number; onChange: () => void; children: ReactNode }) {
  const setPosition = useCallback(
    (companyId: string, openingId: string) => {
      setActiveContext(companyId, openingId)
      onChange()
    },
    [onChange],
  )
  const value = useMemo(() => {
    void version // si rilegge lo stato a ogni cambio
    const state = readCvMatchingState()
    const { company, opening } = getActiveOpening(state)
    return { company, opening, companies: state.companies, setPosition }
  }, [version, setPosition])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useActivePosition(): ActivePosition {
  const v = useContext(Ctx)
  if (!v) throw new Error('useActivePosition va usato dentro RecruitingLayout')
  return v
}

/** Lo stato di una posizione a parole: aperta (nessuno in selezione), in selezione, chiusa (scelto il candidato). */
export function openingStatus(opening: JobOpening | undefined): 'aperta' | 'in selezione' | 'chiusa' | null {
  if (!opening) return null
  const p = opening.pipeline
  if (p?.winner) return 'chiusa'
  if (p && (p.prescreened.length || p.testResults.length || p.interviews.length)) return 'in selezione'
  return 'aperta'
}
