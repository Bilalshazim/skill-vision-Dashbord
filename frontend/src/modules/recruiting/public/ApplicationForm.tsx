import { CheckCircle2, Send } from 'lucide-react'
import { useState } from 'react'

import { Field } from '@/components/patterns/Field'
import { InlineAlert } from '@/components/patterns/InlineAlert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api/client'
import { publicJobPostingsApi } from '@/lib/api/endpoints'

const ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const MAX_BYTES = 10 * 1024 * 1024

// Il modulo di candidatura sotto l'annuncio pubblico (Decisioni del 2026-11-09, Parte C):
// nome, email, telefono facoltativo, il CV (PDF, DOC o DOCX, fino a 10 MB) e il consenso al
// trattamento dei dati. Il CV si conserva 24 mesi; chi vuole sceglie 6 mesi. Il server
// controlla il file (antivirus di base) prima di salvarlo: un file rifiutato non arriva in
// piattaforma. Inviata la candidatura, il modulo lascia il posto alla conferma.
export function ApplicationForm({ token, privacyController, privacyEmail }: { token: string; privacyController: string; privacyEmail: string }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [short, setShort] = useState(false)
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [state, setState] = useState<{ kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string }>({ kind: 'idle' })

  function validate() {
    const e: Record<string, string> = {}
    if (fullName.trim().length < 2) e.fullName = 'Scrivi nome e cognome.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Scrivi un indirizzo email valido.'
    if (!file) e.file = 'Allega il CV.'
    else if (!/\.(pdf|docx?)$/i.test(file.name)) e.file = 'Il CV deve essere un file PDF, DOC o DOCX.'
    else if (file.size > MAX_BYTES) e.file = 'Il file supera 10 MB.'
    if (!consent) e.consent = 'Serve il consenso per inviare la candidatura.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (state.kind === 'sending' || !validate() || !file) return
    setState({ kind: 'sending' })
    try {
      await publicJobPostingsApi.apply(token, { fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), retention: short ? 'SIX_MONTHS' : 'TWO_YEARS', consent, file })
      setState({ kind: 'sent' })
    } catch (err) {
      setState({ kind: 'error', message: err instanceof ApiError ? err.message : 'Invio non riuscito. Controlla la connessione e riprova.' })
    }
  }

  if (state.kind === 'sent') {
    return (
      <Card className="gap-2">
        <p className="flex items-center gap-2 text-app-subtitle font-semibold text-foreground">
          <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden="true" />
          Candidatura inviata
        </p>
        <p className="text-app-body text-muted-foreground">Abbiamo ricevuto il tuo CV. Se il profilo è in linea con la posizione, ti scriviamo all’indirizzo che hai indicato.</p>
      </Card>
    )
  }

  return (
    <Card className="gap-4">
      <h2 className="text-app-section font-semibold text-foreground">Candidati per questa posizione</h2>
      <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome e cognome" required error={errors.fullName}>
            <Input autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Email" required error={errors.email}>
            <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Telefono" hint="Facoltativo">
            <Input type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="CV" required hint="PDF, DOC o DOCX, fino a 10 MB" error={errors.file}>
            <Input type="file" accept={ACCEPT} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </Field>
        </div>

        <div className="flex flex-col gap-3 rounded-sm border border-border p-4">
          <p className="text-app-small text-muted-foreground">
            Titolare del trattamento: <span className="text-foreground">{privacyController}</span>. Per i tuoi diritti (accesso, rettifica, cancellazione) scrivi a{' '}
            <a className="text-foreground underline underline-offset-4" href={`mailto:${privacyEmail}`}>
              {privacyEmail}
            </a>
            . Il CV si usa solo per questa selezione e si conserva 24 mesi, poi si cancella.
          </p>
          <div className="flex items-start gap-2">
            <Checkbox id="app-short" checked={short} onCheckedChange={(v) => setShort(v === true)} className="mt-0.5" />
            <label htmlFor="app-short" className="text-app-small text-foreground">
              Conservate il mio CV solo 6 mesi
            </label>
          </div>
          <div className="flex items-start gap-2">
            <Checkbox id="app-consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} aria-invalid={errors.consent ? true : undefined} aria-describedby={errors.consent ? 'app-consent-error' : undefined} className="mt-0.5" />
            <label htmlFor="app-consent" className="text-app-small text-foreground">
              Acconsento al trattamento dei miei dati per questa selezione
            </label>
          </div>
          {errors.consent ? (
            <p id="app-consent-error" className="text-app-small text-destructive">
              {errors.consent}
            </p>
          ) : null}
        </div>

        {state.kind === 'error' ? <InlineAlert layout="text">{state.message}</InlineAlert> : null}
        <Button type="submit" className="self-start" disabled={state.kind === 'sending'}>
          <Send aria-hidden="true" />
          {state.kind === 'sending' ? 'Invio in corso…' : 'Invia candidatura'}
        </Button>
      </form>
    </Card>
  )
}
