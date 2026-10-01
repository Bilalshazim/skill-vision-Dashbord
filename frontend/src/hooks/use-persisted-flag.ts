import { useState } from 'react'

// Un sì/no ricordato nel browser (localStorage), con i due valori scritti
// come stringhe (`on` / `off`) per restare compatibile con quello che è già
// salvato. Lo storage può lanciare (navigazione privata, dati bloccati):
// si ripiega su `off` e l'interruttore funziona lo stesso per la sessione.
export function usePersistedFlag(storageKey: string, on: string, off: string): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(() => {
    try {
      return window.localStorage.getItem(storageKey) === on
    } catch {
      return false
    }
  })
  function set(next: boolean) {
    setValue(next)
    try {
      window.localStorage.setItem(storageKey, next ? on : off)
    } catch {
      // non salvato: vale solo per questa sessione
    }
  }
  return [value, set]
}
