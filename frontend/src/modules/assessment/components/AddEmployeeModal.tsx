import { useState } from 'react'

import { Note } from '@/components/patterns/Note'
import { Separator } from '@/components/ui/separator'
import { useDirty } from '@/hooks/use-dirty'
import { RoleCombobox } from '@/components/patterns/RoleCombobox'
import { ROLE_CATALOG } from '@/lib/role-catalog'
import { SelectField } from '@/components/patterns/SelectField'
import { Field } from '@/components/patterns/Field'
import { FieldGrid } from '@/components/patterns/FieldGrid'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { AbsencesEditor } from '@/modules/assessment/components/AbsencesEditor'
import { ModalDialog } from '@/components/patterns/ModalDialog'
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
  const dirty = useDirty({ nome, cognome, email, area, reparto, ruolo, mansione, sesso, ccnl, ral, benefit, tipoContratto, absences })

  function submit() {
    const n = nome.trim()
    const c = cognome.trim()
    if (!n || !c) {
      toast(ui.toastEnterNameFirst, 'err')
      return
    }
    if (!ruolo.trim()) {
      toast(ui.toastSelectRoleFirst, 'err')
      return
    }
    setState((prev) => {
      const next = structuredClone(prev)
      const rp = ensureRoleProfile(next, ruolo.trim())
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
        ruolo: ruolo.trim(),
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
    <ModalDialog dirty={dirty}
      title={ui.addEmpModalTitle}
      sub={ui.addEmpModalSub}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {ui.importCancel}
          </Button>
          <Button variant="default" onClick={submit}>
            {ui.anagAddEmployee}
          </Button>
        </>
      }
    >
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
          <Input type="text" list="dl-aree" placeholder={ui.addEmpAreaPh} value={area} onChange={(e) => setArea(e.target.value)} />
          <datalist id="dl-aree">
            {areas.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </Field>
        <Field label={ui.addEmpDept}>
          <Input type="text" list="dl-reparti" placeholder={ui.addEmpDeptPh} value={reparto} onChange={(e) => setReparto(e.target.value)} />
          <datalist id="dl-reparti">
            {reparti.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </Field>
      </FieldGrid>
      {/* Foglio 6: tutte le posizioni preconfigurate, per area, oltre alle
          mansioni già nel censimento; si può anche scriverne una nuova (il
          suo profilo si crea al salvataggio, con le attese di base). */}
      <Field label={ui.addEmpRole}>
        <RoleCombobox
          value={ruolo}
          onValueChange={setRuolo}
          placeholder={ui.addEmpRoleEmptyOption}
          groups={[...(censusRoles.length ? [{ label: lang === 'it' ? 'Mansioni dell\'azienda' : 'Company roles', roles: censusRoles }] : []), ...ROLE_CATALOG.map((g) => ({ label: g.area, roles: g.roles }))]}
        />
      </Field>
      <Field label={ui.addEmpDuties}>
        <Textarea placeholder={ui.addEmpDutiesPh} value={mansione} onChange={(e) => setMansione(e.target.value)} />
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
          <Input type="text" placeholder={ui.ccnlLevelPh} value={ccnl} onChange={(e) => setCcnl(e.target.value)} />
        </Field>
      </FieldGrid>
      <FieldGrid>
        <Field label={ui.ralLabel}>
          <Input type="number" min={0} step={500} placeholder={ui.ralPh} value={ral} onChange={(e) => setRal(e.target.value)} />
        </Field>
        <Field label={ui.benefitLabel}>
          <Input type="text" placeholder={ui.benefitPh} value={benefit} onChange={(e) => setBenefit(e.target.value)} />
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
      <Note>{ui.addEmpNote}</Note>
    </ModalDialog>
  )
}
