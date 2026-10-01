# Skill Vision — unificazione delle dashboard e migrazione al design system

Questo file è la memoria di progetto. Vale per ogni sessione, anche a distanza
di settimane: quello che non è scritto qui, per una sessione futura non esiste.

> **Prima sessione — dove va ogni file**
> `CLAUDE.md` nella radice del repository · `globals.css` in `app/` o `src/`,
> al posto di quello esistente, ma **solo in Fase 1** · `scripts/` e `assets/`
> nelle rispettive cartelle · i due documenti restano dove sono, servono da
> consultare. Poi parti dalla Fase 0 senza modificare nulla.
>
> **Ogni sessione successiva** comincia leggendo `PROGRESS.md`.

---

## 1. Che cosa stiamo facendo

*Riscritto dopo la Fase 0: la descrizione di partenza era sbagliata.*

Le "due dashboard" sono **già una sola applicazione React** (`frontend/`), con
due moduli sotto `/recruiting/*` e `/assessment/*`: stesso `package.json`,
stesso router, stessa build. Davanti a entrambi c'è un **terzo pezzo**, il
guscio statico legacy (`index.html` + `js/app.js` + `css/style.css`), che fa
login e landing.

Quindi **non c'è niente da fondere a livello di build o di router**:
l'unificazione è una **riscrittura del guscio**, e i due moduli si avvicinano
componente per componente.

Il divario vero è sotto:

| | Recruiting | Assessment |
|---|---|---|
| Stile | Tailwind + shadcn | porting 1:1 del vecchio HTML, ~2.000 righe di CSS proprio |
| Colore | già sui token, zero esadecimali | nel CSS, con un **tema parallelo** |
| Tipografia | 187 corpi fuori scala, 70 valori arbitrari | 47 corpi fuori scala |
| Lingua | solo italiano | IT/EN completo |
| Dati | localStorage + backend reale | solo localStorage |

**L'obiettivo è una dashboard fatta a componenti: modulare e scalabile.**
Ogni schermata si compone da una libreria unica — primitive shadcn, pattern
condivisi, componenti di dominio — e nessuna pagina porta stile proprio. Il
nuovo sviluppo, finita la conversione, riparte da quella libreria.

Ne discendono due lavori, che si tengono:

1. **La libreria di componenti**, su tre livelli (Fase 3), vincolata ai token
   del sistema, con shadcn/ui per le primitive e Bklit UI per i grafici.
2. **Un guscio unico** — navigazione, intestazione, contesto attivo,
   instradamento. Il login rifatto sul backend chiude il lavoro (Fase 8).

**Le schermate non si riprogettano.** Tengono impianto e contenuti di oggi —
compresa la nuova Home di Assessment, che segue un concept del cliente e resta
così com'è. Cambia quello di cui sono fatte, non come sono disposte. I difetti
di impaginazione si correggono solo dove il componente nuovo li risolve da sé.

**Il comportamento funzionale non cambia.** Nessuna funzione sparisce
nell'unificazione: quello che le due dashboard fanno oggi, l'applicazione unica
deve continuare a farlo.

**Non è un restyling grafico.** È la sostituzione dell'infrastruttura dei
componenti con una libreria mantenuta, vincolata ai token del sistema. Il
prodotto deve fare esattamente le stesse cose di prima.

### Dove si vede il risultato che vogliamo

Due riferimenti, per cose diverse. Vanno guardati prima di iniziare la Fase 6,
non prima della Fase 0: servono a capire il livello, non a copiare.

**`ui.shadcn.com/blocks`** — il livello di esecuzione. Densità alta, bordi
sottili, nessuna ombra, gerarchia retta dalla tipografia e non dal colore,
stati completi. È lo standard di qualità: se un nostro schermo sta sotto
questo, non è finito.

**`uiverse.io/design/systems/voltura`** — l'impostazione cromatica, che è
quasi la nostra. Superfici scure e mute, bordi a filo invece che ombre, e il
lime che fa da segnale. Le card si comportano come strumenti spenti attorno a
ciò che è acceso.

Il tema decide com'è il lime; le primitive lo applicano da sole dove shadcn e
Bklit mettono il colore primario. L'unica scelta che resta a chi compone è
**quale elemento è primario**: in un gruppo di azioni un solo bottone
`default`, gli altri `outline` o `ghost`; `tone="accent"` solo sul valore in
evidenza, non su ogni card di una griglia.

Quello che **non** si prende da Voltura: è un'interfaccia da trading, densissima
e pensata per essere guardata di sfuggita. Skill Vision si legge, e le sue
schermate hanno testo vero. La densità va presa come tensione, non come misura.

---

## 2. La legge

Undici regole. Non hanno eccezioni se non quelle scritte accanto. Una modifica
che ne viola una è sbagliata anche se sembra migliore.

1. **Nessun valore esadecimale nel codice.** I colori arrivano dai token
   semantici. Un `#` in un file che non sia `globals.css` è un difetto.
2. **Nessun bianco puro e nessun nero puro.** L'estremo chiaro del sistema è
   `neutral-0` `#FFFEF5`, lo scuro è `neutral-950` `#0D0C0A`. Niente `white`,
   `black`, `#fff`, `#000`.
3. **Nessuna ombra.** Le superfici si separano per colore e perimetro. Le
   librerie portano ombre di default su card, menu e bottoni: vanno rimosse.
   Unica eccezione i livelli flottanti, che usano scrim e bordo marcato.
4. **Nessuna sfumatura, nessun alone, nessuna texture di fondo.**
5. **Il bottone primario è `bg-primary` con `text-primary-foreground`.** Fondo
   lime, testo quasi nero. Mai testo bianco: darebbe 1,3:1.
6. **Il lime non è mai testo su fondo chiaro** sotto `accent-600`, e non è mai
   testo su fondo scuro sopra `accent-600`.
7. **Light e dark hanno pari dignità.** Ogni schermata va verificata in
   entrambe. Un token non si riusa fra le due modalità senza controllare il
   contrasto: è l'errore più frequente.
