import { KeyRound } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'

import { Field } from '@/components/patterns/Field'
import { InlineAlert } from '@/components/patterns/InlineAlert'
import { PasswordInput } from '@/components/patterns/PasswordInput'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PASSWORD_RULE_HINT, passwordProblem } from '@/lib/auth/passwordRules'

// La scelta della propria password, come il LoginForm: password attuale (al
// primo accesso, quella provvisoria ricevuta), la nuova due volte, un bottone.
// Non sa come si salva: riceve `onSubmit` e mostra l'errore che gli torna.
export function NewPasswordForm({
  onSubmit,
  error,
  pending = false,
  header,
  currentLabel = 'Password attuale',
  footer,
}: {
  onSubmit: (currentPassword: string, newPassword: string) => void
  error?: string | null
  pending?: boolean
  header?: ReactNode
  currentLabel?: string
  footer?: ReactNode
}) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [tried, setTried] = useState(false)
  const problems = {
    current: current ? null : 'Scrivi la password attuale.',
    next: passwordProblem(next) ?? (next === current ? 'Deve essere diversa da quella attuale.' : null),
    repeat: repeat === next ? null : 'Le due password non coincidono.',
  }
  const valid = !problems.current && !problems.next && !problems.repeat

  function submit(e: FormEvent) {
    e.preventDefault()
    setTried(true)
    if (valid && !pending) onSubmit(current, next)
  }
  return (
    <Card padding="lg" className="w-full max-w-sm">
      {header ? <div className="mb-6">{header}</div> : null}
      <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
        <Field label={currentLabel} required error={tried ? problems.current : null}>
          <PasswordInput value={current} onChange={setCurrent} autoComplete="current-password" disabled={pending} />
        </Field>
        <Field label="Nuova password" required hint={PASSWORD_RULE_HINT} error={tried ? problems.next : null}>
          <PasswordInput value={next} onChange={setNext} disabled={pending} />
        </Field>
        <Field label="Ripeti la nuova password" required error={tried ? problems.repeat : null}>
          <PasswordInput value={repeat} onChange={setRepeat} disabled={pending} />
        </Field>
        {error ? <InlineAlert tone="destructive">{error}</InlineAlert> : null}
        <Button type="submit" disabled={pending}>
          <KeyRound />
          {pending ? 'Salvataggio…' : 'Salva la password'}
        </Button>
        {footer}
      </form>
    </Card>
  )
}
