import type {
  IvCompareRow,
  IvEvalPhase,
  IvEvalRecord,
  IvEvalReview,
  IvEvalSoftRow,
  IvEvalTecRow,
  IvNotesRecord,
  IvNotesSoftRow,
  IvNotesTecRow,
  IvReportRecord,
  IvReportStep,
} from '@/modules/recruiting/lib/interview-protocol-types'
import { readInterviewProtocol, writeInterviewProtocol } from '@/modules/recruiting/lib/storage'

// Domain logic behind the Protocollo di Intervista (modules/recruiting.html
// "Area Valutatore" — Verbale di Colloquio / Scheda di Valutazione Candidato /
// Resoconto finale di valutazione, ~4392-4821). Role-scoped only (currentRole),
// verified (Phase 19, re-verified fresh this phase) to have NO link to
// candidateId/employeeId/Pipeline/CANDIDATES anywhere in legacy source.
//
// Every save/clear here: fresh read -> mutate one role's entry in one of
// the 3 sub-maps -> persist the WHOLE apex5d_interview_protocol object.

// Le domande dei tre documenti seguono i modelli del cliente (Foglio 8).
// Il testo della domanda (o il nome della competenza) è la chiave sotto cui
// si salva la risposta in `soft`: così il confronto fra valutatori e la sintesi
// leggono tutte le domande senza sapere in quale sezione stanno.
export type IvQuestion = { name: string; question: string; hint: string }

export const IVN_OPENING: IvQuestion[] = [
  { name: 'Mi racconti brevemente di lei e del suo percorso fino a oggi.', question: '', hint: 'Ascoltare: coerenza del filo conduttore, capacità di sintesi, cosa sceglie di mettere in evidenza.' },
  { name: 'Cosa l’ha colpita di questa posizione e della nostra azienda?', question: '', hint: 'Ascoltare: quanto si è informato; motivazione specifica o generica.' },
  { name: 'Perché sta valutando un cambiamento (o perché ha lasciato l’ultimo ruolo)?', question: '', hint: 'Ascoltare: cosa cerca, non solo da cosa scappa; il tono verso i precedenti datori.' },
  { name: 'Dove si vede tra 3–5 anni?', question: '', hint: 'Ascoltare: allineamento con le prospettive reali del ruolo.' },
]

export const IVN_PATH: IvQuestion[] = [
  { name: 'Mi descriva il ruolo attuale o più recente: responsabilità, perimetro, a chi riporta.', question: '', hint: 'Ascoltare: livello reale di autonomia e responsabilità.' },
  { name: 'Qual è il risultato di cui va più orgoglioso? Qual è stato il suo contributo personale?', question: '', hint: 'Ascoltare: distinzione tra “io” e “noi”; numeri ed evidenze verificabili.' },
  { name: 'Nel percorso ci sono cambi frequenti o pause? Come li racconta?', question: '', hint: 'Ascoltare: motivazioni professionali; domanda posta con neutralità.' },
  { name: 'Quale formazione, formale e non, ritiene più utile per questo ruolo? Cosa sta approfondendo ora?', question: '', hint: 'Ascoltare: propensione ad aggiornarsi.' },
]

// Competenze trasversali (metodo STAR): `name` è il titolo, `question` la domanda.
export const IVN_TRANSVERSAL: IvQuestion[] = [
  { name: 'Comunicazione e relazione', question: 'Mi racconti di una volta in cui ha dovuto convincere qualcuno che la pensava diversamente.', hint: 'Ascoltare: chiarezza, ascolto, adattamento all’interlocutore.' },
  { name: 'Problem solving', question: 'Un problema complesso che ha risolto: come ha ragionato e con quale esito?', hint: 'Ascoltare: metodo, uso dei dati, alternative valutate.' },
  { name: 'Lavoro in team', question: 'Una situazione di tensione nel gruppo: cosa ha fatto lei, concretamente?', hint: 'Ascoltare: responsabilità personale, orientamento al gruppo.' },
  { name: 'Autonomia e organizzazione', question: 'Come gestisce le priorità quando le scadenze si sovrappongono? Un esempio recente.', hint: 'Ascoltare: criteri di priorità, capacità di dire no.' },
  { name: 'Resilienza', question: 'Un momento di forte pressione o un insuccesso: come lo ha affrontato e cosa ha imparato?', hint: 'Ascoltare: autocritica senza difensività.' },
  { name: 'Adattabilità', question: 'Un cambiamento importante imposto dall’alto: come ha reagito?', hint: 'Ascoltare: flessibilità, velocità di riallineamento.' },
  { name: 'Iniziativa', question: 'Un’occasione in cui ha agito senza che gliel’avessero chiesto.', hint: 'Ascoltare: proattività, orientamento al risultato.' },
]

