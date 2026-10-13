import { Field } from '@/components/patterns/Field'
import { Note } from '@/components/patterns/Note'
import { SelectField } from '@/components/patterns/SelectField'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'

// La sede di lavoro del dipendente, scelta fra le sedi di Dati aziendali.
// Serve alla mappa delle sedi della Home ("La mappa dei valori"). Facoltativa:
// vuota, il dipendente non compare sulla mappa (o va alla sede unica, se
// l'azienda ne ha una sola). Se il valore salvato non è più fra le sedi (sede
// rinominata o tolta) resta nell'elenco, così non si perde in silenzio.
export function SedeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { state, ui } = useAssessment()
  const names = [...new Set(state.company.locations.map((l) => l.name.trim()).filter(Boolean))]
  if (value && !names.includes(value)) names.push(value)
  return (
    <Field label={ui.addEmpSede}>
      {names.length ? (
        <SelectField value={value} onValueChange={onChange}>
          <option value="">{ui.addEmpSedeNone}</option>
          {names.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </SelectField>
      ) : (
        <Note size="caption">{ui.addEmpSedeEmpty}</Note>
      )}
    </Field>
  )
}
