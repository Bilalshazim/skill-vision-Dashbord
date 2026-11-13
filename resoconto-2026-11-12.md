# Resoconto del 12–13 novembre 2026

Per Alessio e Roberto. Tre parti, nell'ordine del giro:

- **A**: i dati dimostrativi di Acme;
- **B**: bilancio e antivirus;
- **C**: le decisioni di Roberto del 12/11 (Analisi predittiva, Dati aziendali, Intervista, importazione da Excel).

In fondo, cosa resta.

**Come è stato verificato.** In produzione ha provato Bilal Shazim, il 13/11, con l'account `bilal.a@skill-vision.it`
su Acme Corp. I valori «in produzione» sono quelli letti da lui a schermo. I valori «in locale» li ha misurati
l'assistente sui dati di prova di Acme. Dove i due valori sono diversi si scrivono tutti e due, con il motivo.

Quello che non è stato provato in produzione è scritto «non verificato in produzione», con il motivo.

**Perché i numeri di Acme non coincidono.** In produzione Acme ha 23 persone; in locale 26, di cui 25 valutate (ci
sono due persone aggiunte nelle prove). Per questo percentuali ed euro differiscono di qualche punto.

| | Punto | In produzione |
|---|---|---|
| A | Dati dimostrativi di Acme (nome, email, sesso) | Verificato |
| B1 | Bilancio dimostrativo per ogni account di Acme | Verificato |
| B2 | Antivirus ClamAV | **Non fatto**: ClamAV non è ancora su Railway |
| C1 | Menu «Analisi predittiva» | Verificato |
| C2 | Dati aziendali, pagina sua | Verificato in parte: il salvataggio della finestra nuova non è stato provato |
| C3 | Intervista com'era prima | Verificato |
| C4 | Importazione dell'anagrafica da Excel | **Non verificato in produzione**: provata solo in locale |
| C5 | I cinque campi tolti da Dati aziendali e gli euro | Analisi, sotto |

---

## A · I dati dimostrativi di Acme

**Il problema.** Nella demo l'Intervista diceva «Demo Company S.r.l.» e le email erano `@democompany.com`. Il sesso
delle persone era estratto a caso, così Antonio Bianchi risultava Femminile.

**Cosa è cambiato.** I dati demo usano «Acme Corp», `@acme.example` (lo stesso dominio di Recruiting) e il sesso
secondo il nome. Non si è usato il seed: si sono corretti solo quei valori, sui dati già salvati. Punteggi, RAL e
valutazioni non si toccano.

**Perché la prima versione non è partita in produzione.** La correzione del 12/11 stava nel browser e riconosceva la
società demo dalla variabile `VITE_DEMO_COMPANY_IDS`. In produzione quella variabile è vuota, mentre il distintivo
«Dati dimostrativi» dipende da un'altra variabile. Il 13/11 la correzione è passata sul server: all'avvio del backend,
sulle società demo e su Acme Corp se porta ancora l'impronta dei dati demo. Gira una volta sola: ai riavvii successivi
non trova niente da cambiare.

| Controllo | In produzione (Bilal, 13/11) | In locale |
|---|---|---|
| Email | tutte `@acme.example` | 26 su 26 `@acme.example` (prima 25 `@democompany.com`) |
| Sesso | Antonio Bianchi Maschile, Andrea Colombo Maschile, Sara Colombo Femminile, Andrea Costa Maschile, Elisa Costa Femminile, Laura De Luca Femminile | sesso sbagliato 23 → 0, con i dati messi come in produzione |
| Persone registrate | 23 | 26 (2 aggiunte nelle prove) |
| Intervista | «Acme Corp · CEO / Amministratore Delegato · 11 novembre 2026» | «Acme Corp» |
| Contatti in Dati aziendali | `hr@acme.example`, `ceo@acme.example`, `cfo@acme.example` | uguale |

---

## B · Bilancio e antivirus

### B1. Il bilancio dimostrativo
**Il problema.** Il bilancio dimostrativo si caricava solo se l'account apparteneva alla società demo. Lo staff, come
l'account di Alessio, non ha una società sua, quindi in produzione non si era mai caricato.

