import type { JdState } from '@/modules/recruiting/lib/jd-types'

// Tabella di conversione dei preset delle schede professionali: il testo
// inglese (o l'anglicismo evitabile) dei preset di partenza → l'italiano
// in uso (TRADUZIONI.md, gruppo D, 2026-10-02). Serve due volte:
//  - i preset in jd-presets.ts sono già scritti con i valori di destra;
//  - una scheda salvata prima della traduzione porta con sé le voci vecchie
//    (ogni scheda ha una copia delle sue voci, non un rimando al preset):
//    `convertJdState` le traduce quando la scheda si apre. La conversione è
//    idempotente e tocca solo le voci che compaiono qui: quelle scritte a
//    mano dall'utente restano come sono.
// Restano invariati, per scelta: nomi propri di strumenti e certificazioni
// (Excel, Salesforce, Prince2…), sigle (CRM, KPI, ATS, SEO), titoli delle
// posizioni (Project Manager…) e i termini che il cliente vuole tenere
// (report/reporting, feedback, team, leadership, marketing).
export const JD_LABEL_CONVERSION: Readonly<Record<string, string>> = {
  // Elenchi generici
  HR: 'Risorse umane',
  Finance: 'Finanza',
  Retail: 'Commercio al dettaglio',
  Pharma: 'Farmaceutico',
  Automotive: 'Automobilistico',
  Food: 'Alimentare',
  Energy: 'Energia',
  'Full Time': 'Tempo pieno',
  'Part Time': 'Tempo parziale',
  'Hard Skills': 'Competenze professionali',
  'Soft Skills': 'Competenze trasversali',
  // Intestazione
  'Sales & Business Development': 'Vendite e sviluppo commerciale',
  'People & Talent Acquisition': 'Persone e selezione',
  'Delivery & Operations': 'Erogazione e operazioni',
  'Direttore Operations': 'Direttore delle operazioni',
  'Customer Success': 'Successo del cliente',
  'Head of Customer Success': 'Responsabile del successo del cliente',
  // Responsabilità e attività
  'Gestione pipeline commerciale': 'Gestione delle trattative commerciali',
  'Gestione pipeline': 'Gestione delle trattative',
  'Customer Care': 'Assistenza clienti',
  'Cross Selling': 'Vendita incrociata',
  'Up Selling': 'Vendita aggiuntiva',
  Networking: 'Rete di contatti',
  'Analisi mercato': 'Analisi di mercato',
  Prospecting: 'Ricerca di potenziali clienti',
  'Cold Call': 'Chiamate a freddo',
  'Cold call': 'Chiamate a freddo',
  'Social Selling': 'Vendita tramite i social',
  'Follow-up': 'Ricontatto',
  'Prospecting outbound': 'Ricerca attiva di nuovi clienti',
  'Definizione ICP': 'Definizione del cliente ideale (ICP)',
  'Qualificazione lead': 'Qualificazione dei contatti',
  'Analisi competitor': 'Analisi dei concorrenti',
  'Espansione mercato': 'Espansione di mercato',
  'Cold outreach': 'Contatto a freddo',
  'Email sequencing': 'Sequenze di email',
  'LinkedIn outreach': 'Contatti su LinkedIn',
  'Networking eventi': 'Contatti agli eventi',
  'Demo prodotto': 'Dimostrazioni del prodotto',
  'Onboarding cliente': 'Avvio del cliente',
  Referral: 'Segnalazioni da clienti',
  'Definizione job description': 'Definizione della descrizione del ruolo',
  'Sourcing candidati': 'Ricerca dei candidati',
  'Screening CV': 'Preselezione dei CV',
  'Coordinamento hiring manager': 'Coordinamento con i responsabili delle assunzioni',
  'Presentazione shortlist': 'Presentazione della rosa dei candidati',
  'Employer branding': 'Immagine del datore di lavoro',
  'Candidate experience': 'Esperienza del candidato',
  Onboarding: 'Inserimento in azienda',
  'Sourcing su LinkedIn': 'Ricerca su LinkedIn',
  'Head hunting': 'Ricerca diretta di profili',
  'Screening telefonico': 'Colloquio telefonico preliminare',
  'Somministrazione assessment': 'Somministrazione di test di valutazione',
  'Reference check': 'Verifica delle referenze',
  'Follow-up candidati': 'Ricontatto dei candidati',
  'Feedback hiring manager': 'Feedback dei responsabili delle assunzioni',
  'Aggiornamento pipeline ATS': 'Aggiornamento delle candidature nell’ATS',
  'Eventi di recruiting': 'Eventi di selezione',
  'Gestione stakeholder': 'Gestione delle parti interessate',
  'Risk management': 'Gestione dei rischi',
  'Change management': 'Gestione del cambiamento',
  'Kick-off meeting': 'Riunione di avvio',
  'Status meeting periodici': 'Riunioni periodiche di avanzamento',
  'Gestione rischi e issue': 'Gestione di rischi e problemi',
  'Gestione change request': 'Gestione delle richieste di modifica',
  'Coordinamento cross-funzionale': 'Coordinamento tra funzioni',
  'Upselling e cross-selling': 'Vendite aggiuntive e incrociate',
  'Reporting customer health': 'Reporting sullo stato dei clienti',
  'Kick-off onboarding': 'Riunione di avvio del cliente',
  'Check-in periodici': 'Incontri periodici di verifica',
  'Business review trimestrali': 'Revisioni trimestrali con il cliente',
  'Gestione ticket escalation': 'Gestione delle segnalazioni critiche',
  'Proposte di upsell': 'Proposte di vendita aggiuntiva',
  'Survey di soddisfazione': 'Questionari di soddisfazione',
  'Documentazione best practice': 'Documentazione delle buone pratiche',
  // Competenze professionali (gruppi e voci)
  Digital: 'Digitali',
  'Digital & Strumenti': 'Digitale e strumenti',
  'Business & Strategia': 'Sviluppo e strategia',
  'Relazione & Account': 'Relazione e gestione clienti',
  'Account Management': 'Gestione dei clienti',
  'Account management': 'Gestione dei clienti',
  'Funnel di vendita': 'Imbuto di vendita',
  Funnel: 'Imbuto di conversione',
  'Sales Forecast': 'Previsione delle vendite',
  'Business Development': 'Sviluppo commerciale',
  'AI Generativa': 'IA generativa',
  'Lead Generation': 'Generazione di contatti',
  'Digital Marketing': 'Marketing digitale',
  'Email Marketing': 'Marketing via email',
  'Pipeline management': 'Gestione delle trattative',
  'Sales engagement tools': 'Strumenti di gestione dei contatti commerciali',
  'Market entry strategy': 'Strategia di ingresso nel mercato',
  'Partnership development': 'Sviluppo di partnership',
  'Pricing strategy': 'Strategia di prezzo',
  'Assessment competenze': 'Valutazione delle competenze',
  'Definizione job profile': 'Definizione del profilo di ruolo',
  'Valutazione hard/soft skills': 'Valutazione delle competenze professionali e trasversali',
  'AI Generativa per screening': 'IA generativa per la preselezione',
  'Boolean search': 'Ricerca booleana',
  'Project planning': 'Pianificazione di progetto',
  'AI Generativa per reporting': 'IA generativa per il reporting',
  'Contract management': 'Gestione dei contratti',
  Procurement: 'Approvvigionamento',
  'Quality assurance': 'Garanzia di qualità',
  'Tecniche di upselling': 'Tecniche di vendita aggiuntiva',
  'Customer onboarding': 'Avvio dei clienti',
  'Gestione escalation': 'Gestione delle segnalazioni critiche',
  'Business review': 'Revisioni con il cliente',
  'Customer success platform': 'Piattaforma per il successo del cliente',
  'AI Generativa per reportistica': 'IA generativa per la reportistica',
  // Competenze trasversali dei preset
  'Problem Solving': 'Risoluzione dei problemi',
  'Team Working': 'Lavoro in team',
  'Decision Making': 'Capacità decisionale',
  'Time Management': 'Gestione del tempo',
  // Strumenti e certificazioni
  AI: 'IA',
  'Sales certification': 'Certificazione commerciale',
  'Assessment psicometrici': 'Test psicometrici',
  'Customer Success certification': 'Certificazione Customer Success',
  // Indicatori
  'Customer Satisfaction': 'Soddisfazione del cliente',
  'Nuovi loghi acquisiti': 'Nuovi clienti aziendali acquisiti',
  'Valore pipeline generata': 'Valore delle trattative generate',
  'Tasso conversione lead-opportunità': 'Tasso di conversione da contatto a opportunità',
  'Win rate': 'Tasso di successo',
  'Numero meeting qualificati': 'Numero di incontri qualificati',
  'Time to hire': 'Tempo di assunzione',
  'Time to fill': 'Tempo di copertura della posizione',
  'Retention a 6 mesi': 'Permanenza a 6 mesi',
  'Candidate satisfaction': 'Soddisfazione dei candidati',
  'Diversità pipeline': 'Diversità delle candidature',
  'Qualità deliverable': 'Qualità dei risultati consegnati',
  'Soddisfazione stakeholder': 'Soddisfazione delle parti interessate',
  'Change request gestite': 'Richieste di modifica gestite',
  'Net Revenue Retention': 'Fatturato trattenuto netto (NRR)',
  'Churn rate': 'Tasso di abbandono',
  'Customer Health Score': 'Indice di salute del cliente',
  'Upsell/cross-sell generato': 'Vendite aggiuntive e incrociate generate',
  'Net Promoter Score': 'Net Promoter Score (NPS)',
  'Time to value': 'Tempo al primo valore',
  'Adoption rate': 'Tasso di adozione',
}

