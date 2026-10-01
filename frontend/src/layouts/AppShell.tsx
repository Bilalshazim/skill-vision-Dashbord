import type { ReactNode } from 'react'

import { Sidebar, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Topbar } from '@/layouts/Topbar'

// Il guscio unico (Fase 4): una barra superiore e una barra laterale, per
// Recruiting e per Assessment. La barra laterale è sempre la stessa
// primitiva; cambia il contenuto, che ogni sezione passa come `sidebar`
// (dentro i propri provider, dove ha i suoi dati). Su mobile la barra
// laterale è un pannello che si apre dal bottone in testa.
export function AppShell({ section, sidebarLabel, sidebar, children }: { section: 'recruiting' | 'assessment'; sidebarLabel: string; sidebar: ReactNode; children: ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <div data-slot="app-shell" data-section={section} className="flex min-h-screen flex-col bg-background text-foreground">
          <Topbar menuTrigger={<SidebarTrigger label={`Apri il menu di ${sidebarLabel}`} />} />
          <div className="flex min-h-0 flex-1">
            <Sidebar label={sidebarLabel}>{sidebar}</Sidebar>
            <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
