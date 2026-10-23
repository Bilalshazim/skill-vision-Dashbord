import { CloudOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { toast } from 'sonner'

import { ModuleLockGate } from '@/components/ModuleLockGate'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ErrorBoundary } from '@/components/patterns/ErrorBoundary'
import { InlineAlert } from '@/components/patterns/InlineAlert'
import { LoadingState } from '@/components/patterns/LoadingState'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/layouts/AppShell'
import { AuthGuard } from '@/layouts/AuthGuard'
import { useBackendSession } from '@/lib/api/useBackendSession'
import { BackendStatusBanner } from '@/modules/recruiting/components/BackendStatusBanner'
import { RecruitingHeader } from '@/modules/recruiting/components/RecruitingHeader'
import { RecruitingNav } from '@/modules/recruiting/components/RecruitingNav'
import { loadRecruitingStore, setRecruitingNotice, useRecruitingStore } from '@/modules/recruiting/lib/recruiting-store'
import { applySavedSkillFlags } from '@/modules/recruiting/lib/skill-flags'

// Recruiting nel guscio unico (Fase 4): AppShell con la barra laterale del
// modulo. `contextVersion` cambia quando si sceglie un'altra società dalla
// barra laterale: la pagina aperta si ridisegna sulla nuova società (le
// pagine leggono il contesto attivo al render, non si abbonano).
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

  // I pesi delle competenze vengono dai dati del server.
  useEffect(() => {
    if (store.status === 'ready') applySavedSkillFlags()
  }, [store.status, store.remoteVersion])

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
  const { pathname } = useLocation()
  const onProfilePage = /^\/recruiting\/profile\/?$/.test(pathname)

  return (
    <AuthGuard>
      <AppShell section="recruiting" sidebarLabel="Recruiting" sidebar={<RecruitingNav key={`n-${pageKey}`} onCompanyChange={() => setContextVersion((v) => v + 1)} />}>
        <BackendStatusBanner status={backend.status} />
        <ModuleLockGate module="RECRUITING">
          {store.status === 'ready' ? (
            <>
              {store.saveProblem ? (
                <InlineAlert tone="warning" className="mb-4">
                  {store.saveProblem}
                </InlineAlert>
              ) : null}
              {/* Società, Campagna e CIP solo su "Profilo della ricerca"
                  (documento del cliente, 2026-10-23): le sotto-pagine no. */}
              {onProfilePage ? (
                <div className="mb-4">
                  <RecruitingHeader key={`h-${pageKey}`} />
                </div>
              ) : null}
              <ErrorBoundary>
                <Outlet key={pageKey} />
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
    </AuthGuard>
  )
}