8. **Il maiuscolo esiste solo nello stile label** — `label-mono`, Geist Mono,
   12px, tracking positivo, tre o quattro parole. Non si applica a titoli,
   bottoni o testo corrente. Un titolo di card è Geist minuscolo 18px/600.
9. **Le spaziature vengono dalla scala**: 4, 8, 12, 16, 24, 32, 48, 64, 96,
   128. Dieci valori. Niente `p-[15px]`, niente `gap-[10px]`.
10. **Il colore non porta mai significato da solo.** Servono etichetta, icona o
    pattern. In un grafico il colore identifica una serie e non significa
    nulla: una barra rossa non vuol dire "negativo".
11. **Il comportamento dei componenti non si tocca.** Focus, tastiera, ruoli
    ARIA e stati restano quelli della libreria. Si interviene sull'aspetto.

### Il nome `accent` è una trappola

In shadcn `--accent` **non** è il colore del marchio: è il fondo tenue degli
stati hover e delle voci selezionate. Il lime del marchio sta in `--primary`.

Mappare il lime su `--accent` colorerebbe di lime ogni hover dell'applicazione.
Il tema in `globals.css` è già corretto: non modificarlo su questo punto.

---

## 3. Stack

| | |
|---|---|
| Componenti | **shadcn/ui**, Tailwind v4, variabili CSS |
| Grafici | **Bklit UI**, installato dal registro shadcn (`bklit.com/r/<nome>.json`) in `components/charts/`, import da `@/components/charts` |
| Grafici che Bklit non copre | **visx**, già usato da Bklit — come per la matrice G4 |
| Ripiego estremo | **shadcn Chart** (Recharts) — rimosso in Fase 5: reinstallarlo va motivato in `DECISIONI.md` |
| Icone | Lucide, che shadcn usa già |
| Caratteri | Geist e Geist Mono, Google Fonts, pesi 400/500/600 soltanto |

Bklit UI richiede **React 19+**. Se il progetto è su React 18 è un blocco da
segnalare subito, prima di qualunque altra cosa.

Carica solo i tre pesi dei caratteri. Il file variabile completo pesa molto e
su una dashboard incide sul primo rendering.

---

## 4. Come si tiene traccia

Due file, con due funzioni diverse. Vanno creati in Fase 0 e tenuti aggiornati
per tutto il lavoro.

### `PROGRESS.md` — il piano e l'avanzamento

Il lavoro è lungo e attraversa molte sessioni. Questo file è quello che una
sessione futura legge per capire dove eravamo rimasti.

In testa il piano: le fasi, e sotto ciascuna i passi previsti con il loro stato.
Poi il registro, in ordine cronologico inverso — il più recente in alto.

**Si aggiorna dopo ogni modifica**, non a fine fase e non a fine giornata. Una
riga per ogni intervento:

```
## 2026-09-22
- [x] Button migrato a shadcn — 14 occorrenze sostituite, ombre rimosse,
      raggio md. Verificato in entrambe le modalità.
- [x] Input migrato — raggio corretto da md a sm.
- [ ] Select: in corso, la variante multipla non ha corrispondenza diretta
      → decisione in DECISIONI.md
```

Segna anche quello che si è rotto e quello che hai rimandato. Un file che
registra solo i successi non serve a nessuno: quando qualcosa non torna, è la
prima cosa che si va a leggere.

All'inizio di ogni sessione, **leggi `PROGRESS.md` prima di qualunque altra
cosa** e riparti da lì.

### `DECISIONI.md` — le scelte non ovvie

Solo le scelte, con il ragionamento. Il formato è nel paragrafo che segue.

---

## 5. Protocollo delle decisioni

Durante la migrazione emergeranno scelte non ovvie: due componenti plausibili
per lo stesso uso, un componente della libreria migliore di quello previsto, un
pattern esistente senza corrispondenza diretta.

**Non fermarti ad aspettare.** Per ognuna:

1. Scrivi la scelta in `DECISIONI.md`, con questo formato:
   `## <cosa> · <data>` — opzioni, cosa cambia fra loro, raccomandazione, opzione presa.
2. **Prosegui con la tua raccomandazione.** Il lavoro non si blocca.
3. A fine fase, riporta in sintesi le decisioni prese.

Fermati e aspetta **soltanto** se la scelta è irreversibile o tocca il
comportamento funzionale: eliminare una funzione, cambiare un flusso, toccare
il salvataggio dei dati.

Annota in `DECISIONI.md` anche quando un componente di libreria ti sembra
migliore di quello che stai sostituendo, e quando un pattern esistente non ha
corrispondenza e vai di composizione.

---

## 6. Le fasi

Una per volta. Alla fine di ciascuna, fermati e riporta.

### Fase 0 — Analisi. Non toccare niente

> **Fatta il 2026-09-25.** L'esito è in `ANALISI.md` ed è autorevole: dove
> questo file e l'analisi divergono, vince l'analisi, perché è stata verificata
> sul codice. Le sezioni 1, 7 e le fasi 1, 2, 4 e 5 sono già state riscritte di
> conseguenza. Quello che segue resta come traccia del metodo.

Nessuna modifica in questa fase. Crea `PROGRESS.md` e `DECISIONI.md`, poi
produci `ANALISI.md`.

Analizza i due moduli affiancati e tieni le colonne vicine: il valore
dell'analisi sta nel confronto, non nei due inventari separati.

Per ciascuna:

- Framework, versione di React, versione di Tailwind, gestore pacchetti.
  Se le due divergono, è il primo problema da risolvere.
- Come stanno oggi: due repository, due cartelle nello stesso repository, due
  applicazioni in un monorepo, o due sezioni della stessa applicazione.
- shadcn/ui già presente? In che forma, quali componenti, quale `components.json`.
- Inventario dei componenti custom: percorso, cosa fa, dove è usato, quante volte.
- Dove vive il colore oggi: file, classi Tailwind arbitrarie, valori esadecimali
  scritti a mano, eventuali temi paralleli.
