# Skill Vision — Frontend

React 19 / TypeScript / Vite / Tailwind CSS frontend for the Recruiting and
Assessment modules. This is one of three parts of the overall project — see
the [repo-root README](../README.md) for how it fits together with the
legacy static shell and the Node backend.

## Setup

```bash
cd frontend
npm install
cp .env.example .env    # every variable is documented there; read in src/lib/env.ts
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

One app, two modules. Every screen is composed from one component library
in three layers, and **each layer only uses the layers below it**:

```
src/
  components/
    ui/            Primitives: shadcn/ui (Button, Input, Dialog, Sheet…). The theme decides how they look.
    patterns/      Shared building blocks for both modules (PageHeader, StatCard, DataTable,
                   EmptyState, InlineAlert, ErrorBoundary, ConfirmDialog…). They take values, never fetch data.
    charts/        Bklit UI, installed from its registry. Imported as `@/components/charts`.
                   Don't edit or prune single files: they update as a set.
  layouts/         The single shell: AppShell, Topbar, AuthGuard, Logo.
  pages/           Routes outside both modules: /login, / (module chooser).
  hooks/           Shared React hooks (theme, sidebar, confirm, dirty-close…).
  lib/             Shared, framework-light code:
    api/             Backend client: base URL, tokens, ApiError, endpoints.
    auth/            Auth mode, session, roles (rebuilt in Phase 8).
    env.ts           The ONLY place that reads VITE_* variables (see "Environment").
    download.ts      Downloading a generated file (CSV/JSON/XLSX).
  modules/
    recruiting/    /recruiting/*: organised BY FEATURE
      <feature>/       pipeline/, ranking/, match/, job-profile/…: the page + its components
      components/      Components shared by several Recruiting features (nav, header…)
      lib/             Recruiting logic and data: scoring, pipeline, storage, backend sync
    assessment/    /assessment/*: organised BY TYPE
      pages/ components/ lib/
      gestione5p/      The 5P evaluation workflow, self-contained
  dev/             The component catalog, /dev/components (dev builds only).
  App.tsx          The route tree.
```

### Where new code goes

| You are adding… | Put it in |
|---|---|
| A visual element used in both modules | `components/patterns/`. Add it to the catalog (`dev/ComponentCatalog.tsx`) before using it in a page |
| A component that knows a module's data (a candidate row, an employee drawer) | `modules/<module>/components/` (Assessment) or the feature folder (Recruiting) |
| A new Recruiting feature | A new folder `modules/recruiting/<feature>/` with its page and components |
| A calculation, a data model, an export | `modules/<module>/lib/<topic>.ts`: pure functions, no JSX. Example: `assessment/lib/role-change.ts`, `assessment/lib/customer-care.ts` |
| Something both modules need, without UI | `src/lib/` |
| A page | It **composes** components on a `grid` with `gap` from the scale. No colours, borders, radii or font sizes of its own: if it needs a new look, that look becomes a pattern first |

Before writing a component, look in the catalog: `npm run dev`, then `/dev/components`.

### Logic and UI

Pages and components render; calculations live in `lib/`. A rule of thumb:
if a function doesn't return JSX and could be tested without a browser, it
belongs in `lib/`. The Assessment pages ported from the legacy app still
hold some helpers; move them to `lib/` when you work on that page.

### Naming

- Components: `PascalCase.tsx`, one per file, file name = export name (`StatCard.tsx` → `StatCard`).
- Logic, hooks, utilities: `kebab-case.ts` (`role-change.ts`, `use-dirty-close.ts`); hooks start with `use`.
- shadcn primitives keep shadcn's names (`ui/button.tsx`).
- Domain words stay Italian where the product uses them (`mansione`, `valutazione`, `gestione5p`); code words are English.
- Pages: `<Module><Name>Page.tsx` in Assessment, `<Name>Page.tsx` inside the feature folder in Recruiting.

### UI text

- **Assessment** passes all text through `lib/legacy-ui-text.ts` (`ui.someKey`),
  one file per language in `lib/ui-text/`. The interface ships in Italian, but
  English is kept. A key added to only one language fails `tsc`.
- **Recruiting** is Italian only, written in the components.

### State and data

- **Assessment**: React context (`lib/AssessmentContext.tsx`), saved to
  `localStorage` (`lib/storage.ts`). There is no server yet: see
  `PROGETTO-ASSESSMENT-SERVER.md` at the repo root. Don't change how it is
  saved without a decision in `DECISIONI.md`.
- **Recruiting**: `localStorage` (`lib/storage.ts`) plus the real backend,
  through `lib/api/` and `modules/recruiting/lib/backend-sync.ts`.
- **Shared across modules**: theme, sidebar, purchased modules → `src/hooks/`.

### Errors

- A page that crashes while rendering is caught by `ErrorBoundary`
  (`components/patterns/ErrorBoundary.tsx`), mounted around both modules'
  pages and around the whole route tree. The shell stays usable.
- Backend calls throw `ApiError` (`lib/api/client.ts`), with an Italian
  message for network failures. Show it with `InlineAlert` next to the
  action, or with a toast. **Never swallow an error with `.catch(() => {})`**:
  if a failure really doesn't matter, say why in a comment.
- Saved data that doesn't parse (`JSON.parse` on `localStorage` or on a
  file) always sits in a `try`, and falls back to an empty state or a clear
  message.

### Environment

All `VITE_*` variables are read in **`src/lib/env.ts`** and typed in
`src/vite-env.d.ts`. Each one is documented in `.env.example`. To add one:
`.env.example` → `vite-env.d.ts` → `env.ts`, then use `env.x`. They are
**build-time** values written into the browser bundle: never put a secret in
one. On Railway, changing one needs a new deploy.

The one exception is the catalog check in `App.tsx`. It is written out in
full so that Vite can drop the catalog from production builds.

### Rules that apply everywhere

The design-system rules (no hex colours, no shadows, the spacing scale,
Italian copy…) are in `../CLAUDE.md` §2 and §8. `node scripts/audit-identita.mjs`
(from the repo root) checks the source, and its count must not go up.
Decisions with their reasons are in `../DECISIONI.md`; the work log is
`../PROGRESS.md`.

## Notes

- No dedicated frontend test runner is wired up yet — verification for this
  project has relied on `tsc -b` / `oxlint` / `vite build` plus live
  Playwright checks (`@playwright/test` is a devDependency) rather than a
  committed Playwright suite.
- Real SMTP credentials, JWT secrets, and other backend secrets never live
  in this package — see `../backend/README.md`.
