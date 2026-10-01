# Skill Vision — Fondamenta del design system

Documento di riferimento. Versione di lavoro, agosto 2026.

Copre colore, tipografia, spazio e forma, logo, modulo e immagini, tono di voce. Iconografia, componenti e applicazioni sono capitoli successivi.

---

## Principi

1. **Il bianco puro non esiste.** L'estremo chiaro del sistema è `neutral-0` (`#FFFEF5`). Un `#FFFFFF` in mezzo a questi neutri legge azzurrino e rompe la coerenza. Il bianco puro resta ammesso solo fuori dal sistema, nelle regole di riproduzione del logo su supporti non controllabili.
2. **I neutri sono caldi.** Il calore è dosato forte all'estremo chiaro, dove vive la carta, e sottile all'estremo scuro, perché un nero troppo caldo in dark mode sembra un errore di profilo colore.
3. **Il lime è un accento, non un colore di testo.** È un colore ad altissima luminanza: funziona come riempimento e come testo su fondo scuro, mai come testo su fondo chiaro nelle sue varianti chiare.
4. **Light e dark hanno pari dignità.** Ogni scelta va verificata su entrambi i fondi. Nessuna delle due è la modalità "vera".
5. **L'interfaccia parla in neutro.** Il lime interviene per indicare l'azione, il dato in evidenza, l'identità. Se compare ovunque, smette di significare qualcosa.

---

## Scala neutra

| Step | Hex | Ruolo |
|---|---|---|
| 0 | `#FFFEF5` | bianco caldo — stampa, superfici che devono staccare dal 50 |
| 50 | `#FDFCF2` | superficie chiara principale, fondo pagina |
| 100 | `#F7F5EA` | superficie alternata, card |
| 200 | `#EEEADA` | divider, bordi chiari |
| 300 | `#DBD7C7` | bordi marcati, stati disabled |
| 400 | `#ABA79A` | placeholder, icone secondarie |
| 500 | `#767369` | testo secondario — il più chiaro ancora leggibile su fondo cream |
| 600 | `#55534B` | testo secondario marcato |
| 700 | `#45433C` | testo corpo su fondo chiaro |
| 800 | `#2B2926` | superficie dark elevata |
| 900 | `#1B1A17` | superficie dark principale |
| 950 | `#0D0C0A` | fondo dark profondo, testo su cream |

**Contrasti chiave**

| Combinazione | Rapporto | Esito |
|---|---|---|
| `700` su `50` | ≈ 9,7:1 | testo corpo, light |
| `500` su `50` | ≈ 4,8:1 | testo secondario, light — margine minimo |
| `400` su `50` | ≈ 2,5:1 | solo decorativo, mai testo |
| `100` su `900` | ≈ 16:1 | testo corpo, dark |
| `400` su `900` | ≈ 7,2:1 | testo secondario, dark |

---

## Accento lime

| Token | Hex | Ruolo | su `neutral-50` | su `neutral-900` |
|---|---|---|---|---|
| `accent-300` | `#E6FB2D` | hover in dark mode | 1,2:1 | 14,8:1 |
| `accent-400` | `#DDEE1C` | **primario** — il colore del marchio | 1,25:1 | 13,6:1 |
| `accent-500` | `#B4C614` | hover in light mode | 1,8:1 | 9,2:1 |
| `accent-600` | `#8C980B` | bordi, focus ring, testo grande | 3,1:1 | 5,5:1 |
| `accent-800` | `#565D05` | testo corrente su fondo chiaro | 6,9:1 | 2,5:1 |

La scala è volutamente incompleta: cinque valori invece di undici. Il lime è un accento, e l'interfaccia userà per la quasi totalità la palette neutra. Aggiungere gradini intermedi produrrebbe colori indistinguibili e la falsa impressione di avere undici colori brand.

Scendendo, il verde vira all'oliva. Non è un difetto: accanto a neutri caldi è coerenza, e il fondo della scala lime dialoga con il fondo della scala neutra.

---

## Superfici e testo

| | Light | Dark |
|---|---|---|
| Fondo pagina | `neutral-50` | `neutral-900` |
| Superficie elevata, card | `neutral-100` | `neutral-800` |
| Bordo | `neutral-200` | `neutral-700` |
| Bordo marcato | `neutral-300` | `neutral-600` |
| Testo primario | `neutral-800` | `neutral-100` |
| Testo secondario | `neutral-500` | `neutral-400` |
| Testo secondario su superficie elevata | `neutral-600` | `neutral-400` |
| Testo disabilitato | `neutral-400` | `neutral-600` |

Il testo secondario cambia token quando appoggia su una superficie elevata invece che sul fondo pagina: `neutral-500` su `neutral-100` dà 4,34:1 e resta appena sotto soglia, mentre `neutral-600` porta a 6,8:1. È una differenza che si scopre solo costruendo, non leggendo la tabella.

Gli stati disabilitati sono volutamente sotto soglia in entrambe le modalità. Per questo non possono mai essere l'unico veicolo di un'informazione: un controllo disattivato va accompagnato da una spiegazione o da un'etichetta leggibile.

---

## Regole d'uso

**Bottone primario**
Fondo `accent-400`, testo `neutral-950`, in entrambe le modalità. Mai testo bianco: il rapporto sarebbe 1,3:1.
Hover: `accent-500` su fondo chiaro, `accent-300` su fondo scuro.

**Testo in colore brand**
`accent-800` su fondo chiaro, `accent-400` su fondo scuro. Per titoli e testo grande su chiaro è ammesso `accent-600`.

**Focus ring**
`accent-600`. È l'unico gradino ambidestro: 3,1:1 su chiaro e 5,5:1 su scuro, sopra la soglia richiesta ai componenti in entrambi i casi.

**Simbolo del logo**
Su fondo scuro `accent-400`. Su fondo chiaro **`accent-500`**: il 400 su cream sparisce, il 600 è troppo scuro e spegne il marchio. È l'unico caso in cui il 500 non indica uno stato di hover.

