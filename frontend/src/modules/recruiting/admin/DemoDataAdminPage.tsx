import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/patterns/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { useConfirm } from '@/hooks/use-confirm'
import { isDemoAccount } from '@/lib/demo-mode'
import { AssessmentDemoTools } from '@/modules/assessment/components/AssessmentDemoTools'
import { useActivePosition } from '@/modules/recruiting/lib/active-position'
import { DEMO_OPENING_TITLE, loadRecruitingDemo } from '@/modules/recruiting/lib/demo-data'
import { whenSaved } from '@/modules/recruiting/lib/recruiting-store'

// Tutti gli strumenti demo in un posto solo, nell'amministrazione dell'account demo
// (CLAUDE.md §9: non stanno nelle schermate di lavoro). Recruiting: i dati si caricano
// da soli (lib/demo-data.ts, `preloadRecruitingDemo`), da qui si riportano allo stato
// iniziale. Assessment: AssessmentDemoTools. Per chiunque altro la pagina non esiste.
export default function DemoDataAdminPage() {
  const [confirm, confirmDialog] = useConfirm()
  const [busy, setBusy] = useState(false)
  const { setPosition } = useActivePosition()
  if (!isDemoAccount()) return <Navigate to="/recruiting/profile" replace />

  async function run() {
    const ok = await confirm({
      title: 'Ripristinare i dati dimostrativi?',
      description: `La posizione «${DEMO_OPENING_TITLE}» e i suoi candidati tornano allo stato iniziale, e diventa la posizione attiva. Le altre posizioni e gli altri candidati non cambiano.`,
      confirmLabel: 'Ripristina',
      cancelLabel: 'Annulla',
    })
    if (!ok) return
    setBusy(true)
    try {
      const { companyId, openingId } = loadRecruitingDemo()
      await whenSaved()
      setPosition(companyId, openingId)
      toast.success('Dati dimostrativi ripristinati.')
    } catch (err) {
      toast.error(`Dati dimostrativi non ripristinati: ${err instanceof Error ? err.message : String(err)}. Riprova.`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader level="page" className="mb-0" title="Dati dimostrativi" description="Gli strumenti dell’account demo, per i due moduli." />
      <Card className="max-w-prose items-start gap-3">
        <CardTitle>Recruiting</CardTitle>
        <p className="text-app-body text-foreground">I dati si caricano da soli al primo accesso. Posizione: {DEMO_OPENING_TITLE}.</p>
        <Button type="button" variant="outline" onClick={() => void run()} disabled={busy}>
          <RotateCcw aria-hidden="true" />
          Ripristina i dati dimostrativi
        </Button>
      </Card>
      <AssessmentDemoTools />
      {confirmDialog}
    </div>
  )
}
