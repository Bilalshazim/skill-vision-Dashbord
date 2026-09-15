import { Navigate, Outlet } from 'react-router-dom'

import { getAccessToken, getBackendUser } from '@/lib/api/client'
import { RecruitingNav } from '@/modules/recruiting/components/RecruitingNav'

// AUTH — this standalone frontend deployment has no legacy shell to
// authenticate against (see LoginPage.tsx), so the guard checks for a real
// backend session instead of the legacy shell's sessionStorage flag: the
// same access token + user record every authenticated API call already
// relies on (lib/api/client.ts), established by LoginPage's direct call to
// the existing backend auth API. A React Router redirect (not a hard
// window.location navigation) so React Router itself handles it — no
// dependency on any /index.html route existing.
//
// Deliberately does NOT call useBackendSession()/ensureBackendSession()
// (lib/api/authBridge.ts): that bridge maps the legacy shell's logged-in
// username to a fixed demo backend account, and falls back to a demo
// RECRUITER account when no shell user is set — which is always true here.
// Calling it after a real login would silently overwrite the just-established
// real session with that demo account's tokens.
function RecruitingAuthGuard({ children }: { children: React.ReactNode }) {
  const authed = Boolean(getAccessToken() && getBackendUser())
  if (!authed) return <Navigate to="/login" replace />
  return <>{children}</>
}

// Module-local shell: RecruitingNav + content. Rendered inside the global
// AppShell's <Outlet/> (Phase 3), so Topbar/global Sidebar/theme are already
// in place around this — this layout only owns the Recruiting-specific
// second-level navigation.
export default function RecruitingLayout() {
  return (
    <RecruitingAuthGuard>
      <div className="flex flex-col gap-6 lg:flex-row">
        <RecruitingNav />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </RecruitingAuthGuard>
  )
}
