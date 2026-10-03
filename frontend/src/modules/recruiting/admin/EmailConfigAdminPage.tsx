import { PageHeader } from '@/components/patterns/PageHeader'
import { CheckCircle2, Loader2, Plus, Save, ShieldAlert, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { LoadingState } from '@/components/patterns/LoadingState'
import { InlineAlert } from '@/components/patterns/InlineAlert'
import { SelectField } from '@/components/patterns/SelectField'
import { Field } from '@/components/patterns/Field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiError, getBackendUser } from '@/lib/api/client'
import { campaignsApi, companiesApi, emailConfigApi } from '@/lib/api/endpoints'
import { useBackendSession } from '@/lib/api/useBackendSession'
import type { BackendCampaign, BackendCompany, BackendEmailServiceConfig, BackendEmailTemplate, BackendSenderConfig } from '@/lib/api/types'
import { EmptyState } from '@/components/patterns/EmptyState'

// See CipAdminPage.tsx's identical comment — same duplicated-className
// cleanup, now the shared buttonVariants() instead of a local copy.
const primaryBtnClass = buttonVariants({ size: 'sm' })
const ghostBtnClass = buttonVariants({ variant: 'outline', size: 'sm' })

function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.network ? 'Impossibile contattare il server.' : err.message
  return err instanceof Error ? err.message : 'Errore sconosciuto'
}