**Fondi tenui** (badge, riga selezionata, evidenziazione)
`accent-400` al 12% di opacità per la superficie, al 20% per il suo bordo. Non esistono token dedicati: la trasparenza si adatta a entrambe le modalità senza raddoppiare la palette.

---

## Stati di feedback

Un valore per modalità. I fondi si ricavano con l'opacità, come per l'accento.

| Stato | Light | Dark | su `neutral-50` | su `neutral-900` |
|---|---|---|---|---|
| Errore | `#BF3022` | `#EF6B54` | 5,5:1 | 5,7:1 |
| Warning | `#8A5107` | `#E08A0B` | 6,2:1 | 6,6:1 |
| Successo | `#1C7A4D` | `#3FBF7F` | 5,4:1 | 7,5:1 |

Fondo dell'alert: colore di stato al 12%, bordo al 20%.

**Il successo non è lime.** Un messaggio di conferma in colore brand sembrerebbe una promozione, e l'accento perderebbe il suo significato di azione. Il verde di successo è a 152° di tonalità, ottantaquattro gradi dal lime.

**Il warning in light mode è brunito**, quasi tabacco. È l'unico modo per farlo passare come testo su fondo cream: un ambra brillante non raggiunge la soglia. In alternativa, `#E08A0B` per icona e bordo con il testo in `neutral-800`.

**Non esiste un colore info.** Un blu in mezzo a questi neutri caldi stona. I messaggi informativi restano in neutro, distinti dalla sola icona.

---

## Dati e grafici

La scelta della famiglia dipende dal numero di serie, non dal tipo di grafico.

| Serie | Cosa usare |
|---|---|
| Una | Colore brand: `accent-600` su fondo chiaro, `accent-400` su fondo scuro |
| Due | Brand per il dato principale, `neutral-400` / `neutral-500` per il termine di confronto |
| Tre o più | Famiglia categorica qui sotto |

**Grafico monocromatico.** Il riferimento è sempre il colore brand. Su fondo chiaro va usato `accent-600`, perché `accent-400` su cream dà 1,25:1 ed è invisibile. È il caso più frequente della piattaforma: il risultato della persona contro il benchmark, l'elemento selezionato dentro una lista, la barra di completamento.

**Famiglia categorica**

| # | Tonalità | Light | Dark | su `neutral-50` | su `neutral-900` |
|---|---|---|---|---|---|
| 1 | Petrolio | `#0F7A85` | `#2AA5B0` | 5,1:1 | 5,9:1 |
| 2 | Magenta | `#B0208C` | `#D65FB8` | 5,7:1 | 5,2:1 |
| 3 | Ambra | `#8A5107` | `#E08A0B` | 6,2:1 | 6,6:1 |
| 4 | Viola | `#6A4FA3` | `#9070C0` | 6,1:1 | 4,3:1 |
| 5 | Rosso | `#BF3022` | `#EF6B54` | 5,5:1 | 5,7:1 |
| 6 | Verde | `#1C7A4D` | `#3FBF7F` | 5,4:1 | 7,5:1 |

**L'ordine è funzionale, non estetico.** Le tonalità consecutive distano sempre più di ottanta gradi: chi usa due, tre o quattro serie prende sempre colori lontanissimi. Rosso e ambra, i due più vicini della famiglia, occupano le posizioni 3 e 5 e non si incontrano mai come adiacenti.

**Il lime resta fuori dalla famiglia categorica.** Il suo mestiere è indicare la serie che conta, non essere una serie fra le altre. Neutro per il contesto, lime per il dato in evidenza.

**Rosso, ambra e verde coincidono con gli stati di feedback.** È una scelta: il sistema ha un rosso, un ambra e un verde, non due quasi identici con nomi diversi. Ne consegue una regola da applicare senza eccezioni — **in un grafico il colore identifica una serie e non porta significato**. Una barra rossa non vuol dire "negativo".

**Daltonismo.** Con deuteranopia il verde e l'ambra si avvicinano sensibilmente. La separazione nell'ordine mitiga il problema ma non lo risolve: servono etichette dirette sulle serie o pattern nelle aree. Il significato non si affida mai al solo colore.

---

## Divieti

- Nessun `#FFFFFF` e nessun `#000000` nell'interfaccia.
- Il lime non è mai testo su fondo chiaro sotto `accent-600`.
- Il lime non è mai testo su fondo scuro sopra `accent-600`.
- `accent-300` e `accent-400` non compaiono mai insieme nello stesso grafico: la differenza è percettivamente troppo piccola e legge come errore.
- Mai simulare uno stato hover con l'opacità sul bottone primario: su fondo cream vira al beige, su nero al verde sporco. Usare i token.
- `accent-800` non si riusa in dark mode: il rapporto scende a 2,5:1. È l'errore più frequente quando si condivide un token fra le due modalità.
- Il colore non è mai l'unico portatore di significato: servono sempre etichetta, icona o pattern.
- `accent-400` non si usa mai come linea o area di grafico su fondo chiaro: in un grafico monocromatico su cream il riferimento è `accent-600`.
- I colori della famiglia categorica non si usano fuori dai grafici, e i colori di stato non si usano come serie.

---

## Tipografia — famiglie e pesi

**Geist** per tutto il testo, **Geist Mono** per etichette e dati. Entrambi da Google Fonts, licenza webfont inclusa. Sono disegnati insieme: condividono altezza x e proporzioni, quindi il passaggio dall'uno all'altro non produce salti ottici.

| Peso | Valore | Uso |
|---|---|---|
| Regular | 400 | testo corrente |
| Medium | 500 | bottoni, etichette, intestazioni di tabella, testo di interfaccia |
| Semibold | 600 | titoli |

Caricare solo questi tre pesi. Il file variabile completo pesa molto e su una dashboard incide sul primo rendering.

