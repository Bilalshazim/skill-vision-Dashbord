import { ResultsPage } from '@/components/patterns/ResultsPage'
import { useAssessmentResults } from '@/modules/assessment/lib/use-results'

// 01 · Il valore (CLAUDE.md, Fase 6). In attesa di Roberto, che deve decidere
// come mettere in rapporto retribuzione e rendimento (2026-10-30): solo lo
// scheletro — percorso, titolo, domanda, «Perché è importante», le quattro
// sezioni al posto di uno stato vuoto «Contenuto in preparazione», gli
// approfondimenti. Nessun calcolo su RAL e punteggio finché la regola non c'è.
export default function IlValorePage() {
  const { res, win, f, crumbs, home, demoNote } = useAssessmentResults('il-valore')
  return (
    <ResultsPage
      crumbs={crumbs}
      number={win.number}
      title={win.title}
      question={win.q}
      why={res.valoreWhy}
      empty={{ title: res.valorePrep, description: res.valorePrepSub, scope: 'all' }}
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