**Cosa è cambiato.** Ora si carica dal server per Acme ed è della società: lo vede ogni account che apre Acme.

**In produzione (Bilal, 13/11):** in fondo a Dati aziendali «BILANCIO CARICATO IL 13/11/2026 · Bilancio dimostrativo
(cifre inventate)», con Ricavi operativi € 9.400.000, Costo del personale € 2.100.000 e Utile netto € 610.000.

| Pagina | In produzione (Bilal, 13/11) | In locale |
|---|---|---|
| Il valore | copertura mansioni 93%; L'impatto € 610.530 | 93%; € 578.249 |
| Le perdite invisibili | Ring 30%; valore espresso 80% (−20%); L'impatto € 811.870 | 28%; 80% (−20%); € 680.549 |
| Il potenziale | 17% (4 su 23); valore espresso 80%; L'impatto € 213.686 · Prudenziale € 122.106 · Base € 213.686 · Espansivo € 293.055 | 16% (4 su 25); 80%; € 202.387 · € 115.650 · € 202.387 · € 277.559 |
| Dove intervenire | Ring 43% (come la frase); valore espresso 80%; L'impatto € 248.599 · Prudenziale € 146.952 · Base € 248.599 · Espansivo € 338.035 | 44%; 80%; € 220.012 · € 128.160 · € 220.012 · € 300.299 |

**Il motivo della differenza** è uno solo, e vale per ogni riga: le persone valutate sono 23 in produzione e 25 in
locale. Le formule sono le stesse del motore ROI, e il bilancio è lo stesso.

### B2. Antivirus · non fatto
Il motore ClamAV è collegato nel codice dal 10/11 e rifiuta il file se il motore non risponde. Manca il servizio su
Railway, che richiede l'accesso a Railway: le istruzioni sono in DECISIONI («ClamAV su Railway: le istruzioni»).

1. Aggiungere un servizio dall'immagine `clamav/clamav:stable`, con almeno 2 GB di memoria.
2. Sul backend, impostare `CLAMAV_HOST=<nome del servizio>.railway.internal`.
3. Se il backend non si collega, aggiungere a ClamAV `TCPAddr ::`: la rete privata di Railway è IPv6.

Finché ClamAV non c'è, il modulo di candidatura della demo rifiuta ogni CV. Per tenerlo aperto, solo sulla demo, c'è
`ANTIVIRUS_ALLOW_BASIC=true`. Una società vera non passa mai senza il motore.

---

## C · Le decisioni di Roberto del 12/11

### C1. Il menu «Analisi predittiva»
È la prima voce di Assessment, sopra Home, con Dati aziendali · Intervista · Anagrafica. Si apre:
- al passaggio del mouse, dopo un breve ritardo, e resta aperto quando il mouse esce;
- con il clic, il tocco e Invio.

È aperto quando la pagina attiva è una delle tre. `/assessment` apre sempre la Home.

- **In produzione (Bilal, 13/11):** prima voce sopra Home; si apre su Dati aziendali · Intervista · Anagrafica.
- **In locale:** si apre 397 ms dopo l'arrivo del mouse e resta aperto all'uscita; il clic chiude, Invio riapre; il
  percorso è «Home / Analisi predittiva / Anagrafica»; a 390px il tocco apre il gruppo.
- **Limite della prova:** un passaggio del mouse più breve del ritardo non si riesce a riprodurre con l'automazione.

### C2. Dati aziendali, di nuovo una pagina sua
Dall'alto:
1. la finestra **«Dati dell'azienda»**, con gli 11 campi nell'ordine chiesto;
2. **Ruoli chiave**, come prima;
3. il **bilancio**, in fondo.

Sono usciti dalla pagina, non dai dati: durata dell'esercizio, compenso, costo delle azioni, turnover, assenze, la
riga «Atteso 7,0», «Totale dipendenti per tipologia», Sedi e Contatti.

**Un dato una volta sola.** Nome e partita IVA esistono già sul server, nella società. Se la finestra li scrivesse lì,
cambierebbe il nome della società in Recruiting, in Assessment e nell'informativa dei CV: è la «fonte unica» della
proposta D, che aspetta Roberto. Per questo la finestra parte da quei dati quando è vuota e salva nel profilo
aziendale di Assessment, senza toccare la società. Si collega alla fonte unica quando Roberto avrà deciso.

