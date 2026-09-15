import { Outlet } from 'react-router-dom'

import { TooltipProvider } from '@/components/ui/tooltip'
import { Topbar } from '@/layouts/Topbar'

// Global shell: one persistent top bar (logo + Home/Recruiting/Assessment +
// language/theme/logout) above the routed content — no sidebar. Wraps Home
// and Recruiting; Assessment renders the same Topbar itself (see
// AssessmentLayout.tsx) since it deliberately sits outside this element.
export function AppShell() {
  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  )
}
