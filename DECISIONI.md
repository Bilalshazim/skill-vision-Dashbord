# Decisioni

Formato:  — opzioni, cosa cambia, raccomandazione, opzione presa.

## Primo accesso con password provvisoria · 2026-11-03
Richiesta di Roberto: creando un utente la password non deve essere
obbligatoria; al primo accesso l'utente ne crea una sua, salvata sul server.
- **Opzioni**: (a) utente senza password, che al primo accesso con la sola
  email ne sceglie una; (b) password provvisoria — scritta o generata
  dall'amministratore, o generata dal server se il campo resta vuoto — che
  l'utente sostituisce al primo accesso.
- **Cosa cambia**: con (a) chiunque conosca l'email o il nome utente di un
  account appena creato se ne prende l'accesso prima del titolare: con dati
  di persone reali non si può. Con (b) per entrare serve la provvisoria, che
  ha solo chi l'ha ricevuta.
- **Presa (b).** Il campo password del nuovo utente è facoltativo; vuoto, il
  server genera 18 caratteri e li restituisce una volta sola, mostrati con
  «Copia i dati di accesso». Ogni password data dall'amministratore a un
  altro utente (nuovo utente o «Cambia password») è provvisoria
  (`mustChangePassword`); quella che si sceglie per sé no.
- **Il blocco è sul server**: finché la password è provvisoria passano solo
  `/auth/me`, `/auth/me/password` e `/auth/me/preferences`; il resto
  risponde 403 `password_change_required`. L'interfaccia mostra la scelta
  della password (FirstAccessPage) al posto di ogni pagina.
- Salvata la password nuova, le altre sessioni dell'utente si chiudono e
  questa continua con token nuovi: non deve rifare l'accesso.

## Gestione utenti dalle Impostazioni · 2026-11-03
Richiesta di Roberto: cambiare le password e creare utenti dall'app, solo lui
(PLATFORM_ADMIN), con uscita automatica dell'utente a ogni cambio di password.
- **Chi**: solo PLATFORM_ADMIN, deciso dal server (403 per gli altri ruoli,
  COMPANY_ADMIN compreso); la scheda è nascosta a chi non lo è.
- **Le password non si mostrano.** Nel database c'è solo l'hash bcrypt: non
  esiste una password da far vedere. Si sceglie una nuova password (con
  «Genera» e l'occhio per leggerla mentre la si scrive).
- **Uscita immediata** — opzioni: (a) solo revoca dei refresh token: l'utente
  resta dentro fino a 3 ore, finché scade il token d'accesso; (b) versione
  della sessione nel token, controllata dal server a ogni richiesta: esce
  alla prima chiamata, al massimo 30 s dopo con il controllo periodico.
  Presa (b): costa una lettura per chiave primaria a richiesta, trascurabile.
- **Nome utente**: facoltativo, accanto all'email (che resta obbligatoria:
  serve agli inviti e ai modelli email). Minuscolo, senza @.
- **Mansione** («designation»): testo descrittivo, non dà permessi. I
  permessi vengono dai cinque ruoli che il backend ha già; a schermo
  «Operatore» è RECRUITER. Nessun ruolo nuovo inventato.
- **Regole della password**: le stesse dello script del gruppo di lavoro
  (14 caratteri, minuscole, maiuscole, cifre, nessuna parola pubblica).
- **Protezioni**: non si toglie l'ultimo PLATFORM_ADMIN attivo (né per ruolo
  né per stato). Un utente non si cancella: si disattiva, i dati restano.
- **Dove sta il codice**: `SettingsDialog` resta un pattern senza dati e
  riceve la scheda come slot; il pezzo che legge il server sta in
  `layouts/UsersSettings.tsx`, accanto alla Topbar.

## Le pagine sulle tavole del cliente · 2026-11-01
Tavole ricevute: «Le perdite invisibili» (modello delle pagine dei
risultati), «Panoramica · Sintesi», «Assessment · 1 Home», «Recruiting · 1 Home
· Profilo della ricerca», «Colori dei grafici · oggi e proposta».
- **Scala del sito** nelle pagine di presentazione (le due home, le pagine dei
  risultati, la Sintesi): token `text-site-h1…h4` e `text-site-body-lg` in
  `globals.css`, dai valori delle fondamenta; `PageHeader level="presentation"`.
  È l'eccezione del cap. 7 ("Registro"); le pagine di lavoro restano su
  `text-app-*`. Scostamento: `h4` a 600 invece di 500, come nelle tavole.
- **Pagine dei risultati**: sezioni separate da un filo, etichetta in stile
  label, frase grande a sinistra e grafico a destra; «Perché è importante» in
  un riquadro tenue; riquadri delle criticità con l'etichetta nel colore di
  stato e la parola; impatto con il numero grande e «€ [—]» con l'etichetta «In
  attesa della formula»; suggerimento con la prima frase come titolo e un
  link nel testo (non più il bottone lime); nota dei dati dimostrativi e
  «Torna alla home» sulla stessa riga. Tolto il `max-w-5xl` che lasciava metà
  schermo vuota.
- **Home e Profilo**: `WindowCard` con titolo grande, domanda o verbi in fondo
  e la freccia; intestazione della pagina con il sovratitolo (società ·
  modulo). Profilo: la barra Società · Campagna · CIP è in cima ed è l'unico
  posto dove si cambiano società e posizione (scelta nel campo quando ce n'è
  più di una, matita per rinominare); la barra del contesto non compare lì.
- **Sintesi della Panoramica**: titolo della tavola, valore a rischio con la
  cascata come segnaposto tratteggiato (`CascadePlaceholder`: nessun numero
  finché non c'è la formula), quattro `SummaryCard` con il loro dato, «Dove si
  perde valore» accanto a «Cosa fare, in ordine di impatto» numerato (note
  modificabili invariate, totali in «€ [—]»), le cinque fasce in una card sola.
  «Apri il piano d'azione» porta a Piani di sviluppo, «Chiedi all'assistente»
  all'Assistente IA: pagine esistenti, nessuna funzione nuova.
- **Le quattro card della Sintesi** usano i titoli delle finestre di oggi (Il
  valore, Le perdite invisibili, Il potenziale, Dove intervenire), non quelli
  della tavola (Il valore che genera, La mappa dei valori…), che sono i nomi
  vecchi del Foglio 3. Le voci di «Le perdite invisibili» (competenze
  mancanti, turnover, assenze, inefficienze) sono segnaposto in euro.
- **Non fatto**: il punto lime a fine andamento (tavola dei colori): il marker
  di Bklit esiste solo nel LineChart, non nel ComposedChart di `TrendChart`;
  aggiungerlo vuol dire toccare Bklit. Il menu di Assessment della tavola
  (Valori complessivi in testa, senza Competenze trasversali / 5P) non è stato
  applicato: è navigazione, non aspetto, e va confermato.

## Fase 7 — verifica finale e risposte per il resoconto · 2026-11-01

### Email e audit
L'HTML delle email non legge le variabili CSS: i colori ci vanno scritti.
Opzioni: (a) escludere tutto il file dall'audit; (b) esenzione riga per riga,
solo per valori in palette (`// audit-identita:email`), con fuori palette,
bianco e nero che restano difetti. Presa (b). Nel passaggio i colori delle
email sono passati sulla palette (prima grigi freddi fuori sistema e bianco
puro), il bottone primario su `accent-400` come `--primary`, i bottoni da
"INIZIA IL TEST" / "COMPILA LE SCHEDE" a minuscolo (regola 8), pesi 700 → 600,
raggio 16px, Geist in testa ai caratteri. Test delle email aggiornati.
Audit dell'intero repository: **0 difetti** (erano 15).

### Testi
- "Skill-Vision" con il trattino in ogni testo a schermo e nelle email (alt
  del logo, barra superiore, scelta del modulo, configurazione email,
  mittente predefinito, email di prova). Restano senza trattino i commenti
  del codice e i nomi nel codice (`SkillVisionCard`, `SKILLVISION_ADMIN`).
- "Original Skills": non compare più a schermo; resta nei nomi del codice
  (`OriginalSkillsPreviewPage`, API `/original-skills`), come vuole il cap. 7.
- "recuperare": nessun uso per i soldi. Restano "recuperarne il riferimento"
  (un errore tecnico in `backend-sync.ts`) e un commento.
- Euro: nessuna cifra calcolata nelle pagine nuove (segnaposto «€ [—]»). Le
  pagine tecniche che mostrano la RAL, dato inserito, non sono toccate.

### Le nove risposte
1. **56 candidature su una posizione non aperta**: il vecchio imbuto metteva
   come prima fase `readCandidates().length`, tutto l'archivio CV, che non
   appartiene a nessuna posizione e si classifica sull'unico profilo salvato
   (`DEFAULT_ROLE = 'Sales Account Manager'`); le fasi dopo sommavano le
   pipeline delle posizioni aperte (a 0). Corretto il 2026-10-23
   (`position-funnel.ts`). Resta con la stessa causa l'Assistente IA
   (`lib/ask.ts`, "Posizione: Sales Account Manager" sull'archivio intero).
2. **Colloqui di restituzione**: **10**, cioè le persone con
   `feedbackNeeded` acceso. «Colloquio di restituzione necessario» in Piani di
   sviluppo è l'etichetta dell'interruttore, presente su tutte le 23 schede.
   Nei dati di prova è acceso per i profili "critical" e "developing" più il
   15% casuale (`demo-data.ts`).
3. **"Dati aggiornati al"**: è la data del dato più recente, non la data di
   oggi. Assessment: il massimo fra `createdAt` delle persone, date dello
   storico soft e professionale, creazione e completamento delle valutazioni
   (`lastDataUpdate`). Recruiting: il massimo fra `addedAt` dei preselezionati,
   `addedAt` dei risultati dei test e `decidedAt` della scelta. Senza date, la
   frase non compare.
4. **Date delle candidature**: sì. Sul server `CampaignCandidate.createdAt` /
   `updatedAt`, `Candidate.createdAt`, `Cv.uploadedAt`, `Shortlist.addedAt`.
   Nel modello del browser `PrescreenedEntry.addedAt`, `TestResult.addedAt`,
   `winner.decidedAt`, `Interview.scheduledAt`, `CandidatePoolEntry.createdAt`
   (facoltativo). La scheda `Candidate` locale non ha una data sua.
5. **Un campo che distingue i manager**: **no, nessuno esplicito.** Original
   Skills manda solo Nome, Cognome, codAzienda, numero intervista, ultima
   modifica, sede, risultato e competenze: nessun ruolo né tipo. In Anagrafica
   ci sono tre campi vicini ma non decisivi: `livelloCcnl` (testo libero, può
   contenere "Quadro" o "Dirigente" ma non è un elenco chiuso), `tipoProfilo`
   (oggi sempre "Employee") e `responsabileId` (chi è responsabile diretto di
   qualcuno). `MANAGER` nello schema è un ruolo dei **valutatori**, non delle
   persone. Nessun filtro applicato: il criterio lo dà Roberto (cap. 7).
6. **Approfondimenti senza una pagina vera**: uno solo, **«Stato dell'arte»**
   (in «Chi è più adatto?» e nel menu L2): la rotta rimanda alla Panoramica
   dal 2026-10-23. Tutte le altre voci aprono una pagina esistente. «Area
   risultati» (Il valore) apre «Risultati Valutazioni Trasversali» o
   «Professionali» secondo il modulo, perché l'Area è un gruppo del menu e non
   una pagina.
7. **Dove compare "Posizioni aperte"**: Imbuto di selezione (scelta «Tutte le
   posizioni aperte», intestazione "Tutte le posizioni aperte di …", tabella
   "Per posizione"); Panoramica di Recruiting (stessa scelta e intestazione);
   "Nessuna posizione aperta" nella barra del contesto, in Avanzamento e nel
   Profilo della ricerca; "per ogni posizione aperta" nell'intestazione di
   Avanzamento. La StatCard "Posizioni aperte" della Panoramica è tolta. Nel
   codice ma non a schermo: `kpis` di `use-recruiting-home-data.ts` e il
   banner trasversale spento (`crossBannerClosedPositionsSub`).
8. **Componenti dei grafici rifatti**: `charts/bar.tsx` (prop `outline`),
   `charts/bar-reference.tsx` (nuovo), `CategoryBars` (riferimento
   tratteggiato, `highlight`), `TrendChart` (Area di Bklit, dissolvenza,
   variante `spark`), `RingStat` (un anello), `CompletionRing` (`center`),
   `ChartLegend` (riferimento sempre tratteggiato), `lib/chart-colors.ts`
   (ruoli del 2026-10-26), `SelectionFunnel` (cinque stati), `BandCard`
   (`showPeople`). Invariati e già conformi: `ScoreGauge`, `ProfileRadar`
   (cambia solo il colore del riferimento), `DistributionBar`,
   `QualityStackedBar`, `ScatterMatrix`. Effetto nelle pagine: tutti i grafici
   "Ottenuto / Atteso" (Valutazioni soft, Customer care, 5P, Comitato), le
   due Panoramiche, le pagine dei risultati, l'Imbuto.
9. **Segnaposti ed etichette mancanti**: euro ovunque («€ [—] · In attesa
   della formula»: pagine dei risultati, valore a rischio, euro per area,
   costi evitabili per intervento); la cascata del valore a rischio; «Il
   valore» intero («Contenuto in preparazione»); i testi di «Le perdite
   invisibili» (tavola non nel repository); il nome del quinto stato
   («Selezione conclusa» o «Selezione valutatori»); gli esiti «In riserva» e
   «Non selezionato» (scritti «—», nessun dato); il punteggio complessivo su
   1–10 (formula del cliente); la dicitura italiana di `ma1`; le soglie delle
   fasce che il cliente deve confermare (oggi nota solo quella dei Critici).

## Grafici sulle regole del 2026-10-26, Panoramiche, riga del percorso · 2026-11-01
- **Riferimento sulle barre**: Bklit non ha un riferimento per riga nel
  BarChart (la ReferenceArea è una fascia unica). Opzioni: (a) uno strato
  nostro, `charts/bar-reference.tsx`, che legge le scale del BarChart dal
  contesto e disegna un trattino per categoria; (b) visx; (c) lasciare la
  seconda barra. Presa (a): niente dipendenze nuove, Bklit resta com'è.
  `CategoryBars` disegna così ogni serie `reference`: tutti i grafici
  "Ottenuto / Atteso" (Soft, Customer care, 5P, Comitato) diventano una barra
  sola con l'atteso tratteggiato, senza toccare le pagine.
- **Bordo della barra in evidenza**: aggiunta a `charts/bar.tsx` la prop
  `outline` (1,5px, statica e animata). È uno scostamento da Bklit, minimo,
  per `chart-highlight-stroke`. Chiude la voce aperta nel paragrafo sotto.
- **Colori** (`lib/chart-colors.ts`): riferimento → `chart-reference`; due
  serie vere → inchiostro + `chart-1`; `chart-compare` solo per "nella norma".
  Legenda: un riferimento è sempre una linea tratteggiata.
- **RingStat**: l'atteso era un secondo anello in `chart-compare` (la "seconda
  barra" in tondo). Ora un anello solo; l'atteso si scrive sotto. Un segno
  tratteggiato sull'anello Bklit non lo fa: non inventato.
- **Sfumature di Bklit** (esenzione del 2026-10-30): `TrendChart` usa l'Area
  di Bklit per le serie `area` (gradiente nel colore della serie, inchiostro)
  e la griglia con la sua dissolvenza; prima erano spente. Variante `spark`
  per la sparkline sotto il Gauge.
- **Gauge**: arco in `chart-mono`, anche nella Panoramica. Il lime
  (`chart-highlight`) sarebbe ammesso per il numero principale, ma le tacche
  del Gauge non hanno bordo e su fondo chiaro sparirebbero.
- **Panoramica di Assessment**: Sintesi (predefinita) e Dettaglio nel
  selettore dell'intestazione, `?vista=dettaglio`. Le quattro azioni
  (Formazione, Coaching, Riorganizzazione, Talento) escono da "Da fare
  adesso" e vanno in "Cosa fare, in ordine di impatto" della Sintesi **con le
  loro note modificabili**: nessuna funzione persa. Valore a rischio e cascata
  sono segnaposto (euro senza formula): la cascata non si disegna, quindi
  nessun grafico visx per ora. "Dove si perde valore": barre delle aree con
  l'atteso tratteggiato, la più bassa in evidenza; l'euro per area è un
  segnaposto.
- **Panoramica di Recruiting**: tutto sulla posizione attiva, con «Questa
  posizione / Tutte le posizioni aperte» (`?ambito=tutte`). Da fare adesso
  come la tabella di CLAUDE.md, senza sovrapposizioni (CV da valutare, link
  da inviare, test da leggere = completati non idonei senza colloquio,
  colloqui da fissare = idonei senza colloquio). Tolte le righe "Candidati da
  invitare al test" e "Posizioni senza candidati" e il bottone «Nuova
  ricerca» (la pagina resta nel menu): erano scorciatoie, non funzioni.
- **Riga del percorso** su ogni pagina di lavoro, calcolata dal menu
  (`recruitingTrail`, `getPageTrail`): Recruiting "Profilo della ricerca /
  livello / pagina" (il livello porta alla pagina principale, o alla prima
  voce); Assessment "Home / gruppo / pagina". Non sulle due home né sulle
  pagine dei risultati, che hanno la loro.

## Le due home e le sette pagine dei risultati · 2026-11-01
- **Un'impaginazione sola**: pattern `ResultsPage` (nel catalogo), usato
  dalle sette pagine; riceve tutto calcolato (lib/results.ts dei due moduli).
  Pattern nuovi: `WindowCard` (finestre della Home e card del Profilo della
  ricerca), `InfoTip` (ⓘ, Tooltip di shadcn su un bottone: si apre col
  focus), primitiva `Breadcrumb` di shadcn con separatore « / ».
- **Riga del percorso**: le voci prima della corrente sono link, la corrente
  è testo (`aria-current`). Opzioni: (a) anche la corrente link a sé stessa;
  (b) corrente non cliccabile. Presa (b), come shadcn: un link alla pagina
  aperta non porta da nessuna parte. Solo sulle pagine dei risultati: la riga
  su ogni pagina tecnica (CLAUDE.md, Fase 6) **resta da fare**.
- **Rotte**: Assessment `/assessment` e `/home` → Home, `/panoramica`,
  `/il-valore`, `/perdite-invisibili`, `/potenziale`, `/dove-intervenire`.
  Recruiting `/recruiting/chi-cerchiamo`, `/chi-e-piu-adatto`,
  `/chi-scegliamo` (non `/risultati/…`: "Risultati" è già `/ranking`).
  `/assessment/home` apriva la Panoramica: ora è la Home (anche il «Reset
  demo» torna lì).
- **«Le perdite invisibili» è senza tavola**: CLAUDE.md non ha la sua
  tabella e la tavola sulla tela non è nel repository. Costruita con lo
  stesso schema e i dati che ci sono (sotto la norma = Da potenziare +
  Critici; aree, mansioni e competenza sotto l'atteso 7,0, come "Dove
  guardare" della Panoramica). **Testi provvisori**, da confrontare con la
  tavola: «Perché è importante», l'opportunità, l'ⓘ.
- **Popolazione delle quote**: "sulle persone valutate" (CLAUDE.md), quindi
  le fasce delle pagine dei risultati si calcolano su chi ha almeno una
  valutazione; la Panoramica le calcola su tutta l'anagrafica (chi non è
  valutato ha 0 e cade fra i Critici). Con tutti valutati i numeri coincidono.
- **Interventi per tipo** = le fasce, come Panoramica ed esportazione del
  piano: Formazione = Da potenziare, Coaching = Alto potenziale,
  Riorganizzazione = Critici, Talento = Alto valore. Ogni persona ha una
  fascia, quindi conta una volta. Con i dati dimostrativi dà 5 · 4 · 2 · 0.
- **L'incongruenza dei colloqui di restituzione (10 contro 23)**: non c'è.
  «Colloquio di restituzione necessario» in Piani di sviluppo è l'etichetta
  dell'interruttore, scritta su ogni scheda (23); è acceso su 10 persone, lo
  stesso `feedbackNeeded` che conta la Panoramica. Numero giusto: 10.
- **Barra in evidenza** (`CategoryBars highlight`): la riga che conta va in una
  seconda serie impilata in `chart-highlight`. Le barre di Bklit non hanno il
  bordo: **manca il bordo scuro di 1,5px** (`chart-highlight-stroke`) in
  chiaro, dove il lime sulla card è tenue. Il valore scritto accanto resta.
  Aggiungerlo vuol dire toccare `charts/bar.tsx`: da decidere.
- **«Chi è più adatto?»**: il grafico è la barra a segmenti di «Candidati per
  fascia di idoneità» (colori di stato e nome della fascia), non un Bar Chart:
  le barre di Bklit hanno un colore per serie, non per riga. L'ⓘ riassume le
  soglie scritte in quella pagina.
- **«Chi cerchiamo?»**: in linea con il profilo = Profilo in valutazione (i
  preselezionati); competenze trasversali scelte = i pesi del Profilo
  candidato (partono da quelli del ruolo, quindi raramente zero). Anello con
  il numero al centro: `CompletionRing center` (RingCenter di Bklit).
- **«Chi scegliamo?»**: punto di forza e rischio sulle competenze scelte nel
  profilo, distanza dalla soglia del loro peso (W), in punti della scala del
  test, non su 10.
- **Profilo della ricerca**: tolti «Il prossimo passo», «Cosa cerchiamo», «A
  che punto siamo» (avevano numeri, che Roberto non vuole qui). I contenuti
  restano raggiungibili: pagine dei risultati, Profilo candidato, Imbuto.
  Tolto anche il bottone «Cambia posizione»: la scelta sta nella barra sopra.
- **Testi di Assessment** nel dizionario (`res` in it.ts / en.ts), come vuole
  CLAUDE.md; quelli di Recruiting nelle pagine, come il resto del modulo.
- **Dati dimostrativi**: la riga in fondo compare con `VITE_DEMO_MODE`
  (`isDemoMode`), lo stesso interruttore del «Reset demo».

## Menu di Recruiting a livelli, pagina d'ingresso · 2026-11-01
Applicata la tabella "Menu di Recruiting" di CLAUDE.md (Fase 6). Sostituisce
il menu del 2026-10-23 ("Menu di Recruiting" sotto e "Imbuto: le fasi"), che
spostava le voci fra i livelli.
- **Ingresso**: `/recruiting` apre il Profilo della ricerca (prima voce); la
  Panoramica è la seconda voce, a `/recruiting/panoramica`. `/recruiting/home`
  e `/recruiting/stato-dell-arte` portano alla Panoramica, come prima.
- **Pagina principale di livello**: prima voce del gruppo, e il titolo del
  livello è un link a lei. Opzioni: (a) solo la voce; (b) solo il titolo
  cliccabile; (c) tutte e due. Presa (c): CLAUDE.md vuole il titolo
  cliccabile, e senza la voce la pagina non si accende nel menu.
- **Bloccati, solo il menu**: "Migliori candidati" (L3) apre `/pagina-a` com'è
  oggi — la pagina continua a chiamarsi "Da invitare al test" e mostra chi non
  ha fatto il test; "Classifica dopo il test" invariata; l'Imbuto è in L2 e L3
  sulla stessa pagina `/imbuto-scelta` (le rotte non cambiano). Si accende una
  voce sola, la prima nel menu: la pillola della voce attiva è una sola.
- **Stato dell'arte** torna nel menu (L2) ma la rotta rimanda alla Panoramica
  dal 2026-10-23, quando la pagina (`RecruitingHome.tsx`) è stata tolta.
  Ripristinarla è spostare contenuto di una voce bloccata: **non fatto, da
  chiedere** (il file è in git, `bb565c1^`). Intanto la voce accende la
  Panoramica, non sé stessa.
- **Area valutatori (L4)**: ci entrano Prossimi colloqui e Candidati al
  podio. Un valutatore continua a vedere solo le tre schede (`staffOnly` sulle
  due nuove): mostrargli gli elenchi dei candidati sarebbe un cambio di
  permessi, non di menu.
- **"Posizioni aperte"**: non è una voce del menu (non lo era più dal
  2026-10-23) e non ha una rotta sua; il codice che conta le posizioni resta.
  L'etichetta compare ancora, da mandare ad Alessio: StatCard "Posizioni
  aperte" e la riga del CSV nella Panoramica; "Tutte le posizioni aperte"
  nell'Imbuto; il testo della StatCard "Posizioni senza candidati".
- **"Import massivo — Archivio storico"**: tolto dall'interfaccia il
  2026-10-23. Sul server non c'è codice di import da conservare: era un
  controllo disattivato senza rotta di ingestione (commento in
  `CvExportPage.tsx`). Resta da sapere da Roberto se la funzione è chiusa.
- **"Report AI"**: la dicitura non compare in nessuna pagina (cercato in
  tutto `frontend/src`); la pagina Assistente IA resta.
- **CV elaborati**: le finestre Colloqui e Candidato vincitore non ci sono più
  dal 2026-10-23 (Candidato vincitore → Candidati al podio, L4). La proposta di
  semplificazione della pagina resta da fare.
- **Profilo candidato**: la scelta delle competenze trasversali è già dentro
  la pagina, l'annuncio e il link in fondo. Il link però compare dopo
  «Salva» **e** «Conferma» (approvazione sul server, richiesta del cliente del
  2026-10-19). Far comparire il link al solo salvataggio vuol dire approvare
  e pubblicare l'annuncio da sé: cambia un flusso. **Non fatto, da chiedere.**
- Nomi a schermo come nel menu: "CV elaborati", titolo di Profilo candidato in
  minuscolo ("Configura la scheda professionale…").

## Stati della candidatura nell'imbuto · 2026-11-01
I cinque stati di Roberto (CLAUDE.md, Fase 6) al posto delle sette fasi del
2026-10-23. Corrispondenza scelta, sui dati che la pipeline ha già:
| Stato | Chi | Stato del server |
|---|---|---|
| Candidatura acquisita | bacino CV della posizione + chi viene dopo | IN_POOL |
| Profilo in valutazione | preselezionati | SHORTLISTED, TEST_DA_INVIARE |
| Candidato di interesse | test inviato (anche completato) | TEST_INVIATO, TEST_HA/NON_HA_RISPOSTO |
| In fase di approfondimento | con un colloquio | INTERVIEW |
| Selezione conclusa | con una decisione | DECISION_WON / DECISION_LOST |
- Opzione scartata: "Profilo in valutazione" = tutti i CV (ogni CV ha la sua
  corrispondenza al profilo): darebbe due stati sempre uguali.
- "Test completati" e "Idonei" escono dall'imbuto ma si contano ancora (il
  prossimo passo del Profilo della ricerca li usa). Chiavi interne invariate.
- **Esito**: si registra solo il candidato scelto (`pipeline.winner` →
  Assunto). In riserva e Non selezionato non hanno un dato nella pipeline del
  browser (il server ha `DECISION_LOST`, "In riserva" da nessuna parte).
  L'Imbuto lo scrive ("non si registrano ancora"). Aggiungerli tocca il
  salvataggio dei dati: **fermo, da decidere**. Il nome del quinto stato è
  ancora da confermare (Roberto ha scritto anche "Selezione valutatori").
- Il link "Dettaglio" della tabella per posizione dell'Imbuto apriva
  Avanzamento con `?companyId=&openingId=`, che da oggi non cambia più la
  posizione: ora apre Avanzamento, che mostra tutte le posizioni.
- Corretto di passaggio: due testi a schermo nominavano Original Skills
  (Profilo della ricerca, Da invitare al test), vietato dal cap. 7.

## Posizione attiva: si cambia solo nel Profilo della ricerca · 2026-11-01
Lo stato era già unico (`lib/active-position.tsx`, 2026-10-23), ma lo
cambiavano quattro punti: la barra del contesto su ogni pagina, il selettore
di società nella barra laterale, le card di Avanzamento della selezione e i
parametri `?companyId=&openingId=` dei link vecchi. CLAUDE.md (Fase 6) vuole
un posto solo.
- **Barra del contesto**: intera, con società e posizione, solo su
  `/recruiting/profile`; altrove il sovratitolo di sola lettura
  "ACME CORP · SENIOR FRONTEND ENGINEER" (nuova variante `inline` del pattern
  `ContextBar`, nel catalogo). Il cambio di società, tolto dalla barra
  laterale, sta qui accanto a quello di posizione.
- **Barra laterale**: la società si legge, non si sceglie.
- **Avanzamento della selezione**: opzioni — (a) card di sola lettura, la
  posizione attiva segnata e scritta, link al Profilo; (b) il clic sulla card
  porta al Profilo della ricerca. Presa (a): (b) fa sembrare la card una
  scelta che poi non avviene. **È un cambio di comportamento** (prima il clic
  cambiava la posizione), chiesto esplicitamente con la regola di CLAUDE.md:
  il quadro di tutte le posizioni resta, il dettaglio è quello della
  posizione attiva.
- **Link vecchi con i parametri**: perdono i parametri e mostrano la
  posizione attiva, senza cambiarla.

