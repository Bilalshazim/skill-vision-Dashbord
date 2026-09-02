'use strict';
/* Read-only archive access (used for verification / downstream sync):
      GET /api/archive                          -> list company archives with counts
      GET /api/archive/:companyId               -> full candidate archive for one company
      GET /api/archive/:companyId?sourceTag=... -> dual-mode query (ARCHIVE vs NEW_APPLICANT)
      GET /api/archive/:companyId?campaignId=...-> per-campaign filtered view
    Optional ARCHIVE_API_KEY protects these endpoints. */

const config = require('../lib/config');
const { ok, httpError } = require('../lib/respond');
const archive = require('../lib/archive');

function str(v) { return typeof v === 'string' ? v.trim() : ''; }

/* Normalise the sourceTag query parameter: BOTH or empty -> null (no filter). */
function parseSourceTag(raw) {
  const v = str(raw);
  if (!v || v === 'BOTH' || v === 'both') return null;
  if (v === 'ARCHIVE' || v === 'NEW_APPLICANT') return v;
  return null; /* unrecognised value: backward-compatible no-filter */
}

async function handler(req, res, url) {
  const parts = url.pathname.replace(/\/+$/, '').split('/'); /* /api/archive/:id */
  const companyId = parts[3] ? parts[3].toLowerCase() : '';

  if (!companyId) {
    return ok(res, { archives: archive.list() });
  }

  if (!config.isKnownCompany(companyId)) {
    throw httpError(404, 'UNKNOWN_COMPANY',
      'Unknown company id "' + companyId + '"',
      { knownCompanies: config.knownCompanies });
  }

  /* Dual-mode query: when sourceTag or campaignId query params are present,
     delegate to archive.query() for ARCHIVE vs NEW_APPLICANT filtering with
     strict per-campaign data isolation. */
  const rawSourceTag = url.searchParams ? url.searchParams.get('sourceTag') : null;
  const campaignId = url.searchParams ? (url.searchParams.get('campaignId') || '') : '';
  const sourceTag = parseSourceTag(rawSourceTag);
  const filtered = Boolean(sourceTag || campaignId);

  const data = filtered
    ? archive.query(companyId, { sourceTag, campaignId: campaignId || null })
    : archive.get(companyId);

  if (!data) {
    throw httpError(404, 'ARCHIVE_NOT_FOUND',
      'No archive exists yet for company "' + companyId + '" — no CV has been ingested');
  }
  return ok(res, data);
}

module.exports = { handler };
