import { CloudOff } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { ModuleLockGate } from '@/components/ModuleLockGate'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ErrorBoundary } from '@/components/patterns/ErrorBoundary'
import { InlineAlert } from '@/components/patterns/InlineAlert'
import { LoadingState } from '@/components/patterns/LoadingState'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/layouts/AppShell'
import { AuthGuard } from '@/layouts/AuthGuard'
import { PageTransition } from '@/layouts/PageTransition'
import { useBackendSession } from '@/lib/api/useBackendSession'
import { whenPreferencesLoaded } from '@/lib/preferences'
import { BackendStatusBanner } from '@/modules/recruiting/components/BackendStatusBanner'
import { RecruitingBreadcrumb } from '@/modules/recruiting/components/RecruitingBreadcrumb'
import { RecruitingContextBar } from '@/modules/recruiting/components/RecruitingContextBar'
import { RecruitingNav } from '@/modules/recruiting/components/RecruitingNav'
import { ActivePositionProvider } from '@/modules/recruiting/lib/active-position'
import { preloadRecruitingDemo } from '@/modules/recruiting/lib/demo-data'
import { getActiveOpening } from '@/modules/recruiting/lib/pipeline'
import { loadRecruitingStore, setRecruitingNotice, useRecruitingStore } from '@/modules/recruiting/lib/recruiting-store'
import { applySavedSkillFlags } from '@/modules/recruiting/lib/skill-flags'
import { readCvMatchingState } from '@/modules/recruiting/lib/storage'

// Recruiting nel guscio unico (Fase 4): AppShell con la barra laterale del
// modulo. `contextVersion` cambia quando si sceglie un'altra società (barra
// laterale) o un'altra posizione (barra del contesto, lib/active-position.tsx):
// la pagina aperta si ridisegna sulla nuova posizione (le pagine leggono il
// contesto attivo al render, non si abbonano).
//
// I dati di Recruiting stanno sul server (lib/recruiting-store.ts): le pagine
// si aprono solo quando sono arrivati. Quando un collega li cambia, la pagina
// aperta si ridisegna con i dati nuovi — ma non mentre è aperta una finestra
// di dialogo, per non perdere quello che si sta scrivendo: si aspetta che si
// chiuda.
export default function RecruitingLayout() {
  // Phase 31 §3 — checks the backend session as soon as Recruiting mounts.
  // Non-blocking: the auth guard is the ONLY thing that gates rendering — a
  // backend outage shows the banner below, it never hides the app.
  const backend = useBackendSession()
  const [contextVersion, setContextVersion] = useState(0)
  const store = useRecruitingStore()
  const [shownRemote, setShownRemote] = useState(store.remoteVersion)

  useEffect(() => {
    setRecruitingNotice((msg) => toast.error(msg, { duration: 6000 }))
    void loadRecruitingStore()
  }, [])

  useEffect(() => {
    if (store.remoteVersion === shownRemote) return
    const dialogOpen = () => !!document.querySelector('[role="dialog"], [role="alertdialog"]')
    if (!dialogOpen()) {
      setShownRemote(store.remoteVersion)
      return
    }
    const id = setInterval(() => {
      if (!dialogOpen()) {
        clearInterval(id)
        setShownRemote(store.remoteVersion)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [store.remoteVersion, shownRemote])

  const pageKey = `${contextVersion}-${shownRemote}`
  const bumpContext = useCallback(() => setContextVersion((v) => v + 1), [])

  // I dati dimostrativi si caricano da soli, sulla sola società demo (lib/demo-data.ts); le
  // competenze sono quelle della posizione attiva. Se cambia qualcosa, le pagine si ridisegnano.
  // Si aspettano le preferenze dell'utente: è lì la sua posizione attiva, e prima di averle la
  // scelta sembrerebbe mancare e si salverebbe sopra quella vera.
  useEffect(() => {
    if (store.status !== 'ready') return
    const before = getActiveOpening(readCvMatchingState()).opening?.id
    let cancelled = false
    void whenPreferencesLoaded().then(() => {
      if (cancelled) return
      const preloaded = preloadRecruitingDemo()
      const moved = getActiveOpening(readCvMatchingState()).opening?.id !== before
      if (applySavedSkillFlags() || preloaded || moved) bumpContext()
    })
    return () => {
      cancelled = true
    }
  }, [store.status, store.remoteVersion, bumpContext])

  return (
    <AuthGuard>
      <ActivePositionProvider version={`${pageKey}-${store.status}`} onChange={bumpContext}>
      <AppShell section="recruiting" sidebarLabel="Recruiting" sidebar={<RecruitingNav key={`n-${pageKey}`} />}>
        <BackendStatusBanner status={backend.status} />
        <ModuleLockGate module="RECRUITING">
          {store.status === 'ready' ? (
            <>
              {store.saveProblem ? (
                <InlineAlert tone="warning" className="mb-4">
                  {store.saveProblem}
                </InlineAlert>
              ) : null}
              {/* La posizione attiva sopra ogni pagina, sempre (CLAUDE.md, Fase 6). */}
              <RecruitingBreadcrumb />
              <RecruitingContextBar />
              {/* Società, Campagna e CIP stanno in fondo a Profilo della ricerca
                  (profile-hub/ProfileHubPage.tsx), sotto la scheda della posizione. */}
              <ErrorBoundary>
                <PageTransition refreshKey={pageKey} />
              </ErrorBoundary>
            </>
          ) : store.status === 'error' ? (
            <EmptyState
              icon={CloudOff}
              title="Dati non caricati"
              description={`Il server non ha restituito i dati di Recruiting (${store.loadError ?? 'il server non risponde'}). Controlla la connessione e riprova.`}
              action={
                <Button type="button" variant="outline" onClick={() => void store.retry()}>
                  Riprova
                </Button>
              }
            />
          ) : (
            <LoadingState label="Caricamento dei dati di Recruiting…" rows={6} />
          )}
        </ModuleLockGate>
      </AppShell>
      </ActivePositionProvider>
    </AuthGuard>
  )
}