## Ruoli dei grafici e barre di scorrimento nel tema · 2026-11-01
Applicati in `globals.css` i valori delle fondamenta (rivisti il 2026-10-26):
`chart-mono` passa da lime scurito a inchiostro (`neutral-800` / `neutral-100`),
nuovi `chart-highlight`, `chart-highlight-stroke`, `chart-reference`;
`chart-compare` a `neutral-300` / `neutral-600`. Tutti anche in `@theme inline`
(`bg-chart-highlight`, `stroke-chart-reference`…).
- **Effetto immediato**: i 20 usi di `chart-mono` diventano inchiostro, come
  vuole la regola. Il lime sul valore che conta (`chart-highlight`) e il
  benchmark tratteggiato (`chart-reference`) vanno ancora collegati grafico
  per grafico: non fatto qui.
- **`--chart-line-secondary`** (alias Bklit) resta su `chart-compare`.
- **Barre di scorrimento**: `--scrollbar-thumb` `neutral-300` / `neutral-600`;
  `--scrollbar-thumb-hover` non è nelle fondamenta: preso il gradino
  successivo verso il testo, `neutral-400` / `neutral-500`. Proprietà
  standard (`scrollbar-width: thin`, `scrollbar-color`) su `*`; pseudo-classi
  webkit solo dove lo standard manca (Safari). Su Chrome e Firefox il colore
  di hover non si applica: lo standard non ha un hover del cursore.

## Movimento, seconda parte (Instructions.md aggiornato) · 2026-11-01
- **Molla**: `SNAPPY_TAB_SPRING` → `ULTRA_TAB_SPRING` (500 / 38 / 0,5),
  usata da tutte le pillole: commutatore, barra laterale, Tabs, ToggleGroup.
- **File dei preset**: restano in `lib/motion.ts`, non in
  `src/constants/animationPresets.ts`: il progetto tiene questi valori in
  `lib/` e non ha una cartella `constants`. Un posto solo.
- **Grafici**: niente `recharts` (tolto in Fase 5, CLAUDE.md §3). Bklit
  interpola già i tracciati quando cambiano i dati
  (`use-animated-series-path.ts`, `use-animated-y-domains.ts`): non si tocca
  ("Bklit si usa come è fatto").
- **Sfocatura**: ancora fuori. L'esenzione della regola 4 del 2026-10-30
  vale solo per i grafici Bklit, non per il guscio.
- **Pillola nelle primitive**: Tabs e ToggleGroup tengono il valore anche
  con solo `defaultValue`, per sapere dove sta la pillola; ogni istanza ha il
  suo `LayoutGroup`. Con ToggleGroup `multiple` niente pillola (più voci
  accese): fondo per voce come prima. Barra laterale: colonna e pannello
  mobile in due gruppi, `layoutScroll` sulla colonna che scorre.
- **Contatori**: `AnimatedNumber` dentro StatCard, solo quando il valore è
  un numero da solo ("6,0", "17%", 42). "—", "3/5" e i testi restano fermi.
  I lettori di schermo leggono il valore finale. Il numero resta scritto una
  volta (cap. 5).
- **Pannelli delle schede**: entrano con FAST_PAGE_VARIANTS (il pannello è
  l'elemento animato, `asChild`, così `flex`/`gap` dei pannelli restano).
- **StaggerItem**: il contenuto riempie l'elemento (`*:flex-1`), così le card
  di una riga finiscono alla stessa altezza (cap. 6, Impaginazione).

## Movimento dell'interfaccia (Instructions.md) · 2026-10-30
Richiesta: lo SOP di animazione di `Instructions.md` (pillola del
commutatore, cambio di modulo e di pagina, elenchi a scalare, risposta al
tocco). Scelte:
- **Libreria**: `framer-motion` non si installa. Si usa `motion` (13.4.6),
  già presente per Bklit: è la stessa libreria con il nome nuovo
  (`motion/react`). Nessuna dipendenza nuova (§12).
- **Sfocatura del cambio di modulo** (`blur(4px)` nello SOP): tolta. Il
  sistema non ha sfocature (regola 4) e l'audit la segnala; restano opacità
  e scala. Raccomandazione: lasciarla fuori. Se la si vuole, va prima nelle
  fondamenta.
- **Aspetto del commutatore**: lo SOP ha grigi, `bg-white`, `shadow-md` ed
  etichette inglesi ("Recruiting Portal"). Si prende solo il movimento: la
  pillola è `bg-accent`, raggio `sm`, nessuna ombra, nomi di oggi.
- **Uscita del modulo**: Recruiting e Assessment sono due layout di rotta;
  cambiando modulo il vecchio si smonta subito. `AnimatePresence` sta in
  AppShell attorno al contenuto: si vede l'entrata, non l'uscita, e barra
  superiore e laterale restano ferme. L'alternativa (presenza sopra le
  `Routes`) farebbe sparire e ricomparire anche la barra superiore.
- **Pagine**: `PageTransition` al posto di `<Outlet />` nei due layout,
  chiave = indirizzo. Il ridisegno di Recruiting per posizione o dati
  (`pageKey`) non anima.
- **`user-select: none`** solo su bottoni e commutatore, non sulle card dei
  candidati: si deve poter copiare un nome.
- **Tap 0,97**: nel Button (tutti i bottoni) e nelle card cliccabili
  (`StaggerItem pressable`). Non sulle card grandi non cliccabili
  (RankingCard): scalare un blocco alto si legge come un salto.

## Comitato scientifico: barre verticali e anelli · 2026-10-26
Su richiesta: niente barre orizzontali, "più moderno". Opzioni: barre
verticali, anelli, o lasciare le orizzontali. Le verticali con nomi lunghi
("Motivazione ed efficacia personale") si sovrappongono: l'asse di Bklit
non va a capo. **Presa:** `BarXAxis` ha `wrapLabels` (unico scostamento da
Bklit: l'etichetta va a capo, larga quanto il gruppo), `CategoryBars` lo
espone. Competenze di ruolo e quota che raggiunge l'atteso → barre
verticali a tutta riga. Le 36 competenze e il pannello della persona →
pattern nuovo `RingStat` (Ring di Bklit, "punteggio singolo": anello del
punteggio in `chart-mono`, dentro l'atteso in `chart-compare`, numero a
fianco, atteso e scarto a parole). La tabella degli scarti del pannello
sparisce: i valori sono negli anelli. Sotto i ~900px di larghezza le
etichette verticali si stringono: da guardare su mobile.

## Comitato scientifico in grafici · 2026-10-26
Richiesta: i risultati dell'anteprima (Recruiting → Amministrazione →
Comitato scientifico) si leggono in grafici, con i tipi della tabella di
CLAUDE.md (Fase 5).
- **Opzioni per il profilo completo di una persona** (36 competenze): radar
  (la riga "profilo di competenza" della tabella) o barre orizzontali.
  Un radar a 36 assi non si legge, e la regola dice di non rimpicciolirlo.
  **Presa: barre orizzontali a una serie, dalla più alta.**
- **Competenze di ruolo contro atteso**: barre raggruppate (riga "persona
  contro benchmark"), `chart-mono` contro `chart-compare`. Per il gruppo:
  media delle persone che hanno la competenza nel ruolo contro atteso medio.
- In più una barra per "quota di persone che raggiunge l'atteso" e quattro
  StatCard. Il punteggio complessivo resta fuori (formula su 10 in attesa).
- `CategoryBars` ha due altezze in più (`xl`, `2xl`) e `height="auto"`, che
  sceglie dal numero di righe: le etichette non si sovrappongono.
- I conti stanno in `modules/recruiting/lib/comitato-stats.ts`: se la forma
  dell'API cambia, cambia quel file.

## Indice a quattro livelli di Recruiting · 2026-10-23
- **"CV Elaborati"**: nel documento è una voce distinta da "Avanzamento della
  selezione" (prima la voce "CV Elaborati" apriva l'avanzamento). Opzioni:
  (a) pagina nuova con l'elenco dei CV caricati e analizzati; (b) stessa
  pagina dell'avanzamento. Presa **(a)**: l'elenco esce da CV & Esportazione,
  che resta caricamento + esportazione.
- **Voci che erano sezioni di una pagina** (preselezionati, classifica,
  colloqui, podio, tre schede valutatori, imbuto, fasce): (a) una rotta per
  voce; (b) ancore nella stessa pagina. Presa **(a)**, così la barra laterale
  segna la voce giusta. "Stato dell'arte" tiene i suoi riquadri (stesso
  componente delle pagine nuove).
- **"Profilo Candidato" nella barra laterale**: il documento non la elenca,
  ma è la pagina della card 1. Tenuta come prima voce di Chi cerchiamo.
- **Imbuto due volte (L2 e L3)**: due indirizzi (`imbuto`, `imbuto-scelta`)
  per la stessa pagina, così si accende una voce sola.
- **Link dell'annuncio "dopo il salvataggio"**: oggi serve anche «Conferma»
  (richiesta del cliente del 2026-10-19). Non cambiato: approvare da soli al
  salvataggio cambierebbe un flusso. **Da chiedere al cliente.**
- **Test soft skill "dopo il salvataggio"**: mostrato quando c'è almeno un CV.

## Monorepo o cartella unica · 2026-09-25
- Opzioni: (a) monorepo con pacchetti `ui`, `recruiting`, `assessment`;
  (b) un'applicazione con i componenti condivisi in `src/components`.
- Cosa cambia: (a) separa le build e aggiunge configurazione di workspace;
  le due aree sono però già nello stesso pacchetto, con lo stesso router e la
  stessa build. (b) non aggiunge infrastruttura.
- Raccomandazione: (b).
- Presa: **(b)** — approvata e recepita in CLAUDE.md (Fase 4), registrata il 2026-09-28.

## Superficie di prova per l'analisi · 2026-09-25
- Opzioni: confermare il capitolo 7 solo sul codice, oppure anche a schermo.
- Cosa cambia: il capitolo 7 dice di confermarlo guardando le schermate;
  diverse voci non tornavano sul codice.
- Raccomandazione e presa: screenshot con Playwright su un server Vite locale
  temporaneo, sessione simulata in sessionStorage, backend spento. Nessun file
  del prodotto toccato.

## Ombre in globals.css · 2026-09-28
- Opzioni: (a) `globals.css` com'è, e togliere le 66 classi `shadow-*` una a
  una in Fase 3; (b) azzerare `--shadow-*` nel tema, come faceva `index.css`.
- Cosa cambia: con (a) le ombre di Tailwind tornano subito su card, menu e
  dialog, e l'app per settimane è peggio di oggi. (b) è coerente con le
  fondamenta ("nessuna scala di ombre") e non tocca i componenti.
- Raccomandazione e presa: **(b)**, con `0 0 transparent` invece di `none`,
  perché `none` dentro un elenco di box-shadow annulla la dichiarazione e
  spegne anche gli anelli di focus. Le classi si tolgono comunque in Fase 3:
  l'audit le conta ancora.

## Il ponte per Assessment e il suo `--accent` · 2026-09-28
- Il problema: CLAUDE.md prescrive `--accent: neutral-200` nello scope di
  Assessment. Ma Assessment usa `var(--accent)` come **suo lime**: bottone
  primario, voce di menu attiva, schede, barre di avanzamento, e i grafici
  lo leggono a runtime. Aliasarlo da solo avrebbe spento il lime in un
  centinaio di punti, e il bottone primario sarebbe diventato grigio.
- Opzioni: (a) alias alla lettera; (b) rinominare prima gli usi del lime su
  `var(--primary)`, che ha lo stesso valore, poi neutralizzare `--accent`;
  (c) lasciare `--accent` lime fino alla Fase 3.
- Cosa cambia: (a) regressione visibile; (c) lascia la trappola aperta (il
  Button shadcn è già montato in Assessment e ha `hover:bg-accent`); (b)
  tocca il CSS di Assessment, ma solo con una sostituzione meccanica
  senza effetti a schermo.
- Raccomandazione e presa: **(b)**. Ammette un'eccezione a "in Fase 1 non si
  tocca il suo CSS", limitata a questa sostituzione.
- A margine: lo snippet di CLAUDE.md ha `--border: var(--border)`, che è un
  riferimento circolare e rende la variabile non valida. Nel ponte le
  variabili con lo stesso nome e significato usano `inherit`.

## Raggi fuori scala dopo il cambio di `--radius-md` · 2026-09-28
- `rounded-md` era usato ovunque come 10px: input, bottoni piccoli, riquadri.
  Con il tema nuovo sarebbe diventato 16px.
- Opzioni: (a) classificare elemento per elemento (input sm, bottoni md…);
  (b) tutto a `rounded-sm`, cioè gli stessi 10px di prima.
- Raccomandazione e presa: **(b)**. Gli input vanno a sm come chiede la
  Fase 1; per il resto i controlli piccoli rientrano in sm secondo la
  scala, e i riquadri si ricompongono in Fase 6. Stesso criterio per
  `rounded-xl` → `rounded-lg` (24px, il raggio delle card).
- Non toccato: `Button` è ancora `rounded-full` (a pillola, come `.btn` di
  Assessment). La scala vuole `md`; il cambio va in Fase 3, insieme ad
  Assessment, così i due moduli non divergono.

## Le due collisioni rimaste nel ponte: `--muted` e `--radius-*` · 2026-09-28
- Il CLAUDE.md aggiornato le prescrive: rinominare l'uso in Assessment.
- Fatto: `--muted` → `--text-muted` (definizione + 5 usi in
  `apex-charts-3d.ts`); `--radius-sm/md/lg` → `--a-radius-sm/md/lg` (32 usi
  nel CSS, 4 nel TS). Dentro lo scope `--radius-md` vale 16 e `--muted` è il
  fondo del sistema; le card del modulo restano a 14px.
- Nota su CLAUDE.md: "le ombre non servono qui, globals.css azzera la scala a
  monte" non è esatto. `assessment-scoped.css` ridefinisce le sue
  `--shadow-*` dentro lo scope, dove l'azzeramento di `globals.css` non
  arriva. Le tre righe restano nel ponte.

## Select: Radix o nativa · 2026-09-28
- Opzioni: (a) Select di shadcn (Radix); (b) select nativa stilizzata.
- Cosa cambia: (a) dà un menu con i colori del tema anche in scuro (oggi il
  menu nativo esce chiaro su fondo scuro), ma **non accetta `value=""`**, e
  nel codice ci sono 27 `<option value="">` in 16 file, a volte come "nessuna
  scelta" selezionabile. (b) conserva tutto, ma il menu aperto resta del
  sistema operativo.
- Raccomandazione e presa: **(a)**, dentro un pattern `SelectField` che
  traduce "" in un valore sentinella e ritorno, con `allowEmpty` dove "nessuno"
  si può scegliere. Il valore salvato non cambia.

## Campi data e ora · 2026-09-28
- Opzioni: Input `type=date/time` stilizzato, o DatePicker (Calendar +
  Popover).
- Raccomandazione e presa: **Input `type=date/time`**. Tiene l'inserimento
  da tastiera e il formato salvato; il DatePicker cambierebbe l'interazione
  su 12 campi senza che nessuno l'abbia chiesto.

## Esc chiude i dialog anche in Assessment · 2026-09-28
- Il `Modal` di Assessment ignora Esc di proposito; Dialog lo gestisce.
- Presa: **vince la libreria** (regola 11). Si perde nulla che oggi non si
  perda già con il clic sullo sfondo. Segnalato comunque in MAPPATURA §8.8.

## Un solo StatCard per cinque riquadri numerici · 2026-09-28
- Oggi: `KpiCard`, KPI in linea nella Home Recruiting, statistiche di
  `CrossModuleBanner`, `StatTile`, `.kpi`, `ToneTile`.
- Opzioni: un pattern con parti opzionali, o due (KPI semplice / KPI con
  benchmark).
- Raccomandazione e presa: **uno**, con icona, denominatore, scarto con
  segno, barra e nota opzionali. La sparkline ApexCharts di `StatTile`
  disegna una sola barra orizzontale: diventa Progress, non un grafico.

## Riquadri a comparsa: Accordion o Collapsible · 2026-09-28
- `MasterCard` (aperto di default, più riquadri in griglia), `Subcard`
  (chiuso, uno dentro l'altro), `AccordionSection` di `JobProfilePage`,
  sezioni di `JdSection`.
- Presa: **Collapsible** per `MasterCard` e `Subcard` (si aprono
  indipendentemente, non si escludono), **Accordion `type="multiple"`** per
  le sezioni della Scheda professionale. Solo l'intestazione è cliccabile:
  si perde la chiusura con un clic sul contenuto, che era un difetto.

## Tabs o ToggleGroup · 2026-09-28
- Presa: **Tabs** dove sotto cambia il contenuto (`.view-tab`, segmentato
  "In arrivo / Completati"); **ToggleGroup** dove cambia una vista o un
  filtro sullo stesso contenuto (`.segmented`, "oggi / Skill Vision", il
  commutatore di modulo).

## Tabelle: Table o DataTable con TanStack · 2026-09-28
- Opzioni: (a) il DataTable di shadcn, che porta `@tanstack/react-table`;
  (b) Table più un pattern `DataTable` che riceve righe già filtrate e
  ordinate.
- Cosa cambia: solo Anagrafica ha ricerca, filtro, ordinamento e pagine, e
  la logica esiste già e funziona. (a) aggiunge una dipendenza e riscrive
  quella logica.
- Raccomandazione e presa: **(b)**. Se una seconda tabella ne avrà bisogno,
  si rivaluta.

## Chip e badge · 2026-09-28
- `.chip` ha sei toni (gray, blue, red, green, gold, amber), `Badge` cinque.
- Presa: **Badge con toni di stato più neutro**. `blue` (usato come
  "attivo/informazione") va al neutro; `gold` era un colore proprio, ed è
  il tono della fascia Top Talent: va a `success` con la parola. Nessun
  tono decorativo.

## Home di Assessment sui token: i toni delle card · 2026-09-28
- Il concept dà a ciascuna delle quattro folder card un fondo caldo proprio
  (`folder-tone-valore/capitale/perdite/decisioni`) e ai `ToneTile` cinque
  toni (peach, gold, green, yellow, red).
- Cosa sono: i quattro fondi delle card e peach/gold decorano, e non
  indicano uno stato. green/yellow/red sono le fasce ottimale / moderato /
  critico, e l'etichetta c'è già.
- Presa, come da CLAUDE.md: **card su superficie neutra**, distinte da icona
  e titolo; peach/gold → neutri; green/yellow/red →
  `success`/`warning`/`destructive` con la loro parola.
- Cosa perde il concept: la codifica a colori delle quattro card. È una
  decisione di sistema, non di schermata: la segnalo perché il cliente
  potrebbe tenerci.

## Phosphor duotone → Lucide · 2026-09-28
- Le quattro icone delle folder card sono Phosphor in duotone (due pesi
  sovrapposti). Lucide non ha un duotone.
- Presa: **Lucide a tratto**, dipendenza rimossa. Si perde il secondo
  piano tenue dell'icona; non porta informazione, quindi non è essenziale.

## Card: padding come prop, default 16 · 2026-09-28
- Oggi ogni card di Recruiting sovrascrive lo shadcn di serie (`p-6`,
  `CardHeader p-0 pb-3`, `CardTitle text-sm`): la card si usa come blocco con
  padding e intestazione a filo, non con le parti a `px-6`.
- Opzioni: (a) tenere l'API shadcn e le sovrascritture; (b) una Card con
  `padding` md/lg/none e parti interne senza padding.
- Presa: **(b)**, default **md = 16px**, il padding di card della scala
  (fondamenta: spaziatura 4 → "padding di card"; raggio annidato 24 − 16 = 8).
  Recruiting passa da 24 a 16, Assessment da 20 a 16: le card diventano un
  po' più dense. `lg` resta per i pannelli larghi.
- Il titolo di card diventa 18/600 anche dove oggi è 13,5 o 14 (regola 8).

## Badge in stile label · 2026-09-28
- Le fondamenta mettono i tag nello stile label (Geist Mono maiuscolo,
  12px — era 11px, aggiornato con la scala del 2026-09-29).
  Presa: il Badge è `label-mono`, raggio full, fondi tenui 12/20%.
  I badge diventano maiuscoli e monospaziati in tutti e due i moduli.
- Correzione alla decisione "Chip e badge" della Fase 2: `chip-blue` non era
  blu, era la tinta lime. Per tenere distinte le cinque fasce di performance:
  top (gold) → `accent`, valorizzare → `success`, adeguata (blue) →
  `neutral`, sviluppo → `warning`, critica → `destructive`.
- Aperto: i pesi delle competenze (Essenziale / Importante / Utile) usano
  ancora blu/ambra/verde, cioè colori di stato per una categoria. La parola
  c'è; il colore andrebbe tolto. Lo segnalo per la Fase 6, non lo decido qui.

## Bottoni col fondo lime tenue · 2026-09-28
- Recruiting aveva bottoni `bg-primary/10 border-primary/30` ("Salva",
  "Segna come inviato"). Non esiste una variante così.
- Presa: dentro un dialog, dove sono l'azione principale → `default` (lime
  pieno, l'unico del dialog). Ripetuti riga per riga (Salva scorecard in
  InterviewList) → `secondary`, per non avere un lime per riga.

## Il reset CSS di Assessment va nel layer base · 2026-09-28
- `* { margin:0; padding:0 }` fuori layer batteva ogni utility di Tailwind:
  le primitive montate in Assessment perdevano padding (escluso a mano solo
  il Button).
- Presa: il reset va in `@layer base`. Le regole di Assessment, fuori layer,
  vincono ancora sul reset; le utility delle primitive tornano a valere.
  Effetto visibile: `CrossModuleBanner` e `ModuleLockGate` ritrovano il loro
  padding dentro Assessment. Verificato che nessun altro elemento del modulo
  usava utility di margine o padding.

## globals.css: primitive chiare con suffisso -light · 2026-09-28
- Difetto del tema: `--color-warning`, `--color-success`, `--color-chart-1…6`
  erano sia primitive (@theme) sia utility (@theme inline, `var(--warning)`),
  e `--warning: var(--color-warning)` chiudeva il cerchio. In chiaro le
  variabili erano vuote: niente colori di stato né di grafico dalla Fase 1.
- Presa: le primitive chiare prendono il suffisso `-light`, come le scure
  hanno `-dark`. Nessun valore cambia. Da riportare anche in
  `skill-vision-fondamenta.md` se il suo blocco di codice viene usato come
  riferimento per un altro tema.

## Tooltip al posto di title: pattern Hint · 2026-09-28
- Presa: `Hint` avvolge un controllo con un Tooltip; se il controllo è
  disabilitato mette uno span focalizzabile come bersaglio. Usato sui
  bottoni. I `title` su testo troncato restano nativi: mostrano il testo
  intero, non spiegano un'azione, e il tooltip vorrebbe un bersaglio
  focalizzabile che lì non c'è.

## Taglia dei campi: normale nei moduli, compatta altrove · 2026-09-29
- Recruiting aveva campi a 12–12,5px, Assessment a 14. La scala nuova dà
  15 (body) e 14 (small).
- Presa: dentro un `Field` (moduli, dialog) taglia normale, 15px; in tabelle,
  barre di filtro e righe d'azione taglia compatta, 14px. Tutti i campi
  crescono un po' rispetto a oggi.

## Field collega il primo controllo fra i figli · 2026-09-29
- Molti campi hanno accanto al controllo un `datalist`, un bottone o una nota
  calcolata. Presa: Field cerca il primo input / textarea / select (o
  Input, Textarea) fra i figli e collega a quello etichetta, nota ed errore;
  il resto resta com'è. Se non ce n'è, l'etichetta è visibile ma non collegata.

## Spazio fra i campi in Assessment · 2026-09-29
- `.field` dava 14px di margine sotto ogni campo; Field non ha margini
  (lo spazio lo decide chi dispone). Presa: finché i moduli di Assessment non
  sono ricomposti, una regola nello scope `.sv-assessment-shell` dà 16px sotto
  ogni Field. Muore con `assessment-scoped.css`.

## Etichette maiuscole → label-mono anche fuori dai campi · 2026-09-29
- La richiesta riguardava le etichette dei campi; la regola 8 mette nello
  stile label anche sovratitoli, nomi di metrica e tag. Presa: in Recruiting
  e nei componenti condivisi ogni testo maiuscolo a 9–12px in Geist diventa
  `label-mono` (47 punti), tenendo colore e posizione. I sovratitoli lime su
  scuro (`dark:text-primary`) restano lime: è una questione di Fase 6.

## Pesi delle competenze: badge neutri · 2026-09-29
- Chiude il punto aperto in "Badge in stile label". Essenziale / Importante /
  Utile sono categorie, non stati: badge `neutral` con la parola, in tutti e
  due i moduli. La legenda della sezione Soft skill di Recruiting mostra i
  badge stessi con "peso N" al posto dei pallini lime di intensità diversa.

## Select: taglia compatta larga quanto il contenuto · 2026-09-29
- La select nativa si adattava al contenuto; il bottone di Radix è `w-full`.
- Presa: taglia normale (campi di un modulo) a tutta larghezza; taglia
  compatta (filtri, tabelle) `w-fit`. Una larghezza esplicita vince.

## Select: valore che non è fra le opzioni · 2026-09-29
- La select nativa mostra la prima opzione anche quando lo stato non
  corrisponde a nessuna (per esempio "" senza opzione vuota), come se fosse
  scelta. Presa: SelectField mostra il segnaposto. Il valore salvato non
  cambia; cambia solo che si vede che non c'è una scelta.

## Livelli flottanti a z-300 · 2026-09-29
- Il Modal di Assessment ha l'overlay a z-index 150, il pannello a 100:
  il menu della Select e i tooltip (z-50) finivano sotto. Presa: i livelli
  flottanti della libreria stanno a z-300. Da riordinare in una scala unica
  quando Modal passa a Dialog (blocco 4).

## Slider neutro · 2026-09-29 — rivista il 2026-09-29
- Prima presa: tratto neutro (`foreground`), con la motivazione "un solo
  lime per schermata".
- Rivista con la regola del paragrafo 1 del nuovo CLAUDE.md: il tema decide
  com'è il lime e le primitive lo applicano da sole dove shadcn e Bklit
  mettono il colore primario; a chi compone resta solo la scelta di quale
  elemento è primario. Lo Slider di shadcn mette il primario sul tratto
  pieno e sul bordo del pallino: lì va il lime, senza eccezioni di pagina.
- Presa: tratto e pallino in `primary`, binario `muted`. Il valore resta
  sempre scritto accanto al cursore: su fondo chiaro il lime sul binario
  chiaro ha poco contrasto, e il colore non porta l'informazione da solo.
## Scala unica dei livelli · 2026-09-29
- Il sistema non ne aveva una. Presa: variabili in `globals.css`, uguali
  nelle due modalità: sticky 10 · header 20 · drawer 30 · modal 40 ·
  popover 50 · toast 60 · takeover 70. Un menu, una tendina o un tooltip
  stanno sopra un dialog perché si aprono da dentro di esso; una notifica
  sta sopra tutto tranne una schermata a tutta pagina. Si usano con
  `z-(--z-…)`, mai con numeri scritti a mano.

## Conferma alla chiusura: nella primitiva, con un booleano · 2026-09-29
- CLAUDE.md la vuole "prop del pattern, non codice di pagina".
- Presa: la logica sta in `DialogContent` (`dirty`), così la usano sia
  `ModalDialog` sia i dialog di Recruiting costruiti sulle primitive. Le
  pagine calcolano solo il booleano, con `useDirty(valori, resetKey)`.
  "Annulla" nel piede resta un'azione esplicita e chiude senza chiedere.
- Per i dialog che restano montati e ricaricano la bozza all'apertura
  (Protocollo, Survey Link, Annuncio) la partenza si rifà all'apertura;
  per Profilo candidato anche all'arrivo delle note dal server.

## I dialog di Assessment si aprono dentro il modulo · 2026-09-29
- Il portale di Radix va su `<body>`, fuori dalle variabili di Assessment:
  il contenuto dei dialog perdeva colori e raggi del modulo.
- Presa: `ModalDialog` monta il portale nel contenitore più vicino con
  `data-portal-scope` (il guscio di Assessment e i pannelli del catalogo lo
  hanno). Quando `assessment-scoped.css` si svuota l'attributo può restare
  o sparire senza effetti.

## window.confirm → useConfirm · 2026-09-29
- Presa: un hook che restituisce una promessa, così il punto di chiamata
  resta `if (!(await confirm({…}))) return`. Le funzioni diventano async;
  tutte e cinque erano gestori di evento. Etichette nella lingua di
  Assessment; nel JD di Recruiting, italiano.

## Notifiche: Sonner con la firma di prima · 2026-09-29
- Presa: `toast(msg, 'ok'|'err')` resta nel contesto di Assessment e chiama
  Sonner. Una notifica alla volta (la nuova chiude quella visibile), 3,2 s,
  in basso al centro, come il legacy. Icona per tipo accanto al testo.

## Schede di Assessment: Tabs senza pannelli · 2026-09-29
- Le pagine Soft, Hard e Customer Care mostrano il contenuto in base alla
  scheda con un `view === …` più in basso. Presa: Tabs controllato con il
  solo TabsList; il contenuto resta dov'è. Le schede diventano raggiungibili
  da tastiera (erano div cliccabili). I TabsContent veri arrivano con la
  ricomposizione delle pagine (Fase 6).

## Scheda professionale: un Accordion multiplo · 2026-09-29
- Presa: le 16 sezioni sono voci di un solo Accordion `type="multiple"`,
  tutte aperte all'inizio come prima, ognuna nella sua card. Si guadagnano le
  frecce fra le intestazioni; lo stato `collapsed` sparisce.

## Scelte multiple come ToggleGroup, con la spunta · 2026-09-29
- Le soft skill assegnate a un dipendente erano chip verde/grigio. Presa:
  ToggleGroup multiplo per cluster; la voce accesa ha il fondo `accent` e
  il segno di spunta, così lo stato non passa dal solo colore.

## Password predefinite: non cambiate · 2026-09-29
- Richiesta: cambiare subito le password di `admin` e `operatore`.
- Non eseguita: gli account di produzione si creano e si consegnano con il
  cliente (CLAUDE.md, Fase 4); `admin123` è nel codice del ponte, e
  cambiarla da sola chiude fuori `admin` da Recruiting; l'ambiente non è
  indicato. Va deciso chi sceglie le nuove password, dove, e se nello
  stesso passaggio si aggiorna il ponte (che è codice di autenticazione).

## Pallino dello Slider su fondo chiaro · 2026-09-30
- Il bordo del pallino in `primary` (accent-400) su fondo pagina chiaro dà
  circa 1,3:1: il pallino si vede solo per il fondo, non per il bordo.
- Presa: in chiaro **`accent-600`**, lo stesso del focus ring e di
  `chart-mono` chiaro; in scuro resta `primary`. Il tratto pieno resta
  `primary` nelle due modalità, con il valore scritto accanto.

## DataTable: tastiera sulle righe cliccabili · 2026-09-30
- Una riga di Anagrafica apre il pannello con un clic; da tastiera non si
  raggiungeva. Opzioni: (a) un bottone nel nome della persona; (b) la riga
  focalizzabile, Invio/Spazio per aprire, con un nome accessibile.
- Presa: **(b)**, nel pattern: vale per ogni tabella con `onRowClick`, e il
  clic sulla riga resta com'era. I bottoni dentro la riga (archivia, soft
  skill) fermano la propagazione come prima.