- Grafici esistenti: quale libreria, quali tipi, dove.
- Instradamento e schermate, con i componenti che compongono ciascuna.
- Componenti nativi non stilizzati: `<details>`, `<select>`, `<dialog>`.
  Sono quelli che producono più difetti visivi e non si correggono uno a uno.
- Test presenti, se ci sono.

Poi il confronto, che è la parte che conta:

- **Duplicati** — la stessa cosa implementata due volte. Per ognuno: quanto
  divergono, e quale delle due implementazioni è la più sana.
- **Divergenze di comportamento** — la stessa funzione che si comporta in modo
  diverso nelle due. Sono le trappole dell'unificazione: vanno elencate una per
  una, perché ognuna è una decisione.
- **Esclusive** — quello che esiste solo in una delle due.
- **Condiviso** — autenticazione, chiamate al server, modelli di dato, stato.
  Qui si vede se l'unificazione è una fusione o una riscrittura del guscio.

Chiudi con il **rischio**: cosa può rompersi, quali componenti sono usati in più
punti e vanno migrati per primi, e la tua proposta di architettura per
l'applicazione unica.

Non decidere l'architettura da solo: proponila e fermati.

### Fase 1 — Fondamenta

- Sostituisci `frontend/src/index.css` con `globals.css`.
- Verifica Geist e Geist Mono, pesi 400/500/600 soltanto.
- Allinea `components.json`.
- Verifica le due modalità e lo switch.
- **Riallinea le primitive già installate** ai valori di scala: `badge.tsx`
  (`gap-[5px] px-[9px] py-[3px]`) e `button.tsx` (`py-[5px]`) hanno valori
  arbitrari, e `--radius-md` passa da 10 a 16px — ogni `rounded-md` usato oggi
  sugli input va a `rounded-sm`.

#### Il ponte per Assessment

Assessment ha un tema parallelo in `.sv-assessment-shell` — `--bg`,
`--surface`, `--text-1..3`, `--border`, `--muted`, `--shadow-*`, `--accent`,
`--radius-*` — su cui `globals.css` non ha presa. Si **aliasano le sue
variabili** ai token nuovi, in un file a parte caricato dopo
`assessment-scoped.css`.

```css
.sv-assessment-shell {
  --bg:      var(--background);
  --surface: var(--card);
  --text-1:  var(--foreground);
  --text-2:  var(--muted-foreground);
  --text-3:  var(--muted-foreground);
  --border:  inherit;   /* NON var(--border): sarebbe circolare */
}
```

Le variabili che hanno **lo stesso nome e lo stesso significato** del sistema
usano `inherit`, non `var()` di sé stesse: un riferimento circolare rende la
variabile non valida e il colore sparisce.

Le ombre vanno azzerate anche qui: `assessment-scoped.css` ridefinisce le sue
`--shadow-*` dentro lo scope, dove l'azzeramento di `globals.css` non arriva.

**Aliasare è più sicuro che rinominare**, dove si può. I grafici di Assessment
leggono i colori a runtime con `getComputedStyle` dal contenitore: se i nomi
cambiano, ripiegano sugli esadecimali scritti nel TS senza dare errore.

#### Le tre collisioni di nome

Tre variabili di Assessment hanno lo stesso nome di un token shadcn ma un
significato diverso. Aliasarle alla lettera rompe qualcosa. Vanno risolte
**rinominando l'uso in Assessment**, con una sostituzione meccanica, prima che
una qualunque primitiva shadcn entri nel suo scope.

| Variabile | In Assessment | In shadcn | Come si risolve |
|---|---|---|---|
| `--accent` | **il lime**: bottone primario, voce attiva, schede, barre | fondo tenue dell'hover | gli usi del lime passano a `var(--primary)`, che ha lo stesso valore; poi `--accent` si neutralizza su `neutral-200` |
| `--muted` | un **colore di testo** (lo legge `apex-charts-3d.ts`) | un **fondo** | l'uso in Assessment passa a `--text-muted` |
| `--radius-sm/md/lg` | 8 / 10 / 14 px | 10 / 16 / 24 px | le tre di Assessment passano a `--a-radius-sm/md/lg`: le primitive montate lì trovano i raggi del sistema, il CSS di Assessment tiene i suoi finché non muore |

**L'ordine conta.** Neutralizzare `--accent` senza aver prima spostato il lime
su `--primary` spegne il colore del marchio in un centinaio di punti, bottone
primario compreso. Prima la sostituzione, poi la neutralizzazione.

Questa è l'unica eccezione al "in Fase 1 non si tocca il CSS di Assessment", ed
è una sostituzione senza effetti a schermo: `--primary` e `--accent` hanno lo
stesso valore nelle due modalità.

Questo blocco è un ponte, non lavoro anticipato: muore in Fase 3, quando
`assessment-scoped.css` si svuota e con esso `data-theme`.

Nessun lavoro sui componenti. Alla fine l'applicazione è ancora quella di
prima, con i colori giusti ovunque i token siano usati.

### Fase 2 — Mappatura e unificazione dei componenti

Produci `MAPPATURA.md`: una riga per ogni componente custom, con il componente
shadcn che lo sostituisce, cosa si perde, cosa si guadagna.

**Per i duplicati la riga è una sola.** Dove le due dashboard hanno due
implementazioni della stessa cosa, non si migrano entrambe: si migra una volta
al componente shadcn, e la riga registra le funzioni di *tutte e due* che il
nuovo deve coprire. È qui che l'unificazione fa risparmiare lavoro invece di
aggiungerne.

Quando le due implementazioni si comportano in modo diverso — campi diversi,
validazioni diverse, stati diversi — non scegliere tu quale vince: è una
differenza funzionale. Elencala e fermati.

Dove un componente custom non ha corrispondenza diretta, proponi la
composizione. Dove ci sono due candidati shadcn, applica il protocollo delle
decisioni.