// Tutte le chiavi di `soft` del Verbale.
export const IVN_SOFT_SKILLS = [...IVN_OPENING, ...IVN_PATH, ...IVN_TRANSVERSAL].map((q) => q.name)

// Riepilogo del Verbale (Parte C, sezione 10): una riga per area, più la valutazione complessiva.
export const IVN_SUMMARY_AREAS = [
  'Competenze professionali (sez. 5)',
  'Competenze trasversali (sez. 6)',
  'Motivazione e allineamento (sez. 3–4)',
  'Fit con cultura e team',
  'Domande personalizzate (Parte B)',
] as const

// Criteri trasversali della matrice della Scheda di valutazione (sez. 4).
export const IV_SOFT_SKILLS = [
  'Comunicazione e relazione',
  'Problem solving',
  'Lavoro in team',
  'Autonomia e organizzazione',
  'Motivazione e adattabilità',
  'Allineamento a cultura e valori',
] as const

export const IV_EVAL_PHASES = ['1°', '2°', '3°'] as const

export const IV_COMPARE_ROW_EMPTY: IvCompareRow = { rank: '', code: '', score: '', note: '', note2: '' }
function emptyCompareRow(): IvCompareRow {
  return { ...IV_COMPARE_ROW_EMPTY }
}
function defaultCompareRows(): IvCompareRow[] {
  return [emptyCompareRow(), emptyCompareRow()]
}
const filledCompare = (r: IvCompareRow) => r.rank || r.code || r.score || r.note || r.note2
// Domande personalizzate: sei righe di partenza, come nel modello.
const defaultExtraQuestions = () => Array.from({ length: 6 }, (_, i) => ({ id: `q${i + 1}`, label: '', score: '', note: '' }))

// ════════════════════════════════════════════════════════════════
// Verbale di colloquio (modello del cliente, Foglio 8)
// ════════════════════════════════════════════════════════════════

function emptyIvNotesTecRow(): IvNotesTecRow {
  return { area: '', score: '', note: '', livello: '' }
}
function emptyIvNotesSoft(): Record<string, IvNotesSoftRow> {
  const out: Record<string, IvNotesSoftRow> = {}
  IVN_SOFT_SKILLS.forEach((name) => {
    out[name] = { score: '', note: '' }
  })
  return out
}
function emptyIvNotesSummary(): Record<string, IvNotesSoftRow> {
  const out: Record<string, IvNotesSoftRow> = {}
  IVN_SUMMARY_AREAS.forEach((name) => {
    out[name] = { score: '', note: '' }
  })
  return out
}

export type IvNotesDraft = Omit<IvNotesRecord, 'savedAt'>

// `posizione` parte dal ruolo corrente; ogni altro campo parte vuoto.
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
    tecnica: { row1: emptyIvNotesTecRow(), row2: emptyIvNotesTecRow(), row3: emptyIvNotesTecRow(), row4: emptyIvNotesTecRow() },
    soft: emptyIvNotesSoft(),
    durata: '',
    canaleCandidatura: '',
    profiloNice: '',
    contratto: '',
    mobilita: '',
    altreSelezioni: '',
    orario: '',
    domandeCandidato: '',
    prossimoPasso: '',
    riepilogo: emptyIvNotesSummary(),
    extraQuestions: defaultExtraQuestions(),
  }
}

export function loadIvNotesRecord(role: string): IvNotesRecord | null {
  return readInterviewProtocol().verbale[role] ?? null
}

// Le schede salvate prima del modello del Foglio 8 usavano altre diciture
// nelle scelte: si riportano a quelle del modello.
const LEGACY_MODALITA: Record<string, string> = { 'Video call': 'Video', Telefonico: 'Telefono' }
const LEGACY_FASE: Record<string, string> = { '1° colloquio': '1°', '2° colloquio': '2°', 'Colloquio tecnico': '2°' }
const LEGACY_TRASFERTE: Record<string, string> = { Parziale: 'Limitate' }

