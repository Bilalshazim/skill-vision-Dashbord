import { AlertTriangle, CheckCircle2, Clock3, Loader2, RefreshCw, Send, Target, Trash2, Workflow, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { EssentialSkillBars } from '@/modules/recruiting/components/EssentialSkillBars'
import { DEFAULT_FLAGS, DEFAULT_MATCH_THRESHOLD, DEFAULT_ROLE } from '@/modules/recruiting/lib/constants'
import { addPrescreenedEntry, getActiveOpening, removePrescreenedCandidate, setPrescreenStatus } from '@/modules/recruiting/lib/pipeline'
import { linkExistingCandidateToBackend, markSentViaBackend, refreshShortlistStatuses, sendTestLinkViaBackend } from '@/modules/recruiting/lib/backend-sync'
import { readCvMatchingState } from '@/modules/recruiting/lib/storage'
import type { Candidate, PrescreenedEntry } from '@/modules/recruiting/lib/types'

const ESSENTIAL_SKILLS = Object.entries(DEFAULT_FLAGS)
  .filter(([, lv]) => lv === 3)
  .map(([sk]) => sk)

// Legacy's own guard message for this exact failure (sendCvMatchTestLink,
// modules/recruiting.html line 3076) — reused verbatim rather than invented.
const NO_ACTIVE_OPENING_MESSAGE = 'Seleziona prima una company/opening nella pagina CV & Esportazione'

// Phase 30 §9 / decision sheet: renamed from "Invia link test ora" (the
// button this dialog already had) to "INVIA LINK TEST" — confirmed to be
// the button Roberto meant; the label lives here as its own constant, not
// inline in the JSX, exactly so it can change again later (e.g. if OD-6's
// screen naming affects it) without touching the button's behavior.
const SEND_TEST_LINK_LABEL = 'INVIA LINK TEST'

type WriteState = { kind: 'idle' } | { kind: 'pending' } | { kind: 'error'; message: string }

// Migrated from openCvMatchModal() (modules/recruiting.html ~3029-3069).
// PHASE 6 migrated the read-only display. PHASE 7 added the "Invia link
// test ora" write (addPrescreenedEntry). PHASE 8 added the "Segna inviato"
// write (setPrescreenStatus) for a record that already exists with status
// 'da_inviare' — e.g. one created by the legacy Pipeline screen's manual
// "+ Aggiungi" flow (auto=false), which this dialog can now also mark as
// sent. PHASE 9 adds the remove ("✕") action (removePrescreenedCandidate) —
// shown whenever a prescreened record exists, matching legacy's own button
// placement (unconditional, no confirmation prompt — legacy has none
// either). Marking a test "completato" is NOT available here — see
// lib/pipeline.ts setPrescreenStatus() for exactly why (it cascades into a
// separate, CANDIDATES-mutating side effect this phase deliberately does
// not implement).
//
// PHASE 22 — "Apri nella Pipeline" used to bridge to legacy (Pipeline
// wasn't migrated yet when this dialog was built). Pipeline has its own
// React route since Phase 11B, so this is now a real internal link to
// /recruiting/pipeline?companyId=&openingId= — the same query-param
// convention OpeningsList.tsx already uses to seed Pipeline's own local
// selection (never global activeContext). The underlying limitation this
// bridge existed for ("completato" isn't implemented) is unchanged and
// still real — the user just reaches the real Pipeline screen to hit it,
// instead of the legacy app.
export function CvMatchDialog({ candidate }: { candidate: Candidate }) {
  const [open, setOpen] = useState(false)
  const [already, setAlready] = useState<PrescreenedEntry | undefined>(undefined)
  const [writeState, setWriteState] = useState<WriteState>({ kind: 'idle' })
  const [activeIds, setActiveIds] = useState<{ companyId?: string; openingId?: string }>({})

  // Re-resolve "already prescreened for the active opening?" fresh every
  // time the dialog opens — same reasoning as the write functions' own
  // fresh read: the legacy app (or another tab) may have changed this
  // since the last time this component rendered.
  useEffect(() => {
    if (!open) return
    const { company, opening } = getActiveOpening(readCvMatchingState())
    setAlready(opening?.pipeline?.prescreened.find((p) => p.candidateId === candidate.id))
    setActiveIds({ companyId: company?.id, openingId: opening?.id })
    setWriteState({ kind: 'idle' })
  }, [open, candidate.id])

  const above = candidate.icv >= DEFAULT_MATCH_THRESHOLD
  const pending = candidate.testCompleted === false

  // Phase 31 §9 — INVIA LINK TEST calls the real backend shortlist +
  // send-test endpoints, requiring this candidate to be linked to a
  // backend CampaignCandidate (backendCampaignCandidateId — see
  // lib/backend-sync.ts). A candidate with none (legacy/local-only demo
  // data, an older seed record, or a candidate the backend link genuinely
  // couldn't reach) is NOT silently treated as sent — see the send-test
  // investigation: a local-only addPrescreenedEntry() write here used to
  // be indistinguishable in the UI from a real email actually going out.
  //
  // Existing-candidate backfill: rather than refusing outright, an unlinked
  // candidate is first run through linkExistingCandidateToBackend(), which
  // finds or creates the matching backend Candidate/CampaignCandidate (by
  // email, same de-dup rule as everywhere else) — no CV re-upload needed,
  // since send-test never reads one. Only if that genuinely can't produce
  // a link (no active opening, or a real backend error) does this fall
  // through to the same honest refusal as before.
  async function handleSendTestLink() {
    if (writeState.kind === 'pending') return // guard against double submission
    setWriteState({ kind: 'pending' })

    let campaignCandidateId = candidate.backendCampaignCandidateId
    if (!campaignCandidateId) {
      const linked = await linkExistingCandidateToBackend(candidate.id)
      if (!linked.ok) {
        const message = linked.reason === 'no-active-opening' ? NO_ACTIVE_OPENING_MESSAGE : `Email non inviata — impossibile collegare al server: ${linked.message}`
        setWriteState({ kind: 'error', message })
        return
      }
      campaignCandidateId = linked.candidate.backendCampaignCandidateId
      if (!campaignCandidateId) {
        setWriteState({ kind: 'error', message: 'Email non inviata — questo candidato non è collegato al server.' })
        return
      }
    }

    const backendResult = await sendTestLinkViaBackend(candidate.id, campaignCandidateId)
    if (!backendResult.ok) {
      setWriteState({ kind: 'error', message: `Invio non riuscito: ${backendResult.message}` })
      return
    }
    // RESEND FIX: a pending ("Da inviare") entry may already exist here —
    // e.g. created by uploadCvViaBackend()'s auto-send branch when the
    // candidate had no email yet (see backend-sync.ts). sendTestLinkViaBackend
    // just re-sent THE SAME backend shortlist row for real (it reuses the
    // stored backendShortlistId; a 409 "already sent" is treated as
    // idempotent success inside it), so the local entry must now read
    // 'inviato' — leaving it 'da_inviare' would be a false "to send" state
    // right after a real send. First-send (no entry yet) keeps the existing
    // addPrescreenedEntry(auto=true) behavior.
    if (already) {
      const marked = setPrescreenStatus(already.id, 'inviato')
      if (marked.ok) setAlready({ ...marked.entry, backendShortlistId: backendResult.backendShortlistId })
    } else {
      const result = addPrescreenedEntry(candidate.id, candidate.name, candidate.email || '', true, candidate.icv)
      if (result.ok) {
        setAlready({ ...result.entry, backendShortlistId: backendResult.backendShortlistId })
      }
    }
    setWriteState({ kind: 'idle' })
  }

  async function handleMarkSent() {
    if (!already || writeState.kind === 'pending') return
    setWriteState({ kind: 'pending' })

    if (already.backendShortlistId) {
      const backendResult = await markSentViaBackend(already.backendShortlistId)
      if (!backendResult.ok) {
        setWriteState({ kind: 'error', message: `Impossibile aggiornare lo stato sul server: ${backendResult.message}` })
        return
      }
    }

    const result = setPrescreenStatus(already.id, 'inviato')
    if (!result.ok) {
      const message =
        result.reason === 'no-active-opening'
          ? NO_ACTIVE_OPENING_MESSAGE
          : result.reason === 'entry-not-found'
            ? 'Voce di pre-screening non trovata — potrebbe essere stata rimossa altrove.'
            : `Impossibile salvare: ${result.message}`
      setWriteState({ kind: 'error', message })
      return
    }
    setAlready(result.entry)
    setWriteState({ kind: 'idle' })
  }

  function handleRemove() {
    if (!already || writeState.kind === 'pending') return
    setWriteState({ kind: 'pending' })
    const result = removePrescreenedCandidate(already.id)
    if (!result.ok) {
      const message = result.reason === 'no-active-opening' ? NO_ACTIVE_OPENING_MESSAGE : `Impossibile rimuovere: ${result.message}`
      setWriteState({ kind: 'error', message })
      return
    }
    // Legacy has no toast/confirmation here either — the row just
    // disappears from the list (renderPipelineScreen()'s only visible
    // effect). Reflecting that honestly: `already` goes back to undefined,
    // so the dialog naturally returns to its "not yet prescreened" state
    // (the "Invia link test ora" button) rather than showing an invented
    // "removed" message.
    setAlready(undefined)
    setWriteState({ kind: 'idle' })
  }

  // §10 — pull side of "React must reflect the updated state after
  // refresh/reload": no real test-provider webhook exists to push a
  // change, so this asks the backend directly for this candidate's current
  // shortlist status (ha_risposto/non_ha_risposto only ever arrive this
  // way, never set optimistically — see lib/backend-sync.ts).
  async function handleRefreshStatus() {
    if (!already?.backendShortlistId || !candidate.backendCampaignId || writeState.kind === 'pending') return
    setWriteState({ kind: 'pending' })
    const { opening } = getActiveOpening(readCvMatchingState())
    const result = await refreshShortlistStatuses(candidate.backendCampaignId, opening?.id || '')
    if (!result.ok) {
      setWriteState({ kind: 'error', message: `Impossibile aggiornare lo stato: ${result.message}` })
      return
    }
    const refreshed = opening?.id ? getActiveOpening(readCvMatchingState()).opening?.pipeline?.prescreened.find((p) => p.candidateId === candidate.id) : undefined
    if (refreshed) setAlready(refreshed)
    setWriteState({ kind: 'idle' })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-[11.5px] font-semibold text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <Target className="size-3.5 shrink-0" aria-hidden="true" />
          Match CV/Profilo: {candidate.icv}%
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{candidate.name}</DialogTitle>
          <DialogDescription>
            Ruolo: <b className="font-semibold text-foreground">{DEFAULT_ROLE}</b>
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 rounded-md border border-border bg-secondary p-4">
          <div className={cn('font-mono text-4xl font-bold', above ? 'text-success' : 'text-warning')}>{candidate.icv}%</div>
          <p className="text-[12.5px] text-muted-foreground">
            {above
              ? `✓ Sopra soglia (${DEFAULT_MATCH_THRESHOLD}%) — link test idoneo all'invio automatico`
              : `Sotto soglia (${DEFAULT_MATCH_THRESHOLD}%) — invio manuale`}
          </p>
        </div>

        <div>
          <div className="mb-2 text-[13px] font-semibold">Skill essenziali vs target</div>
          {pending ? (
            <p className="text-xs text-muted-foreground">
              Test soft skill non ancora completato — il dettaglio per skill sarà disponibile dopo il test (vedi Pagina
              A).
            </p>
          ) : (
            <EssentialSkillBars candidate={candidate} essentialSkills={ESSENTIAL_SKILLS} />
          )}
        </div>

        <DialogFooter className="flex-col items-stretch gap-3 border-t border-border pt-4 sm:items-end">
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {/* Real INVIA LINK TEST is offered both for a first send (no
                prescreened entry yet) and for a pending "Da inviare" entry
                whose auto-send was skipped at upload time (no email yet —
                see uploadCvViaBackend): sendTestLinkViaBackend reuses the
                entry's stored backendShortlistId, so this is a REAL resend
                of the same shortlist row, never a duplicate shortlist and
                never a local-only fake send. 'Segna inviato' stays for the
                out-of-band "I already sent it myself" marking. */}
            {(!already || already.status === 'da_inviare') && (
              <button
                type="button"
                onClick={handleSendTestLink}
                disabled={writeState.kind === 'pending'}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11.5px] font-semibold text-foreground transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {writeState.kind === 'pending' ? (
                  <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-3.5 shrink-0" aria-hidden="true" />
                )}
                {SEND_TEST_LINK_LABEL}
              </button>
            )}

            {already?.status === 'da_inviare' && (
              <>
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-warning">
                  <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
                  Da inviare
                </span>
                <button
                  type="button"
                  onClick={handleMarkSent}
                  disabled={writeState.kind === 'pending'}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11.5px] font-semibold text-foreground transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {writeState.kind === 'pending' ? (
                    <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="size-3.5 shrink-0" aria-hidden="true" />
                  )}
                  Segna inviato
                </button>
              </>
            )}

            {already?.status === 'inviato' && (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-success">
                <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                Candidato in pre-screening — link generato
              </span>
            )}

            {already?.status === 'completato' && (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-success">
                <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                Test completato
              </span>
            )}

            {/* Phase 31 §8/§10 — only ever reached by refreshing real
                backend state (see handleRefreshStatus above); never set by
                any local/optimistic write. */}
            {already?.status === 'ha_risposto' && (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-success">
                <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                Ha risposto
              </span>
            )}
            {already?.status === 'non_ha_risposto' && (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-destructive">
                <XCircle className="size-3.5 shrink-0" aria-hidden="true" />
                Non ha risposto
              </span>
            )}

            {already?.backendShortlistId && (
              <button
                type="button"
                onClick={handleRefreshStatus}
                disabled={writeState.kind === 'pending'}
                title="Aggiorna stato dal server"
                aria-label="Aggiorna stato dal server"
                className="inline-flex items-center justify-center rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={cn('size-3.5 shrink-0', writeState.kind === 'pending' && 'animate-spin')} aria-hidden="true" />
              </button>
            )}

            {already && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={writeState.kind === 'pending'}
                title="Rimuovi dal pre-screening"
                aria-label="Rimuovi dal pre-screening"
                className="inline-flex items-center justify-center rounded-md border border-border p-1.5 text-destructive transition-colors hover:border-destructive/40 hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {writeState.kind === 'pending' ? (
                  <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="size-3.5 shrink-0" aria-hidden="true" />
                )}
              </button>
            )}

            {activeIds.companyId && activeIds.openingId && (
              <Link
                to={`/recruiting/pipeline?companyId=${encodeURIComponent(activeIds.companyId)}&openingId=${encodeURIComponent(activeIds.openingId)}`}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-[11.5px] font-semibold text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <Workflow className="size-3.5 shrink-0" aria-hidden="true" />
                Apri nella Pipeline
              </Link>
            )}
          </div>

          {writeState.kind === 'error' && (
            <p className="flex items-start gap-1.5 text-[12px] font-medium text-destructive sm:justify-end">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {writeState.message}
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
