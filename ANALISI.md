# Analisi — Fase 0

Data: 2026-09-25. Nessun file del prodotto è stato modificato.
Fonti: lettura del codice, `scripts/audit-identita.mjs` eseguito in sola
lettura, screenshot dell'app in locale (Vite su `:5199`, backend spento) in
chiaro e scuro: landing, Recruiting Home, Profilo della ricerca, Scheda
professionale, Assessment Home, Area Valutazioni Trasversali.

---

## 1. In sintesi

- **Le "due dashboard" sono già una sola applicazione React** (`frontend/`),
  con due moduli sotto `/recruiting/*` e `/assessment/*`, stesso
  `package.json`, stesso router, stessa build. Davanti a entrambe c'è un
  **terzo pezzo**: il guscio statico legacy (`index.html` + `js/app.js` +
  `css/style.css`) che fa login e landing.
- Stack identico per costruzione: React 19.2, Tailwind 4.3, Vite 8, npm.
  **Nessun blocco su React 18**: Bklit UI è installabile.
- L'unificazione è quindi **una riscrittura del guscio, non una fusione di
  applicazioni**. Il vero divario è sotto: Recruiting è Tailwind + shadcn,
  Assessment è un porting 1:1 del vecchio HTML con ~2.000 righe di CSS
  proprio, un **tema parallelo** (`--bg`, `--surface`, `--accent`…) e un
  proprio attributo di tema (`data-theme`), su cui `globals.css` non ha presa.
- Tre punti vanno decisi prima di andare avanti (vedi §9): cos'è la
  "schermata di ingresso", come trattare il tema parallelo di Assessment in
  Fase 1, e diverse voci del capitolo 7 che **nel codice attuale non
  corrispondono** a quanto descritto.

---

## 2. Stack, affiancato

| | Recruiting | Assessment | Guscio legacy |
|---|---|---|---|
| Dove | `frontend/src/modules/recruiting` | `frontend/src/modules/assessment` | `index.html`, `js/`, `css/` (radice) + copia identica in `frontend/legacy-shell/` |
| Framework | React 19.2.8 + Vite 8 + TS 6 | idem (stesso pacchetto) | HTML/JS statico, nessuna build |
| Tailwind | v4.3, classi utility | v4.3 caricato ma **quasi non usato**: classi CSS proprie | nessuno |
| Styling | Tailwind + token di `src/index.css` | `assessment-scoped.css` (1.135 righe) + `legacy-assessment.css` (947) | `css/style.css` (421) |
| Tema | classe `.dark` su `<html>` | attributo `data-theme` sul contenitore `.sv-assessment-shell` (pilotato dallo stesso hook `useTheme`) | proprio, stessa chiave `sv_theme` |
| Lingua | solo italiano; ignora lo switch IT/EN | IT/EN completo (`legacy-ui-text.ts`, 2.000 righe) | IT/EN |
| Dati | localStorage + backend reale (Express/Prisma) in write-through | **solo localStorage** (`sv_assessment_state_v1`); unica chiamata al backend: Assistenza IA nell'Intervista | — |
| Gestore pacchetti | npm | npm | — |

Il backend (`backend/`, Express + Prisma + Postgres) serve Recruiting. Ha già
il concetto di `Company.purchasedModules` (RECRUITING / ASSESSMENT), usato
dal `ModuleLockGate` di entrambi i moduli.

## 3. Come stanno oggi

- Un solo `BrowserRouter` in `App.tsx`. Recruiting sta dentro `AppShell`
  (Topbar globale + contenuto); **Assessment sta fuori da `AppShell`** e
  rende la stessa `Topbar` globale a mano, più una sua sidebar e una sua
  intestazione di pagina.
- La landing non ha rotta React: `Home` nel commutatore e il logo fanno una
  navigazione vera verso `/index.html` (guscio legacy).
- Due rotte senza guscio per i valutatori esterni: `/evaluate` (Recruiting,
  token backend) e `/assessment/evaluate?evalToken=` (Assessment, token in
  localStorage).

## 4. shadcn/ui

`components.json` presente: stile `radix-nova`, `cssVariables: true`,
`tailwind.config: ""` (già forma v4), css `src/index.css`, alias `@/…`,
Lucide. Pacchetto unico `radix-ui`.

Primitive installate in `src/components/ui/` e file che le usano:

