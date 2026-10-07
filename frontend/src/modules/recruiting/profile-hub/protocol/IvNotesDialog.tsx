import { Mic } from 'lucide-react'
import { useState } from 'react'

import { useDirty } from '@/hooks/use-dirty'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { clearIvNotes, loadIvNotesDraft, loadIvNotesRecord, saveIvNotes } from '@/modules/recruiting/lib/interview-protocol'
import type { IvNotesDraft } from '@/modules/recruiting/lib/interview-protocol'
import { IvNotesForm } from '@/modules/recruiting/profile-hub/protocol/IvNotesForm'
import { SheetBrand } from '@/modules/recruiting/profile-hub/protocol/SheetBrand'
import { ModalEyebrow } from '@/modules/recruiting/profile-hub/protocol/protocol-ui'
import { dangerBtnClass, ghostBtnClass, primaryBtnClass } from '@/modules/recruiting/profile-hub/protocol/protocol-styles'

// Migrated from the "Verbale di Colloquio" modal (ivNotesModalOv, modules/
// recruiting.html ~712-812, openIvNotesModal()/collectIvNotesForm()/
// saveIvNotesForm()/clearIvNotesForm() ~4502-4551). Role-scoped only
// (currentRole) — no candidateId, no Pipeline link; the "Rif. candidatura"
// fields are free text the interviewer types by hand (e.g. "CAND-014"),
// exactly as legacy has them.
export function IvNotesDialog({ role, savedAt, onSavedAtChange }: { role: string; savedAt: number | null; onSavedAtChange: (savedAt: number | null) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<IvNotesDraft>(() => loadIvNotesDraft(role))
  const dirty = useDirty(draft, open)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    // Fresh read every time the dialog opens — matches legacy re-populating
    // every field from INTERVIEW_DATA.verbale[currentRole] on every
    // openIvNotesModal() call, not just once at first mount.
    if (next) setDraft(loadIvNotesDraft(role))
  }

  function handleSave() {
    saveIvNotes(role, draft)
    onSavedAtChange(loadIvNotesRecord(role)?.savedAt ?? null)
    setOpen(false)
  }
  function handleClear() {
    clearIvNotes(role)
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
            <Mic className="size-4 shrink-0" aria-hidden="true" />
            Verbale di colloquio
          </DialogTitle>
          <DialogDescription>Scheda di conduzione e valutazione: traccia di prassi, spazio per le domande personalizzate, esito.</DialogDescription>
        </DialogHeader>

        <IvNotesForm draft={draft} onChange={setDraft} />

        <DialogFooter>
          <button type="button" onClick={() => setOpen(false)} className={ghostBtnClass}>
            Annulla
          </button>
          <button type="button" onClick={handleClear} className={dangerBtnClass}>
            Svuota scheda
          </button>
          <button type="button" onClick={handleSave} className={primaryBtnClass}>
            Salva scheda
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
