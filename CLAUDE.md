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
tranne le pagine d'ingresso e la Panoramica (Fase 6, "Le due home",
"Panoramica", "Profilo della ricerca"). Cambia quello di cui sono fatte, non come sono disposte. I
difetti di impaginazione si correggono solo dove il componente nuovo li
risolve da sé.

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
4. **Nessuna sfumatura, nessun alone, nessuna texture di fondo.** Vale per
   superfici, card e sfondi. **I grafici Bklit ne sono esenti** (deciso il
   2026-10-30): sfumatura dell'area e dissolvenza della griglia restano come
   le fa Bklit. L'esenzione riguarda la forma, non il colore: i colori dei
   grafici seguono le regole della Fase 5, quindi un'area è in inchiostro,
   mai in lime.
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

**Regole di colore** — riviste il 2026-10-26, dopo la verifica in produzione
(tavola "Colori dei grafici" sulla tela del Benvenuto). Sostituiscono la regola
precedente, che dava ai dati il lime scurito (`chart-mono` = `accent-600`) e
alle serie di confronto un grigio: tutto risultava verde, niente spiccava, e il
benchmark grigio sembrava un secondo dato spento.

| Ruolo | Token | Come |
|---|---|---|
| I dati | `chart-mono` | inchiostro: `neutral-800` in chiaro, `neutral-400` in scuro (corretto il 2026-11-02: con `neutral-100` le barre erano quasi bianche e il lime non spiccava) |
| Il valore che conta | `chart-highlight` + `chart-highlight-stroke` | lime pieno con bordo scuro di 1,5px in chiaro; **uno per grafico**: la persona contro il gruppo, l'area più critica, il valore di oggi in un andamento |
| Benchmark, valore atteso | `chart-reference` (`neutral-500` in chiaro, `neutral-200` in scuro) | linea o segno **tratteggiato** con il nome scritto ("Benchmark 7,0"). **Mai una seconda barra** né una seconda linea piena |
| Due serie di dati vere (non un riferimento) | `chart-mono` + `chart-1` | inchiostro per quella in primo piano, petrolio per l'altra, etichette dirette |
| Tre o più serie | `chart-1`…`chart-6` | famiglia categorica, nell'ordine dato |
| Fasce | `success` / `warning` / `destructive` | colori di stato, sempre con la parola |
| "Nella norma" in una distribuzione | `chart-compare` | `neutral-300` in chiaro, `neutral-600` in scuro. Non è più il colore di una serie |

Conseguenze sui grafici di oggi:

- "Ottenuto / Atteso" (Valutazioni soft skill, cluster e Big Five): l'atteso
  diventa un segno tratteggiato sulla barra dell'ottenuto, non una barra grigia.
- "Punteggio e benchmark", "Sotto il benchmark", "Andamento": dati in
  inchiostro, benchmark tratteggiato, lime sul valore da guardare.
- Gauge e Ring: arco pieno in `chart-mono`, oppure `chart-highlight` se è il
  numero principale della pagina; la traccia resta quella di default di Bklit
  (`--border`). *Dal 2026-11-10: in chiaro un arco verde è `accent-600`, mai
  `accent-400` (fondamenta); un verde per sezione, vedi «Correzioni di
  Roberto del 2026-11-10».*

E nessun grafico affida il significato al solo colore: etichette dirette sulle
serie, non una legenda a lato che costringe a confrontare due punti dello
schermo.

**Regole dei pattern dei grafici** — verificate in produzione il 2026-10-01:

- **Il numero si scrive una volta.** Dentro uno StatCard, Gauge e Ring non
  ripetono il valore del riquadro. Il valore ha un'unità sola: "93%" oppure
  "6,0 /10", mai "93% /100".
- **Barre con il valore.** Ogni barra porta il suo valore come etichetta
  diretta, con un decimale. Senza valori e senza asse una barra non si legge.
- **Fasce su un grafico.** Le soglie si disegnano come linee di riferimento con
  il nome della fascia, calcolate con la stessa formula che assegna la fascia
  nel codice (per la matrice soft × hard l'indice è la media dei due assi:
  le soglie sono diagonali, non una griglia a nove caselle). I punti si
  distinguono anche senza colore: forma diversa per fascia e nome al passaggio
  del mouse.
- **Distribuzione per fascia.** Segmenti in ordine di fascia, dalla più alta
  alla più bassa. La più alta (Alto valore) in inchiostro (`chart-mono`),
  Alto potenziale `success`, "nella norma" neutra tenue (`chart-compare`), Da
  potenziare `warning`, Critici `destructive`. Le soglie di ogni fascia vanno
  scritte accanto al nome: oggi è nota solo quella dei Critici (sotto 4,0 su
  10), le altre le chiede Alessio a Roberto. La legenda dice il nome,
  mai il colore: "Verde", "Giallo", "Rosso" non sono etichette.
- **Radar.** Abbastanza grande da leggere le etichette degli assi senza
  sovrapposizioni. Se il riquadro è piccolo, si accorciano le etichette o si
  allarga il riquadro, non si rimpicciolisce il radar.

**Bklit si usa come è fatto** — verificato in produzione il 2026-10-23:

- **Un grafico Bklit non si ritaglia e non si smonta.** Il Gauge del
  punteggio complessivo è dentro un contenitore `h-36 overflow-hidden` (144px)
  mentre il grafico ne misura 229: l'arco è tagliato. Il numero è fuori
  ("60 /100%") invece che in `centerValue`, e la traccia è `--muted` invece del
  default `--border`. Si torna all'uso documentato: arco intero (135°–405°),
  `centerValue` con `defaultLabel` al centro, `suffix` per l'unità, traccia di
  default. Ogni scostamento da una prop di default va in DECISIONI con il
  motivo.
- **Le sfumature di Bklit restano** (regola 4, esenzione del 2026-10-30):
  `area-gradient` sull'area e `grid-rows-fade` sulla griglia sono ammessi
  come Bklit li fa. Il colore dell'area è `chart-mono`, non lime: nella prima
  versione l'area lime sfumata era una delle cause dell'effetto «tutto
  verde».
- **La card di un grafico è una card.** Superficie `card`, bordo sottile.
  Non `surface-accent` (è il fondo dei riquadri di evidenza, non dei grafici),
  non `surface-success/warning/danger` (sono fondi di avviso), non bordo di 2px,
  non `hover:border-primary` su una card che non si clicca. **Nessuna ombra**:
  oggi i pannelli hanno `shadow-[0_8px_16px_0_var(--border-strong)]`, e
  l'audit non l'ha segnalata — va verificato perché.

**Una fascia dice chi c'è dentro.** "Livello ottimale 17%" da solo non si
capisce: di cosa, di chi, rispetto a cosa. Ogni fascia mostra:

