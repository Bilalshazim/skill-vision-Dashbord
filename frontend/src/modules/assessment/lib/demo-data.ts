import { APEX5D_DIMENSIONS_IT, APEX_SOURCES_IT, AREAS_CONFIG, SOFT_SKILLS_IT } from '@/modules/assessment/lib/legacy-taxonomy'
import { uid } from '@/modules/assessment/lib/legacy-utils'
import type { AssessmentState, Employee, ExiData } from '@/modules/assessment/lib/types'

// Ported verbatim from js/assessment.js ~2650-2874 (DEMO_NOMI, DEMO_COGNOMI,
// ROLE_FOCUS_SKILLS, seedRandom, pickArchetype, ARCHETYPE_BASE,
// genEmployeeScores, CCNL_LEVELS_DEMO, BENEFIT_OPTIONS_DEMO,
// COLLABORATOR_LETTER_TEMPLATE, generateDemoData). Same deterministic seed
// (20260724) so a fresh install generates the EXACT SAME population legacy
// does. IDs (skill id / APEX cod / source key) are language-invariant, so
// the IT taxonomy arrays are used as the canonical source regardless of the
// UI's current display language — exactly like legacy, whose demo generator
// always ran against whichever taxonomy happened to be active at first
// boot (IT, since that's the default).
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