// Porta un record salvato (dal browser o ricevuto dal server) alla forma
// completa della bozza: i campi mancanti tornano ai valori di partenza.
export function normalizeIvNotesDraft(saved: Partial<IvNotesRecord> | null | undefined, role: string): IvNotesDraft {
  const base = defaultIvNotesDraft(role)
  if (!saved) return base
  return {
    ...base,
    ...saved,
    posizione: saved.posizione ?? role,
    modalita: LEGACY_MODALITA[saved.modalita ?? ''] ?? saved.modalita ?? '',
    faseProcesso: LEGACY_FASE[saved.faseProcesso ?? ''] ?? saved.faseProcesso ?? '',
    trasferte: LEGACY_TRASFERTE[saved.trasferte ?? ''] ?? saved.trasferte ?? '',
    tecnica: {
      row1: { ...emptyIvNotesTecRow(), ...saved.tecnica?.row1 },
      row2: { ...emptyIvNotesTecRow(), ...saved.tecnica?.row2 },
      row3: { ...emptyIvNotesTecRow(), ...saved.tecnica?.row3 },
      row4: { ...emptyIvNotesTecRow(), ...saved.tecnica?.row4 },
    },
    soft: { ...emptyIvNotesSoft(), ...saved.soft },
    riepilogo: { ...emptyIvNotesSummary(), ...saved.riepilogo },
    extraQuestions: saved.extraQuestions?.length ? saved.extraQuestions : defaultExtraQuestions(),
  }
}

export function loadIvNotesDraft(role: string): IvNotesDraft {
  return normalizeIvNotesDraft(loadIvNotesRecord(role), role)
}

// Una scheda svuotata non si salva: se non c'è niente di compilato il record
// della posizione viene cancellato. `posizione` parte dal ruolo, quindi finché
// resta com'è la scheda conta come compilata (comportamento di sempre).
export function saveIvNotes(role: string, values: IvNotesDraft): void {
  const state = readInterviewProtocol()
  const { tecnica, soft, riepilogo, extraQuestions, softLabels, ...flat } = values
  const flatHasContent = Object.values(flat).some(Boolean)
  const tecHasContent = Object.values(tecnica).some((r) => r.area || r.score || r.note || r.livello)
  const softHasContent = [...Object.values(soft), ...Object.values(riepilogo)].some((r) => r.score || r.note)
  const extraHasContent = (extraQuestions ?? []).some((q) => q.label || q.score || q.note) || Object.keys(softLabels ?? {}).length > 0
  const hasContent = flatHasContent || tecHasContent || softHasContent || extraHasContent
  if (hasContent) state.verbale[role] = { ...values, savedAt: Date.now() }
  else delete state.verbale[role]
  writeInterviewProtocol(state)
}

export function clearIvNotes(role: string): void {
  const state = readInterviewProtocol()
  delete state.verbale[role]
  writeInterviewProtocol(state)
}

// ════════════════════════════════════════════════════════════════
// Scheda di valutazione candidato (modello del cliente, Foglio 8)
// ════════════════════════════════════════════════════════════════

