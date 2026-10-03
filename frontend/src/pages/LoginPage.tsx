import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { LoginForm, type LoginFormError } from '@/components/patterns/LoginForm'
import { isBackendAuth } from '@/lib/auth/auth-mode'
import { ensureSession, login, useSession } from '@/lib/auth/session'
import { Logo } from '@/layouts/Logo'
import { SHELL_ENTRY_URL } from '@/modules/assessment/lib/shell-bridge'

// /login (Fase 8, modalità `backend`): l'accesso contro il backend. Dopo
// l'accesso torna alla pagina da cui si veniva (`next`, solo percorsi
// interni) o alla scelta del modulo. In modalità `legacy` il login resta
// quello del guscio (index.html): questa rotta ci rimanda.
export default function LoginPage() {
  if (!isBackendAuth()) return <LegacyRedirect />
  return <BackendLogin />
}

function LegacyRedirect() {
  useEffect(() => {
    window.location.replace(SHELL_ENTRY_URL)
  }, [])
  return null
}

// Solo percorsi interni: `next=https://altro.sito` non porta fuori.
function safeNext(raw: string | null): string {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/'
}

function BackendLogin() {
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const navigate = useNavigate()
  const { status } = useSession()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<LoginFormError | null>(null)

  useEffect(() => {
    if (status === 'unknown') void ensureSession()
  }, [status])
  if (status === 'authenticated' && !pending) return <Navigate to={next} replace />

  async function handleSubmit(email: string, password: string) {
    setPending(true)
    setError(null)
    const res = await login(email, password)
    setPending(false)
    if (res.ok) navigate(next, { replace: true })
    else setError(res.reason === 'locked' ? { kind: 'locked', retryAfterSec: res.retryAfterSec } : { kind: res.reason })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <LoginForm
        onSubmit={handleSubmit}
        error={error}
        pending={pending}
        header={
          <div className="flex flex-col gap-3">
            <Logo size="lg" />
            <p className="text-app-small text-muted-foreground">Accedi con l’account che ti ha dato l’amministratore.</p>
          </div>
        }
      />
    </main>
  )
}
