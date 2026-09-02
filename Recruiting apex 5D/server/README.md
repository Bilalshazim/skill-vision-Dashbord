# SkillVision — CV Ingestion Service

Backend-only service that accepts **CV PDFs** from three entry sources,
parses candidate metadata and stores the candidate record in a **per-company
archive database**. The SkillVision dashboard pages are **not modified** —
records use the same candidate model as the dashboard (`{id, name, src, role,
job, icv, scores, bf}`) so they can be exported into it later.

**Zero npm dependencies** — plain Node.js (>= 16).

```bash
node server.js            # or: npm start
# → [ingest] SkillVision CV service listening on http://0.0.0.0:8787
```

## Endpoints

| Method | Path                     | Source                          | Payload |
|--------|--------------------------|---------------------------------|---------|
| POST   | `/api/ingest/email`      | Dedicated inbox (jobs@company.com) | SendGrid/Mailgun multipart webhook **or** Postmark-style JSON **or** raw `message/rfc822` |
| POST   | `/api/ingest/webform`    | Corporate website form          | `multipart/form-data` with a PDF file field |
| POST   | `/api/ingest/ats`        | Third-party ATS                 | `application/json` with base64-encoded PDF |
| POST   | `/api/ingest/bulk`       | Historical archive migration    | `multipart/form-data` (repeated PDF file fields) **or** `application/json` `{companyId, items:[{candidate,file}]}` |
| POST   | `/api/prescreen`         | ASK page / integrations         | `application/json` `{prompt, companyId?, criteria?, strict?}` |
| GET    | `/api/archive`           | verification / sync             | list of company archives |
| GET    | `/api/archive/:companyId`| verification / sync             | full archive for one company |
| PATCH  | `/api/archive/:companyId/candidates/:id` | ATS status sync | `application/json` `{status, note?}` — fires `candidate.status_changed` |
| POST   | `/api/clients`           | self-service onboarding         | `application/json` `{companyName, partitaIva, contactEmail?, contactName?}` |
| GET    | `/api/clients[/:companyId]` | ops / verification           | provisioned client list or one record (API key withheld) |
| POST   | `/api/webhooks/:companyId` | ATS integration               | `application/json` `{url, events?, secret?}` — register a subscription |
| GET    | `/api/webhooks/:companyId` | ATS integration               | list subscriptions for a company |
| DELETE | `/api/webhooks/:companyId/:id` | ATS integration           | remove a subscription |
| GET    | `/healthz`               | monitoring                      | liveness + configured companies/inboxes |

## Pre-screening pipeline (`POST /api/prescreen`)

Parses a natural-language screening prompt (Italian or English) into criteria
and evaluates every archived candidate:

```bash
curl -X POST http://localhost:8787/api/prescreen \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"candidati con almeno 3 anni di esperienza, laurea magistrale e madrelingua inglese"}'
```

Recognised criteria: `minYears` ("almeno 3 anni", "5+ anni di esperienza",
"3+ years of experience"), `degree` (`diploma < bachelor < master < phd` —
ranked, so a PhD satisfies a Master requirement), `nativeLanguages`
("madrelingua inglese", "native english speaker"), `keywordsAll` (quoted
terms), plus optional explicit `criteria` overrides and `strict` mode.

- **Unknown ≠ fail**: candidates missing data get status `unknown` for that
  criterion and are kept (with `unknownCount`) unless `strict:true`.
- **Contactability**: `contactable:true` requires a channel (valid email or
  phone) AND `consent !== 'declined'`. Consent is `explicit` (webform
  checkbox / ATS flag), `implicit` (emailed application), `declined`, or
  `unknown`.
- **Lazy enrichment**: records ingested before profile extraction existed are
  enriched on first prescreen run by re-reading the stored PDF; the derived
  `{education, experienceYears, nativeLanguages}` is persisted.
- **Dual-mode querying** (`ARCHIVE` vs `NEW_APPLICANT`): the engine treats
  stored archive records (incl. ATS bulk imports) as the shared `ARCHIVE`
  pool; applications just received for a specific posting (`campaignId`) are
  tagged `NEW_APPLICANT` and scoped to their own campaign. Query with:
  `"campaignId":"opening-senior-fe"` → NEW_APPLICANT only match their own
  campaign, while ARCHIVE candidates are always eligible (shared pool);
  `"sourceTag":"ARCHIVE" | "NEW_APPLICANT" | "BOTH"` → filter by
  provenance tag. Strict per-campaign data isolation applies by default.
