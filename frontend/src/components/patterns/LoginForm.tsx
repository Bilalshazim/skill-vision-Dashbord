import { LogIn } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'

import { Field } from '@/components/patterns/Field'
import { InlineAlert } from '@/components/patterns/InlineAlert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export type LoginFormError = { kind: 'invalid' } | { kind: 'locked'; retryAfterSec: number } | { kind: 'network' }

// Il modulo di accesso (Fase 8): email, password, un bottone. Non sa come si
// fa il login: riceve `onSubmit` e mostra l'errore che gli torna. Gli errori
// dicono cosa è successo e cosa fare, senza dire se l'email esiste.
export function LoginForm({
  onSubmit,
  error,
  pending = false,
  header,
}: {
  onSubmit: (email: string, password: string) => void
  error?: LoginFormError | null
  pending?: boolean
  header?: ReactNode
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  function submit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password || pending) return
    onSubmit(email.trim(), password)
  }
  return (
    <Card padding="lg" className="w-full max-w-sm">
      {header ? <div className="mb-6">{header}</div> : null}
      <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
        <Field label="Email" required>
          <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} disabled={pending} required />
        </Field>
        <Field label="Password" required>
          <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={pending} required />
        </Field>
        {error ? <InlineAlert tone="destructive">{errorText(error)}</InlineAlert> : null}
        <Button type="submit" disabled={pending || !email.trim() || !password}>
          <LogIn />
          {pending ? 'Accesso in corso…' : 'Accedi'}
        </Button>
      </form>
    </Card>
  )
}

function errorText(error: LoginFormError): string {
  if (error.kind === 'invalid') return 'Email o password non corrette. Controlla e riprova.'
  if (error.kind === 'locked') {
    const min = Math.max(1, Math.ceil(error.retryAfterSec / 60))
    return `Troppi tentativi non riusciti. Riprova fra ${min} ${min === 1 ? 'minuto' : 'minuti'}.`
  }
  return 'Il server non risponde. Riprova fra poco; se continua, contatta l’amministratore.'
}
