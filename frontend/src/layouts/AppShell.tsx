import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'

import { Sidebar, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Topbar } from '@/layouts/Topbar'
import { MODULE_SHELL_VARIANTS, WEB_APP_SLIDE_VARIANTS, isStandaloneApp } from '@/lib/motion'

// Il guscio unico (Fase 4): una barra superiore e una barra laterale, per
// Recruiting e per Assessment. La barra laterale è sempre la stessa
// primitiva; cambia il contenuto, che ogni sezione passa come `sidebar`
// (dentro i propri provider, dove ha i suoi dati). Su mobile la barra
// laterale è un pannello che si apre dal bottone in testa. Il contenuto si
// ferma a `max-w-screen-2xl` (1536px), centrato: su uno schermo largo i
// blocchi non si allungano quanto lo schermo (CLAUDE.md, Fase 6).
//
// Cambiando modulo il contenuto entra con MODULE_SHELL_VARIANTS (installata
// come app: WEB_APP_SLIDE_VARIANTS); barra superiore e barra laterale restano
// ferme, e la pillola del commutatore scorre sulla voce nuova. I due moduli
// sono due layout di rotta, quindi il vecchio si smonta subito: si vede
// l'entrata, non l'uscita.
export function AppShell({ section, sidebarLabel, sidebar, children }: { section: 'recruiting' | 'assessment'; sidebarLabel: string; sidebar: ReactNode; children: ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <div data-slot="app-shell" data-section={section} className="flex min-h-screen flex-col bg-background text-foreground">
          <Topbar menuTrigger={<SidebarTrigger label={`Apri il menu di ${sidebarLabel}`} />} />
          <div className="flex min-h-0 flex-1">
            <Sidebar label={sidebarLabel}>{sidebar}</Sidebar>
            <main className="min-w-0 flex-1 p-4 sm:p-6">
              <AnimatePresence mode="wait">
                <motion.div key={section} variants={isStandaloneApp() ? WEB_APP_SLIDE_VARIANTS : MODULE_SHELL_VARIANTS} initial="initial" animate="animate" exit="exit" className="mx-auto w-full max-w-screen-2xl">
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
