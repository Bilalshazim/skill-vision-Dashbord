// Guida alla valutazione delle Competenze Professionali (APEX 5D), dal file
// "COMPETENZE PROFESSIONALI Assessment.xlsx" (Foglio 5, Roberto Feliciani):
// la domanda di valutazione e l'indice comportamentale (1 / 5 / 10) di ogni
// voce, più i testi delle schede ISTRUZIONI e NOTE TECNICHE. Solo italiano:
// il file del cliente non ha una versione inglese.

export type Apex5dGuide = { q: string; low: string; mid: string; high: string }

export const APEX5D_GUIDE: Record<string, Apex5dGuide> = {
  A1: { q: "In che misura il dipendente possiede e applica le competenze tecniche richieste dal suo ruolo?", low: "Gravi lacune tecniche che compromettono il lavoro", mid: "Competenze adeguate al ruolo", high: "Expertise riconosciuta internamente, citata come riferimento" },
  A2: { q: "Quanto conosce i processi, le procedure e le policy aziendali rilevanti per la sua funzione?", low: "Non conosce processi base", mid: "Conosce i processi core, applica le procedure", high: "Ottimizza i processi, propone miglioramenti" },
  A3: { q: "Con quale efficacia utilizza gli strumenti, i software e le tecnologie necessari al ruolo?", low: "Difficoltà frequenti con gli strumenti base", mid: "Uso corretto e autonomo degli strumenti standard", high: "Massimizza le funzionalità, forma i colleghi" },
  A4: { q: "Quanto è efficace nel prendere decisioni fondate e nel comunicarle in modo chiaro?", low: "Decisioni imprecise, comunicazione confusa", mid: "Decisioni corrette su temi noti, comunicazione chiara", high: "Decisioni rapide anche in ambiguità, comunicazione persuasiva" },
  A5: { q: "In che misura genera nuove conoscenze e le trasferisce al team?", low: "Non documenta, non condivide", mid: "Condivide se richiesto, documentazione sufficiente", high: "Crea sistematicamente knowledge base, mentoring spontaneo" },
  B1: { q: "Con quale frequenza e affidabilità il dipendente rispetta le scadenze assegnate?", low: "Manca sistematicamente le scadenze", mid: "Rispetta le scadenze standard con promemoria", high: "Consegna sempre puntuale, anticipa i ritardi degli altri" },
  B2: { q: "Quanto il lavoro prodotto soddisfa o supera gli standard qualitativi aziendali?", low: "Qualità nettamente sotto standard, errori frequenti", mid: "Qualità nella norma, revisioni occasionali", high: "Qualità eccellente, zero revisioni, modello per gli altri" },
  B3: { q: "In che misura contribuisce attivamente al raggiungimento degli obiettivi collettivi?", low: "Lavora in modo isolato, non supporta il team", mid: "Collabora nei contesti richiesti", high: "Catalizzatore del team, supera il perimetro del suo ruolo" },
  B4: { q: "Quanto è capace di lavorare in autonomia senza richiedere supervisione continua?", low: "Richiede supervisione costante", mid: "Autonomo sui task ordinari", high: "Massima autonomia anche su task complessi o nuovi" },
  B5: { q: "In che misura dimostra impegno concreto nel migliorare le proprie competenze?", low: "Nessuna iniziativa di sviluppo", mid: "Partecipa alle formazioni obbligatorie", high: "Auto-diretto, cerca attivamente sfide formative, applica le nuove competenze" },
  C1: { q: "Con quale efficacia si adatta a cambiamenti organizzativi, di ruolo o di processo?", low: "Resistenza attiva ai cambiamenti", mid: "Accetta i cambiamenti e si adatta con il tempo", high: "Embraces il cambiamento, supporta gli altri nella transizione" },
  C2: { q: "Come gestisce situazioni di elevato carico lavorativo o pressione?", low: "Blocco operativo sotto pressione", mid: "Mantiene produttività accettabile sotto stress", high: "Eccelle sotto pressione, mantiene qualità e supporta il team" },
  C3: { q: "Con quale velocità e profondità acquisisce nuove competenze e procedure?", low: "Lentezza significativa nell'apprendere nuovi temi", mid: "Apprendimento nella norma, consolida nel tempo", high: "Apprendimento rapido e profondo, generalizza autonomamente" },
  C4: { q: "Quanto è efficace nell'identificare problemi e trovare soluzioni innovative?", low: "Difficoltà a risolvere problemi non routinari", mid: "Risolve problemi standard con approccio strutturato", high: "Anticipa i problemi, propone soluzioni creative e scalabili" },
  C5: { q: "In che misura è disponibile e capace di ricoprire funzioni diverse dal suo ruolo ordinario?", low: "Rigidità totale, rifiuta attività fuori perimetro", mid: "Disponibile se richiesto, adattamento parziale", high: "Alta versatilità, copre ruoli diversi con efficacia" },
  D1: { q: "Quanto dimostra impegno costante e ownership delle proprie responsabilità?", low: "Disimpegno evidente, fa il minimo", mid: "Impegno regolare, responsabile dei propri compiti", high: "Ownership totale, va oltre il richiesto per garantire i risultati" },
  D2: { q: "In che misura le sue azioni contribuiscono concretamente al raggiungimento degli obiettivi aziendali?", low: "Contributo marginale o non rilevabile", mid: "Contributo nella norma, allineato agli obiettivi", high: "Impatto diretto e misurabile sugli obiettivi strategici" },
  D3: { q: "Con quale qualità partecipa alle riunioni, alle iniziative e ai progetti aziendali?", low: "Presenza passiva, non contribuisce", mid: "Partecipazione standard, porta il suo punto di vista", high: "Partecipazione proattiva, propone, sintetizza, fa avanzare le discussioni" },
  D4: { q: "Quanto mostra motivazione intrinseca e allineamento con la cultura e la missione aziendale?", low: "Distacco dalla missione aziendale, motivazione assente", mid: "Motivazione adeguata, allineamento di base", high: "Ambasciatore della cultura aziendale, ispira i colleghi" },
  D5: { q: "Con quale efficacia costruisce relazioni positive e contribuisce a un clima lavorativo sano?", low: "Fonte di conflitti o tensioni nel team", mid: "Relazioni corrette, clima neutro", high: "Costruttore di fiducia, clima positivo, punto di riferimento relazionale" },
  E1: { q: "Come utilizza il feedback ricevuto per modificare concretamente il proprio comportamento?", low: "Rigetto o ignoranza del feedback", mid: "Accetta il feedback e apporta alcune modifiche", high: "Integra immediatamente il feedback, misura i progressi, chiede follow-up" },
  E2: { q: "Quanto è accurata e critica la sua percezione delle proprie aree di forza e di miglioramento?", low: "Autovalutazione distorta, scarsa consapevolezza", mid: "Consapevolezza parziale, identifica le aree macro", high: "Autovalutazione precisa, identifica sfumature, piano d'azione autonomo" },
  E3: { q: "Con quale proattività partecipa ad attività formative e si mantiene aggiornato sul settore?", low: "Evita la formazione se non obbligatoria", mid: "Partecipa alla formazione proposta", high: "Cerca formazione autonomamente, condivide le learnings, propone nuovi temi" },
  E4: { q: "Con quale velocità ed efficacia adotta nuove tecnologie e strumenti introdotti in azienda?", low: "Resistenza o difficoltà significativa con le novità tecnologiche", mid: "Adozione nei tempi standard", high: "Early adopter, ottimizza l'uso, supporta i colleghi nell'adozione" },
  E5: { q: "In che misura si pone obiettivi di crescita personale e professionale e lavora per raggiungerli?", low: "Nessun obiettivo di sviluppo dichiarato o perseguito", mid: "Obiettivi presenti, progressi parziali", high: "Obiettivi SMART, progressi documentati, allineati agli obiettivi aziendali" },
}

