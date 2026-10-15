# Progetto — Assessment sul server

Data: 2026-09-30. Documento separato dalla migrazione: CLAUDE.md (cap. 7,
"Decise dal cliente") chiede di analizzare, stimare e proporre, **non** di
implementarlo dentro la migrazione. Qui ci sono l'analisi, la proposta e la
stima. Nessuna riga del backend è stata toccata.

## 1. Perché è un progetto solo

Tre richieste del cliente sembrano separate e hanno la stessa condizione:

| Richiesta | Cosa manca oggi |
|---|---|
| **Valutatore esterno** di Assessment con il token del backend, come in Recruiting (MAPPATURA §8.2) | il backend non sa chi sono i dipendenti né che cosa va valutato |
| **Invio del link al test** in Assessment con il meccanismo di Recruiting (spunta dei nominativi → invio dal server) | il server non conosce i destinatari: i dipendenti, con la loro email, vivono solo nel browser |
| **Holding → società**: più società per gruppo, assessment ripetuti nel tempo, confronto fra dipendenti di società diverse con mansione uguale o di pari valore | i dati di una società stanno nel browser di chi li ha inseriti: due persone della stessa società vedono due Assessment diversi, e due società non si possono confrontare |

La condizione comune: **i dati di Assessment devono stare sul backend.**
Oggi sono **due** oggetti JSON in `localStorage` (corretto il 2026-10-14:
il secondo è nato il 12/10, dopo questa analisi): `sv_assessment_state_v1`
(impostazioni, dipendenti con storico soft/hard, valutatori, profili di
mansione, assegnazioni delle valutazioni, periodi, Intervista, profilo
aziendale) e `sv5p_state_v1` (Valutazione 5P: persone, piano, schede
raccolte, valori attesi). Cancellare i dati del browser cancella
l'Assessment. Il piano di esecuzione è al §8.

Farli uno per uno vorrebbe dire rifare tre volte lo stesso modello dati.

## 2. Cosa c'è già sul backend e si riusa

- **`Platform` → `Company`** (`Company.platformId`, facoltativo e non unico,
  lasciato così apposta per "una piattaforma, più società"). È già la forma
  **gruppo → società**: la holding è una `Platform`, le società del gruppo le
  sue `Company`. La società singola è una `Platform` con una `Company`.
- **`Company.purchasedModules`**, i codici di attivazione, gli utenti legati
  a una società (`User.companyId`) e i ruoli.
- **Valutatori con token** (`Evaluator.accessTokenHash`, scadenza,
  `Evaluation` con bozza/inviata): oggi legati a campagne e candidati.
- **Invio email**: `SenderConfig`, `EmailTemplate`, `EmailServiceConfig`,
  `TestInvitation` / `TestResponse` con webhook idempotente. `TestInvitation`
  oggi pende da `Shortlist` (Recruiting).
- **`AuditLog`**.

## 3. Proposta

**Modello dati (Prisma).** Nuove tabelle per società (`companyId` su tutte):

- `Employee` — anagrafica, mansione, area, reparto, contratto, archiviazione.
- `AssessmentPeriod` — il periodo di valutazione (oggi `evalPeriods`).
- `SoftAssessment`, `HardAssessment` — gli snapshot per dipendente e periodo
  (oggi `softHistory` / `hardHistory` dentro il dipendente).
- `JobRole` ("mansione") con i pesi delle competenze (oggi `roleProfiles`),
  più un campo **classe di equivalenza** per il confronto fra società
  ("ruolo uguale o di pari valore", vedi §5).
- `EmployeeEvaluationAssignment` — chi valuta chi, con stato; il valutatore
  esterno riusa `Evaluator` e il suo token.
- `ExecutiveInterview` — l'Intervista (oggi `analisiIniziale`).
- Invio del link: `TestInvitation` generalizzata (un destinatario candidato
  **o** dipendente) invece di una tabella parallela, così i due moduli hanno
  davvero un solo meccanismo, come chiesto.

