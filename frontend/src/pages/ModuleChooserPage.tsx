import { ArrowRight, BarChart3, Users } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'

import { LoadingState } from '@/components/patterns/LoadingState'
import { PageHeader } from '@/components/patterns/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { TooltipProvider } from '@/components/ui/tooltip'
import { usePurchasedModules } from '@/hooks/use-purchased-modules'
import { Topbar } from '@/layouts/Topbar'
import { AuthGuard } from '@/layouts/AuthGuard'

const MODULES = [
  {
    key: 'RECRUITING' as const,
    letter: 'R',
    name: 'Recruiting',
    to: '/recruiting',
    icon: Users,
    title: 'Cruscotto Recruiting',
    text: 'Gestione dei processi di selezione, candidati e valutazione delle competenze in ingresso.',
    cta: 'Accedi al cruscotto Recruiting',
  },
  {
    key: 'ASSESSMENT' as const,
    letter: 'A',
    name: 'Assessment',
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
// dashboard nuova. L'accesso passa dalla guardia unica (layouts/AuthGuard):
// in modalità `legacy` senza la sessione del guscio si torna al login di
// `/index.html`, che dopo l'accesso rimanda qui.
export default function ModuleChooserPage() {
  return (
    <AuthGuard>
      <ModuleChooser />
    </AuthGuard>
  )
}

function ModuleChooser() {
  const modules = usePurchasedModules()
  const available = modules ? MODULES.filter((m) => modules.includes(m.key)) : []
  if (modules && available.length === 1) return <Navigate to={available[0].to} replace />

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Topbar />
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-6 p-4 sm:p-6">
          <PageHeader level="page" title="Skill Vision" />
          <p className="max-w-prose text-app-section text-foreground">Dai dati sul Capitale Umano alle decisioni che generano valore per l'impresa</p>
          <p className="text-app-small text-muted-foreground">Seleziona il cruscotto di tuo interesse per proseguire</p>
          {!modules ? (
            <LoadingState label="Verifica dei moduli attivi…" />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(available.length ? available : MODULES).map((m) => (
                <Card key={m.key} padding="lg" className="gap-4 border-2 border-border-strong shadow-[0_8px_16px_0_var(--border-strong)] transition-colors hover:border-primary">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-md border-2 border-primary bg-primary font-mono text-app-title text-primary-foreground">
                      {m.letter}
                    </span>
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="label-mono text-muted-foreground">Modulo {m.letter}</span>
                      <span className="flex items-center gap-2 text-app-subtitle text-foreground">
                        <m.icon className="size-4 text-muted-foreground" aria-hidden="true" />
                        {m.name}
                      </span>
                    </div>
                  </div>
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
