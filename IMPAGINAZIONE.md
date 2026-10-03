# Impaginazione — larghezza massima, altezze di riga, card a tutta riga

## Applicato il 2026-10-02 (Fase 6, CLAUDE.md «Impaginazione»)

Cambia la disposizione, non il contenuto. Pagine modificate:

| Schermata | Prima | Dopo |
|---|---|---|
| **Tutte** (`AppShell`) | contenuto largo quanto lo schermo | `mx-auto w-full max-w-screen-2xl`: 1536 px al massimo, centrato |
| Recruiting · Home | intestazione fatta a mano a tutta riga, «Panoramica candidati» a tutta riga; card della griglia ad altezze diverse (`items-start`) | `PageHeader` con le tre azioni; tre `StatCard` in riga; card di una riga alla stessa altezza |
| Recruiting · tutte le altre pagine | cerchio con icona + `h2` da sezione, fatto a mano | `PageHeader` di livello pagina (Profilo della ricerca, Profilo Candidatura, CV & Esportazione, CV Elaborati, Migliori Candidati, Risultati, Confronto interno, Metodo, Assistente IA, CIP, Email, Le mie valutazioni) |
| Recruiting · CV & Esportazione | caricamento, conservazione, «Posizione e archivio», importazione massiva: quattro blocchi a tutta riga | due colonne: caricamento e conservazione a sinistra, posizione e importazione a destra (l'ultima riempie la colonna) |
| Recruiting · CV Elaborati | profilo della posizione e quattro fasi a tutta riga | profilo con larghezza massima; le quattro fasi su due colonne, nell'ordine del flusso |
| Recruiting · Profilo Candidatura | anteprima allineata in alto (`lg:items-start`) | invariata a schermo: l'anteprima tiene `self-start`, altrimenti sarebbe alta quanto il modulo (~10.000 px) |
| Recruiting · Assistente IA (Ask) | intestazione a metà pagina, card a tutta riga, bottoni e messaggi fatti a mano | un'intestazione in cima; contenuto nella colonna di lettura (720 px); `ChatMessage` e `Button` |
| Assessment · Competenze Trasversali / Professionali | introduzione a tutta riga, due card di accesso sotto | introduzione su 2/3, card di accesso impilate a destra (l'ultima riempie la colonna) |
| Assessment · Dati Aziendali | contatori in una card dentro una card; Sedi e Contatti a tutta riga | contatori in griglia da 4; Sedi e Contatti affiancati (≥ 1280 px) |
| Assessment · Intervista | domanda centrale, aree critiche e sei risposte a tutta riga; titolo ripetuto in maiuscolo; risposte libere come badge maiuscoli; «Considerazioni dell'esperto» primario a tutta larghezza | domanda centrale e aree affiancate; risposte su due colonne; «Scostamento percepito» al posto del titolo ripetuto; risposte in elenco numerato; il bottone dell'esperto è outline, la sua risposta nella colonna di lettura |
| Assessment · Valori Complessivi | cinque colonne di fasce ad altezze diverse | stessa altezza (`items-start` tolto) |
| Assessment · Piani di Sviluppo | 2 colonne | 3 colonne da 1280 px |
| Assessment · Assistente IA | conversazione larga quanto lo spazio libero | conversazione nella colonna di lettura (720 px) |

Restano `items-start` solo dove allineano un'icona alla prima riga di un
testo (avvisi, `InlineAlert`, `StatCard`, `ChartCard`, messaggi d'errore).

---

## Pre-analisi (2026-10-02, prima dell'applicazione)

Misure dall'app avviata. Le tengo come riferimento del prima e dopo. Le misure vengono dall'app
avviata (Playwright, 22 rotte, finestre di 1440, 1920 e 2560 px), simulando le
due modifiche nel browser e confrontando prima e dopo.

## 1. Il tetto di larghezza `max-w-screen-2xl` (1536 px)

**Oggi** `<main>` (`layouts/AppShell.tsx:20`) occupa tutto lo spazio a destra
della barra laterale: larghezza della finestra − 256 px. Non c'è tetto.

**Dopo** il contenuto si ferma a 1536 px. Va messo dentro `<main>`:
`<div className="mx-auto w-full max-w-screen-2xl">`. Con `mx-auto` il blocco
sta al centro; senza, sta a sinistra e a destra resta uno spazio vuoto.
Raccomandazione: centrato.

**Quando si vede**: solo con finestre più larghe di **1792 px** (1536 + 256 di
barra laterale). Sotto non cambia nulla: portatili, 1440, 1680.

| Finestra | `main` oggi | `main` dopo | Differenza |
|---|---|---|---|
| 1440 | 1184 | 1184 | nessuna |
| 1920 | 1664 | 1536 | −128 px (−8%) |
| 2560 | 2304 | 1536 | −768 px (−33%) |

Le griglie hanno lo stesso numero di colonne prima e dopo: cambia solo la
larghezza di ogni colonna. Effetti secondari misurati: dove le colonne si
stringono, il testo va a capo e alcune card si allungano.

| Schermata | Struttura | A 2560 px: prima → dopo |
|---|---|---|
| **Recruiting · Home** | riga KPI · griglia 2fr/1fr (fasce, imbuto, posizioni, colloqui) · banner | griglia 2256 → 1488 px; i tre KPI del banner 1459 → 911 px |
| Recruiting · Risultati, Migliori Candidati, Metodo, Ask | colonna singola, tabelle e card | larghezza 2256 → 1488 px, nessun cambio di struttura |
| Recruiting · CV Elaborati | 3 colonne di stato | 2256 → 1488 px, altezze uguali (141) |
| Recruiting · Partita interna | 2 + 5 slot di confronto | 2256 → 1488 px, slot 451 → 297 px |
| Recruiting · CV & Esportazione | 3 KPI · campi in 2 colonne | 2256 → 1488 px |
| **Recruiting · Profilo Candidatura** | modulo a sinistra · anteprima 420 px a destra | il modulo 1786 → 1018 px; i campi a 4 colonne restano a 4 ma più stretti |
| Recruiting · Profilo della ricerca | 2 × 2 card | 2256 → 1488 px, altezze invariate |
| Assessment · Home | 2 × 2 folder card · pannello Skill Vision · banner | card 1128 → 744 px ciascuna, altezza invariata (243) |
| Assessment · Competenze Trasversali / Professionali | 2 card di navigazione | 2256 → 1488 px |
| Assessment · Dati Aziendali | 4 contatori · 3 colonne di sedi/contatti | contatori 555 → 363 px |
| Assessment · Anagrafica, Risultati | tabella a tutta larghezza | tabella 2256 → 1488 px: più colonne vanno a capo |
| **Assessment · Intervista** | 5 card KPI | card 451 → 297 px, **altezza 155 → 176** (le etichette vanno a capo) |
| Assessment · Area Valutazioni Trasversali | 2 grafici · 6 card gap | grafici 394 → 414 px di altezza |
| Assessment · Area Valutazioni Professionali | 2 grafici · griglia interna | griglia interna 1086 → 702 px |
| Assessment · Valori Complessivi | classi + andamento · matrice · 5 colonne di fasce | vedi §2 |
| Assessment · Customer Care | 4 KPI | **altezza 115 → 133** (testo a capo) |
| Assessment · Piani di Sviluppo, Assistente IA | 2 colonne | 2256 → 1488 px, altezze invariate |

## 2. Rimozione di `items-start`

Nel codice ci sono 24 `items-start`. Solo **quattro** decidono
l'impaginazione di una pagina. Gli altri allineano un'icona alla prima riga di
un testo (avvisi, messaggi d'errore, `InlineAlert`, `StatCard`, `ChartCard`):
lì `items-start` deve restare, altrimenti l'icona scende al centro di un testo
su più righe.

Senza `items-start`, gli elementi di una riga prendono tutti l'altezza del più
alto (`stretch`, il valore di default).

| # | Dove | Prima | Dopo |
|---|---|---|---|
| 1 | **Recruiting · Home** — `RecruitingHome.tsx:134`, griglia `lg:grid-cols-[2fr_1fr]` | a 1440 px: "Candidati per fascia" 260 px accanto a "Imbuto" 346; "Posizioni aperte" 196 accanto a "Colloqui" 258 | le due righe si pareggiano: 346/346 e 258/258. Le card più corte prendono spazio vuoto in fondo, ma i bordi si allineano |
| 2 | **Assessment · Valori Complessivi** — `AssessmentValorePage.tsx:186`, 5 colonne di fasce (Top Talent … Persona Critica) | altezze 111/279/314/314/168: ogni colonna lunga quanto il suo elenco | tutte 314 px: cinque riquadri uguali, con spazio vuoto sotto gli elenchi corti |
| 3 | **Recruiting · Profilo Candidatura** — `JobProfilePage.tsx:289`, `lg:items-start` | anteprima alta 1884 px accanto a un modulo di ~10.000 | **nessun cambio**, perché l'anteprima ha già `self-start`. Senza quella classe, il riquadro dell'anteprima diventerebbe alto 10.000 px e quasi tutto vuoto: va tenuta |
| 4 | **Banner fra i moduli** (le due Home) — `CrossModuleBanner.tsx:38`, `lg:flex-row lg:items-start` | testo a sinistra, metriche a destra | nessun cambio visibile: i due blocchi non hanno fondo né bordo |

## 3. In sintesi

- **Cambiano davvero due schermate**, per via di `items-start`: Home Recruiting
  (card pareggiate per riga) e Valori Complessivi (cinque colonne uguali).
  Si vedono a qualunque larghezza.
- **Il tetto di 1536 px** tocca tutte le schermate, ma solo sopra i 1792 px di
  finestra. Su un 1920 è una stretta dell'8%. Su un 2560 il contenuto perde un
  terzo della larghezza e sta al centro: Intervista e Customer Care hanno card
  KPI più alte, e le tabelle di Anagrafica e dei Risultati vanno di più a capo.
- **Da non toccare**: gli `items-start` d'icona (20), quello di `InlineAlert`
  e il `self-start` dell'anteprima di Profilo Candidatura.