- **In produzione (Bilal, 13/11):** contatti `hr@` / `ceo@` / `cfo@acme.example`; bilancio in fondo, caricato.
  **Non verificato in produzione:** il salvataggio della finestra «Dati dell'azienda».
- **In locale:**
  - la finestra parte da Acme Corp, Via Roma 12, Milano, `hr@acme.example`;
  - i controlli scrivono quattro errori sotto i campi;
  - dopo il salvataggio e il ricaricamento restano PEC, partita IVA, ATECO, 85 dipendenti, 23 da valutare e l'altra
    sede Via Torino 5 · Torino;
  - il bilancio si salva appena caricato, senza toccare i cinque campi;
  - una colonna a 390px, due sopra i 1024px.

### C3. L'Intervista com'era prima
**Commit di riferimento: `bb565c1`**, l'ultimo che tocca l'Intervista prima di `d900f5e` (il rilascio del 7/11). La
pagina del riepilogo è quella, con le caselle CT · CP · CT+CP, i quattro pulsanti in alto e «Fase successiva».

Del lavoro successivo restano solo due cose:
- si passa da una domanda all'altra **senza rispondere**;
- le risposte mancanti **non contano** nel punteggio, e «Calcolato su N domande su 5» compare solo quando manca qualcosa.

Una domanda saltata mostra «—» nel suo riquadro: altrimenti il valore di partenza del cursore sembrerebbe una risposta.

- **In produzione (Bilal, 13/11):** impaginazione di prima; intestazione «Acme Corp · CEO / Amministratore Delegato ·
  11 novembre 2026»; le domande si saltano e «Calcolato su N domande su 5» funziona.
- **In locale:**
  - con tutte le risposte, 6,0 e nessuna riga;
  - con la domanda 2 saltata, 6,3 e «Calcolato su 4 domande su 5». Calcolo a mano: (0,3 × 6,5 + 0,25 × 6,5 + 0,1 × 4
    + 0,1 × 7,5) ÷ 0,75 = 6,3;
  - una nuova intervista portata fino in fondo senza rispondere: «—», «Calcolato su 0 domande su 5» e cinque «Senza
    risposta»;
  - l'intervista del demo è stata rimessa com'era.

### C4. Importazione dell'anagrafica da Excel · non verificato in produzione
In fondo all'Anagrafica c'è il riquadro «Importa l'anagrafica da Excel», con il trascinamento del file, «Carica file»
e «Scarica il modello». Prima di salvare, un'anteprima dice:
- quante persone entrano e quante si aggiornano;
- i probabili doppioni;
- gli errori riga per riga (riga, campo, problema).

Le regole:
- **Riconoscimento:** per email. Senza email, una riga con nome, cognome e mansione di una persona già presente è un
  «probabile doppione», e non si aggiorna da sola.
- **Salvataggio tutto o niente:** una sola chiamata, una sola transazione sul server. Con un errore nel file non si
  salva niente; se il server sbaglia, non resta niente a metà.
- **Chi non è nel file non si archivia.**
- **La RAL** la importano solo gli amministratori, e il server lo controlla di nuovo.

**In locale:**
- un file con errori dà 7 errori, e il pulsante per importare resta spento;
- un file corretto porta 1 persona nuova (con la mansione nuova «Data analyst»), 1 persona aggiornata per email (il
  reparto cambia, i suoi 35 punteggi e il 6,3 restano) e 1 probabile doppione, che non viene toccato;
- un lotto con una persona non valida viene respinto (400) e non si salva nessuno;
- 7 test automatici;
- i dati di prova sono stati tolti dal database locale.

**Il modello di Roberto non è ancora arrivato.** «Scarica il modello» oggi dà un file provvisorio con le colonne qui
sotto e un foglio di istruzioni. Quando arriva il suo, si mette nel progetto e si adattano le colonne in un solo punto
(`IMPORT_COLUMNS`).

