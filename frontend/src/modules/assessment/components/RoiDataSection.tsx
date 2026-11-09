import { Upload } from 'lucide-react'
import { type ChangeEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Field } from '@/components/patterns/Field'
import { FieldGrid } from '@/components/patterns/FieldGrid'
import { InlineAlert } from '@/components/patterns/InlineAlert'
import { PageHeader } from '@/components/patterns/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { RoiData } from '@/lib/api/assessment'
import { parseCsv, readRows } from '@/lib/roi/importer'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { roiEuro, useRoi } from '@/modules/assessment/lib/use-roi'

const STATEMENT_KEYS = ['ric', 'vdp', 'costiProd', 'cp', 'sal', 'amm', 'acc', 'ebit', 'ebitda', 'un', 'ante', 'imposte'] as const

// I dati del motore ROI in Dati aziendali (CLAUDE.md, Fase 6): il bilancio si
// carica una volta dal file, compenso, turnover e assenze si scrivono a mano. La
// durata dell'esercizio si chiede sempre: un periodo parziale si riporta all'anno.
export function RoiDataSection() {
  const { ui, canEdit } = useAssessment()
  const res = ui.res
  const roi = useRoi()
  const [draft, setDraft] = useState<RoiData>({ statement: {}, months: 12 })
  const [fileError, setFileError] = useState<string | null>(null)
  useEffect(() => {
    if (roi.data) setDraft({ statement: {}, months: 12, ...roi.data })
  }, [roi.data])

  const num = (k: 'months' | 'inv' | 'invAz' | 'turn' | 'ass') => (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(',', '.')
    setDraft((d) => ({ ...d, [k]: v === '' ? undefined : Number(v) }))
  }
  const dirtyInvalid = draft.months == null || draft.months < 1 || draft.months > 36 || !Number.isInteger(draft.months)

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setFileError(null)
    try {
      let rows: unknown[][]
      if (/\.csv$/i.test(file.name) || /\.txt$/i.test(file.name)) rows = parseCsv(await file.text())
      else {
        const X = await import('xlsx')
        const wb = X.read(await file.arrayBuffer())
        rows = wb.SheetNames.flatMap((n) => X.utils.sheet_to_json<unknown[]>(wb.Sheets[n], { header: 1, raw: true }))
      }
      const { values } = readRows(rows)
      const statement = Object.fromEntries(STATEMENT_KEYS.filter((k) => values[k] != null).map((k) => [k, values[k]]))
      if (!Object.keys(statement).length) {
        setFileError(res.roiFileEmpty)
        return
      }
      setDraft((d) => ({ ...d, statement, fileName: file.name, loadedAt: new Date().toISOString(), months: values.mesi ?? d.months ?? 12 }))
    } catch {
      setFileError(res.roiFileError)
    }
  }

  function save(data: RoiData) {
    roi.save.mutate(data, { onSuccess: () => toast.success(res.roiSaved), onError: () => toast.error(res.roiSaveFailed) })
  }

  const loaded = STATEMENT_KEYS.filter((k) => draft.statement[k] != null)
  return (
    <section id="bilancio" className="mt-8 scroll-mt-24">
      <PageHeader title={res.roiDataTitle} description={res.roiDataSub} level="subsection" />
      <Card className="gap-4">
        {canEdit ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <label className="cursor-pointer">
                <Upload aria-hidden="true" />
                {res.roiUpload}
                <input type="file" accept=".xlsx,.xls,.csv,.txt" className="sr-only" onChange={onFile} />
              </label>
            </Button>
            {draft.fileName ? <span className="text-app-small text-muted-foreground">{draft.fileName}</span> : null}
          </div>
        ) : null}
        {fileError ? <InlineAlert>{fileError}</InlineAlert> : null}
        {loaded.length ? (
          <dl className="grid grid-cols-1 gap-x-8 gap-y-1 text-app-small sm:grid-cols-2 lg:grid-cols-3">
            {loaded.map((k) => (
              <div key={k} className="flex justify-between gap-4 border-b border-border py-1">
                <dt className="text-muted-foreground">{res.roiLabels[k]}</dt>
                <dd className="tabular-nums text-foreground">{roiEuro(draft.statement[k])}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-app-small text-muted-foreground">{res.roiNoFile}</p>
        )}
        <FieldGrid>
          <Field label={res.roiMonths} hint={res.roiMonthsHint}>
            <Input type="number" min={1} max={36} value={draft.months ?? ''} onChange={num('months')} disabled={!canEdit} />
          </Field>
          <Field label={res.roiInv}>
            <Input type="number" min={0} value={draft.inv ?? ''} onChange={num('inv')} disabled={!canEdit} />
          </Field>
          <Field label={res.roiInvAz}>
            <Input type="number" min={0} value={draft.invAz ?? ''} onChange={num('invAz')} disabled={!canEdit} />
          </Field>
          <Field label={res.roiTurn}>
            <Input type="number" min={0} max={100} step="0.1" value={draft.turn ?? ''} onChange={num('turn')} disabled={!canEdit} />
          </Field>
          <Field label={res.roiAss}>
            <Input type="number" min={0} max={50} step="0.1" value={draft.ass ?? ''} onChange={num('ass')} disabled={!canEdit} />
          </Field>
        </FieldGrid>
        {draft.months !== 12 && !dirtyInvalid ? <InlineAlert tone="warning">{res.roiAnnualized(draft.months)}</InlineAlert> : null}
        {roi.status === 'blocked' ? <InlineAlert tone="warning">{roi.problems.join(' ')}</InlineAlert> : null}
        <p className="text-app-small text-muted-foreground">{res.roiAttesoValue(roi.atteso.toLocaleString('it-IT', { minimumFractionDigits: 1 }))}</p>
        {canEdit ? (
          <div>
            <Button type="button" onClick={() => save(draft)} disabled={roi.save.isPending || dirtyInvalid}>
              {res.roiSave}
            </Button>
          </div>
        ) : null}
      </Card>
    </section>
  )
}
