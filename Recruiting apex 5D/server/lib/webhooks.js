'use strict';
/* Outbound webhook dispatch — the "push" half of bi-directional ATS sync.
   Inbound (ATS → SkillVision) is already covered by /api/ingest/ats and
   /api/ingest/bulk (lib/candidates.js). This module lets a client's ATS
   register a URL to be notified when something changes on the SkillVision
   side, so status stays in sync without the ATS having to poll:
     candidate.created         — a new CV landed in the archive
     candidate.duplicate       — a resubmission updated an existing record
     candidate.status_changed  — a recruiter moved a candidate's status
     candidate.deleted         — GDPR erasure (retention sweep or Art. 17)
   Subscriptions are stored per company in data/archive/<companyId>/webhooks.json
   (co-located with that company's own data, like retention's deletions.jsonl).
   Delivery is fire-and-forget with a bounded number of retries; failures are
   logged but never throw back into the caller's request (ingest/status
   update must succeed even if every subscriber URL is down). */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const archive = require('./archive');

const EVENTS = ['candidate.created', 'candidate.duplicate', 'candidate.status_changed', 'candidate.deleted'];
const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 8000;

function fileFor(companyId) {
  return path.join(archive.companyDir(companyId), 'webhooks.json');
}

function readAll(companyId) {
  try {
    const parsed = JSON.parse(fs.readFileSync(fileFor(companyId), 'utf8'));
    return Array.isArray(parsed && parsed.webhooks) ? parsed.webhooks : [];
  } catch (e) {
    return [];
  }
}

function writeAll(companyId, webhooks) {
  const dir = archive.companyDir(companyId);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${fileFor(companyId)}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify({ updatedAt: new Date().toISOString(), webhooks }, null, 2));
  fs.renameSync(tmp, fileFor(companyId));
}

function register(companyId, { url, events, secret }) {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    const err = new Error('"url" must be an absolute http(s) URL');
    err.status = 422; err.code = 'INVALID_WEBHOOK_URL';
    throw err;
  }
  const evList = Array.isArray(events) && events.length ? events.filter((e) => EVENTS.includes(e) || e === '*') : ['*'];
  if (!evList.length) {
    const err = new Error(`"events" must include at least one of: ${EVENTS.join(', ')}, or "*"`);
    err.status = 422; err.code = 'INVALID_WEBHOOK_EVENTS';
    throw err;
  }
  const webhooks = readAll(companyId);
  const record = {
    id: 'wh-' + crypto.randomBytes(6).toString('hex'),
    url,
    events: evList,
    secret: typeof secret === 'string' && secret ? secret : null,
    createdAt: new Date().toISOString(),
  };
  webhooks.push(record);
  writeAll(companyId, webhooks);
  const { secret: _s, ...safe } = record;
  return safe;
}

function list(companyId) {
  return readAll(companyId).map(({ secret, ...safe }) => safe);
}

function remove(companyId, id) {
  const webhooks = readAll(companyId);
  const next = webhooks.filter((w) => w.id !== id);
  if (next.length === webhooks.length) return false;
  writeAll(companyId, next);
  return true;
}

/* POST `body` to `url`; resolves {ok, status} — never rejects (caller treats
   network failure the same as a non-2xx response: log and move on). */
function postOnce(url, body, headers) {
  return new Promise((resolve) => {
    let target;
    try { target = new URL(url); } catch (e) { return resolve({ ok: false, error: 'invalid URL' }); }
    const lib = target.protocol === 'http:' ? http : https;
    const req = lib.request(target, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, headers),
      timeout: TIMEOUT_MS,
    }, (res) => {
      res.resume(); /* drain, we don't need the body */
      resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    req.write(body);
    req.end();
  });
}

/* Fire an event to every subscriber of `companyId` that opted into it (or
   "*"). Fire-and-forget from the caller's perspective — this function's
   own promise can be ignored; it never throws. */
async function dispatch(companyId, eventName, payload) {
  if (!EVENTS.includes(eventName)) return;
  const subs = readAll(companyId).filter((w) => w.events.includes('*') || w.events.includes(eventName));
  if (!subs.length) return;

  const envelope = { event: eventName, companyId, sentAt: new Date().toISOString(), data: payload };
  const body = JSON.stringify(envelope);

  await Promise.all(subs.map(async (sub) => {
    const headers = { 'X-SkillVision-Event': eventName, 'X-SkillVision-Delivery': crypto.randomBytes(8).toString('hex') };
    if (sub.secret) {
      headers['X-SkillVision-Signature'] = 'sha256=' + crypto.createHmac('sha256', sub.secret).update(body).digest('hex');
    }
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const result = await postOnce(sub.url, body, headers);
      if (result.ok) return;
      if (attempt === MAX_ATTEMPTS) {
        console.warn(`[webhooks] delivery failed for ${companyId} -> ${sub.url} (${eventName}): ${result.error || 'HTTP ' + result.status}`);
      } else {
        await new Promise((r) => setTimeout(r, 300 * attempt));
      }
    }
  }));
}

module.exports = { EVENTS, register, list, remove, dispatch };
