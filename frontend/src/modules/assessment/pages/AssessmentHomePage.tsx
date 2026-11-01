import { WindowCard } from '@/components/patterns/WindowCard'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'

// La Home di Assessment (CLAUDE.md, Fase 6, "Le due home", approvato da
// Roberto il 2026-10-29): prima voce del menu, titolo "Quello che devi
// sapere" (dall'intestazione del layout) e le quattro finestre in griglia
// 2×2, ognuna con numero, titolo, sottotitolo e domanda. Nessun numero di
// dati, nessun grafico, nessuna icona. Il clic apre la pagina dei risultati
// di quella finestra. La Panoramica è la seconda voce.
export default function AssessmentHomePage() {
  const { ui } = useAssessment()
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {ui.res.windows.map((w: { slug: string; number: string; title: string; sub: string; q: string }) => (
        <WindowCard key={w.slug} to={`/assessment/${w.slug}`} number={w.number} title={w.title} subtitle={w.sub} question={w.q} />
      ))}
    </div>
  )
}
