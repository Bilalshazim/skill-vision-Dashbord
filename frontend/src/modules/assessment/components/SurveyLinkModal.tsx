import { useState } from 'react'

import { cn } from '@/lib/utils'
import { InlineAlert } from '@/components/patterns/InlineAlert'
import { Note } from '@/components/patterns/Note'
import { Initials } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { SelectField } from '@/components/patterns/SelectField'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/patterns/Field'
import { Hint } from '@/components/patterns/Hint'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ModalDialog } from '@/components/patterns/ModalDialog'
import { COLLABORATOR_LETTER_TEMPLATE } from '@/modules/assessment/lib/demo-data'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import type { AssessmentState, Employee } from '@/modules/assessment/lib/types'

function resolveSurveySender(state: AssessmentState, ui: Record<string, unknown>) {
  const mode = state.settings.surveySenderMode || 'referente'
  if (mode === 'admin') return { mode, email: (state.settings.adminSenderEmail || '').trim(), name: ui.surveySenderModeAdmin as string }
  const ref = state.company?.referente || { name: '', email: '' }
  return { mode, email: (ref.email || '').trim(), name: ref.name || (ui.surveySenderModeReferente as string) }
}
// Ported verbatim from employeesOrderedByRecency() (js/assessment.js
// ~5074-5083) — most recently registered first (by createdAt, falling back
// to array insertion order for records with none).
function employeesOrderedByRecency(state: AssessmentState): Employee[] {
  return state.employees
    .map((e, idx) => ({ e, idx }))
    .sort((a, b) => {
      const at = a.e.createdAt ? new Date(a.e.createdAt).getTime() : a.idx
      const bt = b.e.createdAt ? new Date(b.e.createdAt).getTime() : b.idx
      return bt - at
    })
    .map((x) => x.e)
}
function fillSurveyEmailTemplate(state: AssessmentState, ui: Record<string, unknown>, name: string, link: string) {
  const subject = state.settings.surveyEmailSubject || (ui.surveyEmailSubjectLabel as string)
  const bodyTpl = state.settings.surveyEmailBody || '{{LINK}}'
  const body = bodyTpl.replace(/\{\{NOME\}\}/g, name).replace(/\{\{LINK\}\}/g, link)
  const letterTpl = state.settings.preTestLetter || COLLABORATOR_LETTER_TEMPLATE
  const letter = letterTpl.indexOf('{{LINK}}') !== -1 ? letterTpl.split('{{LINK}}').join(link) : letterTpl + '\n\n🔗 Link al questionario: ' + link
  return { subject, body: letter + '\n\n---\n\n' + body }
}

type Recipient = { id: string; nome: string; cognome: string; name: string; email: string; subject: string; body: string }
type SendResult = { id: string; email: string; success: boolean; error?: string }