## Avatar neutro · 2026-09-30
- Le iniziali erano su `accent-soft` in Assessment e su lime pieno in
  Recruiting. In un elenco di venti persone il lime non segnala niente.
- Presa: **Avatar su `secondary`**, nei due moduli. Il lime resta alla voce
  attiva e all'azione primaria.

## Conferma di chiusura condivisa fra Dialog e Sheet · 2026-09-30
- Sheet e Dialog sono lo stesso primitivo Radix. Invece di copiare la
  conferma, un pezzo solo (`components/ui/dirty-close.tsx` per il ✕ e
  l'AlertDialog, `hooks/use-dirty-close.ts` per Esc e clic fuori).

## Celle del confronto: icona oltre al colore · 2026-09-30
- "Più alto / più basso / comparabili" nel confronto fra dipendenti (Soft,
  Hard) era solo il fondo verde/rosso/lime della cella (regola 10).
- Presa: `MatchCell` con freccia su/giù/uguale e testo per lettori di
  schermo; il fondo tenue resta ad accompagnare. Il lime del "comparabili"
  passa a `accent` neutro: non è un segnale d'azione.

## Il numero principale della Home sulla scala d'interfaccia · 2026-09-30
- Nel concept il Punteggio Complessivo è a 72px. La scala d'interfaccia
  arriva a `text-metric-lg` (32); la scala del sito è vietata nella
  dashboard (checklist §8).
- Presa: **32px**, con il riquadro `accent` e la barra a dire che è il
  numero che conta. Se il cliente vuole il numero grande, serve un passo in
  più nella scala delle fondamenta, non un valore nella pagina.

## Titoli delle folder card in minuscolo, 18px · 2026-09-30
- Il concept li ha maiuscoli a 30px ("IL VALORE"). CLAUDE.md cap. 7 li
  elenca fra le scelte da non riprodurre: sono titoli, Geist 18/600.
- Presa come scritto. Il sottotitolo "quello che devi sapere" resta in
  minuscolo come nel concept (la stringa è maiuscola nel dizionario).

## "oggi / Skill Vision" con ToggleGroup neutro · 2026-09-30
- Le pillole del concept erano bianche con la scelta in giallo `#F2EE14`.
  Il ToggleGroup della libreria marca la voce accesa con `accent` (neutro).
- Presa: **ToggleGroup** senza eccezione di pagina. Il lime resta al
  bottone primario della card ("Vedi Dettagli") e alla voce attiva della
  barra laterale. Un clic su "Skill Vision" già aperto chiude, come prima.

## Toni della Home: fasce sui toni di stato, il resto neutro · 2026-09-30
- Applicata la decisione del 2026-09-28. Alto Potenziale e Alto Valore sono
  entrambi `success` (Alto Valore era "gold"): nella barra della
  distribuzione i due segmenti vicini hanno lo stesso colore, separati dallo
  spazio e distinti dalla legenda in parole. Nella Norma è `muted`, Da
  Sviluppare `warning`, Critici `destructive`. Le azioni di Le Decisioni
  seguono l'urgenza (formazione warning, coaching success, riorganizzazione
  destructive, talento neutro).

## Dipendenze tolte: Phosphor e ApexCharts · 2026-09-30
- `@phosphor-icons/react`: sostituito da Lucide (decisione del 2026-09-28).
- `apexcharts`: dopo StatTile → StatCard e l'eliminazione del codice morto
  non lo importava più nessuno. `apex-charts-3d.ts` nonostante il nome è
  SVG a mano (Fase 5). Restano `chart.js` e `recharts` fino alla Fase 5.

## "Sistema Attivo" tolto ora e non in Fase 6 · 2026-09-30
- Il registro del blocco 1 lo rimandava alla Fase 6. La Home è stata
  ricomposta in questo blocco e CLAUDE.md cap. 7 lo dà per tolto: lasciarlo
  voleva dire ricomporlo sui token per poi eliminarlo.

## Scelte a riquadro: ChoiceCard con la testata-bottone · 2026-09-30
- Le aree dell'Intervista sono riquadri che si accendono e, accesi, hanno un
  cursore dentro. Un cursore non può stare dentro un bottone.
- Opzioni: (a) Checkbox + etichetta, con il cursore sotto; (b) un bottone
  con `aria-pressed` per la testata e i controlli fuori dal bottone.
- Presa: **(b)**, pattern `ChoiceCard`: tutta la testata resta cliccabile
  come prima, e la stessa forma copre le decisioni (con icona e
  descrizione, centrate).

## PersonRow e StatCard cliccabili · 2026-09-30
- Tre elenchi di persone e due gruppi di riquadri aprivano un dettaglio con
  un clic su un `div`. Presa: `PersonRow` (pattern) e `StatCard` con
  `onClick`, che diventano bottoni. Stessa resa, in più tastiera e focus.

## Badge rimovibile · 2026-09-30
- I tag con la ✕ (valutatori in Hard, persone nel confronto) avevano la ✕
  in uno `span` cliccabile. Presa: prop `onRemove` del Badge, con un
  bottone vero e `removeLabel` come nome.

## Emoji nelle risposte dell'Assistenza IA · 2026-09-30
- Le azioni consigliate (`priorityActions`) portano un'emoji che finisce
  nel testo della risposta. Nel testo non c'è posto per un'icona Lucide.
  Presa: punto elenco "•". Il campo `icon` resta nei dati, non usato.

## Grafici approvati per la Fase 5 · 2026-09-30

Proposte il 2026-09-30 (Fase 3, blocco 7, MAPPATURA §10), **approvate lo
stesso giorno**: le 11 della tabella G1–G11 e il radar (R1–R6). Si fanno in
Fase 5. Da CLAUDE.md aggiornato: la fascia più alta è **neutra** (non
`success`), e le fasce di idoneità si chiamano "Idoneo", "Da valutare",
"Non idoneo".

Verificato sulla documentazione ufficiale di Bklit UI
([bklit.com/docs](https://bklit.com/docs/components/radar-chart)): 17 grafici
— Area, Bar, Candlestick, Choropleth, Composed, Funnel, Gauge, Heatmap, Line,
Profit/Loss Line, Live Line, Pie, Radar, Ring, Scatter, Sankey, Sunburst. Il
**Radar** è componibile (`RadarChart`, `RadarGrid`, `RadarAxis`,
`RadarLabels`, `RadarArea`), una `RadarArea` per serie, valori **0–100** per
ogni asse: le scale /10 di Assessment si moltiplicano per 10, i Big Five di
Recruiting sono già 0–100. L'effetto "glow" del Radar va spento (regola 4).
Nessuna proposta usa heatmap, choropleth o sunburst: la scala sequenziale
non esiste.

### R Il radar — dove, quali dimensioni, da quali dati

Regola comune: **due serie**, la persona in `chart-mono` (area piena tenue +
bordo), il riferimento in `muted-foreground` (solo bordo, tratteggiato);
etichette dirette sugli assi con il valore, niente legenda a lato. Cinque o
sei assi al massimo: oltre, un radar non si legge più e serve una Bar.

| # | Schermata | Dimensioni (assi) | Persona | Riferimento | Oggi | Perché |
|---|---|---|---|---|---|---|
| R1 | **Pannello dipendente** (Sheet), sezione Competenze trasversali | Big Five: Apertura, Coscienziosità, Estroversione, Amicalità, Stabilità emotiva (5) | `computeBigFive(emp)` | 6,5 (il benchmark già usato dagli StatTile) | 5 StatTile con barra | è il profilo di una persona: la forma dice più di cinque numeri separati |
| R2 | **Pannello dipendente**, sezione Competenze professionali | APEX 5D: le 5 dimensioni `computeHardSummary(emp).dims` | `mediaTotale` | 6,5 | 5 StatTile | come R1, per il modulo B |
| R3 | **Area Valutazioni Trasversali → Individuale** | i 5 cluster soft (`computeSoftSummary(emp).perCluster`) | `ottenuto` | `atteso` del ruolo (Censimento ruoli) | 5 StatTile + GroupedBars Big Five | **atteso contro reale** per il ruolo: è il confronto che il cliente chiede |
| R4 | **Area Valutazioni Trasversali → Individuale**, "Profilo Big Five" | Big Five (5) | `bf` del dipendente | `bfAtteso` del ruolo | GroupedBarsChart ottenuto/atteso | due serie su cinque assi: il radar mostra dove il profilo esce dalla forma attesa |
| R5 | **Area Valutazioni Professionali → Individuale**, profilo APEX 5D | 5 dimensioni | tre serie per fonte: Manager, Peer, Auto | 6,5 come anello di riferimento | GroupedBarsChart a 3 serie | le tre fonti sono tre serie → famiglia categorica `chart-1…3` nell'ordine dato; l'anello del benchmark resta `muted-foreground` |
| R6 | **Recruiting → Ranking**, card candidato, e **CV Match** | Big Five del candidato (5, già 0–100) | `candidate.bf` | profilo ideale del ruolo `role.bf` | `BigFiveRows` (barre con marcatore dell'ideale) | stesso confronto atteso/reale di R4, dal lato della selezione: i due moduli leggono il profilo nello stesso modo |

Dove non lo propongo: il confronto fra 2–5 dipendenti (Soft/Hard →
Confronto) resta la tabella con `MatchCell`, perché i cluster sono 35 skill
e cinque aree sovrapposte non si leggono; l'organizzazione intera (Soft →
Panoramica) resta a barre (vedi 10.2), perché lì il riferimento è la media e
non un profilo.

### G Gli altri grafici

| # | Dato | Schermata | Oggi | Proposto (Bklit) | Perché |
|---|---|---|---|---|---|
| G1 | Big Five aggregato dell'azienda, ottenuto contro atteso | Area Valutazioni Trasversali → Panoramica | GroupedBarsChart (Chart.js) | **Composed** — `SeriesBar` per l'ottenuto, `Line` per l'atteso | è il caso "persona contro benchmark" di CLAUDE.md, a livello di azienda |
| G2 | Cluster soft, ottenuto contro atteso | Area Valutazioni Trasversali → Panoramica (oggi StatTile) | 5 StatTile | **Composed** come G1 | lo scarto dal benchmark oggi si legge solo come numero in ogni riquadro |
| G3 | Andamento Competenze Trasversali e Professionali nel tempo | Valori Complessivi | Chart.js, area con due serie | **Line** a due serie (`chart-mono` + `muted-foreground`), senza riempimento | due aree sovrapposte si coprono a vicenda; i colori sono già stati corretti in questo blocco |
| G4 | Dipendenti per punteggio soft (x) e hard (y) | Valori Complessivi, "Matrice di classificazione" | solo elenchi per fascia | **Scatter** con le soglie delle fasce come linee di riferimento, un punto per persona, apre il pannello al clic | **dato oggi mostrato solo come elenco**: la matrice a nove caselle è il grafico naturale, e il vecchio Assessment lo aveva (`ValoreScatterChart`, codice morto tolto in questo blocco) |
| G5 | Punteggio Complessivo (%/100) | Home Assessment, pannello Il Valore | numero + barra | **Gauge** | "punteggio singolo" in CLAUDE.md. **Tocca il concept del cliente**: da chiedere a lui, non solo a voi |
| G6 | Copertura ruoli (%) | Home Assessment, Il Valore | numero + barra | **Ring** | come G5 |
| G7 | Distribuzione per fascia | Home Assessment, Il Capitale Umano | `DistributionBar` (pattern) | **resta** il pattern | una barra a segmenti con la legenda in parole è già il grafico giusto; Pie/Ring con cinque fasce si leggono peggio |
| G8 | Imbuto di selezione | Home Recruiting | SVG a mano | **Funnel** | già in MAPPATURA §6; i colori oggi sono `chart-2…5` + `success`: diventano `chart-mono` (una serie sola) |
| G9 | Qualità del ranking per fascia | Home Recruiting | `QualityStackedBar` (Tailwind) | **Bar** impilata, oppure il pattern `DistributionBar` | stesso dato di G7 in Recruiting: un solo componente nei due moduli |
| G10 | Customer Care: CSAT e ticket risolti per settimana | Customer Care | Chart.js | **Composed** — `SeriesBar` ticket, `Line` CSAT | due unità diverse: servono due assi, Composed li ha |
| G11 | Andamento punteggio organizzativo | Home Assessment, Le Perdite | Recharts (shadcn Chart) | **Area** di Bklit | già su `chart-mono` e senza sfumatura da questo blocco; resta da cambiare libreria |

I nomi delle fasce sono confermati (CLAUDE.md cap. 7): G4, G7 e G9 li
mostrano come etichette dirette. In G7 la fascia più alta passa a neutro
pieno, "nella norma" resta neutro tenue.

## Bklit installato dal registro, non da npm · 2026-09-30
- `@bklitui/ui` non esiste su npm: Bklit si installa dal suo registro
  shadcn (`bklit.com/r/<nome>.json`), che copia i sorgenti nel progetto.
- Il CLI di shadcn avrebbe sovrascritto `lib/utils.ts` (il nostro `cn` esteso
  alla scala `text-app-*`) e scritto in `globals.css` una palette propria
  (`--chart-1…5` grigi in oklch, più una scala sequenziale).
- Presa: installazione con uno script che risolve le dipendenze del
  registro e copia solo i sorgenti in `components/charts/` (107 file), senza
  `utils` e senza variabili. I nomi che Bklit legge (`--chart-grid`,
  `--chart-tooltip-background`…) sono **alias** dei nostri ruoli in
  `globals.css`, ripetuti in `.dark`. La scala sequenziale non è definita.
  Si importa da `@/components/charts` (un indice), non da `@bklitui/ui/charts`
  come scrive CLAUDE.md §3.
- Adattamenti al codice di Bklit, segnati nei file: tooltip e date senza
  ombra né sfocatura, con bordo marcato; alone di radar e ring spento di
  default; formati di data e numeri in `it-IT`; etichette dei punti da un
  campo `label` (mesi e settimane invece di giorni); `valueMax` per un fondo
  scala fisso nel BarChart; `fillOpacity` e `strokeDasharray` nel RadarArea
  (il riferimento solo come contorno tratteggiato); corpi del testo sulla
  scala `text-app-*`; nessun esadecimale. oxlint ignora la cartella (codice
  di terzi).

## Composed solo sul tempo · 2026-09-30
- Il ComposedChart di Bklit ha solo l'asse del tempo. "Ottenuto contro
  atteso" su dimensioni (G1 Big Five aziendale, G2 cluster soft) non si può
  fare con il Composed.
- Presa: **barre raggruppate** (BarChart di Bklit) con l'atteso come serie
  di confronto in `muted-foreground`, fondo scala 10. Il Composed resta dove
  l'asse è il tempo (G10 Customer Care: ticket a barre e CSAT in linea su due
  assi; G11 e G3 come Area/Line).

## Matrice di classificazione (G4) con visx, non con Bklit · 2026-09-30
- Anche lo Scatter di Bklit ha solo l'asse del tempo: soft × hard non si fa.
- Opzioni: (a) shadcn Chart (Recharts), ripiego previsto da CLAUDE.md, ma
  tiene una libreria di grafici in più solo per questo; (b) un pattern
  disegnato con visx — la base su cui Bklit è costruito, già installata
  con Bklit — con gli stessi token.
- Presa: **(b)**, pattern `ScatterMatrix`. Nessuna dipendenza nuova,
  `recharts` rimosso. Se Bklit aggiunge uno scatter numerico, si rivaluta.

## Radar: tabella dei valori sotto il grafico · 2026-09-30
- Un radar non ha etichette dirette sui valori. Presa: legenda con il
  campione della linea (piena / tratteggiata) subito sotto e la tabella dei
  valori per asse, visibile: il valore si legge senza il colore (regola 10)
  ed è anche l'alternativa per i lettori di schermo (l'SVG di Bklit è
  `aria-hidden`).

## Gauge e Ring nella Home (G5, G6) · 2026-09-30
- Approvati insieme alle altre proposte. Stanno dentro gli StatCard del
  pannello "Il Valore", al posto delle barre: il numero resta scritto nel
  riquadro, l'indicatore non lo ripete. Gauge a semicerchio, tacche in
  `chart-mono` su `muted`, nessuna sfumatura.

## Fascia più alta neutra, fasce di idoneità con il nome · 2026-09-30
- Da CLAUDE.md aggiornato (cap. 7). Sostituisce "Chip e badge" (gold →
  success) e i toni della Home del 2026-09-30.
- Presa: tono nuovo **`strong`** (neutro pieno) per Badge, StatCard e
  Progress; `chip-gold` → `strong`; nella Home e nella matrice la fascia più
  alta è `foreground`, "nella norma" `muted-foreground`. Le fasce di
  idoneità hanno un pattern, `IdoneitaBadge`, e un modulo, `lib/idoneita.ts`
  ("Idoneo", "Da valutare", "Non idoneo"): skill essenziali e Big Five del
  candidato, qualità del ranking (il nome AHI resta accanto), cluster soft
  e soft skill (StatTile).

## "Mansione" e "Attività" in Assessment · 2026-09-30
- "Ruolo" → "Mansione" nelle etichette a schermo. In Anagrafica c'era già
  una colonna "Mansioni" (il testo libero di cosa fa la persona, campo
  `mansione`): accanto a "Mansione" sarebbe stata ambigua.
- Presa: quella colonna e il suo campo diventano **"Attività"** / "Attività
  svolte". Nomi nel codice e dati salvati invariati.
- Restano "ruolo": l'intervistato dell'Intervista (CEO…), il contatto
  aziendale, le domande generiche sui "ruoli e responsabilità", le
  intestazioni dei CSV esportati (sono file, non schermo).
- In Recruiting "ruolo" → "Posizione" dove indica la posizione da coprire;
  restano il ruolo dell'utente, del valutatore, dell'autore del report e i
  ruoli nel CV del candidato.

## Guscio unico: un componente usato da due layout · 2026-09-30
- Opzioni: (a) AppShell come rotta genitore di `/recruiting` e
  `/assessment`, con la barra laterale scelta dal percorso; (b) AppShell
  come componente, reso dal layout di ciascun modulo dentro i suoi
  provider.
- Presa: **(b)**. La navigazione di Assessment legge il suo contesto
  (`AssessmentProvider`: moduli attivi, contatore, reset demo); con (a)
  il provider sarebbe dovuto salire sopra Recruiting. Resta un solo AppShell,
  una sola Topbar, una sola Sidebar.
- La barra superiore del modulo Assessment (titolo e azioni di pagina) è
  diventata l'intestazione della pagina (PageHeader) con gli stessi testi e
  lo stesso slot `useTopbarActions`.

## Sidebar scritta sul modello di shadcn · 2026-09-30
- La Sidebar di shadcn porta modalità a icone, cookie e scorciatoie che qui
  non servono. Presa: una primitiva più piccola con la stessa API (Provider,
  Header, Content, Group, Menu, MenuButton, MenuSub, Badge, Footer, Trigger),
  i token `--sidebar-*`, e il pannello Sheet sotto `lg` per i due moduli.

## Come si riconosce la demo · 2026-09-30
- Il prodotto non aveva modo di saperlo. Opzioni: (a) variabile d'ambiente;
  (b) un flag sull'account o sulla società nel backend.
- Presa, come proposta: **(a)** `VITE_DEMO_MODE=true`, messa solo sul
  servizio che fa da demo (in sviluppo vale sempre). (b) è più giusta a
  lungo termine e arriva con la Fase 8 (ruoli dal backend).
- **Effetto oggi:** finché la variabile non è impostata su Railway, "Reset
  demo" non compare nella build di produzione.

## Solo italiano · 2026-09-30
- `readSharedLang()` restituisce sempre `it`: anche chi aveva scelto
  l'inglese (chiave `sv_language` nel browser, scritta anche dal guscio
  legacy) vede l'italiano. Il dizionario inglese e `getUI(lang)` restano.

## Catalogo nell'anteprima: impostazione esplicita · 2026-09-30
- `VITE_ENABLE_COMPONENT_CATALOG=true` compila `/dev/components` nella
  build; il server combinato lo serve solo con la stessa variabile.
- Su Railway esiste un solo ambiente (`production` del progetto
  `zesty-victory`, servizio "Skill Vision"): non c'è un'anteprima separata.
  La variabile **non è stata impostata** da questa sessione: va messa sul
  servizio (e tolta prima del primo cliente, Fase 8).

## Radice `/` in React e rinvio dal login legacy · 2026-10-01
Opzioni: (a) il login legacy resta sulla sua landing e da lì si entra nei
moduli; (b) dopo l'accesso il guscio legacy porta a `/` in React.
Cambia: con (a) la scelta del modulo resta in HTML statico, fuori dal guscio
unico. Raccomandazione e scelta: **(b)**, come chiede la Fase 4. Una sola riga
in `showScreen('landing')` delle due copie di `js/app.js`
(`location.replace('/')`); login, credenziali e chiave di sessione invariati.
`/` con un solo modulo acquistato porta direttamente lì. Per tornare indietro
basta togliere quella riga.

## Asse y fisso nei grafici nel tempo · 2026-10-01
Opzioni: dominio calcolato sui dati (Bklit di serie) o scala piena fissa.
Cambia: sui dati, una variazione da 6,1 a 6,4 sembra un crollo o un boom.
Scelta (richiesta): **scala fissa** — 0–10 per i punteggi, 0–100 per le
percentuali — con la prop `scale` di `TrendChart`, che arriva allo shell Bklit
come `fixedYDomains`. Le serie che non hanno una scala nota restano sui dati.

## Assessment senza tema parallelo · 2026-10-01
Opzioni: tenere `assessment-scoped.css` svuotato con il ponte, o toglierlo.
Scelta: **tolto** con il ponte e `legacy-assessment.css`; le pagine sono tutte
su primitive e pattern e il confronto selettori/`className` non trova classi
orfane. Resta `assessment-print.css`: la stampa del report Intervista si
costruisce come HTML a parte e non ha componenti, usa le primitive di colore
`--color-neutral-*` (la carta è sempre chiara).

## Anteprima della Scheda Professionale senza scorrimento interno · 2026-10-01
Opzioni: (a) colonna `sticky` con scorrimento proprio (oggi); (b) colonna che
scorre con la pagina. Cambia: (a) dà due barre di scorrimento e con `top-4`
l'anteprima finiva sotto la barra superiore; (b) perde l'anteprima sempre
visibile durante la compilazione. Raccomandazione e scelta: **(b)**, è il
difetto segnalato nel capitolo 7; "Vedi anteprima" resta per saltarci.

## Glifi nei testi · 2026-10-01
✓ ★ ▲▼ ◆ ← ↺ e le emoji nei bottoni sono tolti dai testi; dove servono,
icone Lucide nel bottone. Le valutazioni a stelle diventano "n / 5". Le frecce
"→" in fondo a un'etichetta di link restano: sono tipografia, non icone.
Resta 🔗 nel testo della lettera d'invito del questionario (è il contenuto di
un messaggio, non interfaccia).

## Colori decorativi nei riquadri dei punteggi di Recruiting · 2026-10-01
`SubScoreBoxes` e `SkillTierSums` usavano `chart-2/3/4` per tre metriche già
etichettate: decorazione (regola 10). Scelta: **neutri**; il totale si
distingue col bordo di 2px, la gerarchia la fa il valore.

## Fuori dall'audit di `frontend/src` · 2026-10-01
Restano 239 difetti nel repository: il guscio legacy (`css/style.css`,
`js/app.js`, `index.html` e le copie in `frontend/legacy-shell/`) va in pensione
in Fase 8 e non si ritocca prima; i modelli email del backend usano colori e
caratteri in linea perché i client di posta non leggono variabili CSS —
portarli sulla palette (esadecimali dei token) è una scelta da fare a parte.
L'audit non riconosce le sfumature Tailwind (`bg-gradient-*`): una è stata
trovata a occhio; proposta di aggiungere il controllo allo script.

## globals.css del pacchetto: unito, non sostituito · 2026-10-02
Il file di Alessio aggiorna quattro colori e i commenti tipografici, ma è la
versione "di sistema", senza le aggiunte del progetto: alias dei grafici Bklit
(`--chart-*`), scala dei livelli (`--z-*`) e la nota sulle primitive `-light`.
Copiato al posto del nostro, grafici e dialog avrebbero perso colori e livelli
senza dare errore. Scelta: **il nostro file, con sopra le modifiche del
pacchetto**. Da segnalare ad Alessio, perché la prossima consegna parta dal
file del repository.

## Badge neutri in scuro su `secondary-foreground` · 2026-10-02
In scuro `muted-foreground` (neutral-400) su `secondary` (neutral-700) dà
4,11:1. Scelta: `dark:text-secondary-foreground` dove le due classi stanno
insieme (badge neutro e 15 punti di Recruiting). In chiaro resta il grigio
tenue (6,4:1): il badge neutro deve restare più quieto di quelli di stato.

## Decimali: virgola a schermo, punto nei CSV · 2026-10-02
Opzioni: virgola ovunque, o solo a schermo. Cambia: i CSV con `;` sono letti da
chi li importa, e un cambio di formato è un cambio di comportamento. Scelta:
**solo a schermo** (`fmtDec`, `fmt1`); le esportazioni tengono il punto
(`fmt1csv`). Nel protocollo del colloquio i punteggi restano a **due decimali**:
sono su /5 e le differenze di 0,05 decidono la classifica fra candidati. Per
portarli a uno basta un parametro.