const DEMO_NOMI = ['Marco', 'Giulia', 'Alessandro', 'Francesca', 'Andrea', 'Chiara', 'Matteo', 'Sara', 'Davide', 'Elena', 'Luca', 'Valentina', 'Simone', 'Martina', 'Federico', 'Alessia', 'Riccardo', 'Silvia', 'Giovanni', 'Laura', 'Stefano', 'Elisa', 'Nicola', 'Federica', 'Antonio', 'Ilaria']
const DEMO_COGNOMI = ['Bianchi', 'Ferrari', 'Russo', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Costa', 'Fontana', 'Rinaldi', 'Moretti', 'Rizzo', 'Barbieri', 'Villa', 'Longo', 'Mancini', 'Grasso', 'Pellegrini', 'Leone', 'Rossi', 'Romano', 'Ferrara']

export const ROLE_FOCUS_SKILLS: Record<string, string[]> = {
  'Account Manager': ['in1', 'in2', 'so3', 'ma1', 'ps9'],
  'Sales Representative': ['in1', 'in2', 'in3', 'so3', 'ps10'],
  'Business Developer': ['in2', 'ma7', 'ma6', 'ps7', 'so4'],
  'Technical Specialist': ['re1', 're4', 'ma4', 'ps11', 'ma6'],
  'Technical Team Leader': ['ma3', 'ma2', 'in1', 'ma1', 'so5'],
  'Process Analyst': ['ma4', 're4', 're1', 'ma6', 'ps11'],
  'Administrative Clerk': ['re1', 're3', 'ps11', 're4', 'ps6'],
  'Administrative Coordinator': ['ma1', 'ma5', 'ma3', 're2', 'so1'],
  'Production Operator': ['re3', 'ps11', 'ps2', 're5', 'ps12'],
  'Line Supervisor': ['ma3', 'ma1', 're2', 'so1', 'ps12'],
  'Customer Support Representative': ['so2', 'so3', 'in1', 'ps8', 'ps2'],
  'Customer Care Manager': ['so2', 'so3', 'ma3', 'in1', 'ma1'],
  'HR Specialist': ['so5', 'ps8', 'in1', 'so1', 'ps13'],
  'HR Business Partner': ['ma1', 'so5', 'in2', 'ma3', 'ps8'],
}

function seedRandom(seed: number) {
  let t = seed
  return function () {
    t |= 0
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function pickArchetype(rnd: () => number): string {
  const r = rnd()
  if (r < 0.09) return 'top'
  if (r < 0.34) return 'high'
  if (r < 0.74) return 'solid'
  if (r < 0.93) return 'developing'
  return 'critical'
}
const ARCHETYPE_BASE: Record<string, number> = { top: 9.0, high: 7.7, solid: 6.2, developing: 4.7, critical: 3.1 }

function genEmployeeScores(rnd: () => number, archetype: string, roleFocus: string[]) {
  const base = ARCHETYPE_BASE[archetype]
  const soft: Employee['soft'] = {}
  SOFT_SKILLS_IT.forEach((s) => {
    const noise = (rnd() - 0.5) * 2.4
    const ottenuto = clamp(Math.round(base + noise), 1, 10)
    const isFocus = roleFocus.includes(s.id)
    const atteso = isFocus ? 8 : 6
    soft[s.id] = { ottenuto, atteso }
  })
  const sourceBias: Record<string, number> = { resp: 0, peer: (rnd() - 0.5) * 0.7, auto: 0.3 + rnd() * 1.1 }
  const hard: Employee['hard'] = { resp: {}, peer: {}, auto: {} }
  APEX5D_DIMENSIONS_IT.forEach((dim) => {
    dim.items.forEach((it) => {
      APEX_SOURCES_IT.forEach((src) => {
        const noise = (rnd() - 0.5) * 2.2
        const v = clamp(Math.round(base + sourceBias[src.key] + noise), 1, 10)
        ;(hard[src.key as 'resp' | 'peer' | 'auto'] as Record<string, number>)[it.cod] = v
      })
    })
  })
  return { soft, hard }
}

const CCNL_LEVELS_DEMO = ['Impiegato 2° livello', 'Impiegato 3° livello', 'Impiegato 4° livello', 'Impiegato 5° livello', 'Quadro']
const BENEFIT_OPTIONS_DEMO = ['Buoni pasto', 'Auto aziendale', 'Assicurazione sanitaria', 'Smart working', 'Buoni pasto, Assicurazione sanitaria']

// Mandatory pre-test cover letter — ported verbatim (js/assessment.js ~2731-2793).
export const COLLABORATOR_LETTER_TEMPLATE = `LETTERA AI COLLABORATORI

Gentile Collaboratore,
la Tua Azienda, in collaborazione con SKILL-VISION, società di consulenza aziendale con oltre vent'anni di esperienza, ha avviato un progetto dedicato alla conoscenza e alla valorizzazione delle competenze delle proprie persone.
L'obiettivo è semplice e importante: conoscere meglio le caratteristiche, le attitudini e le competenze di ciascun collaboratore, per favorire una migliore valorizzazione delle persone all'interno dell'organizzazione.
Conoscere le proprie competenze, infatti, può aiutare a individuare attività e responsabilità più in sintonia con le proprie caratteristiche, favorendo sia le esigenze dell'Azienda sia, soprattutto, la crescita professionale di ciascuno.

Il questionario
Ti verrà richiesto di compilare un questionario dedicato alle competenze trasversali (Soft Skills) e ad alcuni aspetti legati, tra gli altri, all'Intelligenza Emotiva.
La compilazione richiede circa 10-12 minuti ma il tempo che ci impiegherai non sarà influente.
Non è una prova da superare e non esistono risposte giuste o sbagliate.
Ciò che conta maggiormente è rispondere in modo spontaneo, sincero e autentico, scegliendo le risposte che descrivono realmente il Tuo modo di essere e di comportarti.
Il test è stato progettato per il mondo del lavoro e validato in ambito universitario.
I risultati saranno elaborati attraverso un sistema esperto e successivamente rappresentati sulla piattaforma SKILL-VISION.
Il sistema è inoltre in grado di rilevare eventuali incongruenze o contraddizioni nelle risposte: per questo motivo, cercare di fornire la risposta che si ritiene "più corretta" potrebbe rendere il risultato meno rappresentativo.
Più sarai spontaneo e sincero, più il risultato potrà rappresentare fedelmente le Tue caratteristiche e diventare uno strumento utile per il Tuo percorso professionale.
Il test presenta un'affidabilità dichiarata superiore al 92%.

Perché le Soft Skills sono importanti?
Le Soft Skills sono l'insieme delle nostre abilità personali e interpersonali: il modo in cui comunichiamo, collaboriamo, affrontiamo le difficoltà, gestiamo le situazioni, prendiamo decisioni e ci adattiamo ai cambiamenti.
Non riguardano quindi soltanto ciò che sappiamo fare dal punto di vista tecnico, ma come utilizziamo le nostre capacità nel contesto professionale.
Conoscere queste caratteristiche può rappresentare un valore sia per la persona sia per l'organizzazione.
Per il collaboratore significa avere una maggiore consapevolezza dei propri punti di forza e delle aree sulle quali poter crescere.
Per l'Azienda significa poter valorizzare meglio le persone, favorendo l'incontro tra competenze, attitudini, ruoli e responsabilità.
In altre parole: la persona giusta nel ruolo giusto.

Come compilare il test
Troverai una serie di affermazioni e dovrai semplicemente scegliere quelle che senti più vicine al Tuo modo di essere, pertanto Ti consigliamo di:
• rispondere con spontaneità;
• essere sincero;
• non cercare di immaginare quale possa essere la risposta "migliore";
• non lasciarti condizionare da ciò che pensi possa essere più apprezzato.
Non devi dimostrare nulla: devi semplicemente raccontare, attraverso le Tue risposte, chi sei professionalmente.
La qualità del risultato dipende soprattutto dalla Tua autenticità.

Prima di iniziare
Accedi al questionario attraverso il link che Ti è stato fornito e, se possibile, compila in modo completo la prima pagina, inserendo anche una fotografia.
A questo punto sei pronto per iniziare.

🔗 Link al questionario: {{LINK}}

Prenditi qualche minuto per Te: conoscere meglio le proprie competenze è il primo passo per poterle valorizzare.
Grazie per la collaborazione e per il tempo che vorrai dedicare a questa iniziativa.
Buona compilazione!

Cosa sono le Soft Skills?
Sono un insieme di abilità personali e interpersonali che influenzano il nostro modo di interagire con gli altri, affrontare le situazioni professionali e gestire la nostra vita lavorativa.
Non sono quindi competenze tecniche specifiche del mestiere, ma caratteristiche e capacità personali che utilizziamo ogni giorno nel lavoro.
Perché sono importanti?
Le Soft Skills sono importanti tanto per il collaboratore quanto per l'Azienda.
Sono infatti determinanti nella capacità di collaborare, comunicare, adattarsi ai cambiamenti, affrontare problemi e costruire relazioni professionali efficaci.
Perché identificarle e valorizzarle?
Conoscere le proprie competenze trasversali permette di acquisire una maggiore consapevolezza dei propri punti di forza e delle proprie aree di sviluppo.
Per l'organizzazione significa poter valorizzare meglio le persone e favorire una maggiore coerenza tra competenze, attitudini, ruoli e responsabilità.
L'obiettivo è creare una situazione nella quale ciascuno possa esprimere al meglio il proprio potenziale.

Privacy
I dati inseriti saranno trattati nel rispetto della normativa vigente in materia di protezione dei dati personali e del Regolamento Europeo GDPR (UE) 2016/679.
I risultati saranno visionati esclusivamente da personale autorizzato e qualificato e utilizzati per le finalità previste dal progetto, nel rispetto della normativa sulla privacy.

SKILL-VISION
Human Capital Intelligence - Conoscere le persone. Comprendere il potenziale. Creare valore.
info@skill-vision.it · www.skill-vision.it`

// Ported verbatim from exiDefaultData() (js/assessment.js ~5844-5861) — the
// demo Executive Interview record used to seed a fresh install.
export function exiDefaultData(): ExiData {
  return {
    completed: true,
    azienda: 'Demo Company S.r.l.',
    settore: 'Servizi professionali',
    intervistato: 'Marco Bianchi',
    ruolo: 0,
    dipendenti: '85',
    data: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }),
    q1: 6.5,
    q1c: 'Abbiamo persone valide, ma non tutte esprimono il massimo del loro potenziale nel ruolo attuale.',
    q2: 5.0,
    q2c: 'Manca un sistema strutturato per individuare in modo oggettivo chi ha margini di crescita inespressi.',
    aree: { '9': 8, '2': 6, '5': 5 },
    q3c: "Il turnover nell'area Customer Service resta la criticità più urgente.",
    q3Altro: ['', '', ''],
    q4: 6.5,
    q4c: 'Alcuni ruoli chiave sono stati assegnati più per necessità organizzativa che per reale idoneità.',
    q5: 6,
    rischi: ['Turnover elevato in Customer Service', 'Gap di leadership nel middle management', 'Difficoltà a pianificare le successioni chiave'],
    q6: 7.5,
    obiettivi: ['Mappare oggettivamente le competenze', 'Individuare i talenti da valorizzare', 'Definire le priorità di formazione'],
    decisioni: [0, 1, 3, 5],
    q7c: 'Vorremmo uno strumento che il team HR possa usare in autonomia.',
    q7Altro: ['', ''],
  }
}

// Ported verbatim from exiBlankData() (~5862-5875) — the "start a fresh
// interview" state, used by exiNewInterview().
export function exiBlankData(companyName: string): ExiData {
  return {
    completed: false,
    azienda: companyName || '',
    settore: '',
    intervistato: '',
    ruolo: 0,
    dipendenti: '',
    data: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }),
    q1: 7,
    q1c: '',
    q2: 6,
    q2c: '',
    aree: {},
    q3c: '',
    q3Altro: ['', '', ''],
    q4: 7,
    q4c: '',
    q5: 5,
    rischi: ['', '', ''],
    q6: 7,
    obiettivi: ['', '', ''],
    decisioni: [],
    q7c: '',
    q7Altro: ['', ''],
  }
}

