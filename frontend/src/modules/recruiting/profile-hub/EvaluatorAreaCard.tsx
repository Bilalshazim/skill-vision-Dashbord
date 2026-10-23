import { FileBarChart2, Mic, NotebookPen, Users } from 'lucide-react'
import { useState } from 'react'

import { DEFAULT_ROLE } from '@/modules/recruiting/lib/constants'
import { loadIvEvalRecord, loadIvNotesRecord, loadIvReportRecord } from '@/modules/recruiting/lib/interview-protocol'
import { EvaluatorsBackendPanel } from '@/modules/recruiting/profile-hub/EvaluatorsBackendPanel'
import { IvEvalDialog } from '@/modules/recruiting/profile-hub/protocol/IvEvalDialog'
import { IvNotesDialog } from '@/modules/recruiting/profile-hub/protocol/IvNotesDialog'
import { IvReportDialog } from '@/modules/recruiting/profile-hub/protocol/IvReportDialog'
import { Badge } from '@/components/ui/badge'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

function DocumentCard({ icon: Icon, title, subtitle, savedAt, emptyLabel, children }: { icon: LucideIcon; title: string; subtitle: string; savedAt: number | null; emptyLabel: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border-2 border-border p-4 transition-colors hover:border-primary">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-6 shrink-0 text-foreground" strokeWidth={1.5} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h4 className="text-app-section text-card-foreground">{title}</h4>
          <p className="text-app-caption text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div>
        {savedAt != null ? (
          <Badge tone="success" dot>
            Compilata · {new Date(savedAt).toLocaleDateString('it-IT')}
          </Badge>
        ) : (
          <Badge>{emptyLabel}</Badge>
        )}
      </div>
      <div className="mt-auto">{children}</div>
    </div>
  )
}

// Ported from updateProfileCardsIV() (modules/recruiting.html ~4851-4865) —
// same "Compilata ✓ · <date>" teaser text, same date formatting
// (toLocaleDateString('it-IT')), same "not compiled" fallback labels.

// PHASE 21 — full migration of the "Area Valutatore" master card's 3
// subcards: the Protocollo di Intervista (Scheda Intervista Strutturata /
// Scheda Valutazione Candidato / Report Finale Valutativo). Each dialog
// (protocol/IvNotesDialog.tsx, IvEvalDialog.tsx, IvReportDialog.tsx) owns
// its own open/edit/save/clear lifecycle against
// lib/interview-protocol.ts — role-scoped only (DEFAULT_ROLE), never
// candidateId/employeeId/Pipeline/CANDIDATES.
//
// `savedAt` is lifted here (not just inside each dialog) so the Subcard
// header's teaser updates immediately after a save/clear, without needing
// to re-read storage from a sibling component.
// Area Valutatori come quarto livello (documento del cliente, 2026-10-23):
// ogni scheda ha una pagina sua (EvaluatorDocumentPage.tsx), quindi `doc`
// mostra solo quella; il pannello dei valutatori esterni resta sotto,
// perché invii, file caricati e sintesi valgono per tutte e tre.
export type EvaluatorDoc = 'intervista' | 'valutazione' | 'report'

export function EvaluatorAreaCard({ doc }: { doc: EvaluatorDoc }) {
  const role = DEFAULT_ROLE
  const [verbaleSavedAt, setVerbaleSavedAt] = useState<number | null>(() => loadIvNotesRecord(role)?.savedAt ?? null)
  const [valutazioneSavedAt, setValutazioneSavedAt] = useState<number | null>(() => loadIvEvalRecord(role)?.savedAt ?? null)
  const [reportSavedAt, setReportSavedAt] = useState<number | null>(() => loadIvReportRecord(role)?.savedAt ?? null)

  return (
    <div className="flex flex-col gap-4">
      {/* I tre documenti del Protocollo di Intervista (modelli del cliente): una
          scheda ciascuno, con lo stato e il pulsante per compilarla. */}
      <div className="max-w-xl">
        {doc === 'intervista' ? (
          <DocumentCard icon={Mic} title="Intervista strutturata" subtitle="Verbale di colloquio" savedAt={verbaleSavedAt} emptyLabel="Non compilata">
            <IvNotesDialog role={role} savedAt={verbaleSavedAt} onSavedAtChange={setVerbaleSavedAt} />
          </DocumentCard>
        ) : doc === 'valutazione' ? (
          <DocumentCard icon={NotebookPen} title="Valutazione candidato" subtitle="Scheda con matrice dei punteggi" savedAt={valutazioneSavedAt} emptyLabel="Non compilata">
            <IvEvalDialog role={role} savedAt={valutazioneSavedAt} onSavedAtChange={setValutazioneSavedAt} />
          </DocumentCard>
        ) : (
          <DocumentCard icon={FileBarChart2} title="Report finale di valutazione" subtitle="Sintesi per la decisione" savedAt={reportSavedAt} emptyLabel="Non compilato">
            <IvReportDialog role={role} savedAt={reportSavedAt} onSavedAtChange={setReportSavedAt} />
          </DocumentCard>
        )}
      </div>
      {/* Phase 31 §13 — gestione multi-valutatore sul server (creazione,
          assegnazione, ruolo, minimo 3, token). Le prime due schede sono i
          moduli locali per posizione; i valutatori esterni compilano le
          stesse due schede dal link ricevuto via email, e le loro
          valutazioni si vedono, si confrontano e si sintetizzano da qui. La
          sintesi può essere riportata nel Report finale (`onReportChanged`
          ne aggiorna lo stato). */}
      <section className="flex flex-col gap-3 rounded-lg border-2 border-border p-4">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-muted-foreground" aria-hidden="true" />
          <h4 className="text-app-section text-card-foreground">Valutatori esterni</h4>
        </div>
        <p className="text-app-small text-muted-foreground">Inserisci l&apos;email di ciascun valutatore e invia il link: compilano le schede direttamente sulla piattaforma, oppure te le rimandano come file e le carichi qui, per nome del candidato.</p>
        <EvaluatorsBackendPanel onReportChanged={() => setReportSavedAt(loadIvReportRecord(role)?.savedAt ?? null)} />
      </section>
    </div>
  )
}
