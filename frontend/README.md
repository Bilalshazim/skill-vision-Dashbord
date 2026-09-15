# Skill Vision — Frontend

React 19 / TypeScript / Vite / Tailwind CSS frontend for the Recruiting and
Assessment modules. This is one of three parts of the overall project — see
the [repo-root README](../README.md) for how it fits together with the
legacy static shell and the Node backend.

## Setup

```bash
cd frontend
npm install
cp .env.example .env    # VITE_API_BASE_URL — defaults to the local backend
npm run dev              # http://localhost:5173
```

The backend (`../backend/`) must be running for any Recruiting screen that
talks to the API — see its own README for setup. Assessment currently
persists to `localStorage` only and works standalone.

The dev server also serves the legacy static shell (`../index.html`,
`../js/`, `../css/`, `../assets/`) at `/` — see `vite.config.ts`'s
`legacyShellDevServer()` plugin — so `/` (login/landing), `/recruiting/*`,
and `/assessment/*` all work from one `npm run dev` on one origin, matching
how this needs to be deployed in production.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with HMR (also serves the legacy shell — see above) |
| `npm run build` | `tsc -b && vite build` — output in `dist/` |
| `npm run lint` | `oxlint` |
| `npm run preview` | Serve the built `dist/` (React app only, not the combined origin) |
| `npm run serve:combined` | After `npm run build` — serves the legacy shell + built React app together on one origin (`http://localhost:8300`), the closest local approximation of the real production deployment shape |

## Structure

```
src/
  layouts/          Global app shell (Topbar, Sidebar, theme/language)
  components/ui/     shadcn/ui primitives
  lib/               Shared utilities, incl. lib/api/ — the Recruiting
                      backend API client (base URL, auth, error handling)
  modules/
    recruiting/       Recruiting screens, routed under /recruiting/*
    assessment/       Assessment screens, routed under /assessment/*
                       (its own layout/shell — see AssessmentLayout.tsx)
```

Recruiting and Assessment are deliberately kept independent — see each
module's own `lib/` for its data layer. Anything shared between them
(theme, language, the legacy shell's login session) lives in
`modules/assessment/lib/shell-bridge.ts` and is read the same way from both
modules, not duplicated.

## Notes

- No dedicated frontend test runner is wired up yet — verification for this
  project has relied on `tsc -b` / `oxlint` / `vite build` plus live
  Playwright checks (`@playwright/test` is a devDependency) rather than a
  committed Playwright suite.
- Real SMTP credentials, JWT secrets, and other backend secrets never live
  in this package — see `../backend/README.md`.
