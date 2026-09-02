'use strict';
/* Client registration & onboarding (Recruiting module).
   Lets a new customer buying strictly the Recruiting dashboard be provisioned
   automatically — no manual edit of KNOWN_COMPANIES / restart required.
   Persisted as a single JSON file (data/clients.json) the same way retention
   preferences are (see lib/retention.js) — atomic writes, no external DB.

   config.isKnownCompany()/config.companyName() consult this store (via a
   lazy require to avoid a require() cycle, since this module itself reads
   config.dataDir) so a client registered through POST /api/clients is
   immediately usable by every ingest/prescreen/archive/retention route. */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { httpError } = require('./respond');

function dataDir() {
  return require('./config').dataDir;
}
function storeFile() {
  return path.join(dataDir(), 'clients.json');
}

function readAll() {
  try {
    const parsed = JSON.parse(fs.readFileSync(storeFile(), 'utf8'));
    return parsed && Array.isArray(parsed.clients) ? parsed.clients : [];
  } catch (e) {
    return [];
  }
}

function writeAll(clients) {
  fs.mkdirSync(dataDir(), { recursive: true });
  const payload = { updatedAt: new Date().toISOString(), clients };
  const tmp = `${storeFile()}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(payload, null, 2));
  fs.renameSync(tmp, storeFile());
}

/* ── Partita IVA (Italian VAT number) validation ─────────────────────────
   11 digits. Check digit (11th) is derived from the other 10 via the
   standard alternating-sum algorithm used by the Italian tax authority:
   odd positions (1st,3rd,...,9th, 1-indexed) summed as-is; even positions
   doubled, subtracting 9 if the result exceeds 9; check = (10 - total%10)%10. */
function isValidPartitaIva(raw) {
  const v = String(raw || '').trim();
  if (!/^\d{11}$/.test(v)) return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const d = v.charCodeAt(i) - 48;
    if (i % 2 === 0) {
      sum += d;
    } else {
      let doubled = d * 2;
      if (doubled > 9) doubled -= 9;
      sum += doubled;
    }
  }
  const check = (10 - (sum % 10)) % 10;
  return check === (v.charCodeAt(10) - 48);
}

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '') /* strip accents */
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'company';
}

function newCompanyId(companyName, existingIds) {
  const base = 'company-' + slugify(companyName);
  if (!existingIds.has(base)) return base;
  let n = 2;
  while (existingIds.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

function str(v) {
  return typeof v === 'string' ? v.trim() : '';
}

/* Register a new Recruiting-only client. Throws httpError on validation
   failure (422). Returns the persisted client record. */
function registerClient(payload) {
  const companyName = str(payload && payload.companyName);
  const partitaIva = str(payload && payload.partitaIva).replace(/\s+/g, '');
  const contactEmail = str(payload && payload.contactEmail);
  const contactName = str(payload && payload.contactName);
  const plan = str(payload && payload.plan) || 'recruiting';
  const notes = str(payload && payload.notes).slice(0, 500);

  if (!companyName) {
    throw httpError(422, 'COMPANY_NAME_REQUIRED', 'Field "companyName" is required');
  }
  if (!partitaIva) {
    throw httpError(422, 'PARTITA_IVA_REQUIRED', 'Field "partitaIva" (Italian VAT number) is required');
  }
  if (!isValidPartitaIva(partitaIva)) {
    throw httpError(422, 'INVALID_PARTITA_IVA',
      'Field "partitaIva" must be a valid 11-digit Italian VAT number (checksum failed)');
  }
  if (contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) {
    throw httpError(422, 'INVALID_CONTACT_EMAIL', 'Field "contactEmail" is not a valid email address');
  }

  const clients = readAll();
  const dup = clients.find((c) => c.partitaIva === partitaIva);
  if (dup) {
    throw httpError(409, 'CLIENT_ALREADY_REGISTERED',
      `A client with this Partita IVA is already registered as "${dup.companyId}"`,
      { companyId: dup.companyId });
  }

  const existingIds = new Set(clients.map((c) => c.companyId));
  require('./config').knownCompanies.forEach((id) => existingIds.add(id));
  const companyId = newCompanyId(companyName, existingIds);

  const record = {
    companyId,
    companyName,
    partitaIva,
    contactName: contactName || null,
    contactEmail: contactEmail || null,
    plan,               /* 'recruiting' — this module only; kept for forward-compat with a future combined plan */
    notes: notes || '',
    status: 'active',
    apiKey: crypto.randomBytes(24).toString('hex'), /* per-client key, e.g. for scoping future ATS/webhook auth */
    createdAt: new Date().toISOString(),
  };
  clients.push(record);
  writeAll(clients);
  return record;
}

function listClients() {
  return readAll();
}

function getClient(companyId) {
  return readAll().find((c) => c.companyId === companyId) || null;
}

function isRegisteredCompany(companyId) {
  return readAll().some((c) => c.companyId === companyId && c.status !== 'suspended');
}

function companyNameFor(companyId) {
  const c = getClient(companyId);
  return c ? c.companyName : null;
}

module.exports = {
  isValidPartitaIva,
  registerClient,
  listClients,
  getClient,
  isRegisteredCompany,
  companyNameFor,
};
