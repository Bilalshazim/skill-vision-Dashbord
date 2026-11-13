# Avanzamento

Leggere questo file per primo, a ogni sessione.

## Piano

### Fase 0 — Analisi ✅ (architettura approvata; restano domande aperte)
- [x] Creare PROGRESS.md e DECISIONI.md
- [x] Analisi di Recruiting, Assessment e guscio legacy → ANALISI.md
- [x] Audit identità in sola lettura (800 difetti in `frontend/src`)
- [x] Verifica visiva del capitolo 7 (screenshot chiaro/scuro, 6 schermate)
- [x] Approvazione dell'architettura (ANALISI.md §14) — recepita in CLAUDE.md
- [x] Aggiornamento dell'analisi sui commit dal 25/09 (ANALISI §16)
- [ ] Risposte ancora aperte: divergenze §11, icona quadrata, nomi fasce
- [x] Destino della nuova Home Assessment: resta il concept del cliente,
      si ricompone sui pattern (CLAUDE.md, Fase 6)

### Fase 1 — Fondamenta ✅ approvata
- [x] `frontend/src/index.css` sostituito da `frontend/src/globals.css`
      (import in `main.tsx`), più l'azzeramento delle ombre
- [x] Geist / Geist Mono: già caricati da Google Fonts con i soli pesi 400/500/600
- [x] `components.json` punta a `src/globals.css`
- [x] Due modalità e switch verificati (screenshot prima/dopo, 6 schermate × 2)
- [x] Ponte per Assessment (`assessment-bridge.css`), `--accent` neutralizzato
- [x] `badge.tsx` e `button.tsx` sulla scala; `rounded-md` → `rounded-sm`,
      `rounded-xl` → `rounded-lg`

### Fase 2 — Mappatura (MAPPATURA.md) ✅ approvata
- [x] Ramo `assessment-home-valore-panel`: già contenuto in `main`
- [x] Inventario aggiornato: componenti, campi nativi, classi CSS di Assessment
- [x] MAPPATURA.md: campi, pattern condivisi, guscio, Home Assessment,
      dominio, grafici, da togliere, divergenze, ordine per la Fase 3
- [x] Decisioni registrate (Select, date, Esc, StatCard, Accordion,
      Tabs, tabelle, badge, toni della Home, Phosphor)
- [ ] Rimandato: valutatore esterno di Assessment sul token backend (serve un
      modello dati sul server, lavoro separato da concordare col cliente) —
      MAPPATURA §8.2. Nel frattempo resta il meccanismo attuale.
### Fase 3 — La libreria di componenti ✅ COMPLETATA (2026-09-30)
- [x] Blocco 1: catalogo `/dev/components` + Button, Card, Badge, Tooltip,
      pattern `Hint` — sostituiti nei due moduli
- [x] Blocco 2: Input, Textarea, Label + pattern Field, FieldGrid — sostituiti nei due moduli
- [x] Blocco 3: Select + SelectField, Checkbox, Switch, Slider — sostituiti nei due moduli (nessun radio nel codice)
- [x] Blocco 4: Dialog (con conferma se ci sono modifiche) + ModalDialog,
      AlertDialog + ConfirmDialog + useConfirm, Sonner, Alert + InlineAlert,
      scala unica dei livelli (z-index)
- [x] Blocco 5: Tabs, ToggleGroup, Accordion, Collapsible, Progress — sostituiti nei due moduli; chiusi i 3 chip cliccabili
- [x] Blocco 6: Table + DataTable (Anagrafica), Sheet (pannello dipendente),
      Skeleton + LoadingState, FilterBar, EmptyState, Avatar, Separator
- [x] Blocco 7: pattern della Home e dei grafici (StatCard, ChartCard,
      PageHeader, FolderCard, SkillVisionCard, DistributionBar) + Phosphor →
      Lucide; proposte di grafici Bklit (radar compreso) in MAPPATURA §10
- [x] Blocco 8: parti rimaste dei form, rifinitura, catalogo verificato in
      chiaro e scuro, audit finale di Fase 3 (484 difetti in `frontend/src`)
- [x] Proposte di grafici approvate → DECISIONI "Grafici approvati per la Fase 5"
### Fase 4 — Guscio unico ✅ CHIUSA (2026-10-01)
Il login resta quello di oggi: rifacimento e ritiro del guscio legacy in Fase 8.
- [x] Sidebar unica (primitiva `ui/sidebar.tsx` + contenuto per sezione),
      pannello Sheet su mobile per i due moduli
- [x] AppShell unico (una Topbar, una Sidebar) usato dai due layout;
      commutatore Recruiting/Assessment solo con due moduli acquistati
- [x] Struttura gruppo → società nel guscio (`CompanySwitcher`) sui dati di
      oggi: Recruiting sceglie fra le sue società (stesso `setActiveContext`),
      Assessment ne ha una
- [x] Solo italiano: switch IT/EN tolto, dizionari conservati
- [x] Reset demo solo in demo (`VITE_DEMO_MODE`, proposta in DECISIONI)
- [x] Vocaboli: "Posizione" (Recruiting), "Mansione" (Assessment); fasce di
      idoneità "Idoneo / Da valutare / Non idoneo"; fascia più alta neutra
- [x] Catalogo acceso da `VITE_ENABLE_COMPONENT_CATALOG` (variabile non
      ancora impostata su Railway)
- [x] Radice `/` in React (`ModuleChooserPage`): un modulo → rinvio diretto,
      due → scelta. Il login legacy porta lì (`showScreen('landing')` →
      `/`) nelle due copie di `js/app.js`; server combinato e dev server
      servono `/` dalla build React. Codice di autenticazione invariato.
- [x] Pattern `SendTestLinkBar` ("Invia link test (N)" + conferma) e colonna
      di selezione in `DataTable` (`selection`), nel catalogo
- [x] Stato condiviso: società attiva, tema chiaro/scuro (`sv_theme`), lingua
      fissa. Chiamate al server: solo Recruiting ne ha, niente da fondere
- [x] Il conto finale — registro del 2026-10-01
### Fase 5 — Grafici Bklit ✅
- [x] Bklit dal registro shadcn (`bklit.com/r`), adattato ai token e alle regole
- [x] Radar R1–R6; barre G1/G2 (il Composed di Bklit ha solo il tempo);
      Line G3; matrice G4 (visx); Gauge G5; Ring G6; Funnel G8;
      DistributionBar G9; Composed G10; Area G11
- [x] Rimossi `chart.js`, `recharts`, `ui/chart.tsx` e sette file di grafici
- [x] Asse y dei grafici nel tempo a scala fissa (0–10 punteggi, 0–100
      percentuali), prop `scale` di `TrendChart`
### Fase 6 — Schermate ✅ (2026-10-01)
- [x] Tema parallelo di Assessment tolto: `assessment-scoped.css`,
      `assessment-bridge.css`, `legacy-assessment.css` eliminati; resta
      `assessment-print.css` (solo stampa del report)
- [x] Marchio d'identità ovunque (React e le due copie del guscio)
- [x] Schermate dei due moduli ricomposte su primitive e pattern; nuovi
      pattern `Note`, `NavCard`, `ChatMessage`; `MatchLegend` di dominio
- [x] Capitolo 7: alone e claim inglese della Home Recruiting, glifi ed
      emoji nei bottoni, maiuscolo scritto nel testo, colori decorativi
- [x] "Salva JD": già nella barra in fondo, non più flottante. Doppio
      scorrimento dell'anteprima tolto (niente `sticky` + scorrimento
      interno, che finiva anche sotto la barra superiore)
- [x] "Scopo del ruolo": testo normale (in mono restano solo i codici)
### Fase 7 — Verifica ✅ (2026-10-01)
- [x] Audit: `frontend/src` 0 difetti (era 484 a fine Fase 3); repository
      239, tutti nel guscio legacy (Fase 8) e nei modelli email del backend
- [x] Giro automatico su 31 rotte × 2 modalità: nessuna ombra, nessun
      bianco/nero puro, solo Geist, nessun maiuscolo fuori label (salvo dati)
- [x] Catalogo verificato in chiaro e in scuro
- [ ] Contrasto reale con lo snippet dell'audit: da fare a mano nel browser
### Fase 8 — Autenticazione e ritiro del guscio legacy
Segue PROPOSTA-AUTENTICAZIONE.md. Va chiusa prima del primo cliente reale,
insieme allo spegnimento del catalogo in produzione.
- [x] Struttura non dipendente dal cliente (2026-10-02), dietro
      `VITE_AUTH_MODE` (default `legacy`, invariato): limite ai tentativi,
      refresh in cookie httpOnly, login React `/login`, guardia unica,
      logout, permessi dal ruolo, proxy `/api` per la stessa origine
- [x] Script per gli account del gruppo di lavoro (`create-team-admin`) e per
      chiudere gli account con password pubbliche (`secure-demo-accounts`),
      2026-10-02. **2026-10-06: questa checklist era disallineata dal
      registro** — i passi sotto erano già fatti dal 2026-10-03 (vedi
      «Produzione in modalità backend» e seguenti) ma qui segnati come aperti.
- [x] **Passaggio in produzione, 2026-10-03** (registro: «Produzione in
      modalità backend»): `VITE_AUTH_MODE=backend` sul servizio Skill Vision,
      account del gruppo di lavoro creati via `railway ssh`, Passo 4
      (`secure-demo-accounts.js --apply --frontend-is-backend-mode`)
      eseguito, `VITE_OPERATORE_BRIDGE_PASSWORD` tolta e bundle ricostruito.
      Verificato: proxy `/api` risponde 401 senza token, pagine protette →
      `/login`, accesso vero riuscito. **Account del cliente**: solo quelli
      del gruppo di lavoro e la società demo esistono oggi; gli account delle
      due società reali di Original Skills restano da creare con loro,
      d'accordo (CLAUDE.md, Fase 8) — non ancora fatto.
- [x] Ritiro del guscio legacy e della sua copia, del ponte e delle coppie
      di `js/app.js`, nello stesso passaggio (2026-10-21, "Tutto sul server"
      Parte 3).
- [x] Gestione utenti in app (2026-11-03): Impostazioni → Utenti, solo
      PLATFORM_ADMIN — elenco, nuovo utente, modifica, nuova password;
      uscita immediata a ogni cambio di password, ruolo o stato
- [x] Primo accesso (2026-11-03): password del nuovo utente facoltativa
      (la genera il server), provvisoria; al primo accesso l'utente ne
      sceglie una sua (FirstAccessPage), il server blocca il resto
### Richieste del documento "recruiting doc" (2026-10-19)
Stima e ordine approvati: prima i punti veloci (1, 2, 5–7), poi Recruiting
valutatori, poi i grafici dopo l'accordo con Alessio.
- [x] 1 · "Hard skill" → "Professionali" in Assessment (menu, titoli, testi)
- [x] 2 · 5P, Invio schede: «Prepara la scheda» per valutatore, «Invia
      scheda compilata» sempre visibile nella scheda aperta in piattaforma
- [x] 5–7 · Scheda professionale: si collega al server al salvataggio,
      «Conferma» accanto a «Modifica», dove è salvata, link dell'annuncio
      (copia, email, apri) anche nella card "Annuncio di lavoro"
- [x] 4 · "Intervistato" nell'elenco candidati + schede dei valutatori al clic
- [x] 4 · Sintesi IA che legge anche i file caricati (PDF, immagini, Word)
- [ ] 3/8 · Assistente con caricamento di documenti (vero modello sul server)
- [ ] Grafici: proposta per Risultati (soft / professionali contro l'atteso)
      e Confronto interno (radar), da concordare con Alessio
### Area Valutatori — schede inviate e restituite come file (2026-10-19)
Requisito: documento "RECRUITING — AREA VALUTATORI". Il file si aggiunge
alla compilazione online, non la sostituisce (Roberto, 2026-10-19).
- [x] Invio: il responsabile sceglie quali schede mandare (Intervista
      strutturata, Valutazione candidato o tutte e due); risposta all'email
      verso il responsabile
- [x] Caricamento delle schede restituite come file, per candidato:
      "Carica schede intervista" / "Carica schede valutazione"
- [x] Quadro per candidato e valutatore: inviata → compilata online o file
      caricato → in attesa
- [x] In produzione il 2026-10-19 (`ea0fb38`): backend nuovo attivo, la rotta
      `form-tracking` risponde 401 senza accesso, /health 200; migrazione
      applicata dal `preDeployCommand`
- [ ] Domanda aperta: allegare all'email i modelli vuoti delle schede (Word
      del cliente)?
### Progetto separato — Assessment sul server
Analisi e stima in PROGETTO-ASSESSMENT-SERVER.md: valutatore esterno, invio
link test in Assessment, holding → società. Piano di esecuzione al §8
(2026-10-14), decisioni del §8.5 prese. Riassunto per Roberto:
`ASSESSMENT-BACKEND-PLAN.md`.
- [x] Passi 1–2: schema, migrazione, API (2026-10-14)
- [x] Passo 3 / Parte 1: schermate sul backend, import, assenze, RAL (2026-10-15)
- [x] Parte 2: valutatore esterno sul token del server (2026-10-15)
- [x] Parte 3: invio link test dal server (2026-10-15)
- [x] Parte 4: 5P sul server, persone = dipendenti (2026-10-15)
- [x] Parte 5: verifica di tutte le schermate, chiaro e scuro (2026-10-15)
- [x] Parte 6: codice su Railway (2026-10-15); dal 2026-10-21 non serve più
      la variabile: Assessment è solo sul server (progetto sotto, Parte 1)

### Progetto — tutto sul server, niente nel browser (dal 2026-10-21)
Piano in PROGETTO-TUTTO-SUL-SERVER.md (10 parti, 38–50 ore). Riassunto per
Roberto: `BACKEND-ONLY-PLAN.md`. Ramo `server-only`.
- [x] Parte 1: Assessment solo server, import che svuota il browser (2026-10-21)
- [x] Parte 2: preferenze sul server (2026-10-21)
- [x] Parte 3: ritiro della modalità `legacy` e del guscio statico (2026-10-21)
- [x] Parti 4–9: Recruiting sul server, in tempo reale (2026-10-21)
- [x] Parte 10: verifica e controllo "zero archivio del browser" (2026-10-21)
- [ ] Da decidere con Roberto: scheda 5P del valutatore come link online?

## Registro

## 2026-11-16 — «Spero siano gli ultimi ritocchi» (Roberto, 16/11)
- [x] **Dati aziendali**: etichette di Roberto, «% Turnover attuale», «% assenteismo + malattia attuale», «Valore del
      contratto €». Salvataggio, campi e impaginazione restano quelli di `577cb03`. Il salvataggio in produzione
      con l'account di Roberto resta da provare (Bilal).
- [x] **Testi**: «Quanto rende realmente ogni persona in forza?» al posto di «Quanto mi rendono davvero le persone che
      pago?» (una sola fonte: la finestra 01, usata dalla Home e dalla pagina); «Perché è importante» di Il valore con
      il testo di Roberto.
- [x] **Il valore**: «Vedi per competenze» al posto di «Vedi per mansione»: il valore espresso per competenza
      (`skillValues`, stessa formula, trasversali del ruolo + le cinque dimensioni 5P con l'atteso 7), dalla più
      lontana. In locale: Delega 50%, Strategia 56%, Pensiero analitico 56%… L'impatto = leve 1 + 2 + 3 del motore
      (produttività, turnover evitato, assenteismo ridotto): in locale € 220.012 (€ 202.387 + € 17.625), prudenziale
      € 128.160, espansivo € 300.299. «Criticità e opportunità» tolta.
- [x] **Le perdite invisibili**: sei riquadri (i suoi tre e i tre di Il valore, su due righe); in L'impatto tolta la
      card «Valore espresso rispetto al ruolo»; la card della percentuale si intitola «% delle persone da potenziare»
      e dice «delle persone valutate è da potenziare: nelle fasce Da potenziare e Critici» (28% in locale); euro = solo
      il potenziale lordo del divario (`gapVal`), senza turnover e assenze: in locale € 578.249.
- [x] **Il potenziale** e **Dove intervenire**: tolta la card «Valore espresso rispetto al ruolo». Gli scenari, in
      tutte le pagine dei risultati, in tre riquadri; Base con la cifra più grande e il bordo di 2px `ring`
      (accent-600, leggibile anche in chiaro).
- [x] **Menu, nuovo indice**: Home (4 pagine) · Panoramica · Predictive analysis (Dati aziendali con Ruoli chiave e
      Bilancio, Intervista, Anagrafica) · Dashboarding (Anagrafica, 1. Competenze trasversali, 2. Competenze
      professionali, con «Somministrazione») · Reporting (1. Valutazioni trasversali con Risultati e Area; 2.
      Valutazioni professionali con i sei capitoli `?tab=`; Confronta persone; Cambio ruolo; Valori complessivi) ·
      Profitability (Piani di sviluppo, Assistenza IA, Note metodologiche). In locale: «Raccolta valutazioni» apre il
      capitolo 3 e si accende solo lei; «Bilancio» apre Dati aziendali sul bilancio; percorso «Home / Predictive
      analysis / Dati aziendali» e «Home / Reporting / Confronta persone».
- [x] Controlli: typecheck, lint, 13 test, build, audit 0 difetti; 390px senza scorrimento orizzontale su Il valore,
      Le perdite invisibili, Dove intervenire, Dati aziendali; Dove intervenire in chiaro e scuro.
- [ ] **Non fatto, da proporre**: il grafico di Il potenziale, sezione 1 (CLAUDE.md, Fase 5: un grafico nuovo si
      propone e si applica dopo l'ok). La stima in euro di Il potenziale resta la leva produttività, in attesa di
      Roberto.
- [ ] Da chiarire con Roberto: Il valore e Dove intervenire ora danno la stessa cifra; nomi del menu in inglese;
      Panoramica e «Risultati valutazioni professionali» (hard-risultati) non sono nel suo indice; sei riquadri invece
      di tre, con area e mansione due volte su due scale.
- [ ] In produzione da provare (Bilal) dopo il deploy.

## 2026-11-13 (4) — Il valore: cifra verificata in produzione
- [x] Bilal ha letto in produzione, Il valore › «Come è calcolato» (Acme Corp, dopo `577cb03`): HCVA € 23.940.143;
      divario dall'atteso 20% (80% rilevato, 100% atteso); persone valutate 23 / 23; potenziale del divario
      € 4.792.192; elasticità × attuabilità 50% × 70%; risultato € 1.677.267 (prudenziale € 958.438 · espansivo
      € 2.300.252). Torna con la formula del motore: 23.940.143 × 20,02% (il divario esatto; a schermo «20%») × 23/23
      = € 4.792.192, × 50% × 70% = € 1.677.267.
- [x] Perché non € 213.686: quella stima veniva dal bilancio dimostrativo (HCVA circa € 3 milioni). Roberto ha
      caricato in produzione il suo bilancio su Acme, che ha sostituito quello dimostrativo: tutte le cifre in euro
      scalano con lui. Nessuna modifica al codice: Il valore e Il potenziale usano lo stesso calcolo e gli stessi dati.
- [ ] Il bilancio di Roberto su Acme **non si tocca**: si rimette quello dimostrativo solo se lo chiede lui.

## 2026-11-13 (3) — Richieste di Roberto del 13/11 (verifica della produzione)
- [x] **Dati aziendali · salvataggio**: «Salva» di «Dati dell'azienda» non passa più dalla coda comune delle
      modifiche (`runSync`, che si ferma alla prima chiamata che fallisce): scrive il profilo con
      `saveCompanyProfile` del contesto, direttamente sul server, e dice «salvati» solo dopo la risposta; se il
      server rifiuta, l'errore resta sotto il pulsante. Stesso percorso per «Salva profilo azienda» (Ruoli chiave).
      In locale il vecchio percorso funzionava (PUT 204): la causa in produzione non si vede senza accesso; il
      sospetto è una modifica precedente nella coda che il server rifiuta e ferma anche il profilo.
- [x] **Dati aziendali · tre campi**: % turnover, % assenteismo + malattia, Valore del contratto, nella finestra,
      salvati nei dati del motore ROI (`turn`, `ass`, `inv`) con lo stesso «Salva». Campo vuoto = valore salvato
      invariato. In locale: ATECO 62.01.00 e turnover 7 salvati (PUT company-profile 204, PUT roi 204), ricaricata
      la pagina: valori al loro posto; turnover rimesso a 6.
- [x] **Dati aziendali · compatta**: campi `sm`, spazi 12px, tre colonne sopra i 1280px (due fra 1024 e 1280,
      una su telefono). A 1366×768 la finestra intera sta in 540px circa; a 390px nessuno scorrimento orizzontale.
- [x] **Intervista**: si apre sul modulo vuoto (passo «Setup», ragione sociale della società attiva). L'intervista
      salvata non cambia finché la nuova non è generata; «Vedi l'intervista salvata» in alto riporta al riepilogo.
      Chi legge soltanto vede il riepilogo come prima.
- [x] **Anagrafica**: tolte le colonne «Soft Skill assegnate» e del punteggio complessivo, e l'ordinamento per
      punteggio. L'assegnazione delle soft skill (si apriva solo da quella colonna) si apre ora dal pannello della
      persona, pulsante «Soft Skill assegnate»: provato in locale, si apre sopra il pannello.
- [x] **Il valore**: due finestre uguali affiancate, «Valore espresso» 80% (Gauge lime) e «Skill-gap mancante» 20%
      (Gauge in inchiostro, gap medio senza segno); «Vedi per mansione» sotto; Copertura mansioni invariata.
      L'impatto = leva «Produttività dal divario di competenza» del motore (`l1` = lordo × elasticità 50% ×
      attuabilità 70%): in locale € 578.249 → € 202.387. In produzione atteso € 610.530 × 0,35 ≈ € 213.686.
- [x] Controlli: typecheck, lint (nessun errore nuovo), test, build, audit 0 difetti (prima 1).
- [ ] Da provare in produzione (Bilal): salvataggio di Dati aziendali con l'account di Roberto/Alessio, cifra di Il valore.
- [ ] Da chiarire con Roberto: ha scritto «Leva 2», ma nel motore «Produttività dal divario di competenza» è la
      leva 1 (la 2 è il turnover). Preso il nome, non il numero. Ora Il valore e Il potenziale mostrano la stessa cifra.

## 2026-11-13 (2) — Resoconto del 12–13/11
- [x] `resoconto-2026-11-12.md`: parti A, B, C con i valori letti in produzione da Bilal (13/11) accanto a quelli
      locali, commit di riferimento `bb565c1`, tabella delle colonne Excel, analisi dei cinque campi ROI, antivirus.
- [ ] Non verificati in produzione: importazione da Excel, salvataggio di «Dati dell'azienda». Non fatto: ClamAV su Railway.

## 2026-11-13 — Dati demo di Acme corretti sul server
- [x] Causa della mancata correzione in produzione: `VITE_DEMO_COMPANY_IDS` vuota nella build (il distintivo «Dati
      dimostrativi» dipende solo da `VITE_DEMO_MODE`), quindi il browser non riconosceva Acme come società demo. Stessa
      causa per il bilancio dimostrativo, mai caricato in produzione dal 9/11.
- [x] Correzione all'avvio del backend (`lib/demoFix.ts`): società di `ASSESSMENT_DEMO_COMPANY_IDS` più «Acme Corp» con
      l'impronta dei dati demo. In locale, dati messi come in produzione e lista vuota: sesso sbagliato 23 → 0 (Antonio
      Bianchi M, Sara Colombo F, Laura De Luca F, Andrea Costa M), `@democompany.com` 26 → 0, Intervista «Acme Corp»,
      contatti `@acme.example`, bilancio caricato (12 voci, turnover 6 conservato). Seconda esecuzione: nessuna modifica.
      Dati locali rimessi com'erano.
- [ ] In produzione da provare dopo il deploy (Bilal). Consigliato: `VITE_DEMO_COMPANY_IDS` su Railway con l'id di Acme.

## 2026-11-12 — Decisioni di Roberto del 2026-11-12 (Analisi predittiva) e Section A
- [x] **Passo 1 · Dati demo di Acme**: il generatore usa «Acme Corp» e `@acme.example`, il sesso segue il nome
      (stessa sequenza casuale: popolazione invariata). Correzione una tantum sui dati già salvati, solo sulla società
      demo e solo per chi scrive, senza seed (`fixDemoIdentity`). In locale: sesso sbagliato 17 → 0 sui 24 nomi
      demo (2 record di prova fuori elenco non toccati), email `@democompany.com` 25 → 0, Intervista «Acme Corp».
- [x] **Passo 2 · Bilancio anche per lo staff**: il bilancio dimostrativo si carica guardando la società aperta
      (`isDemoCompanyId`), non quella dell'account. Causa del 12/11: l'account di Alessio (staff) non ha una società
      sua. In locale con `admin@skill-vision.it` su Acme a bilancio vuoto: ricaricato da solo sul server (12 voci),
      Il valore € 578.249. È della società: lo vede ogni account di Acme.
- [x] **Passo 3 · Menu «Analisi predittiva»**: prima voce, con Dati aziendali · Intervista · Anagrafica; poi Home,
      Panoramica, Area valutazioni. In locale: `/assessment` apre la Home; al passaggio del mouse si apre dopo 397 ms e
      resta aperto uscendo; clic chiude, Invio riapre; aperto con Anagrafica attiva; percorso «Home / Analisi
      predittiva / Anagrafica»; a 390px il tocco apre il gruppo e il pannello resta aperto. Titolo non in maiuscolo.
      Un passaggio più breve del ritardo non si riproduce con l'automazione (ogni movimento dura circa un secondo).
- [x] **Passo 4 · Dati aziendali, pagina sua** (`/assessment/company`): finestra «Dati dell'azienda» con gli 11 campi,
      Ruoli chiave sotto, bilancio in fondo. Tolti dalla pagina (non dai dati): durata, compenso, costo azioni,
      turnover, assenze, «Atteso 7,0», «Totale dipendenti per tipologia», Sedi e Contatti. Nuovo campo `details` nel
      profilo aziendale (migrazione `20261112120000_company_profile_details`, solo aggiunta). In locale: parte da
      Acme Corp / Via Roma 12 / Milano / hr@acme.example; quattro errori sotto i campi; salvato e ricaricato (PEC,
      P. IVA 12345678901, ATECO, 85, 23, altra sede Via Torino 5 · Torino); sedi, contatti e i cinque campi ROI ancora
      nei dati; il bilancio si salva al caricamento senza toccarli; 1 colonna a 390px, 2 su desktop. Nome e partita IVA
      non si scrivono nella società (proposta D): la finestra parte da lì e salva nel profilo.
- [x] **Passo 5 · Intervista com'era**: la pagina del riepilogo è quella del commit `bb565c1` (l'ultimo prima di
      `d900f5e`), con solo il punteggio sulle risposte date e «Calcolato su N domande su M» quando manca qualcosa;
      tornano le caselle CT · CP · CT+CP, i quattro pulsanti in alto e «Fase successiva». Il percorso delle domande
      resta senza obbligo. In locale: tutte le risposte → 6,0 senza la riga; domanda 2 saltata → 6,3 «Calcolato su 4
      domande su 5»; nuova intervista fino in fondo senza rispondere → «—», «Calcolato su 0 domande su 5», cinque
      «Senza risposta». Intervista demo rimessa com'era.
- [x] **Passo 6 · Importazione dell'anagrafica da Excel**: riquadro in fondo all'Anagrafica (trascinamento,
      «Carica file», «Scarica il modello»), anteprima con errori riga per riga, riconoscimento per email, probabili
      doppioni senza email (nome + cognome + mansione), salvataggio sul server tutto insieme (`POST …/employees/import`,
      una transazione, limite 20 MB), nessuna archiviazione, RAL solo per gli amministratori (anche sul server). Le
      colonne stanno in `IMPORT_COLUMNS`; il modello oggi è provvisorio, generato da lì, finché non arriva quello di
      Roberto. 7 test automatici. In locale: file con errori → 7 errori, «Importa» spento; file buono → 1 nuova
      (con mansione nuova «Data analyst»), 1 aggiornata per email (reparto cambiato, 35 punteggi e 6,3 restano),
      1 probabile doppione non toccato; un lotto con una persona non valida → 400 e nessuna salvata. Dati di prova
      tolti dal database locale. A 390px nessuno scorrimento.
- [x] **Passo 7 · Antivirus**: nessun codice nuovo (il motore è collegato dal 10/11). Istruzioni per ClamAV su Railway
      in DECISIONI («ClamAV su Railway: le istruzioni»); non provate, serve l'accesso a Railway. In attesa:
      `ANTIVIRUS_ALLOW_BASIC=true` solo per la demo.
- [x] Pubblicato fino a `a8d4a70`. In produzione, senza accesso: frontend con il bundle nuovo `index-CImx9Mhg.js`
      (contiene «Analisi predittiva»), backend health 200. Che il backend nuovo e la migrazione `details` siano attivi
      non si vede senza accesso (ogni indirizzo di Assessment risponde 401): lo conferma Dati aziendali che salva.
- [ ] Da fare dopo la prova in produzione di Bilal: `resoconto-2026-11-12.md` con i valori letti in produzione.

## 2026-11-11 (3) — Verifica in produzione delle correzioni del 10/11
- [x] Bilal Shazim ha verificato in produzione (Acme Corp · Senior Frontend Engineer) sei controlli: un verde per
      sezione, «Perché è importante», Gap medio, Panoramica senza «lunedì», domande saltate dell'Intervista, Anagrafica
      nel menu. Registrato nel resoconto del 10/11 e in DECISIONI.
- [ ] Ancora da provare in produzione: bilancio in cima ai Dati aziendali; antivirus (serve ClamAV su Railway).

## 2026-11-11 (2) — Società e posizioni: una sola fonte (proposta)
- [x] Proposta scritta in DECISIONI («Una sola fonte per società e posizioni») e nel resoconto del 10/11 (parte D):
      endpoint unico, rinomine sul server, posizioni legate per id, migrazione con anteprima e ritorno. Stima 30–45 ore.
- [ ] In attesa di Roberto: le quattro decisioni (società non clienti, holding, chi rinomina, quando). Nessun codice.
- Causa del caso di produzione: la società demo di Recruiting (`company-acme`) rinominata «EMEXxxxC S.p.A.» con la
  matita; Bilal ha rimesso a mano «Acme Corp» e «Senior Frontend Engineer».

## 2026-11-11 — Posizione attiva: Profilo candidato e Confronto interno
Dalla prova in produzione di Bilal: «Sales Account Manager» al posto della posizione attiva.
- [x] **Profilo candidato**: il titolo della scheda (anteprima, annuncio, salvataggio) è sempre quello della posizione
      attiva (`withPositionTitle`). Prima restava il titolo salvato con il preset «Sales Account Manager». In locale:
      anteprima «Senior Frontend Engineer». Il bottone «Salva JD per …» legge già la posizione attiva.
- [x] **Confronto interno**: i candidati si presentano con la posizione attiva, non con il ruolo del CV o
      dell'archivio. In locale: «Marta Bellini — Senior Frontend Engineer».
- [x] **Metodo**: nel codice titolo, esempi e stato vuoto leggono già la posizione attiva; nessun testo fisso.
- [x] Menu: Ranking · Risultati · Migliori candidati (verificato in locale).
- [ ] Lo «Scopo della posizione» della scheda è testo scritto (preset Sales Account Manager): va riscritto nella
      scheda, non si cambia da solo.
- [ ] Se in produzione la barra del contesto mostra anch'essa «Sales Account Manager», è la posizione attiva
      dell'account: si cambia dal Profilo della ricerca.

## 2026-11-10 — Correzioni di Roberto del 2026-11-10
Provato in locale con `hr@acme.example` (Vite 5199, backend 4000), in chiaro e in scuro. In produzione da provare
dopo il rilascio (Bilal).
- [x] **Un verde per sezione** nelle quattro pagine dei risultati di Assessment: archi in `accent-600` in chiaro
      (misurato #8C980B) e `accent-400` in scuro (#DDEE1C), alias `--chart-highlight-line`; mini grafico del primo
      riquadro in `accent-400` con bordo `neutral-800` in chiaro, gli altri in inchiostro; pallini dell'Impatto del
      Potenziale verdi; barra sotto il mouse verde in «Vedi per mansione» e in Le perdite invisibili.
- [x] **«Perché è importante»** fuori dal riquadro nelle sette pagine: H2 32px/600, testo 20px/400 interlinea 30px;
      su mobile 24px / 18px. H1 44px (32px su mobile).
- [x] **Il valore**: «Gap medio −20%» con ⓘ sotto il Gauge (80%), al posto della riga «dall'atteso».
- [x] **Panoramica**: tolto «e cosa fare lunedì» (titolo della Sintesi, IT e EN). Nessun «lunedì» a schermo.
- [x] **Menu di Assessment**: Panoramica · Intervista · Anagrafica · Area Valutazioni.
- [x] **Bilancio** in cima ai Dati aziendali dell'Intervista, con stato, data, file e pulsante.
- [x] **Intervista**: la riga «Calcolato su…» non c'è con tutte le risposte (come chiede la decisione del 9/11).
- [x] **Antivirus ClamAV** fail-closed (clamd INSTREAM); 9 test con un clamd finto. Senza motore il modulo pubblico
      risponde «il controllo antivirus non è disponibile» (provato in locale).
- [x] Corretto: larghezze negative nelle barre impilate (338 errori in console su Le perdite invisibili, 332 in
      Panoramica, ora 0). Sfuggito alla prova del 9/11.
- [ ] Su Railway: servizio ClamAV e `CLAMAV_HOST`, oppure `ANTIVIRUS_ALLOW_BASIC=true` per la sola demo. Senza, il
      modulo di candidatura della demo rifiuta i CV.
- [ ] Stime (non costruite): importazione Excel dell'Anagrafica 23–33 ore; Big Five ideale per posizione 18–27 ore.
- Controlli: typecheck frontend e backend, lint 0 errori (37 avvisi, come prima), build, test ROI 6/6, test
  antivirus 9/9, audit senza difetti.
- [x] Pubblicato con `a3ec5b0` su `main`. In produzione, senza accesso: frontend con il bundle nuovo
      `index-DYZGZ6ue.js`, backend health 200. **Prova con l'accesso da fare (Bilal).**

## 2026-11-09 (sera) — Decisioni del 2026-11-09: Il valore, Intervista, Recruiting, Parte C
Richiesta della sera (non ancora scritta in CLAUDE.md: il testo è nella richiesta). Provato in locale con
`hr@acme.example` (Vite 5199, backend 4000). **In produzione non provato con l'accesso** (CLAUDE.md §9).
- [x] **Il valore · sezione 1**: niente frase, niente valore per area accanto; Gauge grande e centrato su una riga sua
      (360 × 274; 300 × 229 a 390px, nessuno scorrimento). «Vedi per mansione» chiuso all'apertura (provato
      `aria-expanded=false` dopo il ricaricamento), apre il valore espresso per mansione con l'atteso 100% tratteggiato e
      «Vedi tutte le persone». Ring della copertura e L'impatto restano sotto.
- [x] **Il valore · sezione 2**: «Mansione con il maggiore deficit di competenze» (Coordinatore tecnico −37%), «Area con
      il maggiore deficit di competenze» (Area tecnica −27%), «Chi va oltre le attese» (4 persone, le prime tre con la
      barra). Ognuno con il mini grafico.
