'use strict';
/* Routes:
     POST /api/clients            → register a new Recruiting client (self-service onboarding)
     GET  /api/clients            → list provisioned clients (admin/archive-key protected)
     GET  /api/clients/:companyId → one client's provisioning record
   Backend-only — no dashboard UI is involved (a sales/ops tool or a signup
   form on the marketing site would call POST /api/clients directly). */

const { created, ok, httpError } = require('../lib/respond');
const { readJson } = require('../lib/body');
const config = require('../lib/config');
const clients = require('../lib/clients');

async function handler(req, res, url) {
  const parts = url.pathname.replace(/\/+$/, '').split('/'); /* /api/clients[/:companyId] */
  const companyId = parts[3] || '';

  if (req.method === 'POST' && !companyId) {
    const payload = await readJson(req, config.maxBodyBytes);
    const record = clients.registerClient(payload);
    return created(res, {
      companyId: record.companyId,
      companyName: record.companyName,
      plan: record.plan,
      status: record.status,
      apiKey: record.apiKey,
      createdAt: record.createdAt,
      message: `Client "${record.companyName}" provisioned as "${record.companyId}" — ready to receive CVs immediately (no restart required).`,
      nextSteps: {
        ingest: ['POST /api/ingest/email', 'POST /api/ingest/webform', 'POST /api/ingest/ats', 'POST /api/ingest/bulk'],
        sandboxDashboard: `recruiting.html?sandbox=1&company=${encodeURIComponent(record.companyId)}`,
      },
    });
  }

  if (req.method === 'GET' && companyId) {
    const record = clients.getClient(companyId);
    if (!record) throw httpError(404, 'CLIENT_NOT_FOUND', `No client registered with id "${companyId}"`);
    const { apiKey, ...safe } = record;
    return ok(res, { client: safe });
  }

  if (req.method === 'GET' && !companyId) {
    const all = clients.listClients().map(({ apiKey, ...safe }) => safe);
    return ok(res, { clients: all, total: all.length });
  }

  throw httpError(405, 'METHOD_NOT_ALLOWED', `${req.method} is not allowed on ${url.pathname}`);
}

module.exports = { handler };
