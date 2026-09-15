import { useEffect, useState } from 'react'

import { readSharedTheme, writeSharedTheme } from '@/modules/assessment/lib/shell-bridge'

export type Theme = 'light' | 'dark'

// Now the ONE global theme — same sv_theme key Assessment's own
// AssessmentContext already reads/writes via shell-bridge.ts (previously
// this hook used an isolated 'sv-react-theme' key, kept apart from the
// legacy app on purpose; the global top bar unifies them, per the
// "one shared theme toggle" requirement). The listener set below gives
// same-tab instant sync: a same-tab localStorage write never fires the
// native `storage` event (only OTHER tabs get that), so without it,
// toggling from the top bar wouldn't repaint Assessment's own theme-driven
// UI until its next mount.
type Listener = (theme: Theme) => void
const listeners = new Set<Listener>()

function applyDomClass(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => readSharedTheme())

  useEffect(() => {
    applyDomClass(theme)
  }, [theme])

  useEffect(() => {
    const onExternal: Listener = (next) => setThemeState(next)
    listeners.add(onExternal)
    function onStorage(e: StorageEvent) {
      if (e.key === 'sv_theme') setThemeState(readSharedTheme())
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(onExternal)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  function setTheme(next: Theme) {
    writeSharedTheme(next)
    setThemeState(next)
    listeners.forEach((l) => l(next))
  }

  return { theme, setTheme }
}
