// Lo scaricamento di un file generato nel browser (CSV, JSON, Excel): nessun
// server coinvolto. Un'implementazione sola per i due moduli; prima ce n'erano
// cinque copie, alcune liberavano il file prima che il browser lo leggesse.

export const CSV_TYPE = 'text/csv;charset=utf-8;'
export const JSON_TYPE = 'application/json'

export function downloadBlob(name: string, data: Blob): void {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(data)
  a.download = name
  document.body.appendChild(a)
  a.click()
  // Il file si libera dopo, non subito: alcuni browser lo leggono in ritardo.
  setTimeout(() => {
    URL.revokeObjectURL(a.href)
    a.remove()
  }, 2000)
}

export function downloadText(name: string, content: string, type: string): void {
  downloadBlob(name, new Blob([content], { type }))
}
