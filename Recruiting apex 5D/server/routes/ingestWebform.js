'use strict';
/* Route: POST /api/ingest/webform
   Corporate-website application form endpoint. The site's form posts
   multipart/form-data directly here (or via its own server proxy) — the
   SkillVision dashboard pages are not involved at all.
   Expected form fields:
     companyId (required)   e.g. company-acme
     cv / resume / file     the PDF CV (any of these field names)
     fullName, email, phone, role/position, job, note (optional) */

const config = require('../lib/config');
const { ok, created, httpError } = require('../lib/respond');
const { readBody, parseMultipart, getField } = require('../lib/body');
const { ingestCv } = require('../lib/candidates');
const { isPdfData } = require('../lib/mime');

const PREFERRED_FILE_FIELDS = ['cv', 'resume', 'file', 'attachment', 'curriculum'];

function pickPdfFile(files) {
  if (!files.length) return null;
  /* Prefer an explicitly named CV field, then any part that is really a PDF,
     then any *.pdf filename. */
  for (const name of PREFERRED_FILE_FIELDS) {
    const hit = files.find((f) => f.field === name);
    if (hit) return hit;
  }
  const byMagic = files.find((f) => isPdfData(f.data));
  if (byMagic) return byMagic;
  return files.find((f) => /\.pdf$/i.test(f.filename)) || null;
}

async function handler(req, res) {
  const ctype = req.headers['content-type'] || '';
  if (!/multipart\/form-data/i.test(ctype)) {
    throw httpError(415, 'UNSUPPORTED_MEDIA_TYPE',
      'Webform ingest expects multipart/form-data with a PDF file field');
  }

  const buf = await readBody(req, config.maxBodyBytes);
  const { fields, files } = parseMultipart(buf, ctype);

  const companyId = getField(fields, 'companyid');
  if (!companyId) {
    throw httpError(422, 'COMPANY_REQUIRED',
      'Form field "companyId" is required to route the CV to the right archive');
  }
  if (!config.isKnownCompany(companyId)) {
    throw httpError(422, 'UNKNOWN_COMPANY',
      `Unknown company id "${companyId}"`,
      { knownCompanies: config.knownCompanies });
  }

  const file = pickPdfFile(files);
  if (!file) {
    throw httpError(400, 'CV_REQUIRED', 'No PDF CV file was provided in the form');
  }
  if (!isPdfData(file.data)) {
    throw httpError(415, 'UNSUPPORTED_MEDIA_TYPE',
      `Attached file "${file.filename}" is not a valid PDF`);
  }

  const result = await ingestCv({
    companyId,
    source: 'webform',
    srcLabel: getField(fields, 'sourcenote') || 'Webform · sito corporate',
    provided: {
      name: getField(fields, 'fullname') || getField(fields, 'name'),
      email: getField(fields, 'email'),
      phone: getField(fields, 'phone') || getField(fields, 'tel'),
      role: getField(fields, 'role') || getField(fields, 'position'),
      job: getField(fields, 'job'),
      consent: getField(fields, 'consent') || getField(fields, 'privacy'),
      campaignId: getField(fields, 'campaignid') || getField(fields, 'campaignId'),
      sourceTag: getField(fields, 'sourcetag') || getField(fields, 'sourceTag'),
    },
    file: { filename: file.filename, contentType: file.contentType, data: file.data },
    meta: { subject: '', bodyText: getField(fields, 'note') || getField(fields, 'message') || '' },
  });

  return created(res, result);
}

module.exports = { handler };