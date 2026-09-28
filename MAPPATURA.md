# Mappatura dei componenti — Fase 2

> **Avanzamento Fase 3** — fatti: Button, Card, Badge, Tooltip + `Hint`
> (blocco 1, 2026-09-28). Il resto in `PROGRESS.md`.

Data: 2026-09-28. Base: `main` a `404f498` più le modifiche della Fase 1.
Il ramo `assessment-home-valore-panel` è già tutto contenuto in `main`
(0 commit avanti, 12 indietro): non c'è niente da riallineare.

Una riga per componente. **Dove i due moduli hanno due implementazioni della
stessa cosa la riga è una sola**, e la colonna "Deve coprire" elenca le
funzioni di tutte e due.

**Livello** — `P` primitiva shadcn (`components/ui/`), `Pa` pattern condiviso
(`components/patterns/`), `D` componente di dominio (`modules/*/components/`).
**Stato** — `pronto`: si migra in Fase 3 · `decisione`: scelta presa con il
protocollo, vedi `DECISIONI.md` · `bloccato`: aspetta una scelta funzionale,
vedi §8.

Conteggi: occorrenze nel TSX, `A` Assessment, `R` Recruiting, `S` condiviso.

---

## 1. Campi di form — il blocco più grande

Oggi tutti i campi sono nativi. Recruiting li stila con **17 costanti di classi
locali** (`inputClass`, `fieldClass`…, una per file), Assessment con la classe
`.field` (71 usi, più 15 `.field-row`). Input, Select, Textarea, Label e Form
sono installati e mai usati.

| Oggi | Occorrenze | Diventa | Liv. | Deve coprire | Si perde | Si guadagna | Stato |
|---|---|---|---|---|---|---|---|
| `<input type=text/email/number>` | R 48 · A 44 | **Input** | P | valore controllato, placeholder, disabilitato, `inputMode` dove c'è | le 17 costanti locali | un solo aspetto, focus del sistema, stato di errore (`aria-invalid`) | pronto |
| `<input type=date/time>` | R 10 · A 2 | **Input** `type=date/time` | P | inserimento da tastiera, formato ISO salvato così com'è | — | aspetto uniforme | decisione |
| `<textarea>` | R 22 · A 8 | **Textarea** | P | ridimensionamento verticale, altezza minima 80px (`.field textarea`) | — | come Input | pronto |
| `<select>` | R 38 · A 21 | **Select** (Radix) dentro il pattern `SelectField` | P + Pa | 27 `<option value="">` fra "vuoto" e "nessuno" (16 file); ricerca per lettera | il menu nativo del sistema operativo (su mobile) | menu con i colori del tema anche in scuro, dove oggi il menu nativo esce chiaro | decisione |
| `<input type=checkbox>`, `CheckRow`, `.checkbox-row` | R 5 · A 5 | **Checkbox** + Label | P | stato controllato, etichetta cliccabile | `accent-color` nativo | focus e stati del sistema | pronto |
| `.switch` (interruttore a slitta) | A 4 | **Switch** | P | stato acceso/spento, etichetta | l'alone lime `box-shadow` (vietato) | ARIA `role=switch` | pronto |
| `<input type=range>` (Intervista, 0–10) | A 3 | **Slider** | P | min/max/passo, valore visibile accanto | cursore disegnato a mano | tastiera (frecce, Pagina su/giù) | pronto |
| `<input type=file>` + `.dropzone` | R 1 · A 1 | Input `type=file` dentro il pattern `FileDrop` | Pa | trascinamento, clic per scegliere, stato "sopra" | — | stesso componente nei due moduli | pronto |
| `Field` di `protocol-ui` + `Field` di `JdHeaderFields` + `.field` / `.field .hint` | R 2 def. · A 71 | **Field** (pattern: Label + controllo + suggerimento + errore) | Pa | etichetta sopra (R, A), suggerimento sotto (solo A, `.hint`), griglia a 2/3 colonne (`Grid2`/`Grid3`, `.field-row`) | tre definizioni | una definizione; etichetta in forma di label unica (cap. 7) | pronto |
| Form con validazione | — | **Form** (react-hook-form + zod, già installati) | P | — | — | solo dove una form oggi valida a mano; non si introduce validazione nuova (cambierebbe il comportamento) | pronto |

