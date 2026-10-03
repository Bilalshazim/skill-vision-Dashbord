# Proposta — collegamento all'API Original Skills

2026-10-02, aggiornata lo stesso giorno con le specifiche tecniche di
Alessio e con una chiamata di prova reale. Analisi e proposta: **nessuna riga
di codice nel prodotto e nessun salvataggio di dati**. Il salvataggio dei
risultati tocca il modello dati e si decide a parte; la sua stima è al §9.

> **Stato delle informazioni.**
> - **Noti dalle specifiche:** endpoint, metodo, corpo della richiesta e
>   intestazioni di autenticazione (§1, §3.1).
> - **Verificati con la chiamata di prova del 2026-10-02:** la struttura
>   esatta della risposta, i tipi, le scale, il limite sull'intervallo di
>   date e gli errori (§3.2, §6, §7).
> - **Le domande ancora aperte** sono al §8.
>
> **In questo documento non ci sono credenziali, codici azienda o dati di
> persone**: sta su Git. `authKey` e `authCompany` vanno solo nelle
> variabili di Railway (§1). I codici reali delle società vanno solo in
> `ORIGINAL_SKILLS_COMPANY_MAP`, sempre su Railway (§2). Qui le società si
> chiamano «società 1» e «società 2».

## 1. Il principio: l'API si chiama solo dal server

Il browser non chiama mai Original Skills. Chiama il nostro backend, che
aggiunge le credenziali e inoltra la richiesta. È lo stesso schema già in
produzione per le «Considerazioni dell'esperto»
(`backend/src/modules/assessmentAi/routes.ts`): chiave nel server, rotta
protetta, risposta ripulita prima di tornare al browser.

```
Browser ──(JWT)──▶ Backend GET /api/original-skills/results ──(authKey, authCompany)──▶ POST https://hrapp.originalskills.com/Api/Data/ExportData
           requireAuth + ruolo + società              intestazioni aggiunte solo dal server
```

### Variabili segrete su Railway

Vanno sul servizio **Backend** del progetto Railway (non su «Skill Vision»,
che è il frontend), **senza prefisso `VITE_`**:

| Variabile | Contenuto | Segreta |
|---|---|---|
| `ORIGINAL_SKILLS_API_URL` | `https://hrapp.originalskills.com/Api/Data/ExportData` | no, ma tenerla in configurazione permette di cambiare ambiente senza toccare il codice |
| `ORIGINAL_SKILLS_AUTH_KEY` | il token riservato, inviato nell'intestazione `authKey` | **sì** |
| `ORIGINAL_SKILLS_AUTH_COMPANY` | l'identificativo del cliente API, inviato nell'intestazione `authCompany` | **sì**: insieme alla chiave apre l'accesso, quindi segue le stesse regole |

**Dove non devono mai stare** `authKey` e `authCompany`:
- nel codice e nel repository Git: né nei sorgenti, né in `.env.example`,
  né nei documenti, né nei messaggi di commit;
- nel frontend: nessuna variabile del servizio «Skill Vision», nessun
  `VITE_…`;
- nelle risposte del nostro backend e nei log.

`.env.example` del backend riporta solo i nomi, con il valore vuoto, come
oggi per `ANTHROPIC_API_KEY`.

Perché niente `VITE_`: Vite copia **dentro il JavaScript servito al
browser** ogni variabile che inizia così. Una chiave `VITE_…` sul servizio
«Skill Vision» (il frontend) sarebbe leggibile da chiunque apra gli
strumenti del browser. È lo stesso problema già segnalato per
`VITE_OPERATORE_BRIDGE_PASSWORD` (Fase 8).

Le tre variabili si leggono **solo** in `backend/src/lib/env.ts`, come
`ANTHROPIC_API_KEY`, e le intestazioni si compongono in un solo modulo
(`modules/originalSkills/client.ts`):
- non sono obbligatorie all'avvio: senza, la rotta risponde «servizio non
  configurato» invece di bloccare il server;
- non si scrivono mai nei log;
- non tornano mai in una risposta.

### Prima del login vero, la rotta resta spenta

Regola di CLAUDE.md (Fase 8): **nessuna rotta che restituisce dati di persone
reali si attiva in produzione con `VITE_AUTH_MODE=legacy`**. Finché il ponte
del guscio usa credenziali scritte nel bundle, `requireAuth` non protegge
niente: chiunque legga il JavaScript può fare il login con quelle.

Quindi la rotta ha un interruttore suo, `ORIGINAL_SKILLS_ENABLED`, sul
servizio Backend. Senza, risponde `503 «servizio non attivo»` e non chiama
Original Skills. Si imposta a `true` solo dopo questi tre passi:
1. frontend in modalità `backend`;
2. account con password pubbliche disattivati
   (`scripts/secure-demo-accounts.ts`);
3. account del gruppo di lavoro creati.

Così una distrazione su Railway non basta a esporre dati.

### Protezione della rotta

