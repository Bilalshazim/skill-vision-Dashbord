import { type State5p, normalizeState } from '@/modules/assessment/gestione5p/model'
import { hydrate } from '@/modules/assessment/lib/storage'
import type { AssessmentState } from '@/modules/assessment/lib/types'

// L'unico punto di Assessment che tocca l'archivio del browser, e solo per
// svuotarlo (PROGETTO-TUTTO-SUL-SERVER.md, Parte 1): "Importa dati del
// browser" legge quello che le versioni precedenti vi avevano salvato, lo
// porta sul server e, a import riuscito, lo cancella. Nessun'altra lettura o
// scrittura. Si toglie quando tutte le società hanno importato.
const ASSESSMENT_KEY = 'sv_assessment_state_v1'
const FIVE_P_KEY = 'sv5p_state_v1'

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Lo stato di Assessment rimasto nel browser, o `null`. */
export function readBrowserAssessment(): AssessmentState | null {
  const parsed = read(ASSESSMENT_KEY) as (Partial<AssessmentState> & { employees?: unknown }) | null
  return parsed && Array.isArray(parsed.employees) ? hydrate(parsed as Parameters<typeof hydrate>[0]) : null
}

/** La Valutazione 5P rimasta nel browser, se è un progetto vero (non i dati di esempio), o `null`. */
export function readBrowser5p(): State5p | null {
  const parsed = read(FIVE_P_KEY) as Partial<State5p> | null
  if (!parsed) return null
  const s = normalizeState(parsed)
  return !s.demo && s.people.length ? s : null
}

/** Dopo un import riuscito: niente resta nel browser. */
export function clearBrowserAssessment(): void {
  for (const key of [ASSESSMENT_KEY, FIVE_P_KEY, `${FIVE_P_KEY}_tab`]) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* archivio non disponibile: non c'è niente da togliere */
    }
  }
}
