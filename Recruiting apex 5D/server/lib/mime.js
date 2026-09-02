'use strict';
/* Minimal RFC 822 / MIME parser for the dedicated-inbox integration.
   Handles the "raw MIME" delivery style (e.g. an MTA or forwarding service
   POSTing the original email as message/rfc822) and extracts:
     - headers (From / To / Subject, unfolded)
     - PDF attachments (application/pdf, *.pdf or %PDF magic sniff)
     - the first text/plain body (used as a secondary metadata source)
   Provider multipart webhooks (SendGrid/Mailgun) don't need this — they are
   parsed as regular multipart/form-data in the email route. */

const { httpError } = require('./respond');

function isPdfData(buf) {
  return buf && buf.length >= 5 && buf.slice(0, 5).toString('latin1') === '%PDF-';
}

/* Split a header block into a lowercase-keyed map, unfolding continuations. */
function parseHeaders(headerText) {
  const lines = headerText.split(/\r?\n/);
  const unfolded = [];
  lines.forEach((line) => {
    if (/^[ \t]/.test(line) && unfolded.length) {
      unfolded[unfolded.length - 1] += ' ' + line.trim();
    } else {
      unfolded.push(line);
    }
  });
  const headers = {};
  unfolded.forEach((line) => {
    const i = line.indexOf(':');
    if (i > 0) {
      headers[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
    }
  });
  return headers;
}

/* Decode Content-Transfer-Encoding into raw bytes. */
function decodeBody(buf, cte) {
  const enc = (cte || '').toLowerCase();
  if (enc.includes('base64')) {
    const clean = buf.toString('latin1').replace(/[^A-Za-z0-9+/=]/g, '');
    return Buffer.from(clean, 'base64');
  }
  if (enc.includes('quoted-printable')) {
    const latin = buf.toString('latin1').replace(/=\r?\n/g, '');
    const bytes = [];
    for (let i = 0; i < latin.length; i++) {
      if (latin[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(latin.substr(i + 1, 2))) {
        bytes.push(parseInt(latin.substr(i + 1, 2), 16));
        i += 2;
      } else {
        bytes.push(latin.charCodeAt(i) & 0xff);
      }
    }
    return Buffer.from(bytes);
  }
  return buf; /* 7bit / 8bit / binary */
}

function filenameFromHeaders(headers) {
  const cd = headers['content-disposition'] || '';
  let m = /filename\*=(?:utf-8'')?"?([^";\r\n]+)"?/i.exec(cd);
  if (m) {
    try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
  }
  m = /filename="([^"]*)"/i.exec(cd);
  if (m) return m[1];
  m = /filename=([^;\r\n]+)/i.exec(cd);
  return m ? m[1].trim() : '';
}

function classifyPart(headers, data, out, depth) {
  const ctype = (headers['content-type'] || '').toLowerCase();
  const filename = filenameFromHeaders(headers);

  if (/^multipart\//i.test(ctype)) {
    const m = /boundary="?([^";]+)"?/i.exec(headers['content-type'] || '');
    if (m && depth < 5) {
      walkMultipart(data, m[1], out, depth + 1);
    }
    return;
  }

  /* Decode the transfer encoding FIRST (base64/quoted-printable), then
     classify — PDF magic sniffing must run on the decoded bytes. */
  const decoded = decodeBody(data, headers['content-transfer-encoding']);

  if (isPdfData(decoded) || /pdf/i.test(ctype) || /\.pdf$/i.test(filename)) {
    out.attachments.push({
      filename: filename || 'cv.pdf',
      contentType: headers['content-type'] || 'application/pdf',
      data: decoded,
    });
  } else if (/^text\/plain/i.test(ctype)) {
    out.bodyText = out.bodyText || decoded.toString('utf8');
  }
}

function walkMultipart(buf, boundary, out, depth) {
  const bBuf = Buffer.from('--' + boundary);
  let idx = buf.indexOf(bBuf);
  while (idx !== -1) {
    const tail = buf.slice(idx + bBuf.length, idx + bBuf.length + 2).toString('latin1');
    if (tail === '--') break;
    const lineEnd = buf.indexOf('\n', idx);
    if (lineEnd === -1) break;
    const headStart = lineEnd + 1;
    const sep = buf.indexOf('\r\n\r\n', headStart) !== -1
      ? buf.indexOf('\r\n\r\n', headStart)
      : buf.indexOf('\n\n', headStart);
    if (sep === -1) break;
    const sepLen = buf[sep] === 0x0d ? 4 : 2;
    const rawHeaders = buf.slice(headStart, sep).toString('utf8');
    const next = buf.indexOf(bBuf, sep + sepLen);
    if (next === -1) break;
    const bodyStart = sep + sepLen;
    const bodyEnd = Math.max(bodyStart, next - 2);
    const headers = parseHeaders(rawHeaders);
    classifyPart(headers, buf.slice(bodyStart, bodyEnd), out, depth);
    idx = next;
  }
}

/* "Mario Rossi" <mario@x.com>  |  mario@x.com  ->  { name, address } */
function parseAddress(value) {
  const v = (value || '').trim();
  if (!v) return { name: '', address: '' };
  const angled = /^"?([^"]*)"?\s*<([^>]+)>$/.exec(v);
  if (angled) return { name: angled[1].trim(), address: angled[2].trim().toLowerCase() };
  const first = v.split(',')[0].trim();
  return { name: '', address: first.toLowerCase() };
}

/* Parse a full raw email. Throws only on totally non-MIME input. */
function parseRawMime(buf) {
  let sepIdx = buf.indexOf('\r\n\r\n');
  let sepLen = 4;
  const alt = buf.indexOf('\n\n');
  if (sepIdx === -1 || (alt !== -1 && alt < sepIdx)) {
    sepIdx = alt;
    sepLen = 2;
  }
  if (sepIdx === -1) {
    throw httpError(400, 'MALFORMED_EMAIL', 'Payload does not look like an RFC 822 email');
  }

  const headers = parseHeaders(buf.slice(0, sepIdx).toString('utf8'));
  const body = buf.slice(sepIdx + sepLen);
  const out = { headers, attachments: [], bodyText: '' };
  const ctype = headers['content-type'] || '';

  const m = /boundary="?([^";]+)"?/i.exec(ctype);
  if (/^multipart\//i.test(ctype) && m) {
    walkMultipart(body, m[1], out, 0);
  } else {
    classifyPart(headers, body, out, 0);
  }
  return out;
}

module.exports = { parseRawMime, parseAddress, isPdfData, decodeBody };