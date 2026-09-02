'use strict';
/* Request-body helpers: buffered reading with hard size caps, JSON parsing
   and a dependency-free multipart/form-data parser sized for CV uploads and
   inbound-email webhooks (SendGrid Inbound Parse / Mailgun routes). */

const config = require('./config');
const { httpError } = require('./respond');

/* Read the full request body into a Buffer, enforcing a hard byte cap. */
function readBody(req, maxBytes) {
  const cap = maxBytes || config.maxBodyBytes;
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > cap) {
        reject(httpError(413, 'PAYLOAD_TOO_LARGE',
          `Request body exceeds the ${cap} byte limit`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err) =>
      reject(httpError(400, 'BAD_REQUEST', 'Failed to read request body: ' + err.message)));
  });
}

/* Parse a JSON body (used by the ATS integration route). */
async function readJson(req, maxBytes) {
  const buf = await readBody(req, maxBytes);
  if (!buf.length) {
    throw httpError(400, 'INVALID_JSON', 'Request body is empty — expected a JSON payload');
  }
  try {
    return JSON.parse(buf.toString('utf8'));
  } catch (e) {
    throw httpError(400, 'INVALID_JSON', 'Request body is not valid JSON', e.message);
  }
}

/* Decode a URI component defensively (form fields may be oddly encoded). */
function decodeField(value) {
  try {
    return decodeURIComponent(value);
  } catch (e) {
    return value;
  }
}

/* Match name="..." / filename="..." inside a Content-Disposition header,
   with a best-effort fallback for RFC 5987 filename*= UTF-8 encoding. */
function dispositionParam(header, param) {
  const plain = new RegExp(`${param}="([^"]*)"`, 'i').exec(header);
  if (plain) return decodeField(plain[1]);
  const star = new RegExp(`${param}\\*=utf-8''([^;\\r\\n]+)`, 'i').exec(header);
  if (star) return decodeField(star[1]);
  return undefined;
}

/* Minimal multipart/form-data parser.
   Returns:
     fields: { [lowercaseFieldName]: string | string[] }
     files:  [{ field, filename, contentType, data(Buffer) }]
   Repeated field names become arrays (repeated file fields are appended). */
function parseMultipart(buf, contentType) {
  const bMatch = /boundary=(?:"([^"]+)"|([^;,]+))/i.exec(contentType || '');
  if (!bMatch) {
    throw httpError(400, 'MALFORMED_MULTIPART',
      'Content-Type is multipart but no boundary parameter was found');
  }
  const boundary = '--' + (bMatch[1] || bMatch[2]).trim();
  const bBuf = Buffer.from(boundary);

  const fields = {};
  const files = [];

  let idx = buf.indexOf(bBuf);
  if (idx === -1) {
    throw httpError(400, 'MALFORMED_MULTIPART', 'Multipart boundary not found in body');
  }

  while (idx !== -1) {
    /* Closing delimiter? "--boundary--" */
    const tail = buf.slice(idx + bBuf.length, idx + bBuf.length + 2).toString('latin1');
    if (tail === '--') break;

    const lineEnd = buf.indexOf('\r\n', idx);
    if (lineEnd === -1) break;

    const headStart = lineEnd + 2;
    const headEnd = buf.indexOf('\r\n\r\n', headStart);
    if (headEnd === -1) break;

    const rawHeaders = buf.slice(headStart, headEnd).toString('utf8');
    const next = buf.indexOf(bBuf, headEnd + 4);
    if (next === -1) break;

    /* Part body sits between the blank line and the CRLF preceding the next
       boundary. Guard the empty-body edge case. */
    const bodyStart = headEnd + 4;
    const bodyEnd = Math.max(bodyStart, next - 2);
    const data = buf.slice(bodyStart, bodyEnd);

    const dispositionLine = rawHeaders.split(/\r?\n/)
      .find((l) => /^content-disposition:/i.test(l)) || '';
    const name = dispositionParam(dispositionLine, 'name');
    const filename = dispositionParam(dispositionLine, 'filename');
    const ctLine = rawHeaders.split(/\r?\n/)
      .find((l) => /^content-type:/i.test(l)) || '';
    const partCt = ctLine.split(':')[1] ? ctLine.split(':')[1].trim() : '';

    if (name) {
      if (filename !== undefined || /filename\*=/i.test(dispositionLine)) {
        files.push({
          field: name.toLowerCase(),
          filename: (filename || 'upload').replace(/[\r\n]/g, ''),
          contentType: partCt || 'application/octet-stream',
          data,
        });
      } else {
        const key = name.toLowerCase();
        const value = data.toString('utf8');
        if (Object.prototype.hasOwnProperty.call(fields, key)) {
          fields[key] = [].concat(fields[key], value);
        } else {
          fields[key] = value;
        }
      }
    }
    idx = next;
  }

  return { fields, files };
}

/* Return the last value of a form field (repeated fields become arrays). */
function getField(fields, name) {
  const v = fields[String(name).toLowerCase()];
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[v.length - 1] : v;
}

module.exports = { readBody, readJson, parseMultipart, getField, decodeField };