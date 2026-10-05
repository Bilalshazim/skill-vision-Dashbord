# Decisioni

Formato: `## <cosa> · <data>` — opzioni, cosa cambia, raccomandazione, opzione presa.

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
