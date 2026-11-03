import { useState } from 'react'

import { NewPasswordForm } from '@/components/patterns/NewPasswordForm'
import { Button } from '@/components/ui/button'
import { Logo } from '@/layouts/Logo'
import { logout, setOwnPassword, useSession } from '@/lib/auth/session'

// Primo accesso: chi entra con la password provvisoria data dall'amministratore
// ne sceglie una sua prima di vedere l'applicazione. La mostra AuthGuard al
// posto della pagina chiesta, che si apre appena la password è salvata.
// Il server rifiuta comunque ogni altra chiamata finché non è fatto.
export default function FirstAccessPage() {
  const { user } = useSession()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(current: string, next: string) {
    setPending(true)
    setError(null)
    const res = await setOwnPassword(current, next)
    setPending(false)
    if (!res.ok) setError(res.message)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <NewPasswordForm
        onSubmit={handleSubmit}
        error={error}
        pending={pending}
        currentLabel="Password provvisoria"
        header={
          <div className="flex flex-col gap-3">
            <Logo size="lg" />
            <p className="text-app-section text-foreground">Scegli la tua password</p>
            <p className="text-app-small text-muted-foreground">
              {user?.fullName ? `${user.fullName}, è` : 'È'} il primo accesso: la password che hai ricevuto è provvisoria. Scegline una tua per continuare; la vedi solo tu.
            </p>
          </div>
        }
        footer={
          <Button type="button" variant="ghost" onClick={() => void logout()} disabled={pending}>
            Esci
          </Button>
        }
      />
    </main>
  )
}
