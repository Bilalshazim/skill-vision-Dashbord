import { Modal } from '@/modules/assessment/components/Modal'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { getSoftClusters, getSoftSkills } from '@/modules/assessment/lib/legacy-utils'
import { getEmployeeExpectedSkillIds } from '@/modules/assessment/lib/role-census'

// Client feedback: soft-skill assignment was role-only (role-census.ts's
// applyRoleSkillToEmployees, filtered by Employee.ruolo). This lets a
// specific individual's list diverge from their role — accounting for
// Mansione (task/duty) too, per the brief — by editing
// Employee.softSkillOverrides directly, independent of the role's list.
// Opened by clicking "Competenze Trasversali" in the employee table row
// (AssessmentAnagraficaPage.tsx), not the row itself.
export function EmployeeSoftSkillModal({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const { state, setState, lang, ui, canEdit } = useAssessment()
  const employee = state.employees.find((e) => e.id === employeeId)
  const SOFT_CLUSTERS = getSoftClusters(lang)
  const SOFT_SKILLS = getSoftSkills(lang)
  if (!employee) return null

  const assigned = getEmployeeExpectedSkillIds(state, employee)
  const isOverridden = employee.softSkillOverrides !== undefined

  function toggleSkill(skillId: string) {
    if (!canEdit) return
    setState((prev) => {
      const emp = prev.employees.find((e) => e.id === employeeId)
      if (!emp) return prev
      const current = getEmployeeExpectedSkillIds(prev, emp)
      const next = current.includes(skillId) ? current.filter((s) => s !== skillId) : [...current, skillId]
      return { ...prev, employees: prev.employees.map((e) => (e.id === employeeId ? { ...e, softSkillOverrides: next } : e)) }
    })
  }

  function resetToRoleDefault() {
    if (!canEdit) return
    setState((prev) => ({ ...prev, employees: prev.employees.map((e) => (e.id === employeeId ? { ...e, softSkillOverrides: undefined } : e)) }))
  }

  return (
    <Modal
      title={ui.empSoftModalTitle}
      sub={`${employee.nome} ${employee.cognome} · ${employee.ruolo} · ${employee.mansione || '—'}`}
      wide
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', gap: 8 }}>
          {canEdit && isOverridden && (
            <button className="btn" onClick={resetToRoleDefault}>
              {ui.empSoftModalResetBtn}
            </button>
          )}
          <button className="btn btn-primary" onClick={onClose}>
            {ui.settingsClose}
          </button>
        </div>
      }
    >
      {isOverridden && <p className="small-note" style={{ marginBottom: 12 }}>{ui.empSoftModalOverrideNote}</p>}
      {SOFT_CLUSTERS.map((cluster) => (
        <div key={cluster} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 12.5, marginBottom: 8, color: 'var(--text-2)' }}>{cluster}</div>
          <div className="flex flex-wrap gap-2">
            {SOFT_SKILLS.filter((s) => s.cluster === cluster).map((skill) => {
              const on = assigned.includes(skill.id)
              return (
                <button
                  key={skill.id}
                  type="button"
                  disabled={!canEdit}
                  className={`chip ${on ? 'chip-green' : 'chip-gray'}`}
                  style={{ cursor: canEdit ? 'pointer' : 'default' }}
                  onClick={() => toggleSkill(skill.id)}
                >
                  <span className="dt" />
                  {skill.name}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </Modal>
  )
}
