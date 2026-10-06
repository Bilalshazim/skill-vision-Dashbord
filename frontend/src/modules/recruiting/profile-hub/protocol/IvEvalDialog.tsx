import { NotebookPen } from 'lucide-react'
import { useState } from 'react'

import { useDirty } from '@/hooks/use-dirty'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { clearIvEval, loadIvEvalDraft, loadIvEvalRecord, saveIvEval } from '@/modules/recruiting/lib/interview-protocol'
import type { IvEvalDraft } from '@/modules/recruiting/lib/interview-protocol'
import { IvEvalForm } from '@/modules/recruiting/profile-hub/protocol/IvEvalForm'
import { SheetBrand } from '@/modules/recruiting/profile-hub/protocol/SheetBrand'
import { ModalEyebrow } from '@/modules/recruiting/profile-hub/protocol/protocol-ui'
import { dangerBtnClass, ghostBtnClass, primaryBtnClass } from '@/modules/recruiting/profile-hub/protocol/protocol-styles'

// Migrated from the "Scheda di Valutazione Candidato" modal (ivEvalModalOv,
// modules/recruiting.html ~815-913, openIvEvalModal()/collectIvEvalForm()/
// saveIvEvalForm()/clearIvEvalForm() ~4641-4701, ivEvalRecalc() ~4596-4624).
// Role-scoped only — `candidateId` is a free-text field the evaluator
// types (e.g. "CAND-014"), never a real Pipeline/CANDIDATES reference.
//
// The weighted-average calculation (calcIvEval, lib/interview-protocol.ts)
// is PROTOCOLLO-SPECIFIC and entirely independent of scoring.ts — recomputed
// live on every render from the current draft, exactly mirroring legacy's
// live oninput/onchange -> ivEvalRecalc() re-render on every keystroke.
export function IvEvalDialog({ role, savedAt, onSavedAtChange }: { role: string; savedAt: number | null; onSavedAtChange: (savedAt: number | null) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<IvEvalDraft>(() => loadIvEvalDraft(role))
  const dirty = useDirty(draft, open)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setDraft(loadIvEvalDraft(role))
  }

  function handleSave() {
    saveIvEval(role, draft)
    onSavedAtChange(loadIvEvalRecord(role)?.savedAt ?? null)
    setOpen(false)
  }
  function handleClear() {
    clearIvEval(role)
    onSavedAtChange(null)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button type="button" className={primaryBtnClass}>
          {savedAt != null ? 'Modifica scheda →' : 'Compila scheda →'}
        </button>
      </DialogTrigger>
      <DialogContent size="xl" dirty={dirty}>
        <DialogHeader>
          <SheetBrand />
          <ModalEyebrow>Documento interno — Selezione del personale</ModalEyebrow>
          <DialogTitle className="flex items-center gap-2">
            <NotebookPen className="size-4 shrink-0" aria-hidden="true" />
            Scheda di Valutazione Candidato
          </DialogTitle>
          <DialogDescription>
            Ruolo: <b className="font-semibold text-foreground">&quot;{role}&quot;</b>
          </DialogDescription>
        </DialogHeader>

        <IvEvalForm draft={draft} onChange={setDraft} />

        <DialogFooter>
          <button type="button" onClick={() => setOpen(false)} className={ghostBtnClass}>
            Annulla
          </button>
          <button type="button" onClick={handleClear} className={dangerBtnClass}>
            Svuota scheda
          </button>
          <button type="button" onClick={handleSave} className={primaryBtnClass}>
            Salva scheda ✓
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