| Primitiva | Recruiting | Assessment | Condiviso |
|---|---|---|---|
| button | 17 | 22 | 3 |
| dialog | 10 | 0 | — |
| card | 6 | 0 | 2 |
| badge | 2 | 0 | — |
| tooltip | 2 | 0 | 1 |
| sheet | — | — | 1 (menu mobile Topbar) |
| chart | — | 1 | — |
| input, select, textarea, label, form | **0** | **0** | label: 1 (dentro form) |

Input, Select, Textarea e Form sono installati ma **mai usati**: tutti i
campi sono nativi (vedi §7). Le primitive sono già state ritoccate a mano
(raggi, `shadow-*` neutralizzate via token), ma con valori fuori scala
(`badge.tsx`: `gap-[5px] px-[9px] py-[3px]`; `button.tsx`: `py-[5px]`).

## 5. Componenti custom

### Guscio e navigazione

| Componente | Cosa fa | Dove |
|---|---|---|
| `layouts/Topbar.tsx` | logo, commutatore Home/Recruiting/Assessment, lingua, tema, logout; Sheet su mobile | entrambi (unica istanza, due montaggi) |
| `layouts/Logo.tsx` | marchio vecchio (`/brand/logo_*.svg`) | Topbar |
| `recruiting/components/RecruitingNav.tsx` | nav laterale a 10–12 voci, filtro per ruolo backend | Recruiting |
| `recruiting/components/RecruitingHeader.tsx` | contesto: Company, Campagna (modificabili in linea), CIP | tutte le pagine Recruiting |
| `recruiting/components/BackendStatusBanner.tsx` | avviso backend non raggiungibile | Recruiting |
| `assessment/AssessmentLayout.tsx` → `NavList`, `Sidebar`, `Topbar` locale | nav a gruppi, sezioni, badge contatore, voci-azione (Metodologia, Reset demo, Import disattivato); intestazione pagina con slot azioni | Assessment |
| `components/ModuleLockGate.tsx` | blocco modulo non acquistato + riscatto codice | entrambi |
| `components/CrossModuleBanner.tsx` | banner in fondo alle due Home con 4 numeri e rimando all'altro modulo | entrambe le Home |

### Primitive fatte in casa (candidati alla sostituzione)

| Componente | Occorrenze | Sostituto probabile |
|---|---|---|
| `assessment/components/Modal.tsx` (overlay CSS, niente Esc) | 8 file | Dialog |
| `assessment/components/EmployeeDrawer.tsx` | 4 pagine | Sheet |
| `assessment/components/ToastHost.tsx` + `toast()` nel context | tutto Assessment | Sonner |
| `assessment/components/StatTile.tsx` (numero + sparkline ApexCharts) | 3 | Card + Bklit |
| `assessment/components/Icon.tsx` (SVG legacy via `innerHTML`) | 11 file | Lucide |
| `recruiting/components/KpiCard.tsx` | 1 (CV) | Card |
| `recruiting/components/EmptyState.tsx` | 3 | composizione (Empty) |
| `recruiting/components/ActionButton.tsx`, `LegacyBridgeButton.tsx` | pochi | Button |
| `recruiting/profile-hub/MasterCard.tsx`, `Subcard.tsx`, pannello in `EvaluatorsBackendPanel` | Profilo della ricerca | Accordion / Collapsible |
| `recruiting/job-profile/JdSection.tsx`, `Field` (×2 definizioni) | Scheda professionale | Card + Field/Input |
| `recruiting/profile-hub/protocol/*Dialog.tsx` | 3 dialog grandi | già Dialog shadcn |
| Pillole a schede (`.view-tab` in Assessment, segmentato "In arrivo/Completati", commutatore Topbar) | ~6 punti | Tabs / ToggleGroup |

Composti di Assessment (restano componenti di dominio, da ricomporre sulle
primitive): `AddEmployeeModal`, `AnalisiWizard` (521 righe),
`EvaluationManagerModal`, `HardEvalModal`, `SoftEvalModal`,
`EmployeeEditForm`, `EmployeeSoftSkillModal`, `RoleCensusModal`,
`SurveyLinkModal`, `MethodologyModal`, `AbsencesEditor`.

Composti di Recruiting: `CvMatchDialog`, `CandidateProfileDialog`,
`PaginaACandidateRow`, `PrescreenedList`, `TestResultList`,
`InterviewList`, `WinnerCard`, `RankingCard`, `MatchCompare`,
`EvaluatorWorkspace`, `JdPreview`, i pannelli di `profile-hub`.

