import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/modules/assessment/components/Modal'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { buildAssignmentLink } from '@/modules/assessment/lib/shell-bridge'
import { getApexSources, uid } from '@/modules/assessment/lib/legacy-utils'
import type { ApexSourceKey } from '@/modules/assessment/lib/types'

// Migrated from openEvalManagerModal()/renderEvalManagerBody()/
// submitCreateAssignments()/copyAssignmentLink()/sendAssignmentEmail()/
// markAssignmentCompleted()/deleteAssignment()/addEvalPeriod()/
// openAssignmentBreakdownModal() (js/assessment.js ~6781-6961) — the admin
// side of the evaluator-token flow: create assignments (which mints the
// ?evalToken= link the restricted AssessmentEvaluatePage route consumes),
// list/copy/email/complete/delete them, and manage evaluation periods.
export function EvaluationManagerModal({ onClose }: { onClose: () => void }) {
  const { state, setState, lang, ui, toast } = useAssessment()
  const APEX_SOURCES = getApexSources(lang)
  const periods = state.evalPeriods

  const [template, setTemplate] = useState<ApexSourceKey>(APEX_SOURCES[0].key as ApexSourceKey)
  const [periodId, setPeriodId] = useState(periods[periods.length - 1]?.id || '')
  const [newPeriodLabel, setNewPeriodLabel] = useState('')
  const [evaluatorName, setEvaluatorName] = useState('')
  const [evaluatorEmail, setEvaluatorEmail] = useState('')
  const [targets, setTargets] = useState<Record<string, boolean>>({})
  const [linkModal, setLinkModal] = useState<string | null>(null)
  const [breakdownOpen, setBreakdownOpen] = useState(false)

  const assignments = state.evalAssignments
  const sentCount = assignments.length
  const receivedCount = assignments.filter((a) => a.status === 'completed').length

  function addPeriod() {
    const label = newPeriodLabel.trim()
    if (!label) {
      toast(ui.toastEnterPeriodLabel, 'err')
      return
    }
    setState((prev) => ({ ...prev, evalPeriods: [...prev.evalPeriods, { id: uid('period'), label, date: new Date().toISOString().slice(0, 10) }] }))
    setNewPeriodLabel('')
    toast(ui.toastPeriodAdded, 'ok')
  }

  function createAssignments() {
    const targetIds = state.employees.filter((e) => !e.archived && targets[e.id]).map((e) => e.id)
    if (template !== 'auto' && !evaluatorName.trim()) {
      toast(ui.toastEnterEvaluatorFirst, 'err')
      return
    }
    if (!targetIds.length) {
      toast(ui.toastSelectAtLeastOneTarget, 'err')
      return
    }
    setState((prev) => {
      const evaluators =
        template !== 'auto' && evaluatorName.trim() && !prev.evaluators.some((n) => n.toLowerCase() === evaluatorName.trim().toLowerCase()) ? [...prev.evaluators, evaluatorName.trim()] : prev.evaluators
      const newAssignments = targetIds.map((targetEmployeeId) => {
        const emp = prev.employees.find((e) => e.id === targetEmployeeId)!
        return {
          id: uid('assign'),
          templateType: template,
          targetEmployeeId,
          evaluatorName: template === 'auto' ? `${emp.nome} ${emp.cognome}` : evaluatorName.trim(),
          evaluatorEmail: template === 'auto' ? '' : evaluatorEmail.trim(),
          periodId,
          status: 'pending' as const,
          token: uid('tok'),
          createdAt: new Date().toISOString(),
          completedAt: null,
        }
      })
      return { ...prev, evaluators, evalAssignments: [...prev.evalAssignments, ...newAssignments] }
    })
    setTargets({})
    setEvaluatorName('')
    setEvaluatorEmail('')
    toast(ui.toastAssignmentsCreated(targetIds.length), 'ok')
  }

  function copyLink(id: string) {
    const assignment = assignments.find((a) => a.id === id)
    if (!assignment) return
    const link = buildAssignmentLink(assignment.token)
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).then(() => toast(ui.toastLinkCopied, 'ok')).catch(() => {})
    }
    setLinkModal(link)
  }

  function sendEmail(id: string) {
    const assignment = assignments.find((a) => a.id === id)
    if (!assignment) return
    if (!assignment.evaluatorEmail) {
      toast(ui.toastNoEvaluatorEmail, 'err')
      return
    }
    const link = buildAssignmentLink(assignment.token)
    const subject = encodeURIComponent(ui.evalEmailSubject)
    const body = encodeURIComponent(ui.evalEmailBody(assignment.evaluatorName, link))
    window.location.href = `mailto:${encodeURIComponent(assignment.evaluatorEmail)}?subject=${subject}&body=${body}`
  }

  function markCompleted(id: string) {
    setState((prev) => ({ ...prev, evalAssignments: prev.evalAssignments.map((a) => (a.id === id ? { ...a, status: 'completed' as const, completedAt: new Date().toISOString() } : a)) }))
    toast(ui.toastAssignmentMarkedDone, 'ok')
  }

  function deleteAssignment(id: string) {
    if (!window.confirm(ui.confirmDeleteAssignment)) return
    setState((prev) => ({ ...prev, evalAssignments: prev.evalAssignments.filter((a) => a.id !== id) }))
  }

  if (linkModal) {
    return (
      <Modal
        title={ui.evalLinkModalTitle}
        onClose={() => setLinkModal(null)}
        footer={
          <Button variant="default" onClick={() => setLinkModal(null)}>
            {ui.btnClose}
          </Button>
        }
      >
        <p className="small-note" style={{ marginBottom: 10 }}>
          {ui.evalLinkTrustNote}
        </p>
        <input
          type="text"
          readOnly
          value={linkModal}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          style={{ width: '100%', padding: '9px 11px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', background: 'var(--surface-alt)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
        />
      </Modal>
    )
  }

  if (breakdownOpen) {
    const completed = assignments.filter((a) => a.status === 'completed')
    const pending = assignments.filter((a) => a.status !== 'completed')
    const row = (a: (typeof assignments)[number]) => {
      const targetEmp = state.employees.find((e) => e.id === a.targetEmployeeId)
      const src = APEX_SOURCES.find((s) => s.key === a.templateType)
      return (
        <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
          <span>
            {targetEmp ? `${targetEmp.nome} ${targetEmp.cognome}` : '—'} <span className="small-note">— {src?.label || ''}</span>
          </span>
        </div>
      )
    }
    return (
      <Modal
        title={ui.evalManagerTitle}
        onClose={() => setBreakdownOpen(false)}
        footer={
          <Button variant="outline" onClick={() => setBreakdownOpen(false)}>
            {ui.btnClose}
          </Button>
        }
      >
        <div className="card-eyebrow" style={{ marginBottom: 6 }}>
          {ui.evalStatusCompleted} ({completed.length})
        </div>
        {completed.length ? completed.map(row) : <div className="small-note" style={{ marginBottom: 12 }}>{ui.evalNoAssignments}</div>}
        <div className="card-eyebrow" style={{ marginTop: 16, marginBottom: 6 }}>
          {ui.evalStatusPending} ({pending.length})
        </div>
        {pending.length ? pending.map(row) : <div className="small-note">{ui.evalNoAssignments}</div>}
      </Modal>
    )
  }

  return (
    <Modal title={ui.evalManagerTitle} sub={ui.evalManagerSub} wide onClose={onClose} footer={<Button variant="outline" onClick={onClose}>{ui.btnClose}</Button>}>
      <div className="grid grid-2" style={{ gap: 10, marginBottom: 16 }}>
        <div className="tinted-tile clickable accent" onClick={() => setBreakdownOpen(true)}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent-dark)' }}>{ui.evalSentLabel}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)' }}>{sentCount}</div>
        </div>
        <div className="tinted-tile clickable success" onClick={() => setBreakdownOpen(true)}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--success)' }}>{ui.evalReceivedLabel}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)' }}>{receivedCount}</div>
        </div>
      </div>

      <div className="divider" />
      <div className="card-title" style={{ marginBottom: 10 }}>
        {ui.evalAssignTitle}
      </div>
      <div className="field-row">
        <div className="field">
          <label>{ui.evalTemplateLabel}</label>
          <select value={template} onChange={(e) => setTemplate(e.target.value as ApexSourceKey)}>
            {APEX_SOURCES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{ui.evalPeriodLabel}</label>
          <select value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field-row" style={{ alignItems: 'flex-end' }}>
        <div className="field" style={{ flex: 1 }}>
          <label>{ui.evalNewPeriodLabel}</label>
          <input type="text" placeholder={ui.evalNewPeriodPh} value={newPeriodLabel} onChange={(e) => setNewPeriodLabel(e.target.value)} />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addPeriod}>
          {ui.evalAddPeriodBtn}
        </Button>
      </div>
      {template !== 'auto' ? (
        <div className="field-row" style={{ alignItems: 'flex-end' }}>
          <div className="field">
            <label>{ui.evaluatorNameLabel}</label>
            <input type="text" list="dl-evaluators-ea" placeholder={ui.evaluatorNamePh} value={evaluatorName} onChange={(e) => setEvaluatorName(e.target.value)} />
            <datalist id="dl-evaluators-ea">
              {state.evaluators.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label>{ui.evaluatorEmailLabel}</label>
            <input type="email" placeholder={ui.evaluatorEmailPh} value={evaluatorEmail} onChange={(e) => setEvaluatorEmail(e.target.value)} />
          </div>
        </div>
      ) : (
        <div className="small-note" style={{ marginBottom: 10 }}>
          {ui.evaluatorSelfNote}
        </div>
      )}
      <div className="field">
        <label>{ui.evalTargetsLabel}</label>
        <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
          {state.employees
            .filter((e) => !e.archived)
            .map((e) => (
              <div className="checkbox-row" style={{ gap: 8, padding: '3px 0' }} key={e.id}>
                <input type="checkbox" id={`ea-target-${e.id}`} checked={!!targets[e.id]} onChange={(ev) => setTargets((prev) => ({ ...prev, [e.id]: ev.target.checked }))} />
                <label htmlFor={`ea-target-${e.id}`} style={{ cursor: 'pointer' }}>
                  {e.nome} {e.cognome} — {e.ruolo}
                </label>
              </div>
            ))}
        </div>
      </div>
      <Button variant="default" size="sm" onClick={createAssignments}>
        {ui.evalCreateBtn}
      </Button>

      <div className="divider" />
      <div className="card-title" style={{ marginBottom: 10 }}>
        {ui.evalAssignmentsListTitle}
      </div>
      <div className="table-wrap">
        <table className="dtable">
          <thead>
            <tr>
              <th>{ui.evalColTarget}</th>
              <th>{ui.evalColTemplate}</th>
              <th>{ui.evalColEvaluator}</th>
              <th>{ui.evalColPeriod}</th>
              <th>{ui.evalColStatus}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {assignments.length ? (
              [...assignments].reverse().map((a) => {
                const targetEmp = state.employees.find((e) => e.id === a.targetEmployeeId)
                const src = APEX_SOURCES.find((s) => s.key === a.templateType)
                const period = periods.find((p) => p.id === a.periodId)
                return (
                  <tr key={a.id}>
                    <td>{targetEmp ? `${targetEmp.nome} ${targetEmp.cognome}` : '—'}</td>
                    <td>{src ? src.label : a.templateType}</td>
                    <td>{a.evaluatorName || '—'}</td>
                    <td>{period ? period.label : '—'}</td>
                    <td>
                      <span className={`chip ${a.status === 'completed' ? 'chip-green' : 'chip-gray'}`}>
                        <span className="dt" />
                        {a.status === 'completed' ? ui.evalStatusCompleted : ui.evalStatusPending}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <Button variant="outline" size="sm" onClick={() => copyLink(a.id)}>
                        {ui.evalCopyLinkBtn}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => sendEmail(a.id)}>
                        {ui.evalSendEmailBtn}
                      </Button>
                      {a.status !== 'completed' && (
                        <Button variant="outline" size="sm" onClick={() => markCompleted(a.id)}>
                          {ui.evalMarkDoneBtn}
                        </Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => deleteAssignment(a.id)}>
                        ✕
                      </Button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6}>
                  <div className="small-note" style={{ textAlign: 'center', padding: '14px 0' }}>
                    {ui.evalNoAssignments}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}
