import { exiDefaultData, generateDemoData } from '@/modules/assessment/lib/demo-data'
import { uid } from '@/modules/assessment/lib/legacy-utils'
import type { AssessmentState } from '@/modules/assessment/lib/types'

// Data-access boundary for Assessment — the ONLY place that touches
// `sv_assessment_state_v1`, mirroring loadState()/saveState() (js/assessment.js
// ~2877-2944) exactly: same key, same JSON shape, same defensive per-field
// defaults for records saved by an older version of the app. Completely
// independent of every Recruiting key (apex5d_*, skillvision_candidates_data) —
// verified via Phase 22's cross-key audit; nothing in Assessment ever reads
// or writes those.
const STORAGE_KEY = 'sv_assessment_state_v1'

// Ported verbatim from loadState()'s per-field back-fill (~2877-2925) — a
// record saved by an older build of the legacy app (or by a React build
// before some field existed) gets exactly these defaults patched in, field
// by field, never wholesale-replaced.
function hydrate(parsed: Partial<AssessmentState> & { employees: AssessmentState['employees'] }): AssessmentState {
  if (!Array.isArray(parsed.evaluators)) parsed.evaluators = []
  if (!Array.isArray(parsed.evalAssignments)) parsed.evalAssignments = []
  if (!Array.isArray(parsed.evalPeriods) || !parsed.evalPeriods.length) {
    parsed.evalPeriods = [{ id: uid('period'), label: 'Periodo corrente', date: new Date().toISOString().slice(0, 10) }]
  }
  parsed.employees.forEach((e) => {
    if (!e.hardEvaluatedBy) e.hardEvaluatedBy = { resp: '', peer: '', auto: '' }
    if ((e as { sesso?: string }).sesso === undefined) e.sesso = ''
    if (e.tipoContratto === undefined) e.tipoContratto = 'dipendente'
    if (e.livelloCcnl === undefined) e.livelloCcnl = ''
    if (e.ral === undefined) e.ral = 0
    if (e.benefit === undefined) e.benefit = ''
    if (!Array.isArray(e.assenzeProgrammate)) e.assenzeProgrammate = []
    if (e.archived === undefined) e.archived = null
    if (!Array.isArray(e.hardHistory)) e.hardHistory = []
    if (!Array.isArray(e.softHistory)) e.softHistory = []
  })
  if (!parsed.settings) parsed.settings = { modulo: 'AB', companyName: 'Demo Company S.r.l.' } as AssessmentState['settings']
  const s = parsed.settings
  if (s.testsAcquired === undefined) s.testsAcquired = 0
  if (s.testsDispatched === undefined) s.testsDispatched = 0
  if (s.surveyLink === undefined) s.surveyLink = ''
  if (s.surveySenderMode === undefined) s.surveySenderMode = 'referente'
  if (s.adminSenderEmail === undefined) s.adminSenderEmail = ''
  if (s.surveyEmailSubject === undefined) s.surveyEmailSubject = 'Questionario di valutazione delle competenze'
  if (s.surveyEmailBody === undefined)
    s.surveyEmailBody = 'Ciao {{NOME}},\n\n[Testo standard da inserire — verrà fornito dal cliente]\n\nPer completare il questionario di valutazione delle Competenze Trasversali, utilizza il link seguente:\n\n{{LINK}}\n\nGrazie.'
  if (s.emailApiEndpoint === undefined) s.emailApiEndpoint = ''
  if (s.emailApiKey === undefined) s.emailApiKey = ''
  if (!s.actionNotes) s.actionNotes = {}
  if (!s.softSkillTargets) s.softSkillTargets = {}
  if (!parsed.analisiIniziale || (parsed.analisiIniziale as { q1?: number }).q1 === undefined) parsed.analisiIniziale = exiDefaultData()
  if (!parsed.company) parsed.company = { locations: [], contacts: [], referente: { name: '', email: '', phone: '' }, ceo: { name: '', email: '' }, cfo: { name: '', email: '' } }
  if (!Array.isArray(parsed.company.locations)) parsed.company.locations = []
  if (!Array.isArray(parsed.company.contacts)) parsed.company.contacts = []
  if (!parsed.company.referente) parsed.company.referente = { name: '', email: '', phone: '' }
  if (!parsed.company.ceo) parsed.company.ceo = { name: '', email: '' }
  if (!parsed.company.cfo) parsed.company.cfo = { name: '', email: '' }
  parsed.evalAssignments.forEach((a) => {
    if (a.evaluatorEmail === undefined) a.evaluatorEmail = ''
  })
  return parsed as AssessmentState
}

// Ported from loadState() (~2877-2929) — on first run (nothing in storage,
// or a corrupted/unparseable record), legacy falls back to generateDemoData()
// AND immediately persists it (unlike Recruiting's read-only seed fallback,
// which only writes on the first real mutation). Reproduced exactly: a
// fresh Assessment install writes `sv_assessment_state_v1` right away.
export function readAssessmentState(): AssessmentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.employees)) return hydrate(parsed)
    }
  } catch {
    /* corrupted or missing — fall through to demo data */
  }
  const demo = generateDemoData()
  writeAssessmentState(demo)
  return demo
}

// Ported verbatim from saveState() (~2931-2943) — the whole state blob,
// re-serialized. Throws on failure instead of swallowing it (matches this
// migration's established writer discipline) — callers decide how to
// surface that.
export function writeAssessmentState(state: AssessmentState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
