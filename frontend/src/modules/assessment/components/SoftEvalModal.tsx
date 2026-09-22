import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/modules/assessment/components/Modal'
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

  return (
    <Modal
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
      <div className="field">
        <label>{ui.softEvalEmployeeLabel}</label>
        <select value={empId} onChange={(e) => selectEmployee(e.target.value)}>
          {state.employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.cognome} {e.nome} — {e.ruolo}
            </option>
          ))}
        </select>
      </div>
      {SOFT_CLUSTERS.map((c) => (
        <div className="cluster-block" key={c}>
          <div className="cluster-title">{c}</div>
          {SOFT_SKILLS.filter((s) => s.cluster === c).map((s) => (
            <div className="score-row" key={s.id}>
              <div className="sname" style={{ flex: 1 }}>
                {s.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <label className="small-note" style={{ fontSize: 10.5 }}>
                  {ui.colObtained}
                </label>
                <input
                  className="neu-input"
                  type="number"
                  min={1}
                  max={10}
                  step={0.1}
                  value={drafts[s.id]?.ottenuto ?? 6}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [s.id]: { ...prev[s.id], ottenuto: Number(e.target.value) } }))}
                  style={{ width: 66, padding: '6px 8px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <label className="small-note" style={{ fontSize: 10.5 }}>
                  {ui.colExpected}
                </label>
                <input
                  className="neu-input"
                  type="number"
                  min={1}
                  max={10}
                  step={0.1}
                  value={drafts[s.id]?.atteso ?? 6}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [s.id]: { ...prev[s.id], atteso: Number(e.target.value) } }))}
                  style={{ width: 66, padding: '6px 8px' }}
                />
              </div>
            </div>
          ))}
        </div>
      ))}
    </Modal>
  )
}
