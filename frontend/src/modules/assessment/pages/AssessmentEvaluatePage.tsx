import { useQuery } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Logo } from '@/layouts/Logo'
import { LoadingState } from '@/components/patterns/LoadingState'
import { Note } from '@/components/patterns/Note'
import { Card, CardTitle, CardLabel } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { assessmentApi } from '@/lib/api/assessment'
import { ApiError } from '@/lib/api/client'
import { env } from '@/lib/env'
import { ApexItemRow } from '@/modules/assessment/components/ApexItemRow'
import { computeHardSummary } from '@/modules/assessment/lib/calculations'
import { getApex5dDimensions, getApexSources, getUI, type AssessmentLang } from '@/modules/assessment/lib/legacy-utils'
import { errorReason } from '@/modules/assessment/lib/server-sync'
import { readSharedLang } from '@/modules/assessment/lib/shell-bridge'
import { readAssessmentState, writeAssessmentState } from '@/modules/assessment/lib/storage'
import type { ApexSourceKey } from '@/modules/assessment/lib/types'
import '@/modules/assessment/styles/assessment-print.css'

// Migrated from enterRestrictedEvaluatorMode()/renderRestrictedEvalScreen()/
// submitRestrictedEval() (js/assessment.js ~6676-6769). Reached ONLY via
// /assessment/evaluate?evalToken=<token> — a distinct top-level route that
// skips AssessmentLayout's shell/auth-guard entirely.
//
// AUTH: deliberately bypasses the auth guard and AssessmentProvider — an
// external evaluator opening this link has no login at all; the
// per-assignment token IS the credential.
//
// Dove stanno i dati (VITE_ASSESSMENT_STORAGE):
// - `local`: come prima, l'assegnazione si cerca in `sv_assessment_state_v1`,
//   quindi il link funziona solo nel browser dell'HR;
// - `server` (Parte 2): la pagina chiede al server il minimo per il modulo
//   (backend/src/modules/publicAssessment) e invia lì; il link funziona su
//   qualunque computer e si chiude con l'invio.
export default function AssessmentEvaluatePage() {
  const [params] = useSearchParams()
  const token = params.get('evalToken') ?? ''
  const lang = readSharedLang()
  const ui = getUI(lang)
  return (
    <div data-module="assessment" data-portal-scope>
      <div id="eval-restricted-screen" className="fixed inset-0 z-(--z-takeover) overflow-y-auto bg-background">
        <div className="mx-auto max-w-3xl px-4 pt-12 pb-16">
          <div className="mb-8 flex flex-col items-center gap-2">
            <Logo size="lg" />
            <div className="label-mono text-muted-foreground">{ui.brandTagline}</div>
          </div>
          {env.assessmentStorage === 'server' ? <ServerEvaluation token={token} lang={lang} /> : <LocalEvaluation token={token} lang={lang} />}
        </div>
      </div>
    </div>
  )
}

function InvalidLink({ lang }: { lang: AssessmentLang }) {
  const ui = getUI(lang)
  return (
    <Card>
      <CardTitle>{ui.reInvalidLinkTitle}</CardTitle>
      <Note className="mt-2">{ui.reInvalidLinkDesc}</Note>
    </Card>
  )
}

function ThankYou({ lang, date }: { lang: AssessmentLang; date: string }) {
  const ui = getUI(lang)
  return (
    <Card className="text-center px-6 py-12">
      <CardTitle className="mb-2">{ui.reThankYouTitle}</CardTitle>
      <Note>{ui.reThankYouDesc(date)}</Note>
    </Card>
  )
}

type Answers = { values: Record<string, number>; notes: Record<string, string> }

