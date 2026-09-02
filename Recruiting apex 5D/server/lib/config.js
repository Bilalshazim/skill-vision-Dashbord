'use strict';
/* Central configuration for the CV ingestion service.
   Every value is overridable via environment variables so the same code can
   run in dev (default) and production (behind a reverse proxy). */

const path = require('path');

function envJson(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? v : fallback;
  } catch (e) {
    console.warn(`[config] ignoring invalid JSON in env var ${name}`);
    return fallback;
  }
}

function envList(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return list.length ? list : fallback;
}

function envInt(name, fallback) {
  const raw = parseInt(process.env[name], 10);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

const knownCompanies = envList('KNOWN_COMPANIES', ['company-acme', 'company-ops']);

const config = {
  port: envInt('PORT', 8787),
  host: process.env.HOST || '0.0.0.0',

  /* Shared secret for the three ingest endpoints. When set, callers must send
     header "x-api-key: <key>" (or "Authorization: Bearer <key>"). */
  ingestApiKey: process.env.INGEST_API_KEY || '',
  /* Separate key for reading archives back (GET /api/archive/:companyId). */
  archiveApiKey: process.env.ARCHIVE_API_KEY || '',
  /* Key for client onboarding (POST/GET /api/clients*) — a distinct privilege
     level from CV ingestion or archive reads, since it provisions tenants. */
  clientsApiKey: process.env.CLIENTS_API_KEY || '',
  /* Key for webhook subscription management (POST/GET/DELETE /api/webhooks*). */
  webhooksApiKey: process.env.WEBHOOKS_API_KEY || '',

  corsOrigin: process.env.CORS_ORIGIN || '*',

  /* Hard caps. Body cap >= PDF cap so multipart envelopes always fit. */
  maxBodyBytes: envInt('MAX_BODY_BYTES', 26214400), /* 25 MB */
  maxPdfBytes: envInt('MAX_PDF_BYTES', 15728640),   /* 15 MB */
  maxTextChars: envInt('MAX_TEXT_CHARS', 200000),

  /* Bulk historical-archive import (POST /api/ingest/bulk): a whole existing
     CV database can be pushed in one request, so it gets its own — larger —
     body cap and a per-request item cap so one call can't run forever. */
  maxBulkBodyBytes: envInt('MAX_BULK_BODY_BYTES', 209715200), /* 200 MB */
  maxBulkItems: envInt('MAX_BULK_ITEMS', 500),

  /* Archive root. Each company gets its own folder + JSON "database". */
  dataDir: process.env.DATA_DIR || path.join(__dirname, '..', 'data'),

  /* GDPR data retention (Art. 5(1)(e) storage limitation). Default window is
     strictly 6 months from reception; clients may configure 6/12/24/48. */
  retention: (() => {
    const allowed = envList('RETENTION_ALLOWED_MONTHS', [6, 12, 24, 48]).map(Number)
      .filter((n) => Number.isFinite(n) && n > 0);
    const rawDefault = parseInt(process.env.RETENTION_MONTHS, 10);
    const envDefaultMonths = Number.isFinite(rawDefault) && allowed.includes(rawDefault) ? rawDefault : null;
    const rawInterval = parseInt(process.env.RETENTION_SWEEP_INTERVAL_HOURS, 10);
    return {
      allowedMonths: allowed.length ? allowed : [6, 12, 24, 48],
      defaultMonths: envDefaultMonths || 6,
      envDefaultMonths,                       /* null when unset or not allowed */
      sweepIntervalHours: Number.isFinite(rawInterval) && rawInterval > 0 ? rawInterval : 24,
      sweepOnBoot: (process.env.RETENTION_SWEEP_ON_BOOT || 'true') !== 'false',
      bootDelayMs: parseInt(process.env.RETENTION_SWEEP_BOOT_DELAY_MS, 10) || 15000,
    };
  })(),

  knownCompanies,

  /* Dedicated inbox routing (requirement 1a): recipient address -> company.
     The email webhook resolves the destination company from the recipient.
     Override/extend with:
       EMAIL_INBOXES='{"talent@acme.com":{"companyId":"company-acme"},"jobs@ops.com":{"companyId":"company-ops"}}'
  */
  emailInboxes: Object.assign(
    { 'jobs@company.com': { companyId: 'company-acme' } },
    envJson('EMAIL_INBOXES', {})
  ),

  /* Friendly names used in archive metadata + responses. */
  companyNames: Object.assign(
    { 'company-acme': 'Acme Corp', 'company-ops': 'Northwind Ops' },
    envJson('COMPANY_NAMES', {})
  ),
};

/* A company is "known" if it's in the static KNOWN_COMPANIES env list OR was
   provisioned at runtime via POST /api/clients (lib/clients.js) — lazy
   require avoids a load-order cycle, since lib/clients.js reads
   config.dataDir. This is what makes onboarding a new client immediate:
   no env var edit or restart needed for their CVs to start landing. */
config.isKnownCompany = (id) => {
  if (typeof id !== 'string' || !id) return false;
  if (knownCompanies.includes(id)) return true;
  try { return require('./clients').isRegisteredCompany(id); } catch (e) { return false; }
};

config.companyName = (id) => {
  if (config.companyNames[id]) return config.companyNames[id];
  try {
    const name = require('./clients').companyNameFor(id);
    if (name) return name;
  } catch (e) { /* ignore */ }
  return id;
};

module.exports = config;