import { BookOpenText, Wrench } from 'lucide-react'
import { useState } from 'react'

import { CardLabel } from '@/components/ui/card'
import { Note } from '@/components/patterns/Note'
import { useDirty } from '@/hooks/use-dirty'
import { SelectField } from '@/components/patterns/SelectField'
import { Field } from '@/components/patterns/Field'
import { FieldGrid } from '@/components/patterns/FieldGrid'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ModalDialog } from '@/components/patterns/ModalDialog'
import { ApexItemRow } from '@/modules/assessment/components/ApexItemRow'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { computeHardSummary } from '@/modules/assessment/lib/calculations'
import { getApex5dDimensions, getApexSources } from '@/modules/assessment/lib/legacy-utils'
import { APEX5D_INSTRUCTIONS, APEX5D_TECH_NOTES } from '@/modules/assessment/lib/apex5d-guide'
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
  const [info, setInfo] = useState<'instructions' | 'notes' | null>(null)
  const emp = state.employees.find((e) => e.id === empId)

  function selectEmpOrSource(nextEmpId: string, nextSource: ApexSourceKey) {
    setEmpId(nextEmpId)
    setSource(nextSource)
    const e = state.employees.find((x) => x.id === nextEmpId)
    setEvaluatorName(nextSource === 'auto' ? '' : (e?.hardEvaluatedBy && e.hardEvaluatedBy[nextSource]) || '')
  }

  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    if (emp) APEX5D_DIMENSIONS.forEach((dim) => dim.items.forEach((it) => (init[it.cod] = (emp.hard[source] || {})[it.cod] || 0)))
    return init
  })
  const [notes, setNotes] = useState<Record<string, string>>(() => (emp?.hardNotes?.[source]) || {})
  const dirty = useDirty({ empId, source, periodId, evaluatorName, values, notes })

  function reloadValues(nextEmpId: string, nextSource: ApexSourceKey) {
    const e = state.employees.find((x) => x.id === nextEmpId)
    const init: Record<string, number> = {}
    if (e) APEX5D_DIMENSIONS.forEach((dim) => dim.items.forEach((it) => (init[it.cod] = (e.hard[nextSource] || {})[it.cod] || 0)))
    setValues(init)
    setNotes(e?.hardNotes?.[nextSource] || {})
  }

  function submit() {
    if (!emp) return
    if (source !== 'auto' && !evaluatorName.trim()) {
      toast(ui.toastEnterEvaluatorFirst, 'err')
      return
    }
    if (APEX5D_DIMENSIONS.some((d) => d.items.some((it) => !(values[it.cod] > 0)))) {
      toast(ui.f6RateAll, 'err')
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
        const hardNotes = { ...(e.hardNotes || {}), [source]: Object.fromEntries(Object.entries(notes).filter(([, t]) => t.trim())) }
        const nEmp = { ...e, hard, hardEvaluatedBy, hardNotes }
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
    <ModalDialog dirty={dirty}
      title={ui.hardEvalModalTitle}
      sub={ui.hardEvalModalSub}
      size="xl"
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
      <FieldGrid>
        <Field label={ui.hardEvaluateeLabel}>
          <SelectField
            value={empId}
            onValueChange={(v) => {
              selectEmpOrSource(v, source)
              reloadValues(v, source)
            }}
          >
            {state.employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.cognome} {e.nome} — {e.ruolo}
              </option>
            ))}
          </SelectField>
        </Field>
        <Field label={ui.hardEvaluatorSourceLabel}>
          <SelectField
            value={source}
            onValueChange={(v) => {
              selectEmpOrSource(empId, v as ApexSourceKey)
              reloadValues(empId, v as ApexSourceKey)
            }}
          >
            {APEX_SOURCES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </SelectField>
        </Field>
      </FieldGrid>
      <Field label={ui.evalPeriodLabel}>
        <SelectField value={periodId} onValueChange={(v) => setPeriodId(v)}>
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </SelectField>
      </Field>
      {source !== 'auto' ? (
        <Field label={ui.evaluatorNameLabel}>
          <Input type="text" list="dl-evaluators" placeholder={ui.evaluatorNamePh} value={evaluatorName} onChange={(e) => setEvaluatorName(e.target.value)} />
          <datalist id="dl-evaluators">
            {state.evaluators.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </Field>
      ) : (
        <Note className="mb-3">
          {ui.evaluatorSelfNote}
        </Note>
      )}
      <Note as="div" className="mb-3" dangerouslySetInnerHTML={{ __html: ui.hardItemsNote }} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setInfo('instructions')}>
          <BookOpenText aria-hidden="true" />
          {APEX5D_INSTRUCTIONS.title}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setInfo('notes')}>
          <Wrench aria-hidden="true" />
          {APEX5D_TECH_NOTES.title}
        </Button>
      </div>
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
              onValue={(n) => setValues((prev) => ({ ...prev, [it.cod]: n }))}
              onNote={(t) => setNotes((prev) => ({ ...prev, [it.cod]: t }))}
            />
          ))}
        </section>
      ))}
      {info === 'instructions' ? (
        <ModalDialog title={APEX5D_INSTRUCTIONS.title} sub={APEX5D_INSTRUCTIONS.intro} onClose={() => setInfo(null)} footer={<Button variant="outline" onClick={() => setInfo(null)}>Chiudi</Button>}>
          <CardLabel className="mb-2">Scala di valutazione · ancore comportamentali</CardLabel>
          <dl className="mb-4 flex flex-col gap-2">
            {APEX5D_INSTRUCTIONS.scale.map((r) => (
              <div key={r.range} className="grid grid-cols-[5rem_1fr] gap-3 border-b border-border pb-2 last:border-b-0">
                <dt className="text-app-small font-semibold tabular-nums">{r.range}</dt>
                <dd className="text-app-small">
                  <b className="font-semibold">{r.label}</b> — <span className="text-muted-foreground">{r.text}</span>
                </dd>
              </div>
            ))}
          </dl>
          <CardLabel className="mb-2">Modalità d'uso</CardLabel>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-app-small">
            {APEX5D_INSTRUCTIONS.steps.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        </ModalDialog>
      ) : null}
      {info === 'notes' ? (
        <ModalDialog title={APEX5D_TECH_NOTES.title} sub={APEX5D_INSTRUCTIONS.intro} size="xl" onClose={() => setInfo(null)} footer={<Button variant="outline" onClick={() => setInfo(null)}>Chiudi</Button>}>
          <div className="mb-4 overflow-x-auto">
            <table className="w-full text-left text-app-small">
              <thead>
                <tr className="label-mono border-b border-border text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Nome tecnico</th>
                  <th className="py-2 pr-3 font-medium">Quando si usa</th>
                  <th className="py-2 font-medium">Corrisponde a</th>
                </tr>
              </thead>
              <tbody>
                {APEX5D_TECH_NOTES.rows.map((r) => (
                  <tr key={r.name} className="border-b border-border align-top last:border-b-0">
                    <td className="py-2 pr-3 font-medium">{r.name}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{r.when}</td>
                    <td className="py-2 text-muted-foreground">{r.maps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3">
            {APEX5D_TECH_NOTES.suggestions.map((x) => (
              <div key={x.title}>
                <p className="text-app-small font-semibold">{x.title}</p>
                <Note>{x.text}</Note>
              </div>
            ))}
          </div>
        </ModalDialog>
      ) : null}
    </ModalDialog>
  )
}
