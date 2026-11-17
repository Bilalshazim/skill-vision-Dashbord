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
import { errorReason } from '@/modules/assessment/lib/server-sync'

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
// Roberto, 2026-11-17: accanto al nome Area – Ruolo – Mansione, e un'azione di salvataggio
// chiara. Le caselle restano in bozza finché non si preme «Salva», che scrive sul server e dice
// «salvato» solo a salvataggio avvenuto.
export function SoftSkillBigFivePicker() {
  const { state, lang, ui, canEdit, toast, saveEmployee } = useAssessment()
  const [empId, setEmpId] = useState(state.employees[0]?.id ?? '')
  // Le scelte non salvate, per persona: `null` = torna all'elenco della mansione.
  const [drafts, setDrafts] = useState<Record<string, string[] | null>>({})
  const [saving, setSaving] = useState(false)
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

  const hasDraft = employee.id in drafts
  const effective = hasDraft ? { ...employee, softSkillOverrides: drafts[employee.id] ?? undefined } : employee
  const assigned = getEmployeeExpectedSkillIds(state, effective)
  const isOverridden = effective.softSkillOverrides !== undefined
  const dirtyIds = Object.keys(drafts).filter((id) => state.employees.some((e) => e.id === id))

  function toggle(skillId: string) {
    if (!canEdit) return
    const next = assigned.includes(skillId) ? assigned.filter((s) => s !== skillId) : [...assigned, skillId]
    setDrafts((p) => ({ ...p, [employee.id]: next }))
  }

  function reset() {
    if (!canEdit) return
    setDrafts((p) => ({ ...p, [employee.id]: null }))
  }

  // Salva sul server le persone modificate. Chi non si salva resta fra le modifiche, con il motivo.
  async function save() {
    if (!canEdit || !dirtyIds.length) return
    setSaving(true)
    const failed: Record<string, string[] | null> = {}
    let reason = ''
    for (const id of dirtyIds) {
      const emp = state.employees.find((e) => e.id === id)
      if (!emp) continue
      try {
        await saveEmployee({ ...emp, softSkillOverrides: drafts[id] ?? undefined })
      } catch (err) {
        failed[id] = drafts[id]
        reason = errorReason(err, ui.serverOffline)
      }
    }
    setDrafts(failed)
    setSaving(false)
    if (reason) toast(ui.softPickSaveFailed(reason), 'err')
    else toast(ui.softPickSaved(dirtyIds.length), 'ok')
  }

  const context = [
    { label: ui.softPickArea, value: employee.area },
    { label: ui.softPickRole, value: employee.ruolo },
    { label: ui.softPickDuties, value: employee.mansione },
  ]

  const it = lang === 'it'
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{it ? 'Le 35 competenze trasversali per fattore' : 'The 35 cross-functional competencies by factor'}</CardTitle>
          <CardDescription>
            {it
              ? 'Cinque fattori di personalità (Big Five). Spunta le competenze richieste alla persona e salva: quelle spuntate entrano nella sua valutazione.'
              : 'Five personality factors (Big Five). Tick the competencies required of the person and save: the ticked ones enter their evaluation.'}
          </CardDescription>
        </div>
      </CardHeader>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label={it ? 'Dipendente' : 'Employee'} className="w-full max-w-md">
          <SelectField value={employee.id} onValueChange={setEmpId}>
            {state.employees.map((e) => (
              <option key={e.id} value={e.id}>
                {`${e.cognome} ${e.nome} — ${[e.area, e.ruolo, e.mansione].filter(Boolean).join(' – ')}${e.id in drafts ? ` · ${ui.softPickUnsavedShort}` : ''}`}
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
      {/* Area – Ruolo – Mansione della persona scelta, accanto al nome. */}
      <dl className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {context.map((c) => (
          <div key={c.label} className="flex min-w-0 flex-col gap-1">
            <dt className="label-mono text-muted-foreground">{c.label}</dt>
            <dd className="text-app-body text-foreground">{c.value || '—'}</dd>
          </div>
        ))}
      </dl>
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
                      <Checkbox checked={on} disabled={!canEdit || saving} onCheckedChange={() => toggle(sk.id)} className="mt-0.5" />
                      <span className="min-w-0 flex-1">
                        {sk.name}
                        {on ? <Badge className="ml-1.5 align-middle">{weightLabel(getEmployeeSkillWeight(state, effective, sk.id).weight, lang)}</Badge> : null}
                      </span>
                    </label>
                  )
                })}
              </section>
            )
          })}
        </div>
      </div>
      {canEdit ? (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
          <span className="text-app-small text-muted-foreground" aria-live="polite">
            {dirtyIds.length ? ui.softPickUnsaved(dirtyIds.length) : ui.softPickAllSaved}
          </span>
          {dirtyIds.length ? (
            <Button type="button" variant="ghost" disabled={saving} onClick={() => setDrafts({})}>
              {ui.softPickDiscard}
            </Button>
          ) : null}
          <Button type="button" disabled={saving || !dirtyIds.length} onClick={() => void save()}>
            {saving ? ui.softPickSaving : ui.softPickSave}
          </Button>
        </div>
      ) : null}
    </Card>
  )
}
