import { useState } from 'react'

import { EmployeeEditForm } from '@/modules/assessment/components/EmployeeEditForm'
import { Icon } from '@/modules/assessment/components/Icon'
import { StatTile } from '@/modules/assessment/components/StatTile'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { computeBigFive, computeHardSummary, computeSoftSummary, gapInterpretation, getEmployeePeriodSnapshots, getEmployeeSoftHistorySorted, primaryScore, tierFor } from '@/modules/assessment/lib/calculations'
import { buildAssessmentReportPayload, renderAssessmentReportPrintHtml } from '@/modules/assessment/lib/employee-report'
import { archiveReasonLabel, assessmentSourceLabel, contractTypeDisplayLabel, fmt1, fmtCurrency, genderDisplayLabel, getBigFiveDims } from '@/modules/assessment/lib/legacy-utils'
import { printReportHtml } from '@/modules/assessment/lib/print'
import { getEmployeeExpectedSkillIds, getEmployeeSkillWeight, SKILL_WEIGHT_LEVELS, weightLabel } from '@/modules/assessment/lib/role-census'
import type { Employee } from '@/modules/assessment/lib/types'

const BF_ORDER = ['O', 'C', 'E', 'A', 'S'] as const

// Migrated from openDrawer()/buildEmployeeProfileHtml()/toggleDrawerEdit()/
// saveEmployeeProfileEdit()/saveEmployeeFeedback()/downloadEmployeeReport()
// (js/assessment.js ~3343-3364, 5506-5686, 7281-7290) — the employee-detail
// side drawer: archive banner/edit/archive actions, tier/type/debrief chips,
// identity/contract lines, role-expected-skill profile (when the employee's
// role has a Role Census weighting), Module A (Big Five + top3/dev-areas)
// and Module B (APEX dims + gap tags) detail sections, a quick feedback +
// dev-plan editor, and "Scarica report" print. PHASE 25 SCOPE NOTE: the
// "Confronta periodi precedenti" longitudinal comparison modals
// (openPreviousAssessmentsModal/openPreviousSoftAssessmentsModal) are NOT
// included — hardHistory/softHistory are correctly recorded and drive
// everything else here, just not yet exposed in a dedicated compare UI.
export function EmployeeDrawer({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const { state, setState, lang, ui, canEdit, toast } = useAssessment()
  const [editMode, setEditMode] = useState(false)
  const [feedbackNeeded, setFeedbackNeeded] = useState<boolean | null>(null)
  const [devPlan, setDevPlan] = useState<Employee['developmentPlan'] | null>(null)

  const emp = state.employees.find((e) => e.id === employeeId)
  if (!emp) return null

  const f = { A: state.settings.modulo === 'A' || state.settings.modulo === 'AB', B: state.settings.modulo === 'B' || state.settings.modulo === 'AB' }
  const score = primaryScore(emp, state, lang)
  const tier = tierFor(score, lang)

  const patchEmployee = (patch: Partial<Employee>) => {
    setState((prev) => ({ ...prev, employees: prev.employees.map((e) => (e.id === emp.id ? { ...e, ...patch } : e)) }))
  }
  const saveEdit = (patch: Partial<Employee>) => {
    if (!canEdit) return
    patchEmployee(patch)
    setEditMode(false)
    toast(ui.toastProfileUpdated, 'ok')
  }
  const restore = () => {
    if (!canEdit) return
    patchEmployee({ archived: null })
  }
  const saveFeedback = () => {
    if (!canEdit) return
    patchEmployee({ feedbackNeeded: feedbackNeeded ?? emp.feedbackNeeded, developmentPlan: devPlan ?? emp.developmentPlan })
    toast(ui.toastFeedbackUpdated, 'ok')
  }
  const downloadReport = () => {
    const payload = buildAssessmentReportPayload(state, emp, lang)
    if (!payload.hardLastAssessmentDate && !payload.softLastAssessmentDate) {
      toast(ui.toastNoReportData, 'err')
      return
    }
    printReportHtml(renderAssessmentReportPrintHtml(payload, ui as unknown as Record<string, string | ((...a: unknown[]) => string)>, lang))
    toast(ui.toastReportOpening, 'ok')
  }

  const weightedIds = getEmployeeExpectedSkillIds(state, emp)

  return (
    <>
      <div className="drawer-overlay open" onClick={onClose} />
      <div className="drawer open">
        <div className="drawer-head">
          <div className="avatar" style={{ width: 42, height: 42, fontSize: 14 }}>
            {(emp.nome[0] || '') + (emp.cognome[0] || '')}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>
              {emp.nome} {emp.cognome}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {emp.ruolo} · {emp.area}
              {emp.reparto ? ` · ${emp.reparto}` : ''}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="drawer-body">
          {editMode ? (
            <EmployeeEditForm emp={emp} onSave={saveEdit} onCancel={() => setEditMode(false)} />
          ) : (
            <>
              {emp.archived ? (
                <div className="tinted-tile warning" style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 12.8, color: 'var(--warning)' }}>
                    {ui.profileArchivedBanner(archiveReasonLabel(emp.archived.reason, lang), emp.archived.date)}
                  </div>
                  {emp.archived.note && (
                    <div className="small-note" style={{ marginTop: 4 }}>
                      {emp.archived.note}
                    </div>
                  )}
                  {canEdit && (
                    <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={restore}>
                      {ui.anagRestore}
                    </button>
                  )}
                </div>
              ) : (
                canEdit && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <button className="btn btn-sm" onClick={() => setEditMode(true)}>
                      <Icon name="edit" />
                      {ui.editProfileBtn}
                    </button>
                    <button className="btn btn-sm btn-danger-outline" onClick={downloadReport}>
                      <Icon name="download" />
                      {ui.reportBtn}
                    </button>
                  </div>
                )
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <span className={`chip ${tier.chip}`}>
                  <span className="dt" />
                  {tier.label}
                </span>
                <span className="chip chip-gray">{emp.tipoProfilo || ui.profileEmployeeType}</span>
                {emp.feedbackNeeded && (
                  <span className="chip chip-red">
                    <span className="dt" />
                    {ui.profileDebriefPending}
                  </span>
                )}
              </div>

              <div className="small-note" style={{ marginBottom: 10 }}>
                <b>{ui.profileEmailLabel}</b> {emp.email || '—'} {' · '} <b>{ui.profileDeptLabel}</b> {emp.reparto || '—'} {' · '} <b>{ui.profileDutiesLabel}</b> {emp.mansione || '—'}
              </div>
              <div className="small-note" style={{ marginBottom: 16 }}>
                <b>{ui.genderLabel}</b> {genderDisplayLabel(emp.sesso, lang) || '—'} {' · '} <b>{ui.contractTypeLabel}</b> {contractTypeDisplayLabel(emp.tipoContratto, lang)} {' · '} <b>{ui.ccnlLevelLabel}</b>{' '}
                {emp.livelloCcnl || '—'} {' · '} <b>{ui.ralLabel}</b> {emp.ral ? fmtCurrency(emp.ral) : '—'} {' · '} <b>{ui.benefitLabel}</b> {emp.benefit || '—'}
              </div>
              {emp.assenzeProgrammate?.length > 0 && (
                <div className="small-note" style={{ marginBottom: 16 }}>
                  <b>{ui.scheduledAbsencesLabel}</b> {emp.assenzeProgrammate.map((a) => `${a.dal || '—'} → ${a.al || '—'}${a.motivo ? ` (${a.motivo})` : ''}`).join('; ')}
                </div>
              )}

              {weightedIds.length > 0 && (
                <>
                  <div className="card-eyebrow" style={{ marginTop: 6 }}>
                    {ui.profileRoleExpectedTitle}
                  </div>
                  <div className="small-note" style={{ marginBottom: 8 }}>
                    {ui.profileRoleExpectedSub(emp.ruolo)}
                  </div>
                  {computeSoftSummary(emp, lang)
                    .perSkill.filter((s) => weightedIds.includes(s.id))
                    .map((s) => {
                      const { weight: w, expected } = getEmployeeSkillWeight(state, emp, s.id)
                      const lvl = SKILL_WEIGHT_LEVELS[w]
                      return (
                        <div className="rc-skill-row" key={s.id}>
                          <span className="rc-skill-name">{s.name}</span>
                          <span className={`chip ${lvl ? lvl.chip : 'chip-gray'}`}>
                            <span className="dt" />
                            {weightLabel(w, lang)}
                          </span>
                          <span className="small-note" style={{ minWidth: 104, textAlign: 'right', flexShrink: 0 }}>
                            {ui.rcExpectedLabel}: <b>{fmt1(expected)}</b>
                          </span>
                        </div>
                      )
                    })}
                  <div className="divider" />
                </>
              )}

              {f.A && <ModuleADetail emp={emp} />}
              {f.B && <ModuleBDetail emp={emp} />}

              <div className="card-eyebrow" style={{ marginBottom: 8 }}>
                {ui.profileFeedbackDevPlanTitle}
              </div>
              <div className="switch-row" style={{ marginBottom: 12 }}>
                <label className="switch">
                  <input type="checkbox" checked={feedbackNeeded ?? emp.feedbackNeeded} onChange={(e) => setFeedbackNeeded(e.target.checked)} />
                  <span className="slider" />
                </label>
                <div className="lbl">
                  <div className="l1">{ui.feedbackSwitchLabel}</div>
                </div>
              </div>
              {(['azioni', 'formazione', 'coaching', 'obiettivi'] as const).map((k) => (
                <div className="field" key={k} style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11 }}>{ui[`devPlan${k[0].toUpperCase()}${k.slice(1)}Label` as keyof typeof ui] as string}</label>
                  <textarea
                    className="neu-input"
                    style={{ width: '100%', minHeight: 50, lineHeight: 1.5, resize: 'vertical' }}
                    value={(devPlan ?? emp.developmentPlan)[k]}
                    onChange={(e) => setDevPlan((prev) => ({ ...(prev ?? emp.developmentPlan), [k]: e.target.value }))}
                  />
                </div>
              ))}
              {canEdit && (
                <button className="btn btn-primary btn-sm" onClick={saveFeedback}>
                  {ui.profileSaveFeedbackBtn}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

function ModuleADetail({ emp }: { emp: Employee }) {
  const { lang, ui } = useAssessment()
  const BIGFIVE_DIMS = getBigFiveDims(lang)
  const ss = computeSoftSummary(emp, lang)
  const bf = computeBigFive(emp, lang)
  const softHist = getEmployeeSoftHistorySorted(emp)
  const lastSoftSnap = softHist.length ? softHist[softHist.length - 1] : null
  const strengths = [...ss.perSkill].sort((a, b) => b.gap - a.gap).slice(0, 3)
  const devAreas = [...ss.perSkill].sort((a, b) => a.gap - b.gap).slice(0, 3)
  return (
    <>
      <div className="card-eyebrow" style={{ marginTop: 6 }}>
        {ui.profileModuleATitle}
      </div>
      <div className="small-note" style={{ marginBottom: 6 }}>
        <b>{ui.profileLastAssessmentLabel}:</b> {lastSoftSnap ? lastSoftSnap.date.slice(0, 10) : ui.profileNoAssessmentYet}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt1(ss.overallOttenuto)}</div>
        <div className="small-note">{ui.profileObtainedExpected(fmt1(ss.overallAtteso))}</div>
      </div>
      <div className="grid grid-2" style={{ gap: 8 }}>
        {BF_ORDER.map((d) => (
          <StatTile key={d} label={BIGFIVE_DIMS[d].label} value={bf[d]} benchmark={6.5} />
        ))}
      </div>
      <div className="card-eyebrow" style={{ marginTop: 14 }}>
        {ui.profileTop3Strengths}
      </div>
      <div className="grid grid-2" style={{ gap: 8 }}>
        {strengths.map((s) => (
          <StatTile key={s.id} label={s.name} value={s.ottenuto} benchmark={s.atteso} />
        ))}
      </div>
      <div className="card-eyebrow" style={{ marginTop: 14 }}>
        {ui.profileDevAreas}
      </div>
      <div className="grid grid-2" style={{ gap: 8 }}>
        {devAreas.map((s) => (
          <StatTile key={s.id} label={s.name} value={s.ottenuto} benchmark={s.atteso} />
        ))}
      </div>
      <div className="divider" />
    </>
  )
}

function ModuleBDetail({ emp }: { emp: Employee }) {
  const { lang, ui } = useAssessment()
  const hsm = computeHardSummary(emp, lang)
  const assessSnapshots = getEmployeePeriodSnapshots(emp)
  const lastAssessSnap = assessSnapshots.length ? assessSnapshots[assessSnapshots.length - 1] : null
  return (
    <>
      <div className="card-eyebrow">{ui.profileModuleBTitle}</div>
      <div className="small-note" style={{ marginBottom: 6 }}>
        <b>{ui.profileLastAssessmentLabel}:</b> {lastAssessSnap ? lastAssessSnap.date.slice(0, 10) : ui.profileNoAssessmentYet}
        {lastAssessSnap?.periodLabel ? ` · ${lastAssessSnap.periodLabel}` : ''}
        {lastAssessSnap ? ` · ${assessmentSourceLabel(lastAssessSnap.source, lang)}` : ''}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt1(lastAssessSnap ? lastAssessSnap.apexScore : hsm.apexScore)}</div>
        <div className="small-note">{ui.profileOverallApexScoreLine}</div>
      </div>
      <div className="grid grid-2" style={{ gap: 8 }}>
        {hsm.dims.map((d) => {
          const gi = gapInterpretation(d.gapRespAuto, lang)
          return (
            <StatTile key={d.code} label={`${d.code} · ${d.name}`} value={d.mediaTotale} benchmark={6.5}>
              <div style={{ marginTop: 8 }}>
                <span className={`gap-tag ${gi.tag}`}>
                  {ui.tagMgr} {fmt1(d.perSource.resp)} · {ui.tagPeer} {fmt1(d.perSource.peer)} · {ui.tagSelf} {fmt1(d.perSource.auto)} — {gi.label}
                </span>
              </div>
            </StatTile>
          )
        })}
      </div>
      <div className="divider" />
    </>
  )
}