**Lo stile label.** Geist Mono maiuscolo è l'elemento più caratterizzante del sistema: dice dato, misura, strumento — il territorio di Skill Vision. È definito come **stile applicabile a un ruolo**, non come livello di heading: sovratitoli, etichette di sezione, intestazioni di tabella, nomi delle metriche, tag. Può cadere su un `h3` breve o su un `div`, indifferentemente.

---

## Scala tipografica — sito

Base 16px.

| Ruolo | Desktop | Mobile | Peso | Line-height | Tracking |
|---|---|---|---|---|---|
| Display | 3.5rem / 56px | 2.25rem / 36px | 600 | 1.05 | −0.03em |
| H1 | 2.75rem / 44px | 2rem / 32px | 600 | 1.1 | −0.025em |
| H2 | 2rem / 32px | 1.625rem / 26px | 600 | 1.15 | −0.02em |
| H3 | 1.5rem / 24px | 1.25rem / 20px | 600 | 1.25 | −0.015em |
| H4 | 1.25rem / 20px | 1.125rem / 18px | 500 | 1.3 | −0.01em |
| Body large | 1.125rem / 18px | 1.0625rem / 17px | 400 | 1.6 | 0 |
| Body | 1rem / 16px | 1rem / 16px | 400 | 1.6 | 0 |
| Small | 0.875rem / 14px | — | 400 | 1.5 | 0 |
| Caption | 0.75rem / 12px | — | 400 | 1.4 | 0 |
| Label | 0.75rem / 12px | — | 500 mono | 1.2 | +0.06em |

---

## Scala tipografica — interfaccia

Base 15px. Sotto i 14px scendono solo la caption, riservata all'informazione di contorno (date, contatori, note, legende), e la label, che essendo maiuscola si legge più grande del suo corpo. È una scala diversa perché il compito è diverso: il sito deve convincere in venti secondi, un'interfaccia si legge per ore.

| Ruolo | Dimensione | Peso | Line-height | Tracking |
|---|---|---|---|---|
| Titolo pagina | 1.5rem / 24px | 600 | 1.25 | −0.015em |
| Titolo sezione | 1.125rem / 18px | 600 | 1.3 | −0.01em |
| Sottotitolo | 1rem / 16px | 500 | 1.4 | 0 |
| Body | 0.9375rem / 15px | 400 | 1.5 | 0 |
| Small | 0.875rem / 14px | 400 | 1.45 | 0 |
| Caption | 0.8125rem / 13px | 400 | 1.4 | 0 |
| Label | 0.75rem / 12px | 500 mono | 1.2 | +0.06em |
| Metrica grande | 2rem / 32px | 500 mono | 1.1 | −0.01em |
| Metrica | 1.25rem / 20px | 500 mono | 1.2 | 0 |

---

## Regole tipografiche

- Il tracking negativo sui titoli è una correzione ottica, non uno stile: alle dimensioni display la spaziatura di Geist si allarga e le parole si sfilacciano. Sotto i 20px va lasciato a zero.
- Il testo corrente non scende mai sotto 16px sul sito e 14px sulla dashboard.
- Misura del rigo fra 60 e 75 caratteri sul testo lungo; meno dentro le card della dashboard.
- Label: massimo tre o quattro parole, mai testo che va a capo. Se deve andare a capo non è una label, è un titolo.
- Numeri in colonna sempre in Geist Mono, oppure in Geist con `font-variant-numeric: tabular-nums`. Le cifre proporzionali disallineano le colonne di punteggi.
- I titoli non vanno in colore accento su fondo chiaro. Per l'enfasi cromatica, `accent-800` e solo su parole singole.
- Il maiuscolo esiste solo nello stile label. Non si applica a titoli, bottoni o testo corrente.

---

## Spazio

Base 4px. Il **ritmo** però è 8: sopra i 16px la scala procede solo per multipli di 8, mentre 4 e 12 vivono dentro i componenti, dove l'8 è troppo grosso.

| Token | px | Uso tipico |
|---|---|---|
| 1 | 4 | scarti minimi, distanza icona-testo |
| 2 | 8 | padding interno compatto |
| 3 | 12 | padding di input e bottoni |
| 4 | 16 | padding di card, gap fra elementi |
| 6 | 24 | gutter di griglia, gap fra blocchi |
| 8 | 32 | separazione fra gruppi |
| 12 | 48 | separazione fra sottosezioni |
| 16 | 64 | margini laterali desktop |
| 24 | 96 | separazione fra sezioni |
| 32 | 128 | respiro di apertura, hero |

**La scala è questa, non tutti i multipli di 4.** Dieci valori: fuori da questi non si va. La granularità fine serve a far quadrare i componenti, non a inventare spaziature intermedie.

Nota per il disegno: la distanza percepita fra un titolo e il testo che segue è minore del margine dichiarato, perché l'interlinea aggiunge spazio sopra la prima riga. Un margine di 16 sotto un titolo con interlinea 1.6 legge come 12. Va compensato aumentando il valore, non riducendo l'interlinea.

---

## Griglia e formati

12 colonne, gutter 24px. Margine laterale 64px su desktop, 24px su mobile.

Due misure distinte che convivono: la **cornice** arriva a 1920px, la **colonna di lettura** non supera i 720px. Un contenitore largo non autorizza righe lunghe — la misura del rigo resta fra 60 e 75 caratteri qualunque sia la superficie.

Breakpoint: 640 / 768 / 1024 / 1280 / 1536 / 1920.

**Fuori dallo schermo.** L'identità vale anche per stampa e presentazioni: la scala si ancora al formato, non ai pixel.

| Formato | Superficie | Margine | Griglia |
|---|---|---|---|
| Slide 16:9 | 1920 × 1080 | 96px | 12 colonne, gutter 24px |
| A4 | 210 × 297 mm | 15 mm | 12 colonne, gutter 5 mm |
| Web | fino a 1920 | 64 / 24px | 12 colonne, gutter 24px |

