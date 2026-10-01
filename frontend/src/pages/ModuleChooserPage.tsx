import { ArrowRight, BarChart3, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { LoadingState } from '@/components/patterns/LoadingState'
import { PageHeader } from '@/components/patterns/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { TooltipProvider } from '@/components/ui/tooltip'
import { usePurchasedModules } from '@/hooks/use-purchased-modules'
import { Topbar } from '@/layouts/Topbar'
import { SHELL_ENTRY_URL, isShellAuthenticated } from '@/modules/assessment/lib/shell-bridge'

const MODULES = [
  {
    key: 'RECRUITING' as const,
    to: '/recruiting',
    icon: Users,
    title: 'Cruscotto Recruiting',
    text: 'Gestione dei processi di selezione, candidati e valutazione delle competenze in ingresso.',
    cta: 'Accedi al cruscotto Recruiting',
  },
  {
    key: 'ASSESSMENT' as const,
    to: '/assessment',
    icon: BarChart3,
    title: 'Cruscotto Assessment',
    text: 'Mappatura delle competenze interne, analisi delle prestazioni e sviluppo organizzativo.',
    cta: 'Accedi al cruscotto Assessment',
  },
]

// La radice `/` (CLAUDE.md, Fasi 4 e 6): la scelta del modulo dopo
// l'accesso, la stessa della landing del guscio legacy (stessi testi), ora in
// React. Con un solo modulo acquistato porta direttamente lì. Nessuna
// dashboard nuova. L'accesso resta quello di oggi: senza la sessione del
// guscio si torna al login legacy (`/index.html`), che dopo l'accesso
// rimanda qui.
export default function ModuleChooserPage() {
  const [authed] = useState(() => isShellAuthenticated())
  const modules = usePurchasedModules()

  useEffect(() => {
    if (!authed) window.location.replace(SHELL_ENTRY_URL)
  }, [authed])
  if (!authed) return null

  const available = modules ? MODULES.filter((m) => modules.includes(m.key)) : []
  if (modules && available.length === 1) return <Navigate to={available[0].to} replace />

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Topbar />
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-6 p-4 sm:p-6">
          <PageHeader level="page" title="Skill Vision" description="Seleziona il cruscotto di tuo interesse per proseguire" />
          {!modules ? (
            <LoadingState label="Verifica dei moduli attivi…" />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(available.length ? available : MODULES).map((m) => (
                <Card key={m.key} padding="lg" className="gap-4">
                  <m.icon className="size-8 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
                  <div className="flex flex-col gap-2">
                    <CardTitle>{m.title}</CardTitle>
                    <CardDescription>{m.text}</CardDescription>
                  </div>
                  <Button asChild className="self-start">
                    <Link to={m.to}>
                      {m.cta}
                      <ArrowRight />
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </TooltipProvider>
  )
}
