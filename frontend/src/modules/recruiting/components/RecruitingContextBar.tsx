import { useLocation } from 'react-router-dom'

import { ContextBar } from '@/components/patterns/ContextBar'
import { useActivePosition } from '@/modules/recruiting/lib/active-position'

/** L'unica pagina dove si cambiano società e posizione attiva (CLAUDE.md, Fase 6). */
export const PROFILE_PATH = '/recruiting/profile'

// La posizione attiva sopra ogni pagina di Recruiting (CLAUDE.md, Fase 6): lo
// stesso stato che leggono tutte le pagine (lib/active-position.tsx), come
// sovratitolo di sola lettura, "ACME CORP · SENIOR FRONTEND ENGINEER", senza
// campi. Si cambia solo nel Profilo della ricerca, nella barra Società ·
// Campagna · CIP in cima alla pagina (RecruitingHeader, tavola «Recruiting ·
// 1 Home»): lì questa barra non compare.
export function RecruitingContextBar() {
  const { pathname } = useLocation()
  const { company, opening } = useActivePosition()
  if (pathname === PROFILE_PATH) return null
  return (
    <ContextBar
      variant="inline"
      className="mb-4"
      items={[
        { label: 'Società', value: company?.name ?? '—' },
        { label: 'Posizione attiva', value: opening?.title ?? 'Nessuna posizione aperta' },
      ]}
    />
  )
}
