// Shapes mirror modules/recruiting.html's Protocollo di Intervista exactly
// (INTERVIEW_DATA, ~3694; collectIvNotesForm()/collectIvEvalForm()/
// collectIvReportForm(), ~4519-4801) — not redesigned, just typed.

export type IvCompareRow = { rank: string; code: string; score: string; note: string }

export const IV_COMPARE_ROW_EMPTY: IvCompareRow = { rank: '', code: '', score: '', note: '' }

// ── Scheda Intervista Strutturata (verbale) ──
export type IvNotesTecRow = { area: string; score: string; note: string }
export type IvNotesSoftRow = { score: string; note: string }

export type IvNotesRecord = {
  posizione: string
  rifCandidatura: string
  nominativo: string
  codiceData: string
  data: string
  ora: string
  modalita: string
  sede: string
  faseProcesso: string
  nColloquio: string
  intervistatori: string
  profiloRicercato: string
  percorso: string
  ralAttuale: string
  ralRichiesta: string
  preavviso: string
  trasferte: string
  ibrido: string
  dataInizio: string
  puntiForza: string
  areeMiglioramento: string
  qa: string
  giudizioSintetico: string
  punteggioComplessivo: string
  esitoProcedi: boolean
  esitoStandby: boolean
  esitoAlternativo: boolean
  esitoNonIdoneo: boolean
  motivazioneDecisione: string
  noteAggiuntive: string
  dataFirma: string
  firma: string
  tecnica: { row1: IvNotesTecRow; row2: IvNotesTecRow; row3: IvNotesTecRow }
  soft: Record<string, IvNotesSoftRow>
  savedAt: number
}

// ── Scheda Valutazione Candidato (valutazione) ──
export type IvEvalTecRow = { label: string; weight: string; score: string; note: string }
export type IvEvalSoftRow = { score: string; note: string }

export type IvEvalRecord = {
  posizione: string
  rifCandidatura: string
  candidateId: string
  dataValutazione: string
  evaluatorName: string
  areaWeightTec: string
  areaWeightSoft: string
  tecnica: { row1: IvEvalTecRow; row2: IvEvalTecRow; row3: IvEvalTecRow; row4: IvEvalTecRow }
  soft: Record<string, IvEvalSoftRow>
  finalScore: string
  compareRows: IvCompareRow[]
  reco_procedi: boolean
  reco_riserva: boolean
  reco_confronta: boolean
  reco_no: boolean
  motivazione: string
  dataFirma: string
  firma: string
  savedAt: number
}

// ── Report Finale Valutativo (report) ──
export type IvReportStep = { date: string; interlocutore: string; esito: string }
export type IvReportAggregate = {
  tec: string
  tecNote: string
  soft: string
  softNote: string
  motiv: string
  motivNote: string
  culture: string
  cultureNote: string
  total: string
}

export type IvReportRecord = {
  posizione: string
  rifCandidatura: string
  nominativo: string
  dataReport: string
  aCuraDi: string
  fasiSvolte: string
  summary: string
  steps: { step1: IvReportStep; step2: IvReportStep; step3: IvReportStep; step4: IvReportStep }
  profiloCandidato: string
  aggregate: IvReportAggregate
  strengths: string
  risks: string
  fitOrganizzativo: string
  compareRows: IvCompareRow[]
  reco_offerta: boolean
  reco_riserva: boolean
  reco_ulteriore: boolean
  reco_nonProcedere: boolean
  condizioniEconomiche: string
  nextSteps: string
  refVerbale: string
  refScheda: string
  refAltro: string
  signHr: string
  signHm: string
  savedAt: number
}

export type InterviewProtocolState = {
  verbale: Record<string, IvNotesRecord>
  valutazione: Record<string, IvEvalRecord>
  report: Record<string, IvReportRecord>
}
