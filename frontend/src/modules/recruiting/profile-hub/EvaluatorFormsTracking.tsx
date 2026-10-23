import { FileText, FileUp, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { DataTable, type DataTableColumn } from '@/components/patterns/DataTable'
import { EmptyState } from '@/components/patterns/EmptyState'
import { Field } from '@/components/patterns/Field'
import { InlineAlert } from '@/components/patterns/InlineAlert'
import { ModalDialog } from '@/components/patterns/ModalDialog'
import { SelectField } from '@/components/patterns/SelectField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useConfirm } from '@/hooks/use-confirm'
import { ApiError } from '@/lib/api/client'
import { FORM_KIND_LABEL, openFormUpload } from '@/modules/recruiting/lib/evaluator-forms'
import { candidatesApi, evaluatorsApi } from '@/lib/api/endpoints'
import type { BackendCampaignEvaluator, EvaluatorFormKind, EvaluatorFormTracking, EvaluatorFormUploadDto } from '@/lib/api/endpoints'
import type { BackendCampaignCandidate } from '@/lib/api/types'

const KINDS: EvaluatorFormKind[] = ['INTERVISTA', 'VALUTAZIONE']
const ACCEPT = '.pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png'
const ALL = '__all__'

const day = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
      })
    : ''
const errorMessage = (err: unknown) => (err instanceof ApiError ? err.message : 'Errore di rete: riprova fra qualche istante.')

type Row = {
  id: string
  cc: BackendCampaignCandidate
  evaluator: BackendCampaignEvaluator
  evaluatorNo: number
}

// Area Valutatori — il quadro delle schede (documento "RECRUITING — AREA
// VALUTATORI"): per ogni candidato e valutatore, a che punto è ciascuna delle
// due schede — inviata, compilata online o restituita come file e caricata.
// Le schede che tornano come file si caricano da qui, per nome del candidato.
export function EvaluatorFormsTracking({ campaignId, roster, refreshKey, onChanged }: { campaignId: string; roster: BackendCampaignEvaluator[]; refreshKey: number; onChanged?: () => void }) {
  const [candidates, setCandidates] = useState<BackendCampaignCandidate[] | null>(null)
  const [tracking, setTracking] = useState<EvaluatorFormTracking | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState(ALL)
  const [uploading, setUploading] = useState<EvaluatorFormKind | null>(null)
  const [confirm, confirmDialog] = useConfirm()

  const reload = useCallback(async () => {
    try {
      const [list, t] = await Promise.all([candidatesApi.campaignRoster(campaignId), evaluatorsApi.formTracking(campaignId)])
      setCandidates(list)
      setTracking(t)
      setError('')
    } catch (err) {
      setError(errorMessage(err))
    }
  }, [campaignId])

  useEffect(() => {
    void reload()
  }, [reload, refreshKey])

  const rows = useMemo<Row[]>(() => {
    const ccs = (candidates ?? []).filter((c) => filter === ALL || c.id === filter)
    return ccs.flatMap((cc) =>
      roster.map((evaluator, i) => ({
        id: `${cc.id}:${evaluator.id}`,
        cc,
        evaluator,
        evaluatorNo: i + 1,
      })),
    )
  }, [candidates, roster, filter])

  async function openFile(upload: EvaluatorFormUploadDto) {
    const err = await openFormUpload(upload)
    if (err) setError(err)
  }

  async function removeFile(upload: EvaluatorFormUploadDto, row: Row) {
    const ok = await confirm({
      title: 'Togliere il file caricato?',
      description: `${FORM_KIND_LABEL[upload.kind]} di ${row.evaluator.fullName} per ${row.cc.candidate?.fullName ?? 'il candidato'}. Esce dal quadro; se era sbagliato, puoi caricare quello giusto.`,
      confirmLabel: 'Togli il file',
      destructive: true,
    })
    if (!ok) return
    try {
      await evaluatorsApi.removeFormUpload(upload.id)
      await reload()
      onChanged?.()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  function cell(row: Row, kind: EvaluatorFormKind) {
    const t = tracking
    if (!t) return null
    const sends = t.sends.filter((s) => s.evaluatorId === row.evaluator.id && s.kind === kind)
    const lastSend = sends[sends.length - 1]
    const online = t.online.find((o) => o.campaignCandidateId === row.cc.id && o.evaluatorId === row.evaluator.id && o[kind])
    const files = t.uploads.filter((u) => u.campaignCandidateId === row.cc.id && u.evaluatorId === row.evaluator.id && u.kind === kind)
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="text-app-caption text-muted-foreground">{lastSend ? `Inviata il ${day(lastSend.sentAt)}` : 'Non inviata'}</span>
        {online ? (
          <Badge tone="success" dot>
            Compilata online · {day(online.submittedAt)}
          </Badge>
        ) : null}
        {files.map((f) => (
          <div key={f.id} className="flex flex-col items-start gap-1">
            <Badge tone="success" dot>
              File caricato · {day(f.uploadedAt)}
            </Badge>
            <span className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => openFile(f)} aria-label={`Apri ${f.originalFilename}`}>
                <FileText aria-hidden="true" />
                Apri
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeFile(f, row)} aria-label={`Togli ${f.originalFilename}`}>
                <Trash2 aria-hidden="true" />
              </Button>
            </span>
          </div>
        ))}
        {!online && files.length === 0 && lastSend ? <Badge>In attesa</Badge> : null}
      </div>
    )
  }

  const columns: DataTableColumn<Row>[] = [
    // Candidato e valutatore in una colonna: il riquadro è stretto, e così le
    // due schede restano in vista senza scorrere di lato.
    {
      key: 'who',
      header: 'Candidato',
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{r.cc.candidate?.fullName || r.cc.id}</span>
          <span className="text-app-caption text-muted-foreground">{`Valutatore ${r.evaluatorNo} — ${r.evaluator.fullName}`}</span>
        </div>
      ),
    },
    ...KINDS.map((kind) => ({
      key: kind,
      header: kind === 'INTERVISTA' ? 'Intervista' : 'Valutazione',
      cell: (r: Row) => cell(r, kind),
    })),
  ]

  return (
    <section className="flex flex-col gap-3" aria-label="Schede per candidato">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Field label="Candidato" className="min-w-56">
          <SelectField value={filter} onValueChange={setFilter} size="sm">
            <option value={ALL}>Tutti i candidati</option>
            {(candidates ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.candidate?.fullName || c.id}
              </option>
            ))}
          </SelectField>
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setUploading('INTERVISTA')} disabled={!roster.length || !candidates?.length}>
            <FileUp aria-hidden="true" />
            Carica schede intervista
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setUploading('VALUTAZIONE')} disabled={!roster.length || !candidates?.length}>
            <FileUp aria-hidden="true" />
            Carica schede valutazione
          </Button>
        </div>
      </div>

      {error ? <InlineAlert>{error}</InlineAlert> : null}

      {roster.length === 0 ? (
        <EmptyState size="sm" icon={FileText} description="Qui compare lo stato delle schede di ogni valutatore. Aggiungi e assegna almeno un valutatore per cominciare." />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(r) => r.id}
          loading={candidates === null || tracking === null}
          loadingLabel="Caricamento delle schede…"
          empty={<EmptyState size="sm" icon={FileText} description="Nessun candidato in questa selezione: le schede si seguono per candidato." />}
        />
      )}

      {uploading && candidates ? (
        <FormUploadDialog
          kind={uploading}
          candidates={candidates}
          roster={roster}
          initialCandidateId={filter === ALL ? '' : filter}
          onClose={() => setUploading(null)}
          onUploaded={async () => {
            setUploading(null)
            await reload()
            onChanged?.()
          }}
        />
      ) : null}
      {confirmDialog}
    </section>
  )
}

