import { CheckCircle2, Clock3, Loader2, MessageSquare, Plus, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { InlineAlert } from '@/components/patterns/InlineAlert'
import { SelectField } from '@/components/patterns/SelectField'
import { Input } from '@/components/ui/input'
import { Hint } from '@/components/patterns/Hint'
import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/patterns/EmptyState'
import { addInterview, plDateFmt, removeInterview, saveInterviewScorecard } from '@/modules/recruiting/lib/pipeline'
import type { Interview, TestResult } from '@/modules/recruiting/lib/types'
import { cn } from '@/lib/utils'

// See admin/CipAdminPage.tsx's identical comment.
const primaryBtnClass = buttonVariants({ size: 'sm' })

type ActionState = { kind: 'idle' } | { kind: 'pending' } | { kind: 'error'; message: string }
const IDLE: ActionState = { kind: 'idle' }

// Same message CvMatchDialog/PrescreenedList/TestResultList use for this
// defensive, effectively-unreachable-in-normal-use case (the Pipeline
// selected opening deleted elsewhere between render and click).
const OPENING_UNAVAILABLE_MESSAGE = "La posizione selezionata non è più disponibile — selezionane un'altra dalla dashboard qui sopra."

// One row = one interview's display + its always-editable scorecard form —
// legacy renders the same select/input/save button for every interview
// regardless of `completed` (modules/recruiting.html ~2078-2087), there is
// no separate read-only vs. edit mode. A dedicated component (rather than a
// flat per-id state map, as PrescreenedList/TestResultList use for their
// single-field actions) because this row owns two local form fields plus
// its own pending/error state.
function InterviewRow({
  interview,
  companyId,
  openingId,
  onMutated,
}: {
  interview: Interview
  companyId: string
  openingId: string
  onMutated: () => void
}) {
  const target = { companyId, openingId }

  // Legacy's star <select> marks NO <option> as `selected` when
  // overall===null (Number(null)===0 matches none of 1-5, ~2081), so the
  // browser silently defaults to the first option — value 1 — both visually
  // AND as what gets submitted if "Salva scorecard" is clicked without
  // touching the select. Reproduced exactly: the initial value here is "1"
  // for a fresh interview, not left blank/unset.
  const [overallInput, setOverallInput] = useState(String(interview.scorecard?.overall ?? 1))
  const [notesInput, setNotesInput] = useState(interview.scorecard?.notes || '')
  const [state, setState] = useState<ActionState>(IDLE)
  const pending = state.kind === 'pending'

  function handleSave() {
    if (pending) return
    setState({ kind: 'pending' })
    const result = saveInterviewScorecard(interview.id, overallInput, notesInput, target)
    if (!result.ok) {
      const message =
        result.reason === 'no-active-opening'
          ? OPENING_UNAVAILABLE_MESSAGE
          : result.reason === 'interview-not-found'
            ? 'Colloquio non trovato — potrebbe essere stato rimosso altrove.'
            : `Impossibile salvare: ${result.message}`
      setState({ kind: 'error', message })
      return
    }
    setState(IDLE)
    onMutated()
  }

  function handleRemove() {
    if (pending) return
    setState({ kind: 'pending' })
    const result = removeInterview(interview.id, target)
    if (!result.ok) {
      const message = result.reason === 'no-active-opening' ? OPENING_UNAVAILABLE_MESSAGE : `Impossibile rimuovere: ${result.message}`
      setState({ kind: 'error', message })
      return
    }
    onMutated()
  }

  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-app-small font-semibold">{interview.name || '—'}</div>
          <div className="text-app-caption text-muted-foreground">Colloquio: {plDateFmt(interview.scheduledAt)}</div>
        </div>
        <div className={cn('inline-flex items-center gap-1.5 text-app-caption font-medium', interview.completed ? 'text-success' : 'text-warning')}>
          {interview.completed ? <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" /> : <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />}
          {interview.completed ? 'Scorecard compilata' : 'In attesa di scorecard'}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-app-caption text-muted-foreground">
          Valutazione
          <SelectField value={overallInput} onValueChange={(v) => setOverallInput(v)} disabled={pending} size="sm">
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} / 5
              </option>
            ))}
          </SelectField>
        </label>
        <Input
          type="text"
          value={notesInput}
          onChange={(e) => setNotesInput(e.target.value)}
          disabled={pending}
          placeholder="Note del colloquio…"
          size="sm" className="min-w-40 flex-1"
 />
        <Button
          type="button"
          onClick={handleSave}
          disabled={pending}
          variant="secondary"
          size="sm"
        >
          {pending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Save className="size-3.5 shrink-0" aria-hidden="true" />}
          Salva scorecard
        </Button>
        <Hint label="Rimuovi">
          <Button
            type="button"
            onClick={handleRemove}
            disabled={pending}
            aria-label="Rimuovi colloquio"
            variant="destructive"
            size="icon-sm"
          >
            {pending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Trash2 className="size-3.5 shrink-0" aria-hidden="true" />}
          </Button>
        </Hint>
      </div>
      {state.kind === 'error' && <InlineAlert layout="text" className="mt-2">{state.message}</InlineAlert>}
    </div>
  )
}

