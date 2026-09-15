import { useEffect, useState } from 'react'

import { readSharedLang, writeSharedLang } from '@/modules/assessment/lib/shell-bridge'

export type Lang = 'it' | 'en'

// Mirrors use-theme.ts's pattern: ONE shared sv_language key (shell-bridge.ts),
// read by both the global top bar and Assessment's own AssessmentContext,
// with an in-memory listener set for same-tab instant sync (a same-tab
// localStorage write never fires the native `storage` event).
type Listener = (lang: Lang) => void
const listeners = new Set<Listener>()

export function useSharedLang() {
  const [lang, setLangState] = useState<Lang>(() => readSharedLang())

  useEffect(() => {
    const onExternal: Listener = (next) => setLangState(next)
    listeners.add(onExternal)
    function onStorage(e: StorageEvent) {
      if (e.key === 'sv_language') setLangState(readSharedLang())
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(onExternal)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  function setLang(next: Lang) {
    writeSharedLang(next)
    setLangState(next)
    listeners.forEach((l) => l(next))
  }

  return { lang, setLang }
}