// Il caricamento di una scheda restituita: per quale candidato, chi l'ha
// compilata, quale scheda, il file.
function FormUploadDialog({
  kind: initialKind,
  candidates,
  roster,
  initialCandidateId,
  onClose,
  onUploaded,
}: {
  kind: EvaluatorFormKind
  candidates: BackendCampaignCandidate[]
  roster: BackendCampaignEvaluator[]
  initialCandidateId: string
  onClose: () => void
  onUploaded: () => void | Promise<void>
}) {
  const [candidateId, setCandidateId] = useState(initialCandidateId)
  const [evaluatorId, setEvaluatorId] = useState(roster.length === 1 ? roster[0].id : '')
  const [kind, setKind] = useState<EvaluatorFormKind>(initialKind)
  const [file, setFile] = useState<File | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [showErrors, setShowErrors] = useState(false)

  async function submit() {
    setShowErrors(true)
    if (!candidateId || !evaluatorId || !file || pending) return
    setPending(true)
    setError('')
    try {
      await evaluatorsApi.uploadForm(candidateId, { kind, evaluatorId, file })
      await onUploaded()
    } catch (err) {
      setError(errorMessage(err))
      setPending(false)
    }
  }

  return (
    <ModalDialog
      title={kind === 'INTERVISTA' ? 'Carica una scheda intervista' : 'Carica una scheda valutazione'}
      sub="La scheda compilata che un valutatore ti ha rimandato come file."
      dirty={Boolean(file) && !pending}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Annulla
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            <FileUp aria-hidden="true" />
            {pending ? 'Caricamento…' : 'Carica'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Candidato" required error={showErrors && !candidateId ? 'Scegli il candidato a cui si riferisce la scheda.' : undefined}>
          <SelectField value={candidateId} onValueChange={setCandidateId} placeholder="Scegli il candidato" disabled={pending}>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.candidate?.fullName || c.id}
              </option>
            ))}
          </SelectField>
        </Field>
        <Field label="Compilata da" required error={showErrors && !evaluatorId ? 'Scegli il valutatore che l’ha compilata.' : undefined}>
          <SelectField value={evaluatorId} onValueChange={setEvaluatorId} placeholder="Scegli il valutatore" disabled={pending}>
            {roster.map((r, i) => (
              <option key={r.id} value={r.id}>
                {`Valutatore ${i + 1} — ${r.fullName}`}
              </option>
            ))}
          </SelectField>
        </Field>
        <Field label="Scheda">
          <SelectField value={kind} onValueChange={(v) => setKind(v as EvaluatorFormKind)} disabled={pending}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {FORM_KIND_LABEL[k]}
              </option>
            ))}
          </SelectField>
        </Field>
        <Field label="File" required hint="PDF, Word o immagine (JPG, PNG), fino a 15 MB." error={showErrors && !file ? 'Scegli il file della scheda compilata.' : undefined}>
          <Input type="file" accept={ACCEPT} disabled={pending} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </Field>
        {error ? <InlineAlert>{error}</InlineAlert> : null}
      </div>
    </ModalDialog>
  )
}