## 2. Pattern condivisi — i duplicati

| Oggi (R) | Oggi (A) | Diventa | Liv. | Deve coprire | Si perde | Si guadagna | Stato |
|---|---|---|---|---|---|---|---|
| `Dialog` shadcn (10 file), `SendTestLinkFallbackModal` | `Modal.tsx` (8 file) + markup `.modal` scritto a mano in `AssessmentCompanyPage` e `AssessmentAnagraficaPage` | **Dialog** | P | titolo + sottotitolo, larghezza `wide`, piede con azioni, chiusura su sfondo e su ✕ | `✕` testuale → icona Lucide | **Esc chiude** anche in Assessment (oggi no), trappola del focus, ritorno del focus | decisione |
| `window.confirm` ×1 (cambio profilo di partenza) | `window.confirm` ×4 (reset demo, elimina assegnazione, nuova intervista, rimuovi valutatore) | **AlertDialog** nel pattern `ConfirmDialog` | P + Pa | testo della domanda, conferma distruttiva, annulla; testi IT/EN in A | il dialogo del browser | aspetto del sistema, azione distruttiva in `destructive` | pronto |
| messaggi in linea (`ErrorNote` ×4, `ErrorBanner`, `ErrorNote` di EmailConfig), `BackendStatusBanner` | `.small-note` d'avviso, toast d'errore | **Alert** nel pattern `InlineAlert` (tono `info` / `warning` / `destructive`) | P + Pa | icona + testo, tono di stato | sei definizioni | una; fondi `surface-*` del sistema | pronto |
| — | `ToastHost` + `toast(msg, 'ok'/'err')`, 44 chiamate | **Sonner** | P | un messaggio alla volta (il nuovo sostituisce il vecchio), 3,2 s, tipi `ok`/`err` | — | `toast()` resta la stessa firma: le 44 chiamate non cambiano | pronto |
| `Card` shadcn (8 file) + 18 riquadri `rounded-lg border bg-card` fatti a mano | `.card` (143 usi, 17 file), `.card-title` (59) | **Card** (+ CardHeader / CardTitle / CardContent) | P | titolo, sottotitolo, contenuto, piede | varianti di padding sparse | un raggio, un bordo, nessuna ombra | pronto |
| `KpiCard` (icona + numero + etichetta), KPI in linea nella Home, statistiche di `CrossModuleBanner` (etichetta + valore + nota) | `StatTile` (valore, etichetta, scarto dal benchmark con freccia e segno, barra), `.kpi` (20 usi, 4 file), `ToneTile` | **StatCard** | Pa | un numero per riquadro; etichetta `label-mono`; opzionali: icona, denominatore (`/10`, `/100`), scarto con segno, barra di avanzamento, nota | la sparkline ApexCharts di `StatTile` (una sola barra: diventa **Progress**) | cinque varianti → una; `text-metric` per il numero | decisione |
| `EmptyState` (13 usi) | markup `.empty` (6 usi, 4 file) | **EmptyState** | Pa | icona + testo; checklist §8: dire cosa comparirà e come farlo comparire | — | testo d'azione obbligatorio | pronto |
| segmentato "In arrivo / Completati" (Home), pillole del Topbar | `.view-tab` (6), `.segmented` (3), `FolderPill` "oggi / SKILL VISION" | **Tabs** dove cambia il contenuto sotto; **ToggleGroup** dove cambia un filtro o una vista | P | scelta singola, stato persistito dove c'è (`useSkillVisionOpen` in localStorage) | — | tastiera a frecce, ruoli ARIA | decisione |
| `MasterCard`, `Subcard` (div `role="button"`), `AccordionSection` in `JobProfilePage`, sezioni a comparsa di `JdSection` | gruppi a comparsa della barra laterale | **Accordion** (più sezioni) / **Collapsible** (una sola) | P | aperto di default (`MasterCard`), chiuso di default (`Subcard`), valore a destra nell'intestazione (`Subcard`), Dialog aperti da dentro | la chiusura con un clic sullo spazio vuoto del contenuto | solo l'intestazione è un bottone: niente pulsanti annidati in un `role=button`, niente gestione a mano dei clic dai portali | decisione |
| `CompareRowsTable`, `tableWrapClass`, tabelle di `Metodo`, `JdSalaryBenefits`, dialog del protocollo (11) | `.dtable` (12 usi, 6 file) + tabelle nude (18) | **Table**; il pattern **DataTable** dove ci sono ricerca, filtro, ordinamento e pagine (Anagrafica) | P + Pa | ricerca, filtro per area, ordinamento per cognome/area/punteggio, pagine, archivia/ripristina (Anagrafica) | — | intestazioni `label-mono`, cifre tabulari | decisione |
| `Badge` shadcn (tono green/amber/red/blue/gray), `ScoreBadge` (fascia come testo colorato), pillola "auto" | `.chip` (18 usi: gray, blue, red, green, gold, amber) | **Badge** | P | toni di stato + neutro; punto iniziale opzionale | tono `gold`, `blue` come colori propri | stati con parola accanto (regola 10) | decisione |
| `Button` shadcn (42 file, nei due moduli), `ActionButton`, `LegacyBridgeButton` (disabilitato con tooltip), 98 `<button>` nudi | `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-sm`, `.btn-danger-outline`, 27 `<button>` nudi | **Button** | P | varianti primario / contorno / fantasma / distruttivo / link / `warning`; piccolo; icona; disabilitato con spiegazione | la pillola: **`rounded-full` → `rounded-md`** nei due moduli insieme | un solo bottone; hover `accent-500`/`accent-300` | pronto |
| `Tooltip` shadcn | attributo `title` | **Tooltip** | P | — | — | — | pronto |
| intestazione dentro ogni pagina, `PageHeader` locale di `CipAdminPage` | `Topbar` locale: titolo e sottotitolo da `getPageMeta`, slot azioni via `useTopbarActions` | **PageHeader** | Pa | titolo, sottotitolo, slot azioni a destra; alimentato da una tabella di metadati come in A | — | una sola intestazione, `text-app-title` | pronto |
| — | `.pbar` e barre nei `ToneTile` | **Progress** | P | percentuale, etichetta accanto | — | ARIA `progressbar` | pronto |
| icone Lucide | `Icon.tsx` (SVG legacy via `innerHTML`, 12 file) | **Lucide** | — | le ~20 icone del menu e delle pagine | `dangerouslySetInnerHTML` | tutte le icone da una libreria | pronto |
| pulsante di caricamento (`CvOpenButton`, `CvInlineViewerButton`) | `.sv-loader` | **Spinner** (Lucide `Loader2`) + **Skeleton** | P | stato di caricamento distinto dallo stato vuoto | animazione "nuvola" | — | pronto |

