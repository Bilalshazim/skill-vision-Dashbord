import { useCallback, useEffect, useState } from 'react'

import { PageHeader } from '@/components/patterns/PageHeader'
import { Card } from '@/components/ui/card'
import { syncRankingFromBackend } from '@/modules/recruiting/lib/backend-sync'
import { useCvExportData } from '@/modules/recruiting/lib/use-cv-export-data'
import { CvArchiveList } from '@/modules/recruiting/cv-export/CvArchiveList'
import { SurveyLinkSection } from '@/modules/recruiting/profile-hub/SurveyLinkSection'

// "CV Elaborati" (Livello 1, documento del cliente del 2026-10-23): l'elenco
// dei CV caricati e analizzati, che prima stava in fondo a CV & Esportazione,
// e in fondo il link al test soft skill, che prima stava nella card
// "Competenze trasversali" del Profilo della ricerca. Il link compare quando
// c'è almeno un CV salvato: prima non c'è nessuno a cui mandarlo.
export default function CvElaboratiPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const handleMutated = useCallback(() => setRefreshKey((k) => k + 1), [])
  const { candidates } = useCvExportData(refreshKey)

  // Stessa riconciliazione con il server di CV & Esportazione.
  useEffect(() => {
    let cancelled = false
    void syncRankingFromBackend().then((result) => {
      if (!cancelled && result.ok && result.updated > 0) handleMutated()
    })
    return () => {
      cancelled = true
    }
  }, [handleMutated])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader level="page" className="mb-0" title="CV Elaborati" description="I CV caricati e analizzati per la posizione attiva, con la corrispondenza al profilo." />

      <CvArchiveList candidates={candidates} />

      <Card className="max-w-3xl gap-3">
        <h2 className="text-app-section font-semibold">Test soft skill</h2>
        {candidates.length ? (
          <SurveyLinkSection />
        ) : (
          <p className="text-app-small text-muted-foreground">Il link al test compare qui dopo il primo CV salvato. Caricalo da CV &amp; Esportazione.</p>
        )}
      </Card>
    </div>
  )
}