// Migrated from renderPipelineDetail()'s "🗣 Colloqui" section (modules/
// recruiting.html ~2069-2088, addInterview()/saveInterviewScorecard()/
// removeInterview() ~2404-2439). PHASE 11C-3 wires up all three actions.
//
// Candidate source for "+ Aggiungi colloquio": THIS opening's
// pipeline.testResults — every result, no filter (confirmed by reading
// renderPipelineDetail()'s testedOptions, ~2032) — not prescreened, not
// CANDIDATES. The <select>'s value is the test RESULT's own id; submitting
// looks it up to pull candidateId/name, exactly like Test Results' own
// relationship to Prescreened (see lib/pipeline.ts addInterview()).
export function InterviewList({
  interviews,
  testResults,
  companyId,
  openingId,
  onMutated,
}: {
  interviews: Interview[]
  testResults: TestResult[]
  companyId: string
  openingId: string
  onMutated: () => void
}) {
  const target = { companyId, openingId }

  const [candidateId, setCandidateId] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [addState, setAddState] = useState<ActionState>(IDLE)
  const addPending = addState.kind === 'pending'

  function handleAdd() {
    if (addPending) return
    setAddState({ kind: 'pending' })
    const result = addInterview(candidateId, dateInput, target)
    if (!result.ok) {
      const message =
        result.reason === 'no-active-opening'
          ? OPENING_UNAVAILABLE_MESSAGE
          : result.reason === 'candidate-not-found'
            ? 'Seleziona un candidato testato.'
            : `Impossibile salvare: ${result.message}`
      setAddState({ kind: 'error', message })
      return
    }
    setCandidateId('')
    setDateInput('')
    setAddState(IDLE)
    onMutated()
  }

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 rounded-sm bg-secondary p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SelectField value={candidateId} onValueChange={(v) => setCandidateId(v)} disabled={addPending} size="sm" className="max-w-56">
            <option value="">{testResults.length ? 'Seleziona candidato testato…' : '(nessun candidato testato)'}</option>
            {testResults.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name || '—'} — {r.score}/100
              </option>
            ))}
          </SelectField>
          <Input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} disabled={addPending} size="sm" />
          <button type="button" onClick={handleAdd} disabled={addPending} className={primaryBtnClass}>
            {addPending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Plus className="size-3.5 shrink-0" aria-hidden="true" />}
            Aggiungi colloquio
          </button>
        </div>
        {addState.kind === 'error' && <InlineAlert layout="text" className="mt-2">{addState.message}</InlineAlert>}
      </div>

      {!interviews.length ? (
        <EmptyState size="sm" icon={MessageSquare} description="Nessun colloquio ancora programmato." />
      ) : (
        <div>
          {interviews.map((r) => (
            <InterviewRow key={r.id} interview={r} companyId={companyId} openingId={openingId} onMutated={onMutated} />
          ))}
        </div>
      )}
    </div>
  )
}
