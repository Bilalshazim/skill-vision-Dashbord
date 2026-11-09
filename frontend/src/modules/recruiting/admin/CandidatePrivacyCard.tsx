import { CheckCircle2, Save } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Field } from '@/components/patterns/Field'
import { InlineAlert } from '@/components/patterns/InlineAlert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api/client'
import { publicApplicationsApi, type PublicApplicationSettings } from '@/lib/api/endpoints'

// I contatti privacy delle candidature online (Decisioni del 2026-11-09, Parte C): titolare
// del trattamento ed email per i diritti dei candidati. Sono obbligatori: finché mancano,
// «Crea link» nel Profilo candidato resta spento e il modulo di candidatura non compare.
// Per ora le candidature online valgono solo per la società demo: lo stato lo dice.
export function CandidatePrivacyCard({ companyId, canEdit }: { companyId: string; canEdit: boolean }) {
  const [settings, setSettings] = useState<PublicApplicationSettings | null>(null)
  const [controller, setController] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<{ kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'error'; message: string }>({ kind: 'idle' })

  useEffect(() => {
    if (!companyId) return
    let cancelled = false
    publicApplicationsApi
      .settings(companyId)
      .then((s) => {
        if (cancelled) return
        setSettings(s)
        setController(s.privacyController)
        setEmail(s.privacyEmail)
      })
      .catch((err) => !cancelled && setState({ kind: 'error', message: err instanceof ApiError ? err.message : 'Impossibile leggere i contatti privacy.' }))
    return () => {
      cancelled = true
    }
  }, [companyId])

  async function save() {
    if (state.kind === 'saving') return
    setState({ kind: 'saving' })
    try {
      await publicApplicationsApi.saveSettings({ companyId, privacyController: controller.trim(), privacyEmail: email.trim() })
      setSettings(await publicApplicationsApi.settings(companyId))
      setState({ kind: 'saved' })
    } catch (err) {
      setState({ kind: 'error', message: err instanceof ApiError ? err.message : 'Salvataggio non riuscito.' })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy delle candidature online</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="max-w-prose text-app-small text-muted-foreground">
          Compaiono nel modulo di candidatura sotto l’annuncio. Senza tutti e due, il link di candidatura non si crea.
        </p>
        {settings ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={settings.ready ? 'success' : 'warning'} dot>
              {settings.ready ? 'Candidature online attive' : 'Candidature online non attive'}
            </Badge>
            {!settings.demo ? <span className="text-app-caption text-muted-foreground">Per ora sono disponibili solo per la società demo.</span> : null}
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Titolare del trattamento" required>
            <Input value={controller} onChange={(e) => setController(e.target.value)} disabled={!canEdit} placeholder="Ragione sociale" />
          </Field>
          <Field label="Email per la privacy" required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!canEdit} placeholder="privacy@azienda.it" />
          </Field>
        </div>
        {canEdit ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={() => void save()} disabled={state.kind === 'saving'}>
              <Save aria-hidden="true" />
              Salva
            </Button>
            {state.kind === 'saved' ? (
              <span className="flex items-center gap-1.5 text-app-caption font-medium text-success">
                <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                Contatti salvati
              </span>
            ) : null}
          </div>
        ) : null}
        {state.kind === 'error' ? <InlineAlert layout="text">{state.message}</InlineAlert> : null}
      </CardContent>
    </Card>
  )
}
