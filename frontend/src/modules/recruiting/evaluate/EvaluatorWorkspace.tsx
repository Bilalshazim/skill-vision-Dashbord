import { AlertTriangle, CheckCircle2, ClipboardList, Loader2, Send, UserCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ApiError } from '@/lib/api/client'
import { evaluatorsApi } from '@/lib/api/endpoints'
import { useBackendSession } from '@/lib/api/useBackendSession'
import type { BackendMyAssignment } from '@/lib/api/endpoints'
import type { BackendEvaluator } from '@/lib/api/types'
import { EmptyState } from '@/modules/recruiting/components/EmptyState'

const ROLE_LABEL: Record<string, string> = { HR: 'HR', MANAGER: 'Manager', DIRETTORE_HR: 'Direttore HR', ALTRO: 'Altro' }

const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
// See admin/CipAdminPage.tsx's identical comment — 'default' size (not
// 'sm') since this was already the page's main Save/Submit action, at the
// larger px-4/py-2 scale.
const primaryBtnClass = buttonVariants({ size: 'default' })
const ghostBtnClass = buttonVariants({ variant: 'outline', size: 'default' })

function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.network) return 'Impossibile contattare il server.'
    if (err.status === 401) return 'Link non valido o scaduto — il token di accesso non è più utilizzabile.'
    if (err.status === 403) return 'Non hai accesso a questa valutazione.'
    return err.message
  }
  return err instanceof Error ? err.message : 'Errore sconosciuto'
}

type LoadState = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; evaluator: BackendEvaluator; assignments: BackendMyAssignment[] }

// Phase 33 §4/§5/§6 — the evaluator-facing UI Phase 30's backend already
// supported (POST /evaluators/evaluations, .../submit, both dual-auth via
// resolveEvaluatorAccess — JWT OR X-Evaluator-Token) but had NO screen for
// until now, plus the two new read routes this phase adds
// (GET /evaluators/me, /me/assignments — see backend/src/modules/
// evaluators/routes.ts). `evaluatorToken`, when given, is forwarded on
// every call instead of the bearer JWT — this component itself never
// decides which auth mode is "correct", it just uses whichever one its
// caller (RecruitingEvaluatePage / EvaluateStandalonePage) hands it, and
// the backend is the sole authority on whether that's actually allowed.
export function EvaluatorWorkspace({ evaluatorToken }: { evaluatorToken?: string }) {
  // The JWT path (no evaluatorToken — reached via /recruiting/evaluate,
  // nested under RecruitingLayout) depends on the shell->backend bridge
  // having resolved first (see CipAdminPage's identical comment for why a
  // route nested under <Outlet/> needs its OWN reactive session check, not
  // a one-time read at mount). The scoped-token path (standalone
  // /evaluate?evaluatorToken=…) has no such dependency — the token is
  // already everything this component needs, synchronously, from the URL
  // — so it never waits on `backend.status` at all.
  const backend = useBackendSession()
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  async function load() {
    setState({ kind: 'loading' })
    try {
      const [evaluator, assignments] = await Promise.all([evaluatorsApi.me(evaluatorToken), evaluatorsApi.myAssignments(evaluatorToken)])
      setState({ kind: 'ready', evaluator, assignments })
      setSelectedId((prev) => prev ?? assignments[0]?.campaignCandidateId ?? null)
    } catch (err) {
      setState({ kind: 'error', message: apiErrorMessage(err) })
    }
  }

  useEffect(() => {
    if (!evaluatorToken && backend.status === 'checking') return
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluatorToken, backend.status])

  if (state.kind === 'loading') {
    return (
      <div className="flex items-center gap-2 py-8 text-[13px] text-muted-foreground">
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
        Caricamento…
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-5">
        <p className="flex items-start gap-2 text-[13.5px] font-medium text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      </div>
    )
  }

  const { evaluator, assignments } = state
  const selected = assignments.find((a) => a.campaignCandidateId === selectedId) || null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary px-4 py-3">
        <UserCircle2 className="size-8 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold">{evaluator.fullName}</div>
          <div className="text-[11.5px] text-muted-foreground">
            Ruolo: <b className="font-semibold text-foreground">{ROLE_LABEL[evaluator.role] || evaluator.role}</b>
            {evaluator.altroLabel ? ` (${evaluator.altroLabel})` : ''}
          </div>
        </div>
      </div>

      {!assignments.length ? (
        <EmptyState icon={ClipboardList} text="Nessuna valutazione assegnata al momento." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
          <div className="flex flex-col gap-1.5">
            {assignments.map((a) => (
              <button
                key={a.campaignCandidateId}
                type="button"
                onClick={() => setSelectedId(a.campaignCandidateId)}
                className={cn(
                  'flex flex-col items-start gap-0.5 rounded-md border px-3 py-2.5 text-left text-[12.5px] transition-colors',
                  a.campaignCandidateId === selectedId ? 'border-primary/30 bg-primary/10' : 'border-border hover:border-ring',
                )}
              >
                <span className="font-semibold text-foreground">{a.candidate.fullName}</span>
                <span className="text-[11px] text-muted-foreground">
                  {a.companyName} · {a.campaignName}
                </span>
                <span
                  className={cn(
                    'mt-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide',
                    a.myEvaluation?.status === 'SUBMITTED' ? 'bg-success/12 text-success' : a.myEvaluation ? 'bg-warning/12 text-warning' : 'bg-secondary text-muted-foreground',
                  )}
                >
                  {a.myEvaluation?.status === 'SUBMITTED' ? 'Inviata' : a.myEvaluation ? 'Bozza' : 'Da compilare'}
                </span>
              </button>
            ))}
          </div>

          {selected && <EvaluationForm key={selected.campaignCandidateId} assignment={selected} evaluatorToken={evaluatorToken} onSubmitted={load} />}
        </div>
      )}
    </div>
  )
}