- [x] **Intervista**: indice sulle domande con risposta, con «Calcolato su N domande su 5» (provato: 5 su 5 → 6,0;
      domanda 1 saltata → 5,8, «4 domande su 5», uguale al calcolo a mano; intervista locale rimessa com'era).
      «Nuova intervista» e «Modifica risposte» in alto a destra; «Stampa / PDF» e «Salva» in fondo. Tolti il selettore
      CT / CP / Completo (solo qui) e «Fase successiva — Misurazione oggettiva». In cima ai Dati aziendali lo stato del
      bilancio (caricato · file · data, o «Da caricare») con «Vai al bilancio».
- [x] **Competenze trasversali**: atteso con un decimale e la virgola (1,0–10,0), anche il suggerimento («8,0»). Provato:
      «7.25» → «7,3», «12» → «10,0»; valore rimesso com'era.
- [x] **Menu di Recruiting**: «Risultati» fra Ranking e Migliori candidati (`/recruiting/classifica-test`), attiva quando
      aperta; mostra solo i preselezionati con il test completato (5 sulla posizione demo).
- [x] **Parte C · candidature dal link pubblico** (solo società demo): contatti privacy in Amministrazione → Email;
      «Crea link» nel Profilo candidato, spento senza contatti; modulo sotto l'annuncio pubblico (nome, email, telefono,
      CV PDF/DOC/DOCX fino a 10 MB, consenso, 24 mesi o 6 a scelta); controllo del file con rifiuto della firma EICAR;
      il candidato entra da solo in Ranking della posizione. Provato: invio vuoto → quattro errori; file EICAR →
      «non ha superato il controllo antivirus», nessun file salvato; PDF vero → «Candidatura inviata», Giulia Prova in
      Ranking con «Candidatura dal link dell'annuncio», sul server consenso esplicito, 6 mesi, CV elaborato, candidatura
      segnata come portata. Modulo a 390px senza scorrimento; in scuro leggibile.
- [x] Migrazione `20261109180000_public_applications` (due colonne su Company, tabella PublicApplication): applicata in
      locale con `migrate deploy`; su Railway la applica il preDeployCommand.
- [x] Corretto durante la prova: le frasi delle due caselle del modulo uscivano in maiuscolo mono (componente Label):
      ora testo normale. Il campo «Atteso» non collegava l'etichetta (70 avvisi in console): corretto.
- [ ] Da controllare su Railway: `ASSESSMENT_DEMO_COMPANY_IDS` con l'id di Acme (senza, il modulo non compare).
- [ ] Il controllo antivirus è di base (firma del file + EICAR), non un motore: da decidere prima delle società vere.
- [ ] Dati di prova lasciati in locale: contatti privacy di Acme e la candidatura di Giulia Prova. In `backend/.env`
      (non nel repository) aggiunto `ASSESSMENT_DEMO_COMPANY_IDS` con l'id di Acme.
- Controlli: typecheck frontend e backend, lint 0 errori (37 avvisi, come prima), build, test ROI 6/6, test del
  controllo file 4/4, audit senza difetti.
- [x] Pubblicato con `4db39ca` su `main`. In produzione, senza accesso: il backend risponde 401 sulla rotta nuova
      `/api/v1/public-applications/settings` (quindi è partito con la migrazione), health 200, il frontend serve il
      bundle nuovo `index-BgnZnhwe.js`. **Prova con l'accesso da fare (Bilal).**

## 2026-11-09 — Correzioni di design del 2026-11-09 e punti aperti del rilascio del 7/11
Richiesta: eseguire le «Correzioni di design del 2026-11-09» e i punti aperti, poi pubblicare su `main`. Provato in
locale (account `hr@acme.example`, Vite 5199, backend 4000). **In produzione non provato con l'accesso**: niente
credenziali di produzione qui (CLAUDE.md §9), quindi ogni punto è «pronto in locale», non «fatto».
- [x] **Metodo e Confronto interno sulla posizione attiva**: gli esempi di Metodo si calcolano sul primo candidato della
      posizione attiva (prima l'archivio intero, con «ruolo Sales Account Manager» scritto a schermo); Confronto interno
      elenca solo i candidati della posizione (provato: 12 candidati di «Senior Frontend Engineer», confronto con un
      talento interno funziona). Il candidato si presenta con la posizione (`job`), non con il ruolo del CV. I talenti
      interni restano com'erano (dipendenti, non di una posizione). Il profilo Big Five di riferimento resta quello del
      calcolo (DECISIONI). Metodo per lo staff non provato a schermo: in locale non c'è un account staff.
- [x] **Esc sul dialogo del match**: all'apertura il fuoco andava su «Rimuovi dalla preselezione», che apriva il suo
      tooltip; il primo Esc chiudeva quello. Ora il fuoco va sulla finestra: un Esc la chiude (provato, nessun livello
      aperto dopo). Tab raggiunge ancora i pulsanti.
- [x] **I 6px di scorrimento orizzontale**: non erano delle pagine dei risultati ma della barra superiore a 390px con la
      barra di scorrimento del desktop (fino a 14px). Sul telefono, con il commutatore dei moduli, il marchio diventa il
      simbolo (cap. 7, «Il marchio»); menu e azioni non si stringono più (il bottone del menu era schiacciato a 16px).
      Provato a 370px utili su 9 pagine: nessuno scorrimento. Da 1024 a 1920px non c'era e non c'è.
- [x] **Errori «width negativo» di Bklit**: le barre orizzontali in un riquadro più stretto dei margini (208px a sinistra)
      avevano un'area di disegno negativa. `innerWidth/innerHeight` non scendono sotto zero in `bar-chart`,
      `scatter-chart-shell`, `time-series-chart-shell`. Nessun errore su 8 pagine con grafici a 390px.
- [x] **Home di Recruiting**: le card tornano all'altezza del contenuto (226px, uguali), numero e titolo in alto, verbi in
      fondo. Tolta la prop `tall` da `WindowCard`.
- [x] **Il valore · sezione 1**: al posto dell'elenco delle 23 persone, il valore espresso per area (Bar Chart orizzontale,
      barre in `chart-mono`, valore scritto, atteso 100% tratteggiato) con «Vedi tutte le persone» → Valori complessivi.
      Gauge e grafico alla stessa altezza (378px). Lime pieno solo sul Gauge. Nuovo calcolo `areaValues` (role-index.ts):
      la formula di Roberto sulle somme dell'area, non la media delle persone.
- [x] **Criticità e opportunità: un mini grafico per riquadro** nelle quattro pagine di Assessment (nuovo pattern
      `MiniChart`: barra sulla scala con l'atteso tratteggiato, una riga per persona, fila di pallini), in inchiostro.
      Valore al passaggio del mouse e con il fuoco. `worstCompetenza` e `bestSoft` portano anche ottenuto e atteso.
- [x] **L'impatto in tre card** (pattern `ResultsPage`, quindi anche Recruiting): la quota della pagina in un Ring lime con il
      numero al centro (nel Potenziale una fila di pallini), il valore espresso come barra 0–120% con l'atteso 100%
      tratteggiato e «−20% dall'atteso», la card degli euro. Gli scenari prudenziale · base · espansivo compaiono dove
      sono diversi (Potenziale, Dove intervenire); sul divario e sulle perdite il motore dà tre cifre uguali e non si
      mostrano (DECISIONI). Il valore ha la sezione 1 con Ring e Impatto a metà riga, come deciso il 2026-11-06.
- [x] **Bilancio dimostrativo per la demo**: si carica da solo sulla società demo (`isOnDemoCompany`, solo chi può
      modificare, una volta per sessione) con le cifre che gli strumenti demo avevano già (`lib/demo-roi.ts`). Le società
      vere restano «In attesa dei dati di bilancio». Con il bilancio caricato la nota in fondo dice solo «Dati
      dimostrativi · Acme Corp». **In produzione dipende da `VITE_DEMO_MODE` e dalla lista delle società demo su
      Railway, che da qui non vedo.**
- [x] **Intervista con domande saltate**: si salva e resta dopo il ricaricamento (provato: «Nuova intervista», salto al
      Report, sei «Senza risposta»). Difetto trovato e corretto: gli indici in alto prendevano il valore di partenza del
      cursore come risposta («Valore percepito 7,0 · Buono», «Gap −1,0» su un'intervista vuota). Ora: «—» e «Senza
      risposta» sugli indici saltati, indice complessivo e gap solo con le domande che servono, anche nella stampa.
      Il salvataggio non cambia. L'intervista locale di prova è stata ripristinata dopo il test (PUT, 204).
- [x] **Invio del link a un indirizzo scelto**: esiste già. In Ranking ogni riga ha il campo email; l'invio usa quello.
      Provato con `prova.invio@example.com`: il backend crea il link per quell'indirizzo; in locale la posta non è
      configurata (`RESEND_API_KEY`/`MAIL_FROM`) e si apre l'invio manuale. **In produzione l'email parte solo se le due
      variabili sono su Railway: da verificare.** Lasciato in locale: Luca Ferrante «Link pronto» con l'indirizzo di prova.
- [x] **Caricamento CV sulla posizione demo**: funziona già, nessun blocco per la demo. Provato con un PDF di prova:
      «Nuovo candidato (da CV) salvato sul server … in Migliori Candidati». L'analisi del CV è simulata (nota demo della
      pagina). Lasciato in locale il candidato di prova. **Il caricamento dal link pubblico dell'annuncio non è costruito**:
      resta la stima di 27–39 ore e serve l'ok di Roberto (CLAUDE.md, «CV dei candidati: da stimare, non da costruire»).
- [x] Controlli: typecheck (`tsc -p tsconfig.app.json`), lint 0 errori (37 avvisi, nessuno nei file toccati), build,
      test ROI 6/6, audit senza difetti. Chiaro e scuro su Il valore, Le perdite, Il potenziale, Home di Recruiting.
- [ ] Non fatto: confronto con le tavole del 9 novembre. La tela non si apre da qui (mostra solo «Loading…»): fatto sul
      testo di CLAUDE.md, che vale sopra le tavole. Mini grafici nei riquadri delle pagine di Recruiting: le correzioni
      parlano delle tavole di Assessment.
- [ ] Non fatto: prova in produzione con l'accesso (§9). La fa Bilal.
- [x] Pubblicato: commit `e1d97fb` su `main` (da `server-only`). Nessuna modifica al backend, nessuna migrazione.
      Controllato senza accesso: nuovo bundle `index-GDMTj2ru.js` in produzione, con i testi nuovi («Il valore espresso,
      per area», «Vedi tutte le persone», «Compare quando le cinque domande…»); applicazione e backend rispondono 200.

## 2026-11-07 (3) — Parti A e B pubblicate, prova in produzione da fare
- [x] Commit `d900f5e` su `main` (da `server-only`), su richiesta di Bilal. Nessuna modifica al backend, nessuna migrazione.
- [x] Produzione controllata senza accesso: applicazione e backend rispondono 200; il bundle `index-C-mM6gXQ.js` contiene le
      rotte nuove, online 80 secondi dopo il push; `/recruiting/competenze-trasversali` senza accesso porta al login.
- [ ] **Non fatto: la prova in produzione con l'accesso (CLAUDE.md §9).** Nessuna credenziale di produzione in questa sessione.
      Quindi nessun punto è «fatto»: pagine, menu a tendina, selettori, chiaro e scuro, 390px e dati dimostrativi in produzione
      sono da provare. Da fare da Bilal o con un account di produzione. Non si sa se `demo@skill-vision.it` esista né quali
      variabili demo siano attive su Railway.
- [ ] I tre documenti restano aggiornati a questo stato: `resoconto-2026-11-06.md` lo dichiara in testa e per ogni punto.

## 2026-11-07 (2) — Parte B delle Decisioni del 2026-11-06
Fatta in locale, pubblicata con la voce sopra. Provato con `hr@acme.example` e `recruiter@acme.example`.
Resoconto per Alessio e Roberto in `resoconto-2026-11-06.md`.
- [x] Grafici aggregati (`/assessment/soft`): ottenuto, atteso tratteggiato, scarto scritto, una barra lime per grafico.
- [x] Home di Recruiting: tolto il blocco titolo, tre card verticali a tutta altezza.
- [x] Competenze trasversali (`/recruiting/competenze-trasversali`): 35 competenze, peso, atteso 1–10; scelta uscita dal
      Profilo candidato (`SoftSkillSection.tsx` eliminato). Atteso 10 su Comunicazione: Marta 9,8 → 9,7, poi tolto.
- [x] Competenze e profilo per posizione (`skill-flags.ts`, `activeRole()`).
- [x] Chi è più adatto? e Chi scegliamo? con le sezioni nuove; Ranking in `/recruiting/pagina-a`.
- [x] Menu di Recruiting: livello 4 tolto, un livello aperto alla volta.
- [x] **Rotto e corretto:** a ogni caricamento la posizione attiva tornava su Senior Frontend Engineer.
      `preloadRecruitingDemo` girava prima dell'arrivo delle preferenze, lo credeva un primo accesso e salvava sopra la
      scelta. Ora `RecruitingLayout` aspetta `whenPreferencesLoaded()`. Provato: 15 pagine su un'altra posizione con
      ricarica, nessun salvataggio; server e schermo coincidono dopo ogni cambio.
- [x] **Rotto e corretto:** Ranking con il match in «/10» e non in %, nome non cliccabile, pulsante fuori dallo schermo a
      390px. Ora % ordinate, il clic sul nome apre il CV, a 390px non esce.
- [x] **Rotto e corretto:** lo scarto scritto attraversato dal segno dell'atteso (aggregati e Le perdite):
      `valueLabelPast` in `bar.tsx`. Misurato: nessuna sovrapposizione.
- [x] **Rotto e corretto:** il tooltip di `CategoryBars` e `TrendChart` mostrava «ott», «__highlight» e valori arrotondati.
      Ora nome della serie e formato del grafico. Vale per tutti i grafici su questi pattern.
- [x] Controlli: typecheck (`tsc -p tsconfig.app.json`), lint 0 errori, build, test ROI 6/6, audit senza difetti.
- [ ] **Errore mio:** `tsc -p .` dalla cartella `frontend` non controlla niente (il tsconfig radice ha solo riferimenti):
      alcuni controlli di oggi non valevano. La build li ha sempre fatti con `tsc -b`.
- [ ] Non fatto: Metodo («ruolo Sales Account Manager») e Confronto interno non leggono la posizione attiva. Big Five ideale
      e benchmark restano unici. Dati vecchi sotto «Sales Account Manager» restano, non visibili.
- [ ] Non provato: menu del valutatore (nessun account), apertura di un CV vero, invio vero del link, produzione.
- [ ] Difetto aperto: il dialogo del match si chiude con due Esc; causa non cercata. Errori in console di Bklit (larghezza
      negativa mentre disegna) non corretti.
- [ ] Non spiegato: una volta, prima della correzione, la posizione è ripartita da Northwind dopo aver scelto Acme. Non si è
      ripetuto nella prova più severa.
- [ ] L'elenco dei 14 punti di Alessio non è nel repository: nel resoconto la numerazione è ricostruita.

## 2026-11-07 — Parte A delle Decisioni del 2026-11-06
Fatta in locale, pubblicata il 2026-11-07 (`d900f5e`). Numeri dai dati locali di Acme (25 persone).
- [x] Dati dimostrativi sulla posizione attiva «Senior Frontend Engineer», da soli. Provato su `hr@acme.example`:
      12 candidati, 5 test, 3 colloqui nel database, imbuto 12 · 9 · 7 · 3 · 1. La vecchia posizione a parte è
      tolta da sola. Una posizione con candidati veri non si tocca. Nessun file del backend, nessun seed.
- [x] `hr@acme.example` è fra gli account demo di default: «Dati dimostrativi» nei due menu.
- [x] Atteso del ruolo cercato (`expectedSoft`): Federico Longo 90%, Davide Longo 95%, Francesca Gallo 98% su
      Coordinatore amministrativo. Prima Federico e Davide davano 95%, ognuno sul proprio atteso.
- [x] Dove intervenire: L'impatto usa lo stesso numero della frase (11 su 25 = 44%; con 10 su 23 sarebbe 43%).
- [x] Etichette «01 · Rendimento» sopra i titoli; titoli di sezione H3 misurati 24px/600, −0,36px, in tutte e
      sette le pagine; numero in `muted-foreground`. Testi «Perché è importante» di CLAUDE.md nelle quattro pagine.
- [x] Il valore: due sezioni; Gauge, barre, Ring, L'impatto dentro la 1. Le perdite: ottenuto, atteso 7,0
      tratteggiato, scarto in fondo alla barra. Il potenziale e Le perdite senza suggerimento né approfondimenti.
- [x] Intervista: si passa avanti senza rispondere (provato su domande vuote, nessun errore). «Senza risposta» nel
      riepilogo, provato con una risposta simulata del server, senza salvare.
- [x] Dati aziendali prima sezione dell'Intervista, voce tolta dal menu; `/assessment/company` e «Vai a Dati
      aziendali» portano lì (provati).
- [x] Panoramica: testo «In attesa dei dati di bilancio» senza bilancio (risposta simulata); con il bilancio
      importi veri dove il motore li ha, segnaposto altrove. Una sola chiamata alla società invece di tre; il
      codice della pagina parte prima dei dati.
- [x] Tempi su build di produzione in locale, dal via al contenuto: 804–1111ms (tre prove), prima 1564ms (una
      prova). **In produzione non misurato**: i 5 secondi si misurano lì.
- [x] 390px senza barra di scorrimento che occupa spazio, come su un telefono: Il valore senza scorrimento laterale.
      Con la barra di un browser desktop a 390px restano 6px sulle quattro pagine provate (Il valore, Le perdite,
      Intervista, Panoramica), dalla barra superiore del guscio, non da queste pagine. Controlli: typecheck, lint (0 errori), build, test
      ROI 6/6, audit senza difetti.
- [ ] Non fatto: Recruiting delle Decisioni del 2026-11-06 (home, sezioni, menu, Competenze trasversali, profilo per
      posizione) e «Grafici aggregati»: fuori dalla Parte A richiesta.
- [ ] Non provato: Valutazione e Report, stato senza test completati, salvataggio vero di un'intervista con domande
      saltate, modalità chiara delle pagine nuove (provate in scura).
- [ ] Il punteggio in cima al report dell'Intervista conta anche le domande saltate, con il valore di partenza.

## 2026-11-05 (5) — Area valutatori: campi più corti
Solo in locale, non pubblicato (richiesta di Bilal, con screenshot).
- [x] Regola unica `FIELD_WIDTHS` (`components/patterns/field-widths.ts`): testo, email, password e
      tendine 384px, data, ora e numeri 176px, testo lungo 768px. Le card esterne non cambiano.
- [x] Applicata a Intervista, Valutazione e Report (pagina e schede nel dialog), Prossimi colloqui,
      Candidati al podio. Le altre pagine di Recruiting non sono toccate.
- [x] Provato: scheda Intervista nel dialog (384 e 176), Prossimi colloqui (data 170, note 371).
- [~] Riga «Nome valutatore / Email»: provata con una copia temporanea nella pagina (371px sulla stessa
      riga; senza la regola 1426px, una per riga), perché compare solo con una posizione collegata a una
      campagna del backend, e quella attiva non lo è. Da guardare sulla riga vera.
- [x] Controlli: typecheck, lint (0 errori), build, audit senza difetti.
- [ ] Non provato: schede Valutazione e Report aperte, telefono, modalità scura.
- [ ] Visto, non toccato: in quella pagina il sovratitolo dice «Senior Frontend Engineer» e il pannello
      «Account Manager · posizione dimostrativa»: sembrano due posizioni attive diverse. Da controllare.

## 2026-11-05 (4) — Rilascio dei sei punti: pubblicato, verifica in produzione da fare
Commit `769d789` su `main` e `server-only`. Deploy «zesty-victory / production»: Backend e Skill
Vision riusciti (stato GitHub `success`). Nuovo bundle servito (`index-BVj9tkQr.js`), `/health` 200.
**Migrazioni: nessuna in questo rilascio**, nessun file di `backend/` è cambiato. L'ultima resta
`20261104180000_assessment_roi`, del rilascio precedente.

Stato dei sei punti, secondo CLAUDE.md §9. Controllo locale di Bilal: completato. La richiesta di
segnarli «completati» non è applicata: §9 vuole la prova da loggati in produzione, che non c'è.
La numerazione viene dalle richieste di Bilal: l'elenco originale di Alessio non è nel repository.

| Punto | Stato | Provato in produzione |
|---|---|---|
| 1 · Confronti ed elenchi | pubblicato | testi nel bundle; **non fatto** da loggati |
| 2 · Menu di Recruiting | pubblicato | **non fatto** da loggati |
| 3 · Dati demo e strumenti in Amministrazione | pubblicato | testi nel bundle; **non fatto** da loggati |
| 4 · Testi del piede e di Dove intervenire | pubblicato | testi nel bundle; **non fatto** da loggati |
| 5 · Formula e pagina Il valore | pubblicato | testi nel bundle; **non fatto** da loggati |
| 6 · Home senza filigrana | pubblicato | **non fatto** da loggati |

- [ ] **Non fatto: prova da loggati in produzione.** Motivo: nessuna sessione nel browser di
      lavoro e nessuna credenziale di produzione. Serve l'account demo, o lo fa Bilal.
- [ ] Da controllare al primo accesso di demo@skill-vision.it: la posizione dimostrativa si crea da sola.
- [ ] **Si è rotto:** il deploy di `d519e84` (solo documenti) è fallito per il servizio Skill Vision dopo
      circa 22 secondi; il Backend è riuscito. Causa non vista: qui non ci sono i log di Railway. In
      produzione resta il bundle di `769d789`, che risponde. Il commit di questa nota è un nuovo
      tentativo: l'esito è nello stato GitHub del commit. Su Railway `VITE_DEMO_MODE` risulta `true`
      nel bundle: va tolta prima del primo cliente (Fase 8).

## 2026-11-05 (3) — Vecchio confronto via anche dalle professionali, strumenti demo in un posto solo
Solo in locale: nessun commit, nessun push (richiesta di Bilal).
- [x] Tolta la scheda «Confronto (fino a 5)» da Competenze professionali, con `MatchCell`, `MatchLegend`
      e `matchCellClasses`, che nessun altro usava. Provato: tre schede, `?view=match` apre la vista
      predefinita. Aggiunto «Confronta persone» anche lì: senza, la pagina non portava al confronto.
- [x] «Ripristina demo» fuori dal menu di Assessment, «Usa un bilancio dimostrativo» fuori da Dati
      aziendali: stanno in Amministrazione → Dati dimostrativi (`AssessmentDemoTools`). Nel menu di
      Assessment una voce che porta lì, solo account demo.
- [x] Provato con `hr@acme.example` (account demo in locale): voce nel menu, pagina con le due sezioni.
      Bilancio: conferma, «Dati salvati.», nel database cambia solo `loadedAt` (era già lo stesso).
- [x] Provato con `recruiter@acme.example`: nessuna voce, nessun pulsante, indirizzo rimandato al
      Profilo della ricerca. In Dati aziendali resta «Carica il bilancio».
- [ ] **Ripristina demo: non eseguito fino in fondo.** Conferma e chiamata provate: il server risponde
      «Il reset è ammesso solo per una società demo», perché in locale `ASSESSMENT_DEMO_COMPANY_IDS` non
      c'è. Dipendenti invariati (26). Volutamente non impostata: il ripristino cancellerebbe i dati
      Assessment locali.
- [x] Controlli: audit senza difetti, typecheck, lint (0 errori), build, test ROI 6/6.
- [ ] Non fatto: verifica in produzione, commit, push. Non provato: pagina admin a 390px e in chiaro.

## 2026-11-05 (2) — Confronti, menu di Recruiting, dati dimostrativi automatici
Solo in locale: nessun commit, nessun push (richiesta di Bilal).
- [x] «Cambia» e «+ Aggiungi» avevano l'elenco vuoto: la pagina passava `SelectItem`, `SelectField`
      legge solo `<option>`. Provato: 23 persone di 13 mansioni nell'elenco.
- [x] Il ruolo del titolo resta cambiando le persone (`?ruolo=`). Provato: scelta Elisa Costa,
      titolo sempre «Coordinatore amministrativo», lei «candidatura interna».
- [x] Selettore «Competenze del ruolo / Tutte»: una sola voce lime. La causa era il lime al passaggio
      del mouse, in `ToggleGroup`: corretto per tutti i selettori. Provato con mouse sull'altra voce.
- [x] Numeri di posizione nella classifica anche nel confronto a 2.
- [x] Tooltip: punti del radar, punti delle righe, barre della classifica, caselle della heatmap,
      barre per area. Provati uno per uno («Francesca Gallo · Autocontrollo: 7 su 10»).
- [x] Tolta la scheda «Confronto (fino a 5)» e la sua tabella da Risultati valutazioni trasversali.
      `?view=match` apre la vista predefinita. La stessa scheda resta nelle Competenze professionali.
- [x] Telefono: lo scorrimento laterale del confronto è sparito (fix in `ChartDataTable`, vale per
      tutti i grafici). Provato a 390px reali, confronto a 2 e a 3.
- [x] Menu di Recruiting: titoli dei livelli come voci, con freccia, attivi sulla pagina dei
      risultati; i nomi lunghi vanno a capo. Provato in chiaro, scuro e nel pannello da telefono.
- [x] «Carica dati dimostrativi» fuori dal menu. Pagina Amministrazione → Dati dimostrativi, solo
      account demo. Provato: account demo la apre e ripristina; `recruiter@acme.example` non vede la
      voce e l'indirizzo rimanda al Profilo della ricerca.
- [x] Dati dimostrativi di Recruiting automatici. Provato: Acme locale senza posizione demo → aperta
      Recruiting → 12 candidati nel database, imbuto 12 · 9 · 7 · 3 · 1, un colloquio in programma.
- [x] Build di produzione senza `VITE_DEMO_MODE`: nessuna scrittura (versioni dei documenti invariate),
      nessuna voce, indirizzo rimandato. Nessun file del backend toccato.
- [x] Controlli: typecheck, lint (0 errori, 1 avviso nuovo dello stesso tipo in `RecruitingLayout`),
      build, test ROI 6/6, audit senza difetti.
- [ ] Non provato: confronto a 4 e 5 persone, stati vuoti, tocco su telefono vero, Chi scegliamo letta
      riga per riga (aperta, voce attiva giusta).
- [ ] Non fatto: verifica in produzione, commit, push.
- [ ] Rotto da me: `rm -f .playwright-mcp/*.png` ha cancellato anche gli screenshot di sessioni
      precedenti (fra cui `users-create-errors`, `users-created`, `users-created2`, `users-list`,
      `users-list2`). Cartella non tracciata da git: non recuperabili. Nessun documento li citava.
- [ ] Locale cambiato: Acme ha la posizione dimostrativa; `.env.local` ha `VITE_DEMO_ACCOUNTS`.

## 2026-11-05 — Formula di Roberto, «Il valore», Home senza filigrana, testi
- [x] Home di Assessment: tolto il numero in filigrana, resta l'etichetta («01 · Rendimento»).
      Tolto anche il token `--text-watermark`, non più usato.
- [x] Formula: somma rilevati ÷ somma attesi × 100 (`role-index.ts`), valori esatti nel calcolo,
      interi a schermo («80%», «−20%»). Provata su numeri scritti a mano: 13/14 = 92,86 (la media
      dei rapporti darebbe 100); 18/14 = 128,57 senza errori.
- [x] Nomi: «Valore espresso rispetto al ruolo» e «Gap di adeguatezza» ovunque, confronti compresi;
      nessun «indice» a schermo su Pagine dei risultati e Confronto.
- [x] «Il valore» completa: quattro riquadri, distribuzione per fascia, criticità, euro,
      suggerimento. Niente più «Contenuto in preparazione».
- [x] Motore ROI: dai risultati solo valore %, gap medio %, copertura ruoli %. **Gli euro cambiano**
      (Acme in locale, «Il valore», Completo: circa € 352.000 stimati prima, € 578.249 ora).
- [x] Piede delle quattro pagine di Assessment e riga dell'opportunità di Dove intervenire con i
      testi chiesti; tabella del grafico «Fascia e piano di sviluppo».
- [x] Controlli: typecheck, lint (0 errori), build, test ROI 6/6, audit senza difetti.
- [x] Provato **in locale** con Acme: selettore CT / CP / Completo (73% · 89% · 80%, euro che
      cambiano), «Come è calcolato», tooltip al passaggio del mouse, chiaro e scuro, 390px su
      Il valore, Home, Dove intervenire.
- [ ] **Non fatto: verifica in produzione**, commit e push. Quindi per CLAUDE.md §9 non è «fatto».
- [ ] Non provato: stato vuoto senza test completati (Acme ha dati), selezione del confronto a 3–5.
- [ ] Trovato, non toccato: Confronto a 390px scorre di lato di 68px (tabella per lettori di schermo
      in `ProfileRadar`); Panoramica, 184 errori in console per `<rect>` con larghezza negativa.
- [ ] Da decidere: vedi DECISIONI, «Formula di Roberto e Il valore · 2026-11-05».
- [ ] CLAUDE.md non è stato modificato e dice ancora «numero grande in filigrana» e, per Il valore,
      «in attesa di Roberto». La sezione «Verifica in produzione del 2026-11-05» citata nella
      richiesta non c'è: fanno fede i testi della richiesta di Bilal.

## 2026-11-04 (6) — Schermate allineate alle tavole
- [x] Tavole salvate in memoria confrontate con le schermate, in chiaro.
- [x] Selettori: voce scelta lime in tutti i ToggleGroup (era neutra).
- [x] Menu: «Dati dimostrativi» sotto la società. Le icone restano (Bilal, 2026-11-04: le avevo
      tolte per seguire le tavole; non era richiesto).
- [x] Home: niente sovratitolo. Il numero in filigrana resta com'era (Bilal, 2026-11-04: la
      versione più grande copriva i testi); ora non copre più il sottotitolo.
- [x] Le perdite invisibili: «Cinque aree», barre sottili con nomi a sinistra (`compact` di
      `CategoryBars`, anche in Sintesi), nessun «Apri» nei riquadri.
- [x] Dove intervenire: grafico in una card con «Fascia» e «Piano di sviluppo», valori in mono.
      Su telefono il grafico scorre dentro la card: la pagina scorreva di lato, in produzione.
- [x] Confronto a 2: due schede persona con iniziali, forma scritta e «Cambia»
      (`ComparePersonCard`), frase coi nomi di battesimo, radar rotondo con 5 e 10.
- [x] Confronto fino a 5: posizione in classifica, «Tutti», «+ Aggiungi», `AreaBars`, heatmap con
      intestazioni piene, colori più intensi e casella del valore più alto.
- [x] Profilo della ricerca: filo e testo scuro sui verbi.
- [x] Senza persone scelte, il confronto parte dalle prime due della stessa mansione.
- [ ] Scostamenti voluti dalle tavole: vedi DECISIONI, «Tavole: dove vale il testo».
- [ ] Non rilasciato.

## 2026-11-04 (5) — Pagine che non si aprivano, pillola del menu, Stato dell'arte
- [x] Pagine lente: togliendo il rimontaggio a ogni pagina (`ErrorBoundary`, Fase 1, in
      produzione da 73c2965) ha cominciato a funzionare davvero l'uscita di `ViewTransition`,
      che fa aspettare la pagina nuova. Misurato sulle build di produzione: circa 550ms per
      pagina prima, circa 120ms ora. **Nessun blocco vero:** in sessione avevo scritto che
      la pagina restava ferma; era la lentezza del server di sviluppo. Dieci raffiche di clic:
      nessuna pagina mancata, né prima né dopo.
- [ ] Con otto clic in 0,3 secondi e la CPU rallentata 6× ora si può attendere di più (fino a
      9s contro 5s): ogni pagina intermedia si disegna. Non è un uso normale; lasciato.
- [x] Pillola del menu fuori posto: la pillola viaggiava da una voce all'altra dentro il menu
      che scorre, e passava sopra le altre voci; il menu saltava anche di posizione (da 120 a
      0 durante il viaggio). Ora sta ferma sulla voce attiva; tolti `LayoutGroup` e
      `layoutScroll`. Un blocco permanente come nello screenshot di Bilal non l'ho riprodotto:
      solo il viaggio di circa 300ms.
- [x] Stato dell'arte: non era rotta, rimandava alla Panoramica dal 2026-10-23. Pagina
      ripristinata com'era (`bb565c1^`), «Skill-Vision» col trattino. Era una domanda
      aperta in questo registro: la risposta è la segnalazione di Bilal e CLAUDE.md.
- [x] Verificato in locale: le 46 voci del menu dei due moduli aprono la pagina giusta;
      pillola a 0px dalla voce e menu fermo anche a menu scorso. Sulla build di produzione:
      tempi e Stato dell'arte.

## 2026-11-04 (4) — Verifica finale e risposte per Alessio
- [x] `node scripts/audit-identita.mjs`: nessun difetto.
- [x] «Original Skills» a schermo: nessuno. Restano solo nomi nel codice, variabili e
      documenti interni; i messaggi del backend dicono «Comitato scientifico».
- [x] «Skill-Vision»: a schermo sempre col trattino. Restano nomi di componenti, un
      commento in `globals.css` e una chiave del lettore del bilancio
      («investimento skill vision»), che serve a riconoscere i file.
- [x] «Recuperare» per i soldi: nessuno. Un solo uso a schermo, un errore tecnico che
      non parla di denaro: riscritto in «ritrovarne il riferimento».
- [ ] **Manager: la verifica non passa.** Compaiono in tutti gli elenchi e le
      classifiche (per esempio Capo linea, Responsabile assistenza clienti). Il
      criterio per riconoscerli non c'è (`ruolo` arriva vuoto dall'API, `tipo
      candidatura` distingue solo candidato e dipendente): CLAUDE.md dice di non
      inventarlo e di aspettare Roberto. Nessuna frase dice che sono esclusi: giusto.
- [x] Pagine tecniche e algoritmi: `calculations`, `role-change`, `role-census`,
      `scoring` e l'integrazione Original Skills invariati dal 2026-11-01. Nelle pagine
      tecniche solo aggiunte e testi: pulsante del confronto, sezione del bilancio, nome
      della mansione, etichetta del colloquio.
- [ ] **Trovato, non corretto:** le parole bandite restano in pagine tecniche
      («soluzioni interne» in Cambio ruolo, «Valorizzare» in testi e nomi di fascia). La
      scala /31 di Recruiting è ancora a schermo (risposte 4 in DECISIONI).
- [x] Risposte alle cinque domande: DECISIONI, «Risposte per Alessio».
- [x] `tsc -b`, oxlint, build, audit. Backend non toccato in questa modifica.
- [ ] Non rilasciato: la verifica e le Fasi 3–4 non sono ancora nel commit.

## 2026-11-04 (3) — Home, confronti, indice a 100, grafico a flussi, motore ROI
- [x] Rilasciate prima le correzioni della verifica (113ab93, su `main`).
- [x] Home di Assessment sulla tavola «Home · senza dati»: quattro finestre a tutta
      altezza, etichetta con numero e tema, numero in filigrana, nessun dato. Al
      passaggio del mouse solo fondo e bordo; dissolvenza all'apertura, nessuna con
      «riduci movimento». Le card di Recruiting non cambiano.
