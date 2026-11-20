// Le 36 competenze dei test → i 35 identificativi di Assessment
// (PROPOSTA-ORIGINAL-SKILLS.md §3.2, tabella di confronto). Si confrontano i
// nomi senza spazi in fondo e senza maiuscole: due arrivano con uno spazio
// ("Direzione ", "Precisione e disciplina "). Valgono anche le diciture di
// Assessment, nel caso il test le adotti.
//
// "Impegno lavorativo" è la nostra ps6 (CLAUDE.md, cap. 7, 2026-10-02);
// "Engagement lavorativo" non si usa e resta fuori, come ogni nome sconosciuto.

const NAMES: Record<string, string[]> = {
  ps1: ['Altruismo lavorativo', 'Altruismo sul lavoro'],
  ps2: ['Autocontrollo'],
  ps3: ['Autonomia'],
  ps4: ['Fiducia in se stessi'],
  ps5: ['Flessibilità/adattabilità'],
  ps6: ['Impegno lavorativo', 'Dedizione al lavoro'],
  ps7: ['Innovazione'],
  ps8: ['Intelligenza emotiva'],
  ps9: ['Motivazione ed efficacia personale'],
  ps10: ['Persistenza'],
  ps11: ['Precisione e disciplina'],
  ps12: ['Resistenza allo stress'],
  ps13: ['Sensibilità alla formazione', 'Formazione sulla sensibilità'],
  re1: ['Attenzione ai dettagli'],
  re2: ['Conseguire obiettivi', 'Conseguimento degli obiettivi'],
  re3: ['Controllo', 'Controllare'],
  re4: ['Gestire le informazioni', 'Gestione delle informazioni'],
  re5: ['Risultati/sforzi', 'Risultati/impegno'],
  re6: ['Spirito di iniziativa'],
  so1: ['Cooperazione'],
  so2: ['Customer Experience', 'Esperienza del cliente'],
  so3: ['Orientamento al cliente'],
  so4: ['Orientamento sociale'],
  so5: ['Sensibilità relazionale', 'Sensibilità verso le relazioni'],
  in1: ['Comunicazione'],
  in2: ['Influenza e persuasione'],
  in3: ['Leadership'],
  ma1: ['Decision Making', 'Prendere decisioni', 'Il processo decisionale'],
  ma2: ['Delega', 'Delegazione'],
  ma3: ['Direzione'],
  ma4: ['Pensiero analitico'],
  ma5: ['Pianificazione e organizzazione'],
  ma6: ['Problem Solving', 'Risoluzione dei problemi'],
  ma7: ['Strategia'],
  ma8: ['Team Work', 'Lavoro di squadra'],
}

const key = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
const BY_NAME = new Map(Object.entries(NAMES).flatMap(([id, names]) => names.map((n) => [key(n), id] as const)))

export const SOFT_SKILL_IDS = Object.keys(NAMES)

/** L'identificativo di Assessment per un nome del test, o null se non c'è. */
export const skillIdFor = (name: string): string | null => BY_NAME.get(key(name)) ?? null
