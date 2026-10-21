// Phase 31 §3/§16 — reports whether the backend session is open and the
// backend reachable. Screens use `connected` to decide whether to show
// backend-backed data/actions or the "not connected" fallback state (§16) —
// never a false success. La sessione è quella del login React
// (lib/auth/session.ts): nessun ponte, nessuna credenziale nel codice.
import { useEffect, useState } from 'react'

import { ensureSession } from '@/lib/auth/session'

export type BackendSessionState = { status: 'checking' | 'connected' | 'unavailable' }

export function useBackendSession(): BackendSessionState {
  const [state, setState] = useState<BackendSessionState>({ status: 'checking' })

  useEffect(() => {
    let cancelled = false
    ensureSession().then((ok) => {
      if (!cancelled) setState({ status: ok ? 'connected' : 'unavailable' })
    })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
