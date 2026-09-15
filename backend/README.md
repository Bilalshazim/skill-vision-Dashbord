# Recruiting backend

Node.js / TypeScript / Express / PostgreSQL (via Prisma) — the API behind
the Recruiting module (see [`../README.md`](../README.md) for how this fits
with the frontend and the legacy shell). Originally built against the
Phase 29 Backend Blueprint and the Phase 29B decision sheet; this doc
reflects the backend's current state, not that one phase.

## Setup

```bash
brew install postgresql@16        # if not already installed
brew services start postgresql@16
createuser -s sv_recruiting
createdb -O sv_recruiting sv_recruiting        # dev database
createdb -O sv_recruiting sv_recruiting_test   # test database

cd backend
npm install
cp .env.example .env    # fill in real secrets for anything beyond local dev
npx prisma migrate deploy
npm run seed
npm run dev              # http://localhost:4000
```

`.env.test` is checked in with placeholder-only values (a separate local
database, dummy secrets) since it never holds anything real — the actual
`.env` is gitignored.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with reload |
| `npm run build` / `npm start` | Production build + run |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | `oxlint` |
| `npm test` | Full test suite (vitest + supertest) against `sv_recruiting_test` |
| `npm run seed` | Realistic fixtures — see `prisma/seed.ts` |
| `npm run migrate:localstorage -- --input <file> [--dry-run]` | See `MIGRATION.md` |
| `npm run smtp:verify [-- --to <email>]` | Verifies the SMTP connection/auth from `.env`; with `--to`, sends one real test email. See `scripts/verify-smtp.ts`. |

## What's implemented vs. deliberately deferred

Every table in the Phase 29 Blueprint §2 is in `prisma/schema.prisma`, with
real endpoints in `src/modules/*`. Four decisions were left unresolved by
Phase 29B (OD-1, OD-6, OD-8, OD-10) — per the Phase 30 brief's stop
condition, nothing here guesses an answer to those. Search the codebase
for the OD number to find exactly where each boundary sits:

- **OD-1** (CIP generation trigger / Platform↔Company cardinality / sequence
  scope) — `src/lib/cip.ts`, `prisma/schema.prisma` (`Cip` model comment).
  CIP generation is a real, working, explicitly-invoked endpoint — nothing
  wires it to an automatic "on activation" trigger yet.
- **OD-6** (CV Elaborati naming) — `src/modules/shortlist/routes.ts`. The
  `Shortlist`/`ShortlistSource` model and every endpoint work today; only
  the eventual UI screen name is unresolved, and nothing here depends on
  a specific name.
- **OD-8** (non-response day-count) — `prisma/schema.prisma`
  (`NonResponseThresholdConfig`, always unset), `src/modules/shortlist`.
  `NON_HA_RISPOSTO` is a real, reachable status; no scheduled job exists to
  set it automatically, because no day-count has been given.
- **OD-10** (CV retention expiry action) — `src/modules/cv/routes.ts`
  (`GET /cv/retention/review`). Retention is tracked and queryable; nothing
  deletes or anonymizes a file automatically.

## Architecture notes worth knowing before touching this code

- **CV storage** (`src/lib/storage.ts`) is a local-disk implementation
  behind a `FileStorage` interface — swapping in real object storage later
  is a new class implementing that interface, not a rewrite of anything
  that calls it.
- **AHI scoring** (`src/lib/scoring.ts`) is a verbatim port of
  `frontend/src/modules/recruiting/lib/scoring.ts` — do not change the
  arithmetic here without changing it there too; see `tests/scoring.test.ts`.
- **Email sending** is real: `src/lib/mailer.ts` (Nodemailer/SMTP,
  configured entirely via `SMTP_*`/`MAIL_FROM*` env vars — see
  `.env.example`) and `src/lib/emailTemplates.ts` (the branded HTML/text
  "INVIA LINK TEST" template). `POST /shortlist/:id/send-test` sends for
  real and only marks an invitation `SENT` on genuine provider success —
  see `npm run smtp:verify` above to check the current `.env` config
  without touching any candidate data. The one remaining stand-in is the
  *test-taking* provider (`src/modules/webhooks/routes.ts`) — no real
  assessment-test vendor is wired, so `TestResponse` rows only ever arrive
  via that webhook boundary or a recruiter's manual entry.
- **Test-provider webhook** (`src/modules/webhooks/routes.ts`) verifies an
  HMAC signature over the *raw* request bytes (captured via `app.ts`'s
  `express.json` `verify` hook) — never a re-serialized `JSON.stringify`,
  which would silently fail against any real provider's signature.