```ts
originalSkillsRouter.use(requireAuth)                          // JWT valido
originalSkillsRouter.get('/results',
  requireRole('COMPANY_ADMIN', 'RECRUITER', 'PLATFORM_ADMIN'), // ruolo backend
  validateQuery(resultsQuerySchema),                           // zod: da aggiungere accanto a validateBody
  async (req, res, next) => {
    requireCompanyScope(req, req.query.companyId)              // solo la propria società
    …
  })
```

`requireAuth`, `requireRole` e `requireCompanyScope` esistono già in
`backend/src/middleware/auth.ts`; `validateQuery` va aggiunto accanto a
`validateBody` (`middleware/validate.ts`), una decina di righe. **Senza un JWT
valido la rotta risponde 401 e Original Skills non viene chiamato.** Con
`requireCompanyScope` un utente vede solo i risultati della sua società; il
`PLATFORM_ADMIN` le vede tutte.

Il browser usa un `GET` sulla nostra rotta; è il server a fare il `POST`
verso Original Skills (§3.1).

## 2. `codAzienda` e la struttura Gruppo → Società

### Il principio: si ricava sul server, non arriva dal browser

Il browser manda il nostro `companyId`, che è già protetto da
`requireCompanyScope`. Il server lo traduce nel `codAzienda` di Original
Skills. Se il `codAzienda` arrivasse dal browser, basterebbe cambiarlo per
leggere i risultati di un'altra azienda: è il punto di sicurezza più
importante della proposta.

### I due codici del gruppo

Le specifiche indicano due codici, qui **«società 1»** e **«società 2»**: i
valori reali stanno solo in `ORIGINAL_SKILLS_COMPANY_MAP` su Railway, mai nel
repository. Sono due società dello stesso gruppo, e l'API li accetta **insieme**: `codAzienda` è
un elenco, quindi una sola chiamata può restituire i risultati di più
società.

È esattamente la struttura che il guscio già prevede (CLAUDE.md cap. 7,
«Azienda attiva»: holding → società). `CompanySwitcher` mostra il nome del
gruppo in alto e, sotto, la società attiva fra quelle del gruppo.

```
Gruppo (holding)                      ← nome in testa a CompanySwitcher
├── Società 1  →  codAzienda «codice società 1»
└── Società 2  →  codAzienda «codice società 2»
```

**Da confermare con Alessio:** quale società del gruppo corrisponde a
ciascun codice, e il nome del gruppo.

### Che cosa chiede il server in ciascun caso

| Cosa vede l'utente | `codAzienda` inviato | Chi può |
|---|---|---|
| La società attiva in `CompanySwitcher` | `["<codice società 1>"]` (solo il codice di quella società) | chi ha accesso a quella società (`requireCompanyScope`) |
| «Tutte le società del gruppo» (confronto fra società, caso holding) | `["<codice società 1>", "<codice società 2>"]` | solo un ruolo di gruppo, che oggi **non esiste** (vedi sotto) |
| Amministrazione della piattaforma | qualunque codice | `PLATFORM_ADMIN` |

Il server costruisce l'elenco a partire dai permessi, **mai dall'elenco
mandato dal browser**. Se la richiesta è per il gruppo ma l'utente ha accesso
a una sola società, l'elenco contiene solo il suo codice: non si allarga.

**Il ruolo di gruppo manca.** Oggi i ruoli backend sono `COMPANY_ADMIN`,
`RECRUITER`, `PLATFORM_ADMIN`, tutti legati a una sola società o a tutte.
Una vista «tutto il gruppo» richiede un ruolo di gruppo (es. `GROUP_ADMIN`).
Arriva con la Fase 8 (permessi dal ruolo backend) o con «Assessment sul
server». Fino ad allora la lettura è **per singola società**.

### Dove tenere la corrispondenza

| Opzione | Pro | Contro |
|---|---|---|
| **A. Campo `originalSkillsCode` su `Company` + il gruppo nel database** (raccomandata a regime) | si gestisce dall'amministrazione; il gruppo è un dato vero, utile anche ai permessi | migrazione del database. Il gruppo può essere `Platform`, che già raccoglie più `Company`, ma la cardinalità Platform↔Company è ancora aperta (OD-1): da decidere |
| **B. Mappa JSON in una variabile Railway** (`ORIGINAL_SKILLS_COMPANY_MAP`, es. `{"<companyId società 1>":"<codice società 1>","<companyId società 2>":"<codice società 2>"}`) | nessuna migrazione, utile per partire con queste due società | ogni nuova società richiede un intervento su Railway; il gruppo non esiste come dato |

Proposta: **B per partire**, A quando arriva il ruolo di gruppo. Senza codice
associato, la rotta risponde «Società non collegata a Original Skills» e la
schermata lo dice, con chi contattare.

### Recruiting e Assessment

- **Recruiting:** ha già più società nel selettore. Oggi però sono dati
  locali; quelle del server (`Company`) si collegano con «collega la
  posizione al server». La corrispondenza va fatta sugli `id` del backend.
