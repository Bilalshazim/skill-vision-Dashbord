import { ClipboardCheck, Loader2, Send } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/modules/recruiting/components/EmptyState'
import { getActiveOpening } from '@/modules/recruiting/lib/pipeline'
import { sendTestLinkForCandidate, syncRankingFromBackend } from '@/modules/recruiting/lib/backend-sync'
import { readCandidates, readCvMatchingState } from '@/modules/recruiting/lib/storage'
import { usePaginaAData } from '@/modules/recruiting/lib/use-pagina-a-data'
import { PaginaACandidateRow } from '@/modules/recruiting/pagina-a/PaginaACandidateRow'

// Legacy's own guard message for this exact failure (sendPaginaABulk,
// modules/recruiting.html line 2302) — reused verbatim rather than invented.
const NO_ACTIVE_OPENING_MESSAGE = 'Seleziona prima una company/opening nella pagina CV & Esportazione'

// Legacy gives Pagina A's send button the same gold treatment as Pipeline's
// "Conferma vincitore" (`btn-act btn-gold`, modules/recruiting.html line
// 471) — same --warning-token mapping WinnerCard.tsx already established,
// now via the shared Button component's own `warning` variant instead of a
// third hand-rolled copy of that recipe.
const goldBtnClass = buttonVariants({ variant: 'warning', size: 'default' })

type SendState =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'blocked'; message: string }
  | { kind: 'result'; tone: 'success' | 'warning'; message: string }

const IDLE: SendState = { kind: 'idle' }

