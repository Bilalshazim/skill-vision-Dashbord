import { useQueryClient } from '@tanstack/react-query'
import { Download, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { LoadingState } from '@/components/patterns/LoadingState'
import { Note } from '@/components/patterns/Note'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { originalSkillsApi, type OriginalSkillsImportReport } from '@/lib/api/endpoints'
import { useSession } from '@/lib/auth/session'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { ApiError } from '@/lib/api/client'
import { errorReason } from '@/modules/assessment/lib/server-sync'

// «Importa le persone dai test» (2026-11-20): le persone più recenti che hanno completato i test,
// con i dati anagrafici e i punteggi delle competenze trasversali, nell'Anagrafica della società
// aperta. Prima l'anteprima, poi la conferma; il server salva tutto insieme o niente. Solo per gli
// amministratori della piattaforma: sono dati di persone reali. Il fornitore dei test non si nomina
// a schermo (CLAUDE.md, cap. 7, «Testi»).
const LIMIT = 100

export function TestPeopleImport() {
  const { ui, company, toast } = useAssessment()
  const { user } = useSession()
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<{ kind: 'idle' } | { kind: 'reading' } | { kind: 'preview'; report: OriginalSkillsImportReport } | { kind: 'saving'; report: OriginalSkillsImportReport }>({ kind: 'idle' })
  const [confirmRemove, setConfirmRemove] = useState(false)

  if (user?.role !== 'PLATFORM_ADMIN' || !company) return null
  const companyId = company.id

  async function preview() {
    setPhase({ kind: 'reading' })
    try {
      setPhase({ kind: 'preview', report: await originalSkillsApi.importPeople(companyId, LIMIT, true) })
    } catch (err) {
      setPhase({ kind: 'idle' })
      toast(failMessage(err), 'err')
    }
  }

  async function confirm(report: OriginalSkillsImportReport) {
    setPhase({ kind: 'saving', report })
    try {
      const done = await originalSkillsApi.importPeople(companyId, LIMIT, false)
      await queryClient.invalidateQueries({ queryKey: ['assessment', 'state', companyId] })
      toast(ui.osImportDone(done.created, done.updated), 'ok')
      setPhase({ kind: 'idle' })
    } catch (err) {
      setPhase({ kind: 'preview', report })
      toast(failMessage(err), 'err')
    }
  }

  async function remove() {
    try {
      const { removed } = await originalSkillsApi.removeImported(companyId)
      await queryClient.invalidateQueries({ queryKey: ['assessment', 'state', companyId] })
      toast(ui.osImportRemoved(removed), 'ok')
    } catch (err) {
      toast(ui.osImportRemoveFailed(errorReason(err, ui.serverOffline)), 'err')
    }
  }

  // Un errore del servizio dei test (502 del backend) dice cosa è successo, non «il server non risponde».
  function reason(err: unknown) {
    // 503 «non attiva / non configurata»: mancano le variabili sul Backend, non è il server che non risponde.
    if (err instanceof ApiError && err.code === 'service_disabled') return ui.osImportDisabled(/configurata/.test(err.message) ? 'non configurato' : 'spento')
    if (err instanceof ApiError && err.code === 'bad_gateway') return ui.osImportUpstream(err.message.replace(/^Il Comitato scientifico /, ''))
    return errorReason(err, ui.serverOffline)
  }

  // «Riprova tra qualche minuto» non serve se il collegamento è spento: si accende, non si aspetta.
  const failMessage = (err: unknown) => (err instanceof ApiError && err.code === 'service_disabled' ? ui.osImportOff(reason(err)) : ui.osImportFailed(reason(err)))

  const report = phase.kind === 'preview' || phase.kind === 'saving' ? phase.report : null

  return (
    <Card className="mt-8 gap-4">
      <CardTitle>{ui.osImportTitle}</CardTitle>
      <p className="max-w-prose text-app-body text-muted-foreground">{ui.osImportDesc(LIMIT)}</p>
      {phase.kind === 'reading' ? <LoadingState label={ui.osImportReading} /> : null}
      {phase.kind === 'idle' ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => void preview()}>
            <Download aria-hidden="true" />
            {ui.osImportPreview}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setConfirmRemove(true)}>
            <Trash2 aria-hidden="true" />
            {ui.osImportRemove}
          </Button>
        </div>
      ) : null}
      {report ? (
        <div className="flex flex-col gap-3">
          <p className="text-app-body text-foreground">{ui.osImportCounts(report.people, report.created, report.updated)}</p>
          <p className="text-app-small text-muted-foreground">{ui.osImportDetail(report.employees, report.candidates, report.withoutEmail, report.withoutScores)}</p>
          {report.fieldsFound ? <Note>{ui.osImportFields(report.fieldsFound, report.people)}</Note> : null}
          {report.failedWindows ? <Note>{ui.osImportPartial(new Date(report.from).toLocaleDateString('it-IT'))}</Note> : null}
          {report.unmappedSkills.length ? <Note>{ui.osImportUnmapped(report.unmappedSkills.join(', '))}</Note> : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" disabled={phase.kind === 'saving' || !report.people} onClick={() => void confirm(report)}>
              {ui.osImportConfirm(report.people)}
            </Button>
            <Button type="button" variant="outline" disabled={phase.kind === 'saving'} onClick={() => setPhase({ kind: 'idle' })}>
              {ui.anagImportCancel}
            </Button>
          </div>
          {phase.kind === 'saving' ? <LoadingState label={ui.osImportReading} /> : null}
        </div>
      ) : null}
      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title={ui.osImportRemoveTitle}
        description={ui.osImportRemoveBody}
        confirmLabel={ui.osImportRemove}
        destructive
        onConfirm={() => {
          setConfirmRemove(false)
          void remove()
        }}
      />
    </Card>
  )
}