export const APEX5D_INSTRUCTIONS = {
  title: 'Istruzioni operative di valutazione',
  intro: 'APEX 5D – Valutazione multi-source delle competenze professionali percepite. Protocollo SKILL-VISION S.r.l.',
  scale: [
    { range: '1 – 2', label: 'Non adeguato', text: 'Il comportamento è assente o nettamente al di sotto delle aspettative del ruolo' },
    { range: '3 – 4', label: 'In sviluppo', text: 'Il comportamento è presente in modo discontinuo; richiede supporto frequente' },
    { range: '5 – 6', label: 'Adeguato', text: 'Il comportamento è stabile e coerente con le aspettative standard del ruolo' },
    { range: '7 – 8', label: 'Avanzato', text: 'Il comportamento supera le aspettative; è un punto di riferimento per il team' },
    { range: '9 – 10', label: 'Eccellente', text: 'Il comportamento è un benchmark aziendale; trasferisce valore agli altri' },
  ],
  steps: [
    'Ogni valutatore (Responsabile, Collega, Dipendente stesso) compila il foglio del proprio ruolo.',
    'Per ogni item inserire un punteggio da 1 a 10 e, obbligatoriamente, un esempio nelle note.',
    'La dashboard aggrega automaticamente i punteggi e calcola il Profilo APEX 5D.',
    'Il confronto tra Autovalutazione, Peer e Responsabile evidenzia gap di percezione.',
    'Il punteggio complessivo alimenta la matrice Competenze vs Potenziale (9-Box).',
  ],
}

export const APEX5D_TECH_NOTES = {
  title: 'Note tecniche',
  rows: [
    { name: 'Performance Appraisal', when: 'Valutazione periodica della prestazione', maps: 'Sezioni B (obiettivi) + D (coinvolgimento)' },
    { name: 'Competency Assessment', when: 'Valutazione delle competenze rispetto a un profilo atteso', maps: 'Sezioni A (competenze) + C (adattamento)' },
    { name: '360° Feedback', when: 'Quando il valutatore può essere collega, capo o subordinato', maps: 'Tutto il form, se multi-fonte' },
    { name: 'Behaviorally Anchored Rating Scale (BARS)', when: 'Quando si aggiungono descrittori comportamentali per ogni punteggio', maps: 'Il form potrebbe diventarlo' },
    { name: 'Multi-Rater Assessment', when: 'Quando più figure valutano lo stesso soggetto', maps: 'Esattamente il caso di colleghi + capi' },
    { name: 'Perceived Competency Inventory', when: 'Valutazione percepita delle competenze (non test oggettivo)', maps: 'Il framing è corretto: si misura il percepito' },
  ],
  suggestions: [
    { title: 'Aggiungere un peso relativo in base alla dimensione per i diversi settori', text: 'Non tutte le 5 aree valgono lo stesso per ogni ruolo. Un modello maturo prevede pesi differenziali per ruolo (es. per un tecnico, A pesa 40%; per un manager, D pesa 30%).' },
    { title: 'Includere spazio per note qualitative obbligatorie, ove possibile', text: 'Un campo obbligatorio per "esempio a supporto del punteggio" riduce drasticamente i bias di valutazione.' },
  ],
}
