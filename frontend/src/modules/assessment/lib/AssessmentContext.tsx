import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { useSharedLang } from '@/hooks/use-shared-lang'
import { useTheme } from '@/hooks/use-theme'
import type { AssessmentLang } from '@/modules/assessment/lib/legacy-utils'
import { getUI } from '@/modules/assessment/lib/legacy-utils'
import { readAssessmentState, writeAssessmentState } from '@/modules/assessment/lib/storage'
import type { AssessmentState } from '@/modules/assessment/lib/types'

// Single React context replacing legacy's mutable globals (STATE, UI/lang,
// theme) — see js/assessment.js ~2638 (`let STATE`), ~2059 (`let UI`), and
// applyTheme()/initTheme() (~34-50). Same underlying persistence
// (readAssessmentState/writeAssessmentState -> sv_assessment_state_v1),
// same shared shell keys for theme/language (sv_theme/sv_language) — just
// exposed as real React state instead of module-level `let`s.
//
// PHASE 24 — embedded-mode role: legacy's SPA-embed-hook (js/assessment.js
// ~8246-8290) always auto-authenticates and never resolves a specific
// CURRENT_USER_ROLE before calling applyRolePermissions(); CURRENT_USER_ROLE
// simply keeps its module-level default of 'admin' (~2129). React Assessment
// reproduces that exact embedded behavior: full (admin) permissions, no
// second login, no role resolution UI.
type Ctx = {
  state: AssessmentState
  setState: (updater: (prev: AssessmentState) => AssessmentState) => void
  persist: (next: AssessmentState) => void
  lang: AssessmentLang
  setLang: (lang: AssessmentLang) => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  ui: ReturnType<typeof getUI>
  canEdit: boolean
  topbarActions: ReactNode
  setTopbarActions: (node: ReactNode) => void
  toast: (msg: string, type?: '' | 'ok' | 'err') => void
  toastState: { msg: string; type: '' | 'ok' | 'err'; visible: boolean }
}

const AssessmentCtx = createContext<Ctx | null>(null)

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<AssessmentState>(() => readAssessmentState())
  // Global top bar's shared hooks — same sv_language/sv_theme keys as
  // before, now with same-tab instant sync (see use-theme.ts/use-shared-lang.ts),
  // so changing either from the top bar repaints Assessment immediately.
  const { lang, setLang } = useSharedLang()
  const { theme, setTheme } = useTheme()

  const persist = useCallback((next: AssessmentState) => {
    writeAssessmentState(next)
    setStateRaw(next)
  }, [])

  // Ported from saveState()'s pattern: fresh-mutate-persist. Callers pass an
  // updater over the PREVIOUS state (never a stale closed-over snapshot),
  // then the result is both written to storage and set as the new state.
  const setState = useCallback(
    (updater: (prev: AssessmentState) => AssessmentState) => {
      setStateRaw((prev) => {
        const next = updater(prev)
        writeAssessmentState(next)
        return next
      })
    },
    [],
  )

  const ui = useMemo(() => getUI(lang), [lang])

  // Ported from setTopbarActions() (js/assessment.js ~3248) — each page sets
  // its own topbar action button(s) (e.g. "Nuova valutazione", CSV export)
  // on mount and clears them on unmount, exactly mirroring legacy's
  // per-page renderX() always fully replacing #topbar-actions' previous
  // content on navigation.
  const [topbarActions, setTopbarActions] = useState<ReactNode>(null)

  // Ported from toast() (js/assessment.js ~2477-2483) — one global toast
  // singleton, bottom-center, auto-hides after 3.2s, 'ok'/'err' color
  // variants. Legacy clears any pending hide timeout on a new toast() call
  // before scheduling a fresh one; reproduced the same way with a ref.
  const [toastState, setToastState] = useState<{ msg: string; type: '' | 'ok' | 'err'; visible: boolean }>({ msg: '', type: '', visible: false })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toast = useCallback((msg: string, type: '' | 'ok' | 'err' = '') => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToastState({ msg, type, visible: true })
    toastTimer.current = setTimeout(() => setToastState((prev) => ({ ...prev, visible: false })), 3200)
  }, [])

  const value = useMemo<Ctx>(
    () => ({ state, setState, persist, lang, setLang, theme, setTheme, ui, canEdit: true, topbarActions, setTopbarActions, toast, toastState }),
    [state, setState, persist, lang, setLang, theme, setTheme, ui, topbarActions, toast, toastState],
  )

  return <AssessmentCtx.Provider value={value}>{children}</AssessmentCtx.Provider>
}

export function useAssessment(): Ctx {
  const ctx = useContext(AssessmentCtx)
  if (!ctx) throw new Error('useAssessment must be used within AssessmentProvider')
  return ctx
}

// Sets the shared topbar's action slot for the lifetime of the calling page,
// clearing it on unmount — matches every renderX() in legacy calling
// setTopbarActions() on entry, with the next page's renderX() (or the empty
// setTopbarActions('') some pages call) overwriting it on navigation.
export function useTopbarActions(node: ReactNode, deps: unknown[]) {
  const { setTopbarActions } = useAssessment()
  useEffect(() => {
    setTopbarActions(node)
    return () => setTopbarActions(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
