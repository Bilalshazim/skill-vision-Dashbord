import { PageHeader } from '@/components/patterns/PageHeader'
import { CvRankingList } from '@/modules/recruiting/pagina-a/CvRankingList'

// «Ranking» (Decisioni del 2026-11-06): i candidati della posizione per match CV / profilo. La
// rotta resta quella di prima; lo stesso elenco sta in «Chi è più adatto?».
export default function PaginaAPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader level="page" className="mb-0" title="Ranking" description="Candidati della posizione con CV caricato e senza test, ordinati per corrispondenza CV/profilo. Il clic sul nome apre il CV. Spunta i candidati, aggiungi l'email e invia il link ai selezionati, oppure da ogni riga. Chi ha già ricevuto il link non si può spuntare." />
      <CvRankingList />
    </div>
  )
}