1. il nome e una riga che dice cosa significa, con la soglia ("punteggio
   complessivo da X a Y su 10");
2. quante persone e che quota del totale ("4 persone · 17%");
3. le prime tre persone, ordinate per punteggio, con mansione e punteggio;
   un clic apre il pannello della persona; "Vedi tutte" porta all'elenco
   filtrato su quella fascia.

**Una classificazione sola.** Oggi la stessa pagina usa tre livelli (Ottimale
17%, Moderato 52%, Critico 31%) e cinque fasce (Alto valore 0%, Alto
potenziale 17%, Nella norma 52%, Da potenziare 22%, Critici 9%). Le somme
coincidono: i tre livelli sembrano un raggruppamento delle cinque fasce (è un
riscontro sui numeri, da verificare nel codice). Due nomi per le stesse
persone confondono: si usano le cinque fasce, che hanno già i loro nomi
(cap. 7), e i tre livelli spariscono, salvo che il codice dimostri che misurano
un'altra cosa.

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

**Le due home e le pagine dei risultati** — approvato da Roberto il
2026-10-29. Sostituisce il «Benvenuto» del 2026-10-26. Disegno: tela
«Skill-Vision · Benvenuto», tavole «Assessment · 1 Home», «Assessment · 2
Risultati · Le perdite invisibili» e «Recruiting · 1 Home · Profilo della
ricerca». Si costruisce seguendo le tavole.

La dashboard si usa anche nelle demo commerciali con CEO e CFO. Il percorso ha
tre livelli, sempre nello stesso ordine:

| Livello | Cosa | Per chi |
|---|---|---|
| 1 · Home | le finestre del modulo, cliccabili | la demo |
| 2 · Pagina dei risultati | una per finestra, solo sul suo argomento | CEO, CFO |
| 3 · Approfondimenti | le pagine tecniche che esistono già, **non si toccano** | chi ci lavora |

**Una home per modulo**, mai un'unica pagina con le finestre dei due moduli:
i moduli si acquistano separati. In demo si passa dall'una all'altra con il
selettore in alto.

1. **Home di Assessment** — prima voce del menu («Home»). Titolo «Quello che
   devi sapere» e quattro finestre in griglia 2×2, ognuna con numero, titolo,
   sottotitolo e domanda, **nessun numero e nessun grafico**:
   - 01 **Il valore** · il divario tra retribuzione e rendimento · Quanto mi
     rendono davvero le persone che pago?
   - 02 **Le perdite invisibili** · inefficienze, costi nascosti e valore che si
     disperde · Dove sto sprecando denaro o perdendo opportunità?
   - 03 **Il potenziale** · talenti, competenze e opportunità di crescita già
     presenti in azienda · Quali risorse e potenzialità non sto impiegando?
   - 04 **Dove intervenire** · quello che puoi fare da subito · Cosa devo fare
     per migliorare i risultati economici?

   Il clic apre la pagina dei risultati di quella finestra. Testo a sinistra,
   titoli non in maiuscolo, superfici neutre, nessuna icona.

2. **Home di Recruiting** — il Profilo della ricerca (sotto). Il clic su una
   card apre la pagina dei risultati del passo, e da lì la pagina principale
   del livello (approvato da Roberto il 2026-10-30).

> **Aggiornato il 2026-11-06**: struttura e testi delle pagine dei risultati
> sono cambiati con le «Decisioni del 2026-11-06», in fondo a questa fase. Dove
> non coincidono con quanto segue, valgono quelle.

**Le pagine dei risultati** — sette, una per finestra: quattro di Assessment,
tre di Recruiting. Approvate da Roberto il 2026-10-30 sul modello «Le perdite
invisibili» («vai avanti così»). Tutte con la stessa struttura:

- la **riga del percorso** in cima («Home / Le perdite invisibili»), ogni voce
  cliccabile, e «Torna alla home» in fondo;
- titolo e domanda della finestra;
- **«Perché è importante per la tua azienda?»**, due righe sotto il titolo
  (*dal 2026-11-10 titolo H2 e sottotitolo, fuori dal riquadro: vedi
  «Correzioni di Roberto del 2026-11-10»*);
- **1 · La situazione oggi** — una frase e un grafico;
- **2 · Criticità e opportunità** — al massimo tre riquadri e una riga
  sull'opportunità;
- **3 · L'impatto** — la **percentuale** dai dati, subito; il **valore
  economico** come segnaposto «€ [—] · In attesa della formula» finché Roberto
  non dà la formula, che sarà la stessa del Report ROI;
- **4 · Cosa ti suggeriamo di fare** — una frase, il link alla pagina che
  contiene le azioni, e dove serve «puoi interpellare il Senior Advisor»;
- **Approfondimenti** — i link alle pagine tecniche già esistenti
  sull'argomento.

Ogni pagina parla **solo del suo argomento**: non porta a una pagina che dice
tutto.

**Il tooltip ⓘ** accanto ai dati e ai termini da spiegare: cosa vuol dire il
dato e, se serve, come si legge. **Non** «a cosa serve»: al massimo
«Interpella il Senior Advisor». Due o tre righe, mai di più. Tooltip di
shadcn, si apre anche con il focus da tastiera.

**La riga del percorso** (Breadcrumb di shadcn sui nostri token) sta in cima a
**ogni** pagina, anche a quelle tecniche: in Assessment parte da «Home», in
Recruiting da «Profilo della ricerca» («Profilo della ricerca / Chi cerchiamo /
Profilo candidato»). Ogni voce è cliccabile.

**Il disegno è uno solo**: la tavola «Le perdite invisibili». Le altre sei
pagine si costruiscono **con la stessa impaginazione e gli stessi componenti**,
con i contenuti qui sotto (2026-10-30). Non servono altre tavole.

Regole per tutte e quattro:

- **Le frasi con i numeri si calcolano dai dati**, non si scrivono a mano.
  Tra parentesi quadre il dato da inserire. I valori «con i dati
  dimostrativi» servono solo a controllare il calcolo.
- **Una classificazione sola**: dove serve dire «sotto» o «sopra la norma» si
  usano le cinque fasce (sotto la norma = Da potenziare + Critici; sopra la
  norma = Alto potenziale + Alto valore). Mai una soglia nuova inventata.
- **Un riquadro senza persone lo dice** con una frase («Nessuno oggi»), non
  sparisce e non mostra uno zero nudo.
- **Senza test completati** la pagina mostra l'EmptyState del pattern al posto
  delle sezioni 1–3, con la frase «I risultati compaiono qui quando le persone
  completano i test».
- **Con dati dimostrativi** in fondo: «Dati dimostrativi · [società] · Le cifre
  in euro compaiono quando la formula è definita».
- **Gli approfondimenti** sono pagine che esistono: se una voce dell'elenco non
  corrisponde a una rotta reale, si toglie, non si crea.

**01 · Il valore** — Quanto mi rendono davvero le persone che pago?

**In attesa di Roberto**: deve decidere come mettere in rapporto retribuzione
e rendimento («mi serve tempo per ragionarci», 2026-10-30). Si costruisce solo
lo scheletro: riga del percorso, titolo, domanda, «Perché è importante» (sotto),
le quattro sezioni con l'EmptyState «Contenuto in preparazione», gli
approfondimenti. Nessun calcolo su RAL e punteggio finché la regola non c'è.

| Parte | Contenuto |
|---|---|
| Perché è importante | «La retribuzione è la voce di costo più grande. Sapere se a una retribuzione più alta corrisponde un rendimento più alto dice se la spesa va dove c'è il valore.» |
| Approfondimenti | Valori complessivi · Area risultati · Anagrafica |

**03 · Il potenziale** — Quali risorse e potenzialità non sto impiegando?

| Parte | Contenuto |
|---|---|
| Perché è importante | «Le persone che possono fare di più spesso ci sono già. Trovarle dentro l'azienda evita una ricerca fuori; lasciarle ferme è un valore che non si usa.» |
| 1 · La situazione oggi | Frase: «[N] persone su [totale] sono sopra la norma.» Grafico: la **barra di distribuzione per fascia** (pattern della Fase 5), le cinque fasce con nome, numero e quota. Con i dati dimostrativi: 4 su 23. |
| 2 · Criticità e opportunità | Tre riquadri. «Alto potenziale»: [N] persone, le prime tre con mansione e punteggio, link all'elenco. «Alto valore»: [N] persone, come sopra; vuota: «Nessuno oggi.» «Competenza più forte»: la competenza con la distanza positiva più alta dall'atteso (Competenze trasversali), «[x] punti sopra l'atteso»; se nessuna è sopra: «Nessuna competenza sopra l'atteso.» Riga: «L'opportunità: [N] persone possono crescere senza cercare nessuno fuori.» |
| 3 · L'impatto | Percentuale: Alto potenziale + Alto valore sulle persone valutate, «delle persone è sopra la norma» (17% con i dati dimostrativi). ⓘ «Le persone nelle fasce Alto potenziale e Alto valore, sul totale delle persone valutate: [N] su [totale].» Euro: «€ [—] · In attesa della formula · di valore in più l'anno se impiegate, stima». |
| 4 · Cosa ti suggeriamo di fare | «Per chi è in Alto potenziale, un piano di sviluppo con l'azione Talento. Le azioni sono in Dove intervenire; per scegliere su chi puntare puoi interpellare il Senior Advisor.» Link «Vai a Dove intervenire →». |
| Approfondimenti | Valori complessivi · Piani di sviluppo · Cambio ruolo e trasferimenti (solo se la pagina esiste) |

**04 · Dove intervenire** — Cosa devo fare per migliorare i risultati economici?

| Parte | Contenuto |
|---|---|
| Perché è importante | «Sapere dove sono i problemi serve a poco senza un ordine. Qui gli interventi sono in fila: da dove partire e quante persone riguardano.» |
| 1 · La situazione oggi | Frase: «[N] persone hanno un intervento previsto. Il più frequente è [tipo].» Grafico: **Bar Chart** orizzontale di Bklit, persone per tipo di intervento (Formazione, Coaching, Riorganizzazione, Talento), barre in `chart-mono`, la più lunga in `chart-highlight`; un tipo a zero resta con «0». Una persona con più interventi conta una volta nel [N] della frase. Con i dati dimostrativi: 5 · 4 · 2 · 0. |
| 2 · Criticità e opportunità | Tre riquadri. «Da seguire subito»: [N] persone nella fascia Critici, link all'elenco. «Colloqui di restituzione da fare»: [N], da Piani di sviluppo. «Mansione da cui partire»: la mansione con la distanza maggiore dall'atteso, «[x] punti sotto l'atteso». Riga: «L'opportunità: [tipo più frequente] riguarda [N] persone su [totale con un intervento]: un solo programma le segue tutte.» (Corretto il 2026-11-02: la versione precedente diceva «la parte più grande del lavoro», falso con 5 su 11.) |
| 3 · L'impatto | Percentuale: persone con almeno un intervento sulle persone valutate, «delle persone ha un intervento previsto». ⓘ «Le persone con almeno un intervento nel piano di sviluppo, sul totale delle persone valutate: [N] su [totale].» Euro: «€ [—] · In attesa della formula · di costi evitabili l'anno con gli interventi, stima». |
| 4 · Cosa ti suggeriamo di fare | «Cominciare dalle persone critiche, poi i colloqui di restituzione. I compiti con i nomi sono nella Panoramica; per costruire il piano puoi interpellare il Senior Advisor.» Link «Vai alla Panoramica →». |
| Approfondimenti | Piani di sviluppo · Panoramica |

**Recruiting · regole in più.** Le tre pagine leggono la posizione attiva
(stato condiviso, sotto). Gli euro restano «€ [—] · In attesa della formula»
**senza sottotitolo**: in Recruiting che cosa si stima lo decide Roberto. I
dati dei test vengono da Risultati (la classifica con i test), qualunque sia il
nome finale delle pagine bloccate: non da Migliori candidati.

**Chi cerchiamo?** — Definire il candidato ideale.

| Parte | Contenuto |
|---|---|
| Perché è importante | «Una ricerca parte bene se il profilo è chiaro. Requisiti e competenze definiti prima di leggere i CV rendono i candidati confrontabili e tolgono tempo alla selezione.» |
| 1 · La situazione oggi | Frase: «Per [posizione] sono arrivati [N] CV: [M] sono in linea con il profilo.» Grafico: **Ring** di Bklit, CV preselezionati su CV ricevuti, il numero in `centerValue`. ⓘ «I CV preselezionati, sul totale dei CV ricevuti per questa posizione.» |
| 2 · Criticità e opportunità | Tre riquadri. «CV ricevuti»: [N]. «In linea con il profilo»: [N]. «Competenze trasversali scelte»: [N], dal Profilo candidato; nessuna: «Nessuna ancora: si scelgono nel Profilo candidato.» Riga: «L'opportunità: con il profilo definito, tutti i CV si misurano con lo stesso metro.» |
| 3 · L'impatto | Percentuale: CV preselezionati su CV ricevuti, «dei CV ricevuti è in linea con il profilo». ⓘ come sopra. Euro: «€ [—] · In attesa della formula». |
| 4 · Cosa ti suggeriamo di fare | «Completare il profilo con le competenze trasversali prima di leggere i CV. Per sceglierle puoi interpellare il Senior Advisor.» Link «Vai al Profilo candidato →». |
| Approfondimenti | CV & Esportazione · CV elaborati · Avanzamento della selezione · CV preselezionati · Classifica dopo il test |

**Chi è più adatto?** — Valutare tutti in un unico elenco.

| Parte | Contenuto |
|---|---|
| Perché è importante | «Un elenco unico, con CV, test e colloquio sullo stesso metro, confronta i candidati su quello che serve alla posizione e non sull'impressione del momento.» |
| 1 · La situazione oggi | Frase: «[N] candidati hanno completato il test, [M] lo devono ancora fare.» Grafico: **Bar Chart** orizzontale, candidati per fascia di idoneità, con il nome della fascia scritto (le fasce di «Candidati per fascia di idoneità», colori di stato). ⓘ: la definizione delle fasce già scritta in quella pagina; se non c'è, segnaposto e lo dici ad Alessio. |
| 2 · Criticità e opportunità | Tre riquadri. «Test completati»: [N]. «Test in attesa»: [N] inviati e non completati. «Primo in classifica»: nome e punteggio, da Risultati; nessuno: «Nessuno ancora: la classifica parte dal primo test completato.» Riga: «L'opportunità: i candidati si confrontano tutti sullo stesso test, non solo sul CV.» |
| 3 · L'impatto | Percentuale: test completati su test inviati, «dei test inviati è completato». ⓘ «I candidati che hanno completato il test, sul totale di quelli a cui è stato inviato.» Euro: «€ [—] · In attesa della formula». |
| 4 · Cosa ti suggeriamo di fare | «Sollecitare i test in attesa, poi fissare il colloquio con i primi della classifica. Per leggere i risultati puoi interpellare il Senior Advisor.» Link «Vai a Risultati →». |
| Approfondimenti | Confronto interno · Stato dell'arte · Imbuto di selezione |

**Chi scegliamo?** — Confrontare i finalisti.

| Parte | Contenuto |
|---|---|
| Perché è importante | «La scelta finale pesa più di tutte le altre, e una scelta sbagliata si scopre tardi. Mettere i finalisti fianco a fianco, con punti di forza e rischi, rende la decisione motivata.» |
| 1 · La situazione oggi | Finalisti = i candidati nello stato «In fase di approfondimento». Frase: «I finalisti sono [N]. Il primo è [nome], con [punteggio].» Grafico: **Bar Chart** orizzontale dei finalisti per punteggio, barre in `chart-mono`, il primo in `chart-highlight`. Nessun finalista: EmptyState «Nessun finalista: lo diventano i candidati in colloquio». |
| 2 · Criticità e opportunità | Tre riquadri, sul primo finalista. «Punto di forza»: la competenza con la distanza positiva più alta dall'atteso. «Rischio»: la competenza con la distanza negativa più alta. «Colloqui in programma»: [N], da Prossimi colloqui. Riga: «L'opportunità: chi non viene scelto resta In riserva per la prossima ricerca.» |
| 3 · L'impatto | Percentuale: finalisti su candidature acquisite, «delle candidature arriva in finale». ⓘ «I candidati in fase di approfondimento, sul totale delle candidature ricevute per questa posizione.» Euro: «€ [—] · In attesa della formula». |
| 4 · Cosa ti suggeriamo di fare | «Confrontare i finalisti su punti di forza e rischi, poi chiudere con l'esito: Assunto, In riserva o Non selezionato. Per decidere puoi interpellare il Senior Advisor.» Link «Vai a Migliori candidati →». |
| Approfondimenti | Candidati per fascia di idoneità · Imbuto di selezione |

**Prima di Dove intervenire va risolta un'incongruenza**: in Panoramica i
colloqui di restituzione risultano 10, in Piani di sviluppo «Colloquio di
restituzione necessario» compare su tutte e 23 le persone. Il numero giusto è
uno solo, e vale per tutte e due le pagine.

**Panoramica**, seconda voce del menu di Assessment, per chi ci lavora, con due viste in un selettore in alto:
   - **Sintesi**, per la direzione: valore a rischio a 12 mesi (stima con
     intervallo e «Come è calcolato»); cascata dal valore a rischio al rischio
     residuo, un passo per azione; **Da fare adesso** (i compiti aperti,
     dal più urgente, ognuno con il conteggio e il link alla pagina dove si fa:
     persone critiche da seguire, colloqui di restituzione, valutazioni da
     raccogliere); le quattro domande con il loro dato; **Le persone, fascia
     per fascia** (le cinque fasce affiancate: nome, quante e che quota, cosa
     vuol dire con la soglia, le prime tre persone con mansione e punteggio, il
     link all'elenco; «Nella norma» solo il conteggio e il link; una fascia
     vuota lo dice); «Dove si
     perde valore» (area contro l'atteso 7,0, segno tratteggiato sull'atteso, il
     valore in euro per area); «Cosa fare, in ordine di impatto» (azioni con
     persone coinvolte e valore recuperabile).
   - **Dettaglio**: la Panoramica operativa (schema sotto).

   **«Da fare adesso» e «Cosa fare, in ordine di impatto» non sono doppioni.**
   Il primo elenca compiti di chi lavora (chi seguire, quale colloquio fare,
   quale scheda sollecitare): risponde a «cosa faccio lunedì» (frase interna:
   a schermo non compare, 2026-11-10). Il secondo
   elenca interventi (formazione, coaching, riorganizzazione) con il valore
   che recuperano: risponde a «dove conviene investire». Nella Sintesi ci sono
   tutti e due; nel Dettaglio, «Da fare adesso» non ripete gli interventi, che
   stanno nel piano d'azione.

**I grafici della Sintesi sono componenti Bklit**, non disegni: la tela li
mostra a mano solo come riferimento. Ognuno con i suoi valori scritti.

| Blocco | Componente |
|---|---|
| 01 · andamento contro l'atteso | Line Chart, atteso come linea di riferimento tratteggiata |
| 02 · fasce | la barra di distribuzione per fascia (pattern della Fase 5) |
| Cascata dal valore a rischio al rischio residuo | Bklit non ha un grafico a cascata: Bar Chart se regge barre sospese, altrimenti visx, con il motivo in DECISIONI |
| Dove si perde valore (area contro l'atteso) | Bar Chart orizzontale con l'atteso come riferimento, oppure visx se il riferimento per riga non si fa: con il motivo |
| Cosa fare, in ordine di impatto | elenco, nessun grafico |

Prima di scegliere, controlla la documentazione di Bklit: si usa quello che
c'è.

**Gli euro non si calcolano finché Roberto non dà la formula.** Nelle tavole
sono segnaposti dichiarati («€ [—]», «In attesa della formula») e così restano
in produzione. La RAL è già in Anagrafica; turnover e assenze sono dati da
raccogliere. I numeri non in euro vengono dai dati di Original Skills quando è
collegato. In ogni caso con dati dimostrativi la pagina lo dice («Dati
dimostrativi»).

**Fuori da questo giro** (erano nella bozza che Roberto ci ha girato il
2026-10-26, da decidere con lui): chat «Chiedi ai dati», esportazione per il
CdA, simulatore di scenario, inglese. La bozza aveva anche l'italiano tradotto
male e cifre inventate: non è un riferimento per testi e numeri.

**Panoramica** — deciso il 2026-10-23 dopo la verifica in produzione;
posizione corretta il 2026-10-26: **non è la pagina d'ingresso**. In Assessment
è la seconda voce, dopo la Home, ed è la vista «Dettaglio» della
Panoramica (l'altra è «Sintesi», sopra). **In Recruiting** è la seconda voce,
dopo il Profilo della ricerca (deciso da Alessio il 2026-10-30), con la sola
vista operativa. Stato dell'arte resta com'è, con il suo nome e al livello 2:
se è un doppione lo decide Roberto, e intanto non si tocca.

Cosa si è visto il 2026-10-23 e non si ripete: i dati stavano dietro un
pulsante "Skill Vision" che nessuno capisce, chiusi in partenza; testo centrato
nelle card; fondi tinti con i colori dei grafici scritti nella pagina
(`color-mix` di `chart-*` in `style`); bordo lime di 2px nel componente
FolderCard; icone grandi composte che non rappresentano un'azione; lo stesso
numero in tre unità ("60 /100%", "6,0", "6,0/10"); "/100%" come unità; una
pagina di 4500px; scorrimento orizzontale.

Regole:

- **Tutto visibile all'apertura.** Nessun contenuto dietro un interruttore.
  Il selettore "oggi / Skill Vision" e le folder card spariscono dalla
  Panoramica; il pattern FolderCard perde il bordo lime ovunque resti.
- **Testo sempre allineato a sinistra.** Nessuna dashboard ha testo al
  centro: vale per titoli, card, StatCard, righe.
- **Niente icone decorative.** Un'icona solo se riconoscibile come l'azione o
  l'oggetto della riga, Lucide a 16–20px accanto al testo. Via le icone
  composte (casa con moneta, lampadina con gemma…).
- **Superfici neutre, bordo sottile.** Lime solo sul selettore attivo e
  sull'azione principale della pagina. Colori di stato solo sulle fasce, con la
  parola.
- **Ogni numero una volta, con un'unità sola.** Il punteggio è su 10, i conteggi
  sono persone, le quote percentuali.
- **La Panoramica riassume e rimanda.** Grafici di analisi completi (matrice,
  barre per mansione, elenchi di persone lunghi) restano nelle loro pagine; qui
  grafici di sintesi, ognuno con il link alla pagina che lo sviluppa.
- **Un numero che ha una forma la mostra.** Correzione del 2026-10-23, dopo il
  primo rilascio: StatCard con il solo numero rendono la pagina un elenco. Un
  punteggio su una scala va con il Gauge, una quota con il Ring, un valore che
  ha una storia con la sparkline dell'andamento. Il numero resta scritto una
  volta sola, dentro il grafico (`centerValue`) o accanto, non in tutti e due.

Schema, dall'alto, in sezioni con `PageHeader` di sezione:

1. **Intestazione** — `PageHeader` "Panoramica", società attiva, data
   dell'ultimo aggiornamento dei dati. Il selettore CT / CP / Completo **non
   è della Panoramica**: vale per tutto Assessment (sotto, «Selettore CT / CP
   / Completo»).
2. **Stato attuale** — una riga di 4 StatCard, **4 per riga** sopra i 1024px
   (non 2×2 a mezza riga), ognuna con il suo grafico dove il dato ne ha uno.
3. **Da fare adesso** — elenco di righe (testo a sinistra, conteggio, link
   alla pagina dove si fa la cosa), ordinate per urgenza. Ogni riga è
   un'azione che l'utente compie, non un indicatore.
4. **In programma** — prossimi eventi con data, se il modulo ne ha.
5. **Dove guardare** — card affiancate a due a due, ognuna con un grafico di
   sintesi e il link all'analisi. Se il modulo ha un andamento nel tempo, ha
   una riga intera sotto.

Contenuti, solo da dati che l'applicazione ha già (verificati il 2026-10-23 sui
dati di prova). La colonna di Recruiting è rivista il 2026-10-30: tutto sulla
**posizione attiva**, con la scelta «Questa posizione / Tutte le posizioni
aperte» nell'intestazione, come nell'Imbuto.

| Sezione | Assessment | Recruiting |
|---|---|---|
| Stato attuale | punteggio complessivo contro benchmark, su 10 → **Gauge** con il benchmark scritto e la sparkline mag–ott (il dato c'è: Andamento punteggio organizzativo); copertura mansioni → **Ring**; persone valutate su anagrafica → **Ring**; persone critiche → numero e quota  | CV ricevuti → numero; CV in linea con il profilo → **Ring**; test completati su inviati → **Ring**; colloqui in programma → numero |
| Da fare adesso | colloqui di restituzione da fare (Piani di sviluppo); schede 5P da inviare e valutazioni da raccogliere; persone critiche da seguire. Formazione, Coaching e Riorganizzazione **non** stanno qui: sono nel piano d'azione  | CV da valutare; link al test da inviare; test completati da leggere; colloqui da fissare. Ogni riga porta alla pagina dove si fa |
| In programma | **da verificare**: oggi non risultano date in Assessment (Piani di sviluppo non ha scadenze). Se non ci sono, la sezione non c'è — non si inventa un calendario  | prossimi colloqui per data (esiste già) |
| Dove guardare | distribuzione per fascia, con le persone (regola "Una fascia dice chi c'è dentro") → Valori Complessivi; aree e mansioni sotto il benchmark → Competenze; **Andamento punteggio organizzativo** a riga intera, area in inchiostro  | i cinque stati della candidatura → **Funnel** compatto, link all'Imbuto di selezione; candidati per fascia di idoneità → Candidati per fascia |

Stati vuoti: con i dati veri si parte da zero, quindi ogni sezione ha il suo
EmptyState che dice cosa comparirà e come (per esempio "Nessun test
completato. I risultati compaiono qui quando le persone completano i test").
Il fornitore dei test non si nomina mai a schermo (sotto, "Testi").

Il punteggio complessivo era "in attesa" della formula di conversione sulla
scala 1–10 (cap. 7, 2026-10-02). **Superato il 2026-11-04:** soft skill e
competenze professionali sono già tutte e due da 1 a 10; il complessivo è la
media delle due, con lo stesso peso, e si mostra.

Roberto ha accettato la Panoramica come pagina del menu, non come ingresso
(2026-10-23): "può andare sull'indice che cliccandola si apre ma non può essere
il buongiorno".

**La radice `/`** tiene la funzione di oggi — la scelta del modulo dopo
l'accesso — portata in React nella Fase 4. Se l'azienda ha acquistato un solo
modulo, `/` porta direttamente lì. Nessuna dashboard nuova.

**La voce `Menu`** prende il nome della sua destinazione, "Profilo della
ricerca".

> **Superato il 2026-11-06**: il menu di Recruiting nuovo è nelle «Decisioni
> del 2026-11-06», in fondo a questa fase. Quanto segue resta come storia.

**Menu di Recruiting** — deciso da Roberto il 2026-10-23 (risposta scritta).
Sostituisce la proposta del 2026-10-23 che spostava le voci fra i livelli.

Ogni livello ha una **pagina principale**, quella che si apre dalla card del
Profilo della ricerca e dal titolo del livello nel menu, e sotto le sue
**sottopagine**, che si raggiungono solo dal menu.

| Sezione | Pagina principale | Sottopagine, in quest'ordine |
|---|---|---|
| — | **Profilo della ricerca** (prima voce, pagina d'ingresso di `/recruiting`) | — |
| Chi cerchiamo · livello 1 | Profilo candidato ("Configura la scheda professionale per la ricerca in corso") | CV & Esportazione · CV elaborati · Avanzamento della selezione · CV preselezionati · Classifica dopo il test |
| Chi è più adatto · livello 2 | Risultati | Confronto interno · Stato dell'arte · Imbuto di selezione |
| Chi scegliamo · livello 3 | Migliori candidati | Candidati per fascia di idoneità · Imbuto di selezione |
| Area valutatori · livello 4 | — | Prossimi colloqui · Candidati al podio · Intervista strutturata · Valutazione candidato · Report finale di valutazione |
| Strumenti | — | Metodo · Assistente IA |
| Amministrazione | — | CIP · Email · Comitato scientifico (per ruolo, come oggi) |

**Bloccato fino alla risposta di Roberto** — non spostare le pagine, applicare
solo la struttura del menu:

- **Migliori candidati e Risultati.** Roberto mette Migliori candidati al
  livello 3 "perché il ranking include i risultati del test". La pagina che oggi
  si chiama così (`/recruiting/pagina-a`) elenca invece chi **non** ha ancora
  fatto il test, ordinato per corrispondenza CV/profilo, e da lì si invia il
  link. La classifica con i test è Risultati (`/recruiting/ranking`, "Chi è il
  candidato migliore?"), ed è quella nella sua slide del livello 3. Si chiarisce
  con gli screenshot davanti: fino ad allora contenuti e rotte restano dove
  sono.
- **Classifica dopo il test** (livello 1): Roberto la vuole con il solo match
  profilo/CV, ma oggi mostra i punteggi del test. Cambia il contenuto o il nome
  ("Classifica CV / profilo" è la proposta): da decidere.
- **Imbuto di selezione** è due volte (livelli 2 e 3), su due rotte con gli
  stessi dati: per ora tutte e due le voci del menu aprono la stessa pagina.
- **Stato dell'arte** è la vecchia Home di Recruiting: resta com'è, con il
  suo nome e al livello 2 (2026-10-30).

**Altre decisioni di Roberto (2026-10-23):**

- **Profilo candidato** (*superato il 2026-11-06*: le competenze trasversali
  si scelgono solo nella pagina Competenze trasversali; *superato il
  2026-11-09*: il link si crea con il pulsante «Crea link», vedi «Decisioni del
  2026-11-09»): le competenze trasversali si scelgono lì dentro. Al
  salvataggio, in fondo alla pagina, compaiono l'annuncio pronto e il link per
  l'invio. Nessun'altra finestra o accesso ad altre pagine in quella pagina.
- **CV elaborati**: escono le finestre Colloqui e Candidato vincitore (che
  diventa "Candidati al podio", livello 4). La pagina va semplificata: oggi è
  alta circa 4000px con 56 righe uguali. Proposta di semplificazione prima di
  svilupparla.
- **CV & Esportazione**: via "Import massivo — Archivio storico"
  dall'interfaccia. Il codice del backend resta, inutilizzato, finché Roberto
  non dice che la funzione è chiusa: registralo in DECISIONI.
- **"Posizioni aperte"**: si toglie la voce del menu (nel suo indice è in
  fondo, "lo toglierei"). La rotta e il codice restano, inutilizzati: annotalo
  in DECISIONI. Se l'etichetta compare altrove, mandane l'elenco ad Alessio.
- **"Report AI"** (slide di Roberto, card 3): la dicitura si toglie.
- **I manager** non compaiono nella dashboard, né nelle classifiche né
  altrove, in tutti e due i moduli. **Manca il criterio** per riconoscerli nei
  dati (Original Skills distingue solo candidato e dipendente): non inventarlo,
  si aspetta Roberto.
- **I cinque stati della candidatura**: Candidatura acquisita (CV ricevuto) →
  Profilo in valutazione (confronto CV/profilo) → Candidato di interesse
  (approvato e test inviato) → In fase di approfondimento (colloquio) →
  Selezione conclusa (decisione); esito Assunto · In riserva · Non
  selezionato. Il nome del quinto stato è da confermare (Roberto ha scritto
  anche "Selezione valutatori"). Sono le fasi dell'imbuto, al posto di quelle
  scritte sotto in "Imbuto di selezione".

> **Aggiornato il 2026-11-06**: si toglie il blocco titolo e sottotitolo, le
> card diventano verticali (vedi «Decisioni del 2026-11-06»).

**Profilo della ricerca** — deciso da Roberto il 2026-10-23. È la copertina di
Recruiting, le sue "tre slide" (materiale di Roberto: `RECRUITING_Schema`):

1. **Società · Campagna · CIP** — modificabili **solo qui**, in nessun'altra
   pagina. Cambiando la campagna cambia la ricerca su cui si lavora.
2. **Titolo e sottotitolo** — "Configura profilo, posizione, mansione e
   competenze trasversali. Il programma e le classifiche si aggiornano in tempo
   reale."
3. **Tre card in fila, con la freccia fra l'una e l'altra**, numerate 01 · 02 ·
   03. Ognuna: titolo (Chi cerchiamo? · Chi è più adatto? · Chi scegliamo?),
   sottotitolo (Definire il candidato ideale · Valutare tutti in un unico
   elenco · Confrontare i finalisti), contenuto (Ruolo, requisiti, hard e soft
   skill · Matching CV, Test, Colloquio · Punti di forza, Rischi), e in fondo i
   verbi (Crea posizione · Pubblica · Ricevi CV / Approfondisci · Esamina ·
   Approva / Confronta · Decidi · Chiudi). **Senza numeri**: Roberto non li
   vuole qui. **Il clic apre la pagina dei risultati del passo** (sopra, «Le
   pagine dei risultati», approvato il 2026-10-30), e da lì la pagina
   principale del livello: Chi cerchiamo → Profilo candidato · Chi è più
   adatto → Risultati · Chi scegliamo → Migliori candidati. Niente «Report AI»
   nella terza card; la pagina Assistente IA resta.
4. **Niente riga dell'esito** (deciso il 2026-10-29): non si clicca, quindi non
   serve. I cinque stati restano come fasi dell'imbuto.

Testo a sinistra, superfici neutre, bordo sottile, nessuna icona: il suo
schema è già così. Niente folder card, niente "oggi / Skill Vision".

**La posizione attiva è una sola in tutta l'applicazione.** Il 2026-10-23
Profilo della ricerca, Classifica dopo il test e Candidati al podio erano su
"Senior Frontend Engineer", mentre Risultati e Stato dell'arte erano su "Sales
Account Manager": chi naviga confronta due posizioni senza saperlo. È un
difetto, non una scelta, e si corregge subito: la posizione attiva (con la
società) sta in un solo stato condiviso, letto da tutte le pagine, e si cambia
solo nel Profilo della ricerca. Nelle altre pagine resta il sovratitolo di sola
lettura che molte hanno già ("ACME CORP · SENIOR FRONTEND ENGINEER"), senza
campi né matite; Alessio lo mostra a Roberto. "Cambialo dalla pagina CV &
Esportazione" (testo di Migliori candidati) non deve più servire.

**Le due prove che Roberto vuole vedere** ("falla e poi la vediamo"): i
cinque stati come grafico, con quante persone passano da uno stato al
successivo, e l'elenco delle posizioni aperte con i numeri per stato. Per
intero nell'Imbuto di selezione (punti 2 e 5 qui sotto); in breve nella
Panoramica di Recruiting, con il link.

**Imbuto di selezione** — verificato il 2026-10-23. Il grafico (Funnel di
Bklit) è giusto; la pagina no:

- **Non dice di quale posizione parla.** Mostra 56 candidature, cioè l'archivio
  importato per "Sales Account Manager", mentre le posizioni aperte in
  Avanzamento della selezione sono "Senior Frontend Engineer" e "Customer Care
  Specialist", tutte e due a 0. Il numero più grande della pagina appartiene a
  una posizione che non risulta aperta.
- **Le fasi non sono quelle del processo.** "Test tecnico" non esiste: il test
  è quello delle competenze trasversali di Original Skills. Mancano gli
  invitati al test (Migliori candidati ne mostra 2 in attesa) e gli idonei.
- **Una sola percentuale**, sul totale. Dove si perdono i candidati si legge dal
  passaggio da una fase all'altra, che non c'è.
- **La nota "Posizioni con un vincitore selezionato"** spiega "Assunti" con un
  asterisco: con i cinque stati e l'esito la nota non serve più.
- **Il grafico occupa metà riga e la pagina finisce lì.**

Come deve essere:

1. **Intestazione** con la posizione attiva (stato condiviso, sotto) e la
   scelta "Questa posizione / Tutte le posizioni aperte". Mai l'archivio intero
   mescolato alle posizioni.
2. **Il grafico a tutta riga**, con i cinque stati di Roberto (Candidatura
   acquisita → Profilo in valutazione → Candidato di interesse → In fase di
   approfondimento → Selezione conclusa) e, a parte, l'esito (Assunto · In
   riserva · Non selezionato). Ogni stato porta il numero e la quota sullo
   stato precedente; la quota sul totale va nella tabella.
3. **Una frase che dice dove si fermano**, calcolata (numeri d'esempio): "Il calo maggiore è fra
   Preselezionati e Invitati al test: 12 su 30 non sono stati invitati". Se i
   numeri sono tutti a zero oltre la prima fase, EmptyState, non un grafico
   di zeri.
4. **Una tabella per fase**: persone, quota sulla precedente, quota sul totale,
   quante sono ferme lì e il link alla pagina della fase.
5. **Con "Tutte le posizioni aperte"**, sotto, una riga per posizione con i
   numeri per stato. Il testo "«Segna completato» non è ancora
   disponibile" sparisce: basta l'aggiornamento automatico (cap. 7, 2026-10-02).

Il menu di Assessment: **Home** (prima voce, le quattro finestre),
**Panoramica** (seconda voce, Sintesi e Dettaglio), poi come oggi.

**Le pagine dei risultati nel menu** — deciso il 2026-11-02, dopo la verifica
in produzione: aperta una pagina dei risultati, nel menu non era attiva
nessuna voce, e per passare da una finestra all'altra bisognava tornare alla
home.

- **Assessment**: Home diventa un gruppo come Area valutazioni, con sotto le
  quattro pagine: Il valore · Le perdite invisibili · Il potenziale · Dove
  intervenire. «Home» apre la home; la voce della pagina aperta è attiva.
- **Recruiting**: il titolo di ogni livello («Chi cerchiamo? · Livello 1» e
  così via) apre la **pagina dei risultati** del livello, come la card del
  Profilo della ricerca. Sotto restano le voci dell'indice di Roberto, con la
  pagina principale per prima (Profilo candidato, Risultati, Migliori
  candidati). Aperta una pagina dei risultati, è attivo il titolo del livello.

**Tavole del 2–4 novembre 2026 — da costruire.** Decise con Roberto il
2026-11-03 e il 2026-11-04. Tela «Skill-Vision · Benvenuto», riga «2 novembre».
Dove una tavola e questo testo non coincidono, vale questo testo.

- **Home di Assessment: la tavola «Home · senza dati»** (Roberto,
  2026-11-03). Finestre a tutta altezza, visibili all'apertura; in ognuna
  l'etichetta con numero e tema (01 · Rendimento, 02 · Costi, 03 · Talenti,
  04 · Azioni), il numero grande in filigrana, titolo, sottotitolo e domanda.
  **Nessun dato e nessun grafico in home**: i dati compaiono entrando nella
  finestra. All'apertura le finestre compaiono una dopo l'altra con una
  dissolvenza breve (nessuna con `prefers-reduced-motion`). Al passaggio del
  mouse cambiano **solo il fondo e il bordo**, leggeri: nessuna ombra, nessuno
  spostamento, nessuna freccia che si muove. La tavola «Home · con i dati» è
  scartata.
- **Una scala sola, da 1 a 10**, per soft skill e competenze professionali
  (confermato dal comitato scientifico tramite Roberto il 2026-11-04; annulla
  la «scala da 1 a 8» del 2026-11-02). Nessuna conversione: il punteggio
  complessivo è la media delle due parti con lo stesso peso, e non resta più
  «in attesa» per la scala.
- **In cima a ogni confronto, la classifica di adattamento al ruolo**
  (Roberto: «non è facile capire chi è il miglior candidato»). Per ogni
  persona l'indice a 100 sulle competenze del ruolo, dal più alto; una frase
  calcolata che dice chi è più adatto, o «testa a testa» se la distanza è di
  3 punti o meno; barre piene nel colore della persona; l'atteso 100 come
  linea tratteggiata con il nome; per chi supera 100 un'etichetta lime con lo
  scarto («+6»). Nessuno sfondo colorato oltre l'atteso.
- **Confronto a 2**: una riga per competenza con due punti uniti da un tratto
  (cerchio e rombo), selettore «Competenze del ruolo · 12 / Tutte · 35»,
  radar solo sulle competenze del ruolo. **Colori caldi: ambra (`chart-3`)
  per la prima persona, magenta (`chart-2`) per la seconda** — eccezione alla
  regola «due serie = `chart-mono` + `chart-1`», solo per questo confronto. Le
  due persone si distinguono anche per forma e tratto, non solo per colore.
- **Confronto fino a 5**: sotto la classifica, tre grafici sugli stessi dati.
  **Radar a stella sulle competenze del ruolo** (aree piene, pallini sui
  vertici), **barre a gruppi**
  (un riquadro per area, ordinato dal più alto) e **heatmap delle 35
  competenze**, con ogni colonna nel colore della persona, intensità secondo
  il valore, il numero sempre scritto e il valore più alto della riga con il
  bordo scuro. Una persona per colore, la stessa in tutti e tre. Clic su un
  nome: la persona resta in evidenza, le altre si attenuano. Niente grafico a
  linee per questo confronto.
- **Dove intervenire · grafico a flussi** (Sankey di Bklit): dalle fasce a cosa
  prevede il piano di sviluppo. Con i dati di oggi solo «colloquio di
  restituzione / nessun intervento»: il tipo di intervento (Formazione,
  Coaching, Riorganizzazione, Talento) per persona non c'è. **Bilal: dimmi da
  dove vengono i conteggi 5 · 4 · 2 · 0 e se esiste il dato per persona.**
- **Area o linea.** Area (con la sfumatura di Bklit) per **una serie sola nel
  tempo**: andamento del punteggio, CV ricevuti, sparkline. Linea con due o
  più serie, che con l'area si coprono. Nelle pagine di analisi l'asse di
  un'area parte dal fondo della scala; tagliarlo è ammesso solo nella home.
- **Sparkline** (Bklit, «KPI cards») solo per un numero che ha uno storico vero
  (oggi: il punteggio organizzativo; le candidature hanno una data). Mai una
  serie inventata per riempire un riquadro.
- **Radar: la versione con i pallini sui vertici** (`RadarArea` con
  `showPoints`, il predefinito di Bklit), così al passaggio del mouse si
  legge il valore di ogni punto. Non le varianti «Minimal», «Hexagon» o
  «Single Series», che i pallini li tolgono. Nel confronto a 2 il secondo
  profilo ha i pallini a rombo, come nelle righe.
- **Sottofattori** (Socievolezza, Cordialità…): si mostrano, ma **a parte**,
  nel profilo della persona; i numeri dei confronti vengono solo dalle 35 soft
  skill (Roberto, 2026-11-03). Verifica se arrivano già da Original Skills: se
  non ci sono, il blocco non c'è, e dimmelo.
- **Grafico radiale di Bklit: non si usa** per ora. È dichiarato sperimentale
  e serve per dati ciclici, che non abbiamo.

**Selettore CT / CP / Completo — da ripristinare (2026-11-03).** Con il
rilascio del 30 ottobre è rimasto solo nella Panoramica; Roberto l'ha visto
sparire e non l'aveva chiesto. Torna **dov'era prima del rilascio** (stessa
posizione, stesso comportamento: lo ritrovi nella cronologia del repository) e
vale per **tutto Assessment**, home e pagine dei risultati comprese, **tranne
l'Intervista** (Roberto, 2026-11-09). La scelta
resta mentre si naviga. Se il cliente ha acquistato un solo pacchetto, il
selettore mostra solo quello.

**Euro dal motore ROI — approvato da Roberto il 2026-11-03.** La dashboard usa
le **stesse formule** del motore ROI (roi.skill-vision.it), in automatico: un
solo modulo di calcolo, usato da tutti e due, così una formula corretta vale
ovunque. Il documento «Formule % in €» non è la fonte.

- **Dati in ingresso**: voci del bilancio dal file di Credit Save, caricato una
  volta in **Dati aziendali** (dal 2026-11-06 prima sezione dell'Intervista); dipendenti e
  persone valutate da Anagrafica e valutazioni; valore delle competenze,
  divario dall'atteso e copertura dei ruoli dai risultati dell'assessment;
  compenso, turnover e assenze inseriti a mano nella stessa pagina.
- **Il periodo del bilancio**: se l'esercizio non dura 12 mesi (cambio di
  data di chiusura), il calcolo lo segnala e riporta i valori all'anno. Mai un
  periodo parziale usato come annuo.
- **Etichette**: quelle del motore («potenziale, non perdita in corso»,
  «stima», «verificabile a consuntivo», scenari prudenziale · base ·
  espansivo). L'importo da leggere come obiettivo è quello di Dove intervenire,
  lo scenario base; gli altri tre sono ordini di grandezza, con la riga «gli
  importi non si sommano». Ogni cifra porta a «Come è calcolato».
- **L'atteso**: si fissa dopo la prima misurazione e **non cambia per tutto il
  periodo del Patto**. A schermo solo il valore. Data, criterio e chi l'ha
  fissato si registrano nel sistema, senza mostrarli.
- **Indice a 100** (nelle quattro finestre e nelle pagine dei risultati; i
  punteggi restano nelle pagine tecniche): 100 = la persona raggiunge l'atteso
  su tutte le competenze scelte per il suo ruolo, soft e professionali. Tooltip:
  «100 = la persona raggiunge il livello atteso su tutte le competenze scelte
  per il suo ruolo. 109 = lo supera in media del 9%.» **Formula di Roberto
  (2026-11-05): somma dei valori rilevati ÷ somma dei valori attesi × 100**
  sulle competenze del ruolo (non la media dei rapporti); gap di adeguatezza =
  valore espresso − 100. Soft e professionali con lo stesso peso (nessun peso
  per ora: in futuro un'opzione). Nomi a schermo: «Valore espresso rispetto al
  ruolo» (85%) e «Gap di adeguatezza» (−15%), senza decimali; il valore esatto
  resta nel calcolo e nel ROI. Oltre 100% è un'eccedenza, non un errore.
  Verso il ROI vanno solo tre dati: valore %, gap medio %, copertura ruoli %.
  **Gap medio** = media dei gap di tutte le persone: chi supera l'atteso
  compensa chi resta sotto (Roberto, 2026-11-09). Il «gap medio sotto soglia»
  del motore non si usa.

**Verifica in produzione del 2026-11-02 — correzioni:**

- **«Le perdite invisibili» con i testi della tavola**, non riscritti:
  - Perché è importante: «Sono costi che non compaiono in bilancio: le persone
    ci sono e sono pagate, ma una parte del loro valore si disperde in
    inefficienze e competenze che mancano.»
  - 1: «[N] aree restano sotto quello che chiede la loro mansione. La distanza
    maggiore è in [area].» ⓘ sul grafico: «L'atteso è il punteggio che la
    mansione richiede: 7,0 su 10. La barra dice di quanto le persone di
    un'area ne restano sotto, in media: più è lunga, più l'area è lontana.»
  - 2: etichette «Area più lontana · Mansione più a rischio · Competenza più
    debole». Riga: «L'opportunità: partire dall'area più lontana dà un
    ordine agli interventi.» (Sostituisce la frase della tavola, «la distanza
    è concentrata in poche mansioni»: con 4 aree su 6 sotto l'atteso non è
    dimostrata.)
  - 3: ⓘ «Le persone nelle fasce Da potenziare e Critici, sul totale delle
    persone valutate: [N] su [totale].»
  - 4: «Partire da [area], e dentro l'area dalla mansione di [mansione]. Le
    azioni sono in Dove intervenire. Per scegliere da dove cominciare puoi
    interpellare il Senior Advisor.»
  - Approfondimenti: Competenze trasversali · Competenze professionali: le 5
    P · Risultati Valutazioni Professionali.
  - Vietata ogni frase che dica quanto «pesa» un'area sul totale
    («la parte più grande della perdita»): i dati non lo dimostrano.
- **Le etichette dei riquadri sono neutre** (`muted-foreground`, stile label).
  Il colore di stato solo sulle fasce, con la parola: un riquadro di
  criticità non è una fascia.
- **La mansione si mostra con il suo nome** («Responsabile assistenza
  clienti»), non con la descrizione («Attività operative e di supporto per
  responsabile assistenza clienti»). Vale in tutte le pagine che elencano
  persone.
- **Recruiting ha bisogno di dati dimostrativi.** La posizione attiva della
  demo non ha CV, quindi le pagine mostrano solo stati vuoti. Serve una
  posizione dimostrativa di Acme con candidati in tutti e cinque gli stati,
  test completati e in attesa, almeno due finalisti e un colloquio in
  programma, caricata con lo stesso meccanismo dei dati dimostrativi di
  Assessment. **Non con il seed in produzione.** Solo per la società demo.
- **L'Assistente IA legge la posizione attiva**, non l'archivio descritto come
  «Sales Account Manager» (`ask.ts`): è lo stesso difetto della posizione
  unica.
- **«Colloquio di restituzione necessario»** compare solo dove l'interruttore
  è attivo; spento, l'etichetta dice lo stato vero.
- **Il codice «ma1»** non compare a schermo: ogni competenza con il suo nome
  italiano.
- **Manager: nessuna frase dice che sono esclusi** finché non c'è il criterio.
  Nei dati dimostrativi ci sono un capo linea (Alto potenziale) e una
  responsabile assistenza clienti (Critici).

**Barre di scorrimento** — 2026-10-26: oggi sono quelle del sistema
operativo (larghe 15px, grigie), fuori dal design. Diventano sottili, neutre,
senza binario: `--scrollbar-thumb` (`neutral-300` in chiaro, `neutral-600` in
scuro) e `--scrollbar-thumb-hover`, regole in `@layer base` di `globals.css`.
Valgono ovunque, compresa la barra laterale; nessun componente ne definisce di
proprie.

Densità e impostazione: bordi sottili, superfici neutre, lime solo dove
indica l'azione, il valore unico o lo stato attivo (paragrafo 1).

**Impaginazione** — eccezione voluta a "le schermate non si riprogettano",
decisa il 2026-10-01 dopo la verifica in produzione. Cambia la disposizione,
non il contenuto:

- **Larghezza massima** del contenuto nell'AppShell, `max-w-screen-2xl`,
  centrata. Senza, su uno schermo largo ogni blocco si allunga quanto lo
  schermo.
- **Le card di una riga finiscono alla stessa altezza.** Le griglie di card
  non usano `items-start`; in una colonna di card impilate l'ultima riempie lo
  spazio. `items-start` resta dove allinea un'icona alla prima riga di un testo.
- **Niente card a tutta riga per poco contenuto.** StatCard in griglia, 3 o 4
  per riga. Card di testo, moduli e riepiloghi brevi su 2 o 3 colonne, oppure
  con una larghezza massima. A tutta riga solo tabelle, grafici nel tempo e
  contenuti che ne hanno bisogno. Testo lungo e messaggi di chat entro la
  colonna di lettura (720px, fondamenta).
- **Un'intestazione di pagina sola**: `PageHeader`, nei due moduli.

#### Decisioni del 2026-11-06 (Roberto, risposta scritta)

Valgono sopra quanto scritto prima in questa fase, dove non coincidono. Le parti superate più in alto portano un rimando qui.

**Pagine dei risultati di Assessment**

- **Etichetta e numeri di sezione.** Sopra il titolo, al posto della cifra da sola, l'etichetta della home: «01 · Rendimento», «02 · Costi», «03 · Talenti», «04 · Azioni», in `label-mono`. I titoli di sezione non sono più in `label-mono`: diventano titoli con l'H3 della scala del sito (24px/600, tracking −0,015em; 20px su mobile), perché le pagine dei risultati sono pagine di presentazione (manuale p. 25). Minuscoli, con il numero davanti senza zero e in `muted-foreground` («1  La situazione oggi»). Così i due numeri si distinguono per carattere, corpo e forma: Geist Mono piccolo per la finestra, Geist grande per la sezione. Vale per tutte e sette le pagine dei risultati, anche in Recruiting.
- **«Perché è importante per la tua azienda?»**, testi definitivi:
  - Il valore: «Misurare il rapporto tra retribuzione e rendimento significa trasformare costi fino a oggi indistinti in informazioni strategiche, riconoscendo chi contribuisce alla crescita aziendale e individuando dove si disperde valore economico: costi che si possono evitare.»
  - Le perdite invisibili: «Competenze mancanti, capacità non espresse e ruoli non adeguati generano perdite invisibili che, una volta individuate e misurate, diventano costi evitabili.»
  - Il potenziale: «Valorizzare le persone, riconoscendone competenze e potenzialità inespresse, significa trasformare il capitale umano già a bilancio in maggior valore economico, incrementare la produttività e ridurre i costi di ricerca, selezione e nuove assunzioni.»
  - Dove intervenire: «Individuare i problemi non basta: occorre sapere dove intervenire prima. Skill-Vision trasforma le criticità rilevate in priorità operative, indicando quali interventi evitano i costi maggiori, quante persone coinvolgono e dove concentrare le risorse per ottenere risultati concreti e misurabili.»
  - «Valorizzare» e «valorizzazione» sono ammessi (Roberto). «Recuperare» per i soldi resta vietato.
- **Il valore** parla solo dei risultati: due sezioni, «1 La situazione oggi» (con dentro L'impatto) e «2 Criticità e opportunità». Via «Cosa ti suggeriamo di fare» e gli Approfondimenti. La sezione 1 si compone così (*rivista il 2026-11-09: Gauge grande e centrato, nessuna frase, dettaglio per mansione con un clic; vedi «Decisioni del 2026-11-09»*):
  - **Gauge** (un terzo della riga): valore espresso rispetto al ruolo in `centerValue`, arco in `chart-highlight`, sotto «−20% dall'atteso» (*dal 2026-11-10 al suo posto «Gap medio»*). Il gap di adeguatezza non ha più un riquadro suo.
  - **Bar Chart** (due terzi della riga): le persone valutate in ordine di valore espresso, atteso 100% come linea tratteggiata con il nome, tutte le barre in `chart-mono`; chi supera il 100% ha un'etichetta lime con lo scarto («+6»), come nella classifica dei confronti. Il lime pieno di questa sezione è uno solo, quello del Gauge. Frase calcolata sopra: «[N] sotto l'atteso, [M] oltre.»
  - **Ring** della copertura mansioni, con la percentuale in `centerValue`, scritta una volta sola.
  - **L'impatto**: «€ [—] · In attesa dei dati di bilancio» finché il bilancio non è caricato.
  - **Disposizione**: in alto Gauge (un terzo) e Bar Chart (due terzi) sulla stessa riga; sotto, Ring e L'impatto affiancati, a metà riga ciascuno. Su mobile uno sotto l'altro, nello stesso ordine.
  - **Sparkline** sotto il numero del Gauge solo se c'è uno storico vero del valore espresso; senza storico, niente.
  - «Gap medio» si toglie se coincide con il gap di adeguatezza.
  - Frase della sezione: «Le [23] persone valutate esprimono l'[80]% di quello che chiede il loro ruolo: [19] sono sotto l'atteso, [4] lo superano.»
- **Le perdite invisibili** parla solo delle perdite. Nel grafico della sezione 1, per ogni area la barra dell'**ottenuto** sulla scala 1–10, l'**atteso** come segno tratteggiato con il valore («Atteso 7,0») e lo scarto scritto in fondo alla barra («−1,2»): il gap si vede senza leggere i numeri. Via «Cosa ti suggeriamo di fare» e gli Approfondimenti.
- **Il potenziale** parla solo delle risorse interne. Via «Cosa ti suggeriamo di fare» e gli Approfondimenti.
- **Dove intervenire**: cambia solo il testo. Resta la pagina che porta alla Panoramica.

**Altre pagine di Assessment**

- **Intervista**: si passa da una domanda all'altra senza dover rispondere alla precedente. Le domande senza risposta restano segnate come tali nel riepilogo. (*Il 2026-11-09 esteso alle sottodomande, con punteggio e impaginazione nuovi: vedi «Decisioni del 2026-11-09».*)
- **Dati aziendali** diventano la prima sezione dell'Intervista, prima delle domande. La voce «Dati aziendali» esce dal menu; i link «Vai a Dati aziendali» portano a quella sezione. Il caricamento del bilancio e i campi a mano non cambiano.
- **Panoramica**: oggi resta su «Caricamento dei dati di Assessment…» per circa 5 secondi. Va ridotto; se un blocco è lento, gli altri compaiono subito. Gli euro dicono «In attesa dei dati di bilancio», come nelle altre pagine, non «In attesa della formula».

**Grafici aggregati (regola generale)**

Quando i valori stanno vicini all'atteso (per esempio «Punteggio medio per cluster di competenze» e «Profilo Big Five aggregato», tutti tra 5,8 e 5,9):
- si mostra lo **scostamento dall'atteso**, con barre in più e in meno attorno allo zero e il valore scritto («−0,1»), oppure l'ottenuto con il segno dell'atteso come sopra;
- il valore più lontano dall'atteso è in `chart-highlight`: **un grafico senza lime non è finito**;
- con le etichette lunghe le barre sono orizzontali: le etichette non si sovrappongono mai.

**Recruiting**

- **Profilo della ricerca (home)**: restano la riga Società · Campagna · CIP e le tre card. Si toglie solo il blocco «Acme Corp · Recruiting / Profilo della ricerca / Configura profilo…». Le tre card diventano grandi e verticali, a tutta altezza, come le finestre della home di Assessment, con lo stesso contenuto di oggi.
- **Chi cerchiamo?**
  1. **Profilatura candidato**: una frase e il pulsante «Job profile & description», che apre il Profilo candidato.
  2. **Competenze trasversali analitiche**: apre la pagina **Competenze trasversali** (nuova, livello 1), con l'elenco delle 35 soft skill. Si scelgono quelle del profilo e per ognuna il **valore atteso da 1 a 10**. È l'unico posto dove si scelgono: **la scelta esce dal Profilo candidato**. Il riquadro mostra quante sono state scelte.
  3. **Candidature**: CV ricevuti · CV in linea con il profilo.
  4. **L'impatto**.
- **Il profilo è quello della posizione attiva.** Oggi la configurazione e Risultati mostrano il profilo di «Sales Account Manager» su «Senior Frontend Engineer». Ogni ricerca ha la sua configurazione, che cambia con la posizione.
- **Chi è più adatto?**
  1. **Ranking**: i candidati della posizione ordinati per match CV / profilo, in %; il clic sul nome apre il CV; la colonna di selezione e «Invia link test» (il pattern che esiste). È il contenuto di oggi di `/recruiting/pagina-a`.
  2. **Risultati**: test completati · test in attesa · primo in classifica.
  3. **Vai ai migliori candidati**: porta alla classifica dopo il test (`/recruiting/ranking`), che nel menu si chiama **Migliori candidati**.
  4. **L'impatto**.
  5. **Cosa ti suggeriamo di fare**.
- **Chi scegliamo?** è il colloquio: entra tutto l'attuale livello 4. Sezioni: «1 Colloqui» (in programma, con data, link a Prossimi colloqui) · «2 Valutazioni» (interviste strutturate e valutazioni fatte e da fare) · «3 Candidati al podio» (punti di forza e rischi) · «4 L'impatto» · «5 Cosa ti suggeriamo di fare» (link al Report finale di valutazione).
- **Menu di Recruiting** (*il 2026-11-09 «Risultati» rientra in Chi è più adatto?, tra Ranking e Migliori candidati: vedi «Decisioni del 2026-11-09»*):
  - Profilo della ricerca · Panoramica
  - **Chi cerchiamo?**: Profilo candidato · Competenze trasversali · CV & Esportazione · CV elaborati · Avanzamento della selezione · CV preselezionati
  - **Chi è più adatto?**: Ranking · Migliori candidati · Confronto interno · Stato dell'arte · Imbuto di selezione
  - **Chi scegliamo?**: Prossimi colloqui · Candidati al podio · Intervista strutturata · Valutazione candidato · Report finale di valutazione · Candidati per fascia di idoneità
  - Strumenti · Amministrazione, come oggi.
  - Il livello 4 sparisce. Imbuto di selezione compare una volta sola. «Classifica dopo il test» esce dal livello 1: se è la stessa pagina di Migliori candidati, la rotta resta e si annota in DECISIONI; se mostra altro, si scrive nel resoconto prima di toglierla.
  - Le sottovoci si vedono solo con il livello aperto. È aperto un livello alla volta: quello della pagina attiva.
- **CV dei candidati: da stimare, non da costruire.** (*Superato il 2026-11-09: approvato, da costruire; vedi «Decisioni del 2026-11-09».*) Al salvataggio del Profilo candidato nasce il link dell'annuncio. Roberto chiede se chi apre quel link può caricare il CV e ritrovarlo subito in piattaforma, sulla posizione. Serve: se si può fare, come (pagina pubblica, consenso privacy, limiti sui file) e quanto tempo richiede. Fino all'ok di Roberto non si costruisce.

#### Correzioni di design del 2026-11-09 (Alessio, dopo il rilascio del 7/11)

Valgono sopra le «Decisioni del 2026-11-06» dove non coincidono. Disegno: tela «Skill-Vision · Benvenuto» (https://claude.ai/artifact/Qb6fZn9nPAqsGX88ixhZfm), riga «9 novembre», tavole «Recruiting · Home», «Il valore», «Le perdite invisibili», «Il potenziale» e «Dove intervenire». Le cifre delle tavole sono d'esempio: a schermo si calcolano dai dati.

- **Home di Recruiting: le card tornano all'altezza di prima.** Verticali sì, a tutta altezza no: l'altezza la dà il contenuto, con numero e titolo in alto e i verbi in fondo, senza un vuoto sopra il titolo. Resta tolto solo il blocco titolo e sottotitolo.
- **Il valore · sezione 1: niente elenco delle persone.** (*Superato il 2026-11-09 dalle «Decisioni del 2026-11-09»: Gauge grande e centrato, il dettaglio per mansione si apre con un clic; la tavola «Il valore» non vale più per la sezione 1.*) Le 23 barre fanno una colonna lunghissima accanto a un Gauge piccolo. Al loro posto un **Bar Chart orizzontale del valore espresso per area** (le stesse aree delle Perdite invisibili): una barra per area in `chart-mono`, il valore scritto («68%»), l'atteso 100% tratteggiato con il nome. Gauge e Bar Chart hanno **la stessa altezza**; sotto il grafico, il link «Vedi tutte le persone» alla pagina tecnica. Il lime pieno resta solo sul Gauge.
- **L'impatto, in tutte le pagine dei risultati: ogni percentuale ha la sua forma.** Una quota va in un **Ring** con il numero in `centerValue` («30% delle persone è sotto la norma»), come dice la regola «Un numero che ha una forma la mostra». Niente percentuali scritte da sole.
- **L'impatto ha tre card in fila**: il dato della pagina in un Ring (lime, il numero della sezione); il «Valore espresso rispetto al ruolo» come **barra orizzontale** su scala 0–120% con l'atteso 100% tratteggiato, in inchiostro, con «−27% dall'atteso»; la card degli euro con gli scenari prudenziale · base · espansivo, «Gli importi non si sommano» e «Come è calcolato». Nel Potenziale il dato della pagina è una fila di pallini (4 su 23), per non ripetere il Ring della sezione 1.
- **2 Criticità e opportunità: ogni riquadro ha un mini grafico.** Sotto il nome, una barra sulla sua scala (1–10 o 0–120%) con l'atteso tratteggiato e il valore scritto; nei riquadri con le persone, una riga per persona con la sua barra; per i conteggi, una fila di pallini o un Ring piccolo. In inchiostro, mai lime. (*Superato il 2026-11-10: verde il mini grafico del primo riquadro, con il verde del fondo; vedi «Correzioni di Roberto del 2026-11-10».*)
- **Gli euro nella demo.** Per la società demo (Acme, solo l'account demo) si carica un **bilancio dimostrativo** in Dati aziendali, con lo stesso meccanismo degli altri dati demo e mai con il seed in produzione. Così il motore ROI calcola gli euro e L'impatto li mostra con gli scenari e «Come è calcolato». La pagina dice «Dati dimostrativi». Le società vere continuano a mostrare «In attesa dei dati di bilancio» finché il loro bilancio non è caricato.

#### Decisioni del 2026-11-09 (Roberto, risposta scritta)

Valgono sopra le «Correzioni di design del 2026-11-09» e le «Decisioni del 2026-11-06», dove non coincidono.

**Il valore**

- **Sotto «1 La situazione oggi» nessuna frase.** Via la frase della sezione («Le [23] persone valutate esprimono…») e quella sopra il grafico («[N] sotto l'atteso, [M] oltre»): i numeri li dicono già il Gauge e i riquadri.
- **Il Gauge è grande e centrato**, da solo sulla sua riga: è il dato principale della pagina. Sotto, «[−20]% dall'atteso». (*Dal 2026-11-10 al suo posto «Gap medio −20%»: vedi «Correzioni di Roberto del 2026-11-10».*)
- **Il dettaglio si apre con un clic.** Sotto il Gauge, un pulsante `outline` «Vedi per mansione» apre (Collapsible di shadcn) un **Bar Chart orizzontale del valore espresso per mansione**: una barra per mansione in `chart-mono`, dalla più lontana dall'atteso, il valore scritto («68%»), l'atteso 100% tratteggiato con il nome, nessun lime. All'apertura della pagina è chiuso. Le barre sono mansioni e non persone, così il grafico regge anche un'azienda di 400 dipendenti. In fondo al dettaglio, «Vedi tutte le persone» porta alla pagina tecnica. Sostituisce il Bar Chart per area delle correzioni del 9/11. È un'eccezione voluta alla regola «tutto visibile all'apertura», decisa da Roberto.
- Ring della copertura mansioni e L'impatto restano come nelle correzioni del 9/11.
- **2 Criticità e opportunità, i tre riquadri**, ognuno con il suo mini grafico (correzioni del 9/11):
  - «Mansione con il maggiore deficit di competenze»: il nome della mansione e il suo valore espresso, con la barra e l'atteso 100% tratteggiato;
  - «Area con il maggiore deficit di competenze»: come sopra, per area;
  - «Chi va oltre le attese»: quante persone superano il 100% e le prime tre, con mansione e valore espresso; nessuno: «Nessuno oggi».

**Intervista** (`/assessment/analisi`)

- **Si va avanti anche senza rispondere alle sottodomande.** Prima del 7/11 non si passava alla domanda successiva se una sottodomanda era vuota: ogni domanda e ogni sottodomanda si può saltare.
- **Le risposte mancanti non contano nel punteggio.** Una domanda conta se ha almeno una sottodomanda con risposta, e si calcola solo sulle sottodomande con risposta. Sotto il punteggio: «Calcolato su [6] domande su [7]». Con tutte le risposte la riga non c'è.
- **Impaginazione**: «Nuova intervista» e «Modifica risposte» in alto a destra, nelle azioni del `PageHeader`. «Stampa / PDF» e «Salva» in fondo alla pagina, Salva primario. Via le caselle CT · CP · CT+CP: il selettore CT / CP / Completo non compare nell'Intervista. Via il blocco «Fase successiva · Misurazione oggettiva».
- **Il bilancio**: Dati aziendali resta la prima sezione dell'Intervista (2026-11-06), visibile anche nella vista del riepilogo, in cima, con lo stato («Bilancio caricato il [data]» oppure «Carica il bilancio»). Accetta lo stesso file del motore ROI (Credit Save) e si carica nello stesso modo: nessun formato diverso. (*Il 2026-11-10: il caricamento sta dentro l'Intervista, non in un'altra pagina; vedi «Correzioni di Roberto del 2026-11-10».*)

**Recruiting**

- **Competenze trasversali: il valore atteso con un decimale**, da 1,0 a 10,0 a passi di 0,1, scritto con la virgola («6,4»), nel campo e a schermo.
- **Peso e soglia delle Competenze trasversali: in attesa di Roberto.** La logica di oggi (atteso scritto, altrimenti la soglia del peso) non si tocca.
- **«Risultati» torna nel menu.** I tre passi di Chi è più adatto?, come li descrive Roberto:
  1. **Ranking**: la classifica per match CV / profilo, in %; più è alto, più il candidato è in linea.
  2. **Risultati**: chi ha superato il match (CV in linea con il profilo) e ha completato il test delle soft skill. È la pagina «Classifica dopo il test» (`/recruiting/classifica-test`), che torna nel menu con questo nome. Se oggi mostra anche chi non ha completato il test, lo si toglie dall'elenco: quelli in attesa li conta il riquadro.
  3. **Migliori candidati**: la classifica dopo il test (`/recruiting/ranking`).

  Il riquadro «2 Risultati» della pagina Chi è più adatto? porta a Risultati. Menu del livello: Ranking · Risultati · Migliori candidati · Confronto interno · Stato dell'arte · Imbuto di selezione.
- **Big Five ideale per posizione: in attesa di Roberto.** Non toccarlo. (*Il 2026-11-10 si chiede la stima: vedi «Correzioni di Roberto del 2026-11-10».*)

**CV caricati dal link dell'annuncio — da costruire** (approvato da Roberto il 2026-11-09; stima 27–39 ore, più 4–6 per l'antivirus)

- **Titolare del trattamento: l'azienda cliente.** Informativa e consenso portano il nome dell'azienda cliente: nella società servono ragione sociale, sede e un contatto per la privacy, compilati in Amministrazione. Senza questi dati il link non si crea.
- **Il link si crea con un pulsante.** Nel Profilo candidato, «Crea link»: si attiva quando i campi obbligatori sono compilati; il clic crea il link e mostra l'annuncio pronto e il link da copiare. Il link non nasce più all'approvazione né al salvataggio. Se l'approvazione del profilo serve ad altro, resta.
- **Conservazione**: di base **24 mesi**. Nel modulo una casella, **non spuntata**, «Conservate il mio CV solo per 6 mesi»: se il candidato la spunta, vale 6 mesi. Le due durate sono impostazioni della società, non valori scritti nel codice. Alla scadenza CV e dati del candidato si cancellano da soli. Si registrano data dell'invio, durata scelta e versione dell'informativa.
- **Antivirus sui file: sì.** (*Il 2026-11-10: il controllo di base non basta, serve un motore; vedi «Correzioni di Roberto del 2026-11-10».*)
- **Il testo dell'informativa** non è nella stima e arriva dallo studio. Fino ad allora un segnaposto dichiarato, e il modulo pubblico resta attivo **solo per la società demo**: per le società vere si accende quando l'informativa è al suo posto.

#### Correzioni di Roberto del 2026-11-10 (e residui del giro del 9/11)

Valgono sopra le «Decisioni del 2026-11-09», le «Correzioni di design del 2026-11-09» e le «Decisioni del 2026-11-06», dove non coincidono. Sono tradotte nell'identità dallo studio: si prende quello che Roberto chiede, non come lo chiede.

**Un verde per sezione, più la barra sotto il mouse**

Roberto vuole più verde nei grafici. Si dà, senza tornare al «tutto verde» del 2026-10-26: **un solo elemento verde per sezione**, più la barra sotto il mouse. **Nessun colore nuovo e nessun token nuovo**: si usano i verdi delle fondamenta, quello giusto per il fondo.

- **I verdi, per fondo** (fondamenta, «Dati e grafici» e «Regole d'uso»):
  - **fondo scuro**: `accent-400`, per barre, archi, anelli e pallini;
  - **fondo chiaro, barre e pallini**: `accent-400` con il bordo `chart-highlight-stroke` (`neutral-800`, 1,5px);
  - **fondo chiaro, linee, archi e anelli** (Gauge, Ring): `accent-600`. Le fondamenta lo dicono già: «`accent-400` non si usa mai come linea o area di grafico su fondo chiaro». È la risposta a «il giallo su fondo chiaro contrasta poco»: oggi l'arco del Gauge in chiaro è `accent-400`, e non deve esserlo.
- **Cosa è verde**, nelle pagine dei risultati di Assessment (Il valore, Le perdite invisibili, Il potenziale, Dove intervenire), in chiaro e in scuro:
  - **sezione 1**: il valore che conta del grafico principale, come oggi (il Gauge ne Il valore);
  - **la barra sotto il mouse**, in ogni Bar Chart della pagina, compreso «Vedi per mansione»: è sempre una sola e solo mentre la si guarda, quindi non conta nel verde della sezione;
  - **2 Criticità e opportunità**: il mini grafico del **primo riquadro** (la mansione o l'area più lontana dall'atteso, il riquadro principale della sezione). Gli altri mini grafici in `chart-mono`;
  - **3 L'impatto**: il Ring del dato della pagina, come oggi (nel Potenziale i pallini).
- **Restano in inchiostro** (`chart-mono`): il Ring della copertura mansioni, la barra del valore espresso e gli scenari dell'Impatto, gli altri mini grafici. La cifra in euro resta nel colore del testo. L'atteso resta tratteggiato in `chart-reference`.

**«Perché è importante per la tua azienda?» diventa titolo e sottotitolo**

In tutte e sette le pagine dei risultati (anche in Recruiting, perché restino uguali):

- **esce dal riquadro**: niente fondo `card` né bordo, sta sulla pagina;
- la domanda in **H2 del sito** (32px/600, tracking −0,02em; 26px su mobile);
- il testo a **20px/400**, interlinea 1,5 (18px su mobile), colore del testo primario, nella colonna di lettura (720px).

La gerarchia diventa: titolo della pagina H1 (44px) › «Perché è importante» H2 (32px) › titoli di sezione H3 (24px). I testi non cambiano.

**Il valore · il gap medio si vede**

Roberto: manca «il valore del gap mancante a raggiungere il valore atteso», uno dei tre dati che vanno al ROI.

- Sotto il Gauge, al posto della riga «[−20]% dall'atteso», il dato con il suo nome: «Gap medio» in `label-mono` e il valore in H3 («−20%»), con ⓘ: «La distanza media dal valore atteso, su tutte le persone valutate: chi lo supera compensa chi resta sotto.»
- Il numero si scrive una volta: la riga «dall'atteso» sotto il Gauge sparisce.
- Così la pagina mostra i tre dati che vanno al ROI: valore espresso (Gauge), gap medio (sotto il Gauge), copertura mansioni (Ring).
- **Da verificare**: il Gap medio è la media dei gap delle persone (Roberto, 9/11). Se il Gauge è la media dei valori espressi delle persone, gap medio = Gauge − 100 e i due numeri tornano. Se il Gauge è calcolato in un altro modo (per esempio somme su tutta l'azienda), i due numeri non tornano: scrivilo nel resoconto con i due valori dei dati demo, e per il gap medio usa comunque la media delle persone, come va al ROI.
- «Mansione con il maggiore deficit di competenze»: già nelle «Decisioni del 2026-11-09», Roberto lo conferma.

**Panoramica**

- Via «e cosa fare lunedì» da ogni testo a schermo in cui compare (sottotitolo, titolo di un blocco, tooltip). Il resto della Panoramica non cambia: sui colori Roberto torna più avanti.

**Anagrafica**

- **Nel menu**: subito sotto Intervista, prima di Area valutazioni, allo stesso livello. Intervista e Anagrafica stanno vicine perché raccolgono i dati dell'azienda.
- **Importazione da Excel: da stimare, non da costruire.** Roberto la vuole; prima di costruirla servono fattibilità e ore, come per i CV. Cosa deve fare:
  - «Scarica il modello»: un file .xlsx generato dalla piattaforma dai campi dell'Anagrafica (una colonna per campo, nomi in italiano, un foglio di istruzioni con formato e obbligatorietà di ogni campo), così il modello non diverge dalla pagina;
  - «Carica file»: prima di salvare, un'anteprima con quante persone entrano e gli errori riga per riga (riga, campo, problema); niente salvataggio parziale senza dirlo;
  - nel resoconto: che cosa esiste già (un import CSV?); le persone già presenti si aggiornano o si aggiungono, e con quale chiave; dove finiscono i dati importati, visto che Assessment oggi salva nel browser; le ore.

**Intervista · il bilancio**

- **Il caricamento sta dentro l'Intervista.** È deciso dal 6/11 e dal 9/11: Dati aziendali è la prima sezione dell'Intervista e lì si carica il file del motore ROI (Credit Save). Il resoconto del 9/11 parla di uno stato del bilancio con «Vai al bilancio», e Roberto non trova dove caricarlo: se il caricamento oggi sta in un'altra pagina, va portato nell'Intervista. Stato, data, nome del file e il pulsante per caricarlo o sostituirlo stanno nella sezione stessa. Nel resoconto, conferma che accetta il file Credit Save del motore ROI.
- **[In attesa di Roberto]** proposta: per le società vere, senza bilancio caricato **la card degli euro non compare**, al posto di «€ [—] · In attesa dei dati di bilancio»; L'impatto mostra solo le percentuali. Nella demo resta il bilancio dimostrativo di Acme. Fino alla risposta non si tocca.

**Recruiting**

- **Antivirus: serve un motore.** Il controllo del 9/11 (tipo di file e firma EICAR) è un controllo di base. Roberto ha approvato l'antivirus: si collega un motore (ClamAV o un servizio) nel punto del codice già predisposto, prima che il modulo si accenda per una società vera. Con il motore spento o irraggiungibile il file si rifiuta, non passa.
- **Big Five ideale per posizione: da stimare, non da costruire.** Oggi il calcolo usa sempre il profilo di «Sales Account Manager» (`roles-seed.json`), qualunque sia la posizione. La proposta a Roberto: impostarlo per posizione nella pagina Competenze trasversali, partendo da uno degli otto profili già pronti, con i cinque valori modificabili. Nel resoconto: le ore, e cosa cambia nei punteggi già calcolati.
- **Peso, soglia e regola di blocco: in attesa di Roberto** (proposta: atteso obbligatorio, peso tolto, regola di blocco sul 60% dell'atteso scritto). Fino alla risposta non si toccano.

**Area valutazioni**: Roberto la riprende più avanti. Non si tocca.


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
l'unico punto dove si può chiudere fuori tutti. Gli account del cliente e
le loro password si creano e si consegnano d'accordo con il cliente, non si
inventano. Gli account del gruppo di lavoro (studio e sviluppo) invece si
creano subito: servono per passare la produzione al login vero prima che ci
arrivino dati reali.

**Dati reali prima del login vero: no.** Finché il ponte usa credenziali
scritte nel bundle, `requireAuth` non protegge niente: chiunque legga il
JavaScript può fare il login con quelle. Nessuna rotta che restituisce dati
di persone reali (Original Skills compreso) si attiva in produzione con
`VITE_AUTH_MODE=legacy`.

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

Le regole dei testi stanno nel manuale (capitolo 09, Tono di voce) e nel box
progetto di Alessio, che è il punto di verità. Per l'interfaccia, dal
2026-10-29:

- **Il nome si scrive Skill-Vision**, con il trattino, in ogni testo a schermo,
  email e documento. Il logo SKILLVISION non cambia.
- **Mai "recuperare" per i soldi**: Skill-Vision fa evitare costi, non
  restituisce denaro. "Costi evitabili", "puoi evitare", mai "recuperabili".
- **Il fornitore dei test della parte soft non si nomina** (Original Skills):
  a schermo è "i test che utilizziamo". Il nome resta solo nel codice, nelle
  variabili e nei documenti interni.
- **Parole bandite** (manuale p. 55): soluzione, innovativo,
  all'avanguardia, a 360 gradi, potenziale inespresso, sinergia, chiavi in
  mano. «Valorizzare» è ammesso dal 2026-11-06 (Roberto).
- **Inglese**: in dashboard restano report, gap, benchmark, feedback, team
  (etichette di lavoro, deciso il 2026-10-29); nei testi di presentazione solo
  engagement, turnover, recruiting, assessment, onboarding.
- **Registro**: neutro e strumentale nelle pagine di lavoro; espositivo nelle
  pagine di presentazione (le home e le pagine dei risultati), che usano anche la
  scala tipografica del sito nel contenuto (eccezione del manuale, p. 25).
- **Dati non reali**: ogni schermata con dati dimostrativi lo dichiara.
- Il claim "From Search to Talent" nella Home Recruiting: inglese su interfaccia
  italiana. In quel punto non serve uno slogan, serve un'informazione.
- "Salva JD": l'emoji è già stata tolta, la sigla resta.

**Di prodotto — già decisi**

- Le schermate non si riprogettano: tengono impianto e contenuti di oggi,
  tranne le pagine d'ingresso e la Panoramica (Fase 6).
- La Home di Assessment a folder card non resta: al suo posto la nuova Home
  (le quattro finestre come domande, senza numeri) e, come seconda voce, la
  Panoramica con le viste Sintesi e Dettaglio. In
  Recruiting l'ingresso è il Profilo della ricerca di Roberto.
- La radice `/` resta la scelta del modulo; nessuna dashboard trasversale ai
  due moduli.
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
- **Ingresso dei due moduli**: Home in Assessment, Profilo della ricerca
  in Recruiting; la Panoramica nel menu, seconda voce in tutti e due (Fase 6). Superfici neutre, testo a
  sinistra, niente contenuti nascosti dietro un interruttore.

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

**Decise dal cliente il 2026-10-02** (call con Roberto)

- **Le due società di Original Skills non sono un gruppo**: sono due aziende
  clienti distinte che Skill Vision amministra. È la forma `Platform` →
  `Company`: Skill Vision è la piattaforma, ogni azienda cliente una `Company`.
  I loro dati sono di persone reali.
- **Accessi**: chi lavora in una società vede solo la sua. Lo staff di Skill
  Vision (superamministratore) vede tutte le società, anche le singole
  persone. Un account demo amministra solo la società demo.
- **Original Skills**: l'accordo con l'università copre il passaggio e la
  conservazione dei risultati (confermato per iscritto). La chiave non scade.
  "Ultima modifica" è la data in cui il test è stato completato. Original
  Skills ha un avviso automatico a test completato; non ha un ambiente di
  prova.
- **Competenze**: si usano i nomi italiani del test, tranne dove il test usa
  l'inglese (Decision Making, Problem Solving, Team Work, Customer Experience):
  lì **non** si adotta l'inglese, restano le diciture italiane di oggi
  (`ma6` Risoluzione dei problemi, `ma8` Lavoro di squadra, `so2` Esperienza
  del cliente; `ma1` oggi diverge fra Assessment e Recruiting, va scelta una
  sola dicitura italiana e proposta ad Alessio).
  "Dedizione al lavoro" corrisponde a "Impegno lavorativo"; "Engagement
  lavorativo" non si usa. Si cambiano le etichette, non gli identificativi.
- **Dati di Assessment di oggi**: sono di prova. Con i dati veri si riparte da
  zero.
- **Recruiting**: "Segna completato" non serve a mano, basta quello automatico
  da Original Skills. Cambio di posizione, scheda vuota, import CSV e import
  multiplo dei CV servono, ma possono aspettare.
- **"Assessment sul server"**: più avanti, data da definire.
- **Ancora da chiarire**, non decidere da solo: come si converte il punteggio
  complessivo (oggi standardizzato, circa −3…+1) sulla scala 1–10; cosa vuol
  dire "il pari valore si fa a parte, solo per i manager"; dove va
  l'aggiornamento notturno, visto che Assessment non è ancora sul server.

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
- [ ] Corpi dalla scala interfaccia: `text-app-*`. La scala del sito solo nelle
      pagine di presentazione (home e pagine dei risultati, cap. 7 «Testi»).
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

### Prima di scrivere «fatto» — obbligatorio (2026-11-05)

Il resoconto va al cliente e allo studio, che **non fanno il collaudo**. Il
rilascio del 4 novembre è arrivato con errori visibili al primo clic: i menu
«Cambia» e «+ Aggiungi» dei confronti si aprivano vuoti, i due pulsanti di un
selettore erano accesi insieme, il passaggio del mouse non mostrava niente, il
pulsante «Carica dati dimostrativi» stava nel menu di produzione. Non deve
ripetersi.

Un punto è «fatto» solo quando, **dopo la pubblicazione e in produzione**, è
stato provato così:

1. **Controlli del codice**: `audit-identita.mjs`, typecheck, lint, build, test.
   Sono il minimo, non la prova.
2. **Ogni pagina toccata si apre nel browser** (con l'automazione del browser
   se disponibile) con l'account demo, e si usa come la userebbe il cliente:
   - **ogni menu a tendina si apre e ha voci**; scegliendone una la pagina
     cambia;
   - **ogni selettore ha una sola opzione attiva**, e cambiandola cambiano i
     dati;
   - **ogni link porta dove deve**, e la voce del menu attiva è quella giusta;
   - **il passaggio del mouse mostra il valore** su ogni punto, barra e casella
     dei grafici;
   - **clic sugli elementi interattivi** (nomi da evidenziare, pulsanti,
     schede): fanno quello che dicono;
   - **modalità chiara e scura**, e **larghezza da telefono** (390px): niente
     testo tagliato, niente sovrapposizioni, niente scorrimento orizzontale;
   - **con dati e senza dati**: gli stati vuoti dicono cosa comparirà.
3. **Confronto con la tavola** di riferimento sulla tela: struttura, testi,
   colori, ordine. Ogni differenza o è voluta e scritta in DECISIONI, o si
   corregge.
4. **Niente strumenti di lavoro a schermo**: pulsanti di debug, di caricamento
   demo, di reset, catalogo componenti. Stanno solo nell'account demo, in una
   pagina di amministrazione.
5. **Ogni frase del resoconto è verificata**: non si scrive che una cosa
   succede («i manager non compaiono») se non c'è il modo di controllarlo.

**La prova la fa Bilal** (2026-11-09). Se l'assistente non ha accesso alla
produzione, Bilal la fa a mano con il suo account di produzione, oppure fa
l'accesso nel browser che l'assistente usa (l'assistente non inserisce
password). Un resoconto con «non verificato in produzione» non si manda:
lo studio e il cliente non fanno la verifica al posto suo.

Nel resoconto, **per ogni punto, una riga su come è stato verificato in
produzione** (pagina, azione fatta, risultato). Quello che non è stato
provato, o non funziona, si scrive «non fatto» con il motivo: un «non fatto»
dichiarato vale più di un «fatto» che si rompe al primo clic.

**La riga di verifica dice cosa si è visto** (2026-11-10). Non «esito
positivo», ma il valore letto a schermo o l'azione con il suo risultato
(«Il valore: Gap medio −20%, Gauge 80%»; «Intervista salvata con la domanda 2
saltata, ricaricata: risposte al loro posto, "Calcolato su 4 domande su 5"»).
Dove serve, una schermata allegata. Ogni punto chiesto nel messaggio del giro
compare nel resoconto, anche se la risposta è «non fatto».

---

## 10. Materiali

| File | Cosa contiene |
|---|---|
| `globals.css` | Il tema. Unico posto dove stanno i valori. Dopo la Fase 1 fa fede la copia nel repository, che ha in più gli alias di Bklit e la scala dei livelli: le modifiche dallo studio arrivano come elenco di valori da applicare, non come file da sostituire. |
| `skill-vision-fondamenta.md` | Il sistema completo: regole, contrasti verificati, motivazioni. |
| La tela «Skill-Vision · Benvenuto» | https://claude.ai/artifact/Qb6fZn9nPAqsGX88ixhZfm — le tavole di riferimento. Se una tavola e questo file non coincidono, vale questo file. |
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
