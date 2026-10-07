import { FileBarChart2 } from 'lucide-react'
import { useState } from 'react'

import { useDirty } from '@/hooks/use-dirty'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { clearIvReport, loadIvReportDraft, loadIvReportRecord, saveIvReport } from '@/modules/recruiting/lib/interview-protocol'
import type { IvReportDraft } from '@/modules/recruiting/lib/interview-protocol'
import { IvReportForm } from '@/modules/recruiting/profile-hub/protocol/IvReportForm'
import { SheetBrand } from '@/modules/recruiting/profile-hub/protocol/SheetBrand'
import { ModalEyebrow } from '@/modules/recruiting/profile-hub/protocol/protocol-ui'
import { dangerBtnClass, ghostBtnClass, primaryBtnClass } from '@/modules/recruiting/profile-hub/protocol/protocol-styles'

// Il Report finale di valutazione, sul modello del cliente (Foglio 8). Per
// posizione, non per candidato: il candidato è testo che scrive chi compila.
export function IvReportDialog({ role, savedAt, onSavedAtChange }: { role: string; savedAt: number | null; onSavedAtChange: (savedAt: number | null) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<IvReportDraft>(() => loadIvReportDraft(role))
  const dirty = useDirty(draft, open)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setDraft(loadIvReportDraft(role))
  }
  function handleSave() {
    saveIvReport(role, draft)
    onSavedAtChange(loadIvReportRecord(role)?.savedAt ?? null)
    setOpen(false)
  }
  function handleClear() {
    clearIvReport(role)
    onSavedAtChange(null)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button type="button" className={primaryBtnClass}>
          {savedAt != null ? 'Modifica report →' : 'Compila report →'}
        </button>
      </DialogTrigger>
      <DialogContent size="xl" dirty={dirty}>
        <DialogHeader>
          <SheetBrand />
          <ModalEyebrow>Documento riservato — Processo di selezione</ModalEyebrow>
          <DialogTitle className="flex items-center gap-2">
            <FileBarChart2 className="size-4 shrink-0" aria-hidden="true" />
            Report finale di valutazione
          </DialogTitle>
          <DialogDescription>Sintesi del processo di selezione per la decisione dei responsabili. La decisione è in prima pagina, il dettaglio nelle successive.</DialogDescription>
        </DialogHeader>

        <IvReportForm draft={draft} onChange={setDraft} />

        <DialogFooter>
          <button type="button" onClick={() => setOpen(false)} className={ghostBtnClass}>
            Annulla
          </button>
          <button type="button" onClick={handleClear} className={dangerBtnClass}>
            Svuota report
          </button>
          <button type="button" onClick={handleSave} className={primaryBtnClass}>
            Salva report
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
