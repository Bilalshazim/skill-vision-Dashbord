import { Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Note } from '@/components/patterns/Note'
import { StatCard } from '@/components/patterns/StatCard'
import { Separator } from '@/components/ui/separator'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { useDirty } from '@/hooks/use-dirty'
import { useConfirm } from '@/hooks/use-confirm'
import { Checkbox } from '@/components/ui/checkbox'
import { SelectField } from '@/components/patterns/SelectField'
import { Field } from '@/components/patterns/Field'
import { FieldGrid } from '@/components/patterns/FieldGrid'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CardLabel, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ModalDialog } from '@/components/patterns/ModalDialog'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { DEFAULT_PEERS, buildEvaluationPlan } from '@/modules/assessment/lib/evaluation-plan'
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
  const [confirm, confirmDialog] = useConfirm()
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
  const [peers, setPeers] = useState(String(DEFAULT_PEERS))
  const [planResult, setPlanResult] = useState<{ created: number; noManager: string[]; fewPeers: string[] } | null>(null)
  const dirty = useDirty({ template, periodId, newPeriodLabel, evaluatorName, evaluatorEmail, targets })

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

  // Piano automatico 5P: Dirigente, N Peer a rotazione e Autovalutazione per tutti.
  function generatePlan() {
    const n = Math.max(0, Math.min(10, parseInt(peers, 10) || 0))
    const plan = buildEvaluationPlan(state, periodId, n)
    if (plan.assignments.length) setState((prev) => ({ ...prev, evalAssignments: [...prev.evalAssignments, ...plan.assignments] }))
    setPlanResult({ created: plan.assignments.length, noManager: plan.noManager, fewPeers: plan.fewPeers })
    toast(plan.assignments.length ? ui.f6PlanCreated(plan.assignments.length) : ui.f6PlanNothing, plan.assignments.length ? 'ok' : 'err')
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

  async function deleteAssignment(id: string) {
    if (!(await confirm({ title: ui.confirmDeleteAssignment, confirmLabel: ui.deleteAssignmentConfirmBtn, cancelLabel: ui.confirmCancel, destructive: true }))) return
    setState((prev) => ({ ...prev, evalAssignments: prev.evalAssignments.filter((a) => a.id !== id) }))
  }

  if (linkModal) {
    return (
      <ModalDialog
        title={ui.evalLinkModalTitle}
        onClose={() => setLinkModal(null)}
        footer={
          <Button variant="default" onClick={() => setLinkModal(null)}>
            {ui.btnClose}
          </Button>
        }
      >
        <Note className="mb-3">
          {ui.evalLinkTrustNote}
        </Note>
        <Input
          type="text"
          size="sm"
          readOnly
          value={linkModal}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          className="font-mono"
        />
      </ModalDialog>
    )
  }

  if (breakdownOpen) {
    const completed = assignments.filter((a) => a.status === 'completed')
    const pending = assignments.filter((a) => a.status !== 'completed')
    const row = (a: (typeof assignments)[number]) => {
      const targetEmp = state.employees.find((e) => e.id === a.targetEmployeeId)
      const src = APEX_SOURCES.find((s) => s.key === a.templateType)
      return (
        <div key={a.id} className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
          <span>
            {targetEmp ? `${targetEmp.nome} ${targetEmp.cognome}` : '—'} <span className="text-app-small text-muted-foreground [&_b]:font-medium [&_b]:text-foreground">— {src?.label || ''}</span>
          </span>
        </div>
      )
    }
    return (
      <ModalDialog
        title={ui.evalManagerTitle}
        onClose={() => setBreakdownOpen(false)}
        footer={
          <Button variant="outline" onClick={() => setBreakdownOpen(false)}>
            {ui.btnClose}
          </Button>
        }
      >
        <CardLabel className="mb-2">
          {ui.evalStatusCompleted} ({completed.length})
        </CardLabel>
        {completed.length ? completed.map(row) : <Note className="mb-3">{ui.evalNoAssignments}</Note>}
        <CardLabel className="mt-4 mb-2">
          {ui.evalStatusPending} ({pending.length})
        </CardLabel>
        {pending.length ? pending.map(row) : <Note>{ui.evalNoAssignments}</Note>}
      </ModalDialog>
    )
  }

  return (
    <ModalDialog dirty={dirty} title={ui.evalManagerTitle} sub={ui.evalManagerSub} wide onClose={onClose} footer={<Button variant="outline" onClick={onClose}>{ui.btnClose}</Button>}>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <StatCard label={ui.evalSentLabel} value={sentCount} onClick={() => setBreakdownOpen(true)} />
        <StatCard label={ui.evalReceivedLabel} value={receivedCount} onClick={() => setBreakdownOpen(true)} />
      </div>

      <Separator className="my-4" />
      <CardTitle className="mb-1">{ui.f6PlanTitle}</CardTitle>
      <Note className="mb-3">{ui.f6PlanIntro}</Note>
      <div className="mb-2 flex flex-wrap items-end gap-3">
        <Field label={ui.evalPeriodLabel} className="min-w-48">
          <SelectField value={periodId} onValueChange={(v) => setPeriodId(v)}>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </SelectField>
        </Field>
        <Field label={ui.f6PlanPeers} className="w-32">
          <Input type="number" min={0} max={10} value={peers} onChange={(e) => setPeers(e.target.value)} />
        </Field>
        <Button variant="default" onClick={generatePlan}>
          {ui.f6PlanGenerate}
        </Button>
      </div>
      {planResult ? (
        <div className="mb-2 flex flex-col gap-1">
          <Note>{planResult.created ? ui.f6PlanCreated(planResult.created) : ui.f6PlanNothing}</Note>
          {planResult.noManager.length ? <Note>{ui.f6PlanNoManager(planResult.noManager.join(', '))}</Note> : null}
          {planResult.fewPeers.length ? <Note>{ui.f6PlanFewPeers(planResult.fewPeers.join(', '))}</Note> : null}
        </div>
      ) : null}

      <Separator className="my-4" />
      <CardTitle className="mb-3">
        {ui.evalAssignTitle}
      </CardTitle>
      <FieldGrid>
        <Field label={ui.evalTemplateLabel}>
          <SelectField value={template} onValueChange={(v) => setTemplate(v as ApexSourceKey)}>
            {APEX_SOURCES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </SelectField>
        </Field>
        <Field label={ui.evalPeriodLabel}>
          <SelectField value={periodId} onValueChange={(v) => setPeriodId(v)}>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </SelectField>
        </Field>
      </FieldGrid>
      <div className="flex flex-wrap items-end gap-4">
        <Field label={ui.evalNewPeriodLabel} className="min-w-40 flex-1">
          <Input type="text" placeholder={ui.evalNewPeriodPh} value={newPeriodLabel} onChange={(e) => setNewPeriodLabel(e.target.value)} />
        </Field>
        <Button type="button" variant="outline" size="sm" onClick={addPeriod}>
          {ui.evalAddPeriodBtn}
        </Button>
      </div>
      {template !== 'auto' ? (
        <div className="flex flex-wrap items-end gap-4">
          <Field label={ui.evaluatorNameLabel} className="min-w-40 flex-1">
            <Input type="text" list="dl-evaluators-ea" placeholder={ui.evaluatorNamePh} value={evaluatorName} onChange={(e) => setEvaluatorName(e.target.value)} />
            <datalist id="dl-evaluators-ea">
              {state.evaluators.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </Field>
          <Field label={ui.evaluatorEmailLabel} className="min-w-40 flex-1">
            <Input type="email" placeholder={ui.evaluatorEmailPh} value={evaluatorEmail} onChange={(e) => setEvaluatorEmail(e.target.value)} />
          </Field>
        </div>
      ) : (
        <Note className="mb-3">
          {ui.evaluatorSelfNote}
        </Note>
      )}
      <Field label={ui.evalTargetsLabel}>
        <div className="max-h-44 overflow-y-auto rounded-sm border border-border px-3 py-2">
          {state.employees
            .filter((e) => !e.archived)
            .map((e) => (
              <div className="flex items-center gap-2 py-1 text-app-small" key={e.id}>
                <Checkbox id={`ea-target-${e.id}`} checked={!!targets[e.id]} onCheckedChange={(c) => setTargets((prev) => ({ ...prev, [e.id]: c === true }))} />
                <label className="cursor-pointer" htmlFor={`ea-target-${e.id}`}>
                  {e.nome} {e.cognome} — {e.ruolo}
                </label>
              </div>
            ))}
        </div>
      </Field>
      <Button variant="default" size="sm" onClick={createAssignments}>
        {ui.evalCreateBtn}
      </Button>

      <Separator className="my-4" />
      <CardTitle className="mb-3">
        {ui.evalAssignmentsListTitle}
      </CardTitle>
      <Table frame>
          <TableHeader>
            <TableRow>
              <TableHead>{ui.evalColTarget}</TableHead>
              <TableHead>{ui.evalColTemplate}</TableHead>
              <TableHead>{ui.evalColEvaluator}</TableHead>
              <TableHead>{ui.evalColPeriod}</TableHead>
              <TableHead>{ui.evalColStatus}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.length ? (
              [...assignments].reverse().map((a) => {
                const targetEmp = state.employees.find((e) => e.id === a.targetEmployeeId)
                const src = APEX_SOURCES.find((s) => s.key === a.templateType)
                const period = periods.find((p) => p.id === a.periodId)
                return (
                  <TableRow key={a.id}>
                    <TableCell>{targetEmp ? `${targetEmp.nome} ${targetEmp.cognome}` : '—'}</TableCell>
                    <TableCell>{src ? src.label : a.templateType}</TableCell>
                    <TableCell>{a.evaluatorName || '—'}</TableCell>
                    <TableCell>{period ? period.label : '—'}</TableCell>
                    <TableCell>
                      <Badge tone={a.status === 'completed' ? 'success' : 'neutral'} dot>
                        {a.status === 'completed' ? ui.evalStatusCompleted : ui.evalStatusPending}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
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
                      <Button variant="destructive" size="icon-sm" aria-label={ui.deleteAssignmentConfirmBtn} onClick={() => deleteAssignment(a.id)}>
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6}>
                  <Note className="py-4 text-center">{ui.evalNoAssignments}</Note>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      {confirmDialog}
    </ModalDialog>
  )
}