Codice morto individuato: `QualityChart.tsx` (dichiarato inutilizzato nel
suo stesso commento), `ValoreScatterChart` / `ValoreTierDistChart`
(`ValoreChart.tsx`), `ValoreAreaChart.tsx` — nessun import.

## 6. Dove vive il colore

Audit su `frontend/src` (800 difetti in 87 file):

| Categoria | Recruiting | Assessment | di cui CSS Assessment | Condivisi |
|---|---|---|---|---|
| Colore scritto a mano | 0 | 121 | 102 | — |
| Colore fuori palette | 0 | 49 | 31 | 3 |
| Bianco/nero puro | 0 | 15 | 13 | 4 |
| Ombra | 13 | 100 | 99 | 6 |
| Corpo fuori scala | 187 | 47 | 46 | 6 |
| Valore arbitrario | 70 | 0 | — | 2 |
| Maiuscolo fuori label | 50 | 29 | 26 | 1 |
| Raggio / spaziatura fuori scala | 3 | 0 | — | 6 |

Lettura: **Recruiting ha il colore già sui token** (zero esadecimali) ma
tipografia e misure arbitrarie ovunque (`text-[13px]`, `text-[10.5px]`…).
**Assessment ha il colore nel CSS**, con un tema parallelo:

- `.sv-assessment-shell` ridefinisce `--bg`, `--surface`, `--text-1..3`,
  `--border`, `--shadow-*` e soprattutto **`--accent` = lime**. È esattamente
  la trappola del §2 di CLAUDE.md: dentro Assessment un componente shadcn
  che usa `bg-accent` per l'hover diventa lime.
- In chiaro usa grigi freddi fuori palette (`#E5E7EB`, `#111827`, `#4B5563`,
  `#6B7280`); `index.css` ha importato gli stessi `#111827`/`#4B5563` come
  `--foreground`/`--muted-foreground`, quindi **anche Recruiting ha testo
  fuori palette**.
- I grafici Assessment leggono i colori con `getComputedStyle` dal
  contenitore e hanno esadecimali di ripiego nel TS (10 file).

Temi paralleli oggi: `src/index.css` (shadcn), `assessment-scoped.css`
(Assessment), `css/style.css` (guscio legacy). Più `globals.css` fornito,
non ancora installato.

Differenze fra `index.css` attuale e `globals.css` che avranno effetto
visibile in Fase 1: `--radius-md` passa da 10px a **16px** (oggi tutti gli
input ad hoc usano `rounded-md` proprio perché era 10px); `--chart-1..5`
cambiano famiglia (da lime/blu/viola a petrolio/magenta/ambra…) e `chart-1`
non è più lime; `--foreground` passa a `neutral-800`; `--muted` diventa un
token distinto da `--secondary`; `--input` passa a `neutral-300`.

## 7. Grafici

**Quattro tecnologie** per pochi grafici:

| Tecnologia | Componenti | Tipo | Schermata |
|---|---|---|---|
| Chart.js (`brand-chart.ts`) | `AndamentoChart` | linea a 2 serie riempita | Valori Complessivi |
| | `GroupedBarsChart` | barre raggruppate ottenuto/atteso | Soft, Hard |
| | `CustomerCareTrendChart` | linea + barre, doppio asse | Customer Care (non in menu) |
| ApexCharts | `StatTile` | sparkline a barra | Soft, Hard, drawer dipendente |
| Recharts via shadcn Chart | `OrgScoreTrendChart` | area + linea di benchmark | Assessment Home |
| SVG a mano | `SelectionFunnel` (anello di attrito), `apex-charts-3d.ts` → `Chart3D` (barre "3D" isometriche/capsule) | funnel, barre | Recruiting Home, Customer Care |
| Barre Tailwind | `QualityStackedBar`, `EssentialSkillBars`, `BigFiveRows`, `SubScoreBoxes` | barre orizzontali con soglia | Recruiting Home, Risultati, CV |

**Nessun radar** nel prodotto attuale, benché sia indicato come il grafico
più importante. Nessuna heatmap (quindi il buco della scala sequenziale non
si apre per ora). Il composito persona/benchmark esiste in forma
approssimata in due punti (`GroupedBarsChart` ottenuto vs atteso,
`BigFiveRows` con marcatore del profilo ideale).

Colore nei grafici oggi: severità (verde/ambra/rosso) usata come
significato in `QualityStackedBar`, `EssentialSkillBars`, `BigFiveRows`,
barre dei cluster Soft (arancio/rosso per il gap). Contraddice la regola 10
e la regola dei grafici; è però **una scelta di prodotto** (fasce di
idoneità), non solo grafica.