- [x] Confronto fra persone, nuova pagina `/assessment/confronto?ids=`, con il
      pulsante «Confronta persone» in Valutazioni trasversali. A due: classifica,
      righe con cerchio e rombo, selettore ruolo / tutte, radar ambra e magenta. Da
      tre a cinque: classifica, radar, barre per area, heatmap delle 35. Clic su un
      nome: resta in evidenza, gli altri si attenuano.
- [x] Pattern nuovi, nel catalogo: `RoleFitRanking`, `CompetencyRows`,
      `CompetencyHeatmap`, `FlowChart`. `ProfileRadar` con colore e rombo per serie.
- [x] Indice a 100 (`lib/role-index.ts`) e tooltip con il testo di Roberto nelle
      quattro pagine dei risultati; negli elenchi di persone l'indice al posto del
      punteggio su 10. **Non in Home**, che non ha dati.
- [x] Scala 1–10 e complessivo: già così nel codice (`primaryScore`, media 50/50).
      Nessuna conversione da togliere e nessun «in attesa» per la scala: resta solo
      «in attesa delle prime valutazioni», che è vero.
- [x] Dove intervenire: Sankey di Bklit (d3-sankey, dipendenza nuova, DECISIONI) dalle
      cinque fasce a colloquio / nessun intervento, con i numeri sui flussi.
      Corretta l'etichetta inglese di Bklit («0 sessions»).
- [x] Motore ROI (`lib/roi/`): stesse formule di Skill-Vision-ROI, `npm test` nel
      frontend con i valori di riferimento dei suoi test (6 passati). Scenari,
      blocchi, annualizzazione. Dati in Dati aziendali, sul server (`AssessmentRoi`,
      migrazione `20261104180000_assessment_roi`).
- [x] Atteso fissato una volta dopo la prima misurazione: a schermo solo il valore;
      data, criterio e autore sul server; un secondo tentativo riceve 409.
- [x] Cifre in euro su Il valore, Le perdite invisibili, Il potenziale, Dove
      intervenire, con etichette del motore, «Gli importi non si sommano» e «Come è
      calcolato». Senza bilancio il segnaposto, con il motivo.
- [x] **Sottofattori: il blocco non c'è.** Né l'integrazione con Original Skills né
      il modello di Assessment hanno i valori (ci sono solo i nomi, `BF_SUB`, come
      etichette in Profilo della ricerca e Competenze Trasversali). Regola di
      CLAUDE.md: se non ci sono, non si mostra e si dice.
- [x] **Risposta alla domanda in CLAUDE.md sui conteggi 5 · 4 · 2 · 0:** vengono dalla
      fascia (`INTERVENTI` in `lib/results.ts`: Da potenziare → Formazione, Alto
      potenziale → Coaching, Critici → Riorganizzazione, Alto valore → Talento), non da
      un dato per persona. Per persona esistono solo testi liberi nel piano di sviluppo
      e l'interruttore del colloquio.
- [x] Verificato nel browser in locale, in chiaro e in scuro, con il bilancio
      dimostrativo; un esercizio di 6 mesi raddoppia gli importi e lo dice. Test
      backend `assessment`: 36 passati (4 nuovi). `tsc -b`, oxlint, build, audit.
- [ ] Sintesi della Panoramica: gli euro restano segnaposto (non è una pagina dei
      risultati e i passi della cascata non corrispondono alle leve). Da decidere.
- [ ] Non verificato: il caricamento di un file vero di Credit Save, che non abbiamo.
      Provati solo il formato chiave / valore (test) e il bilancio dimostrativo.
- [ ] Non verificato a schermo: confronti e cifre per chi ha il ruolo di sola lettura.
- [ ] Le quattro cifre leggono la vista CT / CP / Completo: cambiano con il selettore.
- [ ] Non rilasciato: queste modifiche non sono ancora nel commit.

## 2026-11-04 (2) — Correzioni della verifica in produzione del 2026-11-02, dati dimostrativi di Recruiting
- [x] Rilasciato prima il selettore CT / CP / Completo (73c2965, su `main`).
- [x] Tema scuro: `chart-mono` `neutral-400`, `chart-reference` `neutral-200`.
- [x] Menu di Assessment: Home è un gruppo con le quattro pagine dei risultati,
      voce attiva accesa; si apre e chiude con la freccia (`SidebarMenuAction`,
      nuova nella primitiva). Il titolo apre la home.
- [x] Menu di Recruiting: il titolo del livello apre la pagina dei risultati ed è
      acceso quando è aperta; lo stesso livello nella riga del percorso.
- [x] «Le perdite invisibili» con i testi di CLAUDE.md. La frase del punto 4 usa
      la mansione più lontana **dentro** l'area più lontana (`worstRoleInArea`).
- [x] «Dove intervenire»: «[tipo] riguarda [N] persone su [totale]: un solo
      programma le segue tutte.»
- [x] Etichette dei riquadri neutre: tolta la prop `tone` di `ResultsIssue`.
- [x] Nelle pagine che elencano persone la mansione è il nome (`ruolo`), non la
      descrizione: Panoramica, Il potenziale, Valori complessivi, Cambio ruolo.
- [x] «Colloquio di restituzione necessario» solo a interruttore acceso; spento
      dice «Nessun colloquio di restituzione previsto» (Piani di sviluppo e scheda).
- [x] Codici delle competenze: **non ho riprodotto «ma1» a schermo.** Controllati
      le 21 pagine di Assessment, le pagine di Recruiting, scheda persona, cambio
      ruolo, assistente, comitato scientifico (nessun codice). Trovato e chiuso un
      solo punto che poteva mostrarlo: il ripiego di `competencyName` in Customer
      Care. Da riscontrare con Alessio: su quale pagina l'ha visto?
- [x] Assistente IA: risponde sulla posizione attiva e sui suoi candidati, non
      sull'archivio. Il profilo di riferimento dei punteggi resta `DEFAULT_ROLE`.
- [x] Sintesi, riquadro 01: Area con atteso tratteggiato e valore di oggi in lime
      (`TrendChart` `variant="compact"`, `markLast`).
- [x] **Rotto da prima:** i dati di prova di Assessment non avevano storico, quindi
      l'andamento non poteva comparire. `addDemoHistory`: sei mesi passati, solo nei
      dati di prova. Si vede **dopo «Ripristina demo»**. Verificato senza scrivere
      niente: import in prova (23 dipendenti, nessuno scartato) e risposta del server
      intercettata nel browser.
- [x] Dati dimostrativi di Recruiting (`lib/demo-data.ts`, `RecruitingDemoEntry`):
      posizione «Account Manager · posizione dimostrativa» in Acme, 12 candidati
      inventati, cinque stati, 5 test completati e 2 in attesa, 3 finalisti, 1
      colloquio in programma. Solo con un clic, in demo, su Acme, per chi può
      scrivere. **Non caricati in produzione**, nessun seed.
- [x] Verificato nel browser in locale, chiaro e scuro. `tsc -b`, oxlint, `vite
      build`, audit a 0. Backend non toccato in questa modifica.
- [ ] Non verificato a schermo: la voce nascosta a chi non può scrivere.
- [ ] `<rect> width` negativo in console (animazione delle barre): c'era già. Le
      barre finiscono giuste; è rumore da togliere a parte.
- [ ] Non rilasciato: queste modifiche non sono ancora nel commit.

## 2026-11-04 — Selettore CT / CP / Completo ripristinato in tutto Assessment
- [x] Cronologia: prima del rilascio stava nelle azioni dell'intestazione, a
      destra del titolo (`useTopbarActions` → `PageHeader`), solo in Panoramica.
      Stessa posizione, ora su ogni pagina: `AssessmentModeSwitch` nel layout,
      nella Home, nelle quattro pagine dei risultati (prop `actions` di
      `ResultsPage`) e nella Panoramica.
- [x] Pacchetto acquistato: non esisteva nei dati. Nuova colonna
      `Company.assessmentPackage` (migrazione
      `20261104120000_company_assessment_package`, default Completo: nessuna
      società cambia), `PUT /companies/:id/assessment-package` solo per lo staff,
      scheda Impostazioni → Pacchetti. Con un solo pacchetto il selettore mostra
      solo quello e il server non accetta altre viste (DECISIONI).
- [x] **Rotto da prima, trovato verificando:** scelto CT e cambiata pagina, il
      selettore tornava indietro. `ErrorBoundary` in cima all'app aveva
      `key={pathname}`: a ogni pagina si rimontava tutta l'app, e Assessment
      ripartiva dalla cache di React Query, mai aggiornata dopo i salvataggi
      (`staleTime: Infinity`). Valeva per **ogni** modifica di Assessment, non
      solo per il selettore: a schermo tornava indietro fino al ricaricamento,
      sul server era salvata. Corretto: l'errore si azzera con una prop, e dopo
      ogni salvataggio la cache segue il server (DECISIONI).
- [x] Chi legge soltanto: la scelta resta mentre naviga e alla rilettura dal
      server; non viene salvata (cambiando modulo torna a quella della società).
- [x] Verificato nel browser (locale): 21 pagine con la stessa scelta; scelta e
      cambio pagina subito; Recruiting e ritorno; ricaricamento; pacchetto solo CP
      (una voce sola, anche dopo il ricaricamento) e ritorno a Completo; chiaro,
      scuro e 390px senza scorrimento orizzontale; Recruiting si apre e naviga.
      La verifica del ruolo «sola lettura» non è stata fatta a schermo.
- [x] `tsc -b` (frontend e backend), oxlint, `vite build`, audit a 0; test backend
      `assessment`, `users`, `protected-routes`: 49 passati (4 nuovi sui pacchetti).
- [ ] Non toccato: `<rect> width` negativo in console (animazione dei grafici a
      barre), c'era già prima di questa modifica.
- [ ] Non toccato: la voce scelta del ToggleGroup è neutra (`accent`), mentre
      CLAUDE.md e le tavole la vogliono lime. Vale per tutti i ToggleGroup: da
      decidere a parte.

## 2026-11-03 — Primo accesso con password provvisoria
- [x] Backend: colonna `mustChangePassword` (migrazione
      `20261103180000_user_must_change_password`). Password del nuovo utente
      facoltativa: vuota, la genera il server e la restituisce una volta.
      Ogni password data a un altro utente è provvisoria; la propria no.
- [x] `requireAuth`: con password provvisoria solo /auth/me, /me/password e
      /me/preferences; il resto 403 `password_change_required`.
- [x] `POST /auth/me/password` (attuale + nuova): salva, toglie il flag,
      chiude le altre sessioni, restituisce token nuovi per questa.
- [x] Frontend: pattern `NewPasswordForm` (nel catalogo), pagina
      `FirstAccessPage` mostrata da AuthGuard; in Utenti il campo password è
      facoltativo, dopo la creazione si vedono i dati di accesso con «Copia»,
      badge «Primo accesso». Regole della password in `lib/auth/passwordRules.ts`.
- [x] Test: 2 nuovi in `tests/users.test.ts` (10 su 10). Provato in locale:
      utente creato senza password → accesso con la provvisoria → scelta
      della password → dentro; la provvisoria non vale più.

## 2026-11-03 — Gestione utenti dalle Impostazioni
- [x] Backend: `/api/v1/users` (solo PLATFORM_ADMIN): elenco senza hash,
      creazione, modifica (nome, email, nome utente, mansione, ruolo,
      società, stato), nuova password. Regole della password in
      `lib/password.ts`, condivise con `scripts/create-team-admin.ts`.
- [x] Migrazione `20261103120000_user_admin_fields`: colonne `username`
      (unico, facoltativo), `designation`, `sessionVersion`. Solo colonne
      nuove; su Railway la applica il preDeployCommand.
- [x] Uscita immediata: `sessionVersion` nel token d'accesso, confrontata in
      `requireAuth` a ogni richiesta (una lettura per chiave primaria).
      Cambio di password, ruolo, società o stato → versione +1 e refresh
      token revocati. Anche per chi cambia la propria password. Il frontend
      controlla `/auth/me` ogni 30 s, così anche una pagina ferma esce.
      I token emessi prima del deploy valgono come versione 0: nessuno esce
      al rilascio.
- [x] Login con email **o** nome utente (`LoginForm`: «Email o nome utente»).
- [x] Frontend: scheda «Utenti» in `SettingsDialog` (slot `users`, la
      Topbar la passa solo al PLATFORM_ADMIN); `layouts/UsersSettings.tsx`;
      pattern nuovo `PasswordInput` (in `LINKABLE` di Field, nel catalogo).
      L'elenco si aggiorna da solo ogni 10 s.
- [x] Verifica: 171 test backend verdi (8 nuovi in `tests/users.test.ts`);
      tsc e oxlint puliti; audit identità a zero. Nel browser (scuro):
      creato un utente, entrato col nome utente, cambiata la sua password →
      la sua sessione aperta riceve 401 subito; cambiata la propria → torna
      a `/login`. Dati locali riportati com'erano.
- [ ] Da verificare in chiaro a occhio; non provato su Railway.
- Rotto e corretto durante il lavoro: `protected-routes.test.ts` riconosce
  la protezione solo se scritta `usersRouter.use(requireAuth)` da sola.

## 2026-11-01 — Pagine sulle tavole del cliente
- [x] Pagine dei risultati (sette), Home di Assessment, Profilo della ricerca e
      Sintesi della Panoramica ridisegnate sulle tavole; tolta la larghezza
      massima che lasciava metà schermo vuota.
- [x] Scala del sito per le pagine di presentazione; pattern nuovi
      `SummaryCard`, `CascadePlaceholder`; `ActionList` numerato con totale,
      `BandCard` senza cornice, `PageHeader level="presentation"`.
- [x] tsc, oxlint (nessun avviso nuovo), build, audit (0).
- [ ] Non fatto: punto lime a fine andamento; menu di Assessment della
      tavola (da confermare). Non verificato a schermo: chiaro, scuro, mobile.

## 2026-11-01 — Verifica finale (Fase 7) e risposte del resoconto
- [x] Audit identità dell'intero repository: **0 difetti** (erano 15, tutti
      nelle email). Email sulla palette, esenzione riga per riga
      `audit-identita:email` (DECISIONI), bottoni in minuscolo, pesi 600.
- [x] "Skill-Vision" con il trattino in tutti i testi a schermo e nelle email.
- [x] Verificati: nessun "Original Skills" a schermo, nessun "recuperare" per
      i soldi, nessuna cifra in euro calcolata.
- [x] Manager: nessun campo che li distingua (né Anagrafica né Original
      Skills); nessun filtro inventato.
- [x] Le nove risposte in DECISIONI ("Fase 7 — verifica finale").
- [x] tsc frontend e backend, oxlint (nessun avviso nuovo), build; test delle
      email del backend (8 su 8).
- [ ] Suite completa del backend: 22 test passati, 141 falliti in 16 file per
      "Can't reach database server at localhost:5432" (database locale spento,
      verificato su emailConfig). I test senza database, email comprese,
      passano. Da rilanciare con il database acceso.
- [ ] Contrasto reale e verifica a occhio, chiaro e scuro: da fare con il
      browser (nessuno in questa sessione).

## 2026-11-01 — Grafici sulle nuove regole, Panoramiche, riga del percorso
- [x] Grafici: riferimento tratteggiato sulle barre (`BarReference`, nuovo),
      bordo della barra in evidenza (`outline` in `bar.tsx`), colori dei ruoli
      in `chart-colors`, legenda, RingStat a un anello, Area e dissolvenza di
      Bklit in TrendChart, variante sparkline. Tutti gli "Ottenuto / Atteso"
      passano a una barra con l'atteso tratteggiato.
- [x] Panoramica Assessment: Sintesi / Dettaglio; Dettaglio con 4 card per
      riga, Gauge con benchmark e sparkline, andamento ad area in inchiostro,
      "Da fare adesso" senza le azioni di sviluppo (spostate, con le note, in
      Sintesi).
- [x] Panoramica Recruiting: posizione attiva / tutte le posizioni aperte,
      Stato attuale con gli anelli, Da fare adesso, In programma, Dove guardare.
- [x] Riga del percorso su tutte le pagine di lavoro dei due moduli
      (`PageBreadcrumb`, nel catalogo).
- [x] tsc, oxlint (nessun avviso nuovo), build, audit identità (`frontend/src` 0).
- [ ] Non verificato a schermo (nessun browser in questa sessione): i grafici
      a barre con il segno tratteggiato, la barra in evidenza in chiaro, le
      due Panoramiche, la riga del percorso — chiaro, scuro, mobile.

## 2026-11-01 — Le due home e le sette pagine dei risultati
- [x] Assessment: Home prima voce ("Quello che devi sapere", quattro finestre
      2×2, senza numeri né grafici), Panoramica seconda (`/assessment/panoramica`).
- [x] Recruiting: Profilo della ricerca con Società · Campagna · CIP in alto,
      titolo e sottotitolo, tre card con le frecce verso le pagine dei
      risultati; niente esito, niente "Report AI", niente numeri.
- [x] Pattern `ResultsPage`, `WindowCard`, `InfoTip`, primitiva `Breadcrumb`;
      `CategoryBars highlight`, `CompletionRing center`. Tutti nel catalogo.
- [x] Sette pagine: Il valore (scheletro, «Contenuto in preparazione»), Le
      perdite invisibili, Il potenziale, Dove intervenire; Chi cerchiamo?,
      Chi è più adatto?, Chi scegliamo?. Frasi e quote dai dati, cinque fasce,
      «Nessuno oggi.», euro «€ [—] · In attesa della formula», stato vuoto
      senza test, riga dei dati dimostrativi, ⓘ sulle quote.
- [x] Incongruenza 10 / 23 dei colloqui di restituzione: era l'etichetta
      dell'interruttore, il numero è 10 (DECISIONI).
- [x] tsc, oxlint (nessun avviso nuovo), build, audit identità (`frontend/src` 0).
- [ ] **Testi provvisori** di «Le perdite invisibili»: la tavola non è nel
      repository, da confrontare.
- [ ] Bordo scuro della barra in evidenza (`chart-highlight-stroke`): Bklit
      non lo ha (DECISIONI).
- [ ] Riga del percorso sulle pagine tecniche (CLAUDE.md la vuole su ogni pagina).
- [ ] Non verificato a schermo (Playwright non collegato): le nove schermate
      nuove in chiaro e scuro, mobile, ⓘ da tastiera.

## 2026-11-01 — Menu di Recruiting a livelli, stati della candidatura
- [x] Menu come la tabella di CLAUDE.md: Profilo della ricerca (ingresso di
      `/recruiting`), Panoramica (`/recruiting/panoramica`), quattro livelli
      con la pagina principale in testa e il titolo cliccabile, Strumenti,
      Amministrazione. Una voce accesa sola. Valutatore: solo le tre schede.
- [x] Bloccati, toccato solo il menu: Migliori candidati → `/pagina-a`,
      Classifica dopo il test, Imbuto in L2 e L3 sulla stessa pagina.
- [x] Imbuto, Profilo della ricerca, Panoramica e CSV sui cinque stati
      (Candidatura acquisita → … → Selezione conclusa); esito scritto a parte
      (solo Assunto ha un dato).
- [x] Nomi a schermo "CV elaborati", titolo di Profilo candidato; via
      "Original Skills" da due testi; link "Dettaglio" dell'Imbuto.
- [x] Già fatti prima (verificato): competenze trasversali dentro Profilo
      candidato, Colloqui e Candidato vincitore fuori da CV elaborati, Import
      massivo tolto, "Posizioni aperte" fuori dal menu, nessun "Report AI".
- [x] tsc, oxlint (nessun avviso nuovo), build, audit identità
      (`frontend/src` 0).
- [ ] **Da chiedere** (DECISIONI): link dell'annuncio al solo salvataggio
      (oggi serve «Conferma»); ripristino della pagina Stato dell'arte (oggi
      rimanda alla Panoramica); In riserva / Non selezionato (serve un dato
      nuovo); nome del quinto stato.
- [ ] Etichetta "Posizioni aperte" ancora in Panoramica e Imbuto: elenco ad
      Alessio (DECISIONI).
- [ ] Non verificato a schermo (Playwright non collegato): menu in chiaro e
      scuro, mobile, accesso da valutatore.

## 2026-11-01 — Posizione attiva solo nel Profilo; token dei grafici e barre di scorrimento
- [x] Posizione attiva: si cambia solo nel Profilo della ricerca. Altrove il
      sovratitolo di sola lettura "ACME CORP · SENIOR FRONTEND ENGINEER"
      (`ContextBar variant="inline"`, nel catalogo). Barra laterale: società
      in sola lettura. Avanzamento: card di sola lettura, posizione attiva
      scritta, link "Cambia posizione nel Profilo della ricerca". Link vecchi
      con `?companyId=&openingId=`: parametri tolti, posizione invariata.
      DECISIONI "Posizione attiva: si cambia solo nel Profilo della ricerca".
