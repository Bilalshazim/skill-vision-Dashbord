'use strict';
/* Route: POST /api/ingest/email
   Dedicated inbox integration (e.g. jobs@company.com). Supports the three
   practical delivery styles — no dashboard change required, point the mail
   flow at this endpoint:
     1. SendGrid Inbound Parse / Mailgun Routes  → multipart/form-data with
        `to`/`from`/`subject` fields and PDF attachment file parts
        (attachment1..N / attachment).
     2. Postmark-style inbound JSON               → application/json with
        {From, To, Subject, Attachments:[{Name, ContentType, Content(base64)}]}
     3. Raw RFC 822                               → content-type message/rfc822
        parsed by lib/mime.js (MTA/forwarding-service delivery).
   Destination company is resolved from the recipient address via
   EMAIL_INBOXES mapping, unless an explicit `companyId` field overrides it. */

const config = require('../lib/config');
const { created, httpError } = require('../lib/respond');
const { readBody, readJson, parseMultipart, getField } = require('../lib/body');
const { parseRawMime, parseAddress, isPdfData } = require('../lib/mime');
const { ingestCv } = require('../lib/candidates');

function str(v) { return typeof v === 'string' ? v.trim() : ''; }

const FILE_FIELDS = ['attachment', 'cv', 'resume', 'file', 'attachments'];

function pdfFiles(files) {
  return files.filter(
    (f) => isPdfData(f.data) || /\.pdf$/i.test(f.filename) || /pdf/i.test(f.contentType)
  );
}

/* Normalize any address list ("a@x.com, b@y.com", "Name <a@x.com>") → lowercase addresses. */
function addressesFrom(value) {
  if (!value || typeof value !== 'string') return [];
  return value.split(/[,;]+/)
    .map((s) => parseAddress(s).address)
    .filter(Boolean);
}

function resolveCompany({ addresses, explicit }) {
  if (explicit) return { companyId: explicit, inbox: explicit };
  for (const addr of addresses) {
    const route = config.emailInboxes[addr];
    if (route && route.companyId) return { companyId: route.companyId, inbox: addr };
  }
  return null;
}

function noRouteError(toList) {
  return httpError(422, 'UNKNOWN_RECIPIENT',
    `No inbox route matches recipient "${toList.join(', ') || 'unknown'}"`,
    { configuredInboxes: Object.keys(config.emailInboxes) });
}

async function handler(req, res) {
  const ctype = (req.headers['content-type'] || '').toLowerCase();

  /* ── Style 2: Postmark-like JSON inbound ── */
  if (ctype.includes('application/json')) {
    const payload = await readJson(req, config.maxBodyBytes);
    const from = parseAddress(payload.From || payload.from || '');
    const toList = addressesFrom(payload.To || payload.to || '');
    const attachments = (payload.Attachments || payload.attachments || [])
      .map((a) => ({
        field: 'attachment',
        filename: a.Name || a.name || 'cv.pdf',
        contentType: a.ContentType || a.contentType || 'application/pdf',
        data: Buffer.from(String(a.Content || a.content || ''), 'base64'),
      }));
    const pdfs = pdfFiles(attachments);
    if (!pdfs.length) {
      throw httpError(400, 'CV_REQUIRED', 'No PDF attachment found in the inbound email payload');
    }
    const route = resolveCompany({
      addresses: toList,
      explicit: payload.companyId || payload.companyid,
    });
    if (!route) return Promise.reject(noRouteError(toList));
    const result = await ingestCv({
      companyId: route.companyId,
      source: 'email',
      srcLabel: `Email · ${route.inbox || 'inbox'}`,
      provided: {
        name: payload.candidateName,
        email: from.address || '',
        emailDisplayName: from.name,
        role: payload.role,
        job: payload.job,
        consent: 'implicit',
        campaignId: str(payload.campaignId),
        sourceTag: str(payload.sourceTag),
      },
      file: { filename: pdfs[0].filename, contentType: pdfs[0].contentType, data: pdfs[0].data },
      meta: { subject: payload.Subject || payload.subject || '', bodyText: payload.TextBody || payload.textBody || '' },
    });
    return created(res, result);
  }

  /* ── Style 3: raw RFC 822 (also the default for unknown content types) ── */
  if (!ctype.includes('multipart/form-data')) {
    const raw = await readBody(req, config.maxBodyBytes);
    const email = parseRawMime(raw);
    const from = parseAddress(email.headers.from || '');
    const toList = addressesFrom(email.headers.to).concat(addressesFrom(email.headers.cc));
    const pdfs = pdfFiles(email.attachments);
    if (!pdfs.length) {
      throw httpError(400, 'CV_REQUIRED', 'No PDF attachment found in the email');
    }
    const route = resolveCompany({ addresses: toList });
    if (!route) throw noRouteError(toList);
    const subject = email.headers.subject || '';
    const result = await ingestCv({
      companyId: route.companyId,
      source: 'email',
      srcLabel: `Email · ${route.inbox || toList[0] || 'inbox'}`,
      provided: {
        email: from.address || '',
        emailDisplayName: from.name,
        consent: 'implicit',
        campaignId: str(email.headers['x-campaign-id'] || email.headers['campaignid'] || ''),
        sourceTag: str(email.headers['x-source-tag'] || email.headers['sourcetag'] || ''),
      },
      file: { filename: pdfs[0].filename, contentType: pdfs[0].contentType, data: pdfs[0].data },
      meta: { subject, bodyText: email.bodyText || '' },
    });
    return created(res, result);
  }

  /* ── Style 1: multipart webhook (SendGrid Inbound Parse / Mailgun Routes) ── */
  const buf = await readBody(req, config.maxBodyBytes);
  const { fields, files } = parseMultipart(buf, req.headers['content-type']);

  const toList = []
    .concat(addressesFrom(getField(fields, 'to')))
    .concat(addressesFrom(getField(fields, 'recipient')))
    .concat(addressesFrom(getField(fields, 'envelope_to')))
    .filter(Boolean);
  const from = parseAddress(getField(fields, 'from') || '');
  const subject = getField(fields, 'subject') || '';

  const pdfs = pdfFiles(
    files.filter((f) => FILE_FIELDS.includes(f.field) || f.field.startsWith('attachment'))
  );
  if (!pdfs.length) pdfs.push(...pdfFiles(files));
  if (!pdfs.length) {
    throw httpError(400, 'CV_REQUIRED', 'No PDF attachment found in the inbound email');
  }

  const route = resolveCompany({ addresses: toList, explicit: getField(fields, 'companyid') });
  if (!route) throw noRouteError(toList);

  const result = await ingestCv({
    companyId: route.companyId,
    source: 'email',
    srcLabel: `Email · ${route.inbox || toList[0] || 'inbox'}`,
    provided: {
      email: from.address || '',
      emailDisplayName: from.name,
      consent: 'implicit',
      name: getField(fields, 'candidatename'),
      role: getField(fields, 'role'),
      job: getField(fields, 'job'),
      campaignId: getField(fields, 'campaignid') || getField(fields, 'campaignId'),
      sourceTag: getField(fields, 'sourcetag') || getField(fields, 'sourceTag'),
    },
    file: { filename: pdfs[0].filename, contentType: pdfs[0].contentType, data: pdfs[0].data },
    meta: { subject, bodyText: getField(fields, 'text') || getField(fields, 'body-plain') || '' },
  });
  return created(res, result);
}

module.exports = { handler };