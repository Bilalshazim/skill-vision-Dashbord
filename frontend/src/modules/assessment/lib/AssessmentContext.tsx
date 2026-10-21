import { canEditAssessment } from '@/lib/auth/roles'
import { useSession } from '@/lib/auth/session'
import { useQuery } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast as sonnerToast } from 'sonner'

import { useSharedLang } from '@/hooks/use-shared-lang'
import { useTheme } from '@/hooks/use-theme'
import { assessmentApi } from '@/lib/api/assessment'
import type { BackendCompany } from '@/lib/api/types'
import type { AssessmentLang } from '@/modules/assessment/lib/legacy-utils'
import { getUI } from '@/modules/assessment/lib/legacy-utils'
import { errorReason, fromServer, runSync, type Baseline } from '@/modules/assessment/lib/server-sync'
import { hydrate } from '@/modules/assessment/lib/storage'
import type { AssessmentState } from '@/modules/assessment/lib/types'
import { useAssessmentCompanies } from '@/modules/assessment/lib/use-assessment-company'

// Single React context replacing legacy's mutable globals (STATE, UI/lang,
// theme) — see js/assessment.js ~2638 (`let STATE`), ~2059 (`let UI`), and
// applyTheme()/initTheme() (~34-50). Same shared shell keys for theme/language
// (sv_theme/sv_language) — just exposed as real React state instead of
// module-level `let`s.
//
// I dati stanno solo sul server (PROGETTO-TUTTO-SUL-SERVER.md, Parte 1): lo
// stato arriva dal backend per la società attiva e ogni modifica si salva lì.
// Le schermate restituiscono lo stato intero come quando stava nel browser, e
// il contesto manda al server le sole parti cambiate (server-sync.ts).
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
  /** Amministratore (della società o della piattaforma): vede la RAL (decisione 3 del 2026-10-14) e importa i dati del browser. */
  isAdmin: boolean
  topbarActions: ReactNode
  setTopbarActions: (node: ReactNode) => void
  toast: (msg: string, type?: '' | 'ok' | 'err') => void
  /** `ready` quando `state` è quello vero; prima le pagine mostrano il caricamento. */
  status: 'loading' | 'error' | 'empty' | 'ready'
  error: string | null
  retry: () => void
  /** Le società fra cui scegliere (lo staff ne vede più d'una) e quella attiva. */
  companies: BackendCompany[]
  company: BackendCompany | null
  setCompanyId: (id: string) => void
}

const AssessmentCtx = createContext<Ctx | null>(null)

const ADMIN_ROLES = new Set(['PLATFORM_ADMIN', 'COMPANY_ADMIN'])

// Ciò che non dipende da dove stanno i dati: lingua, tema, testi, permessi,
// notifiche, azioni della pagina.
function useShared() {
  // Global top bar's shared hooks — same sv_language/sv_theme keys as
  // before, now with same-tab instant sync (see use-theme.ts/use-shared-lang.ts),
  // so changing either from the top bar repaints Assessment immediately.
  const { lang, setLang } = useSharedLang()
  const { theme, setTheme } = useTheme()
  const ui = useMemo(() => getUI(lang), [lang])

  // Ported from setTopbarActions() (js/assessment.js ~3248) — each page sets
  // its own topbar action button(s) on mount and clears them on unmount.
  const [topbarActions, setTopbarActions] = useState<ReactNode>(null)

  // Ported from toast() (js/assessment.js ~2477-2483): una notifica alla
  // volta, 3,2 s, varianti 'ok' / 'err'. La mostra Sonner (components/ui/
  // sonner.tsx, montato una volta in App); la nuova sostituisce la precedente.
  const toast = useCallback((msg: string, type: '' | 'ok' | 'err' = '') => {
    sonnerToast.dismiss()
    const opts = { duration: 3200 }
    if (type === 'ok') sonnerToast.success(msg, opts)
    else if (type === 'err') sonnerToast.error(msg, opts)
    else sonnerToast(msg, opts)
  }, [])

  // Fase 8: chi può modificare lo decide il ruolo del backend
  // (lib/auth/roles.ts); EVALUATOR e READONLY leggono soltanto.
  const { user } = useSession()
  const canEdit = canEditAssessment(user?.role)
  const isAdmin = ADMIN_ROLES.has(user?.role ?? '')

  return useMemo(
    () => ({ lang, setLang, theme, setTheme, ui, topbarActions, setTopbarActions, toast, canEdit, isAdmin }),
    [lang, setLang, theme, setTheme, ui, topbarActions, toast, canEdit, isAdmin],
  )
}