// Migrated from modules/recruiting.html #scr-paginaA (renderPaginaA() +
// togglePaginaASelect()/setPendingCandidateEmail()/sendPaginaABulk(),
// ~2234-2319). PHASE 13 migrates this as one complete screen, per the
// PHASE 12 audit's finding that every piece of it is either already-proven
// shared architecture (pendingCandidates(), addPrescreenedEntry()) or a
// small, well-understood addition (the CANDIDATES email write boundary —
// see lib/candidates.ts / lib/storage.ts writeCandidates()).
//
// ACTIVE CONTEXT — unlike Pipeline (its own local ?companyId=&openingId=
// selection, see pipeline/PipelinePage.tsx), Pagina A intentionally reads
// the GLOBAL activeContext, exactly like legacy's own getActiveContext()
// calls (~2251, ~2301). This is correct, not an oversight: Pagina A is a
// feeder into whichever opening CV & Export currently has active, not an
// independent inspector of one specific opening the way Pipeline is.
// Nothing here ever writes activeContext — only CV & Export does that.
export default function PaginaAPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const handleMutated = useCallback(() => setRefreshKey((k) => k + 1), [])
  const { pending, company, opening } = usePaginaAData(refreshKey)

  // In-memory only, never persisted — mirrors legacy's module-level
  // `PAGINA_A_SELECTED = new Set()` (modules/recruiting.html line 2240),
  // lost on refresh exactly like that variable is lost on a legacy reload.
  // Raw user intent (every id ever checked) — pruning against the current
  // pending list happens below, derived at render time rather than via an
  // effect that writes back into this same state.
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sendState, setSendState] = useState<SendState>(IDLE)

  // Phase 32 §2/§4/§8 — same backend-primary match-score reconciliation as
  // Ranking/CV & Esportazione, so the sort order here (by Match CV/Profilo,
  // descending) and every displayed % reflect the backend's authoritative
  // value.
  useEffect(() => {
    let cancelled = false
    void syncRankingFromBackend().then((result) => {
      if (!cancelled && result.ok && result.updated > 0) handleMutated()
    })
    return () => {
      cancelled = true
    }
  }, [handleMutated])

  // Mirrors renderPaginaA()'s own per-render prune (modules/recruiting.html
  // line 2246): a candidate that left the pending set (e.g. its test was
  // marked completed elsewhere) must never show as checked, count toward
  // the send button, or be sent — computed fresh every render instead of a
  // useEffect that deletes from `selected` after the fact (same observable
  // result; no extra render pass).
  const pendingIds = useMemo(() => new Set(pending.map((c) => c.id)), [pending])
  const effectiveSelected = useMemo(() => new Set(Array.from(selected).filter((id) => pendingIds.has(id))), [selected, pendingIds])

  function handleToggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  // Ported verbatim from sendPaginaABulk() (modules/recruiting.html
  // ~2300-2319). Reuses addPrescreenedEntry() (Phase 7, unmodified) for
  // every eligible selected candidate — no second prescreening
  // implementation. Called WITHOUT a `target`, so it resolves the opening
  // via activeContext (getActiveOpening), exactly like legacy's
  // `active.opening` — Pagina A must not invent a PipelineTarget for this.
  // Phase 32 §4 — the bulk send button now calls the real backend
  // (shortlist add + send-test) for every selected candidate that has a
  // backendCampaignCandidateId, falling back to the pre-existing
  // local-only addPrescreenedEntry() for any that don't — same per-
  // candidate fallback rule CvMatchDialog's single-candidate send already
  // established, just applied in a loop here. A backend failure on one
  // candidate doesn't abort the rest; it's counted separately and surfaced
  // honestly rather than silently merged into "sent".
  async function handleBulkSend() {
    if (sendState.kind === 'pending') return

    // Fresh read for the guard check — never trust a value captured at an
    // earlier render (same reasoning as every Pipeline mutation).
    const { opening: activeOpening } = getActiveOpening(readCvMatchingState())
    if (!activeOpening) {
      setSendState({ kind: 'blocked', message: NO_ACTIVE_OPENING_MESSAGE })
      return
    }
    const ids = Array.from(effectiveSelected)
    if (!ids.length) {
      setSendState({ kind: 'blocked', message: 'Seleziona almeno un candidato da promuovere al test.' })
      return
    }

    setSendState({ kind: 'pending' })

    // Fresh read, not the memoized `pending` list — a candidate's
    // testCompleted/email may have changed since this page last rendered.
    const freshCandidates = readCandidates()
    let sent = 0
    let missingEmail = 0
    let backendFailed = 0
    let unlinked = 0
    for (const id of ids) {
      const c = freshCandidates.find((x) => x.id === id)
      // A candidate that vanished or is no longer pending is silently
      // skipped — exactly like legacy's bare `return` here, counted in
      // neither `sent` nor `missingEmail`.
      if (!c || c.testCompleted !== false) continue
      // sendTestLinkForCandidate() (lib/backend-sync.ts) is the same
      // real send used by the per-row "Invia Lettera e Link Test" button
      // below — one implementation, two call sites.
      const result = await sendTestLinkForCandidate(id)
      if (result.ok) {
        sent++
      } else if (result.reason === 'missing-email') {
        missingEmail++
      } else if (result.reason === 'unlinked') {
        unlinked++
      } else {
        backendFailed++
      }
    }

    setSelected(new Set())
    handleMutated()

    const problems: string[] = []
    if (backendFailed) problems.push(`${backendFailed} fallit${backendFailed === 1 ? 'o' : 'i'} sul server`)
    if (missingEmail) problems.push(`${missingEmail} saltat${missingEmail === 1 ? 'o' : 'i'} (email mancante)`)
    if (unlinked) problems.push(`${unlinked} non collegat${unlinked === 1 ? 'o' : 'i'} al server (email non inviata)`)

    if (sent && !problems.length) {
      setSendState({ kind: 'result', tone: 'success', message: `Link test e lettera inviati a ${sent} candidat${sent === 1 ? 'o' : 'i'}.` })
    } else if (sent) {
      setSendState({ kind: 'result', tone: 'warning', message: `Inviati a ${sent} candidat${sent === 1 ? 'o' : 'i'} — ${problems.join(', ')}.` })
    } else if (problems.length) {
      setSendState({ kind: 'result', tone: 'warning', message: `Nessuna email inviata — ${problems.join(', ')}.` })
    } else {
      setSendState({ kind: 'result', tone: 'warning', message: 'Nessun invio: aggiungi l’email ai candidati selezionati.' })
    }
  }

  const selCount = effectiveSelected.size
  const sendPending = sendState.kind === 'pending'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary">
          <ClipboardCheck className="size-[22px] text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Migliori Candidati</h2>
          <p className="text-[13px] text-muted-foreground">
            Candidati con CV caricato ma non ancora sottoposti al test soft skill, ordinati per Match CV/Profilo. Spunta
            "Promosso al test", aggiungi l'email e invia il link in blocco, oppure invia singolarmente da ogni riga.
          </p>
        </div>
      </div>

      {opening && company ? (
        <p className="text-[12px] text-muted-foreground">
          Invio nel contesto attivo: <b className="font-semibold text-foreground">{company.name}</b> ·{' '}
          <b className="font-semibold text-foreground">{opening.title}</b> — cambialo dalla pagina{' '}
          <b className="font-semibold text-foreground">CV & Esportazione</b>.
        </p>
      ) : (
        <p className="text-[12px] text-muted-foreground">
          Nessun contesto CV/opening attivo — selezionane uno dalla pagina <b className="font-semibold text-foreground">CV & Esportazione</b> prima
          di inviare i test.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-[13.5px] font-semibold">
          In attesa di test — <span className="font-mono">{pending.length}</span>
        </h4>
        <button type="button" onClick={handleBulkSend} disabled={sendPending || selCount === 0} className={goldBtnClass}>
          {sendPending ? <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Send className="size-3.5 shrink-0" aria-hidden="true" />}
          {selCount
            ? `Invia link test a ${selCount} candidat${selCount === 1 ? 'o' : 'i'} selezionat${selCount === 1 ? 'o' : 'i'}`
            : 'Invia link test ai selezionati'}
        </button>
      </div>

      {sendState.kind === 'blocked' && <p className="text-[12px] font-medium text-destructive">{sendState.message}</p>}
      {sendState.kind === 'result' && (
        <p className={cn('text-[12px] font-medium', sendState.tone === 'success' ? 'text-success' : 'text-warning')}>{sendState.message}</p>
      )}

      {!pending.length ? (
        <EmptyState
          icon={ClipboardCheck}
          text='Nessun candidato in attesa di test. I candidati compaiono qui appena viene caricato un CV, fino al completamento del test soft skill (segnato dalla Pipeline → "Segna completato").'
        />
      ) : (
        <div>
          {pending.map((c) => (
            <PaginaACandidateRow
              key={c.id}
              candidate={c}
              selected={effectiveSelected.has(c.id)}
              onToggleSelect={(checked) => handleToggle(c.id, checked)}
              onMutated={handleMutated}
            />
          ))}
        </div>
      )}
    </div>
  )
}
