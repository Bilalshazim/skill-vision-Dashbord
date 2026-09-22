import { Button } from '@/components/ui/button'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { Icon } from '@/modules/assessment/components/Icon'
import type { Absence } from '@/modules/assessment/lib/types'

// Migrated from absencesEditorHtml()/addAbsenceRow()/removeAbsenceRow()/
// readAbsenceDraft() (js/assessment.js ~5309-5353) — shared by Add Employee
// and the drawer's inline edit form. Legacy syncs uncontrolled DOM inputs
// into a draft array on every add/remove; React just holds the array as
// controlled state directly, same visible add/remove/edit behavior.
export function AbsencesEditor({ rows, onChange }: { rows: Absence[]; onChange: (rows: Absence[]) => void }) {
  const { ui } = useAssessment()

  function update(i: number, field: keyof Absence, value: string) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  }
  function add() {
    onChange([...rows, { dal: '', al: '', motivo: '' }])
  }
  function remove(i: number) {
    onChange(rows.filter((_, idx) => idx !== i))
  }

  return (
    <div className="field">
      <label>{ui.scheduledAbsencesLabel}</label>
      <div>
        {rows.length ? (
          rows.map((a, i) => (
            <div className="field-row" style={{ alignItems: 'flex-end' }} key={i}>
              <div className="field">
                <label>{ui.absenceFromLabel}</label>
                <input type="date" value={a.dal} onChange={(e) => update(i, 'dal', e.target.value)} />
              </div>
              <div className="field">
                <label>{ui.absenceToLabel}</label>
                <input type="date" value={a.al} onChange={(e) => update(i, 'al', e.target.value)} />
              </div>
              <div className="field" style={{ flex: 1.6 }}>
                <label>{ui.absenceReasonLabel}</label>
                <input type="text" value={a.motivo} placeholder={ui.absenceReasonPh} onChange={(e) => update(i, 'motivo', e.target.value)} />
              </div>
              <Button type="button" variant="destructive" size="sm" onClick={() => remove(i)} aria-label={ui.removeAbsenceBtn}>
                <Icon name="trash" />
              </Button>
            </div>
          ))
        ) : (
          <div className="small-note" style={{ marginBottom: 8 }}>
            {ui.noScheduledAbsences}
          </div>
        )}
      </div>
      <Button type="button" variant="outline" size="sm" style={{ marginTop: 6 }} onClick={add}>
        <Icon name="plus" />
        {ui.addAbsenceBtn}
      </Button>
    </div>
  )
}
