# Stime — Fasi 4–7 e Fase 8

Per Alessio. Data: 2026-09-30, a Fase 3 chiusa.

**Unità:** giornate di lavoro di una persona, nella stessa unità della stima
dell'autenticazione in `PROPOSTA-AUTENTICAZIONE.md`, così le due si sommano.
Le forchette coprono l'incertezza tecnica. **Non** coprono le attese di
risposta del cliente (vedi "Cosa può allungare"), che vanno messe in
calendario a parte.

**Da dove vengono i numeri:** dal lavoro che resta, misurato sul codice di
oggi — 484 difetti dell'audit in `frontend/src` (erano 800 in Fase 0), il CSS
di Assessment a ~770 righe (era 1.108), 12 grafici su quattro tecniche (Chart.js, Recharts, SVG a mano, barre Tailwind), ~30
schermate — e dal passo tenuto in Fase 3, dove la libreria (29 primitive e 23 pattern)
è stata fatta e applicata nei due moduli.

---

## Fasi 4–7: 24–33 giornate

| Fase | Cosa comprende | Stima |
|---|---|---|
| **4 — Guscio unico** | `AppShell` unico; `Sidebar` sola che unisce le due barre (sezioni e gruppi di Assessment, filtro per ruolo di Recruiting, badge, voci-azione, pannello su mobile); intestazione con il commutatore visibile solo con due moduli; radice `/` React con scelta del modulo e reindirizzamento se ce n'è uno solo; stato condiviso (azienda, ruolo, preferenze, tema); un solo guard sopra l'accesso di oggi, senza toccarlo; marchio d'identità al posto del logo attuale. Passi piccoli, ciascuno verificato. | **5–7** |
| **5 — Grafici (Bklit)** | Installazione di Bklit (React 19 c'è già); 12 grafici da Chart.js, Recharts, SVG a mano e barre Tailwind a Bklit, con le regole di colore; rimozione di `chart.js` e `recharts` (ApexCharts e Phosphor sono già tolti). **Se approvate** le proposte di MAPPATURA §10: radar in 6 punti e composed in 3. | **6–8**, di cui 2–3 per le proposte |
| **6 — Schermate** | ~30 schermate ricomposte sui componenti, stesso impianto: via gli stili in linea, le classi del vecchio CSS e i corpi fuori scala (199 nell'audit, quasi tutti in Recruiting); `assessment-scoped.css` e `data-theme` svuotati e tolti; i punti del cap. 7 ancora aperti (aloni della Home Recruiting, claim inglese, "Salva JD" che copre l'anteprima, doppio scorrimento, voce "Menu"). Le più pesanti: Profilo della ricerca, Scheda professionale, report dell'Intervista, Soft e Hard. | **10–14** |
| **7 — Verifica** | Audit a zero o con eccezioni motivate; contrasto reale con lo snippet su ogni schermata, chiaro e scuro; correzioni; audit in CI perché il numero non risalga. | **3–4** |

## Fase 8 — Autenticazione e ritiro del guscio legacy: 6–9 giornate

Invariata rispetto a `PROPOSTA-AUTENTICAZIONE.md` §2: login React sul backend,
sessione verificata dal server, guard e logout (2–3); ritiro del guscio legacy
in tutte e due le copie con il deploy su Railway aggiornato (1); permessi dal
ruolo backend al posto di `canEdit: true` (1–2); limite ai tentativi di
accesso (½); test dei ruoli (1–2).

In più, se scelto: refresh token in cookie `httpOnly` (**+1–2**).

Fuori stima: gli account reali, che si creano con il cliente; e portare i
dati di Assessment sul server (oggi vivono nel browser), lavoro separato da
concordare.

---

## Totale: 30–42 giornate (32–44 con il cookie `httpOnly`)

## Cosa può allungare

- **Decisioni del cliente ancora aperte** — azienda attiva, il termine
  "ruolo", lingua, reset demo, invio del link test (MAPPATURA §8): bloccano
  pezzi della Fase 4. I nomi delle fasce di idoneità servono in Fase 5 e 6.
- **Proposte sui grafici** (MAPPATURA §10): finché non sono approvate, la
  Fase 5 fa solo la migrazione. Gauge e Ring sulla Home toccano il concept
  del cliente.
- **Icona quadrata del marchio**: serve per la barra laterale compressa
  (Fase 4).
- **Account reali di produzione** (Fase 8): dipendono dal cliente.
