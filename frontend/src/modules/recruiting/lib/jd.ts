import { DEFAULT_FLAGS, SKILLS } from '@/modules/recruiting/lib/constants'
import { JD_GEN_DISPONIBILITA, JD_GEN_LINGUE, JD_GEN_SETTORI, JD_GEN_TITOLI, JD_GEN_VALUTAZIONE, JD_LANG_LEVELS, JD_PROFILES } from '@/modules/recruiting/lib/jd-presets'
import type { JdPresetId } from '@/modules/recruiting/lib/jd-presets'
import type { JdExtraRow, JdHardSkillGroup, JdItemCheck, JdItemLevel, JdItemTool, JdItemValue, JdState, SalaryBenefitsRecord, SalaryLevelRecord } from '@/modules/recruiting/lib/jd-types'
import { readJdTemplates, readJobPostingSummaries, readSalaryBenefits, writeJdTemplates, writeJobPostingSummaries, writeSalaryBenefits } from '@/modules/recruiting/lib/storage'

// Migrated from modules/recruiting.html's "JOB DESCRIPTION EDITOR (embedded)"
// (~3700-5745, "jd_*" functions) — the domain logic behind /recruiting/job-profile.
//
// SCOPE (Phase 18, per the Phase 17 audit's boundary):
//  - Full editor state, all 17 sections, hard skills, soft skills (read-only
//    off DEFAULT_FLAGS), extra rows, live preview, Save/Load per role,
//    Salary & Benefits — all migrated.
//  - Role search/switching, "Crea scheda vuota" (mutates the global
//    ROLES/currentRole/flags this migration has never touched), and
//    CSV/XLSX import (verified broken in current source — see below) all
//    remain deferred/bridged. None of their code is ported here.

let jdUid = 1
function jdNid(): string {
  return `i${jdUid++}`
}

function mkCheck(labels: string[], checked = false): JdItemCheck[] {
  return labels.map((l) => ({ id: jdNid(), label: l, checked }))
}
function mkLevel(labels: string[], checked = false, level = 'Intermedio'): JdItemLevel[] {
  return labels.map((l) => ({ id: jdNid(), label: l, checked, level }))
}
function mkTool(labels: string[], level = 'Non richiesto'): JdItemTool[] {
  return labels.map((l) => ({ id: jdNid(), label: l, level }))
}

// Ported from jd_ensureSoftSkillsFull() (modules/recruiting.html
// ~4238-4252) — reads DEFAULT_FLAGS (this migration's fixed, app-wide role
// configuration since Phase 4) in place of legacy's global, mutable `flags`
// object. Read-only: never writes back into DEFAULT_FLAGS or any scoring
// function. `existing` lets an already-typed valoreAtteso survive being
// re-derived — kept for fidelity with the source function's own signature,
// even though nothing in this migration ever calls this on an
// already-built state today (DEFAULT_FLAGS never changes at runtime, so
// legacy's live jd_syncFromApex() "re-sync on flag change" trigger has no
// React equivalent that could ever fire).
export function buildSoftSkillItems(existing: JdItemValue[] = []): JdItemValue[] {
  const existingByLabel = new Map(existing.map((it) => [it.label, it]))
  return SKILLS.map((label) => {
    const prev = existingByLabel.get(label)
    const weight = DEFAULT_FLAGS[label] || 0
    return {
      id: prev?.id || jdNid(),
      label,
      valoreAtteso: prev?.valoreAtteso ?? null,
      checked: weight > 0 ? true : !!prev?.checked,
      weight,
    }
  })
}

