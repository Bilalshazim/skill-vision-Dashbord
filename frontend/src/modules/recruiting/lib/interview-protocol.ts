import type {
  IvCompareRow,
  IvEvalRecord,
  IvEvalSoftRow,
  IvEvalTecRow,
  IvNotesRecord,
  IvNotesSoftRow,
  IvNotesTecRow,
  IvReportRecord,
} from '@/modules/recruiting/lib/interview-protocol-types'
import { readInterviewProtocol, writeInterviewProtocol } from '@/modules/recruiting/lib/storage'

// Domain logic behind the Protocollo di Intervista (modules/recruiting.html
// "Area Valutatore" — Verbale di Colloquio / Scheda di Valutazione Candidato /
// Report Finale di Valutazione, ~4392-4821). Role-scoped only (currentRole),
// verified (Phase 19, re-verified fresh this phase) to have NO link to
// candidateId/employeeId/Pipeline/CANDIDATES anywhere in legacy source.
//
// Every save/clear here: fresh read -> mutate one role's entry in one of
// the 3 sub-maps -> persist the WHOLE apex5d_interview_protocol object.

// Ported verbatim (modules/recruiting.html line 3692) — used ONLY by
// Scheda Valutazione Candidato (ivEval). Confirmed genuinely different
// from IVN_SOFT_SKILLS below (different count, different labels) — Phase
// 19's finding, re-verified fresh: do NOT merge the two lists.
export const IV_SOFT_SKILLS = [
  'Comunicazione ed espressione',
  'Problem solving',
  'Lavoro in team / collaborazione',
  'Autonomia e proattività',
  'Motivazione e allineamento al ruolo',
] as const

// Ported verbatim (line 4491) — used ONLY by Scheda Intervista Strutturata
// (ivNotes). 6 items, NOT 5 — a different list from IV_SOFT_SKILLS above.
export const IVN_SOFT_SKILLS = [
  'Comunicazione ed espressione',
  'Problem solving',
  'Lavoro in team / collaborazione',
  'Autonomia e proattività',
  'Motivazione e interesse per il ruolo',
  'Adattabilità al contesto aziendale',
] as const

export const IV_COMPARE_ROW_EMPTY: IvCompareRow = { rank: '', code: '', score: '', note: '' }
function emptyCompareRow(): IvCompareRow {
  return { ...IV_COMPARE_ROW_EMPTY }
}
function defaultCompareRows(): IvCompareRow[] {
  return [emptyCompareRow(), emptyCompareRow()]
}

// ════════════════════════════════════════════════════════════════
// Scheda Intervista Strutturata (verbale)
// ════════════════════════════════════════════════════════════════

function emptyIvNotesTecRow(): IvNotesTecRow {
  return { area: '', score: '', note: '' }
}
function emptyIvNotesSoft(): Record<string, IvNotesSoftRow> {
  const out: Record<string, IvNotesSoftRow> = {}
  IVN_SOFT_SKILLS.forEach((name) => {
    out[name] = { score: '', note: '' }
  })
  return out
}

export type IvNotesDraft = Omit<IvNotesRecord, 'savedAt'>

// Ported from openIvNotesModal()'s per-field population (modules/
// recruiting.html ~4502-4516) — every field defaults to '' EXCEPT
// `posizione`, which defaults to the current role (record.posizione!=null
// ? record.posizione : currentRole) — reproduced exactly, not "cleaned up"
// to a blank default.
export function defaultIvNotesDraft(role: string): IvNotesDraft {
  return {
    posizione: role,
    rifCandidatura: '',
    nominativo: '',
    codiceData: '',
    data: '',
    ora: '',
    modalita: '',
    sede: '',
    faseProcesso: '',
    nColloquio: '',
    intervistatori: '',
    profiloRicercato: '',
    percorso: '',
    ralAttuale: '',
    ralRichiesta: '',
    preavviso: '',
    trasferte: '',
    ibrido: '',
    dataInizio: '',
    puntiForza: '',
    areeMiglioramento: '',
    qa: '',
    giudizioSintetico: '',
    punteggioComplessivo: '',
    esitoProcedi: false,
    esitoStandby: false,
    esitoAlternativo: false,
    esitoNonIdoneo: false,
    motivazioneDecisione: '',
    noteAggiuntive: '',
    dataFirma: '',
    firma: '',
    tecnica: { row1: emptyIvNotesTecRow(), row2: emptyIvNotesTecRow(), row3: emptyIvNotesTecRow() },
    soft: emptyIvNotesSoft(),
  }
}