// Phase 33 §3 — the missing admin UI for Phase 30's email-config module.
// Three clearly SEPARATE sections, matching the backend's own separation
// exactly (§10/§19's security rule is enforced by the BACKEND — see
// emailConfig/routes.ts's redact() — this page never receives, stores, or
// could display the raw apiKeySecretRef even if it tried; Section C's form
// only ever WRITES a new value forward, and every read comes back with
// `apiKeySecretRefConfigured: true` in its place).
export default function EmailConfigAdminPage() {
  // See CipAdminPage's identical comment: this component sits behind
  // RecruitingLayout's <Outlet/>, which does not re-render on the layout's
  // own state changes, so a role check needs its OWN reactive session
  // state rather than a one-time getBackendUser() snapshot taken before
  // the shell->backend bridge has necessarily resolved.
  const backend = useBackendSession()
  const user = getBackendUser()
  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN'
  const isCompanyAdmin = user?.role === 'COMPANY_ADMIN'
  const canEditCompanyConfig = isPlatformAdmin || isCompanyAdmin
  const canSeeCompanyConfig = canEditCompanyConfig || user?.role === 'RECRUITER'

  const [companies, setCompanies] = useState<BackendCompany[]>([])
  const [companyId, setCompanyId] = useState(user?.companyId || '')
  const [campaigns, setCampaigns] = useState<BackendCampaign[]>([])
  const [campaignId, setCampaignId] = useState('')

  const [senderConfigs, setSenderConfigs] = useState<BackendSenderConfig[]>([])
  const [senderType, setSenderType] = useState<'COMPANY_HR' | 'SKILLVISION_ADMIN'>('COMPANY_HR')
  const [displayName, setDisplayName] = useState('')
  const [replyToEmail, setReplyToEmail] = useState('')
  const [senderPending, setSenderPending] = useState(false)
  const [senderError, setSenderError] = useState('')
  const [senderSaved, setSenderSaved] = useState(false)

  const [template, setTemplate] = useState<BackendEmailTemplate | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [templatePending, setTemplatePending] = useState(false)
  const [templateError, setTemplateError] = useState('')
  const [templateSaved, setTemplateSaved] = useState(false)

  const [serviceConfigs, setServiceConfigs] = useState<BackendEmailServiceConfig[]>([])
  const [providerName, setProviderName] = useState('')
  const [apiEndpointUrl, setApiEndpointUrl] = useState('')
  const [apiKeySecretRef, setApiKeySecretRef] = useState('')
  const [servicePending, setServicePending] = useState(false)
  const [serviceError, setServiceError] = useState('')

  useEffect(() => {
    if (backend.status !== 'connected' || !canSeeCompanyConfig) return
    if (isPlatformAdmin) companiesApi.list().then(setCompanies).catch(() => {})
  }, [backend.status, canSeeCompanyConfig, isPlatformAdmin])

  useEffect(() => {
    if (backend.status !== 'connected' || !companyId || !canSeeCompanyConfig) return
    emailConfigApi
      .getSenderConfigs(companyId)
      .then(setSenderConfigs)
      .catch((err) => setSenderError(apiErrorMessage(err)))
    campaignsApi
      .list(companyId)
      .then(setCampaigns)
      .catch(() => {})
  }, [backend.status, companyId, canSeeCompanyConfig])

  useEffect(() => {
    if (!campaignId) {
      setTemplate(null)
      return
    }
    emailConfigApi
      .getEmailTemplate(campaignId)
      .then((t) => {
        setTemplate(t)
        setSubject(t?.subject || '')
        setBody(t?.body || '')
      })
      .catch((err) => setTemplateError(apiErrorMessage(err)))
  }, [campaignId])

  useEffect(() => {
    if (backend.status !== 'connected' || !isPlatformAdmin) return
    emailConfigApi
      .getEmailServiceConfigs()
      .then(setServiceConfigs)
      .catch((err) => setServiceError(apiErrorMessage(err)))
  }, [backend.status, isPlatformAdmin])

  async function handleSaveSender() {
    if (!companyId || !displayName.trim() || !replyToEmail.trim() || senderPending) return
    setSenderPending(true)
    setSenderError('')
    setSenderSaved(false)
    try {
      await emailConfigApi.setSenderConfig(companyId, { senderType, displayName: displayName.trim(), replyToEmail: replyToEmail.trim() })
      setSenderConfigs(await emailConfigApi.getSenderConfigs(companyId))
      setDisplayName('')
      setReplyToEmail('')
      setSenderSaved(true)
    } catch (err) {
      setSenderError(apiErrorMessage(err))
    } finally {
      setSenderPending(false)
    }
  }

  async function handleSaveTemplate() {
    if (!campaignId || !subject.trim() || !body.trim() || templatePending) return
    setTemplatePending(true)
    setTemplateError('')
    setTemplateSaved(false)
    try {
      const saved = await emailConfigApi.setEmailTemplate(campaignId, { companyId, subject: subject.trim(), body: body.trim() })
      setTemplate(saved)
      setTemplateSaved(true)
    } catch (err) {
      setTemplateError(apiErrorMessage(err))
    } finally {
      setTemplatePending(false)
    }
  }

  async function handleSaveService() {
    if (!providerName.trim() || !apiEndpointUrl.trim() || !apiKeySecretRef.trim() || servicePending) return
    setServicePending(true)
    setServiceError('')
    try {
      await emailConfigApi.setEmailServiceConfig({ providerName: providerName.trim(), apiEndpointUrl: apiEndpointUrl.trim(), apiKeySecretRef: apiKeySecretRef.trim() })
      setServiceConfigs(await emailConfigApi.getEmailServiceConfigs())
      setProviderName('')
      setApiEndpointUrl('')
      setApiKeySecretRef('')
    } catch (err) {
      setServiceError(apiErrorMessage(err))
    } finally {
      setServicePending(false)
    }
  }

  async function handleActivateService(id: string) {
    setServiceError('')
    try {
      await emailConfigApi.activateEmailServiceConfig(id)
      setServiceConfigs(await emailConfigApi.getEmailServiceConfigs())
    } catch (err) {
      setServiceError(apiErrorMessage(err))
    }
  }

  if (backend.status === 'checking') {
    return (
      <LoadingState label="Verifica sessione…" />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader level="page" className="mb-0" title="Configurazione email" description={<>Mittente e modello per il team di recruiting, servizio di invio per l&apos;amministrazione piattaforma — sezioni separate, permessi separati. Non modifica il flusso <b className="font-semibold text-foreground">Invia link test</b>.</>} />

      {!canSeeCompanyConfig ? (
        <Card>
          <EmptyState size="sm" icon={ShieldAlert} description="Il tuo ruolo non ha accesso a questa configurazione." />
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>A. Configurazione mittente (Società/HR o amministratore Skill Vision)</CardTitle>
            </CardHeader>
            <CardContent>
              {isPlatformAdmin && (
                <Field label="Società" className="mb-4">
                  <SelectField value={companyId} onValueChange={(v) => setCompanyId(v)} className="max-w-72">
                    <option value="">Seleziona…</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </SelectField>
                </Field>
              )}

              {companyId ? (
                <>
                  <div className="mb-3 flex flex-col gap-1.5">
                    {senderConfigs.length ? (
                      senderConfigs.map((s) => (
                        <div key={s.id} className="rounded-sm border border-border px-3 py-2 text-app-small">
                          <b className="font-semibold text-foreground">{s.displayName}</b> · {s.senderType === 'COMPANY_HR' ? 'Company/HR' : 'Skill Vision admin'} ·{' '}
                          {s.replyToEmail}
                        </div>
                      ))
                    ) : (
                      <span className="text-app-caption text-muted-foreground">Nessun mittente configurato per questa company.</span>
                    )}
                  </div>
                  {canEditCompanyConfig && (
                    <div className="flex flex-wrap items-center gap-2">
                      <SelectField value={senderType} onValueChange={(v) => setSenderType(v as 'COMPANY_HR' | 'SKILLVISION_ADMIN')} size="sm">
                        <option value="COMPANY_HR">Company/HR</option>
                        <option value="SKILLVISION_ADMIN">Skill Vision admin</option>
                      </SelectField>
                      <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nome visualizzato" size="sm" className="w-48" />
                      <Input value={replyToEmail} onChange={(e) => setReplyToEmail(e.target.value)} placeholder="Email risposta" size="sm" className="w-56" />
                      <button type="button" onClick={handleSaveSender} disabled={senderPending} className={primaryBtnClass}>
                        {senderPending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Plus className="size-3.5 shrink-0" aria-hidden="true" />}
                        Aggiungi
                      </button>
                    </div>
                  )}
                  {senderSaved && (
                    <p className="mt-2 flex items-center gap-1.5 text-app-caption font-medium text-success">
                      <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                      Mittente salvato
                    </p>
                  )}
                  {senderError && <InlineAlert layout="text" className="mt-2">{senderError}</InlineAlert>}
                </>
              ) : (
                <span className="text-app-caption text-muted-foreground">Seleziona una company per vedere/configurare il mittente.</span>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>B. Modello email (soggetto e messaggio)</CardTitle>
            </CardHeader>
            <CardContent>
              {companyId ? (
                <Field label="Campagna" className="mb-4">
                  <SelectField value={campaignId} onValueChange={(v) => setCampaignId(v)} className="max-w-72">
                    <option value="">Seleziona…</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </SelectField>
                </Field>
              ) : (
                <span className="text-app-caption text-muted-foreground">Seleziona prima una company.</span>
              )}

              {campaignId && (
                <div className="flex flex-col gap-2">
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Soggetto" size="sm" />
                  <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Messaggio" size="sm" />
                  {canEditCompanyConfig && (
                    <div>
                      <button type="button" onClick={handleSaveTemplate} disabled={templatePending} className={primaryBtnClass}>
                        {templatePending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Save className="size-3.5 shrink-0" aria-hidden="true" />}
                        Salva modello
                      </button>
                    </div>
                  )}
                  {templateSaved && (
                    <p className="flex items-center gap-1.5 text-app-caption font-medium text-success">
                      <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                      Modello salvato
                    </p>
                  )}
                  {template && <p className="text-app-caption text-muted-foreground">Ultimo salvato — {template.id}</p>}
                  {templateError && <InlineAlert layout="text" className="mt-2">{templateError}</InlineAlert>}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>C. Servizio di invio email (solo amministratori della piattaforma)</CardTitle>
          <p className="mt-0.5 text-app-caption font-normal text-muted-foreground">
            La credenziale non viene mai mostrata: qui si vede solo se è configurata.
          </p>
        </CardHeader>
        <CardContent>
          {!isPlatformAdmin ? (
            <EmptyState size="sm" icon={ShieldAlert} description="Sezione riservata agli amministratori della piattaforma: le credenziali del servizio non sono visibili né modificabili da questo account." />
          ) : (
            <>
              <div className="mb-3 flex flex-col gap-1.5">
                {serviceConfigs.length ? (
                  serviceConfigs.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 rounded-sm border border-border px-3 py-2 text-app-small">
                      <span>
                        <b className="font-semibold text-foreground">{s.providerName}</b> · {s.apiEndpointUrl} · {s.scope}
                        {' · '}
                        {s.apiKeySecretRefConfigured ? (
                          <span className="inline-flex items-center gap-1 text-success">
                            <CheckCircle2 className="size-3 shrink-0" aria-hidden="true" />
                            credenziale configurata
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-destructive">
                            <XCircle className="size-3 shrink-0" aria-hidden="true" />
                            nessuna credenziale
                          </span>
                        )}
                        {s.active && <span className="label-mono ml-2 rounded-full bg-success/12 px-2 py-0.5 text-success">attivo</span>}
                      </span>
                      {!s.active && (
                        <button type="button" onClick={() => handleActivateService(s.id)} className={ghostBtnClass}>
                          Attiva
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-app-caption text-muted-foreground">Nessun servizio email configurato — nessun provider reale è collegato in questa build.</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input value={providerName} onChange={(e) => setProviderName(e.target.value)} placeholder="Provider (es. SendGrid)" size="sm" className="w-44" />
                <Input value={apiEndpointUrl} onChange={(e) => setApiEndpointUrl(e.target.value)} placeholder="https://api.provider.com" size="sm" className="w-56" />
                <Input value={apiKeySecretRef} onChange={(e) => setApiKeySecretRef(e.target.value)} placeholder="Riferimento credenziale (secrets manager)" type="password" size="sm" className="w-60" />
                <button type="button" onClick={handleSaveService} disabled={servicePending} className={primaryBtnClass}>
                  {servicePending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Plus className="size-3.5 shrink-0" aria-hidden="true" />}
                  Salva
                </button>
              </div>
              {serviceError && <InlineAlert layout="text" className="mt-2">{serviceError}</InlineAlert>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