// Ported verbatim from jd_buildStateFromProfile() (modules/recruiting.html
// ~3815-3841). `mansione` defaults to '' — legacy seeds it from the global
// `currentJob`, which has no React equivalent (tied to the unmigrated
// "Report"/profilo screen) and starts empty on a fresh session anyway.
// Confirmed from source: the preset's OWN `softSkills` array
// (JD_PROFILES[x].softSkills, the [label,stars] pairs) is NEVER actually
// read here — legacy always overwrites sections.softSkills.items via
// jd_ensureSoftSkillsFull() immediately after, driven entirely by
// flags/DEFAULT_FLAGS. Reproduced exactly — not "fixed" into using the
// preset's dead softSkills field.
export function buildJdStateFromPreset(presetId: JdPresetId): JdState {
  const p = JD_PROFILES[presetId]
  const state: JdState = {
    header: { titolo: p.header.titolo, codice: p.header.codice, area: p.header.area, riportaA: p.header.riportaA, sede: p.header.sede, modalita: p.header.modalita, contratto: p.header.contratto, mansione: '' },
    scopo: p.scopo,
    sections: {
      responsabilita: { label: 'Responsabilità', kind: 'check', items: mkCheck(p.responsabilita) },
      attivita: { label: 'Attività principali', kind: 'check', items: mkCheck(p.attivita) },
      softSkills: { label: 'Soft skills', kind: 'value', items: [] },
      competenzeTecniche: { label: 'Competenze tecniche (tool)', kind: 'tool', items: mkTool(p.tools) },
      titoliStudio: { label: 'Titoli di studio accettati', kind: 'check', items: mkCheck(JD_GEN_TITOLI) },
      certificazioni: { label: 'Certificazioni preferenziali', kind: 'check', items: mkCheck(p.certificazioni) },
      esperienza: { label: 'Esperienza minima', kind: 'radio', selected: null, items: ['Junior', '1-3 anni', '3-5 anni', '5-10 anni', 'oltre 10 anni'] },
      settori: { label: 'Settori di provenienza graditi', kind: 'check', items: mkCheck(JD_GEN_SETTORI) },
      lingue: { label: 'Lingue', kind: 'tool', items: mkTool(JD_GEN_LINGUE, 'Non richiesto'), levels: [...JD_LANG_LEVELS] },
      disponibilita: { label: 'Disponibilità richiesta', kind: 'check', items: mkCheck(JD_GEN_DISPONIBILITA) },
      personalita: { label: 'Personalità ricercata', kind: 'check', items: mkCheck(p.personalita, true) },
      kpi: { label: 'Indicatori di performance (KPI)', kind: 'check', items: mkCheck(p.kpi, true) },
      valutazione: { label: 'Cosa valuterà SKILL-VISION', kind: 'check', items: mkCheck(JD_GEN_VALUTAZIONE, true) },
    },
    hardSkillGroups: p.hardGroups.map((g): JdHardSkillGroup => ({ key: jdNid(), label: g.label, items: mkLevel(g.items) })),
    extra: Array.from({ length: 4 }, (): JdExtraRow => ({ id: jdNid(), label: '', level: 'Base', note: '' })),
  }
  state.sections.softSkills.items = buildSoftSkillItems()
  return state
}

// Ported verbatim from generateJobPostingFromJd() (modules/recruiting.html
// ~5673-5690) — a plain string template, not AI-generated, not a network
// call. Used only by saveJdTemplate() below, to reproduce
// saveJdTemplateForRole()'s own real cross-write into
// apex5d_job_postings_summaries. Nothing in this migration reads that key
// yet (the "Report"/profilo screen that displays it isn't migrated), but
// the write itself is verified, real legacy behavior, not invented here.
export function generateJobPostingSummary(jd: JdState): string {
  const h = jd.header
  const title = h.titolo || ''
  const loc = h.sede || ''
  const contratto = h.contratto || ''
  const modalita = h.modalita || ''
  const fascia = h.fasciaRetributiva || ''
  const benefit = h.benefit || ''
  const resp = jd.sections.responsabilita.items.map((i) => i.label).filter(Boolean)
  const hard = jd.hardSkillGroups.flatMap((g) => g.items).filter((i) => i.checked).map((i) => i.label)
  const bullets: string[] = []
  if (resp.length) bullets.push(`Responsabilità: ${resp.slice(0, 4).join('; ')}`)
  if (hard.length) bullets.push(`Competenze chiave: ${hard.slice(0, 6).join(', ')}`)
  if (benefit) bullets.push(`Benefit: ${benefit}`)
  return `${title}${loc ? ' — ' + loc : ''}${contratto ? ' · ' + contratto : ''}${modalita ? ' · ' + modalita : ''}${fascia ? ' · ' + fascia : ''}\n${bullets.join('\n')}`
}