## 3. Guscio (si costruisce in Fase 4, i pezzi nascono in Fase 3)

| Oggi | Diventa | Liv. | Deve coprire | Stato |
|---|---|---|---|---|
| `RecruitingNav` (lista piatta, `NavLink`, filtro per ruolo backend, a scorrimento orizzontale su mobile) + `NavList` di Assessment (sezioni, gruppi a comparsa che si aprono da soli sulla voce attiva, badge contatore, voci-azione Metodologia / Reset demo / Importa disattivato, filtro modulo A/B, pannello a scomparsa su mobile) + piede con nome azienda e numero dipendenti | **Sidebar** (`--sidebar-*`), una sola, contenuto per sezione | P + guscio | tutte le funzioni elencate, di tutte e due | bloccato (§8.3, §8.4, §8.6) |
| `layouts/Topbar` (marchio, commutatore Home/Recruiting/Assessment, lingua, tema, uscita, Sheet su mobile) | **AppHeader** con **ToggleGroup** per il commutatore | guscio | commutatore solo se `purchasedModules` ha i due moduli | pronto per la parte grafica |
| `layouts/Logo` | marchio d'identità `logo-su-chiaro/scuro.svg`; sotto 80px solo il simbolo | guscio | — | aspetta la risposta sull'icona quadrata |
| `RecruitingHeader` (Company, Campagna modificabili in linea, CIP) | **ContextBar** (Input in linea + etichette `label-mono`) | Pa | modifica in linea di Company e Campagna | bloccato (§8.3) |
| `ModuleLockGate` (blocco + riscatto codice) | Card + Input + Button + InlineAlert | D | — | pronto |
| `CrossModuleBanner` | Card + StatCard + Button | Pa | — | pronto |
| `AssessmentAuthGuard`, `RecruitingAuthGuard` | un solo guard nel guscio | guscio | — | Fase 4, dopo il nuovo login |
| `EmployeeDrawer` (5 pagine, testata con chiusura `.modal-close`) | **Sheet** laterale | P + D | due viste (modulo A, modulo B), chiusura, scorrimento interno | pronto |

