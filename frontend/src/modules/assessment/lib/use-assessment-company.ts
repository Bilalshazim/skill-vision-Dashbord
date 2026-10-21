import { useQuery } from '@tanstack/react-query'

import { ensureBackendSession } from '@/lib/api/authBridge'
import { getBackendUser } from '@/lib/api/client'
import { companiesApi } from '@/lib/api/endpoints'
import type { BackendCompany } from '@/lib/api/types'
import { usePreference } from '@/lib/preferences'

// La società di cui Assessment mostra i dati, quando i dati stanno sul server.
// Chi lavora in una società vede la sua; lo staff di Skill Vision
// (PLATFORM_ADMIN, senza società) sceglie fra quelle con Assessment attivo; la
// scelta sta nelle sue preferenze sul server (lib/preferences.ts).

export type AssessmentCompanies = {
  status: 'loading' | 'error' | 'ready'
  error?: unknown
  companies: BackendCompany[]
  company: BackendCompany | null
  setCompanyId: (id: string) => void
  retry: () => void
}

export function useAssessmentCompanies(enabled: boolean): AssessmentCompanies {
  const [choice, setCompanyId] = usePreference<string | null>('assessment.company', null)
  const q = useQuery({
    queryKey: ['assessment', 'companies'],
    enabled,
    queryFn: async () => {
      // In modalità `legacy` il token del backend arriva dal ponte del guscio.
      await ensureBackendSession()
      const user = getBackendUser()
      if (user?.role === 'PLATFORM_ADMIN') return (await companiesApi.list()).filter((c) => c.purchasedModules.includes('ASSESSMENT'))
      if (!user?.companyId) return []
      return [await companiesApi.get(user.companyId)]
    },
  })
  const companies = q.data ?? []
  const company = companies.find((c) => c.id === choice) ?? companies[0] ?? null
  return {
    status: q.isPending ? 'loading' : q.isError ? 'error' : 'ready',
    error: q.error,
    companies,
    company,
    setCompanyId,
    retry: () => void q.refetch(),
  }
}
