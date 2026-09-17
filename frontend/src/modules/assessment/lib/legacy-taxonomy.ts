// Ported VERBATIM from js/assessment.js lines 2153-2448 (ICONS, NAV_CONFIG,
// SOFT_SKILLS taxonomy, APEX5D_DIMENSIONS, APEX_SOURCES, AREAS_CONFIG).
/* eslint-disable */
export const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c.6-3.6 3.3-6 6.5-6s5.9 2.4 6.5 6"/><circle cx="17.5" cy="9" r="2.6"/><path d="M15.7 14.2c2.5.4 4.4 2.5 4.8 5.3"/></svg>',
  notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M8.5 12h7M8.5 15.5h7M8.5 8.5h3"/></svg>',
  soft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M6.3 6.3l11.4 11.4M17.7 6.3 6.3 17.7"/></svg>',
  hard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z"/><path d="M3 7.5V16l9 4.5 9-4.5V7.5"/><path d="M7.5 9.75v6.5M16.5 9.75v6.5"/></svg>',
  value: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M8.5 9.3c0-1.3 1.3-2.3 3-2.3s3.2 1 3.2 2.4c0 3.1-6.7 1.6-6.7 4.8 0 1.4 1.4 2.4 3.5 2.4s3.5-1 3.5-2.4"/></svg>',
  feedback: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 20l1.1-5.4A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 11.5h8M8 8.2h5.5"/></svg>',
  ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M4.2 7.5l2.6 1.5M17.2 15l2.6 1.5M4.2 16.5l2.6-1.5M17.2 9l2.6-1.5"/><circle cx="12" cy="12" r="4.2"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v13m0 0-4.5-4.5M12 16l4.5-4.5"/><path d="M4.5 18.5v1a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2 5.3M20 6v5h-5"/></svg>',
  activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3 8 4-16 3 8h4"/></svg>',
  alertTriangle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 2.5 20h19L12 3.5Z"/><path d="M12 10v4.5"/><path d="M12 17.5h.01"/></svg>',
  sparkles: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l1.8 5.6L19.4 9l-5.6 1.8L12 16l-1.8-5.2L4.6 9l5.6-1.4L12 2z"/><path d="M19 14l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9 .9-2.6z"/></svg>',
  award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5.5"/><path d="M8.5 13 7 21l5-2.5L17 21l-1.5-8"/></svg>',
  alertCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/><path d="M12 16.5h.01"/></svg>',
  userX: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="8" r="3.5"/><path d="M2.5 20c.7-3.8 3.6-6.3 7.5-6.3s6.8 2.5 7.5 6.3"/><path d="M17 8l4 4M21 8l-4 4"/></svg>',
  checkSquare: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 12l2.5 2.5L16 9"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4.5 19.5 9.5 8 21H3v-5L14.5 4.5Z"/><path d="M12.5 6.5l5 5"/></svg>',
  chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
  chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.53 1.53 0 0 1-2.286.948c-1.372-.836-2.942.734-2.106 2.106a1.53 1.53 0 0 1-.947 2.287c-1.561.379-1.561 2.6 0 2.978a1.53 1.53 0 0 1 .947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.53 1.53 0 0 1 2.287.947c.379 1.561 2.6 1.561 2.978 0a1.53 1.53 0 0 1 2.287-.947c1.372.836 2.942-.734 2.106-2.106a1.53 1.53 0 0 1 .947-2.287c1.561-.378 1.561-2.6 0-2.978a1.53 1.53 0 0 1-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.53 1.53 0 0 1-2.287-.947z"/><circle cx="10" cy="10" r="3"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 6 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-6-3.8-9s1.3-6.3 3.8-9Z"/></svg>',
  palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.4-.3-.4-.5-.9-.5-1.4 0-1.1.9-2 2-2h1.5c1.9 0 3.5-1.6 3.5-3.5C20 6.6 16.4 3 12 3Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="9.5" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/></svg>',
  font: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>',
  userGear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.7-3.8 3.4-6.3 6.5-6.3 1 0 1.9.2 2.8.7"/><circle cx="18" cy="17.5" r="3"/><path d="M18 15v-1M18 20v-1M15.8 16.2l-.9-.5M20.9 18.8l-.9-.5M15.8 18.8l-.9.5M20.9 16.2l-.9.5"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V3m0 0-4.5 4.5M12 3l4.5 4.5"/><path d="M4.5 15.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3"/></svg>',
  fileSpreadsheet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M8 12h8M8 15.5h8M8 19h5"/></svg>',
  headset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13v-1a8 8 0 0 1 16 0v1"/><path d="M4 13.5A1.5 1.5 0 0 1 5.5 12H7a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 1 4 16.5Z"/><path d="M20 13.5a1.5 1.5 0 0 0-1.5-1.5H17a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1.5a1.5 1.5 0 0 0 1.5-1.5Z"/><path d="M20 17v1.5a3.5 3.5 0 0 1-3.5 3.5H12"/></svg>',
};

