'use strict';
/* Route: POST /api/ingest/bulk — bulk import of an existing CV database into
   the per-company archive (requirement: "Support Bulk Historical Archive
   Sourcing"). Two shapes are accepted, mirroring the two single-CV entry
   formats already supported (webform PDFs, ATS JSON):

     1) multipart/form-data — a folder of PDFs at once:
          companyId (required), campaignId/sourceTag (optional, applied to
          every file), plus repeated file fields named cv/resume/file/
          attachment/curriculum/cvN — one per PDF. Each file may optionally
          be paired with a same-index "name"/"email"/"phone" field
          (nameN/emailN/phoneN) but none of that is required.

     2) application/json — an ATS-style bulk export:
          { "companyId": "company-acme", "source": "LegacyATS",
            "campaignId": "...", "sourceTag": "...",
            "items": [
              { "candidate": {"name":"...", "email":"..."},
                "file": {"filename":"cv.pdf", "contentBase64":"JVBERi0..."} },
              ...
            ] }

   Every item is run through the same ingestCv() pipeline as the single-CV
   routes (dedup, PDF validation, profile extraction) independently — one
   bad/duplicate/invalid item never aborts the rest of the batch. The
   response reports per-item outcome plus a summary count. */

const config = require('../lib/config');
const { created, httpError } = require('../lib/respond');
const { readBody, readJson, parseMultipart } = require('../lib/body');
const { ingestCv } = require('../lib/candidates');
const { isPdfData } = require('../lib/mime');

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function decodeBase64(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const cleaned = value.replace(/^data:[^;]+;base64,/i, '').replace(/\s+/g, '');
  if (!cleaned) return null;
  const buf = Buffer.from(cleaned, 'base64');
  return buf.length ? buf : null;
}

const NON_CV_FIELDS = new Set(['companyid', 'campaignid', 'campaign_id', 'sourcetag', 'source_tag', 'source', 'sourcenote']);

/* Every multipart file field is treated as one CV to import — a bulk drop of
   a whole folder submits one field per file (browsers repeat the same field
   name for a multi-file <input multiple>, which parseMultipart already
   collapses into per-part entries). */
function collectBulkFiles(files) {
  return files.filter((f) => !NON_CV_FIELDS.has(f.field));
}

async function handleMultipart(req, res, ctype) {
  const buf = await readBody(req, config.maxBulkBodyBytes);
  const { fields, files } = parseMultipart(buf, ctype);

  const companyId = str(Array.isArray(fields.companyid) ? fields.companyid[0] : fields.companyid);
  if (!companyId) {
    throw httpError(422, 'COMPANY_REQUIRED', 'Form field "companyId" is required to route the CVs to the right archive');
  }
  if (!config.isKnownCompany(companyId)) {
    throw httpError(422, 'UNKNOWN_COMPANY', `Unknown company id "${companyId}"`, { knownCompanies: config.knownCompanies });
  }
  const campaignId = str(Array.isArray(fields.campaignid) ? fields.campaignid[0] : fields.campaignid);
  const sourceTag = str(Array.isArray(fields.sourcetag) ? fields.sourcetag[0] : fields.sourcetag);

  const cvFiles = collectBulkFiles(files);
  if (!cvFiles.length) {
    throw httpError(400, 'CV_REQUIRED', 'No PDF files were provided in the bulk upload');
  }
  if (cvFiles.length > config.maxBulkItems) {
    throw httpError(413, 'PAYLOAD_TOO_LARGE',
      `Bulk import exceeds the ${config.maxBulkItems}-file limit per request (got ${cvFiles.length}) — split into smaller batches`);
  }

  const results = [];
  for (let i = 0; i < cvFiles.length; i++) {
    const file = cvFiles[i];
    results.push(await ingestOne({
      index: i,
      companyId,
      source: 'ats',
      srcLabel: 'Import massivo · archivio storico',
      provided: { campaignId, sourceTag },
      file: { filename: file.filename, contentType: file.contentType, data: file.data },
      requireIsPdf: true,
    }));
  }
  return finish(res, companyId, results);
}

