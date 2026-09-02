'use strict';
/* SkillVision — CV ingestion service (backend only).
   Accepts CV PDFs from three entry sources and archives them per company:
     POST /api/ingest/email    dedicated inbox (SendGrid/Mailgun webhook,
                               Postmark JSON, or raw RFC 822)
     POST /api/ingest/webform  corporate website application form (multipart)
     POST /api/ingest/ats      third-party ATS JSON payloads (base64 PDF)
     GET  /api/archive[/:id]   read-only archive access (verification/sync)
     GET  /healthz             liveness probe
   Zero npm dependencies — plain node:http. The SkillVision dashboard pages
   are untouched; this service only produces archive data compatible with
   the dashboard's candidate model. */

const http = require('http');
const config = require('./lib/config');
const { ok, fail, httpError } = require('./lib/respond');
const ingestEmail = require('./routes/ingestEmail');
const ingestWebform = require('./routes/ingestWebform');
const ingestAts = require('./routes/ingestAts');
const ingestBulk = require('./routes/ingestBulk');
const archiveRead = require('./routes/archiveRead');
const prescreen = require('./routes/prescreen');
const retention = require('./routes/retention');
const clients = require('./routes/clients');
const webhooksRoute = require('./routes/webhooks');
const candidateStatus = require('./routes/candidateStatus');

/* ── Routing table ───────────────────────────────────────────────────── */
const ROUTES = {
  'POST /api/ingest/email': ingestEmail.handler,
  'POST /api/ingest/webform': ingestWebform.handler,
  'POST /api/ingest/ats': ingestAts.handler,
  'POST /api/ingest/bulk': ingestBulk.handler,
  'POST /api/prescreen': prescreen.handler,
  'POST /api/retention/sweep': retention.handler,
};

function routeFor(method, pathname) {
  return {
    handler: ROUTES[`${method} ${pathname}`],
    pathExists: Object.keys(ROUTES).some((k) => k.split(' ')[1] === pathname)
      || pathname.startsWith('/api/archive')
      || pathname.startsWith('/api/retention')
      || pathname.startsWith('/api/clients')
      || pathname.startsWith('/api/webhooks')
      || pathname === '/healthz'
      || pathname === '/',
  };
}

/* ── Auth (optional shared secrets) ──────────────────────────────────── */
function checkAuth(req, secret) {
  const header = req.headers['x-api-key'];
  if (header && header === secret) return true;
  const auth = req.headers.authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  return Boolean(m && m[1] === secret);
}

/* ── CORS (so the static dashboard could consume this API later without
      modification, and so cross-origin form posts fail loudly) ────────── */
function applyCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', config.corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/* ── Server ──────────────────────────────────────────────────────────── */
const server = http.createServer(async (req, res) => {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    /* Liveness + service info. */
    if (pathname === '/healthz' && req.method === 'GET') {
      return ok(res, {
        status: 'up',
        uptimeSeconds: Math.round(process.uptime()),
        knownCompanies: config.knownCompanies,
        inboxes: Object.keys(config.emailInboxes),
      });
    }
    if (pathname === '/' && req.method === 'GET') {
      return ok(res, {
        service: 'skillvision-cv-ingest',
        version: '1.0.0',
        endpoints: [
          'POST /api/ingest/email',
          'POST /api/ingest/webform',
          'POST /api/ingest/ats',
          'POST /api/ingest/bulk',
          'POST /api/prescreen',
          'GET  /api/archive/:companyId',
          'GET  /api/retention',
          'PUT  /api/retention/:companyId',
          'POST /api/retention/sweep',
          'DELETE /api/archive/:companyId/candidates/:candidateId',
          'PATCH /api/archive/:companyId/candidates/:candidateId',
          'POST /api/clients',
          'GET  /api/clients[/:companyId]',
          'POST /api/webhooks/:companyId',
          'GET  /api/webhooks/:companyId',
          'DELETE /api/webhooks/:companyId/:id',
          'GET  /healthz',
        ],
      });
    }

    /* Auth guards. */
    if (pathname.startsWith('/api/ingest')) {
      if (config.ingestApiKey && !checkAuth(req, config.ingestApiKey)) {
        throw httpError(401, 'UNAUTHORIZED',
          'Missing or invalid API key (send header "x-api-key" or "Authorization: Bearer")');
      }
    }
    if (pathname.startsWith('/api/archive') || pathname.startsWith('/api/prescreen') || pathname.startsWith('/api/retention')) {
      if (config.archiveApiKey && !checkAuth(req, config.archiveApiKey)) {
        throw httpError(401, 'UNAUTHORIZED',
          'Missing or invalid API key for archive/retention access');
      }
    }
    if (pathname.startsWith('/api/clients')) {
      if (config.clientsApiKey && !checkAuth(req, config.clientsApiKey)) {
        throw httpError(401, 'UNAUTHORIZED', 'Missing or invalid API key for client onboarding');
      }
    }
    if (pathname.startsWith('/api/webhooks')) {
      if (config.webhooksApiKey && !checkAuth(req, config.webhooksApiKey)) {
        throw httpError(401, 'UNAUTHORIZED', 'Missing or invalid API key for webhook management');
      }
    }

    const match = routeFor(req.method, pathname);

    if (pathname.startsWith('/api/archive') && /^\/api\/archive\/[^/]+\/candidates\/[^/]+$/.test(pathname) && req.method === 'PATCH') {
      return await candidateStatus.handler(req, res, url);
    }

    if (pathname.startsWith('/api/archive') && req.method === 'GET') {
      return await archiveRead.handler(req, res, url);
    }

    /* Retention: GET/DELETE /api/archive/:cid/candidates/:id (Art. 17 erasure). */
    if (pathname.startsWith('/api/archive') && req.method === 'DELETE') {
      return await retention.purgeCandidateHandler(req, res, url);
    }

    /* Retention: GET/PUT/POST /api/retention[/:companyId][/sweep]. */
    if (pathname.startsWith('/api/retention')) {
      return await retention.handler(req, res, url);
    }

    /* Client onboarding: POST/GET /api/clients[/:companyId]. */
    if (pathname.startsWith('/api/clients')) {
      return await clients.handler(req, res, url);
    }

    /* Outbound ATS webhooks: POST/GET/DELETE /api/webhooks/:companyId[/:id]. */
    if (pathname.startsWith('/api/webhooks')) {
      return await webhooksRoute.handler(req, res, url);
    }

    if (!match.handler) {
      if (match.pathExists) {
        throw httpError(405, 'METHOD_NOT_ALLOWED', `${req.method} is not allowed on ${pathname}`);
      }
      throw httpError(404, 'ROUTE_NOT_FOUND', `No route for ${req.method} ${pathname}`);
    }

    await match.handler(req, res, url);
  } catch (err) {
    /* Standardized JSON error envelope for every failure (requirement #3). */
    const status = err && err.status ? err.status : 500;
    const code = err && err.code ? err.code : 'INTERNAL_ERROR';
    const message = err && err.message ? err.message : 'Unexpected server error';
    if (status >= 500) console.error('[ingest] error:', err);
    if (!res.headersSent) {
      fail(res, status, code, message, err && err.details);
    } else {
      try { res.end(); } catch (e) { /* socket already gone */ }
    }
  }
});

server.listen(config.port, config.host, () => {
  const actualPort = server.address().port;
  console.log(`[ingest] SkillVision CV service listening on http://${config.host}:${actualPort}`);
  console.log(`[ingest] companies: ${config.knownCompanies.join(', ')} | inboxes: ${Object.keys(config.emailInboxes).join(', ')}`);
  console.log(`[ingest] auth: ${config.ingestApiKey ? 'INGEST_API_KEY set' : 'disabled (dev)'} | archive: ${config.archiveApiKey ? 'ARCHIVE_API_KEY set' : 'open (dev)'} | clients: ${config.clientsApiKey ? 'CLIENTS_API_KEY set' : 'open (dev)'} | webhooks: ${config.webhooksApiKey ? 'WEBHOOKS_API_KEY set' : 'open (dev)'}`);
  /* Automatic GDPR retention job (backend-only): purge expired CVs on an
     interval + on boot, using each company's effective window. */
  const retention = require('./lib/retention');
  retention.startScheduler();
});

/* Never crash on stray socket errors. */
server.on('clientError', (err, socket) => {
  if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

module.exports = server;