- Response: `{ok:true,data:{criteria,companies,evaluated,total,sourceTag,campaignId,matches:[...]}}`
  with matches sorted verified-first, each carrying `checks[]`
  (`pass/fail/unknown` + detail), `contactable`, `contactChannels`, `consent`,
  `sourceTag` (`ARCHIVE`/`NEW_APPLICANT`) and `campaignId`. The **ASK page**
  renders a small source-tag chip next to each match (layout unchanged).

The **ASK page** in the dashboard uses this endpoint automatically when a
prompt looks like a screening query ("filtra candidati…", "madrelingua…",
"anni di esperienza…") and renders the formatted list with per-criterion
badges; when the service is unreachable it falls back to filtering the
in-page candidate records with the same logic (source label shows which path
was used). Set the API base via `localStorage['apex5d_ingest_api_base']` if
the service is not same-origin.

### Standardized JSON responses (all routes)

```json
{ "ok": true,  "data": { "candidateId": "cv-...", "companyId": "company-acme",
                         "duplicate": false, "warnings": [], "candidate": { ... } } }
```
```json
{ "ok": false, "error": { "code": "UNKNOWN_COMPANY", "message": "...",
                          "details": { "knownCompanies": ["company-acme"] } } }
```

Error codes: `ROUTE_NOT_FOUND` (404), `METHOD_NOT_ALLOWED` (405), `UNAUTHORIZED`
(401), `INVALID_JSON` (400), `MALFORMED_MULTIPART` (400), `CV_REQUIRED` (400),
`UNSUPPORTED_MEDIA_TYPE` (415 — not a PDF), `PAYLOAD_TOO_LARGE` (413),
`COMPANY_REQUIRED` (422), `UNKNOWN_COMPANY` / `UNKNOWN_RECIPIENT` (422),
`MALFORMED_EMAIL` (400), `INTERNAL_ERROR` (500).

## 1) Dedicated email inbox (`jobs@company.com` → company archive)

Recipient address → company mapping (env override):

```bash
EMAIL_INBOXES='{"jobs@company.com":{"companyId":"company-acme"},"talent@ops.com":{"companyId":"company-ops"}}'
```

- **SendGrid Inbound Parse / Mailgun Routes**: point the inbox's webhook at
  `POST /api/ingest/email` (multipart). Fields `to/from/subject` are read,
  PDF attachments are detected by content-type, filename or `%PDF` magic.
- **Postmark inbound**: forwards JSON (`From/To/Subject/Attachments[Content(base64)]`).
- **Raw RFC 822**: an MTA/forwarder can POST the original message — parsed by
  the built-in MIME reader (multipart/alternative + base64/quoted-printable).

## 2) Corporate website webform

```html
<form action="https://ingest.example.com/api/ingest/webform" method="post" enctype="multipart/form-data">
  <input type="hidden" name="companyId" value="company-acme">
  <input type="text"   name="fullName"  placeholder="Nome e cognome">
  <input type="email"  name="email">
  <input type="file"   name="cv" accept="application/pdf">
  <button>Invia candidatura</button>
</form>
```

Fields: `companyId` (required), `cv`/`resume`/`file` (PDF), optional
`fullName`, `email`, `phone`, `role`/`position`, `job`, `note`.

## 3) Third-party ATS integration

```bash
curl -X POST http://localhost:8787/api/ingest/ats \
  -H 'Content-Type: application/json' -H 'x-api-key: $KEY' \
  -d '{
    "companyId": "company-acme",
    "source": "Greenhouse",
    "candidate": { "name": "Mario Rossi", "email": "mario@example.com",
                   "role": "Junior Analyst" },
    "file": { "filename": "cv-mario-rossi.pdf",
              "contentBase64": "<base64 of the PDF>" }
  }'
```

## 4) Bulk historical archive import (`POST /api/ingest/bulk`)

One request migrates a whole existing CV database into the archive — each
file/item is run through the same pipeline as the single-CV routes
independently, so one bad file never aborts the batch. Two shapes:

```bash
# A. A folder of PDFs at once (multipart, repeated "cv" file fields)
curl -X POST http://localhost:8787/api/ingest/bulk -H 'x-api-key: $KEY' \
  -F 'companyId=company-acme' \
  -F 'cv=@cv1.pdf' -F 'cv=@cv2.pdf' -F 'cv=@cv3.pdf'

# B. An ATS-style bulk export (JSON, base64 PDFs)
curl -X POST http://localhost:8787/api/ingest/bulk \
  -H 'Content-Type: application/json' -H 'x-api-key: $KEY' \
  -d '{
    "companyId": "company-acme", "source": "LegacyATS-Export",
    "items": [
      { "candidate": {"name":"Mario Rossi","email":"mario@example.com"},
        "file": {"filename":"mario.pdf","contentBase64":"<base64>"} }
    ]
  }'
```