## 4. Home di Assessment — sviluppo entrato dopo la Fase 0

Resta il concept del cliente: stesso impianto, sui token.

| Oggi | Diventa | Liv. | Deve coprire | Si perde | Stato |
|---|---|---|---|---|---|
| `FolderCard` + `FolderPill` | **FolderCard** | Pa | linguetta con titolo, icona nella tacca, kicker, zona a lato per i controlli, corpo | i quattro fondi colorati (`folder-tone-*`: valore, capitale, perdite, decisioni) → superficie neutra; si distinguono per icona e titolo | decisione |
| `SkillVisionCard` (+ `useSkillVisionOpen`, `homeCardLayout`) | **SkillVisionCard** sopra FolderCard + ToggleGroup "oggi / Skill Vision" | Pa | apertura persistita in localStorage, pannello a tutta riga, riordino della griglia a coppie | — | pronto |
| `ValoreCard` | resta di dominio, compone SkillVisionCard + StatCard | D | i sei indicatori e il riquadro principale su due colonne e due righe | — | pronto |
| `ToneTile` | **StatCard** (§2) con `tone` | Pa | etichetta, valore, denominatore, barra, nota, tre taglie | toni `peach`/`gold` (decorativi) → neutri; `green`/`yellow`/`red` sono fasce → `success`/`warning`/`destructive`, e la parola c'è già (`homeQ1Green`…) | decisione |
| `@phosphor-icons/react` (duotone, 4 file) | **Lucide** — la dipendenza si rimuove | — | quattro icone delle card | il duotone | decisione |
| lime `#F2EE14` nel CSS delle card | `--primary` | — | — | un lime non di palette | pronto |
| fondo `#F7F5EA` | `--card` | — | — | — | pronto |

## 5. Componenti di dominio

Restano dove sono (`modules/*/components/` o la cartella di pagina) e si
ricompongono sulle primitive e sui pattern sopra. Nessuno ha un doppio
nell'altro modulo, salvo dove indicato.

**Recruiting**

