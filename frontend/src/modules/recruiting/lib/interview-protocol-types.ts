// Shapes mirror modules/recruiting.html's Protocollo di Intervista exactly
// (INTERVIEW_DATA, ~3694; collectIvNotesForm()/collectIvEvalForm()/
// collectIvReportForm(), ~4519-4801) — not redesigned, just typed.

// `note` = punto distintivo ("Perché sì"); `note2` = dubbio o rischio ("Perché no").
export type IvCompareRow = { rank: string; code: string; score: string; note: string; note2?: string }

export const IV_COMPARE_ROW_EMPTY: IvCompareRow = { rank: '', code: '', score: '', note: '', note2: '' }

// ── Scheda Intervista Strutturata (verbale) ──
// `livello`: livello dichiarato dal candidato (Base / Medio / Alto).
export type IvNotesTecRow = { area: string; score: string; note: string; livello?: string }
export type IvNotesSoftRow = { score: string; note: string }

// Domande personalizzate (Foglio 6): chi conduce il colloquio può riscrivere il
// testo di una domanda fissa (`softLabels`, per nome originale) e aggiungerne
// di proprie (`extraQuestions`). Viaggiano nella scheda, quindi si salvano
// sul server insieme a risposte e punteggi. Le aggiunte non entrano nel
// punteggio pesato della Scheda di valutazione.
// `score2`/`score3`: punteggi della 2ª e 3ª fase, solo nella Scheda di valutazione.
export type IvExtraQuestion = { id: string; label: string; score: string; note: string; score2?: string; score3?: string }

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
  tecnica: { row1: IvNotesTecRow; row2: IvNotesTecRow; row3: IvNotesTecRow; row4: IvNotesTecRow }
  // Le domande di prassi (apertura, percorso, trasversali) stanno tutte qui,
  // per testo originale della domanda o nome della competenza.
  soft: Record<string, IvNotesSoftRow>
  // Modello del cliente (Foglio 8): campi aggiunti al Verbale.
  durata: string
  canaleCandidatura: string
  profiloNice: string
  contratto: string
  mobilita: string
  altreSelezioni: string
  orario: string
  domandeCandidato: string
  prossimoPasso: string
  riepilogo: Record<string, IvNotesSoftRow>
  softLabels?: Record<string, string>
  extraQuestions?: IvExtraQuestion[]
  savedAt: number
}

// ── Scheda Valutazione Candidato (valutazione) ──
// Matrice a tre fasi (Foglio 8): `score` è il punteggio della 1ª fase,
// `score2` e `score3` quelli della 2ª e 3ª; `key` segna il criterio chiave.
// `weight` resta nei dati salvati prima del Foglio 8, ma non si usa più.
export type IvEvalTecRow = { label: string; weight: string; score: string; note: string; score2?: string; score3?: string; key?: boolean }
export type IvEvalSoftRow = { score: string; note: string; score2?: string; score3?: string; key?: boolean }
export type IvEvalPhase = { fase: string; data: string; conChi: string; esito: string }
export type IvEvalReview = { data: string; emerso: string; approfondire: string; andamento: string }

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
  softLabels?: Record<string, string>
  extraQuestions?: IvExtraQuestion[]
  finalScore: string
  compareRows: IvCompareRow[]
  respLinea: string
  percorso: IvEvalPhase[]
  considerazioni: IvEvalReview[]
  puntiDaDefinire: string
  vistoLinea: string
  reco_procedi: boolean
  reco_riserva: boolean
  reco_confronta: boolean
  reco_no: boolean
  motivazione: string
  dataFirma: string
  firma: string
  savedAt: number
}

// ── Resoconto finale di valutazione (report) ──
export type IvReportStep = { date: string; interlocutore: string; esito: string; media?: string }
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
  // Quinta area, libera: l'HR scrive il criterio specifico del ruolo.
  extraLabel: string
  extra: string
  extraNote: string
  andamento: string
}

export type IvReportRecord = {
  posizione: string
  rifCandidatura: string
  nominativo: string
  dataReport: string
  aCuraDi: string
  fasiSvolte: string
  summary: string
  steps: { step1: IvReportStep; step2: IvReportStep; step3: IvReportStep; step4: IvReportStep; step5: IvReportStep }
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
  // Modello del cliente (Foglio 8)
  codice: string
  destinatari: string
  finalisti: string
  fit: { ruolo: IvReportFit; team: IvReportFit; cultura: IvReportFit }
  formazione: string
  ruoloAttuale: string
  risultato: string
  ralAttuale: string
  ralAttesa: string
  preavviso: string
  mobilita: string
  proposta: { livello: string; ral: string; inizio: string; limite: string }
  verifiche: Record<string, { done: boolean; responsabile: string; entro: string }>
  considerazioniHr: string
  allegati: Record<string, boolean>
  decisione: string
  decisioneNote: string
  signLinea: string
  savedAt: number
}

export type IvReportFit = { text: string; fit: string }

export type InterviewProtocolState = {
  verbale: Record<string, IvNotesRecord>
  valutazione: Record<string, IvEvalRecord>
  report: Record<string, IvReportRecord>
}
