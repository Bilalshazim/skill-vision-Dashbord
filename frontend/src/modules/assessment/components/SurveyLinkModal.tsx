import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/modules/assessment/components/Modal'
import { COLLABORATOR_LETTER_TEMPLATE } from '@/modules/assessment/lib/demo-data'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { initials } from '@/modules/assessment/lib/legacy-utils'
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
      <Modal title={ui.surveySendResultsTitle} wide onClose={onClose} footer={<Button variant="default" onClick={() => setResults(null)}>{ui.btnClose}</Button>}>
        <div className="small-note" style={{ marginBottom: 12 }}>
          {ui.surveySendResultsSub(okCount, failCount)}
        </div>
        <div className="survey-emp-list">
          {results.results.map((r) => {
            const rec = byId.get(r.id)
            return (
              <div className="survey-emp-row" key={r.id}>
                <span className={`chip ${r.success ? 'chip-green' : 'chip-red'}`}>
                  <span className="dt" />
                  {r.success ? ui.surveySendResultsOkLabel : ui.surveySendResultsFailLabel}
                </span>
                <div style={{ flex: 1 }}>
                  <div className="survey-emp-name">{rec?.name || r.email}</div>
                  <div className="survey-emp-email">
                    {r.email}
                    {!r.success && r.error ? ` — ${r.error}` : ''}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={ui.surveyLinkModalTitle} sub={ui.surveyLinkModalSub} wide onClose={onClose} footer={<Button variant="outline" onClick={onClose}>{ui.btnClose}</Button>}>
      {!link && (
        <div className="survey-warning-box">
          <div>
            <b>{ui.surveyNoLinkConfiguredTitle}</b>
            {ui.surveyNoLinkConfiguredBody}
          </div>
        </div>
      )}
      <label className="small-note" style={{ display: 'block', marginBottom: 16 }}>
        <div style={{ marginBottom: 4, fontWeight: 600 }}>{ui.surveyLinkInputLabel}</div>
        <input
          type="text"
          value={state.settings.surveyLink || ''}
          onChange={(e) => setSurveyLink(e.target.value)}
          placeholder={ui.surveyLinkInputPlaceholder as string}
          disabled={!canEdit}
          style={{ width: '100%' }}
        />
      </label>
      <div className="survey-sender-box">
        <div>
          <b>{ui.surveySenderLabel}:</b> {sender.mode === 'admin' ? ui.surveySenderAdminOption(sender.email) : ui.surveySenderReferenteOption(sender.name, sender.email)}
        </div>
        <select value={sender.mode} onChange={(e) => setSenderMode(e.target.value)}>
          <option value="referente">{ui.surveySenderModeReferente}</option>
          <option value="admin">{ui.surveySenderModeAdmin}</option>
        </select>
      </div>
      {!sender.email && <div className="survey-warning-box">{ui.surveySenderMissingWarning}</div>}

      <div className="survey-emp-list">
        {employees.length > 0 && (
          <div className="survey-emp-selectall">
            <input type="checkbox" id="survey-select-all" checked={allSelected} onChange={(e) => toggleAll(e.target.checked)} />
            <label htmlFor="survey-select-all" style={{ cursor: 'pointer' }}>
              {ui.surveySelectAllLabel} ({employees.length})
            </label>
          </div>
        )}
        {employees.length ? (
          employees.map((e) => {
            const checked = selected.has(e.id)
            const hasEmail = !!(e.email && e.email.trim())
            return (
              <div className={`survey-emp-row${checked ? ' selected' : ''}`} key={e.id}>
                <input type="checkbox" checked={checked} onChange={(ev) => toggle(e.id, ev.target.checked)} />
                <div className="avatar">{initials(e.nome, e.cognome)}</div>
                <div style={{ flex: 1 }}>
                  <div className="survey-emp-name">
                    {e.nome} {e.cognome}
                  </div>
                  <div className="survey-emp-email">{hasEmail ? e.email : <span className="chip chip-gray">{ui.surveyNoEmailBadge}</span>}</div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="small-note" style={{ padding: 14 }}>
            {ui.anagNoEmployeesFound}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 600 }}>{ui.surveyLetterPreviewTitle}</div>
        <div className="small-note" style={{ marginBottom: 6 }}>
          {ui.surveyLetterPreviewHint}
        </div>
        <div style={{ border: '1px solid var(--border, #ddd)', borderRadius: 8, padding: 12 }}>
          <div style={{ marginBottom: 8 }}>
            <b>{ui.surveyLetterPreviewSubjectLabel}:</b> {preview.subject}
          </div>
          <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{preview.body}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        {!apiConfigured && <span className="small-note" style={{ color: 'var(--warning)' }}>{ui.toastSurveyApiNotConfigured}</span>}
        {!apiConfigured && (
          <Button variant="outline" size="sm" onClick={mailtoFallback} title={ui.surveyMailtoFallbackHint}>
            {ui.surveyMailtoFallbackBtn}
          </Button>
        )}
        <Button variant="default" disabled={sending} onClick={submitSend}>
          {sending ? ui.toastSurveySending(selected.size) : ui.surveyInviaBtn}
        </Button>
      </div>
    </Modal>
  )
}
