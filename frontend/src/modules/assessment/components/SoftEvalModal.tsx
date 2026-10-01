import { useState } from 'react'

import { CardLabel } from '@/components/ui/card'
import { useDirty } from '@/hooks/use-dirty'
import { SelectField } from '@/components/patterns/SelectField'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/patterns/Field'
import { Button } from '@/components/ui/button'
import { ModalDialog } from '@/components/patterns/ModalDialog'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { computeSoftSummary } from '@/modules/assessment/lib/calculations'
import { getSoftClusters, getSoftSkills } from '@/modules/assessment/lib/legacy-utils'

// Migrated from openSoftEvalModal()/renderSoftEvalSkills()/submitSoftEval()
// (js/assessment.js ~6567-6625) — manual admin entry of an employee's 35
// soft-skill obtained/expected scores (decimal, 1-10), distinct from the
// evaluator-token flow (which only ever covers APEX 5D hard scores). Saving
// also pushes an emp.softHistory snapshot, exactly as legacy does.
export function SoftEvalModal({ onClose }: { onClose: () => void }) {
  const { state, setState, lang, ui } = useAssessment()
  const SOFT_CLUSTERS = getSoftClusters(lang)
  const SOFT_SKILLS = getSoftSkills(lang)
  const [empId, setEmpId] = useState(state.employees[0]?.id || '')
  const emp = state.employees.find((e) => e.id === empId)
  const [drafts, setDrafts] = useState<Record<string, { ottenuto: number; atteso: number }>>(() => {
    const init: Record<string, { ottenuto: number; atteso: number }> = {}
    if (emp) SOFT_SKILLS.forEach((s) => (init[s.id] = { ottenuto: emp.soft[s.id]?.ottenuto ?? 6, atteso: emp.soft[s.id]?.atteso ?? 6 }))
    return init
  })

  function selectEmployee(id: string) {
    setEmpId(id)
    const e = state.employees.find((x) => x.id === id)
    const init: Record<string, { ottenuto: number; atteso: number }> = {}
    if (e) SOFT_SKILLS.forEach((s) => (init[s.id] = { ottenuto: e.soft[s.id]?.ottenuto ?? 6, atteso: e.soft[s.id]?.atteso ?? 6 }))
    setDrafts(init)
  }

  function submit() {
    if (!emp) return
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => {
        if (e.id !== emp.id) return e
        const soft = { ...e.soft }
        Object.entries(drafts).forEach(([skillId, v]) => {
          soft[skillId] = { ottenuto: v.ottenuto, atteso: v.atteso }
        })
        const nEmp = { ...e, soft }
        const ss = computeSoftSummary(nEmp, lang)
        const softHistory = [...(nEmp.softHistory || []), { module: 'transversal' as const, date: new Date().toISOString(), source: 'manual' as const, overallOttenuto: ss.overallOttenuto, overallAtteso: ss.overallAtteso }]
        return { ...nEmp, softHistory }
      }),
    }))
    onClose()
  }

  const dirty = useDirty({ empId, drafts })

  return (
    <ModalDialog dirty={dirty}
      title={ui.softEvalModalTitle}
      sub={ui.softEvalModalSub}
      wide
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {ui.importCancel}
          </Button>
          <Button variant="default" onClick={submit}>
            {ui.btnSaveEvaluation}
          </Button>
        </>
      }
    >
      <Field label={ui.softEvalEmployeeLabel}>
        <SelectField value={empId} onValueChange={(v) => selectEmployee(v)}>
          {state.employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.cognome} {e.nome} — {e.ruolo}
            </option>
          ))}
        </SelectField>
      </Field>
      {SOFT_CLUSTERS.map((c) => (
        <section className="mb-4" key={c}>
          <CardLabel className="mb-2 border-b border-border pb-2">{c}</CardLabel>
          {SOFT_SKILLS.filter((s) => s.cluster === c).map((s) => (
            <div className="flex items-center gap-3 border-b border-border py-2 last:border-b-0" key={s.id}>
              <div className="min-w-0 flex-1 text-app-small font-medium">
                {s.name}
              </div>
              <div className="flex items-center gap-1">
                <Label htmlFor={`soft-eval-${s.id}-ottenuto`}>{ui.colObtained}</Label>
                <Input
                  id={`soft-eval-${s.id}-ottenuto`}
                  size="sm"
                  className="w-16 text-right tabular-nums"
                  type="number"
                  min={1}
                  max={10}
                  step={0.1}
                  value={drafts[s.id]?.ottenuto ?? 6}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [s.id]: { ...prev[s.id], ottenuto: Number(e.target.value) } }))}
                />
              </div>
              <div className="flex items-center gap-1">
                <Label htmlFor={`soft-eval-${s.id}-atteso`}>{ui.colExpected}</Label>
                <Input
                  id={`soft-eval-${s.id}-atteso`}
                  size="sm"
                  className="w-16 text-right tabular-nums"
                  type="number"
                  min={1}
                  max={10}
                  step={0.1}
                  value={drafts[s.id]?.atteso ?? 6}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [s.id]: { ...prev[s.id], atteso: Number(e.target.value) } }))}
                />
              </div>
            </div>
          ))}
        </section>
      ))}
    </ModalDialog>
  )
}