export function loadIvNotesRecord(role: string): IvNotesRecord | null {
  return readInterviewProtocol().verbale[role] ?? null
}

export function loadIvNotesDraft(role: string): IvNotesDraft {
  const saved = loadIvNotesRecord(role)
  if (!saved) return defaultIvNotesDraft(role)
  const base = defaultIvNotesDraft(role)
  return {
    ...base,
    ...saved,
    posizione: saved.posizione ?? role,
    tecnica: { row1: saved.tecnica?.row1 ?? emptyIvNotesTecRow(), row2: saved.tecnica?.row2 ?? emptyIvNotesTecRow(), row3: saved.tecnica?.row3 ?? emptyIvNotesTecRow() },
    soft: { ...emptyIvNotesSoft(), ...saved.soft },
  }
}

// Ported verbatim from saveIvNotesForm() (modules/recruiting.html
// ~4531-4544) — hasContent is true if ANY of the 28 flat fields (including
// the defaulted `posizione`) is non-empty, OR any of the 4 exclusive
// checkboxes is checked, OR any of the 3 tech rows or 6 soft rows has
// something filled in. An empty submission DELETES the role's record
// rather than storing a blank one.
export function saveIvNotes(role: string, values: IvNotesDraft): void {
  const state = readInterviewProtocol()
  const flatValues: (string | boolean)[] = [
    values.posizione,
    values.rifCandidatura,
    values.nominativo,
    values.codiceData,
    values.data,
    values.ora,
    values.modalita,
    values.sede,
    values.faseProcesso,
    values.nColloquio,
    values.intervistatori,
    values.profiloRicercato,
    values.percorso,
    values.ralAttuale,
    values.ralRichiesta,
    values.preavviso,
    values.trasferte,
    values.ibrido,
    values.dataInizio,
    values.puntiForza,
    values.areeMiglioramento,
    values.qa,
    values.giudizioSintetico,
    values.punteggioComplessivo,
    values.motivazioneDecisione,
    values.noteAggiuntive,
    values.dataFirma,
    values.firma,
    values.esitoProcedi,
    values.esitoStandby,
    values.esitoAlternativo,
    values.esitoNonIdoneo,
  ]
  const flatHasContent = flatValues.some(Boolean)
  const tecHasContent = Object.values(values.tecnica).some((r) => r.area || r.score || r.note)
  const softHasContent = Object.values(values.soft).some((r) => r.score || r.note)
  const hasContent = flatHasContent || tecHasContent || softHasContent
  if (hasContent) state.verbale[role] = { ...values, savedAt: Date.now() }
  else delete state.verbale[role]
  writeInterviewProtocol(state)
}

// Ported verbatim from clearIvNotesForm() (~4545-4551) — unconditional
// delete, no confirmation prompt (legacy has none either).
export function clearIvNotes(role: string): void {
  const state = readInterviewProtocol()
  delete state.verbale[role]
  writeInterviewProtocol(state)
}

// ════════════════════════════════════════════════════════════════
// Scheda Valutazione Candidato (valutazione)
// ════════════════════════════════════════════════════════════════

function emptyIvEvalTecRow(): IvEvalTecRow {
  return { label: '', weight: '', score: '', note: '' }
}
function emptyIvEvalSoft(): Record<string, IvEvalSoftRow> {
  const out: Record<string, IvEvalSoftRow> = {}
  IV_SOFT_SKILLS.forEach((name) => {
    out[name] = { score: '', note: '' }
  })
  return out
}

