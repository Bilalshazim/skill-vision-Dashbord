import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import { assessmentApi } from '@/lib/api/assessment'
import { ApiError } from '@/lib/api/client'
import { isDemoMode } from '@/lib/demo-mode'
import { type State5p, blank, demoState, normalizeState } from '@/modules/assessment/gestione5p/model'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { errorReason } from '@/modules/assessment/lib/server-sync'

export type Use5pState = {
  state: State5p
  update: (fn: (s: State5p) => State5p) => void
  /** Sostituisce tutto lo stato (nuovo progetto, progetto aperto da file). */
  replace: (s: State5p) => void
  status: 'loading' | 'error' | 'ready'
  error: string | null
  retry: () => void
}

// Parte 4 (PROGETTO-ASSESSMENT-SERVER.md §8): sul server il 5P è un documento
// per società con una versione. Le modifiche si salvano poco dopo l'ultima
// (si scrive nei campi a ogni tasto), una alla volta; se nel frattempo un
// collega ha salvato, il server risponde 409 e si ricarica la sua versione
// invece di sovrascriverla. Senza documento si parte vuoti (con i dati di
// esempio solo nella versione demo), e niente si salva finché non si modifica.
const SAVE_DELAY = 600

export function use5pState(): Use5pState {
  const { company, toast, ui, canEdit } = useAssessment()
  const companyId = company?.id ?? null
  const q = useQuery({
    queryKey: ['assessment', '5p', companyId],
    enabled: !!companyId,
    queryFn: () => assessmentApi.get5p(companyId!),
  })
  const [state, setState] = useState<State5p>(blank)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const stateRef = useRef(state)
  const version = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saving = useRef(false)
  const pending = useRef(false)

  useEffect(() => {
    if (!q.data || !companyId || saving.current || timer.current) return
    const next = q.data.state ? normalizeState(q.data.state as Partial<State5p>) : isDemoMode() ? demoState() : blank()
    version.current = q.data.version
    stateRef.current = next
    setState(next)
    setLoadedFor(companyId)
  }, [q.data, q.dataUpdatedAt, companyId])

  const refetch = q.refetch
  const save = useCallback(async () => {
    timer.current = null
    if (!companyId) return
    if (saving.current) {
      pending.current = true
      return
    }
    saving.current = true
    try {
      do {
        pending.current = false
        const res = await assessmentApi.put5p(companyId, stateRef.current, version.current)
        version.current = res.version
      } while (pending.current)
    } catch (err) {
      pending.current = false
      saving.current = false
      toast(err instanceof ApiError && err.status === 409 ? ui.fivePConflict : ui.serverSaveFailed(errorReason(err, ui.serverOffline)), 'err')
      await refetch()
    } finally {
      saving.current = false
    }
  }, [companyId, refetch, toast, ui])

  const schedule = useCallback(() => {
    if (!canEdit) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void save(), SAVE_DELAY)
  }, [canEdit, save])

  const update = useCallback(
    (fn: (s: State5p) => State5p) => {
      stateRef.current = fn(stateRef.current)
      setState(stateRef.current)
      schedule()
    },
    [schedule],
  )
  const replace = useCallback((s: State5p) => update(() => s), [update])

  // Una modifica non ancora salvata o in viaggio: chiudendo la pagina il browser chiede conferma.
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (timer.current || saving.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [])
  // Lasciando la pagina con un salvataggio in attesa, si salva subito.
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current)
        void save()
      }
    },
    [save],
  )

  return {
    state,
    update,
    replace,
    status: q.isError ? 'error' : loadedFor === companyId && companyId ? 'ready' : 'loading',
    error: q.isError ? errorReason(q.error, ui.serverOffline) : null,
    retry: () => void refetch(),
  }
}

