import { FileBarChart2, Mic, NotebookPen, Users } from 'lucide-react'
import { useState } from 'react'

import { DEFAULT_ROLE } from '@/modules/recruiting/lib/constants'
import { loadIvEvalRecord, loadIvNotesRecord, loadIvReportRecord } from '@/modules/recruiting/lib/interview-protocol'
import { EvaluatorsBackendPanel } from '@/modules/recruiting/profile-hub/EvaluatorsBackendPanel'
import { IvEvalDialog } from '@/modules/recruiting/profile-hub/protocol/IvEvalDialog'
import { IvNotesDialog } from '@/modules/recruiting/profile-hub/protocol/IvNotesDialog'
import { IvReportDialog } from '@/modules/recruiting/profile-hub/protocol/IvReportDialog'
import { Subcard } from '@/modules/recruiting/profile-hub/Subcard'

// Ported from updateProfileCardsIV() (modules/recruiting.html ~4851-4865) —
// same "Compilata ✓ · <date>" teaser text, same date formatting
// (toLocaleDateString('it-IT')), same "not compiled" fallback labels.
function teaserValue(savedAt: number | null, emptyLabel: string): string {
  return savedAt != null ? `Compilata ✓ · ${new Date(savedAt).toLocaleDateString('it-IT')}` : emptyLabel
}

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
export function EvaluatorAreaCard() {
  const role = DEFAULT_ROLE
  const [verbaleSavedAt, setVerbaleSavedAt] = useState<number | null>(() => loadIvNotesRecord(role)?.savedAt ?? null)
  const [valutazioneSavedAt, setValutazioneSavedAt] = useState<number | null>(() => loadIvEvalRecord(role)?.savedAt ?? null)
  const [reportSavedAt, setReportSavedAt] = useState<number | null>(() => loadIvReportRecord(role)?.savedAt ?? null)

  return (
    <div className="flex flex-col gap-2">
      <Subcard icon={Mic} label="Scheda Intervista Strutturata" value={teaserValue(verbaleSavedAt, 'Non compilata')}>
        <IvNotesDialog role={role} savedAt={verbaleSavedAt} onSavedAtChange={setVerbaleSavedAt} />
      </Subcard>
      <Subcard icon={NotebookPen} label="Scheda Valutazione Candidato" value={teaserValue(valutazioneSavedAt, 'Non compilata')}>
        <IvEvalDialog role={role} savedAt={valutazioneSavedAt} onSavedAtChange={setValutazioneSavedAt} />
      </Subcard>
      <Subcard icon={FileBarChart2} label="Report Finale Valutativo" value={teaserValue(reportSavedAt, 'Non compilato')}>
        <IvReportDialog role={role} savedAt={reportSavedAt} onSavedAtChange={setReportSavedAt} />
      </Subcard>
      {/* Phase 31 §13 — real, backend-backed multi-evaluator management
          (create/assign/role/minimum-3 readiness/accountless token), kept as
          its own subcard rather than folded into the 3 above: those remain
          the pre-existing role-scoped, single-evaluator local forms
          (Scheda Intervista/Valutazione/Report), genuinely unrelated data. */}
      <Subcard icon={Users} label="Valutatori (backend)" value="Gestione multi-valutatore">
        <EvaluatorsBackendPanel />
      </Subcard>
    </div>
  )
}
