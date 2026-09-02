'use strict';
/* Route: POST /api/prescreen
   Pre-screening query over the CV archive(s). Body:
     { "prompt": "candidati con almeno 3 anni di esperienza, laurea magistrale, madrelingua inglese",
       "companyId": "company-acme" (optional — omit to screen every archive),
       "campaignId": "opening-senior-fe" (optional — selection campaign for data isolation),
       "sourceTag": "ARCHIVE" | "NEW_APPLICANT" | "BOTH" (optional — default BOTH),
       "criteria": { minYears, degree, nativeLanguages[], keywordsAll[], keywordsAny[], strict } (optional overrides) }
   Dual-mode querying: when sourceTag or campaignId is provided, the engine uses
     archive.query() to filter by provenance tag (ARCHIVE = bulk imports,
     NEW_APPLICANT = recently received for a specific job posting) and/or
     campaignId (strict per-campaign data isolation — NEW_APPLICANT candidates
     only match their own campaign; ARCHIVE candidates are shared).
   For each record missing a screening profile, the stored PDF is re-read and
   enriched once (cached into the archive). Returns matches with per-criterion
   check badges, contactability status, and the sourceTag of each match. */

const config = require('../lib/config');
const { ok, httpError } = require('../lib/respond');
const { readJson } = require('../lib/body');
const archive = require('../lib/archive');
const { extractText } = require('../lib/pdf');
const { deriveProfileFromText } = require('../lib/candidates');
const prescreen = require('../lib/prescreen');

/* Lazy enrichment: derive + persist a screening profile from the stored PDF. */
function ensureProfile(companyId, record) {
  if (record.profile) return record;
  try {
    const storedPath = record.file && record.file.storedPath;
    if (!storedPath) return record;
    const buf = archive.fileRead(companyId, storedPath);
    if (!buf) return record;
    const { text } = extractText(buf, config.maxTextChars);
    const profile = deriveProfileFromText(text);
    if (profile) archive.enrich(companyId, record.id, { profile });
    return Object.assign({}, record, { profile });
  } catch (e) {
    return record; /* enrichment is best-effort — never fail the query */
  }
}

function str(v) { return typeof v === 'string' ? v.trim() : ''; }

async function handler(req, res) {
  const payload = await readJson(req, config.maxBodyBytes);
  const prompt = str(payload.prompt).slice(0, 2000);
  if (!prompt && !payload.criteria) {
    throw httpError(400, 'PROMPT_REQUIRED',
      'Provide a screening "prompt" (natural language) and/or an explicit "criteria" object');
  }

  const criteria = Object.assign({}, prescreen.parseScreeningPrompt(prompt), payload.criteria || {});
  if (criteria.strict === 'true') criteria.strict = true;
  criteria.strict = criteria.strict === true;

  let companyId = str(payload.companyId) || str(criteria.companyId);
  if (companyId && !config.isKnownCompany(companyId)) {
    throw httpError(422, 'UNKNOWN_COMPANY',
      `Unknown company id "${companyId}"`,
      { knownCompanies: config.knownCompanies });
  }

  /* Dual-mode querying support (requirement: ARCHIVE vs NEW_APPLICANT).
     - sourceTag: 'ARCHIVE' | 'NEW_APPLICANT' | 'BOTH' (or omitted → BOTH)
     - campaignId: selection-campaign / job-posting identifier for strict
       per-campaign data isolation */
  const rawSourceTag = str(payload.sourceTag);
  const campaignId = str(payload.campaignId) || str(criteria.campaignId);
  const sourceTag = (rawSourceTag === 'BOTH' || !rawSourceTag) ? null : rawSourceTag;
  const queryActive = Boolean(sourceTag || campaignId);

  const companyIds = companyId ? [companyId]
    : archive.list().map((a) => a.companyId);

  const matches = [];
  let evaluated = 0;
  const companies = [];

  companyIds.forEach((cid) => {
    const archObj = queryActive
      ? archive.query(cid, { sourceTag, campaignId: campaignId || null })
      : archive.get(cid);
    if (!archObj) return;
    companies.push(cid);
    (archObj.candidates || []).forEach((rec) => {
      evaluated += 1;
      const enriched = ensureProfile(cid, rec);
      const result = prescreen.evaluateCandidate(enriched, criteria);
      if (!result.pass) return;
      const contact = prescreen.contactStatus(enriched);
      matches.push({
        id: rec.id,
        name: rec.name,
        role: rec.role || '',
        job: rec.job || '',
        companyId: cid,
        companyName: rec.companyName || config.companyName(cid),
        src: rec.src || '',
        source: rec.source || '',
        sourceTag: rec.sourceTag || 'ARCHIVE',          /* ARCHIVE | NEW_APPLICANT */
        campaignId: rec.campaignId || '',
        icv: rec.icv != null ? rec.icv : null,
        email: rec.email || '',
        phone: rec.phone || '',
        checks: result.checks,
        unknownCount: result.unknownCount,
        contactable: contact.contactable,
        contactChannels: contact.channels,
        consent: contact.consent,
      });
    });
  });

  /* Fully-verified candidates first, then by ICV. */
  matches.sort((a, b) => a.unknownCount - b.unknownCount || ((b.icv || 0) - (a.icv || 0)));

  return ok(res, {
    criteria,
    companies,
    evaluated,
    total: matches.length,
    sourceTag: rawSourceTag || 'BOTH',
    campaignId: campaignId || '',
    matches,
  });
}

module.exports = { handler };