# Progetto — tutto sul server, niente nel browser

Data: 2026-10-21. Richiesta di Roberto: **nessun dato nel browser**, in modo
rigoroso. Riassunto in inglese per Roberto: `BACKEND-ONLY-PLAN.md`.

## 1. Regola

Nessun `localStorage`, `sessionStorage` o IndexedDB scritto dal codice
dell'applicazione. Tutto ciò che va ricordato sta sul server: dati, e anche le
preferenze dell'utente (tema, lingua, viste aperte). Lo stato d'interfaccia
che non va ricordato resta in memoria; quello che deve sopravvivere a un
ricaricamento va nell'indirizzo (`?tab=`), che non è un archivio.

Unica eccezione, non scritta dal codice: il **cookie httpOnly** della sessione
(Fase 8). Lo imposta il server, JavaScript non lo legge; senza, ogni
ricaricamento chiederebbe di nuovo la password. Vedi DECISIONI.

Un controllo (`scripts/audit-storage.mjs`) fa fallire la verifica se nel
codice ricompare un accesso all'archivio del browser.

## 2. Inventario (2026-10-21, verificato sul codice e sulla produzione)

| Area | Nel browser oggi | Sul server oggi |
|---|---|---|
| Accesso | modalità `legacy`: sessione del guscio in `sessionStorage`, token in `localStorage` | modalità `backend` (produzione): token in memoria, cookie httpOnly |
| Assessment | in produzione **tutto** (`VITE_ASSESSMENT_STORAGE` non impostata) | tutto pronto (Parti 1–5 del 15/10) |
| Recruiting — società e posizioni | `apex5d_cv_matching_state` (elenco, posizione attiva) | `Company`, `Campaign` (copia creata al bisogno) + mappa `apex5d_backend_link_map` nel browser |
| Recruiting — candidati e classifica | `skillvision_candidates_data`, `candidatePool` | `Candidate`, `CampaignCandidate`, `CvMatchResult` (solo da CV caricato) |
| Recruiting — pipeline | `prescreened`, `testResults`, `interviews`, `winner` | `Shortlist`, `TestInvitation`, `TestResponse`; `Interview` senza rotte; vincitore assente |
| Recruiting — descrizione del ruolo | modelli JD, sintesi annunci, RAL/benefit | `JobProfile` (solo il profilo salvato/confermato) |
| Recruiting — impostazioni | link dei questionari, protocollo d'intervista, flag delle competenze | niente |
| Valutatori (Area Valutatori) | ultime schede viste (`sv-eval-seen-*`) | tutto il resto |
| Preferenze | tema, lingua, viste delle card, società scelta dallo staff, scheda 5P aperta | niente |
| Scheda 5P del valutatore | il file HTML salva le risposte nel browser del **valutatore** | niente |

## 3. Parti

Ogni parte si chiude da sola, con test, e si rilascia in produzione quando si
decide. Stime realistiche.

| # | Parte | Ore |
|---|---|---|
| 1 ✅ | **Assessment solo server**: tolta la modalità `local` (e la variabile); l'import dei dati del browser li cancella dal browser quando è riuscito | 2–3 |
| 2 ✅ | **Preferenze sul server**: `User.preferences` (JSON); tema, lingua, viste, società scelta, schede viste. Scheda 5P aperta nell'indirizzo. Prima dell'accesso: tema del sistema | 3–4 |
| 3 | **Ritiro della modalità `legacy`** e del guscio statico (le due copie, il ponte, `sessionStorage`) — il punto aperto della Fase 8 | 3–4 |
| 4 | Recruiting · **società e posizioni** dal server (`Company`/`Campaign`); posizione attiva nelle preferenze; via la mappa dei collegamenti | 5–7 |
| 5 | Recruiting · **candidati e classifica** dal server (`Candidate`, `CampaignCandidate`, punteggi, Big Five) | 7–9 |
| 6 | Recruiting · **pipeline**: preselezionati, risultati dei test, colloqui (`Interview` con le sue rotte), vincitore | 6–8 |
| 7 | Recruiting · **descrizione del ruolo**: modelli, sintesi degli annunci, RAL e benefit | 4–5 |
| 8 | Recruiting · **impostazioni**: link dei questionari, protocollo d'intervista, flag delle competenze | 3–4 |
| 9 | Recruiting · **import dei dati del browser** e loro cancellazione | 3 |
| 10 | Verifica completa + controllo "zero archivio del browser" | 2–3 |
| | **Totale** | **38–50** |

## 4. Da decidere (blocca solo la sua parte)

- **Scheda 5P del valutatore**: oggi è un file HTML che il valutatore apre e
  che salva le risposte nel suo browser. Per la regola va sostituita da un
  link online (come il valutatore esterno di Assessment), con le risposte sul
  server. È un cambio del flusso del modello 5P del cliente: lo decide
  Roberto. Stima se sì: 5–7 ore.