// Ported verbatim from generateDemoData() (js/assessment.js ~2794-2874).
// Same deterministic seed as legacy — a fresh React install generates the
// exact same demo population, byte-for-byte, as a fresh legacy install.
export function generateDemoData(): AssessmentState {
  const rnd = seedRandom(20260724)
  const evaluators = ['Giulia Bianchi', 'Marco Rossi', 'Elena Ferrari', 'Davide Conti']
  const employees: Employee[] = []
  AREAS_CONFIG.forEach((areaCfg) => {
    areaCfg.roles.forEach((role) => {
      const count = 1 + Math.floor(rnd() * 2.4)
      for (let k = 0; k < count; k++) {
        const nome = DEMO_NOMI[Math.floor(rnd() * DEMO_NOMI.length)]
        const cognome = DEMO_COGNOMI[Math.floor(rnd() * DEMO_COGNOMI.length)]
        const archetype = pickArchetype(rnd)
        const roleFocus = ROLE_FOCUS_SKILLS[role] || []
        const scores = genEmployeeScores(rnd, archetype, roleFocus)
        const ralBase = archetype === 'top' ? 42000 : archetype === 'critical' ? 26000 : 30000
        const ral = Math.round((ralBase + rnd() * 20000) / 500) * 500
        const assenzeProgrammate = rnd() < 0.2 ? [{ dal: '2026-08-10', al: '2026-08-24', motivo: 'Ferie estive' }] : []
        const tRand = rnd()
        const emp: Employee = {
          id: uid('emp'),
          nome,
          cognome,
          email: (nome + '.' + cognome).toLowerCase().replace(/\s+/g, '') + '@democompany.com',
          area: areaCfg.area,
          reparto: '',
          ruolo: role,
          mansione: 'Attività operative e di supporto per ' + role.toLowerCase(),
          tipoProfilo: 'Employee',
          tipoContratto: tRand < 0.84 ? 'dipendente' : tRand < 0.9 ? 'cocopro' : tRand < 0.96 ? 'partitaIva' : 'esterno',
          sesso: rnd() < 0.5 ? 'F' : 'M',
          livelloCcnl: CCNL_LEVELS_DEMO[Math.floor(rnd() * CCNL_LEVELS_DEMO.length)],
          ral,
          benefit: BENEFIT_OPTIONS_DEMO[Math.floor(rnd() * BENEFIT_OPTIONS_DEMO.length)],
          assenzeProgrammate,
          archived: null,
          soft: scores.soft,
          hard: scores.hard,
          hardEvaluatedBy: { resp: evaluators[Math.floor(rnd() * evaluators.length)], peer: evaluators[Math.floor(rnd() * evaluators.length)], auto: nome + ' ' + cognome },
          hardHistory: [],
          softHistory: [],
          feedbackNeeded: archetype === 'critical' || archetype === 'developing' || rnd() < 0.15,
          developmentPlan: { azioni: '', formazione: '', coaching: '', obiettivi: '' },
          _archetype: archetype,
        }
        employees.push(emp)
      }
    })
  })
  const roleProfiles: AssessmentState['roleProfiles'] = {}
  Object.keys(ROLE_FOCUS_SKILLS).forEach((role) => {
    roleProfiles[role] = { requiredSkills: ROLE_FOCUS_SKILLS[role] }
  })

  return {
    settings: {
      modulo: 'AB',
      companyName: 'Demo Company S.r.l.',
      testsAcquired: 50,
      testsDispatched: 32,
      surveyLink: '',
      softSkillTargets: {},
      surveySenderMode: 'referente',
      adminSenderEmail: '',
      actionNotes: {},
      preTestLetter: COLLABORATOR_LETTER_TEMPLATE,
      surveyEmailSubject: 'Questionario di valutazione delle competenze',
      surveyEmailBody: 'Ciao {{NOME}},\n\n[Testo standard da inserire — verrà fornito dal cliente]\n\nPer completare il questionario di valutazione delle Competenze Trasversali, utilizza il link seguente:\n\n{{LINK}}\n\nGrazie.',
      emailApiEndpoint: '',
      emailApiKey: '',
    },
    employees,
    evaluators,
    roleProfiles,
    evalAssignments: [],
    evalPeriods: [{ id: uid('period'), label: 'Periodo corrente', date: new Date().toISOString().slice(0, 10) }],
    analisiIniziale: exiDefaultData(),
    company: {
      locations: [{ name: 'Sede Centrale', address: 'Via Roma 12', city: 'Milano' }],
      contacts: [{ label: 'Risorse Umane', name: 'Laura Moretti', email: 'hr@democompany.com', phone: '+39 02 1234567' }],
      referente: { name: 'Laura Moretti', email: 'hr@democompany.com', phone: '+39 02 1234567' },
      ceo: { name: 'Alberto Colombo', email: 'ceo@democompany.com' },
      cfo: { name: 'Sara Ricci', email: 'cfo@democompany.com' },
    },
  }
}
