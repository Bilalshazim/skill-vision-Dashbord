import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { ModuleLockGate } from '@/components/ModuleLockGate'
import { RecruitingHeader } from '@/modules/recruiting/components/RecruitingHeader'
import { RecruitingNav } from '@/modules/recruiting/components/RecruitingNav'
// Shared shell-session check — same module Assessment already uses (see
// its own AssessmentAuthGuard for the identical pattern). Not module-specific
// despite the import path: it just reads the legacy shell's sessionStorage.
import { SHELL_ENTRY_URL, isShellAuthenticated } from '@/modules/assessment/lib/shell-bridge'
import { BackendStatusBanner } from '@/modules/recruiting/components/BackendStatusBanner'
import { useBackendSession } from '@/lib/api/useBackendSession'

// AUTH — index.html's login/landing stays the only entry point. Now that
// the legacy dashboard's "Recruiting" card does a real top-level navigation
// to /recruiting (instead of loading it inside an iframe reachable only
// after already passing the shell's login/landing screens), this route is
// independently reachable by URL and needs its own guard — otherwise
// visiting /recruiting directly would skip the login this app has always
// required. Redirects to the shell instead of rendering anything.
function RecruitingAuthGuard({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null)
  useEffect(() => {
    setAuthed(isShellAuthenticated())
  }, [])
  useEffect(() => {
    if (authed === false) window.location.replace(SHELL_ENTRY_URL)
  }, [authed])
  if (authed !== true) return null
  return <>{children}</>
}

// Module-local shell: RecruitingNav + content. Rendered inside the global
// AppShell's <Outlet/> (Phase 3), so Topbar/global Sidebar/theme are already
// in place around this — this layout only owns the Recruiting-specific
// second-level navigation.
export default function RecruitingLayout() {
  // Phase 31 §3 — establishes the backend session for this shell user as
  // soon as Recruiting mounts (see lib/api/authBridge.ts for what "shell
  // session -> backend JWT" actually means here). Non-blocking: the shell
  // auth guard above is still the ONLY thing that gates rendering — a
  // backend outage shows the banner below, it never hides the app.
  const backend = useBackendSession()
  return (
    <RecruitingAuthGuard>
      <div className="flex flex-col gap-6 lg:flex-row">
        <RecruitingNav />
        <div className="min-w-0 flex-1">
          <BackendStatusBanner status={backend.status} />
          <ModuleLockGate module="RECRUITING">
            <div className="mb-4">
              <RecruitingHeader />
            </div>
            <Outlet />
          </ModuleLockGate>
        </div>
      </div>
    </RecruitingAuthGuard>
  )
}