const EMPTY_STATE = hydrate({ employees: [] })

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const shared = useShared()
  const { ui, toast, canEdit } = shared
  const org = useAssessmentCompanies(true)
  const companyId = org.company?.id ?? null

  const q = useQuery({
    queryKey: ['assessment', 'state', companyId],
    enabled: !!companyId,
    queryFn: () => assessmentApi.state(companyId!),
  })

  const [state, setStateRaw] = useState<AssessmentState>(EMPTY_STATE)
  // La società di cui `state` contiene i dati: finché non è quella attiva, si carica.
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  // `stateRef` è sempre l'ultimo stato delle schermate, `baselineRef` l'ultimo
  // che il server ha confermato: il salvataggio manda la differenza.
  const stateRef = useRef(state)
  const baselineRef = useRef<Baseline | null>(null)
  const syncing = useRef(false)
  const pending = useRef(false)

  // Dati nuovi dal server (primo caricamento, cambio di società, ricarica dopo
  // un errore o un import, ritorno sulla scheda): diventano lo stato delle
  // schermate. Non durante un salvataggio, che li renderebbe già vecchi.
  useEffect(() => {
    if (!q.data || !org.company || syncing.current) return
    const { state: next, baseline } = fromServer(q.data, org.company.name)
    stateRef.current = next
    baselineRef.current = baseline
    setStateRaw(next)
    setLoadedFor(org.company.id)
  }, [q.data, q.dataUpdatedAt, org.company])

  const refetch = q.refetch
  const flush = useCallback(async () => {
    if (!companyId || !baselineRef.current) return
    if (syncing.current) {
      pending.current = true
      return
    }
    syncing.current = true
    try {
      do {
        pending.current = false
        const target = stateRef.current
        const tokens = await runSync(companyId, baselineRef.current, target)
        baselineRef.current = target
        // Il link di un'assegnazione nuova usa il token del server.
        if (tokens.size) {
          stateRef.current = { ...stateRef.current, evalAssignments: stateRef.current.evalAssignments.map((a) => (tokens.has(a.id) ? { ...a, token: tokens.get(a.id)! } : a)) }
          setStateRaw(stateRef.current)
        }
      } while (pending.current)
    } catch (err) {
      // Il server resta la verità: niente salvataggi silenziosi a metà, si
      // dice cosa non è andato e si torna ai dati salvati.
      toast(ui.serverSaveFailed(errorReason(err, ui.serverOffline)), 'err')
      pending.current = false
      syncing.current = false
      await refetch()
    } finally {
      syncing.current = false
    }
  }, [companyId, refetch, toast, ui])

  const setState = useCallback(
    (updater: (prev: AssessmentState) => AssessmentState) => {
      const next = updater(stateRef.current)
      stateRef.current = next
      setStateRaw(next)
      // Chi legge soltanto non salva: le schermate glielo dicono già.
      if (canEdit) void flush()
    },
    [canEdit, flush],
  )
  const persist = useCallback((next: AssessmentState) => setState(() => next), [setState])

  // Tornando sulla scheda si rilegge il server: un valutatore esterno o un
  // collega può aver salvato nel frattempo, e salvare un dipendente sopra una
  // copia vecchia cancellerebbe il suo lavoro. Si salta se un salvataggio è in corso.
  useEffect(() => {
    const onReturn = () => {
      if (document.visibilityState === 'visible' && !syncing.current) void refetch()
    }
    window.addEventListener('focus', onReturn)
    document.addEventListener('visibilitychange', onReturn)
    return () => {
      window.removeEventListener('focus', onReturn)
      document.removeEventListener('visibilitychange', onReturn)
    }
  }, [refetch])

  // Chiudere la pagina durante un salvataggio lo interromperebbe: il browser chiede conferma.
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (syncing.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [])

  const failure = org.status === 'error' ? org.error : q.isError ? q.error : null
  const status: Ctx['status'] =
    failure ? 'error' : org.status === 'loading' ? 'loading' : !org.company ? 'empty' : loadedFor === companyId ? 'ready' : 'loading'
  const retry = useCallback(() => {
    if (org.status === 'error') org.retry()
    else void refetch()
  }, [org, refetch])

  const value = useMemo<Ctx>(
    () => ({
      ...shared,
      state,
      setState,
      persist,
      status,
      error: failure ? errorReason(failure, ui.serverOffline) : null,
      retry,
      companies: org.companies,
      company: org.company,
      setCompanyId: org.setCompanyId,
    }),
    [shared, state, setState, persist, status, failure, ui, retry, org.companies, org.company, org.setCompanyId],
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
