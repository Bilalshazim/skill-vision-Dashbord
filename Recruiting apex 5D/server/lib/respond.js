'use strict';
/* Standardized JSON envelopes for EVERY response (requirement #3):
     success: { "ok": true,  "data": { ... } }
     error:   { "ok": false, "error": { "code": "...", "message": "...", "details": ... } }
   plus an HTTP-error factory used across the service. */

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function ok(res, data, meta) {
  send(res, 200, { ok: true, data: data || {}, meta: meta || undefined });
}

function created(res, data) {
  send(res, 201, { ok: true, data: data || {} });
}

function fail(res, status, code, message, details) {
  send(res, status, {
    ok: false,
    error: { code, message, details: details || undefined },
  });
}

/* Error object carrying an HTTP status + stable machine code. Thrown anywhere
   in the pipeline; server.js turns it into the standardized envelope. */
function httpError(status, code, message, details) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  if (details !== undefined) err.details = details;
  return err;
}

module.exports = { send, ok, created, fail, httpError };