I raggi si convertono in proporzione: `lg` da 24px corrisponde a circa 6 mm su A4, `xl` da 32px a circa 8 mm.

---

## Forme e bordi

**Raggi**

| Token | px | Uso |
|---|---|---|
| xs | 6 | checkbox, tag piccoli |
| sm | 10 | input, bottoni piccoli |
| md | 16 | bottoni, elementi interni |
| lg | 24 | card, pannelli |
| xl | 32 | sezioni, immagini, blocchi grandi |
| full | 9999 | avatar, pill, badge |

**Raggio annidato.** Con angoli morbidi vale una regola che di solito manca e si nota subito: il raggio interno è uguale a quello esterno meno il padding. Una card da 24 con padding 16 contiene elementi da 8, non da 24. Senza questa correzione le curve concentriche si scollano e l'insieme sembra sbagliato senza che si capisca perché.

**Bordi**

1px `neutral-200` in light, `neutral-700` in dark. 2px per gli stati attivi. Focus ring `accent-600` a 2px con offset 2px.

Eccezione: per delimitare una superficie molto chiara — un campione da 0 a 200, una card in `neutral-50` su fondo `neutral-50` — il filetto sale a `neutral-300`, altrimenti sparisce. Vale la regola generale: il bordo deve staccare da entrambi i lati, non solo dal fondo.

**Elevazione senza ombre**

Le superfici si separano per colore e perimetro, non per profondità.

| Livello | Light | Dark |
|---|---|---|
| Fondo | `neutral-50` | `neutral-900` |
| Superficie | `neutral-100` + bordo `neutral-200` | `neutral-800` + bordo `neutral-700` |
| Superficie marcata | `neutral-100` + bordo `neutral-300` | `neutral-800` + bordo `neutral-600` |

**Livelli flottanti.** Dropdown, popover, tooltip e modali sono l'unica eccezione: il solo bordo non basta, un menu aperto sopra il contenuto legge piatto. Si risolve con uno scrim dietro il modale — `neutral-950` al 60% — e con un bordo più marcato sui popover, `neutral-300` in light e `neutral-600` in dark. Nessuna scala di ombre.

---

## Logo

### Versioni

**Lockup esteso** — simbolo e lettering. È la versione principale.
**Solo simbolo** — ammesso in autonomia: avatar, favicon, applicazioni piccole, usi ripetuti dove il marchio è già noto.

Il simbolo non si modifica mai, in nessuna versione.

### Lettering

Il lettering è **Inter**, convertito in tracciati. Non è testo e non si ricompone: si usa sempre il file.

Va tenuto presente che il carattere del marchio e quello dell'interfaccia sono diversi — Inter nel logo, Geist in tutto il resto. Nessun titolo, nessuna intestazione e nessuna riproduzione del nome vanno composti in Geist pensando di essere coerenti con il marchio.

### Costruzione

L'unità `u` corrisponde a un quarto dell'altezza del simbolo. Tutte le misure derivano da lì e scalano da sole.

| Elemento | In moduli |
|---|---|
| Simbolo | 4u × 4u |
| Altezza maiuscola del lettering | 2u |
| Distanza simbolo – lettering | 1u |
| Ingombro del lockup | 21,3u × 4u |

Il lettering è alto il 2,6% in più del valore teorico e il simbolo è largo il 2% più che alto: sono compensazioni ottiche volute, non tolleranze di disegno.

### Area di rispetto

`1u` su tutti i lati, cioè la stessa distanza che separa simbolo e lettering. Sale a `1,5u` quando il logo compare accanto ad altri marchi — partner, certificazioni, loghi di eventi.

### Colore

| Fondo | Lettering | Simbolo |
|---|---|---|
| Scuro | `neutral-0` `#FFFEF5` | `accent-400` `#DDEE1C` |
| Chiaro | `neutral-950` `#0D0C0A` | `accent-500` `#B4C614` |

Su fondo chiaro il simbolo usa il 500 perché il 400 su cream sparisce e il 600 spegne il marchio. È l'unico caso in cui il 500 non indica uno stato di hover.

Su fotografia il logo va solo in versione monocroma, sopra un'area sufficientemente uniforme.

### Contenitore

Quando il marchio ha bisogno di un fondo proprio — badge, avatar, applicazioni su superfici non controllabili — il contenitore è un rettangolo o un quadrato ad angoli morbidi che eredita la scala dei raggi del sistema: `lg` sui formati piccoli, `xl` su quelli grandi. Nessun raggio dedicato.

Margine interno pari all'area di rispetto, `1u`. Fondo `neutral-950` con il logo in versione scura, oppure `neutral-50` con la versione chiara.

### Dimensione minima

Il contrasto fra i due pesi del lettering è di quasi dieci a uno: è la firma del marchio ed è anche il suo punto fragile. Sotto certe dimensioni il tratto di VISION scende sotto il pixel e sbiadisce.

| Larghezza del lockup | Versione |
|---|---|
| ≥ 140px | VISION in ExtraLight |
| 125 – 140px | entrambe ammesse, in caso di dubbio Light |
| 80 – 125px | VISION in Light |
| < 80px | solo simbolo |

Ogni riduzione va comunque verificata sul supporto reale, non calcolata: la resa cambia fra schermo, stampa offset e serigrafia.

### Usi vietati

- Ricomporre il lettering con un font, qualunque esso sia.
- Modificare le proporzioni, ruotare, inclinare, deformare.
- Ricolorare simbolo o lettering fuori dalle due combinazioni ammesse.
- Applicare ombre, contorni, sfumature, effetti.
- Ridurre l'area di rispetto o addossare altri elementi al marchio.
- Usare il lockup esteso sotto la dimensione minima invece del solo simbolo.
- Collocare il logo su fotografia movimentata o su fondi a contrasto insufficiente.

---

## Modulo, immagini e mascherature

### Il modulo

Una cella quadrata con angoli arrotondati, usata come maschera per le immagini o come campitura piena.

