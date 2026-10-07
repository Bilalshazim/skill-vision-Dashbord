import { useCallback, useState } from 'react'

import { type State5p, demoState, loadState, saveState } from '@/modules/assessment/gestione5p/model'

// Lo stato del modulo, salvato nel browser a ogni modifica. Come nel modello:
// se non c'è niente di salvato si parte dai dati di esempio, con l'avviso e il
// pulsante "Nuovo progetto vuoto".
export function use5pState() {
  const [state, setState] = useState<State5p>(() => loadState() ?? demoState())
  const update = useCallback((fn: (s: State5p) => State5p) => {
    setState((prev) => {
      const next = fn(prev)
      saveState(next)
      return next
    })
  }, [])
  // Sostituisce tutto lo stato (nuovo progetto, progetto aperto da file).
  const replace = useCallback((s: State5p) => {
    saveState(s)
    setState(s)
  }, [])
  return { state, update, replace }
}
