import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { useConfirm } from '@/hooks/use-confirm'
import { assessmentApi, type RoiData } from '@/lib/api/assessment'
import { useModuleEntitlement } from '@/lib/entitlements'
import { AssessmentDataGate } from '@/modules/assessment/components/AssessmentDataGate'
import { AssessmentProvider, useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { generateDemoData } from '@/modules/assessment/lib/demo-data'
import { demoRoiData } from '@/modules/assessment/lib/demo-roi'
import { errorReason } from '@/modules/assessment/lib/server-sync'
import { useRoi } from '@/modules/assessment/lib/use-roi'


// Gli strumenti demo di Assessment, nell'amministrazione dell'account demo (CLAUDE.md
// §9): erano nel menu del modulo e in Dati aziendali. La pagina sta dentro Recruiting,
// quindi qui c'è il provider di Assessment; senza il modulo la sezione non c'è.
export function AssessmentDemoTools() {
  const entitlement = useModuleEntitlement('ASSESSMENT')
  if (entitlement.status !== 'unlocked') return null
  return (
    <AssessmentProvider>
      <AssessmentDataGate>
        <Tools />
      </AssessmentDataGate>
    </AssessmentProvider>
  )
}

function Tools() {
  const { ui, canEdit, company, toast, retry } = useAssessment()
  const res = ui.res
  const roi = useRoi()
  const queryClient = useQueryClient()
  const [confirm, confirmDialog] = useConfirm()
  const [busy, setBusy] = useState(false)

  async function loadStatement() {
    if (!(await confirm({ title: res.roiDemoLoad, description: res.roiDemoConfirm, confirmLabel: res.roiDemoLoad, cancelLabel: ui.confirmCancel }))) return
    const data: RoiData = demoRoiData(res.roiDemoFile)
    roi.save.mutate(data, { onSuccess: () => toast(res.roiSaved, 'ok'), onError: () => toast(res.roiSaveFailed, 'err') })
  }

  // Si tolgono i dati della società demo sul server e si importano quelli di prova.
  async function resetDemo() {
    if (!company) return
    if (!(await confirm({ title: ui.resetDemo, description: ui.confirmResetDemo, confirmLabel: ui.resetDemo, cancelLabel: ui.confirmCancel, destructive: true }))) return
    setBusy(true)
    try {
      await assessmentApi.resetDemo(company.id)
      await assessmentApi.importState(company.id, generateDemoData(), false)
      await queryClient.invalidateQueries({ queryKey: ['assessment', 'state', company.id] })
      toast(res.demoResetDone, 'ok')
    } catch (err) {
      toast(ui.serverSaveFailed(errorReason(err, ui.serverOffline)), 'err')
      retry()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="max-w-prose items-start gap-3">
      <CardTitle>Assessment</CardTitle>
      <p className="text-app-body text-foreground">{res.demoToolsSub}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => void loadStatement()} disabled={!canEdit || busy || roi.save.isPending}>
          {res.roiDemoLoad}
        </Button>
        <Button type="button" variant="outline" onClick={() => void resetDemo()} disabled={!canEdit || busy}>
          {ui.resetDemo}
        </Button>
      </div>
      {confirmDialog}
    </Card>
  )
}
