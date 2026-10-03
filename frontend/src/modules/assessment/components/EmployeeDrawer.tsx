import { useCallback, useState } from 'react'

import { Initials } from '@/components/ui/avatar'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { InlineAlert } from '@/components/patterns/InlineAlert'

import { Switch } from '@/components/ui/switch'
import { Field } from '@/components/patterns/Field'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { chipTone } from '@/modules/assessment/lib/chip-tone'
import { CardLabel } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { EmployeeEditForm } from '@/modules/assessment/components/EmployeeEditForm'
import { Icon } from '@/modules/assessment/components/Icon'
import { StatTile } from '@/modules/assessment/components/StatTile'
import { ProfileRadar } from '@/components/patterns/ProfileRadar'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { computeBigFive, computeHardSummary, computeSoftSummary, gapInterpretation, getEmployeePeriodSnapshots, getEmployeeSoftHistorySorted, primaryScore, tierFor } from '@/modules/assessment/lib/calculations'
import { buildAssessmentReportPayload, renderAssessmentReportPrintHtml } from '@/modules/assessment/lib/employee-report'
import { archiveReasonLabel, assessmentSourceLabel, contractTypeDisplayLabel, fmt1, fmtCurrency, genderDisplayLabel, getBigFiveDims } from '@/modules/assessment/lib/legacy-utils'
import { printReportHtml } from '@/modules/assessment/lib/print'
import { getEmployeeExpectedSkillIds, getEmployeeSkillWeight, weightLabel } from '@/modules/assessment/lib/role-census'
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
  const [editDirty, setEditDirty] = useState(false)
  // Il pannello si apre nel guscio di Assessment (data-portal-scope), come
  // ModalDialog: così tiene le variabili del modulo.
  const [container, setContainer] = useState<HTMLElement | null | undefined>(undefined)
  const anchor = useCallback((el: HTMLSpanElement | null) => {
    setContainer((el?.closest('[data-portal-scope]') as HTMLElement | null) ?? null)
  }, [])

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
    setEditDirty(false)
    toast(ui.toastProfileUpdated, 'ok')
  }
  const restore = () => {
    if (!canEdit) return
    patchEmployee({ archived: null })
  }
  const saveFeedback = () => {
    if (!canEdit) return
    patchEmployee({ feedbackNeeded: feedbackNeeded ?? emp.feedbackNeeded, developmentPlan: devPlan ?? emp.developmentPlan })
    setFeedbackNeeded(null)
    setDevPlan(null)
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
      <span ref={anchor} hidden />
      <Sheet open={container !== undefined} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          size="md"
          container={container ?? null}
          closeLabel={ui.closeBtn}
          dirty={(editMode && editDirty) || feedbackNeeded !== null || devPlan !== null}
        >
        <SheetHeader>
          <Initials first={emp.nome} last={emp.cognome} size="lg" />
          <div className="min-w-0 flex-1">
            <SheetTitle>
              {emp.nome} {emp.cognome}
            </SheetTitle>
            <SheetDescription>
              {emp.ruolo} · {emp.area}
              {emp.reparto ? ` · ${emp.reparto}` : ''}
            </SheetDescription>
          </div>
        </SheetHeader>
        <SheetBody>
          {editMode ? (
            <EmployeeEditForm
              emp={emp}
              onSave={saveEdit}
              onDirtyChange={setEditDirty}
              onCancel={() => {
                setEditMode(false)
                setEditDirty(false)
              }}
            />
          ) : (
            <>
              {emp.archived ? (
                <InlineAlert tone="warning" title={ui.profileArchivedBanner(archiveReasonLabel(emp.archived.reason, lang), emp.archived.date)} className="mb-4">
                  {emp.archived.note && <p>{emp.archived.note}</p>}
                  {canEdit && (
                    <Button variant="outline" size="sm" className="mt-2" onClick={restore}>
                      {ui.anagRestore}
                    </Button>
                  )}
                </InlineAlert>
              ) : (
                canEdit && (
                  <div className="mb-4 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                      <Icon name="edit" />
                      {ui.editProfileBtn}
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadReport}>
                      <Icon name="download" />
                      {ui.reportBtn}
                    </Button>
                  </div>
                )
              )}

              <div className="mb-4 flex flex-wrap gap-2">
                <Badge tone={chipTone(tier.chip)} dot>
                  {tier.label}
                </Badge>
                <Badge>{emp.tipoProfilo || ui.profileEmployeeType}</Badge>
                {emp.feedbackNeeded && (
                  <Badge tone="destructive" dot>
                    {ui.profileDebriefPending}
                  </Badge>
                )}
              </div>

              <div className="mb-3 text-app-small text-muted-foreground [&_b]:font-medium [&_b]:text-foreground">
                <b>{ui.profileEmailLabel}</b> {emp.email || '—'} {' · '} <b>{ui.profileDeptLabel}</b> {emp.reparto || '—'} {' · '} <b>{ui.profileDutiesLabel}</b> {emp.mansione || '—'}
              </div>
              <div className="mb-4 text-app-small text-muted-foreground [&_b]:font-medium [&_b]:text-foreground">
                <b>{ui.genderLabel}</b> {genderDisplayLabel(emp.sesso, lang) || '—'} {' · '} <b>{ui.contractTypeLabel}</b> {contractTypeDisplayLabel(emp.tipoContratto, lang)} {' · '} <b>{ui.ccnlLevelLabel}</b>{' '}
                {emp.livelloCcnl || '—'} {' · '} <b>{ui.ralLabel}</b> {emp.ral ? fmtCurrency(emp.ral) : '—'} {' · '} <b>{ui.benefitLabel}</b> {emp.benefit || '—'}
              </div>
              {emp.assenzeProgrammate?.length > 0 && (
                <div className="mb-4 text-app-small text-muted-foreground [&_b]:font-medium [&_b]:text-foreground">
                  <b>{ui.scheduledAbsencesLabel}</b> {emp.assenzeProgrammate.map((a) => `${a.dal || '—'} → ${a.al || '—'}${a.motivo ? ` (${a.motivo})` : ''}`).join('; ')}
                </div>
              )}

              {weightedIds.length > 0 && (
                <>
                  <CardLabel className="mt-2 mb-2">
                    {ui.profileRoleExpectedTitle}
                  </CardLabel>
                  <div className="mb-2 text-app-small text-muted-foreground">
                    {ui.profileRoleExpectedSub(emp.ruolo)}
                  </div>
                  {computeSoftSummary(emp, lang)
                    .perSkill.filter((s) => weightedIds.includes(s.id))
                    .map((s) => {
                      const { weight: w, expected } = getEmployeeSkillWeight(state, emp, s.id)
                      return (
                        <div className="flex items-center gap-3 border-b border-border py-2 last:border-b-0" key={s.id}>
                          <span className="flex-1 text-app-small">{s.name}</span>
                          <Badge>
                            {weightLabel(w, lang)}
                          </Badge>
                          <span className="min-w-24 shrink-0 text-right text-app-small text-muted-foreground [&_b]:font-medium [&_b]:text-foreground">
                            {ui.rcExpectedLabel}: <b>{fmt1(expected)}</b>
                          </span>
                        </div>
                      )
                    })}
                  <Separator className="my-4" />
                </>
              )}

              {f.A && <ModuleADetail emp={emp} />}
              {f.B && <ModuleBDetail emp={emp} />}

              <CardLabel className="mb-2">
                {ui.profileFeedbackDevPlanTitle}
              </CardLabel>
              <label className="mb-3 flex items-center gap-3 text-app-small font-medium">
                <Switch checked={feedbackNeeded ?? emp.feedbackNeeded} onCheckedChange={(c) => setFeedbackNeeded(c)} />
                {ui.feedbackSwitchLabel}
              </label>
              {(['azioni', 'formazione', 'coaching', 'obiettivi'] as const).map((k) => (
                <Field label={ui[`devPlan${k[0].toUpperCase()}${k.slice(1)}Label` as keyof typeof ui] as string} key={k}>
                  <Textarea
                    rows={2}
                    value={(devPlan ?? emp.developmentPlan)[k]}
                    onChange={(e) => setDevPlan((prev) => ({ ...(prev ?? emp.developmentPlan), [k]: e.target.value }))}
                  />
                </Field>
              ))}
              {canEdit && (
                <Button variant="default" size="sm" onClick={saveFeedback}>
                  {ui.profileSaveFeedbackBtn}
                </Button>
              )}
            </>
          )}
        </SheetBody>
        </SheetContent>
      </Sheet>
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
      <CardLabel className="mt-2 mb-2">
        {ui.profileModuleATitle}
      </CardLabel>
      <div className="mb-2 text-app-small text-muted-foreground [&_b]:font-medium [&_b]:text-foreground">
        <b>{ui.profileLastAssessmentLabel}:</b> {lastSoftSnap ? lastSoftSnap.date.slice(0, 10) : ui.profileNoAssessmentYet}
      </div>
      <div className="mb-3 flex items-baseline gap-2">
        <div className="text-app-title">{fmt1(ss.overallOttenuto)}</div>
        <div className="text-app-small text-muted-foreground">{ui.profileObtainedExpected(fmt1(ss.overallAtteso))}</div>
      </div>
      {/* R1 — il profilo Big Five contro il benchmark 6,5 (DECISIONI). */}
      <ProfileRadar
        size="sm"
        title={ui.profileModuleATitle}
        axes={BF_ORDER.map((d) => ({ key: d, label: BIGFIVE_DIMS[d].label }))}
        series={[
          { label: ui.homeOrgTrendModeBenchmark, values: Object.fromEntries(BF_ORDER.map((d) => [d, 6.5])), reference: true },
          { label: `${emp.nome} ${emp.cognome}`, values: bf },
        ]}
      />
      <CardLabel className="mt-4 mb-2">
        {ui.profileTop3Strengths}
      </CardLabel>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {strengths.map((s) => (
          <StatTile key={s.id} label={s.name} value={s.ottenuto} benchmark={s.atteso} />
        ))}
      </div>
      <CardLabel className="mt-4 mb-2">
        {ui.profileDevAreas}
      </CardLabel>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {devAreas.map((s) => (
          <StatTile key={s.id} label={s.name} value={s.ottenuto} benchmark={s.atteso} />
        ))}
      </div>
      <Separator className="my-4" />
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
      <CardLabel>{ui.profileModuleBTitle}</CardLabel>
      <div className="mb-2 text-app-small text-muted-foreground [&_b]:font-medium [&_b]:text-foreground">
        <b>{ui.profileLastAssessmentLabel}:</b> {lastAssessSnap ? lastAssessSnap.date.slice(0, 10) : ui.profileNoAssessmentYet}
        {lastAssessSnap?.periodLabel ? ` · ${lastAssessSnap.periodLabel}` : ''}
        {lastAssessSnap ? ` · ${assessmentSourceLabel(lastAssessSnap.source, lang)}` : ''}
      </div>
      <div className="mb-3 flex items-baseline gap-2">
        <div className="text-app-title">{fmt1(lastAssessSnap ? lastAssessSnap.apexScore : hsm.apexScore)}</div>
        <div className="text-app-small text-muted-foreground">{ui.profileOverallApexScoreLine}</div>
      </div>
      {/* R2 — le cinque dimensioni APEX 5D contro il benchmark 6,5 (DECISIONI). */}
      <ProfileRadar
        size="sm"
        title={ui.profileModuleBTitle}
        axes={hsm.dims.map((d) => ({ key: d.code, label: `${d.code} · ${d.name}` }))}
        series={[
          { label: ui.homeOrgTrendModeBenchmark, values: Object.fromEntries(hsm.dims.map((d) => [d.code, 6.5])), reference: true },
          { label: `${emp.nome} ${emp.cognome}`, values: Object.fromEntries(hsm.dims.map((d) => [d.code, d.mediaTotale])) },
        ]}
      />
      <ul className="mt-3 flex flex-col gap-2">
        {hsm.dims.map((d) => {
          const gi = gapInterpretation(d.gapRespAuto, lang)
          return (
            <li key={d.code} className="flex flex-wrap items-center gap-2 text-app-small">
              <span className="font-medium">{d.code}</span>
              <span className="text-muted-foreground tabular-nums">
                {ui.tagMgr} {fmt1(d.perSource.resp)} · {ui.tagPeer} {fmt1(d.perSource.peer)} · {ui.tagSelf} {fmt1(d.perSource.auto)}
              </span>
              <Badge tone={chipTone(gi.tag)}>{gi.label}</Badge>
            </li>
          )
        })}
      </ul>
      <Separator className="my-4" />
    </>
  )
}