/* ---------------------- NAVIGATION CONFIGURATION ---------------------- */
export type NavConfigEntry =
  | { type: 'link'; id: string; label: string; icon: string; requires: string | null; badge?: boolean }
  | { type: 'group'; groupId: string; label: string; icon: string; items: { id: string; label: string; requires: string }[] }
  | { type: 'action'; id: string; label: string; icon: string; action: string; editOnly?: boolean }
  | { type: 'section'; label: string; editOnly?: boolean }
// Client-requested 14-section order (2026 revision). "Logica Customer
// Care" and "Caricamento Dati Risorse" (the latter already inert — see the
// openImportModal special-case in AssessmentLayout.tsx) are removed from
// the menu entirely, not just hidden — their pages/routes still exist
// (customercare in particular is left fully working, just unlisted) so no
// functionality is deleted, only the nav entries.
export const NAV_CONFIG_EN: NavConfigEntry[] = [
  { type:'link', id:'home', label:'Home', icon:'home', requires:null },
  { type:'link', id:'soft-overview', label:'Cross-Functional Competencies', icon:'soft', requires:null },
  { type:'link', id:'hard-overview', label:'Professional Competencies', icon:'hard', requires:null },
  { type:'link', id:'company', label:'Company Data', icon:'users', requires:null },
  { type:'link', id:'analisi', label:'Interview', icon:'notes', requires:null },
  { type:'link', id:'anagrafica', label:'Employee Directory', icon:'users', requires:null },
  { type:'link', id:'soft', label:'Cross-Functional Evaluation Area (Soft Skill Evaluation)', icon:'soft', requires:'A' },
  { type:'link', id:'hard', label:'Professional Evaluation Area (Hard Skill Evaluation)', icon:'hard', requires:'B' },
  { type:'link', id:'soft-risultati', label:'Cross-Functional Evaluation Results', icon:'soft', requires:'A' },
  { type:'link', id:'hard-risultati', label:'Professional Evaluation Results', icon:'hard', requires:'B' },
  { type:'link', id:'valore', label:'Overall Value', icon:'value', requires:null },
  { type:'link', id:'feedback', label:'Development Plans', icon:'feedback', requires:null, badge:true },
  { type:'link', id:'ai', label:'AI Assistant', icon:'ai', requires:null },
  { type:'action', id:'methodology', label:'Methodology Notes', icon:'notes', action:'openMethodologyModal' },
  { type:'section', label:'Admin Tools', editOnly:true },
  { type:'action', id:'reset', label:'Reset Demo', icon:'refresh', action:'confirmResetDemo', editOnly:true },
];
export const NAV_CONFIG_IT: NavConfigEntry[] = [
  { type:'link', id:'home', label:'Home', icon:'home', requires:null },
  { type:'link', id:'soft-overview', label:'Competenze Trasversali', icon:'soft', requires:null },
  { type:'link', id:'hard-overview', label:'Competenze Professionali', icon:'hard', requires:null },
  { type:'link', id:'company', label:'Dati Aziendali', icon:'users', requires:null },
  { type:'link', id:'analisi', label:'Intervista', icon:'notes', requires:null },
  { type:'link', id:'anagrafica', label:'Anagrafica', icon:'users', requires:null },
  { type:'link', id:'soft', label:'Area Valutazioni Trasversali (Valutazione delle Soft Skill)', icon:'soft', requires:'A' },
  { type:'link', id:'hard', label:'Area Valutazioni Professionali (Valutazione delle Hard Skill)', icon:'hard', requires:'B' },
  { type:'link', id:'soft-risultati', label:'Risultati Valutazioni Trasversali', icon:'soft', requires:'A' },
  { type:'link', id:'hard-risultati', label:'Risultati Valutazioni Professionali', icon:'hard', requires:'B' },
  { type:'link', id:'valore', label:'Valori Complessivi', icon:'value', requires:null },
  { type:'link', id:'feedback', label:'Piani di Sviluppo', icon:'feedback', requires:null, badge:true },
  { type:'link', id:'ai', label:'Assistenza IA', icon:'ai', requires:null },
  { type:'action', id:'methodology', label:'Note Metodologiche', icon:'notes', action:'openMethodologyModal' },
  { type:'section', label:'Strumenti Amministrazione', editOnly:true },
  { type:'action', id:'reset', label:'Reset Demo', icon:'refresh', action:'confirmResetDemo', editOnly:true },
];

