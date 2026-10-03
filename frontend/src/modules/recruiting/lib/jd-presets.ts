// Ported verbatim from modules/recruiting.html ~3706-3809 (JD_LEVELS,
// JD_LANG_LEVELS, the generic JD_GEN_* lists, and all 5 JD_PROFILES presets)
// plus ~3675-3691 (SALARY_LEVELS, WELFARE_ITEMS). Pure static data. Dal
// 2026-10-02 i termini inglesi sono tradotti con la tabella di
// jd-preset-translations.ts, che converte anche le schede salvate prima.

export const JD_LEVELS = ['Base', 'Intermedio', 'Avanzato', 'Esperto'] as const
export const JD_LANG_LEVELS = ['Non richiesto', 'Base', 'Intermedio', 'Avanzato', 'Madrelingua'] as const

export const JD_GEN_TITOLI = ['Diploma', 'Laurea Triennale', 'Laurea Magistrale', 'Master', 'MBA']
export const JD_GEN_SETTORI = ['Industria', 'Servizi', 'ICT', 'Consulenza', 'Risorse umane', 'Finanza', 'Commercio al dettaglio', 'Farmaceutico', 'Automobilistico', 'Alimentare', 'Energia', 'Pubblica Amministrazione']
export const JD_GEN_LINGUE = ['Italiano', 'Inglese', 'Francese', 'Spagnolo', 'Tedesco']
export const JD_GEN_DISPONIBILITA = ['Trasferte', 'Auto propria', 'Smart Working', 'Tempo pieno', 'Tempo parziale', 'Turni']
export const JD_GEN_VALUTAZIONE = [
  'Competenze professionali',
  'Competenze trasversali',
  'Attitudini',
  'Potenziale',
  'Compatibilità culturale',
  'Motivazione',
  'Personalità',
  'Valori',
  'Leadership',
  'Capacità decisionali',
  'Capacità relazionali',
  'Intelligenza emotiva',
  'Capacità di apprendimento',
  'Affidabilità',
  'Coerenza professionale',
]

export type JdPresetId = 'sam' | 'bd' | 'rec' | 'pm' | 'csm'

export type JdPreset = {
  label: string
  header: { titolo: string; codice: string; area: string; riportaA: string; sede: string; modalita: string; contratto: string }
  scopo: string
  responsabilita: string[]
  attivita: string[]
  hardGroups: { label: string; items: string[] }[]
  softSkills: [string, number][]
  tools: string[]
  certificazioni: string[]
  personalita: string[]
  kpi: string[]
}

