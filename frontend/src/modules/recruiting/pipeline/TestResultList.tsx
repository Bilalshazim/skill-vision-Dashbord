import { AlertTriangle, FileCheck2, Loader2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/modules/recruiting/components/EmptyState'
import { addTestResult, removeTestResult } from '@/modules/recruiting/lib/pipeline'
import { recordManualResponseViaBackend, deleteManualResponseViaBackend } from '@/modules/recruiting/lib/backend-sync'
import type { PrescreenedEntry, TestResult } from '@/modules/recruiting/lib/types'
import { cn } from '@/lib/utils'

const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
const primaryBtnClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11.5px] font-bold text-foreground transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60'

type ActionState = { kind: 'idle' } | { kind: 'pending' } | { kind: 'error'; message: string }
const IDLE: ActionState = { kind: 'idle' }

// This can only fire if the Pipeline-selected opening is deleted elsewhere
// between render and click — same reasoning as PrescreenedList.tsx's
// equivalent message, reused verbatim for consistency between the two
// sections.
const OPENING_UNAVAILABLE_MESSAGE = "La posizione selezionata non è più disponibile — selezionane un'altra dalla dashboard qui sopra."

function ErrorNote({ message }: { message: string }) {
  return (
    <p className="mt-1.5 flex items-start gap-1.5 text-[11.5px] font-medium text-destructive">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  )
}

