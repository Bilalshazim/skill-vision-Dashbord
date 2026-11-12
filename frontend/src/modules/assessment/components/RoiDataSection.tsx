import { Upload } from 'lucide-react'
import { type ChangeEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { InlineAlert } from '@/components/patterns/InlineAlert'
import { PageHeader } from '@/components/patterns/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { RoiData } from '@/lib/api/assessment'
import { parseCsv, readRows } from '@/lib/roi/importer'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { roiEuro, useRoi } from '@/modules/assessment/lib/use-roi'

const STATEMENT_KEYS = ['ric', 'vdp', 'costiProd', 'cp', 'sal', 'amm', 'acc', 'ebit', 'ebitda', 'un', 'ante', 'imposte'] as const

// Il bilancio in fondo a Dati aziendali (Decisioni di Roberto del 2026-11-12): stato, nome del
// file e il pulsante per caricarlo o sostituirlo. Il file è quello del motore ROI (Credit Save)
// e si salva al caricamento. Durata dell'esercizio, compenso, costo delle azioni, turnover e
// assenze escono dalla pagina, non dai dati: i valori salvati restano e il calcolo li usa.
export function RoiDataSection() {
  const { ui, canEdit } = useAssessment()
  const res = ui.res
  const roi = useRoi()
  const [draft, setDraft] = useState<RoiData>({ statement: {}, months: 12 })
  const [fileError, setFileError] = useState<string | null>(null)
  useEffect(() => {
    if (roi.data) setDraft({ statement: {}, months: 12, ...roi.data })
  }, [roi.data])

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
      // Il file si salva subito (Decisioni di Roberto del 2026-11-12: il pulsante «Salva i dati»
      // esce con i campi a mano). Durata, compenso, costo delle azioni, turnover e assenze già
      // salvati restano come sono; la durata la porta il file, se la scrive.
      const next: RoiData = { ...draft, statement, fileName: file.name, loadedAt: new Date().toISOString(), months: values.mesi ?? draft.months ?? 12 }
      setDraft(next)
      save(next)
    } catch {
      setFileError(res.roiFileError)
    }
  }

  function save(data: RoiData) {
    roi.save.mutate(data, { onSuccess: () => toast.success(res.roiSaved), onError: () => toast.error(res.roiSaveFailed) })
  }

  const loaded = STATEMENT_KEYS.filter((k) => draft.statement[k] != null)
  // Lo stato è quello salvato sul server, non la bozza: «caricato» solo dopo «Salva».
  const saved = roi.data
  const savedLoaded = !!saved?.statement && Object.keys(saved.statement).length > 0
  const savedDate = saved?.loadedAt ? new Date(saved.loadedAt).toLocaleDateString('it-IT') : ''
  return (
    <section id="bilancio" className="mb-8 scroll-mt-24">
      <PageHeader title={res.roiDataTitle} description={res.roiDataSub} level="subsection" />
      <Card className="gap-4">
        {/* Stato, data, file e pulsante nella sezione stessa (correzioni di Roberto del 2026-11-10).
            Il file è quello del motore ROI (Credit Save): .xlsx, .xls o .csv, letto da lib/roi/importer. */}
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={savedLoaded ? 'success' : 'warning'} dot>
            {savedLoaded ? res.balanceLoadedOn(savedDate) : res.balanceUploadCta}
          </Badge>
          {draft.fileName ? <span className="text-app-small text-muted-foreground">{draft.fileName}</span> : null}
          {canEdit ? (
            <Button asChild variant={savedLoaded ? 'outline' : 'default'} size="sm">
              <label className="cursor-pointer">
                <Upload aria-hidden="true" />
                {savedLoaded ? res.balanceReplace : res.roiUpload}
                <input type="file" accept=".xlsx,.xls,.csv,.txt" className="sr-only" onChange={onFile} />
              </label>
            </Button>
          ) : null}
        </div>
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
        {roi.status === 'blocked' ? <InlineAlert tone="warning">{roi.problems.join(' ')}</InlineAlert> : null}
      </Card>
    </section>
  )
}