export const JD_PROFILES: Record<JdPresetId, JdPreset> = {
  sam: {
    label: 'Sales Account Manager',
    header: { titolo: 'Sales Account Manager', codice: 'SV-SAM-001', area: 'Vendite e sviluppo commerciale', riportaA: 'Direttore Commerciale', sede: 'Italia', modalita: 'Ibrida', contratto: 'Da definire' },
    scopo:
      'Il Sales Account Manager ha la responsabilità di sviluppare nuove opportunità commerciali, gestire il portafoglio clienti e contribuire alla crescita del fatturato aziendale attraverso attività di consulenza e vendita.',
    responsabilita: ['Ricerca nuovi clienti', 'Gestione delle trattative commerciali', 'Preparazione offerte', 'Negoziazione', 'Chiusura trattative', 'Assistenza clienti', 'Reporting', 'CRM', 'Vendita incrociata', 'Vendita aggiuntiva', 'Rete di contatti', 'Partecipazione eventi', 'Analisi di mercato', 'Collaborazione Marketing'],
    attivita: ['Ricerca di potenziali clienti', 'Chiamate a freddo', 'Vendita tramite i social', 'LinkedIn', 'Ricontatto', 'Gestione appuntamenti', 'Presentazioni commerciali', 'Analisi bisogni', 'Preparazione preventivi', 'Gestione trattativa', 'Firma contratto', 'Post vendita'],
    hardGroups: [
      { label: 'Commerciali', items: ['Tecniche di vendita', 'Negoziazione', 'Gestione dei clienti', 'Imbuto di vendita', 'Previsione delle vendite', 'Gestione KPI', 'Sviluppo commerciale', 'CRM', 'Successo del cliente'] },
      { label: 'Digitali', items: ['LinkedIn Sales Navigator', 'Hubspot', 'Salesforce', 'Dynamics', 'Office 365', 'Excel avanzato', 'Power BI', 'Canva', 'IA generativa', 'ChatGPT', 'Copilot'] },
      { label: 'Marketing', items: ['Generazione di contatti', 'Marketing digitale', 'Vendita tramite i social', 'Imbuto di conversione', 'Marketing via email', 'SEO', 'SEM'] },
      { label: 'Amministrative', items: ['Preventivi', 'Contratti', 'Marginalità', 'Budget', 'Reportistica'] },
    ],
    softSkills: [['Leadership', 5], ['Comunicazione', 5], ['Risoluzione dei problemi', 4], ['Pensiero Analitico', 4], ['Orientamento al Cliente', 5], ['Negoziazione', 5], ['Lavoro in team', 4], ['Capacità decisionale', 4], ['Gestione Stress', 4], ['Gestione del tempo', 4], ['Adattabilità', 4], ['Creatività', 3], ['Empatia', 4], ['Ascolto Attivo', 5], ['Intelligenza Emotiva', 4], ['Orientamento ai Risultati', 5], ['Pianificazione', 4], ['Precisione', 4], ['Proattività', 5], ['Etica Professionale', 5]],
    tools: ['Excel', 'CRM', 'ERP', 'IA', 'BI', 'PowerPoint', 'Teams', 'Outlook', 'Power BI', 'Microsoft Fabric', 'SQL', 'API'],
    certificazioni: ['Project Management', 'Scrum', 'Prince2', 'Microsoft', 'Google', 'Salesforce', 'Hubspot', 'ISO'],
    personalita: ['Orientamento agli obiettivi', 'Capacità di lavorare sotto pressione', 'Mentalità imprenditoriale', 'Approccio consulenziale', 'Forte autonomia', 'Affidabilità', 'Curiosità', 'Apprendimento continuo'],
    kpi: ['Nuovi clienti acquisiti', 'Valore del portafoglio clienti', 'Tasso di conversione', 'Soddisfazione del cliente', 'Fidelizzazione clienti', 'Ricavi generati', 'Marginalità', 'Tempo medio di chiusura trattative', 'Numero appuntamenti', 'Tasso di rinnovo'],
  },
  bd: {
    label: 'Business Developer',
    header: { titolo: 'Business Developer', codice: 'SV-BD-001', area: 'Vendite e sviluppo commerciale', riportaA: 'Direttore Commerciale', sede: 'Italia', modalita: 'Ibrida', contratto: 'Da definire' },
    scopo:
      'Il Business Developer individua e apre nuove opportunità di mercato, costruendo da zero le trattative commerciali e portando nuovi clienti con la ricerca attiva di potenziali clienti e partnership strategiche.',
    responsabilita: ['Ricerca attiva di nuovi clienti', 'Definizione del cliente ideale (ICP)', 'Gestione delle trattative', 'Qualificazione dei contatti', 'Presentazioni commerciali', 'Negoziazione', 'Chiusura contratti', 'Partnership strategiche', 'Analisi dei concorrenti', 'Reporting', 'Collaborazione Marketing', 'Espansione di mercato'],
    attivita: ['Contatto a freddo', 'Chiamate a freddo', 'Sequenze di email', 'Contatti su LinkedIn', 'Contatti agli eventi', 'Dimostrazioni del prodotto', 'Ricontatto', 'Preparazione proposte commerciali', 'Negoziazione contrattuale', 'Avvio del cliente', 'Post vendita', 'Segnalazioni da clienti'],
    hardGroups: [
      { label: 'Vendita & Negoziazione', items: ['Ricerca attiva di nuovi clienti', 'Tecniche di negoziazione', 'Gestione ciclo vendita B2B', 'Definizione del cliente ideale (ICP)', 'Previsione delle vendite', 'Gestione delle trattative'] },
      { label: 'Digitale e strumenti', items: ['CRM', 'LinkedIn Sales Navigator', 'Strumenti di gestione dei contatti commerciali', 'Excel', 'IA generativa', 'Copilot'] },
      { label: 'Sviluppo e strategia', items: ['Sviluppo commerciale', 'Strategia di ingresso nel mercato', 'Sviluppo di partnership', 'Analisi dei concorrenti', 'Strategia di prezzo'] },
    ],
    softSkills: [['Resilienza', 5], ['Comunicazione persuasiva', 5], ['Ascolto attivo', 4], ['Autonomia', 5], ['Risoluzione dei problemi', 4], ['Orientamento al risultato', 5], ['Adattabilità', 4], ['Curiosità', 4], ['Proattività', 5], ['Negoziazione', 5], ['Lavoro in team', 3], ['Gestione Stress', 4], ['Creatività', 3], ['Empatia', 3], ['Pianificazione', 4]],
    tools: ['Excel', 'CRM', 'IA', 'BI', 'PowerPoint', 'Teams', 'Outlook', 'Power BI', 'SQL', 'API'],
    certificazioni: ['Certificazione commerciale', 'Hubspot Sales', 'Salesforce', 'Google', 'LinkedIn'],
    personalita: ['Mentalità imprenditoriale', 'Tolleranza al rifiuto', 'Orientamento agli obiettivi', 'Forte autonomia', 'Curiosità', 'Approccio consulenziale', 'Determinazione'],
    kpi: ['Nuovi clienti aziendali acquisiti', 'Valore delle trattative generate', 'Tasso di conversione da contatto a opportunità', 'Ciclo medio di vendita', 'Ricavi nuovi clienti', 'Tasso di successo', 'Numero di incontri qualificati'],
  },
  rec: {
    label: 'Recruiter / Talent Acquisition',
    header: { titolo: 'Recruiter / Talent Acquisition Specialist', codice: 'SV-REC-001', area: 'Persone e selezione', riportaA: 'HR Manager', sede: 'Italia', modalita: 'Ibrida', contratto: 'Da definire' },
    scopo:
      "Il Recruiter gestisce l'intero processo di selezione, dalla definizione del profilo alla chiusura dell'offerta, garantendo qualità, velocità e una buona esperienza del candidato.",
    responsabilita: ['Definizione della descrizione del ruolo', 'Ricerca dei candidati', 'Preselezione dei CV', 'Colloqui di selezione', 'Gestione ATS', 'Coordinamento con i responsabili delle assunzioni', 'Presentazione della rosa dei candidati', 'Negoziazione offerta', 'Immagine del datore di lavoro', 'Reporting KPI selezione', 'Esperienza del candidato', 'Inserimento in azienda'],
    attivita: ['Pubblicazione annunci', 'Ricerca su LinkedIn', 'Ricerca diretta di profili', 'Colloquio telefonico preliminare', 'Colloqui strutturati', 'Somministrazione di test di valutazione', 'Verifica delle referenze', 'Preparazione offerta', 'Ricontatto dei candidati', 'Feedback dei responsabili delle assunzioni', 'Aggiornamento delle candidature nell’ATS', 'Eventi di selezione'],
    hardGroups: [
      { label: 'Selezione & Valutazione', items: ['Tecniche di colloquio', 'Valutazione delle competenze', 'Definizione del profilo di ruolo', 'Valutazione delle competenze professionali e trasversali', 'Immagine del datore di lavoro', 'Negoziazione offerta'] },
      { label: 'Digitale e strumenti', items: ['ATS', 'LinkedIn Recruiter', 'HRIS', 'Excel', 'IA generativa per la preselezione', 'Ricerca booleana'] },
      { label: 'Processo & Compliance', items: ['Normativa del lavoro', 'Privacy e GDPR candidati', 'Contrattualistica', 'Reportistica selezione'] },
    ],
    softSkills: [['Ascolto Attivo', 5], ['Empatia', 5], ['Comunicazione', 5], ['Capacità di giudizio', 4], ['Riservatezza', 5], ['Organizzazione', 4], ['Gestione Stress', 4], ['Orientamento al cliente interno', 4], ['Obiettività', 5], ['Negoziazione', 4], ['Proattività', 4], ['Precisione', 4], ['Intelligenza Emotiva', 5], ['Pazienza', 4]],
    tools: ['Excel', 'CRM', 'IA', 'BI', 'PowerPoint', 'Teams', 'Outlook'],
    certificazioni: ['Certificazione HR', 'Colloqui comportamentali', 'LinkedIn Certified Recruiter', 'Privacy/GDPR', 'Test psicometrici'],
    personalita: ['Riservatezza', 'Obiettività', 'Empatia', 'Precisione', 'Curiosità per le persone', 'Resistenza alla pressione', 'Etica professionale'],
    kpi: ['Tempo di assunzione', 'Tempo di copertura della posizione', 'Qualità delle assunzioni', 'Tasso di accettazione offerte', 'Costo per assunzione', 'Permanenza a 6 mesi', 'Soddisfazione dei candidati', 'Diversità delle candidature'],
  },
  pm: {
    label: 'Project Manager',
    header: { titolo: 'Project Manager', codice: 'SV-PM-001', area: 'Erogazione e operazioni', riportaA: 'Direttore delle operazioni', sede: 'Italia', modalita: 'Ibrida', contratto: 'Da definire' },
    scopo: 'Il Project Manager pianifica, coordina e porta a termine i progetti nel rispetto di tempi, budget e qualità attesa, gestendo team e stakeholder.',
    responsabilita: ['Pianificazione progetto', 'Gestione budget', 'Coordinamento team', 'Gestione delle parti interessate', 'Gestione dei rischi', 'Monitoraggio avanzamento', 'Reporting periodico', 'Gestione fornitori', 'Gestione del cambiamento', 'Chiusura e collaudo progetto'],
    attivita: ['Definizione WBS', 'Stesura Gantt', 'Riunione di avvio', 'Riunioni periodiche di avanzamento', 'Gestione di rischi e problemi', 'Aggiornamento budget', 'Gestione delle richieste di modifica', 'Coordinamento tra funzioni', 'Reportistica avanzamento', 'Retrospettiva di progetto'],
    hardGroups: [
      { label: 'Metodologia & Pianificazione', items: ['Pianificazione di progetto', 'Metodologie Agile/Scrum', 'Gestione rischi', 'Gestione budget', 'Gestione delle parti interessate', 'Metodo del percorso critico'] },
      { label: 'Digitale e strumenti', items: ['MS Project', 'Jira', 'Asana/Trello', 'Excel avanzato', 'Power BI', 'IA generativa per il reporting'] },
      { label: 'Governance', items: ['Gestione dei contratti', 'Approvvigionamento', 'Compliance normativa', 'Garanzia di qualità'] },
    ],
    softSkills: [['Leadership', 5], ['Comunicazione', 5], ['Risoluzione dei problemi', 5], ['Pianificazione', 5], ['Gestione Stress', 4], ['Capacità decisionale', 5], ['Negoziazione', 4], ['Lavoro in team', 4], ['Adattabilità', 4], ['Precisione', 4], ['Orientamento ai Risultati', 5], ['Gestione conflitti', 4]],
    tools: ['Excel', 'ERP', 'IA', 'BI', 'PowerPoint', 'Teams', 'Outlook', 'Power BI', 'Microsoft Fabric', 'SQL'],
    certificazioni: ['PMP', 'Prince2', 'Scrum Master', 'ITIL', 'Agile Certified Practitioner'],
    personalita: ['Leadership naturale', 'Orientamento al risultato', 'Capacità organizzativa', 'Calma sotto pressione', 'Diplomazia', 'Rigore metodologico'],
    kpi: ['Rispetto tempistiche', 'Rispetto budget', 'Qualità dei risultati consegnati', 'Soddisfazione delle parti interessate', 'Rischi mitigati', 'Richieste di modifica gestite', 'Utilizzo risorse'],
  },
  csm: {
    label: 'Customer Success Manager',
    header: { titolo: 'Customer Success Manager', codice: 'SV-CSM-001', area: 'Successo del cliente', riportaA: 'Responsabile del successo del cliente', sede: 'Italia', modalita: 'Ibrida', contratto: 'Da definire' },
    scopo: "Il Customer Success Manager garantisce l'adozione, la soddisfazione e la fidelizzazione dei clienti dopo la vendita, massimizzando il valore generato dal prodotto o servizio.",
    responsabilita: ['Avvio del cliente', 'Gestione relazione post-vendita', 'Monitoraggio utilizzo prodotto', 'Vendite aggiuntive e incrociate', 'Gestione rinnovi', 'Rilevazione insoddisfazione', 'Raccolta feedback', 'Reporting sullo stato dei clienti', 'Collaborazione con prodotto e supporto', 'Formazione cliente'],
    attivita: ['Riunione di avvio del cliente', 'Incontri periodici di verifica', 'Analisi utilizzo prodotto', 'Revisioni trimestrali con il cliente', 'Gestione delle segnalazioni critiche', 'Preparazione materiale formativo', 'Proposte di vendita aggiuntiva', 'Gestione rinnovo contrattuale', 'Questionari di soddisfazione', 'Documentazione delle buone pratiche'],
    hardGroups: [
      { label: 'Relazione e gestione clienti', items: ['Gestione dei clienti', 'Tecniche di vendita aggiuntiva', 'Gestione rinnovi', 'Avvio dei clienti', 'Gestione delle segnalazioni critiche', 'Revisioni con il cliente'] },
      { label: 'Digitale e strumenti', items: ['CRM', 'Piattaforma per il successo del cliente', 'Excel', 'Power BI', 'IA generativa per la reportistica'] },
      { label: 'Prodotto', items: ['Conoscenza approfondita del prodotto', 'Formazione utenti', 'Analisi dati di utilizzo'] },
    ],
    softSkills: [['Empatia', 5], ['Comunicazione', 5], ['Orientamento al Cliente', 5], ['Risoluzione dei problemi', 4], ['Proattività', 5], ['Ascolto Attivo', 5], ['Gestione Stress', 4], ['Pazienza', 4], ['Negoziazione', 3], ['Precisione', 4], ['Lavoro in team', 4], ['Adattabilità', 4]],
    tools: ['Excel', 'CRM', 'IA', 'BI', 'PowerPoint', 'Teams', 'Outlook', 'Power BI'],
    certificazioni: ['Certificazione Customer Success', 'Salesforce', 'Hubspot', 'Gainsight', 'Gestione dei clienti'],
    personalita: ['Orientamento al cliente', 'Empatia', 'Proattività', 'Affidabilità', 'Capacità di ascolto', 'Approccio consulenziale', 'Resilienza'],
    kpi: ['Fatturato trattenuto netto (NRR)', 'Tasso di abbandono', 'Indice di salute del cliente', 'Tasso di rinnovo', 'Vendite aggiuntive e incrociate generate', 'Net Promoter Score (NPS)', 'Tempo al primo valore', 'Tasso di adozione'],
  },
}

