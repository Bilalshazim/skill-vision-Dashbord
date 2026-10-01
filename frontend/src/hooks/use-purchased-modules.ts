import { useEffect, useState } from 'react'

import { ensureBackendSession, wasLastBridgeFailureConnectivity } from '@/lib/api/authBridge'
import { ApiError, getBackendUser } from '@/lib/api/client'
import { companiesApi } from '@/lib/api/endpoints'
import type { PlatformModule } from '@/lib/api/types'

const ALL: PlatformModule[] = ['RECRUITING', 'ASSESSMENT']

// I moduli acquistati dalla società dell'utente, per decidere se il
// commutatore Recruiting / Assessment compare (solo con tutti e due —
// CLAUDE.md, Fase 4). Stessa fonte e stesse regole di `useModuleEntitlement`
// (lib/entitlements.ts): PLATFORM_ADMIN li ha tutti; in sviluppo, a backend
// irraggiungibile, si apre. Una sola richiesta per caricamento di pagina.
// `null` finché non si sa: il commutatore non compare nell'attesa.
let cached: Promise<PlatformModule[]> | null = null

async function load(): Promise<PlatformModule[]> {
  const bridged = await ensureBackendSession()
  if (!bridged) return import.meta.env.DEV && wasLastBridgeFailureConnectivity() ? ALL : []
  const user = getBackendUser()
  if (user?.role === 'PLATFORM_ADMIN') return ALL
  if (!user?.companyId) return []
  try {
    return (await companiesApi.get(user.companyId)).purchasedModules
  } catch (err) {
    const connectivity = err instanceof ApiError && (err.network || err.status >= 500)
    return import.meta.env.DEV && connectivity ? ALL : []
  }
}

export function usePurchasedModules(): PlatformModule[] | null {
  const [modules, setModules] = useState<PlatformModule[] | null>(null)
  useEffect(() => {
    let cancelled = false
    cached ??= load()
    cached.then((m) => {
      if (!cancelled) setModules(m)
    })
    return () => {
      cancelled = true
    }
  }, [])
  return modules
}
