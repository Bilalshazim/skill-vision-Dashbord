'use strict';
/* Route: PATCH /api/archive/:companyId/candidates/:candidateId
   Updates a candidate's recruiting status — the other "sync" direction an
   ATS integration needs: it already pushes CVs in (ingest routes) and pulls
   the archive (GET /api/archive), this is how a status change made in
   SkillVision (or by the ATS itself, calling back) propagates outward via
   the candidate.status_changed webhook (lib/webhooks.js). */

const config = require('../lib/config');
const { ok, httpError } = require('../lib/respond');
const { readJson } = require('../lib/body');
const archive = require('../lib/archive');
const webhooks = require('../lib/webhooks');

const STATUSES = ['new', 'contacted', 'screening', 'interviewing', 'offered', 'hired', 'rejected', 'withdrawn'];

async function handler(req, res, url) {
  if (req.method !== 'PATCH') {
    throw httpError(405, 'METHOD_NOT_ALLOWED', `${req.method} is not allowed on ${url.pathname} (use PATCH)`);
  }
  const parts = url.pathname.replace(/\/+$/, '').split('/'); /* /api/archive/:companyId/candidates/:candidateId */
  const companyId = parts[3] || '';
  const candidateId = parts[5] || '';

  if (!config.isKnownCompany(companyId)) {
    throw httpError(422, 'UNKNOWN_COMPANY', `Unknown company id "${companyId}"`, { knownCompanies: config.knownCompanies });
  }

  const payload = await readJson(req, config.maxBodyBytes);
  const status = typeof payload.status === 'string' ? payload.status.trim() : '';
  if (!STATUSES.includes(status)) {
    throw httpError(422, 'INVALID_STATUS', `"status" must be one of: ${STATUSES.join(', ')}`, { allowed: STATUSES });
  }
  const note = typeof payload.note === 'string' ? payload.note.slice(0, 500) : '';

  let previousStatus = null;
  const updated = await archive.mutate(companyId, (arch) => {
    const rec = (arch.candidates || []).find((c) => c.id === candidateId);
    if (!rec) return null;
    previousStatus = rec.status || 'new';
    if (previousStatus === status) return null; /* no-op: nothing changed, nothing to persist/dispatch */
    rec.status = status;
    rec.statusUpdatedAt = new Date().toISOString();
    rec.statusNote = note || rec.statusNote || '';
    return rec;
  });

  if (!updated && previousStatus === null) {
    throw httpError(404, 'CANDIDATE_NOT_FOUND', `Candidate "${candidateId}" not found in the archive of "${companyId}"`);
  }
  if (!updated) {
    /* Found but status was already the requested one — respond ok, no dispatch. */
    return ok(res, { candidateId, companyId, status, changed: false });
  }

  webhooks.dispatch(companyId, 'candidate.status_changed', {
    candidateId,
    companyId,
    previousStatus,
    status,
    note: note || undefined,
    name: updated.name,
  }).catch(() => {}); /* dispatch() already logs internally; never let it affect the response */

  return ok(res, { candidateId, companyId, status, previousStatus, changed: true });
}

module.exports = { handler, STATUSES };
