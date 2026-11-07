# Resoconto delle Decisioni del 2026-11-06

Per Alessio e Roberto. Scritto il 2026-11-07.

**Stato: pubblicato il 2026-11-07 (commit `d900f5e`), ma nessuno dei 14 punti è stato provato in produzione con l'accesso.** Senza le credenziali di produzione si è potuto controllare solo che l'applicazione sia online, che serva questa versione e che la pagina nuova, senza accesso, porti al login. Secondo CLAUDE.md §9 nessun punto è ancora «fatto»: la prova va fatta con un account di produzione. Sotto si legge «Pronto in locale» e, per ogni punto, la prova fatta davvero.

I link portano alla produzione e chiedono l'accesso.

Le prove in locale sono fatte nel browser con `hr@acme.example`, sui dati di prova di Acme. Sui dati veri non è provato niente.

| # | Punto | Stato | In produzione |
|---|---|---|---|
| 1 | Dati dimostrativi e accesso | Pronto in locale | Non verificato |
| 2 | Atteso del ruolo cercato | Pronto in locale | Non verificato |
| 3 | Dove intervenire: la percentuale | Pronto in locale | Non verificato |
| 4 | Etichette, titoli e «Perché è importante» | Pronto in locale | Non verificato |
| 5 | Il valore | Pronto in locale, sezione 2 da approvare | Non verificato |
| 6 | Le perdite invisibili e Il potenziale | Pronto in locale | Non verificato |
| 7 | Intervista e Dati aziendali | Pronto in locale, un limite | Non verificato |
| 8 | Panoramica | Pronto in locale, tempi non misurati in produzione | Non verificato |
| 9 | Grafici aggregati | Pronto in locale | Non verificato |
| 10 | Home di Recruiting | Pronto in locale | Non verificato |
| 11 | Chi cerchiamo? e Competenze trasversali | Pronto in locale | Non verificato |
| 12 | Posizione attiva | **In parte**: restano Metodo e Confronto interno | Non verificato |
| 13 | Chi è più adatto? e Chi scegliamo? | Pronto in locale | Non verificato |
| 14 | Menu di Recruiting | Pronto in locale, ruolo valutatore non provato | Non verificato |

**Da controllare subito, Alessio:** il tuo elenco dei 14 punti non è nel repository. La numerazione qui sopra è ricostruita dalle Decisioni del 2026-11-06 e dalle istruzioni delle Parti A e B: se la tua è diversa, va riallineata.

---

## Assessment