export type IvEvalDraft = Omit<IvEvalRecord, 'savedAt'>

export function defaultIvEvalDraft(role: string): IvEvalDraft {
  return {
    posizione: role,
    rifCandidatura: '',
    candidateId: '',
    dataValutazione: '',
    evaluatorName: '',
    areaWeightTec: '60',
    areaWeightSoft: '40',
    tecnica: { row1: emptyIvEvalTecRow(), row2: emptyIvEvalTecRow(), row3: emptyIvEvalTecRow(), row4: emptyIvEvalTecRow() },
    soft: emptyIvEvalSoft(),
    finalScore: '',
    compareRows: defaultCompareRows(),
    reco_procedi: false,
    reco_riserva: false,
    reco_confronta: false,
    reco_no: false,
    motivazione: '',
    dataFirma: '',
    firma: '',
  }
}

export function loadIvEvalRecord(role: string): IvEvalRecord | null {
  return readInterviewProtocol().valutazione[role] ?? null
}

// Ported from openIvEvalModal() (~4641-4657), including renderIvEvalMatrices()'s
// area-weight fallback (record.areaWeightTec!=null && !=='' ? saved : 60/40)
// and the "2 blank compare rows when none saved" default.
export function loadIvEvalDraft(role: string): IvEvalDraft {
  const saved = loadIvEvalRecord(role)
  const base = defaultIvEvalDraft(role)
  if (!saved) return base
  return {
    ...base,
    ...saved,
    posizione: saved.posizione ?? role,
    areaWeightTec: saved.areaWeightTec != null && saved.areaWeightTec !== '' ? saved.areaWeightTec : '60',
    areaWeightSoft: saved.areaWeightSoft != null && saved.areaWeightSoft !== '' ? saved.areaWeightSoft : '40',
    tecnica: {
      row1: saved.tecnica?.row1 ?? emptyIvEvalTecRow(),
      row2: saved.tecnica?.row2 ?? emptyIvEvalTecRow(),
      row3: saved.tecnica?.row3 ?? emptyIvEvalTecRow(),
      row4: saved.tecnica?.row4 ?? emptyIvEvalTecRow(),
    },
    soft: { ...emptyIvEvalSoft(), ...saved.soft },
    compareRows: Array.isArray(saved.compareRows) && saved.compareRows.length ? saved.compareRows.map((r) => ({ ...r })) : defaultCompareRows(),
  }
}

export type IvEvalCalc = {
  /** Per-row weighted value ((weight/100)*score), 4 rows, same order as tecnica.row1..row4. */
  tecRowWeighted: [number, number, number, number]
  /** Sum of the 4 rows' RAW weight% inputs — shown with a ⚠ suffix by the UI when it isn't 100. */
  tecWeightSum: number
  /** Sum of the 4 rows' weighted values — this is BOTH "Subtotale area tecnica" and the section-4 technical subtotal. */
  tecScoreSum: number
  /** Per-row weighted value (score*0.2), 5 rows, same order as IV_SOFT_SKILLS — weight is FIXED at 20% each, never editable. */
  softRowWeighted: number[]
  /** Sum of the 5 soft rows' weighted values — max 5.0 (5 rows * 20% * score 5). */
  softScoreSum: number
  /** null until at least one tec or soft score has been entered (hasAnyInput guard) — never 0 by default. */
  finalScore: number | null
  suitabilityText: string
}

function ivEvalSuitabilityText(score: number | null): string {
  if (score == null || Number.isNaN(score)) return "Punteggio finale: — · Compila le matrici per calcolare l'esito"
  let verdict: string
  if (score >= 4) verdict = 'Eccellente — procedere con la fase successiva'
  else if (score >= 3) verdict = 'Buono — idoneo, da valutare in comparazione con altri candidati'
  else if (score >= 2) verdict = 'Sufficiente — idoneità marginale, profilo di riserva'
  else verdict = 'Non idoneo per la posizione'
  return `Punteggio finale: ${score.toFixed(2)} / 5 · ${verdict}`
}