/* ---------------------- TAXONOMY — 35 SOFT SKILLS (Module A) ----------------------
   Source: SOFT SKILLS AND SUB-FACTORS — 5 clusters, per the SKILL-VISION protocol */
export const SOFT_SKILLS_EN = [
  // PERSONAL COMPETENCIES
  {id:'ps1', name:'Altruism at Work', cluster:'Personal Competencies', dim:'A'},
  {id:'ps2', name:'Self-Control', cluster:'Personal Competencies', dim:'S'},
  {id:'ps3', name:'Autonomy', cluster:'Personal Competencies', dim:'C'},
  {id:'ps4', name:'Self-Confidence', cluster:'Personal Competencies', dim:'S'},
  {id:'ps5', name:'Flexibility/Adaptability', cluster:'Personal Competencies', dim:'O'},
  {id:'ps6', name:'Work Dedication', cluster:'Personal Competencies', dim:'C'},
  {id:'ps7', name:'Innovation', cluster:'Personal Competencies', dim:'O'},
  {id:'ps8', name:'Emotional Intelligence', cluster:'Personal Competencies', dim:'A'},
  {id:'ps9', name:'Motivation and Personal Effectiveness', cluster:'Personal Competencies', dim:'C'},
  {id:'ps10', name:'Persistence', cluster:'Personal Competencies', dim:'C'},
  {id:'ps11', name:'Precision and Discipline', cluster:'Personal Competencies', dim:'C'},
  {id:'ps12', name:'Stress Resistance', cluster:'Personal Competencies', dim:'S'},
  {id:'ps13', name:'Sensitivity Training', cluster:'Personal Competencies', dim:'A'},
  // ACHIEVEMENT COMPETENCIES
  {id:'re1', name:'Attention to Detail', cluster:'Achievement Competencies', dim:'C'},
  {id:'re2', name:'Goal Achievement', cluster:'Achievement Competencies', dim:'C'},
  {id:'re3', name:'Controlling', cluster:'Achievement Competencies', dim:'C'},
  {id:'re4', name:'Information Management', cluster:'Achievement Competencies', dim:'C'},
  {id:'re5', name:'Results/Commitment', cluster:'Achievement Competencies', dim:'C'},
  {id:'re6', name:'Initiative', cluster:'Achievement Competencies', dim:'E'},
  // SOCIAL COMPETENCIES
  {id:'so1', name:'Cooperation', cluster:'Social Competencies', dim:'A'},
  {id:'so2', name:'Customer Experience', cluster:'Social Competencies', dim:'A'},
  {id:'so3', name:'Customer Orientation', cluster:'Social Competencies', dim:'A'},
  {id:'so4', name:'Social Orientation', cluster:'Social Competencies', dim:'E'},
  {id:'so5', name:'Relationship Sensitivity', cluster:'Social Competencies', dim:'A'},
  // INFLUENCING COMPETENCIES
  {id:'in1', name:'Communication', cluster:'Influencing Competencies', dim:'E'},
  {id:'in2', name:'Influence and Persuasion', cluster:'Influencing Competencies', dim:'E'},
  {id:'in3', name:'Leadership', cluster:'Influencing Competencies', dim:'E'},
  // MANAGERIAL COMPETENCIES
  {id:'ma1', name:'Decision Making', cluster:'Managerial Competencies', dim:'C'},
  {id:'ma2', name:'Delegation', cluster:'Managerial Competencies', dim:'E'},
  {id:'ma3', name:'Directing', cluster:'Managerial Competencies', dim:'E'},
  {id:'ma4', name:'Analytical Thinking', cluster:'Managerial Competencies', dim:'O'},
  {id:'ma5', name:'Planning and Organization', cluster:'Managerial Competencies', dim:'C'},
  {id:'ma6', name:'Problem Solving', cluster:'Managerial Competencies', dim:'O'},
  {id:'ma7', name:'Strategy', cluster:'Managerial Competencies', dim:'O'},
  {id:'ma8', name:'Teamwork', cluster:'Managerial Competencies', dim:'A'},
];
export const SOFT_SKILLS_IT = [
  // COMPETENZE PERSONALI
  {id:'ps1', name:'Altruismo sul lavoro', cluster:'Competenze Personali', dim:'A'},
  {id:'ps2', name:'Autocontrollo', cluster:'Competenze Personali', dim:'S'},
  {id:'ps3', name:'Autonomia', cluster:'Competenze Personali', dim:'C'},
  {id:'ps4', name:'Fiducia in se stessi', cluster:'Competenze Personali', dim:'S'},
  {id:'ps5', name:'Flessibilità/Adattabilità', cluster:'Competenze Personali', dim:'O'},
  {id:'ps6', name:'Dedizione al lavoro', cluster:'Competenze Personali', dim:'C'},
  {id:'ps7', name:'Innovazione', cluster:'Competenze Personali', dim:'O'},
  {id:'ps8', name:'Intelligenza emotiva', cluster:'Competenze Personali', dim:'A'},
  {id:'ps9', name:'Motivazione ed efficacia personale', cluster:'Competenze Personali', dim:'C'},
  {id:'ps10', name:'Persistenza', cluster:'Competenze Personali', dim:'C'},
  {id:'ps11', name:'Precisione e disciplina', cluster:'Competenze Personali', dim:'C'},
  {id:'ps12', name:'Resistenza allo stress', cluster:'Competenze Personali', dim:'S'},
  {id:'ps13', name:'Formazione sulla sensibilità', cluster:'Competenze Personali', dim:'A'},
  // COMPETENZE DI REALIZZAZIONE
  {id:'re1', name:'Attenzione ai dettagli', cluster:'Competenze di Realizzazione', dim:'C'},
  {id:'re2', name:'Conseguimento degli obiettivi', cluster:'Competenze di Realizzazione', dim:'C'},
  {id:'re3', name:'Controllo', cluster:'Competenze di Realizzazione', dim:'C'},
  {id:'re4', name:'Gestione delle informazioni', cluster:'Competenze di Realizzazione', dim:'C'},
  {id:'re5', name:'Risultati/Impegno', cluster:'Competenze di Realizzazione', dim:'C'},
  {id:'re6', name:'Spirito di iniziativa', cluster:'Competenze di Realizzazione', dim:'E'},
  // COMPETENZE SOCIALI
  {id:'so1', name:'Cooperazione', cluster:'Competenze Sociali', dim:'A'},
  {id:'so2', name:'Esperienza del cliente', cluster:'Competenze Sociali', dim:'A'},
  {id:'so3', name:'Orientamento al cliente', cluster:'Competenze Sociali', dim:'A'},
  {id:'so4', name:'Orientamento sociale', cluster:'Competenze Sociali', dim:'E'},
  {id:'so5', name:'Sensibilità verso le relazioni', cluster:'Competenze Sociali', dim:'A'},
  // COMPETENZE DI INFLUENZA
  {id:'in1', name:'Comunicazione', cluster:'Competenze di Influenza', dim:'E'},
  {id:'in2', name:'Influenza e persuasione', cluster:'Competenze di Influenza', dim:'E'},
  {id:'in3', name:'Leadership', cluster:'Competenze di Influenza', dim:'E'},
  // COMPETENZE MANAGERIALI
  {id:'ma1', name:'Prendere decisioni', cluster:'Competenze Manageriali', dim:'C'},
  {id:'ma2', name:'Delega', cluster:'Competenze Manageriali', dim:'E'},
  {id:'ma3', name:'Direzione', cluster:'Competenze Manageriali', dim:'E'},
  {id:'ma4', name:'Pensiero analitico', cluster:'Competenze Manageriali', dim:'O'},
  {id:'ma5', name:'Pianificazione e organizzazione', cluster:'Competenze Manageriali', dim:'C'},
  {id:'ma6', name:'Risoluzione dei problemi', cluster:'Competenze Manageriali', dim:'O'},
  {id:'ma7', name:'Strategia', cluster:'Competenze Manageriali', dim:'O'},
  {id:'ma8', name:'Lavoro di squadra', cluster:'Competenze Manageriali', dim:'A'},
];
export const SOFT_CLUSTERS_EN = ['Personal Competencies','Achievement Competencies','Social Competencies','Influencing Competencies','Managerial Competencies'];
export const SOFT_CLUSTERS_IT = ['Competenze Personali','Competenze di Realizzazione','Competenze Sociali','Competenze di Influenza','Competenze Manageriali'];