**Lo sviluppo nuovo si incorpora, non si annulla.** I commit entrati sulla Home
di Assessment dopo la Fase 0 fanno parte del prodotto: riallinea il ramo e
aggiungi le loro righe a `MAPPATURA.md` come per qualunque altro componente.

- `FolderCard`, `SkillVisionCard`, `ToneTile`, `ValoreCard` → **pattern** della
  libreria (Fase 3), con lo stesso aspetto del concept ma sui token.
- `@phosphor-icons/react` → **Lucide**, e la dipendenza si rimuove. Se il
  concept perde qualcosa di essenziale senza il duotone, segnalalo in
  `DECISIONI.md`: è una decisione di sistema, non di schermata.
- Il lime `#F2EE14` → `--primary`. Il fondo `#F7F5EA` → `--card` (è già
  `neutral-100`).
- I toni dei `ToneTile` (`#F0B35E`, `#E08F4A`, `#F08A8A`, `#7ED58E`…): se
  indicano una fascia sono stati → `success` / `warning` / `destructive` con
  l'etichetta accanto; se decorano, diventano neutri.

Casi già verificati in Fase 0:

- I riquadri di "Profilo della ricerca" **non sono `<details>`**: sono
  `div role="button"` fatti a mano (`MasterCard`, `Subcard`), con l'intera card
  cliccabile — un clic su uno spazio vuoto del contenuto la chiude — e altri
  pulsanti annidati dentro il `role="button"`. Vanno comunque ad
  **Accordion / Collapsible**, che risolve insieme il problema ARIA e la
  propagazione dei clic dai Dialog in portale che `MasterCard` gestisce a mano.
- Le due barre laterali → **Sidebar**, con i token `--sidebar-*` già nel tema.
  Nessuna delle due implementazioni vince: servono le sezioni e i gruppi di
  `NavList` e il filtro per ruolo di `RecruitingNav`.
- `Modal.tsx` → **Dialog** · `EmployeeDrawer` → **Sheet** · `ToastHost` →
  **Sonner** · `Icon.tsx` → **Lucide** · le quattro `window.confirm` →
  **AlertDialog** · le pillole a schede → **Tabs / ToggleGroup**.
- **Il blocco più grande sono i campi**: 162 input, 59 select, 30 textarea
  nativi. Input, Select, Textarea e Form sono installati e mai usati. È da qui
  che viene la maggior parte dei difetti, ed è il lavoro che rende di più.

### Fase 3 — La libreria di componenti

È il cuore del lavoro: il resto delle fasi usa quello che nasce qui.

**Tre livelli, e ogni livello usa solo quelli sotto.**

| Livello | Dove | Cosa contiene | Chi decide l'aspetto |
|---|---|---|---|
| Primitive | `components/ui/` | shadcn: Button, Input, Select, Card, Dialog, Sheet, Tabs, Table, AlertDialog, Sonner… | il tema |
| Pattern | `components/patterns/` | composti condivisi fra i moduli: `PageHeader`, `StatCard`, `EmptyState`, `ConfirmDialog`, `DataTable`, `FilterBar`, `ChartCard`, `FolderCard`… | le primitive |
| Dominio | `modules/*/components/` | quello che conosce il dato: `CandidateRow`, `EmployeeDrawer`, `RankingCard`, `SoftEvalModal`… | i pattern |

Le **pagine compongono e basta**: dispongono componenti su una griglia con
`grid` e `gap` dalla scala, e non hanno colori, bordi, raggi, corpi o CSS
propri. Se una pagina ha bisogno di un aspetto che la libreria non ha, quel
aspetto diventa un pattern prima di entrare nella pagina.

Regole di ogni componente dei livelli pattern e dominio:

- **Un'API di props, non di classi.** Varianti dichiarate (`variant`, `size`,
  `tone`), non `className` passato dall'esterno per cambiare l'aspetto.
  `className` si accetta solo per posizionamento nel layout.
- **Gli stati sono parte del componente**: caricamento, vuoto, errore,
  disabilitato. Una pagina non li reinventa.
- **Nessun dato dentro i pattern.** Un pattern riceve valori, non li va a
  prendere: è quello che lo rende riusabile fra Recruiting e Assessment.
- Un file per componente, nome uguale all'esportazione.

**Il catalogo si crea per primo**, insieme al primo blocco di primitive, e ogni
componente vi entra nel momento in cui è pronto. Crea una rotta di sviluppo — `/dev/components`, esclusa dalla
build di produzione, salvo `VITE_ENABLE_COMPONENT_CATALOG=true` che la accende
finché la produzione è solo interna — che mostra ogni primitiva e ogni pattern in tutte le
varianti e tutti gli stati, in chiaro e in scuro. È il posto dove si verifica un
componente prima di usarlo, e dove chi sviluppa dopo di noi guarda cosa esiste
prima di scriverne uno nuovo. Senza catalogo, la libreria non la usa nessuno e
i componenti si riscrivono.

Un solo insieme, che serve entrambi i moduli: nessuno dei due ne tiene una
copia propria.

In ordine di dipendenza: prima le primitive (Button, Input, Card, Badge,
Select, Dialog), poi i pattern, poi i componenti di dominio che li usano.

Per ciascuno: installa, applica la **checklist del paragrafo 8**, sostituisci le
occorrenze **in tutti e due i moduli**, verifica in entrambe le modalità.

Tre correzioni sistematiche da fare su ogni componente installato:

- **Rimuovi le ombre.** Le classi `shadow-*` arrivano di default.
- **Correggi i raggi.** shadcn usa `rounded-md` sugli input e `rounded-xl` sulle
  card; nella nostra scala vanno `rounded-sm` (10px) e `rounded-lg` (24px).
- **Il Button smette di essere a pillola.** Oggi è `rounded-full`, come `.btn`
  di Assessment: va a `rounded-md` (16px), nei due moduli nello stesso passaggio
  così non divergono.

Lavora a blocchi di tre o quattro componenti, non tutti insieme.

### Fase 4 — Guscio unico