## 8. Instradamento e schermate

**Recruiting** (nav in quest'ordine, etichette attuali):

| Voce | Rotta | Composizione |
|---|---|---|
| Inizia | `/recruiting` | hero con claim, KPI, `QualityStackedBar`, `SelectionFunnel`, `OpeningsList`, `UpcomingList`, `CrossModuleBanner` |
| Menu | `/recruiting/profile` | Profilo della ricerca: 4 `MasterCard` (Profilo Candidato, Soft skill, Annuncio, Area Valutatore) con `Subcard`, 3 dialog del protocollo d'intervista |
| Profilo Candidatura | `/recruiting/job-profile` | Scheda professionale: `JdHeaderFields`, `JdSection` ×~15, `JdHardSkills`, `JdSalaryBenefits`, `JdExtraRequirements`, `JdPreview` in colonna, pulsante flottante "Salva JD" |
| CV & Esportazione | `/recruiting/cv` | `KpiCard`, `CvArchiveList`, upload, export XLSX |
| CV Elaborati | `/recruiting/pipeline` | `PipelineDashboard` → `PipelineDetail` (pre-screen, test, colloqui, vincitore) |
| Migliori Candidati | `/recruiting/pagina-a` | `PaginaACandidateRow`, invio link test |
| Risultati | `/recruiting/ranking` | `RankingCard` (barre skill, Big Five, sottopunteggi) |
| Partita interna | `/recruiting/match` | `MatchSlotPicker`, `MatchCompare` |
| Metodo | `/recruiting/metodo` | testo e formule |
| Ask | `/recruiting/ask` | domande guidate, screening |
| CIP / Email | `/recruiting/admin/*` | solo ruoli admin |
| Valutatore | `/recruiting/evaluate`, `/evaluate` | `EvaluatorWorkspace` |

**Assessment** (nav a sezioni e gruppi, 14 voci + azioni):
Home, Competenze Trasversali, Competenze Professionali, Dati Aziendali,
Intervista (`analisi`, wizard), Anagrafica, Area Valutazioni Trasversali
(`soft`), Area Valutazioni Professionali (`hard`), Risultati Trasversali /
Professionali (stesse pagine su altra scheda), Valori Complessivi, Piani di
Sviluppo (`feedback`, con badge), Assistenza IA, Note Metodologiche
(azione). Fuori menu ma raggiungibile: Customer Care. Voci condizionate dal
modulo A/B/AB (`settings.modulo`).

## 9. Componenti nativi non stilizzati

| | Recruiting | Assessment | Condivisi |
|---|---|---|---|
| `<select>` | 38 | 21 | — |
| `<input>` | 95 | 67 | 2 |
| `<textarea>` | 22 | 8 | 1 |
| `<button>` nudo | 98 | 28 | — |
| `<table>` | 11 | 18 | — |
| `window.confirm()` | 1 | 4 | — |
| `<details>`, `<dialog>` | **0** | **0** | — |

**Correzione a CLAUDE.md**: i riquadri di "Profilo della ricerca" non sono
`<details>`. Sono `div role="button"` fatti a mano (`MasterCard`,
`Subcard`). L'area cliccabile non è ridotta al titolo: è **l'intera card,
corpo compreso** — un clic su uno spazio vuoto del contenuto la chiude — e
dentro un `role="button"` ci sono altri pulsanti (problema ARIA). La
destinazione resta Accordion/Collapsible, per ragioni diverse da quelle
scritte.

## 10. Test

- Backend: 15 file Vitest (`backend/tests`: auth, candidati, CV, CIP, email,
  valutatori, scoring, shortlist…).
- Frontend: nessuna suite. Solo script Playwright ad hoc in
  `frontend/e2e-*.mjs`. Verifica abituale: `tsc -b`, `oxlint`, `vite build`.
  Per la migrazione servirà almeno uno smoke test per rotta.

---

## 11. Confronto

### Duplicati

| Cosa | Recruiting | Assessment | Divergenza | Più sana |
|---|---|---|---|---|
| Barra laterale | `RecruitingNav`: lista piatta, NavLink, filtro ruolo | `NavList`: sezioni, gruppi a comparsa, badge, voci-azione, filtro modulo A/B | alta | nessuna: servono le funzioni di entrambe → `Sidebar` |
| Intestazione pagina | titolo dentro ogni pagina + `RecruitingHeader` (contesto) | `Topbar` locale: titolo/sottotitolo da `getPageMeta` + slot azioni | media | Assessment (centralizzata) |
| Contesto attivo | Company + Campagna modificabili, CIP | nome azienda e numero dipendenti nel piede della sidebar | alta | Recruiting |
| Modale | `Dialog` shadcn (10 file) | `Modal.tsx` CSS (8 file) | Esc/focus trap | Recruiting |
| Pannello laterale | `Sheet` (solo menu mobile) | `EmployeeDrawer` custom | — | shadcn |
| Riquadro KPI | `KpiCard`, KPI in linea nella Home, stats di `CrossModuleBanner` | `StatTile`, `.stat-card`, riquadri della Home | alta, 5 varianti | nessuna, da rifare una volta |
| Stato vuoto | `EmptyState` | markup in linea | bassa | Recruiting |
| Schede / pillole | segmentato nella Home, pillole nel Topbar | `.view-tab` | bassa | → Tabs |
| Notifica | messaggi in linea | `toast()` globale | — | → Sonner |
| Campi di form | `Field` ×2, input nativi Tailwind | classi `.field`, input nativi | media | nessuna → Field/Input/Select |
| Conferma distruttiva | `window.confirm` ×1 | `window.confirm` ×4 | nessuna | → AlertDialog |
| Link questionario + "INVIA LINK TEST" | `SurveyLinkSection` + invio via backend SMTP | `SurveyLinkModal` + endpoint configurato dall'utente o `mailto:` | **funzionale** | vedi sotto |
| Valutatore esterno | `/evaluate`, token backend | `/assessment/evaluate`, token in localStorage | **funzionale** | vedi sotto |
| Tassonomia soft skill / profilo ruolo | `RoleProfile {flags, bf, bench}` | `RoleProfile {requiredSkills, skillWeights, skillExpected}` + `legacy-taxonomy` | **modello diverso** | vedi sotto |
| Grafici | SVG/Tailwind | Chart.js, ApexCharts, Recharts, SVG | alta | → Bklit |
| Home con banner incrociato | `RecruitingHome` | `AssessmentHomePage` | stessa idea, due implementazioni | → schermata di ingresso unica |

### Divergenze di comportamento (ognuna è una decisione, non la prendo io)

1. **Invio link test.** Recruiting passa dal backend (SMTP reale, stato
   registrato). Assessment chiama un endpoint scritto dall'utente nelle
   impostazioni, con chiave API salvata in localStorage, oppure apre
   `mailto:`. Stesso nome di bottone, due flussi.
2. **Valutatori esterni.** Il link Assessment funziona solo nello stesso
   browser che l'ha generato (token in localStorage). Il link Recruiting è
   reale. Unificarli cambia il flusso.
3. **Azienda.** Tre fonti: `companies[]` + `activeContext` locali di
   Recruiting (più aziende, rinominabili dall'intestazione);
   `settings.companyName` + `company` di Assessment (una sola); `Company` nel
   backend (che decide i moduli acquistati). La barra laterale unica deve
   dichiarare "un'azienda attiva": quale delle tre?
4. **Ruolo attivo.** In Recruiting "ruolo" è la posizione aperta
   (`opening`); in Assessment è la mansione del dipendente. Anche i permessi
   divergono: Recruiting usa il ruolo backend (PLATFORM_ADMIN,
   COMPANY_ADMIN, RECRUITER); Assessment dà sempre pieni poteri
   (`canEdit: true`); il guscio ha i suoi (superadmin/admin/operator).
5. **Lingua.** Lo switch IT/EN cambia Assessment e il guscio, non
   Recruiting.
6. **Modale e Esc.** Il `Modal` di Assessment ignora Esc di proposito (per
   fedeltà al legacy); Dialog lo gestisce. Con la regola 11 vince la
   libreria, ma è un cambio di comportamento percepibile: lo segnalo.
7. **Colore di severità nei grafici e nei badge** (fasce di idoneità,
   gap soft skill). Togliere il significato dal colore richiede etichette o
   icone nuove: è una modifica di prodotto piccola ma reale.
8. **Reset demo** (Assessment) cancella tutti i dati Assessment con un
   `confirm()`. Non ha equivalente in Recruiting. Va deciso se resta nella
   barra laterale unica.

### Esclusive

- Solo Recruiting: backend reale, upload e archivio CV, pipeline, ranking,
  confronto interno, Ask, CIP, configurazione email, blocco per ruolo,
  scheda professionale, protocollo d'intervista.
- Solo Assessment: anagrafica dipendenti, intervista esecutiva (wizard +
  IA), valutazioni soft/hard a 3 fonti, periodi e assegnazioni, valori
  complessivi (RAL), piani di sviluppo, Customer Care, modulo A/B, IT/EN.
- Solo guscio legacy: login, landing, impostazioni globali (modale oggi
  irraggiungibile: vive nella schermata `#sv-dashboard`, morta da quando i
  moduli non sono più iframe).

### Condiviso

- **Autenticazione**: una sola, ma finta. Il guscio confronta utente e
  password con 4 coppie scritte in `js/app.js` e scrive
  `sessionStorage.sv_shell_auth`. I due moduli leggono solo quella chiave.
  Recruiting poi si procura un JWT reale con credenziali seed mappate nel
  frontend (`authBridge.ts`). Non ci sono due login da fondere; c'è un login
  statico da portare in React. **Questa è la parte più delicata della
  Fase 4.**
- Tema e lingua: stesse chiavi `sv_theme`/`sv_language` via `shell-bridge.ts`
  (che, nonostante il percorso, è già codice condiviso).
- Entitlement moduli: `ModuleLockGate` comune, sul backend.
- Chiamate al server: solo `src/lib/api` (Recruiting + IA di Assessment).
- Modelli di dato: **nessuno in comune**. Candidato (Recruiting) e
  dipendente (Assessment) non si parlano, neppure dove il banner incrociato
  lo lascerebbe intendere.

Conclusione: **il guscio si riscrive, i moduli si fondono componente per
componente.** Non c'è niente da fondere a livello di build o di router.

---

## 12. Il capitolo 7 alla prova del codice e degli screenshot

| Voce | Esito |
|---|---|
| Logo non conforme | **Confermato.** In uso `logo_black/white.svg` (120×23), la versione d'identità è `logo-su-chiaro/scuro.svg` (914×170). Non compare quattro volte nella landing: 4 tag `<img>`, di cui 2 visibili alla volta (landing + dashboard morta). Inoltre **la landing oggi mostra un'immagine rotta**: i file sono stati spostati da `assets/Logo/` ad `assets/` nella copia di lavoro e `index.html` punta ancora al vecchio percorso. `index.html` cita anche `assets/skillvision-logo-*.png`, che non esistono. |
| Riquadri dell'area operativa con fondi colorati | **Non confermato**: sono neutri in entrambe le modalità. |
| Titolo principale verde/arancio | **Non trovato** nelle schermate guardate. C'è invece arancio e ambra nelle barre dei cluster Soft in Assessment. |
| Pallini di stato accanto alle voci di menu | **Non trovati** nel menu. Ci sono pallini di severità nelle legende (Home Recruiting, Confronto) e "Sistema Attivo" con pallino verde nella Home Assessment, che non corrisponde a uno stato reale. |
| Titoli di sezione lime nella scheda professionale in scuro | **Parzialmente**: link e azioni in lime come testo in scuro ("Apri scheda →", "Configura link →") nel Profilo della ricerca. |
| Aloni e texture a griglia | **Alone confermato** nell'hero della Home Recruiting e nel riquadro "Il Valore" della Home Assessment. Griglia non vista. |
| Titoli delle schede in maiuscolo spaziato | **Non confermato** nel Profilo della ricerca (sono già in minuscolo). **Confermato** in Assessment Home ("IL VALORE", "IL CAPITALE UMANO", "LE DECISIONI"). |
| Etichette dei campi maiuscole in Geist | **Confermato** (Company/Campagna/CIP, fasce di idoneità, campi JD). |
| "Scopo del ruolo" in monospaziato | Da verificare a occhio nella scheda; il campo esiste in `JdHeaderFields`/`JdPreview`. |
| Emoji nella barra laterale | **Non confermato**: icone SVG monocrome (Lucide in Recruiting, SVG legacy in Assessment). Emoji sopravvivono in `calculations.ts` (azioni consigliate) e come `✕` nei bottoni di chiusura. |
| Colonne di schede di larghezza diversa | **Non confermato** (griglia 2×1fr). |
| Pulsante flottante che copre l'anteprima, doppio scorrimento | Da verificare in Fase 6; il pulsante flottante c'è. |
| Claim in inglese | **Confermato**: "From Search to Talent" nella Home Recruiting. |
| "Titolo ruolo" / "Cerca ruolo" | Esiste "Titolo ruolo"; **"Cerca ruolo" non esiste** nel codice attuale. |
| "Salva JD" con emoji | **Parziale**: la sigla c'è ("Salva JD per …"), l'emoji 💾 è stata tolta. |
| Voce `Menu` | **Confermata**: è l'etichetta di Profilo della ricerca. |

Il capitolo 7 sembra descrivere una versione precedente dell'interfaccia.
Vanno riallineati il capitolo 7 e il punto noto della Fase 2 sui `<details>`.

---

## 13. Rischio

**Cosa può rompersi**

1. **Fase 1 non tocca Assessment.** Installare `globals.css` ricolora
   Recruiting e il Topbar, ma Assessment continua a leggere il suo tema
   parallelo. Il criterio "l'app è quella di prima, con i colori giusti dove
   i token sono già usati" regge, ma si vedranno due palette affiancate
   (grigi freddi in Assessment, neutri caldi in Recruiting).
2. **`--radius-md` a 16px** gonfia tutti gli input e i bottoni ad hoc che
   usano `rounded-md`.
3. **`--accent` lime dentro `.sv-assessment-shell`**: ogni primitiva shadcn
   con hover `bg-accent` montata in Assessment diventa lime. Va neutralizzato
   prima di migrare le primitive in Assessment.
4. **I grafici Assessment leggono le variabili CSS a runtime** dal
   contenitore; cambiare i nomi dei token li rimanda agli esadecimali di
   ripiego senza errori visibili.
5. **Autenticazione**: portare il login in React tocca l'accesso a tutto il
   prodotto, il ponte verso il JWT e l'uscita. È l'unico punto dove si può
   chiudere fuori tutti.
6. **Il guscio legacy è duplicato** (radice e `frontend/legacy-shell/`, la
   seconda serve la produzione su Railway con `npm start`). Un intervento su
   una copia sola diverge.
7. `MasterCard` gestisce a mano la propagazione dei clic dai Dialog in
   portale; rimpiazzarla con Accordion elimina il problema, ma i Dialog
   dentro i pannelli vanno ritestati.
8. Nessun test frontend: le regressioni si vedono solo a mano.

**Da migrare per primi (più usati, servono entrambi)**

1. Button (42 file) — già shadcn, va solo riallineato.
2. Input / Select / Textarea / Field — 162 input, 59 select, 30 textarea
   nativi. È il blocco più grande e quello che produce più difetti.
3. Dialog — sostituisce `Modal` di Assessment (8) e allinea Recruiting (10).
4. Card — base per KPI, pannelli, MasterCard.
5. Tabs / ToggleGroup, Badge, Sheet, AlertDialog, Sonner, Table.
6. Sidebar — dopo le primitive, perché serve al guscio della Fase 4.

---

## 14. Proposta di architettura (da approvare)

Proposta, non decisione.

**Un'applicazione, una cartella, niente monorepo.** Il monorepo non serve:
le due aree sono già nello stesso pacchetto. Aggiungerlo sarebbe costo senza
beneficio.

```
frontend/src/
  app/            router, providers (sessione, azienda attiva, tema, lingua)
  shell/          AppSidebar (contenuto per sezione), Topbar, SectionSwitcher,
                  PageHeader con slot azioni, ContextBar
  components/ui/  shadcn — unico set, nessuna copia nei moduli
  components/     composti condivisi: StatCard, EmptyState, ConfirmDialog, …
  charts/         wrapper Bklit con i token di colore
  features/
    home/         schermata di ingresso unica (sopra la giuntura)
    auth/         login React (sostituisce index.html)
    recruiting/   pagine e dominio, senza layout proprio
    assessment/   pagine e dominio, senza layout proprio né CSS proprio
  lib/            api, sessione, entitlement, i18n
```

Instradamento:

```
/login
/                 schermata di ingresso (dashboard di stato)
/recruiting/*     sezione
/assessment/*     sezione
/evaluate, /assessment/evaluate   rotte esterne senza guscio (invariate)
```

Un solo `AppShell` avvolge `/`, `/recruiting/*`, `/assessment/*`. La
`Sidebar` cambia elenco secondo la sezione; il commutatore compare solo se
`purchasedModules` contiene entrambi i moduli.

Percorso proposto:

1. Fase 1 come scritto, più la neutralizzazione di `--accent` nello scope
   Assessment (una riga, senza toccare altro), se approvata.
2. Fasi 2–3: primitive condivise; in Assessment si sostituisce il markup
   classe per classe e si svuota `assessment-scoped.css` a mano a mano.
   Quando è vuoto, sparisce anche `data-theme`.
3. Fase 4: prima il login in React (isolato, dietro la stessa chiave di
   sessione così i moduli non se ne accorgono), poi il guscio unico, poi la
   landing legacy va in pensione insieme a `frontend/legacy-shell/`.

---

## 15. Domande che aspettano una risposta

1. **Architettura** del §14: va bene così?
2. **Schermata di ingresso**: è la landing legacy (`index.html`, oggi "scegli
   il cruscotto", senza dati) o "Inizia" di Recruiting (che ha il claim
   inglese e i KPI)? La mia lettura: la landing legacy diventa la dashboard
   di stato, "Inizia" confluisce in essa.
3. **Fase 1 e Assessment**: accetti che Assessment resti sul suo tema fino
   alla Fase 3, o vuoi che in Fase 1 i suoi token paralleli vengano
   agganciati a `globals.css`? La seconda strada anticipa lavoro, ma evita
   due palette a schermo per settimane.
4. **Divergenze 1–8 del §11**: servono le tue scelte prima della Fase 2
   per quelle che toccano i flussi (invio link, valutatori, azienda attiva,
   reset demo, colore di severità).
5. **Capitolo 7 e punto `<details>` di CLAUDE.md**: li riallineo al codice
   attuale o li lasci come sono?
6. **Logo**: `logo-su-chiaro/scuro.svg` è il marchio completo. Per l'icona
   quadrata (favicon, sidebar compressa) esiste una versione d'identità, o
   `icona_*.svg` è ancora valida?

---

## 16. Aggiornamento · 2026-09-28

Tra l'analisi (25/09, 15:41) e oggi sono entrati 13 commit, tutti sulla Home
Assessment. Il resto dell'analisi vale ancora; questo è quello che cambia.

**Cosa è entrato**
- Home Assessment rifatta a griglia 2×2 di "folder card" con pannello
  Skill Vision a comparsa: nuovi `FolderCard`, `SkillVisionCard`, `ToneTile`,
  `ValoreCard`; `AssessmentHomePage` riscritta (+469/−232 in tutto);
  `assessment-scoped.css` +157 righe.
- **Nuova dipendenza `@phosphor-icons/react`**, usata in 4 file (icone
  duotone delle card). Lo stack prevede solo Lucide: è una quinta libreria di
  icone/grafica da ritirare, e il duotone è una decorazione che il sistema
  non prevede. Va a Lucide in Fase 3 — da aggiungere a MAPPATURA.md.
- Colori nuovi scritti a mano nel CSS aggiunto: lime `#F2EE14`, fondo
  `#F7F5EA`, e una serie di ambra/arancio/rosso/verde (`#F0B35E`, `#E08F4A`,
  `#F08A8A`, `#7ED58E`…) per i `ToneTile`. L'arancio non è in palette
  (capitolo 7); se i toni indicano una fascia, vanno ai token di stato con
  etichetta.

**Audit**: 882 difetti in 87 file sotto `frontend/src` (erano 800). La
crescita viene quasi tutta da `assessment-scoped.css`.

**Domande del §15 già risolte da CLAUDE.md (riscritto il 28/09)**
- §15.1 Architettura: approvata così com'è (CLAUDE.md, Fase 4).
- §15.3 Tema Assessment in Fase 1: ponte con alias delle variabili e
  `--accent` neutralizzato (CLAUDE.md, Fase 1).
- §15.5 Capitolo 7: riallineato al codice.
- §15.2 Schermata di ingresso: è `/`, la voce `Menu` sparisce (capitolo 7,
  "già decisi"). Resta implicito che "Inizia" di Recruiting vi confluisca.

**Ancora aperte**
- §15.4 Divergenze di comportamento 1–8 (§11): servono prima della Fase 2.
- §15.6 Icona quadrata: `icona_*.svg` resta valida o c'è una versione
  d'identità?
- Nomi delle fasce di idoneità (li conferma il cliente).
- La nuova Home Assessment (folder card + pannello Skill Vision) segue un
  "concept del cliente": va chiarito se è un disegno da conservare in Fase 6
  o se confluisce nella schermata di ingresso unica come le altre home.
- Autenticazione (Fase 4): lavoro fuori preventivo, da concordare col cliente.
