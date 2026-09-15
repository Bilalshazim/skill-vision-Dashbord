import { useState } from 'react'

import { AbsencesEditor } from '@/modules/assessment/components/AbsencesEditor'
import { Modal } from '@/modules/assessment/components/Modal'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { areasList, censusRolesList, repartiList } from '@/modules/assessment/lib/calculations'
import { getApex5dDimensions, getApexSources, getSoftSkills, uid } from '@/modules/assessment/lib/legacy-utils'
import { ensureRoleProfile } from '@/modules/assessment/lib/role-census'
import type { Absence, ApexSourceKey, Employee } from '@/modules/assessment/lib/types'

// Migrated from openAddEmployeeModal()/submitAddEmployee() (js/assessment.js
// ~5355-5444) — a new employee can only be created against a role that
// already has a Role Census profile (censusRolesList()), exactly like
// legacy: `if(!ruolo || !STATE.roleProfiles[ruolo])` is preserved as-is
// (not "fixed" into a free-text role field), since that's what seeds the
// new employee's soft-skill expected values from the role's weighting.
export function AddEmployeeModal({ onClose }: { onClose: () => void }) {
  const { state, setState, lang, ui, toast } = useAssessment()
  const areas = areasList(state)
  const reparti = repartiList(state)
  const censusRoles = censusRolesList(state)
  const SOFT_SKILLS = getSoftSkills(lang)
  const APEX5D_DIMENSIONS = getApex5dDimensions(lang)
  const APEX_SOURCES = getApexSources(lang)

  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [email, setEmail] = useState('')
  const [area, setArea] = useState('')
  const [reparto, setReparto] = useState('')
  const [ruolo, setRuolo] = useState('')
  const [mansione, setMansione] = useState('')
  const [sesso, setSesso] = useState('')
  const [ccnl, setCcnl] = useState('')
  const [ral, setRal] = useState('')
  const [benefit, setBenefit] = useState('')
  const [tipoContratto, setTipoContratto] = useState<Employee['tipoContratto']>('dipendente')
  const [absences, setAbsences] = useState<Absence[]>([])

  function submit() {
    const n = nome.trim()
    const c = cognome.trim()
    if (!n || !c) {
      toast(ui.toastEnterNameFirst, 'err')
      return
    }
    if (!ruolo || !state.roleProfiles[ruolo]) {
      toast(ui.toastSelectRoleFirst, 'err')
      return
    }
    setState((prev) => {
      const next = structuredClone(prev)
      const rp = ensureRoleProfile(next, ruolo)
      const soft: Employee['soft'] = {}
      SOFT_SKILLS.forEach((s) => {
        const weighted = rp.skillWeights?.[s.id]
        const atteso = weighted ? (rp.skillExpected?.[s.id] ?? 8) : 6
        soft[s.id] = { ottenuto: 0, atteso }
      })
      const hard: Employee['hard'] = { resp: {}, peer: {}, auto: {} }
      APEX5D_DIMENSIONS.forEach((d) => d.items.forEach((it) => APEX_SOURCES.forEach((src) => (hard[src.key as ApexSourceKey][it.cod] = 0))))
      const emp: Employee = {
        id: uid('emp'),
        nome: n,
        cognome: c,
        email: email.trim(),
        area: area.trim() || 'Unassigned',
        reparto: reparto.trim(),
        ruolo,
        mansione: mansione.trim(),
        tipoProfilo: 'Employee',
        sesso,
        tipoContratto,
        livelloCcnl: ccnl.trim(),
        ral: Math.max(0, parseInt(ral, 10) || 0),
        benefit: benefit.trim(),
        assenzeProgrammate: absences.filter((a) => a.dal || a.al || a.motivo.trim()),
        archived: null,
        soft,
        hard,
        hardEvaluatedBy: { resp: '', peer: '', auto: '' },
        hardHistory: [],
        softHistory: [],
        feedbackNeeded: false,
        developmentPlan: { azioni: '', formazione: '', coaching: '', obiettivi: '' },
        createdAt: new Date().toISOString(),
      }
      next.employees.push(emp)
      return next
    })
    toast(ui.toastEmployeeAdded, 'ok')
    onClose()
  }

  return (
    <Modal
      title={ui.addEmpModalTitle}
      sub={ui.addEmpModalSub}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            {ui.importCancel}
          </button>
          <button className="btn btn-primary" onClick={submit}>
            {ui.anagAddEmployee}
          </button>
        </>
      }
    >
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
          <input type="text" list="dl-aree" placeholder={ui.addEmpAreaPh} value={area} onChange={(e) => setArea(e.target.value)} />
          <datalist id="dl-aree">
            {areas.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </div>
        <div className="field">
          <label>{ui.addEmpDept}</label>
          <input type="text" list="dl-reparti" placeholder={ui.addEmpDeptPh} value={reparto} onChange={(e) => setReparto(e.target.value)} />
          <datalist id="dl-reparti">
            {reparti.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="field">
        <label>{ui.addEmpRole}</label>
        <select disabled={!censusRoles.length} value={ruolo} onChange={(e) => setRuolo(e.target.value)}>
          <option value="">{ui.addEmpRoleEmptyOption}</option>
          {censusRoles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {!censusRoles.length && <div className="hint">{ui.addEmpNoRolesHint}</div>}
      </div>
      <div className="field">
        <label>{ui.addEmpDuties}</label>
        <textarea placeholder={ui.addEmpDutiesPh} value={mansione} onChange={(e) => setMansione(e.target.value)} />
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
          <input type="text" placeholder={ui.ccnlLevelPh} value={ccnl} onChange={(e) => setCcnl(e.target.value)} />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>{ui.ralLabel}</label>
          <input type="number" min={0} step={500} placeholder={ui.ralPh} value={ral} onChange={(e) => setRal(e.target.value)} />
        </div>
        <div className="field">
          <label>{ui.benefitLabel}</label>
          <input type="text" placeholder={ui.benefitPh} value={benefit} onChange={(e) => setBenefit(e.target.value)} />
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
      <div className="small-note">{ui.addEmpNote}</div>
    </Modal>
  )
}
