import { usePreference } from '@/lib/preferences'

export type Lang = 'it' | 'en'

// La lingua scelta nel selettore della barra superiore: una sola per tutta
// l'applicazione, nelle preferenze dell'utente sul server (lib/preferences.ts).
// Predefinito l'italiano (CLAUDE.md cap. 7).
export function useSharedLang() {
  const [lang, setLang] = usePreference<Lang>('lang', 'it')
  return { lang, setLang }
}
