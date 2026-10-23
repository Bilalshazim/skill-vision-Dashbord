import { PageHeader } from '@/components/patterns/PageHeader'
import { type EvaluatorDoc, EvaluatorAreaCard } from '@/modules/recruiting/profile-hub/EvaluatorAreaCard'

const TITLES: Record<EvaluatorDoc, { title: string; description: string }> = {
  intervista: { title: 'Intervista strutturata', description: 'Il verbale di colloquio, da compilare qui o da far compilare ai valutatori.' },
  valutazione: { title: 'Valutazione candidato', description: 'La scheda con la matrice dei punteggi, da compilare qui o da far compilare ai valutatori.' },
  report: { title: 'Report finale di valutazione', description: 'La sintesi per la decisione, anche a partire dalle schede dei valutatori.' },
}

// Area Valutatori, livello 4 (documento del cliente, 2026-10-23): una pagina
// per ciascuna delle tre schede del Protocollo di Intervista, che prima
// stavano insieme nella card "Area Valutatori" del Profilo della ricerca.
export default function EvaluatorDocumentPage({ doc }: { doc: EvaluatorDoc }) {
  const page = TITLES[doc]
  return (
    <div className="flex flex-col gap-4">
      <PageHeader level="page" className="mb-0" eyebrow="Area valutatori" title={page.title} description={page.description} />
      <EvaluatorAreaCard key={doc} doc={doc} />
    </div>
  )
}