const RECOMMENDATIONS: { value: 'PROCEDI' | 'RISERVA' | 'CONFRONTA' | 'NO'; label: string }[] = [
  { value: 'PROCEDI', label: 'Procedi' },
  { value: 'RISERVA', label: 'Riserva' },
  { value: 'CONFRONTA', label: 'Confronta' },
  { value: 'NO', label: 'No' },
]

function EvaluationForm({ assignment, evaluatorToken, onSubmitted }: { assignment: BackendMyAssignment; evaluatorToken?: string; onSubmitted: () => void }) {
  const existing = assignment.myEvaluation
  const isSubmitted = existing?.status === 'SUBMITTED'

  const [finalScore, setFinalScore] = useState(existing?.finalScore != null ? String(existing.finalScore) : '')
  const [recommendation, setRecommendation] = useState(existing?.recommendation || '')
  const [notes, setNotes] = useState(existing?.notes || '')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  async function handleSave() {
    if (saving || isSubmitted) return
    setSaving(true)
    setError('')
    setSavedMessage('')
    try {
      await evaluatorsApi.submitEvaluation(
        {
          campaignCandidateId: assignment.campaignCandidateId,
          finalScore: finalScore.trim() ? Number(finalScore) : undefined,
          recommendation: recommendation || undefined,
          notes: notes.trim() || undefined,
        },
        evaluatorToken,
      )
      setSavedMessage('Bozza salvata ✓')
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit() {
    if (submitting || isSubmitted) return
    setSubmitting(true)
    setError('')
    try {
      // Save whatever is currently on screen first, so "Invia" always
      // submits the latest edits — never a stale draft from a previous save.
      const draft = await evaluatorsApi.submitEvaluation(
        {
          campaignCandidateId: assignment.campaignCandidateId,
          finalScore: finalScore.trim() ? Number(finalScore) : undefined,
          recommendation: recommendation || undefined,
          notes: notes.trim() || undefined,
        },
        evaluatorToken,
      )
      await evaluatorsApi.finalizeEvaluation(draft.id, evaluatorToken)
      onSubmitted()
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-5">
      <div className="mb-3">
        <div className="text-[15px] font-semibold">{assignment.candidate.fullName}</div>
        <div className="text-[12px] text-muted-foreground">
          {assignment.companyName} · {assignment.campaignName}
        </div>
      </div>

      {isSubmitted ? (
        <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/10 px-3.5 py-3 text-[13px] text-success">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div>
            <div className="font-semibold">Valutazione già inviata — non modificabile.</div>
            {existing?.finalScore != null && <div className="mt-1 text-foreground">Punteggio: {existing.finalScore}</div>}
            {existing?.recommendation && <div className="text-foreground">Raccomandazione: {RECOMMENDATIONS.find((r) => r.value === existing.recommendation)?.label}</div>}
            {existing?.notes && <div className="mt-1 text-muted-foreground">{existing.notes}</div>}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-muted-foreground">
            Punteggio finale
            <input type="number" step="0.1" value={finalScore} onChange={(e) => setFinalScore(e.target.value)} placeholder="es. 4.5" className={cn(inputClass, 'w-[140px]')} />
          </label>
          <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-muted-foreground">
            Raccomandazione
            <select value={recommendation} onChange={(e) => setRecommendation(e.target.value)} className={cn(inputClass, 'w-[200px]')}>
              <option value="">—</option>
              {RECOMMENDATIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-muted-foreground">
            Note
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className={inputClass} />
          </label>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button type="button" onClick={handleSave} disabled={saving || submitting} className={ghostBtnClass}>
              {saving ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : null}
              Salva bozza
            </button>
            <button type="button" onClick={handleSubmit} disabled={saving || submitting} className={primaryBtnClass}>
              {submitting ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Send className="size-3.5 shrink-0" aria-hidden="true" />}
              Invia valutazione
            </button>
            {savedMessage && <span className="text-[12px] font-medium text-success">{savedMessage}</span>}
          </div>
          {error && (
            <p className="flex items-start gap-1.5 text-[12px] font-medium text-destructive">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
