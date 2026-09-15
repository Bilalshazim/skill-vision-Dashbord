import { useState } from 'react'

import { Modal } from '@/modules/assessment/components/Modal'
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
    <Modal title={ui.roleCensusTitle} sub={ui.roleCensusSub} wide onClose={onClose} footer={<button className="btn" onClick={onClose}>{ui.settingsClose}</button>}>
      <div className="rc-role-bar">
        <div className="field" style={{ flex: 1, minWidth: 220, maxWidth: 320 }}>
          <label>{ui.anagSelectRole}</label>
          <select
            disabled={!roles.length}
            value={selected || ''}
            onChange={(e) => {
              setSelected(e.target.value)
              setCreating(false)
            }}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        {canEdit &&
          (creating ? (
            <>
              <div className="field" style={{ flex: 1, minWidth: 200, maxWidth: 280 }}>
                <label>{ui.newRoleTitleLabel}</label>
                <input className="neu-input" type="text" placeholder={ui.newRoleTitlePh} value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={confirmCreateRole}>
                {ui.newRoleSaveBtn}
              </button>
              <button className="btn" onClick={() => setCreating(false)}>
                {ui.importCancel}
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              {ui.createRoleBtn}
            </button>
          ))}
      </div>

      {!selected ? (
        <div className="small-note">{ui.rcNoRoleSelected}</div>
      ) : (
        <>
          <div className="rc-counts">
            {[3, 2, 1].map((w) => {
              const lvl = SKILL_WEIGHT_LEVELS[w]
              const n = counts[w as 1 | 2 | 3] || 0
              const ok = n >= lvl.min
              return (
                <span className={`chip rc-count-item ${ok ? 'chip-green' : 'chip-red'}`} key={w}>
                  <span className="dt" />
                  {ui[lvl.countKey as keyof typeof ui] as string} {n}/{lvl.min}
                </span>
              )
            })}
          </div>
          {SOFT_CLUSTERS.map((cluster) => (
            <div className="cluster-block" key={cluster}>
              <div className="cluster-title">{cluster}</div>
              {SOFT_SKILLS.filter((s) => s.cluster === cluster).map((s) => {
                const w = rp?.skillWeights?.[s.id] || 0
                const chipClass = w ? SKILL_WEIGHT_LEVELS[w].chip : 'chip-gray'
                const label = weightLabel(w, lang)
                return (
                  <div className="rc-skill-row" key={s.id}>
                    <span className="rc-skill-name">{s.name}</span>
                    <span className={`chip ${chipClass} rc-weight-badge`} onClick={() => canEdit && cycleWeight(selected, s.id)}>
                      <span className="dt" />
                      {label}
                    </span>
                    {w ? (
                      <input
                        type="number"
                        className="neu-input rc-atteso-input"
                        min={1}
                        max={10}
                        step={0.1}
                        value={rp?.skillExpected?.[s.id] ?? 8}
                        disabled={!canEdit}
                        title={ui.rcExpectedLabel}
                        onChange={(e) => setExpected(selected, s.id, e.target.value)}
                      />
                    ) : (
                      <span className="rc-atteso-placeholder">—</span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </>
      )}
    </Modal>
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