// Il testo dello scopo di due preset conteneva termini inglesi: la frase
// intera, prima e dopo, perché si confronta per intero.
export const JD_SCOPO_CONVERSION: Readonly<Record<string, string>> = {
  'Il Business Developer individua e apre nuove opportunità di mercato, costruendo pipeline commerciale da zero e portando nuovi clienti attraverso attività di prospecting outbound e partnership strategiche.':
    'Il Business Developer individua e apre nuove opportunità di mercato, costruendo da zero le trattative commerciali e portando nuovi clienti con la ricerca attiva di potenziali clienti e partnership strategiche.',
  "Il Recruiter gestisce l'intero processo di selezione, dalla definizione del profilo alla chiusura dell'offerta, garantendo qualità, velocità e una buona candidate experience.":
    "Il Recruiter gestisce l'intero processo di selezione, dalla definizione del profilo alla chiusura dell'offerta, garantendo qualità, velocità e una buona esperienza del candidato.",
}

const conv = (s: string | undefined) => (s && Object.prototype.hasOwnProperty.call(JD_LABEL_CONVERSION, s) ? JD_LABEL_CONVERSION[s] : s)

// Traduce le voci di una scheda salvata prima della traduzione dei preset.
// Restituisce una copia; la scheda salvata cambia solo al prossimo salvataggio.
export function convertJdState<T extends JdState>(jd: T): T {
  const out: T = JSON.parse(JSON.stringify(jd))
  if (out.header) {
    out.header.area = conv(out.header.area) ?? out.header.area
    out.header.riportaA = conv(out.header.riportaA) ?? out.header.riportaA
  }
  if (out.scopo && Object.prototype.hasOwnProperty.call(JD_SCOPO_CONVERSION, out.scopo)) out.scopo = JD_SCOPO_CONVERSION[out.scopo]
  for (const section of Object.values(out.sections ?? {})) {
    const items = (section as { items?: unknown }).items
    if (!Array.isArray(items)) continue
    ;(section as { items: unknown[] }).items = items.map((it) =>
      typeof it === 'string' ? (conv(it) ?? it) : it && typeof it === 'object' && 'label' in it ? { ...it, label: conv((it as { label: string }).label) } : it,
    )
  }
  out.hardSkillGroups = (out.hardSkillGroups ?? []).map((g) => ({ ...g, label: conv(g.label) ?? g.label, items: g.items.map((i) => ({ ...i, label: conv(i.label) ?? i.label })) }))
  return out
}
