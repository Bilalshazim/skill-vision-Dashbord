import { CheckCircle2, Clock3, Link2, Loader2, Send, SendHorizonal, XCircle } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CvMatchDialog } from '@/modules/recruiting/cv/CvMatchDialog'
import { CvOpenButton } from '@/modules/recruiting/cv/CvOpenButton'
import { sendTestLinkForCandidate, setCandidateEmailWithBackendSync } from '@/modules/recruiting/lib/backend-sync'
import { addPrescreenedEntry, getActiveOpening } from '@/modules/recruiting/lib/pipeline'
import { readCvMatchingState } from '@/modules/recruiting/lib/storage'
import { SendTestLinkFallbackModal } from '@/modules/recruiting/pagina-a/SendTestLinkFallbackModal'
import type { Candidate, PrescreenedEntry, PrescreenStatus } from '@/modules/recruiting/lib/types'

const NO_ACTIVE_OPENING_MESSAGE = 'Seleziona prima una company/opening nella pagina CV & Esportazione'

const inputClass =
  'rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

type SaveState = { kind: 'idle' } | { kind: 'pending' } | { kind: 'error'; message: string } | { kind: 'warning'; message: string }
const IDLE: SaveState = { kind: 'idle' }

// Client §5 — same 4-state dispatch tracking Pipeline's PrescreenedList
// already shows, surfaced here too since Migliori Candidati is the other
// screen the client explicitly asked for these badges on. 'da_inviare'
// (or no prescreened record at all yet) is the only state with the
// "Invia Lettera e Link Test" trigger — every other state means a real
// send already happened, tracked server-side.
const STATUS_STYLE: Record<PrescreenStatus, { icon: typeof Clock3; label: string; tone: 'red' | 'amber' | 'green' }> = {
  da_inviare: { icon: Clock3, label: 'Da inviare', tone: 'red' },
  // Local-only: a real test link exists and is ready, but no email
  // provider is configured on this backend, so nothing was actually sent
  // yet — see lib/types.ts's PrescreenStatus comment for why this is its
  // own state rather than reusing 'inviato'.
  link_pronto: { icon: Link2, label: 'Link pronto', tone: 'amber' },
  inviato: { icon: SendHorizonal, label: 'Inviato', tone: 'amber' },
  completato: { icon: CheckCircle2, label: 'Test completato', tone: 'green' },
  ha_risposto: { icon: CheckCircle2, label: 'Ha risposto al test', tone: 'green' },
  non_ha_risposto: { icon: XCircle, label: 'Non ha ancora risposto', tone: 'red' },
}

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

  // Any prescreened entry for this candidate in the active opening — NOT
  // backend-sync.ts's findLocalPrescreenedEntry(), which only surfaces
  // entries carrying a backendShortlistId (by design, for its own
  // resend/reuse callers). This badge must reflect a purely local dispatch
  // too (the manual-send fallback below, or any legacy local-only record),
  // exactly like Pipeline's own PrescreenedList and CvMatchDialog's
  // `already` already do — otherwise a real local "Segna come inviato"
  // would leave the badge stuck on "Da inviare".
  const { opening: activeOpening } = getActiveOpening(readCvMatchingState())
  const prescreened = activeOpening?.pipeline?.prescreened.find((p) => p.candidateId === candidate.id)
  const status = prescreened?.status ?? 'da_inviare'
  const [sendState, setSendState] = useState<
    { kind: 'idle' } | { kind: 'pending' } | { kind: 'error'; message: string; rawMessage?: string }
  >({ kind: 'idle' })
  const [fallback, setFallback] = useState<{ open: boolean; entry: PrescreenedEntry; reasonMessage: string } | null>(null)

  async function handleSingleSend() {
    if (sendState.kind === 'pending') return
    setSendState({ kind: 'pending' })
    const result = await sendTestLinkForCandidate(candidate.id)
    if (!result.ok) {
      if (result.reason === 'missing-email') {
        // Not a backend/connectivity problem — there's nothing a
        // manual-send fallback would fix until an email exists.
        setSendState({ kind: 'error', message: "Aggiungi l'email prima di inviare." })
        return
      }
      if (result.reason === 'mail-not-configured') {
        // Not a recruiter-facing failure: a real link WAS generated
        // (status already flipped to 'link_pronto' server-side by
        // sendTestLinkForCandidate) — go straight to the manual-send
        // modal instead of showing a dead-end red error.
        setSendState({ kind: 'idle' })
        setFallback({ open: true, entry: result.entry, reasonMessage: result.message })
        onMutated()
        return
      }
      // Every other failure (no backend link for this company/opening, or
      // a genuine backend error) offers a manual fallback — rawMessage is
      // the undecorated reason, reused as-is in the fallback modal.
      setSendState({ kind: 'error', message: `Invio fallito: ${result.message}`, rawMessage: result.message })
      return
    }
    setSendState({ kind: 'idle' })
    onMutated()
  }

  // Opens the manual-send fallback (SendTestLinkFallbackModal) for when the
  // real backend dispatch above couldn't complete. Ensures a local
  // PrescreenedEntry exists first (auto: false — "Da inviare", not a fake
  // "Inviato") so the modal has a real testLink to show; addPrescreenedEntry
  // is idempotent (returns the existing entry if one's already there), so
  // this never creates a duplicate.
  function openFallback(reasonMessage: string) {
    const result = addPrescreenedEntry(candidate.id, candidate.name, emailInput || candidate.email || '', false, candidate.icv)
    if (!result.ok) {
      const message = result.reason === 'no-active-opening' ? NO_ACTIVE_OPENING_MESSAGE : `Impossibile generare il link: ${result.message}`
      setSendState({ kind: 'error', message })
      return
    }
    setFallback({ open: true, entry: result.entry, reasonMessage })
  }

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

      <div className="shrink-0 font-mono text-[15px] font-semibold text-foreground dark:text-primary" title="Match CV/Profilo di Lavoro (solo CV)">
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

      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge tone={STATUS_STYLE[status].tone} dot={false}>
          {(() => {
            const Icon = STATUS_STYLE[status].icon
            return <Icon className="size-3 shrink-0" aria-hidden="true" />
          })()}
          {STATUS_STYLE[status].label}
        </Badge>
        {status === 'da_inviare' && (
          <button
            type="button"
            onClick={handleSingleSend}
            disabled={sendState.kind === 'pending'}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sendState.kind === 'pending' ? <Loader2 className="size-3 shrink-0 animate-spin" aria-hidden="true" /> : <Send className="size-3 shrink-0" aria-hidden="true" />}
            Invia Lettera e Link Test
          </button>
        )}
        {status === 'link_pronto' && prescreened && (
          <button
            type="button"
            onClick={() => setFallback({ open: true, entry: prescreened, reasonMessage: 'Nessun provider email configurato su questo server.' })}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Link2 className="size-3 shrink-0" aria-hidden="true" />
            Invia manualmente
          </button>
        )}
        {sendState.kind === 'error' && (
          <div className="max-w-[190px] text-right">
            <p className="text-[10.5px] font-medium text-destructive">{sendState.message}</p>
            {sendState.rawMessage && (
              <button
                type="button"
                onClick={() => openFallback(sendState.rawMessage!)}
                className="mt-0.5 text-[10.5px] font-semibold text-primary underline-offset-2 hover:underline"
              >
                Invia manualmente
              </button>
            )}
          </div>
        )}
      </div>

      <CvOpenButton candidate={candidate} className="shrink-0" />

      {fallback && (
        <SendTestLinkFallbackModal
          candidate={candidate}
          entry={fallback.entry}
          reasonMessage={fallback.reasonMessage}
          open={fallback.open}
          onOpenChange={(o) => setFallback((f) => (f ? { ...f, open: o } : f))}
          onSent={() => {
            setFallback(null)
            setSendState({ kind: 'idle' })
            onMutated()
          }}
        />
      )}
    </div>
  )
}
