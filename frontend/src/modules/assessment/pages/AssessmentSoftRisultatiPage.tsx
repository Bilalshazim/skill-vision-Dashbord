import AssessmentSoftPage from '@/modules/assessment/pages/AssessmentSoftPage'

// "Risultati Valutazioni Trasversali" (nav id:'soft-risultati') — same page/
// tabs as "Area Valutazioni Trasversali" (id:'soft'), opened on the
// ranking/reporting tab instead of the org-overview one, per the client's
// 14-item nav split. See AssessmentSoftPage.tsx's own comment for why this
// is a shared component rather than duplicated chart/calculation logic.
export default function AssessmentSoftRisultatiPage() {
  return <AssessmentSoftPage defaultView="ranking" />
}
