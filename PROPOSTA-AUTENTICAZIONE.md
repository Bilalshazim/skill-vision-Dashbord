# Autenticazione — stato attuale e proposta per la Fase 4

Data: 2026-09-29. Analisi sul codice, senza modifiche all'autenticazione.
Da concordare con il cliente prima della Fase 4 (CLAUDE.md, Fase 4).

## Com'è oggi

Tre strati, di cui solo l'ultimo è un'autenticazione vera.

1. **Guscio legacy** (`js/app.js`, righe ~275–279, e la sua copia in
   `frontend/legacy-shell/`): quattro coppie utente/password scritte in
   chiaro (`admin`, `roberto`, `operatore`, `Roberto`). Il confronto avviene
   nel browser; se va, il guscio scrive `sessionStorage.sv_shell_auth = '1'`.
2. **Moduli React**: leggono solo quella chiave (`shell-bridge.ts`). Chiunque
   può scriverla dalla console e saltare il login.
3. **Ponte verso il backend** (`frontend/src/lib/api/authBridge.ts`): ogni
   utente del guscio è mappato su un account del backend, con **email e
   password nel codice** (`admin@skill-vision.it` / `admin123`,
   `hr@acme.example` / `acme123`) o in `VITE_OPERATORE_BRIDGE_PASSWORD`. Con
   il prefisso `VITE_`, anche quella finisce nel bundle servito al browser.
   Il ponte fa il login e salva i token in `localStorage`.

Il **backend** invece è a posto: `POST /auth/login` (bcrypt), token di accesso
JWT da 15 minuti, refresh da 30 giorni salvati come hash e revocabili,
`/auth/refresh`, `/auth/logout`, `/auth/me`; `requireAuth` e `requireRole` in
14 moduli; ruoli `PLATFORM_ADMIN`, `COMPANY_ADMIN`, `RECRUITER`, `EVALUATOR`,
`READONLY`. Manca un limite ai tentativi di login.

**Assessment** non passa dal backend per i suoi dati: dipendenti,
valutazioni e piani vivono in `localStorage`. I permessi sono `canEdit: true`
fisso (62 punti del modulo leggono quel valore, tutti dal contesto).

## 1. Cosa fare

- **Login in React contro il backend.** Una pagina `/login` che chiama
  `POST /auth/login` con le credenziali che l'utente digita. Niente mappa
  utente→account: ogni persona ha il suo account sul backend.
- **Via il ponte e il guscio.** Si eliminano `authBridge.ts`, le quattro
  coppie di `js/app.js` (in entrambe le copie del guscio) e la chiave
  `sv_shell_auth`. Lo stato di accesso è "ho un token valido", verificato con
  `/auth/me` all'avvio e rinnovato con `/auth/refresh`.
- **Permessi dal ruolo del backend**, per tutti e due i moduli. In Assessment
  `canEdit` diventa una funzione del ruolo (per esempio `READONLY` ed
  `EVALUATOR` → sola lettura). Un solo punto di modifica, perché i 62 usi
  leggono dal contesto.
- **Un guard unico** nel guscio al posto di `AssessmentAuthGuard` e
  `RecruitingAuthGuard`, e un logout che chiama `/auth/logout`.
- Le rotte dei valutatori esterni (`/evaluate`, `/assessment/evaluate`)
  restano fuori dal login, con il loro token: non cambiano.

## 2. Stima e impatto sul backend

| Pezzo | Dove | Stima |
|---|---|---|
| Pagina di login, sessione, guard, logout | frontend | 2–3 giorni |
| Rimozione ponte e guscio legacy (due copie + deploy Railway) | frontend, config | 1 giorno |
| Permessi da ruolo in Assessment e Recruiting | frontend | 1–2 giorni |
| Limite ai tentativi su `/auth/login` | backend, piccolo | ½ giorno |
| Account reali per le persone che oggi usano le 4 coppie | dati, dal cliente | dipende dal cliente |
| Test e verifica dei ruoli sulle schermate | entrambi | 1–2 giorni |

**Totale indicativo: 6–9 giornate**, più la creazione degli account.

**Impatto sul backend: basso.** Login, refresh, logout e ruoli esistono già e
non vanno riscritti. Si aggiunge il limite ai tentativi. Facoltativo, e da
decidere: passare il refresh token in un cookie `httpOnly` invece che in
`localStorage` (1–2 giorni in più, tocca CORS con credenziali).

**Fuori da questa stima:** portare i dati di Assessment sul server. Oggi il
login protegge l'accesso all'interfaccia, ma le valutazioni restano nel
browser di chi le ha inserite. È lo stesso lavoro già rimandato per il
valutatore esterno (MAPPATURA §8.2), e va concordato a parte.

## 3. Cosa mettere in sicurezza, e in che ordine

1. **Subito, a prescindere dalla Fase 4: cambiare le password** degli account
   backend che compaiono nel codice (`admin@skill-vision.it`,
   `hr@acme.example`) e dell'account `operatore`, perché sono leggibili da
   chiunque apra il bundle o il repository. Il commento del codice indica
   `operatore` come account reale di produzione.
2. **Non usare più `VITE_` per un segreto.** `VITE_OPERATORE_BRIDGE_PASSWORD`
   è nel bundle client per costruzione; sparisce con il ponte.
3. **Chiudere l'accesso da console**: niente più `sv_shell_auth`; si entra
   solo con un token emesso dal backend.
4. **Permessi veri**: il ruolo decide cosa si può modificare; `canEdit: true`
   fisso va via.
5. **Limite ai tentativi di login** sul backend.
6. **Dati personali di Assessment nel browser**: da segnalare al cliente, con
   la proposta di portarli sul server come lavoro separato.

Nessuna di queste modifiche è stata fatta: questo documento serve a
decidere.
