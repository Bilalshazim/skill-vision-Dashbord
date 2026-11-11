# Resoconto del 10 novembre 2026

Per Alessio e Roberto. Tre parti: **A** i valori della verifica dei punti del 9/11, **B** le correzioni di Roberto
del 10/11, **C** le due stime (importazione Excel dell'Anagrafica, Big Five ideale per posizione), da approvare
prima di costruire.

**Come leggere le righe di verifica.** Ogni riga dice il valore letto a schermo o l'azione con il suo risultato
(CLAUDE.md §9). I valori qui scritti sono **misurati in locale** dall'assistente, sull'account `hr@acme.example` e sui
dati dimostrativi di Acme, che sono gli stessi della demo in produzione. L'assistente non ha l'accesso alla
produzione. Per la Parte A, Bilal ha confermato la prova in produzione dei punti del 9/11; dove ha letto un valore
diverso da quello qui sotto, la riga va corretta. **La Parte B non è ancora provata in produzione**: è pubblicata con
questo rilascio, e la prova con l'accesso la fa Bilal prima di mandare il resoconto.

---

## A · I punti del 9 novembre, con i valori

Nel resoconto del 9/11 i punti sono **13** (M1–M8, B1–B4, C), non 14. Se nel vostro elenco c'è un quattordicesimo
punto, ditemi quale: qui non risulta.

| # | Punto | Valore misurato in locale |
|---|---|---|
| M1 | Confronto interno sulla posizione attiva | 12 candidati, tutti di «Senior Frontend Engineer»; confronto con un talento interno riuscito. Metodo: non aperto (serve l'account dello staff). |
| M2 | Esc nel confronto CV / profilo | Un solo Esc chiude la finestra (prima il primo Esc chiudeva solo il suggerimento di «Rimuovi»). |
| M3 | Niente scorrimento orizzontale | 0px di scorrimento su 9 pagine fra 370 e 390px e fra 1024 e 1920px (9/11); di nuovo 0px a 390px su Il valore, Il potenziale, Chi cerchiamo? e Intervista (10/11). |
| M4 | Avvisi dei grafici in console | **Non era completo.** Il 9/11: 0 errori su 8 pagine con grafici. Il 10/11: 338 errori «width negativa» su Le perdite invisibili e 332 in Panoramica, dalle barre impilate. Corretto: ora 0 su tutte e due. |
| M5 | Home di Recruiting | Tre card alte uguali, 226px, all'altezza del contenuto. |
| M6 | Mini grafici e L'impatto | Il valore: copertura mansioni 93% nel Ring, L'impatto «€ 578.249 · potenziale, non perdita in corso · stima». Tre riquadri con il mini grafico su tutte e quattro le pagine. |
| M7 | Bilancio dimostrativo | «Bilancio caricato il 05/11/2026», file «Bilancio dimostrativo (cifre inventate)»; € 578.249 in Il valore. |
| M8 | CV e link al test | CV di prova caricato sulla posizione demo e in classifica. Link al test per Luca Ferrante a `prova.invio@example.com`: stato «Link pronto»; in locale l'email non parte (manca `RESEND_API_KEY`), si apre l'invio manuale. |
| B1 | Il valore · La situazione oggi | Gauge 80%, 360 × 274px e centrato (300 × 229px a 390px); nessuna frase. «Vedi per mansione» chiuso all'apertura; aperto, 14 mansioni da 63% a 105%. |
| B2 | Il valore · Criticità e opportunità | Coordinatore tecnico 63% (−37%); Area tecnica 73% (−27%); 4 persone oltre le attese: Andrea Costa 106%, Francesca Gallo 105%, Davide Longo 105%. |
| B3 | Intervista | Vedi sotto, «Le sottodomande saltate». |
| B4 | Competenze trasversali e menu | Atteso «7.25» → «7,3», «12» → «10,0», suggerimento «8,0». Risultati: 5 candidati, primo Marta Bellini 8,5/10, ultima Irene Fabbri 5,4/10. |
| C | Candidature dal link | Invio vuoto: 4 errori («Scrivi nome e cognome», «Scrivi un indirizzo email valido», «Allega il CV», «Serve il consenso»). File EICAR: rifiutato, nessun file salvato. PDF vero: «Candidatura inviata», Giulia Prova in Ranking; sul server consenso esplicito, 6 mesi, scadenza 09/05/2027. |

### Le sottodomande saltate (Intervista)

Si passa da una domanda all'altra senza rispondere: il percorso non ha controlli che fermino. Le domande senza
risposta non contano.

- Con le cinque risposte del demo: indice 6,0; la riga «Calcolato su…» non c'è (dal 10/11, come chiede la decisione
  del 9/11).
- Domanda 1 saltata (9/11): 5,8, «Calcolato su 4 domande su 5». Calcolo a mano: (0,25 × 5 + 0,25 × 6,5 + 0,1 × 4 +
  0,1 × 7,5) ÷ 0,7 = 5,75.
- Domanda 2 saltata (10/11): 6,3, «Calcolato su 4 domande su 5», «Senza risposta» sulla domanda; dopo il ricaricamento
  della pagina la riga è ancora lì. Calcolo a mano: (0,3 × 6,5 + 0,25 × 6,5 + 0,1 × 4 + 0,1 × 7,5) ÷ 0,75 = 6,3.
- Dopo ogni prova l'intervista del demo è stata rimessa com'era.

### Il gap medio: la formula

- **Gauge, valore espresso**: somma dei valori rilevati ÷ somma dei valori attesi, su tutte le persone valutate
  dell'azienda (la formula di Roberto del 5/11). Sui dati demo: **80%**.
- **Gap medio**: la media dei gap delle singole persone (valore espresso della persona − 100), come va al ROI. Sui dati
  demo: **−20%**.
- Sui dati demo i due numeri tornano (80 − 100 = −20), ma **solo dopo l'arrotondamento**: i calcoli sono diversi (somme
  su tutta l'azienda contro media delle persone). Con altri dati possono differire di qualche punto. A schermo il gap
  medio è sempre la media delle persone, come chiesto.

---

## B · Le correzioni del 10 novembre

Pronte in locale; **in produzione da provare** (Bilal).

### B1. Un verde per sezione
Nelle quattro pagine dei risultati di Assessment, in chiaro e in scuro, nessun colore nuovo:
- **sezione 1**: il valore che conta (il Gauge ne Il valore);
- **sezione 2**: verde solo il mini grafico del primo riquadro, gli altri in inchiostro;
- **sezione 3**: il Ring della pagina (nel Potenziale i pallini);
- **la barra sotto il mouse**: verde in ogni Bar Chart della pagina.

**Valori misurati in locale:**
- **Il valore, in chiaro**: arco del Gauge #8C980B (`accent-600`); mini grafico del primo riquadro #DDEE1C
  (`accent-400`) con bordo #2B2926 (`neutral-800`); secondo e terzo riquadro in inchiostro #2B2926.
- **Il valore, in scuro**: arco #DDEE1C (`accent-400`); primo riquadro #DDEE1C; gli altri #ABA79A (`neutral-400`).
- **Barra sotto il mouse** in «Vedi per mansione»: diventa #DDEE1C con il bordo, in chiaro e in scuro; le altre restano
  in inchiostro.
- **Le perdite invisibili e Dove intervenire**: primo riquadro #DDEE1C, secondo e terzo #2B2926; Ring dell'Impatto
  #8C980B.
- **Il potenziale**: primo riquadro #DDEE1C; pallini dell'Impatto #DDEE1C.

### B2. «Perché è importante per la tua azienda?» come titolo e sottotitolo
Fuori dal riquadro, in tutte e sette le pagine dei risultati. I testi non cambiano.
**Valori misurati in locale:** su tutte e sette (quattro di Assessment, tre di Recruiting) titolo 32px/600, testo
20px/400 con interlinea 30px, nessuna card attorno. Titolo della pagina 44px. A 390px: 24px e 18px, titolo della pagina
32px, nessuno scorrimento. Le fondamenta dicono 26px su mobile, ma la scala del tema ha solo i valori desktop e scende
di un gradino: è in DECISIONI.

### B3. Il valore · Gap medio
Sotto il Gauge, al posto di «−20% dall'atteso»: «Gap medio» in stile label, il valore in grande, ⓘ con «La distanza
media dal valore atteso, su tutte le persone valutate: chi lo supera compensa chi resta sotto.»
**Valore misurato in locale:** Gauge 80%, sotto «GAP MEDIO −20%». La pagina mostra così i tre dati che vanno al ROI:
valore espresso 80%, gap medio −20%, copertura mansioni 93%.

### B4. Panoramica senza «e cosa fare lunedì»
L'unico punto era il titolo della Sintesi, che ora è «Dove l'azienda perde valore».
**Valore misurato in locale:** «lunedì» non compare in nessun testo della Panoramica; nel codice non ne resta nessuno.
Caricamento della Panoramica: 2,1 secondi in locale.

### B5. Anagrafica nel menu
**Valore misurato in locale:** l'ordine del menu è Panoramica · Intervista · Anagrafica · Area Valutazioni.

### B6. Il bilancio dentro l'Intervista
Il caricamento era già nell'Intervista, ma in fondo ai Dati aziendali. Ora è la prima cosa della sezione: lo stato,
il nome del file e il pulsante per caricarlo o sostituirlo. Il link «Vai al bilancio» non c'è più. Accetta lo stesso
file Credit Save del motore ROI (.xlsx, .xls, .csv) e lo legge nello stesso modo.
**Valore misurato in locale:** in cima a Dati aziendali «BILANCIO CARICATO IL 05/11/2026», il file «Bilancio
dimostrativo (cifre inventate)» e il pulsante «Sostituisci il bilancio».

### B7. Antivirus: il motore, fail-closed
Collegato ClamAV nel punto già predisposto, senza librerie in più. Con il motore spento, irraggiungibile, lento oltre
15 secondi o con una risposta che non si capisce, il file si rifiuta e non si salva niente.
**Valori misurati:**
- 9 test automatici su un ClamAV simulato: file pulito accettato; infetto rifiutato; motore irraggiungibile, muto o
  con una risposta errata rifiutato; senza motore rifiutato. EICAR si ferma prima del motore.
- In locale, senza motore, il modulo pubblico risponde: «Il controllo antivirus non è disponibile in questo momento:
  il CV non è stato salvato. Riprova più tardi.»

**Da fare su Railway, prima della prova:** aggiungere un servizio ClamAV e la variabile `CLAMAV_HOST` sul backend.
Finché non c'è, il modulo di candidatura della demo **rifiuta tutti i CV**. Per tenere la demo aperta senza motore
c'è `ANTIVIRUS_ALLOW_BASIC=true`: vale solo per le società demo e lascia il solo controllo di base. Una società vera
non passa mai senza motore.

---

## C · Le stime (da approvare, non costruite)

### C1. Importazione dell'Anagrafica da Excel · **23–33 ore**

**Cosa c'è oggi.** Nell'Anagrafica non c'è nessuna importazione: le persone si inseriscono una alla volta. In
Recruiting c'è un pulsante «Carica Excel dipendenti» che rimanda alla vecchia piattaforma e non funziona in quella
nuova. La libreria per leggere e scrivere Excel è già nel progetto (la usa il caricamento del bilancio).

**Dove finiscono i dati.** Assessment **non salva più nel browser**: le persone stanno sul server, una riga per
persona, ognuna con il suo identificativo. Il browser serve solo a portare sul server, una volta, i dati vecchi. Per
l'importazione quindi nessun effetto sul browser: tutto va al server. La frase di CLAUDE.md «Assessment oggi salva
nel browser» è da aggiornare.

| Parte | Ore |
|---|---|
| «Scarica il modello»: .xlsx generato dai campi dell'Anagrafica (una colonna per campo, nomi in italiano) e un foglio di istruzioni con formato e obbligatorietà di ogni campo | 3–4 |
| Lettura del file e controlli riga per riga: campi obbligatori, email, tipo di contratto, sesso, RAL numerica, date | 5–7 |
| Anteprima prima di salvare: quante persone entrano, quante si aggiornano, gli errori riga per riga (riga, campo, problema) | 4–6 |
| Persone già presenti: riconoscimento e scelta fra aggiornare e aggiungere | 3–4 |
| Salvataggio tutto insieme sul server: o entrano tutte o nessuna, niente salvataggio a metà | 4–6 |
| Permessi (la RAL solo per gli amministratori), prove, verifica in demo e in produzione | 4–6 |

**La chiave per le persone già presenti.** La proposta: l'**email**, se c'è. Senza email, nome + cognome + mansione,
segnalati nell'anteprima come «probabile doppione» e non aggiornati da soli. Una persona trovata si aggiorna nei
campi del file e tiene le valutazioni; una non trovata si aggiunge. Da decidere con Roberto se l'importazione può
anche archiviare chi non è più nel file: nella stima non c'è.

### C2. Big Five ideale per posizione · **18–27 ore**

**Oggi.** Il calcolo usa sempre il profilo di «Sales Account Manager» (`roles-seed.json`), qualunque sia la
posizione, in due posti: nel browser (classifiche, Risultati, Imbuto, Metodo, scheda del candidato) e sul server
(il punteggio salvato al match del CV).

**La proposta.** Nella pagina Competenze trasversali, per la posizione attiva: si parte da uno degli otto profili già
pronti e i cinque valori si possono modificare. Si salva con le altre scelte della posizione, nello stesso posto.

| Parte | Ore |
|---|---|
| Salvataggio del profilo per posizione, accanto a competenze e attesi | 2–3 |
| Pagina: scelta del profilo di partenza e i cinque valori modificabili | 4–6 |
| Calcolo nel browser: ogni pagina che usa il profilo legge quello della posizione | 4–6 |
| Calcolo sul server: il punteggio salvato usa il profilo della posizione | 3–5 |
| Ricalcolo dei punteggi già salvati e prove | 3–4 |
| Verifica in demo e in produzione | 2–3 |

**Cosa cambia nei punteggi già calcolati.**
- Il Big Five pesa il **30%** del punteggio del candidato: il punteggio è 0,55 × competenze trasversali + 0,30 ×
  affinità Big Five + 0,15 × match del CV.
- Sui 5 candidati della demo con il test, l'affinità oggi va da 96,8 a 97,6. Con gli altri sette profili scende fino
  a 86,6 (Customer Care Specialist).
- Il punteggio finale cambia al massimo di **3,1 punti su 100 (0,3 su 10)**. In una classifica stretta basta per
  scambiare due candidati o spostarne uno di fascia.
- Il segnale rosso non cambia: dipende solo dalle competenze trasversali essenziali.
- I punteggi già salvati sul server restano quelli vecchi finché non si ricalcolano: per questo il ricalcolo è nella
  stima.

---

## Cosa resta

- **Prova in produzione della Parte B** con l'accesso: Bilal.
- **ClamAV su Railway** (`CLAMAV_HOST`), oppure `ANTIVIRUS_ALLOW_BASIC=true` per la sola demo. Senza, il modulo di
  candidatura della demo rifiuta i CV.
- **Le due stime** da approvare.
- **In attesa di Roberto**, come scritto in CLAUDE.md: la card degli euro senza bilancio, peso e soglia delle
  Competenze trasversali, e l'Area valutazioni.

---

## D · Una sola fonte per società e posizioni (proposta, da decidere)

**Che cosa si è visto in produzione.** In Assessment la società è «Acme Corp»; in Recruiting il selettore «Società»
mostrava «EMEXxxxC S.p.A.» e «Northwind Ops», con la campagna «Sales Account Manager». Non è un errore del codice: è la
società demo di Recruiting, rinominata con la matita in Profilo della ricerca. Le due schede leggono la società da due
posti diversi.

- **Assessment** legge la società dell'account, sul server.
- **Recruiting** usa un suo elenco di società e posizioni, salvato nei suoi dati e collegato al server per nome.

Per la demo, Bilal ha già rimesso a mano i nomi con la matita: «Acme Corp» e «Senior Frontend Engineer».

**La proposta: una sola fonte, il server.**
- **Un solo elenco.** Società, campagne e la posizione attiva arrivano dal server per tutte e due le schede.
- **Rinomine condivise.** Una rinomina vale ovunque.
- **Posizioni legate per identificativo.** Le posizioni di Recruiting si collegano alla campagna per identificativo,
  non per nome.
- **Migrazione una tantum dei dati di oggi.** Prima un'anteprima a secco di ogni azione, poi l'applicazione con
  registro e un modo per tornare indietro. Si prova su una copia dei dati di produzione prima della produzione.

**Stima: 30–45 ore**, circa metà per la migrazione e la sua prova.

**Da decidere con Roberto, prima di cominciare:**

1. **Società che non sono clienti.** Northwind Ops esiste solo nei dati di Recruiting. Diventa una società vera sul
   server, o si toglie?
2. **Holding.** Il selettore mostra solo le società, o anche il gruppo (struttura gruppo → società)?
3. **Chi può rinominare.** Con il nome del server, una rinomina cambia per tutti, Assessment compreso. Solo gli
   amministratori?
4. **Quando.** Ora, con i dati di EMEXxxxC, o dopo il login nuovo (Fase 8), che deve arrivare prima dei dati reali in
   produzione?

Fino alla decisione non si tocca niente: tocca il salvataggio dei dati (CLAUDE.md §5).
