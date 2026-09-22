import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/modules/assessment/components/Modal'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { computeHardSummary } from '@/modules/assessment/lib/calculations'
import { getApex5dDimensions, getApexSources } from '@/modules/assessment/lib/legacy-utils'
import type { ApexSourceKey } from '@/modules/assessment/lib/types'

// Migrated from openHardEvalModal()/renderHardEvalItems()/submitHardEval()
// (js/assessment.js ~7361-7454) — direct admin entry of an employee's APEX 5D
// scores for one source (Manager/Peer/Self), distinct from the evaluator-
// token flow. Also pushes the same hardHistory snapshot shape as
// submitRestrictedEval(), so both entry paths feed the same longitudinal
// history (an explicit legacy fix noted in its own source comment).
export function HardEvalModal({ onClose }: { onClose: () => void }) {
  const { state, setState, lang, ui, toast } = useAssessment()
  const APEX5D_DIMENSIONS = getApex5dDimensions(lang)
  const APEX_SOURCES = getApexSources(lang)
  // storage.ts's hydrate() guarantees evalPeriods is never empty (backfills
  // a default "Periodo corrente" entry), unlike legacy's STATE.evalPeriods
  // which starts undefined until ensureDefaultPeriod() first runs — so
  // state.evalPeriods can be used directly here.
  const periods = state.evalPeriods

  const [empId, setEmpId] = useState(state.employees[0]?.id || '')
  const [source, setSource] = useState<ApexSourceKey>(APEX_SOURCES[0].key as ApexSourceKey)
  const [periodId, setPeriodId] = useState(periods[periods.length - 1]?.id || '')
  const [evaluatorName, setEvaluatorName] = useState('')
  const emp = state.employees.find((e) => e.id === empId)

  function selectEmpOrSource(nextEmpId: string, nextSource: ApexSourceKey) {
    setEmpId(nextEmpId)
    setSource(nextSource)
    const e = state.employees.find((x) => x.id === nextEmpId)
    setEvaluatorName(nextSource === 'auto' ? '' : (e?.hardEvaluatedBy && e.hardEvaluatedBy[nextSource]) || '')
  }

  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    if (emp) APEX5D_DIMENSIONS.forEach((dim) => dim.items.forEach((it) => (init[it.cod] = (emp.hard[source] || {})[it.cod] || 6)))
    return init
  })

  function reloadValues(nextEmpId: string, nextSource: ApexSourceKey) {
    const e = state.employees.find((x) => x.id === nextEmpId)
    const init: Record<string, number> = {}
    if (e) APEX5D_DIMENSIONS.forEach((dim) => dim.items.forEach((it) => (init[it.cod] = (e.hard[nextSource] || {})[it.cod] || 6)))
    setValues(init)
  }

  function submit() {
    if (!emp) return
    if (source !== 'auto' && !evaluatorName.trim()) {
      toast(ui.toastEnterEvaluatorFirst, 'err')
      return
    }
    setState((prev) => ({
      ...prev,
      evaluators: source !== 'auto' && evaluatorName.trim() && !prev.evaluators.some((n) => n.toLowerCase() === evaluatorName.trim().toLowerCase()) ? [...prev.evaluators, evaluatorName.trim()] : prev.evaluators,
      employees: prev.employees.map((e) => {
        if (e.id !== emp.id) return e
        const hardEvaluatedBy = { ...(e.hardEvaluatedBy || { resp: '', peer: '', auto: '' }) }
        hardEvaluatedBy[source] = source === 'auto' ? `${e.nome} ${e.cognome}` : evaluatorName.trim()
        const hard = { ...e.hard, [source]: { ...(e.hard[source] || {}), ...values } }
        const nEmp = { ...e, hard, hardEvaluatedBy }
        const period = periods.find((p) => p.id === periodId)
        const hsm = computeHardSummary(nEmp, lang)
        const hardHistory = [
          ...(nEmp.hardHistory || []),
          { module: 'professional' as const, periodId, periodLabel: period ? period.label : '', date: new Date().toISOString(), source, apexScore: hsm.apexScore, dims: hsm.dims.map((d) => ({ code: d.code, name: d.name, score: d.mediaTotale })) },
        ]
        return { ...nEmp, hardHistory }
      }),
    }))
    toast(ui.toastHardEvalSaved(APEX_SOURCES.find((s) => s.key === source)?.label || source), 'ok')
    onClose()
  }

  if (!emp) return null

  return (
    <Modal
      title={ui.hardEvalModalTitle}
      sub={ui.hardEvalModalSub}
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
      <div className="field-row">
        <div className="field">
          <label>{ui.hardEvaluateeLabel}</label>
          <select
            value={empId}
            onChange={(e) => {
              selectEmpOrSource(e.target.value, source)
              reloadValues(e.target.value, source)
            }}
          >
            {state.employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.cognome} {e.nome} — {e.ruolo}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{ui.hardEvaluatorSourceLabel}</label>
          <select
            value={source}
            onChange={(e) => {
              selectEmpOrSource(empId, e.target.value as ApexSourceKey)
              reloadValues(empId, e.target.value as ApexSourceKey)
            }}
          >
            {APEX_SOURCES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
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
      {source !== 'auto' ? (
        <div className="field">
          <label>{ui.evaluatorNameLabel}</label>
          <input type="text" list="dl-evaluators" placeholder={ui.evaluatorNamePh} value={evaluatorName} onChange={(e) => setEvaluatorName(e.target.value)} />
          <datalist id="dl-evaluators">
            {state.evaluators.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>
      ) : (
        <div className="small-note" style={{ marginBottom: 10 }}>
          {ui.evaluatorSelfNote}
        </div>
      )}
      <div className="small-note" style={{ marginBottom: 10 }} dangerouslySetInnerHTML={{ __html: ui.hardItemsNote }} />
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
              <input className="sslider" type="range" min={1} max={10} step={1} value={values[it.cod] ?? 6} onChange={(e) => setValues((prev) => ({ ...prev, [it.cod]: Number(e.target.value) }))} />
              <div className="sval">{values[it.cod] ?? 6}</div>
              <span className="chip chip-gray" style={{ flexShrink: 0 }}>
                {ui.hardExpChip}
              </span>
            </div>
          ))}
        </div>
      ))}
    </Modal>
  )
}
