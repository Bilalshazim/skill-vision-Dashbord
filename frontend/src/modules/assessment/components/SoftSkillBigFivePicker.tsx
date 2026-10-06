import { useState } from 'react'

import { Field } from '@/components/patterns/Field'
import { Note } from '@/components/patterns/Note'
import { SelectField } from '@/components/patterns/SelectField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { BF_SUB } from '@/modules/recruiting/lib/constants'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { BIGFIVE_ORDER } from '@/modules/assessment/lib/legacy-taxonomy'
import { getBigFiveDims, getSoftSkills } from '@/modules/assessment/lib/legacy-utils'
import { getEmployeeExpectedSkillIds, getEmployeeSkillWeight, weightLabel } from '@/modules/assessment/lib/role-census'

// I sottofattori di ogni fattore, come nella scheda di Recruiting (BF_SUB):
// là sono scritti con i nomi italiani dei cinque fattori.
const SUB_KEY: Record<string, string> = { O: 'Apertura', C: 'Coscienziosità', E: 'Estroversione', A: 'Amicalità', S: 'Stabilità emotiva' }

// Le competenze trasversali di una persona (Foglio 5, parte C, Roberto
// Feliciani): la stessa impostazione della selezione di Recruiting — le 35
// competenze in colonne, ciascuna con la sua casella e l'etichetta del peso —
// ma raggruppate nei cinque fattori del modello Big Five. La casella aggiunge
// o toglie la competenza dall'elenco della persona (Employee.softSkillOverrides,
// lo stesso dato della finestra "Competenze trasversali" dell'Anagrafica);
// "Ripristina" torna all'elenco della mansione.
export function SoftSkillBigFivePicker() {
  const { state, setState, lang, ui, canEdit } = useAssessment()
  const [empId, setEmpId] = useState(state.employees[0]?.id ?? '')
  const employee = state.employees.find((e) => e.id === empId) ?? state.employees[0]
  const skills = getSoftSkills(lang)
  const dims = getBigFiveDims(lang)

  if (!employee) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{lang === 'it' ? 'Le 35 competenze trasversali per fattore' : 'The 35 cross-functional competencies by factor'}</CardTitle>
        </CardHeader>
        <Note>{lang === 'it' ? "Nessun dipendente in anagrafica: aggiungine uno per scegliere le sue competenze trasversali." : 'No employees yet: add one to choose their cross-functional competencies.'}</Note>
      </Card>
    )
  }

  const assigned = getEmployeeExpectedSkillIds(state, employee)
  const isOverridden = employee.softSkillOverrides !== undefined

  function toggle(skillId: string) {
    if (!canEdit) return
    setState((prev) => {
      const emp = prev.employees.find((e) => e.id === employee.id)
      if (!emp) return prev
      const current = getEmployeeExpectedSkillIds(prev, emp)
      const next = current.includes(skillId) ? current.filter((s) => s !== skillId) : [...current, skillId]
      return { ...prev, employees: prev.employees.map((e) => (e.id === employee.id ? { ...e, softSkillOverrides: next } : e)) }
    })
  }

  function reset() {
    if (!canEdit) return
    setState((prev) => ({ ...prev, employees: prev.employees.map((e) => (e.id === employee.id ? { ...e, softSkillOverrides: undefined } : e)) }))
  }

  const it = lang === 'it'
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{it ? 'Le 35 competenze trasversali per fattore' : 'The 35 cross-functional competencies by factor'}</CardTitle>
          <CardDescription>
            {it
              ? 'Cinque fattori di personalità (Big Five). Spunta le competenze richieste alla persona: quelle spuntate entrano nella sua valutazione.'
              : 'Five personality factors (Big Five). Tick the competencies required of the person: the ticked ones enter their evaluation.'}
          </CardDescription>
        </div>
      </CardHeader>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label={it ? 'Dipendente' : 'Employee'} className="w-full max-w-md">
          <SelectField value={employee.id} onValueChange={setEmpId}>
            {state.employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.cognome} {e.nome} — {e.ruolo}
              </option>
            ))}
          </SelectField>
        </Field>
        <span className="pb-2 text-app-small font-semibold text-foreground">
          {it ? `${assigned.length} selezionate` : `${assigned.length} selected`}
        </span>
        {canEdit && isOverridden ? (
          <Button type="button" variant="outline" size="sm" onClick={reset}>
            {ui.empSoftModalResetBtn}
          </Button>
        ) : null}
      </div>
      {isOverridden ? <Note className="mb-3">{ui.empSoftModalOverrideNote}</Note> : null}

      <div className="overflow-x-auto">
        <div className="grid grid-flow-col auto-cols-[13rem] gap-3 pb-1">
          {BIGFIVE_ORDER.map((key) => {
            const list = skills.filter((s) => s.dim === key)
            const sub = it ? BF_SUB[SUB_KEY[key]] : undefined
            return (
              <section key={key} className="flex flex-col gap-1.5" aria-label={dims[key].label}>
                <div className="mb-1">
                  <div className="label-mono text-muted-foreground">{dims[key].label}</div>
                  {sub ? <div className="mt-0.5 text-app-caption italic text-muted-foreground">{sub.join(' · ')}</div> : null}
                </div>
                {list.map((sk) => {
                  const on = assigned.includes(sk.id)
                  return (
                    <label key={sk.id} className="flex cursor-pointer items-start gap-2 rounded-sm border border-border px-2 py-1.5 text-app-caption leading-snug text-foreground has-[:checked]:border-2 has-[:checked]:border-primary">
                      <Checkbox checked={on} disabled={!canEdit} onCheckedChange={() => toggle(sk.id)} className="mt-0.5" />
                      <span className="min-w-0 flex-1">
                        {sk.name}
                        {on ? <Badge className="ml-1.5 align-middle">{weightLabel(getEmployeeSkillWeight(state, employee, sk.id).weight, lang)}</Badge> : null}
                      </span>
                    </label>
                  )
                })}
              </section>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
