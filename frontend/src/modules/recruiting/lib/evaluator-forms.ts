import { ApiError, apiFileUrl } from '@/lib/api/client'
import { evaluatorsApi } from '@/lib/api/endpoints'
import type { EvaluatorFormKind, EvaluatorFormUploadDto } from '@/lib/api/endpoints'

// Le due schede dell'Area Valutatori, con il nome che si vede a schermo.
export const FORM_KIND_LABEL: Record<EvaluatorFormKind, string> = { INTERVISTA: 'Intervista strutturata', VALUTAZIONE: 'Valutazione candidato' }

const errorMessage = (err: unknown) => (err instanceof ApiError ? err.message : 'Errore di rete: riprova fra qualche istante.')

// Apre una scheda caricata in una scheda nuova, aperta subito dentro il clic:
// dopo l'attesa del link il browser la bloccherebbe (come per il CV).
// Restituisce il messaggio d'errore, o null.
export async function openFormUpload(upload: EvaluatorFormUploadDto): Promise<string | null> {
  const tab = window.open('', '_blank')
  try {
    const { download } = await evaluatorsApi.formUploadLink(upload.id)
    const url = apiFileUrl(download.url)
    if (tab) tab.location.href = url
    else window.open(url, '_blank')
    return null
  } catch (err) {
    tab?.close()
    return `Impossibile aprire il file: ${errorMessage(err)}`
  }
}