// Ported verbatim from ivEvalRecalc() (~4596-4624). PROTOCOLLO-SPECIFIC —
// completely independent of scoring.ts's ahi()/fitFC()/affAB()/ci()/
// ranking(); do not replace or merge with those. Formula:
//   perRowWeighted = (weight/100) * score          (tec rows: weight is user-set 0-100)
//   perRowWeighted = 0.2 * score                    (soft rows: weight is FIXED 20%)
//   finalScore = hasAnyInput
//     ? tecScoreSum * (areaWeightTec/100) + softScoreSum * (areaWeightSoft/100)
//     : null
// Non-numeric/blank inputs parse to 0 (parseFloat(...)||0), matching
// legacy exactly — never throws, never NaN-propagates.
export function calcIvEval(tecnica: IvEvalRecord['tecnica'], soft: IvEvalRecord['soft'], areaWeightTecRaw: string, areaWeightSoftRaw: string): IvEvalCalc {
  const rows = [tecnica.row1, tecnica.row2, tecnica.row3, tecnica.row4]
  let tecWeightSum = 0
  let tecScoreSum = 0
  const tecRowWeighted = rows.map((row) => {
    const w = parseFloat(row.weight) || 0
    const s = parseFloat(row.score) || 0
    const weighted = (w / 100) * s
    tecWeightSum += w
    tecScoreSum += weighted
    return weighted
  }) as [number, number, number, number]

  let softScoreSum = 0
  const softRowWeighted = IV_SOFT_SKILLS.map((name) => {
    const s = parseFloat(soft[name]?.score || '') || 0
    const weighted = 0.2 * s
    softScoreSum += weighted
    return weighted
  })

  const areaWeightTec = parseFloat(areaWeightTecRaw) || 0
  const areaWeightSoft = parseFloat(areaWeightSoftRaw) || 0
  const hasAnyInput = tecScoreSum > 0 || softScoreSum > 0
  const finalScore = hasAnyInput ? tecScoreSum * (areaWeightTec / 100) + softScoreSum * (areaWeightSoft / 100) : null

  return { tecRowWeighted, tecWeightSum, tecScoreSum, softRowWeighted, softScoreSum, finalScore, suitabilityText: ivEvalSuitabilityText(finalScore) }
}

// Ported verbatim from saveIvEvalForm() (~4684-4693). Note this hasContent
// check does NOT look at posizione/rifCandidatura/dataValutazione/dataFirma/
// areaWeightTec/areaWeightSoft/the 4 reco checkboxes at all — reproduced
// exactly, not "corrected" to be more inclusive.
export function saveIvEval(role: string, values: IvEvalDraft): void {
  const state = readInterviewProtocol()
  const compareRows = values.compareRows.filter((r) => r.rank || r.code || r.score || r.note)
  const calc = calcIvEval(values.tecnica, values.soft, values.areaWeightTec, values.areaWeightSoft)
  const finalScore = calc.finalScore == null ? '' : calc.finalScore.toFixed(2)
  const toSave: IvEvalDraft = { ...values, compareRows, finalScore }
  const hasContent =
    !!toSave.candidateId ||
    !!toSave.evaluatorName ||
    !!toSave.finalScore ||
    toSave.compareRows.length > 0 ||
    !!toSave.motivazione ||
    !!toSave.firma ||
    Object.values(toSave.tecnica).some((r) => r.label || r.weight || r.score || r.note) ||
    Object.values(toSave.soft).some((r) => r.score || r.note)
  if (hasContent) state.valutazione[role] = { ...toSave, savedAt: Date.now() }
  else delete state.valutazione[role]
  writeInterviewProtocol(state)
}

export function clearIvEval(role: string): void {
  const state = readInterviewProtocol()
  delete state.valutazione[role]
  writeInterviewProtocol(state)
}

// ════════════════════════════════════════════════════════════════
// Report Finale Valutativo (report)
// ════════════════════════════════════════════════════════════════

