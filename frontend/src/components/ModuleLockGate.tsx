import { type FormEvent, type ReactNode, useState } from 'react'
import { Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { companiesApi } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/client'
import type { PlatformModule } from '@/lib/api/types'
import { type EntitlementState, useModuleEntitlement } from '@/lib/entitlements'

const MODULE_LABEL: Record<PlatformModule, string> = { RECRUITING: 'Recruiting', ASSESSMENT: 'Assessment' }

function LockedScreen({ module, companyId, onUnlocked }: { module: PlatformModule; companyId: string; onUnlocked: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await companiesApi.redeemAccessCode(companyId, code.trim())
      onUnlocked()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Codice non valido')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-secondary">
            <Lock className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <CardTitle>Modulo {MODULE_LABEL[module]} non attivo</CardTitle>
          <CardDescription>Questo modulo non è ancora incluso nel tuo piano. Inserisci un codice di attivazione per sbloccarlo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Codice di attivazione"
              required
              className="h-9 rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Verifica…' : 'Sblocca modulo'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Wraps a module's routed content: shows the real page only once the
// backend confirms the company's purchasedModules includes it. The nav
// item that leads here stays visible/clickable either way — locking
// happens inside the route, not by hiding the link (see lib/entitlements.ts).
export function ModuleLockGate({ module, children }: { module: PlatformModule; children: ReactNode }) {
  const entitlement = useModuleEntitlement(module)
  return <ModuleLockGateInner module={module} entitlement={entitlement}>{children}</ModuleLockGateInner>
}

function ModuleLockGateInner({ module, entitlement, children }: { module: PlatformModule; entitlement: EntitlementState; children: ReactNode }) {
  const [forceUnlocked, setForceUnlocked] = useState(false)

  if (forceUnlocked || entitlement.status === 'unlocked') return <>{children}</>
  if (entitlement.status === 'checking') return null
  if (entitlement.status === 'error') {
    return (
      <div className="p-6 text-sm text-destructive" role="alert">
        {entitlement.message}
      </div>
    )
  }
  return <LockedScreen module={module} companyId={entitlement.companyId} onUnlocked={() => setForceUnlocked(true)} />
}