**API.** CRUD per società con i permessi dal ruolo backend (Fase 8);
confronto fra società solo per gli utenti di gruppo; invio link con lo stesso
servizio di Recruiting.

**Frontend.** Assessment legge e scrive già tutto da un solo contesto
(`AssessmentContext`): il cambio è dietro quel contesto (da `localStorage` a
chiamate API, con stati di caricamento ed errore), non nelle 17 schermate.

**Migrazione dei dati.** Un import una tantum per società del JSON oggi nel
browser, con anteprima e conferma. Il `localStorage` resta come copia finché
l'import non è verificato.

## 4. Stima

Stessa unità di STIME.md: giornate di lavoro di una persona.

| Pezzo | Dove | Giornate |
|---|---|---|
| Modello dati + migrazioni Prisma, gruppo → società su `Platform`/`Company` | backend | 3–4 |
| API per società, permessi, audit | backend | 3–4 |
| Assessment dal contesto locale alle API (caricamento, errori, salvataggi) | frontend | 4–6 |
| Valutatore esterno sul token (`/assessment/evaluate`) | entrambi | 2–3 |
| Invio link test dal server (TestInvitation generalizzata, template, stato) | entrambi | 2–3 |
| Selettore di società sui dati veri, vista di gruppo, confronto fra società | entrambi | 3–5 |
| Import dei dati dal browser | entrambi | 1–2 |
| Test e verifica con il cliente | entrambi | 2–3 |
| **Totale** | | **20–30** |

Prerequisito: la **Fase 8** (autenticazione sul backend e permessi dal
ruolo). Senza, un'API che espone dati di dipendenti non si apre.

## 5. Da decidere con il cliente prima di partire

1. **"Pari valore" fra mansioni di società diverse**: chi lo stabilisce e
   come (una classificazione del gruppo? il livello CCNL? una scelta fatta a
   mano nel profilo di mansione?). Senza questa regola il confronto fra
   società si può fare solo a mansione identica per nome.
2. **Chi vede che cosa**: l'HR di una società vede solo la sua; l'utente di
   holding vede tutte? anche i nomi o solo i dati aggregati?
3. **Dati personali**: valutazioni di dipendenti con nome ed email sul
   server sono dati personali; servono base giuridica, tempi di
   conservazione e informativa. Riguarda il cliente, non solo noi.
4. **Storico**: cosa si importa dei dati già nel browser (tutto, o si
   riparte da zero per le società nuove).

## 6. Cosa entra già nella migrazione (senza server)

Come dice CLAUDE.md: solo l'interfaccia e quello che funziona con i dati di
oggi — il **selettore di società** nel guscio, costruito per gruppo →
società anche con una sola società, e la **colonna di selezione con "Invia
link test (N)"** come pattern della libreria. In Assessment l'invio continua
a passare dal meccanismo attuale finché questo progetto non c'è.

## 7. Stato e API nel frontend — proposta (2026-10-14, da approvare)

Nata dal riordino del progetto. **Non è implementata**: tocca il salvataggio
dei dati e aggiunge una dipendenza, quindi si decide prima (CLAUDE.md §5, §12).

**Oggi.** Recruiting: `localStorage` più il backend, con `lib/api/client.ts`
(token, `ApiError`) e `lib/api/endpoints.ts` (un gruppo per risorsa:
`candidatesApi`, `campaignsApi`…). Assessment: un contesto React che legge e
scrive `localStorage`. Non serve uno store globale (Redux, Zustand): lo stato
condiviso fra pagine è poco ed è già nei contesti e negli hook.

**Proposta, quando Assessment passa al server:**

