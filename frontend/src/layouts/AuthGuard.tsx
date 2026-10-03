import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { LoadingState } from '@/components/patterns/LoadingState'
import { isBackendAuth } from '@/lib/auth/auth-mode'
import { ensureSession, useSession } from '@/lib/auth/session'
import { SHELL_ENTRY_URL, isShellAuthenticated } from '@/modules/assessment/lib/shell-bridge'

// Fase 8 — una sola guardia per tutte le rotte protette (prima: una per
// Assessment, una per Recruiting, una per la scelta del modulo, uguali).
// Le rotte dei valutatori esterni restano fuori: hanno il loro token.
//  - modalità `legacy`: come prima. Senza la sessione del guscio
//    (sessionStorage.sv_shell_auth) si torna al login di index.html.
//  - modalità `backend`: apre la sessione (token in memoria o rinnovo col
//    cookie httpOnly); senza sessione porta a /login, ricordando la pagina.
export function AuthGuard({ children }: { children: ReactNode }) {
  return isBackendAuth() ? <BackendGuard>{children}</BackendGuard> : <LegacyGuard>{children}</LegacyGuard>
}

function LegacyGuard({ children }: { children: ReactNode }) {
  const [authed] = useState(() => isShellAuthenticated())
  useEffect(() => {
    if (!authed) window.location.replace(SHELL_ENTRY_URL)
  }, [authed])
  return authed ? <>{children}</> : null
}

function BackendGuard({ children }: { children: ReactNode }) {
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
