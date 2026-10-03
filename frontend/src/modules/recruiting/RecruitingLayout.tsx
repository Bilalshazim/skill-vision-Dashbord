import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { ModuleLockGate } from '@/components/ModuleLockGate'
import { AppShell } from '@/layouts/AppShell'
import { AuthGuard } from '@/layouts/AuthGuard'
import { RecruitingHeader } from '@/modules/recruiting/components/RecruitingHeader'
import { RecruitingNav } from '@/modules/recruiting/components/RecruitingNav'
// Shared shell-session check — same module Assessment already uses (see
// its own AssessmentAuthGuard for the identical pattern). Not module-specific
// despite the import path: it just reads the legacy shell's sessionStorage.
import { BackendStatusBanner } from '@/modules/recruiting/components/BackendStatusBanner'
import { useBackendSession } from '@/lib/api/useBackendSession'

// Recruiting nel guscio unico (Fase 4): AppShell con la barra laterale del
// modulo. `contextVersion` cambia quando si sceglie un'altra società dalla
// barra laterale: la pagina aperta si ridisegna sulla nuova società (le
// pagine leggono il contesto attivo al render, non si abbonano).
export default function RecruitingLayout() {
  // Phase 31 §3 — establishes the backend session for this shell user as
  // soon as Recruiting mounts (see lib/api/authBridge.ts for what "shell
  // session -> backend JWT" actually means here). Non-blocking: the shell
  // auth guard above is still the ONLY thing that gates rendering — a
  // backend outage shows the banner below, it never hides the app.
  const backend = useBackendSession()
  const [contextVersion, setContextVersion] = useState(0)
  return (
    <AuthGuard>
      <AppShell section="recruiting" sidebarLabel="Recruiting" sidebar={<RecruitingNav onCompanyChange={() => setContextVersion((v) => v + 1)} />}>
        <BackendStatusBanner status={backend.status} />
        <ModuleLockGate module="RECRUITING">
          <div className="mb-4">
            <RecruitingHeader key={`h-${contextVersion}`} />
          </div>
          <Outlet key={contextVersion} />
        </ModuleLockGate>
      </AppShell>
    </AuthGuard>
  )
}
