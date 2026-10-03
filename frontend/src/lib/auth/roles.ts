// Fase 8 — i permessi vengono dal ruolo del backend, non da un valore fisso.
// I ruoli sono quelli del modello User (backend/prisma/schema.prisma).
export type BackendRole = 'PLATFORM_ADMIN' | 'COMPANY_ADMIN' | 'RECRUITER' | 'EVALUATOR' | 'READONLY'

// Chi può modificare i dati di Assessment (anagrafica, valutazioni, piani).
// EVALUATOR e READONLY leggono soltanto. Ruolo sconosciuto: sola lettura.
export function canEditAssessment(role: string | null | undefined): boolean {
  return role === 'PLATFORM_ADMIN' || role === 'COMPANY_ADMIN' || role === 'RECRUITER'
}

export const ROLE_LABEL: Record<BackendRole, string> = {
  PLATFORM_ADMIN: 'Amministratore della piattaforma',
  COMPANY_ADMIN: 'Amministratore della società',
  RECRUITER: 'Selezione',
  EVALUATOR: 'Valutatore',
  READONLY: 'Sola lettura',
}