| Colonna del modello provvisorio | Campo dell'Anagrafica | Obbligatoria | Altri nomi accettati |
|---|---|---|---|
| Nome | Nome | sì | — |
| Cognome | Cognome | sì | — |
| Email aziendale | Email | no (se c'è, riconosce la persona) | Email, E-mail, Mail |
| Sesso | Sesso | no | Genere (M/F, Maschile/Femminile) |
| Area | Area | no | — |
| Reparto | Reparto | no | — |
| Mansione | Mansione | sì | Ruolo |
| Attività svolte | Attività svolte | no | Descrizione mansione, Attività |
| Tipo rapporto | Tipo rapporto | no (vuoto: Dipendente) | Tipo contratto, Contratto |
| Livello CCNL | Livello CCNL | no | Livello |
| RAL lorda annua | RAL | no (solo amministratori) | RAL |
| Benefit riconosciuti | Benefit | no | Benefit |

**Campi dell'Anagrafica fuori dal modello:** il responsabile diretto, le assenze programmate e il tipo di profilo.
Si compilano a mano nella scheda della persona.

**Quando arriva il modello di Roberto,** l'elenco delle colonne senza un campo corrispondente, e dei campi
obbligatori senza colonna, va mandato ad Alessio: non si aggiungono campi da soli.

### C5. I cinque campi tolti da Dati aziendali e gli euro
I valori salvati restano nei dati (quelli di Acme compresi), e il motore ROI continua a usarli. Senza un valore, il
motore li conta come zero, e la durata come 12 mesi. Non si inventano valori sostitutivi.

| Campo | Dove entra nel motore ROI | Senza il valore |
|---|---|---|
| Durata dell'esercizio | Riporta all'anno tutte le voci del bilancio (× 12 / mesi) | Si usano 12 mesi: un esercizio più breve o più lungo non si riporta all'anno, e tutti gli euro cambiano in proporzione. Il file del bilancio può portare la durata da sé (riga «mesi») |
| Compenso dell'assessment | Investimento totale: ROI, rientro dell'investimento, soglie di pareggio, quota sull'EBITDA, «massimo per le azioni» | Le quattro cifre delle pagine dei risultati non cambiano. Nel Report ROI il ritorno percentuale e il rientro non si calcolano (investimento zero) |
| Costo delle azioni di sviluppo | Come il compenso: entra nell'investimento totale | Come sopra |
| Turnover | Costo delle uscite (uscite × costo di sostituzione): entra nel totale delle Perdite invisibili e nel beneficio di Dove intervenire | La voce turnover vale zero: gli euro di Le perdite invisibili e di Dove intervenire scendono di quella parte. Il valore e Il potenziale non cambiano |
| Assenze | Costo delle assenze (costo del personale × quota di assenza): entra nel totale delle Perdite invisibili e nel beneficio di Dove intervenire | Come il turnover: quella parte vale zero |

**Quale cifra usa ogni pagina:**
- Il valore: il divario dall'atteso;
- Le perdite invisibili: il totale (divario + turnover + assenze + copertura);
- Il potenziale: l'effetto degli interventi sul divario;
- Dove intervenire: il beneficio (divario + turnover + assenze).

**Per le società vere:** finché Roberto non dice dove raccogliere turnover e assenze, i loro euro sulle Perdite e su
Dove intervenire contano solo il divario.

---

## Cosa resta

- **ClamAV su Railway** (B2): servizio e `CLAMAV_HOST`, oppure `ANTIVIRUS_ALLOW_BASIC=true` per la sola demo.
- **Due prove in produzione mancano:** l'importazione da Excel, con un file di prova, e il salvataggio della finestra
  «Dati dell'azienda».
- **Il modello Excel di Roberto,** per sostituire quello provvisorio e confrontare le colonne.
- **`VITE_DEMO_COMPANY_IDS` su Railway,** con l'id di Acme in produzione (consigliato): così anche gli strumenti demo
  del browser riconoscono la società.
- **In attesa di Roberto:**
  - Big Five ideale per posizione;
  - una sola fonte per società e posizioni (proposta D);
  - la card degli euro senza bilancio;
  - peso, soglia e regola di blocco;
  - Area valutazioni;
  - dove raccogliere i cinque campi tolti da Dati aziendali.
