import { AlertTriangle, Loader2, Trophy } from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/modules/recruiting/components/EmptyState'
import { clearPipelineWinner, confirmPipelineWinner, getWinnerCandidates, plDateFmt } from '@/modules/recruiting/lib/pipeline'
import type { Interview, PipelineWinner } from '@/modules/recruiting/lib/types'
import { cn } from '@/lib/utils'

const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
// Legacy gives "Conferma vincitore" its own gold treatment (.btn-gold,
// modules/recruiting.css ~228-229), distinct from the plain teal .btn-act
// every other "+ Aggiungi..." button uses — reproduced here as the
// --warning token (the app's semantic gold/amber) rather than --primary.
const goldBtnClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-warning/40 bg-warning/15 px-3 py-1.5 text-[11.5px] font-bold text-foreground transition-colors hover:bg-warning/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60'

type ActionState = { kind: 'idle' } | { kind: 'pending' } | { kind: 'error'; message: string }
const IDLE: ActionState = { kind: 'idle' }

const OPENING_UNAVAILABLE_MESSAGE = "La posizione selezionata non è più disponibile — selezionane un'altra dalla dashboard qui sopra."

function ErrorNote({ message }: { message: string }) {
  return (
    <p className="mt-1.5 flex items-start gap-1.5 text-[11.5px] font-medium text-destructive">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  )
}

// Migrated from renderPipelineDetail()'s "🏆 Candidato vincitore" section
// (modules/recruiting.html ~2149-2155, confirmPipelineWinner() ~2441-2453).
// The current-winner display (Trophy + name + date) is additive, matching
// Phase 11B's original read-only version — legacy has no such display of
// its own in THIS card (only the header banner shows it), but showing it
// here too, right next to the control that changes it, is harmless and was
// already an accepted design choice; the "Annulla decisione" clear button
// stays where legacy actually puts it (the header banner) — see
// ClearWinnerButton below, used from PipelineDetail.tsx.
//
// Eligible candidate source: getWinnerCandidates(interviews) in
// lib/pipeline.ts (completed interviews preferred, ALL interviews if none
// are completed yet) — the exact same computation confirmPipelineWinner()
// itself re-validates against at write time.
export function WinnerCard({
  winner,
  interviews,
  companyId,
  openingId,
  onMutated,
}: {
  winner: PipelineWinner | null
  interviews: Interview[]
  companyId: string
  openingId: string
  onMutated: () => void
}) {
  const target = { companyId, openingId }
  const candidates = getWinnerCandidates(interviews)

  const [selected, setSelected] = useState('')
  const [state, setState] = useState<ActionState>(IDLE)
  const pending = state.kind === 'pending'

  function handleConfirm() {
    if (pending) return
    setState({ kind: 'pending' })
    const result = confirmPipelineWinner(selected, target)
    if (!result.ok) {
      const message =
        result.reason === 'no-active-opening'
          ? OPENING_UNAVAILABLE_MESSAGE
          : result.reason === 'candidate-not-found'
            ? 'Seleziona un candidato intervistato.'
            : `Impossibile salvare: ${result.message}`
      setState({ kind: 'error', message })
      return
    }
    setState(IDLE)
    onMutated()
  }

  return (
    <div className="flex flex-col gap-3">
      {winner ? (
        <div className="flex items-center gap-3 rounded-md border border-success/30 bg-success/10 px-4 py-3">
          <Trophy className="size-5 shrink-0 text-success" aria-hidden="true" />
          <div>
            <div className="text-[13.5px] font-semibold">{winner.name}</div>
            <div className="text-[11.5px] text-muted-foreground">deciso il {plDateFmt(winner.decidedAt)}</div>
          </div>
        </div>
      ) : (
        <EmptyState icon={Trophy} text="Nessun vincitore selezionato." />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select value={selected} onChange={(e) => setSelected(e.target.value)} disabled={pending} className={cn(inputClass, 'max-w-[240px]')}>
          <option value="">{candidates.length ? 'Seleziona candidato intervistato…' : '(nessun candidato intervistato)'}</option>
          {candidates.map((r) => (
            <option key={r.id} value={r.candidateId || r.id}>
              {r.name || '—'}
            </option>
          ))}
        </select>
        <button type="button" onClick={handleConfirm} disabled={pending} className={goldBtnClass}>
          {pending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Trophy className="size-3.5 shrink-0" aria-hidden="true" />}
          Conferma vincitore
        </button>
      </div>
      {state.kind === 'error' && <ErrorNote message={state.message} />}
    </div>
  )
}

// The header winner banner's "Annulla decisione" button (modules/
// recruiting.html ~2108) — kept as its own small component since it lives
// in a different card (PipelineDetail's header, not this file's bottom
// "Candidato vincitore" card) but shares the same clearPipelineWinner()
// contract. Rendered only when a winner exists, matching legacy's own
// conditional banner (`${p.winner ? ... : ''}`).
export function ClearWinnerButton({ companyId, openingId, onMutated }: { companyId: string; openingId: string; onMutated: () => void }) {
  const [state, setState] = useState<ActionState>(IDLE)
  const pending = state.kind === 'pending'

  function handleClear() {
    if (pending) return
    setState({ kind: 'pending' })
    const result = clearPipelineWinner({ companyId, openingId })
    if (!result.ok) {
      const message = result.reason === 'no-active-opening' ? OPENING_UNAVAILABLE_MESSAGE : `Impossibile annullare: ${result.message}`
      setState({ kind: 'error', message })
      return
    }
    setState(IDLE)
    onMutated()
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClear}
        disabled={pending}
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && <Loader2 className="size-3 shrink-0 animate-spin" aria-hidden="true" />}
        Annulla decisione
      </button>
      {state.kind === 'error' && <ErrorNote message={state.message} />}
    </div>
  )
}