function emptyIvEvalTecRow(): IvEvalTecRow {
  return { label: '', weight: '', score: '', note: '', score2: '', score3: '', key: false }
}
function emptyIvEvalSoft(): Record<string, IvEvalSoftRow> {
  const out: Record<string, IvEvalSoftRow> = {}
  IV_SOFT_SKILLS.forEach((name) => {
    out[name] = { score: '', note: '', score2: '', score3: '', key: false }
  })
  return out
}
const DEFAULT_PHASES = ['1° colloquio · HR', '2° colloquio · responsabile / tecnico', '3° colloquio · finale / direzione', 'Altro · case, prova, referenze']
function defaultPhases(): IvEvalPhase[] {
  return DEFAULT_PHASES.map((fase) => ({ fase, data: '', conChi: '', esito: '' }))
}
function defaultReviews(): IvEvalReview[] {
  return [0, 1, 2].map(() => ({ data: '', emerso: '', approfondire: '', andamento: '' }))
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
    respLinea: '',
    percorso: defaultPhases(),
    considerazioni: defaultReviews(),
    puntiDaDefinire: '',
    vistoLinea: '',
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

export function normalizeIvEvalDraft(saved: Partial<IvEvalRecord> | null | undefined, role: string): IvEvalDraft {
  const base = defaultIvEvalDraft(role)
  if (!saved) return base
  const tec = (r: Partial<IvEvalTecRow> | undefined): IvEvalTecRow => ({ ...emptyIvEvalTecRow(), ...r })
  const soft = emptyIvEvalSoft()
  Object.entries(saved.soft ?? {}).forEach(([name, row]) => {
    soft[name] = { ...(soft[name] ?? { score: '', note: '', score2: '', score3: '', key: false }), ...row }
  })
  return {
    ...base,
    ...saved,
    posizione: saved.posizione ?? role,
    tecnica: { row1: tec(saved.tecnica?.row1), row2: tec(saved.tecnica?.row2), row3: tec(saved.tecnica?.row3), row4: tec(saved.tecnica?.row4) },
    soft,
    compareRows: Array.isArray(saved.compareRows) && saved.compareRows.length ? saved.compareRows.map((r) => ({ ...r })) : defaultCompareRows(),
    percorso: Array.isArray(saved.percorso) && saved.percorso.length ? saved.percorso.map((r) => ({ ...r })) : defaultPhases(),
    considerazioni: Array.isArray(saved.considerazioni) && saved.considerazioni.length ? saved.considerazioni.map((r) => ({ ...r })) : defaultReviews(),
  }
}

export function loadIvEvalDraft(role: string): IvEvalDraft {
  return normalizeIvEvalDraft(loadIvEvalRecord(role), role)
}

// Le quattro fasce di idoneità del modello, dalla più alta.
export const IV_EVAL_BANDS = [
  { range: '4,0 – 5,0', label: 'Eccellente', text: 'procedere con la fase successiva o con l’offerta' },
  { range: '3,0 – 3,9', label: 'Buono', text: 'idoneo, da valutare in confronto con altri candidati' },
  { range: '2,0 – 2,9', label: 'Sufficiente', text: 'idoneità marginale, profilo di riserva' },
  { range: '< 2,0', label: 'Non idoneo', text: 'per la posizione' },
] as const

export function ivEvalBandIndex(score: number | null): number | null {
  if (score == null || Number.isNaN(score)) return null
  if (score >= 4) return 0
  if (score >= 3) return 1
  if (score >= 2) return 2
  return 3
}

export type IvEvalCalc = {
  /** Media di ciascuna fase (somma dei punteggi ÷ criteri valutati); null se la fase è vuota. */
  phaseAverage: [number | null, number | null, number | null]
  /** Media dell'ultima fase valutata: è la media finale e decide la fascia. */
  finalScore: number | null
  /** Indice (0–2) dell'ultima fase con punteggi, o null. */
  lastPhase: number | null
  /** Indice in IV_EVAL_BANDS, o null finché non c'è un punteggio. */
  band: number | null
  /** Criteri chiave sotto 3 nell'ultima fase valutata. */
  keysBelow: string[]
  suitabilityText: string
}

const num = (v: string | undefined) => {
  const n = parseFloat(v ?? '')
  return Number.isNaN(n) || n <= 0 ? null : n
}

// Il calcolo del modello: ogni criterio ha un punteggio 1–5 per fase e la
// media di una fase è la somma dei punteggi diviso il numero dei criteri
// valutati; i criteri vuoti non contano. La fascia segue la media dell'ultima
// fase. Le domande aggiunte dal valutatore sono criteri come gli altri.
// Indipendente da scoring.ts. Un campo non numerico vale "non valutato".
export function calcIvEval(draft: Pick<IvEvalRecord, 'tecnica' | 'soft' | 'softLabels' | 'extraQuestions'>): IvEvalCalc {
  type Row = { label: string; key: boolean; scores: (number | null)[] }
  const rows: Row[] = [
    ...Object.values(draft.tecnica).map((r, i) => ({ label: r.label.trim() || `Competenza tecnica ${i + 1}`, key: !!r.key, scores: [num(r.score), num(r.score2), num(r.score3)] })),
    ...IV_SOFT_SKILLS.map((name) => {
      const r = draft.soft[name]
      return { label: draft.softLabels?.[name] || name, key: !!r?.key, scores: [num(r?.score), num(r?.score2), num(r?.score3)] }
    }),
    ...(draft.extraQuestions ?? []).map((q) => ({ label: q.label.trim() || 'Domanda aggiunta', key: false, scores: [num(q.score), num(q.score2), num(q.score3)] })),
  ]
  const phaseAverage = [0, 1, 2].map((p) => {
    const vals = rows.map((r) => r.scores[p]).filter((v): v is number => v != null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }) as IvEvalCalc['phaseAverage']
  const lastPhase = [2, 1, 0].find((p) => phaseAverage[p] != null) ?? null
  const finalScore = lastPhase == null ? null : phaseAverage[lastPhase]
  const keysBelow = lastPhase == null ? [] : rows.filter((r) => r.key && r.scores[lastPhase] != null && (r.scores[lastPhase] as number) < 3).map((r) => r.label)
  const band = ivEvalBandIndex(finalScore)
  const suitabilityText =
    finalScore == null || band == null
      ? 'Media finale: — · Compila la matrice per calcolare la fascia'
      : `Media finale: ${finalScore.toFixed(2)} / 5 · ${IV_EVAL_BANDS[band].label} — ${IV_EVAL_BANDS[band].text}`
  return { phaseAverage, finalScore, lastPhase, band, keysBelow, suitabilityText }
}

export function saveIvEval(role: string, values: IvEvalDraft): void {
  const state = readInterviewProtocol()
  const compareRows = values.compareRows.filter(filledCompare)
  const calc = calcIvEval(values)
  const finalScore = calc.finalScore == null ? '' : calc.finalScore.toFixed(2)
  const toSave: IvEvalDraft = { ...values, compareRows, finalScore }
  const hasContent =
    !!toSave.candidateId ||
    !!toSave.evaluatorName ||
    !!toSave.finalScore ||
    toSave.compareRows.length > 0 ||
    !!toSave.motivazione ||
    !!toSave.puntiDaDefinire ||
    !!toSave.firma ||
    !!toSave.vistoLinea ||
    toSave.percorso.some((p, i) => p.data || p.conChi || p.esito || p.fase !== DEFAULT_PHASES[i]) ||
    toSave.considerazioni.some((c) => c.data || c.emerso || c.approfondire || c.andamento) ||
    Object.values(toSave.tecnica).some((r) => r.label || r.score || r.note || r.key) ||
    Object.values(toSave.soft).some((r) => r.score || r.note || r.key)
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
// Report finale di valutazione (modello del cliente, Foglio 8)
// ════════════════════════════════════════════════════════════════

function emptyStep() {
  return { date: '', interlocutore: '', esito: '', media: '' }
}
function emptyFit() {
  return { text: '', fit: '' }
}
export const IV_REPORT_STEPS = [
  { key: 'step1', label: 'Preselezione CV' },
  { key: 'step2', label: '1° colloquio · HR' },
  { key: 'step3', label: '2° colloquio · responsabile / tecnico' },
  { key: 'step4', label: '3° colloquio · finale' },
  { key: 'step5', label: 'Altro · case, test, referenze' },
] as const
export const IV_REPORT_CHECKS = ['Referenze', 'Onboarding / team di inserimento', 'Altro'] as const
export const IV_REPORT_ATTACHMENTS = ['Verbali di colloquio', 'Scheda di valutazione', 'CV del candidato', 'Test / assessment', 'Referenze raccolte'] as const

export type IvReportDraft = Omit<IvReportRecord, 'savedAt'>

export function defaultIvReportDraft(role: string): IvReportDraft {
  const verifiche: IvReportDraft['verifiche'] = {}
  IV_REPORT_CHECKS.forEach((k) => {
    verifiche[k] = { done: false, responsabile: '', entro: '' }
  })
  return {
    posizione: role,
    rifCandidatura: '',
    nominativo: '',
    dataReport: '',
    aCuraDi: '',
    fasiSvolte: '',
    summary: '',
    steps: { step1: emptyStep(), step2: emptyStep(), step3: emptyStep(), step4: emptyStep(), step5: emptyStep() },
    profiloCandidato: '',
    aggregate: { tec: '', tecNote: '', soft: '', softNote: '', motiv: '', motivNote: '', culture: '', cultureNote: '', total: '0.00', extraLabel: '', extra: '', extraNote: '', andamento: '' },
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
    codice: '',
    destinatari: '',
    finalisti: '',
    fit: { ruolo: emptyFit(), team: emptyFit(), cultura: emptyFit() },
    formazione: '',
    ruoloAttuale: '',
    risultato: '',
    ralAttuale: '',
    ralAttesa: '',
    preavviso: '',
    mobilita: '',
    proposta: { livello: '', ral: '', inizio: '', limite: '' },
    verifiche,
    considerazioniHr: '',
    allegati: {},
    decisione: '',
    decisioneNote: '',
    signLinea: '',
  }
}

export function loadIvReportRecord(role: string): IvReportRecord | null {
  return readInterviewProtocol().report[role] ?? null
}

// Le schede salvate prima del Foglio 8 avevano altri esiti per fase.
const LEGACY_STEP_ESITO: Record<string, string> = { Superato: 'Avanti', 'Non superato': 'No', 'In corso': '' }

export function loadIvReportDraft(role: string): IvReportDraft {
  const saved = loadIvReportRecord(role)
  const base = defaultIvReportDraft(role)
  if (!saved) return base
  const step = (s: Partial<IvReportStep> | undefined): IvReportStep => {
    const merged = { ...emptyStep(), ...s }
    return { ...merged, esito: LEGACY_STEP_ESITO[merged.esito] ?? merged.esito }
  }
  return {
    ...base,
    ...saved,
    posizione: saved.posizione ?? role,
    steps: { step1: step(saved.steps?.step1), step2: step(saved.steps?.step2), step3: step(saved.steps?.step3), step4: step(saved.steps?.step4), step5: step(saved.steps?.step5) },
    aggregate: { ...base.aggregate, ...saved.aggregate },
    compareRows: Array.isArray(saved.compareRows) && saved.compareRows.length ? saved.compareRows.map((r) => ({ ...r })) : defaultCompareRows(),
    fit: { ...base.fit, ...saved.fit },
    proposta: { ...base.proposta, ...saved.proposta },
    verifiche: { ...base.verifiche, ...saved.verifiche },
    allegati: { ...saved.allegati },
  }
}

// Media semplice, non pesata, delle aree valutate (le quattro fisse e la
// quinta libera, se l'HR l'ha riempita): le aree vuote non contano né nella
// somma né nel divisore. Vale 0 (non null) finché non c'è un punteggio.
export function calcIvReportTotal(aggregate: { tec: string; soft: string; motiv: string; culture: string; extra?: string }): number {
  const scores = [aggregate.tec, aggregate.soft, aggregate.motiv, aggregate.culture, aggregate.extra ?? ''].map((v) => parseFloat(v)).filter((n) => !Number.isNaN(n))
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
}

export function saveIvReport(role: string, values: IvReportDraft): void {
  const state = readInterviewProtocol()
  const compareRows = values.compareRows.filter(filledCompare)
  const total = calcIvReportTotal(values.aggregate)
  const toSave: IvReportDraft = { ...values, compareRows, aggregate: { ...values.aggregate, total: total.toFixed(2) } }
  const hasContent =
    !!toSave.summary ||
    !!toSave.strengths ||
    !!toSave.risks ||
    !!toSave.profiloCandidato ||
    !!toSave.considerazioniHr ||
    !!toSave.decisione ||
    !!toSave.signHr ||
    !!toSave.signHm ||
    !!toSave.signLinea ||
    toSave.compareRows.length > 0 ||
    Object.values(toSave.steps).some((s) => s.date || s.interlocutore || s.esito || s.media) ||
    Object.values(toSave.fit).some((f) => f.text || f.fit) ||
    Object.values(toSave.verifiche).some((v) => v.done || v.responsabile || v.entro) ||
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

// ════════════════════════════════════════════════════════════════
// Sintesi IA → Report finale valutativo
// ════════════════════════════════════════════════════════════════

export type SynthesisSections = { rilevanti: string; convergenze: string; divergenze: string; criticita: string }

const SYNTHESIS_LABELS: [keyof SynthesisSections, string][] = [
  ['rilevanti', 'Elementi più rilevanti'],
  ['convergenze', 'Convergenze tra i valutatori'],
  ['divergenze', 'Divergenze tra i valutatori'],
]

/** Il Report finale di questa posizione ha già un testo che la sintesi sostituirebbe? */
export function ivReportHasSynthesisText(role: string): boolean {
  const saved = loadIvReportRecord(role)
  return !!(saved?.summary?.trim() || saved?.risks?.trim())
}

// Riporta la sintesi (già verificata e modificata dal responsabile) nel
// Report finale valutativo: sintesi → "summary", aspetti critici → "risks".
// Gli altri campi del report restano com'erano. Il report è per posizione, non
// per candidato (così è sempre stato): chi importa ne risponde.
export function importSynthesisIntoReport(role: string, candidateName: string, sections: SynthesisSections): void {
  const draft = loadIvReportDraft(role)
  const summary = SYNTHESIS_LABELS.map(([k, label]) => (sections[k].trim() ? `${label}\n${sections[k].trim()}` : '')).filter(Boolean).join('\n\n')
  saveIvReport(role, { ...draft, nominativo: candidateName || draft.nominativo, summary, risks: sections.criticita.trim() })
}
