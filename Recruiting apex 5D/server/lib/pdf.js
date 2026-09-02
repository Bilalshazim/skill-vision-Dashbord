'use strict';
/* Dependency-free PDF handling:
   1. Magic-byte validation (%PDF- header) and size checks.
   2. Lightweight text extraction: inflate FlateDecode streams with the
      built-in zlib module, then interpret the basic text-showing operators
      (Tj, TJ, ', Td/TD/T*, ET). Works for typical text-based CVs exported
      from Word/Docs. Scanned (image-only) CVs yield no text — the pipeline
      stores the record anyway with a warning, so ingestion never breaks.
   Limitations (documented in README): no font CMap/ToUnicode remapping, no
   hex strings <...>, no encrypted PDFs — swap in a fuller parser if needed. */

const zlib = require('zlib');
const { httpError } = require('./respond');
const config = require('./config');

function isPdf(buf) {
  return Boolean(buf) && buf.length >= 5 && buf.slice(0, 5).toString('latin1') === '%PDF-';
}

/* Decode PDF literal-string escapes (\n \r \t \( \) \\ octal, line cont.) and
   transparently handle UTF-16BE strings (\xfe\xff BOM). */
function decodePdfString(raw) {
  let s = raw.replace(
    /\\([nrtbf()\\]|[0-7]{1,3}|(\r\n|\n|\r))/g,
    (all, esc) => {
      if (esc === undefined || esc === '') return '';
      switch (esc[0]) {
        case 'n': return '\n';
        case 'r': return '\r';
        case 't': return '\t';
        case 'b': return '\b';
        case 'f': return '\f';
        case '(': return '(';
        case ')': return ')';
        case '\\': return '\\';
        default:
          if (/^[0-7]{1,3}$/.test(esc)) return String.fromCharCode(parseInt(esc, 8));
          return '';
      }
    }
  );
  if (s.startsWith('\xfe\xff')) {
    try {
      const be = Buffer.from(s.slice(2), 'latin1');
      if (be.length % 2 === 0) {
        be.swap16();
        s = be.toString('utf16le');
      }
    } catch (e) { /* keep latin1 fallback */ }
  }
  return s;
}

/* Convert page-content operators into plain text. */
function contentToText(content, maxChars) {
  const re = /\(((?:\\[\s\S]|[^\\()])*)\)|(T\*|Td|TD|ET|Tj|TJ)|\[((?:\\[\s\S]|[^\]])*)\]\s*TJ/g;
  let out = '';
  let m;
  while ((m = re.exec(content)) !== null && out.length < maxChars) {
    if (m[1] !== undefined) {
      out += decodePdfString(m[1]);
    } else if (m[2] !== undefined) {
      if (m[2] !== 'Tj' && m[2] !== 'TJ') out += '\n';
    } else if (m[3] !== undefined) {
      m[3].replace(/\(((?:\\[\s\S]|[^\\()])*)\)/g, (_, str) => {
        out += decodePdfString(str);
        return '';
      });
    }
  }
  return out
    .slice(0, maxChars)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* Extract text from all readable content streams in the PDF. */
function extractText(buf, maxChars) {
  const cap = maxChars || config.maxTextChars;
  const latin = buf.toString('latin1');
  const contents = [];
  const streamRe = /stream\r?\n?/g;
  let m;
  let total = 0;
  const MAX_TOTAL = 4 * 1024 * 1024; /* inflate cap — defensive against zip bombs */

  while ((m = streamRe.exec(latin)) !== null && total < MAX_TOTAL) {
    const start = m.index + m[0].length;
    const end = latin.indexOf('endstream', start);
    if (end === -1) break;
    streamRe.lastIndex = end;

    const chunk = buf.slice(start, end);
    let content = null;
    try {
      content = zlib.inflateSync(chunk);
    } catch (e) {
      /* Uncompressed stream: use as-is when it contains text operators. */
      if (/Tj|TJ/.test(chunk.toString('latin1'))) content = chunk;
    }
    if (content) {
      contents.push(content.toString('latin1'));
      total += content.length;
    }
  }

  const text = contentToText(contents.join('\n'), cap);
  const pages = (latin.match(/\/Type\s*\/Page[^s]/g) || []).length;

  return { text, pages, streams: contents.length };
}

/* Enforce that an uploaded file really is a PDF (magic bytes + size cap). */
function assertValidPdf(file) {
  if (!file || !Buffer.isBuffer(file.data) || file.data.length === 0) {
    throw httpError(400, 'CV_REQUIRED', 'No PDF CV file was provided');
  }
  if (file.data.length > config.maxPdfBytes) {
    throw httpError(413, 'PAYLOAD_TOO_LARGE',
      `CV exceeds the maximum size of ${config.maxPdfBytes} bytes`);
  }
  if (!isPdf(file.data)) {
    throw httpError(415, 'UNSUPPORTED_MEDIA_TYPE',
      'Only valid PDF files are accepted (file must start with %PDF-)');
  }
}

module.exports = { isPdf, extractText, assertValidPdf };