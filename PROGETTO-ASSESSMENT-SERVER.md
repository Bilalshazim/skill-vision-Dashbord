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
Oggi sono un solo oggetto JSON in `localStorage` (`sv_assessment_state_v1`:
impostazioni, dipendenti con storico soft/hard, valutatori, profili di
mansione, assegnazioni delle valutazioni, periodi, Intervista, profilo
aziendale). Cancellare i dati del browser cancella l'Assessment.

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
