import { AlertTriangle, CheckCircle2, ChevronDown, Copy, Loader2, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { candidatesApi, campaignsApi, evaluatorsApi } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/client'
import type { BackendCampaignEvaluator } from '@/lib/api/endpoints'
import type { BackendCampaignCandidate, BackendEvaluation, BackendEvaluatorRole } from '@/lib/api/types'
import { getCachedBackendLink } from '@/modules/recruiting/lib/backend-link'
import { getActiveOpening } from '@/modules/recruiting/lib/pipeline'
import { readCvMatchingState } from '@/modules/recruiting/lib/storage'
import { EmptyState } from '@/modules/recruiting/components/EmptyState'

const ROLES: { value: BackendEvaluatorRole; label: string }[] = [
  { value: 'HR', label: 'HR' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'DIRETTORE_HR', label: 'Direttore HR' },
  { value: 'ALTRO', label: 'Altro' },
]
const ROLE_LABEL = new Map(ROLES.map((r) => [r.value, r.label]))

const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
const btnClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11.5px] font-semibold text-foreground transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60'

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
export function EvaluatorsBackendPanel() {
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

  if (!opening) return <p className="text-[12px] text-muted-foreground">Seleziona prima una company/opening nella pagina CV & Esportazione.</p>
  if (!backendCampaignId)
    return (
      <p className="text-[12px] text-muted-foreground">
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
        className="inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-[11.5px] font-semibold text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
      >
        <Users className="size-3.5 shrink-0" aria-hidden="true" />
        Apri la mia area valutatore
      </Link>

      {readiness && (
        <div className={cn('flex items-center gap-1.5 text-[12px] font-medium', readiness.meetsMinimum ? 'text-success' : 'text-warning')}>
          <Users className="size-3.5 shrink-0" aria-hidden="true" />
          {readiness.assignedEvaluators} valutatori assegnati {readiness.meetsMinimum ? '— minimo raggiunto (3) ✓' : '— minimo richiesto: 3'}
        </div>
      )}
      {loadError && (
        <p className="flex items-start gap-1.5 text-[11.5px] font-medium text-destructive">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {loadError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-md bg-secondary p-3">
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome valutatore" disabled={pending} className={inputClass} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" disabled={pending} className={inputClass} />
        <select value={role} onChange={(e) => setRole(e.target.value as BackendEvaluatorRole)} disabled={pending} className={inputClass}>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        {role === 'ALTRO' && <input value={altroLabel} onChange={(e) => setAltroLabel(e.target.value)} placeholder="Specifica ruolo" disabled={pending} className={inputClass} />}
        <button type="button" onClick={handleCreate} disabled={pending} className={btnClass}>
          {pending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <UserPlus className="size-3.5 shrink-0" aria-hidden="true" />}
          Aggiungi e assegna
        </button>
      </div>

      {error && (
        <p className="flex items-start gap-1.5 text-[11.5px] font-medium text-destructive">
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
              <div key={r.id} className="flex flex-col gap-1 rounded-md border border-border p-2.5 text-[12px]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <b className="font-semibold text-foreground">
                      Valutatore {i + 1} — {ROLE_LABEL.get(r.role) || r.role}
                    </b>
                    {r.altroLabel ? ` (${r.altroLabel})` : ''} · {r.fullName} · {r.email}
                    {r.hasLogin && <span className="ml-1.5 text-muted-foreground">· accesso con login</span>}
                  </span>
                  {!r.hasLogin && !r.hasAccessToken && !token && (
                    <button type="button" onClick={() => handleIssueToken(r.id)} disabled={pending} className={btnClass}>
                      Genera token di accesso
                    </button>
                  )}
                  {!r.hasLogin && r.hasAccessToken && !token && <span className="text-[11px] text-muted-foreground">Token già generato</span>}
                </div>
                {token && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
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
                    <Link to={`/evaluate?evaluatorToken=${encodeURIComponent(token)}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Apri come valutatore →
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <EvaluatorResultsSection campaignId={backendCampaignId} roster={roster} />
    </div>
  )
}

// Phase 35 §1/§4 — "admin can see evaluator assignments/results" and
// "verify the admin view can distinguish them": picks one candidate in
// this campaign and shows every assigned evaluator's OWN independent
// evaluation (score/recommendation/status) side by side — the same
// already-company-scoped read the rest of this codebase uses
// (evaluatorsApi.listForCampaignCandidate), just surfaced here instead of
// only existing as an API call nothing in the UI showed yet.
function EvaluatorResultsSection({ campaignId, roster }: { campaignId: string; roster: BackendCampaignEvaluator[] }) {
  const [open, setOpen] = useState(false)
  const [candidates, setCandidates] = useState<BackendCampaignCandidate[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [evaluations, setEvaluations] = useState<BackendEvaluation[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    candidatesApi.campaignRoster(campaignId).then(setCandidates).catch(() => setCandidates([]))
  }, [open, campaignId])

  useEffect(() => {
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

  return (
    <div className="rounded-md border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[12.5px] font-semibold text-foreground"
      >
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', !open && '-rotate-90')} aria-hidden="true" />
        Risultati per candidato
      </button>
      {open && (
        <div className="border-t border-border p-3">
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className={cn(inputClass, 'max-w-[280px]')}>
            <option value="">{candidates.length ? 'Seleziona un candidato…' : '(nessun candidato in questa campagna)'}</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.candidate?.fullName || c.id}
              </option>
            ))}
          </select>

          {loading && <Loader2 className="mt-3 size-4 animate-spin text-muted-foreground" aria-hidden="true" />}
          {error && (
            <p className="mt-2 flex items-start gap-1.5 text-[11.5px] font-medium text-destructive">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          {evaluations && !loading && (
            <div className="mt-3 flex flex-col gap-2">
              {!evaluations.length ? (
                <EmptyState icon={Users} text="Nessuna valutazione ancora inserita per questo candidato." />
              ) : (
                roster.map((r, i) => {
                  const evalu = evaluations.find((e) => e.evaluatorId === r.id)
                  return (
                    <div key={r.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-[12px]">
                      <span>
                        <b className="font-semibold text-foreground">
                          Valutatore {i + 1} — {ROLE_LABEL.get(r.role) || r.role}
                        </b>{' '}
                        · {r.fullName}
                      </span>
                      {evalu ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                            evalu.status === 'SUBMITTED' ? 'bg-success/12 text-success' : 'bg-warning/12 text-warning',
                          )}
                        >
                          {evalu.status === 'SUBMITTED' ? `Inviata${evalu.finalScore != null ? ` · ${evalu.finalScore}` : ''}` : 'Bozza'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Non ancora compilata</span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