Optional `campaignId`/`sourceTag` fields (top-level, or per item/candidate)
tag the whole batch or individual records for a selection campaign;
otherwise every imported CV lands in the shared `ARCHIVE` pool. Capped at
`MAX_BULK_ITEMS` (default 500) items and `MAX_BULK_BODY_BYTES` (default
200 MB) per request — split larger databases into several calls. Response:
`{ok:true, data:{companyId, total, imported, duplicates, failed, results:[{index, ok, candidateId|error}, ...]}}`.
Searching the resulting archive (by degree, experience, native language,
keywords) is `POST /api/prescreen` — also what the dashboard's **ASK** page
uses.

## 5) Client onboarding (`POST /api/clients`)

Provisions a new Recruiting-only client without touching `KNOWN_COMPANIES`,
config files, or a restart — the returned `companyId` is immediately usable
by every ingest/prescreen/archive/retention/webhook route (`config.isKnownCompany()`
consults the registered-clients store as well as the static env list).

```bash
curl -X POST http://localhost:8787/api/clients \
  -H 'Content-Type: application/json' \
  -d '{"companyName":"Rossi Talent Srl","partitaIva":"00743110157","contactEmail":"hr@rossitalent.it"}'
```

`partitaIva` (Italian VAT number) is required and checksum-validated (11
digits, standard alternating-sum algorithm) — `422 INVALID_PARTITA_IVA` on a
bad checksum, `409 CLIENT_ALREADY_REGISTERED` on a duplicate. Response
includes a generated `companyId` (slugified from the name, deduplicated), a
per-client `apiKey` (for future use), and a ready-to-use
`nextSteps.sandboxDashboard` link — pairs with the dashboard's `?sandbox=1`
mode (see the dashboard's own docs/comments: it strips every seeded
demo/mock candidate and shows the real, empty archive for that company, so
the new client can test live — upload CVs, query them via ASK — before any
data exists). `GET /api/clients[/:companyId]` lists what's provisioned
(protected by `CLIENTS_API_KEY` if set; API keys are withheld from listings).

## 6) ATS bi-directional sync (webhooks + status updates)

Inbound (ATS → SkillVision) is the ingest/bulk routes above. Outbound
(SkillVision → ATS) is this: register a URL to be notified when something
changes, so the ATS doesn't have to poll.

```bash
curl -X POST http://localhost:8787/api/webhooks/company-acme \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://your-ats.example.com/skillvision-hook","events":["candidate.status_changed"],"secret":"whsec_..."}'
```

Events: `candidate.created`, `candidate.duplicate`, `candidate.status_changed`,
`candidate.deleted` (GDPR erasure — payload is pseudonymous, id only, no
name/email, same as the retention deletion log). Delivery is a `POST` with
header `X-SkillVision-Event` and, when a `secret` was set,
`X-SkillVision-Signature: sha256=<hmac>` (HMAC-SHA256 of the raw JSON body) —
verify it the same way GitHub/Stripe-style webhooks are verified. Up to 3
attempts with backoff; a subscriber being down never fails the triggering
request (ingest, status update, purge all fire-and-forget). `GET`/`DELETE
/api/webhooks/:companyId[/:id]` list/remove subscriptions.

To change a candidate's status (and trigger `candidate.status_changed`):

```bash
curl -X PATCH http://localhost:8787/api/archive/company-acme/candidates/cv-abc123 \
  -H 'Content-Type: application/json' \
  -d '{"status":"interviewing","note":"Colloquio fissato per venerdì"}'
```

Allowed statuses: `new`, `contacted`, `screening`, `interviewing`, `offered`,
`hired`, `rejected`, `withdrawn`. Setting the same status again is a no-op
(`changed:false`, no webhook fired).

## Archive storage (per company)

```
server/data/archive/<companyId>/
├── candidates.json     # the archive DB (dashboard-compatible records)
└── files/<id>.pdf      # original CV, sha256-verified
```

Duplicate submissions (same email, else same name) update the existing record:
`receivedCount` incremented, `lastReceivedAt` bumped, file replaced, id stable —
the response reports `"duplicate": true`. Writes are atomic and serialized per
company. Records are stored with `icv: null, scores: {}, bf: {}` until an APEX
evaluation fills them.