export type JdSalaryLevelDef = { key: string; label: string }
export const SALARY_LEVELS: JdSalaryLevelDef[] = [
  { key: 'junior', label: 'Junior (0–2 anni di esperienza)' },
  { key: 'middle', label: 'Middle (3–5 anni di esperienza)' },
  { key: 'senior', label: 'Senior (6+ anni di esperienza)' },
]

export type JdWelfareItemDef = { key: string; label: string; hasInput?: boolean; inputKey?: string; inputLabel?: string }
export const WELFARE_ITEMS: JdWelfareItemDef[] = [
  { key: 'buoni', label: 'Buoni pasto / ticket restaurant' },
  { key: 'auto', label: 'Auto aziendale / auto ad uso promiscuo' },
  { key: 'sanitaria', label: 'Assicurazione sanitaria integrativa' },
  { key: 'welfare', label: 'Piano welfare aziendale (flexible benefit)' },
  { key: 'smartworking', label: 'Smart working / lavoro ibrido', hasInput: true, inputKey: 'smartworkingDays', inputLabel: 'n. giorni' },
  { key: 'formazione', label: 'Formazione e percorsi di sviluppo professionale' },
  { key: 'mbo', label: 'Bonus / premio di produzione o MBO' },
  { key: 'previdenza', label: 'Contributi previdenza complementare' },
  { key: 'device', label: 'Telefono / device aziendale' },
  { key: 'other', label: 'Altro', hasInput: true, inputKey: 'otherText', inputLabel: 'specifica' },
]
