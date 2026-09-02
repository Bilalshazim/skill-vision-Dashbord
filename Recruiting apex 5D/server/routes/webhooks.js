'use strict';
/* Routes (webhook subscription management — the "push" half of ATS sync):
     POST   /api/webhooks/:companyId          → register a subscription {url, events?, secret?}
     GET    /api/webhooks/:companyId          → list subscriptions (secrets withheld)
     DELETE /api/webhooks/:companyId/:id      → remove a subscription
   Events fired: candidate.created, candidate.duplicate, candidate.status_changed,
   candidate.deleted — see lib/webhooks.js for the payload shape and the
   HMAC-SHA256 signing (X-SkillVision-Signature) applied when a secret is set. */

const config = require('../lib/config');
const { ok, created, httpError } = require('../lib/respond');
const { readJson } = require('../lib/body');
const webhooks = require('../lib/webhooks');

function requireKnown(companyId) {
  if (!config.isKnownCompany(companyId)) {
    throw httpError(422, 'UNKNOWN_COMPANY', `Unknown company id "${companyId || ''}"`,
      { knownCompanies: config.knownCompanies });
  }
}

async function handler(req, res, url) {
  const parts = url.pathname.replace(/\/+$/, '').split('/'); /* /api/webhooks/:companyId[/:id] */
  const companyId = parts[3] || '';
  const webhookId = parts[4] || '';

  if (!companyId) {
    throw httpError(422, 'COMPANY_REQUIRED', 'Path must include a companyId: /api/webhooks/:companyId');
  }
  requireKnown(companyId);

  if (req.method === 'POST' && !webhookId) {
    const payload = await readJson(req, config.maxBodyBytes);
    const record = webhooks.register(companyId, payload);
    return created(res, { webhook: record, availableEvents: webhooks.EVENTS });
  }

  if (req.method === 'GET' && !webhookId) {
    return ok(res, { companyId, webhooks: webhooks.list(companyId), availableEvents: webhooks.EVENTS });
  }

  if (req.method === 'DELETE' && webhookId) {
    const removed = webhooks.remove(companyId, webhookId);
    if (!removed) throw httpError(404, 'WEBHOOK_NOT_FOUND', `No webhook "${webhookId}" for company "${companyId}"`);
    return ok(res, { removed: true, id: webhookId });
  }

  throw httpError(405, 'METHOD_NOT_ALLOWED', `${req.method} is not allowed on ${url.pathname}`);
}

module.exports = { handler };