- **Assessment:** oggi ha una sola società, e la sua anagrafica vive nel
  browser. Può leggere i risultati della società attiva; il confronto fra
  società richiede «Assessment sul server» (PROGETTO-ASSESSMENT-SERVER.md).

## 3. Richiesta e risposta

### 3.1 La richiesta (dalle specifiche)

```http
POST https://hrapp.originalskills.com/Api/Data/ExportData
Content-Type: application/json
authKey: <ORIGINAL_SKILLS_AUTH_KEY>
authCompany: <ORIGINAL_SKILLS_AUTH_COMPANY>

{
  "dataDa": "2026-07-01",
  "dataA": "2026-09-30",
  "lingua": "IT",
  "codAzienda": ["<codice società 1>", "<codice società 2>"]
}
```

Chi mette cosa nella richiesta:

| Campo | Chi lo mette | Note |
|---|---|---|
| `authKey`, `authCompany` | il server, dalle variabili di Railway | mai dal browser |
| `codAzienda` | il server, dai permessi dell'utente (§2) | mai dal browser |
| `dataDa`, `dataA` | il browser, poi validati dal server (§6) | formato `YYYY-MM-DD`, lo stesso che usiamo: nessuna conversione |
| `lingua` | il server, fisso `"IT"` | le etichette arrivano in italiano, come l'interfaccia |

Il client verso l'API è un solo modulo (`modules/originalSkills/client.ts`):
- unico punto che legge le due credenziali;
- timeout di 10 s;
- in caso di errore registra nei log solo stato HTTP e durata, mai le
  intestazioni né il corpo.

### 3.2 La risposta — verificata con una chiamata reale

**La chiamata di prova** (2026-10-02):
- **Da dove:** dal computer di sviluppo con `railway run --service Backend`,
  che inietta le variabili di Railway nel processo. Le credenziali non sono
  mai state scritte né stampate.
- **Che cosa ha stampato lo script:** solo la struttura della risposta
  (percorsi dei campi, tipi, conteggi, intervalli dei valori, formati
  mascherati). Nessun dato di persone; i nomi dei campi e delle competenze
  non sono dati personali.
- **Le chiamate:**

| Intervallo | Esito |
|---|---|
| 14 giorni | `200`, `[]` (array vuoto: nessun test completato nel periodo) |
| 88 giorni | `200`, 32 persone, ~118 KB, ~4 s |
| 92 giorni | `400` — `{"Cause": "date range must be smaller than 90 days", "Detail": "…"}` |
| `dataA` non valida | `500` — `{"Cause": "Unable to execute the REST operation", "Detail": "…"}` |

**La forma.** La risposta è un **array JSON di persone**, senza involucro e
senza paginazione: con nessun risultato è `[]`. **Tutti i valori sono
stringhe**, anche i numeri, che usano il punto decimale. I nomi dei campi
contengono **spazi** (`"Anno nascita"`, `"competenze ruolo"`, `"valore atteso"`…) e iniziali
maiuscole non uniformi (`Cognome`, `Nome`, ma `email`, `risultato`).

| Campo | Tipo | Formato e scala osservati | Note |
|---|---|---|---|
| `Cognome`, `Nome` | stringa | testo | dato personale |
| `Sesso` | stringa | 1 carattere | dato personale |
| `Anno nascita` | stringa | 4 cifre | dato personale |
| `Paese`, `Regione`, `Provincia` | stringa | testo; Regione e Provincia a volte vuote | dato personale |
| `email` | stringa | email; **2 righe su 32 non hanno un'email valida** | la chiave di collegamento (§4) |
| `risultato` | stringa numerica | 3 decimali, **negativo o positivo** (osservato −2,9 … 1,1) | **punteggio standardizzato**, non su /10: significato da confermare |
| `graduatoria` | stringa numerica | **uguale a `risultato`** in tutte le 32 righe | — |
| `numero intervista` | stringa numerica | intero di 6 cifre | **l'identificativo del test**: candidato a `externalId` |
| `ultima modifica` | stringa | `AAAA-MM-GG hh:mm:ss.s` (spazio, non `T`; fuso non indicato) | quando il test è stato completato o aggiornato |
| `lingua` | stringa | `"Italiano"` | — |
| `sede`, `ragione sociale` | stringa | testo | dati dell'azienda |
| `tipo candidatura` | stringa | due valori: `"Nuova candidatura"`, `"Dipendente dell'impresa"` | **distingue candidato (Recruiting) e dipendente (Assessment)** |
| `codAzienda` | stringa | 6 caratteri | **presente in ogni riga**: attribuisce la persona alla società giusta |
| `titolo di studio` | stringa | testo, spesso vuoto | — |
| `livello`, `area`, `ruolo`, `esperienza`, `istruzione`, `data assunzione`, `ral`, `data dimissioni` | stringa | **sempre vuoti** nel periodo osservato | da capire se si possono valorizzare dal loro lato |
| `competenze` | array di `{ nome, punteggio }` | **36 elementi, stesso ordine in ogni riga** | il profilo completo |
| `competenze[].punteggio` | stringa numerica | 2 decimali, osservato 0,51 … 8,11 | scala probabilmente **1–10**, come le competenze trasversali di Assessment: da confermare |
| `competenze ruolo` | array di `{ nome, punteggio, valore atteso, diff }` | da 0 a 19 elementi | le competenze richieste dal ruolo |
| `competenze ruolo[].valore atteso` | stringa numerica | 5,00 … 6,00 | il nostro «atteso» |
| `competenze ruolo[].diff` | stringa numerica | **= punteggio − valore atteso** (verificato su 489 su 489) | il nostro «gap»; si può ricalcolare |

