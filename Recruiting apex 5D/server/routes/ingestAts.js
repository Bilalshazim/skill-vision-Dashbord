'use strict';
/* Route: POST /api/ingest/ats — Third-party ATS integration payloads (JSON).
   Accepts the PDF as base64 in either of two shapes:

     { "companyId": "company-acme", "source": "Greenhouse", "campaignId": "opening-senior-fe",
       "candidate": { "name": "...", "email": "...", "phone": "...",
                      "role": "...", "job": "...", "campaignId": "...", "sourceTag": "..." },
       "file": { "filename": "cv.pdf", "contentType": "application/pdf",
                 "contentBase64": "JVBERi0xLj..." } }

     { "companyId": "...", "cvBase64": "JVBERi0...", "cvFilename": "cv.pdf",
       "candidateName": "...", "candidateEmail": "..." }

   Data-URI prefixes in the base64 are tolerated.
   ATS imports default to sourceTag 'ARCHIVE' (bulk archive). An explicit
   candidate.sourceTag or campaignId can tag them for a selection campaign. */

const config = require('../lib/config');
const { created, httpError } = require('../lib/respond');
const { readJson } = require('../lib/body');
const { ingestCv } = require('../lib/candidates');
const { isPdfData } = require('../lib/mime');

function decodeBase64(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const cleaned = value.replace(/^data:[^;]+;base64,/i, '').replace(/\s+/g, '');
  if (!cleaned) return null;
  const buf = Buffer.from(cleaned, 'base64');
  return buf.length ? buf : null;
}

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

async function handler(req, res) {
  const ctype = req.headers['content-type'] || '';
  if (!ctype.includes('application/json')) {
    throw httpError(415, 'UNSUPPORTED_MEDIA_TYPE',
      'ATS ingest expects application/json');
  }

  const payload = await readJson(req, config.maxBodyBytes);

  const companyId = str(payload.companyId || payload.company_id);
  if (!companyId) {
    throw httpError(422, 'COMPANY_REQUIRED',
      'JSON field "companyId" is required to route the CV to the right archive');
  }
  if (!config.isKnownCompany(companyId)) {
    throw httpError(422, 'UNKNOWN_COMPANY',
      `Unknown company id "${companyId}"`,
      { knownCompanies: config.knownCompanies });
  }

  /* File: nested `file:{...}` (canonical) or flat `cvBase64` (tolerated). */
  const nested = payload.file || payload.cv || {};
  const b64 = nested.contentBase64 || nested.content || payload.cvBase64 || payload.cv_base64;
  const data = decodeBase64(b64);
  if (!data) {
    throw httpError(400, 'CV_REQUIRED',
      'No CV file provided — set file.contentBase64 (or cvBase64) with the base64-encoded PDF');
  }

  const filename = str(nested.filename || nested.name || payload.cvFilename || 'cv.pdf');
  const contentType = str(nested.contentType) || 'application/pdf';
  if (!isPdfData(data)) {
    throw httpError(415, 'UNSUPPORTED_MEDIA_TYPE',
      `Decoded file "${filename}" is not a valid PDF (must start with %PDF-)`);
  }

  const cand = payload.candidate || {};
  const atsName = str(payload.source) || str(payload.ats) || str(payload.system) || 'Integrazione ATS';

const result = await ingestCv({
    companyId,
    source: 'ats',
    srcLabel: `ATS · ${atsName}`,
    provided: {
      name: str(cand.name) || str(payload.candidateName),
      email: str(cand.email) || str(payload.candidateEmail),
      phone: str(cand.phone) || str(payload.candidatePhone),
      role: str(cand.role) || str(payload.role) || str(payload.position),
      job: str(cand.job) || str(payload.job),
      consent: cand.consent != null ? cand.consent : payload.consent,
      campaignId: str(cand.campaignId) || str(payload.campaignId),
      sourceTag: str(cand.sourceTag),
    },
    file: { filename, contentType, data },
    meta: { subject: '', bodyText: str(payload.note) || str(payload.coverLetter) },
  });

  return created(res, result);
}

module.exports = { handler };