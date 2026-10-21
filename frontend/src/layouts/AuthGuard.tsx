import { useEffect, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { LoadingState } from '@/components/patterns/LoadingState'
import { ensureSession, useSession } from '@/lib/auth/session'

// Fase 8 — una sola guardia per tutte le rotte protette. Le rotte dei
// valutatori esterni restano fuori: hanno il loro token. Apre la sessione
// (token in memoria o rinnovo col cookie httpOnly); senza sessione porta a
// /login, ricordando la pagina.
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const location = useLocation()
  useEffect(() => {
    if (status === 'unknown') void ensureSession()
  }, [status])
  if (status === 'unknown') {
    return (
      <div className="mx-auto w-full max-w-md p-6">
        <LoadingState label="Verifica dell'accesso…" rows={2} />
      </div>
    )
  }
  if (status === 'anonymous') {
    const next = location.pathname + location.search
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
  }
  return <>{children}</>
}