- [x] Le 56 candidature, causa tecnica: il vecchio imbuto
      (`use-recruiting-home-data.ts` prima di `bb565c1`) metteva come prima
      fase `readCandidates().length`, cioè **tutto l'archivio CV**, che non
      appartiene a nessuna posizione; le fasi dopo sommavano invece le
      pipeline delle posizioni aperte (Senior Frontend Engineer e Customer
      Care Specialist, entrambe a 0). L'archivio si classifica sull'unico
      profilo salvato, `DEFAULT_ROLE = 'Sales Account Manager'`
      (`lib/constants.ts`), ed è da lì che le 56 sembravano di quella
      posizione. Risultati e Stato dell'arte facevano lo stesso
      (`ranking(candidates)` sull'archivio intero). Corretto il 2026-10-23:
      l'imbuto conta `candidatePool` + pipeline della posizione
      (`position-funnel.ts`), Risultati ha "Questa posizione / Archivio CV".
- [ ] Resta con la stessa causa: l'Assistente IA (`lib/ask.ts`) scrive
      "Posizione: Sales Account Manager. Candidati: [archivio intero]". Non
      toccato: da decidere se legge la posizione attiva.
- [x] `globals.css`: `chart-mono` inchiostro, `chart-highlight`,
      `chart-highlight-stroke`, `chart-reference`, `chart-compare` rivisto, in
      chiaro e scuro e in `@theme inline`; `--scrollbar-thumb(-hover)` e barre
      sottili senza binario in `@layer base`, ovunque (barra laterale
      compresa). Niente `tailwind.config`: in v4 il tema è `@theme`.
- [x] tsc, oxlint (file toccati puliti), build, audit identità
      (`frontend/src` 0; i 15 del repository sono i modelli email del backend).
- [ ] Non verificato a schermo: Playwright non si collega in questa sessione.
      Da guardare in chiaro e scuro: sovratitolo, Profilo con i due
      selettori, Avanzamento, barre di scorrimento, e i grafici ora in
      inchiostro.
- [ ] Da fare grafico per grafico: lime sul valore che conta
      (`chart-highlight`) e benchmark tratteggiato (`chart-reference`).

## 2026-11-01 — Movimento, seconda parte (Instructions.md aggiornato)
- [x] `ULTRA_TAB_SPRING` e `COUNTER_SPRING` in `lib/motion.ts`.
- [x] Pillola scorrevole (`layoutId`) in Tabs, ToggleGroup (single) e barra
      laterale dei due moduli, oltre al commutatore. Tap 0,97 e
      `touch-manipulation` sulle voci.
- [x] `layouts/ViewTransition` (shell / page, PWA di lato) usato da AppShell
      e PageTransition; pannelli delle schede con entrata FAST_PAGE.
- [x] `AnimatedNumber` + `parseDisplayedNumber` (lib/format.ts): i numeri
      delle StatCard (e StatTile) salgono al valore.
- [x] StaggerList avvolge da sé i figli; StatCard e card dei grafici delle
      due Panoramiche entrano a scalare.
- [x] tsc, oxlint (nessun avviso nuovo), audit identità (`frontend/src` 0),
      audit storage. Catalogo in build: pillole nelle schede e nei gruppi,
      contatori 24→31 e 6,0→7,4, "—" fermo, chiaro e scuro.
- [ ] Le schermate vere dopo il login non verificate (backend locale
      spento). In sviluppo il catalogo scende a ~6 fps (StrictMode + strumenti
      di motion); in build 58 fps.
- Nota: le schermate di Playwright su `localhost` escono bianche con la
      pagina scorsa (zoom 80% salvato per l'host). Succede anche con il codice
      del 30/10: non è un difetto dell'app. Usare `[::1]` per le verifiche.

## 2026-10-30 — Movimento dell'interfaccia (Instructions.md)
- [x] `lib/motion.ts`: preset dello SOP (molla della pillola, modulo,
      pagina, webview, elenchi a scalare, tap 0,97). `motion` già presente,
      niente `framer-motion`. Sfocatura tolta (DECISIONI).
- [x] `ModuleSwitcher`: pillola `layoutId="activeModuleShellPill"` con
      SNAPPY_TAB_SPRING, tap, `touch-manipulation`.
- [x] `AppShell`: entrata del modulo (MODULE_SHELL_VARIANTS, in PWA
      WEB_APP_SLIDE_VARIANTS); barra superiore e laterale ferme.
- [x] `layouts/PageTransition` al posto di `<Outlet />` nei due layout
      (FAST_PAGE_VARIANTS, `mode="wait"`).
- [x] Pattern `StaggerList` / `StaggerItem`, nel catalogo ("Movimento"):
      posizioni (Avanzamento), Classifica dopo il test, Da invitare al test
      (bordo delle righe passato a `divide-y`), Cambio ruolo, sezioni APEX
      (scheda professionale e pagina del valutatore).
- [x] Button: tap 0,97, `touch-manipulation`, `select-none`.
- [x] `globals.css`: `overscroll-behavior-y: none`, regola per "riduci
      movimento"; `MotionConfig reducedMotion="user"` in App.
- [x] tsc, oxlint (nessun avviso nuovo), audit identità (`frontend/src` 0),
      audit storage puliti. Catalogo: elenco che rientra, transform a
      `none` a fine animazione.
- [ ] Non verificato nell'app vera: cambio di modulo e di pagina dopo il
      login (backend locale spento). Da guardare in chiaro e scuro, e su
      telefono.

## 2026-10-26 — Comitato scientifico: barre verticali e anelli
- [x] Pagina: anelli nelle StatCard, barre verticali (ruolo media/atteso,
      quota che raggiunge l'atteso), griglia di anelli per le 36 competenze.
- [x] Pannello della persona: anelli per competenza (punteggio + atteso,
      scarto scritto), anelli per tutte le competenze.
- [x] Nuovo pattern `RingStat`, `wrapLabels` in `BarXAxis`/`CategoryBars`,
      entrambi nel catalogo. Verificato nel catalogo in chiaro e scuro a
      larghezza reale; tsc, oxlint e i due audit puliti.
- [ ] Da guardare su mobile: etichette verticali strette sotto ~900px.

## 2026-10-26 — Comitato scientifico in grafici
- [x] Sopra l'elenco: 4 StatCard (persone lette, competenze di ruolo
      raggiunte, atteso raggiunto su tutto il ruolo, competenza più lontana)
      e tre grafici a barre (ruolo media/atteso, quota che raggiunge
      l'atteso, tutte le competenze). Tabella delle persone invariata.
- [x] Pannello della persona: barre punteggio/atteso del ruolo, barre di
      tutte le competenze, tabella degli scarti.
- [x] `CategoryBars`: altezze `xl`, `2xl`, `auto`. tsc, oxlint, audit
      identità e storage puliti.
- [ ] Verifica a schermo in chiaro e scuro: non fatta, serve la chiave del
      Comitato scientifico (nessuna in locale). La forma dell'API sta
      cambiando: adattare `comitato-stats.ts` quando arriva.

## 2026-10-23 — Posizione attiva unica, menu, Profilo della ricerca, Imbuto, Panoramiche
- [x] Posizione attiva unica (`lib/active-position.tsx`), letta da tutte le
      pagine; `ContextBar` (pattern, nel catalogo) sopra ogni pagina di
      Recruiting con la scelta della posizione; le pagine dell'avanzamento
      seguono la posizione attiva (i link vecchi con l'indirizzo la impostano).
      Risultati e Candidati per fascia: "Questa posizione" / "Archivio CV".
- [x] Menu di Recruiting come nella tabella di CLAUDE.md; "Da invitare al
      test" (era Migliori candidati); Area valutatori per ruolo; Stato
      dell'arte e /imbuto rimandano.
- [x] Profilo della ricerca = scheda della posizione attiva (intestazione,
      Il prossimo passo, Cosa cerchiamo, A che punto siamo, dati della ricerca).
- [x] Imbuto unico su /imbuto-scelta: fasi del processo, quota sulla
      precedente, frase sul calo maggiore, tabella per fase, tabella per
      posizione con "Tutte le posizioni aperte".
- [x] Panoramica Recruiting: tolto "nessun dato ancora registrato"; in Da
      fare "Candidati da invitare al test" e "Test da leggere"; Esporta
      riepilogo (da Stato dell'arte); società attiva soltanto.
- [x] Panoramica Assessment: quattro card con Gauge e anelli, Fasce con le
      prime tre, Andamento dallo storico vero (vuoto nei dati di prova), Dove
      guardare con aree e mansioni.
- [x] Tabelle e testo a sinistra ovunque; regola "Niente dati nel browser"
      rimessa in CLAUDE.md (sparita di nuovo nell'aggiornamento).
- [x] tsc, build, audit-identita `frontend/src` 0, audit-storage ok;
      verificate in locale Panoramica, Profilo, Imbuto, Risultati, Stato
      dell'arte (rimando) e Panoramica Assessment; contrasto a posto.
- [x] Deciso: resta un profilo solo, ereditato da ogni posizione; menu come
      la tabella di CLAUDE.md; regola §9 tenuta (DECISIONI, "Profilo per
      posizione e menu: confermati").
- [x] Profilo e Imbuto in chiaro, desktop e mobile (390 px): a posto. Trovato e
      corretto: la barra superiore usciva di 34 px a 390 px (spazi più stretti
      sotto i 640 px, Topbar e ModuleSwitcher).
- [ ] Non verificato: un valutatore (ruolo EVALUATOR) che vede solo l'Area.
- [x] Commit e invio su GitHub (`server-only:main`).

## 2026-10-23 — Punteggi su 10 (Recruiting e 5P), verifica a schermo, commit
- [x] Recruiting a schermo su 10 (`fmtScore10`): AHI, sottopunteggi, ICV, CI,
      risultati del test (inserimento su 10, salvataggio su 100 come prima),
      fasce, assistente, report e classifica CSV. Metodo con formule e soglie
      su 10 (8,5 / 7,0 / 6,0, sbarramento 5,9). Dati e soglie nel codice
      invariati. DECISIONI "Punteggi di Recruiting e del 5P su 10".
- [x] 5P su 10: tabelle, cruscotto, grafici, valori attesi (inserimento su
      10), Metodo del 5P, Excel dei risultati e del report.
- [x] Verifica a schermo delle due Panoramiche: chiaro, scuro, desktop,
      mobile. Nessuno scorrimento orizzontale, contrasto a posto. Corretto il
      vuoto della card "Distribuzione per fascia" (`ChartCard height="auto"`).
- [x] Contrasto: tag "NEW_APPLICANT" (lime su chiaro) e punteggi lime in
      scuro tolti.
- [x] Regola "Niente dati nel browser" rimessa in CLAUDE.md §9 (era sparita
      nell'aggiornamento); audit-storage ok.
- [x] tsc, build, audit-identita `frontend/src` 0, audit-storage ok.
- [ ] Non verificati a schermo con dati: le schermate del 5P (in locale nessun
      piano 5P caricato) e la classifica con candidati nelle fasce alte.
- [ ] Database locale: Acme ha ora anche ASSESSMENT (per la prova).
- [x] Inviato: `git push origin server-only:main` (avanti veloce, `4f73e33..caaec7d`). Railway ha avviato il deploy "zesty-victory / production": backend riuscito; frontend in corso al momento della nota.

## 2026-10-23 — Panoramica nei due moduli, Fasi 5–6 riviste (CLAUDE.md aggiornato)
- [x] Rotte: `/recruiting` e `/recruiting/home` aprono la Panoramica di
      Recruiting (prima: Profilo della ricerca / nulla); `/assessment` e
      `/assessment/home` quella di Assessment. Voce "Panoramica" in testa alle
      due barre laterali. DECISIONI "Panoramica come pagina d'ingresso".
- [x] Panoramica Assessment: Stato attuale (punteggio su 10 con benchmark,
      copertura mansioni, persone valutate, persone critiche), Da fare adesso
      (critiche, restituzioni, valutazioni 5P da raccogliere e da inviare, le
      quattro azioni di sviluppo con la loro nota), Dove guardare
      (distribuzione per fascia → Valori Complessivi, sotto il benchmark →
      Competenze). Niente "In programma": nessuna data in Assessment. CT / CP /
      Completo come ToggleGroup normale nelle azioni dell'intestazione.
- [x] Panoramica Recruiting: posizioni aperte, candidati in selezione, idonei,
      colloqui in programma; link test da inviare, test completati da leggere,
      candidati da valutare, posizioni senza candidati; prossimi colloqui;
      fasce di idoneità e imbuto con il link alle loro pagine.
- [x] Pattern nuovi nel catalogo: `BandCard`, `ActionList`.
- [x] Cinque fasce al posto dei tre livelli (che sparivano con la Home) e un
      solo set di nomi in tutte le pagine; Valori Complessivi con le cinque
      BandCard e "Vedi tutte" che filtra la tabella (`?fascia=`); Candidati per
      fascia di idoneità con quattro BandCard e "Vedi tutti" → classifica
      filtrata (`/recruiting/ranking?fascia=`).
- [x] Gauge Bklit come documentato (arco intero, numero al centro, su 10,
      traccia di default, niente ritaglio); niente riempimento sotto le linee
      dell'andamento né dissolvenza della griglia; niente ombre né bordo lime
      su card, StatCard, ChartCard, ModeSwitch, scelta del modulo; `Card`
      senza `hover:border-primary`.
- [x] FolderCard senza bordo lime, tinte, icona grande, testo al centro;
      "oggi / Skill Vision" → "Mostra / Nascondi il dettaglio"; icone composte
      tolte; switch IT/EN tolto da barra superiore e Impostazioni (era
      tornato); testo al centro tolto in tutti e due i moduli.
- [x] tsc, build, audit-identita `frontend/src` 0 (era 12; repository 15, solo
      i modelli email del backend), audit-storage ok.
- [ ] **Verifica a schermo parziale**: in locale la Panoramica di Recruiting
      si apre su `/recruiting` e `/recruiting/home` con dati (scuro), ma il
      browser di prova veniva chiuso da un'altra sessione e non ho le due
      modalità complete. Assessment in locale non ha una società con il
      modulo attivo: la sua Panoramica non è vista con dati. Da fare: chiaro
      e scuro, mobile, su tutte e due.
- [ ] **Da decidere col cliente**: AHI, test e 5P restano su 100 (DECISIONI
      "Punteggi su 10: dove sì, dove no").
- [ ] Non inviato su GitHub, niente deploy.
- Nota: nel CLAUDE.md aggiornato manca il paragrafo "Niente dati nel browser"
      e `audit-storage.mjs` (§9): l'ho seguito lo stesso. Se è sparito per
      errore, va rimesso.

## 2026-10-23 — Profilo della ricerca: tre card in una riga
- [x] Le tre card sempre affiancate (`md:grid-cols-3`). Se ne apre una alla
      volta e le sue pagine compaiono sotto la riga. `SkillVisionCard` ha
      `panelPlacement="below"` per questo; la card aperta è una preferenza
      sul server (`sv-recruiting-profile-open-level`).
- [x] Verificato in locale; build, audit-identita (27), audit-storage ok.
- [x] Stesso schema su "Stato dell'arte": tre finestre in una riga, una
      aperta alla volta, dettaglio sotto (`sv-recruiting-home-open-card`).

## 2026-10-23 — Recruiting: indice a quattro livelli (documento "Recruiting Module")
- [x] Barra laterale a gruppi: Profilo della ricerca · Chi cerchiamo (L1) ·
      Chi è più adatto (L2) · Chi scegliamo (L3) · Area valutatori (L4) ·
      Strumenti (Metodo, Assistente IA, admin). `nav-config.ts` →
      `RECRUITING_NAV_GROUPS`.
- [x] Società / Campagna / CIP solo su "Profilo della ricerca".
- [x] "Profilo della ricerca": 3 card (Chi cerchiamo, Chi è più adatto, Chi
      scegliamo); il pannello di ciascuna elenca le pagine del livello.
- [x] Selezione delle 35 competenze trasversali dentro il Profilo Candidato
      (sezione "Competenze trasversali", che segue subito i pesi scelti).
      Annuncio di lavoro in fondo al Profilo Candidato.
- [x] CV & Esportazione: tolto "Import massivo · archivio storico" (era un
      controllo disattivato). L'elenco dei CV caricati passa a "CV Elaborati"
      (`/recruiting/cv-elaborati`), con il link al test soft skill in fondo,
      visibile dal primo CV salvato.
- [x] Avanzamento della selezione: posizioni + riepilogo; preselezionati,
      classifica dopo il test, colloqui e podio hanno una pagina loro (stessa
      posizione via `?companyId&openingId`). "Candidato vincitore" →
      "Candidati al podio".
- [x] Nuove pagine: imbuto (L2 e L3), fasce di idoneità, le tre schede dei
      valutatori (`/recruiting/valutatori/*`), ognuna con il pannello dei
      valutatori esterni.
- [x] "Posizioni aperte" tolta da Stato dell'arte (`OpeningsList.tsx`
      eliminato). Il conteggio nelle StatCard resta.
- [x] Verificato in locale (chiaro): 18 rotte aprono senza errori. Un ciclo
      infinito sul Profilo Candidato trovato e corretto durante la prova.
      tsc, build, audit-identita (27, invariato), audit-storage ok.
- [x] In produzione (`73a1e23`, push su `server-only` e `main`): il bundle
      su Railway ha le rotte nuove, backend /health ok, `recruiting-store`
      401 senza accesso. Nel bundle nessun `setItem`, niente
      sessionStorage/IndexedDB: restano solo letture e cancellazioni
      dell'import che svuota il browser.
- [ ] Non verificato: modalità scura, mobile.
- [ ] Da chiarire con il cliente: il link dell'annuncio compare dopo «Salva»
      **e** «Conferma» (approvazione). Vedi DECISIONI.

## 2026-10-23 — File vecchi spostati fuori dal progetto
- [x] Spostati in `Desktop/Skill-Vision-Archivio-2026-10-23` (con `LEGGIMI.md`):
      logo vecchio (`logo_black/white.svg`), copia vecchia delle fondamenta in
      `assets/`, patch già applicata in `docs/`, 5 script e2e usa e getta del
      15/09, 255 PDF dei test in `backend/storage/test-files` (già in
      `.gitignore`, finiti in git per errore), un CV personale, le mappe del
      progetto, i `.DS_Store`. 264 file tolti da git.
- [x] Verificato dopo lo spostamento: build del frontend, typecheck e test
      del backend 163/163, `audit-storage` ok. Audit d'identità da 78 a 27
      (i difetti stavano nei file vecchi).
- Rimasti di proposito: documenti di progetto, `.railway/`, script del
  backend, pezzi della libreria non ancora usati (grafici Bklit, `form.tsx`).
- Il guscio legacy nel codice era già ritirato il 21/10: i riferimenti a
  `modules/recruiting.html` sono solo commenti. Il problema di
  `dashboard.skill-vision.it` è il DNS (GitHub Pages), non un file.

## 2026-10-23 — In produzione: "Tutto sul server" e Area Valutatori
- [x] **Errore mio, corretto:** la copia di lavoro era sul ramo
      `server-only`, e `git push origin main` mandava il `main` locale, fermo a
      `fcbf631`: `ba7d5df` e `08d6d0a` non erano arrivati su GitHub. Ora
      `git push origin server-only:main` (avanti veloce, 4 commit: anche
      `45f130a` della prova pulita del 22/10). `main` = `a025f1c`.
- [x] Pausa dei deploy tolta da Roberto; un commit vuoto (`a025f1c`) ha
      avviato il deploy "zesty-victory / production".
- [x] Verificato in produzione: backend con `/api/v1/recruiting-store` (401
      senza accesso, prima 404), /health 200. Frontend
      `skill-vision-production-6a42.up.railway.app`: `/index.html` 302,
      `/js/app.js` 404, `/api` passato al backend; nei pacchetti ci sono i
      testi nuovi ("Non intervistato", "Prepara la scheda", "Invia scheda
      compilata", "Annulla conferma"…).
- [ ] **`dashboard.skill-vision.it` non funziona**: è un CNAME verso
      `Bilalshazim.github.io` (GitHub Pages, che pubblicava il vecchio guscio
      statico della radice). Con il guscio ritirato (`fad458c`) Pages risponde
      "Site not found". Il dominio va puntato al frontend su Railway (dominio
      personalizzato sul servizio "Skill Vision" + CNAME nel DNS), poi GitHub
      Pages si può spegnere.
- [ ] Da sapere: esiste anche `skill-vision-production.up.railway.app` (senza
      suffisso) che serve ancora il vecchio `js/app.js`: non è questo
      progetto o è un servizio vecchio; da controllare su Railway.
- Nota per le sessioni future: prima di inviare, `git branch` — si lavora
  su `server-only` e si invia con `git push origin server-only:main`.
## 2026-10-22 — Prova pulita di frontend e backend (codice di `main`, prima del deploy)
- [x] Copia pulita di `origin/main` (`fcbf631`), senza i file non salvati
      dell'altra sessione; database vuoto `sv_cleantest` costruito dalle 10
      migrazioni come farà Railway: nessuna differenza con lo schema.
- [x] Backend: build ok, 162/162 test. Frontend: build di produzione ok,
      `audit-storage` ok (425 file). Audit d'identità 32: nessuno nei file
      toccati da questo lavoro (vedi sotto).
- [x] App avviata come su Railway (backend da `dist`, `serve-combined` con
      `BACKEND_INTERNAL_URL`): rotte 200, `/index.html` 302, `/js/app.js`
      404, `/api` passato (401 senza accesso).
- [x] Nel browser: accesso; 14 pagine di Recruiting e 16 di Assessment senza
      errori; caricamento di un CV (righe Candidate/Cv/CvMatchResult + dati di
      Recruiting sul server, 57 CV dopo il ricaricamento); salvataggio del
      profilo di lavoro (JobProfile + modelli e sintesi sul server);
      sblocco di Assessment col codice; nuovo dipendente salvato e ritrovato;
      secondo utente (recruiter) con gli stessi dati e senza RAL; uscita;
      `localStorage`/`sessionStorage` sempre vuoti.
- [x] **Corretto un difetto**: dopo lo sblocco di Assessment col codice la
      pagina diceva "Dati non caricati" (la richiesta fatta col modulo ancora
      bloccato restava in errore). Ora lo sblocco ricarica la pagina una volta.
      Verificato rifacendo lo sblocco sulla copia pulita.
- [x] **Corretti testi non più veri**: "salvata solo in questo browser /
      localmente" (profilo di lavoro, CV, scheda candidato), pesi delle
      competenze "si salva in questo browser", nota sul link del valutatore
      ("funziona solo in questo browser"), Metodo del 5P e nota
      sull'archiviazione dati di Assessment; tolto `emailApiKeyHint`, non
      più usato. Restano veri i testi dell'import e della scheda 5P del
      valutatore (che è ancora un file).
- [ ] Da sapere: `npm start` del frontend usa `$PORT`, che il terminale di
      Windows non espande. Su Railway (Linux) funziona come prima; in locale
      su Windows si lancia `node scripts/serve-combined.mjs dist <porta>`.
- [ ] Audit d'identità: 32 voci rimaste, da altri lavori recenti (ombre in
      AssessmentHomePage, FolderCard, ModeSwitch…; 15 nei modelli email del
      backend). Non toccate qui.
- [ ] Non inviato su GitHub: deploy di Railway in pausa (Roberto, 2026-10-21).
- Nota: resta la cartella `C:svclean` (copia di prova, già scollegata da
  git e dalle librerie): si può cancellare a mano.

## 2026-10-21 — Tutto sul server: inviato su GitHub, Railway non ha deployato
- [x] `main` portato a `34848de` (fast-forward da `c76f11f`, senza toccare
      i file non salvati dell'altra sessione) e inviato su GitHub.
- [x] Il codice esatto del commit, in una copia pulita: build del backend e
      del frontend riuscite.
- [ ] **Railway non ha avviato nessun deploy** per `34848de`: su GitHub c'è
      solo il deploy di GitHub Pages, mentre i push precedenti avevano anche
      "zesty-victory / production". Dopo 20 minuti la produzione è ancora la
      versione di prima (backend senza `/recruiting-store`, frontend con il
      pacchetto del mattino): niente di rotto, ma niente di nuovo. Da
      controllare sul pannello di Railway (collegamento con GitHub, progetto in
      pausa o limiti del piano) e avviare il deploy dell'ultimo commit.
- Nota: GitHub Pages pubblica la radice del repository; con questo commit
  `index.html`, `js/app.js` e `css/` della radice non ci sono più (il
  vecchio login con le password nel codice non è più pubblicato lì).

## 2026-10-21 — Tutto sul server, Parti 4–10: Recruiting sul server, tempo reale, controllo
- [x] Backend: tabella `RecruitingDocument` (migrazione
      `20261021140000_recruiting_documents`, solo additiva) e modulo
      `recruitingStore` su `/api/v1/recruiting-store`: `GET /` (tutti o
      `?keys=`), `GET /versions`, `PUT /:key` con versione (409 se vecchia),
      `DELETE /:key`. Un documento per area (le 9 chiavi che Recruiting usava
      nel browser), con lo stesso testo JSON; spazio = società dell'utente,
      "platform" per lo staff. Limite 10 MB solo qui (app.ts salta il lettore
      generale da 2 MB). Ogni salvataggio passa da `audit()`. Test
      `recruitingStore.test.ts` 6/6.
- [x] Frontend: `recruiting/lib/recruiting-store.ts`, copia in memoria con
      l'interfaccia dell'archivio del browser (`getItem/setItem/removeItem`):
      `storage.ts`, `backend-link.ts`, `skill-flags.ts` cambiano solo il
      bersaglio, le schermate niente. Salvataggio subito (250 ms), uno alla
      volta; 409 → versione del collega e avviso; server giù → avviso, la
      modifica resta in memoria e si riprova, chiudere la pagina chiede conferma.
- [x] Tempo reale: ogni 10 s (e tornando sulla scheda) si leggono le versioni
      e si scaricano i documenti cambiati; il layout ridisegna la pagina, ma non
      con una finestra di dialogo aperta (aspetta che si chiuda). Verificato:
      modifica di un "collega" vista in 0,5 s al ritorno e in 9 s da sola.
- [x] `RecruitingLayout`: pagine solo a dati arrivati (caricamento, errore con
      "Riprova", avviso se un salvataggio non è riuscito). Dati svuotati alla
      chiusura della sessione (`onSessionEnd` in session.ts).
- [x] Società e posizione attive: scelta di chi lavora, ora nelle preferenze
      (`recruiting.activeContext`); il documento comune non cambia quando si
      cambia posizione. Pesi delle competenze: dai dati del server dopo il
      caricamento e a ogni modifica di un collega.
- [x] Area Valutatori, schede viste: nelle preferenze (`evalSeen.<campagna>`),
      cambiate solo quelle righe del file dell'altra sessione.
- [x] Parte 9: "Importa dati del browser" nella barra di Recruiting (chi può
      scrivere): porta sul server solo le aree che lì non ci sono, poi svuota
      il browser. Verificato: 3 aree importate, browser vuoto.
- [x] Parte 10: `scripts/audit-storage.mjs` fallisce se l'archivio del browser
      compare fuori da 4 file ammessi (svuotano e basta, più la scheda 5P in
      attesa di decisione); provato anche che un uso nuovo lo fa fallire.
- [x] Verifica: 14 pagine di Recruiting senza errori e con
      `localStorage`/`sessionStorage` vuoti; conflitto → versione del
      collega e avviso; posizione attiva solo nelle preferenze; peso di una
      competenza salvato sul server. Backend 163/163; typecheck e build puliti.
- [ ] Resta nel browser solo la scheda 5P del valutatore (file HTML), in
      attesa della decisione di Roberto.
- Nota: i lavori non salvati dell'altra sessione (Area Valutatori, sintesi IA)
  restano nella copia di lavoro, fuori da questi commit.

## 2026-10-21 — Tutto sul server, Parte 3: ritiro del login legacy e del guscio statico
- [x] Tolta la modalità `legacy`: via `auth-mode.ts`, `authBridge.ts` (il
      ponte con la password dell'account "operatore"), `shell-bridge.ts`
      (sessione del guscio in `sessionStorage`); `VITE_AUTH_MODE` e
      `VITE_OPERATORE_BRIDGE_PASSWORD` tolte da env, tipi e `.env.example`.
      L'unico accesso è `/login` (`lib/auth/session.ts`): una guardia sola,
      uscita dal server, sessione scaduta → uscita.
- [x] `lib/api/client.ts`: token di accesso e utente solo in memoria (via i
      rami `localStorage`), rinnovo solo col cookie httpOnly; tolto il
      "re-bridge" sul 403 `role_forbidden`, che serviva solo al ponte.
- [x] Ritirato il guscio statico **nelle due copie, nello stesso passaggio**:
      `index.html`, `js/app.js`, `css/style.css` della radice e
      `frontend/legacy-shell/`. Resta `assets/` della radice (materiali
      d'identità, CLAUDE.md §10).
- [x] `scripts/serve-combined.mjs` serve solo la build React (ogni rotta →
      `index.html`, file mancanti → 404, percorsi fuori dalla build → 404),
      passa `/api` al backend e rimanda `/index.html` a `/`. `npm start`
      → `node scripts/serve-combined.mjs dist $PORT` (su Railway non cambia
      il comando). Tolto il server del guscio dal dev server di Vite; rotta
      `/index.html` → `/` anche nell'app.
- [x] Verificato in locale con la build di produzione e lo script di
      Railway: rotte dell'app 200, `/index.html` 302, file e marchio 200,
      file mancanti e `..` 404, `/api` passato (401 senza accesso); uscita
      e nuovo accesso da `/login`; tema del sistema prima dell'accesso, quello
      dell'utente dopo; `localStorage`/`sessionStorage` vuoti. Typecheck pulito.
- Su Railway le variabili `VITE_AUTH_MODE` e quella della password del ponte
  (se c'è ancora) non servono più: si possono togliere, non danno fastidio.

## 2026-10-21 — Tutto sul server, Parte 2: preferenze sul server
- [x] Backend: colonna `User.preferences` (JSON, migrazione
      `20261021120000_user_preferences`, solo additiva); `GET` e `PATCH
      /auth/me/preferences` (unione delle chiavi, `null` toglie; 16 KB e 100
      chiavi al massimo). Test nuovi `preferences.test.ts` 3/3;
      `protected-routes` e `auth` verdi.
- [x] Frontend: `lib/preferences.ts` (si caricano all'apertura della
      sessione, si azzerano all'uscita, salvataggio unito 400 ms dopo).
      Sopra: tema (`useTheme`; prima dell'accesso quello del sistema
      operativo), lingua (`useSharedLang`), viste "oggi / Skill Vision" delle
      card (`usePersistedFlag(chiave)`), società scelta dallo staff in
      Assessment. Scheda aperta del 5P nell'indirizzo (`?tab=`).
- [x] Tolti tema e lingua da `shell-bridge.ts`; pagine pubbliche (valutatore
      esterno, valutatore di Recruiting): italiano e tema del sistema.
- [x] `lib/browser-cleanup.ts`, all'avvio: cancella le chiavi vecchie delle
      preferenze (`sv_theme`, `sv_language`, `sv-*-view`, …). Solo
      cancellazioni.
- [x] Verificato nel browser: chiavi vecchie cancellate all'avvio; tema e
      vista salvati sul server e ritrovati dopo il ricaricamento; scheda 5P
      dall'indirizzo; `localStorage` e `sessionStorage` vuoti.
- [ ] Rimandato: "schede viste" in `EvaluatorsBackendPanel.tsx` (lavoro non
      ancora salvato dell'altra sessione nello stesso file): con Recruiting.

## 2026-10-21 — Tutto sul server: piano e Parte 1 (Assessment solo server)
- [x] Inventario di ciò che sta nel browser, verificato sul codice e sul
      pacchetto servito in produzione: **in produzione Assessment è ancora nel
      browser** (`VITE_ASSESSMENT_STORAGE` mai impostata); Recruiting in gran
      parte nel browser. Piano in `PROGETTO-TUTTO-SUL-SERVER.md`.
- [x] Tolta la modalità `local` di Assessment: un solo `AssessmentProvider`
      (server), `use5pState` solo server, pagina del valutatore solo server,
      invio dei link solo dal server (via l'invio dal browser con chiave email),
      tolte `VITE_ASSESSMENT_STORAGE` (env, tipi, `.env.example`, `.env.local`)
      e i campi `emailApiKey`/`emailApiEndpoint` (anche dalla risposta del
      backend; li accetta ancora dagli import vecchi e li scarta).
- [x] `lib/browser-import.ts`: l'unico punto che legge le chiavi vecchie
      (`sv_assessment_state_v1`, `sv5p_state_v1`, `sv5p_state_v1_tab`), solo
      per l'import; a import riuscito le cancella. Se sul server c'è già un 5P,
      quello del browser non si importa e la conferma lo dice prima.
- [x] Verifica: backend `assessment.test.ts` 28/28; typecheck pulito; nel
      browser import di 2 dipendenti → archivio del browser vuoto, voce
      "Importa" sparita; giro delle 16 schermate di Assessment senza errori e
      con `localStorage`/`sessionStorage` vuoti.
- Effetto in produzione al prossimo push: Assessment passa al server senza
  impostare niente su Railway. Ogni società poi usa "Importa dati del browser".

## 2026-10-19 — "recruiting doc": punto 4 (Area Valutatori)
- [x] "Valutazioni ricevute per candidato" aperta di partenza; per ogni
      candidato "Intervistato / Non intervistato" (automatico: c'è almeno una
      scheda intervista, online o caricata) e quante schede ha. Al clic, la
      card di ogni valutatore mostra anche i file caricati, con «Apri il
      file». Conteggi da `form-tracking` in una richiesta (prima: una per
      candidato). Si aggiorna dopo ogni caricamento o rimozione.
- [x] Sintesi IA: legge anche i file caricati. PDF e immagini vanno al
      modello come documenti (base64), i Word .docx come testo
      (`lib/docx-text.ts`, lettura ZIP senza dipendenze, provata su un .docx
      vero); .doc vecchio formato e file oltre il tetto di 20 MB in totale
      restano fuori e la schermata li elenca. Stesso numero di valutatore fra
      scheda online e file. Si genera anche senza schede online.
- [x] Test: `evaluatorForms.test.ts` 5/5 (nuovo: cosa arriva al modello, con
      `askClaude` simulato); typecheck dei due lati; audit 304.
- [ ] Non provata la chiamata vera al modello con un file: in locale c'è solo
      un PDF finto. Da provare in produzione con una scheda vera.

## 2026-10-19 — "recruiting doc": punti 1, 2, 5, 6, 7
- [x] 1 · Assessment: "Valutazioni Hard Skill" → "Valutazioni Professionali"
      (menu e titolo), tolto "(Hard Skill)" dalla pagina delle 5 P; anche il
      dizionario inglese. Verificato: nessun "Hard" nel testo delle 16
      pagine di Assessment.
- [x] 2 · `InvioTab`: «Prepara la scheda» su ogni valutatore apre la sua
      scheda 5P in un Dialog (costruita una volta all'apertura, conferma
      prima di chiudere). Nel modello, se la scheda è aperta in piattaforma:
      «Invia scheda compilata →» in alto su ogni pagina e una card d'invio in
      «Concludi e invia» al posto di scarica/email. Verificato: il Dialog si
      chiude, la Raccolta riceve le risposte, il valutatore risulta
      restituito.
- [x] 5–7 · `saveJobProfileToBackend`: senza collegamento, lo crea dalla
      posizione attiva (`resolveBackendLink`, come il primo CV). Anteprima:
      «Conferma» / «Annulla conferma» accanto a «Modifica» al posto della
      casella in fondo; stato "Confermata / Da confermare" e dove è salvata
      ("sul server" o "solo in questo browser", con data e ora). Nuovo
      `JobPostingLink` (link, Copia, Invia per email, Apri), usato anche
      nella card "Annuncio di lavoro", che ora mostra il link da sola; il
      link esterno manuale resta. Verificato in locale: salvataggio →
      campagna creata → Conferma → link → pagina pubblica 200.
- [x] Typecheck pulito; audit 304 (era 305).
- [ ] Non verificato a occhio: il clic dentro la scheda 5P (iframe isolato,
      finestra nascosta); provata la consegna alla Raccolta col messaggio che
      la scheda invia.
- Nota: nella scheda aperta in piattaforma le risposte **non** restano
  salvate se si chiude il Dialog (l'iframe isolato non ha memoria): per
  questo la chiusura chiede conferma.
- Dati di prova locali in più: campagna "Senior Frontend Engineer" creata
  dal salvataggio, scheda confermata, un piano 5P (VERDI valuta BIANCHI).

## 2026-10-19 — Area Valutatori: schede restituite come file
- [x] Backend: tabelle `EvaluatorFormSend` (un invio per valutatore e
      scheda) e `EvaluatorFormUpload` (file caricato, su `StoredFile`, nello
      storage dei CV: volume di Railway già esistente). Migrazione solo
      additiva.
- [x] `send-forms` accetta `kinds` (default tutte e due, come prima);
      l'email nomina solo le schede scelte, ha `replyTo` = responsabile e
      dice che la scheda si può rimandare come file con il nome del candidato.
- [x] Rotte nuove: `POST campaign-candidates/:id/form-uploads` (PDF, Word,
      JPG, PNG, 15 MB; valutatore assegnato alla selezione; scopo società),
      `GET campaigns/:id/form-tracking`, `GET form-uploads/:id` (link
      firmato), `GET form-uploads/:id/file` (solo col token, dichiarata in
      `protected-routes.test.ts`), `DELETE form-uploads/:id` (logica: il
      file resta).
- [x] Frontend: scelta delle schede sopra "Invia le schede via email";
      sezione "Schede per candidato" (`EvaluatorFormsTracking`, dominio) con
      filtro per candidato, i due pulsanti di caricamento, Dialog con
      candidato / compilata da / scheda / file, "Apri" e "Togli" sul file.
- [x] **Corretto un difetto che c'era già**: con `VITE_API_BASE_URL=/api/v1`
      (modalità backend) `new URL(link, '/api/v1')` lancia un errore, quindi
      il pulsante "CV" non apriva il file. Nuovo `apiFileUrl()` in
      `client.ts`, usato dal CV e dalle schede.
- [x] Verifica: backend 153/153 (4 test nuovi in `evaluatorForms.test.ts`);
      typecheck dei due lati; audit 305, invariato. A schermo, in locale:
      caricamento, validazione dei campi, quadro aggiornato, file aperto
      (200, PDF inline); chiaro e scuro senza ombre né bianco/nero puri;
      nessuno scorrimento orizzontale nel riquadro.
- [ ] Dati di prova solo nel database **locale**: valutatori Sara Colombo /
      Elena Ferrari (`*.prova@acme.example`) sulla campagna "Sales Account
      Manager — Q1", un file caricato per Marco Neri, due invii finti.
- Nota: l'invio vero dell'email con le schede scelte non è stato provato a
  mano (niente SMTP verso indirizzi finti); è coperto dai test con il mailer
  simulato.

## 2026-10-15 — Assessment sul server: Parte 6, in produzione (codice)
- [x] `assessment-server` unito a `main` (fast-forward) e inviato su GitHub. Verificato in produzione: backend nuovo attivo in ~80 s (le rotte di Assessment rispondono 401 senza accesso, /health 200), frontend nuovo servito
      (`1a458a8..c911c3e`). Railway ricostruisce dai push su `main`; il backend
      applica le due migrazioni nuove prima di partire (`preDeployCommand`).
- [x] Ordine scelto: prima il codice, poi la variabile. Senza
      `VITE_ASSESSMENT_STORAGE` il frontend resta su `local`, quindi per gli
      utenti non cambia niente finché la variabile non si mette.
- [ ] **Da fare sul pannello di Railway** (su questo computer non c'è la CLI
      né l'accesso): `VITE_ASSESSMENT_STORAGE=server` sul servizio
      "Skill Vision" e nuovo deploy. Facoltativo: `ASSESSMENT_DEMO_COMPANY_IDS`
      sul Backend per il "Reset demo" della società demo.
- [ ] Poi: un amministratore per società usa "Importa dati del browser".
- Nota: `.railway/railway.ts` non è allineato a Railway (non elenca
      `VITE_AUTH_MODE`, che in produzione c'è): non usarlo con `config apply`
      senza prima un `config pull`.

## 2026-10-15 — Assessment sul server: Parte 5, verifica
- [x] Giro automatico in modalità `server`, come COMPANY_ADMIN: 16 schermate
      di Assessment × chiaro e scuro = 32 controlli, tutti a posto. Ogni
      schermata si apre con i dati del server; nessun errore in console,
      nessuna pagina rotta, nessuna ombra, nessun bianco o nero puro.
- [x] Salvataggio verificato dall'interfaccia, ricontrollato sul server:
      vista della Home (impostazioni), archivia e ripristina, profilo
      aziendale, intervista, requisiti per mansione, valutazione soft,
      valutazione APEX inserita dall'HR, piano di sviluppo. Prima, nelle Parti
      1–4: modifica del dipendente, assegnazioni, link del valutatore, invio
      del link al test, 5P.
- [x] Stessi dati per due utenti della stessa società (HR e Recruiter);
      un'altra società → 403 (test del backend).
- [x] Build di produzione del frontend con `VITE_ASSESSMENT_STORAGE=server`:
      riuscita (l'avviso sulla dimensione dei pacchetti c'era già).
- [x] Audit d'identità: 305, come prima del lavoro; nessun difetto nei file nuovi.
- [x] Backend: 149/149. Corretto `auth.test.ts:193` (`(d+)` → `(\d+)`), il
      test rotto da prima segnato il 2026-10-14: era un errore del test, non
      dell'applicazione.
- [ ] Contrasto reale con lo snippet dell'audit: resta da fare a mano, come
      per la Fase 7.
- [ ] Dati di prova lasciati nel database **locale** (sede "Sede di prova",
      note "prova", Paolo Verdi, voti di Nicola Leone): solo su questo
      computer, non vanno su Railway.

## 2026-10-15 — Assessment sul server: Parte 4, Valutazione 5P
- [x] Risposta di Roberto: chi è nell'Excel e non in anagrafica **si aggiunge**
      all'elenco dei dipendenti (DECISIONI).
- [x] `use5pState`: in `server` il 5P è il documento con versione già previsto
      dal backend (`GET/PUT …/valutazione-5p`). Salvataggio 600 ms dopo l'ultima
      modifica, uno alla volta; 409 → messaggio e versione del collega; senza
      documento si parte vuoti (dati di esempio solo in demo) e non si salva
      finché non si modifica. `local` invariato.
- [x] Persone = dipendenti: `gestione5p/employees.ts` collega ogni persona al
      dipendente (email, poi nome, prima chi è in organico) con `empId`; chi
      manca si crea con `lib/new-employee.ts`, lo stesso di "Aggiungi
      dipendente" (che ora lo usa). Mai con i dati di esempio del 5P.
- [x] "Importa dati del browser" porta anche il 5P del browser, solo se sul
      server non ce n'è già uno.
- [x] Verificato nel browser: 3 persone → Bianchi collegato per nome, Colombo
      per email, Verdi aggiunto (23 → 24 dipendenti, messaggio); ricaricando
      nessun doppione; una modifica = un salvataggio; salvataggio di un collega
      nel frattempo → la sua versione resta, messaggio chiaro. `tsc` pulito.
- [ ] Non verificato: l'import di un vero file Excel del piano (il
      collegamento parte da qualunque modifica delle persone, quindi anche da lì).
- Backend non toccato in questa parte.

## 2026-10-15 — Assessment sul server: Parte 3, invio del link al test dal server
- [x] Backend: `POST /assessment/companies/:id/invitations` ({ employeeIds,
      subject, body }). Il server sceglie i destinatari (solo dipendenti attivi
      della società, con email valida), mette il link delle impostazioni,
      risponde al mittente scelto (referente o amministratore), un
      `TestInvitation` per persona (PENDING → SENT/FAILED, come Recruiting) e
      `surveySentAt` solo sugli inviati. Esito per persona, mai un successo finto.
- [x] Migrazione `20261015120000_assessment_invitations`: `senderConfigId` di
      `TestInvitation` facoltativo (Assessment non ha una configurazione
      mittente di Recruiting). Vincolo `Restrict` invariato: per Recruiting
      non cambia niente. Applicata al database locale e a quello dei test.
- [x] Frontend: in modalità `server` la finestra "Invia link del
      questionario" usa `SendTestLinkBar` ("Invia link test (N)" + conferma
      con i nomi); il testo resta lettera + corpo, con {{NOME}} e {{LINK}}
      riempiti dal server. Nessuna chiave email nel browser; il mailto resta
      come ripiego. In `local` tutto come prima.
- [x] Test: 3 nuovi; `assessment.test.ts` 28/28, `shortlist`,
      `mailer-not-configured`, `protected-routes` verdi.
- [x] Verificato nel browser: selezione di 2 persone, conferma, chiamata al
      server, esito per persona. In locale non c'è `RESEND_API_KEY`, quindi
      l'esito è "fallita" con il motivo: nessuna email partita. L'invio
      riuscito è coperto dai test.
- [ ] Il motivo di un errore del servizio email arriva in inglese dal mailer
      (`lib/mailer.ts`, lo stesso di Recruiting). Non toccato.
- [ ] Su Railway: l'invio funziona solo con `RESEND_API_KEY` e `MAIL_FROM`
      già usati da Recruiting.

## 2026-10-15 — Assessment sul server: Parte 2, il link del valutatore esterno
- [x] Backend: `modules/publicAssessment` su `/api/v1/public/assessment-evaluations/:token`,
      senza accesso, con limite di richieste. `GET` dà solo nome del dipendente,
      fonte, periodo, valutatore e i voti di quella fonte; `POST` vuole le 25
      voci (1–10), salva voti e note, chi ha valutato, il valutatore fra quelli
      noti, una riga di storico con il punteggio APEX ricalcolato sul server
      (`assessment/apex.ts`, stesso calcolo di `computeHardSummary`), e chiude
      il link (un secondo invio → 409).
- [x] Frontend: `AssessmentEvaluatePage` con il modulo in comune e due fonti
      dei dati (`local` invariata, `server` dalle rotte pubbliche).
- [x] "Copia link" e "Invia e-mail" aspettano il token del server (messaggio
      se l'assegnazione non è ancora salvata).
- [x] Tornando sulla scheda, Assessment rilegge il server (se non sta
      salvando): senza, l'HR che salva un dipendente su una copia vecchia
      cancellerebbe i voti appena inviati da un valutatore.
- [x] Test: 4 nuovi in `assessment.test.ts`; `protected-routes.test.ts` torna
      verde (mancavano le rotte pubbliche, fra cui quella degli annunci, rotta
      da prima). 32/32 nei due file.
- [x] Verificato nel browser: assegnazione creata dall'HR, link con il token
      del server, aperto in un'altra scheda senza dati locali, 25 voti inviati,
      link riaperto → "già inviata", l'HR vede "Completata"; punteggio APEX del
      server = quello del frontend (4,7).
- [x] Corretto quanto scritto ieri: il token in chiaro **è voluto** (commento
      nello schema: l'HR ricopia il link quando vuole). Non va cambiato.
- [ ] Resta: due persone che modificano lo stesso dipendente insieme → vince
      l'ultima (vedi DECISIONI). Rilettura al ritorno sulla scheda la riduce.

## 2026-10-15 — Assessment sul server: passo 3 (Parte 1), le schermate sul backend
- [x] Interruttore `VITE_ASSESSMENT_STORAGE` (`local` di default, invariato;
      `server` sul backend). In locale `frontend/.env.local` è su `server`.
- [x] `lib/api/assessment.ts` (una funzione per rotta), `apiPut` nel client,
      TanStack Query 5 installato, un solo `QueryClient` in `App.tsx`.
- [x] `AssessmentContext`: due provider. `local` identico a prima; `server`
      carica lo stato della società e salva le sole parti cambiate
      (`server-sync.ts`). Le schermate non sono state toccate per salvare.
- [x] Caricamento ed errore: `AssessmentDataGate` (`LoadingState`,
      `EmptyState` con "Riprova"). Salvataggio fallito → messaggio e ritorno ai
      dati del server; chiudere la pagina durante un salvataggio chiede conferma.
- [x] Società: quella dell'utente; lo staff sceglie dal selettore della barra.
- [x] "Importa dati del browser" (solo amministratori): prova senza salvare,
      conferma con i conti, import. "Reset demo" sul server: reset + dati di prova.
- [x] Motivo delle assenze → scelta fra 5 categorie. RAL nascosta ai non
      amministratori (tabella, scheda, modifica, nuovo dipendente).
- [x] Verificato in locale nel browser: import di 23 dipendenti; dati letti
      dal server con il browser vuoto; una modifica = una sola chiamata,
      ritrovata dopo il ricaricamento; Recruiter senza RAL e senza import;
      backend spento → messaggio chiaro, "Riprova" riporta i dati salvati.
      `tsc` pulito.
- [ ] Non verificati: "Reset demo" sul server (serve
      `ASSESSMENT_DEMO_COMPANY_IDS`); tutte le schermate in chiaro e scuro
      (Parte 5).
- [ ] Ancora nel browser: valutatore esterno (Parte 2), invio link ed
      `emailApiKey` (Parte 3), 5P (Parte 4).
- [x] ~~Per la Parte 2: token in chiaro da sistemare~~ — sbagliato: è voluto,
      vedi registro della Parte 2.
- [ ] Non fatto: commit e push.

## 2026-10-14 — Sviluppo tutto in locale, Railway dopo
- [x] `backend/local-db/`: PostgreSQL locale senza installazione (embedded-postgres,
      UTF-8 come Railway, solo localhost). Pacchetto a sé: Railway non lo vede.
- [x] Database locale: migrazioni applicate a sviluppo e test, seed caricato.
      Acme Corp ha Assessment attivo in locale (codice del seed riscattato).
- [x] `frontend/.env.local` (ignorato da git): login del backend come in
      produzione, API via proxy di Vite verso `localhost:4000`.
- [x] `.claude/launch.json`: `backend-dev` accanto a `frontend-dev`.
- [x] Verificato: login React → backend locale → database locale; l'API di
      Assessment risponde (403 senza modulo, 200 dopo). Test Assessment: 21/21.
- [x] `node_modules` del frontend reinstallati per Windows (`npm ci`, lockfile
      invariato): erano quelli di macOS.
- Regola da qui: passi 3–8 si fanno e si provano in locale; commit e push su
  Railway quando si decide (il push applica la migrazione in produzione).
- Riassunto in inglese per Roberto: `ASSESSMENT-BACKEND-PLAN.md` (radice).
  Va aggiornato insieme a questo file a ogni parte chiusa.

## 2026-10-14 — Assessment sul server: passi 1 e 2 (schema e API)
- [x] Decisioni del §8.5 prese da Roberto e registrate in DECISIONI.
- [x] Schema Prisma per Assessment + migrazione `20261014120000_assessment_server`
      (solo tabelle nuove; `TestInvitation` con `employeeId` e vincolo "un solo
      destinatario"). Due punti di Recruiting adattati a `shortlistId` facoltativo:
      `GET /shortlist/invitations/:id` e il webhook dei test.
- [x] API `/api/v1/assessment` (stato, dipendenti, periodi, mansioni,
      assegnazioni, impostazioni, profilo, Intervista, 5P con versione, import
      con anteprima, reset demo). RAL solo ad admin; motivo assenze → categoria.
- [x] Verificato su un Postgres locale temporaneo: migrazione applicata da zero,
      nessuna differenza con lo schema, vincolo attivo. Test: 140 passano;
      21 nuovi in `tests/assessment.test.ts`.
- [ ] **Rotti da prima, non toccati**: `auth.test.ts:193` (regex `(d+)` invece
      di `(\d+)`) e `protected-routes.test.ts` (manca la rotta pubblica delle
      job posting nell'elenco `PUBLIC`).
- [ ] Non fatto: commit e push. Railway applica la migrazione in produzione al
      primo deploy del backend (`preDeployCommand`).
- [ ] Prossimo: passo 3, frontend dietro `VITE_ASSESSMENT_STORAGE`.
- Nota d'ambiente: `backend/node_modules` era installato su macOS; aggiunti
  senza salvare (`--no-save`) i binari Windows di rollup ed esbuild per i test.

## 2026-10-14 — Assessment sul server: piano di esecuzione
- [x] Verificato sul codice: backend PostgreSQL + Prisma 6 + Express (quello di
      Recruiting), Assessment tutto in `localStorage` su **due** chiavi
      (`sv_assessment_state_v1` e `sv5p_state_v1`, la seconda mancava
      nell'analisi del 30/09).
- [x] Trovati: valutatore esterno che funziona solo nel browser dell'HR,
      `emailApiKey` salvata nel browser, 34 scritture a blob intero in 19 file,
      dati sensibili in anagrafica (RAL, sesso, motivo assenze).
- [x] Piano in `PROGETTO-ASSESSMENT-SERVER.md` §8: schema misto (tabelle +
      JSONB), modello Prisma, API, 8 passi dietro `VITE_ASSESSMENT_STORAGE`,
      17–24 giornate. **Nessuna riga di codice toccata.**
- [ ] Da decidere prima di partire: le sei domande del §8.5.

## 2026-10-14 — Riordino del progetto, passi 6–8: struttura, guida, proposta
- [x] Passo 6 — cartelle di Recruiting: **non spostate**. Sono già per funzione
      (`pipeline/`, `ranking/`, `match/`…, pagina e componenti insieme), la forma che
      cresce meglio; riportarle a pages/components/lib come Assessment spostava
      decine di file senza guadagno. Scelta in DECISIONI.
- [x] Passo 7 — `frontend/README.md`, sezione Structure riscritta (era superata):
      i tre livelli, dove va il codice nuovo, logica e UI, nomi, testi, stato e
      dati, errori, ambiente, regole.
- [x] Passo 8 — stato e API: proposta in `PROGETTO-ASSESSMENT-SERVER.md` §7
      (TanStack Query per i dati del server quando Assessment va sul server,
      `AssessmentContext` resta la porta, API divise per dominio). **Non
      implementata**: tocca il salvataggio dei dati e aggiunge una dipendenza.
- [ ] Da approvare: la proposta del §7.

## 2026-10-14 — Riordino del progetto, passo 5: logica fuori dai componenti
- [x] Testi di Assessment divisi per lingua: `lib/ui-text/en.ts` e `it.ts` (1.059
      chiavi ciascuno). `legacy-ui-text.ts` resta l'ingresso e controlla che le
      chiavi siano le stesse: una chiave in una lingua sola non compila (provato).
- [x] Customer Care: modello illustrativo, scarti, variazioni e CSV in
      `lib/customer-care.ts`; la pagina compone soltanto. Stesse formule e stesso seme.
- [x] `seedRandom` era in due pagine: ora `lib/seeded-random.ts` (con `hashSeed`).
- [x] Scaricamento dei file: cinque copie (Home ×2, Valore, Analisi, Customer Care,
      più `recruiting/lib/download.ts` e `saveFile` del 5P) → `src/lib/download.ts`
      (`downloadBlob`, `downloadText`). Tre copie liberavano il file subito dopo il
      clic: ora sempre dopo 2 secondi. Nomi dei file e contenuti invariati.
- [ ] Lasciati come sono: `gestione5p/model.ts`, `recruiting/lib/pipeline.ts`,
      `backend-sync.ts` sono grandi ma già solo logica in `lib/`: dividerli non
      separa niente. Si dividono quando si toccano per altro.
- [x] `tsc -b`, `vite build` puliti; audit invariato.
- [ ] Da verificare a schermo: un CSV da Home, Valore e Customer Care, e il JSON
      dell'intervista executive, si scaricano come prima.

## 2026-10-14 — Riordino del progetto, passo 4: gestione degli errori
- [x] Pattern `ErrorBoundary` (`components/patterns/ErrorBoundary.tsx`): una pagina che
      si rompe mostra «Questa pagina non si è aperta» e «Ricarica la pagina» dentro il
      guscio, invece della pagina bianca. Si azzera a ogni cambio di pagina. Copre
      anche il pezzo di pagina che non si carica dopo un deploy. Montato attorno
      all'`Outlet` dei due moduli e attorno a tutte le rotte in `App.tsx`. Nel
      catalogo, sezione Avvisi (`PageErrorFallback`).
- [x] Errori ingoiati: in Configurazione email gli elenchi di società e campagne
      che non si caricano ora lo dicono (prima sembravano vuoti). Copia del link in
      Gestione valutazioni: lasciata silenziosa di proposito (il link resta a
      schermo), con il motivo nel codice.
- [x] Apertura del progetto 5P: un file illeggibile dà un messaggio in italiano
      invece dell'errore tecnico.
- [x] Verificato: le altre letture di dati salvati (`JSON.parse`) sono già dentro
      `try`; le chiamate al server passano tutte da `ApiError` in `lib/api/client.ts`.
- [x] `tsc -b`, `vite build` puliti; audit invariato.
- [ ] Non verificato a schermo (nessun browser in questa sessione): la prossima
      verifica con Chrome guarda il riquadro d'errore nel catalogo, in chiaro e scuro.

## 2026-10-14 — Riordino del progetto, passo 3: codice morto e duplicati
- [x] Cercato con `knip` e con un controllo degli import (file che nessuno importa).
- [x] Tolti: `profile-hub/Subcard.tsx` (nessun import), `computeBigFiveExpected`,
      `initials`, `SOURCES` (5P), il doppione di `IV_COMPARE_ROW_EMPTY` in
      `interview-protocol-types.ts` (si usa quello di `interview-protocol.ts`).
- [x] «Chi è in organico» era scritto a mano in 8 punti: ora `activeEmployees` in
      `calculations.ts`, usata in `AddEmployeeModal`, Anagrafica, Cambio ruolo e
      `role-change.ts`. Restano scritti a mano tre punti che filtrano un elenco già
      ordinato (`SurveyLinkModal`, `EvaluationManagerModal`, `AssessmentCompanyPage`)
      e `evaluation-plan.ts`: stesso risultato, da allineare quando si toccano.
- [ ] Lasciati di proposito: i file di Bklit in `components/charts/` non usati
      (sono la libreria dal registro: si aggiornano interi) e `ui/form.tsx`
      (primitiva shadcn); `ROLE_LABEL` in `lib/auth/roles.ts` (autenticazione,
      Fase 8). Circa 70 funzioni sono esportate ma usate solo nel proprio file:
      innocue, non toccate.
- [x] `tsc -b`, `vite build` puliti; audit invariato.

## 2026-10-14 — Riordino del progetto, passo 2: ambiente e radice
- [x] `src/lib/env.ts`: unico punto che legge le variabili VITE_, tipizzate in
      `src/vite-env.d.ts`. Passano di qui `client.ts` (base API), `auth-mode.ts`,
      `demo-mode.ts`, `staff.ts`. Restano fuori, di proposito: la condizione del
      catalogo in `App.tsx` (scritta per esteso perché Vite la valuti in
      compilazione: verificato che il catalogo non entra nella build) e
      `authBridge.ts` (autenticazione, esce con il guscio legacy in Fase 8).
- [x] `.env.example`: aggiunta `VITE_STAFF_EMAILS`, che mancava.
- [x] `.gitignore` della radice: strumenti locali (`.agents/`, `.aider-desk/`, file
      locali di `.claude/`, `skills-lock.json`), CV e mappe PROJECT-MAP. I file
      restano sul disco, non sono stati spostati né cancellati.
- [x] `tsc -b`, `vite build` puliti; audit invariato (305).

## 2026-10-14 — Riordino del progetto, passo 1: pesi delle 35 competenze
- [x] Annullata la modifica non salvata in `SoftSkillSection.tsx` (importante oliva
      `accent-600`, utile ambra `warning`): usava un token di stato per una
      categoria, contro DECISIONI 2026-10-08, e fondi fuori sistema. La modifica è
      conservata in `docs/patches/2026-10-14-softskill-pesi-ambra.patch`.
- [x] Badge dei pesi sui `tone` della primitiva (strong / accent / neutral) invece
      che con classi. `tsc -b` pulito.
- [ ] Da chiedere a Roberto se vuole colori più distinti (vedi DECISIONI).

## 2026-10-13 (11) — Cambio ruolo: persona scelta dall'azienda, dettaglio più chiaro
Dai messaggi del cliente sulla pagina nuova.
- [x] «Inserire un nominativo che sceglie l'azienda»: sotto la scelta migliore,
      sezione «Confronta con una persona scelta dall'azienda» con un elenco di tutte
      le altre persone confrontate; la persona scelta compare con la stessa card delle
      tre proposte, etichetta «Scelta dall'azienda · n° su N», e apre lo stesso
      dettaglio. `computeRoleChange` restituisce anche la classifica intera (`ranked`).
- [x] Dettaglio: il cliente chiedeva se «Richiesto» e «Persona» fossero il valore
      atteso e quello della persona. Sì: le colonne ora si chiamano «Valore atteso» e
      «Valore di <nome>», e una nota dice da dove viene l'atteso (censimento per le
      trasversali, livello di chi lascia o benchmark per le professionali).
- [x] `tsc -b` e `vite build` puliti, audit invariato (305).
- [ ] Non verificata a schermo in questa sessione: da guardare in chiaro e in scuro.

## 2026-10-13 (10) — Nuova pagina «Cambio ruolo e trasferimenti» (Assessment)
- [x] Passo 1 — calcolo `lib/role-change.ts`: requisiti del ruolo (trasversali dal
      censimento, professionali al livello di chi lascia o al benchmark), stato per
      requisito, compatibilità pesata, punti di forza, gap, facilità di inserimento,
      le 3 persone più compatibili.
- [x] Passo 2 — componenti di dominio in `modules/assessment/components/role-change/`:
      `ReqStatusBadge`, `CandidateCard`, `CompatibilityDetail` (Sheet), `LeaverSummary`,
      `BestChoice`. Testi IT/EN nella struttura esistente.
- [x] Passo 3 — pagina `/assessment/cambio-ruolo`, voce di menu dopo «Valori
      Complessivi», titolo di pagina.
- [x] Passo 4 — verificata con Chrome in chiaro e in scuro (scelta della persona,
      tre card, dettaglio). Corretti dopo la verifica: formula troppo generosa,
      righe dei gap sovrapposte, nomi delle competenze in stile label, etichetta
      della casella in maiuscolo.
- [x] `tsc -b` e `vite build` puliti, audit invariato.
- [ ] Da confermare col cliente: requisiti professionali al livello di chi lascia
      (DECISIONI), soglie di stato e di facilità.

## 2026-10-13 (9) — Indice di Assessment: Area Risultati aperta
- [x] Anche «Area Risultati» parte aperta, con «Risultati Valutazioni Trasversali» e
      «Risultati Valutazioni Professionali» subito sotto (i nomi c'erano già).
      `tsc -b` pulito.

## 2026-10-13 (8) — Indice di Assessment: Area Valutazioni sotto Dati Aziendali
- [x] Gruppo «Area Valutazioni» subito sotto «Dati Aziendali», aperto di default, con
      «Valutazioni Soft Skill» e «Valutazioni Hard Skill» (ex «Gestione valutazioni»,
      anche nel titolo della pagina). IT ed EN. Rotte invariate.
- [x] Verificato con Chrome (indice in scuro). `tsc -b` pulito.

## 2026-10-13 (7) — Finestra 2: pannello di nuovo a destra
- [x] Tolto `panelSide` (interpretazione sbagliata): «La mappa dei valori» e «Le
      decisioni» aprono il pannello a destra, come prima. `tsc -b` pulito.

## 2026-10-13 (6) — Assistente IA di Assessment a tutto schermo
- [x] La chat era una colonna fissa di 45rem e riempiva l'altezza solo da `lg`:
      ora prende tutta la larghezza accanto alle domande e l'altezza dello schermo
      a ogni larghezza (`100dvh`). Messaggi e campo centrati a `max-w-3xl`
      (colonna di lettura). Su telefono le domande sono una fascia che scorre
      (`max-h-48`) e la chat prende il resto. `ChatMessage` invariato.
- [x] Verificata con Chrome a 1600×900 e 390×844, in scuro. `tsc -b` pulito,
      audit invariato.
- [ ] Visto di passaggio, non toccato: su telefono la barra superiore va a capo
      (selettore IT/EN su due righe).

## 2026-10-13 (5) — Finestra 2: pannello accanto alla card; mappa delle sedi ritirata
- [x] `SkillVisionCard` `panelSide`: le card a destra restano a destra e aprono il
      pannello a sinistra (La mappa dei valori, Le decisioni).
- [x] Mappa delle sedi pubblicata (1453cc8) e ritirata su richiesta di Bilal: revert
      di mappa, campo Sede, tabella delle città, dipendenze `d3-geo` /
      `topojson-client` / `world-atlas` e sedi demo. Si riprende da quel commit.
- [x] `tsc -b` e `vite build` puliti.

## 2026-10-13 (4) — Home di Assessment: finestre allineate e colorate (B.2, B.3)
- [x] `SkillVisionCard`: tolto `sticky` dalla card aperta, che con la pagina scorsa
      la disallineava dal pannello; aprendo, la pagina scorre all'inizio del blocco
      se serve.
- [x] Prop `tint` in `FolderCard` / `SkillVisionCard` / `ValoreCard`: tinta al 10%
      sulla card e sul riquadro del pannello (viola, magenta, rosso, verde). Nel
      catalogo.
- [x] `tsc -b` pulito, audit invariato (304).
- [ ] Verifica a occhio in chiaro e in scuro dopo il deploy.

## 2026-10-13 (3) — Scelta CT / CP / Completo accanto al titolo
- [x] A destra di «Home», con l'aspetto delle folder card (bordo lime, rilievo che
      diventa lime al passaggio del mouse). CT petrolio, CP ambra, Completo lime
      quando è scelto.
- [x] `tsc -b` pulito. Audit 304 (+2: le classi del rilievo, eccezione voluta,
      vedi DECISIONI).

## 2026-10-13 (2) — Scelta CT / CP / Completo: compatta
- [x] Dopo la verifica in produzione: niente riquadri, controllo a segmenti su una
      riga con un colore per area (CT petrolio, CP magenta, Completo neutro) e la
      voce scelta piena del suo colore, con spunta. Tolti i testi non più usati.
- [x] `tsc -b` pulito, audit invariato.

## 2026-10-13 — Home di Assessment: scelta CT / CP / Completo in evidenza
- [x] `ModeSwitch` dalla barra superiore a un pannello a tutta riga sotto l'intestazione:
      titolo «Quale area vuoi analizzare?», tre riquadri con codice, nome e una riga
      che dice cosa contiene l'area. Riquadro scelto pieno del colore dell'area (CT
      petrolio, CP magenta, Completo neutro), spunta e «Selezionata». Testi IT/EN
      nella struttura esistente.
- [x] `tsc -b` pulito, audit invariato (nessun difetto nei file toccati).
- [ ] Verifica a occhio in chiaro e in scuro: il server di sviluppo non parte su
      questo PC (manca il binario di rolldown), da fare dopo il deploy.

## 2026-10-12 (2) — Sessione fissa di 3 ore dal login, refresh token con rotazione
- [x] Correzione dopo il chiarimento di Bilal: non 3h di inattività ma **3h dal login**,
      poi si rifà l'accesso. La prima versione (refresh 7 giorni dall'ultimo uso)
      teneva aperta la sessione per giorni: sostituita prima di ogni commit.
- [x] Backend: `SESSION_TTL_HOURS` (3). Refresh token e cookie scadono a login + 3h;
      la rotazione eredita la scadenza; il token d'accesso è limitato alla fine della
      sessione. `/auth/refresh` ruota il token, tolleranza di 60 s, riuso → revoca
      di tutte le sessioni. Colonna `RefreshToken.rotatedAt` con la sua migrazione.
- [x] Frontend: timer in `lib/auth/session.ts` alla scadenza del token → logout →
      `/login`, anche a pagina ferma. Nel ponte legacy `tryRefresh` salva il refresh
      token ruotato. Interceptor 401 → rinnovo → nuovo tentativo c'era già.
- [x] Nuovi test in `backend/tests/auth.test.ts`: 3h, cookie e token scadono a
      login + 3h, il rinnovo non allunga, rotazione, tolleranza, riuso, scadenza.
- [x] `tsc` pulito in backend e frontend.
- [ ] Test del backend **non eseguiti**: su questo PC non c'è Postgres (`localhost:5432`).
      Vanno lanciati prima del deploy.
- [x] Pubblicato su richiesta di Bilal. La migrazione porta anche i refresh token
      già emessi a 3 ore dalla loro emissione: chi era entrato da più di 3 ore rifà
      l'accesso.

## 2026-10-12 — Valutazione 5P sostituita dal modello «Multi-Fonte v5» del cliente
- [x] Nuovo flusso a 7 schede, come il file HTML del cliente: 1 Piano, 2 Invio schede,
      3 Raccolta, 4 Valori attesi, 5 Risultati, 6 Report persona, Metodo. Sulle schede
      numerate lo stato del passo (spunta quando è fatto).
- [x] `model.ts` riscritto (stato v5): persone con cognome/nome, piano importato da un
      Excel a 4 fogli (+ VALORI ATTESI facoltativo) con riconoscimento dei nomi
      approssimati, controllo del piano, carichi, coperture, stato dei valutatori,
      alfa di Cronbach. I progetti salvati con la versione precedente si aprono
      (migrazione nome → cognome).
- [x] `files.ts`: modello Excel del piano con fogli di controllo e formule, email
      .eml in ZIP, schede, esportazione dei risultati e report persona.
- [x] Scheda del valutatore: guida (benvenuto, modello 5P, come dare il voto, domande
      frequenti), «Non so valutare», stampa della guida. Sui token, nessun esadecimale.
- [x] Nuove: `PianoTab`, `RaccoltaTab`, `ReportTab`, `PersonPicker`. Riscritte:
      `InvioTab`, `ValoriAttesiTab`, `RisultatiTab`, `MetodoTab`, la pagina.
- [x] Eliminate: `AnagraficaTab`, `AssegnazioniTab`, `CaricamentoTab`,
      `IndividualeTab`, `NineBox` (vedi DECISIONI).
- [x] `tsc -b` pulito. Audit: nessun difetto nel modulo (302 in totale, tutti fuori).
      Nella scheda del valutatore la variabile `--m` diventa `--font-mono`, così
      l'audit riconosce lo stile label.
- [ ] `vite build` non verificata: in `node_modules` manca il binario di rolldown per
      Windows (`@rolldown/binding-win32-x64-msvc`). Serve un `npm i` pulito; non è un
      errore del codice.
- [ ] Da verificare a occhio, in chiaro e in scuro, su app avviata con un piano reale.

## 2026-10-09 (3) — Valutazione 5P: modulo concluso
- [x] Migrazione del modulo, calcolo unico in tutte le schede e profilo della persona
      (valori attesi, skill gap, radar e barre Bklit) completati e approvati da Roberto.
      Dettagli nelle due voci qui sotto.
- [x] Importazione dei valori attesi da Excel: rimandata per decisione di Roberto. Oggi
      si inseriscono a mano nella scheda "Valori attesi"; si riprende se serve.
- [ ] Rimasto aperto, non del modulo: l'audit del contrasto per tutte le schermate
      (lo snippet non legge i colori `oklab` con trasparenza, vedi DECISIONI).

## 2026-10-09 (2) — Valutazione 5P: calcolo unico in tutte le schede
- [x] `compute()` usa il calcolo deciso (media piatta Dirigente + Peer, autovalutazione
      fuori, scala 0–100 = voto × 10) tramite `pMeans`, lo stesso del profilo della
      persona: Risultati, Matrice, Scheda individuale, Excel e profilo non possono più
      discordare. Verificato su dati di esempio (10 persone, anche con una scheda a
      voci mancanti): 0 discordanze fra `compute` e `get5pDashboardPayload`.
- [x] Tolti "Metodo" (3 modi), pesi e "Includi autovalutazione" dalle impostazioni e
      dalla scheda Risultati; i progetti vecchi si aprono e le chiavi si scartano.
- [x] Tutto a schermo e in Excel su scala 0–100 intera: Risultati (riquadri, barre,
      tabella, soglie "Sotto 50", "Gap auto ≥ 15"), Matrice (soglie 50 e 70), Scheda
      individuale (radar, tabelle per fonte, differenze con segno), elenco schede in
      Caricamento, foglio Parametri dell'Excel. `level()` e la Matrice confrontano il
      valore arrotondato, così un "70" non è mai "Adeguato". Scheda Metodo riscritta.
- [x] Tolti dalla Scheda individuale "Punti di forza / Aree di sviluppo" (stavano
      nel vecchio calcolo; ci sono già nel profilo nuovo).
- Verifica: `npm run build` passa; audit 305 (nessuno nei file di questo lavoro).
  Contrasto: lo snippet dell'audit non legge i fondi `oklab` con trasparenza (badge e
  StatCard), quindi l'ho rifatto risolvendo i colori con un canvas: Risultati,
  Scheda individuale e Valori attesi, chiaro e scuro, nessun testo sotto soglia
  (minimo 4,60 su "Vicino al livello" in scuro; soglia 4,5). Nessun errore in console.
- [ ] Da sapere: le schede già salvate si ricalcolano da sole con il nuovo metodo, e i
      voti cambiano rispetto a prima dove il Metodo era diverso dalla media piatta.
- [ ] Non fatto: importazione dei valori attesi da Excel (rimandata, come detto);
      sporadica la tabella dei risultati scorre in orizzontale a 1440px (colonna
      Livello fuori vista): già così prima.

## 2026-10-09 — Valutazione 5P: profilo della persona con valori attesi e skill gap
- [x] `gestione5p/model.ts`: `State5p.exp` (valori attesi di base e per reparto, scala
      1–10, letto/salvato con il progetto), `expOf`, `expCount` e
      `get5pDashboardPayload(state, id|nome|chiave)`. Calcolo deciso il 2026-10-09:
      media piatta di Dirigente e Peer scheda per scheda, autovalutazione fuori dal
      voto, voce → P → totale, scala 0–100 = voto × 10 arrotondato, scarti sui valori
      arrotondati, atteso di P e totale solo se ci sono tutte le voci. Indipendente
      dal "Metodo": le altre schede non cambiano.
- [x] Componenti nuovi in `gestione5p/dashboard/` (PersonDashboard, DashboardCharts,
      DashboardInsights, DashboardItemsTable, gap-style): quattro StatCard (accent
      solo sul voto), barre raggruppate e radar Bklit voto contro atteso nella stessa
      card, tre riquadri di lettura, tabella delle 25 voci, avvisi (solo
      autovalutazione, Peer riconoscibili, atteso incompleto). Stati di gap con
      token di stato e parola.
- [x] `IndividualeTab`: l'intestazione con il punteggio è sostituita dal nuovo profilo
      (con "Scarica dati (JSON)", `saveDashboardPayload`); il resto della scheda resta.
- [x] Nuova scheda "Valori attesi" (`ValoriAttesiTab`): base + una colonna per reparto,
      riga per P che imposta le cinque voci.
- Verifica: payload provato su dati di esempio (voto a mano = voto del payload, persona
  inesistente → null, senza atteso → gap null). `npm run build` passa. Visto in
  browser (Playwright) in chiaro e in scuro: nessun errore in console. Audit: nessun
  difetto nei file nuovi (305 totali, già presenti altrove).
- [ ] Da sapere: Risultati, Matrice e il resto delle schede usano ancora il "Metodo"
      configurabile (di base: media per fonte, con autovalutazione); il profilo della
      persona usa il calcolo deciso. I due numeri possono differire: va deciso se
      allineare anche le altre schede.
- [ ] Non verificato: contrasto reale con lo snippet dell'audit; la scheda "Valori
      attesi" a occhio e con dati veri; importazione dei valori attesi da Excel (non
      c'è: oggi si inseriscono a mano).

## 2026-10-08 — Pesi delle competenze: gialli diversi
- [x] Roberto: colori diversi per le altre due voci, sulla tonalità del giallo ma
      più spenti. Essenziale lime pieno; Importante oliva spento
      (`accent-600` 25%); Utile ambra spento (`warning` 15%). Parola sempre
      accanto. Build pulita. Non verificato a occhio in chiaro/scuro.
- [ ] Aperti, da Roberto (13:54-13:56): pagina "Profilo candidatura" per ruolo
      (oggi solo Sales/Marketing) e area di valutazione 5P: vedi risposta in chat,
      niente ancora fatto.

## 2026-10-08 — Scelta del modulo: nomi in evidenza
- [x] Richiesta di Roberto: evidenziare RECRUITING e ASSESSMENT. In
      `ModuleChooserPage.tsx` il quadrato lime diventa un cerchio, di colore
      diverso per modulo (`chart-1` petrolio, `chart-2` magenta), e il nome è in
      maiuscolo semibold 24px. `tsc` pulito. Non verificato a occhio in
      chiaro/scuro; il commutatore nella barra superiore non è toccato.

## 2026-10-08 — Foglio 8 (seguito 2): clic e colori dei pesi
- [x] Richiesta di Roberto: 1 clic essenziale, 2 importante, 3 utile (il 4° toglie
      la competenza), con i colori. `skill-flags.ts` cambia l'ordine; in
      `SoftSkillSection.tsx` riquadri e badge hanno una scala sul lime (pieno /
      tenue / neutro) con sempre la parola accanto. `tsc` pulito, audit senza
      nuovi difetti nei due file. Non verificato a occhio in chiaro/scuro.

## 2026-10-08 — Foglio 8 (seguito): selettore delle 35 competenze modificabile
- [x] Segnalazione di Roberto: in Recruiting le 35 competenze trasversali non si
      potevano selezionare (il selettore era di sola lettura, in Assessment sì).
      Ora un clic cambia il peso: non richiesta → utile → importante → essenziale;
      conteggio per peso, "Ripristina i pesi di partenza". Verificato in browser,
      anche dopo il ricaricamento.
- [x] I pesi si salvano nel browser (`sv_recruiting_skill_flags_v1`) e si scrivono
      sul posto in `DEFAULT_FLAGS`: ranking, punteggi, Ask ed esportazioni li usano
      subito; la scheda di lavoro li riprende all'apertura (valori attesi già scritti
      conservati). `RankingCard` non fissa più le essenziali all'avvio.
- [ ] Da sapere: i pesi valgono per questo browser e per la posizione unica di
      oggi (Sales Account Manager); non sono ancora sul server né per ruolo.
- [x] Layout dei tre documenti dell'Area Valutatore: resta quello di CLAUDE.md
      (token del sistema), come deciso; Roberto preferiva la grafica dei PDF.

## 2026-10-07 — Foglio 8: i tre documenti dell'Area Valutatore sui modelli PDF del cliente
- [x] Verbale di colloquio, Scheda di valutazione candidato e Report finale
      rifatti sui tre PDF di Roberto (struttura, sezioni numerate, parti A/B/C,
      campi, scale). I PDF restano riferimento: non sono allegati alla piattaforma.
      Dialog a `size="xl"`, tutto su token e pattern (Field, FieldGrid, Table, ToggleGroup).
- [x] Verbale: domande di prassi (apertura, percorso, trasversali STAR) con la
      traccia "Ascoltare" e punteggio /5; competenze professionali con livello
      Base/Medio/Alto; Parte B = domande personalizzate (le `extraQuestions` di Foglio 6);
      riepilogo per area; esito. Il testo delle domande resta riscrivibile.
- [x] Scheda di valutazione: percorso del candidato, matrice a tre fasi con
      criterio chiave, media per fase, fascia attuale e criteri chiave sotto 3
      calcolati, considerazioni per colloquio, confronto, firme.
      **Cambia il calcolo**: non più pesi % per riga e 60/40 fra le aree, ma la
      media semplice per fase come nel modello (DECISIONI.md).
- [x] Report finale: sintesi con media complessiva, valutazione per area (quinta
      area libera), profilo, fit Alto/Medio/Basso, percorso con media e esito,
      confronto, proposta e verifiche, allegati, decisione dei responsabili.
- [x] I dati salvati restano leggibili: i campi nuovi si aggiungono, nessuno si
      rimuove. Diciture vecchie (Video call, Telefonico, Parziale, Superato…)
      riportate a quelle del modello alla lettura. Il backend (sintesi IA) e le
      viste di confronto leggono anche i campi nuovi.
- [ ] Da sapere: le risposte date alle vecchie domande (altri nomi) restano nel
      record ma non compaiono più nel form; sezioni "Sintesi colloquio" e
      "Domande e risposte chiave" del vecchio Verbale non esistono nel modello.
- [ ] Non verificato: apertura dal browser dei tre dialog nell'app (verificati i
      form in pagina di prova, chiaro e scuro); pagina del valutatore esterno.

## 2026-10-07 — scheda del valutatore sui token
- [x] Segnalato: l'anteprima della scheda era blu, diversa dalla piattaforma. Riscritto il CSS del file con i token (iniettati alla generazione, chiaro e scuro), fasce della scala sui toni di stato con la parola, Geist, raggi e bottoni del sistema, nessun esadecimale. Tolta l'esclusione dall'audit.

## 2026-10-07 — Foglio 7 (terza parte): nuovo modello di Roberto, "Valutazione 5P Multi-Fonte"
- [x] Sette schede come nel modello: 1 Anagrafica (con email e "Avanti"), 2 Assegnazioni (una riga per dipendente, caselle con elenco e ricerca, suggeriti e carico accanto, controllo OK / da controllare / errore, filtro, KPI, Excel con menu a tendina e reimportazione, vista per valutatore), 3 Invio schede (email HR, scadenza, ZIP di file HTML per valutatore con elenco invii e testo email, anteprima, alternative Excel/Forms), 4 Caricamento (anche codice SV5P incollato; risposte dall'anteprima), 5 Risultati, 6 Scheda individuale, Metodo aggiornato.
- [x] Salva progetto / Apri progetto / Nuovo; progetti vecchi migrati (assegnazioni dal piano).
- [x] Tolti: pagina `/assessment/scheda-5p`, ScoreBar, colonna "Scheda online" (non nel modello).
- Verificato: logica su dati di esempio (11 persone, 47 schede, 3 righe gialle come dice Roberto: Laura, Marco, Elena; migrazione; lettura risposte); la scheda del valutatore si apre in browser. `npm run build` passa. Non provati a schermo: la pagina Assegnazioni dentro l'app, l'Excel aperto in Excel, il giro completo ZIP → compilazione → caricamento.

## 2026-10-07 — Foglio 7 (seconda parte): allineamento ai due prototipi HTML
- [x] Dashboard `/assessment/gestione-valutazioni`: titolo "Valutazione 5P" con sottotitolo e campo Azienda in testa, banner giallo dei dati di esempio, sei schede (Metodo senza numero), Anagrafica come nel modello; tolto il link a fondo pagina e la finestra di compilazione dal Piano (i nomi sono testo semplice con (D)/(P)/(A)).
- [x] Nuova pagina `/assessment/scheda-5p` = Scheda_5P_Paolo_Conti.html: sidebar "Istruzioni e scala" / "Persone da valutare (N)" con avanzamento / "Concludi e invia"; intestazione con avanzamento voti; istruzioni ("Gentile …"), "Come si compila" in 5 passi, scala a 5 fasce, le 5 P, regole; per ogni persona le 25 domande con barra 1–10 (colorata fino al voto scelto), ancoraggi 1/5/10, "Togli voto", note; Concludi e invia (file JSON, codice, invio diretto se stesso browser del piano).
- [x] Piano: colonna "Scheda online" (Apri / Copia link) per valutatore; Caricamento: accetta anche i file JSON / .txt con il codice delle risposte.
- `npm run build` passa; la pagina della scheda è stata guardata in un browser locale (schermata Istruzioni). Non provati: invio diretto tra i due browser, e le altre viste (persona, concludi).

## 2026-10-07 — Foglio 7: "Gestione valutazioni" (Valutazione 5P, come il file HTML del cliente)
- [x] Nuova pagina `/assessment/gestione-valutazioni`, voce di menu "Gestione valutazioni" nell'Area Valutazioni (prende il posto di "Valutazioni delle Hard Skill"; la pagina APEX 5D classica resta raggiungibile da un link).
- [x] Sei schede come nel modello: 1 Anagrafica (inserimento, importazione Excel/CSV, modello da scaricare), 2 Piano e schede (piano automatico, piano in Excel, ZIP di schede precompilate, scheda vuota, modello per Forms), 3 Caricamento (trascinamento di file, esito, avanzamento rispetto al piano, elenco schede), 4 Risultati (3 modi di calcolo, media aziendale, matrice Competenze × Potenziale a 9 quadranti, tabella con livelli, esportazione Excel), 5 Scheda individuale (radar a 3 fonti + punteggio unico, punti di forza e aree di sviluppo, gap di percezione, 25 item, registro note), Metodo.
- [x] Scheda del valutatore compilabile sulla piattaforma dal piano: barra 1–10 numerata e colorata per fascia, ancoraggi 1/5/10 sempre visibili, note facoltative; richiede tutte le 25 voci.
- Logica provata a parte sui dati di esempio (piano 43 schede, punteggi, tre metodi); la lettura/scrittura Excel non è stata provata con file reali. `npm run build` passa. Non verificato a schermo.

## 2026-10-06 — Area Valutatore: schede ridisegnate, logo SV, confronto fra valutatori
- [x] Area Valutatore: le tre schede (Intervista strutturata, Valutazione candidato, Report finale di valutazione) sono tre card affiancate con icona, stato ("Compilata · data" / "Non compilata") e pulsante; "Valutatori esterni" è un riquadro a sé con la spiegazione (email, link, nessun allegato). Colori e stile: design system attuale, in attesa dei colori di Alessio.
- [x] Logo Skill Vision in testa ai tre documenti (`SheetBrand`); la pagina dei valutatori esterni lo aveva già.
- [x] Confronto fra valutatori (`EvaluationCompare`): per candidato con almeno 2 schede inviate, tabella con una colonna per valutatore e una riga per criterio (domande riscritte e aggiunte comprese), punteggio finale/complessivo, esito e raccomandazione, e lo scarto con la parola "Divergenza" da 2 punti in su.
- Già presenti e non toccati: valutazione di più candidati nella stessa sessione (elenco a sinistra nella pagina del valutatore), invio dei link per email, salvataggio nel database, riepilogo IA modificabile e "Riporta nel Report finale". Verificato con `npm run build`; non verificato a schermo.

## 2026-10-06 — Correzione: build del frontend fallita per 3bf2c47
- [x] Il deploy di 3bf2c47 sul servizio "Skill Vision" è fallito in fase BUILD_IMAGE: `npm run build` esegue `tsc -b`, più severo di `tsc --noEmit -p .` usato nei controlli, e segnalava due import inutilizzati in `HardEvalModal.tsx` (Badge, APEX5D_GUIDE) rimasti dopo il passaggio a `ApexItemRow`. Tolti; `npm run build` ora passa in locale.
- Da qui in poi, prima di ogni push si lancia `npm run build`, non solo `tsc --noEmit`.
- Nel frattempo il frontend in produzione era stato riportato al commit b6dafb3 (redeploy delle 16:24): la funzione 5P non era visibile finché non passa il nuovo deploy.

## 2026-10-06 — Foglio 6: valutazione 5P multi-fonte (Assessment)
- [x] Anagrafica: campo "Responsabile diretto" (`Employee.responsabileId`) in Nuovo dipendente e nella modifica; reparto e ruolo c'erano già.
- [x] Piano di valutazione automatico (`lib/evaluation-plan.ts`, in "Gestione valutazioni"): per ogni dipendente attivo Dirigente = responsabile diretto, Peer = N colleghi dello stesso reparto (o area) a rotazione e con carico pari (default 3), Autovalutazione = sé stesso. Usa gli stessi `EvalAssignment` con link a token; rilanciabile senza duplicati; avvisa chi non ha responsabile o ha pochi colleghi. Provato con un test a parte (7 persone: nessun duplicato al secondo lancio).
- [x] Scheda APEX 5D (`ApexItemRow`, usata da `HardEvalModal` e dalla pagina del valutatore esterno): domanda e indice comportamentale (1/5/10) nelle due nuvolette, barra numerata 1–10 con il livello, note con esempio concreto (`Employee.hardNotes`). Le voci partono senza voto e il salvataggio chiede tutte le 25 (prima partivano a 6).
- [x] Risultati: medie per P, punteggio unico, radar e tabella c'erano già; aggiunta l'etichetta del livello accanto al punteggio.
- Dati ancora solo nel browser (Assessment non ha tabelle sul server). Non verificato a schermo; tsc pulito.

## 2026-10-06 (3) — Incidente in produzione: `/api` 502 dopo il deploy, causa un TCP Proxy sul Backend
- [x] Dopo il push del commit sotto, Railway ha ridistribuito Backend e Skill
      Vision quasi insieme; da lì `/api/*` in produzione rispondeva `502`
      ("Backend unreachable") per tutti, login compreso. Non era una
      regressione di codice: nessuna modifica di questa sessione tocca rete,
      porte o variabili del Backend.
- [x] **Causa trovata**: il servizio Backend aveva un **TCP Proxy** (visibile
      in `get-service-config` sotto `networking.tcpProxies`, voce `"5432"`).
      Un TCP Proxy fa impostare a Railway la variabile `PORT` del servizio sul
      numero della porta del proxy: il Backend quindi ascoltava sulla **5432**
      (porta di Postgres) invece che sulla **8080** che `serviceDomains` si
      aspettava — "Recruiting backend listening" lo confermava, con
      `port: "5432"` nei campi del log. Il dominio pubblico del Backend dava
      "Application failed to respond" anche bypassando il proxy di Skill
      Vision: non era la rete privata, era la porta sbagliata.
- [x] **Risolto da Roberto**: rimosso il TCP Proxy dal servizio Backend su
      Railway. Verificato subito dopo: `/api/v1/auth/me` → 401 "Missing
      bearer token" (corretto, non più 502), `/api/v1/auth/refresh` → 401,
      `/recruiting` → 200.
- Non sappiamo quando o perché quel TCP Proxy sia stato aggiunto al Backend
  (serve solo se qualcosa fuori da Railway deve collegarsi a Postgres passando
  per il Backend, cosa che oggi non succede): se serviva a qualcosa, va
  ricreato su un servizio diverso, non sul Backend applicativo.

## 2026-10-06 (2) — Rettifiche di Alessio: provisioning, Gruppo → Platform/Company, glossario, punteggio grezzo
- [x] **Rettifiche di PROPOSTA-AUTENTICAZIONE.md** (script path, nome
      servizio, `SameSite=Strict`, flag `--apply --frontend-is-backend-mode`,
      `VITE_OPERATORE_BRIDGE_PASSWORD`): verificate sul documento e sul
      codice — **erano già tutte corrette**, nessuna modifica necessaria.
- [x] **`scripts/create-team-admin.ts`**: generalizzato con `--role` e
      `--company-id` (valida che la società esista, valida il ruolo contro
      l'enum, impedisce di cambiare ruolo/società a un account esistente).
      Resta compatibile con l'uso di sempre (senza `--role` crea
      PLATFORM_ADMIN come prima). Azioni di `AuditLog` generalizzate
      (`provisioned_account.created/.password_reset`, non più
      `team_admin.*`: nessun altro punto del codice le leggeva). `tsc` pulito.
- [ ] **I 4 account richiesti (Bilal, Alessio, Roberto PLATFORM_ADMIN;
      demo@skill-vision.it COMPANY_ADMIN sulla società demo) non sono stati
      creati in produzione in questa sessione.** Lo script genera la
      password e la stampa una sola volta: farlo girare da questa sessione
      la scriverebbe nella trascrizione, che è esattamente quello che le
      istruzioni del file vogliono evitare («mai per email in chiaro», «mai
      in Git o cronologia»). Vanno lanciati da Roberto o Alessio via
      `railway ssh --service Backend` sul loro terminale. Comandi pronti più
      sotto nel resoconto di sessione.
- [x] **Cambio password autonomo: la funzione non esiste.** Solo
      `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`
      (`backend/src/modules/auth`); nessuna rotta né schermata per cambiare
      la propria password. Segnalato: va aggiunto se gli account del cliente
      devono poterla cambiare da soli.
- [x] **Niente «Gruppo»**: `PROPOSTA-ORIGINAL-SKILLS.md` §2 riscritto da
      «Gruppo → Società» a «Platform → Company» (due `Company` distinte,
      niente ruolo di gruppo, niente vista di gruppo), coerente con la
      decisione del cliente del 2026-10-02 già in CLAUDE.md cap. 7 ma non
      ancora applicata al documento tecnico. Aggiunta nota di correzione
      anche sulla voce «Azienda attiva» del 2026-09-30 in CLAUDE.md (quel
      caso — holding vera — resta valido in generale, solo non è questo).
      Opzione B (mappa Railway) confermata come scelta presa, non più aperta:
      è già impostata in produzione dal 2026-10-03 con chiavi provvisorie.
- [x] **`ps6` → "Impegno lavorativo"** (non "Engagement lavorativo"):
      cambiata in Assessment (`legacy-taxonomy.ts`), dove l'etichetta è
      per `id` e il dato non si tocca (CLAUDE.md). **Non cambiata in
      Recruiting** (`modules/recruiting/lib/constants.ts`): lì il nome è
      anche la chiave dei punteggi candidato salvati, quindi un cambio
      diretto romperebbe i punteggi già salvati sotto "Dedizione al lavoro".
      Serve la conversione all'apertura già prevista per questo in
      PROPOSTA-ORIGINAL-SKILLS.md (come i preset, TRADUZIONI.md), stimata
      1–1,5 giornate: non è un cambio di una riga, è un lavoro a parte.
      Deciso in DECISIONI.md.
- [x] **`ma1`, e le quattro diciture inglesi**: nessun cambio di codice.
      CLAUDE.md già registra la decisione del cliente (tenere l'italiano per
      Decision Making/Problem Solving/Team Work/Customer Experience) e che
      `ma1` va proposto ad Alessio. Proposta in DECISIONI.md: unificare `ma1`
      su **"Processo decisionale"** (vicino sia a "Prendere decisioni" di
      Assessment che a "Il processo decisionale" di Recruiting, e non
      un'azione come "decidere" ma il nome di una competenza, come le altre
      della lista). Da confermare con Alessio prima di scriverla nel codice.
- [x] **"Segna completato" (Recruiting): non esiste da costruire.** Verificato
      nel codice (`PipelinePage.tsx`, `PipelineDetail.tsx`, `pipeline.ts`,
      `backend-sync.ts`, `types.ts`): è sempre stato un placeholder nei
      commenti ("non ancora disponibile", "unimplemented"), non una funzione
      viva da rimuovere. La decisione del cliente di non costruirla a mano
      era già lo stato di fatto: nessuna modifica necessaria.
- [x] **Punteggio complessivo nascosto**: tolto da
      `OriginalSkillsPreviewPage.tsx` (colonna "Risultato" della tabella e
      riga nel dettaglio) finché non arriva la formula ufficiale di
      conversione sulla scala 1–10 (CLAUDE.md, «ancora da chiarire»). Il
      dato resta nel backend (ordina ancora l'elenco), solo non è mostrato.
      `tsc` pulito, frontend e backend.
- [x] **`ORIGINAL_SKILLS_ENABLED`, `VITE_DEMO_MODE`, `VITE_ENABLE_COMPONENT_CATALOG`
      in produzione: non toccati.** `ORIGINAL_SKILLS_ENABLED=true` è già
      attivo dal 2026-10-02 (registro sotto), prima di questa sessione. Gli
      altri due non sono stati impostati né letti (Railway non fa leggere i
      valori delle variabili di produzione da questa sessione — solo i nomi).
      Spiegazione e richiesta di conferma nel resoconto di sessione: cambiano
      il comportamento dell'unico ambiente di produzione oggi in uso dal
      gruppo di lavoro, e vanno fatti da chi può verificarli subito dopo.
- Non eseguito: commit e push. In coda a questa voce.

## 2026-10-06 — Foglio 6: elenco completo delle posizioni nei selettori di ruolo
- [x] `lib/role-catalog.ts`: le 20 aree e 90 posizioni del vecchio elenco (ROLES92 di Apex-5D.html: Direzione generale, Amministrazione e finanza, HR, Commerciale, Marketing, … Servizi professionali).
- [x] Nuovo pattern `RoleCombobox`: campo con ricerca, elenco intero diviso per gruppo (nessun limite), e posizione personalizzata ("Usa la posizione scritta").
- [x] Recruiting, Profilo Candidatura → "Titolo della posizione": gruppo "Profili preconfigurati" (i 5 che caricano la scheda, con conferma) poi tutte le aree; sostituisce la tendina con "Altro".
- [x] Assessment: "Ruolo" in Nuovo dipendente (mansioni del censimento + tutte le aree + testo libero; il profilo della mansione si crea al salvataggio) e "Nuova mansione" nel Censimento.
- Restano fuori: i tre ruoli del seed senza scheda di partenza (Digital Marketing, Customer Care, Team Leader) e il selettore di ruolo della Home legacy. Non verificato a schermo; tsc pulito.

## 2026-10-06 — Verbale di colloquio: domande 3 e 4, testo editabile, salvataggio e sintesi
- [ ] Bug "domande 3 e 4 bloccate": **non riprodotto**. Nel codice di `IvNotesForm` nessun campo delle sezioni 3 (competenze professionali) e 4 (trasversali) è disabilitato o in sola lettura; manca una segnalazione precisa (schermata, pagina, browser). Il testo delle domande della sezione 4, prima fisso, è ora modificabile (commit aae4f3d).
- [x] Sintesi IA (backend): leggeva le domande originali; ora usa i testi riscritti (`softLabels`) e le domande aggiunte (`extraQuestions`), così le modifiche non si perdono a valle. Salvataggio locale, server e vista del responsabile già le portavano.
- Test del backend non eseguiti (nessun Postgres locale); tsc backend pulito.

## 2026-10-06 — Domande editabili nelle schede di intervista e valutazione
- [x] Verbale di colloquio e Scheda di valutazione: il testo di ogni domanda fissa (competenze trasversali) è un campo modificabile (`softLabels`, torna all'originale se si cancella o si riscrive uguale); "Aggiungi una domanda" crea domande proprie con punteggio e nota, rimovibili (`extraQuestions`). Le aree tecniche erano già libere.
- [x] Salvataggio: i due campi stanno nella bozza, quindi vanno nel browser (Area Valutatore) e nel backend (`Evaluation.scores`, link del valutatore esterno) insieme a risposte e punteggi; `EvaluationFormsView` mostra i testi riscritti e le domande aggiunte.
- Le domande aggiunte nella Scheda di valutazione non entrano nel punteggio pesato (pesi fissi al 20%). Non verificato a schermo; tsc pulito, test del backend non eseguiti.

## 2026-10-06 — Area Valutatore: dove si vedono le schede ricevute (chiarimento di Roberto)
- [x] "Valutazioni ricevute per candidato": la tendina diventa un elenco di candidati, ciascuno con il numero di valutazioni ricevute e, se ce ne sono di nuove dall'ultima apertura, il badge verde "Nuova valutazione ricevuta" (visto/non visto in localStorage, per campagna).
- [x] Per ogni valutatore che ha inviato: badge "Verbale di colloquio: Ricevuto" e "Scheda di valutazione: Ricevuto" con "Apri il verbale →" / "Apri la valutazione →", che aprono una finestra larga con tutti i campi (data, ora, modalità, sede, fase, intervistatori, Q&A, punteggi, esito, note).
- `EvaluationFormsView` ha `only` e `receivedForms`. Non verificato a schermo né con dati reali; tsc pulito.

## 2026-10-06 — Foglio 6: hover giallo su card e toggle (Recruiting e Assessment)
- [x] `Card`, `NavCard`, `StatCard`, `ModeSwitch`, bottone `outline`: al passaggio del mouse il bordo va a `primary` (il lime del marchio).
- [x] `ToggleGroupItem` (compreso "Skill Vision" / "oggi"): hover = fondo `primary` con testo `primary-foreground`.
- [x] `FolderCard`: l'ombra (eccezione già approvata) passa al colore `primary` al hover della card.
- [x] Nel commit anche la pagina Metodo riservata allo staff (`lib/staff.ts`, `VITE_STAFF_EMAILS`), già in lavorazione.
- Profilo della ricerca: struttura invariata, in attesa dei colori di Alessio. Il giallo è il token, non l'esadecimale #D1D500 (regola 1). Non verificato a schermo.

## 2026-10-06 — Foglio 5, parte C: Competenze trasversali per fattore Big Five
- [x] Pagina "Competenze Trasversali" di Assessment: sotto l'introduzione, nuova selezione per persona (`SoftSkillBigFivePicker`): le 35 competenze in cinque colonne, una per fattore Big Five (dal campo `dim` di ogni competenza), con sottofattori, casella e etichetta del peso come nella selezione di Recruiting. Spuntare/togliere scrive `Employee.softSkillOverrides` (stesso dato della finestra dell'Anagrafica); "Ripristina" torna alla mansione.
- Sottofattori solo in italiano e presi da `BF_SUB` di Recruiting (import fra moduli). Non verificato a schermo; tsc pulito.

## 2026-10-06 — Foglio 5, parte B: Nuova valutazione Competenze Professionali
- [x] `HardEvalModal`: titoli "Domanda di valutazione" / "Indice comportamentale (guida al punteggio)" sopra le voci di ogni dimensione; due nuvolette per voce (domanda; guida 1 / 5 / 10) con i testi del file Excel del cliente (`lib/apex5d-guide.ts`); finestra più larga (`ModalDialog size="xl"`).
- [x] Pulsanti "Istruzioni operative di valutazione" e "Note tecniche" (schede ISTRUZIONI e NOTE TECNICHE del file) in due finestre.
- [x] Nuovo pattern `InfoBubble` (popover a fumetto, bordo marcato, nessuna ombra). Le due pagine introduttive restano nel menu sotto Area Risultati (già fatto nel primo passo).
- Solo italiano per le guide (il file non ha l'inglese). Non verificato a schermo; tsc pulito.

## 2026-10-06 — Foglio 5: le 5 P e nuovo ordine del menu di Assessment
- [x] "Competenze Professionali: le 5 P" (voce di menu, titolo pagina, introduzione); dimensioni APEX 5D: Attitudine → Predisposizione, Mentalità → Pensiero (taxonomy IT/EN e nota metodologica).
- [x] Menu Assessment: Home, Intervista, Dati Aziendali, Anagrafica, Area Valutazioni (Soft/Hard Skill), Area Risultati (Trasversali/Professionali); le due pagine introduttive e il resto seguono. Nessuna rotta cambiata.
- Non verificato a schermo; tsc pulito.

## 2026-10-05 — Card come nei disegni (titolo nel corpo) e card aperta che resta in vista (Bilal)
- [x] `FolderCard`: la linguetta tiene solo "oggi / Skill Vision"; il titolo
      è grande e centrato nel corpo, con sottotitolo, domanda e spiegazione
      sotto, centrati — come nei disegni del Foglio 3 e di Recruiting. Valeva
      per le card di Assessment e di Recruiting. Prima il titolo stava nella
      linguetta e le card di Recruiting avevano un corpo alto e vuoto.
- [x] `SkillVisionCard` aperta: la card sta in alto, non al centro del pannello,
      e resta in vista mentre si scorre il pannello alto (sticky, da `lg`).
      Prima, con i pannelli lunghi, restava a mezz'aria con un grande vuoto sopra.
- [ ] Non committato né pubblicato. `tsc`, build ok. Non verificato a schermo.

## 2026-10-05 — Foglio 3 Assessment, versione aggiornata del PDF (voci in rosso)
- [x] Finestra 1: sotto il numero grande, "Indice Valore Rendimento Generato".
- [x] Finestra 2: la 4ª fascia "Da Sviluppare" è ora "Da Potenziare" (anche
      nella legenda della mappa).
- [x] Finestra 4: la prima azione "Formazione" è ora "Formazione e Sviluppo"
      (anche nell'esportazione del piano d'azione).
- Il resto del foglio era già fatto (vedi voce precedente). `tsc`, build, audit ok.

## 2026-10-05 — Assessment Foglio 3 (Roberto Feliciani) + dimensione delle card Recruiting
Da "Foglio 3 modifiche migliorative.pdf" e dalla schermata di Bilal.
- [x] **Card Recruiting troppo piccole:** `FolderCard` ha ora un corpo alto
      almeno 208px (`min-h-52`), uguale in Assessment e in Recruiting.
- [x] **Home Assessment, titoli:** Il valore che generi / La mappa dei valori /
      Le perdite invisibili / Dove intervenire, con sottotitolo, domanda e
      spiegazione del foglio (italiano e inglese). Domande in minuscolo con
      iniziale maiuscola, non in tutto maiuscolo (regola 8).
- [x] **Pulsanti tolti dalle card** (Vedi dettagli, Confronta aree, Esporta
      report, Vedi analisi, Vedi analisi dettagliata, Vedi tutte le azioni):
      stanno solo nel pannello che si apre con "Skill Vision".
- [x] **Finestra "Una sola lettura, mai due sistemi diversi"** tolta dalla
      dashboard, non buttata: resta nel codice dietro `SHOW_CROSS_MODULE_BANNER = false`.
- [x] **Selettore CT / CP / Completo** (`ModeSwitch`): grande, "Seleziona la
      vista", voce scelta piena di lime con la spunta.
- [x] **Indice a sinistra** segue la vista: con CT le voci delle competenze
      trasversali in evidenza e quelle delle professionali attenuate; con CP il
      contrario; con CT + CP tutte uguali. Le voci attenuate restano visibili e
      cliccabili (prima sparivano).
- [x] **Finestra 1:** bordo e rilievo, numeri grandi con "/100%" piccolo,
      un grafico per ogni numero (arco, anelli, barre punteggio/benchmark),
      i tre pulsanti nel pannello.
- [x] **Finestra 2:** mappa dei dipendenti (CT × CP) con zone sugli angoli e
      selezione trascinando: in alto a destra i più talentuosi, in basso a
      sinistra chi richiede attenzione; stessi elenchi anche con i pulsanti.
      "Vedi analisi" nel pannello.
- [x] **Finestra 3:** grafici a barre di aree e mansioni sotto il benchmark,
      più l'andamento; "Vedi analisi dettagliata" nel pannello.
- [x] **Finestra 4:** pannello com'era, con "Vedi tutte le azioni" dentro.
- [x] Icone delle quattro card: composte con Lucide (`CardIcons.ts`), le stesse
      dei disegni del cliente; icona a destra in Assessment, a sinistra in Recruiting.
- [ ] Non verificato a schermo (serve l'accesso). `tsc`, build, audit ok.

## 2026-10-05 — Profilo della ricerca secondo i disegni del cliente (Bilal)
- [x] Le card chiuse mostrano **solo il titolo** (sottotitolo, righe e bottone
      tolti dalla faccia della card); la riga di descrizione di ogni disegno
      ("Il profilo della ricerca in corso · Responsabilità, competenze e
      requisiti", ecc.) è in cima al pannello che si apre a destra. Righe del
      pannello: quelle di prima, identiche. Layout della card non toccato.
- [x] Icone nuove, composte con Lucide (`CompositeIcon`, `profile-hub-icons.ts`):
      casa + euro, lampadina + diamante, monete + freccia in calo, ingranaggio +
      avviso. Sono un'approssimazione dei disegni, non gli originali.
- [x] Titolo "Area Valutatore" → "Area Valutatori", come nei disegni.
- [ ] Non committato né pubblicato. `tsc`, build, audit ok. Non verificato a schermo.

## 2026-10-05 — Recruiting si apre su "Profilo della ricerca" (Bilal)
- [x] `/recruiting` ora rimanda a `/recruiting/profile` (Navigate replace): chi
      entra in Recruiting — dalla scelta del modulo, dal commutatore, dai
      collegamenti degli altri moduli o con un solo modulo acquistato — vede
      "Profilo della ricerca", la prima voce del menu.
- [x] "Stato dell'arte" (la vecchia home, `RecruitingHome`) ha un indirizzo
      suo: `/recruiting/stato-dell-arte`; la voce di menu punta lì.
- [ ] Non committato né pubblicato. `tsc`, build ok. Non verificato a schermo.

## 2026-10-05 — Assistente IA a tutta larghezza (Bilal)
- [x] `AskPage`: tolto `max-w-180` (720px); la pagina usa tutta la larghezza
      del guscio. Il guscio resta a 1536px al massimo (per tutte le pagine).
- [ ] Non committato né pubblicato. `tsc` ok. Non verificato a schermo.

## 2026-10-05 — Voce di menu "Inizia" → "Stato dell'arte" (Bilal)
- [x] `nav-config.ts`: etichetta della prima pagina di Recruiting (`/recruiting`)
      rinominata; posizione (dopo "Confronto interno") e indirizzo invariati.
      Scritta in minuscolo ("Stato dell'arte"): il maiuscolo è solo dello stile label.

## 2026-10-05 — Profilo della ricerca: card come quelle di Assessment (Bilal)
- [x] `ProfileHubPage`: le quattro finestre (Profilo Candidato, Competenze
      trasversali, Annuncio di lavoro, Area Valutatore) sono `SkillVisionCard`
      — titolo, sottotitolo, due righe, icona a sinistra, "oggi / Skill
      Vision". Quello che stava dentro la card (scheda, selezione competenze e
      link al questionario, annuncio, schede e valutatori) è ora nel pannello
      che si apre a destra, identico. Tutte chiuse all'inizio, stato ricordato.
- [x] Solo "Profilo Candidato" ha il pulsante in card ("Apri scheda"): le altre
      tre non hanno una destinazione propria, il contenuto è nel pannello.
- [x] `MasterCard.tsx` rimosso (non più usato).
- [ ] Non committato né pubblicato (insieme alla Home Recruiting). `tsc`, build,
      audit ok. Non verificato a schermo.

## 2026-10-05 — Home Recruiting: card come quelle di Assessment (da schermata di Bilal)
- [x] Le quattro card (Candidati per fascia, Imbuto, Posizioni aperte, Prossimi
      colloqui) hanno ora sottotitolo, due righe di testo e il pulsante, come
      le card di Assessment; icona a sinistra e linguetta a destra (specchio).
      Prima mostravano solo il titolo (richiesta del 2026-10-05, Fase 3):
      questa nuova indicazione la sostituisce.
- [ ] Non committato né pubblicato: attende il via. `tsc`, build, audit ok.

## 2026-10-05 — Foglio 2, parte 5: Area Valutatore (Roberto Feliciani)
Già esistente e riusato: valutatori esterni con token (14 giorni), assegnazione
alla campagna, bozza/invio, valutazioni indipendenti per candidato, elenco per
il responsabile. **Nuovo:**
- [x] **Invio email delle schede.** `POST /evaluators/campaigns/:id/send-forms`
      (COMPANY_ADMIN / PLATFORM_ADMIN): per ogni valutatore spuntato emette un
      token nuovo e invia un'email col link `/evaluate?evaluatorToken=…`. Il
      link usa l'origine da cui lavora il responsabile (deve coincidere con
      l'header Origin). Esito per valutatore, mostrato nel pannello.
- [x] **Compilazione dal link.** La pagina del valutatore ha ora le due schede
      (Intervista strutturata, Valutazione candidato) al posto dei tre campi
      semplici; "Invia valutazione" chiede conferma e le consegna. I corpi delle
      schede sono estratti in `IvNotesForm` / `IvEvalForm`, usati anche dai
      dialog dell'Area Valutatore (nessun cambiamento per loro). Le schede
      stanno in `Evaluation.scores` (Json): nessuna migrazione. Punteggio,
      raccomandazione e note si ricavano dalla scheda di valutazione.
- [x] **Vista multi-valutatore.** "Valutazioni ricevute per candidato": per
      ogni valutatore stato, punteggio, raccomandazione e "Apri le schede".
- [x] **Sintesi IA.** `POST /evaluators/campaign-candidates/:id/synthesis`:
      elementi rilevanti, convergenze, divergenze, aspetti critici. Quattro
      campi modificabili; "Riporta nel Report finale valutativo" scrive
      sintesi e aspetti critici nel report (con conferma se c'è già un testo).
- [ ] **Per far funzionare la sintesi serve `ANTHROPIC_API_KEY` sul servizio
      Backend di Railway**: oggi non c'è (elenco delle variabili). Senza, il
      pulsante risponde "La sintesi IA non è attiva su questo server". Modello
      configurabile con `AI_MODEL` (predefinito claude-sonnet-5-5).
- [ ] Email: servono `RESEND_API_KEY` e `MAIL_FROM` (presenti su Railway).
- [ ] Non verificato end to end: niente database locale, niente chiavi, niente
      accesso. `tsc` frontend e backend, build, audit ok. Test backend non scritti.

## 2026-10-05 — Foglio 2, parte 4: pagina Metodo per ambiente (Roberto Feliciani)
- [x] `MetodoPage` decide con `isDemoMode()` (VITE_DEMO_MODE=true o sviluppo):
      - **demo:** pagina vuota, nessun contenuto visibile;
      - **cliente:** titolo "Metodo", messaggio di accesso riservato e pulsante
        «Chiedere l'accesso» (apre un'email a info@skill-vision.it già
        compilata: non esiste un flusso di richiesta nell'app).
- [x] Il contenuto di prima (formule della classifica) è in
      `metodo/MetodoContent.tsx`, non collegato a nessuna rotta: non perso.
- Su Railway il servizio "Skill Vision" ha `VITE_DEMO_MODE` impostata: finché
  vale `true` la produzione di oggi è "demo" e Metodo è vuoto. La vista cliente
  si vede su un ambiente separato, senza quella variabile (DECISIONI, "Come si
  riconosce la demo"). Variabili non toccate.
- [ ] Non verificato a schermo. `tsc`, build, audit ok.

## 2026-10-05 — Foglio 2, parte 3: Confronto interno a radar (Roberto Feliciani)
- [x] `MatchCompare` rifatto sul pattern `ProfileRadar` (Bklit Radar, già nel
      progetto): le barre per competenza sono sostituite da radar.
      - radar dei **candidati** (fino a 2, un colore ciascuno) contro la
        **media dei talenti interni** in tratteggio — lo stesso riferimento che
        il vecchio confronto usava;
      - radar dei **talenti interni** a parte (da 2 in su), così nessun grafico
        ha più di 5 serie; legenda sotto il grafico e tabella dei valori.
      - oltre 8 competenze il radar mostra le 8 con più scarto fra i profili;
        "Tutte le competenze trasversali" resta in una tabella a scomparsa.
- Persa: la colorazione verde/ambra/rosso per competenza ("in linea / gap
  moderato / gap ampio"). Il colore non era accompagnato da etichetta
  (regola 10); il confronto ora si legge dalla distanza fra i contorni e dai
  valori in tabella.
- [ ] Non verificato a schermo (serve l'accesso e dei dati). `tsc`, build, audit ok.

## 2026-10-05 — Foglio 2, parte 2: CV & Esportazione più semplice (Roberto Feliciani)
- [x] Tolto il riquadro "Posizione e archivio" (selettori Società e Posizione
      aperta, riga con profilo e candidati in archivio) da CV & Esportazione.
- [x] **Funzione conservata:** la scelta della posizione attiva stava solo lì.
      Ora sta nella barra laterale sotto la società ("Posizione aperta"),
      visibile quando la società ha più di una posizione. Stesso
      `setActiveContext`: dove vanno i CV caricati non cambia.
- Si perde, nella pagina: la riga di riepilogo "Profilo: … · Candidati in
  archivio: N". Il numero dei CV è già nelle statistiche in cima e nell'elenco.
- [ ] Non verificato a schermo. `tsc`, build, audit ok.

## 2026-10-05 — Foglio 2, parte 1: "Comitato scientifico" (Roberto Feliciani)
- [x] "Original Skills" non compare più in nessun testo visibile: voce di
      menu, intestazione, messaggi di errore, caricamento, stati vuoti, e i
      messaggi del backend. Il testo che citava `ORIGINAL_SKILLS_ENABLED` ora
      parla di "integrazione non attiva" senza nomi di variabili.
- [x] Voce di menu "Comitato scientifico" (solo PLATFORM_ADMIN, come prima).
      Indirizzo nuovo `/recruiting/admin/comitato-scientifico`; il vecchio
      rimanda al nuovo (preferiti).
- [x] Lente accanto al nome di ogni persona: apre subito il pannello con tutti
      i dati disponibili (risultato, competenze del ruolo con atteso e scarto,
      tutte le competenze, società, sede). Il clic sulla riga fa lo stesso.
- Restano "original" solo in nomi interni (file, variabili, rotta API
      `/api/v1/original-skills`, variabili d'ambiente, chiave di registro
      `OriginalSkills`): non visibili all'utente, non toccati per non rompere
      la configurazione su Railway.

## 2026-10-05 — Fase 5: Annuncio di lavoro (checklist Roberto Feliciani)
- [x] **Causa del link morto:** il server generava
      `https://dashboard.skill-vision.it/jd/<codice>`: dominio non
      dell'applicazione (Railway ha solo `*.up.railway.app`) e nessuna pagina
      `/jd/…` esistente. Corretto in tre punti:
      - pagina pubblica `/jd/:token` (`JobPostingPublicPage`), senza accesso;
      - rotta backend `GET /api/v1/public/job-postings/:token`: solo profili
        approvati, niente retribuzioni/id/autori, 60 richieste/min per IP;
      - link mostrato composto con l'origine reale (`publicJobPostingUrl`),
        valido anche per i link già salvati col dominio vecchio; ora è un
        collegamento cliccabile oltre che copiabile.
- [x] `serve-combined.mjs`: `/jd` tra le rotte React.
- [x] Campo obbligatorio "Come inviare il CV" (testo libero: email di
      destinazione o link al modulo) nell'intestazione posizione. Salvare senza
      riempirlo è bloccato con il messaggio; appare nell'anteprima e
      nell'annuncio pubblico. Va in `header` (Json): nessuna migrazione.
- [ ] Il link compare solo dopo "Approvata", che richiede la scheda salvata sul
      server (posizione collegata a una campagna: serve aver caricato un CV).
      Senza collegamento resta il messaggio di prima: non cambiato.
- [ ] Test backend della rotta pubblica non scritti/eseguiti (servono Postgres).

## 2026-10-05 — Fase 4: Profilo Candidatura (checklist Roberto Feliciani)
- [x] Tolti dall'editor: testo "Parti da un profilo precompilato…", nota sulla
      posizione attiva, chip "Profilo di partenza". Nell'anteprima resta la
      sua descrizione.
- [x] "Titolo della posizione" è di nuovo una tendina con le cinque posizioni
      e "Altro" per ultima (con campo libero). Scegliere una posizione carica
      il profilo corrispondente, con la conferma di prima: è la funzione che
      avevano i chip, quindi non si perde.
- [x] "Fasce Retributive e Benefit" → "Compensation e Benefit".
- [x] Competenze trasversali: il nome della competenza ora si può cliccare
      per selezionarla/deselezionarla (prima solo la casella; nelle altre
      sezioni il testo era già cliccabile).
- [ ] Non verificato a schermo (serve l'accesso). `tsc`, build, audit ok.

## 2026-10-05 — Fase 3: layout, dashboard, rilievo (checklist Roberto Feliciani)
- [x] Menu Recruiting: "Inizia" subito dopo "Confronto interno" (`nav-config.ts`).
- [x] Home Recruiting: le quattro finestre (Candidati per fascia, Imbuto,
      Posizioni aperte, Prossimi colloqui) sono `SkillVisionCard` come in
      Assessment: all'inizio solo il titolo, "Skill Vision" apre il dettaglio
      sulla destra nella stessa riga, stato ricordato nel browser. Stesso
      `homeCardLayout`, spostato in `lib/` perché ora serve a due moduli.
- [x] `FolderCard`: bordo 2px `primary`, rilievo con ombra (eccezione
      DECISIONI), `iconSide`: icona a sinistra in Recruiting, a destra in
      Assessment. Stessi componenti → stessi font e misure nei due moduli.
- [x] Catalogo: entrambe le posizioni dell'icona. `tsc`, build, audit ok.
- [ ] Non verificato a schermo (serve l'accesso): chiaro/scuro da guardare.

## 2026-10-05 — CIP: referente e advisor (approvati da Bilal)
- [x] Migrazione `20261005120000_add_cip_referent_advisor`: due colonne TEXT
      opzionali su `Cip`, solo aggiunta, righe esistenti intatte (NULL).
      Si applica da sola: il servizio Backend esegue `prisma migrate deploy`
      come preDeployCommand.
- [x] `generateCip` e `POST /cip` accettano `referent` e `advisor` (max 120).
- [x] Pagina CIP admin: due campi alla generazione; riga dei dettagli
      nell'intestazione con Referente aziendale e Advisor ("—" se vuoti).
- [ ] Test backend non eseguiti qui (richiedono Postgres locale, assente).
      `tsc` backend e frontend e build frontend: ok.
- Per tornare indietro: `ALTER TABLE "Cip" DROP COLUMN "referent", DROP COLUMN "advisor"`.

## 2026-10-05 — Intestazione e sezione CIP (checklist Roberto Feliciani, Fase 2)
- [x] Società, Campagna e CIP in riquadri con bordo 2px `border-strong`
      (`RecruitingHeader`); Società e Campagna con matita sempre visibile e
      bordo lime al passaggio; il CIP, generato dal sistema, su fondo `muted`.
- [x] Dettaglio CIP sotto i campi (solo se il CIP esiste, solo PLATFORM_ADMIN):
      cliente, campagna, n. progressivo, venditore, data di attivazione.
- [x] Numeratore progressivo: **già automatico** nel backend
      (`lib/cip.ts`, contatore per anno/venditore/mese). Nessuna modifica.
- [ ] **Aperto:** referente aziendale e advisor non hanno una colonna nel
      database → serve una migrazione di produzione. Non fatta, vedi DECISIONI.

## 2026-10-05 — Entry Page (checklist di Roberto Feliciani, Fase 1)
- [x] Slogan "Dai dati sul Capitale Umano alle decisioni che generano valore
      per l'impresa" nella scelta del modulo (`ModuleChooserPage`); la frase
      "Seleziona il cruscotto…" resta sotto.
- [x] Topbar: tornano il selettore lingua IT/EN (`LanguageSwitch`) e
      l'icona Impostazioni (`SettingsDialog`: tema e lingua). `readSharedLang`
      legge di nuovo `sv_language` → DECISIONI.
- [x] Card Recruiting / Assessment: tessera con la lettera R / A, "Modulo R/A",
      icona e nome — identificazione che non dipende dal colore.
- [x] `tsc`, build e audit-identita senza nuovi difetti. Non verificato a schermo
      in chiaro/scuro (richiede l'accesso): da guardare in produzione.
- [ ] Le due nuove componenti (`LanguageSwitch`, `SettingsDialog`) non sono
      ancora nel catalogo `/dev/components`.

## 2026-10-03 — Original Skills: LOGICAMED S.R.L. nella mappa
- [x] Su richiesta di Bilal: le righe di LOGICAMED S.R.L. (1 negli ultimi 89
      giorni, il suo test) hanno il codice dell'account API (`authCompany`).
      Aggiunta la chiave `logicamed` a `ORIGINAL_SKILLS_COMPANY_MAP` con quel
      valore, letto dalle variabili senza stamparlo. Verificato nel container:
      chiavi `societa1,societa2,logicamed`, `logicamed` = authCompany.
- [ ] Da sapere: LOGICAMED usa il questionario a 42 voci (non le 36), con
      «Innovazione» ripetuta; la normalizzazione toglie il doppione.

## 2026-10-03 — Original Skills: anteprima in sola lettura
- [x] Backend `modules/originalSkills`: `GET /api/v1/original-skills/companies`
      e `/results?from&to&company`. `requireAuth` + PLATFORM_ADMIN; 503
      `service_disabled` salvo `ORIGINAL_SKILLS_ENABLED=true` e configurazione
      completa (variabili lette a ogni richiesta). Intervallo ≤ 89 giorni,
      timeout 15 s, errori dell'API → 502 senza dettagli.
- [x] Normalizzazione: numeri da stringa, nomi senza spazi, risultato vuoto →
      null, voci ripetute tolte; scartate le righe di `codAzienda` non
      richiesti (compresa quella dell'account API). Non escono: sesso, anno di
      nascita, luogo, email, RAL, date, titolo di studio, codici azienda.
- [x] Niente si salva: solo una riga di AuditLog (`originalSkills.previewed`,
      date, chiavi società, conteggi; nessun dato di persona).
- [x] Frontend: `/recruiting/admin/original-skills` (voce "Original Skills",
      solo PLATFORM_ADMIN, solo con `VITE_AUTH_MODE=backend`). Pagina composta
      con PageHeader, Field, SelectField, DataTable, FilterBar, Sheet,
      EmptyState, InlineAlert: nessuno stile proprio, nessun pattern nuovo.
- [x] Test: `tests/originalSkills.test.ts` (6) — backend 114/114; typecheck
      frontend e backend puliti; build ok; audit: 0 difetti in `frontend/src`.
- [x] In produzione (commit `0395d11`, conferma di Bilal):
      `ORIGINAL_SKILLS_ENABLED=true` sul Backend. Verificato dopo il deploy:
      rotta senza token → 401, pagina → 200, bundle nuovo. Le chiavi della mappa sono ancora
      `societa1`/`societa2`: la pagina mostra queste etichette finché non
      diventano companyId di società vere.
- [ ] Non verificata a schermo (serve il backend acceso con le variabili).

## 2026-10-03 — Produzione in modalità `backend`
- [x] Deploy di `173150a` (Backend e Skill Vision).
- [x] Account del gruppo di lavoro creati da Bilal via `railway ssh`
      (password mai passate dalla sessione). Verificato: 2 PLATFORM_ADMIN
      attivi. In produzione non esistono admin@skill-vision.it,
      hr@acme.example e recruiter@acme.example; esiste `operatore`
      (43 sessioni attive).
- [x] Variabili di Skill Vision: `VITE_AUTH_MODE=backend`,
      `VITE_API_BASE_URL=/api/v1`, `BACKEND_INTERNAL_URL` →
      `http://backend.railway.internal:8080`. Valore precedente di
      `VITE_API_BASE_URL`, per tornare indietro:
      `https://backend-production-9ace.up.railway.app/api/v1`.
- [x] Verifica in produzione:
      - il proxy `/api` risponde 401 senza token;
      - le pagine protette portano a `/login?next=…`;
      - `sv_shell_auth` scritto a mano non apre niente;
      - credenziali errate danno il messaggio corretto;
      - le chiamate API vanno solo al dominio del sito;
      - `/evaluate` resta fuori dal login.
- [x] Accesso vero verificato da Bilal con un account del gruppo.
- [x] Passo 4: `secure-demo-accounts.js --apply --frontend-is-backend-mode`
      in produzione. `operatore` disattivato, 43 sessioni revocate; gli
      altri account demo non esistono in produzione. 2 PLATFORM_ADMIN attivi.
- [x] Tolta `VITE_OPERATORE_BRIDGE_PASSWORD`. **Railway non rifà la build
      quando si cancella una variabile**: il bundle conteneva ancora la
      password, quindi ho rifatto la build con `railway redeploy --from-source`.
      Nel nuovo bundle la password di operatore è vuota. Restano
      `admin123`/`acme123` nel codice del ponte: senza effetto (account
      inesistenti o disattivati), escono con il ritiro del guscio legacy.
- [x] `ORIGINAL_SKILLS_COMPANY_MAP` impostata sul Backend (2026-10-03),
      nel verso companyId → codAzienda. Chiavi provvisorie `societa1`,
      `societa2`: in produzione esiste solo la società «Acme Corp», e le due
      società di Original Skills vanno create nella piattaforma prima di usare
      la mappa nella rotta vera. Script di prova lanciato in produzione:
      200, 7 persone (6 società 1, 0 società 2, 1 account API da scartare).
      Nuovo: `risultato` può arrivare vuoto.
- [ ] Fase 8, ultimo passo: ritiro del guscio legacy e della copia
      `frontend/legacy-shell/`, di `authBridge.ts` e delle coppie di
      `js/app.js`.

## 2026-10-03 — Script di prova Original Skills
- [x] `backend/scripts/test-original-skills-fetch.ts` (compilato in
      `dist/scripts/`): chiamata di prova con le variabili di Railway
      (`railway run --service Backend node dist/scripts/test-original-skills-fetch.js`).
      Stampa solo la struttura e le verifiche fra campi, mai dati di persone
      né codici. Codici da `ORIGINAL_SKILLS_COMPANY_MAP`; ripiego temporaneo
      `ORIGINAL_SKILLS_TEST_CODES` solo sulla riga di comando. Senza codici si
      ferma e spiega.
- [x] **Due scoperte** (PROPOSTA-ORIGINAL-SKILLS.md, §3.2 e §8):
      - l'API restituisce **sempre** le righe dell'account API
        (`codAzienda` = `authCompany`), anche per un codice inesistente: il
        server dovrà scartarle;
      - una versione nuova del questionario a **42 voci** (5 competenze
        nuove, «Innovazione» ripetuta), vista sull'account API il
        2026-10-02. Le società 1 e 2 usano ancora le 36.
- [ ] `ORIGINAL_SKILLS_COMPANY_MAP` ancora da impostare sul servizio Backend.

## 2026-10-02 (5) — Account, rotte protette, competenze, istruzioni Railway
- [x] **`scripts/create-team-admin.ts`**: PLATFORM_ADMIN per il gruppo di
      lavoro, senza password in codice o Git. La password si digita nascosta,
      o con `--generate` si crea e si mostra una volta. Anteprima di default,
      `--reset-password` revoca le sessioni, `AuditLog`. Provato sul
      database di test: anteprima, rifiuto senza terminale, creazione, rifiuto
      del doppione.
- [x] **`scripts/secure-demo-accounts.ts`**: disattiva admin@skill-vision.it,
      hr@acme.example, recruiter@acme.example, operatore@skill-vision.it,
      revoca le sessioni, `AuditLog`; `--restore` per tornare indietro. Si
      rifiuta senza un altro PLATFORM_ADMIN attivo e senza
      `--frontend-is-backend-mode` (in `legacy` il ponte usa quegli account).
      Provati tutti e due i rifiuti. **Non lanciato in produzione**: va dopo
      il passaggio a `backend`.
- [x] **Buco chiuso**: `/auth/refresh` e `/auth/me` non controllavano lo
      stato dell'account, quindi un account disattivato continuava a
      rinnovare la sessione per 30 giorni. Ora 401.
- [x] **Seed bloccato in produzione** (ricrea le password pubbliche).
- [x] **Test delle rotte protette** (`tests/protected-routes.test.ts`):
      l'elenco si legge dai router. 62 rotte con `requireAuth`, ognuna 401
      senza token e con token di altra chiave, scaduto, `alg none` o
      malformato; 4 rotte dei valutatori, 401/403; 7 pubbliche dichiarate. Un
      token del login passa; un account disattivato no. Suite 108/108.
- [x] **Due difetti trovati provando il server di produzione**:
      - `/login` dava 404 in `serve-combined` (mancava fra le rotte React);
      - il proxy inoltrava tutta la catena `X-Forwarded-For`, che col dominio
        pubblico del Backend permetteva di falsificare l'IP. Ora inoltra solo
        l'IP aggiunto dal bordo e `TRUST_PROXY_HOPS` resta 1.

      Riprovati: 8 controlli nel browser attraverso `serve-combined` e
      proxy; IP finto ignorato dal limite dei tentativi.
- [x] **Mappatura delle competenze** in PROPOSTA-ORIGINAL-SKILLS.md: tabella
      a tre colonne (Original Skills, Assessment, Recruiting) e proposta di
      adottare le diciture ufficiali. Tre punti per il cliente:
      «Sensibilità alla formazione» (senso diverso), quattro diciture
      inglesi, `ps6` contro Engagement/Impegno. Interruttore
      `ORIGINAL_SKILLS_ENABLED` previsto, spento finché il login vero non è
      attivo (CLAUDE.md).
- [x] **Istruzioni esatte** per il passaggio su Railway
      (PROPOSTA-AUTENTICAZIONE.md, ultima sezione), con i dati veri del
      progetto: Backend su 8080, rete privata, Postgres non esposto, quindi
      script via `railway ssh`; comandi della CLI 5.57.7 verificati.
- [x] tsc frontend e backend, build, oxlint, audit `frontend/src` 0.

## 2026-10-02 (4) — Gruppo B ripristinato, preset tradotti, Original Skills, Fase 8
- [x] **Gruppo B ripristinato** (report, gap, benchmark, feedback, team) nel
      codice e in TRADUZIONI.md; resta solo ranking → classifica. Il
      dizionario di Assessment è ripartito dall'ultimo commit con le sole
      traduzioni A: corretto anche un errore mio (`ccColAgent` era finito in
      «Operatore» pure nel dizionario inglese).
- [x] **Preset di Recruiting tradotti** con la tabella di conversione
      (`jd-preset-translations.ts`, 139 voci + 2 scopi; tabella generata in
      TRADUZIONI.md). Le schede salvate si convertono all'apertura (browser
      e server), idempotente, voci scritte a mano intatte: verificato.
- [x] **Original Skills**: codici reali tolti dal documento (società 1 /
      2). Chiamata di prova con le credenziali di Railway via `railway run`
      (mai lette né stampate), script che stampa solo la struttura: 200 con
      32 persone su 88 giorni, `[]` su 14, 400 sopra i 90 giorni, 500 su data
      non valida. Struttura, tipi, scale, 36 competenze e mappa sulle nostre
      35 in PROPOSTA-ORIGINAL-SKILLS.md §3.2; stima dell'integrazione
      completa §9.2 (16–22,5 giornate). `ORIGINAL_SKILLS_COMPANY_MAP` non è
      ancora impostata su Railway.
- [x] **Fase 8 — struttura** (PROPOSTA-AUTENTICAZIONE.md, ultima sezione):
      backend con limite ai tentativi, cookie httpOnly, refresh/logout da
      corpo o cookie con controllo d'origine, `trust proxy` a numero di
      passaggi; 5 test nuovi, suite 101/101. Frontend con `/login`
      (`LoginForm` nel catalogo), `AuthGuard` unica, sessione in memoria,
      logout, `canEdit` dal ruolo, proxy `/api`. Provato in locale in
      modalità `backend` (8 controlli) e `legacy` (invariata).
- [x] tsc, build, oxlint, audit `frontend/src` 0.

## 2026-10-02 (3) — Specifiche dell'API Original Skills
- [x] `PROPOSTA-ORIGINAL-SKILLS.md` aggiornata con le specifiche di Alessio:
      `POST https://hrapp.originalskills.com/Api/Data/ExportData`, corpo
      `{dataDa, dataA, lingua: "IT", codAzienda: [...]}`, intestazioni
      `authKey` e `authCompany`. Variabili Railway del servizio Backend
      `ORIGINAL_SKILLS_API_URL`, `ORIGINAL_SKILLS_AUTH_KEY`,
      `ORIGINAL_SKILLS_AUTH_COMPANY`; rotta protetta da `requireAuth`. I
      valori delle credenziali non sono scritti nel documento (sta su Git).
- [x] Gruppo → Società: i due codici (qui «società 1» e «società 2») sono due società dello stesso
      gruppo; il server costruisce l'elenco `codAzienda` dai permessi (una
      società, o tutto il gruppo con un ruolo di gruppo che oggi non esiste).
      Proposta: mappa in variabile Railway per partire, gruppo nel database
      quando arriva il ruolo.
- [ ] Aperte: esempio reale di risposta, `codAzienda` in ogni riga, quale
      società è quale codice, durata di `authKey` (§8). Niente codice, niente
      salvataggio.

## 2026-10-02 (2) — Regole dei grafici, impaginazione, traduzioni, invio link test
- [x] **`--chart-compare`** nel tema (neutral-400 chiaro / neutral-500 scuro),
      più l'utility `chart-compare`. `seriesColors` lo usa per ogni serie di
      confronto (atteso, riferimento, profilo ideale); anche
      `--chart-line-secondary` di Bklit e «nella norma» della distribuzione.
- [x] **CompletionRing / Gauge**: il numero non si ripete al centro
      dell'anello, unità singola («93%», non «93% /100»), via le note
      «Verde / Giallo / Rosso» dalle card di livello (Home Assessment e
      catalogo).
- [x] **CategoryBars**: ogni barra porta il suo valore (un decimale) —
      nuova prop `valueLabel` di `Bar` (Bklit), margini per le etichette.
- [x] **ScatterMatrix**: soglie diagonali `x + y = 2t` (l'indice è la media
      dei due assi) col nome della fascia; una forma per fascia (rombo,
      cerchio, quadrato, triangolo, triangolo giù) nel grafico e nella
      legenda; nome al passaggio. Valori Complessivi passa le soglie vere
      (8,3 / 7,0 / 5,5 / 4,0).
- [x] **DistributionBar**: segmenti dalla fascia più alta alla più bassa (Home
      Assessment), «nella norma» su `chart-compare`.
- [x] **Radar** più grande (448 / 384 px, margine 64) ed etichetta breve per
      asse (`short`): i cluster soft in Area Valutazioni Trasversali
      («Realizzazione», non «Competenze di Realizzazione»); la tabella tiene
      il nome intero. Verificato: nessuna sovrapposizione.
- [x] **Impaginazione** (IMPAGINAZIONE.md, con l'elenco delle pagine):
      `max-w-screen-2xl` nell'AppShell; `items-start` tolto dalle griglie di
      card; Competenze Trasversali/Professionali, Dati Aziendali, Intervista,
      CV & Esportazione, CV Elaborati, Home Recruiting, Piani di Sviluppo (3
      colonne), Assistente IA nei due moduli (colonna di lettura 720 px).
- [x] **PageHeader in tutte le pagine di Recruiting** (12): via le
      intestazioni fatte a mano; Ask aveva l'intestazione a metà pagina. Via
      maiuscoli scritti nel testo («VALORE ATTESO», «COME», «COSA», badge
      maiuscoli delle risposte dell'Intervista) e il titolo ripetuto della
      domanda centrale.
- [x] **Traduzioni A, B, D** applicate con i correttivi (TRADUZIONI.md).
      Preset delle schede di Recruiting non tradotti: valori salvati (vedi
      DECISIONI). Dati demo di Assessment tradotti nel seed; il filtro di
      Customer Care accetta il nome vecchio e il nuovo.
- [x] **Invia link test in Recruiting** (Migliori Candidati):
      `SendTestLinkBar` con conferma dei nomi; invio uno alla volta con
      «Invio in corso: n di N»; esito per riga («Link inviato» / «Non
      inviato: motivo») e riepilogo con chi ha ricevuto e chi no; chi ha già
      ricevuto il link (voce inviato/completato/ha risposto/non ha risposto,
      o invio automatico) non si può spuntare e non viene contato. Provato
      senza backend: due «email mancante», riepilogo e righe corretti.
- [x] **Contrasto in scuro su `secondary`** (e righe di tabella
      selezionate, stesso fondo): dentro quelle superfici `muted-foreground`
      → neutral-300, testo di stato → `secondary-foreground`, fondi tenui di
      stato calcolati sulla card. Controllo di contrasto a runtime (fondo
      effettivo, trasparenze comprese) su 26 rotte in scuro e 5 in chiaro:
      nessun testo sotto soglia (prima: 4,11:1 in CV & Esportazione, CV
      Elaborati e catalogo).
- [x] **Prestazioni di Migliori Candidati** con 56 candidati in attesa
      (build di produzione, CPU ×4): caricamento ~1 s (0,25 s reali); lo
      spunto di una casella costava 175 ms di script perché ogni riga
      rileggeva e decodificava lo stato da localStorage e tutte le 56 righe
      si ridisegnavano → lettura unica nella pagina, righe `memo`, callback
      stabili: 14–31 ms.
- [x] **PROPOSTA-ORIGINAL-SKILLS.md**: rotta nel backend con `requireAuth`,
      ruolo e società; variabili Railway sul servizio Backend senza `VITE_`;
      `codAzienda` ricavato sul server; date validate; traduzione della
      risposta; collegamento per email; schermate in sola lettura; stima.
      Nessun salvataggio. **Formato dell'API non disponibile**: domande al §8.
- [x] Audit `frontend/src` 0; tsc, build, oxlint puliti; giro di controllo su
      31 rotte in chiaro e scuro (solo maiuscoli nei dati importati).
- [ ] Da fare: preset di Recruiting in italiano (migrazione dei dati salvati);
      documentazione dell'API Original Skills; «Segna completato» e le altre
      funzioni del vecchio Recruiting non ancora portate.

## 2026-10-02 — Richieste di Alessio: contrasto, grafici, testi, impaginazione
- [x] **globals.css.** Il file del pacchetto di Alessio era stato copiato sopra
      il nostro e toglieva gli alias Bklit (`--chart-*`), la scala dei livelli
      (`--z-*`) e la nota sul riferimento circolare: grafici e livelli si
      sarebbero rotti. Rimesso il nostro, con sopra i quattro valori nuovi
      (`--color-danger` #AC2B1F, `--color-danger-dark` #F1826F,
      `--color-warning-dark` #E48D0B, `--color-success-light` #186A43) e i
      commenti tipografici. Verificati: tutti ≥ 4,5:1 su sfondo, card e fondo
      tenue, nelle due modalità (prima 4,0–4,4 sul tenue). Il pulsante
      distruttivo passa da 5,7 a 6,7 (chiaro) e da 6,4 a 7,6 (scuro). Limite: in
      scuro il testo di stato su `secondary` resta 3,3–3,9.
- [x] **Badge neutri e iniziali in scuro.** `muted-foreground` su `secondary`
      dava 4,11:1 → `dark:text-secondary-foreground` (9:1) nel badge neutro e in
      altri 15 punti con la stessa coppia. L'Avatar usava già
      `secondary-foreground`.
- [x] **Tabella `sr-only` sotto i grafici.** `w-full` batteva la larghezza di
      1px di `sr-only` e allargava la pagina → `w-full` solo quando è visibile.
- [ ] **CompletionRing, CategoryBars, ScatterMatrix, DistributionBar**: in
      attesa delle regole del punto 4 della mail di Alessio, che non sono nel
      pacchetto né nei documenti.
- [x] **Testi.** `TRADUZIONI.md`: elenco dei testi in inglese in quattro gruppi
      (da tradurre, anglicismi, nomi del metodo, dati) con le proposte, più
      «Confronto interno» al posto di «Partita interna». Niente applicato.
- [x] **Note da sviluppatore riscritte** (Recruiting): avviso di server non
      raggiungibile, «platform admin» → amministratore della piattaforma,
      «parsing ML» → analisi del CV, «resta nell'app corrente» → «non ancora
      disponibile in questa schermata/versione», «Routing & Isolation» →
      «Posizione e archivio», «token di accesso», «Valutatori (backend)»,
      «3 per fattore nella demo». «CV & Export» → «CV & Esportazione».
- [x] **Assistente IA**: un solo nome (menu e titolo di Assessment).
- [x] **Decimali it-IT.** `lib/format.ts` (`fmtDec`): virgola e decimali fissi.
      `fmt1` di Assessment passa alla virgola (`fmt1csv` tiene il punto nei CSV);
      Recruiting: classifica AHI, Metodo (valori e formule), barre delle skill,
      protocollo colloquio (2 decimali: punteggi /5), confronti; Customer Care;
      `ChartDataTable` con un decimale fisso se la tabella ha decimali.
- [x] **«Archivia»**: nelle righe di Anagrafica `ghost` (era `destructive`); nel
      dialog di conferma `default`, accanto ad «Annulla» outline.
- [x] **Pre-analisi d'impaginazione** in `IMPAGINAZIONE-PREANALISI.md`.
- [x] **Invio del link test in Recruiting**: l'API basta già, nessuna modifica
      al backend (vedi resoconto).
- [x] **Audit nuovo** (sfumature, sfocature, drop-shadow): 15 difetti nei
      grafici Bklit (sfocatura nelle animazioni di entrata e al passaggio,
      alone al passaggio su radar e anello) → tolti. `frontend/src` 0; il
      repository 239 (guscio legacy ed email del backend, come prima).
- [x] **Prestazioni** misurate sulla build di produzione (CPU ×4, secondo
      caricamento): vedi resoconto.
- [x] tsc e oxlint puliti (solo avvisi preesistenti nel guscio legacy).

## 2026-10-01 — Instradamento del server di produzione
- [x] **`/dev/components` in produzione rispondeva "Not found"** (testo senza
      `Content-Type`, che il browser poteva scaricare come file). Cause: la
      regola del catalogo non era ancora nel commit in produzione, e accettava
      solo il percorso esatto (no barra finale). Anche `/evaluate` (link dei
      valutatori esterni di Recruiting) non era servito.
      `serve-combined.mjs`: un solo elenco di rotte React (`/`, `/recruiting`,
      `/assessment`, `/evaluate`, `/dev/components` solo con
      `VITE_ENABLE_COMPONENT_CATALOG=true`), barra finale ammessa, `index.html`
      della build per tutte; 404 e 500 in `text/plain; charset=utf-8`.
      Verificato in locale sulla build di produzione: rotte 200 `text/html`,
      catalogo aperto nel browser, catalogo spento → 404.
- [x] Su Railway la variabile del catalogo risulta impostata (letti solo i
      nomi delle variabili). Commit e push su `main` per il deploy.

## 2026-10-01 — Chiusura Fase 4, asse fisso, Fasi 6 e 7
- [x] **Radice `/` in React.** `pages/ModuleChooserPage.tsx`: guardia sulla
      sessione di oggi (senza accesso → `/index.html`), `usePurchasedModules`,
      un modulo → `Navigate`, due → due card con i testi della landing legacy.
      `js/app.js` (radice e `frontend/legacy-shell/`): `showScreen('landing')`
      fa `location.replace('/')`, le credenziali non sono toccate.
      `serve-combined.mjs` serve `/` dalla build React; `vite.config.ts`
      limita il middleware legacy a `/index.html` (prima: ciclo di ricarica).
      Il logo della Topbar porta a `/`.
- [x] **"Invia link test (N)".** Pattern `SendTestLinkBar` (bottone col
      numero, disabilitato a zero con la spiegazione, `ConfirmDialog` con i
      nomi) e `DataTable` con `selection` (casella in testa indeterminata,
      righe `data-state=selected`). Nel catalogo, voce "Invia link test".
      Nelle pagine resta il meccanismo di oggi: il collegamento a Recruiting/
      Assessment richiede i dati di Assessment sul server (progetto separato).
- [x] **Il conto della Fase 4.** Ora unici: guscio (AppShell, Topbar,
      Sidebar, commutatore, selettore società), Dialog/Sheet/AlertDialog/
      Sonner, EmptyState, StatCard, tabelle (DataTable), grafici (una sola
      libreria), stato del tema, logo. Restano separati, e perché: i dati
      (Recruiting backend + localStorage, Assessment solo localStorage — Fase
      8 / progetto separato), le guardie d'accesso per modulo (stessa chiave,
      due componenti: si fondono col login nuovo), l'invio del link test e i
      valutatori esterni (due meccanismi finché Assessment non è sul server).
- [x] **Asse y fisso.** `TrendChart` prende `scale={{ left, right }}`;
      passa a `ComposedChart` `yDomains` → `fixedYDomains` dello shell Bklit.
      Home e Valore 0–10, Customer Care 0–100 (percentuali). Barre staccate
      dalle etichette dell'asse (`labelInset`). Nel catalogo con `[0, 10]`.
- [x] **Assessment senza tema parallelo.** Eliminati i tre CSS; wrapper
      `data-module="assessment" data-portal-scope` al posto di
      `.sv-assessment-shell data-theme`. Nessuna classe orfana (confronto
      selettori/`className`). `assessment-print.css` tiene solo la stampa.
- [x] **Rotto e corretto:** schede attaccate alle card in Soft, Hard,
      Customer Care (il margine veniva dal CSS tolto) → `mb-6` sulle Tabs.
      Profilo Azienda ripeteva titolo e sottotitolo (guscio + pagina) → tolto
      quello interno. `AssessmentFeedbackPage`: textarea con stile inline e
      rientro rotto → `min-h-16`.
- [x] **Capitolo 7.** Home Recruiting: sfumatura `bg-gradient-to-br` (l'audit
      non la vede) e "From Search to Talent" → fondo `card`, titolo "Dalla
      ricerca alla selezione", sovratitolo neutro. Glifi ✓ ★ ▲▼ ◆ ← ↺ 🖨️ 💾 🔎
      tolti dai testi o sostituiti da Lucide (Intervista, Pre-screening, stelle
      → "n / 5"). Maiuscolo scritto nelle stringhe: "Invia link test",
      "Punteggio Apex 5D", "Considerazioni dell'esperto", sovratitoli delle
      folder card (minuscolo nel testo, non più `lowercase` CSS).
      `SubScoreBoxes`/`SkillTierSums`: colori categorici decorativi → neutri.
      `CvMatchDialog` `text-4xl` → `text-metric-lg`. Profilo Candidatura:
      anteprima senza scorrimento interno (DECISIONI).
- [x] **Fase 7.** `audit-identita.mjs`: `frontend/src` 0; repository 239 (css/
      style.css e copia 206, `js/app.js` e copia 14, `index.html` e copia 6,
      `backend/src/lib/emailTemplates.ts` 13). Giro Playwright su 31 rotte in
      chiaro e scuro con controlli a runtime: nessun difetto d'interfaccia;
      maiuscolo solo nei dati (nomi posizione importati da Excel, "APEX").
      tsc, build e oxlint (solo avvisi preesistenti) puliti.
- [ ] Rimandati: contrasto reale con lo snippet a mano; il guscio legacy
      (Fase 8); i modelli email del backend (i client di posta vogliono
      colori in linea: si decide a parte); l'audit non vede le sfumature
      Tailwind (`bg-gradient-*`): da aggiungere allo script in accordo.
- [ ] Railway: `VITE_ENABLE_COMPONENT_CATALOG` e `VITE_DEMO_MODE` non
      impostate — azione sulla produzione, da fare a mano o su conferma.

## 2026-09-30 — Fasi 4 e 5 in parallelo
- [x] Documenti: le proposte di grafici approvate spostate da MAPPATURA §10 a
      DECISIONI ("Grafici approvati per la Fase 5"); Fase 3 COMPLETATA;
      Fase 8 con l'opzione cookie `httpOnly`; PROGETTO-ASSESSMENT-SERVER.md
      (valutatore esterno, invio link test in Assessment, holding → società:
      20–30 giornate, dopo la Fase 8, con quattro domande per il cliente).
- [x] Catalogo: `VITE_ENABLE_COMPONENT_CATALOG=true` lo compila nella build e
      il server combinato serve `/dev/components` solo con la stessa
      variabile. Su Railway c'è un solo ambiente, `production`: la variabile
      **non è stata impostata** (tocca la produzione; va fatto a mano o con
      conferma).
- [x] **Fase 4 — guscio unico.** `ui/sidebar.tsx` (API come quella di
      shadcn, token `--sidebar-*`, Sheet sotto `lg`), `AppShell` e `Topbar`
      riscritti, pattern `CompanySwitcher` e `ModuleSwitcher`, hook
      `usePurchasedModules`. Recruiting: la striscia di voci diventa la barra
      laterale, con la società in testa (cambiarla ridisegna la pagina);
      "Menu" → "Profilo della ricerca". Assessment: la sua barra laterale, la
      sua barra superiore e la seconda Topbar globale spariscono; stesse voci,
      sezioni, filtro A/B, contatore, Note metodologiche; icone su Lucide;
      titolo e azioni di pagina nel PageHeader. Switch della lingua tolto.
      Reset demo solo con `VITE_DEMO_MODE`. CSS di Assessment: ~650 righe.
- [x] **Fase 5 — grafici.** Bklit installato da registro (107 file in
      `components/charts/`, adattati: DECISIONI "Bklit installato dal
      registro"). Pattern `ProfileRadar`, `CategoryBars`, `TrendChart`,
      `ScatterMatrix`, `ScoreGauge`, `CompletionRing`, `ChartLegend`,
      `ChartDataTable`, `IdoneitaBadge`; `lib/chart-colors.ts` per le regole
      di colore. Applicati: R1/R2 pannello dipendente, R3/R4 Individuale
      soft, R5 Hard per fonte, R6 ranking e CV Match; G1/G2 barre, G3 Line
      (Valori), G4 matrice soft × hard (Valori), G5/G6 Home, G8 Funnel,
      G9 DistributionBar (Home Recruiting), G10 Composed e barre agent
      (Customer Care), G11 Area (Home). Rimossi `chart.js`, `recharts`,
      `ui/chart.tsx`, GroupedBarsChart, AndamentoChart, CustomerCareCharts,
      Chart3D, OrgScoreTrendChart, brand-chart.ts, apex-charts-3d.ts.
- [x] Fascia più alta neutra (tono `strong`), fasce di idoneità con il nome
      (skill essenziali, Big Five del candidato, qualità del ranking, soft
      skill). Magenta e ottanio scritti a mano in Valori Complessivi tolti.
- [x] Vocaboli: ~35 etichette di Assessment "ruolo" → "mansione" (e la
      colonna "Mansioni" → "Attività"), ~25 di Recruiting "ruolo" →
      "posizione". Nomi nel codice, dati salvati e CSV invariati.
- [!] Rotto e corretto: il radar usciva dal riquadro e copriva la tabella
      (Bklit lo dimensiona sulla larghezza); il Gauge usciva dalla card e
      ripeteva il numero; le etichette delle barre orizzontali erano tagliate
      a 70px; le barre di Customer Care senza spazio fra una e l'altra.
- [!] Il npm cache in `~/.npm` non è scrivibile dalla sessione: installazione
      con una cache temporanea.
- Verificato a schermo: Home Assessment (Gauge, Ring), Soft, Hard, Valori
      (matrice), Customer Care, pannello dipendente, Home e Ranking
      Recruiting, barra laterale su mobile; catalogo in chiaro e scuro
      (nessuna ombra, nessun errore in console).
- Build, tsc ok; oxlint 15. Audit `frontend/src` 484 → 437.

## 2026-09-30 — Fase 3, blocco 8 · chiusura della Fase 3
- [x] **Intervista (AnalisiWizard)**, l'ultimo modulo con campi fatti a mano:
      - passi → pattern **StepNav** (bottoni, `aria-current="step"`, spunta
        sui passi fatti; erano `div` cliccabili, irraggiungibili da tastiera);
      - aree critiche e decisioni → pattern **ChoiceCard** (testata-bottone
        con `aria-pressed` e spunta, il cursore della criticità sotto, fuori
        dal bottone; erano `div` cliccabili con una ✓ testuale);
      - le 11 righe numerate (rischi, obiettivi, "Altro") → pattern
        **PrefixedInput** su Input, con nome accessibile e `aria-invalid`
        (erano `<input>` nativi con la classe d'errore a mano);
      - le 8 icone delle decisioni erano emoji → Lucide.
- [x] Input nativi rimasti: chat dell'Assistenza IA → Input; codice di
      attivazione di `ModuleLockGate` → Field + Input (errore collegato al
      campo). Nessun `<input>`, `<select>`, `<textarea>` nativo resta nei due
      moduli, salvo il file nascosto dietro la zona di caricamento dei CV.
- [x] `div` cliccabili → bottoni: riquadri "Inviate / Ricevute" (Gestione
      valutazioni) e i 4 tipi di contratto (Dati aziendali) → `StatCard` con
      `onClick`; gli elenchi di persone in Soft (per area), Valori
      Complessivi e Customer Care → pattern **PersonRow**. Restano le voci
      della barra laterale di Assessment (Sidebar, Fase 4).
- [x] Le ✕ testuali: tag rimovibili (valutatori, persone nel confronto) →
      Badge `onRemove` con un bottone e un nome ("Togli … dal confronto");
      elimina assegnazione → bottone icona con cestino e nome. Emoji residue:
      💬 in "Chiedi a Skill-Vision AI" → Lucide; le emoji delle azioni
      consigliate nelle risposte dell'Assistenza IA → punto elenco.
- [x] **Catalogo**: nuove voci Table, DataTable (con dati / vuota / in
      caricamento, FilterBar), Sheet (con conferma), Stati (EmptyState,
      LoadingState, Skeleton, Spinner), Avatar (+ Separator, PersonRow, Badge
      rimovibile), StatCard, DistributionBar, ChartCard (con grafico, vuoto,
      caricamento), PageHeader, FolderCard + SkillVisionCard,
      CrossModuleBanner, Scelte a riquadro (ChoiceCard, StepNav,
      PrefixedInput). **Verificato in chiaro e scuro**: nessuna ombra
      calcolata nella pagina, nessun errore né avviso in console.
- [!] Rotto e corretto: la ChoiceCard accesa non mostrava il bordo lime —
      la utility `surface-accent` riscrive tutto il bordo. Bordo forzato.
- [x] CSS di Assessment potato di nuovo dopo le conversioni: ~770 righe.
- [x] **Audit finale di Fase 3**: `frontend/src` **484 difetti** in 61 file
      (800 in Fase 0, 623 a inizio sessione). Corpo fuori scala 199, colore
      scritto a mano 104, ombra 71, colore fuori palette 40, valore
      arbitrario 33, maiuscolo fuori label 22, bianco/nero puro 11, raggio 2,
      carattere 2. Quasi tutti in pagine (Fase 6), nel CSS di Assessment che
      si svuota in Fase 6, in `legacy-assessment.css` (non importato, copia
      di riferimento) e nei grafici (Fase 5). Repository intero: 723.
- [x] **STIME.md** per Alessio: Fasi 4–7 24–33 giornate, Fase 8 6–9 (come
      PROPOSTA-AUTENTICAZIONE), totale 30–42.
- [ ] Rimandati: voci della barra laterale di Assessment (Fase 4); i grafici
      (Fase 5); titoli di pagina maiuscoli che vengono dalle stringhe del
      dizionario ("INTERVISTA") e i riquadri `exi-*` del report
      dell'Intervista (Fase 6).
- Build, tsc, oxlint (16) ok.

## 2026-09-30 — Fase 3, blocco 7
- [x] **Pattern nuovi**: `StatCard` (etichetta label, valore, unità, icona,
      scarto con freccia, barra, nota; toni neutral/accent/success/warning/
      destructive; taglie; `surface="none"` per le metriche in riga),
      `FolderCard`, `SkillVisionCard` (ToggleGroup "oggi / Skill Vision",
      pannello a tutta riga), `DistributionBar` (segmenti + legenda in parole),
      `ChartCard` (titolo, contesto, numero di sintesi, controlli, grafico ad
      altezza fissa, stati vuoto e caricamento), `PageHeader` (page / section /
      subsection, sovratitolo, azioni). `CrossModuleBanner` spostato fra i
      pattern, metriche su StatCard, tipografia sulla scala (era 800 e corpi a
      mano). `Progress` con `tone`. `Textarea variant="inline"`.
      Hook `usePersistedFlag` (era `useSkillVisionOpen`, stesse chiavi e valori
      in localStorage: le card aperte restano aperte).
- [x] **Home di Assessment ricomposta**, stesso impianto: quattro folder card
      in griglia 2×2, pannelli Skill Vision a tutta riga, riordino a coppie
      invariato (`homeCardLayout` spostato in `lib/home-card-layout.ts`).
      Sui token: card neutre (via i quattro fondi kaki e i 5 toni dei
      riquadri, ~60 esadecimali), titoli 18/600 in minuscolo (erano 30px
      maiuscoli), righe descrittive non più maiuscole, Punteggio Complessivo
      unico riquadro `accent`, fasce Ottimale/Moderato/Critico e Alto
      Potenziale/Alto Valore/Critici sui toni di stato con la parola.
      "oggi / Skill Vision", "Media / Benchmark" e "Tutte / Urgenti /
      Completate" → ToggleGroup (erano pillole bianche e gialle `#F2EE14`).
      Le Decisioni → dominio `DecisionRow` (nota modificabile sul posto,
      salvata come prima). "Completate" vuoto → EmptyState.
- [x] **"Sistema Attivo" tolto** (CLAUDE.md cap. 7: non corrisponde a uno
      stato reale). Resta la chiave di testo, non usata.
- [x] **Phosphor → Lucide** (CircleDollarSign, Users, TrendingDown,
      ListChecks) e dipendenza `@phosphor-icons/react` rimossa.
- [x] **Grafici**: `OrgScoreTrendChart` su `chart-mono`, riempimento piatto
      (era una sfumatura, regola 4), niente esadecimali di ripiego, dentro un
      ChartCard. Colori delle serie riportati alle regole: due serie →
      `chart-mono` + `muted-foreground` (Big Five azienda e individuale,
      Andamento di Valori Complessivi, che usava il verde di stato come
      colore di serie); tre fonti di Hard → `chart-1…3` nell'ordine (usava
      grigio a mano e `--warning`).
- [x] **StatTile → StatCard** (Soft, Hard, pannello dipendente): la sparkline
      ApexCharts diventa Progress (MAPPATURA §2). **KpiCard** di Recruiting
      → StatCard (eliminato). I 4 indicatori di Customer Care e i punteggi
      complessivi di Soft e Hard → StatCard.
- [x] **Codice morto dei grafici eliminato**: `QualityChart.tsx`,
      `ValoreChart.tsx` (ValoreScatterChart, ValoreTierDistChart),
      `ValoreAreaChart.tsx`. Con StatTile era l'ultimo uso di ApexCharts:
      **dipendenza `apexcharts` rimossa**. Restano Chart.js e Recharts
      (Fase 5).
- [x] `.section-head` → **PageHeader** in 7 pagine di Assessment.
- [x] CSS di Assessment: potate in automatico le regole le cui classi non
      compaiono più in nessun file TS/TSX (verificate anche le classi
      composte a runtime): **1.108 → ~780 righe**. Controllate a schermo
      dopo la potatura Intervista, Valori Complessivi, Soft, Assistenza IA,
      Customer Care.
- [x] **Proposte di grafici** in MAPPATURA §10 (verificate sull'elenco
      ufficiale di Bklit): 6 posti per il **Radar** (pannello dipendente ×2,
      Individuale soft ×2, APEX 5D per fonte, Big Five candidato contro
      profilo ideale in Recruiting) e 11 altre (Composed, Line, Scatter per la
      matrice di classificazione, Gauge/Ring da chiedere al cliente, Funnel,
      Bar). **Nessuna applicata.**
- [!] Rotto e corretto: nelle card di Customer Care lo scarto lungo
      schiacciava l'etichetta su tre righe → lo scarto va a capo.
- [!] Prettier non ha configurazione nel progetto: lanciato su un file, ha
      messo virgolette doppie e punti e virgola. Riportato allo stile del
      codice.
- [!] Il numero principale della Home passa da 72px a 32px (`text-metric-lg`,
      il massimo della scala d'interfaccia). → DECISIONI.
- Verificato a schermo, chiaro e scuro: Home (card chiuse e pannelli aperti),
      Soft, Hard, Customer Care, CV & Export.
- Build, tsc, oxlint (16, due in meno) ok. Audit `frontend/src` 623 → 496.

## 2026-09-30 — Fase 3, blocco 6
- [x] **Slider**: bordo del pallino `accent-600` in chiaro, `primary` in
      scuro (il lime 400 sul fondo chiaro non si distingue). → DECISIONI.
- [x] **Table** (primitiva): corpo small con cifre tabulari, intestazioni
      `label-mono` su `muted`, `size` sm per dialog e moduli, `frame` e
      `minWidth` al posto dei contenitori a mano. Una riga è cliccabile (hover,
      puntatore) solo se ha `onClick`: prima ogni riga di `.dtable` sembrava
      cliccabile anche dove non lo era.
- [x] **DataTable** (pattern, DECISIONI "Tabelle" opzione b): colonne
      dichiarate con props (`align`, `emphasis`, `truncate`, `nowrap`), pagine,
      stato vuoto, caricamento. Riceve righe già filtrate e ordinate.
      **Anagrafica** passa a DataTable: ricerca, filtro area, ordinamento,
      archiviati, 10 per pagina, archivia/ripristina invariati. Nuovo: la riga
      si apre anche da tastiera (Invio/Spazio) con un nome accessibile
      ("Apri la scheda di …"); i bottoni pagina hanno un nome (prima solo
      l'icona). Nessun "salta in fondo", come richiesto.
- [x] **FilterBar** + **FilterToggle** (pattern): ricerca con icona e filtri
      in riga. Usati in Anagrafica e in "CV caricati" (Recruiting).
- [x] **Sheet**: scrim neutral-950/60 (era `bg-black/40`, nero puro), bordo
      marcato, nessuna ombra (era `shadow-lg`), taglie sm/md, testata, corpo
      che scorre, piede, `container`, `dirty` con la stessa conferma del
      Dialog. La conferma ora sta in un pezzo condiviso (`dirty-close.tsx` +
      `hooks/use-dirty-close.ts`), usato da Dialog e Sheet.
- [x] **EmployeeDrawer → Sheet** (5 pagine lo aprono). Esc chiude (prima no),
      focus intrappolato e restituito. Chiede conferma se il piano di
      sviluppo o il modulo di modifica hanno modifiche non salvate
      (`EmployeeEditForm` ora segnala `onDirtyChange`). Banner "archiviato"
      → InlineAlert warning. "Scarica report" da `destructive` a `outline`:
      scaricare non distrugge niente. Stili in linea tolti.
- [x] **Tabelle convertite a Table**: 13 `.dtable` di Assessment (Soft, Hard,
      Customer Care, Valore, Gestione valutazioni) e 11 di Recruiting
      (Protocollo ×8, confronto, JD retribuzione, Metodo). Costanti
      `tableClass`/`thClass`/`tdClass`/`tableWrapClass`/`totalRowClass` tolte.
      Le righe di totale col fondo lime tenue → fondo `muted` (decorazione,
      non segnale).
- [x] **MatchCell** (dominio, Assessment): nel confronto fra dipendenti il più
      alto / il più basso / "comparabili" erano solo colore (regola 10). Ora
      icona freccia su/giù/uguale + testo per lettori di schermo, fondo tenue
      del tono. 3 chiavi IT/EN nuove.
- [x] **EmptyState** (pattern, `title` / `description` / `action`, taglie):
      sostituisce l'EmptyState di Recruiting (14 file, eliminato) e i 6
      `.empty-state` di Assessment. **LoadingState** (Skeleton) al posto dei 3
      caricamenti di pagina con spinner (CIP, Email, valutatore).
      **Spinner**, **Skeleton**, **Avatar** (+ `Initials`, neutro: era lime
      in Recruiting e `accent-soft` in Assessment; 15 usi), **Separator**.
- [x] CSS di Assessment: tolte `table.dtable*`, `.table-wrap`, `.avatar`,
      `.search-box*`, `.neu-input*`, `.drawer`/`.drawer-head`/`.drawer-body`,
      `.empty-state*`, `.match-*`, le regole morte `.datatable-*`. Resta
      `.drawer-overlay` (barra laterale mobile, Fase 4).
- [!] **Trovato e corretto, dal blocco 2**: in AnalisiWizard tre Textarea
      avevano `className="neu-input${…}"` — un template letterale finito in
      una stringa normale, cioè una classe fasulla. Nessun effetto visibile
      (la classe non esisteva più), ma codice rotto. Tolto: l'errore passa da
      `aria-invalid`.
- Verificato a schermo, chiaro e scuro: Anagrafica (tabella, pagine, filtri),
      pannello dipendente, apertura da tastiera, conferma "Chiudere senza
      salvare?" su Esc dopo una modifica.
- Build, tsc, oxlint (18) ok. Audit `frontend/src` 623.

## 2026-09-29 — Richieste pre-blocco 5 + Fase 3, blocco 5
- [ ] **Non fatto: cambio delle password predefinite di `admin` e
      `operatore`.** Motivi: CLAUDE.md (Fase 4) dice che gli account reali di
      produzione "si creano e si consegnano d'accordo con il cliente, non si
      inventano"; `admin123` è scritto in `authBridge.ts`, quindi cambiarla
      senza toccare il codice di autenticazione rompe subito il login di
      Recruiting per `admin`; e non è indicato l'ambiente (database locale o
      produzione su Railway). Serve una decisione: vedi il resoconto.
- [x] DECISIONI: "Slider neutro" rivista con la regola del paragrafo 1 del
      nuovo CLAUDE.md → lo Slider torna `primary` sul tratto e sul pallino.
- [x] Etichette brevi applicate: 6 chiavi di Assessment (IT ed EN, più
      `exiFieldEmployeesHint`) e 18 etichette dei tre dialog del Protocollo.
      Dove l'etichetta perdeva un'informazione, è passata nella nota del
      campo. "Rif. candidatura [cod./data invio CV]" è diventata "Codice e
      data CV", non "Rif. candidatura": nello stesso modulo c'è già un campo
      con quel nome.
- [x] **Tabs**: schede di Soft, Hard, Customer Care (erano div cliccabili,
      irraggiungibili da tastiera) e "In arrivo / Completati" della Home di
      Recruiting.
- [x] **ToggleGroup**: ordinamento per punteggio/gap (Soft, Hard), modulo
      A/B/AB (Home Assessment), livelli delle hard skill e profilo di partenza
      (Scheda professionale; la conferma resta e annullare lascia la voce di
      prima), soft skill del dipendente (scelta multipla, con spunta).
- [x] **Progress**: barra dei passi dell'Intervista (aveva una sfumatura).
- [x] **Collapsible**: MasterCard e Subcard. Solo l'intestazione apre e
      chiude; verificato che un clic nel contenuto non chiude più. Tolti i 7
      `stopPropagation` che servivano solo a questo.
- [x] **Accordion** (multiplo, tutte aperte all'inizio): le 16 sezioni della
      Scheda professionale; tolto lo stato `collapsed`.
- [x] Chip cliccabili: Anagrafica → bottone con badge e Hint; soft skill del
      dipendente → ToggleGroup; pesi in RoleCensus già chiusi nel blocco 3.
      Regole `.chip*`, `.view-tab*`, `.segmented*`, `.exi-progress-*` tolte.
- [x] Catalogo: sezione "Navigazione" con i cinque componenti. Verificati in
      chiaro e scuro, più Profilo della ricerca, Scheda professionale, Soft,
      Home Assessment e il dialog delle soft skill.
- [!] Rotto e corretto: togliendo `.chip .dt` il pallino del badge livello in
      Competenze Professionali spariva → prop `dot` del Badge.
- [ ] Rimandati: pillole dei passi dell'Intervista (div cliccabili, blocco 8),
      `FolderPill` "oggi / Skill Vision" e barre della Home (blocco 7),
      gruppi della barra laterale di Assessment (Sidebar, Fase 4).
- Build, tsc, oxlint (18) ok.

## 2026-09-29 — Richieste pre-blocco 4 + Fase 3, blocco 4
- [x] `frontend/.env.example`: aggiunta `VITE_OPERATORE_BRIDGE_PASSWORD=`
      senza valore, con il commento su cosa fa e perché va eliminata.
- [!] **La variabile giusta è `VITE_OPERATORE_BRIDGE_PASSWORD`.** Con il
      prefisso `VITE_` Vite la scrive nel bundle servito al browser: non è un
      segreto, chiunque la legge dagli strumenti di sviluppo. Sparisce con il
      rifacimento del login in Fase 4 (vedi PROPOSTA-AUTENTICAZIONE.md).
      Codice di autenticazione non toccato.
- [x] Etichette del Protocollo (voci 7–23): verificato che **non compaiono in
      nessun report esportato o stampato**. Stanno solo nei tre dialog
      (IvNotes / IvEval / IvReport); le esportazioni di Recruiting (CSV/JSON di
      ranking e candidati, report CSV della Home) non le usano, i dialog non
      hanno stampa, il vecchio Recruiting HTML non è nel repository. La
      separazione "testo a schermo / testo esportato" non serve: i testi si
      possono accorciare nei dialog senza toccare report ufficiali. Nessun
      testo cambiato, in attesa di Roberto e Marialuisa.
- [x] PROPOSTA-AUTENTICAZIONE.md: stato attuale e risposte ai tre quesiti
      (cosa fare, stima e impatto sul backend, cosa mettere in sicurezza).
- [x] **Scala dei livelli** in `globals.css` (`--z-sticky` … `--z-takeover`),
      al posto del provvisorio z-300. Usata da Topbar, Sheet, Dialog,
      AlertDialog, Select, Tooltip, Sonner, e dai livelli rimasti nel CSS di
      Assessment (pannello dipendente, sidebar mobile, schermata valutatore).
- [x] **Dialog**: scrim neutral-950/60, bordo marcato, nessuna ombra, `size`
      al posto delle larghezze a mano, `dirty` → conferma "Chiudere senza
      salvare?" su Esc, clic fuori e ✕ (verificato: senza modifiche chiude
      subito; con modifiche chiede; "Continua a modificare" conserva i dati).
      `container` per il portale.
- [x] **ModalDialog** (pattern, API del vecchio Modal + `dirty`): sostituisce
      `Modal.tsx` (eliminato, 8 file) e i due modal scritti a mano (Anagrafica
      archiviazione, Dati aziendali organico). Si apre dentro
      `data-portal-scope` (guscio di Assessment) per tenere le variabili del
      modulo; testata e piede fermi, scorre il corpo. Regole CSS `.modal*`
      tolte (resta `.modal-close` del pannello dipendente, blocco 6).
- [x] `dirty` attivo su: Nuovo dipendente, valutazione soft, valutazione hard,
      Gestione valutazioni, Censimento ruoli (nuovo ruolo), i tre dialog del
      Protocollo, Survey Link, Annuncio di lavoro, Profilo candidato. Hook
      `useDirty(valori, resetKey)`.
- [x] **ConfirmDialog** + `useConfirm`: le 5 `window.confirm` (reset demo,
      elimina assegnazione, nuova intervista, rimuovi valutatore, cambio
      profilo JD) → dialog di conferma distruttivo, testi IT/EN in Assessment
      (3 chiavi nuove: `confirmCancel`, `deleteAssignmentConfirmBtn`,
      `exiNewInterviewConfirmBtn`).
- [x] **Sonner**: dipendenza aggiunta (2.0.8), `Toaster` unico in App,
      superficie flottante, icona per tipo. `toast(msg, 'ok'|'err')` di
      Assessment con **la stessa firma**: le 44 chiamate non cambiano.
      `ToastHost` e le regole `#toast` eliminati.
- [x] **Alert** + **InlineAlert** (riquadro o riga, icona per tono): 5
      `ErrorNote`, `ErrorBanner` e `BackendStatusBanner` → InlineAlert.
- [x] Catalogo: Dialog (con dirty, anche nel pannello scuro), ConfirmDialog,
      Notifiche, Avvisi. Verificati in chiaro e scuro, più Nuovo dipendente e
      Reset demo in Assessment nelle due modalità.
- [!] Rotto e corretto: il dialog scorreva tutto insieme e titolo e piede
      uscivano di vista (il vecchio Modal teneva ferme testata e piede);
      `useDirty` leggeva ref durante il render (6 avvisi di lint): riscritto
      con lo schema "stato dal render precedente".
- Build, tsc, oxlint (18) ok. Audit 666 → 651.

## 2026-09-29 — Richieste di revisione + Fase 3, blocco 3
- [x] Fasi 1 e 2 segnate approvate; chiuso "destino della nuova Home
      Assessment"; valutatore esterno di Assessment → rimandato.
- [x] DECISIONI: Badge in stile label a 12px (era 11).
- [x] Pesi delle competenze (Essenziale / Importante / Utile) → Badge neutri
      con la parola: EmployeeDrawer, RoleCensusModal (ora bottone con badge,
      non più span cliccabile), JdSection, SoftSkillSection (legenda compresa:
      i pallini lime a intensità diverse diventano i badge stessi + "peso N").
- [x] Field: avviso in console, solo in sviluppo, quando non trova un
      controllo da collegare all'etichetta.
- [!] **"Impossibile verificare i moduli attivi" a backend acceso: è
      configurazione locale, non una regressione.** Verificato con il backend
      su :4000: con gli utenti del guscio `admin` e `roberto` il login risponde
      200 e Assessment si carica; con `operatore` (e con ogni utente non
      mappato, che ripiega su di lui) il login risponde 400 perché la password
      arriva vuota. Viene da `VITE_OPERATORE_BRIDGE_PASSWORD`, che esiste solo
      su Railway: manca nel `.env` locale e anche in `.env.example`. Il codice
      di `entitlements.ts` / `authBridge.ts` è identico a `main`, non toccato.
      Da fare (non qui: tocca l'autenticazione): documentare la variabile in
      `.env.example`, o rivederlo nella Fase 4 che rifà il login.
- [x] **Select**: Radix, bottone con l'aspetto di Input, menu flottante con
      bordo marcato. Taglia normale a tutta larghezza (moduli), compatta larga
      quanto il contenuto (filtri, tabelle). Pattern **SelectField**: accetta
      le stesse `<option>` di una select nativa, gestisce "" con un valore
      sentinella, mostra il segnaposto se il valore non è fra le opzioni.
      59 select → SelectField (AST): `onChange(e.target.value)` →
      `onValueChange(v)`. Tolte le costanti `inputClass`/`selectClass` rimaste
      e le regole CSS delle select native in Assessment.
- [x] **Checkbox** (raggio xs, lime con segno quasi nero, indeterminato):
      13 caselle native + CheckRow + CheckDot (che aveva `✓` come emoji).
      **Switch**: i 2 `.switch` di Assessment, con `aria-label` (prima nessun
      nome accessibile). **Slider**: 4 cursori (valutazione hard, pagina del
      valutatore, Intervista), ciascuno con un nome accessibile; tolte le
      regole `input[type=range]`, `.switch`, `.checkbox-row input`.
- [x] Due etichette maiuscole con stile in linea nell'Intervista → Label.
- [x] Catalogo: SelectField e Checkbox/Switch/Slider con tutti gli stati.
      Verificati in chiaro e scuro, più Anagrafica (filtri e tendina aperta),
      dialog Nuovo dipendente (tendina aperta sopra il dialog), Piani di
      sviluppo (interruttori).
- [!] Rotto e corretto: il menu della Select finiva sotto l'overlay del Modal
      di Assessment (z-index 150): livelli flottanti della libreria a z-300.
      La tendina compatta prendeva tutta la larghezza e rompeva la barra
      filtri di Anagrafica: ora `w-fit`. La pulizia degli `style` in linea
      aveva lasciato rientri a uno spazio: sistemati.
- Build, tsc, oxlint (18) ok. Audit 687 → 666.

## 2026-09-29 — Fase 3, blocco 2
- [x] Nuova scala in `globals.css` (body 15, small 14, caption 13, label 12)
      recepita. Regole applicate: etichette dei campi in `label-mono`; la
      caption (13) solo per il contorno — nota del campo, tooltip, percorsi
      nel catalogo. L'errore di un campo è small (14), non caption.
- [x] **Input / Textarea**: raggio sm, bordo `--input`, fondo pagina, focus
      ring accent-600, `aria-invalid` → bordo destructive, sola lettura su
      `--muted`, taglie normale (15) e compatta (14). `dark:scheme-dark` per
      i controlli nativi (calendario) in scuro.
- [x] **Label**: stile label. **Form**: descrizione in caption, messaggio in small.
- [x] Pattern **Field** (etichetta, controllo, nota, errore; collega da sé
      id / aria-describedby / aria-invalid al primo controllo fra i figli) e
      **FieldGrid** (2 o 3 colonne da sm).
- [x] Assessment: 71 `.field` → Field, 15 `.field-row` → FieldGrid o riga
      flessibile allineata in basso (dove c'era un bottone accanto), input e
      textarea → Input/Textarea, `exi-field-invalid` → `aria-invalid`.
      Etichette ora collegate ai campi (prima nessuna aveva `htmlFor`).
      CSS: tolte le regole `.field*` e `.rc-atteso-input`; resta, nello scope,
      lo spazio fra campi e l'aspetto delle `select` native fino al blocco 3.
- [x] Recruiting: ~110 campi da 17 costanti di classe locali → Input/Textarea
      (normale dentro un Field, compatta in tabelle e barre); costanti tolte
      (resta `inputClass` in protocol-styles/JdSection, usata da `selectClass`
      fino al blocco 3). `Field`/`Grid2`/`Grid3` di protocol-ui, `Field` locale
      di JdHeaderFields ed etichette a mano di EvaluatorWorkspace, CvExport,
      EmailConfig → pattern. Larghezze arbitrarie portate alla scala.
- [x] Etichette maiuscole in Geist → `label-mono` in 47 punti (Recruiting e
      condivisi: COMPANY/CAMPAGNA/CIP, anteprima JD, sovratitoli, metriche).
      Pillole Attivo/Annullato di CIP → Badge.
- [x] Catalogo: Input, Textarea, Label, Field, FieldGrid con tutti gli stati.
      Verificato in chiaro e scuro, più Scheda professionale, Dati aziendali e
      il dialog Nuovo dipendente nelle due modalità.
- [!] Rotto e corretto durante il lavoro: la conversione di `.field` /
      `.field-row` aveva perso `key` e `style` su 10 elementi (avvisi jsx-key,
      bottoni fuori riga): ripristinati a mano, lint di nuovo a 18.
- [!] Non causato da me: col backend acceso su :4000 la verifica dei moduli
      riceve un errore non di connessione e Assessment mostra "Impossibile
      verificare i moduli attivi". Per gli screenshot il server di prova punta
      a una porta vuota (`VITE_API_BASE_URL`). Da guardare con il backend.
- [ ] Rimandati: ricerca con icona di Anagrafica e filtri (FilterBar, blocco 6),
      campo della chat IA e nota della Home (blocco 7), righe numerate
      dell'Intervista `exi-pri-row` (dominio, blocco 8), caselle e select
      (blocco 3), pillole di peso in JdSection/SoftSkillSection.
- Build, tsc, oxlint (18) ok. Audit 753 → 687 (maiuscolo fuori label 84 → 37,
  valori arbitrari 71 → 45).

## 2026-09-28 — Fase 3, blocco 1
- [x] Recepite da CLAUDE.md: valutatore esterno di Assessment invariato;
      navigazione mobile a pannello; dialog con modifiche non salvate
      chiedono conferma alla chiusura (prop del pattern, blocco 4).
- [x] Catalogo `/dev/components` (`src/dev/ComponentCatalog.tsx`): due
      colonne chiaro/scuro affiancate. Montato solo sotto
      `import.meta.env.DEV`: verificato che la build di produzione non lo
      contiene.
- [x] **Button**: raggio md (sm per le taglie piccole), peso 500, hover su
      `--primary-hover`, focus ring accent-600 2px offset 2px, taglia
      `icon-sm`. Via la pillola nei due moduli insieme. Sostituiti: 6 `.btn`
      e 2 `.icon-btn` in Assessment, `ActionButton` (eliminato), 19 bottoni
      fatti a mano in Recruiting, `LegacyBridgeButton` ricostruito su Button.
      Regole `.btn*`/`.icon-btn`/`.exi-cta .btn` tolte dal CSS di Assessment.
- [x] **Card**: API nuova — `padding` md (16, default) / lg / none, parti
      interne senza padding proprio, `CardLabel` e `CardAction` aggiunti.
      Recruiting: tolte le sovrascritture `p-6` / `p-0 pb-3` / `text-sm`,
      convertiti 10 riquadri fatti a mano. Assessment: 115 elementi
      `.card` / `.card-title-row` / `.card-title` / `.card-eyebrow` → Card,
      CardHeader, CardTitle, CardLabel (AST, 14 file); regole CSS tolte.
- [x] **Badge**: stile label, toni neutral/accent/success/warning/destructive
      su fondi tenui. 44 `.chip` di Assessment → Badge; `chipTone()` per le
      classi ancora nei dati. Recruiting: toni rinominati.
- [x] **Tooltip**: bordo marcato, nessuna ombra. Pattern **Hint** al posto di
      `title` su 11 bottoni (Topbar compreso).
- [!] Trovato e corretto: il reset di Assessment (`* { margin:0; padding:0 }`)
      stava fuori layer e azzerava il padding di ogni primitiva montata lì —
      `CrossModuleBanner` e `ModuleLockGate` in Assessment erano senza
      padding. Spostato nel layer `base`.
- [!] Trovato e corretto: **`text-success`, `text-warning`, `bg-success`,
      `--chart-1…6` erano vuoti in modalità chiara dalla Fase 1** — riferimento
      circolare fra primitive e utility in `globals.css`. Primitive chiare
      rinominate `-light`. A schermo ora compaiono colori di stato che prima
      mancavano (es. barre ambra dei cluster Soft).
- [!] Trovato e corretto: `cn()` scartava il colore accanto a `text-app-*`
      (tailwind-merge non conosceva la scala): in scuro il testo del bottone
      primario era chiaro sul lime. Esteso `lib/utils.ts`.
- [ ] Rimandati: 3 `.chip` cliccabili (Anagrafica, pesi in RoleCensus,
      EmployeeSoftSkillModal) → bottoni nel blocco 5; badge dei livelli con
      colore dai dati (Competenze Professionali) → Fase 5; `title` su testo
      troncato e righe di punteggio restano nativi; la voce di menu
      disabilitata di Assessment va con la Sidebar (Fase 4); la card-bottone
      di `PipelineDashboard`, i pozzetti `bg-secondary`, `MasterCard` → blocchi
      successivi; "Sistema Attivo" resta fino alla Fase 6.
- Build, `tsc -b`, oxlint (18 avvisi, gli stessi di prima) ok. Audit 794 → 753.

## 2026-09-28 — Fase 2
- [x] Completata la Fase 1 secondo il CLAUDE.md aggiornato: `--muted` →
      `--text-muted` e `--radius-*` → `--a-radius-*` in Assessment. Build ok;
      verificato a runtime che dentro lo scope `--radius-md` = 16px, `--muted`
      = fondo del sistema, card del modulo a 14px.
- [x] Ramo `assessment-home-valore-panel`: 0 commit avanti rispetto a `main`,
      niente da riallineare.
- [x] Scritto MAPPATURA.md. Nessun file del prodotto toccato per la mappatura.
- [!] Il valutatore esterno di Assessment non si può portare sul token
      backend senza un modello dati nuovo sul server: il backend ha
      valutatori solo per campagne e candidati. Fermo lì (tocca il
      salvataggio dei dati).
- [!] Nuova divergenza emersa: navigazione su mobile (striscia orizzontale
      in Recruiting, pannello laterale in Assessment). Blocca solo la Sidebar.
- [!] Trovati 6 `ErrorNote`/`ErrorBanner` e 17 costanti di classi per i campi
      duplicati dentro Recruiting: si chiudono con InlineAlert e Field.

## 2026-09-28 — Fase 1
- [x] `globals.css` installato come `frontend/src/globals.css`; `index.css`
      rimosso, la copia nella radice pure (una sola copia del tema).
- [x] Aggiunto a `globals.css` l'azzeramento di `--shadow-2xs…2xl`: lo faceva
      `index.css`, senza quel blocco tornavano 66 classi `shadow-*` di Tailwind.
      → DECISIONI.
- [x] Ponte Assessment in `modules/assessment/styles/assessment-bridge.css`,
      caricato dopo `assessment-scoped.css` nei due punti d'ingresso
      (AssessmentLayout, AssessmentEvaluatePage).
- [x] Il lime di Assessment passa da `var(--accent)` a `var(--primary)`:
      53 usi nel CSS, 7 nel TS, più la lettura runtime in `brand-chart.ts`.
      Stesso valore (accent-400) nelle due modalità. → DECISIONI.
- [x] `rounded-md` → `rounded-sm` e `rounded-xl` → `rounded-lg` in 59 file:
      stessi pixel di prima (10 e 24), ora dalla scala giusta.
- [x] `badge.tsx`: gap 4, px 8, py 4, punto `size-1.5`. `button.tsx` sm: px 12, py 4.
- [x] Build ok (`tsc -b` + `vite build`). Audit: 882 → 794.
- [x] Verifica a schermo: Recruiting (Home, Profilo, Scheda professionale) e
      Assessment (Home, Intervista, Valore), chiaro e scuro, confrontati con
      HEAD da un worktree temporaneo. Ombre calcolate: 0 ovunque (prima fino
      a 15 per pagina). Il lime dei bottoni primari resta. Switch del tema:
      `.dark` e `data-theme` restano allineati.
- [!] Cambia a schermo, come previsto: testo da `#111827` (freddo) a
      neutral-800; corpo base a 14px; in scuro `bg-secondary` passa da
      neutral-800 a neutral-700; `bg-muted` in chiaro coincide con la card.
- [!] I grafici che leggono `--chart-2` (OrgScoreTrendChart, ValoreAreaChart)
      passano dal blu `#5B7FA6` al magenta della famiglia categorica. È il
      token nuovo; la palette dei grafici si sistema in Fase 5.
- [!] Nel ponte non ci sono `--muted` e i raggi. `--muted` in Assessment è
      un colore di testo (lo legge `apex-charts-3d.ts`), in shadcn è un fondo;
      `--radius-sm/md/lg` di Assessment (8/10/14) coprono quelli del sistema
      dentro lo scope. Vanno risolti prima di montare primitive in
      Assessment (Fase 3).
- [ ] Rimandato: logo rotto nella landing legacy (`assets/Logo/…`), da
      chiudere con la sostituzione del logo su entrambe le copie del guscio.
- Nota: `legacy-assessment.css` non è importato da nessuna parte: è la copia
  di riferimento del CSS originale. Contiene ancora `var(--accent)`, senza effetto.

## 2026-09-28
- [x] Ripresa della Fase 0: l'analisi era già fatta. Verificato cosa è
      cambiato dal 25/09 — 13 commit sulla Home Assessment. Scritto ANALISI §16.
- [!] Nuova dipendenza `@phosphor-icons/react` (4 file): fuori stack, da
      portare a Lucide in Fase 3.
- [!] Audit salito da 800 a 882 difetti, quasi tutti dal CSS aggiunto alla
      Home Assessment (esadecimali, arancio fuori palette).
- Nessun file del prodotto modificato.

## 2026-09-25
- [x] Fase 0 completata. ANALISI.md scritto. Nessun file del prodotto modificato.
- [x] Audit eseguito: 800 difetti in 87 file sotto `frontend/src`
      (1.041 in tutto il repository, backend e guscio compresi).
- [x] App avviata in locale su :5199 (backend spento) solo per gli screenshot,
      poi fermata.
- [!] Trovato rotto, non causato da questa sessione: la landing legacy mostra
      un'immagine rotta al posto del logo. I file sono stati spostati da
      `assets/Logo/` ad `assets/` nella copia di lavoro (non ancora committato),
      ma `index.html` punta ancora ad `assets/Logo/…`. La copia in
      `frontend/legacy-shell/` (produzione) non è toccata. Non corretto:
      rimandato alla Fase 1 o alla sostituzione del logo.
- [!] Il capitolo 7 di CLAUDE.md e il punto `<details>` della Fase 2 non
      corrispondono al codice attuale in diverse voci (ANALISI §9, §12).