- Raggio **proporzionale al lato, 25%** — mai un valore fisso: così una cella da 80px e una da 400px hanno la stessa forma.
- Distanza fra celle dalla scala di spaziatura, `2` o `3`.
- Allineamento alla griglia a 12 colonne.
- Gruppi da tre a sei celle. Le mosaicature fitte frammentano il soggetto e l'insieme somiglia a una schermata di icone.
- Un volto non si spezza mai fra due celle.

### Immagini

Sul progetto non esistono fotografie proprie: il materiale sarà sempre stock o generato. Il trattamento non è quindi una scelta estetica, è ciò che impedisce a immagini di provenienza qualunque di sembrare di provenienza qualunque.

**Monocromo caldo — trattamento di default.** Desaturazione totale e rimappatura fra ombre e luci: `#0D0C0A` → `#FFFCE0` su fondo chiaro, `#1B1A17` → `#FFFEF5` su fondo scuro. Non un bianco e nero neutro, che accanto a neutri caldi legge freddo e fuori sistema.

**Mosaico modulare — momenti brand.** Aperture di sezione, hero, copertine.

Il criterio di scelta: se sull'immagine poggia del testo o l'immagine va letta, monocromo. Se è decorativa, mosaico. Mai i due trattamenti sulla stessa schermata.

### Il colore accento non tocca le fotografie

Nessun duotone in lime, nessuna virata, nessuna sovrapposizione colorata sull'immagine. L'accento può comparire **solo** come forma, tratto o disegno sovrapposto — un elemento grafico distinto, che sta sopra la fotografia senza colorarla.

È coerente con il resto del sistema: il lime segnala, non decora. Steso su una fotografia perderebbe la funzione che ha ovunque.

### Immagini generate: niente volti

Ambienti, oggetti, dettagli, texture astratte: nessun rischio. I volti sì. Un'azienda che vende conoscenza delle persone reali, illustrata con persone che non esistono, ha un problema il giorno in cui qualcuno se ne accorge.

### La via senza fotografie

Il modulo funziona anche vuoto: griglie di campiture piene nei neutri e nel lime, senza alcuna immagine. Costa nulla, non ha rischi di provenienza ed è più riconoscibile di qualsiasi stock trattato. Dove è praticabile, è la prima scelta.

---

## Colore in stampa

Valori convertiti con profilo **FOGRA39L coated** (ISO Coated v2), intento colorimetrico relativo. Sono il punto di partenza per la quadricromia, non un risultato garantito: vanno confrontati con una prova colore.

| Token | Hex | C | M | Y | K |
|---|---|---|---|---|---|
| neutral-0 | `#FFFEF5` | 1 | 0 | 5 | 0 |
| neutral-50 | `#FDFCF2` | 1 | 1 | 5 | 0 |
| cream brand | `#FFFCE0` | 2 | 1 | 16 | 0 |
| neutral-700 | `#45433C` | 71 | 62 | 70 | 54 |
| neutral-900 | `#1B1A17` | 74 | 70 | 58 | 98 |
| neutral-950 | `#0D0C0A` | 80 | 72 | 49 | 100 |
| accent-300 | `#E6FB2D` | 16 | 0 | 93 | 0 |
| accent-400 | `#DDEE1C` | 21 | 0 | 96 | 0 |
| accent-500 | `#B4C614` | 36 | 3 | 97 | 5 |
| accent-600 | `#8C980B` | 35 | 5 | 99 | 33 |
| accent-800 | `#565D05` | 34 | 9 | 100 | 68 |

**Il lime è fuori gamut.** È il dato che conta: riconvertendo i valori CMYK verso lo schermo, l'accento perde fino a 27 punti sulla componente verde e vira verso un giallo più spento. In quadricromia il marchio non sarà mai brillante come a monitor. Dove il colore conta davvero — logo, copertine, materiali di rappresentanza — serve una **tinta piatta**.

**Tinte piatte**

| Uso | Pantone |
|---|---|
| Prima scelta, accento brand | **809 C** — Pastels & Neons |
| Alternativa stabile | **389 C** — Formula Guide Solid |

Il fluorescente è la sola tinta che restituisce davvero l'accento: sul lime nessun colore della Formula Guide arriva alla stessa brillantezza. Ha però due limiti da rispettare.

Costa più di una tinta piatta ordinaria, quindi su tirature grandi o materiali di servizio l'aumento va messo in conto. E **sbiadisce con l'esposizione ai raggi UV**: su brochure, cartelline, inviti e materiali da interno va benissimo, su insegne esterne, vetrofanie o supporti destinati a durare anni no. In quei casi si usa il 389 C.

**Su carta non patinata** le tinte sono **809 U** e **388 U**. Il numero della solid cambia rispetto al coated — 388 invece di 389 — perché su uncoated l'inchiostro viene assorbito e la resa si sposta: si sceglie il numero che somiglia al risultato, non quello che somiglia al nome. Va scritto così nel manuale, altrimenti qualcuno userà 389 U dandolo per scontato.

Per i lime scuri — `accent-800` — non servono tinte piatte: sono colori di testo, che in stampa si fanno in quadricromia.

**Il nero** non si affida a una tinta piatta: si costruisce come nero ricco, con la composizione indicata sopra per `neutral-950`.

**Il cream non è un inchiostro.** Il cream del brand steso in quadricromia su tutta una pagina produce una campitura irregolare e costosa. Si ottiene meglio con la **carta**: una naturale avorio o una uso mano calda restituiscono quel tono senza stampare nulla. È anche più coerente con l'identità.

---

## Token

Valori in esadecimale per leggibilità. Se il progetto adotta Tailwind v4, la conversione in `oklch` è consigliata ma non necessaria.

Le lightness della scala neutra sono allineate a quelle della scala `neutral` di Tailwind: chi sviluppa ritrova comportamenti familiari, cambia solo la temperatura.