1. **Dati del server con TanStack Query** (`@tanstack/react-query`). Dà
   caricamento, errore, cache, nuovo tentativo e aggiornamento dopo una
   modifica, che oggi ogni schermata di Recruiting rifà a mano con
   `useEffect` e tre `useState`. Una dipendenza nuova: va in `DECISIONI.md`.
   Alternativa senza dipendenze: un hook nostro `useApiQuery` in `src/hooks/`;
   costa meno all'inizio ma rifà cache e invalidazione.
2. **`AssessmentContext` resta la porta**: dentro passa dalle letture di
   `localStorage` agli hook delle query; le 17 schermate non cambiano (§3).
3. **Lo stato d'interfaccia resta locale** (`useState`, contesti): schede
   aperte, filtri, dialog. Solo i dati del server vanno nella cache.
4. **API per dominio**: `lib/api/endpoints.ts` si divide in un file per area
   quando arriva Assessment (`lib/api/recruiting.ts`, `lib/api/assessment.ts`,
   `lib/api/platform.ts`), con i tipi in `lib/api/types.ts`. Stesso
   `client.ts`, stesso `ApiError`, stessi permessi dal ruolo (Fase 8).
5. **Recruiting dopo**: le schermate che leggono dal backend passano agli
   stessi hook una alla volta, quando si toccano. `localStorage` resta solo
   per le preferenze.

Stima: 1–2 giorni per l'impianto (provider, primo dominio, modello di errore
nel pattern), il resto dentro le voci della stima del §4.

## 8. Piano di esecuzione (2026-10-14, da approvare)

Verificato sul codice di oggi. **Non implementato**: tocca il salvataggio dei
dati, quindi si approva prima (CLAUDE.md §5). I §3–§4 restano come impianto;
qui ci sono il dettaglio e le correzioni.

### 8.1 Che cosa c'è davvero

**Backend di Recruiting** — è la base da riusare, non da rifare:
PostgreSQL con Prisma 6 (`backend/prisma/schema.prisma`, 5 migrazioni),
Express + zod, un `Router` per dominio in `backend/src/modules/*`, montati in
`app.ts` sotto `/api/v1/…`. Ogni rotta usa `requireAuth`, `requireRole`,
`requireCompanyScope` (`middleware/auth.ts`) e `audit()`; ci sono
`createLimiter` per le rotte pubbliche, `mailer` (SMTP / Resend), test con
vitest + supertest. Su Railway, già in `VITE_AUTH_MODE=backend`: il
prerequisito "login vero prima dei dati reali" (Fase 8) è soddisfatto.

**Assessment** — tutto nel browser:

| Chiave | Contenuto | Chi la legge |
|---|---|---|
| `sv_assessment_state_v1` | `AssessmentState` (`lib/types.ts`): settings, employees (con `soft`, `hard`, `softHistory`, `hardHistory`, assenze, RAL, piano di sviluppo), evaluators, roleProfiles, evalAssignments, evalPeriods, analisiIniziale, company | solo `lib/storage.ts`, dietro `AssessmentContext` |
| `sv5p_state_v1` | `State5p` (`gestione5p/model.ts`): people, plan, evals, exp, mail, log | `gestione5p/use5pState.ts` — **fuori** dal contesto |

Quattro cose emerse oggi che il §3 non diceva:

1. **Il valutatore esterno funziona solo nel browser dell'HR.**
   `/assessment/evaluate?evalToken=` cerca l'assegnazione in `localStorage`:
   aperto su un altro computer non trova niente. Il token è salvato in chiaro.
2. **Una chiave segreta vive nel browser.** `settings.emailApiKey` e
   `emailApiEndpoint` (`SurveyLinkModal`) stanno in `localStorage` e la
   chiamata parte dal browser. Sul server non si porta: si sostituisce con
   `EmailServiceConfig` + `mailer` di Recruiting.
3. **Il 5P ha un suo elenco di persone**, importato da Excel, separato
   dall'anagrafica dei dipendenti. Se sono le stesse persone è una domanda
   di prodotto (§8.5).
