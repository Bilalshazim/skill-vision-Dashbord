import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import { CvMatchDialog } from '@/modules/recruiting/cv/CvMatchDialog'
import { CvOpenButton } from '@/modules/recruiting/cv/CvOpenButton'
import { setCandidateEmailWithBackendSync } from '@/modules/recruiting/lib/backend-sync'
import type { Candidate } from '@/modules/recruiting/lib/types'

const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

type SaveState = { kind: 'idle' } | { kind: 'pending' } | { kind: 'error'; message: string } | { kind: 'warning'; message: string }
const IDLE: SaveState = { kind: 'idle' }

// One row = one pending candidate. Migrated from renderPaginaA()'s
// per-candidate row markup (modules/recruiting.html ~2259-2272).
//
// The candidate NAME is the click target in legacy
// (`<span class="nm-link" onclick="openCvMatchModal(...)">`), opening the
// same CV Match modal CvMatchDialog.tsx already implements (Phase 6-9).
// CvMatchDialog owns its own self-contained trigger button (see
// cv/CvMatchDialog.tsx) rather than accepting an externally supplied
// trigger element, and this phase must not fork or modify that
// already-proven component — so, exactly like ranking/RankingCard.tsx
// already does for this same legacy modal, it is mounted here as its own
// small control next to the name rather than making the name text itself
// clickable. Same component, same reuse, same precedent already accepted
// elsewhere in this migration. The ICV badge below is still migrated as
// its own separate element (matching legacy's `🎯 ${c.icv}%`) even though
// CvMatchDialog's own trigger button also happens to mention the match
// percentage — that repetition is an honest byproduct of reusing an
// existing, unmodified component rather than something invented here.
export function PaginaACandidateRow({
  candidate,
  selected,
  onToggleSelect,
  onMutated,
}: {
  candidate: Candidate
  selected: boolean
  onToggleSelect: (checked: boolean) => void
  onMutated: () => void
}) {
  const [emailInput, setEmailInput] = useState(candidate.email || '')
  const [state, setState] = useState<SaveState>(IDLE)
  const pending = state.kind === 'pending'

  // Native <input onchange> (legacy) only fires when the value actually
  // changed between focus and blur; a React onBlur fires on every blur
  // regardless. This comparison re-creates that missing distinction rather
  // than writing (and bumping refreshKey) on every no-op blur.
  //
  // setCandidateEmailWithBackendSync() always writes the local mirror
  // first and never reverts it on a backend failure (§15's write-through
  // discipline) — it only adds a best-effort PATCH to the backend
  // Candidate record for candidates that are actually backend-linked, so
  // "INVIA LINK TEST" (which reads candidate.email from the BACKEND record
  // at send time, not this local one) uses what the recruiter just typed.
  // A backend-sync failure is shown as a non-blocking warning, not an
  // error — the local value is still saved and usable everywhere else.
  async function handleBlur() {
    const trimmed = emailInput.trim()
    setEmailInput(trimmed)
    if (trimmed === (candidate.email || '')) return
    setState({ kind: 'pending' })
    const result = await setCandidateEmailWithBackendSync(candidate.id, trimmed)
    if (!result.ok) {
      const message =
        result.reason === 'candidate-not-found'
          ? 'Candidato non trovato — potrebbe essere stato rimosso altrove.'
          : `Impossibile salvare: ${result.message}`
      setState({ kind: 'error', message })
      return
    }
    if (result.backendSync === 'failed') {
      setState({ kind: 'warning', message: `Salvato localmente — sincronizzazione col server non riuscita: ${result.backendMessage}` })
      onMutated()
      return
    }
    setState(IDLE)
    onMutated()
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-0">
      <label
        className="flex shrink-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
        title="Promosso al test"
      >
        <input type="checkbox" checked={selected} onChange={(e) => onToggleSelect(e.target.checked)} className="size-4 shrink-0 cursor-pointer accent-ring" />
        Promosso al test
      </label>

      <div className="min-w-[160px] flex-1">
        <div className="text-[13px] font-semibold">{candidate.name}</div>
        <div className="text-[11px] text-muted-foreground">{candidate.src || ''}</div>
        <div className="mt-1">
          <CvMatchDialog candidate={candidate} />
        </div>
      </div>

      <div className="shrink-0 font-mono text-[15px] font-semibold text-primary" title="Match CV/Profilo di Lavoro (solo CV)">
        {candidate.icv}%
      </div>

      <div className="flex shrink-0 flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onBlur={handleBlur}
            disabled={pending}
            placeholder="email@dominio.it"
            className={cn(inputClass, 'w-[190px]')}
          />
          {pending && <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />}
        </div>
        {state.kind === 'error' && <p className="max-w-[190px] text-[10.5px] font-medium text-destructive">{state.message}</p>}
        {state.kind === 'warning' && <p className="max-w-[190px] text-[10.5px] font-medium text-warning">{state.message}</p>}
      </div>

      <CvOpenButton candidate={candidate} className="shrink-0" />
    </div>
  )
}
