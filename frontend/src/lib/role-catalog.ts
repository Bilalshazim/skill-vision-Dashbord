// Le posizioni preconfigurate dell'applicazione, per area aziendale: 20 aree,
// 90 voci, dall'elenco completo del vecchio modulo (ROLES92 di Apex-5D.html,
// Foglio 6 di Roberto Feliciani). Alcune posizioni stanno in due aree (per
// esempio Buyer in "Logistica e Supply Chain" e in "Acquisti"): come nell'originale.
// La voce "ALTRO" dell'originale non c'è: la posizione libera è una funzione
// del selettore (RoleCombobox), non una voce dell'elenco.

export type RoleCatalogArea = { area: string; roles: string[] }

export const ROLE_CATALOG: RoleCatalogArea[] = [
  { area: "Direzione Generale", roles: ["CEO", "Amministratore Delegato", "Direttore Generale", "Imprenditore", "General Manager"] },
  { area: "Amministrazione e Finanza", roles: ["CFO  Contabile, Tesoriere", "Responsabile Amministrativo", "Controller", "Contabile", "Tesoriere"] },
  { area: "Risorse Umane (HR)", roles: ["HR Manager", "HR Business Partner", "Recruiter", "Payroll", "Training Manager"] },
  { area: "Commerciale e Vendite", roles: ["Direttore Commerciale", "Sales Manager", "Area Manager", "Key Account", "Business Developer", "Agente"] },
  { area: "Marketing e Comunicazione", roles: ["Marketing Manager", "Digital Marketing Manager", "Brand Manager", "Social Media Manager", "Communication Manager"] },
  { area: "Customer Service", roles: ["Customer Service Manager", "Customer Care", "After Sales Manager", "Technical Support"] },
  { area: "Produzione e Operations", roles: ["Operations Manager", "Production Manager", "Plant Manager", "Capo Reparto", "Capo Turno"] },
  { area: "Logistica e Supply Chain", roles: ["Supply Chain Manager", "Logistics Manager", "Buyer", "Procurement Manager", "Warehouse Manager"] },
  { area: "Qualità, Sicurezza e Ambiente", roles: ["Quality Manager", "HSE Manager", "RSPP", "ESG Manager", "Sustainability Manager"] },
  { area: "Ricerca e Sviluppo (R&D)", roles: ["R&D Manager", "Innovation Manager", "Product Manager", "Ricercatore", "Progettista"] },
  { area: "Ingegneria e Progettazione", roles: ["Engineering Manager", "Mechanical Engineer", "Electrical Engineer", "CAD Designer"] },
  { area: "Information Technology (IT)", roles: ["CIO", "IT Manager", "System Administrator", "Software Developer", "Data Analyst", "AI Specialist"] },
  { area: "Project Management", roles: ["Project Manager", "Program Manager", "PMO Manager"] },
  { area: "Acquisti", roles: ["Procurement Manager", "Buyer", "Purchasing Specialist"] },
  { area: "Export e Internazionale", roles: ["Export Manager", "International Sales Manager", "Export Area Manager"] },
  { area: "Legale e Compliance", roles: ["Legal Manager", "Compliance Officer", "DPO", "Internal Auditor"] },
  { area: "Retail e Negozi", roles: ["Store Manager", "Responsabile Punto Vendita", "Visual Merchandiser", "Addetto Vendite"] },
  { area: "Edilizia", roles: ["Direttore Tecnico", "Direttore Cantiere", "Capo Cantiere", "Geometra"] },
  { area: "Turismo e Hospitality", roles: ["Hotel Manager", "Restaurant Manager", "Chef", "Front Office Manager"] },
  { area: "Servizi Professionali", roles: ["Consulente", "Commercialista", "Avvocato", "Ingegnere", "Architetto", "Fractional manager"] },
]