4. **Le scritture sono a blob intero**: 34 chiamate `setState`/`persist` in
   19 file restituiscono tutto lo stato nuovo. Un'API per risorsa chiede di
   trasformarle in azioni (`updateEmployee`, `archiveEmployee`…). È il grosso
   del lavoro frontend, non le 17 schermate.

Dati sensibili nell'anagrafica: **RAL**, **sesso**, **assenze con motivo**
(un motivo di salute è dato di categoria particolare, GDPR art. 9). Vanno
decisi prima di salvarli sul server (§8.5).

### 8.2 Scelta dello schema — raccomandazione

| Opzione | Cosa | Pro | Contro |
|---|---|---|---|
| A. Blob | una riga JSONB per società con lo stato intero e una versione | 2–3 giorni, schermate intatte | il server non sa chi sono i dipendenti: niente valutatore esterno, niente invio link, niente confronto. Va rifatto. |
| B. Tutto normalizzato | una tabella per ogni pezzo, anche Intervista e impostazioni | interrogabile ovunque | molte tabelle per dati che il server non interroga mai |
| **C. Misto** | tabelle per quello che il server deve conoscere (dipendenti, periodi, punteggi, assegnazioni, mansioni); JSONB per i documenti che legge solo l'interfaccia (Intervista, profilo aziendale, piano di sviluppo, 5P per ora) | sblocca le tre richieste del §1 senza tabelle inutili | richiede le azioni del punto 4 |

**Raccomandata: C.** È la forma che Recruiting usa già (`Evaluation.scores`
è `Json`).

### 8.3 Modello dati (Prisma, bozza)

Tutte con `companyId` → `Company`, `createdAt`/`updatedAt`, indice su
`companyId`. Nessuna modifica distruttiva alle tabelle di Recruiting.

| Modello | Da | Note |
|---|---|---|
| `Employee` | `employees[]` | anagrafica, `responsabileId` (relazione su sé stesso), `softSkillOverrides String[]?`, `developmentPlan Json`, `archivedAt/archiveReason/archiveNote`, `surveySentAt`, `legacyId` per l'import |
| `EmployeeAbsence` | `assenzeProgrammate[]` | `dal`, `al`, `motivo` (vedi §8.5) |
| `AssessmentPeriod` | `evalPeriods[]` | `label`, `date` |
| `EmployeeSoftScore` | `employee.soft` | `@@unique([employeeId, skillId])`, `ottenuto`, `atteso` — i valori correnti |
| `EmployeeHardScore` | `employee.hard` + `hardEvaluatedBy` + `hardNotes` | `@@unique([employeeId, source, code])`, `score`, `note` |
| `SoftAssessmentSnapshot` | `softHistory[]` | storico, forma attuale |
| `HardAssessmentSnapshot` | `hardHistory[]` | `periodId`, `source`, `apexScore`, `dims Json` |
| `JobRoleProfile` | `roleProfiles{}` | `@@unique([companyId, roleName])`, `requiredSkills`, `skillWeights Json`, `skillExpected Json`, `equivalenceClass?` (per il "pari valore", vuoto finché non deciso) |
| `EmployeeEvaluationAssignment` | `evalAssignments[]` | `periodId`, `targetEmployeeId`, `source`, nome ed email del valutatore, **`accessTokenHash @unique` + scadenza** come `Evaluator`, `status`, `completedAt` |
| `AssessmentSettings` | `settings` + `evaluators[]` | `companyId @unique`; **senza** `emailApiKey` / `emailApiEndpoint` |
| `AssessmentCompanyProfile` | `company` | `companyId @unique`, sedi, contatti, referente, CEO, CFO in JSONB |
| `ExecutiveInterview` | `analisiIniziale` | `companyId @unique`, `data Json`, `completed` |
| `Valutazione5p` | `sv5p_state_v1` | `companyId`, `pianoId`, `state Json`, `version` — in JSONB finché non si decide il §8.5 punto 2 |

