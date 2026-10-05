import { SearchX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { EmptyState } from '@/components/patterns/EmptyState'
import { LoadingState } from '@/components/patterns/LoadingState'
import { Card } from '@/components/ui/card'
import { Logo } from '@/layouts/Logo'
import { ApiError } from '@/lib/api/client'
import { publicJobPostingsApi } from '@/lib/api/endpoints'
import { JdPreview } from '@/modules/recruiting/job-profile/JdPreview'
import { backendProfileToJdState } from '@/modules/recruiting/lib/backend-sync'
import type { JdState } from '@/modules/recruiting/lib/jd-types'

// La pagina pubblica dell'annuncio (`/jd/<codice>`), quella a cui porta il
// link di pubblicazione di un profilo approvato (Fase 5). Fuori dalla guardia
// d'accesso: chi ha il link legge l'annuncio, e basta — nessun dato di
// candidati, nessuna modifica. Se il profilo non è più approvato il server
// risponde "non trovato" e qui si dice cosa è successo.
export default function JobPostingPublicPage() {
  const { token = '' } = useParams()
  const [state, setState] = useState<{ status: 'loading' } | { status: 'ready'; jd: JdState } | { status: 'missing' } | { status: 'error' }>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    publicJobPostingsApi
      .get(token)
      .then((p) => {
        if (cancelled) return
        const jd = backendProfileToJdState(p as Parameters<typeof backendProfileToJdState>[0])
        setState(jd ? { status: 'ready', jd } : { status: 'missing' })
      })
      .catch((err) => {
        if (!cancelled) setState(err instanceof ApiError && err.status === 404 ? { status: 'missing' } : { status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-16 shrink-0 items-center border-b border-border bg-card px-4 sm:px-6">
        <Logo />
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 p-4 sm:p-6">
        {state.status === 'loading' ? (
          <LoadingState label="Caricamento dell'annuncio…" />
        ) : state.status === 'ready' ? (
          <Card padding="lg">
            <JdPreview jd={state.jd} eyebrow="Annuncio di lavoro" />
          </Card>
        ) : (
          <Card>
            <EmptyState
              size="sm"
              icon={SearchX}
              description={state.status === 'missing' ? 'Questo annuncio non è disponibile: il link non è corretto oppure l’annuncio è stato ritirato.' : 'Non riesco a caricare l’annuncio. Riprova fra qualche istante.'}
            />
          </Card>
        )}
      </main>
    </div>
  )
}
