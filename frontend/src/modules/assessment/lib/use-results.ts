import { useMemo } from 'react'

import { isDemoMode } from '@/lib/demo-mode'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { assessmentResults, type RankedPerson } from '@/modules/assessment/lib/results'
import { useRoi } from '@/modules/assessment/lib/use-roi'

export const ASSESSMENT_HOME = '/assessment/home'

// Quello che le quattro pagine dei risultati di Assessment hanno in comune:
// i testi (ui-text, `res`), i numeri (lib/results.ts), la finestra della
// pagina (numero, titolo, domanda), la riga del percorso che parte da "Home",
// e la nota dei dati dimostrativi con il nome della società.
export function useAssessmentResults(slug: string) {
  const { state, lang, ui, company } = useAssessment()
  const res = ui.res
  const data = useMemo(() => assessmentResults(state, lang), [state, lang])
  const win = res.windows.find((w: { slug: string }) => w.slug === slug)!
  const roi = useRoi()
  const f = { A: state.settings.modulo === 'A' || state.settings.modulo === 'AB', B: state.settings.modulo === 'B' || state.settings.modulo === 'AB' }
  return {
    res,
    data,
    win,
    /** L'etichetta della home sopra il titolo: «01 · Rendimento». */
    theme: win.theme as string,
    f,
    crumbs: [{ label: res.home, to: ASSESSMENT_HOME }],
    home: { label: res.backHome, to: ASSESSMENT_HOME },
    // Con il bilancio caricato gli euro ci sono: la nota dice solo che i dati sono dimostrativi.
    demoNote: isDemoMode() ? (roi.status === 'ready' ? (company?.name ?? '—') : `${company?.name ?? '—'} · ${res.roiDemoNote}`) : undefined,
    /** Le prime tre persone di una fascia, una riga ciascuna: nome, mansione, valore espresso. */
    topThree: (list: RankedPerson[]) =>
      list.slice(0, 3).map((r) => ({ id: r.e.id, text: `${r.e.nome} ${r.e.cognome} · ${r.e.ruolo || r.e.mansione} · ${res.indexPct(r.index)}` })),
  }
}
