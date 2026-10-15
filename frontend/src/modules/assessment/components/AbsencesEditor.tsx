import { Note } from '@/components/patterns/Note'
import { Field } from '@/components/patterns/Field'
import { SelectField } from '@/components/patterns/SelectField'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { Icon } from '@/modules/assessment/components/Icon'
import { absenceCategoryOf } from '@/modules/assessment/lib/absences'
import { ABSENCE_CATEGORIES, type Absence, type AbsenceCategory } from '@/modules/assessment/lib/types'

// Migrated from absencesEditorHtml()/addAbsenceRow()/removeAbsenceRow()/
// readAbsenceDraft() (js/assessment.js ~5309-5353) — shared by Add Employee
// and the drawer's inline edit form. Legacy syncs uncontrolled DOM inputs
// into a draft array on every add/remove; React just holds the array as
// controlled state directly, same visible add/remove/edit behavior.
// Il motivo è una scelta fra categorie, non più testo libero (decisione 3 del
// 2026-10-14); un motivo scritto prima si mostra come la sua categoria.
export function AbsencesEditor({ rows, onChange }: { rows: Absence[]; onChange: (rows: Absence[]) => void }) {
  const { ui } = useAssessment()

  function update(i: number, patch: Partial<Absence>) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }
  function add() {
    onChange([...rows, { dal: '', al: '' }])
  }
  function remove(i: number) {
    onChange(rows.filter((_, idx) => idx !== i))
  }

  return (
    <Field label={ui.scheduledAbsencesLabel}>
      <div>
        {rows.length ? (
          rows.map((a, i) => (
            <div className="flex flex-wrap items-end gap-4" key={i}>
              <Field label={ui.absenceFromLabel} className="min-w-36 flex-1">
                <Input type="date" value={a.dal} onChange={(e) => update(i, { dal: e.target.value })} />
              </Field>
              <Field label={ui.absenceToLabel} className="min-w-36 flex-1">
                <Input type="date" value={a.al} onChange={(e) => update(i, { al: e.target.value })} />
              </Field>
              <Field label={ui.absenceReasonLabel} className="min-w-48 flex-2">
                <SelectField value={absenceCategoryOf(a)} onValueChange={(v) => update(i, { category: (v || undefined) as AbsenceCategory | undefined, motivo: undefined })}>
                  <option value="">{ui.absenceCategoryPh}</option>
                  {ABSENCE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {ui.absenceCategories[c]}
                    </option>
                  ))}
                </SelectField>
              </Field>
              <Button type="button" variant="destructive" size="sm" onClick={() => remove(i)} aria-label={ui.removeAbsenceBtn}>
                <Icon name="trash" />
              </Button>
            </div>
          ))
        ) : (
          <Note className="mb-2">
            {ui.noScheduledAbsences}
          </Note>
        )}
      </div>
      <Button className="mt-2" type="button" variant="outline" size="sm"  onClick={add}>
        <Icon name="plus" />
        {ui.addAbsenceBtn}
      </Button>
    </Field>
  )
}
