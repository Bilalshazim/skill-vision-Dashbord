import { ClipboardCheck } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { InlineAlert } from '@/components/patterns/InlineAlert'
import { PageHeader } from '@/components/patterns/PageHeader'
import { SendTestLinkBar } from '@/components/patterns/SendTestLinkBar'
import { EmptyState } from '@/components/patterns/EmptyState'
import { getActiveOpening } from '@/modules/recruiting/lib/pipeline'
import { sendTestLinkForCandidate, syncRankingFromBackend } from '@/modules/recruiting/lib/backend-sync'
import { readCandidates, readCvMatchingState } from '@/modules/recruiting/lib/storage'
import { usePaginaAData } from '@/modules/recruiting/lib/use-pagina-a-data'
import { PaginaACandidateRow } from '@/modules/recruiting/pagina-a/PaginaACandidateRow'

// Legacy's own guard message for this exact failure (sendPaginaABulk,
// modules/recruiting.html line 2302) — reused verbatim rather than invented.
const NO_ACTIVE_OPENING_MESSAGE = 'Seleziona prima una company/opening nella pagina CV & Esportazione'

type SendState =
  | { kind: 'idle' }
  | { kind: 'pending'; done: number; total: number }
  | { kind: 'blocked'; message: string }
  | { kind: 'result'; tone: 'success' | 'warning'; sent: string[]; failed: string[] }

// L'esito dell'ultimo invio per candidato, mostrato nella sua riga.
export type SendOutcome = { ok: boolean; message: string }

// Chi ha già ricevuto il link nella posizione attiva: non si può spuntare
// e non riceve un secondo invio (il server lo rifiuterebbe comunque, 409).
const ALREADY_SENT = new Set(['inviato', 'completato', 'ha_risposto', 'non_ha_risposto'])

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
  const [outcomes, setOutcomes] = useState<Record<string, SendOutcome>>({})

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
  // Le voci di preselezione della posizione attiva, lette una volta per
  // aggiornamento e passate alle righe (prima ogni riga rileggeva lo stato).
  const prescreenedById = useMemo(() => {
    void refreshKey
    const prescreened = getActiveOpening(readCvMatchingState()).opening?.pipeline?.prescreened ?? []
    return new Map(prescreened.map((p) => [p.candidateId, p]))
  }, [refreshKey])
  const alreadySent = useMemo(
    () => new Set([...prescreenedById.values()].filter((p) => p.autoSent || ALREADY_SENT.has(p.status)).map((p) => p.candidateId)),
    [prescreenedById],
  )
  const effectiveSelected = useMemo(
    () => new Set(Array.from(selected).filter((id) => pendingIds.has(id) && !alreadySent.has(id))),
    [selected, pendingIds, alreadySent],
  )

  const handleToggle = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

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

    // Uno alla volta, nell'ordine della lista: ogni invio attende la risposta
    // del server prima del successivo, e l'esito di ciascuno resta nella sua
    // riga. Un errore su un candidato non ferma gli altri.
    const freshCandidates = readCandidates()
    const sent: string[] = []
    const failed: string[] = []
    const next: Record<string, SendOutcome> = {}
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      setSendState({ kind: 'pending', done: i, total: ids.length })
      const c = freshCandidates.find((x) => x.id === id)
      // Sparito o non più in attesa (test completato altrove): non si invia.
      if (!c || c.testCompleted !== false) continue
      const result = await sendTestLinkForCandidate(id)
      if (result.ok) {
        sent.push(c.name)
        next[id] = { ok: true, message: 'Link inviato' }
      } else {
        const why =
          result.reason === 'missing-email'
            ? 'email mancante'
            : result.reason === 'unlinked'
              ? 'non collegato al server'
              : result.reason === 'mail-not-configured'
                ? 'invio email non configurato: link pronto da inviare a mano'
                : 'errore del server'
        failed.push(`${c.name} (${why})`)
        next[id] = { ok: false, message: `Non inviato: ${why}` }
      }
    }

    setOutcomes(next)
    setSelected(new Set())
    handleMutated()
    setSendState({ kind: 'result', tone: failed.length ? 'warning' : 'success', sent, failed })
  }

  const sendPending = sendState.kind === 'pending'
  const selectedNames = pending.filter((c) => effectiveSelected.has(c.id)).map((c) => c.name)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader level="page" className="mb-0" title="Migliori Candidati" description={<>Candidati con CV caricato ma non ancora sottoposti al test delle competenze trasversali, ordinati per corrispondenza CV/profilo. Spunta i candidati, aggiungi l'email e invia il link ai selezionati, oppure da ogni riga. Chi ha già ricevuto il link non si può spuntare.</>} />

      {opening && company ? (
        <p className="text-app-caption text-muted-foreground">
          Invio nel contesto attivo: <b className="font-semibold text-foreground">{company.name}</b> ·{' '}
          <b className="font-semibold text-foreground">{opening.title}</b> — cambialo dalla pagina{' '}
          <b className="font-semibold text-foreground">CV & Esportazione</b>.
        </p>
      ) : (
        <p className="text-app-caption text-muted-foreground">
          Nessun contesto CV/opening attivo — selezionane uno dalla pagina <b className="font-semibold text-foreground">CV & Esportazione</b> prima
          di inviare i test.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-app-section">
          In attesa di test — <span className="tabular-nums">{pending.length}</span>
        </h2>
        <SendTestLinkBar selectedNames={selectedNames} onSend={handleBulkSend} onClear={() => setSelected(new Set())} sending={sendPending} />
      </div>

      {sendState.kind === 'pending' && (
        <InlineAlert tone="info">{`Invio in corso: ${sendState.done + 1} di ${sendState.total}…`}</InlineAlert>
      )}
      {sendState.kind === 'blocked' && <InlineAlert tone="destructive">{sendState.message}</InlineAlert>}
      {sendState.kind === 'result' && (
        <InlineAlert tone={sendState.tone}>
          {sendState.sent.length ? `Link inviato a ${sendState.sent.join(', ')}.` : 'Nessun link inviato.'}
          {sendState.failed.length ? ` Non ricevono il link: ${sendState.failed.join('; ')}.` : ''}
        </InlineAlert>
      )}

      {!pending.length ? (
        <EmptyState
          size="sm"
          icon={ClipboardCheck}
          description='Nessun candidato in attesa di test. I candidati compaiono qui appena viene caricato un CV, fino al completamento del test delle competenze trasversali (segnato da CV Elaborati → "Segna completato").'
        />
      ) : (
        <div>
          {pending.map((c) => (
            <PaginaACandidateRow
              key={c.id}
              candidate={c}
              selected={effectiveSelected.has(c.id)}
              prescreened={prescreenedById.get(c.id)}
              alreadySent={alreadySent.has(c.id)}
              outcome={outcomes[c.id]}
              onToggleSelect={handleToggle}
              onMutated={handleMutated}
            />
          ))}
        </div>
      )}
    </div>
  )
}
