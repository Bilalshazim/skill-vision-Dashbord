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
      2026-10-02. Da lanciare in produzione nell'ordine di
      PROPOSTA-AUTENTICAZIONE.md
- [ ] Account del cliente, d'accordo con il cliente
- [ ] Passaggio su un ambiente di prova, poi in produzione (variabili in
      PROPOSTA-AUTENTICAZIONE.md, «Cosa resta»)
- [ ] Ritiro del guscio legacy e della sua copia, del ponte e delle coppie
      di `js/app.js`, nello stesso passaggio
### Progetto separato — Assessment sul server
Analisi e stima in PROGETTO-ASSESSMENT-SERVER.md (20–30 giornate, dopo la
Fase 8): valutatore esterno, invio link test in Assessment, holding → società.

## Registro

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
