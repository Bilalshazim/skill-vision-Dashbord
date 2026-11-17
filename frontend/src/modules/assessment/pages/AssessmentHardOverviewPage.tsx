import AssessmentGestioneValutazioniPage from '@/modules/assessment/pages/AssessmentGestioneValutazioniPage'

// "Competenze Professionali" (nav id:'hard-overview'), in Dashboarding: la somministrazione della
// valutazione 5P. Roberto, 2026-11-17: qui i quattro capitoli operativi (Piano di valutazione,
// Invio schede ai valutatori, Raccolta valutazioni, Assegnazione valori attesi); i risultati e il
// report finale stanno in Reporting → Valutazioni professionali (gestione-valutazioni).
export default function AssessmentHardOverviewPage() {
  return <AssessmentGestioneValutazioniPage section="dashboarding" />
}
