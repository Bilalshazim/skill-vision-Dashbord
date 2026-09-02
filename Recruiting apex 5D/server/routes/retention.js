'use strict';
/* Routes:
     GET  /api/retention                      → effective policies (all companies)
     GET  /api/retention/:companyId           → effective policy for one company
     PUT  /api/retention/:companyId           → set client preference {months, note?}
                                                (only 6/12/24/48 accepted; default 6)
     POST /api/retention/sweep                → run the purge sweep now
                                                body {dryRun?:true}
     DELETE /api/archive/:cid/candidates/:id  → immediate erasure (GDPR Art. 17),
                                                handled by purgeCandidateHandler
   Backend-only — the dashboard UI is not involved. */

const config = require('../lib/config');
const { ok, httpError } = require('../lib/respond');
const { readJson } = require('../lib/body');
const archive = require('../lib/archive');
const retention = require('../lib/retention');

function str(v) { return typeof v === 'string' ? v.trim() : ''; }

function requireKnown(companyId) {
  if (!config.isKnownCompany(companyId)) {
    throw httpError(422, 'UNKNOWN_COMPANY',
      `Unknown company id "${companyId || ''}"`,
      { knownCompanies: config.knownCompanies });
  }
}

async function handler(req, res, url) {
  const parts = url.pathname.replace(/\/+$/, '').split('/'); /* /api/retention[/:id][/sweep] */
  const tail = parts[3] || '';
  const companyId = parts[3] && parts[3] !== 'sweep' ? parts[3] : '';
  const method = req.method;

  /* POST /api/retention/sweep — manual/dry-run sweep (external cron friendly). */
  if (tail === 'sweep') {
    if (method !== 'POST') {
      throw httpError(405, 'METHOD_NOT_ALLOWED', `${method} is not allowed on ${url.pathname} (use POST)`);
    }
    const body = await readJson(req, config.maxBodyBytes).catch(() => ({}));
    const summary = await retention.sweep({ dryRun: body && body.dryRun === true });
    return ok(res, { sweep: summary });
  }

  /* PUT /api/retention/:companyId — configure client preference. */
  if (companyId && method === 'PUT') {
    const payload = await readJson(req, config.maxBodyBytes);
    const policy = retention.setRetention(companyId, payload.months, {
      note: payload.note,
      updatedBy: str(payload.updatedBy) || 'api',
    });
    return ok(res, {
      policy,
      message: `Retention window for ${companyId} set to ${policy.months} months from reception`,
    });
  }

  /* GET /api/retention/:companyId — effective policy. */
  if (companyId && method === 'GET') {
    requireKnown(companyId);
    return ok(res, { policy: retention.getRetention(companyId) });
  }

  /* GET /api/retention — all effective policies. */
  if (method === 'GET') {
    return ok(res, {
      defaultMonths: config.retention.defaultMonths,
      allowedMonths: config.retention.allowedMonths,
      sweepIntervalHours: config.retention.sweepIntervalHours,
      companies: retention.listRetention(),
    });
  }

  throw httpError(405, 'METHOD_NOT_ALLOWED', `${method} is not allowed on ${url.pathname}`);
}

/* DELETE /api/archive/:companyId/candidates/:candidateId
   Immediate permanent erasure (GDPR Art. 17 right to erasure), independent
   of the retention window. Permanently removes the CV file and the parsed
   personal record, and writes the pseudonymous deletion log entry. */
async function purgeCandidateHandler(req, res, url) {
  if (req.method !== 'DELETE') {
    throw httpError(405, 'METHOD_NOT_ALLOWED', `${req.method} is not allowed on ${url.pathname} (use DELETE)`);
  }
  const parts = url.pathname.replace(/\/+$/, '').split('/');
  /* /api/archive/:companyId/candidates/:candidateId */
  const companyId = parts[3] || '';
  const candidateId = parts[5] || '';
  requireKnown(companyId);

  const arch = archive.get(companyId);
  if (!arch) throw httpError(404, 'ARCHIVE_NOT_FOUND', `No archive exists for "${companyId}"`);
  const record = (arch.candidates || []).find((c) => c.id === candidateId);
  if (!record) {
    throw httpError(404, 'CANDIDATE_NOT_FOUND',
      `Candidate "${candidateId}" not found in the archive of "${companyId}"`);
  }

  const result = await retention.purgeCandidate(companyId, record, 'erasure_request', false, null);
  return ok(res, {
    purged: result.purged,
    candidateId,
    companyId,
    filesDeleted: result.deletedFiles,
    basis: 'GDPR Art. 17 — right to erasure (immediate request)',
  });
}

module.exports = { handler, purgeCandidateHandler };