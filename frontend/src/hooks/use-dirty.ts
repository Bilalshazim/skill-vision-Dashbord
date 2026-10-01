import { useState } from 'react'

// true quando i valori di un modulo sono diversi da quelli di partenza.
// Si passa un oggetto con i campi del modulo; il confronto è per valore.
// `resetKey`: quando cambia (per esempio `open` di un dialog che resta
// montato e ricarica la bozza all'apertura) la partenza si rifà sui valori
// di quel momento. Serve a `dirty` di ModalDialog / DialogContent.
// Schema "stato dal render precedente" della documentazione di React.
export function useDirty(values: unknown, resetKey?: unknown): boolean {
  const current = JSON.stringify(values)
  const [base, setBase] = useState(() => ({ key: resetKey, value: current }))
  if (base.key !== resetKey) {
    setBase({ key: resetKey, value: current })
    return false
  }
  return current !== base.value
}
