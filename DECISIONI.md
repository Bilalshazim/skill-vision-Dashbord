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
  11px). Presa: il Badge è `label-mono`, raggio full, fondi tenui 12/20%.
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
