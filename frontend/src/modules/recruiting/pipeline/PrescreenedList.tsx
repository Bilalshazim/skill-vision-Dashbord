import { CheckCircle2, Clock3, Link2, Loader2, Plus, RefreshCw, Search, SendHorizonal, Star, Trash2, XCircle } from 'lucide-react'
import { useState } from 'react'

import { InlineAlert } from '@/components/patterns/InlineAlert'
import { Checkbox } from '@/components/ui/checkbox'
import { SelectField } from '@/components/patterns/SelectField'
import { Input } from '@/components/ui/input'
import { Hint } from '@/components/patterns/Hint'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/patterns/EmptyState'
import { CvInlineViewerButton } from '@/modules/recruiting/cv/CvInlineViewerButton'
import { addPrescreenedEntry, plDateFmt, removePrescreenedCandidate, setPrescreenStatus } from '@/modules/recruiting/lib/pipeline'
import { addToShortlistViaBackend, markSentViaBackend, patchPrescreenedBackendId, refreshShortlistStatuses } from '@/modules/recruiting/lib/backend-sync'
import { getCachedBackendLink } from '@/modules/recruiting/lib/backend-link'
import { readCandidates } from '@/modules/recruiting/lib/storage'
import type { CandidatePoolEntry, PrescreenedEntry, PrescreenStatus } from '@/modules/recruiting/lib/types'
import { cn } from '@/lib/utils'

// Same three-state semantics as legacy's own _psBadge() mapping for this
// exact screen (modules/recruiting.html ~2046, _psBadge def ~5327):
// completato='pass'(green), inviato='unknown'(amber/gold), da_inviare=
// 'fail'(red). Intentionally NOT the same coloring CvMatchDialog.tsx uses
// for these same status values (warning/success/success) — that dialog is
// a different legacy screen (the CV Match modal) with its own actual
// legacy behavior, already verified in Phase 7/8. Each screen reproduces
// its OWN real legacy behavior rather than being normalized to match the
// other.
// Phase 31 §8 — 'ha_risposto'/'non_ha_risposto' added: real backend
// ShortlistStatus values (see lib/types.ts's PrescreenStatus comment),
// only ever reached by refreshing from the server, never set locally.
const STATUS_STYLE: Record<PrescreenStatus, { icon: typeof Clock3; label: string; tone: BadgeTone }> = {
  da_inviare: { icon: Clock3, label: 'Da inviare', tone: 'destructive' },
  // Local-only status set by Pagina A's manual-send fallback when no mail
  // provider is configured — see lib/types.ts's PrescreenStatus comment.
  // Reachable here too since both screens read the SAME prescreened
  // records; "Segna inviato" below still works on it like any other
  // pre-send state.
  link_pronto: { icon: Link2, label: 'Link pronto', tone: 'warning' },
  inviato: { icon: SendHorizonal, label: 'Test inviato', tone: 'warning' },
  completato: { icon: CheckCircle2, label: 'Test completato', tone: 'success' },
  ha_risposto: { icon: CheckCircle2, label: 'Ha risposto', tone: 'success' },
  non_ha_risposto: { icon: XCircle, label: 'Non ha risposto', tone: 'destructive' },
}

// This can only actually fire if the Pipeline-selected opening is deleted
// (elsewhere) between render and click — PipelinePage never renders this
// component without an already-resolved opening. Unlike CvMatchDialog's
// equivalent guard (which points to the CV & Esportazione page, since
// that's genuinely where its activeContext selector lives), Pipeline's own
// selector is right there on this same page — so the remedy points here,
// not to a different screen.
const OPENING_UNAVAILABLE_MESSAGE = "La posizione selezionata non è più disponibile — selezionane un'altra dalla dashboard qui sopra."

const primaryBtnClass = buttonVariants({ size: 'sm' })

type ActionState = { kind: 'idle' } | { kind: 'pending' } | { kind: 'error'; message: string }
const IDLE: ActionState = { kind: 'idle' }

