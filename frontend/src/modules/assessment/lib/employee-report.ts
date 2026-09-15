import { computeHardSummary, computeSoftSummary, getEmployeePeriodSnapshots, getEmployeeSoftHistorySorted } from '@/modules/assessment/lib/calculations'
import { assessmentSourceLabel, fmt1, getSoftSkills, type AssessmentLang } from '@/modules/assessment/lib/legacy-utils'
import { weightLabel } from '@/modules/assessment/lib/role-census'
import type { AssessmentState, Employee } from '@/modules/assessment/lib/types'

// Migrated from buildAssessmentReportPayload()/renderAssessmentReportPrintHtml()/
// downloadEmployeeReport() (js/assessment.js ~7206-7290) — the "Scarica
// report" print view triggered from the Employee Drawer, reusing the same
// shared #report-print-container as Analisi's print. Hard-skills headline
// figures prefer the latest hardHistory snapshot over a live recompute,
// exactly like legacy (so a dimension-level-only import is reflected
// correctly without fabricating item-level breakdowns).
export function buildAssessmentReportPayload(state: AssessmentState, emp: Employee, lang: AssessmentLang) {
  const snapshots = getEmployeePeriodSnapshots(emp)
  const lastSnap = snapshots.length ? snapshots[snapshots.length - 1] : null
  const softHistory = getEmployeeSoftHistorySorted(emp)
  const lastSoftSnap = softHistory.length ? softHistory[softHistory.length - 1] : null
  const hsm = computeHardSummary(emp, lang)
  const ss = computeSoftSummary(emp, lang)
  const rp = state.roleProfiles[emp.ruolo]
  const weightedIds = rp?.skillWeights ? Object.keys(rp.skillWeights) : []
  const SOFT_SKILLS = getSoftSkills(lang)
  const expectedProfile = SOFT_SKILLS.filter((s) => weightedIds.includes(s.id)).map((s) => {
    const w = rp!.skillWeights![s.id]
    return { id: s.id, name: s.name, weight: w, weightLabel: weightLabel(w, lang), expected: rp!.skillExpected?.[s.id] }
  })
  const currentHard = lastSnap ? { apexScore: lastSnap.apexScore, dims: lastSnap.dims } : { apexScore: hsm.apexScore, dims: hsm.dims.map((d) => ({ code: d.code, name: d.name, score: d.mediaTotale })) }
  return {
    generatedAt: new Date().toISOString(),
    employee: { id: emp.id, nome: emp.nome, cognome: emp.cognome, email: emp.email, ruolo: emp.ruolo, area: emp.area },
    hardLastAssessmentDate: lastSnap ? lastSnap.date : null,
    hardLastAssessmentPeriod: lastSnap ? lastSnap.periodLabel || lastSnap.periodId : null,
    softLastAssessmentDate: lastSoftSnap ? lastSoftSnap.date : null,
    hardSkills: currentHard,
    softSkills: { overallOttenuto: ss.overallOttenuto, overallAtteso: ss.overallAtteso, expectedProfile },
    hardHistory: snapshots.map((s) => ({ date: s.date, periodLabel: s.periodLabel || s.periodId, apexScore: s.apexScore, source: s.source })),
    softHistory: softHistory.map((s) => ({ date: s.date, overallOttenuto: s.overallOttenuto, overallAtteso: s.overallAtteso })),
  }
}

export function renderAssessmentReportPrintHtml(payload: ReturnType<typeof buildAssessmentReportPayload>, ui: Record<string, string | ((...a: unknown[]) => string)>, lang: AssessmentLang) {
  const e = payload.employee
  const t = (k: string) => ui[k] as string
  const dimsRows = payload.hardSkills.dims.map((d) => `<tr><td>${d.code} · ${d.name}</td><td>${fmt1(d.score)}</td></tr>`).join('')
  const expectedRows = payload.softSkills.expectedProfile.map((s) => `<tr><td>${s.name}</td><td>${s.weightLabel}</td><td>${s.expected != null ? fmt1(s.expected) : '—'}</td></tr>`).join('')
  const hardHistoryRows = [...payload.hardHistory]
    .reverse()
    .map((h) => `<tr><td>${h.date.slice(0, 10)}</td><td>${h.periodLabel}</td><td>${fmt1(h.apexScore)}</td><td>${assessmentSourceLabel(h.source, lang)}</td></tr>`)
    .join('')
  const softHistoryRows = [...payload.softHistory].reverse().map((h) => `<tr><td>${h.date.slice(0, 10)}</td><td>${fmt1(h.overallOttenuto)}</td><td>${fmt1(h.overallAtteso)}</td></tr>`).join('')
  const reportGeneratedOn = ui.reportGeneratedOn as (d: string) => string
  return `
    <div class="rpt-note"><b>${t('reportTitle')}</b> — ${t('reportProvisionalNote')}</div>
    <div class="rpt-h1">${e.nome} ${e.cognome}</div>
    <div>${e.ruolo} · ${e.area}</div>
    <div style="font-size:11px; color:#555; margin-top:2px;">${reportGeneratedOn(payload.generatedAt.slice(0, 10))}</div>

    <div class="rpt-h2">${t('profileModuleATitle')} — ${t('profileLastAssessmentLabel')}</div>
    <div>${payload.softLastAssessmentDate ? payload.softLastAssessmentDate.slice(0, 10) : t('profileNoAssessmentYet')}</div>

    <div class="rpt-h2">${t('profileModuleBTitle')} — ${t('profileLastAssessmentLabel')}</div>
    <div>${payload.hardLastAssessmentDate ? payload.hardLastAssessmentDate.slice(0, 10) + (payload.hardLastAssessmentPeriod ? ` — ${payload.hardLastAssessmentPeriod}` : '') : t('profileNoAssessmentYet')}</div>

    <div class="rpt-h2">${t('profileModuleBTitle')}</div>
    <table class="rpt-table"><thead><tr><th>${t('colDimension')}</th><th>${t('hardApexScoreRow')}</th></tr></thead><tbody>
      ${dimsRows}
      <tr><td><b>${t('hardApexScoreRow')}</b></td><td><b>${fmt1(payload.hardSkills.apexScore)}</b></td></tr>
    </tbody></table>

    ${
      expectedRows
        ? `<div class="rpt-h2">${t('profileRoleExpectedTitle')}</div>
    <table class="rpt-table"><thead><tr><th>${t('colDimension')}</th><th>${t('rcEssenzialiLabel')}/${t('rcImportantiLabel')}/${t('rcUtiliLabel')}</th><th>${t('rcExpectedLabel')}</th></tr></thead><tbody>${expectedRows}</tbody></table>`
        : ''
    }

    ${
      hardHistoryRows
        ? `<div class="rpt-h2">${t('reportSectionHistory')} — ${t('profileModuleBTitle')}</div>
    <table class="rpt-table"><thead><tr><th>${t('prevAssessColDate')}</th><th>${t('prevAssessColPeriod')}</th><th>${t('hardApexScoreRow')}</th><th>${t('prevAssessColSource')}</th></tr></thead><tbody>${hardHistoryRows}</tbody></table>`
        : ''
    }

    ${
      softHistoryRows
        ? `<div class="rpt-h2">${t('reportSectionHistory')} — ${t('profileModuleATitle')}</div>
    <table class="rpt-table"><thead><tr><th>${t('prevAssessColDate')}</th><th>${t('colObtained')}</th><th>${t('colExpected')}</th></tr></thead><tbody>${softHistoryRows}</tbody></table>`
        : ''
    }
  `
}