**Verifiche fatte sulle righe:**
- ogni competenza di `competenze ruolo` è anche in `competenze`, con lo
  stesso punteggio (489 su 489);
- `risultato` e `graduatoria` coincidono (32 su 32);
- nella finestra osservata tutte le righe erano della società 1: per la
  società 2 non c'erano test completati.

**Le 36 competenze e le nostre 35 — tabella di confronto.**
- **Come arrivano.** I nomi arrivano in italiano (`lingua: "IT"`), sempre
  36 e nello stesso ordine. **Due hanno uno spazio in fondo** (`"Direzione "`,
  `"Precisione e disciplina "`): il server li normalizza (trim) prima di
  confrontarli.
- **Tre colonne, perché da noi le liste sono due:**
  - Assessment (`SOFT_SKILLS_IT`, indicizzata per `id`);
  - Recruiting (`recruiting/lib/constants.ts`, dove il **nome è anche la
    chiave** dei punteggi dei candidati e delle competenze selezionate);
  - e le due liste divergono già fra loro in quattro voci.

| Cluster | id | **Original Skills (ufficiale)** | Assessment | Recruiting | Esito | Proposta |
|---|---|---|---|---|---|---|
| Personali | `ps1` | Altruismo lavorativo | Altruismo sul lavoro | Altruismo sul lavoro | Dicitura diversa | «Altruismo lavorativo» |
| Personali | `ps2` | Autocontrollo | Autocontrollo | Autocontrollo | Uguale | — |
| Personali | `ps3` | Autonomia | Autonomia | Autonomia | Uguale | — |
| Personali | `ps4` | Fiducia in se stessi | Fiducia in se stessi | Fiducia in se stessi | Uguale | — |
| Personali | `ps5` | Flessibilità/adattabilità | Flessibilità/Adattabilità | Flessibilità/Adattabilità | Solo maiuscole | «Flessibilità/adattabilità» |
| Personali | `ps6` | Engagement lavorativo · Impegno lavorativo | Dedizione al lavoro | Dedizione al lavoro | **Ambigua**: due voci di Original Skills per una nostra | Da decidere col cliente (vedi sotto) |
| Personali | `ps7` | Innovazione | Innovazione | Innovazione | Uguale | — |
| Personali | `ps8` | Intelligenza Emotiva | Intelligenza emotiva | Intelligenza emotiva | Solo maiuscole | «Intelligenza Emotiva» |
| Personali | `ps9` | Motivazione ed efficacia personale | Motivazione ed efficacia personale | Motivazione ed efficacia personale | Uguale | — |
| Personali | `ps10` | Persistenza | Persistenza | Persistenza | Uguale | — |
| Personali | `ps11` | Precisione e disciplina | Precisione e disciplina | Precisione e disciplina | Uguale | — |
| Personali | `ps12` | Resistenza allo stress | Resistenza allo stress | Resistenza allo stress | Uguale | — |
| Personali | `ps13` | Sensibilità alla formazione | Formazione sulla sensibilità | Formazione sulla sensibilità | Dicitura diversa — **senso diverso** | «Sensibilità alla formazione» |
| Di realizzazione | `re1` | Attenzione ai dettagli | Attenzione ai dettagli | Attenzione ai dettagli | Uguale | — |
| Di realizzazione | `re2` | Conseguire obiettivi | Conseguimento degli obiettivi | Conseguimento degli obiettivi | Dicitura diversa | «Conseguire obiettivi» |
| Di realizzazione | `re3` | Controllo | Controllo | Controllare | Dicitura diversa | «Controllo» |
| Di realizzazione | `re4` | Gestire le informazioni | Gestione delle informazioni | Gestione delle informazioni | Dicitura diversa | «Gestire le informazioni» |
| Di realizzazione | `re5` | Risultati/sforzi | Risultati/Impegno | Risultati/impegno | Dicitura diversa | «Risultati/sforzi» |
| Di realizzazione | `re6` | Spirito di iniziativa | Spirito di iniziativa | Spirito di iniziativa | Uguale | — |
| Sociali | `so1` | Cooperazione | Cooperazione | Cooperazione | Uguale | — |
| Sociali | `so2` | Customer Experience | Esperienza del cliente | Esperienza del cliente | Dicitura diversa — inglese | «Customer Experience» |
| Sociali | `so3` | Orientamento al cliente | Orientamento al cliente | Orientamento al cliente | Uguale | — |
| Sociali | `so4` | Orientamento sociale | Orientamento sociale | Orientamento sociale | Uguale | — |
| Sociali | `so5` | Sensibilità relazionale | Sensibilità verso le relazioni | Sensibilità verso le relazioni | Dicitura diversa | «Sensibilità relazionale» |
| Di influenza | `in1` | Comunicazione | Comunicazione | Comunicazione | Uguale | — |
| Di influenza | `in2` | Influenza e persuasione | Influenza e persuasione | Influenza e persuasione | Uguale | — |
| Di influenza | `in3` | Leadership | Leadership | Leadership | Uguale | — |
| Manageriali | `ma1` | Decision Making | Prendere decisioni | Il processo decisionale | Dicitura diversa — inglese | «Decision Making» |
| Manageriali | `ma2` | Delega | Delega | Delegazione | Dicitura diversa | «Delega» |
| Manageriali | `ma3` | Direzione | Direzione | Direzione | Uguale | — |
| Manageriali | `ma4` | Pensiero analitico | Pensiero analitico | Pensiero analitico | Uguale | — |
| Manageriali | `ma5` | Pianificazione e organizzazione | Pianificazione e organizzazione | Pianificazione e organizzazione | Uguale | — |
| Manageriali | `ma6` | Problem Solving | Risoluzione dei problemi | Risoluzione dei problemi | Dicitura diversa — inglese | «Problem Solving» |
| Manageriali | `ma7` | Strategia | Strategia | Strategia | Uguale | — |
| Manageriali | `ma8` | Team Work | Lavoro di squadra | Lavoro di squadra | Dicitura diversa — inglese | «Team Work» |

