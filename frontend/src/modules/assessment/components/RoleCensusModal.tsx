import { useState } from 'react'

import { CardLabel } from '@/components/ui/card'
import { Note } from '@/components/patterns/Note'
import { useDirty } from '@/hooks/use-dirty'
import { SelectField } from '@/components/patterns/SelectField'
import { Field } from '@/components/patterns/Field'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ModalDialog } from '@/components/patterns/ModalDialog'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { allRolesKnown } from '@/modules/assessment/lib/calculations'
import { getSoftClusters, getSoftSkills } from '@/modules/assessment/lib/legacy-utils'
import { SKILL_WEIGHT_CYCLE, SKILL_WEIGHT_LEVELS, applyRoleSkillToEmployees, ensureRoleProfile, weightLabel } from '@/modules/assessment/lib/role-census'

// Migrated from openRoleCensusModal()/renderRoleCensusBodyHtml()/
// cycleRoleSkillWeight()/setRoleSkillExpected()/confirmCreateRole()
// (js/assessment.js ~4940-5059) — per-role skill weighting (Essenziale/
// Importante/Utile, click-to-cycle) with an expected-value input per
// weighted skill, and inline "create a new role" entry.
export function RoleCensusModal({ onClose }: { onClose: () => void }) {
  const { state, setState, lang, ui, canEdit, toast } = useAssessment()
  const SOFT_CLUSTERS = getSoftClusters(lang)
  const SOFT_SKILLS = getSoftSkills(lang)
  const roles = allRolesKnown(state)
  const [selected, setSelected] = useState<string | null>(roles[0] || null)
  const [creating, setCreating] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const dirty = useDirty({ newRoleName })

  function cycleWeight(role: string, skillId: string) {
    if (!canEdit) return
    setState((prev) => {
      const next = structuredClone(prev)
      const rp = ensureRoleProfile(next, role)
      const cur = rp.skillWeights?.[skillId] || 0
      const idx = SKILL_WEIGHT_CYCLE.indexOf(cur as 0 | 1 | 2 | 3)
      const nx = SKILL_WEIGHT_CYCLE[(idx + 1) % SKILL_WEIGHT_CYCLE.length]
      if (nx === 0) {
        delete rp.skillWeights![skillId]
        delete rp.skillExpected![skillId]
      } else {
        rp.skillWeights![skillId] = nx
        if (rp.skillExpected![skillId] == null) rp.skillExpected![skillId] = 8
      }
      rp.requiredSkills = Object.keys(rp.skillWeights!)
      applyRoleSkillToEmployees(next, role, skillId)
      return next
    })
  }
  function setExpected(role: string, skillId: string, val: string) {
    if (!canEdit) return
    setState((prev) => {
      const next = structuredClone(prev)
      const rp = ensureRoleProfile(next, role)
      if (!rp.skillWeights?.[skillId]) return prev
      const n = Math.max(1, Math.min(10, parseFloat(val) || 8))
      rp.skillExpected![skillId] = n
      applyRoleSkillToEmployees(next, role, skillId)
      return next
    })
  }
  function confirmCreateRole() {
    if (!canEdit) return
    const name = newRoleName.trim()
    if (!name) {
      toast(ui.toastEnterRoleTitle, 'err')
      return
    }
    if (roles.some((r) => r.toLowerCase() === name.toLowerCase())) {
      toast(ui.toastRoleDuplicate, 'err')
      return
    }
    setState((prev) => {
      const next = structuredClone(prev)
      ensureRoleProfile(next, name)
      return next
    })
    setSelected(name)
    setCreating(false)
    setNewRoleName('')
    toast(ui.toastRoleCreated, 'ok')
  }

  const rp = selected ? ensureRoleProfileReadonly(state.roleProfiles[selected]) : null
  const counts = { 3: 0, 2: 0, 1: 0 }
  if (rp?.skillWeights) Object.values(rp.skillWeights).forEach((w) => (counts[w as 1 | 2 | 3] = (counts[w as 1 | 2 | 3] || 0) + 1))

  return (
    <ModalDialog dirty={dirty} title={ui.roleCensusTitle} sub={ui.roleCensusSub} wide onClose={onClose} footer={<Button variant="outline" onClick={onClose}>{ui.settingsClose}</Button>}>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label={ui.anagSelectRole} className="min-w-56 max-w-80 flex-1">
          <SelectField
            disabled={!roles.length && !canEdit}
            value={creating ? '__altro__' : selected || ''}
            onValueChange={(v) => {
              // "Altro ruolo" replaces the separate green "+Crea Ruolo"
              // button — picking it opens the same inline name input this
              // modal already had, just reached from the dropdown itself.
              if (v === '__altro__') {
                setCreating(true)
                return
              }
              setSelected(v)
              setCreating(false)
            }}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
            {canEdit && <option value="__altro__">{ui.altroRuoloOption}</option>}
          </SelectField>
        </Field>
        {canEdit && creating && (
          <>
            <Field label={ui.newRoleTitleLabel} className="min-w-52 max-w-72 flex-1">
              <Input type="text" placeholder={ui.newRoleTitlePh} value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} />
            </Field>
            <Button variant="default" onClick={confirmCreateRole}>
              {ui.newRoleSaveBtn}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCreating(false)
                setNewRoleName('')
              }}
            >
              {ui.importCancel}
            </Button>
          </>
        )}
      </div>

      {!selected ? (
        <Note>{ui.rcNoRoleSelected}</Note>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {[3, 2, 1].map((w) => {
              const lvl = SKILL_WEIGHT_LEVELS[w]
              const n = counts[w as 1 | 2 | 3] || 0
              const ok = n >= lvl.min
              return (
                <Badge tone={ok ? 'success' : 'destructive'} dot key={w}>
                  {ui[lvl.countKey as keyof typeof ui] as string} {n}/{lvl.min}
                </Badge>
              )
            })}
          </div>
          {SOFT_CLUSTERS.map((cluster) => (
            <section className="mb-4" key={cluster}>
              <CardLabel className="mb-2 border-b border-border pb-2">{cluster}</CardLabel>
              {SOFT_SKILLS.filter((s) => s.cluster === cluster).map((s) => {
                const w = rp?.skillWeights?.[s.id] || 0
                const label = weightLabel(w, lang)
                return (
                  <div className="flex items-center gap-3 border-b border-border py-2 last:border-b-0" key={s.id}>
                    <span className="min-w-0 flex-1 text-app-small">{s.name}</span>
                    <button type="button" className="inline-flex min-w-24 justify-center rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default" disabled={!canEdit} onClick={() => cycleWeight(selected, s.id)}>
                      <Badge>{label}</Badge>
                    </button>
                    {w ? (
                      <Input
                        type="number"
                        size="sm"
                        className="w-16 text-center tabular-nums"
                        min={1}
                        max={10}
                        step={0.1}
                        value={rp?.skillExpected?.[s.id] ?? 8}
                        disabled={!canEdit}
                        aria-label={ui.rcExpectedLabel}
                        onChange={(e) => setExpected(selected, s.id, e.target.value)}
                      />
                    ) : (
                      <span className="w-16 shrink-0 text-center text-app-caption text-muted-foreground">—</span>
                    )}
                  </div>
                )
              })}
            </section>
          ))}
        </>
      )}
    </ModalDialog>
  )
}

// Read-only equivalent of ensureRoleProfile() for rendering — the state
// prop here is the live (unmutated) React state, so this only backfills
// defaults on the returned object without writing them back; the real
// ensureRoleProfile() (called inside setState updaters above) is what
// actually persists new defaults into state.roleProfiles.
function ensureRoleProfileReadonly(rp: { requiredSkills: string[]; skillWeights?: Record<string, number>; skillExpected?: Record<string, number> } | undefined) {
  if (!rp) return { requiredSkills: [], skillWeights: {}, skillExpected: {} }
  const skillWeights = rp.skillWeights || Object.fromEntries(rp.requiredSkills.map((id) => [id, 3]))
  const skillExpected = rp.skillExpected || Object.fromEntries(Object.keys(skillWeights).map((id) => [id, 8]))
  return { requiredSkills: rp.requiredSkills, skillWeights, skillExpected }
}