| Componente | Ricomposto su | Nota |
|---|---|---|
| `CvMatchDialog`, `CandidateProfileDialog`, `SendTestLinkFallbackModal` | Dialog, Field, Input, Button, Badge | |
| `IvNotesDialog`, `IvEvalDialog`, `IvReportDialog` (~950 righe) | Dialog, Field, Select, Textarea, Table, Checkbox | `protocol-ui` sparisce nei pattern |
| `PrescreenedList`, `TestResultList`, `InterviewList`, `WinnerCard` | Card, Field, Input, Select, Button, InlineAlert | `ErrorNote` ×4 → InlineAlert |
| `PipelineDashboard`, `PipelineDetail` | Card, StatCard, Badge | |
| `PaginaACandidateRow` | Card, Button, Badge | invio link test: flusso invariato |
| `RankingCard`, `SubScoreBoxes`, `SkillTierSums`, `ScoreBadge` | Card, StatCard, Badge | barre → Fase 5 |
| `MatchSlotPicker`, `MatchCompare` | Card, Select, EmptyState | |
| `JdHeaderFields`, `JdSection`, `JdHardSkills`, `JdSalaryBenefits`, `JdExtraRequirements`, `JdPreview` | Accordion, Field, Input, Textarea, Checkbox, Table | "Salva JD" flottante: da vedere in Fase 6 |
| `SoftSkillSection`, `SurveyLinkSection`, `JobPostingSection`, `EvaluatorAreaCard`, `EvaluatorsBackendPanel` | Accordion/Collapsible, Dialog, Field | |
| `EvaluatorWorkspace` | Card, Field, Select, Textarea, Button | è il valutatore che resta (§8.2) |
| `CvArchiveList`, `CvOpenButton`, `CvInlineViewerButton`, `OpeningsList`, `UpcomingList` | Card, Button, Spinner, EmptyState | |
| `AskAnswerView`, `ScreeningResultView` | Card, Badge | |
| `CipAdminPage`, `EmailConfigAdminPage` | PageHeader, Field, Input, Select, Table, InlineAlert | |

**Assessment**

| Componente | Ricomposto su | Nota |
|---|---|---|
| `AddEmployeeModal`, `EmployeeEditForm`, `AbsencesEditor` | Dialog, Field, Input, Select | |
| `SoftEvalModal`, `HardEvalModal`, `EmployeeSoftSkillModal` | Dialog, Field, Select, Slider | |
| `EvaluationManagerModal`, `RoleCensusModal` | Dialog, Table, Select, ConfirmDialog | |
| `SurveyLinkModal` | Dialog, Checkbox, Field | flusso invariato (§8.1) |
| `MethodologyModal` | Dialog | |
| `AnalisiWizard` (521 righe) | Card, Slider, Field, Button, Progress | passi e stato invariati |
| `EmployeeDrawer` | Sheet (§3) | |

## 6. Grafici — Fase 5

Qui solo l'elenco, perché il resto della mappatura li chiama. Tutti vanno a
Bklit UI.

| Oggi | Tecnologia | Diventa |
|---|---|---|
| `AndamentoChart` | Chart.js | Line / Area |
| `GroupedBarsChart` | Chart.js | Composed (persona + benchmark) |
| `CustomerCareTrendChart` | Chart.js | Composed (barre + linea) |
| `OrgScoreTrendChart` | Recharts via `ui/chart` | Area + linea di benchmark |
| `StatTile` sparkline | ApexCharts | Progress (non è un grafico) |
| `Chart3D` / `apex-charts-3d.ts` | SVG a mano | Bar |
| `SelectionFunnel` | SVG a mano | Funnel |
| `QualityStackedBar`, `EssentialSkillBars`, `BigFiveRows` | barre Tailwind | Bar / Composed, con la parola della fascia |
| `ValoreChart.tsx`, `ValoreAreaChart.tsx`, `QualityChart.tsx` | — | **codice morto**, si elimina |

## 7. Da togliere

| Cosa | Perché |
|---|---|
| `@phosphor-icons/react` | → Lucide (§4) |
| `apexcharts`, `chart.js`, `recharts` | → Bklit (Fase 5) |
| `legacy-assessment.css` | non importato: copia di riferimento dell'originale |
| `assessment-scoped.css`, `assessment-bridge.css`, `data-theme` | si svuotano mano a mano in Fase 3 |
| regole `.datatable-*` in `assessment-scoped.css` | nessun componente le usa |
| le 17 costanti di classi per i campi in Recruiting | → Input / Select / Textarea |

## 8. Divergenze funzionali — non scelgo io

Le divergenze già decise in CLAUDE.md non sono qui. Quelle aperte **bloccano
solo i componenti che toccano**, non la fase.