```css
@theme {
  --color-neutral-0:   #FFFEF5;
  --color-neutral-50:  #FDFCF2;
  --color-neutral-100: #F7F5EA;
  --color-cream:       #FFFCE0;
  --color-neutral-200: #EEEADA;
  --color-neutral-300: #DBD7C7;
  --color-neutral-400: #ABA79A;
  --color-neutral-500: #767369;
  --color-neutral-600: #55534B;
  --color-neutral-700: #45433C;
  --color-neutral-800: #2B2926;
  --color-neutral-900: #1B1A17;
  --color-neutral-950: #0D0C0A;

  --color-accent-300: #E6FB2D;
  --color-accent-400: #DDEE1C;
  --color-accent-500: #B4C614;
  --color-accent-600: #8C980B;
  --color-accent-800: #565D05;

  /* stati — valore light / valore dark */
  --color-danger:       #BF3022;
  --color-danger-dark:  #EF6B54;
  --color-warning-light: #8A5107;
  --color-warning-dark: #E08A0B;
  --color-success-light: #1C7A4D;
  --color-success-dark: #3FBF7F;

  /* grafici — famiglia categorica */
  --color-chart-1-light: #0F7A85;
  --color-chart-1-dark: #2AA5B0;
  --color-chart-2-light: #B0208C;
  --color-chart-2-dark: #D65FB8;
  --color-chart-3-light: #8A5107;
  --color-chart-3-dark: #E08A0B;
  --color-chart-4-light: #6A4FA3;
  --color-chart-4-dark: #9070C0;
  --color-chart-5-light: #BF3022;
  --color-chart-5-dark: #EF6B54;
  --color-chart-6-light: #1C7A4D;
  --color-chart-6-dark: #3FBF7F;

  --font-sans: "Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  --font-weight-regular:  400;
  --font-weight-medium:   500;
  --font-weight-semibold: 600;

  /* sito */
  --text-display:    3.5rem;
  --text-h1:         2.75rem;
  --text-h2:         2rem;
  --text-h3:         1.5rem;
  --text-h4:         1.25rem;
  --text-body-lg:    1.125rem;
  --text-body:       1rem;
  --text-small:      0.875rem;
  --text-caption:    0.75rem;
  --text-label:      0.75rem;

  /* dashboard */
  --text-app-title:   1.5rem;
  --text-app-section: 1.125rem;
  --text-app-body:    0.9375rem;
  --text-app-small:   0.875rem;
  --text-app-label:   0.75rem;
  --text-metric-lg:   2rem;
  --text-metric:      1.25rem;

  --spacing-1:  4px;
  --spacing-2:  8px;
  --spacing-3:  12px;
  --spacing-4:  16px;
  --spacing-6:  24px;
  --spacing-8:  32px;
  --spacing-12: 48px;
  --spacing-16: 64px;
  --spacing-24: 96px;
  --spacing-32: 128px;

  --radius-xs:   6px;
  --radius-sm:   10px;
  --radius-md:   16px;
  --radius-lg:   24px;
  --radius-xl:   32px;
  --radius-full: 9999px;

  --border-width:        1px;
  --border-width-strong: 2px;

  --container-max:  1920px;
  --measure-max:    720px;
  --grid-columns:   12;
  --grid-gutter:    24px;
}
```

**Mappatura semantica**

```css
:root {
  --background:        var(--color-neutral-50);
  --foreground:        var(--color-neutral-800);
  --card:              var(--color-neutral-100);
  --card-foreground:   var(--color-neutral-800);
  --muted:             var(--color-neutral-200);
  --muted-foreground:  var(--color-neutral-600);
  --primary:           var(--color-accent-400);
  --primary-foreground:var(--color-neutral-950);
  --primary-hover:     var(--color-accent-500);
  --border:            var(--color-neutral-200);
  --input:             var(--color-neutral-300);
  --ring:              var(--color-accent-600);
  --link:              var(--color-accent-800);

  --destructive:       var(--color-danger);
  --warning:           var(--color-warning-light);
  --success:           var(--color-success-light);

  --chart-mono:        var(--color-accent-600);
  --chart-1:           var(--color-chart-1-light);
  --chart-2:           var(--color-chart-2-light);
  --chart-3:           var(--color-chart-3-light);
  --chart-4:           var(--color-chart-4-light);
  --chart-5:           var(--color-chart-5-light);
  --chart-6:           var(--color-chart-6-light);
}

.dark {
  --background:        var(--color-neutral-900);
  --foreground:        var(--color-neutral-100);
  --card:              var(--color-neutral-800);
  --card-foreground:   var(--color-neutral-100);
  --muted:             var(--color-neutral-950);
  --muted-foreground:  var(--color-neutral-400);
  --primary:           var(--color-accent-400);
  --primary-foreground:var(--color-neutral-950);
  --primary-hover:     var(--color-accent-300);
  --border:            var(--color-neutral-700);
  --input:             var(--color-neutral-600);
  --ring:              var(--color-accent-600);
  --link:              var(--color-accent-400);

  --destructive:       var(--color-danger-dark);
  --warning:           var(--color-warning-dark);
  --success:           var(--color-success-dark);

  --chart-mono:        var(--color-accent-400);
  --chart-1:           var(--color-chart-1-dark);
  --chart-2:           var(--color-chart-2-dark);
  --chart-3:           var(--color-chart-3-dark);
  --chart-4:           var(--color-chart-4-dark);
  --chart-5:           var(--color-chart-5-dark);
  --chart-6:           var(--color-chart-6-dark);
}
```

---

## Marchio

### Versioni

**Lockup** — simbolo e lettering affiancati. È la versione principale.
**Simbolo** — usabile da solo, senza modifiche rispetto al lockup.

### Costruzione

L'unità `u` è **un quarto dell'altezza del simbolo**. Tutte le proporzioni derivano da lì, quindi il sistema scala da sé a qualunque dimensione.

