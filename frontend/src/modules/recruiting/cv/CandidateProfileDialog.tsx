import { AlertTriangle, CheckCircle2, ClipboardList, Loader2, Send } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { candidateProfilesApi } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/client'
import type { BackendCandidateProfile } from '@/lib/api/types'
import type { Candidate } from '@/modules/recruiting/lib/types'

const STATUS_LABEL: Record<BackendCandidateProfile['status'], string> = {
  DRAFT: 'Bozza',
  SAVED: 'Salvato',
  APPROVED: 'Approvato',
  PUBLICATION_READY: 'Pronto per la pubblicazione',
  PUBLISHED: 'Pubblicato',
}

type LoadState = { kind: 'idle' } | { kind: 'loading' } | { kind: 'ready'; profile: BackendCandidateProfile } | { kind: 'error'; message: string }

// Phase 31 §12 — PROFILO CANDIDATURA: the backend's real
// draft->saved->approved->publication_ready->published workflow
// (candidateProfiles module, Phase 30 §13), connected here for the first
// time — nothing in React had a candidate-profile screen before this
// (confirmed by the Phase 31 data-flow map). Only usable for a candidate
// created through the backend upload flow (has backendCampaignCandidateId)
// — see RankingCard.tsx for the guard. One content-serving GET drives both
// the "preview" below and whatever the eventual published page reads
// (Phase 30's own design — see candidateProfiles/routes.ts's comment on
// this), so there is no second copy of the content to drift.
export function CandidateProfileDialog({ candidate }: { candidate: Candidate }) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<LoadState>({ kind: 'idle' })
  const [notes, setNotes] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionPending, setActionPending] = useState(false)

  const campaignCandidateId = candidate.backendCampaignCandidateId

  useEffect(() => {
    if (!open || !campaignCandidateId) return
    setState({ kind: 'loading' })
    setActionError('')
    candidateProfilesApi
      .upsert(campaignCandidateId, {}) // idempotent GET-or-create: upsert with no content change if one already exists (backend PATCH-by-upsert semantics — see routes.ts)
      .then((profile) => {
        setState({ kind: 'ready', profile })
        setNotes(typeof profile.content?.notes === 'string' ? (profile.content.notes as string) : '')
      })
      .catch((err) => setState({ kind: 'error', message: err instanceof ApiError ? err.message : 'Errore sconosciuto' }))
  }, [open, campaignCandidateId])

  if (!campaignCandidateId) return null

  async function runAction<T>(action: () => Promise<T>, onSuccess: (result: T) => void) {
    if (actionPending) return
    setActionPending(true)
    setActionError('')
    try {
      onSuccess(await action())
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Errore sconosciuto')
    } finally {
      setActionPending(false)
    }
  }

  function handleSave() {
    if (!campaignCandidateId) return
    void runAction(
      () => candidateProfilesApi.upsert(campaignCandidateId, { notes }),
      (profile) => setState({ kind: 'ready', profile }),
    )
  }
  function handleApprove(profile: BackendCandidateProfile) {
    void runAction(
      () => candidateProfilesApi.approve(profile.id),
      (updated) => setState({ kind: 'ready', profile: updated }),
    )
  }
  function handlePublish(profile: BackendCandidateProfile) {
    void runAction(
      () => candidateProfilesApi.publish(profile.id),
      (updated) => setState({ kind: 'ready', profile: updated }),
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-[11.5px] font-semibold text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ClipboardList className="size-3.5 shrink-0" aria-hidden="true" />
          Profilo candidatura
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profilo candidatura — {candidate.name}</DialogTitle>
          <DialogDescription>Bozza → Salvato → Approvato → Pronto per pubblicazione → Pubblicato</DialogDescription>
        </DialogHeader>

        {state.kind === 'loading' && <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />}
        {state.kind === 'error' && (
          <p className="flex items-start gap-1.5 text-[12.5px] font-medium text-destructive">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {state.message}
          </p>
        )}

        {state.kind === 'ready' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-foreground">
              <CheckCircle2 className="size-3.5 shrink-0 text-success" aria-hidden="true" />
              Stato attuale: {STATUS_LABEL[state.profile.status]}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Note sul profilo candidatura (contenuto salvato sul server)…"
              className="rounded-md border border-border bg-background px-2.5 py-1.5 text-[12.5px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            {state.profile.publicationLink && (
              <p className="text-[11.5px] text-muted-foreground">
                Link pubblicazione: <code className="break-all rounded bg-secondary px-1 py-0.5">{state.profile.publicationLink}</code>
              </p>
            )}
          </div>
        )}

        <DialogFooter className="flex-col items-stretch gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end">
          {state.kind === 'ready' && (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={actionPending}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11.5px] font-semibold text-foreground transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionPending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : null}
                Salva
              </button>
              {state.profile.status === 'SAVED' && (
                <button
                  type="button"
                  onClick={() => handleApprove(state.profile)}
                  disabled={actionPending}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-[11.5px] font-semibold text-muted-foreground transition-colors hover:border-ring hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Approva
                </button>
              )}
              {(state.profile.status === 'APPROVED' || state.profile.status === 'PUBLICATION_READY') && (
                <button
                  type="button"
                  onClick={() => handlePublish(state.profile)}
                  disabled={actionPending}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-warning/40 bg-warning/15 px-3 py-1.5 text-[11.5px] font-semibold text-foreground transition-colors hover:bg-warning/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="size-3.5 shrink-0" aria-hidden="true" />
                  Pubblica
                </button>
              )}
            </>
          )}
          {actionError && (
            <p className="flex items-start gap-1.5 text-[12px] font-medium text-destructive">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {actionError}
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
