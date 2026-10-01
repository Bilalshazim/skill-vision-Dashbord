import { Loader2, Trophy } from 'lucide-react'
import { useState } from 'react'

import { InlineAlert } from '@/components/patterns/InlineAlert'
import { SelectField } from '@/components/patterns/SelectField'
import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/patterns/EmptyState'
import { clearPipelineWinner, confirmPipelineWinner, getWinnerCandidates, plDateFmt } from '@/modules/recruiting/lib/pipeline'
import type { Interview, PipelineWinner } from '@/modules/recruiting/lib/types'

// Legacy gives "Conferma vincitore" its own gold treatment (.btn-gold,
// modules/recruiting.css ~228-229), distinct from the plain teal .btn-act
// every other "+ Aggiungi..." button uses — reproduced here as the
// --warning token (the app's semantic gold/amber) rather than --primary.
const goldBtnClass = buttonVariants({ variant: 'warning', size: 'sm' })

type ActionState = { kind: 'idle' } | { kind: 'pending' } | { kind: 'error'; message: string }
const IDLE: ActionState = { kind: 'idle' }

const OPENING_UNAVAILABLE_MESSAGE = "La posizione selezionata non è più disponibile — selezionane un'altra dalla dashboard qui sopra."

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
        <div className="flex items-center gap-3 rounded-sm border border-success/30 bg-success/10 px-4 py-3">
          <Trophy className="size-5 shrink-0 text-success" aria-hidden="true" />
          <div>
            <div className="text-app-small font-semibold">{winner.name}</div>
            <div className="text-app-caption text-muted-foreground">deciso il {plDateFmt(winner.decidedAt)}</div>
          </div>
        </div>
      ) : (
        <EmptyState size="sm" icon={Trophy} description="Nessun vincitore selezionato." />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <SelectField value={selected} onValueChange={(v) => setSelected(v)} disabled={pending} size="sm" className="max-w-60">
          <option value="">{candidates.length ? 'Seleziona candidato intervistato…' : '(nessun candidato intervistato)'}</option>
          {candidates.map((r) => (
            <option key={r.id} value={r.candidateId || r.id}>
              {r.name || '—'}
            </option>
          ))}
        </SelectField>
        <button type="button" onClick={handleConfirm} disabled={pending} className={goldBtnClass}>
          {pending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Trophy className="size-3.5 shrink-0" aria-hidden="true" />}
          Conferma vincitore
        </button>
      </div>
      {state.kind === 'error' && <InlineAlert layout="text" className="mt-2">{state.message}</InlineAlert>}
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
      <Button
        type="button"
        onClick={handleClear}
        disabled={pending}
        variant="outline"
        size="sm"
      >
        {pending && <Loader2 className="size-3 shrink-0 animate-spin" aria-hidden="true" />}
        Annulla decisione
      </Button>
      {state.kind === 'error' && <InlineAlert layout="text" className="mt-2">{state.message}</InlineAlert>}
    </div>
  )
}
