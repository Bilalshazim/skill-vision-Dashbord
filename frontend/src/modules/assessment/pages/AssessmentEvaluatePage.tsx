import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Logo } from '@/layouts/Logo'
import { LoadingState } from '@/components/patterns/LoadingState'
import { Note } from '@/components/patterns/Note'
import { StaggerItem } from '@/components/patterns/StaggerItem'
import { StaggerList } from '@/components/patterns/StaggerList'
import { Card, CardTitle, CardLabel } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { assessmentApi } from '@/lib/api/assessment'
import { ApiError } from '@/lib/api/client'
import { ApexItemRow } from '@/modules/assessment/components/ApexItemRow'
import { getApex5dDimensions, getApexSources, getUI, type AssessmentLang } from '@/modules/assessment/lib/legacy-utils'
import { errorReason } from '@/modules/assessment/lib/server-sync'

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
// I dati stanno sul server: la pagina chiede il minimo per il modulo
// (backend/src/modules/publicAssessment) e invia lì; il link funziona su
// qualunque computer e si chiude con l'invio.
export default function AssessmentEvaluatePage() {
  const [params] = useSearchParams()
  const token = params.get('evalToken') ?? ''
  // Pagina pubblica, senza accesso: nessuna preferenza dell'utente, vale l'italiano.
  const lang: AssessmentLang = 'it'
  const ui = getUI(lang)
  return (
    <div data-module="assessment" data-portal-scope>
      <div id="eval-restricted-screen" className="fixed inset-0 z-(--z-takeover) overflow-y-auto bg-background">
        <div className="mx-auto max-w-3xl px-4 pt-12 pb-16">
          <div className="mb-8 flex flex-col items-center gap-2">
            <Logo size="lg" />
            <div className="label-mono text-muted-foreground">{ui.brandTagline}</div>
          </div>
          <ServerEvaluation token={token} lang={lang} />
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
    <Card className="px-6 py-12">
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
      <StaggerList>
        {APEX5D_DIMENSIONS.map((dim) => (
          <StaggerItem key={dim.code}>
            <section className="mb-4">
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
          </StaggerItem>
        ))}
      </StaggerList>
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