**Conto:** 20 uguali, 2 che differiscono solo per le maiuscole, 12
con una dicitura diversa, 1 ambigua (36 contro 35).

### Proposta da sottoporre al cliente: le diciture ufficiali di Original Skills

**Si propone di usare la dicitura ufficiale di Original Skills, la colonna in
grassetto, in tutti i casi di differenza, nei due moduli.** Motivi:
- Original Skills è la fonte dei punteggi: chi legge un resoconto
  ritrova lo stesso nome nel test e nella dashboard;
- le liste di Assessment e Recruiting oggi divergono fra loro («Delega» /
  «Delegazione», «Controllo» / «Controllare», «Prendere decisioni» / «Il
  processo decisionale»): una sola fonte chiude anche questa differenza;
- il collegamento dei punteggi (§3.2) diventa per nome esatto, senza una
  tabella di sinonimi da mantenere.

Tre punti su cui il cliente deve decidere esplicitamente:

1. **«Sensibilità alla formazione» (`ps13`) ha un senso diverso** dalla nostra
   «Formazione sulla sensibilità», non è solo un'altra forma. La dicitura di
   Original Skills («disponibilità a formarsi») sembra quella corretta: la
   nostra pare una traduzione rovesciata. **Raccomandato adottarla.**
2. **Quattro diciture ufficiali sono in inglese**: Customer Experience,
   Decision Making, Problem Solving, Team Work. Adottarle va contro «niente
   inglese dove esiste l'equivalente in uso» (CLAUDE.md §8). Però sono i
   nomi del test, e il cliente ha già scelto di tenere «team», «feedback»,
   «gap». **Due strade:**
   - (a) adottarle come nomi propri del test;
   - (b) tenere l'italiano a schermo con la dicitura ufficiale accanto
     (es. «Risoluzione dei problemi (Problem Solving)»).

   Raccomandata la (a), per coerenza con il punto 1 della proposta.
3. **«Dedizione al lavoro» (`ps6`) contro «Engagement lavorativo» e
   «Impegno lavorativo».** Original Skills misura 36 competenze, noi 35.
   **Serve la risposta di Original Skills** su cosa misura ciascuna delle
   due. Poi si sceglie fra:
   - (a) una delle due corrisponde a `ps6` e l'altra si ignora;
   - (b) una corrisponde a `ps6` e l'altra diventa la 36ª competenza (tocca
     cluster, atteso per mansione e grafici: lavoro a parte);
   - (c) `ps6` diventa la media delle due.

