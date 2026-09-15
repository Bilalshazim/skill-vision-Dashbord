import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { computeHardSummary } from '@/modules/assessment/lib/calculations'
import { getApex5dDimensions, getApexSources, getUI } from '@/modules/assessment/lib/legacy-utils'
import { readSharedLang, readSharedTheme } from '@/modules/assessment/lib/shell-bridge'
import { readAssessmentState, writeAssessmentState } from '@/modules/assessment/lib/storage'
import '@/modules/assessment/styles/assessment-scoped.css'

// Migrated from enterRestrictedEvaluatorMode()/renderRestrictedEvalScreen()/
// submitRestrictedEval() (js/assessment.js ~6676-6769). Reached ONLY via
// /assessment/evaluate?evalToken=<token> (legacy: modules/assessment.html?
// evalToken=<token> — same query param name, new route instead of a query
// param on the module root since React needs a distinct top-level route to
// skip AssessmentLayout's shell/auth-guard entirely).
//
// AUTH: deliberately bypasses AssessmentAuthGuard/AssessmentProvider — an
// external evaluator opening this link has no shell login at all (matches
// legacy exactly: enterRestrictedEvaluatorMode() hides #login-screen and
// shows #eval-restricted-screen with no auth check whatsoever, since the
// per-assignment token IS the credential). Reads/writes
// sv_assessment_state_v1 directly via the same storage boundary as the rest
// of Assessment, bypassing AssessmentContext (which assumes a shell session).
export default function AssessmentEvaluatePage() {
  const [params] = useSearchParams()
  const token = params.get('evalToken')
  const lang = readSharedLang()
  const theme = readSharedTheme()
  const ui = getUI(lang)
  const [state, setState] = useState(() => readAssessmentState())
  const [submitted, setSubmitted] = useState(false)

  const assignment = state.evalAssignments.find((a) => a.token === token) || null
  const emp = assignment ? state.employees.find((e) => e.id === assignment.targetEmployeeId) : undefined
  const APEX5D_DIMENSIONS = getApex5dDimensions(lang)
  const sourceLabel = assignment ? getApexSources(lang).find((s) => s.key === assignment.templateType)?.label || '' : ''

  // Lazy-initialized once: emp/assignment are already resolved synchronously
  // from the state read on mount (no async loading step), so this never
  // needs to re-derive after the first render.
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    if (emp && assignment) {
      APEX5D_DIMENSIONS.forEach((dim) =>
        dim.items.forEach((it) => {
          initial[it.cod] = (emp.hard[assignment.templateType] || {})[it.cod] || 6
        }),
      )
    }
    return initial
  })

  function submit() {
    if (!assignment || !emp) return
    const source = assignment.templateType
    const nextState = structuredClone(state)
    const nEmp = nextState.employees.find((e) => e.id === emp.id)!
    if (!nEmp.hard[source]) nEmp.hard[source] = {}
    Object.entries(values).forEach(([cod, v]) => {
      nEmp.hard[source][cod] = v
    })
    if (!nEmp.hardEvaluatedBy) nEmp.hardEvaluatedBy = { resp: '', peer: '', auto: '' }
    nEmp.hardEvaluatedBy[source] = source === 'auto' ? `${nEmp.nome} ${nEmp.cognome}` : assignment.evaluatorName || ''
    if (source !== 'auto' && assignment.evaluatorName) {
      if (!nextState.evaluators) nextState.evaluators = []
      if (!nextState.evaluators.some((n) => n.toLowerCase() === assignment.evaluatorName.toLowerCase())) nextState.evaluators.push(assignment.evaluatorName)
    }
    const period = nextState.evalPeriods.find((p) => p.id === assignment.periodId)
    if (!Array.isArray(nEmp.hardHistory)) nEmp.hardHistory = []
    const hsm = computeHardSummary(nEmp, lang)
    nEmp.hardHistory.push({
      module: 'professional',
      periodId: assignment.periodId,
      periodLabel: period ? period.label : '',
      date: new Date().toISOString(),
      source,
      apexScore: hsm.apexScore,
      dims: hsm.dims.map((d) => ({ code: d.code, name: d.name, score: d.mediaTotale })),
    })
    const nAssignment = nextState.evalAssignments.find((a) => a.id === assignment.id)!
    nAssignment.status = 'completed'
    nAssignment.completedAt = new Date().toISOString()
    writeAssessmentState(nextState)
    setState(nextState)
    setSubmitted(true)
  }

  const brand = (
    <div className="login-brand" style={{ marginBottom: 28 }}>
      <img className="brand-logo theme-logo-light" src="/brand/logo_black.svg" alt="SkillVision" />
      <img className="brand-logo theme-logo-dark" src="/brand/logo_white.svg" alt="SkillVision" />
      <div className="t2">{ui.brandTagline}</div>
    </div>
  )

  let body: React.ReactNode
  if (!assignment || !emp) {
    body = (
      <div className="card">
        <div className="card-title">{ui.reInvalidLinkTitle}</div>
        <p className="small-note" style={{ marginTop: 8 }}>
          {ui.reInvalidLinkDesc}
        </p>
      </div>
    )
  } else if (assignment.status === 'completed' && !submitted) {
    body = (
      <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div className="card-title" style={{ marginBottom: 8 }}>
          {ui.reThankYouTitle}
        </div>
        <p className="small-note">{ui.reThankYouDesc(assignment.completedAt ? assignment.completedAt.slice(0, 10) : '')}</p>
      </div>
    )
  } else if (submitted) {
    body = (
      <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div className="card-title" style={{ marginBottom: 8 }}>
          {ui.reThankYouTitle}
        </div>
        <p className="small-note">{ui.reThankYouDesc(new Date().toISOString().slice(0, 10))}</p>
      </div>
    )
  } else {
    body = (
      <>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">{ui.reFormTitle}</div>
          <p className="small-note" style={{ marginTop: 6 }}>
            {ui.reFormDesc(`${emp.nome} ${emp.cognome}`, sourceLabel)}
          </p>
        </div>
        <div>
          {APEX5D_DIMENSIONS.map((dim) => (
            <div className="cluster-block" key={dim.code}>
              <div className="cluster-title">
                {ui.hardDimensionPrefix} {dim.code} — {dim.name} <span style={{ textTransform: 'none', fontWeight: 500, color: 'var(--text-3)' }}>· {dim.desc}</span>
              </div>
              {dim.items.map((it) => (
                <div className="score-row" title={it.q} key={it.cod}>
                  <div className="sname">
                    {it.cod} · {it.area}
                  </div>
                  <input
                    className="sslider"
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={values[it.cod] ?? 6}
                    onChange={(e) => setValues((prev) => ({ ...(prev || {}), [it.cod]: Number(e.target.value) }))}
                  />
                  <div className="sval">{values[it.cod] ?? 6}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <button className="btn btn-primary" onClick={submit}>
            {ui.reSubmitBtn}
          </button>
        </div>
      </>
    )
  }

  return (
    <div className="sv-assessment-shell" data-theme={theme}>
      <div id="eval-restricted-screen" className="open">
        <div className="eval-restricted-inner">
          {brand}
          {body}
        </div>
      </div>
    </div>
  )
}