// Migrated from renderPipelineDetail()'s "📝 Ranking post-test" section
// (modules/recruiting.html ~2126-2136, addTestResult()/removeTestResult()
// ~2378-2402). PHASE 11C-2 wires up "+ Aggiungi risultato" and "✕" — same
// controlled-write architecture as PrescreenedList.tsx (Phase 11C-1): fresh
// read, explicit Pipeline target, refresh via onMutated() on success.
//
// Candidate source: THIS opening's pipeline.prescreened array (every
// record, regardless of status — legacy applies no status filter here,
// confirmed by reading renderPipelineDetail()'s prescreenedOptions, ~2030),
// not candidatePool and not CANDIDATES. Selecting one and submitting an
// empty score field does NOT block submission — Number('') is 0, which
// legacy (and this port) treats as a valid, finite score of 0. See
// lib/pipeline.ts addTestResult() for the full replace-on-add contract.
export function TestResultList({
  results,
  prescreened,
  companyId,
  openingId,
  onMutated,
}: {
  results: TestResult[]
  prescreened: PrescreenedEntry[]
  companyId: string
  openingId: string
  onMutated: () => void
}) {
  const target = { companyId, openingId }

  const [candidateId, setCandidateId] = useState('')
  const [scoreInput, setScoreInput] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [addState, setAddState] = useState<ActionState>(IDLE)
  const [rowState, setRowState] = useState<Record<string, ActionState>>({})

  const addPending = addState.kind === 'pending'

  function setRow(id: string, state: ActionState) {
    setRowState((s) => ({ ...s, [id]: state }))
  }
  function clearRow(id: string) {
    setRowState((s) => {
      if (!(id in s)) return s
      const next = { ...s }
      delete next[id]
      return next
    })
  }

  // Phase 32 §6 — calls the real backend first (ReceivedVia.MANUAL, see
  // shortlist/routes.ts) when the selected pre-screened record is
  // backend-linked, then mirrors via the existing local addTestResult()
  // exactly as before — same write-through pattern as every other migrated
  // action this phase and the last.
  async function handleAdd() {
    if (addPending) return
    setAddState({ kind: 'pending' })

    const selectedEntry = prescreened.find((r) => r.id === candidateId)
    if (selectedEntry?.backendShortlistId) {
      const score = Math.max(0, Math.min(100, Math.round(Number(scoreInput))))
      if (!Number.isFinite(score)) {
        setAddState({ kind: 'error', message: 'Inserisci un punteggio valido (0-100).' })
        return
      }
      const backendResult = await recordManualResponseViaBackend(selectedEntry.backendShortlistId, score, noteInput.trim() || undefined)
      if (!backendResult.ok) {
        setAddState({ kind: 'error', message: `Impossibile salvare sul server: ${backendResult.message}` })
        return
      }
    }

    const result = addTestResult(candidateId, scoreInput, noteInput, target)
    if (!result.ok) {
      const message =
        result.reason === 'no-active-opening'
          ? OPENING_UNAVAILABLE_MESSAGE
          : result.reason === 'candidate-not-found'
            ? 'Seleziona un candidato pre-screened.'
            : result.reason === 'invalid-score'
              ? 'Inserisci un punteggio valido (0-100).'
              : `Impossibile salvare: ${result.message}`
      setAddState({ kind: 'error', message })
      return
    }
    setCandidateId('')
    setScoreInput('')
    setNoteInput('')
    setAddState(IDLE)
    onMutated()
  }

  async function handleRemove(resultId: string) {
    if (rowState[resultId]?.kind === 'pending') return
    setRow(resultId, { kind: 'pending' })

    const result0 = results.find((r) => r.id === resultId)
    const linkedEntry = result0 ? prescreened.find((p) => p.candidateId === result0.candidateId) : undefined
    if (linkedEntry?.backendShortlistId) {
      const backendResult = await deleteManualResponseViaBackend(linkedEntry.backendShortlistId)
      if (!backendResult.ok) {
        setRow(resultId, { kind: 'error', message: `Impossibile rimuovere sul server: ${backendResult.message}` })
        return
      }
    }

    const result = removeTestResult(resultId, target)
    if (!result.ok) {
      const message = result.reason === 'no-active-opening' ? OPENING_UNAVAILABLE_MESSAGE : `Impossibile rimuovere: ${result.message}`
      setRow(resultId, { kind: 'error', message })
      return
    }
    clearRow(resultId)
    onMutated()
  }

  const ranked = [...results].sort((a, b) => b.score - a.score)

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 rounded-md bg-secondary p-3">
        <div className="flex flex-wrap items-center gap-2">
          <select value={candidateId} onChange={(e) => setCandidateId(e.target.value)} disabled={addPending} className={cn(inputClass, 'max-w-[220px]')}>
            <option value="">{prescreened.length ? 'Seleziona candidato…' : '(nessun candidato in pre-screening)'}</option>
            {prescreened.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name || '—'}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            max={100}
            value={scoreInput}
            onChange={(e) => setScoreInput(e.target.value)}
            disabled={addPending}
            placeholder="Punteggio 0-100"
            className={cn(inputClass, 'w-[130px]')}
          />
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            disabled={addPending}
            placeholder="Nota (opz.)"
            className={cn(inputClass, 'w-[160px]')}
          />
          <button type="button" onClick={handleAdd} disabled={addPending} className={primaryBtnClass}>
            {addPending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Plus className="size-3.5 shrink-0" aria-hidden="true" />}
            Aggiungi risultato
          </button>
        </div>
        {addState.kind === 'error' && <ErrorNote message={addState.message} />}
      </div>

      {!ranked.length ? (
        <EmptyState icon={FileCheck2} text="Nessun risultato di test ancora registrato." />
      ) : (
        <div>
          {ranked.map((r, i) => {
            const state = rowState[r.id] ?? IDLE
            const pending = state.kind === 'pending'
            return (
              <div key={r.id} className="border-b border-border py-2.5 last:border-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={i === 0 ? 'w-6 shrink-0 font-mono text-[15px] font-semibold text-warning' : 'w-6 shrink-0 font-mono text-[15px] font-semibold text-muted-foreground'}>
                      #{i + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold">{r.name || '—'}</div>
                      {r.note && <div className="truncate text-[11px] text-muted-foreground">{r.note}</div>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-[14px] font-semibold text-foreground tabular-nums dark:text-primary">{r.score}/100</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(r.id)}
                      disabled={pending}
                      title="Rimuovi"
                      aria-label="Rimuovi risultato test"
                      className="inline-flex items-center justify-center rounded-md border border-border p-1.5 text-destructive transition-colors hover:border-destructive/40 hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Trash2 className="size-3.5 shrink-0" aria-hidden="true" />}
                    </button>
                  </div>
                </div>
                {state.kind === 'error' && <ErrorNote message={state.message} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
