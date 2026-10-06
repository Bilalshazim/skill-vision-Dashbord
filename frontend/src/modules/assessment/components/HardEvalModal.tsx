import { BookOpenText, Wrench } from 'lucide-react'
import { useState } from 'react'

import { CardLabel } from '@/components/ui/card'
import { InfoBubble } from '@/components/patterns/InfoBubble'
import { Note } from '@/components/patterns/Note'
import { useDirty } from '@/hooks/use-dirty'
import { Slider } from '@/components/ui/slider'
import { SelectField } from '@/components/patterns/SelectField'
import { Field } from '@/components/patterns/Field'
import { FieldGrid } from '@/components/patterns/FieldGrid'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ModalDialog } from '@/components/patterns/ModalDialog'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { computeHardSummary } from '@/modules/assessment/lib/calculations'
import { getApex5dDimensions, getApexSources } from '@/modules/assessment/lib/legacy-utils'
import { APEX5D_GUIDE, APEX5D_INSTRUCTIONS, APEX5D_TECH_NOTES } from '@/modules/assessment/lib/apex5d-guide'
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
    if (emp) APEX5D_DIMENSIONS.forEach((dim) => dim.items.forEach((it) => (init[it.cod] = (emp.hard[source] || {})[it.cod] || 6)))
    return init
  })
  const dirty = useDirty({ empId, source, periodId, evaluatorName, values })

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
          {/* Foglio 5: sopra le voci i due titoli di colonna; accanto a ogni
              voce due nuvolette, la domanda di valutazione e l'indice
              comportamentale (guida al punteggio) del file del cliente. */}
          <div className="label-mono hidden items-center gap-3 py-2 text-muted-foreground md:flex">
            <div className="w-72 shrink-0">Domanda di valutazione</div>
            <div className="flex-1">Indice comportamentale (guida al punteggio)</div>
          </div>
          {dim.items.map((it) => {
            const guide = APEX5D_GUIDE[it.cod]
            return (
              <div className="flex flex-wrap items-center gap-3 border-b border-border py-3 last:border-b-0 md:flex-nowrap" key={it.cod}>
                <div className="flex w-full items-center gap-2 md:w-72 md:shrink-0">
                  <span className="min-w-0 flex-1 text-app-small font-medium">
                    {it.cod} · {it.area}
                  </span>
                  {guide ? (
                    <InfoBubble label={`Domanda di valutazione ${it.cod}`} title="Domanda di valutazione">
                      <p>{guide.q}</p>
                    </InfoBubble>
                  ) : null}
                </div>
                <Slider className="min-w-40 flex-1" min={1} max={10} step={1} value={[values[it.cod] ?? 6]} onValueChange={([n]) => setValues((prev) => ({ ...prev, [it.cod]: n }))} aria-label={guide?.q ?? it.q} />
                <div className="w-8 text-right font-medium tabular-nums">{values[it.cod] ?? 6}</div>
                {guide ? (
                  <InfoBubble label={`Indice comportamentale ${it.cod}`} title="Indice comportamentale">
                    <dl className="flex flex-col gap-2">
                      {[
                        ['1', guide.low],
                        ['5', guide.mid],
                        ['10', guide.high],
                      ].map(([n, t]) => (
                        <div key={n} className="flex gap-2">
                          <dt className="w-6 shrink-0 font-semibold tabular-nums">{n}</dt>
                          <dd className="text-muted-foreground">{t}</dd>
                        </div>
                      ))}
                    </dl>
                  </InfoBubble>
                ) : null}
                <Badge className="shrink-0">{ui.hardExpChip}</Badge>
              </div>
            )
          })}
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