**Cosa comporta applicarla** (dopo l'approvazione, non prima):
- **Assessment:** cambiano solo le etichette di `SOFT_SKILLS_IT`. I dati sono
  per `id` e non si toccano. Mezza giornata, con il catalogo e le schermate.
- **Recruiting:** il nome è la chiave dei punteggi e dei flag salvati. Serve
  una conversione all'apertura (come per i preset delle schede, vedi TRADUZIONI.md)
  per punteggi dei candidati, competenze selezionate e attesi. 1–1,5
  giornate, con le prove sui dati salvati.
- **Le 2 differenze di sole maiuscole** (`ps5`, `ps8`) si allineano insieme, senza bisogno
  di decisione.

**Seconda verifica, 2026-10-03** (`backend/scripts/test-original-skills-fetch.ts`,
ultimi 30 giorni). Due scoperte che cambiano la traduzione nel server:

1. **L'API restituisce anche righe che non abbiamo chiesto.** Le persone con
   `codAzienda` uguale ad `authCompany` (l'account API, cioè l'integratore)
   tornano **sempre**, qualunque codice si chieda, anche un codice
   inesistente. Il filtro `codAzienda` della richiesta non le esclude.
   **Il server deve tenere solo le righe dei codici che ha chiesto**, e
   scartare le altre (contandole nei log, senza dati personali).
   Altrimenti le persone dell'account API comparirebbero nella dashboard di
   un cliente. Da segnalare a Original Skills (§8).
2. **Il questionario non è unico.** La riga dell'account API del 2 ottobre
   ha **42 voci** invece di 36:
   - le 36 di sempre;
   - 5 competenze nuove: Agility, Competitività, Dinamismo, Gestione delle
     informazioni, Managing change;
   - una voce ripetuta («Innovazione» due volte).

   Probabilmente è una versione nuova del test, provata sull'account API.
   La traduzione deve quindi:
   - **non dare per scontato il numero di competenze**;
   - mappare per nome con la tabella sotto, lasciando `skillId: null` per un
     nome sconosciuto (da mostrare, non da scartare);
   - con una voce ripetuta, prendere la prima e segnalare la riga.

   Ci sono anche «Gestione delle informazioni» e «Gestire le informazioni»
   nella stessa persona: due voci diverse, o la stessa rinominata? Domanda
   al §8. Le società 1 e 2 nei periodi osservati usano ancora le 36.

**Lo script di prova** si lancia così (codici azienda solo da Railway, mai in un
file):

```bash
cd backend && npm run build
railway run --service Backend node dist/scripts/test-original-skills-fetch.js
railway run --service Backend node dist/scripts/test-original-skills-fetch.js --from 2026-07-05 --to 2026-10-01
```

- **Cosa stampa:** esito, tempi, campi, tipi, scale, formati mascherati, le
  verifiche fra i campi e le competenze per società. Mai nomi, email o
  codici.
- **Dove prende i codici:** da `ORIGINAL_SKILLS_COMPANY_MAP` (ancora da
  impostare sul servizio Backend). Fino ad allora si possono passare solo
  sulla riga di comando con `ORIGINAL_SKILLS_TEST_CODES=…`.
- **Senza codici** si ferma e spiega cosa impostare.

**Il formato nostro.** Il server **non inoltra la risposta così com'è**. La
valida con zod (stringhe numeriche → numeri, trim dei nomi, data → ISO con
fuso Europa/Roma) e la traduce in un formato stabile, l'unico che il frontend
vede. **I dati personali che non servono non escono dal server**: sesso,
anno di nascita, luogo, RAL.

```ts
type OriginalSkillsResult = {
  externalId: string            // «numero intervista»
  companyId: string             // la nostra società, dal codAzienda della riga (mai il codice)
  kind: 'candidate' | 'employee'// da «tipo candidatura»
  fullName: string              // Nome + Cognome, solo per l'anteprima del collegamento
  email: string | null          // null se non è un'email valida
  completedAt: string           // «ultima modifica», ISO 8601
  overall: number               // «risultato» (standardizzato)
  skills: { skillId: string | null; label: string; value: number }[]   // 36; skillId null se non mappata
  roleSkills: { skillId: string | null; label: string; value: number; expected: number; gap: number }[]
}
type OriginalSkillsResponse = {
  scope: 'company' | 'group'    // una società o tutto il gruppo (§2)
  companyIds: string[]
  dataDa: string; dataA: string
  results: OriginalSkillsResult[]
  discarded: number             // righe scartate perché non valide (motivo nei log, senza dati personali)
}
```

Così un cambiamento dell'API tocca un solo file (la traduzione nel server).
Una riga che non rispetta lo schema viene scartata e contata, e non manda in
errore tutta la risposta.

## 4. Collegamento a candidati e dipendenti

| | Recruiting (candidati) | Assessment (dipendenti) |
|---|---|---|
| Dove vivono i dati | sul server (`Candidate`, `CampaignCandidate`) | **solo nel browser** (localStorage) |
| Chiave di collegamento | email: `Candidate.normalizedEmail` esiste già ed è indicizzata | email del dipendente in Anagrafica |
| Chi collega | il server, nella stessa richiesta | il browser, sui dati che ha (il server non conosce i dipendenti) |
| Dove andrebbe il risultato (se un giorno si salva) | `TestResponse` collegata alla `TestInvitation` del candidato | il record del dipendente: richiede «Assessment sul server» (PROGETTO-ASSESSMENT-SERVER.md) |

Casi da gestire in lettura, senza salvare niente:
- **Nessuna corrispondenza:** il risultato compare nell'elenco «Non
  collegati», con nome ed email, per un'associazione manuale futura.
- **Più corrispondenze** (stessa email su due candidati o due campagne): si
  mostrano tutte e non se ne sceglie una a caso.
- **Persona senza email in Original Skills:** non si collega per nome. Gli
  omonimi sono frequenti e un collegamento sbagliato attribuisce un
  punteggio alla persona sbagliata.

## 5. Quali schermate alimenta

Tutto in **sola lettura**, finché non si decide il salvataggio:

| Schermata | Cosa mostra | Oggi |
|---|---|---|
| Recruiting · Migliori Candidati | stato «Test completato» e data, accanto a «Link già inviato» | lo stato si segna a mano («Segna completato», non ancora disponibile) |
| Recruiting · CV Elaborati, «Classifica dopo il test» | il punteggio del test, proposto nel campo «Aggiungi risultato» | il punteggio si inserisce a mano |
| Recruiting · Risultati | i punteggi delle competenze trasversali nel profilo del candidato | dati del seed o inseriti a mano |
| Assessment · Area Valutazioni Trasversali | i punteggi per competenza e Big Five, da confrontare con l'atteso | inserimento manuale o import Excel |
| Assessment · Anagrafica / invio link | «In attesa di test» → «Test effettuato» | aggiornato a mano |

In ogni schermata la stessa azione: **«Leggi da Original Skills»**, con
intervallo di date, e un'anteprima dei risultati trovati, collegati e non
collegati. Il pulsante per importare non c'è finché non c'è il salvataggio.

## 6. `dataDa` / `dataA`

- **Formato:** `YYYY-MM-DD`, confermato dalle specifiche. È lo stesso del
  browser e del server, quindi non serve conversione.
- **Validazione nel server (zod):** date valide, `dataDa ≤ dataA`, nessuna
  data futura, **intervallo massimo 89 giorni**: l'API rifiuta 90 o più con
  `400 date range must be smaller than 90 days` (verificato).
- **Periodi più lunghi:** il server li divide in finestre da 89 giorni, le
  chiama una dopo l'altra e unisce i risultati togliendo i doppioni (per
  `numero intervista`). Massimo 4 finestre per richiesta, cioè circa un anno.
