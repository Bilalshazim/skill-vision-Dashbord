import { exiDefaultData } from '@/modules/assessment/lib/demo-data'
import { uid } from '@/modules/assessment/lib/legacy-utils'
import type { AssessmentState } from '@/modules/assessment/lib/types'

// La forma completa dello stato di Assessment: le parti mancanti (record
// salvati da versioni più vecchie, o mai salvati sul server) prendono i loro
// valori predefiniti, campo per campo. I dati stanno sul server; questo file
// non legge né scrive l'archivio del browser (vedi browser-import.ts).

// Ported verbatim from loadState()'s per-field back-fill (~2877-2925) — a
// record saved by an older build of the legacy app (or by a React build
// before some field existed) gets exactly these defaults patched in, field
// by field, never wholesale-replaced.
export function hydrate(parsed: Partial<AssessmentState> & { employees: AssessmentState['employees'] }): AssessmentState {
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
