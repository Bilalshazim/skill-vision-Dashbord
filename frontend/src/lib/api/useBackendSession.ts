// Phase 31 §3/§16 — establishes the backend session as soon as Recruiting
// mounts, and reports whether the backend is reachable at all. Screens use
// `connected` to decide whether to show backend-backed data/actions or the
// "not connected" fallback state (§16) — never a false success.
import { useEffect, useState } from 'react'

import { ensureBackendSession, registerAuthBridgeRecovery } from '@/lib/api/authBridge'

export type BackendSessionState = { status: 'checking' | 'connected' | 'unavailable' }

export function useBackendSession(): BackendSessionState {
  const [state, setState] = useState<BackendSessionState>({ status: 'checking' })

  useEffect(() => {
    registerAuthBridgeRecovery()
    let cancelled = false
    ensureBackendSession().then((ok) => {
      if (!cancelled) setState({ status: ok ? 'connected' : 'unavailable' })
    })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
