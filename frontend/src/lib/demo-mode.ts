import { getBackendUser } from '@/lib/api/client'
import { env } from '@/lib/env'

// Siamo nella versione demo? (CLAUDE.md cap. 7, "Reset demo", deciso dal
// cliente il 2026-09-30: la voce esiste solo in demo.) Il prodotto non aveva
// un modo per saperlo; proposta in DECISIONI ("Come si riconosce la demo"):
// un'impostazione esplicita dell'ambiente, `VITE_DEMO_MODE=true`, messa solo
// sul servizio che fa da demo. In sviluppo locale vale sempre come demo.
export function isDemoMode(): boolean {
  return env.demoMode
}

/** L'account demo (es. demo@skill-vision.it, COMPANY_ADMIN sulla sola società demo): solo lui vede gli strumenti dei dati dimostrativi (CLAUDE.md §9). Filtro d'interfaccia. */
export function isDemoAccount(): boolean {
  const email = getBackendUser()?.email?.toLowerCase()
  return env.demoMode && !!email && env.demoAccounts.includes(email)
}

/** L'utente sta sulla società demo? Mai vero per una società non elencata: i dati di Recruiting stanno per società, e la prima volta ogni società legge lo stesso seed. */
export function isOnDemoCompany(): boolean {
  const companyId = getBackendUser()?.companyId?.toLowerCase()
  return isDemoAccount() || (env.demoMode && !!companyId && env.demoCompanyIds.includes(companyId))
}

/**
 * La società che si guarda è quella demo? Guarda la società aperta, non quella dell'account:
 * lo staff (PLATFORM_ADMIN) non ha una società sua e su Acme `isOnDemoCompany()` è falso
 * (il 12/11, con l'account di Alessio, il bilancio dimostrativo non si caricava per questo).
 * Mai vero per una società non elencata in `VITE_DEMO_COMPANY_IDS`, salvo l'account demo sulla sua.
 */
export function isDemoCompanyId(companyId: string | null | undefined): boolean {
  if (!companyId || !env.demoMode) return false
  const id = companyId.toLowerCase()
  if (env.demoCompanyIds.includes(id)) return true
  return isDemoAccount() && getBackendUser()?.companyId?.toLowerCase() === id
}