1. **Invio del link al test / questionario.** Non è lo stesso componente in
   due versioni. Recruiting: `SurveyLinkSection` configura l'URL; l'invio
   parte da "Migliori Candidati" attraverso il backend (SMTP reale, stato
   registrato), con `SendTestLinkFallbackModal` come ripiego. Assessment:
   `SurveyLinkModal` seleziona i dipendenti e invia a un endpoint scritto
   dall'utente nelle impostazioni (chiave in localStorage), oppure apre un
   `mailto:` per destinatario, con lettera e oggetto da modello. **Si
   migrano entrambi sulle stesse primitive senza fonderli.** Fonderli è la
   decisione aperta.
2. **Valutatore esterno — deciso, ma non si può fare solo nel frontend.**
   CLAUDE.md dice: vince il meccanismo di Recruiting (token backend). Il
   backend però ha valutatori solo per campagne e candidati
   (`backend/src/modules/evaluators`); **non esiste un modello per i
   dipendenti né per le valutazioni di Assessment**, che vivono solo in
   localStorage. Portare `/assessment/evaluate` sul token backend significa
   un modello dati nuovo sul server e la migrazione dei dati salvati nel
   browser. Tocca il salvataggio dei dati: **mi fermo.** Fino ad allora
   `AssessmentEvaluatePage` si ricompone sulle primitive con il suo
   meccanismo attuale.
3. **Azienda attiva.** Tre fonti: `companies[]` + `activeContext` di
   Recruiting (più aziende, rinominabili dall'intestazione), `settings.companyName`
   di Assessment (una sola, nel piede della barra laterale), `Company` del
   backend. Blocca `ContextBar` e il piede della `Sidebar`.
4. **Il termine "ruolo".** Posizione aperta in Recruiting, mansione del
   dipendente in Assessment. Blocca il "ruolo attivo" nella `ContextBar`.
5. **Lingua.** Assessment è IT/EN, Recruiting solo italiano. Non blocca i
   pattern (ricevono i testi come props), blocca lo switch lingua nel guscio
   unico.
6. **Reset demo.** Voce-azione della barra laterale di Assessment, cancella
   tutti i dati del modulo. Blocca la sua voce nella `Sidebar`.
7. **Navigazione su mobile — nuova, emersa qui.** Recruiting su mobile mostra
   le voci in una striscia a scorrimento orizzontale sopra il contenuto;
   Assessment usa un pannello laterale che si apre con un bottone. La
   `Sidebar` di shadcn usa il pannello (Sheet). Scegliere il pannello cambia
   come si naviga Recruiting da telefono. Raccomandazione: il pannello, per
   tutti e due. Blocca solo la `Sidebar` (Fase 4).
8. **Chiusura dei dialog con Esc.** Il `Modal` di Assessment ignora Esc di
   proposito; Dialog lo gestisce. La regola 11 dice che vince la libreria, e
   la registro come decisione presa, non come blocco. Va saputo per un
   motivo: nei dialog di valutazione (`SoftEvalModal`, `HardEvalModal`) un
   Esc chiude senza salvare, come oggi fa già il clic sullo sfondo.

## 9. Ordine per la Fase 3

A blocchi di tre o quattro, prima quello da cui dipende il resto.

1. **Button, Card, Badge, Tooltip** — già installati, vanno solo portati
   alla checklist (e il Button perde la pillola nei due moduli insieme).
2. **Input, Textarea, Field, Label** — il blocco che rende di più.
3. **Select + SelectField, Checkbox, Switch, Slider.**
4. **Dialog, AlertDialog + ConfirmDialog, Sonner, Alert + InlineAlert.**
5. **Tabs, ToggleGroup, Accordion, Collapsible, Progress.**
6. **Table + DataTable, Sheet, Skeleton.**
7. Pattern: **PageHeader, StatCard, EmptyState, FileDrop, FolderCard,
   SkillVisionCard, CrossModuleBanner.**
8. Catalogo `/dev/components`, poi i componenti di dominio.

La **Sidebar** e il **guscio** vengono dopo, in Fase 4.
