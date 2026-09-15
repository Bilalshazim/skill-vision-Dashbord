# Skill Vision

An HR platform with two modules — **Recruiting** and **Assessment** —
served behind one shared login shell.

## How this repo is put together

There are three parts, each with its own README:

| Part | What it is | Docs |
|---|---|---|
| `index.html`, `js/`, `css/`, `assets/` | The legacy static login/landing shell. Still the single real entry point — neither app below has its own login screen. | — (plain static HTML/CSS/JS, no build step) |
| `frontend/` | React 19 + TypeScript + Vite. Recruiting (backend-connected) and Assessment (currently `localStorage`-only) both live here, routed under `/recruiting/*` and `/assessment/*`. | [`frontend/README.md`](frontend/README.md) |
| `backend/` | Node.js + Express + PostgreSQL (via Prisma). The Recruiting API — auth, candidates, CVs, shortlist, evaluators, CIP, real SMTP email. Assessment does not use it. | [`backend/README.md`](backend/README.md) |

**Why a legacy shell instead of a React login page:** the shell's own
login/landing page is the one authentication entry point for both modules —
see `frontend/src/modules/assessment/lib/shell-bridge.ts` for how the React
apps read its session, and `backend/src/lib/env.ts` /
`frontend/src/lib/api/` for how Recruiting bridges that shell session to a
real backend JWT.

## Running everything locally

```bash
# 1. Backend (Postgres + API)
cd backend && npm install && cp .env.example .env
npx prisma migrate deploy && npm run seed && npm run dev   # :4000

# 2. Frontend (serves the legacy shell too, in dev)
cd frontend && npm install && cp .env.example .env
npm run dev                                                  # :5173
```

Open `http://localhost:5173/` — that's the shell's login page. See each
module's own README for demo credentials, scripts, and architecture notes.

## What's real vs. simulated right now

- **Recruiting**: real backend, real PostgreSQL, real CV file storage, real
  authentication/authorization, real SMTP email delivery for "INVIA LINK
  TEST". CV *parsing* is still simulated (no OCR/ML provider wired), and no
  real assessment-test provider is connected — see `backend/README.md` for
  the exact boundary.
- **Assessment**: a complete, working module on its own local data layer;
  not yet connected to the backend.

## Before deploying anywhere

This repository is not yet under version control (no `.git`), and no
production secrets/infrastructure are configured — `backend/.env` holds
local-only values. See `backend/README.md` for the exact environment
variables a real deployment needs, and note the intentionally unresolved
business decisions (search the backend for `OD-1`, `OD-6`, `OD-8`, `OD-10`)
that still need a decision from the product owner before certain behaviors
(CIP auto-generation, CV retention expiry action, etc.) can be implemented
rather than left as deliberate open boundaries.
