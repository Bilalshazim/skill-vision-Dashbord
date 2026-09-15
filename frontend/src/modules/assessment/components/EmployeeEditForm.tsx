import { useState } from 'react'

import { AbsencesEditor } from '@/modules/assessment/components/AbsencesEditor'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { allRolesKnown, areasList, repartiList } from '@/modules/assessment/lib/calculations'
import type { Absence, Employee } from '@/modules/assessment/lib/types'

// Migrated from buildEmployeeEditFormHtml()/saveEmployeeProfileEdit()
// (js/assessment.js ~5610-5677) — the drawer's inline edit form, entered via
// toggleDrawerEdit(true). Same fields, same "Unassigned" fallback for
// blanked area/ruolo, same absences editor.
export function EmployeeEditForm({ emp, onSave, onCancel }: { emp: Employee; onSave: (patch: Partial<Employee>) => void; onCancel: () => void }) {
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
      <div className="field-row">
        <div className="field">
          <label>{ui.addEmpFirstName}</label>
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="field">
          <label>{ui.addEmpLastName}</label>
          <input type="text" value={cognome} onChange={(e) => setCognome(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>{ui.addEmpEmail}</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field-row">
        <div className="field">
          <label>{ui.addEmpArea}</label>
          <input type="text" list="dl-aree-edit" value={area} onChange={(e) => setArea(e.target.value)} />
          <datalist id="dl-aree-edit">
            {areas.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </div>
        <div className="field">
          <label>{ui.addEmpDept}</label>
          <input type="text" list="dl-reparti-edit" value={reparto} onChange={(e) => setReparto(e.target.value)} />
          <datalist id="dl-reparti-edit">
            {reparti.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="field">
        <label>{ui.addEmpRole}</label>
        <input type="text" list="dl-ruoli-edit" value={ruolo} onChange={(e) => setRuolo(e.target.value)} />
        <datalist id="dl-ruoli-edit">
          {roles.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
      </div>
      <div className="field">
        <label>{ui.addEmpDuties}</label>
        <textarea value={mansione} onChange={(e) => setMansione(e.target.value)} />
      </div>
      <div className="divider" />
      <div className="field-row">
        <div className="field">
          <label>{ui.genderLabel}</label>
          <select value={sesso} onChange={(e) => setSesso(e.target.value)}>
            <option value="">{ui.genderUnspecified}</option>
            <option value="F">{ui.genderFemale}</option>
            <option value="M">{ui.genderMale}</option>
            <option value="Altro">{ui.genderOther}</option>
          </select>
        </div>
        <div className="field">
          <label>{ui.ccnlLevelLabel}</label>
          <input type="text" value={ccnl} onChange={(e) => setCcnl(e.target.value)} />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>{ui.ralLabel}</label>
          <input type="number" min={0} step={500} value={ral} onChange={(e) => setRal(e.target.value)} />
        </div>
        <div className="field">
          <label>{ui.benefitLabel}</label>
          <input type="text" value={benefit} onChange={(e) => setBenefit(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>{ui.contractTypeLabel}</label>
        <select value={tipoContratto} onChange={(e) => setTipoContratto(e.target.value as Employee['tipoContratto'])}>
          <option value="dipendente">{ui.contractTypeDipendente}</option>
          <option value="cocopro">{ui.contractTypeCocopro}</option>
          <option value="partitaIva">{ui.contractTypePartitaIva}</option>
          <option value="esterno">{ui.contractTypeEsterno}</option>
        </select>
      </div>
      <AbsencesEditor rows={absences} onChange={setAbsences} />
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button className="btn btn-primary btn-sm" onClick={save}>
          {ui.saveChanges}
        </button>
        <button className="btn btn-sm" onClick={onCancel}>
          {ui.cancelEdit}
        </button>
      </div>
    </div>
  )
}
