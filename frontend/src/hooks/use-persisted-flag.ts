import { usePreference } from '@/lib/preferences'

// Un sì/no ricordato fra una visita e l'altra — per esempio la vista
// "oggi / Skill Vision" di una card. Sta nelle preferenze dell'utente sul
// server (lib/preferences.ts), non nel browser. Predefinito: no.
export function usePersistedFlag(key: string): [boolean, (value: boolean) => void] {
  return usePreference<boolean>(key, false)
}
