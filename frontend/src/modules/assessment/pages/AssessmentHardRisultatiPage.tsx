import AssessmentHardPage from '@/modules/assessment/pages/AssessmentHardPage'

// "Risultati Valutazioni Professionali" (nav id:'hard-risultati') — same
// page/tabs as "Area Valutazioni Professionali" (id:'hard'), opened on the
// ranking/reporting tab instead of the individual-entry one, per the
// client's 14-item nav split.
export default function AssessmentHardRisultatiPage() {
  return <AssessmentHardPage defaultView="ranking" />
}
