import { isBackendAuth } from '@/lib/auth/auth-mode'
import { canEditAssessment } from '@/lib/auth/roles'
import { useSession } from '@/lib/auth/session'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast as sonnerToast } from 'sonner'

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

  // Ported from toast() (js/assessment.js ~2477-2483): una notifica alla
  // volta, in basso al centro, 3,2 s, varianti 'ok' / 'err'. Stessa firma di
  // prima, così le chiamate del modulo non cambiano; ora la mostra Sonner
  // (components/ui/sonner.tsx, montato una volta in App). La nuova sostituisce
  // quella ancora visibile, come nel legacy.
  const toast = useCallback((msg: string, type: '' | 'ok' | 'err' = '') => {
    sonnerToast.dismiss()
    const opts = { duration: 3200 }
    if (type === 'ok') sonnerToast.success(msg, opts)
    else if (type === 'err') sonnerToast.error(msg, opts)
    else sonnerToast(msg, opts)
  }, [])

  // Fase 8: in modalità `backend` chi può modificare lo decide il ruolo del
  // backend (lib/auth/roles.ts); EVALUATOR e READONLY leggono soltanto. In
  // `legacy` resta `true` come prima: il guscio non conosce ruoli. I 62 punti
  // del modulo leggono `canEdit` da qui.
  const { user } = useSession()
  const canEdit = isBackendAuth() ? canEditAssessment(user?.role) : true

  const value = useMemo<Ctx>(
    () => ({ state, setState, persist, lang, setLang, theme, setTheme, ui, canEdit, topbarActions, setTopbarActions, toast }),
    [state, setState, persist, lang, setLang, theme, setTheme, ui, canEdit, topbarActions, toast],
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