export const BIGFIVE_DIMS_EN = {
  O: {key:'O', label:'Openness', short:'Openness'},
  C: {key:'C', label:'Conscientiousness', short:'Conscient.'},
  E: {key:'E', label:'Extraversion', short:'Extrav.'},
  A: {key:'A', label:'Agreeableness', short:'Agreeabl.'},
  S: {key:'S', label:'Emotional Stability', short:'Stability'},
};
export const BIGFIVE_DIMS_IT = {
  O: {key:'O', label:'Apertura Mentale', short:'Apertura'},
  C: {key:'C', label:'Coscienziosità', short:'Coscienz.'},
  E: {key:'E', label:'Estroversione', short:'Estrov.'},
  A: {key:'A', label:'Amicalità', short:'Amicalità'},
  S: {key:'S', label:'Stabilità Emotiva', short:'Stabilità'},
};
export const BIGFIVE_ORDER = ['O','C','E','A','S'] as const;

/* ---------------------- TAXONOMY — APEX 5D (Module B) ----------------------
   Source: COMPETENZE PROFESSIONALI Assessment.xlsx — SKILL-VISION S.r.l. Protocol
   5 dimensions x 5 items, multi-source evaluation (Manager / Peer / Self-assessment) */
export const APEX5D_DIMENSIONS_EN = [
  { code:'A', name:'Professionalism', desc:'Technical skills, knowledge, tools, decisions', items:[
    {cod:'A1', area:'Technical Skills', q:'To what extent does the employee possess and apply the technical skills required by their role?'},
    {cod:'A2', area:'Process Knowledge', q:'How well do they know the processes, procedures, and company policies relevant to their function?'},
    {cod:'A3', area:'Use of Tools', q:'How effectively do they use the tools, software, and technologies required for the role?'},
    {cod:'A4', area:'Decisions and Communication', q:'How effective are they at making well-founded decisions and communicating them clearly?'},
    {cod:'A5', area:'Knowledge Creation and Sharing', q:'To what extent do they generate new knowledge and transfer it to the team?'},
  ]},
  { code:'B', name:'Performance', desc:'Measurable goals, quality, deadlines, autonomy', items:[
    {cod:'B1', area:'Meeting Deadlines and Goals', q:'How often and how reliably does the employee meet assigned deadlines?'},
    {cod:'B2', area:'Quality of Work', q:'To what extent does the work produced meet or exceed the company\'s quality standards?'},
    {cod:'B3', area:'Contribution to Team Goals', q:'To what extent do they actively contribute to achieving collective goals?'},
    {cod:'B4', area:'Operational Autonomy', q:'How capable are they of working independently without requiring constant supervision?'},
    {cod:'B5', area:'Professional Growth and Development', q:'To what extent do they show concrete commitment to improving their skills?'},
  ]},
  { code:'C', name:'Aptitude', desc:'Adaptability, flexibility, continuous learning', items:[
    {cod:'C1', area:'Adaptability to Change', q:'How effectively do they adapt to organizational, role, or process changes?'},
    {cod:'C2', area:'Workload and Stress Management', q:'How do they handle situations of high workload or pressure?'},
    {cod:'C3', area:'Continuous Learning', q:'How quickly and thoroughly do they acquire new skills and procedures?'},
    {cod:'C4', area:'Problem Solving and Creativity', q:'How effective are they at identifying problems and finding innovative solutions?'},
    {cod:'C5', area:'Role Flexibility', q:'To what extent are they willing and able to take on functions different from their usual role?'},
  ]},
  { code:'D', name:'Mindset', desc:'Engagement, motivation, relationships, contribution', items:[
    {cod:'D1', area:'Commitment and Dedication to the Role', q:'How much consistent commitment and ownership of their responsibilities do they show?'},
    {cod:'D2', area:'Contribution to Company Goals', q:'To what extent do their actions concretely contribute to achieving company goals?'},
    {cod:'D3', area:'Active Participation', q:'With what quality do they participate in meetings, initiatives, and company projects?'},
    {cod:'D4', area:'Motivation and Mission Orientation', q:'How much intrinsic motivation and alignment with the company culture and mission do they show?'},
    {cod:'D5', area:'Interpersonal Relationships and Climate', q:'How effectively do they build positive relationships and contribute to a healthy work climate?'},
  ]},
  { code:'E', name:'Potential', desc:'Improvability, feedback, self-development, new technologies', items:[
    {cod:'E1', area:'Receiving and Using Feedback', q:'How do they use the feedback received to concretely change their behavior?'},
    {cod:'E2', area:'Self-Assessment Ability', q:'How accurate and critical is their perception of their own strengths and areas for improvement?'},
    {cod:'E3', area:'Training and Continuing Education', q:'How proactively do they take part in training activities and stay up to date in their field?'},
    {cod:'E4', area:'Adoption of New Technologies', q:'How quickly and effectively do they adopt new technologies and tools introduced in the company?'},
    {cod:'E5', area:'Personal Development Goals', q:'To what extent do they set personal and professional growth goals and work to achieve them?'},
  ]},
];
export const APEX5D_DIMENSIONS_IT = [
  { code:'A', name:'Professionalità', desc:'Competenze tecniche, conoscenze, strumenti, decisioni', items:[
    {cod:'A1', area:'Competenze tecniche', q:'In che misura il dipendente possiede e applica le competenze tecniche richieste dal suo ruolo?'},
    {cod:'A2', area:'Conoscenza dei processi', q:'Quanto conosce i processi, le procedure e le policy aziendali rilevanti per la sua funzione?'},
    {cod:'A3', area:'Utilizzo di strumenti', q:'Con quale efficacia utilizza gli strumenti, i software e le tecnologie necessari al ruolo?'},
    {cod:'A4', area:'Decisioni e comunicazione', q:'Quanto è efficace nel prendere decisioni fondate e nel comunicarle in modo chiaro?'},
    {cod:'A5', area:'Creazione e condivisione di conoscenza', q:'In che misura genera nuove conoscenze e le trasferisce al team?'},
  ]},
  { code:'B', name:'Performance', desc:'Obiettivi misurabili, qualità, scadenze, autonomia', items:[
    {cod:'B1', area:'Rispetto di scadenze e obiettivi', q:'Con quale frequenza e affidabilità il dipendente rispetta le scadenze assegnate?'},
    {cod:'B2', area:'Qualità del lavoro', q:'Quanto il lavoro prodotto soddisfa o supera gli standard qualitativi aziendali?'},
    {cod:'B3', area:'Contributo agli obiettivi di team', q:'In che misura contribuisce attivamente al raggiungimento degli obiettivi collettivi?'},
    {cod:'B4', area:'Autonomia operativa', q:'Quanto è capace di lavorare in autonomia senza richiedere supervisione continua?'},
    {cod:'B5', area:'Crescita e sviluppo professionale', q:'In che misura dimostra un impegno concreto nel migliorare le proprie competenze?'},
  ]},
  { code:'C', name:'Attitudine', desc:'Adattabilità, flessibilità, apprendimento continuo', items:[
    {cod:'C1', area:'Adattabilità al cambiamento', q:'Con quale efficacia si adatta a cambiamenti organizzativi, di ruolo o di processo?'},
    {cod:'C2', area:'Gestione del carico e dello stress', q:'Come gestisce situazioni di elevato carico lavorativo o pressione?'},
    {cod:'C3', area:'Apprendimento continuo', q:'Con quale velocità e profondità acquisisce nuove competenze e procedure?'},
    {cod:'C4', area:'Problem solving e creatività', q:'Quanto è efficace nell\'identificare problemi e trovare soluzioni innovative?'},
    {cod:'C5', area:'Flessibilità di ruolo', q:'In che misura è disponibile e capace di ricoprire funzioni diverse dal suo ruolo abituale?'},
  ]},
  { code:'D', name:'Mentalità', desc:'Coinvolgimento, motivazione, relazioni, contributo', items:[
    {cod:'D1', area:'Impegno e dedizione al ruolo', q:'Quanto impegno costante e ownership delle proprie responsabilità dimostra?'},
    {cod:'D2', area:'Contributo agli obiettivi aziendali', q:'In che misura le sue azioni contribuiscono concretamente al raggiungimento degli obiettivi aziendali?'},
    {cod:'D3', area:'Partecipazione attiva', q:'Con quale qualità partecipa a riunioni, iniziative e progetti aziendali?'},
    {cod:'D4', area:'Motivazione e orientamento alla missione', q:'Quanta motivazione intrinseca e allineamento con la cultura e la missione aziendale dimostra?'},
    {cod:'D5', area:'Relazioni interpersonali e clima', q:'Con quale efficacia costruisce relazioni positive e contribuisce a un clima di lavoro sano?'},
  ]},
  { code:'E', name:'Potenziale', desc:'Miglioramento, feedback, autosviluppo, nuove tecnologie', items:[
    {cod:'E1', area:'Ricezione e utilizzo del feedback', q:'Come utilizza il feedback ricevuto per modificare concretamente il proprio comportamento?'},
    {cod:'E2', area:'Capacità di autovalutazione', q:'Quanto è accurata e critica la sua percezione dei propri punti di forza e delle aree di miglioramento?'},
    {cod:'E3', area:'Formazione e aggiornamento continuo', q:'Con quale proattività partecipa ad attività formative e si mantiene aggiornato nel proprio settore?'},
    {cod:'E4', area:'Adozione di nuove tecnologie', q:'Con quale rapidità ed efficacia adotta nuove tecnologie e strumenti introdotti in azienda?'},
    {cod:'E5', area:'Obiettivi di sviluppo personale', q:'In che misura si pone obiettivi di crescita personale e professionale e lavora per raggiungerli?'},
  ]},
];
export const APEX_SOURCES_EN = [
  {key:'resp', label:'Manager'},
  {key:'peer', label:'Peer (Colleague)'},
  {key:'auto', label:'Self-Assessment'},
];
export const APEX_SOURCES_IT = [
  {key:'resp', label:'Responsabile'},
  {key:'peer', label:'Peer (Collega)'},
  {key:'auto', label:'Autovalutazione'},
];
export const LEVEL_ANCHORS_EN = [
  {min:1,max:2,label:'Not Adequate', color:'var(--danger)'},
  {min:3,max:4,label:'Developing', color:'var(--warning)'},
  {min:5,max:6,label:'Adequate', color:'var(--accent)'},
  {min:7,max:8,label:'Advanced', color:'var(--success)'},
  {min:9,max:10,label:'Excellent', color:'var(--gold)'},
];
export const LEVEL_ANCHORS_IT = [
  {min:1,max:2,label:'Non adeguato', color:'var(--danger)'},
  {min:3,max:4,label:'In sviluppo', color:'var(--warning)'},
  {min:5,max:6,label:'Adeguato', color:'var(--accent)'},
  {min:7,max:8,label:'Avanzato', color:'var(--success)'},
  {min:9,max:10,label:'Eccellente', color:'var(--gold)'},
];