## «Archivia» non è un'azione distruttiva · 2026-10-02
Archiviare un dipendente si annulla con «Ripristina» e non cancella dati. In
una colonna di tabella il rosso ripetuto su ogni riga diventava il segnale più
forte della pagina. Scelta: `ghost` nella riga, `default` per la conferma nel
dialog (l'unica azione primaria lì).

## Note da sviluppatore che nascondono funzioni mancanti · 2026-10-02
Tre note dicevano «resta nell'app corrente»: «Segna completato» in CV
Elaborati, cambio posizione/scheda vuota/import CSV in Profilo Candidatura,
import massivo dei CV. Sono funzioni del vecchio Recruiting mai portate in
React, cioè lacune precedenti alla migrazione. Il testo ora dice «non ancora
disponibile in questa schermata/versione», ma **la lacuna resta** e va decisa
col cliente: riportata nel resoconto.

## Niente sfocature né aloni nei grafici · 2026-10-02
Bklit anima l'entrata di barre e punti con un `blur()` e mette un alone
`drop-shadow` su radar e anello al passaggio del mouse. Il nuovo audit li vede
(regola 4). Scelta: tolti, resta l'opacità. Le prop `showGlow`, `enterBlur` e
`inactiveBlur` restano nel tipo per compatibilità, ma non fanno più niente.

## `chart-compare` per la serie di confronto · 2026-10-02
Da CLAUDE.md (Fase 5): il confronto non usa più `muted-foreground`, che è un
colore di testo e come riempimento pesa quanto il dato principale. Token nuovo
`--chart-compare` (neutral-400 / neutral-500), usato da `seriesColors`, dagli
alias di Bklit (`--chart-line-secondary`) e da «nella norma» nelle
distribuzioni e nella matrice.

## Valore sulle barre: prop `valueLabel` nel `Bar` di Bklit · 2026-10-02
Bklit non scrive il valore sulla barra. Opzioni: un livello SVG a parte che
ricalcola le posizioni, o una prop nel `Bar` installato (è codice nostro,
copiato dal registro). Scelta: **la prop**, che usa le stesse coordinate della
barra (raggruppate, orizzontali, verticali) e non può disallinearsi.

## Matrice: soglie diagonali e forme per fascia · 2026-10-02
L'indice di Valori Complessivi è la media 50/50 dei due assi, quindi la soglia
t è la retta x + y = 2t. Le linee si disegnano con la formula vera, non come
griglia. Forma per fascia, nell'ordine delle fasce: rombo, cerchio, quadrato,
triangolo, triangolo giù; la stessa forma nella legenda.

## Radar: etichette brevi invece di un radar più piccolo · 2026-10-02
Riquadri più alti (448 / 384 px) e, dove il nome non ci sta, un'etichetta
breve per asse (`short`), come chiede CLAUDE.md. I cluster soft perdono il
prefisso «Competenze (di)»; la tabella sotto il radar tiene il nome intero.

## Recruiting: intestazione dopo la barra del contesto · 2026-10-02
La barra Società / Campagna / CIP sta nel layout di Recruiting, sopra la
pagina; il `PageHeader` è il primo elemento della pagina, quindi viene sotto.
Alternativa: spostare la barra sotto l'intestazione in ogni pagina. Scelta:
**lasciarla dov'è**, perché è il contesto di tutto il modulo e non di una
pagina sola.

## Traduzioni: preset di Recruiting esclusi · 2026-10-02
I preset (`jd-presets.ts`) e le opzioni come «Hard Skills / Soft Skills» si
salvano nelle schede come testo. Tradurli cambierebbe i valori e una scheda
già salvata non ritroverebbe più la sua scelta. È un cambio dei dati salvati,
quindi resta fuori finché non si decide una migrazione. «Excel import» dei
candidati si traduce solo a schermo (`sourceLabel`). I dati demo di
Assessment si traducono nel seed: quelli già nel browser restano inglesi fino
a «Ripristina demo», e Customer Care riconosce l'area con i due nomi.

## Invio del link: niente reinvii, esito per persona · 2026-10-02
«Già ricevuto» = voce di preselezione della posizione attiva in stato
inviato / completato / ha risposto / non ha risposto, oppure inviata in
automatico. «Link pronto» (link generato ma non spedito, perché manca il
servizio email) **non** conta come ricevuto: si può ancora inviare. Il backend
rifiuta comunque il reinvio (409); l'interfaccia lo impedisce prima, con la
casella disattivata e l'etichetta «Link già inviato».

## Contrasto in scuro dentro le superfici `secondary` · 2026-10-02
In scuro, sul fondo `secondary` (neutral-700), testo secondario e colori di
stato scendono sotto 4,5:1. Opzioni: correggere ogni punto, o una regola nel
tema valida per ogni superficie `bg-secondary` e riga selezionata. Scelta:
**la regola nel tema**, perché i casi nascono per composizione (un badge dentro
un riquadro) e non si vedono nel singolo componente. Il testo di stato prende
`secondary-foreground`: il significato resta affidato a etichetta e icona
(regola 10).

## Gruppo B: si tengono i termini inglesi · 2026-10-02
Decisione di Alessio: report, gap, benchmark, feedback e team restano in
inglese; resta tradotto solo ranking → classifica. Il dizionario di Assessment
è stato ricostruito dall'ultimo commit con le sole traduzioni del gruppo A,
per non lasciare voci miste.

## Preset delle schede: tradotti, con conversione all'apertura · 2026-10-02
Le schede salvate hanno una copia delle proprie voci, quindi tradurre i preset
non rompe le selezioni. Le schede vecchie però resterebbero in inglese. Scelta:
**conversione all'apertura** (`convertJdState`, stessa tabella dei preset),
invece di una migrazione una tantum dei dati salvati. Così non si scrive niente
finché l'utente non salva, e funziona anche per le schede sul server. Restano
in inglese nomi propri, sigle, titoli delle posizioni e i termini del gruppo B.

## Original Skills: chiamata di prova senza vedere le credenziali · 2026-10-02
`railway run --service Backend` inietta le variabili di Railway nel processo:
la chiave non passa dalla sessione, dai file o dai log. Lo script stampa solo la
struttura della risposta, mai valori di persone. I due codici azienda passati
solo come variabile del comando, perché `ORIGINAL_SKILLS_COMPANY_MAP` non è
ancora impostata: va aggiunta su Railway.

## Fase 8 dietro un interruttore · 2026-10-02
Opzioni: sostituire subito il login, o costruire il nuovo accanto al vecchio.
Scelta: **accanto**, con `VITE_AUTH_MODE` (default `legacy`). Il passaggio
richiede account reali, che dipendono dal cliente, e il ritiro del guscio va
fatto in un colpo solo con la sua copia. Il backend è compatibile con le due
strade (token nel corpo o nel cookie).

## Cookie httpOnly: API sulla stessa origine · 2026-10-02
Frontend e backend su Railway hanno domini diversi, e un cookie
`SameSite=Strict` non viaggia fra siti diversi. Opzioni: `SameSite=None`
(cookie di terza parte, bloccato da Safari e in via di blocco altrove, e più
esposto a CSRF) oppure passare l'API dal server del frontend. Scelta: **proxy
`/api/*` in serve-combined** (`BACKEND_INTERNAL_URL`), con il cookie limitato a
`/api/v1/auth`. Refresh e logout via cookie controllano comunque l'origine. Il
CORS del backend, che oggi rimanda qualunque origine, non serve in questa
modalità: si potrà restringere al ritiro del guscio.

## Limite ai tentativi in memoria · 2026-10-02
Nessuna dipendenza nuova: un limitatore a finestra fissa. Vale per
un'istanza; con più istanze del backend serve un archivio condiviso. `trust
proxy` è un numero di passaggi e non `true`, perché con `true` il client
sceglierebbe il proprio IP.

## Account con password pubbliche: disattivati, non cancellati · 2026-10-02
Opzioni: cancellarli, cambiare loro la password, disattivarli. Cancellarli
rompe i legami con i dati (CV caricati, campagne, valutazioni). Cambiare la
password lascia account che nessuno usa. Scelta: **stato DISABLED con revoca
delle sessioni**, reversibile con `--restore`. In più `/auth/refresh` e
`/auth/me` ora rifiutano gli account disattivati: prima un refresh token
ancora valido li teneva aperti per 30 giorni.

## Script nel container, non da fuori · 2026-10-02
Il Postgres di produzione non è esposto (niente `DATABASE_PUBLIC_URL`), ed è
giusto che resti così. Gli script girano con `railway ssh` dentro il Backend,
dalla versione compilata in `dist/scripts`. Così non serve esporre il
database né portare la sua stringa di connessione su un computer.

## Proxy: si inoltra solo l'IP aggiunto dal bordo · 2026-10-02
Con tutta la catena `X-Forwarded-For` il backend avrebbe dovuto fidarsi di
due proxy, e sul suo dominio pubblico (ancora attivo) un client avrebbe
potuto falsificare l'IP. Inoltrando solo l'ultimo indirizzo, quello del bordo
di Railway, `TRUST_PROXY_HOPS=1` è corretto su tutte e due le strade.
Verificato con un IP finto diverso a ogni tentativo.

## Competenze: proposta di adottare le diciture di Original Skills · 2026-10-02
Proposta, non applicata: serve l'approvazione del cliente. Le diciture
ufficiali risolvono anche le differenze fra le liste di Assessment e
Recruiting. Raccomandate: adottare «Sensibilità alla formazione» (la nostra
dicitura ha il senso rovesciato) e le quattro diciture inglesi come nomi
propri del test. `ps6` aspetta la risposta di Original Skills.

## Original Skills: anteprima in sola lettura e non importazione · 2026-10-03
Opzioni: (a) importare le persone come candidati di Acme Corp; (b) anteprima
che legge al momento, senza salvare; (c) aspettare l'integrazione completa.
(a) mette dipendenti reali ("Dipendente dell'impresa") come candidati in una
società di prova che non è la loro e tocca il salvataggio dei dati: escluso.
Scelta di Bilal: (b). Solo PLATFORM_ADMIN, spenta salvo
`ORIGINAL_SKILLS_ENABLED=true`, visibile solo con il login backend. Le chiavi
della mappa che sono companyId mostrano il nome della società; le altre
restano etichette provvisorie. Dati personali non necessari filtrati nel
server, non nel browser.

## Original Skills: le righe dell'account API entrano come società propria · 2026-10-03
L'API restituisce sempre le righe con codAzienda = authCompany e il server le
scarta se quel codice non è richiesto. Bilal ha chiesto di vedere LOGICAMED
S.R.L., che è proprio l'account API: aggiunta alla mappa come chiave
`logicamed`. Le sue righe compaiono solo filtrando per tutte le società o per
`logicamed`; il filtro per le altre società continua a scartarle.

## Selettore lingua e impostazioni nella barra superiore · 2026-10-05
- Richiesta (checklist Entry Page, Roberto Feliciani): ripristinare in alto a
  destra Impostazioni e selettore lingua. Contraddice "Solo italiano ·
  2026-09-30" e CLAUDE.md cap. 7 ("Lingua"), quindi la nuova richiesta prevale.
- Opzioni: (a) selettore IT/EN che scrive `sv_language`; (b) solo icona.
  Presa **(a)**. `readSharedLang()` legge di nuovo la chiave (predefinito `it`).
- **Effetto:** l'inglese cambia solo i testi di Assessment (dizionario già
  presente); guscio e Recruiting restano in italiano finché non si traducono.
- Impostazioni: nuovo `SettingsDialog` con solo tema e lingua, i valori che
  oggi sono davvero condivisi. Il modale legacy aveva colori esadecimali,
  nome società e scala di punteggio: non riportati (regola 1; le impostazioni
  di Assessment restano nel modulo). Da confermare con Roberto se servono altre voci.

## Ombra sulle due card della scelta del modulo · 2026-10-05
- Richiesta esplicita (Bilal): ombra sulle card "Accedi al cruscotto
  Recruiting / Assessment", perché senza sembravano piatte. Contraddice la
  regola 3 (nessuna ombra): **eccezione voluta, limitata a queste due card.**
- Realizzata con `shadow-[0_8px_16px_0_var(--border-strong)]`: colore da
  token (regola 1), scarti dalla scala (8, 16), nessuna sfumatura colorata.
  Le `--shadow-*` del tema restano azzerate: nessun'altra card cambia.
- `audit-identita` oggi non la segnala (non riconosce questa forma): va
  comunque tenuta in elenco qui e rimossa se Roberto Feliciani non conferma. Per tornare indietro: togliere la classe.

## Referente e advisor nel CIP · 2026-10-05
- La richiesta (Fase 2) chiede nel CIP: cliente, campagna, progressivo,
  venditore, referente aziendale, advisor, data di attivazione.
- Cinque esistono già (cliente e campagna dal proprietario del CIP,
  progressivo e venditore nel modello `Cip`, attivazione = `generatedAt`).
  **Referente e advisor non esistono**: servono due colonne nuove su `Cip`
  (migrazione Prisma sul database di produzione) e i campi in `generateCip`.
- Opzioni: (a) colonne opzionali, compilate alla generazione; (b) tabella a
  parte modificabile. Il CIP è immutabile per decisione OD-1 (si annulla e
  si riemette): con (a) cambiare il referente richiede un nuovo CIP.
- Raccomandazione: (a). **Non applicata**: tocca il salvataggio dei dati in
  produzione e il punto OD-1 ancora aperto → in attesa di conferma.

- **Esito (2026-10-05):** Bilal ha approvato la raccomandazione (a): colonne
  opzionali `referent` e `advisor` su `Cip`, compilate alla generazione.

## Fase 3: ombra, bordo colorato e icona a destra sulle card della Home · 2026-10-05
- Richiesta (Roberto Feliciani): bordino colorato e ombre per l'effetto
  rilievo; icona a sinistra in Recruiting, a destra in Assessment.
- **Eccezione alla regola 3** (come per le card di scelta del modulo): ombra
  `0 8px 16px` in `--border-strong`, solo sul corpo di `FolderCard`.
  Bordo `primary` 2px: il lime come bordo è ammesso (regola 6 vale per il testo).
- Fra "icona a destra" e "differenziare per colore" ho preso la prima: il
  colore come categoria è escluso dalle regole 10 e 1. Tocca la Home di
  Assessment (concept del cliente): cambia solo il lato dell'icona.
- "Drawer a destra": in Assessment il dettaglio non è uno Sheet ma un
  pannello che si apre accanto alla card nella stessa riga. Recruiting fa lo
  stesso, per essere identico come richiesto. Se serve davvero uno Sheet
  laterale, va cambiato in tutti e due i moduli.

## Pagina pubblica dell'annuncio · 2026-10-05
- Il link di pubblicazione non portava a niente (dominio e pagina inesistenti).
  Opzioni: (a) solo correggere il dominio; (b) costruire la pagina pubblica
  che il link prometteva. Preso **(b)**: senza (a) il link sarebbe ancora vuoto.
- Esposizione: la pagina è pubblica per chiunque abbia il link (codice di 96
  bit, non indovinabile); legge solo profili **approvati** — togliere
  l'approvazione spegne il link. Dati usati: titolo, intestazione, sezioni,
  competenze, richieste aggiuntive. Esclusi: retribuzioni, id, autori, date.
- Il dominio non è più scritto nel backend: il link si compone nel browser con
  l'origine corrente. Quando ci sarà un dominio proprio, il link lo seguirà.
- "Come inviare il CV" è testo libero dentro `header`: copre email e link a un
  modulo. Un modulo di caricamento CV vero e proprio per i candidati sarebbe
  una funzione nuova (upload pubblico): non fatto, da concordare.

## Rinomina in "Comitato scientifico" · 2026-10-05
- Rinominato tutto ciò che l'utente vede. Non rinominati: rotta API,
  variabili d'ambiente su Railway (`ORIGINAL_SKILLS_*`), nome dei file e dei
  tipi: cambiarli rompe la configurazione senza che nessuno lo veda.
- Voce di menu in minuscolo ("Comitato scientifico"), non "COMITATO
  SCIENTIFICO": il maiuscolo è solo dello stile label (regola 8).
- "Tutti i dati, test e risultati": il pannello mostra tutto ciò che il
  server tiene di quel sistema. Sesso, anno di nascita, luogo, email, RAL,
  date di assunzione e titolo di studio **non** escono dal server, per
  minimizzazione (PROPOSTA-ORIGINAL-SKILLS.md §3.2): non li ho riaperti. Se
  Roberto li vuole, è una decisione sui dati personali, da prendere a parte.

## "Posizione e archivio" tolto, selettore della posizione spostato · 2026-10-05
- Richiesta: togliere il riquadro da CV & Esportazione. Problema: conteneva
  l'**unico** selettore della posizione aperta; senza, non si poteva più
  scegliere a quale posizione vanno i CV (CLAUDE.md: nessuna funzione sparisce).
- Opzioni: (a) togliere e basta; (b) togliere e spostare il solo selettore
  nella barra laterale, accanto alla società. Presa **(b)**: la pagina è pulita
  come chiesto e la funzione resta. Per annullare lo spostamento basta
  togliere il blocco "Posizione aperta" da `RecruitingNav.tsx`.

## Confronto interno: radar con Bklit, non Recharts/Chart.js · 2026-10-05
- La richiesta cita Recharts / Chart.js. CLAUDE.md (Fase 5) li ha tolti: la
  libreria dei grafici è Bklit, che ha il Radar ed è già usato da
  `ProfileRadar`. Usato quello; nessuna dipendenza nuova.
- **Colori:** le regole del progetto (`chart-colors.ts`) danno a due serie
  senza riferimento `chart-mono` + `chart-compare` (neutri), a tre o più la
  famiglia categorica. Con 2 candidati e nessun talento i due contorni sono
  quindi uno scuro e uno grigio, non due colori vivi; con un riferimento (media
  dei talenti) i candidati hanno colori distinti. Legenda sotto il grafico e
  valori in tabella. Per colori sempre distinti anche con 2 serie, la regola va
  cambiata in `chart-colors.ts` (vale per tutti i radar dell'app).
- Asse: 8 competenze al massimo per leggibilità (CLAUDE.md: il radar deve
  restare leggibile); scelte per scarto fra i profili.

## Pagina Metodo: vuota in demo, richiesta di accesso al cliente · 2026-10-05
- "Demo" = `isDemoMode()` (già deciso il 2026-09-30). Nessuna variabile nuova.
- «Chiedere l'accesso»: non c'è un flusso di richieste né una tabella dei
  permessi. Opzioni: (a) email precompilata a info@skill-vision.it; (b) una
  richiesta salvata sul server con approvazione. Presa **(a)**: nessun dato
  nuovo; (b) è lavoro di backend da concordare.
- Chi ha già l'accesso non ha ancora un modo di vedere il contenuto: la
  richiesta non descrive quel caso. Il contenuto resta in `MetodoContent.tsx`;
  va collegato quando si decide chi lo può leggere (ad esempio per ruolo o per
  società). Fino ad allora nemmeno gli amministratori lo vedono.

## Area Valutatore: invio, schede, vista multipla, sintesi IA · 2026-10-05
- **Dove stanno le schede compilate:** dentro `Evaluation.scores` (Json) come
  `{ verbale, valutazione }`. Opzione scartata: tabelle nuove per le schede (una
  migrazione di produzione per dati che si leggono solo insieme). Punteggio,
  raccomandazione e note dell'`Evaluation` si ricavano dalla scheda di
  valutazione, così l'elenco dei valutatori non deve aprire le schede.
- **Link nell'email:** `appUrl` deve coincidere con l'header `Origin` della
  richiesta. Opzioni: variabile `PUBLIC_APP_URL` (da impostare su Railway) o
  questa. Presa questa: funziona su qualunque dominio e nessuno può far partire
  email con un link verso un sito qualunque.
- **Un token per valutatore:** rinviare il link invalida il precedente (il
  modello ha un solo token per valutatore). Se l'email non parte, il token
  vecchio resta valido. Il link apre tutte le candidature assegnate a quel
  valutatore, non una sola.
- **Sintesi IA e dati personali — da confermare con Roberto.** Il testo delle
  valutazioni di un candidato viene inviato a un fornitore esterno (Anthropic).
  Minimizzazione fatta: niente nome del candidato, niente nomi/email dei
  valutatori, niente firme, riferimenti di candidatura, retribuzioni; i
  valutatori compaiono come "Valutatore N — Ruolo". I testi liberi possono
  comunque contenere nomi: non si filtrano. Servono informativa/contratto col
  fornitore adeguati prima di usarla su dati reali. Il server non registra il
  contenuto né le risposte d'errore del fornitore.
- **Nessuna sintesi salvata:** si genera, si modifica e si riporta; rigenerare
  chiede conferma perché perde le modifiche.
- **Il Report finale è per posizione, non per candidato** (così è sempre
  stato): riportare la sintesi di un candidato sostituisce quella di un altro.
  Per questo c'è la conferma. Un report per candidato è un cambio di modello dati.
- **Non fatto:** avviso al responsabile quando arriva una valutazione (compare
  quando apre l'elenco); promemoria ai valutatori che non hanno risposto.

## Assistente IA a tutta larghezza · 2026-10-05
- Su richiesta di Bilal la pagina Assistente IA (`/recruiting/ask`) non è più
  nella colonna di lettura da 720px (CLAUDE.md, Fase 6: "messaggi di chat entro
  la colonna di lettura"): occupa tutta la larghezza del guscio, su telefono,
  tablet e schermi larghi. Contro: su uno schermo largo le risposte hanno righe
  lunghe, meno comode da leggere. Il limite del guscio (`max-w-screen-2xl`,
  1536px, deciso il 2026-10-01 per tutte le pagine) non è stato toccato.
- I messaggi della chat (`ChatMessage`) restano a `max-w-[82%]` della larghezza.

## Icone di Profilo della ricerca · 2026-10-05
- I disegni del cliente hanno icone illustrate (casa con l'euro, lampadina con
  diamante, sacco di denaro con freccia, mano con ingranaggio e avviso). La
  regola è Lucide, senza dipendenze visive nuove (CLAUDE.md cap. 3 e 12).
- Opzioni: (a) icone Lucide composte (grande + segno piccolo); (b) importare gli
  SVG originali. Presa **(a)**: nessun file nuovo, tratto coerente con il resto.
  Per (b) servono gli SVG dal cliente; andrebbero aggiunti qui come decisione.
- Nei disegni "Competenze trasversali" e "Profilo Candidato" hanno la stessa
  casa nella pagina del pannello aperto, e "Area Valutatori" ha il sacco di
  denaro: ho seguito la prima schermata (icone tutte diverse).
- Titolo "Area Valutatori" (plurale) come nei disegni; altrove nel prodotto
  resta "Area Valutatore": va allineato quando Roberto sceglie il nome.

## Assessment Foglio 3: scelte e limiti · 2026-10-05
- **"/100%" accanto ai numeri (Finestra 1):** il numero grande e "/100%" piccolo
  accanto, come chiesto. La regola dei pattern dei grafici dice "mai 93% /100":
  qui l'unità è una sola (il numero non porta il %, lo porta il fondo scala).
- **Domande in sentence case:** nel foglio sono tutto maiuscolo; il maiuscolo è
  solo dello stile label (regola 8), quindi grassetto in minuscolo.
- **Indice attenuato:** le voci della vista non scelta si schiariscono al 45%,
  sotto la soglia di contrasto per progetto (come un disabilitato), ma restano
  leggibili e cliccabili. Il prima ("sparivano") era un filtro; ora si vedono.
  Le pagine dell'altra vista funzionano come prima (non controllano il modulo).
- **Mappa dei valori:** i punti sono dipendenti su competenze trasversali (x) e
  professionali (y); servono entrambe, quindi con una sola vista compare un
  invito a passare a "CT + CP". Zone: in alto a destra ≥ 7 su entrambe, in basso
  a sinistra < 5 su entrambe (le soglie "buono" e "medio" della scala). Tutto
  ciò che il mouse mostra si ottiene anche con i pulsanti.
- **"Stima dell'impatto economico" (Finestra 3):** la spiegazione del foglio la
  cita, ma l'applicazione non ha un modello di costo (retribuzioni, costo del
  turnover): non l'ho inventata. Il pannello mostra scarti in punti sul
  benchmark. Per una stima in euro serve decidere la formula e i dati.
- **Eccezione alla regola 3 estesa:** bordo `primary` e rilievo anche sui
  riquadri dei pannelli (`StatCard elevated`, `ChartCard elevated`), come sulle card.
- **Icone:** come per Recruiting, composte con Lucide, non gli originali.
- **Card di Recruiting:** corpo alto almeno 208px come in Assessment; il testo
  delle card di Recruiting resta il solo titolo, come nei disegni.

## Hover giallo sulle card · 2026-10-06
- Richiesta (Foglio 6): bordo / "Skill Vision" in giallo `#D1D500` al passaggio del mouse.
- Opzioni: esadecimale scritto a mano (viola la regola 1) oppure il token `primary` (lime del marchio, stesso colore).
- Il lime non è testo su fondo chiaro (regola 6): "Skill Vision" non cambia colore di testo, prende il fondo `primary` con testo scuro.
- Presa: token `primary`; bordo sulle card, fondo sui toggle, ombra della FolderCard.

## Rinominare `ps6` in Recruiting: rimandato, non rifiutato · 2026-10-06
- Richiesta di Alessio: `ps6` si chiama "Impegno lavorativo" ("Engagement lavorativo" è vietato).
- Opzioni: (a) sostituire la stringa in `recruiting/lib/constants.ts` (`SKILLS`,
  `SKILL_MATRIX`) insieme ad Assessment; (b) cambiare solo Assessment ora, e
  trattare Recruiting come il lavoro a parte già stimato in
  PROPOSTA-ORIGINAL-SKILLS.md (1–1,5 giornate, con conversione all'apertura).
- Cosa cambia: in Assessment il nome è un'etichetta, i punteggi sono per `id`
  (CLAUDE.md) — (a) è sicuro lì e l'ho applicato subito. In Recruiting il nome
  **è** la chiave con cui sono salvati i punteggi dei candidati e le
  competenze selezionate (confermato in `PROPOSTA-ORIGINAL-SKILLS.md` §3.2):
  una sostituzione diretta della stringa in `constants.ts` rende illeggibili,
  silenziosamente, tutti i punteggi già salvati sotto "Dedizione al lavoro" —
  non c'è messaggio d'errore, i dati semplicemente non si ritrovano più sotto
  la chiave nuova. È la stessa classe di problema già risolta per i preset
  delle schede (TRADUZIONI.md): serve una tabella di conversione all'apertura,
  non un cambio di una riga.
- Raccomandazione: (b) — fare subito la parte senza rischio (Assessment),
  rimandare Recruiting alla stessa sessione che farà anche `ps13`, le quattro
  diciture inglesi e `ma1` insieme (sono la stessa famiglia di modifiche,
  con la stessa conversione da scrivere una volta per tutte le voci che
  cambiano, non una per volta).
- Presa: **(b)**. Fatto: Assessment (`legacy-taxonomy.ts`, ps6 → "Impegno
  lavorativo"). Non fatto: Recruiting — resta "Dedizione al lavoro" nel
  codice finché non si scrive la conversione.

## Dicitura unica per `ma1` · 2026-10-06
- Il cliente (CLAUDE.md, 2026-10-02) ha chiesto un'unica dicitura italiana per
  `ma1`, da proporre ad Alessio: oggi Assessment dice "Prendere decisioni",
  Recruiting "Il processo decisionale"; Original Skills lo chiama "Decision
  Making" (che il cliente ha già deciso di non adottare per questo gruppo di
  quattro competenze).
- Opzioni: (a) "Prendere decisioni" (verbo, come oggi in Assessment);
  (b) "Il processo decisionale" (oggi in Recruiting); (c) "Processo
  decisionale" (senza articolo, per uniformità con le altre 34 voci della
  lista, che sono tutte nomi e non verbi né frasi con articolo: "Autocontrollo",
  "Delega", "Leadership", "Strategia"…).
- Raccomandazione: **(c)** — è la sola delle tre che sta in riga con le voci
  vicine della stessa lista (`ma2` Delega, `ma3` Direzione, `ma7` Strategia),
  ed è la stessa correzione già fatta per `ps5`/`ps8` (solo forma, non senso).
- Presa: proposta **(c)** "Processo decisionale", **non ancora scritta nel
  codice** — da confermare con Alessio prima (è un'etichetta che tocca sia
  Assessment sia la chiave salvata di Recruiting, stesso discorso di `ps6`
  sopra).

## Produzione: account dei 4 utenti e flag `ORIGINAL_SKILLS_ENABLED`/demo/catalogo · 2026-10-06
- Richiesta di Alessio: creare 4 account in produzione con password generate,
  e disattivare `VITE_DEMO_MODE`/`VITE_ENABLE_COMPONENT_CATALOG` insieme
  all'attivazione di `ORIGINAL_SKILLS_ENABLED`.
- Verificato: `ORIGINAL_SKILLS_ENABLED=true` è già attivo in produzione dal
  2026-10-02 (PROGRESS.md), prima di questa richiesta — non c'è nulla da
  attivare lì. Gli altri due flag non sono leggibili da questa sessione
  (Railway nega la lettura delle variabili di produzione a questo strumento);
  il loro stato reale va controllato da chi ha accesso alla dashboard.
- Perché non ho lanciato gli script di creazione account da qui: la
  password generata viene stampata dallo script una sola volta, in chiaro,
  sull'output del comando — che in questa sessione finirebbe nella
  trascrizione della conversazione. È esattamente il canale che
  `create-team-admin.ts` dice di evitare ("mai per email in chiaro, mai in
  Git o cronologia della shell"). Una trascrizione di chat non è più sicura
  di un'email.
- Presa: ho preparato ed esteso lo script (`--role`, `--company-id`), ma la
  creazione va fatta da Roberto o Alessio in prima persona via
  `railway ssh --service Backend --environment production`, sul loro
  terminale. Comandi pronti nel resoconto di sessione.

## Gestione valutazioni (Valutazione 5P) · 2026-10-07
- Richiesta (Foglio 7): il modulo identico al file SKILL-VISION_Valutazione_5P.html, nell'Area Valutazioni professionali, voce "Gestione valutazioni".
- Opzioni: (a) incorporare il file HTML in una pagina (iframe) — fuori dal design system e dalle regole; (b) portarlo in React sui componenti della libreria, con la stessa logica e le stesse sei schede.
- Presa: (b). Logica pura in `gestione5p/model.ts` (piano, parser Excel/CSV, calcolo, livelli, matrice a nove quadranti); schermate nelle sei schede del modello. Colori dai token: le tre fonti si riconoscono per lettera (D / P / A) e parola, i cinque livelli per parola e per toni di stato (il più alto è neutro pieno).
- Dipendenze: `xlsx` (già presente) e `jszip` (nuova) per leggere e produrre i file Excel e lo ZIP delle schede; si caricano solo quando servono (import dinamico).
- Il modello legge le schede da file Excel; Foglio 6 chiedeva invece di non usare file: il modulo fa entrambe le cose, e le schede si compilano anche direttamente sulla piattaforma (barra 1–10 colorata, ancoraggi 1/5/10 sempre visibili, note facoltative).
- La voce di menu "Valutazioni delle Hard Skill" diventa "Gestione valutazioni"; la pagina APEX 5D classica resta raggiungibile da un link nella nuova pagina.
- I dati restano nel browser (chiave `sv5p_state_v1`), come nel modello; come per il resto di Assessment, il salvataggio sul server è lavoro separato.

## Scheda del valutatore come nel file Scheda_5P_Paolo_Conti.html · 2026-10-07
- Roberto trova troppo complicata la versione con finestra di compilazione e vuole le due pagine identiche ai suoi prototipi.
- Presa: la finestra di compilazione e le aggiunte che non stanno nel prototipo sono tolte (anche il link a fondo pagina). La scheda del valutatore è una pagina a sé, `/assessment/scheda-5p#d=…`, con barra laterale (Istruzioni e scala, Persone da valutare con 0/25 … ✓, Concludi e invia), istruzioni, scala a cinque fasce e le 25 domande con barra 1–10 e ancoraggi.
- I dati di chi valutare stanno nel link (dopo il #): nessun server, come il prototipo (che era un file). Le risposte si salvano nel browser del valutatore; a fine scheda si scarica il file (o si copia il codice) per HR, che lo carica nel passo 3; se la scheda è aperta nello stesso browser del piano, "Invia alla piattaforma" le salva direttamente.
- Aggiunte necessarie rispetto al prototipo, in una riga: nel Piano la colonna "Scheda online" (Apri / Copia link), e nel Caricamento l'accettazione dei file JSON delle risposte.

## Valutazione 5P: nuovo modello di Roberto (7 schede, parte dal dipendente) · 2026-10-07
- Roberto ha mandato `Valutazione 5P Multi-Fonte.html`, che sostituisce il precedente: si parte dal dipendente, una riga per persona con le caselle di chi lo valuta (responsabile e colleghi), come Excel con menu a tendina.
- Presa: portato in React come nel modello. Schede: 1 Anagrafica (con email), 2 Assegnazioni, 3 Invio schede, 4 Caricamento, 5 Risultati, 6 Scheda individuale, Metodo. Salva / Apri / Nuovo progetto in testata. I progetti salvati prima si riaprono con le assegnazioni ricostruite dal piano.
- Tolto quanto avevo aggiunto e il modello non ha: la scheda online `/assessment/scheda-5p` con link e la colonna "Scheda online" nel piano. La scheda del valutatore è di nuovo il file HTML che si invia per email, uguale al modello.
- La scheda del valutatore (`scheda-valutatore.template.html`) segue il sistema di design: nessun colore scritto nel file; i token della piattaforma (chiaro e scuro) si leggono al momento della generazione e si iniettano nel CSS. Il file scaricato segue il tema del computer di chi lo apre, l'anteprima quello in uso. Le cinque fasce della scala sono sui toni di stato con la parola accanto, la più alta neutra piena. Correzione del 2026-10-07 dopo la segnalazione: la prima versione usava i colori blu del prototipo e il file era escluso dall'audit; l'esclusione è tolta. Nell'anteprima gira in un iframe con `sandbox`.
- Excel con menu a tendina: SheetJS libero non scrive stili né convalide, quindi `xlsx-writer.ts` scrive il file con jszip, come il modello. I colori delle celle di quel file sono quelli del file Excel.
- Nell'interfaccia le tre colonne (autovalutazione, responsabile, colleghi) si distinguono per intestazione e per bordo, senza colore come unico segnale.

## Calcolo della Scheda di valutazione sul modello PDF · 2026-10-07
- Contesto: il modello del cliente (Foglio 8) ha una matrice con tre colonne di
  fase e una media per fase ("somma dei punteggi ÷ numero di criteri valutati");
  la fascia segue la media dell'ultima fase e i criteri chiave. Il form di prima
  aveva un punteggio per riga, peso % per le righe tecniche, 20% fisso per le
  trasversali e 60/40 fra le aree.
- Opzioni: (a) tenere il calcolo pesato e aggiungere solo le colonne; (b)
  adottare il calcolo del modello.
- Cosa cambia: con (b) il punteggio finale che i valutatori esterni inviano (e che
  finisce nell'elenco dei valutatori) cambia formula. Il punteggio delle schede
  già salvate si legge come punteggio della 1ª fase e si ricalcola al prossimo
  salvataggio; i pesi restano nei dati ma non si usano.
- Raccomandazione: (b), perché l'incarico è sostituire le pagine con il modello.
- Presa: **(b)**. Le domande aggiunte dal valutatore contano come criteri nella
  media (prima restavano fuori dal punteggio pesato). Da confermare col cliente.

## Pesi delle 35 competenze: dove si salvano · 2026-10-08
- Contesto: il selettore era di sola lettura perché il profilo della posizione è
  una costante e non c'era un posto dove salvare le modifiche.
- Opzioni: (a) salvare nel browser e modificare `DEFAULT_FLAGS` sul posto;
  (b) portare i pesi sul server per posizione.
- Cosa cambia: (a) funziona subito per tutto il modulo senza toccare i punti che
  leggono i pesi, ma vale solo per quel browser; (b) richiede un modello dati nuovo
  (come "Assessment sul server", rimandato).
- Raccomandazione: (a) ora, (b) insieme al lavoro sul server.
- Presa: **(a)**. Cambiare i pesi cambia i punteggi dei candidati: è il comportamento
  voluto da Roberto, ma va segnalato a chi usa la classifica.

## Colori dei pesi delle 35 competenze · 2026-10-08
- Contesto: Roberto chiede i colori; il peso è una categoria, non uno stato.
- Opzioni: (a) scala sul lime: essenziale pieno, importante tenue, utile neutro;
  (b) token di stato verde/ambra/rosso.
- Cosa cambia: (b) farebbe leggere "importante" come un avviso; (a) resta nel
  sistema e il lime segnala ciò che conta di più.
- Raccomandazione: (a), con la parola sempre accanto al colore (regola 10).
- Presa: **(a)**. Da confermare con Roberto se voleva colori più distinti.

## Nomi dei moduli in maiuscolo e cerchi colorati · 2026-10-08
- Contesto: Roberto chiede i nomi delle due aree in maiuscolo grassetto come titoli
  e due cerchi di colore diverso.
- Opzioni: (a) farlo come richiesto; (b) tenere il titolo minuscolo (regola 8).
- Cosa cambia: (a) è un'eccezione alla regola 8 (il maiuscolo è dello stile label);
  i colori vengono da `chart-1`/`chart-2`, senza lime, e il nome resta scritto.
- Raccomandazione: (a), perché è una richiesta esplicita del cliente su un solo
  punto (la scelta del modulo); peso 600, l'unico sopra 500 ammesso.
- Presa: **(a)**. Il maiuscolo non si estende ad altri titoli.

## Profilo 5P della persona: un solo calcolo in TypeScript · 2026-10-09
- Contesto: Roberto approva il porting in `model.ts` del calcolo del file HTML
  (valori attesi, skill gap, payload) e il radar Bklit voto contro atteso.
- Opzioni: (a) funzione nuova, indipendente dal "Metodo"; (b) far leggere il Metodo
  anche al profilo.
- Cosa cambia: (a) applica subito l'algoritmo deciso (media piatta Dirigente + Peer,
  × 10, autovalutazione fuori) ma lascia due calcoli nel modulo finché le altre schede
  non si allineano; (b) non rispetta la decisione.
- Raccomandazione: (a), poi allineare Risultati e Matrice con un passo a parte.
- Presa: **(a)**.
- Soglie: la differenza di percezione usa `set.gap` × 10 (di base 15 punti, come nelle
  altre schede, non i 10 del file HTML); i Peer sono "riconoscibili" sotto `set.peerMin`;
  lo skill gap è "da sviluppare" da −10 in giù (`DASH_GAP_BAND`).
- Grafici: solo due serie (voto, atteso come riferimento in `chart-compare`); il
  valore atteso si disegna solo se c'è per tutte e cinque le P. Il radar proposto è
  approvato (DECISIONI, 2026-10-09).
- Note nel payload: solo il tipo di fonte, mai il nome di chi scrive.
- Aggiunta non richiesta: scheda "Valori attesi", perché senza un modo di inserirli lo
  skill gap non avrebbe dati. Senza numero nei passi, come "Metodo".

## Calcolo unico in tutte le schede della Valutazione 5P · 2026-10-09
- Contesto: Roberto chiede coerenza fra Risultati, Matrice, Scheda individuale ed
  esportazioni (decisione precedente: media piatta Dirigente + Peer, autovalutazione
  fuori, × 10).
- Opzioni: (a) `compute()` passa al calcolo unico e il "Metodo" esce dalle
  impostazioni; (b) tenere il Metodo come opzione e usare il calcolo unico solo nel
  profilo.
- Cosa cambia: (a) un solo numero ovunque, ma i tre modi di calcolo spariscono
  (funzione tolta per decisione del cliente) e i voti già visti possono cambiare;
  (b) due numeri diversi per la stessa persona.
- Raccomandazione: (a). Presa: **(a)**.
- Dettagli: il voto di una P è la media delle medie per voce (non la media dei voti P
  di ogni scheda: le due coincidono solo con schede complete). Livelli e quadranti
  della Matrice sul valore arrotondato (30/50/70/90; 50 e 70). Differenza di
  percezione = autovalutazione − voto, da `set.gap` × 10 punti (15).
- Aggiornati anche: scheda Metodo (con un esempio rifatto) e foglio Parametri
  dell'Excel.
- Controllo del contrasto: lo snippet dell'audit non interpreta i colori `oklab` con
  alpha usati dai fondi tenui, quindi per questo modulo il controllo è stato rifatto
  con un canvas che risolve i colori e compone i fondi. Da portare nello script
  dell'audit se si vuole un controllo valido per tutte le schermate.

## Chiusura del modulo Valutazione 5P · 2026-10-09
- Stato: migrazione, calcolo unico (media piatta Dirigente + Peer, autovalutazione
  fuori, × 10) e profilo della persona con valori attesi, skill gap, radar e barre
  Bklit sono completati. Chiusura approvata da Roberto.
- Importazione dei valori attesi da Excel: **non fatta, per scelta**. Resta
  l'inserimento a mano; da riprendere solo se serve.


## Valutazione 5P sul modello «Multi-Fonte v5» · 2026-10-12
- Contesto: il cliente chiede di sostituire l'area Valutazione 5P con il suo nuovo file
  HTML, tenendo l'interfaccia della piattaforma.
- Opzioni: (a) portare la logica del file e ricomporla sulle primitive e i pattern
  esistenti; (b) incorporare l'HTML così com'è.
- Cosa cambia: (b) porterebbe colori, ombre e caratteri fuori sistema; (a) richiede la
  riscrittura di modello e schede.
- Raccomandazione e scelta: **(a)**.
- Funzioni del modulo precedente tolte, perché il nuovo modello le sostituisce e il
  cliente ha chiesto la sostituzione: Anagrafica con responsabile, tabella delle
  assegnazioni per dipendente ed Excel delle assegnazioni (ora un unico piano Excel a
  4 fogli), Matrice 9 riquadri, tabelle per fonte della Scheda individuale (ora
  Report persona). Se il cliente rivuole la Matrice, si riprende da git (`NineBox.tsx`).
- Mantenuto dalla decisione del 2026-10-09: scala 0–100 = voto × 10, nessun interruttore
  1–10; media piatta di dirigente e colleghi, autovalutazione fuori.
- Cambiato secondo il nuovo modello: soglia della differenza di percezione **10 punti**
  (prima 15), uguale a quella dello skill gap.
- Report persona: riusa il profilo della persona (barre e radar Bklit) al posto della
  traccia a punti dell'HTML, che non è un grafico Bklit.
- Valori attesi: ora si possono importare dal foglio facoltativo VALORI ATTESI del
  piano (il 2026-10-09 era stato rimandato: il nuovo modello lo prevede).

## Durata dei token e rotazione del refresh token · 2026-10-12
- Richiesta: token d'accesso da 3 ore, refresh token lungo in cookie httpOnly,
  rinnovo automatico e nuovo tentativo della richiesta fallita, ritorno a `/login`
  se il rinnovo non riesce.
- Già presenti dalla Fase 8, quindi non riscritti: cookie `sv_refresh` (HttpOnly,
  SameSite=Strict, Secure in produzione, solo sulle rotte `/api/v1/auth`),
  `POST /api/v1/auth/refresh` con difesa CSRF sull'origine, token d'accesso solo in
  memoria, interceptor in `lib/api/client.ts` (401 → un solo rinnovo condiviso fra
  le richieste parallele → nuovo tentativo), `logout()` + `AuthGuard` → `/login`.
- Non adottato: un secondo endpoint `/api/refresh-token` (doppione di quello che
  c'è) e il rinnovo anche sui 403. Il backend risponde 401 al token scaduto; il 403
  vuol dire "autenticato ma non autorizzato" e ha già la sua gestione
  (`role_forbidden`). Rinnovare su un 403 non lo risolve e raddoppia le chiamate.
- Cambiato:
  - **sessione fissa di 3 ore dal login** (precisato da Bilal: "ogni login scade
    dopo 3 ore, poi si rifà l'accesso"). `SESSION_TTL_HOURS`, predefinito 3. Il
    refresh token scade a login + 3h e la rotazione non sposta la scadenza; il
    token d'accesso (`JWT_ACCESS_TTL` 3h) non va mai oltre la fine della sessione.
    Il rinnovo serve solo a non perdere la sessione ricaricando la pagina. Nel
    frontend un timer porta al login alla scadenza anche se la pagina è ferma.
    Prima: accesso 15m, refresh 30 giorni.
  - conseguenza: un account disattivato o con ruolo cambiato tiene l'accesso fino
    alla fine della sessione (al massimo 3 ore), perché `requireAuth` non
    interroga il database;
  - **rotazione**: ogni rinnovo emette un refresh token nuovo e revoca il vecchio
    (`rotatedAt`, migrazione `20261012170000_refresh_token_rotation`). Un token
    sostituito che ritorna entro 60 secondi riceve solo il token d'accesso (due
    schede o due richieste partite insieme). Dopo i 60 secondi è un riuso: si
    revocano tutte le sessioni dell'utente.
- Rischio noto: se la risposta del rinnovo si perde dopo la rotazione (rete che
  cade), il browser tiene il token vecchio e dopo 60 secondi l'utente deve rifare
  l'accesso. Raro, e sicuro dalla parte giusta.

## Home di Assessment: scelta CT / CP / Completo in evidenza · 2026-10-13
- Richiesta del cliente: la scelta fra CT, CP e CT + CP va evidenziata molto di
  più, deve far capire che sono due aree diverse e i riquadri devono cambiare
  colore quando si sceglie.
- Opzioni: (a) lasciarla nella barra superiore, più grande; (b) pannello a tutta
  riga sotto l'intestazione, tre riquadri con una riga di descrizione.
- Presa: **(b)**. È un'eccezione voluta a "le schermate non si riprogettano",
  chiesta dal cliente; il resto della Home non cambia.
- Colori: ogni area il suo, lo stesso della scelta del modulo (2026-10-08):
  CT `chart-1` (petrolio), CP `chart-2` (magenta), Completo neutro pieno
  (`foreground`) con i due pallini. Il riquadro scelto si riempie del colore con
  testo `background` (contrasto calcolato ≥ 5:1 in chiaro e in scuro). Il lime
  resta fuori: è il colore dell'azione, non di un'area. Il colore non è l'unico
  segnale: spunta e «Selezionata».
- Comportamento invariato: stessa ToggleGroup (tastiera, focus, ARIA), stessa
  funzione `setModuleExclusive`, stesso effetto sull'indice a sinistra.
- Rettifica dello stesso giorno (Bilal, dopo averlo visto in produzione): i tre
  riquadri grandi erano troppo. Ora è un controllo a segmenti compatto su una
  riga, sotto l'intestazione: etichetta «Seleziona la vista», pallino colorato e
  codice nel colore dell'area, voce scelta piena del suo colore con la spunta.
  Tolte le descrizioni e il titolo del pannello.
- Seconda rettifica (Bilal, stesso giorno): il selettore va a destra del titolo
  «Home» (slot delle azioni dell'intestazione del modulo) e prende l'aspetto delle
  folder card: bordo 2px `primary`, fondo `card`, rilievo
  `0 8px 16px var(--border-strong)` che diventa `var(--primary)` al passaggio
  del mouse. È la stessa eccezione alla regola 3 delle folder card (Fase 3),
  estesa a questo controllo: l'audit sale da 302 a 304 per queste due classi,
  voluto. Colori: CT `chart-1` (petrolio), CP `chart-3` (ambra, al posto del
  magenta), Completo scelto **lime** (`primary` + `primary-foreground`). Il
  lime qui segna la scelta che comprende tutto, come chiede il cliente.
  Contrasto del testo sulle voci piene ≥ 5:1 nelle due modalità.

## Home di Assessment: card allineate al pannello e un colore per card · 2026-10-13
- Richiesta del cliente (B. Le finestre, punti 2 e 3): aprendo una card diversa
  dalla prima, il pannello non si apre in linea con la card; e un colore
  leggermente diverso per ognuna delle quattro card, uguale nel suo pannello.
- Punto 2, causa: la card aperta era `sticky` (`lg:top-20`). Per aprire le card
  più in basso la pagina è scorsa, quindi la card scendeva a 80px dall'alto
  mentre il pannello restava al suo posto: le due non partivano più dalla stessa
  altezza. La prima card non lo mostrava perché in cima la pagina non è scorsa.
- Presa: tolto `sticky`; card e pannello partono sempre dalla stessa riga. Aprendo,
  se il blocco comincia sopra la parte visibile, la pagina scorre fino al suo
  inizio. Vale anche per Recruiting (stesso pattern `SkillVisionCard`).
- Punto 3, opzioni: (a) bordo del colore al posto del lime; (b) tinta leggera del
  fondo, lime invariato; (c) solo un segno colorato.
- Presa: **(b)**, prop `tint` di `FolderCard` / `SkillVisionCard`: colore al 10%
  mescolato con `card` (opaco, perché la linguetta copre il bordo del corpo);
  stessa tinta e bordo lime sul riquadro del pannello. Il Valore `chart-4` viola,
  La mappa dei valori `chart-2` magenta, Le perdite `chart-5` rosso, Le
  decisioni `chart-6` verde. Esclusi petrolio e ambra, che nella scelta CT / CP
  indicano le due aree. Il colore identifica la card e non significa niente
  (regola 10): il rosso delle perdite non è uno stato.
- Supera "le quattro card restano neutre" (Fase 2): aggiornato CLAUDE.md, cap. 7.
- Da verificare a schermo: il testo secondario sulle tinte, in chiaro e in scuro.

## Finestra 2 «La mappa dei valori»: pannello accanto, mappa delle sedi ritirata · 2026-10-13
- Richiesta del cliente: (1) la pagina che si apre va allineata alla card
  interrogata; (2) una mappa del mondo con la posizione di ogni dipendente.
- (1) Presa e tenuta: prop `panelSide` di `SkillVisionCard`. Le card della
  colonna destra (La mappa dei valori, Le decisioni) restano a destra e aprono il
  pannello a sinistra.
- (2) Fatta (commit 1453cc8: sede per dipendente, tabella città → coordinate,
  pattern `LocationMap` con d3-geo e world-atlas) e **ritirata lo stesso giorno da
  Bilal dopo averla vista in produzione** (revert): niente mappa, niente campo
  Sede, niente dipendenze geografiche, demo con la sola sede di Milano. Se il
  cliente la richiede di nuovo, il lavoro si riprende da quel commit.
- Rettifica (Bilal, stesso giorno): `panelSide` era un'interpretazione sbagliata
  del punto (1). Il pannello deve aprirsi **a destra, come prima**: tolti
  `panelSide` e il suo uso, `SkillVisionCard` torna al comportamento di c13b3e1
  (card a sinistra della riga, pannello a destra).

## Indice di Assessment: Area Valutazioni sotto Dati Aziendali · 2026-10-13
- Richiesta del cliente: «Area Valutazioni» nell'indice subito sotto «Dati
  Aziendali», con le voci «Valutazioni Soft Skill» e «Valutazioni Hard Skill».
- Presa: gruppo spostato prima di «Anagrafica», aperto di default (si può
  chiudere). «Gestione valutazioni» (la Valutazione 5P) diventa «Valutazioni Hard
  Skill», anche come titolo della pagina; «Valutazioni delle Soft Skill» diventa
  «Valutazioni Soft Skill». Le rotte non cambiano (`/assessment/soft`,
  `/assessment/gestione-valutazioni`). Il titolo della pagina soft («Area
  Valutazioni Trasversali») resta com'è: non era nella richiesta.

## Cambio ruolo e trasferimenti: requisiti e compatibilità · 2026-10-13
- Richiesta del cliente (documento «Role change / transfers»): pagina nuova che
  risponde a «se questa persona lascia il ruolo, chi abbiamo già in azienda che
  potrebbe sostituirla nel modo più efficace?», con le 3 persone più compatibili,
  e per ognuna nome e ruolo, % di compatibilità, punti di forza, gap, motivazione,
  dettaglio REQUISITI DEL RUOLO ↔ COMPETENZE DELLA PERSONA (verde / giallo / nero).
- Dati: nessun dato nuovo, nessun salvataggio. Il calcolo è in
  `lib/role-change.ts`, puro.
- Requisiti del ruolo:
  - trasversali: il censimento del ruolo (peso essenziale 3 / importante 2 /
    utile 1, valore atteso);
  - professionali: il censimento non ha attese per le cinque P. Opzioni: (a) il
    livello a cui la persona che lascia svolge oggi il ruolo; (b) il benchmark
    aziendale 7/10 per tutti; (c) i valori attesi del modulo 5P, che però vivono
    in un archivio separato, per nome. Presa: **(a), con (b) se la persona non ha
    una valutazione professionale**: è il dato più vicino a «sostituirla nel modo
    più efficace». Peso importante (2). La pagina dice quale dei due si usa.
- Stato di un requisito: posseduta (≥ richiesto), da sviluppare (fino a 2 punti
  sotto), mancante (oltre), non valutata (nessun voto: conta come mancante).
  Colori del documento sui token di stato: verde `success`, giallo `warning`, nero
  `strong`, sempre con icona e parola.
- Compatibilità: quota pesata delle competenze richieste possedute, come la frase
  del documento («ha il 92% delle competenze richieste»): posseduta 1, da
  sviluppare 1 − gap/4, mancante 0; trasversali e professionali metà ciascuna.
  Prima versione (quota del livello, valore/richiesto) scartata dopo la verifica:
  dava 98–100% quasi a tutti.
- Facilità di inserimento: «Inserimento rapido» (nessuna mancante, ≤ 3 punti da
  sviluppare), «Con un piano di sviluppo» (nessuna essenziale mancante), «Percorso
  lungo» (altrimenti). È il «quanto è facile» del documento; non si stimano mesi,
  che i dati non dicono.
- Input: persona che lascia (obbligatoria), ruolo, attività principali, area,
  livello di responsabilità, precompilati dalla sua scheda e modificabili. Il
  ruolo decide i requisiti; l'area può restringere i candidati («Solo persone
  della stessa area»); attività e livello descrivono il ruolo in testa ai
  risultati e il livello di ogni candidato è mostrato accanto al ruolo. Non
  entrano nel punteggio: non c'è un dato confrontabile su cui calcolarli.
- La scelta migliore: la persona più compatibile; se un'alternativa richiede
  meno sviluppo, lo si dice («se il ruolo va coperto in fretta…»).
- Nessun grafico nuovo (CLAUDE.md: i grafici si propongono prima).

## Cambio ruolo: persona scelta dall'azienda · 2026-10-13
- Richiesta del cliente: poter inserire nel confronto un nominativo scelto
  dall'azienda, oltre alle tre proposte.
- Opzioni: (a) una sezione a parte sotto la scelta migliore, con una card per la
  persona scelta e la sua posizione in classifica; (b) sostituire una delle tre
  proposte con la persona scelta; (c) una tabella con tutta la classifica.
- (b) nasconde una proposta del calcolo; (c) cambia l'impianto della pagina.
  Raccomandata e presa: **(a)**, una persona alla volta, stessa card e stesso
  dettaglio delle tre, nessun salvataggio. La «scelta migliore» non cambia: resta
  quella del calcolo.

## Pesi delle 35 competenze: modifica in ambra annullata · 2026-10-14
- Contesto: nella copia di lavoro c'era una modifica non registrata che passava
  «Importante» a oliva (`accent-600`) e «Utile» ad ambra (`warning`).
- Opzioni: (a) tenerla e registrarla; (b) tornare alla decisione del 2026-10-08
  (lime pieno / lime tenue / neutro); (c) colori più distinti ma nel sistema.
- Cosa cambia: (a) fa leggere «Utile» come un avviso (token di stato su una
  categoria), usa fondi fuori sistema e non cambia in modo corretto fra le
  modalità; (b) resta nel sistema; (c) richiede una scelta del cliente.
- Raccomandazione e presa: **(b)**. La modifica è salvata in
  `docs/patches/2026-10-14-softskill-pesi-ambra.patch`. Se Roberto chiede colori
  più distinti, si sceglie (c) con lui.

## Struttura delle cartelle: Recruiting per funzione, Assessment per tipo · 2026-10-14
- Contesto: riordino del progetto chiesto da Bilal; i due moduli sono organizzati
  in modo diverso.
- Opzioni: (a) Recruiting come Assessment (pages/components/lib); (b) Assessment
  come Recruiting (una cartella per funzione); (c) tenere le due forme e scrivere
  la regola.
- Cosa cambia: (a) separa pagina e componenti della stessa funzione, peggio
  quando si aggiunge una funzione; (b) è la forma migliore ma sposta ~60 file di
  Assessment e ne cambia tutti gli import, senza effetti a schermo; (c) nessuno
  spostamento, la regola nel README.
- Raccomandazione e presa: **(c)**. Funzioni nuove di Recruiting in una cartella
  propria; in Assessment si può raggruppare per funzione quando una funzione
  cresce (come `gestione5p/`). Scritto in `frontend/README.md`.

## Un solo scaricamento di file, liberato dopo 2 secondi · 2026-10-14
- Cinque copie del codice di download; tre liberavano il file subito dopo il clic,
  le altre dopo 2 secondi. Presa la versione con il ritardo (più sicura su alcuni
  browser) in `src/lib/download.ts`. Nomi e contenuti dei file invariati.

## Assessment sul server: le sei decisioni del §8.5 · 2026-10-14
Piano in `PROGETTO-ASSESSMENT-SERVER.md` §8. Decise da Roberto il 2026-10-14.
1. **Schema misto** (opzione C): tabelle per quello che il server deve
   conoscere (dipendenti, periodi, punteggi, assegnazioni, mansioni), JSONB per
   i documenti letti solo dall'interfaccia. Scartati il blob unico (non sblocca
   valutatore, invio link, società) e il tutto-normalizzato (tabelle inutili).
2. **Le persone del 5P sono i dipendenti dell'anagrafica.** Sul server il 5P
   punta a `Employee`, non tiene un elenco suo. Conseguenza da chiudere al
   passo 6: l'import Excel del piano abbina i nomi ai dipendenti; chi non c'è
   va aggiunto all'anagrafica — è un cambio di flusso, si propone prima di farlo.
3. **Dati sensibili approvati**: RAL sul server, visibile solo a
   `COMPANY_ADMIN` e `PLATFORM_ADMIN`; il motivo delle assenze ridotto a una
   categoria non sanitaria. L'informativa resta a carico del cliente.
4. **I dati di oggi si importano.** Supera, per l'import, la frase del
   2026-10-02 "con i dati veri si riparte da zero": il passo 7 (script di
   import dal browser, `--dry-run`, idempotente) entra nel progetto.
5. **TanStack Query** (`@tanstack/react-query`) entra nel frontend per i dati
   del server (proposta §7 approvata). Lo stato d'interfaccia resta locale.
6. **Confronto fra società fuori** da questo progetto. Lo schema lo permette
   dopo (`companyId` + `equivalenceClass` su `JobRoleProfile`).

## Database locale per lo sviluppo · 2026-10-14
- Richiesta: lavorare al backend in locale e portarlo su Railway dopo.
- Opzioni: (a) PostgreSQL installato nel sistema; (b) Docker; (c)
  `embedded-postgres`, i binari di PostgreSQL scaricati con npm.
- Cosa cambia: (a) chiede un'installazione e un servizio su ogni macchina; (b)
  Docker non c'è sulla macchina di sviluppo; (c) parte da una cartella, senza
  privilegi, su Windows e macOS.
- Presa **(c)**, in `backend/local-db/` con un `package.json` suo: non entra
  nelle dipendenze del backend né nella build di Railway. Solo strumento di
  sviluppo, nessun effetto sul prodotto.

## Assessment sul server: tre scostamenti dal piano nei passi 1–2 · 2026-10-14
- **Token del valutatore esterno in chiaro, non come hash.** Opzioni: (a) hash
  come `Evaluator.accessTokenHash`, il link si vede una volta; (b) token
  conservato. Con (a) sparisce "Copia link" in Gestione valutazioni
  (`EvaluationManagerModal.copyLink`), che oggi l'HR usa quando vuole: è una
  funzione che si perde. Presa **(b)**: 32 byte casuali generati dal server
  (quello del browser, `uid('tok')`, ha ~36 bit), il token smette di valere a
  valutazione inviata. Il rischio in più (furto del database) è lo stesso dei
  dati che il link apre.
- **Id del browser come `clientId` per società, non come chiave.** Gli id del
  browser (`uid()`: prefisso + 7 caratteri da `Math.random`) sono corti e
  possono ripetersi fra società. Il database ha i suoi uuid; l'API parla in
  `clientId`, unico per società. Responsabile diretto e periodo nello storico
  restano riferimenti `clientId` senza chiave esterna, come nel browser.
- **L'import dal browser è una rotta, non uno script da riga di comando.**
  I dati stanno nel browser dell'HR, non sul server: un comando chiedeva di
  esportarli a mano e passarli a chi ha accesso a Railway. `POST
  /assessment/companies/:id/import` con `dryRun` (anteprima, poi conferma),
  idempotente sul `clientId`; il frontend lo chiamerà al passo 3. La stessa
  rotta serve il "Reset demo": `POST …/reset` (solo società elencate in
  `ASSESSMENT_DEMO_COMPANY_IDS`) seguito dall'import dei dati di prova.

## Assessment sul server, passo 3: come il frontend salva · 2026-10-15
- Opzioni: (a) riscrivere le 34 scritture delle schermate in azioni
  (`updateEmployee`, `archiveEmployee`…); (b) lasciare le schermate come sono
  e far confrontare al contesto lo stato prima e dopo, mandando al server le
  sole parti cambiate.
- Cosa cambia: (a) tocca 19 file e ogni schermata; (b) tocca solo il contesto
  (`AssessmentContext`, `server-sync.ts`) e il comportamento delle schermate
  resta identico.
- Raccomandazione: (b), già indicata in PROGETTO §8.7.
- Presa: **(b)**. Le modifiche si salvano una alla volta, in ordine (periodi →
  dipendenti → mansioni → assegnazioni → documenti, poi le cancellazioni).
  Se un salvataggio fallisce non si riprova in silenzio: un messaggio dice che
  la modifica non è salvata e lo stato torna quello del server. TanStack Query
  (decisione 5 del 2026-10-14) carica lo stato e lo ricarica.

## RAL e import: chi è amministratore · 2026-10-15
- La RAL si nasconde a chi non è `COMPANY_ADMIN` o `PLATFORM_ADMIN` in
  **entrambe** le modalità di salvataggio, non solo sul server: la decisione 3
  è sui ruoli, non su dove sta il dato. Con il login legacy (nessun ruolo)
  resta visibile come prima.
- "Importa dati del browser" lo vede solo un amministratore, perché solo lui
  può chiamare l'import sul server. Compare nella barra laterale quando questo
  browser ha dati di Assessment; non cancella niente dal browser.

## Società attiva di Assessment per lo staff · 2026-10-15
- Chi lavora in una società vede la sua. `PLATFORM_ADMIN` non ha società:
  sceglie fra quelle con Assessment attivo dal selettore in testa alla barra
  laterale (`CompanySwitcher`, già esistente). La scelta resta in questo
  browser (`sv_assessment_company`): è una preferenza, non un dato.

## Motivo delle assenze: le categorie · 2026-10-15
- Ferie, Permesso, Formazione, Congedo, Altro, come il server. Un motivo
  scritto a mano nei dati di prima si mostra come la sua categoria, con la
  stessa regola del server; al primo salvataggio diventa la categoria.

## Valutatore esterno sul server: cosa vede e chi calcola il punteggio · 2026-10-15
- Il link pubblico mostra solo nome del dipendente, fonte, periodo, nome del
  valutatore e i voti già dati da quella fonte, come il modulo di prima. Non
  i voti delle altre fonti né l'anagrafica.
- Il punteggio APEX dello storico lo calcola il server (`assessment/apex.ts`):
  per calcolarlo nel browser servirebbero i voti delle altre fonti, che il
  valutatore non deve vedere. Stessa formula di `computeHardSummary`;
  verificato che danno lo stesso numero. Le due vanno cambiate insieme.
- Il token resta in chiaro, come già deciso nello schema (l'HR ricopia il link
  quando vuole). Vale per un'assegnazione e si chiude con l'invio.

## Due persone sullo stesso dipendente · 2026-10-15
- Opzioni: (a) l'ultimo che salva vince; (b) una versione per dipendente e un
  409 a chi salva su una copia vecchia; (c) (a) più la rilettura del server
  quando si torna sulla scheda.
- Cosa cambia: (b) è la soluzione completa ma tocca API, schema e ogni
  schermata che salva un dipendente (va gestito il conflitto). (c) costa
  poche righe e copre il caso frequente: l'HR con la pagina aperta mentre un
  valutatore esterno invia.
- Raccomandazione: (c) ora; (b) se due HR della stessa società lavorano
  davvero in contemporanea.
- Presa: **(c)**.

## Invio del link al test di Assessment: chi compone l'email · 2026-10-15
- Opzioni: (a) il server compone tutto il testo (lettera predefinita compresa);
  (b) il browser manda il testo con i segnaposto {{NOME}} e {{LINK}}, il server
  sceglie destinatari, link e mittente e riempie i segnaposto.
- Cosa cambia: (a) duplica sul server la lettera predefinita
  (`COLLABORATOR_LETTER_TEMPLATE`) e la sua logica; (b) lascia il testo in un
  posto solo, quello che l'HR vede già nell'anteprima. In (b) l'utente sceglie
  il testo, ma solo verso i dipendenti attivi della sua società e con il link
  salvato nelle impostazioni: è lo stesso potere che ha già modificando le
  impostazioni.
- Raccomandazione e presa: **(b)**.

## `TestInvitation.senderConfigId` facoltativo · 2026-10-15
- Assessment non ha una `SenderConfig` di Recruiting: il mittente è il
  referente o l'amministratore delle sue impostazioni. Crearne una apposta la
  farebbe comparire nella configurazione email di Recruiting.
- Presa: la colonna diventa facoltativa (migrazione additiva). Il vincolo resta
  `Restrict`, come prima, perché il valore predefinito di Prisma per un campo
  facoltativo (`SET NULL`) avrebbe cambiato il comportamento di Recruiting.

## 5P: nomi dell'Excel che non sono in anagrafica · 2026-10-15
- Domanda aperta della Parte 4 (le persone del 5P sono i dipendenti,
  decisione 2 del 2026-10-14): una persona del file Excel che non c'è
  nell'elenco dei dipendenti si aggiunge o si salta?
- Presa (Roberto, 2026-10-15): **si aggiunge** all'elenco dei dipendenti.

## 5P sul server: come si salva e come si collega l'anagrafica · 2026-10-15
- Salvataggio: documento intero con versione (già nello schema), 600 ms dopo
  l'ultima modifica perché i campi salvano a ogni tasto. In caso di conflitto
  vince chi ha salvato prima: l'altro vede la sua versione e un messaggio.
  Più semplice di un salvataggio per parti, e il 5P lo usa di solito una
  persona alla volta.
- Collegamento: ogni persona ha `empId`. Si cerca per email, poi per nome
  (cognome e nome in qualunque ordine, senza accenti), prima fra i dipendenti
  in organico e poi fra gli archiviati, così un nome che torna non crea un
  doppione. Chi manca si aggiunge con area = gruppo e mansione = mansione del
  piano. Vale anche con i dati nel browser: la decisione è sulle persone, non
  su dove stanno i dati.

## Schede dei valutatori restituite come file · 2026-10-19
- Opzioni: (a) il caricamento del file si aggiunge alla compilazione
  online; (b) lo sostituisce.
- Cosa cambia: con (b) si perdono il confronto fra valutatori e la sintesi
  IA, che non leggono un Word o una scansione.
- Raccomandazione: (a). Presa: **(a)**, confermata da Roberto il 2026-10-19:
  chi preferisce il file lo rimanda al responsabile, che lo carica. Il file
  si salva sul server.

## Punteggi delle schede caricate come file · 2026-10-19
- Opzioni: (a) il file si conserva e si apre e basta; (b) il responsabile
  ricopia anche i punteggi, così la scheda entra nel confronto e nella sintesi.
- Cosa cambia: (b) costa circa 6 ore e un modulo di inserimento in più.
- Raccomandazione e presa: **(a)** per ora, perché la risposta del cliente
  parla solo di salvare il file. Si aggiunge (b) se lo chiede.

## Il passo "Form returned" del quadro · 2026-10-19
- Il documento elenca: inviata → valutatore → compilata → restituita →
  caricata. La restituzione avviene per email, fuori dalla piattaforma, e
  non si può osservare: nel quadro "restituita" e "caricata" sono un solo
  stato, "File caricato · data". Senza scheda né file la riga dice
  "In attesa" se la scheda è stata inviata, "Non inviata" altrimenti.

## Chi compila la scheda caricata · 2026-10-19
- Il caricamento chiede candidato **e** valutatore (fra quelli assegnati
  alla selezione): senza il valutatore il quadro non può dire di chi è la
  scheda. Se il file arriva da qualcuno che non è in elenco, prima lo si
  aggiunge con "Aggiungi e assegna".

## Togliere una scheda caricata per errore · 2026-10-19
- Rimozione logica (`deletedAt`): la riga esce dal quadro, il file resta
  nello storage. Nessuna cancellazione definitiva dalla piattaforma.

## La scheda professionale si collega al server al salvataggio · 2026-10-19
- Prima la posizione si collegava al server solo al primo CV caricato: fino
  ad allora "Salva" scriveva solo nel browser, "Approvata" era spenta e il
  link dell'annuncio non compariva (punti 5, 6, 7 del documento).
- Opzioni: (a) collegare al salvataggio, creando la campagna se manca;
  (b) lasciare com'è e spiegarlo a schermo.
- Raccomandazione e presa: **(a)**. È la stessa azione che fa già il primo
  CV (`resolveBackendLink`, una campagna con il nome della posizione), solo
  anticipata. Se l'azienda non esiste sul server, si salva nel browser e lo
  si dice.

## «Conferma» al posto della casella "Approvata" · 2026-10-19
- Stessa azione di prima (approva la scheda e genera il link). Diventa un
  bottone accanto a «Modifica», dove il cliente lo cercava; la parola segue
  il documento.

## Scheda 5P compilata dal responsabile · 2026-10-19
- La scheda si apre in un iframe isolato (`sandbox` senza
  `allow-same-origin`, come l'anteprima di prima): sicuro, ma senza memoria.
  Le risposte si perdono se si chiude prima di inviare, quindi il Dialog
  chiede conferma. Dare memoria all'iframe vorrebbe dire togliere
  l'isolamento: non vale il rischio per una compilazione che si fa in una
  volta.

## "Intervistato" automatico · 2026-10-19
- Opzioni: (a) automatico, quando arriva almeno una scheda intervista
  (online o file); (b) una casella che il responsabile spunta.
- Raccomandazione e presa: **(a)** — proposta il 2026-10-19, nessuna
  obiezione. Non si dimentica e non può contraddire le schede.

## Sintesi IA sui file caricati · 2026-10-19
- PDF e immagini al modello così come sono (anche schede scritte a mano);
  .docx come testo estratto in casa, senza dipendenze nuove; .doc no.
- **Minimizzazione:** dalle schede online il server toglie i nomi; dai file
  non si può. Il prompt chiede di non riportare nomi e di indicare
  "Valutatore N", e la schermata lo dice. Da sapere per il trattamento dei
  dati del candidato.
- Si resta su `fetch` diretto in `lib/ai.ts` invece dell'SDK Anthropic:
  è il codice che c'era, il cambio esce dal compito.


## Niente nel browser, in modo rigoroso · 2026-10-21
- Richiesta di Roberto: tutto sul server, nessun `localStorage`,
  `sessionStorage` o IndexedDB, nemmeno per le preferenze. Piano in
  `PROGETTO-TUTTO-SUL-SERVER.md` (10 parti, 38–50 ore).
- Superata la decisione del 2026-10-15 "RAL e import" sul punto delle due
  modalità: la modalità `local` di Assessment e `VITE_ASSESSMENT_STORAGE`
  spariscono (non c'è più un ritorno al browser).
- Superato "Società attiva di Assessment per lo staff" (2026-10-15): la scelta
  va nelle preferenze dell'utente sul server, non nel browser.
- Eccezione unica: il cookie httpOnly della sessione. Opzioni: (a) tenerlo;
  (b) toglierlo, e chiedere la password a ogni ricaricamento della pagina.
  Lo imposta il server, il codice non lo legge e non contiene dati.
  Raccomandazione e presa: **(a)**.
- Stato d'interfaccia da ricordare fra un ricaricamento e l'altro (la scheda
  aperta) va nell'indirizzo (`?tab=`): non è un archivio del browser.
- Aperta, da decidere con Roberto: la scheda 5P del valutatore (file HTML che
  salva nel browser del valutatore) diventa un link online?

## Recruiting sul server: documenti per area, non tabelle nuove · 2026-10-21
- Opzioni: (a) riscrivere le 17.000 righe di Recruiting perché leggano dalle
  tabelle (Campaign, Candidate, Shortlist…) in modo asincrono; (b) portare sul
  server, un documento per area con versione, gli stessi dati che stavano nel
  browser, e tenerne in pagina solo una copia in memoria con la stessa
  interfaccia.
- Cosa cambia: (a) 30–40 ore e un rischio alto di cambiare il comportamento
  delle schermate; (b) le schermate non cambiano, niente resta nel browser,
  i colleghi vedono gli stessi dati in tempo reale. Le tabelle che Recruiting
  già usa (CV, shortlist, invio test, valutatori) restano come sono.
- Raccomandazione e presa: **(b)**. Portare un'area alla volta nelle tabelle
  vere resta possibile dopo, schermata per schermata.
- Conflitti: un salvataggio su una versione vecchia riceve 409; vince chi ha
  salvato prima, l'altro vede la sua versione e un avviso (come il 5P).
- Tempo reale: versioni ogni 10 s e al ritorno sulla scheda; la pagina si
  ridisegna, ma non con una finestra di dialogo aperta.
- Società e posizione attive: erano nel documento, che ora è comune; sono una
  scelta di chi lavora, quindi vanno nelle preferenze dell'utente. Cambiare
  posizione non cambia i dati dei colleghi.

## Panoramica come pagina d'ingresso dei due moduli: le rotte · 2026-10-23
- Contesto: CLAUDE.md, Fase 6 ("Panoramica"). Prima `/recruiting` portava a
  "Profilo della ricerca" e `/recruiting/home` non esisteva; `/assessment` e
  `/assessment/home` aprivano la Home a folder card.
- Opzioni: (a) `/recruiting` e `/recruiting/home` rendono la Panoramica,
  come già fa Assessment con `/assessment` e `/assessment/home`; (b)
  `/recruiting/home` rimanda con `Navigate` a `/recruiting`.
- Cosa cambia: con (a) i due moduli si comportano allo stesso modo e i
  vecchi segnalibri a `/home` funzionano senza salto di indirizzo; con (b)
  un indirizzo solo, ma diverso da Assessment.
- Raccomandazione e presa: **(a)**. Voce "Panoramica" in testa alla barra
  laterale di Recruiting (`end`: accesa solo su `/recruiting` e
  `/recruiting/home`, non su ogni pagina del modulo); in Assessment la voce
  "Home" diventa "Panoramica" (stesso `id: 'home'`). "Profilo della ricerca"
  resta a `/recruiting/profile`, "Stato dell'arte" a
  `/recruiting/stato-dell-arte`: nessuna pagina tolta.

## Panoramica di Assessment: contenuti e funzioni della vecchia Home · 2026-10-23
- "In programma" non c'è: Assessment non ha date future (Piani di sviluppo
  non ha scadenze). Si aggiungerà quando un dato con data esisterà.
- Data dell'intestazione: Assessment non ha una data di ultima modifica sul
  server. Si usa la più recente fra inserimento delle persone, storico delle
  valutazioni e schede esterne (`lastDataUpdate`). Se il server un giorno
  darà la data vera, si sostituisce lì.
- Punteggio complessivo: si mostra su 10 ("6,0 /10", con benchmark e
  scarto) perché i dati di Assessment sono già su 1–10. Il "in attesa" del
  capitolo 7 riguarda i punteggi standardizzati di Original Skills (circa
  −3…+1), che oggi non entrano in Assessment: "In attesa" compare solo
  finché nessuno è valutato. Quando quei punteggi entreranno, serve la
  formula del cliente.
- Funzioni della vecchia Home che restano, spostate: le note delle quattro
  azioni di sviluppo (righe di "Da fare adesso", stessa chiave
  `settings.actionNotes`), "Esporta piano d'azione" e "Esporta report"
  (azioni delle sezioni; il report scrive il punteggio su 10, non più in %).
- Tolte, con una pagina che le copre: la mappa dei valori (`ValueMap`: la
  matrice soft × hard è in Valori Complessivi), le tre StatCard di "Le
  perdite invisibili" (area, mansione, competenza più critiche: grafico
  "Sotto il benchmark" e pagine Competenze), i pulsanti "Confronta aree" /
  "Vedi analisi". Tolto senza sostituto: l'andamento dell'organizzazione
  della Home, che era una serie inventata (passeggiata casuale fissa verso
  il valore di oggi, dichiarata nel codice): non ci sono dati storici veri.
  L'andamento di Valori Complessivi resta com'era.
- Tolti i file non più usati: `AssessmentHomePage`, `ValoreCard`, `ValueMap`,
  `DecisionRow`, `lib/home-card-layout.ts`, `hooks/use-persisted-flag.ts`,
  `CardIcons`, `CompositeIcon`, `LanguageSwitch`.

## Una classificazione sola: le cinque fasce, anche nei nomi · 2026-10-23
- Verificato nel codice: i tre livelli della Home (Ottimale / Moderato /
  Critico) erano un raggruppamento delle cinque fasce (Ottimale = Alto
  Valore + Alto Potenziale, Moderato = Nella Norma, Critico = Da Potenziare
  + Critici, in `homeStats`). Non misuravano altro: spariscono con la Home.
- Le cinque fasce avevano due serie di nomi: "Top Talent / Talento da
  Valorizzare / Persona Adeguata / Persona da Sviluppare / Persona Critica"
  (TIER_DEFS: tabelle, badge, matrice, scheda della persona, assistente) e
  "Alto Valore / Alto Potenziale / Nella Norma / Da Potenziare / Critici"
  (quadDefs). Preso: i nomi di quadDefs ovunque (cap. 7: "le cinque fasce
  tengono i nomi che hanno già"), cambiando solo le etichette di TIER_DEFS e
  dei testi dell'assistente; chiavi e soglie invariate, nessun dato toccato.
- Pattern nuovo `BandCard` (nel catalogo): nome e tono, cosa significa con
  la soglia su 10 (dalla stessa `tierFor`), quante persone e che quota, le
  prime tre per punteggio (clic → scheda), "Vedi tutte" → elenco filtrato
  (`/assessment/valore?fascia=…`, `/recruiting/ranking?fascia=…`). In
  Valori Complessivi prende il posto delle "Classi di performance" (solo
  conteggi) e delle cinque colonne con tutti i nomi; in "Candidati per
  fascia di idoneità" del riquadro con tre conteggi.
- Recruiting ha quattro fasce sull'indice AHI (85 / 70 / 60, red flag),
  ognuna con la sua fascia di idoneità: restano quattro, con il nome di
  idoneità davanti ("Da valutare · Gap strutturali").

## Punteggi su 10: dove sì, dove no · 2026-10-23
- Su 10: tutti i punteggi di Assessment a schermo (le pagine lo erano già;
  la vecchia Home li mostrava in percentuale, "60 /100%"), le soglie delle
  fasce, il Gauge (`ScoreGauge` ha `max`, default 10).
- **Non convertiti, da decidere con il cliente:** l'indice AHI di Recruiting
  e i suoi sottopunteggi (0–100, soglie 85/70/60 spiegate nel Metodo), i
  risultati del test (0–100) e i risultati della Valutazione 5P ("su 100,
  voto × 10", dal modello del cliente). Sono metodi su 100: passarli a 10
  cambia quello che il Metodo e il modello 5P dicono. Proposta: mostrarli
  su 10 con un decimale (85 → "8,5 /10") e riscrivere le soglie nel Metodo,
  se Roberto e Alessio sono d'accordo.

## Bklit e card dei grafici come sono fatti · 2026-10-23
- Gauge: arco intero (135°–405°, default), `centerValue` + `defaultLabel` +
  `suffix` " /10", traccia di default, nessun contenitore che lo ritagli.
  Due scostamenti dai default, motivati: tacche piene in `chart-mono` (una
  serie sola, regole di colore della Fase 5) e misura fissa 240 × 183 (il
  default chiede 300px minimi e in una colonna stretta scorre).
- Andamento (`TrendChart`): l'Area di Bklit disegna sempre un
  `area-gradient`; `kind: 'area'` si disegna ora come linea, senza
  riempimento. Griglia con `fadeHorizontal={false}` in `TrendChart` e
  `CategoryBars` (niente `grid-rows-fade`).
- Card dei grafici e StatCard: tolta la prop `elevated` (bordo lime 2px e
  ombra `shadow-[0_8px_16px_0_var(--border-strong)]`). Perché l'audit "non
  l'aveva segnalata": la segnalava (11 voci), ma era coperta dall'eccezione
  alla regola 3 voluta in Fase 3 per la Home a folder card; l'eccezione è
  superata dalla Fase 6 del 2026-10-23 e non vale più. `frontend/src` ora 0.
- `Card` (primitiva) non ha più `hover:border-primary`: una card che non si
  clicca non reagisce. Lo tengono `NavCard`, `StatCard` con `onClick` e la
  card del Cambio ruolo, che si cliccano.

## Card a cartella, "oggi / Skill Vision", lingua · 2026-10-23
- `FolderCard`: superficie `card`, bordo 1px, testo a sinistra, icona Lucide
  20px accanto al titolo e solo se serve; tolti bordo lime 2px, ombra,
  tinte (`tint`, `color-mix` dei `chart-*`) e lato dell'icona.
- `SkillVisionCard`: il selettore "oggi / Skill Vision" diventa un bottone
  "Mostra il dettaglio / Nascondi il dettaglio" con `aria-expanded`. Le card
  di "Profilo della ricerca" e di "Stato dell'arte" continuano ad aprire il
  loro dettaglio; nessuna funzione tolta.
- Icone composte (casa con euro, lampadina con gemma…) tolte; le card di
  "Profilo della ricerca" restano senza icona.
- Switch IT/EN: era tornato nella barra superiore e nelle Impostazioni.
  Tolto da tutti e due; `useSharedLang` restituisce sempre `it` (la vecchia
  preferenza `lang` sul server non si legge più). Dizionari inglesi intatti.
- Scelta del modulo: cerchi delle lettere neutri (erano `chart-1` /
  `chart-2`), niente ombra, nome del modulo non più in maiuscolo.
- Testo al centro tolto ovunque nei due moduli, tabelle comprese: le colonne
  numeriche restano in mono con cifre tabulari. `ChoiceCard`
  `align="center"` diventa `align="stacked"` (icona sopra il testo).

## Punteggi di Recruiting e del 5P su 10 · 2026-10-23
- Supera la voce "Punteggi su 10: dove sì, dove no" di oggi: la conversione
  di Recruiting e del 5P è approvata (richiesta del 2026-10-23).
- Opzioni: (a) convertire i dati e le soglie nel codice e sul server; (b)
  lasciare dati, calcoli e soglie su 100 e convertire solo a schermo e nei
  file per chi legge.
- Cosa cambia: (a) tocca il salvataggio dei dati, i risultati che arrivano
  da Original Skills e le soglie del backend (`DEFAULT_MATCH_THRESHOLD` per
  l'invio automatico del link); (b) nessun dato cambia, il prodotto fa le
  stesse cose, cambia solo la lettura.
- Raccomandazione e presa: **(b)**. Un formatter solo per Recruiting
  (`fmtScore10`, `lib/format.ts`): AHI, FC, AB, ICV, CI, risultato del test,
  corrispondenza CV in classifica, CV, preselezionati, migliori candidati,
  fasce, assistente, report e classifica in CSV. Il 5P: `fmt10` e
  `fmtSigned` (model.ts), `fmtScore` / `fmtSigned` del cruscotto, assi e
  radar a 10, Excel dei risultati e del report su 10.
- Il decimale si **tronca**, non si arrotonda: 84,9 → 8,4. Con
  l'arrotondamento un 84,9 si leggerebbe 8,5 pur stando nella fascia "sotto
  8,5". Il 5P invece parte dal valore già arrotondato all'intero su 100 (la
  regola del 2026-10-09), quindi il numero letto è esattamente quello su cui
  si calcolano livelli, gap e percezione.
- Dove si scrive un punteggio, si scrive su 10 e si salva come prima: il
  risultato del test (7,5 → 75) e i valori attesi del 5P (già salvati 1–10).
  Il modello Excel dei valori attesi ora è su 0–10; l'import accetta ancora i
  file su 0–100 (divide per 10 se un valore supera 10, regola già esistente).
- Metodo: formule riscritte sulla scala di 10 (FC "× 10", AB "10 − …",
  ICV "0–10", CI "10 − …"), fasce 8,5–10 / 7,0–8,4 / 6,0–6,9 / sotto 6,0,
  sbarramento a 5,9. Metodo del 5P: esempio, letture di gap e differenza e
  livelli su 10 (3,0 / 5,0 / 7,0 / 9,0).
- **Non convertiti, di proposito:** le schede dei valutatori (scala 1–5, è
  la scala del modulo), i punti APEX delle competenze (/31), i percentili
  del Big Five (posizioni sul tratto, non voti), le quote in percentuale
  (copertura delle essenziali, avanzamento, completamento), i JSON per l'ATS
  (dati per un altro sistema: restano su 100, come prima).
- Corretto insieme, perché violava la regola 6: il tag "NEW_APPLICANT"
  dell'assistente era testo lime su fondo chiaro; ora neutro con bordo. Tolto
  anche il lime come testo dei punteggi in modalità scura (risultati del
  test, corrispondenza in Migliori candidati): erano numeri, non l'azione
  della pagina.

## Verifica a schermo delle due Panoramiche · 2026-10-23
- Fatta in locale su chiaro, scuro, desktop (1440) e mobile (390 → il browser
  ha riportato 487): nessuno scorrimento orizzontale, e il controllo di
  contrasto dello snippet dell'audit (con i colori `oklch` convertiti in RGB)
  non trova testi sotto soglia, in nessuna delle otto viste.
- Un difetto trovato e corretto: la card "Distribuzione per fascia" teneva
  l'altezza fissa di un grafico per una barra compatta, con un vuoto e il
  link a metà card. `ChartCard` ha ora `height="auto"` e il piede sempre in
  fondo (`mt-auto`), così i link delle due card di "Dove guardare" sono
  allineati.
- Per vedere Assessment con dati, nel database **locale**: alla società Acme
  è stato aggiunto il modulo ASSESSMENT (`purchasedModules`), perché il codice
  del seed era già stato usato in una sessione precedente. I 26 dipendenti di
  prova c'erano già. Niente in produzione.
- Da sapere: lo sblocco con un codice già usato risponde in inglese ("This
  access code has already been redeemed"), testo del backend. Da tradurre.
- Il browser di prova era usato in contemporanea da un'altra sessione (cambi
  di pagina e di dimensione non miei): ogni vista è stata catturata subito
  dopo l'apertura e ricontrollata.

## Posizione attiva unica: dove sta e chi la cambia · 2026-10-23
- Contesto: CLAUDE.md, Fase 6 ("La posizione attiva è una sola in tutta
  l'applicazione"). Le pagine dell'avanzamento (CV preselezionati, Classifica
  dopo il test, Colloqui, Podio, Avanzamento) tenevano la loro scelta
  nell'indirizzo (`?companyId&openingId`), separata da `activeContext`: era
  la regola del vecchio Recruiting, ora un difetto.
- Opzioni: (a) l'indirizzo resta la fonte e le altre pagine lo leggono; (b)
  `activeContext` (preferenza dell'utente sul server) è la sola fonte, letta
  da tutte le pagine attraverso un contesto del layout
  (`lib/active-position.tsx`), e l'indirizzo vecchio diventa la posizione
  attiva all'apertura.
- Raccomandazione e presa: **(b)**. I segnalibri vecchi funzionano. La
  scelta sta nella `ContextBar` (pattern nuovo, nel catalogo) sopra ogni
  pagina; la barra laterale tiene solo la società. Tolti i "Cambia posizione"
  delle singole pagine e il "cambialo dalla pagina CV & Esportazione".

## Un profilo solo per tutta Recruiting: cosa resta da decidere · 2026-10-23
- Trovato nel codice: il Profilo Candidato (scheda, competenze, pesi) e il
  profilo con cui si calcola l'indice AHI sono **uno solo**, salvato sotto
  "Sales Account Manager" (`DEFAULT_ROLE`), non uno per posizione. Per questo
  Risultati e Stato dell'arte dicevano "Sales Account Manager" mentre le
  posizioni aperte sono altre.
- Fatto adesso, senza toccare i dati: Risultati e Candidati per fascia
  mostrano di default i candidati della posizione attiva (bacino CV,
  preselezionati, test, colloqui), con «Archivio CV» per vedere tutto
  l'archivio come prima; ogni pagina dice "profilo di riferimento: Sales
  Account Manager". Il Profilo della ricerca, se il profilo salvato ha un
  nome diverso dalla posizione, lo scrive.
- **Non fatto, da decidere col cliente** (tocca il salvataggio dei dati,
  CLAUDE.md §5): un Profilo Candidato e un profilo di calcolo per ogni
  posizione. Serve sapere se i profili esistenti vanno copiati su ogni
  posizione aperta, e se la classifica di una posizione si calcola sul suo
  profilo. Stima a parte.

## Menu di Recruiting: due scostamenti dalla lista ricevuta · 2026-10-23
- La richiesta del 2026-10-23 portava una lista diversa dalla tabella di
  CLAUDE.md (per esempio "Profilo della ricerca" nel livello 1, "Risultati" e
  "Imbuto" nel livello 2, "Colloqui" e "Podio" nel livello 3, senza Profilo
  candidato, CV elaborati, CV preselezionati, Candidati per fascia, Confronto
  interno). Presa la tabella di CLAUDE.md, che è la proposta di Roberto
  "corretta dopo aver aperto le pagine" e non lascia pagine senza voce (cap. 1:
  nessuna funzione sparisce).
- L'Imbuto di selezione "esce dai livelli" (CLAUDE.md) ma la tabella non lo
  mette da nessuna parte: preso il blocco in testa, sotto Profilo della
  ricerca, perché vale per tutto il percorso e resta raggiungibile.
- Area valutatori: sezione senza numero; chi ha il ruolo EVALUATOR vede solo
  quella. Amministrazione solo per i ruoli che la gestiscono, come prima.

## Imbuto: le fasi e le quote · 2026-10-23
- Fasi (`lib/position-funnel.ts`): CV caricati → Preselezionati → Invitati al
  test → Test completati → Idonei → In colloquio → Scelti. Chi è in una fase
  è anche nelle precedenti, tranne "Idonei", che è un giudizio: si può fare il
  colloquio a un "Da valutare", quindi la quota di "In colloquio" si calcola
  sui test completati. Idoneo = fascia "Assumibile subito" dell'AHI (da 8,5 su
  10); senza la scheda del candidato, il risultato del test inserito a mano.
- La percentuale del Funnel di Bklit è sempre sulla prima fase: spenta;
  accanto al numero la quota sulla precedente, la quota sul totale in tabella.
- "Avanzamento della selezione" esce dal menu: i numeri per posizione sono
  nell'Imbuto con "Tutte le posizioni aperte", e ogni riga porta alla pagina
  di Avanzamento della posizione (che resta, con le sue azioni).
- "Stato dell'arte" esce dal menu e la rotta rimanda alla Panoramica; il suo
  "Report completo" diventa "Esporta riepilogo" nella Panoramica.

## Panoramica di Assessment: andamento e card con il grafico · 2026-10-23
- "Andamento punteggio organizzativo" è una sezione in più rispetto allo
  schema della Fase 6, chiesta il 2026-10-23. Si calcola dallo storico vero
  (`softHistory` / `hardHistory`, media per mese): niente serie inventate.
  Con meno di due mesi c'è lo stato vuoto (oggi nei dati di prova lo storico è
  vuoto). Solo i mesi con un valore per ogni linea attiva: un buco a zero
  sarebbe un dato falso.
- Stato attuale: il punteggio lo porta il Gauge al centro (il numero non si
  ripete nella card, `StatCard` senza `value`); copertura, valutati e critici
  con un anello senza numero al centro e il numero nella card. Gauge `sm`
  (192 px) per stare in quattro colonne.
- Le cinque fasce stanno ora nella Panoramica con le prime tre persone;
  "Dove guardare" ha le due card sotto il benchmark (aree, mansioni).
- Da sapere: l'andamento di Valori Complessivi usa ancora la serie fissa di
  esempio del vecchio modulo (`ANDAMENTO_SOFT/HARD`); da portare sullo storico
  vero come qui.

## Tabelle a sinistra · 2026-10-23
- Tutto il testo delle tabelle è a sinistra, numeri compresi: `DataTable`
  ignora `align: 'end'` (prop tenuta, per non toccare chi la passa),
  `ChartDataTable` e le celle scritte a mano passano a sinistra. Le colonne
  numeriche si allineano con le cifre tabulari.

## Profilo per posizione e menu: confermati · 2026-10-23
- **Profilo:** resta un solo Profilo Candidato e un solo profilo di calcolo
  per tutta Recruiting ("Sales Account Manager", `DEFAULT_ROLE`), ereditato da
  ogni posizione aperta. Nessun profilo per posizione, nessun dato toccato. Le
  pagine continuano a dire "profilo di riferimento: Sales Account Manager".
  Chiude la domanda di "Un profilo solo per tutta Recruiting".
- **Menu:** resta quello della tabella di CLAUDE.md, con l'Imbuto nel blocco
  in testa (voce "Menu di Recruiting: due scostamenti dalla lista ricevuta").
- **CLAUDE.md §9:** la regola "Niente dati nel browser" resta nel file.

## Selettore CT / CP / Completo: dove sta su ogni pagina · 2026-11-04
- Opzioni: (a) nelle azioni dell'intestazione di ogni pagina, a destra del
  titolo; (b) una riga fissa sopra tutte le pagine, nel layout; (c) nella barra
  superiore.
- Cosa cambia: (a) è la posizione che aveva prima del rilascio, ma le pagine con
  intestazione propria (Home, risultati, Panoramica) lo montano da sé; (b) e (c)
  sono un punto solo nel codice ma una posizione nuova, che Roberto non ha chiesto.
- Raccomandazione e presa: **(a)**. Un solo componente collegato,
  `AssessmentModeSwitch`, così le pagine non ripetono la logica.
- La scelta resta nelle impostazioni della società, com'era: vale per tutti gli
  utenti di quella società, non per il singolo. Se Roberto la vuole per utente,
  è una modifica a parte.

## Pacchetto di Assessment acquistato · 2026-11-04
- Il dato non esisteva: `purchasedModules` distingue Recruiting e Assessment, non
  CT e CP. `settings.modulo` è la vista scelta, non quello che si è comprato.
- Opzioni: (a) colonna nuova su `Company`; (b) nuovi valori di `PlatformModule`,
  con i codici di attivazione; (c) solo nel frontend, da configurazione.
- Cosa cambia: (b) cambia il controllo di accesso di tutto il modulo e i codici già
  emessi; (c) il server accetterebbe qualunque vista.
- Raccomandazione e presa: **(a)**, `assessmentPackage` (riusa `AssessmentModulo`:
  A = CT, B = CP, AB = Completo), default Completo. Migrazione solo additiva.
- Lo imposta lo staff in Impostazioni → Pacchetti. I codici di attivazione non
  portano il pacchetto: se dovranno farlo, è da decidere con Roberto.
- **Da confermare con Roberto:** il pacchetto limita il selettore, come chiesto. Le
  pagine dell'altra area restano raggiungibili dal menu, attenuate come oggi: non
  è un blocco di accesso.

## ErrorBoundary senza `key`, cache allineata dopo i salvataggi · 2026-11-04
- Difetto: `key={pathname}` in cima all'app rimontava tutto a ogni pagina, in tutti
  e due i moduli. Assessment ripartiva da una cache mai aggiornata dopo i
  salvataggi: ogni modifica sembrava persa fino al ricaricamento.
- Opzioni: (a) solo aggiornare la cache; (b) solo togliere il rimontaggio;
  (c) tutte e due.
- Cosa cambia: con (a) chi legge soltanto perde la scelta a ogni pagina; con (b)
  il difetto resta passando da Recruiting e tornando, perché i due layout si
  rimontano comunque.
- Raccomandazione e presa: **(c)**. Tocca il comportamento dei due moduli: i layout
  ora restano montati, come AppShell già presumeva, e le pagine si rimontano
  comunque per la `key` di `PageTransition`. Si vede anche la transizione d'uscita
  delle pagine, che prima il rimontaggio saltava. Il salvataggio sul server non
  cambia.

## Home nel menu di Assessment: link e freccia · 2026-11-04
- Gli altri gruppi si aprono cliccando il titolo, ma il titolo di Home deve aprire
  la home (CLAUDE.md, 2026-11-02). Opzioni: (a) gruppo sempre aperto; (b) titolo
  link più una freccia a parte.
- Cosa cambia: (a) non si chiude mai, e il menu è già lungo; (b) è un controllo in
  più, che shadcn prevede come `SidebarMenuAction`.
- Raccomandazione e presa: **(b)**, aperto all'avvio. Con una pagina dei risultati
  aperta la freccia non c'è: il gruppo resta aperto, come gli altri.

## Storico nei dati di prova di Assessment · 2026-11-04
- Il riquadro 01 della Sintesi chiede un andamento mag–ott, ma `generateDemoData` non
  produceva storico. CLAUDE.md vieta le serie inventate per riempire un riquadro.
- Opzioni: (a) generare lo storico solo nei dati di prova, che si dichiarano tali;
  (b) nessun grafico finché non ci sono valutazioni vere.
- Raccomandazione e presa: **(a)**. Con i dati veri il grafico compare solo con almeno
  due mesi di storico vero. I mesi sono i sei passati rispetto al caricamento, non
  «maggio–ottobre» scritto nel codice. Generato senza numeri casuali, così la
  popolazione di prova non cambia.

## Dati dimostrativi di Recruiting: come si caricano · 2026-11-04
- Opzioni: (a) voce nel menu, come «Ripristina demo»; (b) seed sul server; (c)
  caricamento automatico in modalità demo.
- Cosa cambia: (b) è vietato da CLAUDE.md; (c) scriverebbe su Railway senza che
  nessuno lo chieda, perché lì `VITE_DEMO_MODE` è attiva.
- Raccomandazione e presa: **(a)**, con conferma. Aggiunge una posizione e i suoi
  candidati, e ricaricando sostituisce solo quelli (id `demo-`): a differenza del
  reset di Assessment non cancella niente, quindi non serve un'apertura sul server.
- **Il limite:** il controllo è nel frontend (`isDemoMode`, società `company-acme`).
  Anche una società nuova parte dai dati di esempio con Acme: finché
  `VITE_DEMO_MODE` è attiva la voce compare anche a lei. Non è un problema oggi (non
  ci sono clienti), e la variabile va tolta prima del primo cliente (Fase 8).

## Pagina dei risultati «Chi scegliamo»: il vincitore fra i finalisti · 2026-11-04
- Per avere il quinto stato la posizione dimostrativa ha un vincitore (Assunto). Il
  codice conta chi è scelto anche fra i finalisti: 3 finalisti con un vincitore.
  Non cambiato: è il calcolo esistente. Se Roberto vuole fuori chi è già scelto, è una
  modifica a parte.

## Motore ROI: una copia con un test, non un modulo condiviso · 2026-11-04
- CLAUDE.md chiede «un solo modulo di calcolo, usato da tutti e due». Il motore è in un
  altro repository, pubblicato su GitHub Pages, con modifiche in corso non nostre.
- Opzioni: (a) pacchetto condiviso, che obbliga a cambiare il build del motore; (b)
  copia letterale con un test sugli stessi valori di riferimento.
- Raccomandazione e presa: **(b)**, per non toccare l'altro repository. Il limite: una
  formula corretta va corretta in due posti, e il test scatta solo sui casi che copre.
  Il pacchetto condiviso resta il passo giusto: **da decidere con Alessio**.

## Dalla dashboard al motore: le scale · 2026-11-04
- Il motore lavora in punti su 100, la dashboard su 10. Valore competenze = punteggio
  medio × 10; divario = (atteso − punteggio medio) × 10, mai sotto zero. Copertura dei
  ruoli dalla Panoramica. Il resto sono i predefiniti del motore: base HCVA, convenzione
  gestionale, costo di sostituzione 50%, assenze aggredibili 60%, leva 4 spenta.
- **Da confermare con Roberto:** è la scelta da cui dipendono di più gli importi. Con
  punteggio 6,0 e atteso 7,0 il divario vale 10 punti, cioè il 10% dell'HCVA.

## Quale cifra del motore su quale pagina · 2026-11-04
- CLAUDE.md dice solo che l'obiettivo è Dove intervenire, scenario base, e che gli altri
  tre sono ordini di grandezza. La corrispondenza è una proposta:
  Il valore = potenziale del divario (gapVal) · Le perdite invisibili = somma dei
  potenziali lordi (pool) · Il potenziale = produttività attesa (l1) · Dove intervenire
  = beneficio atteso (benefit), con prudenziale ed espansivo.
- **Da confermare con Roberto.** Il valore resta scheletro: la cifra non usa la regola
  fra RAL e punteggio, che è ancora in attesa di lui.

## «Compenso» e durata dell'esercizio · 2026-11-04
- «Compenso» di CLAUDE.md è il corrispettivo dell'assessment del motore: senza, il motore
  si ferma, e la dashboard pure, con lo stesso messaggio.
- Il motore non conosce la durata dell'esercizio. Si scrive a mano, 12 mesi di partenza,
  o arriva dal file (chiave «Durata esercizio»). Si riportano all'anno le voci che
  scorrono nell'anno, non gli indici.

## Atteso fissato: fino a quando · 2026-11-04
- Le date del Patto non sono nel sistema, quindi il blocco non ha una scadenza. Lo toglie
  solo lo staff, con una rotta senza interfaccia che resta nel registro. Si fissa al
  primo salvataggio dei dati con persone già valutate. **Da chiarire con Roberto.**

## Indice a 100: in Home no · 2026-11-04
- La richiesta chiede l'indice «su Results e Home» e anche «nessun numero in Home».
  CLAUDE.md (2026-11-03) è esplicito: nessun dato in home. Presa: solo nelle pagine dei
  risultati. Soft e professionali pesano metà ciascuno, come il punteggio complessivo.
- Un ruolo senza competenze scelte usa tutte le 35, e il confronto lo mostra nei numeri.

## Barre dei confronti in HTML, heatmap fuori scala · 2026-11-04
- Classifica e barre per area vogliono una barra per persona, col suo colore e il suo
  nome: Bklit colora per serie e non per riga. Barre semplici sui token, con il valore
  scritto. Radar e Sankey restano Bklit.
- La heatmap mescola il colore della persona con la superficie: non è la scala
  sequenziale che manca al sistema, vale solo qui ed è decisa dalla tavola. Il dato si
  legge dal numero. Supera «nessuna heatmap nel prodotto» della Fase 5.

## Sankey di Bklit: dipendenza nuova · 2026-11-04
- `d3-sankey` e i suoi tipi, richiesti da Bklit. File presi dal registro a mano, senza
  `shadcn add`, che avrebbe sovrascritto i grafici già adattati.

## Risposte per Alessio · 2026-11-04
Raccolte dal codice e dai documenti. Dove un dato non è verificabile, lo si dice.

**1 · Consegna di venerdì (2026-11-06).** Nel repository non c'è nessun impegno con questa
data: la conferma è di Bilal. Lo stato tecnico: tutto il lavoro è fatto e passa i
controlli, ma le Fasi 3–4 e questa verifica non sono ancora rilasciate. Non dipendono da noi:
il criterio dei manager; la conferma di Roberto su scale, corrispondenza delle cifre e blocco
dell'atteso; un file vero di Credit Save; i dati di bilancio per vedere gli euro.

**2 · Da dove vengono 5 · 4 · 2 · 0 (Punto 5).** Dal conteggio delle persone per fascia, non da
un dato per persona. `INTERVENTI` in `lib/results.ts`: Da potenziare → Formazione (5), Alto
potenziale → Coaching (4), Critici → Riorganizzazione (2), Alto valore → Talento (0). Il tipo
di intervento per persona **non esiste**. Per persona ci sono solo l'interruttore
`feedbackNeeded` e quattro testi liberi in `developmentPlan` (azioni, formazione, coaching,
obiettivi), vuoti nei dati di prova. Per questo il Sankey ha due soli esiti. Averlo davvero
richiede un campo nuovo e la sua compilazione.

**3 · Sottofattori (Punto 8).** No, per quanto si è potuto vedere. La risposta dell'API osservata
il 2026-10-02 (32 persone) ha `competenze` e `competenze ruolo`, con nome e punteggio, e nessun
campo di sottofattori. I nomi (`BF_SUB`) sono etichette nostre, senza valori. Quindi il blocco nel
profilo non c'è. Da chiedere al fornitore se esistono altrove; la versione a 42 voci è ancora
una domanda aperta (PROPOSTA-ORIGINAL-SKILLS §8).

**4 · Massimo reale delle soft skill (Punto 6).** **Il 10 non è confermato dai dati.**
- Dati veri: l'unica misura è la chiamata di prova del 2026-10-02: da 0,51 a 8,11, 32 persone di
  una sola società, un solo periodo. Non è stata rifatta, ed è un mese vecchia. Il minimo è anche
  sotto 1, quindi non sta nemmeno nella scala dichiarata.
- La scala 1–10 viene dalla conferma del comitato tramite Roberto (2026-11-04), non dai dati.
- Assessment è davvero 1–10: il modulo lo limita e il generatore di prova pure. Il server però
  non controlla l'intervallo (`ottenuto: z.number()`).
- **Recruiting no:** i punteggi dei candidati sono su 31 (nei dati di prova da 0,9 a 32,99, sopra
  il massimo), e «/31» è a schermo nell'Assistente IA e nell'esportazione CSV. Contrasta con «una
  scala sola»; convertirlo tocca gli algoritmi: **da decidere**.

**5 · Testi mancanti e segnaposto.**
- Dati che mancano al cliente:
  - corpo dell'email del questionario: «[Testo standard da inserire — verrà fornito dal cliente]»;
  - «Report dati provvisorio…», finché non c'è il modello grafico definitivo;
  - Il valore: «Contenuto in preparazione», in attesa della regola di Roberto;
  - Recruiting, le tre pagine dei risultati: «€ [—] · In attesa della formula»;
  - Assessment, le quattro pagine: «In attesa dei dati di bilancio», finché non si carica;
  - Sintesi della Panoramica: valore a rischio, intervallo «€ [minimo] e € [massimo]», «[—]%»,
    azioni, quattro voci di perdita, costi evitabili, euro per area e per azione, cascata;
  - Comitato scientifico: etichette provvisorie delle società senza nome associato.
- Diciture in attesa di una decisione:
  - nome del quinto stato: «Selezione conclusa» (Roberto ha scritto anche «Selezione valutatori»);
  - esiti In riserva e Non selezionato: «—», non si registrano ancora;
  - `ma1`: «Prendere decisioni» in Assessment, «Il processo decisionale» in Recruiting; proposta
    «Processo decisionale», non applicata;
  - «Classifica dopo il test» e «Migliori candidati»: nome e contenuto bloccati.
- **Testi scritti da noi senza un testo approvato**, da far rileggere: le
  frasi del confronto (`cmpLeader`, `cmpTied`, `cmpSummary`), le spiegazioni di «Come è calcolato»
  e le note sotto le cifre (`roiHow*`, `roiValoreNote`, `roiMissingNote`), la sezione del bilancio in
  Dati aziendali, le note del grafico a flussi, «Pacchetti» nelle Impostazioni.

## Manager a schermo: la verifica non passa e non si corregge ora · 2026-11-04
- Richiesta: che non compaiano. Il criterio non c'è. Opzioni: (a) filtrare per parole nel ruolo
  («Responsabile», «Capo»…); (b) aspettare il criterio.
- Cosa cambia: (a) toglie persone da classifiche e fasce, cambia percentuali e importi, e sbaglia
  sui nomi dei ruoli; è esattamente quello che CLAUDE.md dice di non inventare.
- Raccomandazione e presa: **(b)**. Tocca il comportamento: si aspetta Roberto.

## Uscita delle pagine · 2026-11-04
- `AnimatePresence mode="wait"` in `ViewTransition` è attivo davvero solo dopo la correzione
  di `ErrorBoundary` della Fase 1: la pagina nuova aspetta l'uscita della vecchia. Misurato sulle
  build di produzione: circa 550ms per pagina con l'uscita, circa 120ms senza.
- Opzioni: (a) tenere l'uscita; (b) toglierla. Con (b) si perde la dissolvenza d'uscita.
- Raccomandazione e presa: **(b)**. Scostamento da `Instructions.md` (la vecchia esce, la nuova
  entra): aprire la pagina conta più dell'animazione. L'entrata resta. Si torna indietro con un
  solo file. Non era un blocco: l'avevo scritto per errore, dal server di sviluppo.

## Pillola del menu: ferma sulla voce · 2026-11-04
- La pillola scorreva da una voce all'altra con `layoutId`, dentro una colonna che scorre:
  passava sopra le altre voci e poteva restare fuori posto. Presa: nessuno scorrimento nel
  menu. Restano le pillole di ToggleGroup, Tabs e commutatore dei moduli, che non stanno in
  una colonna che scorre.

## Stato dell'arte: ripristinata · 2026-11-04
- CLAUDE.md (2026-10-30): resta com'è, con il suo nome, al livello 2; la rotta invece rimandava
  alla Panoramica. Presa: la pagina di `bb565c1^`, senza riprogettarla. Contiene ancora il
  pulsante «Skill-Vision» sulle card e il riquadro «Una sola lettura»; se è un doppione lo
  decide Roberto.

## Tavole: dove vale il testo · 2026-11-04
CLAUDE.md: «Dove una tavola e questo testo non coincidono, vale questo testo». Restano quindi
diversi dalle tavole:
- Home e Perdite con il selettore CT / CP / Completo, che le tavole non hanno (2026-11-03).
- Nel menu, Home con sotto le quattro pagine; le tavole più vecchie non le mostrano (2026-11-02).
- Titoli dei livelli «Chi cerchiamo? · Livello 1», non «· 1». Vanno su due righe.
- Perdite: terza colonna con l'indice a 100 e la cifra in euro, che ora c'è (2026-11-03).
- Approfondimenti di Perdite con i nomi di CLAUDE.md.
- Sintesi, «Dove si perde valore»: barre di Bklit con l'atteso tratteggiato, come chiede la tabella
  di CLAUDE.md; la tavola sembra disegnare punti su una linea, e dice che il disegno è solo un
  riferimento.
- Confronto: «Tutte · 35», non «Tutte le competenze · 35».

## Selettori lime; icone del menu confermate · 2026-11-04
- Le tavole mostrano il selettore attivo lime, già nella regola di CLAUDE.md. Presa: come le tavole.
- Le tavole mostrano anche il menu senza icone: le avevo tolte, Bilal le ha fatte rimettere. Le
  icone del menu **restano**.
- Vale per tutti i ToggleGroup, anche nelle pagine tecniche: è aspetto, non comportamento.

## Formula di Roberto e Il valore · 2026-11-05
Richiesta di Bilal, con la formula di CLAUDE.md (Fase 6, «Euro dal motore ROI»). Le scelte che la
richiesta non scioglieva, tutte da confermare con Roberto:
- **Soft e professionali.** Opzioni: (a) un'unica somma su tutte le competenze; (b) due rapporti,
  poi la media dei due. Con (b) le due parti pesano metà ciascuna, ma è una media di rapporti, che
  la formula esclude. **Presa (a)**: ogni competenza conta uguale, quindi la parte con più
  competenze pesa di più.
- **Competenza non misurata.** Non entra in nessuna delle due somme, come prima: contarla zero
  abbasserebbe il valore per un dato che manca.
- **Valore dell'azienda e gap medio.** Se il valore dell'azienda fosse la media delle persone, gap
  medio e gap di adeguatezza sarebbero sempre lo stesso numero. **Presa**: valore = la stessa
  formula con le somme di tutti; gap medio = media dei gap delle singole persone. Oggi con Acme a
  schermo coincidono comunque (−20% e −20%): due riquadri per un numero solo. **Da decidere** se
  tenerli tutti e due o se «gap medio» vuol dire altro (il motore ROI conosce anche «gap medio
  sotto soglia»).
- **Motore ROI.** `comp` = valore, `gap` = gap medio cambiato di segno, `cov` = copertura. Il motore
  non è stato toccato e blocca valori oltre 100 e `comp + gap` oltre 100, quindi un'eccedenza dà
  gap 0 e `comp` è limitato a `100 − gap`. Il limite non cambia gli euro: `comp` serve solo a quel
  controllo. Prima `gap` era (atteso − punteggio) × 10: **gli importi salgono** (Acme, Completo:
  12% → 19,7%, circa € 352.000 → € 578.249). **Da confermare** prima del rilascio.
- **L'atteso fissato.** L'atteso bloccato sul server non entra più nel gap: ora contano gli attesi
  delle competenze del ruolo. CLAUDE.md vuole un atteso che non cambia per tutto il Patto: se si
  modifica un profilo di ruolo il gap si muove. **Da decidere.**
- **Il valore, cosa si è aggiunto.** La richiesta nomina riquadri e fasce; la pagina ha anche le
  sezioni 2 e 4, quindi i tre riquadri («Mansione con il gap più alto», «Sotto l'atteso», «Oltre
  l'atteso»), la frase, l'opportunità e il suggerimento sono **testi proposti da me**, da far
  approvare. «Copertura mansioni» è il nome già in Panoramica. Nell'impatto resta solo l'euro: ogni
  numero una volta. Il valore non mette in rapporto retribuzione e punteggio, mentre titolo e
  «Perché è importante» parlano ancora di retribuzione.
- **Tooltip.** «100 =» e «109 =» diventano «100% =» e «109% =», come i valori a schermo.
- **Piede.** Testo come richiesto, ma con il bilancio già caricato sta sotto una cifra in euro
  visibile (Acme in locale). Solo Assessment: Recruiting non usa il bilancio e tiene la sua frase.
  «inventat…» resta in «Bilancio dimostrativo (cifre inventate)» (Dati aziendali), fuori dal piede.
- **Fascia e piano di sviluppo.** È il titolo della tabella sotto il grafico, che oggi è solo per
  lettori di schermo (`sr-only`): a schermo non si vede nessuna differenza.
- **Filigrana.** Tolta su richiesta esplicita: supera la decisione del 2026-11-04 e il testo di
  CLAUDE.md sulla tavola «Home · senza dati».

## Motore ROI: tre domande per Roberto · 2026-11-05
Aperte dalla formula del 2026-11-05 (dettagli in «Formula di Roberto e Il valore»). Nel frattempo
il calcolo segue la raccomandazione scritta sotto; gli importi in euro cambiano già (Acme in locale,
Il valore, Completo: circa € 352.000 stimati prima, € 578.249 ora).

1. **«Gap medio» è un dato diverso dal «Gap di adeguatezza»?** Oggi gap medio = media dei gap delle
   singole persone; gap di adeguatezza = valore dell'azienda − 100. Con Acme a schermo coincidono
   (−20% e −20%), quindi due riquadri per un numero. Il motore conosce anche «gap medio sotto
   soglia». Cosa cambia: se conta solo chi sta sotto l'atteso, un'eccedenza non compensa più un
   divario e gli euro salgono. **Raccomandazione**: tenere la media semplice finché Roberto non
   conferma, poi togliere uno dei due riquadri se restano uguali.
2. **Soft e professionali: una somma sola o due parti a pari peso?** Oggi una somma sola: ogni
   competenza conta uguale, quindi la parte con più competenze pesa di più. Due parti a metà ciascuna
   sarebbe però una media di rapporti, che la formula esclude. **Raccomandazione**: somma sola, come
   dice la formula, salvo che «lo stesso peso» voglia dire metà e metà.
3. **L'atteso fissato deve ancora guidare il gap?** Il gap ora nasce dagli attesi delle competenze del
   ruolo: cambiando un profilo di ruolo si muove anche durante il Patto, mentre CLAUDE.md vuole un
   atteso che non cambia. **Raccomandazione**: alla prima misurazione fissare per ogni ruolo gli attesi
   delle competenze, e calcolare su quelli. Serve un dato nuovo sul server: non fatto, si aspetta la
   risposta.

## Il ruolo nel confronto resta nell'indirizzo · 2026-11-05
- **Opzioni**: (a) il ruolo è sempre quello della prima persona; (b) si fissa all'apertura e sta in
  `?ruolo=`. Con (a) cambiando la prima persona cambiano titolo e classifica senza dirlo.
- **Presa (b)**, chiesta da Bilal: il titolo non cambia, e un link al confronto riapre lo stesso
  ruolo. Chi viene da un'altra mansione è «candidatura interna». Il suo valore si misura sulle
  competenze del ruolo di riferimento, quindi può essere molto basso.

## Selettori: lime solo sulla voce accesa · 2026-11-05
Il lime al passaggio del mouse faceva sembrare accese due voci. **Presa**: fondo neutro (`accent`)
sulle altre. Vale per tutti i `ToggleGroup`, non solo per il confronto: la causa è nella primitiva.

## Tooltip dei grafici del confronto · 2026-11-05
- **Radar**: il Radar di Bklit non ha tooltip sui punti. Scostamento dall'uso documentato: aggiunti
  alla nostra copia (`pointTooltip` in `radar-chart.tsx`, un bersaglio di 12px attorno a ogni punto).
  Vale per tutti i radar: dove il punteggio è su 100, il testo dice «su 100».
- **Righe, barre, heatmap**: sono HTML, non Bklit (DECISIONI precedenti): Tooltip di shadcn.
- **Punti coincidenti**: il tooltip elenca tutte le persone con quel valore, perché il punto sopra
  copre gli altri.
- **Tastiera**: questi tooltip si aprono col mouse; i valori sono comunque scritti a schermo e nelle
  tabelle per i lettori di schermo. Rendere focalizzabili 175 caselle costerebbe più di quanto dà.
- **Barre per area**: non erano nell'elenco; aggiunte per CLAUDE.md §9 («ogni barra»).

## Vecchio confronto: solo nei risultati trasversali · 2026-11-05
Tolti scheda e tabella da `AssessmentSoftPage`, quindi anche da Valutazioni Soft Skill, che usa la
stessa pagina. Il confronto resta su /assessment/confronto, con «Confronta persone». **La stessa
scheda c'era in Competenze professionali**: tolta anche quella, vedi «Un confronto solo» sotto.

## Come si riconosce l'account demo · 2026-11-05
Il prodotto non aveva il concetto. **Presa**: `isDemoAccount()` = modalità demo + email in
`VITE_DEMO_ACCOUNTS` (se vuota, demo@skill-vision.it, l'account già previsto da
`create-team-admin.ts`). Filtro d'interfaccia, come `VITE_STAFF_EMAILS`: il server non lo sa. La pagina
ripristina solo dati che l'utente può già scrivere, quindi il rischio è basso; un vero controllo sul
server arriverebbe con un campo sull'account. In locale `.env.local` aggiunge hr@acme.example.

## Dati dimostrativi automatici: quando partono · 2026-11-05
- **Il rischio trovato**: i dati di Recruiting stanno per società, e la prima volta ogni società legge
  lo stesso seed, che contiene `company-acme`. Il controllo su `company-acme` non basta: una società
  reale in un ambiente con `VITE_DEMO_MODE=true` avrebbe ricevuto candidati finti.
- **Presa, chiusa per difetto**: partono solo con modalità demo + utente che può scrivere + account demo
  o società in `VITE_DEMO_COMPANY_IDS` (in una build vuota; in locale la Acme del seed).
- La posizione si crea se manca. Diventa attiva solo la prima volta di ogni utente e solo se la sua è
  vuota: poi la scelta resta sua (preferenza `recruitingDemoSeen`).
- Nessun seed del backend. **Da sapere prima del rilascio**: su Railway `VITE_DEMO_MODE` è acceso,
  quindi il primo accesso di demo@skill-vision.it scriverà i dati sulla sua società.
- CLAUDE.md (Fase 6, verifica del 2026-11-02) e i commenti precedenti dicevano «si caricano a mano»:
  superato dalla richiesta di Bilal.
- «Ripristina demo» e «Usa un bilancio dimostrativo»: spostati, vedi «Strumenti demo in un posto solo» sotto.

## Menu di Recruiting: titoli dei livelli come voci · 2026-11-05
Come «Home» in Assessment: icona, freccia, gruppo aperto all'inizio. **Le icone delle sottovoci
restano** (2026-11-04), anche se Home in Assessment non le ha. Nuove icone Lucide per i livelli: Search,
Scale, CircleCheck, ClipboardCheck. L'Area valutatori non ha una pagina dei risultati: il titolo apre e
chiude. Strumenti e Amministrazione restano etichette: non sono livelli.

## Un confronto solo · 2026-11-05
Decisione di Bilal: tutti i confronti passano da «Confronta persone». Tolta la scheda «Confronto (fino a 5)»
anche da Competenze professionali; `MatchCell`, `MatchLegend` e `matchCellClasses` non servivano più e
sono tolti. **Cosa si perde**: la pagina del confronto legge solo le 35 competenze trasversali, come chiede
CLAUDE.md, quindi oggi nessuna schermata mette fianco a fianco i punteggi professionali (5 P) di più persone.
Restano la classifica e la vista individuale. Da dire a Roberto. Aggiunto il link «Confronta persone» alla
pagina delle professionali: senza, da lì non si arrivava al confronto.

## Strumenti demo in un posto solo · 2026-11-05
Decisione di Bilal, CLAUDE.md §9. **Opzioni**: (a) una pagina per modulo; (b) una pagina sola, sotto
Recruiting, che ospita anche Assessment. **Presa (b)**: è la pagina chiesta, e tutti gli strumenti stanno in
un posto. Il menu di Assessment ha una voce che porta lì, solo per l'account demo: il clic cambia modulo.
- **Limite**: la pagina sta dentro Recruiting. Una società demo senza quel modulo la vedrebbe bloccata.
- **Cambia il comportamento del bilancio**: prima riempiva il modulo di Dati aziendali e andava salvato; ora
  non c'è il modulo accanto, quindi chiede conferma e salva subito. Come prima, il primo salvataggio con
  persone valutate fissa l'atteso.
- **Dopo «Ripristina demo»** si resta sulla pagina, con un avviso; prima si andava alla Home del modulo.
- **Sul server non cambia niente**: il ripristino resta ammesso solo per `ASSESSMENT_DEMO_COMPANY_IDS`.
  Va impostata sul backend dove serve: senza, il pulsante risponde «ammesso solo per una società demo».
- I testi orfani del vecchio confronto restano nei dizionari: la loro struttura si conserva (CLAUDE.md cap. 7).

## Rilascio dei sei punti: come si segnano · 2026-11-05
Bilal ha chiesto di segnarli completati e pubblicati. **Presa**: pubblicati sì, «completati» no. CLAUDE.md
§9: un punto è fatto solo dopo la prova in produzione, e un «non fatto» dichiarato vale più di un «fatto» che
si rompe al primo clic. Il controllo locale di Bilal c'è, la prova da loggati in produzione no. Quando c'è, per
ogni punto si aggiunge la riga con pagina, azione e risultato. Stato in PROGRESS, 2026-11-05 (4).

## Area valutatori: larghezza dei campi · 2026-11-05
Richiesta di Bilal: i campi a tutta riga si leggono male, le card esterne restano. **Opzioni**: (a) una larghezza su
ogni campo, oltre cento righe; (b) una regola sola sul contenitore della pagina. **Presa (b)**: `FIELD_WIDTHS`, si
cambia in un punto e una pagina nuova dell'area la riceve con una riga. Usa selettori su `data-slot`, non cambia
l'API delle primitive. Solo in Area valutatori: altrove i campi restano come sono finché non viene chiesto.

## Atteso del ruolo cercato · 2026-11-07
Decisione del 2026-11-06. Il profilo del ruolo non ha valori attesi per nessuna delle 14 mansioni, quindi ognuno
ripiegava sul proprio. **Presa**: 1) l'atteso del profilo, se c'è; 2) chi ricopre il ruolo tiene il suo; 3) chi viene da
altrove si misura con la regola già usata per un dipendente nuovo: 8 sulle competenze del ruolo, 6 sulle altre.
**Cosa cambia**: i confronti con persone di altre mansioni; il valore espresso di ciascuno sul proprio ruolo no.
**Limite**: se chi ricopre il ruolo ha un atteso cambiato a mano, gli altri non lo seguono.

## Il valore: barre e testi · 2026-11-07
- **Barre**: CLAUDE.md dice Bar Chart e «come nella classifica dei confronti». Presa la classifica (`RoleFitRanking`):
  ha già atteso tratteggiato con il nome ed etichetta lime con lo scarto. Non è Bklit: stessa scelta dei confronti.
- **Gap medio**: oggi coincide (−20%) e non compare; compare sotto il Gauge se è diverso, come chiede il testo.
- **Tolti**: la barra delle fasce e i riquadri dal 5 novembre, perché il nuovo disegno non li prevede. Le fasce restano
  in Il potenziale e Panoramica.
- **Sezione 2**: CLAUDE.md non ne dice il contenuto; restano i tre riquadri proposti il 5 novembre, ancora da approvare.
  Due ripetono i numeri della frase sopra (21 e 4).

## Le perdite: lo scarto in fondo alla barra · 2026-11-07
Bklit scrive in fondo alla barra solo il valore. Aggiunto il dato della riga a `valueLabel` (`bar.tsx`) e la prop
`barNote` a `CategoryBars`. Il valore ottenuto resta nel tooltip e nella tabella. Tutte le aree, anche quelle sopra l'atteso.

## Domande saltate · 2026-11-07
Il cursore ha sempre un valore, quindi «senza risposta» vuol dire: nessun commento e cursore al valore di partenza. Chi
lascia il cursore al valore di partenza senza commentare risulta senza risposta. Il punteggio in cima al report continua a
contare quei valori: togliere le domande saltate dalla formula è una scelta di metodo. **Da decidere con Roberto.**

## Dati aziendali nell'Intervista · 2026-11-07
Sezione in cima alla pagina, sopra il report. **Presa**: mentre si risponde alle domande non si vede, altrimenti spingerebbe
il percorso sotto una pagina di moduli. Se l'Intervista non è ancora fatta, la pagina si apre comunque dai Dati aziendali.

## Panoramica: euro con il bilancio caricato · 2026-11-07
La richiesta copre il bilancio mancante, ma con il bilancio «In attesa dei dati» sarebbe falso. **Presa**: dal motore ROI gli
importi che ha (valore a rischio = potenziali lordi, competenze, turnover, assenze, totale costi evitabili). Restano «€ [—]»,
con il testo che lo dice, inefficienze, importi per area, per azione e cascata: il motore non li ha. **Da confermare.**

## Account demo di default · 2026-11-07
`hr@acme.example` si aggiunge a `demo@skill-vision.it` senza variabili su Railway. Quell'account nasce solo dal seed, che in
produzione è rifiutato. Sovrascrive la scelta del 5 novembre (solo demo@skill-vision.it).

## Competenze per posizione · 2026-11-07
Decisione del 2026-11-06: ogni ricerca ha la sua configurazione. **Opzioni**: (a) una chiave nuova per posizione; (b) una mappa
per posizione nel documento che già c'è. Il backend accetta solo un elenco chiuso di chiavi, quindi (a) richiede di toccarlo.
**Presa (b)**: `{positions: {[openingId]: {flags, expected}}}` in `SKILL_FLAGS_KEY`. Il vecchio documento piatto si ignora: una
posizione senza configurazione parte vuota. **Da sapere**: chi aveva scelto competenze per «Sales Account Manager» non le ritrova.

## Valore atteso e punteggi · 2026-11-07
Il valore atteso da 1 a 10 si porta sulla scala del test (×31/10) e sostituisce la soglia del peso per quella competenza. Senza
valore resta la soglia del peso, scritta nel campo come suggerimento. **Cosa cambia**: i punteggi cambiano solo per chi scrive un
valore. **Da confermare con Roberto.**

## Menu: un livello aperto alla volta · 2026-11-07
Aperto il livello della pagina attiva; la freccia ne apre un altro finché non si cambia pagina. Il valutatore non apre le pagine
dei risultati: per lui il titolo apre e chiude e basta.

## «Classifica dopo il test» · 2026-11-07
CLAUDE.md: se è la stessa pagina di Migliori candidati si annota, se mostra altro si scrive nel resoconto. **Mostra altro**
(`PipelineSectionPage section="classifica"`). Voce tolta dal menu come chiesto, rotta `/recruiting/classifica-test` conservata.
Scritto nel resoconto per Roberto.

## Ranking: il nome apre il CV · 2026-11-07
Decisione del 2026-11-06. `CvOpenButton` con `asName`; il pulsante CV resta, nessuno ha chiesto di toglierlo. Il match è in % solo
nel Ranking (`percent` di `CvMatchDialog`): altrove resta su 10. Tolta la colonna col punteggio, che ripeteva il numero.

## Etichetta dopo il segno dell'atteso · 2026-11-07
Nelle barre orizzontali lo scarto stava subito dopo la barra e il segno dell'atteso lo attraversava. **Opzioni**: (a) spostare il
testo oltre il segno; (b) scriverlo dentro la barra, illeggibile sulle barre corte. **Presa (a)**: `valueLabelPast` di `bar.tsx`,
modifica alla copia locale di Bklit. Lo scarto resta in fondo, dopo il segno quando il segno è più lontano della barra.

## Tooltip dei pattern dei grafici · 2026-11-07
Il tooltip di Bklit usa la chiave del dato come nome e arrotonda all'intero. `CategoryBars` e `TrendChart` ora passano `rows` con
il nome della serie e il formato del grafico. Non era nella richiesta: §9 chiede che il passaggio del mouse mostri il valore.

## Caricamento dei CV dal link dell'annuncio · 2026-11-07
Stima per Roberto, **non si costruisce fino al suo ok**. Fattibile, 27–39 ore (4–5 giornate); dettaglio e domande aperte in
`resoconto-2026-11-06.md`. Punti tecnici: `publicJobPostings` oggi è solo GET; `POST /cv` richiede l'accesso e controlla solo il
tipo dichiarato; `syncRankingFromBackend` aggiorna i candidati presenti ma non ne aggiunge; `createLimiter` è in memoria per istanza.

## Metodo e Confronto interno sulla posizione attiva · 2026-11-09
Opzioni: (a) filtrare i candidati sulla posizione attiva e lasciare il calcolo com'è; (b) calcolare anche il profilo Big
Five di riferimento sulla posizione. Cambia che (b) tocca il calcolo della classifica, che oggi usa un solo profilo di
riferimento (`ROLES[DEFAULT_ROLE]`) per tutte le posizioni. Raccomandazione e scelta: (a). A schermo non compare più
«Sales Account Manager»; l'esempio di AB usa lo stesso profilo del calcolo, così il numero torna. Il profilo di
riferimento per posizione resta un punto aperto (già nel registro del 7/11). I talenti interni non sono di una
posizione e restano com'erano.

## Il marchio sul telefono, con il commutatore dei moduli · 2026-11-09
La barra superiore usciva dallo schermo di 6–14px a 390px con la barra di scorrimento del desktop. Opzioni: stringere gli
spazi, nascondere il commutatore, usare il simbolo al posto del lockup. Scelta: il simbolo, solo sotto `sm` e solo quando
c'è il commutatore (cap. 7: «sotto gli 80px il lockup lascia il posto al simbolo»). Sopra `sm` nulla cambia.

## L'impatto in tre card: dove i numeri non cambiano · 2026-11-09
Gli scenari prudenziale · base · espansivo si mostrano solo se le tre cifre sono diverse: sul divario (Il valore) e sulle
perdite il motore dà la stessa cifra nei tre scenari, e tre numeri uguali farebbero credere a una forbice che non c'è.
Il valore non ha la terza card del valore espresso nell'Impatto: il valore espresso è il Gauge della stessa sezione, e
il numero si scrive una volta. Restano Ring della copertura e card degli euro a metà riga (Decisioni del 2026-11-06).

## Bilancio dimostrativo caricato da solo · 2026-11-09
Opzioni: (a) lasciarlo al pulsante negli strumenti demo; (b) caricarlo da solo sulla società demo. Scelta (b), come chiede
la correzione del 9/11 («con lo stesso meccanismo degli altri dati demo»): Recruiting carica già da solo i suoi dati
demo. Condizioni: società demo (`isOnDemoCompany`), utente che può modificare, bilancio assente; una volta per sessione.
Mai sulle società vere, mai con il seed. Il pulsante negli strumenti demo resta.

## Intervista: le domande saltate fuori dagli indici · 2026-11-09
Il cursore ha sempre un valore, quindi una domanda saltata veniva letta come una risposta al valore di partenza. Opzioni:
(a) salvare quali domande hanno una risposta (campo nuovo nei dati salvati); (b) usare la regola già in uso nel riepilogo
(nessun commento e cursore al valore di partenza) anche per gli indici. Scelta (b): non tocca il salvataggio. Limite noto:
chi risponde esattamente il valore di partenza senza commento risulta «Senza risposta». Se va distinto, serve (a), che
tocca i dati salvati e va deciso con Roberto.

## Il valore: il Gauge da solo, centrato · 2026-11-09 (sera)
Istruzione del 9/11 sera, che sostituisce quella del mattino: niente valore per area accanto al Gauge e niente frase
sotto «1 La situazione oggi». Il Gauge sta su una riga sua, grande (360 × 274, 300 × 229 sotto i 640px per non far
scorrere il telefono) e **centrato**: è un'eccezione voluta a «testo sempre a sinistra» (cap. 6), chiesta così. Sotto,
«Vedi per mansione» (Collapsible, chiuso all'apertura) apre il valore espresso per mansione, con la stessa formula
delle aree (somma dei rilevati ÷ somma degli attesi), dalla mansione più lontana. Sezione 2: «Area con il maggiore
deficit di competenze» usa il valore espresso per area (scala 0–120%, atteso 100%), non la media su 10 delle Perdite
invisibili: le tre card della pagina parlano tutte in valore espresso.

## Intervista: l'indice sulle domande con risposta · 2026-11-09 (sera)
Sostituisce «l'indice compare solo con cinque risposte» del mattino. Opzioni: (a) media semplice delle risposte date;
(b) gli stessi pesi di prima (30 · 25 · 25 · 10 · 10), togliendo quelli delle domande saltate e riportando a 1 i
rimasti. Scelta (b): con tutte le risposte il numero è identico a prima. Sotto il numero «Calcolato su N domande su 5».
Il selettore CT / CP / Completo non compare nell'Intervista (eccezione a «vale per tutto Assessment»): l'Intervista è la
percezione della Direzione, non dipende dal pacchetto. Tolto il blocco «Fase successiva — Misurazione oggettiva».

## «Risultati» nel menu di Recruiting · 2026-11-09 (sera)
Torna fra Ranking e Migliori candidati, sulla rotta che c'era (`/recruiting/classifica-test`, la «Classifica dopo il
test»), con il titolo «Risultati». Mostra solo chi è fra i preselezionati (ha superato il match) e ha il test
completato. Nessuna rotta nuova.

## Candidature dal link pubblico (Parte C) · 2026-11-09
- **Dove nascono i dati.** Candidato, iscrizione alla campagna e CV si creano sul server all'invio; la classifica e il
  match di Recruiting vivono nei suoi dati (documenti per società), quindi il candidato entra nella posizione dal browser
  di chi lavora: all'apertura di Recruiting, al cambio di posizione e ogni minuto. Opzione scartata: scrivere nei
  documenti di Recruiting dal server, che tocca il salvataggio a versioni e rischia di sovrascrivere un collega.
- **Chi risulta averlo caricato.** `Cv.uploadedById` è obbligatorio e il candidato non ha un account: si usa chi ha
  approvato l'annuncio (o chi l'ha creato). L'origine vera resta nella tabella `PublicApplication` e nel registro.
- **Solo demo.** La società deve essere in `ASSESSMENT_DEMO_COMPANY_IDS` (la stessa lista del «Reset demo»). Su Railway
  va controllato che ci sia l'id di Acme, altrimenti il modulo non compare.
- **Privacy.** Titolare ed email per i diritti, obbligatori, in Amministrazione → Email («Privacy delle candidature
  online»). Senza, «Crea link» è spento e il modulo non compare. Conservazione 24 mesi, 6 mesi a scelta del candidato.
- **Antivirus.** Controllo di base: il contenuto deve essere davvero PDF, DOC o DOCX (firma del file) e la firma di
  prova EICAR si rifiuta prima di salvare. Non è un motore antivirus: il punto è uno solo (`backend/src/lib/fileScan.ts`)
  e lì si collega ClamAV o un servizio esterno quando serve. Da decidere con Roberto prima delle società vere.
- **Niente invio automatico del test** ai candidati dal link: entrano in Ranking «Da inviare» e l'HR decide, come per
  ogni altro CV.

## Un verde per sezione: un alias per gli archi · 2026-11-10
Correzioni di Roberto del 2026-11-10. In chiaro le linee, gli archi e gli anelli (Gauge, Ring) non possono essere
`accent-400` (fondamenta: «non si usa mai come linea su fondo chiaro»), le barre e i pallini sì, con il bordo
`chart-highlight-stroke`. Opzioni: (a) scegliere il verde in ogni componente secondo la modalità; (b) un alias
semantico `--chart-highlight-line` (`accent-600` in chiaro, `accent-400` in scuro). Scelta (b): nessun colore nuovo,
due verdi delle fondamenta, e i componenti non conoscono la modalità. Gauge e Ring in evidenza lo usano; barre e
pallini restano su `chart-highlight` con il bordo di 1,5px. Il mini grafico verde è quello del primo riquadro di
«Criticità e opportunità»: lo decide `ResultsPage`, non la pagina, così vale uguale nelle quattro pagine.

## La barra sotto il mouse: un'estensione di Bklit · 2026-11-10
Bklit sotto il mouse attenua le altre barre ma non colora quella guardata. Aggiunte a `components/charts/bar.tsx` due
prop (`hoverFill`, `hoverOutline`), come le altre estensioni Skill Vision già nel file (etichette dei valori, bordo):
il comportamento di Bklit non cambia, cambia solo il colore della barra guardata. `CategoryBars` le accende con
`hoverHighlight`, usato nelle pagine dei risultati di Assessment (Il valore · Vedi per mansione, Le perdite
invisibili). Nella stessa revisione, in `bar.tsx`, un segmento impilato a zero dava una larghezza negativa (più di 300
errori in console su Le perdite invisibili e in Panoramica): ora si ferma a zero. Era sfuggito alla prova del 9/11.

## «Perché è importante» su mobile: 24px, non 26 · 2026-11-10
Le fondamenta danno all'H2 26px su mobile, ma la scala del sito nel tema ha solo i valori desktop e la regola «sotto
`md` si scende di un gradino»: su mobile l'H2 diventa `site-h3` (24px), come i titoli delle altre pagine di
presentazione. Il testo a 20px/400 usa la misura di `site-h4` con peso 400 e interlinea 1,5 (nessun token nuovo); su
mobile `site-body-lg` (18px). Se lo studio vuole il 26px esatto, serve il valore mobile nella scala del tema.

## Antivirus: ClamAV, fail-closed · 2026-11-10
Il motore è ClamAV, tramite clamd (protocollo INSTREAM su TCP: nessuna dipendenza in più), in `backend/src/lib/fileScan.ts`.
Variabili: `CLAMAV_HOST`, `CLAMAV_PORT` (3310), `CLAMAV_TIMEOUT_MS` (15000). Motore spento, irraggiungibile, lento o
con una risposta che non si capisce: il file si rifiuta (503, «il controllo antivirus non è disponibile»), niente si
salva. Unica eccezione, solo per le società demo: `ANTIVIRUS_ALLOW_BASIC=true` senza motore lascia il controllo di base
(tipo di file e firma EICAR). **Conseguenza in produzione**: finché su Railway non c'è un servizio ClamAV con
`CLAMAV_HOST`, o `ANTIVIRUS_ALLOW_BASIC=true`, il modulo di candidatura della demo rifiuta i CV. Opzione scartata:
lasciar passare i file quando il motore manca, che è proprio quello che Roberto ha escluso.

## Il bilancio in cima ai Dati aziendali · 2026-11-10
Il caricamento era già nell'Intervista, ma in fondo ai Dati aziendali, dopo sedi, contatti e ruoli: Roberto non lo
trovava. La sezione del bilancio va in cima, con lo stato («Bilancio caricato il [data]» o «Carica il bilancio»), il
nome del file e il pulsante «Carica il bilancio» / «Sostituisci il bilancio». Tolta la card con «Vai al bilancio».
Stesso file del motore ROI (Credit Save: .xlsx, .xls, .csv), stesso lettore (`lib/roi/importer`).

## Una sola fonte per società e posizioni (Recruiting e Assessment) · 2026-11-11 — PROPOSTA, in attesa di Roberto
**Stato: non costruito.** Da decidere con Roberto (punti 1–4 sotto) prima di qualunque migrazione. Tocca il
salvataggio dei dati (CLAUDE.md §5): non si parte senza approvazione.

**Il problema.** Assessment legge la società dal server (`Company`, la società dell'account). Recruiting tiene un
suo elenco di società e posizioni dentro il documento `apex5d_cv_matching_state` e lo collega alle tabelle del server
(`Company`, `Campaign`) per nome, la prima volta che un CV passa dal server (`lib/backend-link.ts`). Le due fonti
possono divergere: in produzione la società demo di Recruiting (`company-acme`) è stata rinominata con la matita
«EMEXxxxC S.p.A.», mentre Assessment mostrava «Acme Corp». Dopo una rinomina, una posizione non ancora collegata
cercherebbe la società sul server con il nome nuovo, e non la troverebbe.

**La proposta.**
1. Un endpoint unico per il contesto: le società visibili (la propria; tutte per lo staff), le loro campagne, la
   società e la posizione attive come preferenza dell'utente sul server. Lo leggono Recruiting e Assessment.
2. Le rinomine con la matita aggiornano `Company.name` e `Campaign.name`: le due schede leggono lo stesso nome.
3. L'elenco del documento di Recruiting smette di essere una fonte: le posizioni puntano alla campagna per id, non
   per nome. Candidati, test e colloqui restano dove sono, legati all'id della campagna.
4. Migrazione una tantum: ogni posizione di Recruiting si collega alla sua campagna per id; quelle senza campagna ne
   ricevono una nuova. Prima un'anteprima a secco che elenca ogni azione, poi l'applicazione con registro e un modo per
   tornare indietro. Prova su una copia dei dati di produzione prima della produzione.
5. Assessment segue la stessa scelta: cambiando società in una scheda resta nell'altra.

**Stima: 30–45 ore**, di cui circa metà per la migrazione e la sua prova sulla copia dei dati.

**Decisioni per Roberto**
1. **Società che non sono clienti veri.** Northwind Ops (e il nome «EMEXxxxC» di Acme) esistono solo nei dati di
   Recruiting: nel modello unico diventerebbero società vere sul server. Restano o si tolgono?
2. **Holding.** CLAUDE.md prevede la struttura gruppo → società: il selettore unico mostra solo le società o anche il
   gruppo?
3. **Chi può rinominare.** Oggi qualunque recruiter rinomina la società nei dati di Recruiting. Con il nome del server
   cambierebbe per tutti, Assessment compreso: solo gli amministratori?
4. **Quando.** Niente dati reali in produzione prima del login nuovo (Fase 8): la migrazione va fatta ora, con i dati
   di EMEXxxxC, o dopo la Fase 8?

**Intanto.** Per la demo i nomi si riallineano a mano con la matita in Profilo della ricerca («Acme Corp», «Senior
Frontend Engineer»): la rinomina cambia solo l'etichetta, non i candidati né la scheda.

## Correzioni del 2026-11-10 verificate in produzione · 2026-11-11
Bilal Shazim ha verificato in produzione l'11/11/2026, con il suo account, su Acme Corp · Senior Frontend Engineer,
i sei controlli delle correzioni di Roberto del 10/11:
1. Un verde per sezione nelle quattro pagine dei risultati di Assessment («Un verde per sezione: un alias per gli
   archi», «La barra sotto il mouse: un'estensione di Bklit»).
2. «Perché è importante» come titolo e sottotitolo fuori dal riquadro («“Perché è importante” su mobile: 24px, non 26»).
3. Il valore: «Gap medio» sotto il Gauge, al posto di «dall'atteso».
4. Panoramica senza «e cosa fare lunedì».
5. Intervista: le domande saltate non contano, con «Calcolato su N domande su 5» («Intervista: l'indice sulle domande
   con risposta»).
6. Menu di Assessment: Anagrafica subito sotto Intervista.

Le decisioni dietro questi punti restano valide così come sono scritte sopra. Non ancora verificati in produzione: il
bilancio in cima ai Dati aziendali («Il bilancio in cima ai Dati aziendali») e l'antivirus («Antivirus: ClamAV,
fail-closed»), che richiede prima un servizio ClamAV su Railway o `ANTIVIRUS_ALLOW_BASIC=true` per la demo.
