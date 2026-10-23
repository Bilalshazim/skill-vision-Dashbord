import { AlertTriangle, CheckCircle2, ChevronDown, Copy, FileBarChart2, Loader2, Mail, Sparkles, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { ModalDialog } from '@/components/patterns/ModalDialog'
import { SelectField } from '@/components/patterns/SelectField'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/hooks/use-confirm'
import { cn } from '@/lib/utils'
import { candidatesApi, campaignsApi, evaluatorsApi } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/client'
import type { BackendCampaignEvaluator, EvaluatorFormKind, EvaluatorFormTracking } from '@/lib/api/endpoints'
import { EvaluatorFormsTracking } from '@/modules/recruiting/profile-hub/EvaluatorFormsTracking'
import { FORM_KIND_LABEL, openFormUpload } from '@/modules/recruiting/lib/evaluator-forms'
import type { BackendCampaignCandidate, BackendEvaluation, BackendEvaluatorRole } from '@/lib/api/types'
import { getCachedBackendLink } from '@/modules/recruiting/lib/backend-link'
import { getActiveOpening } from '@/modules/recruiting/lib/pipeline'
import { readCvMatchingState } from '@/modules/recruiting/lib/storage'
import { EmptyState } from '@/components/patterns/EmptyState'
import { EvaluationCompare } from '@/modules/recruiting/evaluate/EvaluationCompare'
import { EvaluationFormsView, receivedForms, type FormKind } from '@/modules/recruiting/evaluate/EvaluationFormsView'
import { RECOMMENDATION_LABEL } from '@/modules/recruiting/lib/evaluation-forms'
import { usePreference } from '@/lib/preferences'
import { DEFAULT_ROLE } from '@/modules/recruiting/lib/constants'
import { importSynthesisIntoReport, ivReportHasSynthesisText } from '@/modules/recruiting/lib/interview-protocol'
import type { SynthesisSections } from '@/modules/recruiting/lib/interview-protocol'

const ROLES: { value: BackendEvaluatorRole; label: string }[] = [
  { value: 'HR', label: 'HR' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'DIRETTORE_HR', label: 'Direttore HR' },
  { value: 'ALTRO', label: 'Altro' },
]
const ROLE_LABEL = new Map(ROLES.map((r) => [r.value, r.label]))

const btnClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-app-caption font-semibold text-foreground transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60'

function apiErrorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Errore sconosciuto'
}