### 1. Dati dimostrativi e accesso
**Pronto in locale.** I dati si caricano da soli sulla posizione «Senior Frontend Engineer» di Acme, senza premere pulsanti e senza toccare il seed. «Dati dimostrativi» è in Amministrazione nei due moduli, solo per gli account demo.
**Link:** [Dati dimostrativi](https://skill-vision-production-6a42.up.railway.app/recruiting/admin/dati-dimostrativi)
**Verifica in produzione:** non fatta: pubblicato, manca l'accesso.
**Prova in locale:** con `hr@acme.example`, 12 candidati, 5 test, 3 colloqui, imbuto 12 · 9 · 7 · 3 · 1; la voce c'è. Con `recruiter@acme.example` la voce non c'è.

### 2. Atteso del ruolo cercato
**Pronto in locale.** L'atteso è quello del ruolo cercato, non del ruolo attuale della persona.
**Link:** [Confronto](https://skill-vision-production-6a42.up.railway.app/assessment/confronto)
**Verifica in produzione:** non fatta: pubblicato, manca l'accesso.
**Prova in locale:** su Coordinatore amministrativo, Federico Longo 90%, Davide Longo 95%, Francesca Gallo 98%. Prima Federico e Davide davano tutti e due 95%.

### 3. Dove intervenire: la percentuale
**Pronto in locale.** L'impatto usa lo stesso numero della frase. Testi di CLAUDE.md.
**Link:** [Dove intervenire](https://skill-vision-production-6a42.up.railway.app/assessment/dove-intervenire)
**Verifica in produzione:** non fatta: pubblicato, manca l'accesso.
**Prova in locale:** con i dati locali, 11 persone su 25 = 44%, nella frase e nell'impatto. Il 10 su 23 = 43% della richiesta non è riprodotto: i dati locali sono diversi.

### 4. Etichette, titoli e «Perché è importante»
**Pronto in locale.** Sopra il titolo «01 · Rendimento» e le altre etichette; titoli di sezione a 24px/600 con il numero in grigio, in tutte e sette le pagine; i quattro testi definitivi.
**Link:** [Il valore](https://skill-vision-production-6a42.up.railway.app/assessment/il-valore) · [Le perdite invisibili](https://skill-vision-production-6a42.up.railway.app/assessment/perdite-invisibili) · [Il potenziale](https://skill-vision-production-6a42.up.railway.app/assessment/potenziale) · [Dove intervenire](https://skill-vision-production-6a42.up.railway.app/assessment/dove-intervenire)
**Verifica in produzione:** non fatta: pubblicato, manca l'accesso.
**Prova in locale:** corpo e peso misurati nel browser. Queste pagine di Assessment sono state provate in modalità scura; la chiara non è provata.

### 5. Il valore
**Pronto in locale.** Due sezioni. Nella prima: Gauge e barre delle persone sulla stessa riga, sotto Ring e L'impatto. Via «Cosa ti suggeriamo di fare» e gli Approfondimenti.
**Link:** [Il valore](https://skill-vision-production-6a42.up.railway.app/assessment/il-valore)
**Verifica in produzione:** non fatta: pubblicato, manca l'accesso.
**Prova in locale:** pagina aperta, disposizione e frase controllate; a 390px nessuno scorrimento laterale.
**Da approvare, Roberto:** CLAUDE.md non dice cosa va nella sezione 2. Restano i tre riquadri proposti il 5 novembre, e due ripetono numeri già scritti nella frase sopra.

### 6. Le perdite invisibili e Il potenziale
**Pronto in locale.** Le perdite: ottenuto, atteso 7,0 tratteggiato e scarto in fondo alla barra. In tutte e due via «Cosa ti suggeriamo di fare» e gli Approfondimenti.
**Link:** [Le perdite invisibili](https://skill-vision-production-6a42.up.railway.app/assessment/perdite-invisibili) · [Il potenziale](https://skill-vision-production-6a42.up.railway.app/assessment/potenziale)
**Verifica in produzione:** non fatta: pubblicato, manca l'accesso.
**Prova in locale:** misurate le posizioni nel browser: nelle Perdite nessuno dei 6 scarti tocca il segno tratteggiato (si sovrapponevano, corretto il 7 novembre).

### 7. Intervista e Dati aziendali
**Pronto in locale, con un limite.** Si passa avanti senza rispondere; le domande vuote risultano «senza risposta» nel riepilogo. Dati aziendali è la prima sezione dell'Intervista, la voce è uscita dal menu, i vecchi link portano lì.
**Link:** [Intervista](https://skill-vision-production-6a42.up.railway.app/assessment/analisi)
**Verifica in produzione:** non fatta: pubblicato, manca l'accesso.
**Prova in locale:** avanzamento su domande vuote senza errori; link «Vai a Dati aziendali» e `/assessment/company` provati. Il riepilogo è provato con una risposta simulata del server: **il salvataggio vero di un'intervista con domande saltate non è provato**.
**Da decidere, Roberto:** il punteggio in cima al report conta anche le domande saltate, con il valore di partenza. Toglierle dalla formula è una scelta di metodo.

### 8. Panoramica
**Pronto in locale, tempi da misurare.** Senza bilancio gli euro dicono «In attesa dei dati di bilancio». Una sola chiamata alla società invece di tre, e il codice della pagina parte prima dei dati.
**Link:** [Panoramica](https://skill-vision-production-6a42.up.railway.app/assessment/panoramica)
**Verifica in produzione:** non fatta: pubblicato, manca l'accesso. **I 5 secondi si misurano solo lì.**
**Prova in locale:** su build di produzione in locale, da 1564ms (una prova) a 804–1111ms (tre prove). Non dimostra quanto si guadagna in produzione.

### 9. Grafici aggregati
**Pronto in locale.** «Punteggio medio per cluster» e «Profilo Big Five aggregato»: barre orizzontali con l'ottenuto, l'atteso tratteggiato, lo scarto scritto («−1,0») e in lime il valore più lontano dall'atteso.
**Link:** [Valutazioni Soft Skill](https://skill-vision-production-6a42.up.railway.app/assessment/soft)
**Verifica in produzione:** non fatta: pubblicato, manca l'accesso.
**Prova in locale:** una sola barra lime per grafico; nessuno scarto tocca il segno dell'atteso (5 su 5 nei due grafici); al passaggio del mouse i valori con un decimale. Il passaggio del mouse mostrava i nomi interni («ott», «__highlight») su tutti i grafici a barre e dell'andamento: corretto.

---

## Recruiting

### 10. Home di Recruiting
**Pronto in locale.** Resta la riga Società · Campagna · CIP. Tolto il blocco con il titolo. Tre card grandi e verticali, a tutta altezza, con il contenuto di oggi.
**Link:** [Profilo della ricerca](https://skill-vision-production-6a42.up.railway.app/recruiting/profile)
**Verifica in produzione:** non fatta: pubblicato, manca l'accesso.
**Prova in locale:** chiaro, scuro e 390px, tre card, nessun testo tagliato.

### 11. Chi cerchiamo? e Competenze trasversali
**Pronto in locale.** Sezioni: Profilatura candidato, Competenze trasversali analitiche, Candidature, L'impatto. Pagina nuova con le 35 competenze, il peso e il valore atteso da 1 a 10. La scelta è uscita dal Profilo candidato.
**Link:** [Chi cerchiamo?](https://skill-vision-production-6a42.up.railway.app/recruiting/chi-cerchiamo) · [Competenze trasversali](https://skill-vision-production-6a42.up.railway.app/recruiting/competenze-trasversali)
**Verifica in produzione:** non fatta: pubblicato, manca l'accesso.
**Prova in locale:** 35 righe, 12 scelte (6 · 4 · 2). Atteso 10 su Comunicazione: il punteggio di Marta Bellini passa da 9,8 a 9,7, resta dopo aver ricaricato; poi tolto.
**Scelta da confermare:** un valore atteso scritto cambia i punteggi; senza valore vale la soglia del peso, come prima.

### 12. Posizione attiva
**In parte.** Ogni posizione ha le sue competenze e il suo profilo; la posizione resta quando si naviga.
**Non fatto:**
- **Metodo** scrive ancora nell'esempio «ruolo Sales Account Manager», e **Confronto interno** legge l'archivio. Sono da portare sulla posizione attiva.
- Il **Big Five ideale e il benchmark** restano unici per tutte le posizioni: per ogni posizione servirebbe una schermata che oggi non c'è. Da decidere se serve.
- I dati salvati in passato sotto «Sales Account Manager» restano nel sistema ma non si vedono.

**Link:** [Profilo della ricerca](https://skill-vision-production-6a42.up.railway.app/recruiting/profile)
**Verifica in produzione:** non fatta: pubblicato, manca l'accesso.
**Prova in locale:** scelta Northwind Ops · Customer Care Specialist, aperte 15 pagine ricaricando ogni volta: sempre quella posizione e nessun salvataggio che la sovrascrive; Competenze a 0 scelte; tornando su Acme, 12 scelte. Il 7 novembre questa prova ha trovato un difetto: a ogni caricamento la posizione tornava su Senior Frontend Engineer. Corretto.

### 13. Chi è più adatto? e Chi scegliamo?
**Pronto in locale.**
- **Chi è più adatto?**: Ranking, Risultati, Vai ai migliori candidati, L'impatto, Cosa ti suggeriamo di fare.
- **Chi scegliamo?**: Colloqui, Valutazioni, Candidati al podio, L'impatto, Cosa ti suggeriamo di fare con il link al Report finale.

**Link:** [Chi è più adatto?](https://skill-vision-production-6a42.up.railway.app/recruiting/chi-e-piu-adatto) · [Ranking](https://skill-vision-production-6a42.up.railway.app/recruiting/pagina-a) · [Migliori candidati](https://skill-vision-production-6a42.up.railway.app/recruiting/ranking) · [Chi scegliamo?](https://skill-vision-production-6a42.up.railway.app/recruiting/chi-scegliamo)
**Verifica in produzione:** non fatta: pubblicato, manca l'accesso.
**Prova in locale:** match in % dal più alto (76, 74, 72, 69, 61, 58, 52); spuntando un nome il pulsante diventa «Invia link test (1)»; a 390px non esce più dallo schermo; podio con punti di forza e rischi.
**Non provato:** l'apertura di un CV vero. I candidati dimostrativi non hanno il file, e il clic sul nome dice «Nessun CV caricato per questo candidato». **L'invio vero del link** non è stato fatto.
**Difetto noto:** per chiudere il dialogo del match con Esc servono due pressioni. La causa non è stata cercata.
**Euro:** in Recruiting restano «€ [—] · In attesa della formula», perché cosa si stima lo decide Roberto.

### 14. Menu di Recruiting
**Pronto in locale.** Come scritto da Roberto. Il livello 4 non c'è più, Imbuto di selezione compare una volta, è aperto un livello alla volta.
**Link:** [Recruiting](https://skill-vision-production-6a42.up.railway.app/recruiting/profile)
**Verifica in produzione:** non fatta: pubblicato, manca l'accesso.
**Prova in locale:** con `hr@` e `recruiter@`: voci giuste, un livello aperto, la freccia ne apre un altro. **Il menu del valutatore non è provato**: manca un account valutatore in locale.
**Da leggere, Roberto (già pubblicato):** «Classifica dopo il test» **non è la stessa pagina** di Migliori candidati: mostra l'elenco della selezione con i test, non la classifica. La voce è uscita dal menu come chiesto, e la pagina resta raggiungibile solo dal suo indirizzo (`/recruiting/classifica-test`). Se serve ancora, va rimessa da qualche parte.

---

## Controlli

| Controllo | Esito |
|---|---|
| Typecheck, build | Senza errori |
| Lint | 0 errori, avvisi già presenti |
| Test | 6 su 6: solo il modulo ROI. Non coprono le pagine di questo resoconto |
| Audit d'identità | Nessun difetto |
| Larghezza 390px | Nessuno scorrimento laterale nelle pagine. Con la barra di scorrimento di un browser desktop restano 6px, dalla barra superiore del guscio |
| Console del browser | Nei grafici a barre Bklit scrive errori di larghezza negativa mentre disegna. Già presenti, a schermo non si vedono. Non corretti |

---

## Le tre domande

### 1. Gap medio e Gap di adeguatezza sono la stessa cosa?
**No come calcolo, sì per ora come numero.**

- **Gap di adeguatezza** = valore espresso dell'azienda − 100. Il valore usa la formula di Roberto sulle somme di tutti.
- **Gap medio** = la media dei gap delle singole persone.

Con i dati di prova coincidono (−20% e −20%), quindi il Gap medio oggi non compare. Se diventassero diversi, comparirebbe sotto il Gauge. Il motore ROI usa il Gap medio.

**Da decidere, Roberto:** il motore conosce anche un «gap medio sotto soglia», che conta solo chi è sotto l'atteso. In quel caso chi supera l'atteso non compensa più chi resta sotto, e gli euro salgono. Raccomandazione: tenere la media semplice finché non lo confermi.

### 2. Dove stanno i dati dimostrativi e chi li vede?
**Dove:** sulla posizione «Senior Frontend Engineer» di Acme, nei dati di Recruiting di quella società sul server. Si creano dall'applicazione al primo ingresso, **non dal seed**. Se una posizione ha candidati veri, non vengono toccati.

**Chi li vede:**
- I dati: chi lavora sulla società demo, con l'applicazione in modalità demo. Nessun'altra società.
- Gli strumenti (Amministrazione → Dati dimostrativi): solo gli account demo.
- Le pagine lo dichiarano: «Dati dimostrativi».

**Non verificato in produzione, dove questi dati compaiono solo se la modalità demo è attiva.** `hr@acme.example` nasce solo dal seed, che in produzione è rifiutato, quindi lì l'account è `demo@skill-vision.it`. Non ho potuto controllare che esista, né quali variabili demo sono attive su Railway.

**Prima del primo cliente reale** `VITE_DEMO_MODE` va tolta da Railway (CLAUDE.md, Fase 8).

### 3. I candidati possono caricare il CV dal link dell'annuncio?
**Sì, si può fare. Stima: 27–39 ore, circa 4–5 giornate.** Niente è stato costruito: si parte solo con l'ok di Roberto.

Oggi la pagina pubblica dell'annuncio esiste ma si può solo leggere, e il caricamento dei CV è riservato a chi ha fatto l'accesso.

| Lavoro | Ore |
|---|---|
| Indirizzo pubblico di caricamento, valido solo con il link di un annuncio approvato | 6–8 |
| Collegamento alla posizione e comparsa in piattaforma, doppioni per email | 8–12 |
| Modulo nella pagina dell'annuncio: nome, email, file, conferma, anche da telefono | 4–6 |
| Consenso privacy: registrazione con data e versione del testo, durata di conservazione | 3–4 |
| Difesa dagli abusi: limite di invii, trappola per i programmi automatici | 2–3 |
| Test e prova in produzione | 4–6 |

**La parte più incerta** è la comparsa in piattaforma: oggi l'allineamento col server aggiorna i candidati già presenti, non ne aggiunge di nuovi.

**File:** PDF, DOC e DOCX fino a 15 MB, come oggi. In più serve controllare il contenuto vero del file: oggi si controlla solo il tipo dichiarato, che da una pagina pubblica non basta.

**Fuori stima:**
- il testo dell'informativa privacy, che va scritto da chi se ne occupa;
- l'antivirus sui file, altre 4–6 ore se lo volete;
- il limite di invii è per singolo server: con più server va spostato su un archivio comune.

**Da decidere, Roberto:**
1. Chi è il titolare del trattamento: l'azienda cliente, Skill-Vision o tutte e due?
2. Per quanto tempo si conservano i CV?
3. Oggi il link nasce all'approvazione del profilo, non al salvataggio come hai scritto: quale delle due?
4. Vuoi l'antivirus?