Navigazione, intestazione e instradamento passano a un guscio React unico; il
login e il ritiro del guscio legacy restano per la Fase 8. È la fase che
tocca l'architettura, quindi è anche quella in cui si rompono le cose: procedi
per passi piccoli e tieni `PROGRESS.md` aggiornato a ogni passo.

**L'architettura è quella approvata in Fase 0** (ANALISI §14): un'applicazione,
una cartella, niente monorepo. Rotte `/login`, `/` (scelta del modulo),
`/recruiting/*`, `/assessment/*`, più le due rotte esterne dei valutatori
invariate. Un solo `AppShell`; la `Sidebar` cambia elenco secondo la sezione; il
commutatore compare solo se `purchasedModules` contiene entrambi i moduli.

**Il guscio si costruisce sopra l'accesso di oggi, senza toccarlo**: stessa
chiave di sessione, stesso ponte verso il backend. Il login legacy resta in
servizio e, dopo l'accesso, porta alla `/` in React. Il rifacimento del login e
il ritiro del guscio legacy sono l'ultimo passo del lavoro (Fase 8).

Cosa diventa unico:

- **Instradamento.** Un albero solo. Le due aree restano distinte come sezioni,
  non come applicazioni.
- **Guscio di pagina** — barra superiore, barra laterale, contesto attivo,
  piede. Una `Sidebar` sola, che cambia contenuto in base alla sezione.
- **Stato condiviso** — azienda selezionata, ruolo attivo, preferenze,
  modalità chiara o scura.
- **Chiamate al server e modelli di dato**, dove le due parlano dello stesso
  oggetto con nomi diversi.

Il commutatore in alto — oggi `Recruiting` / `Assessment` — è la giuntura
naturale fra le due sezioni: verifica se già esiste come componente o se è
finto. Se l'utente ha accesso a una sola delle due, il commutatore non deve
comparire.

**Nessuna funzione sparisce.** Se una funzione esiste in una sola delle due,
dopo l'unificazione deve esistere ancora, raggiungibile dalla sua sezione.
Quando l'unificazione richiede di rimuovere o fondere qualcosa: fermati.

Chiudi la fase con il conto: cosa era duplicato e ora è unico, cosa è rimasto
separato e perché.

### Fase 5 — Grafici

**Bklit UI è la libreria di riferimento per i grafici.** Copre area, barre,
candlestick, choropleth, composed, funnel, gauge, heatmap, linea, live line,
torta, profit/loss, radar, ring, sankey, scatter e sunburst.

Quando Bklit non ha il grafico che serve, si costruisce con visx, che Bklit
usa già (nessuna dipendenza in più). shadcn Chart è stato rimosso: reinstallarlo
è un'eccezione da annotare in `DECISIONI.md` con grafico e motivo, perché due
librerie per la stessa cosa sono un costo.

**Corrispondenze già chiare**, da verificare sui dati reali:

| Concetto | Grafico |
|---|---|
| Profilo di competenza di una persona | Radar |
| Persona contro benchmark | Barre raggruppate (persona e atteso affiancati) |
| Confronto fra competenze o fra candidati | Bar |
| Punteggio singolo, completamento | Gauge o Ring |
| Andamento nel tempo | Line o Area |
| Matrice competenze × persone di un team | Heatmap |
| Imbuto di selezione | Funnel |

**Quello che la Fase 0 ha trovato.** Oggi ci sono **quattro tecnologie** per
pochi grafici — Chart.js, ApexCharts, Recharts via shadcn, SVG a mano, più barre
in Tailwind. Vanno tutte a Bklit: è la fase che toglie tre dipendenze.

Prima di migrare, elimina il codice morto già individuato: `QualityChart.tsx`,
`ValoreScatterChart` e `ValoreTierDistChart` in `ValoreChart.tsx`,
`ValoreAreaChart.tsx`. Nessun import.

**Il radar oggi non esiste nel prodotto**, ma è il candidato naturale per
il profilo di competenze di una persona e per il confronto fra due persone, o
fra una persona e il profilo atteso. Dove i dati lo giustificano, proponilo
con la regola qui sotto: schermata, dimensioni, dati, serie.

**Persona contro benchmark** è l'argomento centrale di Skill Vision. Il
Composed e lo Scatter di Bklit lavorano solo sull'asse del tempo, quindi non
servono qui: il confronto si fa con barre raggruppate (G1, G2) e la matrice con
visx (G4). Decisione presa in Fase 5, motivata in `DECISIONI.md`.

Nessuna heatmap nel prodotto: il buco della scala sequenziale non si apre.

**Grafici mancanti o migliorabili — in ogni fase, non solo in questa.** Quando
un dato sarebbe letto meglio con un grafico diverso da quello di oggi, o
quando un dato che andrebbe visualizzato è mostrato solo come numero o
tabella, **proponilo e chiedi prima di applicarlo**: dato, schermata, grafico
di oggi, grafico proposto e perché. Prima di proporre, controlla l'elenco dei
grafici di Bklit UI nella documentazione ufficiale: si propone solo quello che
Bklit ha, o, in mancanza, un grafico visx con il motivo. Le proposte approvate
vanno in `DECISIONI.md`; quelle non ancora approvate restano in un elenco in
coda a `MAPPATURA.md`.

**Regole di colore**

| Serie | Colore |
|---|---|
| Una | `chart-mono` — cambia da solo fra le modalità |
| Due | `chart-mono` per il dato principale, `muted-foreground` per il confronto |
| Tre o più | famiglia categorica `chart-1`…`chart-6`, **nell'ordine dato** |

Il lime resta fuori dalla famiglia categorica: indica la serie che conta, non è
una serie fra le altre. E nessun grafico affida il significato al solo colore:
etichette dirette sulle serie, non una legenda a lato che costringe a
confrontare due punti dello schermo.

**Un buco del sistema, da non improvvisare.** La famiglia categorica serve a
distinguere serie diverse, non a rappresentare un'intensità. Heatmap, choropleth
e sunburst hanno bisogno di una **scala sequenziale**, che il design system non
definisce: non esiste ancora e non va inventata sul posto interpolando fra due
token. Se serve uno di questi grafici, fermati e segnalalo — la scala va
aggiunta alle fondamenta, non alla dashboard.

