import { Building2, CloudOff } from 'lucide-react'
import type { ReactNode } from 'react'

import { EmptyState } from '@/components/patterns/EmptyState'
import { LoadingState } from '@/components/patterns/LoadingState'
import { Button } from '@/components/ui/button'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'

// Le pagine di Assessment si aprono solo con i dati veri. Con i dati nel
// browser sono subito pronti; sul server c'è un breve caricamento, e se il
// server non risponde lo si dice, con il modo di riprovare, invece di
// mostrare pagine vuote.
export function AssessmentDataGate({ children }: { children: ReactNode }) {
  const { status, error, retry, ui } = useAssessment()
  if (status === 'loading') return <LoadingState label={ui.serverLoading} rows={6} />
  if (status === 'error')
    return (
      <EmptyState
        icon={CloudOff}
        title={ui.serverLoadFailedTitle}
        description={ui.serverLoadFailed(error ?? ui.serverOffline)}
        action={
          <Button type="button" variant="outline" onClick={retry}>
            {ui.serverRetry}
          </Button>
        }
      />
    )
  if (status === 'empty') return <EmptyState icon={Building2} title={ui.serverNoCompanyTitle} description={ui.serverNoCompany} />
  return <>{children}</>
}
