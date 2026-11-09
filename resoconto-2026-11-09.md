# Resoconto del 9 novembre 2026

Per Alessio e Roberto. Tre blocchi: le correzioni del mattino, la Parte B (Il valore, Intervista, Recruiting) e la
Parte C (candidature dal link dell'annuncio). In fondo, le risposte alle due domande.

**Stato: pubblicato su `main`, ma nessun punto è ancora provato in produzione con l'accesso.** Qui non ci sono le
credenziali di produzione. In produzione si è controllato solo che l'applicazione sia online e serva la versione nuova.
Per CLAUDE.md §9 la prova la fa Bilal con il suo account. **Finché non è fatta, questo resoconto non si manda.** Ogni
punto dice «Pronto in locale» e com'è stato provato in locale (account `hr@acme.example`, dati dimostrativi di Acme).

I link portano alla produzione e chiedono l'accesso.

| # | Punto | Stato | In produzione |
|---|---|---|---|
| M1 | Metodo e Confronto interno sulla posizione attiva | Pronto in locale | Da provare |
| M2 | Esc chiude il confronto CV / profilo al primo colpo | Pronto in locale | Da provare |
| M3 | Niente scorrimento orizzontale sul telefono | Pronto in locale | Da provare |
| M4 | Avvisi dei grafici in console | Pronto in locale | Da provare |
| M5 | Home di Recruiting: card all'altezza del contenuto | Pronto in locale | Da provare |
| M6 | Pagine dei risultati: mini grafici e L'impatto in tre card | Pronto in locale | Da provare |
| M7 | Bilancio dimostrativo di Acme | Pronto in locale | Da provare, dipende da Railway |
| M8 | Caricamento CV, link al test a un indirizzo scelto | Pronto in locale | Da provare, l'invio dipende da Railway |
| B1 | Il valore · La situazione oggi | Pronto in locale | Da provare |
| B2 | Il valore · Criticità e opportunità | Pronto in locale | Da provare |
| B3 | Intervista | Pronto in locale | Da provare |
| B4 | Competenze trasversali e menu di Recruiting | Pronto in locale | Da provare |
| C | Candidature dal link dell'annuncio | Pronto in locale, solo demo | Da provare, dipende da Railway |

---

## Mattino (pubblicato con il commit `e1d97fb`)

### M1. Metodo e Confronto interno sulla posizione attiva
Gli esempi di Metodo si calcolano sui candidati della posizione attiva; «Sales Account Manager» non compare più a
schermo. Confronto interno elenca solo i candidati della posizione; i talenti interni restano tutti.
**Prova in locale:** Confronto interno con i 12 candidati di «Senior Frontend Engineer», confronto con un talento
riuscito. Metodo si vede solo con l'account dello staff, che in locale non c'è: non provato.
[Metodo](https://skill-vision-production-6a42.up.railway.app/recruiting/metodo) ·
[Confronto interno](https://skill-vision-production-6a42.up.railway.app/recruiting/match)

### M2. Esc nel confronto CV / profilo
Prima il primo Esc chiudeva solo il suggerimento del pulsante «Rimuovi». **Prova in locale:** un Esc chiude la finestra.

### M3. Scorrimento orizzontale sul telefono
Veniva dalla barra in alto a 390px: con il commutatore dei moduli il marchio passa al solo simbolo.
**Prova in locale:** nessuno scorrimento su 9 pagine fra 370 e 390px e fra 1024 e 1920px.

### M4. Avvisi dei grafici in console
Le misure dei grafici non scendono più sotto zero. **Prova in locale:** nessun avviso su 8 pagine con grafici, a 390px.

### M5. Home di Recruiting
Le tre card tornano all'altezza del contenuto. **Prova in locale:** tre card alte uguali (226px).

### M6. Pagine dei risultati
Ogni riquadro di «Criticità e opportunità» ha il suo mini grafico. L'impatto è in card: la quota in un Ring, il valore
espresso su una barra 0–120% con l'atteso tratteggiato, gli euro con gli scenari. Gli scenari compaiono solo se le tre
cifre sono diverse: sul divario e sulle perdite il motore dà la stessa cifra tre volte.
**Prova in locale:** le quattro pagine di Assessment aperte in chiaro e in scuro.

### M7. Bilancio dimostrativo
Per la sola società demo il bilancio dimostrativo si carica da solo e gli euro compaiono, con «Dati dimostrativi».
**Su Railway:** funziona solo se `VITE_DEMO_MODE` e l'elenco delle società demo sono impostati. Da qui non si vede.

### M8. CV e link al test
Il caricamento del CV sulla posizione demo funziona. Il link al test si manda all'indirizzo scritto nella riga del
candidato in Ranking. **Su Railway:** l'email parte solo con `RESEND_API_KEY` e `MAIL_FROM`; in locale non ci sono e si
apre l'invio manuale.

---

## Parte B (questo rilascio)

### B1. Il valore · La situazione oggi
Niente frase sotto il titolo e niente valore per area accanto al Gauge. Il Gauge del valore espresso è grande e centrato,
su una riga sua. Sotto, «Vedi per mansione», chiuso all'apertura, apre il valore espresso per mansione: una barra per
mansione, dalla più lontana, l'atteso 100% tratteggiato e «Vedi tutte le persone». Copertura mansioni e L'impatto
restano sotto.
**Prova in locale:** il Gauge è centrato nella card. Dopo il ricaricamento il pannello è chiuso; aperto, mostra 14
mansioni, da 63% a 105%. A 390px il Gauge si riduce e non scorre niente.
[Il valore](https://skill-vision-production-6a42.up.railway.app/assessment/il-valore)

### B2. Il valore · Criticità e opportunità
Tre riquadri, ognuno con il mini grafico: «Mansione con il maggiore deficit di competenze», «Area con il maggiore
deficit di competenze» (sul valore espresso, come il resto della pagina) e «Chi va oltre le attese» (quante persone e le
prime tre, ognuna con la sua barra).
**Prova in locale:** Coordinatore tecnico −37%, Area tecnica −27%, 4 persone oltre le attese (Andrea Costa 106%,
Francesca Gallo 105%, Davide Longo 105%).

### B3. Intervista
- Le domande si possono saltare. L'indice si calcola solo su quelle con una risposta (stessi pesi di prima, riportati
  sulle domande rimaste) e sotto il numero c'è «Calcolato su N domande su 5».
- «Nuova intervista» e «Modifica risposte» in alto a destra; «Stampa / PDF» e «Salva» in fondo.
- Tolti il selettore CT / CP / Completo, solo in questa pagina, e il blocco «Fase successiva — Misurazione oggettiva».
- In cima ai Dati aziendali, lo stato del bilancio («Caricato», con file e data, oppure «Da caricare») e «Vai al
  bilancio».

**Prova in locale:** con cinque risposte l'indice è 6,0 su 5 domande. Con la domanda 1 saltata è 5,8 su 4 domande, come
il calcolo a mano. Dopo la prova l'intervista è stata rimessa com'era.
[Intervista](https://skill-vision-production-6a42.up.railway.app/assessment/analisi)

### B4. Competenze trasversali e menu di Recruiting
Il valore atteso si scrive e si legge con un decimale e la virgola, da 1,0 a 10,0; si può scrivere anche con il punto.
«Risultati» torna nel menu fra Ranking e Migliori candidati: chi ha superato il match ed è fra i preselezionati, con il
test completato, in ordine di punteggio.
**Prova in locale:** «7.25» diventa «7,3», «12» diventa «10,0». In Risultati i 5 candidati della posizione demo, e la
voce del menu è attiva.
[Competenze trasversali](https://skill-vision-production-6a42.up.railway.app/recruiting/competenze-trasversali) ·
[Risultati](https://skill-vision-production-6a42.up.railway.app/recruiting/classifica-test)

---

## Parte C · Candidature dal link dell'annuncio

**Per ora solo la società demo.** Il flusso:

1. **Amministrazione → Email → «Privacy delle candidature online»**: titolare del trattamento ed email per i diritti
   dei candidati. Sono obbligatori.
2. **Profilo candidato → Annuncio di lavoro → «Crea link»**: è acceso solo con i contatti compilati. Il link apre
   l'annuncio con il modulo per candidarsi.
3. **Il candidato** scrive nome, email e, se vuole, il telefono. Allega il CV (PDF, DOC o DOCX, fino a 10 MB) e dà il
   consenso. Il CV si conserva 24 mesi; il candidato può scegliere 6 mesi.
4. **Il controllo del file**: il contenuto deve essere davvero un PDF, DOC o DOCX, e un file con la firma di prova
   antivirus (EICAR) si rifiuta prima di salvarlo.
5. **In piattaforma** il candidato compare da solo nel Ranking della posizione, con nome ed email veri, entro un minuto
   o all'apertura di Recruiting. Il link al test non parte da solo: lo manda l'HR, come per gli altri CV.

**Prova in locale:**
- Senza dati, il modulo dà quattro errori chiari.
- Il file EICAR viene rifiutato con «non ha superato il controllo antivirus» e sul server non resta nessun file.
- Con un PDF vero compare «Candidatura inviata», e Giulia Prova arriva in Ranking come «Candidatura dal link
  dell'annuncio».
- Sul server risultano il consenso esplicito, i 6 mesi scelti, il CV elaborato e la candidatura segnata come portata in
  piattaforma.
- Il modulo è leggibile in scuro e non scorre a 390px.

**Da sapere:**
- **Railway.** Il modulo compare solo se l'id di Acme è in `ASSESSMENT_DEMO_COMPANY_IDS`.
- **Antivirus.** È un controllo di base, non un motore antivirus. Prima delle società vere va collegato un motore
  (ClamAV o un servizio): il punto del codice è uno solo.
- **Database.** Serve una tabella nuova; su Railway la crea da sola la procedura di avvio del backend.

---

## Le due domande

### 1. Che cos'è la «soglia del peso»
Quando nelle Competenze trasversali una competenza è scelta ma **senza valore atteso scritto**, il punteggio richiesto
dipende dal peso: Utile 18, Importante 21, Essenziale 24 sulla scala del test (0–31), cioè circa 5,8 · 6,8 · 7,7 su
10. Il campo «Atteso» la mostra come suggerimento (6,0 · 7,0 · 8,0). Un valore scritto la sostituisce.

> *Esempio.* Problem solving è **Essenziale** e non ha un atteso: la soglia è 24. Un candidato con 18 la copre al 75%;
> uno con 14 è sotto il 60% della soglia e scatta il segnale rosso, che ferma il punteggio finale a 5,9.

### 2. Dove si imposta e dove si vede il «Big Five ideale»
- **Dove si imposta.** Non c'è una schermata. I profili ideali sono scritti nel codice, uno per otto ruoli, in
  `frontend/src/modules/recruiting/data/roles-seed.json` (campo `bf`). Il calcolo usa sempre quello di «Sales Account
  Manager» (Estroversione 75, Coscienziosità 62, Apertura 58, Amicalità 55, Stabilità emotiva 70), qualunque sia la
  posizione. Farlo cambiare con la posizione richiede una schermata nuova: da decidere.
- **Dove si vede:**
  - In [Migliori candidati](https://skill-vision-production-6a42.up.railway.app/recruiting/ranking): si apre la card di
    un candidato, «Big Five di … rispetto al profilo ideale», con il profilo ideale come riferimento.
  - In [Metodo](https://skill-vision-production-6a42.up.railway.app/recruiting/metodo): l'esempio dell'Affinità Big
    Five (AB, peso 30%) mostra la distanza del candidato dal profilo ideale, dimensione per dimensione.