Enum nuovi: `AssessmentSource { RESP PEER AUTO }`, `ContractType`,
`AssignmentStatus { PENDING COMPLETED }`.

**Invio del link** — `TestInvitation` si generalizza con una migrazione
additiva: `shortlistId` diventa facoltativo, si aggiunge `employeeId?`, e un
vincolo `CHECK` vuole esattamente uno dei due. Un solo meccanismo per i due
moduli, come deciso dal cliente il 2026-09-30.

### 8.4 API

Nuovo modulo `backend/src/modules/assessment/`, montato su
`/api/v1/assessment`, stesso stile di `candidates/routes.ts`. Scrittura per
`COMPANY_ADMIN` e `RECRUITER` (come `canEditAssessment` nel frontend), lettura
anche per `READONLY`, `PLATFORM_ADMIN` su tutte.

```
GET    /companies/:companyId/assessment            stato iniziale in una chiamata
                                                   (forma vicina ad AssessmentState)
POST|PATCH|DELETE  /employees[/:id]                 + /archive, /restore
PUT    /employees/:id/soft-scores                  snapshot soft
PUT    /employees/:id/hard-scores/:source          snapshot hard
POST|PATCH|DELETE  /periods[/:id]
PUT    /role-profiles/:roleName
PUT    /settings · /company-profile · /interview
POST   /assignments            crea, restituisce il link UNA volta (il token in chiaro non si salva)
DELETE /assignments/:id
POST   /invitations            { employeeIds[] } → TestInvitation + mailer
GET|PUT /valutazione-5p        documento JSONB con versione (409 se è cambiato)
POST   /demo/reset             solo società demo e VITE_DEMO_MODE

Pubbliche, con createLimiter:
GET    /public/assessment-evaluations/:token       il dipendente da valutare, nient'altro
POST   /public/assessment-evaluations/:token       invio; il token si chiude
```

Ogni scrittura passa da `audit()`. Il `GET` iniziale evita 10 chiamate al
caricamento e tiene semplice il passaggio del frontend.

### 8.5 Da decidere prima di partire — **decise il 2026-10-14**

Tutte e sei approvate come proposte, salvo il punto 4: **i dati di oggi si
importano** (passo 7 dentro). Il punto 2: le persone del 5P **sono** i
dipendenti. Dettaglio in `DECISIONI.md`.

1. **Schema**: opzione C del §8.2?
2. **5P e anagrafica**: le persone del 5P sono i dipendenti dell'anagrafica?
   Se sì, il 5P punta a `Employee`; se no, resta un elenco suo. Funzionale:
   lo decide il cliente.
3. **Dati sensibili**: RAL, sesso e motivo delle assenze vanno sul server?
   Proposta: RAL sì (solo `COMPANY_ADMIN`), motivo delle assenze ridotto a
   una categoria non sanitaria o tolto. Serve l'informativa del cliente.
4. **Dati di oggi**: il cliente ha detto (2026-10-02) che sono di prova e
   che con i dati veri si riparte da zero. Proposta: niente import
   automatico; solo lo script per la società demo (§8.6 passo 7).
5. **TanStack Query** (§7) per il frontend: dipendenza nuova, va approvata.
6. **Confronto fra società**: non serve a Original Skills (due `Company`
   distinte, 2026-10-02). Proposta: fuori da questo progetto; lo schema lo
   permette dopo (`companyId` + `equivalenceClass`).

### 8.6 Passi

Ogni passo si rilascia da solo e ha il suo ritorno indietro. Il frontend
passa dietro una variabile, come per l'autenticazione:
`VITE_ASSESSMENT_STORAGE=local|server` (default `local`, invariato).

