import { useQuery } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

import { ensureBackendSession } from '@/lib/api/authBridge'
import { getBackendUser } from '@/lib/api/client'
import { companiesApi } from '@/lib/api/endpoints'
import type { BackendCompany } from '@/lib/api/types'

// La società di cui Assessment mostra i dati, quando i dati stanno sul server.
// Chi lavora in una società vede la sua; lo staff di Skill Vision
// (PLATFORM_ADMIN, senza società) sceglie fra quelle con Assessment attivo, e
// la scelta resta in questo browser (è una preferenza, non un dato).
const CHOICE_KEY = 'sv_assessment_company'

export type AssessmentCompanies = {
  status: 'loading' | 'error' | 'ready'
  error?: unknown
  companies: BackendCompany[]
  company: BackendCompany | null
  setCompanyId: (id: string) => void
  retry: () => void
}

function readChoice(): string | null {
  try {
    return localStorage.getItem(CHOICE_KEY)
  } catch {
    return null
  }
}

export function useAssessmentCompanies(enabled: boolean): AssessmentCompanies {
  const [choice, setChoice] = useState<string | null>(readChoice)
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
  const setCompanyId = useCallback((id: string) => {
    setChoice(id)
    try {
      localStorage.setItem(CHOICE_KEY, id)
    } catch {
      /* preferenza non salvata: vale finché la pagina resta aperta */
    }
  }, [])
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
