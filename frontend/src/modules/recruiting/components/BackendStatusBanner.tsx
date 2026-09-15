import { AlertTriangle } from 'lucide-react'

import type { BackendSessionState } from '@/lib/api/useBackendSession'

// Phase 31 §16 — "backend unavailable" must be a real, visible state, never
// a silent fallback to local data with no indication anything's off. Shown
// above every Recruiting screen; says nothing when the backend is reachable
// (status 'connected') or the check hasn't resolved yet ('checking') —
// there is nothing useful to tell the recruiter in either of those cases.
export function BackendStatusBanner({ status }: { status: BackendSessionState['status'] }) {
  if (status !== 'unavailable') return null
  return (
    <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-[12.5px] font-medium text-destructive">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>
        Impossibile collegarsi al server Recruiting — i dati mostrati potrebbero essere locali/non aggiornati e le azioni che richiedono il backend
        (caricamento CV, invio link test, valutatori) non sono disponibili al momento. Riprova più tardi o contatta l&apos;amministratore.
      </span>
    </div>
  )
}