- **Valore di default:** gli ultimi 30 giorni.
- **Fuso orario:** Europa/Roma. Da confermare che `dataA` sia inclusiva.
- **Interfaccia:** due campi data con le stesse primitive dei form e le
  scorciatoie «Ultimi 30 / 89 giorni».

## 7. Affidabilità e costi

- **Timeout:** 15 s verso l'API: una finestra di 88 giorni con 32 persone ha
  richiesto ~4 s. Al massimo un nuovo tentativo, solo per
  errori di rete o 5xx, mai per 4xx.
- **Cache:** in memoria, 5 minuti, per `elenco dei codAzienda + dataDa + dataA`, per
  non ripetere la stessa lettura quando si cambia schermata.
- **Limite di richieste per utente** sulla rotta, come per il login (Fase
  8).
- **Errori dell'API:** sempre `{Cause, Detail}`. `400` per un intervallo
  troppo lungo, `500` per una data non valida, che quindi si scarta prima
  nel server. Un `500` non si ritenta.
- **Errori tradotti per chi legge:** «Original Skills non risponde, riprova
  tra qualche minuto», «Società non collegata», «Intervallo di date non
  valido». Mai il messaggio grezzo dell'API.
- **Traccia:** il modello `AuditLog` esiste già e si può registrare chi ha
  letto, per quale società e quale intervallo. È una scrittura nel database:
  da confermare insieme al salvataggio.

## 8. Domande per chi fornisce l'API

Chiarite dalle specifiche e dalla chiamata di prova:
- endpoint e metodo;
- autenticazione;
- formato delle date e intervallo massimo (< 90 giorni);
- `lingua`;
- struttura della risposta;
- `codAzienda` in ogni riga;
- l'identificativo del test (`numero intervista`);
- la distinzione candidato / dipendente (`tipo candidatura`);
- l'assenza di paginazione;
- gli errori.

Ancora aperte:

1. **Righe dell'account API sempre restituite** (§3.2, seconda verifica): è
   voluto? Si possono escludere dal lato loro? Intanto le scartiamo noi.
2. **Versione nuova del questionario a 42 voci**: quando entra in uso per i
   clienti, quali sono le competenze definitive, e perché «Innovazione»
   compare due volte? «Gestione delle informazioni» sostituisce «Gestire le
   informazioni»?

3. **Scala di `risultato` / `graduatoria`**: è un punteggio standardizzato
   (z)? Come si converte nella scala che il cliente vede?
4. **Scala delle competenze**: 1–10 come le nostre? Il massimo osservato è
   8,11.