/* ---------------------- COMPANY AREAS / ROLES (demo) ---------------------- */
export const AREAS_CONFIG = [
  { area:'Sales Area', roles:['Account Manager','Sales Representative','Business Developer'] },
  { area:'Technical Area', roles:['Technical Specialist','Technical Team Leader','Process Analyst'] },
  { area:'Administration', roles:['Administrative Clerk','Administrative Coordinator'] },
  { area:'Production', roles:['Production Operator','Line Supervisor'] },
  { area:'Customer Service', roles:['Customer Support Representative','Customer Care Manager'] },
  { area:'Human Resources', roles:['HR Specialist','HR Business Partner'] },
];

// Ported verbatim from js/assessment.js ~3022-3035 (TIER_DEFS_EN/IT) — the
// 5-tier performance classification used by Home/Overall Value/Anagrafica.
export const TIER_DEFS_EN = [
  { key: 'top', label: 'Top Talent', min: 8.3, chip: 'chip-gold' },
  { key: 'valorizzare', label: 'Talent to Develop', min: 7.0, chip: 'chip-green' },
  { key: 'adeguata', label: 'Solid Performer', min: 5.5, chip: 'chip-blue' },
  { key: 'sviluppo', label: 'Needs Development', min: 4.0, chip: 'chip-amber' },
  { key: 'critica', label: 'Critical Performer', min: -1, chip: 'chip-red' },
]
export const TIER_DEFS_IT = [
  { key: 'top', label: 'Top Talent', min: 8.3, chip: 'chip-gold' },
  { key: 'valorizzare', label: 'Talento da Valorizzare', min: 7.0, chip: 'chip-green' },
  { key: 'adeguata', label: 'Persona Adeguata', min: 5.5, chip: 'chip-blue' },
  { key: 'sviluppo', label: 'Persona da Sviluppare', min: 4.0, chip: 'chip-amber' },
  { key: 'critica', label: 'Persona Critica', min: -1, chip: 'chip-red' },
]