// PHASE 18 WRITE CONTRACT — ported verbatim from saveJdTemplateForRole()
// (modules/recruiting.html ~5628-5644), the function behind the floating
// "💾 Salva JD" button.
//
//  - Storage key: apex5d_jd_templates (primary) + apex5d_job_postings_summaries
//    (the real, verified cross-write above) — never apex5d_cv_matching_state
//    or skillvision_candidates_data.
//  - Write shape: the WHOLE per-role template map, re-serialized (fresh
//    read -> set one role's key -> persist the whole map), same discipline
//    as every other Recruiting mutation.
//  - The dead `.title` mirror field (`toSave.header.title = toSave.header.titolo
//    || toSave.header.title || role`) is reproduced for storage-shape
//    fidelity — nothing ever reads it back for display, per Phase 17's
//    finding; not "corrected" here.
//
// Concurrency: fresh readJdTemplates()/readJobPostingSummaries() on every
// call — never trusts a map captured at an earlier render.
export function saveJdTemplate(role: string, jdState: JdState): void {
  const templates = readJdTemplates()
  const toSave: JdState = JSON.parse(JSON.stringify(jdState))
  toSave.header.title = toSave.header.titolo || toSave.header.title || role
  templates[role] = toSave
  writeJdTemplates(templates)

  const summaries = readJobPostingSummaries()
  summaries[role] = generateJobPostingSummary(jdState)
  writeJobPostingSummaries(summaries)
}

// Ported verbatim from loadJdTemplateForRole() (modules/recruiting.html
// ~5645-5657) for the case a template exists — returns null when it
// doesn't (legacy's own `else` branch only patches the header title on
// whatever jdState already happens to be showing; the caller here decides
// what "no saved template" means instead, since React has no equivalent
// "whatever was already on screen" state to fall back to).
export function loadJdTemplate(role: string): JdState | null {
  const templates = readJdTemplates()
  const tmpl = templates[role]
  if (!tmpl) return null
  const cloned: JdState = JSON.parse(JSON.stringify(tmpl))
  if (cloned.header) cloned.header.titolo = cloned.header.titolo || cloned.header.title || role
  return cloned
}

export function loadSalaryBenefits(role: string): SalaryBenefitsRecord | null {
  return readSalaryBenefits()[role] || null
}

export type SalaryBenefitsInput = { salary: Record<string, SalaryLevelRecord>; welfare: Record<string, boolean | string> }

// Ported verbatim from saveSalForm() (modules/recruiting.html ~4458-4466) —
// an empty submission (nothing filled in) DELETES any existing record
// rather than saving a blank one, matching legacy's own `hasContent` guard
// exactly.
export function saveSalaryBenefits(role: string, values: SalaryBenefitsInput): void {
  const all = readSalaryBenefits()
  const hasContent =
    Object.values(values.salary).some((r) => r.min || r.max || r.variableChoice || r.variablePct) ||
    Object.values(values.welfare).some((v) => v === true || (typeof v === 'string' && v))
  if (hasContent) all[role] = { ...values, savedAt: Date.now() }
  else delete all[role]
  writeSalaryBenefits(all)
}

// Ported verbatim from clearSalForm() (modules/recruiting.html ~4467-4473).
export function clearSalaryBenefits(role: string): void {
  const all = readSalaryBenefits()
  delete all[role]
  writeSalaryBenefits(all)
}
