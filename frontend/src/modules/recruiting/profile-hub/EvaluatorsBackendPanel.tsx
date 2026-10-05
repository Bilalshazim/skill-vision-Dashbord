import { AlertTriangle, CheckCircle2, ChevronDown, Copy, FileBarChart2, Loader2, Mail, Sparkles, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { SelectField } from '@/components/patterns/SelectField'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/hooks/use-confirm'
import { cn } from '@/lib/utils'
import { candidatesApi, campaignsApi, evaluatorsApi } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/client'
import type { BackendCampaignEvaluator } from '@/lib/api/endpoints'
import type { BackendCampaignCandidate, BackendEvaluation, BackendEvaluatorRole } from '@/lib/api/types'
import { getCachedBackendLink } from '@/modules/recruiting/lib/backend-link'
import { getActiveOpening } from '@/modules/recruiting/lib/pipeline'
import { readCvMatchingState } from '@/modules/recruiting/lib/storage'
import { EmptyState } from '@/components/patterns/EmptyState'
import { EvaluationFormsView } from '@/modules/recruiting/evaluate/EvaluationFormsView'
import { RECOMMENDATION_LABEL } from '@/modules/recruiting/lib/evaluation-forms'
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
    if (!backendCampaignId || sending || selected.size === 0) return
    const n = selected.size
    if (!(await confirm({ title: `Inviare le schede a ${n} ${n === 1 ? 'valutatore' : 'valutatori'}?`, description: 'Ognuno riceve un’email con il suo link personale, valido 14 giorni. Se ne aveva già uno, quello precedente smette di funzionare.', confirmLabel: 'Invia email' }))) return
    setSending(true)
    setError('')
    try {
      const { results } = await evaluatorsApi.sendForms(backendCampaignId, [...selected])
      setSendResults(Object.fromEntries(results.map((r) => [r.evaluatorId, { ok: r.ok, reason: r.reason }])))
      setSelected(new Set(results.filter((r) => !r.ok).map((r) => r.evaluatorId)))
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
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleSendForms} disabled={sending || selected.size === 0} className={btnClass}>
            {sending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Mail className="size-3.5 shrink-0" aria-hidden="true" />}
            Invia le schede via email{selected.size ? ` (${selected.size})` : ''}
          </button>
          <span className="text-app-caption text-muted-foreground">Spunta i valutatori: ricevono il link alla Scheda Intervista Strutturata e alla Scheda Valutazione Candidato.</span>
        </div>
      )}

      <EvaluatorResultsSection campaignId={backendCampaignId} roster={roster} onReportChanged={onReportChanged} />
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
function EvaluatorResultsSection({ campaignId, roster, onReportChanged }: { campaignId: string; roster: BackendCampaignEvaluator[]; onReportChanged?: () => void }) {
  const [open, setOpen] = useState(false)
  const [candidates, setCandidates] = useState<BackendCampaignCandidate[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [evaluations, setEvaluations] = useState<BackendEvaluation[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openDetail, setOpenDetail] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    candidatesApi.campaignRoster(campaignId).then(setCandidates).catch(() => setCandidates([]))
  }, [open, campaignId])

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
  }, [selectedId])

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
          <SelectField value={selectedId} onValueChange={(v) => setSelectedId(v)} size="sm" className="max-w-72">
            <option value="">{candidates.length ? 'Seleziona un candidato…' : '(nessun candidato in questa campagna)'}</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.candidate?.fullName || c.id}
              </option>
            ))}
          </SelectField>

          {loading && <Loader2 className="mt-3 size-4 animate-spin text-muted-foreground" aria-hidden="true" />}
          {error && (
            <p className="mt-2 flex items-start gap-1.5 text-app-caption font-medium text-destructive">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          {evaluations && !loading && (
            <div className="mt-3 flex flex-col gap-2">
              {!evaluations.length ? (
                <EmptyState size="sm" icon={Users} description="Nessuna valutazione ancora inserita per questo candidato." />
              ) : (
                roster.map((r, i) => {
                  const evalu = evaluations.find((e) => e.evaluatorId === r.id)
                  const submitted = evalu?.status === 'SUBMITTED'
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
                            {submitted && (
                              <button type="button" onClick={() => setOpenDetail(openDetail === r.id ? null : r.id)} aria-expanded={openDetail === r.id} className="font-semibold text-foreground hover:underline dark:text-primary">
                                {openDetail === r.id ? 'Chiudi le schede' : 'Apri le schede →'}
                              </button>
                            )}
                          </span>
                        ) : (
                          <span className="text-app-caption text-muted-foreground">Non ancora compilata</span>
                        )}
                      </div>
                      {submitted && openDetail === r.id && (
                        <div className="border-t border-border pt-3">
                          <EvaluationFormsView scores={evalu.scores} />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
              {evaluations.length > 0 && submittedCount > 0 && selectedCandidate && (
                <SynthesisPanel campaignCandidateId={selectedId} candidateName={selectedCandidate.candidate?.fullName || ''} submittedCount={submittedCount} onReportChanged={onReportChanged} />
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
function SynthesisPanel({ campaignCandidateId, candidateName, submittedCount, onReportChanged }: { campaignCandidateId: string; candidateName: string; submittedCount: number; onReportChanged?: () => void }) {
  const [sections, setSections] = useState<SynthesisSections | null>(null)
  const [used, setUsed] = useState(0)
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
      setUsed(r.evaluationsUsed)
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
            Generata dall’IA sulle {submittedCount} {submittedCount === 1 ? 'valutazione inviata' : 'valutazioni inviate'}: verificala prima di usarla. All’IA non vanno il nome del candidato né quelli dei valutatori.
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
          {used < submittedCount && <p className="text-app-caption text-muted-foreground">La sintesi è basata su {used} valutazioni.</p>}
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