// Ported verbatim from js/assessment.js ~3158-3181 (PAGE_META_TEXT_EN/IT) —
// the real page header title+subtitle for each of the 10 screens (distinct
// from the shorter nav labels above).
export const PAGE_META_TEXT_EN: Record<string, { title: string; sub: string }> = {
  home: { title: 'Home', sub: 'Overall organization status' },
  'soft-overview': { title: 'Cross-Functional Competencies', sub: 'What they are and how they are measured — Soft Skills & Big Five' },
  'hard-overview': { title: 'Professional Competencies', sub: 'What they are and how they are measured — multi-source APEX 5D protocol' },
  company: { title: 'Company Profile', sub: 'Locations, contacts, headcount by type, and key company roles' },
  anagrafica: { title: 'Employee Directory', sub: 'Employee list, roles, duties, and role requirements' },
  analisi: { title: 'Interview', sub: 'Executive Human Capital Interview — Leadership perception before the objective Assessment' },
  soft: { title: 'Cross-Functional Evaluation Area', sub: 'Soft Skills & Big Five — data entry' },
  hard: { title: 'Professional Evaluation Area', sub: 'Multi-source APEX 5D Protocol — data entry' },
  'soft-risultati': { title: 'Cross-Functional Evaluation Results', sub: 'Soft Skills & Big Five — reporting' },
  'hard-risultati': { title: 'Professional Evaluation Results', sub: 'Multi-source APEX 5D Protocol — reporting' },
  valore: { title: 'Overall Individual Value', sub: 'Integration of Soft Skills + Hard Skills' },
  customercare: { title: 'Customer Care Logic', sub: 'Customer Care competency management and analysis' },
  feedback: { title: 'Development Plans', sub: 'Individual debrief and growth actions' },
  ai: { title: 'AI Assistant', sub: 'Query the dashboard in natural language' },
}
export const PAGE_META_TEXT_IT: Record<string, { title: string; sub: string }> = {
  home: { title: 'Home', sub: "Stato generale dell'organizzazione" },
  'soft-overview': { title: 'Competenze Trasversali', sub: 'Cosa sono e come si misurano — Soft Skills & Big Five' },
  'hard-overview': { title: 'Competenze Professionali', sub: 'Cosa sono e come si misurano — protocollo APEX 5D multi-source' },
  company: { title: 'Profilo Azienda', sub: 'Sedi, contatti, organico per tipologia e ruoli chiave aziendali' },
  anagrafica: { title: 'Anagrafica Risorse', sub: 'Elenco dipendenti, ruoli, mansioni e requisiti di ruolo' },
  analisi: { title: 'Intervista', sub: 'Executive Human Capital Interview — la percezione della Direzione prima della misurazione oggettiva' },
  soft: { title: 'Area Valutazioni Trasversali', sub: 'Soft Skills & Big Five — inserimento dati' },
  hard: { title: 'Area Valutazioni Professionali', sub: 'Protocollo APEX 5D multi-source — inserimento dati' },
  'soft-risultati': { title: 'Risultati Valutazioni Trasversali', sub: 'Soft Skills & Big Five — reportistica' },
  'hard-risultati': { title: 'Risultati Valutazioni Professionali', sub: 'Protocollo APEX 5D multi-source — reportistica' },
  valore: { title: 'Valore Complessivo della Persona', sub: 'Integrazione Competenze Trasversali + Competenze Professionali' },
  customercare: { title: 'Logica Customer Care', sub: 'Gestione e analisi delle competenze Customer Care' },
  feedback: { title: 'Piani di Sviluppo', sub: 'Restituzione individuale e azioni di crescita' },
  ai: { title: 'Assistente AI', sub: 'Interroga la dashboard in linguaggio naturale' },
}
