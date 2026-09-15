// Shapes mirror jdState exactly (modules/recruiting.html ~3812-3897,
// "JOB DESCRIPTION EDITOR (embedded)", ~3700 onward) — this is a
// deliberately SEPARATE domain from lib/types.ts's JobProfile/JobOpening.
// Phase 17's audit confirmed these two are unconnected in legacy: jdState
// is never written into any opening.jobProfile anywhere in the source
// (verified by grepping every `.jobProfile =` assignment). Modeling jdState
// as its own type family here — not extending JobProfile — reflects that
// real disconnect rather than implying a relationship legacy doesn't have.

export type JdItemCheck = { id: string; label: string; checked: boolean }
export type JdItemLevel = { id: string; label: string; checked: boolean; level: string }
// Soft skills only — `weight` mirrors legacy's read of the global `flags`
// object (jd_ensureSoftSkillsFull, ~4238-4252); reproduced here as a
// read-only derivation from DEFAULT_FLAGS (see lib/jd.ts), never written
// back to it.
export type JdItemValue = { id: string; label: string; checked: boolean; valoreAtteso: number | null; weight: number }
export type JdItemTool = { id: string; label: string; level: string }

export type JdSectionCheck = { label: string; kind: 'check'; items: JdItemCheck[] }
export type JdSectionValue = { label: string; kind: 'value'; items: JdItemValue[] }
export type JdSectionTool = { label: string; kind: 'tool'; items: JdItemTool[]; levels?: string[] }
export type JdSectionRadio = { label: string; kind: 'radio'; selected: string | null; items: string[] }
export type JdSection = JdSectionCheck | JdSectionValue | JdSectionTool | JdSectionRadio

export type JdHardSkillGroup = { key: string; label: string; items: JdItemLevel[] }
export type JdExtraRow = { id: string; label: string; level: string; note: string }

// Only titolo/codice/area/riportaA/sede/modalita/contratto/mansione are
// ever initialized by jd_buildStateFromProfile()/jd_buildBlankState().
// fasciaRetributiva/benefit are only ever set via the deferred quick-edit
// panel (jd_openQuickEdit) — modeled as optional, left unset here since
// that panel isn't migrated this phase (see job-profile/JobProfilePage.tsx).
export type JdHeader = {
  titolo: string
  codice: string
  area: string
  riportaA: string
  sede: string
  modalita: string
  contratto: string
  mansione: string
  fasciaRetributiva?: string
  benefit?: string
  /** Dead field — legacy's saveJdTemplateForRole()/loadJdTemplateForRole()
   *  (modules/recruiting.html ~5628-5657) mirror `titolo` into this key on
   *  save and fall back to it on load, but nothing anywhere ever reads
   *  `.title` for display (the editor/preview only ever read `.titolo`).
   *  Reproduced for storage-shape fidelity only — see lib/jd.ts
   *  saveJdTemplate()/loadJdTemplate() — per this migration's explicit
   *  instruction not to "correct" this known inconsistency. */
  title?: string
}

export type JdState = {
  header: JdHeader
  scopo: string
  sections: {
    responsabilita: JdSectionCheck
    attivita: JdSectionCheck
    softSkills: JdSectionValue
    competenzeTecniche: JdSectionTool
    titoliStudio: JdSectionCheck
    certificazioni: JdSectionCheck
    esperienza: JdSectionRadio
    settori: JdSectionCheck
    lingue: JdSectionTool
    disponibilita: JdSectionCheck
    personalita: JdSectionCheck
    kpi: JdSectionCheck
    valutazione: JdSectionCheck
  }
  hardSkillGroups: JdHardSkillGroup[]
  extra: JdExtraRow[]
}

export type JdSectionKey = keyof JdState['sections']

// Ported from the Salary & Benefits sub-feature (modules/recruiting.html
// ~4407-4478) — a SEPARATE storage model from JdState/apex5d_jd_templates,
// keyed by role the same way, but saved/cleared independently (saveSalForm/
// clearSalForm, its own apex5d_salary_benefits key). Never merge these two.
export type SalaryLevelRecord = { min: string; max: string; variableChoice: 'si' | 'no' | ''; variablePct: string }
export type SalaryBenefitsRecord = {
  salary: Record<string, SalaryLevelRecord>
  welfare: Record<string, boolean | string>
  savedAt: number
}