| Elemento | In moduli | Misura sul file a 905px |
|---|---|---|
| Simbolo | 4u × 4u | 169,5 × 172,8 |
| Altezza maiuscola del lettering | 2u | 87 |
| Distanza simbolo-lettering | 1u | 43,8 |
| Ingombro totale | 21,3u × 4u | 904,5 × 169,5 |

Il lettering è alto 87 anziché 84,8 e il simbolo è largo 172,8 anziché 169,5: scarti sotto il 3%, compensazioni ottiche volute. Il lettering è centrato verticalmente sull'altezza del simbolo.

### Lettering

Il lettering è in **Inter**, convertito in tracciati. Non è testo e non si ricompone mai: si usa il file.

Va tenuto presente che il carattere del marchio e quello dell'interfaccia — Geist — sono due grotesque geometriche diverse ma simili. Nessuno deve impostare "SkillVision" in Geist credendo di essere coerente, né titoli in Inter.

### Colore

| Fondo | Lettering | Simbolo |
|---|---|---|
| Scuro | `neutral-0` `#FFFEF5` | `accent-400` `#DDEE1C` |
| Chiaro | `neutral-950` `#0D0C0A` | `accent-500` `#B4C614` |

Sul fondo chiaro il simbolo usa il 500 perché il 400 su cream sparisce e il 600 spegne il marchio. È l'unico caso in cui il 500 non indica uno stato di hover.

### Area di rispetto

`1u` su tutti i lati, la stessa distanza che separa simbolo e lettering. `1,5u` quando il marchio compare accanto ad altri loghi — partner, certificazioni, patrocini.

### Dimensioni minime

Il peso del lettering cambia con la dimensione, perché il contrasto fra i due pesi del lockup è di circa 9,6 a 1 ed è la parte fragile del marchio.

**Schermo**

| Larghezza del lockup | Versione |
|---|---|
| ≥ 140px | VISION in ExtraLight |
| 125 – 140px | entrambe accettabili |
| < 125px | VISION in Light |

**Stampa** — soglie diverse, e non convertibili dai pixel: l'inchiostro non ha antialiasing, un tratto sotto la soglia o non stampa o si ingrossa.

| Larghezza del lockup | Versione |
|---|---|
| ≥ 30mm | ExtraLight |
| 20 – 30mm | Light |
| < 20mm | solo simbolo |

### Usi vietati

- Ricomporre il lettering con un carattere qualsiasi, Geist compreso.
- Deformare, ruotare, inclinare.
- Ricolorare fuori dalle due combinazioni ammesse.
- Applicare ombre, contorni, sfumature.
- Collocare il lockup su fotografia senza una campitura piena sotto.
- Usare il lockup sotto la dimensione minima anziché il solo simbolo.
- Racchiudere il marchio in un riquadro quando è già su una superficie propria.

---

## Modulo e immagini

Skill Vision non dispone di fotografie proprie e non ne avrà: le immagini saranno stock o generate. Il trattamento non è quindi una scelta estetica ma il meccanismo che impedisce a materiale di terzi di sembrare materiale di terzi.

### Monocromo caldo — trattamento di default

Desaturazione totale, poi rimappatura dei toni fra due estremi caldi. Non un bianco e nero neutro, che accanto a questi neutri leggerebbe freddo.

| Contesto | Ombre | Luci |
|---|---|---|
| Fondo chiaro | `#0D0C0A` | `#FFFCE0` |
| Fondo scuro | `#1B1A17` | `#FFFEF5` |

### Mosaico modulare — momenti brand

Griglia di celle quadrate mascherate, per aperture di sezione, copertine, superfici decorative.

- Raggio **proporzionale al lato, circa il 25%** — mai un valore fisso in pixel, altrimenti a scale diverse diventano due linguaggi.
- Gutter dalla scala di spaziatura, allineamento alla griglia di pagina.
- Gruppi di tre-sei celle. Le mosaicature fitte frammentano il soggetto e somigliano a una schermata di icone.
- Mai un volto spezzato fra due celle.

**Quale dei due.** Se l'immagine va letta o deve reggere del testo sopra, monocromo. Se è decorativa, mosaico. Non entrambi nella stessa schermata.

### Il colore accento non tocca mai la fotografia

Nessun duotone lime, nessuna virata sull'immagine. L'accento entra solo come elemento sovrapposto: una forma, un disegno, un tratto, un testo di grande dimensione appoggiato sopra. La superficie fotografica resta monocroma.

### Immagini generate

Niente volti. Un'azienda che vende conoscenza delle persone reali, illustrata con persone che non esistono, ha un problema il giorno in cui qualcuno se ne accorge. Ambienti, oggetti, dettagli, texture astratte: tutto ciò che non è un viso è a rischio nullo.

### La terza via

Il modulo usato senza fotografia — celle a campitura piena nei neutri e nell'accento — non richiede materiale di terzi ed è più riconoscibile di qualunque immagine stock trattata.

---

## Componenti

Il sistema non disegna i propri componenti. Si adottano librerie esistenti — **shadcn/ui** per l'interfaccia, i componenti grafici basati su shadcn per la parte dati — e il design system stabilisce le regole che devono rispettare.

La conseguenza è che l'uniformità non si ottiene ridisegnando, ma vincolando: stessi colori, stessa tipografia, stesse forme, qualunque sia la libreria di provenienza.

### Checklist di conformità

Ogni componente adottato va verificato su questi punti prima di entrare in produzione.

**Colore**
- I colori arrivano dai token semantici, mai valori scritti a mano.
- Bottone primario: fondo `accent-400`, testo `neutral-950`. Mai testo bianco.
- Hover: `accent-500` su fondo chiaro, `accent-300` su fondo scuro.
- Focus ring: `accent-600`, 2px, offset 2px.
- Superfici e bordi secondo la tabella delle superfici, nelle due modalità.
- Nessun `#FFFFFF` e nessun `#000000`.