// Migrated from renderPipelineDetail()'s "🔎 Pre-screened CV" section
// (modules/recruiting.html ~2035-2051) plus its two "add" controls
// (addPrescreenedFromPool()/addPrescreenedManual(), ~2159-2177). PHASE
// 11C-1 wires up: + Dall&apos;archivio CV, + Aggiungi manual, "Segna inviato", "✕"
// remove — each calling the same lib/pipeline.ts functions Phase 7-9
// already proved, with an explicit `target: {companyId, openingId}` so
// they operate on THIS Pipeline-selected opening rather than activeContext
// (see pipeline.ts's own comments on each function for the dual-resolution
// mechanism). "Segna completato" and letter preview/copy remain
// unimplemented — the former per the Phase 8/10 blocker (completeCandidateTest()
// cascades into a CANDIDATES-mutating, fake-score-generating side effect),
// the latter because its dependency (CONFIG.testDispatch.coverLetter)
// isn't ported and this phase doesn't expand scope to add it.
export function PrescreenedList({
  entries,
  candidatePool,
  companyId,
  openingId,
  onMutated,
}: {
  entries: PrescreenedEntry[]
  candidatePool: CandidatePoolEntry[]
  companyId: string
  openingId: string
  onMutated: () => void
}) {
  const target = { companyId, openingId }
  // Phase 31 §8/§10 — present only once this opening has a resolved backend
  // Campaign (lib/backend-link.ts) — i.e. at least one CV has gone through
  // the backend upload flow for it. Drives the bulk "Aggiorna stato" button
  // below; individual rows use their own backendShortlistId regardless.
  const backendCampaignId = getCachedBackendLink(openingId)?.campaignId

  const [poolSelection, setPoolSelection] = useState('')
  const [poolState, setPoolState] = useState<ActionState>(IDLE)
  const [manualName, setManualName] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [manualState, setManualState] = useState<ActionState>(IDLE)
  const [rowState, setRowState] = useState<Record<string, ActionState>>({})
  const [refreshState, setRefreshState] = useState<ActionState>(IDLE)

  const poolPending = poolState.kind === 'pending'
  const manualPending = manualState.kind === 'pending'

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
  function opErrorMessage(result: { ok: false; reason: string; message?: string }): string {
    if (result.reason === 'no-active-opening') return OPENING_UNAVAILABLE_MESSAGE
    if (result.reason === 'entry-not-found') return 'Voce di preselezione non trovata — potrebbe essere stata rimossa altrove.'
    return `Impossibile salvare: ${result.message ?? 'errore sconosciuto'}`
  }

  // "+ Dall&apos;archivio CV" — same call shape as addPrescreenedFromPool()
  // (modules/recruiting.html ~2159-2167): candidateId/name/email from the
  // pool record, auto/matchScore both omitted (status stays 'da_inviare').
  function handlePoolAdd() {
    if (poolPending) return
    const rec = candidatePool.find((r) => r.id === poolSelection)
    if (!rec) {
      setPoolState({ kind: 'error', message: 'Seleziona un candidato dall’archivio.' })
      return
    }
    setPoolState({ kind: 'pending' })
    const result = addPrescreenedEntry(rec.id, rec.name || rec.id, rec.email || '', false, undefined, target)
    if (!result.ok) {
      setPoolState({ kind: 'error', message: opErrorMessage(result) })
      return
    }
    setPoolSelection('')
    setPoolState(IDLE)
    onMutated()
  }

  // "+ Aggiungi" manual — same call shape as addPrescreenedManual()
  // (modules/recruiting.html ~2168-2177): NO candidateId (the new record's
  // own id becomes its candidateId — see addPrescreenedEntry()'s own
  // comment on this synthetic-identity fallback; not "fixed" here).
  function handleManualAdd() {
    if (manualPending) return
    const trimmedName = manualName.trim()
    if (!trimmedName) {
      setManualState({ kind: 'error', message: 'Inserisci il nome del candidato.' })
      return
    }
    setManualState({ kind: 'pending' })
    const result = addPrescreenedEntry('', trimmedName, manualEmail.trim(), false, undefined, target)
    if (!result.ok) {
      setManualState({ kind: 'error', message: opErrorMessage(result) })
      return
    }
    setManualName('')
    setManualEmail('')
    setManualState(IDLE)
    onMutated()
  }

  async function handleMarkSent(recordId: string) {
    if (rowState[recordId]?.kind === 'pending') return
    setRow(recordId, { kind: 'pending' })

    const entry = entries.find((r) => r.id === recordId)
    if (entry?.backendShortlistId) {
      const backendResult = await markSentViaBackend(entry.backendShortlistId)
      if (!backendResult.ok) {
        setRow(recordId, { kind: 'error', message: `Impossibile aggiornare lo stato sul server: ${backendResult.message}` })
        return
      }
    }

    const result = setPrescreenStatus(recordId, 'inviato', target)
    if (!result.ok) {
      setRow(recordId, { kind: 'error', message: opErrorMessage(result) })
      return
    }
    setRow(recordId, IDLE)
    onMutated()
  }

  // §10 — pull side of "reflect the updated state after refresh/reload":
  // no real webhook exists to push a change (§11 has no provider wired),
  // so this asks the backend directly for every shortlist row under this
  // opening's linked campaign and reconciles local status to match.
  async function handleRefreshStatuses() {
    if (!backendCampaignId || refreshState.kind === 'pending') return
    setRefreshState({ kind: 'pending' })
    const result = await refreshShortlistStatuses(backendCampaignId, openingId)
    if (!result.ok) {
      setRefreshState({ kind: 'error', message: result.message })
      return
    }
    setRefreshState(IDLE)
    onMutated()
  }

  function handleRemove(recordId: string) {
    if (rowState[recordId]?.kind === 'pending') return
    setRow(recordId, { kind: 'pending' })
    const result = removePrescreenedCandidate(recordId, target)
    if (!result.ok) {
      setRow(recordId, { kind: 'error', message: opErrorMessage(result) })
      return
    }
    clearRow(recordId)
    onMutated()
  }

  // Client §4 — "Selezionato per approfondimento": flags a candidate into
  // the real Shortlist (Migliori Candidati) as DA_INVIARE, without sending
  // a test yet (that's the separate "Invia Lettera e Link Test" trigger on
  // Migliori Candidati itself, §5). Only usable once this candidate has a
  // backendCampaignCandidateId — i.e. went through the real backend CV
  // upload flow (lib/backend-sync.ts's uploadCvViaBackend) — a candidate
  // added here manually or from the local pool has nothing to shortlist on
  // the server yet.
  async function handleFlagForReview(entryId: string, candidateId: string) {
    if (rowState[entryId]?.kind === 'pending') return
    const backendCampaignCandidateId = readCandidates().find((c) => c.id === candidateId)?.backendCampaignCandidateId
    if (!backendCampaignCandidateId) {
      setRow(entryId, { kind: 'error', message: 'Candidato non ancora collegato al server — carica il CV dalla pagina CV & Esportazione.' })
      return
    }
    setRow(entryId, { kind: 'pending' })
    const result = await addToShortlistViaBackend(candidateId, backendCampaignCandidateId)
    if (!result.ok) {
      setRow(entryId, { kind: 'error', message: result.message })
      return
    }
    patchPrescreenedBackendId(openingId, entryId, result.backendShortlistId)
    setRow(entryId, IDLE)
    onMutated()
  }

  return (
    <div>
      {backendCampaignId && (
        <div className="mb-3 flex items-center justify-end">
          <Button
            type="button"
            onClick={handleRefreshStatuses}
            disabled={refreshState.kind === 'pending'}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={cn('size-3 shrink-0', refreshState.kind === 'pending' && 'animate-spin')} aria-hidden="true" />
            Aggiorna stato dal server
          </Button>
        </div>
      )}
      {refreshState.kind === 'error' && <InlineAlert layout="text" className="mt-2">{refreshState.message}</InlineAlert>}

      <div className="mb-3 flex flex-col gap-2 rounded-sm bg-secondary p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SelectField
            value={poolSelection}
            onValueChange={(v) => setPoolSelection(v)}
            disabled={poolPending || !candidatePool.length}
            size="sm" className="max-w-56"
          >
            <option value="">{candidatePool.length ? 'Seleziona dall’archivio CV…' : '(nessun candidato in archivio per questa posizione)'}</option>
            {candidatePool.map((rec) => (
              <option key={rec.id} value={rec.id}>
                {rec.name || rec.id}
              </option>
            ))}
          </SelectField>
          <button type="button" onClick={handlePoolAdd} disabled={poolPending || !candidatePool.length} className={primaryBtnClass}>
            {poolPending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Plus className="size-3.5 shrink-0" aria-hidden="true" />}
            Dall&apos;archivio CV
          </button>
          <span className="text-app-caption text-muted-foreground">oppure</span>
          <Input
            type="text"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            disabled={manualPending}
            placeholder="Nome candidato"
            size="sm" className="w-36"
 />
          <Input
            type="text"
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
            disabled={manualPending}
            placeholder="Email (opz.)"
            size="sm" className="w-40"
 />
          <button type="button" onClick={handleManualAdd} disabled={manualPending} className={primaryBtnClass}>
            {manualPending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Plus className="size-3.5 shrink-0" aria-hidden="true" />}
            Aggiungi
          </button>
        </div>
        {poolState.kind === 'error' && <InlineAlert layout="text" className="mt-2">{poolState.message}</InlineAlert>}
        {manualState.kind === 'error' && <InlineAlert layout="text" className="mt-2">{manualState.message}</InlineAlert>}
      </div>

      {!entries.length ? (
        <EmptyState size="sm" icon={Search} description="Nessun candidato ancora in preselezione per questa posizione." />
      ) : (
        <div>
          {/* Client §4 — "sorted by ranking match percentage (including low
              % match candidates)": descending by matchScore, nothing
              filtered out; a candidate with no score yet (null) sorts
              last rather than being excluded. */}
          {(() => {
            const allCandidates = readCandidates()
            return [...entries]
              .sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1))
              .map((r) => {
            const status = STATUS_STYLE[r.status]
            const state = rowState[r.id] ?? IDLE
            const pending = state.kind === 'pending'
            const candidate = allCandidates.find((c) => c.id === r.candidateId)
            return (
              <div key={r.id} className="border-b border-border py-3 last:border-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-app-small font-semibold">
                      {r.name || '—'}
                      {r.autoSent && (
                        <Badge tone="success">
                          auto
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 text-app-caption text-muted-foreground">
                      {r.email || '—'} · aggiunto {plDateFmt(r.addedAt)}
                      {Number.isFinite(r.matchScore) ? (
                        <>
                          {' '}
                          · match CV/Profilo <b className="font-semibold text-foreground">{r.matchScore}%</b>
                        </>
                      ) : null}
                    </div>
                    <a
                      href={r.testLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-block break-all text-app-caption text-foreground hover:underline dark:text-primary"
                    >
                      {r.testLink}
                    </a>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <label
                      className={cn(
                        'label-mono flex items-center gap-1.5 whitespace-nowrap',
                        r.backendShortlistId ? 'text-success' : 'text-muted-foreground',
                      )}
                      title="Aggiunge il candidato a Migliori Candidati, senza inviare ancora il test"
                    >
                      <Checkbox
                        checked={!!r.backendShortlistId}
                        disabled={pending || !!r.backendShortlistId}
                        onCheckedChange={() => handleFlagForReview(r.id, r.candidateId)}
 />
                      <Star className="size-3 shrink-0" aria-hidden="true" />
                      Selezionato per approfondimento
                    </label>
                    <CvInlineViewerButton backendCvId={candidate?.backendCvId} candidateName={r.name || '—'} />
                    <Badge tone={status.tone}>
                      <status.icon className="size-3 shrink-0" aria-hidden="true" />
                      {status.label}
                    </Badge>
                    {(r.status === 'da_inviare' || r.status === 'link_pronto') && (
                      <Button
                        type="button"
                        onClick={() => handleMarkSent(r.id)}
                        disabled={pending}
                        variant="outline"
                        size="sm"
                      >
                        {pending ? <Loader2 className="size-3 shrink-0 animate-spin" aria-hidden="true" /> : null}
                        Segna inviato
                      </Button>
                    )}
                    <Hint label="Rimuovi dalla preselezione">
                      <Button
                        type="button"
                        onClick={() => handleRemove(r.id)}
                        disabled={pending}
                        aria-label="Rimuovi dalla preselezione"
                        variant="destructive"
                        size="icon-sm"
                      >
                        {pending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Trash2 className="size-3.5 shrink-0" aria-hidden="true" />}
                      </Button>
                    </Hint>
                  </div>
                </div>
                {state.kind === 'error' && <InlineAlert layout="text" className="mt-2">{state.message}</InlineAlert>}
              </div>
            )
              })
          })()}
        </div>
      )}
    </div>
  )
}
