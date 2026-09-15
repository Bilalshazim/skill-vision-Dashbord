import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'

// Ported from #toast (modules/assessment.html ~144, css/assessment.css
// ~498-503) — a single fixed bottom-center element, className toggling
// show/ok/err. Mounted once per shell (matches legacy's single #toast node).
export function ToastHost() {
  const { toastState } = useAssessment()
  return (
    <div id="toast" className={`${toastState.visible ? 'show' : ''}${toastState.type ? ` ${toastState.type}` : ''}`}>
      {toastState.msg}
    </div>
  )
}