async function handleJson(req, res) {
  const payload = await readJson(req, config.maxBulkBodyBytes);
  const companyId = str(payload.companyId || payload.company_id);
  if (!companyId) {
    throw httpError(422, 'COMPANY_REQUIRED', 'JSON field "companyId" is required to route the CVs to the right archive');
  }
  if (!config.isKnownCompany(companyId)) {
    throw httpError(422, 'UNKNOWN_COMPANY', `Unknown company id "${companyId}"`, { knownCompanies: config.knownCompanies });
  }
  const items = Array.isArray(payload.items) ? payload.items : null;
  if (!items || !items.length) {
    throw httpError(400, 'CV_REQUIRED', 'JSON field "items" (array) with at least one CV entry is required');
  }
  if (items.length > config.maxBulkItems) {
    throw httpError(413, 'PAYLOAD_TOO_LARGE',
      `Bulk import exceeds the ${config.maxBulkItems}-item limit per request (got ${items.length}) — split into smaller batches`);
  }
  const atsName = str(payload.source) || str(payload.ats) || str(payload.system) || 'Import massivo';
  const defaultCampaignId = str(payload.campaignId);
  const defaultSourceTag = str(payload.sourceTag);

  const results = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i] || {};
    const cand = item.candidate || {};
    const nested = item.file || item.cv || {};
    const b64 = nested.contentBase64 || nested.content || item.cvBase64 || item.cv_base64;
    const data = decodeBase64(b64);
    if (!data) {
      results.push({ index: i, ok: false, error: { code: 'CV_REQUIRED', message: 'No CV file provided for this item — set file.contentBase64' } });
      continue;
    }
    results.push(await ingestOne({
      index: i,
      companyId,
      source: 'ats',
      srcLabel: `Import massivo · ${atsName}`,
      provided: {
        name: str(cand.name) || str(item.candidateName),
        email: str(cand.email) || str(item.candidateEmail),
        phone: str(cand.phone) || str(item.candidatePhone),
        role: str(cand.role) || str(item.role) || str(item.position),
        job: str(cand.job) || str(item.job),
        consent: cand.consent != null ? cand.consent : item.consent,
        campaignId: str(cand.campaignId) || str(item.campaignId) || defaultCampaignId,
        sourceTag: str(cand.sourceTag) || str(item.sourceTag) || defaultSourceTag,
      },
      file: {
        filename: str(nested.filename || nested.name || item.cvFilename || 'cv.pdf'),
        contentType: str(nested.contentType) || 'application/pdf',
        data,
      },
      requireIsPdf: true,
    }));
  }
  return finish(res, companyId, results);
}

/* Runs one item through the shared ingestCv() pipeline, translating both
   thrown httpErrors and the PDF-magic check into a per-item failure entry
   instead of aborting the whole batch. */
async function ingestOne({ index, companyId, source, srcLabel, provided, file, requireIsPdf }) {
  try {
    if (requireIsPdf && !isPdfData(file.data)) {
      throw httpError(415, 'UNSUPPORTED_MEDIA_TYPE', `"${file.filename}" is not a valid PDF (must start with %PDF-)`);
    }
    const result = await ingestCv({ companyId, source, srcLabel, provided, file, meta: {} });
    return {
      index,
      ok: true,
      candidateId: result.candidateId,
      name: result.candidate ? result.candidate.name : undefined,
      duplicate: result.duplicate,
      warnings: result.warnings,
    };
  } catch (err) {
    return {
      index,
      ok: false,
      filename: file && file.filename,
      error: { code: (err && err.code) || 'INTERNAL_ERROR', message: (err && err.message) || 'Import failed for this item' },
    };
  }
}

function finish(res, companyId, results) {
  const imported = results.filter((r) => r.ok && !r.duplicate).length;
  const duplicates = results.filter((r) => r.ok && r.duplicate).length;
  const failed = results.filter((r) => !r.ok).length;
  return created(res, {
    companyId,
    total: results.length,
    imported,
    duplicates,
    failed,
    results,
  });
}

async function handler(req, res) {
  const ctype = req.headers['content-type'] || '';
  if (/multipart\/form-data/i.test(ctype)) return handleMultipart(req, res, ctype);
  if (ctype.includes('application/json')) return handleJson(req, res);
  throw httpError(415, 'UNSUPPORTED_MEDIA_TYPE',
    'Bulk ingest expects multipart/form-data (repeated PDF file fields) or application/json ({companyId, items:[...]})');
}

module.exports = { handler };
