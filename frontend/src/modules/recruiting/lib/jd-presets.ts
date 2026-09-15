// Ported verbatim from modules/recruiting.html ~3706-3809 (JD_LEVELS,
// JD_LANG_LEVELS, the generic JD_GEN_* lists, and all 5 JD_PROFILES presets)
// plus ~3675-3691 (SALARY_LEVELS, WELFARE_ITEMS). Pure static data — every
// string is copied exactly from source, not paraphrased or reorganized.

export const JD_LEVELS = ['Base', 'Intermedio', 'Avanzato', 'Esperto'] as const
export const JD_LANG_LEVELS = ['Non richiesto', 'Base', 'Intermedio', 'Avanzato', 'Madrelingua'] as const

export const JD_GEN_TITOLI = ['Diploma', 'Laurea Triennale', 'Laurea Magistrale', 'Master', 'MBA']
export const JD_GEN_SETTORI = ['Industria', 'Servizi', 'ICT', 'Consulenza', 'HR', 'Finance', 'Retail', 'Pharma', 'Automotive', 'Food', 'Energy', 'Pubblica Amministrazione']
export const JD_GEN_LINGUE = ['Italiano', 'Inglese', 'Francese', 'Spagnolo', 'Tedesco']
export const JD_GEN_DISPONIBILITA = ['Trasferte', 'Auto propria', 'Smart Working', 'Full Time', 'Part Time', 'Turni']
export const JD_GEN_VALUTAZIONE = [
  'Hard Skills',
  'Soft Skills',
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
    header: { titolo: 'Sales Account Manager', codice: 'SV-SAM-001', area: 'Sales & Business Development', riportaA: 'Direttore Commerciale', sede: 'Italia', modalita: 'Ibrida', contratto: 'Da definire' },
    scopo:
      'Il Sales Account Manager ha la responsabilità di sviluppare nuove opportunità commerciali, gestire il portafoglio clienti e contribuire alla crescita del fatturato aziendale attraverso attività di consulenza e vendita.',
    responsabilita: ['Ricerca nuovi clienti', 'Gestione pipeline commerciale', 'Preparazione offerte', 'Negoziazione', 'Chiusura trattative', 'Customer Care', 'Reporting', 'CRM', 'Cross Selling', 'Up Selling', 'Networking', 'Partecipazione eventi', 'Analisi mercato', 'Collaborazione Marketing'],
    attivita: ['Prospecting', 'Cold Call', 'Social Selling', 'LinkedIn', 'Follow-up', 'Gestione appuntamenti', 'Presentazioni commerciali', 'Analisi bisogni', 'Preparazione preventivi', 'Gestione trattativa', 'Firma contratto', 'Post vendita'],
    hardGroups: [
      { label: 'Commerciali', items: ['Tecniche di vendita', 'Negoziazione', 'Account Management', 'Funnel di vendita', 'Sales Forecast', 'Gestione KPI', 'Business Development', 'CRM', 'Customer Success'] },
      { label: 'Digital', items: ['LinkedIn Sales Navigator', 'Hubspot', 'Salesforce', 'Dynamics', 'Office 365', 'Excel avanzato', 'Power BI', 'Canva', 'AI Generativa', 'ChatGPT', 'Copilot'] },
      { label: 'Marketing', items: ['Lead Generation', 'Digital Marketing', 'Social Selling', 'Funnel', 'Email Marketing', 'SEO', 'SEM'] },
      { label: 'Amministrative', items: ['Preventivi', 'Contratti', 'Marginalità', 'Budget', 'Reportistica'] },
    ],
    softSkills: [['Leadership', 5], ['Comunicazione', 5], ['Problem Solving', 4], ['Pensiero Analitico', 4], ['Orientamento al Cliente', 5], ['Negoziazione', 5], ['Team Working', 4], ['Decision Making', 4], ['Gestione Stress', 4], ['Time Management', 4], ['Adattabilità', 4], ['Creatività', 3], ['Empatia', 4], ['Ascolto Attivo', 5], ['Intelligenza Emotiva', 4], ['Orientamento ai Risultati', 5], ['Pianificazione', 4], ['Precisione', 4], ['Proattività', 5], ['Etica Professionale', 5]],
    tools: ['Excel', 'CRM', 'ERP', 'AI', 'BI', 'PowerPoint', 'Teams', 'Outlook', 'Power BI', 'Microsoft Fabric', 'SQL', 'API'],
    certificazioni: ['Project Management', 'Scrum', 'Prince2', 'Microsoft', 'Google', 'Salesforce', 'Hubspot', 'ISO'],
    personalita: ['Orientamento agli obiettivi', 'Capacità di lavorare sotto pressione', 'Mentalità imprenditoriale', 'Approccio consulenziale', 'Forte autonomia', 'Affidabilità', 'Curiosità', 'Apprendimento continuo'],
    kpi: ['Nuovi clienti acquisiti', 'Valore del portafoglio clienti', 'Tasso di conversione', 'Customer Satisfaction', 'Fidelizzazione clienti', 'Ricavi generati', 'Marginalità', 'Tempo medio di chiusura trattative', 'Numero appuntamenti', 'Tasso di rinnovo'],
  },
  bd: {
    label: 'Business Developer',
    header: { titolo: 'Business Developer', codice: 'SV-BD-001', area: 'Sales & Business Development', riportaA: 'Direttore Commerciale', sede: 'Italia', modalita: 'Ibrida', contratto: 'Da definire' },
    scopo:
      'Il Business Developer individua e apre nuove opportunità di mercato, costruendo pipeline commerciale da zero e portando nuovi clienti attraverso attività di prospecting outbound e partnership strategiche.',
    responsabilita: ['Prospecting outbound', 'Definizione ICP', 'Gestione pipeline', 'Qualificazione lead', 'Presentazioni commerciali', 'Negoziazione', 'Chiusura contratti', 'Partnership strategiche', 'Analisi competitor', 'Reporting', 'Collaborazione Marketing', 'Espansione mercato'],
    attivita: ['Cold outreach', 'Cold call', 'Email sequencing', 'LinkedIn outreach', 'Networking eventi', 'Demo prodotto', 'Follow-up', 'Preparazione proposte commerciali', 'Negoziazione contrattuale', 'Onboarding cliente', 'Post vendita', 'Referral'],
    hardGroups: [
      { label: 'Vendita & Negoziazione', items: ['Prospecting outbound', 'Tecniche di negoziazione', 'Gestione ciclo vendita B2B', 'Definizione ICP', 'Sales Forecast', 'Pipeline management'] },
      { label: 'Digital & Strumenti', items: ['CRM', 'LinkedIn Sales Navigator', 'Sales engagement tools', 'Excel', 'AI Generativa', 'Copilot'] },
      { label: 'Business & Strategia', items: ['Business Development', 'Market entry strategy', 'Partnership development', 'Analisi competitor', 'Pricing strategy'] },
    ],
    softSkills: [['Resilienza', 5], ['Comunicazione persuasiva', 5], ['Ascolto attivo', 4], ['Autonomia', 5], ['Problem Solving', 4], ['Orientamento al risultato', 5], ['Adattabilità', 4], ['Curiosità', 4], ['Proattività', 5], ['Negoziazione', 5], ['Team Working', 3], ['Gestione Stress', 4], ['Creatività', 3], ['Empatia', 3], ['Pianificazione', 4]],
    tools: ['Excel', 'CRM', 'AI', 'BI', 'PowerPoint', 'Teams', 'Outlook', 'Power BI', 'SQL', 'API'],
    certificazioni: ['Sales certification', 'Hubspot Sales', 'Salesforce', 'Google', 'LinkedIn'],
    personalita: ['Mentalità imprenditoriale', 'Tolleranza al rifiuto', 'Orientamento agli obiettivi', 'Forte autonomia', 'Curiosità', 'Approccio consulenziale', 'Determinazione'],
    kpi: ['Nuovi loghi acquisiti', 'Valore pipeline generata', 'Tasso conversione lead-opportunità', 'Ciclo medio di vendita', 'Ricavi nuovi clienti', 'Win rate', 'Numero meeting qualificati'],
  },
  rec: {
    label: 'Recruiter / Talent Acquisition',
    header: { titolo: 'Recruiter / Talent Acquisition Specialist', codice: 'SV-REC-001', area: 'People & Talent Acquisition', riportaA: 'HR Manager', sede: 'Italia', modalita: 'Ibrida', contratto: 'Da definire' },
    scopo:
      "Il Recruiter gestisce l'intero processo di selezione, dalla definizione del profilo alla chiusura dell'offerta, garantendo qualità, velocità e una buona candidate experience.",
    responsabilita: ['Definizione job description', 'Sourcing candidati', 'Screening CV', 'Colloqui di selezione', 'Gestione ATS', 'Coordinamento hiring manager', 'Presentazione shortlist', 'Negoziazione offerta', 'Employer branding', 'Reporting KPI selezione', 'Candidate experience', 'Onboarding'],
    attivita: ['Pubblicazione annunci', 'Sourcing su LinkedIn', 'Head hunting', 'Screening telefonico', 'Colloqui strutturati', 'Somministrazione assessment', 'Reference check', 'Preparazione offerta', 'Follow-up candidati', 'Feedback hiring manager', 'Aggiornamento pipeline ATS', 'Eventi di recruiting'],
    hardGroups: [
      { label: 'Selezione & Valutazione', items: ['Tecniche di colloquio', 'Assessment competenze', 'Definizione job profile', 'Valutazione hard/soft skills', 'Employer branding', 'Negoziazione offerta'] },
      { label: 'Digital & Strumenti', items: ['ATS', 'LinkedIn Recruiter', 'HRIS', 'Excel', 'AI Generativa per screening', 'Boolean search'] },
      { label: 'Processo & Compliance', items: ['Normativa del lavoro', 'Privacy e GDPR candidati', 'Contrattualistica', 'Reportistica selezione'] },
    ],
    softSkills: [['Ascolto Attivo', 5], ['Empatia', 5], ['Comunicazione', 5], ['Capacità di giudizio', 4], ['Riservatezza', 5], ['Organizzazione', 4], ['Gestione Stress', 4], ['Orientamento al cliente interno', 4], ['Obiettività', 5], ['Negoziazione', 4], ['Proattività', 4], ['Precisione', 4], ['Intelligenza Emotiva', 5], ['Pazienza', 4]],
    tools: ['Excel', 'CRM', 'AI', 'BI', 'PowerPoint', 'Teams', 'Outlook'],
    certificazioni: ['Certificazione HR', 'Colloqui comportamentali', 'LinkedIn Certified Recruiter', 'Privacy/GDPR', 'Assessment psicometrici'],
    personalita: ['Riservatezza', 'Obiettività', 'Empatia', 'Precisione', 'Curiosità per le persone', 'Resistenza alla pressione', 'Etica professionale'],
    kpi: ['Time to hire', 'Time to fill', 'Qualità delle assunzioni', 'Tasso di accettazione offerte', 'Costo per assunzione', 'Retention a 6 mesi', 'Candidate satisfaction', 'Diversità pipeline'],
  },
  pm: {
    label: 'Project Manager',
    header: { titolo: 'Project Manager', codice: 'SV-PM-001', area: 'Delivery & Operations', riportaA: 'Direttore Operations', sede: 'Italia', modalita: 'Ibrida', contratto: 'Da definire' },
    scopo: 'Il Project Manager pianifica, coordina e porta a termine i progetti nel rispetto di tempi, budget e qualità attesa, gestendo team e stakeholder.',
    responsabilita: ['Pianificazione progetto', 'Gestione budget', 'Coordinamento team', 'Gestione stakeholder', 'Risk management', 'Monitoraggio avanzamento', 'Reporting periodico', 'Gestione fornitori', 'Change management', 'Chiusura e collaudo progetto'],
    attivita: ['Definizione WBS', 'Stesura Gantt', 'Kick-off meeting', 'Status meeting periodici', 'Gestione rischi e issue', 'Aggiornamento budget', 'Gestione change request', 'Coordinamento cross-funzionale', 'Reportistica avanzamento', 'Retrospettiva di progetto'],
    hardGroups: [
      { label: 'Metodologia & Pianificazione', items: ['Project planning', 'Metodologie Agile/Scrum', 'Gestione rischi', 'Gestione budget', 'Gestione stakeholder', 'Metodo del percorso critico'] },
      { label: 'Digital & Strumenti', items: ['MS Project', 'Jira', 'Asana/Trello', 'Excel avanzato', 'Power BI', 'AI Generativa per reporting'] },
      { label: 'Governance', items: ['Contract management', 'Procurement', 'Compliance normativa', 'Quality assurance'] },
    ],
    softSkills: [['Leadership', 5], ['Comunicazione', 5], ['Problem Solving', 5], ['Pianificazione', 5], ['Gestione Stress', 4], ['Decision Making', 5], ['Negoziazione', 4], ['Team Working', 4], ['Adattabilità', 4], ['Precisione', 4], ['Orientamento ai Risultati', 5], ['Gestione conflitti', 4]],
    tools: ['Excel', 'ERP', 'AI', 'BI', 'PowerPoint', 'Teams', 'Outlook', 'Power BI', 'Microsoft Fabric', 'SQL'],
    certificazioni: ['PMP', 'Prince2', 'Scrum Master', 'ITIL', 'Agile Certified Practitioner'],
    personalita: ['Leadership naturale', 'Orientamento al risultato', 'Capacità organizzativa', 'Calma sotto pressione', 'Diplomazia', 'Rigore metodologico'],
    kpi: ['Rispetto tempistiche', 'Rispetto budget', 'Qualità deliverable', 'Soddisfazione stakeholder', 'Rischi mitigati', 'Change request gestite', 'Utilizzo risorse'],
  },
  csm: {
    label: 'Customer Success Manager',
    header: { titolo: 'Customer Success Manager', codice: 'SV-CSM-001', area: 'Customer Success', riportaA: 'Head of Customer Success', sede: 'Italia', modalita: 'Ibrida', contratto: 'Da definire' },
    scopo: "Il Customer Success Manager garantisce l'adozione, la soddisfazione e la fidelizzazione dei clienti dopo la vendita, massimizzando il valore generato dal prodotto o servizio.",
    responsabilita: ['Onboarding cliente', 'Gestione relazione post-vendita', 'Monitoraggio utilizzo prodotto', 'Upselling e cross-selling', 'Gestione rinnovi', 'Rilevazione insoddisfazione', 'Raccolta feedback', 'Reporting customer health', 'Collaborazione con prodotto e supporto', 'Formazione cliente'],
    attivita: ['Kick-off onboarding', 'Check-in periodici', 'Analisi utilizzo prodotto', 'Business review trimestrali', 'Gestione ticket escalation', 'Preparazione materiale formativo', 'Proposte di upsell', 'Gestione rinnovo contrattuale', 'Survey di soddisfazione', 'Documentazione best practice'],
    hardGroups: [
      { label: 'Relazione & Account', items: ['Account management', 'Tecniche di upselling', 'Gestione rinnovi', 'Customer onboarding', 'Gestione escalation', 'Business review'] },
      { label: 'Digital & Strumenti', items: ['CRM', 'Customer success platform', 'Excel', 'Power BI', 'AI Generativa per reportistica'] },
      { label: 'Prodotto', items: ['Conoscenza approfondita del prodotto', 'Formazione utenti', 'Analisi dati di utilizzo'] },
    ],
    softSkills: [['Empatia', 5], ['Comunicazione', 5], ['Orientamento al Cliente', 5], ['Problem Solving', 4], ['Proattività', 5], ['Ascolto Attivo', 5], ['Gestione Stress', 4], ['Pazienza', 4], ['Negoziazione', 3], ['Precisione', 4], ['Team Working', 4], ['Adattabilità', 4]],
    tools: ['Excel', 'CRM', 'AI', 'BI', 'PowerPoint', 'Teams', 'Outlook', 'Power BI'],
    certificazioni: ['Customer Success certification', 'Salesforce', 'Hubspot', 'Gainsight', 'Account management'],
    personalita: ['Orientamento al cliente', 'Empatia', 'Proattività', 'Affidabilità', 'Capacità di ascolto', 'Approccio consulenziale', 'Resilienza'],
    kpi: ['Net Revenue Retention', 'Churn rate', 'Customer Health Score', 'Tasso di rinnovo', 'Upsell/cross-sell generato', 'Net Promoter Score', 'Time to value', 'Adoption rate'],
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
