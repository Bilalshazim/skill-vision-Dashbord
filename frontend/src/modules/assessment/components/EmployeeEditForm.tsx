import { useEffect, useState } from 'react'

import { Separator } from '@/components/ui/separator'
import { useDirty } from '@/hooks/use-dirty'

import { SelectField } from '@/components/patterns/SelectField'
import { Field } from '@/components/patterns/Field'
import { FieldGrid } from '@/components/patterns/FieldGrid'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { AbsencesEditor } from '@/modules/assessment/components/AbsencesEditor'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { allRolesKnown, areasList, repartiList } from '@/modules/assessment/lib/calculations'
import type { Absence, Employee } from '@/modules/assessment/lib/types'

// Migrated from buildEmployeeEditFormHtml()/saveEmployeeProfileEdit()
// (js/assessment.js ~5610-5677) — the drawer's inline edit form, entered via
// toggleDrawerEdit(true). Same fields, same "Unassigned" fallback for
// blanked area/ruolo, same absences editor.
export function EmployeeEditForm({
  emp,
  onSave,
  onCancel,
  onDirtyChange,
}: {
  emp: Employee
  onSave: (patch: Partial<Employee>) => void
  onCancel: () => void
  /** Avvisa il pannello che contiene il modulo: serve alla conferma di chiusura. */
  onDirtyChange?: (dirty: boolean) => void
}) {
  const { state, ui, toast } = useAssessment()
  const areas = areasList(state)
  const reparti = repartiList(state)
  const roles = allRolesKnown(state)

  const [nome, setNome] = useState(emp.nome)
  const [cognome, setCognome] = useState(emp.cognome)
  const [email, setEmail] = useState(emp.email)
  const [area, setArea] = useState(emp.area)
  const [reparto, setReparto] = useState(emp.reparto)
  const [ruolo, setRuolo] = useState(emp.ruolo)
  const [mansione, setMansione] = useState(emp.mansione)
  const [sesso, setSesso] = useState(emp.sesso)
  const [ccnl, setCcnl] = useState(emp.livelloCcnl)
  const [ral, setRal] = useState(String(emp.ral || 0))
  const [benefit, setBenefit] = useState(emp.benefit)
  const [tipoContratto, setTipoContratto] = useState<Employee['tipoContratto']>(emp.tipoContratto)
  const [absences, setAbsences] = useState<Absence[]>(emp.assenzeProgrammate)
  const dirty = useDirty({ nome, cognome, email, area, reparto, ruolo, mansione, sesso, ccnl, ral, benefit, tipoContratto, absences })
  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])

  function save() {
    const n = nome.trim()
    const c = cognome.trim()
    if (!n || !c) {
      toast(ui.toastEnterNameFirst, 'err')
      return
    }
    onSave({
      nome: n,
      cognome: c,
      email: email.trim(),
      area: area.trim() || 'Unassigned',
      reparto: reparto.trim(),
      ruolo: ruolo.trim() || 'Unassigned',
      mansione: mansione.trim(),
      sesso,
      livelloCcnl: ccnl.trim(),
      ral: Math.max(0, parseInt(ral, 10) || 0),
      benefit: benefit.trim(),
      tipoContratto,
      assenzeProgrammate: absences.filter((a) => a.dal || a.al || a.motivo.trim()),
    })
  }

  return (
    <div>
      <FieldGrid>
        <Field label={ui.addEmpFirstName}>
          <Input type="text" value={nome} onChange={(e) => setNome(e.target.value)} />
        </Field>
        <Field label={ui.addEmpLastName}>
          <Input type="text" value={cognome} onChange={(e) => setCognome(e.target.value)} />
        </Field>
      </FieldGrid>
      <Field label={ui.addEmpEmail}>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <FieldGrid>
        <Field label={ui.addEmpArea}>
          <Input type="text" list="dl-aree-edit" value={area} onChange={(e) => setArea(e.target.value)} />
          <datalist id="dl-aree-edit">
            {areas.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </Field>
        <Field label={ui.addEmpDept}>
          <Input type="text" list="dl-reparti-edit" value={reparto} onChange={(e) => setReparto(e.target.value)} />
          <datalist id="dl-reparti-edit">
            {reparti.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </Field>
      </FieldGrid>
      <Field label={ui.addEmpRole}>
        <Input type="text" list="dl-ruoli-edit" value={ruolo} onChange={(e) => setRuolo(e.target.value)} />
        <datalist id="dl-ruoli-edit">
          {roles.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
      </Field>
      <Field label={ui.addEmpDuties}>
        <Textarea value={mansione} onChange={(e) => setMansione(e.target.value)} />
      </Field>
      <Separator className="my-4" />
      <FieldGrid>
        <Field label={ui.genderLabel}>
          <SelectField value={sesso} onValueChange={(v) => setSesso(v)}>
            <option value="">{ui.genderUnspecified}</option>
            <option value="F">{ui.genderFemale}</option>
            <option value="M">{ui.genderMale}</option>
            <option value="Altro">{ui.genderOther}</option>
          </SelectField>
        </Field>
        <Field label={ui.ccnlLevelLabel}>
          <Input type="text" value={ccnl} onChange={(e) => setCcnl(e.target.value)} />
        </Field>
      </FieldGrid>
      <FieldGrid>
        <Field label={ui.ralLabel}>
          <Input type="number" min={0} step={500} value={ral} onChange={(e) => setRal(e.target.value)} />
        </Field>
        <Field label={ui.benefitLabel}>
          <Input type="text" value={benefit} onChange={(e) => setBenefit(e.target.value)} />
        </Field>
      </FieldGrid>
      <Field label={ui.contractTypeLabel}>
        <SelectField value={tipoContratto} onValueChange={(v) => setTipoContratto(v as Employee['tipoContratto'])}>
          <option value="dipendente">{ui.contractTypeDipendente}</option>
          <option value="cocopro">{ui.contractTypeCocopro}</option>
          <option value="partitaIva">{ui.contractTypePartitaIva}</option>
          <option value="esterno">{ui.contractTypeEsterno}</option>
        </SelectField>
      </Field>
      <AbsencesEditor rows={absences} onChange={setAbsences} />
      <div className="flex gap-2 mt-2">
        <Button variant="default" size="sm" onClick={save}>
          {ui.saveChanges}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          {ui.cancelEdit}
        </Button>
      </div>
    </div>
  )
}