| # | Passo | Ritorno indietro | Giornate |
|---|---|---|---|
| 1 | Schema e migrazione Prisma (solo tabelle nuove + `TestInvitation` additiva), seed della società demo | migrazione inversa: tabelle nuove vuote | 2–3 |
| 2 | API del §8.4 tranne valutatore e invio, con test vitest come gli altri moduli | rotte non usate da nessuno | 3–4 |
| 3 | Frontend: `lib/api/assessment.ts`, `AssessmentContext` carica dal server; le 34 scritture diventano azioni; stati di caricamento ed errore coi pattern esistenti (`LoadingState`, `ErrorBoundary`) | `VITE_ASSESSMENT_STORAGE=local` | 4–6 |
| 4 | Valutatore esterno sul token del server (`/assessment/evaluate`) | il link vecchio continua a funzionare in `local` | 2–3 |
| 5 | Invio link test dal server con `SendTestLinkBar`; `emailApiKey` esce dal browser | mailto resta come ripiego | 2–3 |
| 6 | 5P sul server (documento JSONB con versione) | `local` | 1–2 |
| 7 | Script `migrate-assessment-localstorage.ts`, stesso stile di quello di Recruiting (`--dry-run`, idempotente su `legacyId`) — solo se il §8.5.4 lo chiede | non distruttivo: non tocca il browser | 1 |
| 8 | Verifica: due utenti della stessa società vedono gli stessi dati, un utente di un'altra società riceve 403, valutatore esterno da un altro browser, chiaro e scuro | — | 2 |
| | **Totale** | | **17–24** |

Più basso dei 20–30 del §4: il confronto fra società esce (§8.5.6) e il
login vero è già in produzione. Il 5P, che allora non c'era, entra.

Quando `server` è verificato in produzione: `VITE_ASSESSMENT_STORAGE` si
toglie, `lib/storage.ts` resta solo per l'import, il "Reset demo" chiama il
server. Si scrive in `DECISIONI.md`.

### 8.7 Stato — passi 1 e 2 fatti (2026-10-14), non ancora in produzione

- Schema: `backend/prisma/schema.prisma` (sezione Assessment), migrazione
  `20261014120000_assessment_server`. Solo tabelle nuove + `TestInvitation`
  additiva con il vincolo `TestInvitation_one_recipient`.
- API: `backend/src/modules/assessment/` (`shape.ts` traduce fra la forma del
  browser e le tabelle, `routes.ts`), su `/api/v1/assessment/companies/:id/…`.
  Rispetto al §8.4: le risorse si salvano intere con `PUT …/:clientId`
  idempotenti; l'import è una rotta (`POST …/import`, con `dryRun`) e non uno
  script; il reset vale solo per `ASSESSMENT_DEMO_COMPANY_IDS`. Scostamenti
  motivati in `DECISIONI.md`.
- Test: `backend/tests/assessment.test.ts`, 21 casi.
- **In produzione la migrazione parte da sola**: Railway esegue
  `prisma migrate deploy` prima di ogni deploy del backend
  (`.railway/railway.ts`, `preDeployCommand`). Un push su `main` la applica.

**Passo 3 — da sapere prima di partire.** Il frontend riceve la stessa forma
di prima con tre differenze: `ral` è `null` per chi non la vede; le assenze
hanno `category` (ferie, permesso, formazione, congedo, altro) invece di
`motivo` — `AbsencesEditor` passa da testo libero a una scelta; il token di
un'assegnazione nuova arriva dal server. Le 34 scritture restano nelle
pagine: il contesto confronta lo stato prima e dopo e chiama i `PUT` delle sole
parti cambiate, nell'ordine periodi → dipendenti → assegnazioni.

**Passo 3 — fatto il 2026-10-15, in locale.** Dietro `VITE_ASSESSMENT_STORAGE=server`:
`lib/api/assessment.ts`, `AssessmentContext` con un provider per modalità,
`server-sync.ts` per le sole parti cambiate, `AssessmentDataGate` per
caricamento ed errore, "Importa dati del browser" nella barra laterale.
Dettaglio in PROGRESS.md (registro del 2026-10-15) e DECISIONI.md.
