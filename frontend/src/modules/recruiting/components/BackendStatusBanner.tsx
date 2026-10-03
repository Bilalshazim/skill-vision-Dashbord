import { InlineAlert } from '@/components/patterns/InlineAlert'
import type { BackendSessionState } from '@/lib/api/useBackendSession'

// Phase 31 §16 — "backend unavailable" must be a real, visible state, never
// a silent fallback to local data with no indication anything's off. Shown
// above every Recruiting screen; says nothing when the backend is reachable
// (status 'connected') or the check hasn't resolved yet ('checking') —
// there is nothing useful to tell the recruiter in either of those cases.
export function BackendStatusBanner({ status }: { status: BackendSessionState['status'] }) {
  if (status !== 'unavailable') return null
  return (
    <InlineAlert className="mb-4">
      Il server di Recruiting non risponde. I dati mostrati potrebbero non essere aggiornati, e caricamento dei CV, invio del link test e
      valutatori tornano disponibili quando la connessione riprende. Riprova più tardi o contatta l&apos;amministratore.
    </InlineAlert>
  )
}
