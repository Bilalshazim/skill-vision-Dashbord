import { Check } from 'lucide-react'
import { Note } from '@/components/patterns/Note'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Button } from '@/components/ui/button'
import { ModalDialog } from '@/components/patterns/ModalDialog'
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
    <ModalDialog
      title={ui.empSoftModalTitle}
      sub={`${employee.nome} ${employee.cognome} · ${employee.ruolo} · ${employee.mansione || '—'}`}
      wide
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          {canEdit && isOverridden && (
            <Button variant="outline" onClick={resetToRoleDefault}>
              {ui.empSoftModalResetBtn}
            </Button>
          )}
          <Button variant="default" onClick={onClose}>
            {ui.settingsClose}
          </Button>
        </div>
      }
    >
      {isOverridden && <Note className="mb-3">{ui.empSoftModalOverrideNote}</Note>}
      {SOFT_CLUSTERS.map((cluster) => (
        <div className="mb-4" key={cluster}>
          <div className="font-semibold text-app-small mb-2 text-muted-foreground">{cluster}</div>
          <ToggleGroup
            type="multiple"
            disabled={!canEdit}
            aria-label={cluster}
            className="border-0 bg-transparent p-0"
            value={SOFT_SKILLS.filter((s) => s.cluster === cluster && assigned.includes(s.id)).map((s) => s.id)}
            onValueChange={(next) => {
              // Una voce per volta: quella che cambia è la differenza fra prima e dopo.
              const before = SOFT_SKILLS.filter((s) => s.cluster === cluster && assigned.includes(s.id)).map((s) => s.id)
              const changed = next.find((id) => !before.includes(id)) ?? before.find((id) => !next.includes(id))
              if (changed) toggleSkill(changed)
            }}
          >
            {SOFT_SKILLS.filter((s) => s.cluster === cluster).map((skill) => (
              <ToggleGroupItem key={skill.id} value={skill.id} className="border border-border">
                {assigned.includes(skill.id) && <Check aria-hidden="true" />}
                {skill.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ))}
    </ModalDialog>
  )
}
