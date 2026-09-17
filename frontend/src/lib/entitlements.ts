// Real, server-enforced module entitlements (Recruiting / Assessment) —
// checked against the backend Company record (see
// backend/src/modules/companies/routes.ts: purchasedModules + POST
// /:id/redeem-access-code), never assumed client-side. A locked module
// still appears in the nav (per the brief: "keep it listed... render a
// locked state") — this hook/gate only controls what renders INSIDE the
// route, not whether the nav link itself is clickable.
import { useEffect, useState } from 'react'

import { companiesApi } from '@/lib/api/endpoints'
import { ApiError, getBackendUser } from '@/lib/api/client'
import type { PlatformModule } from '@/lib/api/types'
import { ensureBackendSession, wasLastBridgeFailureConnectivity } from '@/lib/api/authBridge'

// Dev-only escape hatch: `import.meta.env.DEV` is baked in at build time and
// is always false in a production build, so this can never soften the real,
// backend-enforced paywall in prod — only a local `npm run dev` run where
// the backend/DB isn't up gets the benefit. A genuine auth failure (bad
// credentials, wrong role) still surfaces as an error even in dev; only a
// connectivity failure (backend unreachable, or reachable but 5xx-broken,
// e.g. Postgres down) fails open, so working on Assessment locally never
// requires the backend to be running — it never did before this module
// gained a real entitlement check.
const DEV_FAILS_OPEN = import.meta.env.DEV

export type EntitlementState =
  | { status: 'checking' }
  | { status: 'unlocked' }
  | { status: 'locked'; companyId: string }
  | { status: 'error'; message: string }

export function useModuleEntitlement(module: PlatformModule): EntitlementState {
  const [state, setState] = useState<EntitlementState>({ status: 'checking' })

  useEffect(() => {
    let cancelled = false
    async function check() {
      const bridged = await ensureBackendSession()
      if (!bridged) {
        if (cancelled) return
        if (DEV_FAILS_OPEN && wasLastBridgeFailureConnectivity()) {
          console.warn(`[entitlements] Backend unreachable while checking the "${module}" module — failing OPEN because this is a dev build. This will fail closed in production.`)
          setState({ status: 'unlocked' })
        } else {
          setState({ status: 'error', message: 'Impossibile verificare i moduli attivi — riprova più tardi.' })
        }
        return
      }
      const user = getBackendUser()
      // PLATFORM_ADMIN has no companyId and no per-company entitlement to
      // check against — treated as unlocked everywhere, same exemption
      // requireCompanyScope already gives this role server-side.
      if (user?.role === 'PLATFORM_ADMIN') {
        if (!cancelled) setState({ status: 'unlocked' })
        return
      }
      if (!user?.companyId) {
        if (!cancelled) setState({ status: 'error', message: 'Nessuna azienda associata a questo account.' })
        return
      }
      try {
        const company = await companiesApi.get(user.companyId)
        if (!cancelled) {
          setState(company.purchasedModules.includes(module) ? { status: 'unlocked' } : { status: 'locked', companyId: user.companyId })
        }
      } catch (err) {
        if (cancelled) return
        const isConnectivity = err instanceof ApiError && (err.network || err.status >= 500)
        if (DEV_FAILS_OPEN && isConnectivity) {
          console.warn(`[entitlements] Backend unreachable while fetching the company record for the "${module}" module — failing OPEN because this is a dev build. This will fail closed in production.`)
          setState({ status: 'unlocked' })
        } else {
          setState({ status: 'error', message: err instanceof ApiError ? err.message : 'Errore di connessione' })
        }
      }
    }
    void check()
    return () => {
      cancelled = true
    }
  }, [module])

  return state
}