// Il modulo delle 25 voci APEX 5D, uguale nelle due modalità: riceve i voti
// già dati da questa fonte e restituisce quelli nuovi.
function EvaluationForm({
  lang,
  employeeName,
  source,
  initialValues,
  initialNotes,
  busy = false,
  error: outerError,
  onSubmit,
}: {
  lang: AssessmentLang
  employeeName: string
  source: ApexSourceKey
  initialValues: Record<string, number>
  initialNotes: Record<string, string>
  busy?: boolean
  error?: string
  onSubmit: (answers: Answers) => void
}) {
  const ui = getUI(lang)
  const APEX5D_DIMENSIONS = getApex5dDimensions(lang)
  const sourceLabel = getApexSources(lang).find((s) => s.key === source)?.label || ''
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    APEX5D_DIMENSIONS.forEach((dim) => dim.items.forEach((it) => (initial[it.cod] = initialValues[it.cod] || 0)))
    return initial
  })
  const [notes, setNotes] = useState<Record<string, string>>(initialNotes)
  const [error, setError] = useState('')

  function submit() {
    if (APEX5D_DIMENSIONS.some((d) => d.items.some((it) => !(values[it.cod] > 0)))) {
      setError(ui.f6RateAll)
      return
    }
    onSubmit({ values, notes })
  }

  const shownError = error || outerError
  return (
    <>
      <Card className="mb-4">
        <CardTitle>{ui.reFormTitle}</CardTitle>
        <Note className="mt-2">{ui.reFormDesc(employeeName, sourceLabel)}</Note>
      </Card>
      <div>
        {APEX5D_DIMENSIONS.map((dim) => (
          <section className="mb-4" key={dim.code}>
            <CardLabel className="mb-2 border-b border-border pb-2">
              {ui.hardDimensionPrefix} {dim.code} — {dim.name} <span className="font-sans tracking-normal normal-case">· {dim.desc}</span>
            </CardLabel>
            {dim.items.map((it) => (
              <ApexItemRow
                key={it.cod}
                item={it}
                lang={lang}
                value={values[it.cod] ?? 0}
                note={notes[it.cod] ?? ''}
                onValue={(n) => {
                  setError('')
                  setValues((prev) => ({ ...(prev || {}), [it.cod]: n }))
                }}
                onNote={(t) => setNotes((prev) => ({ ...prev, [it.cod]: t }))}
              />
            ))}
          </section>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        {shownError ? <span className="text-app-small font-medium text-destructive">{shownError}</span> : null}
        <Button variant="default" onClick={submit} disabled={busy}>
          {ui.reSubmitBtn}
        </Button>
      </div>
    </>
  )
}

function ServerEvaluation({ token, lang }: { token: string; lang: AssessmentLang }) {
  const ui = getUI(lang)
  const q = useQuery({
    queryKey: ['assessment', 'public-evaluation', token],
    enabled: !!token,
    // Un link sconosciuto è una risposta, non un errore da ritentare.
    retry: (n, err) => !(err instanceof ApiError && err.status === 404) && n < 1,
    queryFn: () => assessmentApi.publicEvaluation(token),
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)

  if (!token) return <InvalidLink lang={lang} />
  if (submittedAt) return <ThankYou lang={lang} date={submittedAt.slice(0, 10)} />
  if (q.isPending) return <LoadingState label={ui.serverLoading} rows={6} />
  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 404) return <InvalidLink lang={lang} />
    return (
      <Card>
        <CardTitle>{ui.serverLoadFailedTitle}</CardTitle>
        <Note className="mt-2">{ui.serverLoadFailed(errorReason(q.error, ui.serverOffline))}</Note>
        <div className="mt-4">
          <Button variant="outline" onClick={() => void q.refetch()}>
            {ui.serverRetry}
          </Button>
        </div>
      </Card>
    )
  }
  const data = q.data
  if (data.status === 'completed') return <ThankYou lang={lang} date={data.completedAt ? data.completedAt.slice(0, 10) : ''} />

  async function submit({ values, notes }: Answers) {
    setBusy(true)
    setError('')
    try {
      const res = await assessmentApi.submitPublicEvaluation(token, values, notes)
      setSubmittedAt(res.completedAt)
    } catch (err) {
      // Già inviata (da un'altra scheda o da un collega con lo stesso link): si rilegge.
      if (err instanceof ApiError && err.status === 409) void q.refetch()
      else setError(ui.reSubmitFailed(errorReason(err, ui.serverOffline)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <EvaluationForm
      lang={lang}
      employeeName={`${data.employee.nome} ${data.employee.cognome}`}
      source={data.source}
      initialValues={data.scores}
      initialNotes={data.notes}
      busy={busy}
      error={error}
      onSubmit={submit}
    />
  )
}

function LocalEvaluation({ token, lang }: { token: string; lang: AssessmentLang }) {
  const [state, setState] = useState(() => readAssessmentState())
  const [submitted, setSubmitted] = useState(false)

  const assignment = state.evalAssignments.find((a) => a.token === token) || null
  const emp = assignment ? state.employees.find((e) => e.id === assignment.targetEmployeeId) : undefined

  function submit({ values, notes }: Answers) {
    if (!assignment || !emp) return
    const source = assignment.templateType
    const nextState = structuredClone(state)
    const nEmp = nextState.employees.find((e) => e.id === emp.id)!
    if (!nEmp.hard[source]) nEmp.hard[source] = {}
    Object.entries(values).forEach(([cod, v]) => {
      nEmp.hard[source][cod] = v
    })
    nEmp.hardNotes = { ...(nEmp.hardNotes || {}), [source]: { ...((nEmp.hardNotes || {})[source] || {}), ...Object.fromEntries(Object.entries(notes).filter(([, t]) => t.trim())) } }
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

  let body: ReactNode
  if (!assignment || !emp) body = <InvalidLink lang={lang} />
  else if (submitted) body = <ThankYou lang={lang} date={new Date().toISOString().slice(0, 10)} />
  else if (assignment.status === 'completed') body = <ThankYou lang={lang} date={assignment.completedAt ? assignment.completedAt.slice(0, 10) : ''} />
  else
    body = (
      <EvaluationForm
        lang={lang}
        employeeName={`${emp.nome} ${emp.cognome}`}
        source={assignment.templateType}
        initialValues={emp.hard[assignment.templateType] || {}}
        initialNotes={emp.hardNotes?.[assignment.templateType] || {}}
        onSubmit={submit}
      />
    )
  return body
}
