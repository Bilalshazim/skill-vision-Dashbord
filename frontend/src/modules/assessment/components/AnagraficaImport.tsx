import { useQueryClient } from '@tanstack/react-query'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import { type DragEvent, useRef, useState } from 'react'

import { DataTable } from '@/components/patterns/DataTable'
import { InlineAlert } from '@/components/patterns/InlineAlert'
import { LoadingState } from '@/components/patterns/LoadingState'
import { Note } from '@/components/patterns/Note'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { assessmentApi } from '@/lib/api/assessment'
import { downloadBlob } from '@/lib/download'
import { cn } from '@/lib/utils'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { buildTemplate, type ImportPlan, planImport, readSheet, type RowError } from '@/modules/assessment/lib/anagrafica-import'
import { addNewEmployee } from '@/modules/assessment/lib/new-employee'
import { errorReason } from '@/modules/assessment/lib/server-sync'

// «Importa l'anagrafica da Excel», l'ultima cosa della pagina Anagrafica (Decisioni di Roberto del
// 2026-11-12). Si carica il file (trascinandolo o con «Carica file»), si vede l'anteprima — quante
// persone entrano, quante si aggiornano, i probabili doppioni e gli errori riga per riga — e solo
// dopo la conferma si salva, tutto insieme sul server: o entrano tutte o nessuna. Con errori nel file
// non si salva niente. La RAL la importano solo gli amministratori.
export function AnagraficaImport() {
  const { state, ui, isAdmin, canEdit, company, toast } = useAssessment()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [phase, setPhase] = useState<{ kind: 'idle' } | { kind: 'reading' } | { kind: 'error'; message: string } | { kind: 'preview'; file: string; plan: ImportPlan } | { kind: 'saving'; file: string; plan: ImportPlan }>({ kind: 'idle' })

  if (!canEdit) return null

  async function read(file: File) {
    setPhase({ kind: 'reading' })
    try {
      const X = await import('xlsx')
      const wb = X.read(await file.arrayBuffer())
      const rows = X.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: '' })
      const sheet = readSheet(rows)
      if (!sheet.rows.length && !sheet.missingColumns.length) {
        setPhase({ kind: 'error', message: ui.anagImportEmpty })
        return
      }
      setPhase({ kind: 'preview', file: file.name, plan: planImport(state, sheet, isAdmin, addNewEmployee) })
    } catch {
      setPhase({ kind: 'error', message: ui.anagImportBadFile })
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files?.[0]
    if (f) void read(f)
  }

  async function confirm(file: string, plan: ImportPlan) {
    if (!company) return
    setPhase({ kind: 'saving', file, plan })
    try {
      await assessmentApi.importEmployees(company.id, [...plan.creates, ...plan.updates.map((u) => u.after)], plan.roleProfiles)
      // Il server è la verità: si rilegge, così le schermate e il prossimo salvataggio partono da lì.
      await queryClient.invalidateQueries({ queryKey: ['assessment', 'state', company.id] })
      toast(ui.anagImportDone(plan.creates.length, plan.updates.length), 'ok')
      setPhase({ kind: 'idle' })
    } catch (err) {
      setPhase({ kind: 'preview', file, plan })
      toast(ui.anagImportFailed(errorReason(err, ui.serverOffline)), 'err')
    }
  }

  async function downloadTemplate() {
    downloadBlob('modello-anagrafica.xlsx', await buildTemplate())
  }

  const preview = phase.kind === 'preview' || phase.kind === 'saving' ? phase : null
  const plan = preview?.plan
  const toImport = plan ? plan.creates.length + plan.updates.length : 0
  const optionalMissing = plan ? plan.missingColumns.filter((h) => !plan.errors.some((e) => e.field === h && e.row === 1)) : []

  return (
    <Card className="mt-8 gap-4">
      <CardTitle>{ui.anagImportTitle}</CardTitle>
      {!preview ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={cn('flex flex-col items-start gap-3 rounded-lg border border-dashed p-6', drag ? 'border-primary bg-secondary' : 'border-border-strong')}
        >
          {phase.kind === 'reading' ? (
            <LoadingState label={ui.anagImportReading} />
          ) : (
            <>
              <p className="flex items-center gap-2 text-app-body text-foreground">
                <FileSpreadsheet className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                {ui.anagImportDrop}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" onClick={() => inputRef.current?.click()}>
                  <Upload aria-hidden="true" />
                  {ui.anagImportPick}
                </Button>
                <Button type="button" variant="ghost" onClick={() => void downloadTemplate()}>
                  <Download aria-hidden="true" />
                  {ui.anagImportTemplate}
                </Button>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  if (f) void read(f)
                }}
              />
            </>
          )}
          {phase.kind === 'error' ? <InlineAlert layout="text">{phase.message}</InlineAlert> : null}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="label-mono text-muted-foreground">{ui.anagImportPreviewTitle(preview.file)}</p>
          <p className="text-app-body text-foreground">{ui.anagImportCounts(plan!.total, plan!.creates.length, plan!.updates.length, plan!.duplicates.length)}</p>

          {plan!.errors.length ? (
            <div className="flex flex-col gap-2">
              <InlineAlert title={ui.anagImportErrorsTitle(plan!.errors.length)}>{ui.anagImportErrorsNote}</InlineAlert>
              <DataTable<RowError>
                columns={[
                  { key: 'row', header: ui.anagImportColRow, nowrap: true, cell: (e) => e.row },
                  { key: 'field', header: ui.anagImportColField, nowrap: true, cell: (e) => e.field },
                  { key: 'problem', header: ui.anagImportColProblem, cell: (e) => e.problem },
                ]}
                rows={plan!.errors}
                getRowId={(e) => `${e.row}-${e.field}-${e.problem}`}
              />
            </div>
          ) : null}

          {plan!.duplicates.length ? (
            <div className="flex flex-col gap-1">
              <p className="label-mono text-muted-foreground">{ui.anagImportDupTitle}</p>
              <Note>{ui.anagImportDupNote}</Note>
              <ul className="text-app-small text-foreground">
                {plan!.duplicates.map((d) => (
                  <li key={d.row}>
                    {ui.anagImportColRow} {d.row}: {d.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {plan!.updates.length ? (
            <div className="flex flex-col gap-1">
              <p className="label-mono text-muted-foreground">{ui.anagImportUpdTitle}</p>
              <Note>{ui.anagImportUpdNote}</Note>
            </div>
          ) : null}

          {plan!.creates.length && plan!.roleProfiles.length ? <Note>{ui.anagImportNewRoles(plan!.roleProfiles.map((r) => r.roleName).join(', '))}</Note> : null}
          {plan!.unknownColumns.length ? <Note>{ui.anagImportUnknownCols(plan!.unknownColumns.join(', '))}</Note> : null}
          {optionalMissing.length && !plan!.errors.some((e) => e.row === 1) ? <Note>{ui.anagImportMissingCols(optionalMissing.join(', '))}</Note> : null}
          {plan!.ralIgnored ? <Note>{ui.anagImportRalIgnored}</Note> : null}
          <Note>{ui.anagImportNoArchive}</Note>
          {!plan!.errors.length && !toImport ? <InlineAlert tone="info" layout="text">{ui.anagImportNothing}</InlineAlert> : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={() => void confirm(preview.file, plan!)} disabled={!!plan!.errors.length || !toImport || phase.kind === 'saving'}>
              {phase.kind === 'saving' ? ui.anagImportSaving : ui.anagImportConfirm(toImport)}
            </Button>
            <Button type="button" variant="outline" onClick={() => setPhase({ kind: 'idle' })} disabled={phase.kind === 'saving'}>
              {ui.anagImportCancel}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
