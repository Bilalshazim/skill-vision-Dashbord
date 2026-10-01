import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Logo } from '@/layouts/Logo'
import { Note } from '@/components/patterns/Note'
import { Slider } from '@/components/ui/slider'
import { Card, CardTitle, CardLabel } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { computeHardSummary } from '@/modules/assessment/lib/calculations'
import { getApex5dDimensions, getApexSources, getUI } from '@/modules/assessment/lib/legacy-utils'
import { readSharedLang } from '@/modules/assessment/lib/shell-bridge'
import { readAssessmentState, writeAssessmentState } from '@/modules/assessment/lib/storage'
import '@/modules/assessment/styles/assessment-print.css'

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
    <div className="mb-8 flex flex-col items-center gap-2">
      <Logo size="lg" />
      <div className="label-mono text-muted-foreground">{ui.brandTagline}</div>
    </div>
  )

  let body: React.ReactNode
  if (!assignment || !emp) {
    body = (
      <Card>
        <CardTitle>{ui.reInvalidLinkTitle}</CardTitle>
        <Note className="mt-2">
          {ui.reInvalidLinkDesc}
        </Note>
      </Card>
    )
  } else if (assignment.status === 'completed' && !submitted) {
    body = (
      <Card className="text-center px-6 py-12">
        <CardTitle className="mb-2">
          {ui.reThankYouTitle}
        </CardTitle>
        <Note>{ui.reThankYouDesc(assignment.completedAt ? assignment.completedAt.slice(0, 10) : '')}</Note>
      </Card>
    )
  } else if (submitted) {
    body = (
      <Card className="text-center px-6 py-12">
        <CardTitle className="mb-2">
          {ui.reThankYouTitle}
        </CardTitle>
        <Note>{ui.reThankYouDesc(new Date().toISOString().slice(0, 10))}</Note>
      </Card>
    )
  } else {
    body = (
      <>
        <Card className="mb-4">
          <CardTitle>{ui.reFormTitle}</CardTitle>
          <Note className="mt-2">
            {ui.reFormDesc(`${emp.nome} ${emp.cognome}`, sourceLabel)}
          </Note>
        </Card>
        <div>
          {APEX5D_DIMENSIONS.map((dim) => (
            <section className="mb-4" key={dim.code}>
              <CardLabel className="mb-2 border-b border-border pb-2">
                {ui.hardDimensionPrefix} {dim.code} — {dim.name} <span className="font-sans tracking-normal normal-case">· {dim.desc}</span>
              </CardLabel>
              {dim.items.map((it) => (
                <div className="flex items-center gap-3 border-b border-border py-2 last:border-b-0" title={it.q} key={it.cod}>
                  <div className="w-72 shrink-0 text-app-small font-medium">
                    {it.cod} · {it.area}
                  </div>
                  <Slider
                    className="flex-1"
                    min={1}
                    max={10}
                    step={1}
                    value={[values[it.cod] ?? 6]}
                    onValueChange={([n]) => setValues((prev) => ({ ...(prev || {}), [it.cod]: n }))}
                    aria-label={it.q}
                  />
                  <div className="w-8 text-right font-medium tabular-nums">{values[it.cod] ?? 6}</div>
                </div>
              ))}
            </section>
          ))}
        </div>
        <div className="mt-4 text-right">
          <Button variant="default" onClick={submit}>
            {ui.reSubmitBtn}
          </Button>
        </div>
      </>
    )
  }

  return (
    <div data-module="assessment" data-portal-scope>
      <div id="eval-restricted-screen" className="fixed inset-0 z-(--z-takeover) overflow-y-auto bg-background">
        <div className="mx-auto max-w-3xl px-4 pt-12 pb-16">
          {brand}
          {body}
        </div>
      </div>
    </div>
  )
}