// Migrated from openSurveyLinkModal()/renderSurveyLinkBodyHtml()/
// prepareSurveySendRecipients()/submitSendSurveyLinks()/
// sendSurveyLinksViaMailtoFallback()/openSurveySendResultsModal()
// (js/assessment.js ~5085-5307) — sends the Soft Skills survey link to
// selected employees via the user-configured emailApiEndpoint (with
// optional bearer token), falling back to a real per-recipient mailto:
// compose when no endpoint is configured. NEVER claims success without a
// real 2xx response, exactly like legacy — no fake "sent" state.
export function SurveyLinkModal({ onClose }: { onClose: () => void }) {
  const { state, setState, ui, canEdit, toast } = useAssessment()
  const uiRec = ui as unknown as Record<string, unknown>
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<{ recipients: Recipient[]; results: SendResult[] } | null>(null)

  const link = (state.settings.surveyLink || '').trim()
  const sender = resolveSurveySender(state, uiRec)
  const apiConfigured = !!(state.settings.emailApiEndpoint || '').trim()
  const employees = employeesOrderedByRecency(state).filter((e) => !e.archived)
  const allSelected = employees.length > 0 && employees.every((e) => selected.has(e.id))

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }
  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(employees.map((e) => e.id)) : new Set())
  }
  function setSenderMode(mode: string) {
    if (!canEdit) return
    setState((prev) => ({ ...prev, settings: { ...prev.settings, surveySenderMode: mode as 'referente' | 'admin' } }))
  }
  function setSurveyLink(value: string) {
    if (!canEdit) return
    setState((prev) => ({ ...prev, settings: { ...prev.settings, surveyLink: value } }))
  }

  // The recipient actually sees this exact text once real sends land in
  // their inbox — nothing here previewed it before now, so a broken
  // {{NOME}}/{{LINK}} substitution or an empty letter template could only
  // ever be discovered after a real send. Uses the first selected employee
  // once one's checked (their real name), or a generic placeholder name
  // before that, so the preview is always something, never blank.
  const previewEmployee = employees.find((e) => selected.has(e.id))
  const previewName = previewEmployee ? `${previewEmployee.nome} ${previewEmployee.cognome}` : (ui.surveyLetterPreviewSampleName as string)
  const previewLink = link || (ui.surveyLinkInputPlaceholder as string)
  const preview = fillSurveyEmailTemplate(state, uiRec, previewName, previewLink)

  function prepareRecipients(): { link: string; sender: typeof sender; recipients: Recipient[] } | null {
    if (!link) {
      toast(ui.toastSurveyLinkMissing, 'err')
      return null
    }
    if (!sender.email) {
      toast(ui.toastSurveySenderMissing, 'err')
      return null
    }
    if (!selected.size) {
      toast(ui.toastSelectAtLeastOneEmployeeSurvey, 'err')
      return null
    }
    const sel = state.employees.filter((e) => selected.has(e.id))
    const withEmail = sel.filter((e) => e.email && e.email.trim())
    const skipped = sel.length - withEmail.length
    if (!withEmail.length) {
      toast(ui.toastSurveySkippedNoEmail(skipped), 'err')
      return null
    }
    if (skipped > 0) toast(ui.toastSurveySkippedNoEmail(skipped), 'err')
    const recipients = withEmail.map((e) => {
      const name = `${e.nome} ${e.cognome}`
      const { subject, body } = fillSurveyEmailTemplate(state, uiRec, name, link)
      return { id: e.id, nome: e.nome, cognome: e.cognome, name, email: e.email.trim(), subject, body }
    })
    return { link, sender, recipients }
  }

  async function submitSend() {
    if (!canEdit) return
    const endpoint = (state.settings.emailApiEndpoint || '').trim()
    if (!endpoint) {
      toast(ui.toastSurveyApiNotConfigured, 'err')
      return
    }
    const prepared = prepareRecipients()
    if (!prepared) return
    const { sender: s, link: l, recipients } = prepared
    setSending(true)
    toast(ui.toastSurveySending(recipients.length), 'ok')

    let outcome: { ok: boolean; results: SendResult[]; networkError?: boolean }
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const apiKey = (state.settings.emailApiKey || '').trim()
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`
      const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ sender: s, surveyLink: l, recipients }) })
      let payload: { results?: SendResult[]; error?: string } | null = null
      try {
        payload = await res.json()
      } catch {
        /* non-JSON or empty body */
      }
      if (!res.ok) {
        outcome = { ok: false, results: recipients.map((r) => ({ id: r.id, email: r.email, success: false, error: payload?.error || `HTTP ${res.status}` })) }
      } else if (payload && Array.isArray(payload.results)) {
        outcome = { ok: true, results: payload.results }
      } else {
        outcome = { ok: true, results: recipients.map((r) => ({ id: r.id, email: r.email, success: true })) }
      }
    } catch (err) {
      outcome = { ok: false, networkError: true, results: recipients.map((r) => ({ id: r.id, email: r.email, success: false, error: err instanceof Error ? err.message : String(err) })) }
    }
    setSending(false)

    const okCount = outcome.results.filter((r) => r.success).length
    const failCount = outcome.results.length - okCount
    if (outcome.networkError) toast(ui.toastSurveyApiError(outcome.results[0]?.error || ''), 'err')
    else if (okCount === 0) toast(ui.toastSurveySendAllFailed, 'err')
    else if (failCount === 0) toast(ui.toastSurveySendAllOk(okCount), 'ok')
    markDispatched(outcome.results.filter((r) => r.success).map((r) => r.id))
    setResults({ recipients, results: outcome.results })
  }

  function markDispatched(ids: string[]) {
    if (!ids.length) return
    const now = new Date().toISOString()
    setState((prev) => ({ ...prev, employees: prev.employees.map((e) => (ids.includes(e.id) ? { ...e, surveySentAt: now } : e)) }))
  }

  function mailtoFallback() {
    if (!canEdit) return
    const prepared = prepareRecipients()
    if (!prepared) return
    const { sender: s, recipients } = prepared
    recipients.forEach((r, i) => {
      const mailto = `mailto:${encodeURIComponent(r.email)}?subject=${encodeURIComponent(r.subject)}&body=${encodeURIComponent(r.body)}&replyto=${encodeURIComponent(s.email)}`
      setTimeout(() => {
        if (i === 0) window.location.href = mailto
        else window.open(mailto, '_blank')
      }, i * 350)
    })
    markDispatched(recipients.map((r) => r.id))
    toast(ui.toastSurveyMailtoOpened(recipients.length), 'ok')
  }

  if (results) {
    const byId = new Map(results.recipients.map((r) => [r.id, r]))
    const okCount = results.results.filter((r) => r.success).length
    const failCount = results.results.length - okCount
    return (
      <ModalDialog title={ui.surveySendResultsTitle} wide onClose={onClose} footer={<Button variant="default" onClick={() => setResults(null)}>{ui.btnClose}</Button>}>
        <Note className="mb-3">
          {ui.surveySendResultsSub(okCount, failCount)}
        </Note>
        <div className="max-h-80 overflow-y-auto rounded-sm border border-border">
          {results.results.map((r) => {
            const rec = byId.get(r.id)
            return (
              <div className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-b-0" key={r.id}>
                <Badge tone={r.success ? 'success' : 'destructive'} dot>
                  {r.success ? ui.surveySendResultsOkLabel : ui.surveySendResultsFailLabel}
                </Badge>
                <div className="flex-1">
                  <div className="text-app-small font-medium">{rec?.name || r.email}</div>
                  <div className="text-app-caption text-muted-foreground">
                    {r.email}
                    {!r.success && r.error ? ` — ${r.error}` : ''}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </ModalDialog>
    )
  }

  return (
    <ModalDialog title={ui.surveyLinkModalTitle} sub={ui.surveyLinkModalSub} wide onClose={onClose} footer={<Button variant="outline" onClick={onClose}>{ui.btnClose}</Button>}>
      {!link && (
        <InlineAlert tone="warning" title={ui.surveyNoLinkConfiguredTitle} className="mb-4">
          {ui.surveyNoLinkConfiguredBody}
        </InlineAlert>
      )}
      <Field label={ui.surveyLinkInputLabel}>
        <Input
          type="text"
          value={state.settings.surveyLink || ''}
          onChange={(e) => setSurveyLink(e.target.value)}
          placeholder={ui.surveyLinkInputPlaceholder as string}
          disabled={!canEdit}
        />
      </Field>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border bg-muted px-3 py-2 text-app-small [&_b]:font-medium">
        <div>
          <b>{ui.surveySenderLabel}:</b> {sender.mode === 'admin' ? ui.surveySenderAdminOption(sender.email) : ui.surveySenderReferenteOption(sender.name, sender.email)}
        </div>
        <SelectField size="sm" value={sender.mode} onValueChange={(v) => setSenderMode(v)}>
          <option value="referente">{ui.surveySenderModeReferente}</option>
          <option value="admin">{ui.surveySenderModeAdmin}</option>
        </SelectField>
      </div>
      {!sender.email && (
        <InlineAlert tone="warning" className="mb-4">
          {ui.surveySenderMissingWarning}
        </InlineAlert>
      )}

      <div className="max-h-80 overflow-y-auto rounded-sm border border-border">
        {employees.length > 0 && (
          <div className="flex items-center gap-3 border-b border-border bg-muted px-3 py-2 text-app-small font-medium">
            <Checkbox id="survey-select-all" checked={allSelected} onCheckedChange={(c) => toggleAll(c === true)} />
            <label className="cursor-pointer" htmlFor="survey-select-all" >
              {ui.surveySelectAllLabel} ({employees.length})
            </label>
          </div>
        )}
        {employees.length ? (
          employees.map((e) => {
            const checked = selected.has(e.id)
            const hasEmail = !!(e.email && e.email.trim())
            return (
              <div className={cn('flex items-center gap-3 border-b border-border px-3 py-2 last:border-b-0', checked && 'bg-accent')} key={e.id}>
                <Checkbox checked={checked} onCheckedChange={(c) => toggle(e.id, c === true)} />
                <Initials first={e.nome} last={e.cognome} />
                <div className="flex-1">
                  <div className="text-app-small font-medium">
                    {e.nome} {e.cognome}
                  </div>
                  <div className="text-app-caption text-muted-foreground">{hasEmail ? e.email : <Badge>{ui.surveyNoEmailBadge}</Badge>}</div>
                </div>
              </div>
            )
          })
        ) : (
          <Note className="p-4">
            {ui.anagNoEmployeesFound}
          </Note>
        )}
      </div>

      <div className="mt-4">
        <div className="text-app-small font-medium">{ui.surveyLetterPreviewTitle}</div>
        <Note className="mb-2">
          {ui.surveyLetterPreviewHint}
        </Note>
        <div className="rounded-sm border border-border p-3 text-app-small [&_b]:font-medium">
          <div className="mb-2">
            <b>{ui.surveyLetterPreviewSubjectLabel}:</b> {preview.subject}
          </div>
          <div className="whitespace-pre-wrap">{preview.body}</div>
        </div>
      </div>

      <div className="flex justify-end items-center gap-3 mt-4 flex-wrap">
        {!apiConfigured && (
          <InlineAlert tone="warning" layout="text">
            {ui.toastSurveyApiNotConfigured}
          </InlineAlert>
        )}
        {!apiConfigured && (
          <Hint label={ui.surveyMailtoFallbackHint}>
            <Button variant="outline" size="sm" onClick={mailtoFallback}>
              {ui.surveyMailtoFallbackBtn}
            </Button>
          </Hint>
        )}
        <Button variant="default" disabled={sending} onClick={submitSend}>
          {sending ? ui.toastSurveySending(selected.size) : ui.surveyInviaBtn}
        </Button>
      </div>
    </ModalDialog>
  )
}
