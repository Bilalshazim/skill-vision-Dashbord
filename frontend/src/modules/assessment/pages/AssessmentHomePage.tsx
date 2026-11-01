import { PageHeader } from '@/components/patterns/PageHeader'
import { WindowCard } from '@/components/patterns/WindowCard'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'

// La Home di Assessment (CLAUDE.md, Fase 6, "Le due home", approvato da
// Roberto il 2026-10-29; tavola «Assessment · 1 Home»): prima voce del menu,
// sovratitolo con la società, titolo "Quello che devi sapere" sulla scala del
// sito e le quattro finestre in griglia 2×2, ognuna con numero, titolo,
// sottotitolo e domanda. Nessun numero di dati, nessun grafico, nessuna
// icona. Il clic apre la pagina dei risultati di quella finestra.
// L'intestazione è della pagina, non del layout (`home` non ha titolo in
// PAGE_META_TEXT): è di presentazione, non di lavoro.
export default function AssessmentHomePage() {
  const { ui, company } = useAssessment()
  return (
    <div className="flex flex-col gap-6">
      <PageHeader level="presentation" className="mb-0" eyebrow={[company?.name, 'Assessment'].filter(Boolean).join(' · ')} title={ui.res.homeTitle} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {ui.res.windows.map((w: { slug: string; number: string; title: string; sub: string; q: string }) => (
          <WindowCard key={w.slug} to={`/assessment/${w.slug}`} number={w.number} title={w.title} subtitle={w.sub} question={w.q} />
        ))}
      </div>
    </div>
  )
}
