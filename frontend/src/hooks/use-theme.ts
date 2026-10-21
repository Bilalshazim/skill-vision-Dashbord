import { useEffect } from 'react'

import { usePreference } from '@/lib/preferences'

export type Theme = 'light' | 'dark'

// Il tema, uno solo per tutta l'applicazione. Sta nelle preferenze
// dell'utente sul server (lib/preferences.ts), non nel browser: così segue
// l'utente su ogni computer. Prima dell'accesso, e finché l'utente non ne
// sceglie uno, vale quello del sistema operativo.
export function systemTheme(): Theme {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyDomClass(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function useTheme() {
  const [theme, setTheme] = usePreference<Theme>('theme', systemTheme())
  useEffect(() => {
    applyDomClass(theme)
  }, [theme])
  return { theme, setTheme }
}