**Tipografia**
- Solo Geist e Geist Mono, solo i pesi 400, 500 e 600.
- Testo di interfaccia dalla scala interfaccia, non da quella del sito.
- Etichette e intestazioni di tabella nello stile label: mono, maiuscolo, tracking positivo, poche parole.
- Colonne numeriche in Geist Mono o con cifre tabulari.

**Forma e spazio**
- Raggi dalla scala: `sm` per input e controlli piccoli, `md` per i bottoni, `lg` per card e pannelli.
- Raggio annidato: interno uguale a esterno meno il padding.
- Spaziature dalla scala, nessun valore intermedio.
- Bordi a 1px, 2px sugli stati attivi.
- **Nessuna ombra.** Le librerie ne portano di default: vanno rimosse. Fanno eccezione i livelli flottanti, che usano scrim e bordo marcato.

**Grafici**
- Serie singola: `chart-mono`, che cambia valore fra le due modalità.
- Due serie: accento più neutro.
- Tre o più: la famiglia categorica, nell'ordine dato.
- Il colore non porta significato e non è mai l'unico portatore di informazione: servono etichette dirette o pattern.

### Cosa non va personalizzato

Comportamento, accessibilità e struttura dei componenti si lasciano come sono. Le librerie gestiscono focus, navigazione da tastiera, ruoli ARIA e stati meglio di quanto convenga rifare. Si interviene sull'aspetto, non sul funzionamento.

---

## Tono di voce

### A chi si parla

Il destinatario primario è **l'imprenditore o l'amministratore di una PMI da 50 a 200 dipendenti**, spesso senza una funzione HR strutturata. È chi approva la spesa e, in molti casi, chi userà lo strumento.

Ma chi legge per primo è quasi sempre un altro: il responsabile del personale, o chi ne fa le veci, che trova lo strumento e lo porta dentro. Da qui la doppia regola:

**Si scrive per chi decide.** Registro della conseguenza aziendale, non del processo HR.

**Ma chi porta lo strumento dentro deve avere qualcosa da inoltrare.** Un numero, un documento, una pagina che regge da sola in una riunione. È il mestiere vero del sito: essere l'argomento che qualcun altro userà per convincere il capo.

### Il principio: ogni affermazione porta la sua prova

È il punto in cui la categoria è più debole e i concorrenti più forti. Dove Skill Vision dice "validazione scientifica", altri dicono quante competenze mappano, con quanti indicatori, in quale fase del processo.

Se un'affermazione non ha un numero, un nome o un riferimento verificabile, si riscrive o si toglie.

| Da evitare | Riscritto |
|---|---|
| Sistema di test con validazione scientifica | Test certificati CUI, sviluppati con un team di neuroscienziati |
| Uno strumento fondamentale | *(togliere: non dice nulla)* |
| Soluzioni innovative per valorizzare il potenziale | Sapere chi hai in azienda, e dove conviene investire |

### Lessico

Il registro si sposta dal processo alla conseguenza.

| Registro HR | Registro da usare |
|---|---|
| valutazione delle competenze | sapere chi hai in azienda |
| piano di sviluppo | dove conviene investire in formazione |
| retention | chi rischi di perdere |
| people analytics | decisioni sul personale prese sui dati |
| assessment certificato | una misura che regge in consiglio |

Parole di casa: competenze, valutazione, confronto, evidenza, ruolo, costo, ritorno, differenza.
Parole bandite: soluzione, innovativo, all'avanguardia, a 360 gradi, valorizzare, potenziale inespresso, sinergia, chiavi in mano.

Niente inglese decorativo. Le parole inglesi si usano solo se sono entrate davvero nell'uso italiano del settore — *onboarding* sì, *skill gap* no, che si dice competenze mancanti.

### Quattro regole di scrittura

1. **Il soggetto è la persona, non il software.** La piattaforma non "valorizza il capitale umano": permette a qualcuno di vedere una cosa che prima non vedeva.
2. **Un'idea per paragrafo.** Frasi brevi, niente subordinate accumulate.
3. **Chiudere sempre con cosa succede dopo.** Un'azione o una conseguenza concreta, mai una promessa aperta.
4. **L'argomento economico non si relega.** Il costo-beneficio per singola risorsa è il contenuto che arriva a chi firma, non un dettaglio tecnico da pagina interna.

### Il tono cambia con il contesto

- **Sito** — espositivo. Vende spiegando, non promettendo.
- **Dashboard** — neutro e strumentale. L'interfaccia non commenta e non si congratula: una valutazione conclusa dice "Valutazione completata", non "Ottimo lavoro!".
- **Errori** — cosa è successo, cosa fare adesso. Nessuna scusa, nessuna colpa all'utente.
- **Stati vuoti** — dire cosa comparirà lì e come farlo comparire.
- **Label mono** — sostantivi, mai frasi. `COMPETENZE`, non `LE TUE COMPETENZE`.

La sobrietà dell'interfaccia è coerente con la scelta cromatica di non usare il verde brand per i messaggi di successo. Il prodotto informa, non applaude.

### Governo dei contenuti

Non è stile, è responsabilità: in un'azienda che vende misurazione, un numero sbagliato costa più di dieci pagine scritte male.

- Nessun numero pubblicato senza fonte e data.
- Nessun claim che dipende da un servizio non ancora operativo, finché il cliente non conferma per iscritto.
- I risultati ottenuti dai clienti sono l'argomento che convince di più: vanno raccolti e verificati prima di scriverli, mai stimati.

---

## Da definire

- **Set di icone** — in stand-by. Quando si sceglierà, dovrà rispettare le specifiche di griglia, tratto e peso ottico definite a parte.
- **Applicazioni** — firma email, biglietto, carta intestata, template slide, social: capitolo successivo.

**Decisioni che spettano al cliente**

- Si dà del **tu** a chi legge o del **voi** all'azienda.
- Quanto esporsi sui numeri reali dei risultati ottenuti.
- Quali servizi sono operativi e citabili senza riserve.