### Fase 6 — Ricomposizione delle schermate

Ogni schermata si ricompone sui componenti della libreria **tenendo impianto e
contenuti di oggi**. Non è una riprogettazione: se una schermata a fine fase è
disposta diversamente da prima, qualcosa è andato oltre il compito.

Il criterio di fine per ogni schermata: la pagina non contiene più stile
proprio, solo composizione. È questo che rende la dashboard modulare — una
schermata nuova si fa con quello che c'è.

**La Home di Assessment** resta il concept del cliente: griglia di folder card
e pannello Skill Vision. Si ricompone sui pattern nati in Fase 3, con lo stesso
aspetto ma sui token.

**La radice `/`** tiene la funzione di oggi — la scelta del modulo dopo
l'accesso — portata in React nella Fase 4. Se l'azienda ha acquistato un solo
modulo, `/` porta direttamente lì. Nessuna dashboard nuova.

**La voce `Menu`** prende il nome della sua destinazione, "Profilo della
ricerca".

Densità e impostazione: bordi sottili, superfici neutre, lime solo dove
indica l'azione, il valore unico o lo stato attivo (paragrafo 1).

### Fase 7 — Verifica

Esegui `scripts/audit-identita.mjs` (paragrafo 9) e correggi quello che trova.
Poi la verifica a occhio, in entrambe le modalità, su ogni schermata.

### Fase 8 — Autenticazione e ritiro del guscio legacy

Ultimo passo, a migrazione chiusa. Fino ad allora **non si tocca
l'autenticazione** e nessuna credenziale si sposta in React.

Oggi la produzione su Railway serve solo al gruppo di lavoro: non ci sono
clienti. **Prima che entri il primo cliente reale, questa fase deve essere
chiusa** e su Railway vanno tolte `VITE_ENABLE_COMPONENT_CATALOG` (catalogo) e
`VITE_DEMO_MODE` (il "Reset demo" cancella tutti i dati di Assessment del
browser). Finché c'è un solo ambiente, quell'ambiente è la produzione: se
serve una demo per il cliente, si apre un ambiente separato su Railway invece
di lasciare la modalità demo accesa.

La Fase 0 ha trovato credenziali scritte nel codice servito al browser
(`js/app.js`, `authBridge.ts` con `admin123`, `VITE_OPERATORE_BRIDGE_PASSWORD`)
e uno stato di accesso che è una chiave di `sessionStorage`, scrivibile dalla
console. Portare quel login in React così com'è replicherebbe il problema.

Il rifacimento segue `PROPOSTA-AUTENTICAZIONE.md`: autenticazione sul backend,
nessuna credenziale nel frontend, sessione verificata dal server, tentativi di
accesso limitati, permessi dal ruolo backend invece che da `canEdit: true`.
La schermata di login nasce nella libreria come pattern nel catalogo.

Procedi a passi piccoli, con un modo per tornare indietro a ogni passo: è
l'unico punto dove si può chiudere fuori tutti. Gli account reali di
produzione e le loro password si creano e si consegnano d'accordo con il
cliente, non si inventano.

Quando il login React è in piedi, il guscio legacy va in pensione **insieme
alla sua copia** in `frontend/legacy-shell/`, che serve la produzione su
Railway, nello stesso passaggio e con la configurazione di deploy aggiornata:
una copia sola ritirata lascia la produzione sul guscio vecchio.

---

## 7. Cosa non riprodurre

Quasi tutti i difetti dell'interfaccia attuale spariscono da soli: nascono da
colori scritti a mano, ombre di libreria e campi nativi, e ricostruendo sui
token non si ripresentano. Per quelli c'è la checklist del paragrafo 8.

Quello che segue è un'altra cosa: **scelte che sembrano deliberate e non lo
sono**. Ricostruendo una schermata guardando quella vecchia le riprodurresti
fedelmente, convinto di rispettare il disegno esistente.

**Questo elenco è stato verificato in Fase 0**, sul codice e a schermo nelle due
modalità. La versione precedente descriveva uno stato più vecchio del prodotto e
sbagliava su diverse voci: sono state tolte. Se trovi altre differenze, vince il
codice — segnalale e correggi qui.

**Il marchio — bloccante**

In uso `logo_black.svg` / `logo_white.svg` (120×23). La versione d'identità è
`logo-su-chiaro.svg` / `logo-su-scuro.svg` (914×170), in `assets/`. Sostituiscilo
ovunque. Il lettering è un tracciato: non si ricompone con un carattere, Geist
compreso.

Sotto gli 80px di larghezza il lockup lascia il posto al solo simbolo — barra
laterale compressa, favicon, avatar.

`index.html` cita anche `assets/skillvision-logo-*.png`, che non esistono, e
punta a `assets/Logo/…` mentre i file sono in `assets/`: la landing mostra
un'immagine rotta nella copia di lavoro. Si risolve da sé con la sostituzione
del logo, ma va chiuso prima del commit — e va fatto su **entrambe** le copie
del guscio, radice e `frontend/legacy-shell/`.

**Colore usato come categoria o come decorazione**

- Aloni luminosi: nell'hero della Home Recruiting e nel riquadro "Il Valore"
  della Home Assessment. Il sistema non ha sfumature.
- "Sistema Attivo" con pallino verde nella Home Assessment: non corrisponde a
  uno stato reale. Si rimuove.
- Nel Profilo della ricerca, in modalità scura, link e azioni sono lime come
  testo ("Apri scheda →", "Configura link →"). Su fondo scuro il lime come testo
  è ammesso, ma solo per l'azione che conta: se ogni link è lime, non ne segnala
  più nessuno. I link ordinari restano nel colore del testo.
- Arancio e ambra nelle barre dei cluster Soft. L'arancio non è in palette: se
  indica una fascia, usa il token di stato; se decora, sparisce.

