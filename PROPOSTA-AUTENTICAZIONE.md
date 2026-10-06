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

---

## Struttura della Fase 8 impostata (2026-10-02)

Fatte le parti che **non dipendono dal cliente**, dietro un interruttore.
**Di default non cambia niente:** guscio legacy, ponte e account di oggi
funzionano come prima. Verificato in locale.

### L'interruttore: `VITE_AUTH_MODE`

| Valore | Come si entra |
|---|---|
| vuoto o `legacy` (default) | login del guscio (`index.html`) e `sessionStorage.sv_shell_auth`, come oggi |
| `backend` | login React su `/login` contro `POST /auth/login` |

Si legge al momento della build. Si prova su un ambiente separato; per
tornare indietro basta togliere la variabile e rifare la build.

### Backend (compatibile con il ponte di oggi)

- **Limite ai tentativi** su `/auth/login`, in memoria. Superato un limite,
  risponde `429` con `Retry-After`, e il messaggio non rivela se l'email
  esiste:
  - 5 fallimenti in 15 minuti per IP + email (un accesso riuscito azzera il
    conto);
  - 20 fallimenti in 15 minuti per email, da qualunque IP;
  - 30 tentativi in 15 minuti per IP.
- **IP vero del client:** `trust proxy` è fissato a `TRUST_PROXY_HOPS`
  (default 1, il bordo di Railway), mai «fidati di tutti». Altrimenti un
  client potrebbe scriversi da solo l'IP e aggirare il limite.
- **Refresh token anche in cookie `httpOnly`** (`sv_refresh`,
  `SameSite=Strict`, `Path=/api/v1/auth`, `Secure` in produzione). Il corpo
  della risposta lo contiene ancora, per il ponte del guscio.
- **`/auth/refresh` e `/auth/logout`** accettano il token dal corpo (ponte)
  oppure dal cookie. Col cookie la richiesta deve venire dalla stessa origine
  o da `AUTH_COOKIE_ORIGINS` (difesa CSRF). Il logout revoca il token e
  cancella il cookie.
- **Test:** 5 nuovi; suite completa 101 su 101.

### Frontend

- **`/login`:** il pattern `LoginForm` (nel catalogo, con tutti gli stati)
  più `LoginPage`.
  - Gli errori dicono cosa fare: credenziali errate, troppi tentativi con i
    minuti d'attesa, server non raggiungibile.
  - Dopo l'accesso si torna alla pagina di partenza (`next`, solo percorsi
    interni).
- **Una guardia sola** (`layouts/AuthGuard.tsx`) al posto delle tre di oggi
  (Assessment, Recruiting, scelta del modulo). In `legacy` fa quello che
  facevano loro; in `backend` apre la sessione o rimanda a `/login`. Le
  rotte dei valutatori esterni restano fuori.
- **Sessione** (`lib/auth/session.ts`): token di accesso solo in memoria,
  rinnovo col cookie al ricaricamento, utente da `/auth/me`. **Nessuna
  credenziale nel frontend**; scrivere `sv_shell_auth` dalla console non
  apre più niente.
- **Logout** dalla barra superiore: il server revoca e cancella il cookie,
  poi si torna a `/login`.
- **Permessi dal ruolo** (`lib/auth/roles.ts`): in Assessment `canEdit`
  vale solo per `PLATFORM_ADMIN`, `COMPANY_ADMIN` e `RECRUITER`; `EVALUATOR`
  e `READONLY` leggono soltanto. In `legacy` resta `true`.
- **Ponte:** in modalità `backend` `authBridge.ensureBackendSession` usa la
  sessione vera, senza login automatico con credenziali.
- **Stessa origine:** `serve-combined.mjs` inoltra `/api/*` al backend se è
  impostata `BACKEND_INTERNAL_URL`, e Vite fa lo stesso in sviluppo. Con
  `SameSite=Strict` il cookie funziona solo se browser e API hanno la stessa
  origine, e su Railway i due servizi hanno domini diversi.

### Verificato in locale (modalità `backend`)

Tutto con account di prova creati e poi rimossi dal database di sviluppo:
1. pagina protetta senza accesso → `/login?next=…`;
2. `sv_shell_auth` scritto a mano → ancora `/login`;
3. password errata → messaggio corretto;
4. accesso → cookie `httpOnly`/`Strict`, nessun token in
   localStorage/sessionStorage, `document.cookie` non lo vede;
5. ricarica → sessione rinnovata;
6. logout → cookie cancellato e pagina protetta di nuovo chiusa;
7. `READONLY` → «Aggiungi Dipendente» non c'è;
8. `next=https://esempio.com` → resta nell'app.

Modalità `legacy` ricontrollata: comportamento invariato.

### Cosa resta, e dipende dal cliente

1. **Gli account reali** per le persone che oggi usano le quattro coppie del
   guscio: si creano e si consegnano col cliente (CLAUDE.md), non si
   inventano.