5. **«Engagement lavorativo» e «Impegno lavorativo»**: quale corrisponde alla
   nostra «Dedizione al lavoro»? L'altra è una competenza in più (36 contro
   35)?
6. **I campi vuoti** (`ruolo`, `area`, `livello`, `data assunzione`…):
   restano sempre vuoti o si possono valorizzare? Con `ruolo` il
   collegamento alla posizione sarebbe diretto.
7. **`ultima modifica`**: è la data di completamento? In che fuso? `dataA` è
   inclusiva?
8. **Quale società** corrisponde a ciascun codice, e il nome del gruppo.
9. **La durata di `authKey`**: scade? Come si rinnova? A chi si chiede in
   caso di compromissione?
10. **Limiti di richieste** al minuto o al giorno.
11. Un **ambiente di prova** con dati finti, per sviluppare senza leggere
   dati veri.
12. Esiste un **webhook** (notifica a test completato)? Il backend ha già lo
    schema per riceverlo (`TestResponse.webhookEventId`, verifica della
    firma).

## 9. Stima

### 9.1 Lettura in sola visualizzazione (nessun salvataggio)

| Parte | Giornate |
|---|---|
| Rotta nel server: variabili, `requireAuth`/ruolo/società, validazione e finestre di date, traduzione e normalizzazione della risposta, tabella delle competenze, errori, cache | 2–3 |
| Corrispondenza `codAzienda` per società (`ORIGINAL_SKILLS_COMPANY_MAP`) | 0,5 |
| Interfaccia in sola lettura nelle schermate del §5 (pattern di libreria, catalogo) | 3–4 |
| **Totale** | **5,5–7,5** |

### 9.2 Integrazione completa

Si aggiunge alla 9.1. Le due strade sono diverse perché i dati dei due moduli
vivono in posti diversi.

**Assessment, tramite lo stato del browser con anteprima.** I dipendenti
vivono nel browser, quindi il risultato si scrive lì, con lo stesso percorso
dell'import Excel di oggi:
- il server legge e normalizza (9.1);
- il browser mostra un'**anteprima come quella dell'import Excel**: righe
  collegate per email, non collegate, ambigue, e le competenze che cambiano
  con il valore vecchio e il nuovo;
- l'HR conferma;
- si aggiornano i punteggi delle competenze trasversali e lo stato «Test
  effettuato».

| Parte | Giornate |
|---|---|
| Collegamento per email ai dipendenti, solo `tipo candidatura = Dipendente dell'impresa` | 0,5–1 |
| Anteprima riusando il pattern dell'import Excel, con le differenze per competenza | 2–3 |
| Scrittura nello stato del browser (35 competenze, Big Five ricalcolati, stato del test) | 1–1,5 |
| Prove con dati reali e casi limite (senza email, doppioni, competenza non mappata) | 1 |
| **Totale Assessment** | **4,5–6,5** |

Limite: finché Assessment non è sul server, l'import vale per il browser in
cui si fa. Lo stesso limite dell'import Excel di oggi.

**Recruiting, salvataggio su `TestResponse` tramite email.** I candidati
sono sul server, quindi il risultato si salva lì:
- collegamento: `Candidate.normalizedEmail` → `CampaignCandidate` della
  campagna attiva → `Shortlist` → l'ultima `TestInvitation`;
- su quell'invito si crea la `TestResponse` (`score`, `completedAt`,
  `rawResult` con le competenze normalizzate, `receivedVia`);
- il candidato passa a `TEST_HA_RISPOSTO`.

| Parte | Giornate |
|---|---|
| Migrazione: valore `ORIGINAL_SKILLS` in `ReceivedVia`, campo `externalId` (= `numero intervista`) unico su `TestResponse` per non importare due volte | 0,5–1 |
| Collegamento email → invito (più campagne, invito mancante, candidato senza invito) e regole di stato | 1,5–2 |
| Importazione idempotente (stesso `numero intervista` = nessun doppione), `AuditLog` di chi ha importato | 1–1,5 |
| Interfaccia: anteprima e conferma in Migliori Candidati / CV Elaborati; il punteggio entra in «Classifica dopo il test» | 2–3 |
| Prove con dati reali e casi limite | 1 |
| **Totale Recruiting** | **6–8,5** |

**Importazione automatica (facoltativa).** Lettura notturna degli ultimi 2
giorni per ogni società collegata, con le stesse regole: +1,5–2 giornate.
Richiede un processo pianificato su Railway.

| Riepilogo | Giornate |
|---|---|
| Lettura in sola visualizzazione (9.1) | 5,5–7,5 |
| + Assessment completo | 4,5–6,5 |
| + Recruiting completo | 6–8,5 |
| **Totale integrazione completa** | **16–22,5** (+1,5–2 con l'importazione automatica) |

Le stime valgono con le risposte alle domande 1–3 del §8: scale e
corrispondenza delle competenze decidono come si scrivono i punteggi.
