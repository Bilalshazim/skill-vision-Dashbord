import { ResultsPage } from '@/components/patterns/ResultsPage'
import { AssessmentModeSwitch } from '@/modules/assessment/components/AssessmentModeSwitch'
import { roiFigure } from '@/modules/assessment/components/RoiFigure'
import { useAssessmentResults } from '@/modules/assessment/lib/use-results'
import { useRoi } from '@/modules/assessment/lib/use-roi'

// 01 · Il valore (CLAUDE.md, Fase 6). In attesa di Roberto, che deve decidere
// come mettere in rapporto retribuzione e rendimento (2026-10-30): solo lo
// scheletro (più l'indice a 100 e la cifra del motore ROI, che non usano la regola
// fra RAL e punteggio) — percorso, titolo, domanda, «Perché è importante», le quattro
// sezioni al posto di uno stato vuoto «Contenuto in preparazione», gli
// approfondimenti. Nessun calcolo su RAL e punteggio finché la regola non c'è.
export default function IlValorePage() {
  const { res, data, win, f, crumbs, home, demoNote } = useAssessmentResults('il-valore')
  const roi = useRoi()
  return (
    <ResultsPage
      actions={<AssessmentModeSwitch />}
      crumbs={crumbs}
      number={win.number}
      title={win.title}
      question={win.q}
      why={res.valoreWhy}
      empty={{ title: res.valorePrep, description: res.valorePrepSub, scope: 'all' }}
      impact={{ index: { value: data.index, label: res.indexLabel, hint: res.indexHint }, euro: roiFigure(res, roi, 'valore') }}
      deepDives={[
        { label: res.deep.valore, to: '/assessment/valore' },
        { label: res.deep.risultati, to: f.A ? '/assessment/soft-risultati' : '/assessment/hard-risultati' },
        { label: res.deep.anagrafica, to: '/assessment/anagrafica' },
      ]}
      home={home}
      demoNote={demoNote}
    />
  )
}