2. **Cambiare subito le password** degli account backend che compaiono nel
   codice (§3, punto 1 di questo documento): vale anche prima del passaggio.
3. **Il passaggio in produzione**, su un ambiente di prova prima:
   - frontend: `VITE_AUTH_MODE=backend` e `VITE_API_BASE_URL=/api/v1`, più
     `BACKEND_INTERNAL_URL` (indirizzo privato del Backend);
   - backend: nessuna variabile nuova (`TRUST_PROXY_HOPS` resta 1);
   - una build.
4. **Dopo il passaggio** si ritirano il guscio legacy e la sua copia
   (`frontend/legacy-shell/`) nello stesso momento, con il deploy aggiornato.
   Si tolgono anche `authBridge.ts`, le coppie di `js/app.js`,
   `VITE_OPERATORE_BRIDGE_PASSWORD` e il refresh token nel corpo della
   risposta di login.
5. **Facoltativo:** con più istanze del backend, il limite ai tentativi
   passa a un archivio condiviso.

---

## Passaggio a `VITE_AUTH_MODE=backend` su Railway — istruzioni esatte

Preparato il 2026-10-02 sui dati veri del progetto Railway (`zesty-victory`,
ambiente `production`):
- **Skill Vision:** frontend, `npm run start` = `serve-combined.mjs`.
- **Backend:** porta 8080, rete privata `backend`, una replica.
- **Postgres:** non esposto all'esterno.

**Prerequisito:** il codice di questa sessione è su `main` e deployato
(script, proxy `/api`, rotta `/login`, guardia unica).

**L'ordine è obbligatorio.** Il ponte del guscio entra nel backend con gli
account demo: si chiudono solo dopo il passaggio, altrimenti l'app si
chiude a tutti.

### Passo 1 — Account del gruppo di lavoro (la produzione è ancora `legacy`)

Postgres non è raggiungibile da fuori, quindi lo script gira dentro il
container del Backend. È già compilato in JavaScript con la build: non serve
`tsx`.

```bash
railway ssh --service Backend --environment production
node dist/scripts/create-team-admin.js --email <email di Alessio> --name "<Nome Cognome>" --apply
node dist/scripts/create-team-admin.js --email <email di Bilal> --name "<Nome Cognome>" --apply
exit
```

- **La password:** lo script la chiede due volte, senza mostrarla. Almeno 14
  caratteri, con maiuscola, minuscola e cifra. In alternativa `--generate`
  ne crea una e la mostra una volta sola.
- **Cosa non succede:** la password non finisce in codice, Git, argomenti o
  cronologia della shell; nel database va solo l'hash.
- **Verifica:** rilanciando senza `--apply`, lo script deve dire «esiste già».

### Passo 2 — Variabili del servizio **Skill Vision**

**Prima annota il valore attuale di `VITE_API_BASE_URL`: serve per tornare
indietro.**

| Variabile | Valore |
|---|---|
| `VITE_AUTH_MODE` | `backend` |
| `VITE_API_BASE_URL` | `/api/v1` |
| `BACKEND_INTERNAL_URL` | `http://${{Backend.RAILWAY_PRIVATE_DOMAIN}}:8080` |

**Dalla dashboard:** Skill Vision → Variables → aggiungi o modifica le tre
voci → **Deploy** delle modifiche in attesa.

**Da terminale:**

```bash
railway variable set --service "Skill Vision" --environment production \
  "VITE_AUTH_MODE=backend" \
  "VITE_API_BASE_URL=/api/v1" \
  'BACKEND_INTERNAL_URL=http://${{Backend.RAILWAY_PRIVATE_DOMAIN}}:8080'
```

- **Serve una nuova build:** le `VITE_` si leggono durante la build, non
  all'avvio.
- **`BACKEND_INTERNAL_URL` non ha `VITE_`:** la legge il server del
  frontend, non finisce nel JavaScript del browser.
- **Le virgolette singole sono necessarie:** `${{…}}` è un riferimento di
  Railway e la shell non deve interpretarlo.
- **Servizio Backend: nessuna variabile da cambiare.** `TRUST_PROXY_HOPS`
  resta 1, perché il proxy inoltra solo l'IP aggiunto dal bordo di Railway.
  `AUTH_COOKIE_ORIGINS` resta vuota, perché le richieste arrivano dalla
  stessa origine.

### Passo 3 — Verifica (5 minuti)

1. `https://skill-vision-production-6a42.up.railway.app/recruiting` → deve
   portare a `/login`.