## Configuration (environment variables)

| Variable           | Default                              | Purpose |
|--------------------|--------------------------------------|---------|
| `PORT` / `HOST`    | `8787` / `0.0.0.0`                   | listen address |
| `INGEST_API_KEY`   | *(unset = open, dev)*                | shared secret for the three ingest endpoints (`x-api-key` or `Authorization: Bearer`) |
| `ARCHIVE_API_KEY`  | *(unset = open, dev)*                | key for `GET /api/archive*` (also guards `PATCH .../candidates/:id`) |
| `CLIENTS_API_KEY`  | *(unset = open, dev)*                | key for `POST`/`GET /api/clients*` (client onboarding) |
| `WEBHOOKS_API_KEY` | *(unset = open, dev)*                | key for `POST`/`GET`/`DELETE /api/webhooks*` |
| `KNOWN_COMPANIES`  | `company-acme,company-ops`           | valid company ids |
| `EMAIL_INBOXES`    | `jobs@company.com → company-acme`    | inbox → company routing map |
| `COMPANY_NAMES`    | acme/ops names                       | display names in metadata |
| `MAX_BODY_BYTES`   | `26214400` (25 MB)                   | request body cap |
| `MAX_PDF_BYTES`    | `15728640` (15 MB)                   | single CV cap |
| `MAX_BULK_BODY_BYTES` | `209715200` (200 MB)               | request body cap for `POST /api/ingest/bulk` |
| `MAX_BULK_ITEMS`   | `500`                                | max files/items per bulk-import request |
| `DATA_DIR`         | `server/data`                        | archive root |
| `CORS_ORIGIN`      | `*`                                  | allowed origin |
| `RETENTION_MONTHS` | `6` (default)                        | global default retention window; must be one of the allowed values or it is ignored |
| `RETENTION_MONTHS_<COMPANY>` | —                          | per-company override, e.g. `RETENTION_MONTHS_COMPANY_ACME=12` |
| `RETENTION_ALLOWED_MONTHS` | `6,12,24,48`                | permitted windows (months) |
| `RETENTION_SWEEP_INTERVAL_HOURS` | `24`                    | how often the background purge job runs |
| `RETENTION_SWEEP_ON_BOOT` | `true`                       | run a purge shortly after startup |
| `RETENTION_SWEEP_BOOT_DELAY_MS` | `15000`                 | delay before the first boot sweep |

## GDPR data retention & scheduled deletion

Implements EU GDPR **Art. 5(1)(e)** (storage limitation) and **Art. 17** (right to
erasure). This is a **backend-only** feature — no dashboard UI is involved.

**Retention windows** (requirement #2): `6`, `12`, `24`, or `48` months from the
candidate's reception date (`receivedAt`). **Default is strictly 6 months**
(requirement #3) when a client has not set a custom preference. Per-company
precedence: client preference (`PUT /api/retention/:companyId`) →
`RETENTION_MONTHS_<COMPANY>` env → `RETENTION_MONTHS` env → `6`.

**Scheduled purge** (requirement #1): a background job sweeps every
`RETENTION_SWEEP_INTERVAL_HOURS` (and once on boot) and permanently removes
expired records — both the stored PDF and the parsed personal record
(requirement #4).

```
GET  /api/retention                      → effective policies for all companies
GET  /api/retention/:companyId           → effective policy for one company
PUT  /api/retention/:companyId           → set client preference {months, note?}
POST /api/retention/sweep                → run purge now (body {dryRun?:true})
DELETE /api/archive/:companyId/candidates/:candidateId  → immediate erasure (Art. 17)
```

The sweep response reports `checked / purged / kept / skipped` per company and
the `purgedIds`. A **pseudonymous deletion log** is written to
`data/archive/<companyId>/deletions.jsonl` (JSONL) for Art. 5(2)
accountability — it records only candidate id, company, dates, retention window
and file digest: **never names, emails, or CV content**, so it does not itself
re-create personal data.

`dryRun:true` on the sweep reports what *would* be purged without deleting
anything — useful before tightening a window.

**Production notes:** run behind a TLS-terminating reverse proxy (this service
speaks plain HTTP); set both API keys; extend `EMAIL_INBOXES` for each inbox.
The built-in PDF text extractor handles typical text-based CVs; scanned/image
CVs are still archived (warning `PDF_TEXT_EMPTY`) with metadata from the
submission itself — swap in OCR or a fuller parser in `server/lib/pdf.js` if
needed (no other file depends on its internals).