import { ModeSwitch } from '@/modules/assessment/components/ModeSwitch'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'

// Il selettore CT / CP / Completo collegato allo stato del modulo: vale per
// tutto Assessment (CLAUDE.md, Fase 6, 2026-11-03). La scelta sta nelle
// impostazioni della società, sopra le rotte: resta mentre si naviga. Prima
// che lo stato arrivi dal server non si vede: si cambierebbe un valore finto.
export function AssessmentModeSwitch() {
  const { state, setState, ui, status, company } = useAssessment()
  if (status !== 'ready') return null
  return (
    <ModeSwitch
      value={state.settings.modulo}
      purchased={company?.assessmentPackage ?? 'AB'}
      onChange={(modulo) => setState((prev) => ({ ...prev, settings: { ...prev.settings, modulo } }))}
      ui={ui}
    />
  )
}