// Phase 31 §13 / Phase 35 §1-§2 — the multi-evaluator/role admin panel.
// Phase 35 refines what Phase 31/33 first built: the roster now comes from
// a real backend read (campaigns/:id/evaluators, added this phase — see
// its own comment for why) instead of only this session's local state, so
// it survives a reload; each row is numbered "Valutatore N — Ruolo" per
// Roberto's own requested format, never left for the admin to infer from a
// bare name; and a "Risultati" section lets the admin see every assigned
// evaluator's independent score for a chosen candidate side by side (§1's
// "admin can see evaluator assignments/results").
export function EvaluatorsBackendPanel({ onReportChanged }: { onReportChanged?: () => void }) {
  const { opening } = getActiveOpening(readCvMatchingState())
  const backendCampaignId = opening ? getCachedBackendLink(opening.id)?.campaignId : undefined

  const [roster, setRoster] = useState<BackendCampaignEvaluator[]>([])
  const [readiness, setReadiness] = useState<{ assignedEvaluators: number; meetsMinimum: boolean } | null>(null)
  const [loadError, setLoadError] = useState('')
  const [issuedTokens, setIssuedTokens] = useState<Record<string, string>>({})

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<BackendEvaluatorRole>('HR')
  const [altroLabel, setAltroLabel] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [confirm, confirmDialog] = useConfirm()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)
  const [sendResults, setSendResults] = useState<Record<string, { ok: boolean; reason?: string }>>({})
  // Quali schede mandare: di partenza tutte e due, come prima.
  const [sendKinds, setSendKinds] = useState<Set<EvaluatorFormKind>>(() => new Set(['INTERVISTA', 'VALUTAZIONE']))
  const [trackingKey, setTrackingKey] = useState(0)

  function toggleKind(kind: EvaluatorFormKind, on: boolean) {
    setSendKinds((prev) => {
      const next = new Set(prev)
      if (on) next.add(kind)
      else next.delete(kind)
      return next
    })
  }

  function toggleSelected(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  // Invia via email il link alle schede (Intervista strutturata + Valutazione
  // candidato) ai valutatori spuntati. A chi non è spuntato non parte niente.
  async function handleSendForms() {
    if (!backendCampaignId || sending || selected.size === 0 || sendKinds.size === 0) return
    const n = selected.size
    const kinds = (['INTERVISTA', 'VALUTAZIONE'] as const).filter((k) => sendKinds.has(k))
    const what = kinds.length === 2 ? 'le due schede' : `la scheda ${FORM_KIND_LABEL[kinds[0]]}`
    if (
      !(await confirm({
        title: `Inviare ${what} a ${n} ${n === 1 ? 'valutatore' : 'valutatori'}?`,
        description: 'Ognuno riceve un’email con il suo link personale, valido 14 giorni: può compilare online o rimandarti la scheda come file rispondendo all’email. Se aveva già un link, quello precedente smette di funzionare.',
        confirmLabel: 'Invia email',
      }))
    )
      return
    setSending(true)
    setError('')
    try {
      const { results } = await evaluatorsApi.sendForms(backendCampaignId, [...selected], kinds)
      setSendResults(Object.fromEntries(results.map((r) => [r.evaluatorId, { ok: r.ok, reason: r.reason }])))
      setSelected(new Set(results.filter((r) => !r.ok).map((r) => r.evaluatorId)))
      setTrackingKey((k) => k + 1)
      await refreshRoster()
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSending(false)
    }
  }

  async function refreshRoster() {
    if (!backendCampaignId) return
    try {
      const [rosterRes, readinessRes] = await Promise.all([campaignsApi.evaluators(backendCampaignId), campaignsApi.evaluatorReadiness(backendCampaignId)])
      setRoster(rosterRes)
      setReadiness(readinessRes)
      setLoadError('')
    } catch (err) {
      setLoadError(apiErrorMessage(err))
    }
  }

  useEffect(() => {
    void refreshRoster()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendCampaignId])

  async function handleCreate() {
    if (!backendCampaignId || pending) return
    if (!fullName.trim() || !email.trim()) {
      setError('Nome ed email sono obbligatori.')
      return
    }
    setPending(true)
    setError('')
    try {
      const evaluator = await evaluatorsApi.create({ fullName: fullName.trim(), email: email.trim(), role, altroLabel: role === 'ALTRO' ? altroLabel.trim() : undefined })
      await evaluatorsApi.assignToCampaign(backendCampaignId, evaluator.id)
      setFullName('')
      setEmail('')
      setAltroLabel('')
      await refreshRoster()
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  async function handleIssueToken(evaluatorId: string) {
    setPending(true)
    setError('')
    try {
      // OD-9's accountless path (§13/§19): the backend issues a real,
      // scoped, hashed, 14-day access token — shown here for the admin to
      // deliver themselves, same pattern the existing Survey Link section
      // already uses.
      const { token } = await evaluatorsApi.issueAccessToken(evaluatorId)
      setIssuedTokens((prev) => ({ ...prev, [evaluatorId]: token }))
      await refreshRoster()
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  if (!opening) return <p className="text-app-caption text-muted-foreground">Seleziona prima una company/opening nella pagina CV & Esportazione.</p>
  if (!backendCampaignId)
    return (
      <p className="text-app-caption text-muted-foreground">
        Nessuna campagna collegata al backend per <b className="font-semibold text-foreground">{opening.title}</b> — carica almeno un CV da CV &amp;
        Esportazione per collegarla, poi torna qui.
      </p>
    )

  return (
    <div className="flex flex-col gap-3">
      {/* Phase 33 §7 — entry point into the evaluator-facing workspace for
          a shell user whose own account is linked to an Evaluator record
          (Evaluator.userId). An accountless evaluator instead uses the
          token issued below their row, opened at /evaluate?evaluatorToken=…
          (see evaluate/EvaluateStandalonePage.tsx). */}
      <Link
        to="/recruiting/evaluate"
        className="inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-sm border border-border px-3 py-1.5 text-app-caption font-semibold text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
      >
        <Users className="size-3.5 shrink-0" aria-hidden="true" />
        Apri la mia area valutatore
      </Link>

      {readiness && (
        <div className={cn('flex items-center gap-1.5 text-app-caption font-medium', readiness.meetsMinimum ? 'text-success' : 'text-warning')}>
          <Users className="size-3.5 shrink-0" aria-hidden="true" />
          {readiness.assignedEvaluators} valutatori assegnati {readiness.meetsMinimum ? '— minimo raggiunto (3) ✓' : '— minimo richiesto: 3'}
        </div>
      )}
      {loadError && (
        <p className="flex items-start gap-1.5 text-app-caption font-medium text-destructive">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {loadError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-sm bg-secondary p-3">
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome valutatore" disabled={pending} size="sm" />
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" disabled={pending} size="sm" />
        <SelectField value={role} onValueChange={(v) => setRole(v as BackendEvaluatorRole)} disabled={pending} size="sm">
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </SelectField>
        {role === 'ALTRO' && <Input value={altroLabel} onChange={(e) => setAltroLabel(e.target.value)} placeholder="Specifica ruolo" disabled={pending} size="sm" />}
        <button type="button" onClick={handleCreate} disabled={pending} className={btnClass}>
          {pending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <UserPlus className="size-3.5 shrink-0" aria-hidden="true" />}
          Aggiungi e assegna
        </button>
      </div>

      {error && (
        <p className="flex items-start gap-1.5 text-app-caption font-medium text-destructive">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {/* Phase 35 §2 — "Valutatore 1 — HR", "Valutatore 2 — Manager", … —
          Roberto's own requested format, numbered in assignment order so
          the admin never has to infer who's who. Sourced from the real
          backend roster (§1), so it's still here after a reload. */}
      {roster.length > 0 && (
        <div className="flex flex-col gap-2">
          {roster.map((r, i) => {
            const token = issuedTokens[r.id]
            return (
              <div key={r.id} className="flex flex-col gap-1 rounded-sm border border-border p-2.5 text-app-caption">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-start gap-2">
                    <Checkbox checked={selected.has(r.id)} onCheckedChange={(c) => toggleSelected(r.id, c === true)} aria-label={`Seleziona ${r.fullName} per l’invio delle schede`} className="mt-0.5" disabled={sending} />
                    <span>
                    <b className="font-semibold text-foreground">
                      Valutatore {i + 1} — {ROLE_LABEL.get(r.role) || r.role}
                    </b>
                    {r.altroLabel ? ` (${r.altroLabel})` : ''} · {r.fullName} · {r.email}
                    {r.hasLogin && <span className="ml-1.5 text-muted-foreground">· accesso con login</span>}
                    </span>
                  </span>
                  {!r.hasLogin && !r.hasAccessToken && !token && (
                    <button type="button" onClick={() => handleIssueToken(r.id)} disabled={pending} className={btnClass}>
                      Genera token di accesso
                    </button>
                  )}
                  {!r.hasLogin && r.hasAccessToken && !token && <span className="text-app-caption text-muted-foreground">Token già generato</span>}
                </div>
                {sendResults[r.id] && (
                  <p className={cn('flex items-start gap-1.5 text-app-caption font-medium', sendResults[r.id].ok ? 'text-success' : 'text-destructive')}>
                    {sendResults[r.id].ok ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> : <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />}
                    {sendResults[r.id].ok ? `Email inviata a ${r.email}` : `Email non inviata: ${sendResults[r.id].reason}`}
                  </p>
                )}
                {token && (
                  <div className="flex flex-wrap items-center gap-1.5 text-app-caption text-muted-foreground">
                    <CheckCircle2 className="size-3.5 shrink-0 text-success" aria-hidden="true" />
                    <span>Token (14 giorni) — consegnalo tu al valutatore:</span>
                    <code className="break-all rounded bg-secondary px-1 py-0.5">{token}</code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(token)}
                      title="Copia link"
                      aria-label="Copia link"
                      className="inline-flex items-center justify-center rounded border border-border p-1 text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="size-3 shrink-0" aria-hidden="true" />
                    </button>
                    <Link to={`/evaluate?evaluatorToken=${encodeURIComponent(token)}`} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline dark:text-primary">
                      Apri come valutatore →
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {roster.length > 0 && (
        <div className="flex flex-col gap-2">
          <fieldset className="flex flex-wrap items-center gap-4">
            <legend className="label-mono mb-2 text-muted-foreground">Schede da inviare</legend>
            {(['INTERVISTA', 'VALUTAZIONE'] as const).map((k) => (
              <label key={k} className="flex items-center gap-2 text-app-small text-foreground">
                <Checkbox checked={sendKinds.has(k)} onCheckedChange={(c) => toggleKind(k, c === true)} disabled={sending} />
                {FORM_KIND_LABEL[k]}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={handleSendForms} disabled={sending || selected.size === 0 || sendKinds.size === 0} className={btnClass}>
              {sending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Mail className="size-3.5 shrink-0" aria-hidden="true" />}
              Invia le schede via email{selected.size ? ` (${selected.size})` : ''}
            </button>
            <span className="text-app-caption text-muted-foreground">
              {sendKinds.size === 0 ? 'Scegli almeno una scheda da inviare.' : 'Spunta i valutatori: ricevono il link alle schede scelte e possono rimandartele anche come file.'}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <h5 className="text-app-small font-semibold text-foreground">Schede per candidato</h5>
        <p className="text-app-caption text-muted-foreground">Per ogni valutatore: quando è stata inviata la scheda, se è stata compilata online o se è tornata come file. Le schede rimandate come file si caricano qui, per nome del candidato.</p>
        <EvaluatorFormsTracking campaignId={backendCampaignId} roster={roster} refreshKey={trackingKey} onChanged={() => setTrackingKey((k) => k + 1)} />
      </div>

      <EvaluatorResultsSection campaignId={backendCampaignId} roster={roster} refreshKey={trackingKey} onReportChanged={onReportChanged} />
      {confirmDialog}
    </div>
  )
}

// Vista multi-valutatore (Fase "Foglio 2", Roberto Feliciani): per il candidato
// scelto, tutte le valutazioni ricevute in un'unica schermata — stato,
// punteggio e raccomandazione di ogni valutatore, e per chi ha inviato le
// due schede un "Apri le schede" con il contenuto — più la sintesi IA, che il
// responsabile verifica, modifica e riporta nel Report finale valutativo.
// Lettura già limitata alla società del chiamante (evaluatorsApi.listForCampaignCandidate).
function EvaluatorResultsSection({ campaignId, roster, refreshKey, onReportChanged }: { campaignId: string; roster: BackendCampaignEvaluator[]; refreshKey: number; onReportChanged?: () => void }) {
  // Aperta di partenza: è qui che il responsabile cerca chi è stato intervistato.
  const [open, setOpen] = useState(true)
  // Schede online e file caricati di tutta la selezione, in una richiesta.
  const [tracking, setTracking] = useState<EvaluatorFormTracking | null>(null)
  const [candidates, setCandidates] = useState<BackendCampaignCandidate[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [evaluations, setEvaluations] = useState<BackendEvaluation[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openDetail, setOpenDetail] = useState<{ evaluatorId: string; kind: FormKind } | null>(null)
  const [comparing, setComparing] = useState(false)
  // Quante valutazioni inviate ha ogni candidato (per il badge nella lista) e
  // quante ne aveva già viste il responsabile (per "Nuova valutazione ricevuta").
  const [counts, setCounts] = useState<Record<string, number>>({})
  // Le valutazioni già viste stanno nelle preferenze dell'utente sul server,
  // non nel browser (PROGETTO-TUTTO-SUL-SERVER.md).
  const [seen, setSeen] = usePreference<Record<string, number>>(`evalSeen.${campaignId}`, {})

  useEffect(() => {
    if (!open) return
    Promise.all([candidatesApi.campaignRoster(campaignId), evaluatorsApi.formTracking(campaignId)])
      .then(([list, t]) => {
        setCandidates(list)
        setTracking(t)
        // Per candidato: valutazioni inviate online più schede caricate come file.
        setCounts(Object.fromEntries(list.map((c) => [c.id, t.online.filter((o) => o.campaignCandidateId === c.id).length + t.uploads.filter((u) => u.campaignCandidateId === c.id).length])))
      })
      .catch(() => setCandidates([]))
  }, [open, campaignId, refreshKey])

  // "Intervistato": c'è almeno una scheda intervista, online o caricata.
  const interviewed = (ccId: string) => Boolean(tracking && (tracking.online.some((o) => o.campaignCandidateId === ccId && o.INTERVISTA) || tracking.uploads.some((u) => u.campaignCandidateId === ccId && u.kind === 'INTERVISTA')))
  const filesOf = (ccId: string, evaluatorId?: string) => (tracking?.uploads ?? []).filter((u) => u.campaignCandidateId === ccId && (!evaluatorId || u.evaluatorId === evaluatorId))

  // Aprendo un candidato, le sue valutazioni diventano "viste".
  useEffect(() => {
    if (!selectedId || counts[selectedId] == null) return
    if (seen[selectedId] === counts[selectedId]) return
    setSeen({ ...seen, [selectedId]: counts[selectedId] })
  }, [selectedId, counts, seen, setSeen])

  useEffect(() => {
    setOpenDetail(null)
    if (!selectedId) {
      setEvaluations(null)
      return
    }
    setLoading(true)
    setError('')
    evaluatorsApi
      .listForCampaignCandidate(selectedId)
      .then(setEvaluations)
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [selectedId, refreshKey])

  const selectedCandidate = candidates.find((c) => c.id === selectedId)
  const submittedCount = evaluations?.filter((e) => e.status === 'SUBMITTED').length ?? 0

  return (
    <div className="rounded-sm border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-app-small font-semibold text-foreground"
      >
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', !open && '-rotate-90')} aria-hidden="true" />
        Valutazioni ricevute per candidato
      </button>
      {open && (
        <div className="border-t border-border p-3">
          {/* Dove finiscono le schede compilate: ogni candidato con quante
              valutazioni ha ricevuto; il badge verde dice che ce n'è di nuove. */}
          {candidates.length === 0 ? (
            <p className="text-app-caption text-muted-foreground">Nessun candidato in questa campagna.</p>
          ) : (
            <ul className="flex flex-col gap-1.5" aria-label="Candidati della campagna">
              {candidates.map((c) => {
                const n = counts[c.id]
                const isNew = n != null && n > (seen[c.id] ?? 0) && c.id !== selectedId
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id === selectedId ? '' : c.id)}
                      aria-pressed={c.id === selectedId}
                      className={cn('flex w-full flex-wrap items-center gap-2 rounded-sm border px-3 py-2 text-left text-app-small transition-colors hover:border-primary', c.id === selectedId ? 'border-2 border-primary' : 'border-border')}
                    >
                      <span className="min-w-0 flex-1 font-medium text-foreground">{c.candidate?.fullName || c.id}</span>
                      {interviewed(c.id) ? (
                        <Badge tone="success" dot>
                          Intervistato
                        </Badge>
                      ) : (
                        <Badge>Non intervistato</Badge>
                      )}
                      {isNew ? (
                        <Badge tone="accent" dot>
                          Nuova scheda ricevuta
                        </Badge>
                      ) : null}
                      <Badge>{n == null ? '…' : n === 0 ? 'Nessuna scheda ricevuta' : `${n} ${n === 1 ? 'scheda ricevuta' : 'schede ricevute'}`}</Badge>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {loading && <Loader2 className="mt-3 size-4 animate-spin text-muted-foreground" aria-hidden="true" />}
          {error && (
            <p className="mt-2 flex items-start gap-1.5 text-app-caption font-medium text-destructive">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          {evaluations && !loading && (
            <div className="mt-3 flex flex-col gap-2">
              {!evaluations.length && !filesOf(selectedId).length ? (
                <EmptyState size="sm" icon={Users} description="Nessuna scheda ancora ricevuta per questo candidato: compare qui quando un valutatore la compila online o quando carichi il file che ti ha rimandato." />
              ) : (
                roster.map((r, i) => {
                  const evalu = evaluations.find((e) => e.evaluatorId === r.id)
                  const submitted = evalu?.status === 'SUBMITTED'
                  const files = filesOf(selectedId, r.id)
                  return (
                    <div key={r.id} className="flex flex-col gap-2 rounded-sm border border-border px-3 py-2 text-app-caption">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span>
                          <b className="font-semibold text-foreground">
                            Valutatore {i + 1} — {ROLE_LABEL.get(r.role) || r.role}
                          </b>{' '}
                          · {r.fullName}
                        </span>
                        {evalu ? (
                          <span className="flex flex-wrap items-center gap-2">
                            <span className={cn('label-mono inline-flex items-center gap-1 rounded-full px-2 py-0.5', submitted ? 'bg-success/12 text-success' : 'bg-warning/12 text-warning')}>
                              {submitted ? 'Inviata' : 'Bozza'}
                            </span>
                            {submitted && evalu.finalScore != null && <span className="font-mono tabular-nums text-foreground">{evalu.finalScore}</span>}
                            {submitted && evalu.recommendation && <span className="text-foreground">{RECOMMENDATION_LABEL[evalu.recommendation]}</span>}
                          </span>
                        ) : (
                          <span className="text-app-caption text-muted-foreground">{files.length ? 'Schede ricevute come file' : 'Non ancora compilata'}</span>
                        )}
                      </div>
                      {files.length ? (
                        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                          {files.map((f) => (
                            <span key={f.id} className="inline-flex items-center gap-2">
                              <Badge tone="success" dot>
                                {f.kind === 'INTERVISTA' ? 'Intervista' : 'Valutazione'}: file caricato
                              </Badge>
                              <button
                                type="button"
                                onClick={async () => {
                                  const err = await openFormUpload(f)
                                  if (err) setError(err)
                                }}
                                className="font-semibold text-foreground hover:underline"
                              >
                                Apri il file →
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {submitted && (
                        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                          {(
                            [
                              ['verbale', 'Verbale di colloquio'],
                              ['valutazione', 'Scheda di valutazione'],
                            ] as [FormKind, string][]
                          ).map(([kind, label]) => {
                            const got = receivedForms(evalu.scores)[kind]
                            return (
                              <span key={kind} className="inline-flex items-center gap-2">
                                <Badge tone={got ? 'success' : 'neutral'} dot>
                                  {label}: {got ? 'Ricevuto' : 'Non compilato'}
                                </Badge>
                                {got ? (
                                  <button type="button" onClick={() => setOpenDetail({ evaluatorId: r.id, kind })} className="font-semibold text-foreground hover:underline dark:text-primary">
                                    {kind === 'verbale' ? 'Apri il verbale →' : 'Apri la valutazione →'}
                                  </button>
                                ) : null}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
              {submittedCount >= 2 && selectedCandidate ? (
                <button type="button" onClick={() => setComparing(true)} className={btnClass + ' self-start'}>
                  Confronta le {submittedCount} valutazioni
                </button>
              ) : null}
              {comparing && selectedCandidate ? (
                <ModalDialog title="Confronto fra valutatori" sub={selectedCandidate.candidate?.fullName || ''} size="xl" onClose={() => setComparing(false)}>
                  <EvaluationCompare
                    columns={roster
                      .map((r, i) => ({ r, i, ev: evaluations.find((e) => e.evaluatorId === r.id && e.status === 'SUBMITTED') }))
                      .filter((x) => x.ev)
                      .map((x) => ({ id: x.r.id, label: `Valutatore ${x.i + 1} — ${x.r.fullName}`, scores: x.ev!.scores }))}
                  />
                </ModalDialog>
              ) : null}
              {openDetail && selectedCandidate ? (
                (() => {
                  const ev = evaluations.find((e) => e.evaluatorId === openDetail.evaluatorId)
                  const who = roster.find((r) => r.id === openDetail.evaluatorId)
                  return ev ? (
                    <ModalDialog
                      title={openDetail.kind === 'verbale' ? 'Verbale di colloquio' : 'Scheda di valutazione candidato'}
                      sub={`${selectedCandidate.candidate?.fullName || ''} · compilata da ${who?.fullName || 'valutatore'}`}
                      size="xl"
                      onClose={() => setOpenDetail(null)}
                    >
                      <EvaluationFormsView scores={ev.scores} only={openDetail.kind} />
                    </ModalDialog>
                  ) : null
                })()
              ) : null}
              {(submittedCount > 0 || filesOf(selectedId).length > 0) && selectedCandidate && (
                <SynthesisPanel campaignCandidateId={selectedId} candidateName={selectedCandidate.candidate?.fullName || ''} submittedCount={submittedCount} fileCount={filesOf(selectedId).length} onReportChanged={onReportChanged} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const SYNTHESIS_FIELDS: { key: keyof SynthesisSections; label: string }[] = [
  { key: 'rilevanti', label: 'Elementi più rilevanti' },
  { key: 'convergenze', label: 'Convergenze tra i valutatori' },
  { key: 'divergenze', label: 'Divergenze tra i valutatori' },
  { key: 'criticita', label: 'Aspetti critici' },
]

// Sintesi IA di tutte le valutazioni inviate. Non si salva da sola: compare in
// quattro campi modificabili e solo "Riporta nel Report finale" la porta nella
// scheda del Report finale valutativo.
function SynthesisPanel({ campaignCandidateId, candidateName, submittedCount, fileCount, onReportChanged }: { campaignCandidateId: string; candidateName: string; submittedCount: number; fileCount: number; onReportChanged?: () => void }) {
  const [sections, setSections] = useState<SynthesisSections | null>(null)
  const [used, setUsed] = useState(0)
  const [skipped, setSkipped] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [imported, setImported] = useState(false)
  const [confirm, confirmDialog] = useConfirm()

  // Cambia il candidato: la sintesi di prima non vale più.
  useEffect(() => {
    setSections(null)
    setError('')
    setImported(false)
  }, [campaignCandidateId])

  async function handleGenerate() {
    if (generating) return
    if (sections && !(await confirm({ title: 'Generare di nuovo la sintesi?', description: 'Le modifiche che hai fatto al testo attuale andranno perse.', confirmLabel: 'Genera di nuovo', destructive: true }))) return
    setGenerating(true)
    setError('')
    setImported(false)
    try {
      const r = await evaluatorsApi.synthesis(campaignCandidateId)
      setSections(r.sections)
      setUsed(r.evaluationsUsed + r.filesUsed)
      setSkipped(r.filesSkipped)
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  async function handleImport() {
    if (!sections) return
    if (ivReportHasSynthesisText(DEFAULT_ROLE) && !(await confirm({ title: 'Sostituire il testo del Report finale?', description: 'Il Report finale valutativo di questa posizione contiene già una sintesi e degli aspetti critici: verranno sostituiti con questo testo.', confirmLabel: 'Sostituisci', destructive: true }))) return
    importSynthesisIntoReport(DEFAULT_ROLE, candidateName, sections)
    onReportChanged?.()
    setImported(true)
  }

  return (
    <div className="mt-1 flex flex-col gap-3 rounded-sm border border-border bg-secondary p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-app-small font-semibold text-foreground">
            <Sparkles className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            Sintesi delle valutazioni
          </div>
          <p className="text-app-caption text-muted-foreground">
            Generata dall’IA su {[submittedCount ? `${submittedCount} ${submittedCount === 1 ? 'scheda compilata online' : 'schede compilate online'}` : '', fileCount ? `${fileCount} ${fileCount === 1 ? 'file caricato' : 'file caricati'}` : ''].filter(Boolean).join(' e ')}: verificala prima di usarla. Dalle schede online non vanno all’IA i nomi del candidato e dei valutatori; i file invece si inviano così come sono, con quello che c’è scritto.
          </p>
        </div>
        <button type="button" onClick={handleGenerate} disabled={generating} className={btnClass}>
          {generating ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />}
          {sections ? 'Genera di nuovo' : 'Genera sintesi'}
        </button>
      </div>
      {error && (
        <p className="flex items-start gap-1.5 text-app-caption font-medium text-destructive">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {sections && (
        <>
          {used < submittedCount + fileCount && <p className="text-app-caption text-muted-foreground">La sintesi è basata su {used} schede.</p>}
          {skipped.length ? <p className="text-app-caption text-warning">Non letti (Word vecchio formato .doc o troppo grandi): {skipped.join(', ')}. Caricali in PDF per includerli.</p> : null}
          {SYNTHESIS_FIELDS.map((f) => (
            <label key={f.key} className="flex flex-col gap-1">
              <span className="label-mono text-muted-foreground">{f.label}</span>
              <Textarea value={sections[f.key]} onChange={(e) => setSections({ ...sections, [f.key]: e.target.value })} rows={3} />
            </label>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={handleImport} className={btnClass}>
              <FileBarChart2 className="size-3.5 shrink-0" aria-hidden="true" />
              Riporta nel Report finale valutativo
            </button>
            {imported && (
              <span className="flex items-center gap-1.5 text-app-caption font-medium text-success">
                <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                Riportato: aprilo da «Report Finale Valutativo» per rivederlo e completarlo.
              </span>
            )}
          </div>
        </>
      )}
      {confirmDialog}
    </div>
  )
}