2. Il proxy è attivo se questo comando restituisce `401`:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" -X POST \
     https://skill-vision-production-6a42.up.railway.app/api/v1/auth/refresh \
     -H 'Content-Type: application/json' -d '{}'
   ```
   Un `404` vuol dire che manca `BACKEND_INTERNAL_URL`; un `502`, che il
   Backend non si raggiunge sulla rete privata.
3. Accesso con un account del gruppo → si torna alla pagina richiesta. Poi
   ricarica: si resta dentro. Infine «Esci»: si torna a `/login`.
4. Strumenti del browser → Application → Cookies: c'è `sv_refresh` con
   `HttpOnly` e `SameSite=Strict`; in Local/Session Storage non c'è nessun
   token.

### Passo 4 — Chiudere gli account con password pubbliche

Solo dopo il passo 3 riuscito.

```bash
railway ssh --service Backend --environment production
node dist/scripts/secure-demo-accounts.js                                   # anteprima
node dist/scripts/secure-demo-accounts.js --apply --frontend-is-backend-mode
exit
```

- **Cosa fa:** disattiva `admin@skill-vision.it`, `hr@acme.example`,
  `recruiter@acme.example` e `operatore@skill-vision.it`, revoca le loro
  sessioni e scrive in `AuditLog`. Non cancella dati.
- **Quando rifiuta:** se non trova un altro `PLATFORM_ADMIN` attivo, oppure
  se manca `--frontend-is-backend-mode`.
- **Dopo:**
  - togli `VITE_OPERATORE_BRIDGE_PASSWORD` dal servizio Skill Vision. Era
    nel bundle, quindi quella password va considerata pubblica;
  - imposta la password di `operatore` solo se l'account deve tornare in
    uso, e in quel caso con lo script.

### Tornare indietro

- **Frontend:** cancella `VITE_AUTH_MODE` e rimetti `VITE_API_BASE_URL` al
  valore annotato; `BACKEND_INTERNAL_URL` può restare. Poi Deploy.
- **Se il passo 4 è già fatto:**
  `node dist/scripts/secure-demo-accounts.js --restore` (da `railway ssh`).
  Il ponte riprende a funzionare. Sono password pubbliche: è una misura
  d'emergenza, da tenere per ore, non per giorni.

### Da non fare

- **`ORIGINAL_SKILLS_ENABLED`:** non impostarla prima della fine del passo 4
  (CLAUDE.md: niente dati reali prima del login vero). **Già fatto**: è
  attiva in produzione dal 2026-10-02, dopo il passo 4 del 2026-10-03 —
  vedi PROGRESS.md.
- **Variabili `VITE_`:** non metterci segreti. Finiscono nel JavaScript
  servito.
- **Seed in produzione:** non lanciarlo, ricrea gli account con password
  pubbliche. Ora si rifiuta da solo con `NODE_ENV=production`.

---

## Account di Roberto e della società demo — 2026-10-06

`scripts/create-team-admin.ts` accetta ora `--role` e `--company-id` (oltre
a creare PLATFORM_ADMIN come prima): può quindi creare anche l'account
COMPANY_ADMIN della società demo, non solo gli account del gruppo di lavoro.

**Oggi esistono già 2 PLATFORM_ADMIN** (Alessio e Bilal, creati al Passo 1).
Restano da creare: l'account personale di Roberto (PLATFORM_ADMIN) e
`demo@skill-vision.it` (COMPANY_ADMIN, solo sulla società demo). **Da
lanciare da Roberto o Alessio**, non da una sessione di Claude Code: lo
script stampa la password generata una sola volta, in chiaro, sull'output
del comando — in una sessione assistita finirebbe nella trascrizione, che
non è un canale più sicuro di un'email.

```bash
railway ssh --service Backend --environment production

# Account personale di Roberto — password scelta a mano (chiesta due volte,
# non mostrata), non generata: è l'unico dei quattro che la tiene per sé.
node dist/scripts/create-team-admin.js --email roberto.f@skill-vision.it --name "Roberto Feliciani" --apply

# Account demo — COMPANY_ADMIN sulla sola società demo. <id società demo> è
# l'id della società «Acme Corp» (nel seed è 00000000-0000-0000-0000-000000000002;
# verificare che sia lo stesso anche in produzione prima di lanciare, per
# esempio da /recruiting/admin o con una query sola lettura su Company).
node dist/scripts/create-team-admin.js --email demo@skill-vision.it --name "Account demo" --role COMPANY_ADMIN --company-id <id società demo> --apply --generate

exit
```

- **Perché `--generate` solo per `demo@skill-vision.it`** e non per Roberto:
  l'account personale lo sceglie chi lo userà; gli account che non sono di
  una singola persona (o che si consegnano) usano una password generata,
  mostrata una volta e poi trasferita a voce o con un gestore di password.
- **Verifica:** rilanciando lo stesso comando senza `--apply`, lo script deve
  rispondere che l'account esiste già con quel ruolo e quella società.
- **Fuori da questo passo:** gli account delle due società reali di Original
  Skills. Si creano con lo stesso script quando quelle società esistono come
  `Company` in piattaforma e il cliente ha indicato chi deve avere accesso
  (CLAUDE.md, Fase 8: gli account del cliente si concordano, non si
  inventano).