function emptyStep() {
  return { date: '', interlocutore: '', esito: '' }
}

export type IvReportDraft = Omit<IvReportRecord, 'savedAt'>

export function defaultIvReportDraft(role: string): IvReportDraft {
  return {
    posizione: role,
    rifCandidatura: '',
    nominativo: '',
    dataReport: '',
    aCuraDi: '',
    fasiSvolte: '',
    summary: '',
    steps: { step1: emptyStep(), step2: emptyStep(), step3: emptyStep(), step4: emptyStep() },
    profiloCandidato: '',
    aggregate: { tec: '', tecNote: '', soft: '', softNote: '', motiv: '', motivNote: '', culture: '', cultureNote: '', total: '0.00' },
    strengths: '',
    risks: '',
    fitOrganizzativo: '',
    compareRows: defaultCompareRows(),
    reco_offerta: false,
    reco_riserva: false,
    reco_ulteriore: false,
    reco_nonProcedere: false,
    condizioniEconomiche: '',
    nextSteps: '',
    refVerbale: '',
    refScheda: '',
    refAltro: '',
    signHr: '',
    signHm: '',
  }
}

export function loadIvReportRecord(role: string): IvReportRecord | null {
  return readInterviewProtocol().report[role] ?? null
}

export function loadIvReportDraft(role: string): IvReportDraft {
  const saved = loadIvReportRecord(role)
  const base = defaultIvReportDraft(role)
  if (!saved) return base
  return {
    ...base,
    ...saved,
    posizione: saved.posizione ?? role,
    steps: {
      step1: saved.steps?.step1 ?? emptyStep(),
      step2: saved.steps?.step2 ?? emptyStep(),
      step3: saved.steps?.step3 ?? emptyStep(),
      step4: saved.steps?.step4 ?? emptyStep(),
    },
    aggregate: { ...base.aggregate, ...saved.aggregate },
    compareRows: Array.isArray(saved.compareRows) && saved.compareRows.length ? saved.compareRows.map((r) => ({ ...r })) : defaultCompareRows(),
  }
}

// Ported verbatim from ivReportRecalc() (~4705-4711) — a PLAIN, unweighted
// average of whichever of the 4 aggregate scores (tec/soft/motiv/culture)
// are actually filled in (blanks excluded from both sum and divisor, not
// treated as 0). Independent of ivEval's weighted formula and of
// scoring.ts. Returns 0 (not null) when nothing is filled in yet — matches
// legacy's own `scores.length?...:0`.
export function calcIvReportTotal(aggregate: { tec: string; soft: string; motiv: string; culture: string }): number {
  const scores = [aggregate.tec, aggregate.soft, aggregate.motiv, aggregate.culture].map((v) => parseFloat(v)).filter((n) => !Number.isNaN(n))
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
}

// Ported verbatim from saveIvReportForm() (~4802-4812).
export function saveIvReport(role: string, values: IvReportDraft): void {
  const state = readInterviewProtocol()
  const compareRows = values.compareRows.filter((r) => r.rank || r.code || r.score || r.note)
  const total = calcIvReportTotal(values.aggregate)
  const toSave: IvReportDraft = { ...values, compareRows, aggregate: { ...values.aggregate, total: total.toFixed(2) } }
  const hasContent =
    !!toSave.summary ||
    !!toSave.strengths ||
    !!toSave.risks ||
    !!toSave.profiloCandidato ||
    !!toSave.signHr ||
    !!toSave.signHm ||
    toSave.compareRows.length > 0 ||
    Object.values(toSave.steps).some((s) => s.date || s.interlocutore || s.esito) ||
    total > 0
  if (hasContent) state.report[role] = { ...toSave, savedAt: Date.now() }
  else delete state.report[role]
  writeInterviewProtocol(state)
}

export function clearIvReport(role: string): void {
  const state = readInterviewProtocol()
  delete state.report[role]
  writeInterviewProtocol(state)
}