**Il colore di severità — caso a parte**

Le fasce di idoneità (verde / ambra / rosso in `QualityStackedBar`,
`EssentialSkillBars`, `BigFiveRows`, cluster Soft) non violano la regola 10 per
il colore che usano: una fascia è uno **stato**, non una serie, quindi i token
`success` / `warning` / `destructive` sono quelli giusti — non la famiglia
categorica dei grafici.

Violano la regola perché **il colore è solo**. Serve l'etichetta accanto:
"Idoneo", "Da valutare", "Non idoneo" (nomi confermati). Il colore
accompagna la parola, non la sostituisce.

È una modifica piccola ma di prodotto: i nomi delle fasce li conferma il
cliente.

**Tipografia usata al contrario**

- Titoli di sezione in maiuscolo spaziato nella Home Assessment — "IL VALORE",
  "IL CAPITALE UMANO", "LE DECISIONI". Sono titoli: Geist minuscolo 18px/600.
  Il maiuscolo è dello stile label.
- Etichette dei campi maiuscole ma in Geist (Company, Campagna, CIP, fasce di
  idoneità, campi della scheda professionale): forma di label, carattere di
  testo. **Deciso:** le etichette dei campi di form sono nello stile label
  (`label-mono`), come sovratitoli, intestazioni di tabella, metriche e tag.
- Tipografia e misure arbitrarie in tutto Recruiting: 187 corpi fuori scala,
  70 valori arbitrari (`text-[13px]`, `text-[10.5px]`…). Il colore lì è già sui
  token, la tipografia no.
- Emoji superstiti: in `calculations.ts` (azioni consigliate) e come `✕` nei
  pulsanti di chiusura. Vanno a Lucide.

**Testo fuori palette ereditato**

`index.css` ha importato `#111827` e `#4B5563` come `--foreground` e
`--muted-foreground`: sono i grigi freddi di Assessment, quindi **anche
Recruiting ha il testo fuori palette** pur non avendo esadecimali nei
componenti. Si risolve con `globals.css` in Fase 1, ma vale la pena sapere da
dove veniva.

**Da verificare in Fase 6**

- Il campo "Scopo del ruolo" in monospaziato.
- Il pulsante flottante "Salva JD" che copre l'anteprima, e il doppio
  scorrimento nella colonna dell'anteprima.

**Testi**

- Il claim "From Search to Talent" nella Home Recruiting: inglese su interfaccia
  italiana. In quel punto non serve uno slogan, serve un'informazione.
- "Salva JD": l'emoji è già stata tolta, la sigla resta.

**Di prodotto — già decisi**

- Le schermate non si riprogettano: tengono impianto e contenuti di oggi.
- La nuova Home di Assessment resta: è un concept del cliente.
- La radice `/` resta la scelta del modulo; nessuna dashboard nuova.
- La voce di menu `Menu` prende il nome della destinazione.
- **Valutatore esterno di Assessment**: resta il meccanismo attuale, ricomposto
  sulle primitive. Portarlo sul token backend di Recruiting richiede un modello
  dati nuovo sul server (le valutazioni di Assessment vivono solo nel browser):
  è lavoro separato dalla migrazione, da concordare col cliente. Non toccare il
  salvataggio dei dati.
- **Navigazione su mobile**: pannello laterale (Sheet) per tutti e due i moduli,
  come fa la `Sidebar` di shadcn.
- **Dialog con dati non salvati**: Esc, clic sullo sfondo e ✕ chiudono, ma se il
  contenuto è stato modificato chiedono conferma prima (`ConfirmDialog`,
  "Chiudere senza salvare?"). Vale per i dialog di valutazione e per ogni form in
  un Dialog o in uno Sheet: è una prop del pattern, non codice di pagina.
- **Permessi**: dal ruolo backend, con il rifacimento dell'autenticazione in
  Fase 8. `canEdit: true` fisso di Assessment è un buco, non una scelta.
- **Colore di severità**: token di stato con l'etichetta accanto. Fasce di
  idoneità: "Idoneo", "Da valutare", "Non idoneo". Le cinque fasce di
  performance di Assessment tengono i nomi che hanno già. La fascia più alta
  non è uno stato: è **neutra**, ovunque (badge, barre, grafici), distinta dalla
  parola; in una barra a segmenti, neutro pieno contro il neutro tenue della
  fascia "nella norma".
- **"Ruolo"**: in Recruiting diventa "Posizione", in Assessment "Mansione".
  Si cambia l'etichetta a schermo, non i nomi nel codice né i dati salvati.
- **Lingua**: solo italiano per ora. Lo switch IT/EN sparisce dal guscio e
  l'interfaccia parte in italiano. I testi inglesi già presenti in Assessment
  e la struttura che li gestisce **restano**: serviranno se un giorno si
  tradurrà tutta la piattaforma. I testi nuovi si scrivono passando dalla
  stessa struttura, non scritti a mano nei componenti.
- **Home di Assessment**: le quattro card restano neutre, come deciso in Fase 2.

**Di prodotto — non decidere da solo**

- Nessuna divergenza aperta: le ultime tre le ha decise il cliente (sotto).

**Decise dal cliente il 2026-09-30**

- **Reset demo**: solo nella versione demo. Serve un modo per sapere se si è in
  demo (ambiente o account): se non esiste, proponilo; fuori dalla demo la voce
  non compare.
- **Invio del link al test**: un solo meccanismo per i due moduli, quello di
  Recruiting. L'HR spunta i nominativi — accanto al nome, nella classifica di
  corrispondenza CV / profilo in Recruiting, nell'elenco dei collaboratori in
  Assessment — e invia il link solo a quelli. A chi non è spuntato non parte
  niente. Deve essere il sistema più semplice possibile per chi lo usa: una
  colonna di selezione, un'azione "Invia link test" con il numero dei
  selezionati e una conferma. È un pattern della libreria, uguale nei due moduli.
