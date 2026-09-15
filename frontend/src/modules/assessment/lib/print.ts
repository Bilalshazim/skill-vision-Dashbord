// Ported from exiPrintReport()/downloadEmployeeReport()'s shared print
// mechanism (js/assessment.js ~6310-6342, ~7281-7290) — both write trusted,
// developer-authored HTML (never user free-text beyond esc()-safe
// interpolation) into the single #report-print-container mounted once in
// AssessmentShell, then trigger window.print(); css/assessment.css's
// @media print block hides everything else. The 150ms delay before print()
// matches legacy exactly (lets the container's layout settle first).
export function printReportHtml(html: string) {
  const el = document.getElementById('report-print-container')
  if (!el) return
  el.innerHTML = html
  setTimeout(() => window.print(), 150)
}