- **Azienda attiva**: due casi. Una società singola gestisce sé stessa, con più
  selezioni e più assessment. Una holding gestisce più società del gruppo, ognuna
  con i suoi dipendenti, le sue selezioni e i suoi assessment ripetuti nel
  tempo, e deve poter confrontare dipendenti di società diverse con ruolo uguale
  o di pari valore. Il guscio va costruito per la struttura gruppo → società
  anche quando la società è una sola.

**Queste ultime due non sono solo migrazione.** Le valutazioni e i dipendenti di
Assessment oggi vivono nel browser: inviare il link dal server, gestire più
società e confrontare dipendenti fra società richiede che Assessment salvi i
suoi dati sul backend — la stessa condizione del valutatore esterno. Non
implementarlo dentro la migrazione: analizza, stima e proponi, poi fermati.
Nella migrazione entrano solo la parte d'interfaccia (selezione + invio,
selettore di società) e quello che funziona già con i dati di oggi.

---

## 8. Checklist di conformità

Da percorrere per intero su ogni componente prima che entri in produzione.
Si verifica guardando il componente, non chiedendo a chi lo ha portato.

**Colore**
- [ ] I colori vengono dai token semantici, nessun valore scritto a mano.
- [ ] Bottone primario: `bg-primary` + `text-primary-foreground`.
- [ ] Hover: `accent-500` su chiaro, `accent-300` su scuro.
- [ ] Focus ring `accent-600`, 2px, offset 2px.
- [ ] Superfici e bordi secondo la tabella dei ruoli, in entrambe le modalità.
- [ ] Nessun bianco o nero puro.
- [ ] Fondi tenui con `surface-accent` / `surface-danger` / `surface-warning` /
      `surface-success`, non con token inventati.

**Tipografia**
- [ ] Solo Geist e Geist Mono, solo 400/500/600.
- [ ] Corpi dalla scala interfaccia: `text-app-*`. Mai la scala del sito.
- [ ] Etichette dei campi, sovratitoli, intestazioni di tabella, nomi delle
      metriche e tag con `label-mono`.
- [ ] Colonne numeriche in Geist Mono o con cifre tabulari.
- [ ] Nessun maiuscolo fuori dallo stile label.

**Forma e spazio**
- [ ] Raggi dalla scala: `sm` input e controlli piccoli, `md` bottoni,
      `lg` card e pannelli.
- [ ] Raggio annidato: interno = esterno − padding.
- [ ] Spaziature dalla scala, nessun valore arbitrario.
- [ ] Bordi 1px, 2px sugli stati attivi.
- [ ] **Nessuna ombra.**

**Stati**
- [ ] Hover, focus, attivo, disabilitato definiti tutti e quattro.
- [ ] Il disabilitato è sotto soglia per progetto: non può essere l'unico
      veicolo dell'informazione, serve un'etichetta leggibile accanto.
- [ ] Stato vuoto: dice cosa comparirà lì e come farlo comparire.
- [ ] Stato di caricamento distinto dallo stato vuoto.

**Testi**
- [ ] Italiano. Niente inglese decorativo dove esiste l'equivalente in uso.
- [ ] L'interfaccia informa e non si congratula: "Valutazione completata",
      non "Ottimo lavoro!".
- [ ] Errori: cosa è successo, cosa fare adesso. Nessuna colpa all'utente.

---

## 9. Verifica

Lo script `scripts/audit-identita.mjs` controlla il sorgente: valori
esadecimali fuori palette, bianco e nero puri, classi `shadow-*`, valori
arbitrari fuori scala, caratteri non previsti.

```
node scripts/audit-identita.mjs
```

Va eseguito alla fine di ogni fase, non solo alla fine del lavoro.

Lo script non vede il contrasto reale, perché dipende dal fondo su cui il testo
appoggia davvero e non da quello della pagina. Quel controllo si fa a
applicazione avviata, con lo snippet in coda allo script, incollato nella
console del browser su ogni schermata e in entrambe le modalità.

---

## 10. Materiali

| File | Cosa contiene |
|---|---|
| `globals.css` | Il tema. Unico posto dove stanno i valori. |
| `skill-vision-fondamenta.md` | Il sistema completo: regole, contrasti verificati, motivazioni. |
| `assets/logo-*.svg` | Il marchio nelle due versioni. Non ricomporlo mai. |
| `scripts/audit-identita.mjs` | La verifica del sorgente. Si lancia a ogni fase. |

Le cose da non riprodurre stanno nel capitolo 7 di questo file e da nessun'altra parte:
un secondo documento con lo stesso elenco diverge al primo aggiornamento.

Quando una regola qui è in contrasto con `skill-vision-fondamenta.md`, vince il
documento delle fondamenta: questo file è operativo, quello è normativo.

---

## 11. Come riferire

`PROGRESS.md` si aggiorna dopo ogni modifica, non quando si riferisce. Il
resoconto è un'altra cosa: si fa alla fine di ogni fase, in italiano, in
quest'ordine — cosa è stato fatto, cosa si è rotto, quali decisioni sono finite
in `DECISIONI.md`, cosa resta.

Senza gonfiare. Se una fase è andata liscia, si dice in tre righe.

---

## 12. Dopo la migrazione

Finita la Fase 7 lo sviluppo di funzioni riprende, e questo file resta valido:
le regole che seguono servono a non rifare la migrazione fra sei mesi.

- **Una funzione nuova compone la libreria.** Prima di scrivere un componente,
  si guarda il catalogo `/dev/components`.
- **Se manca un pezzo, entra prima nella libreria.** Si crea al livello giusto
  (primitiva, pattern o dominio), passa la checklist del paragrafo 8, compare nel
  catalogo con varianti e stati, e solo dopo si usa nella pagina.
- **Nessuna dipendenza visiva nuova** (icone, UI kit, grafici) senza una voce in
  `DECISIONI.md`.
- **L'audit gira a ogni push.** `node scripts/audit-identita.mjs` in CI: il
  numero di difetti non sale mai. Se un difetto è voluto, si motiva in
  `DECISIONI.md` e si esclude in modo esplicito, non si ignora.

