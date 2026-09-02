'use strict';
/* Per-company archive database (requirement #2).
   Layout:
     <dataDir>/archive/<companyId>/candidates.json   ← the candidate "DB"
     <dataDir>/archive/<companyId>/files/<id>.pdf    ← original CV files
   Writes are atomic (tmp file + rename) and serialized per company via a
   promise queue, so concurrent inbound CVs can never corrupt the JSON.
   The JSON store mirrors the dashboard's CANDIDATES record shape so records
   can be exported into the app without touching any page component. */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('./config');

const locks = new Map();

function withLock(key, fn) {
  const prev = locks.get(key) || Promise.resolve();
  const run = prev.then(fn, fn);
  locks.set(key, run.catch(() => {}));
  return run;
}

/* Only allow safe directory-name characters for company ids. */
function safeSegment(segment) {
  return String(segment || '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64);
}

function companyDir(companyId) {
  return path.join(config.dataDir, 'archive', safeSegment(companyId));
}

function archiveFile(companyId) {
  return path.join(companyDir(companyId), 'candidates.json');
}

function filesDir(companyId) {
  return path.join(companyDir(companyId), 'files');
}

function atomicWrite(file, data) {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, file);
}

function emptyArchive(companyId) {
  return {
    companyId,
    companyName: config.companyName(companyId),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    count: 0,
    candidates: [],
  };
}

function readArchive(companyId) {
  const file = archiveFile(companyId);
  if (!fs.existsSync(file)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!parsed || !Array.isArray(parsed.candidates)) return null;
    return parsed;
  } catch (e) {
    /* Corrupted archive: keep the broken file aside instead of crashing. */
    try { fs.renameSync(file, `${file}.corrupt-${Date.now()}`); } catch (e2) {}
    return null;
  }
}

/* Match an existing candidate: by normalized email, else by full name. */
function findDuplicate(archiveObj, record) {
  const email = (record.email || '').toLowerCase();
  if (email) {
    return archiveObj.candidates.find(
      (c) => (c.email || '').toLowerCase() === email
    );
  }
  const name = (record.name || '').toLowerCase().trim();
  if (name) {
    return archiveObj.candidates.find(
      (c) => (c.name || '').toLowerCase().trim() === name
    );
  }
  return undefined;
}

/* Merge non-empty new fields into an existing record on re-submission. */
function mergeCandidate(existing, record) {
  const now = new Date().toISOString();
  const merged = Object.assign({}, existing);
  ['name', 'email', 'phone', 'role', 'job', 'companyName', 'source', 'src'].forEach((k) => {
    if (record[k] && (!existing[k] || existing[k] === '')) merged[k] = record[k];
  });
  /* sourceTag / campaignId: adopt the latest submission's values so a candidate
     re-submitted for a specific campaign is re-tagged accordingly. */
  if (record.sourceTag) merged.sourceTag = record.sourceTag;
  if (record.campaignId) merged.campaignId = record.campaignId;
  merged.lastReceivedAt = now;
  merged.receivedCount = (existing.receivedCount || 1) + 1;
  merged.file = record.file;
  merged.parsed = record.parsed;
  return merged;
}

/* Persist a candidate record (and its PDF) into the company archive.
   Returns { record, duplicate } — on duplicates the existing record wins
   (its id is kept, counters bumped, file replaced). */
async function save(companyId, record, pdfBuffer) {
  return withLock(companyId, () => {
    const dir = companyDir(companyId);
    fs.mkdirSync(filesDir(companyId), { recursive: true });

    let archiveObj = readArchive(companyId) || emptyArchive(companyId);
    const existing = findDuplicate(archiveObj, record);
    let stored = record;
    let duplicate = false;

    if (existing) {
      duplicate = true;
      stored = mergeCandidate(existing, record);
      stored.id = existing.id; /* keep the original id stable */
    }

    /* Store/replace the original PDF. */
    const fileName = `${stored.id}.pdf`;
    const filePath = path.join(filesDir(companyId), fileName);
    atomicWrite(filePath, pdfBuffer);
    stored.file.storedPath = `files/${fileName}`;

    if (duplicate) {
      archiveObj.candidates = archiveObj.candidates.map(
        (c) => (c.id === stored.id ? stored : c)
      );
    } else {
      archiveObj.candidates.push(stored);
    }

    archiveObj.count = archiveObj.candidates.length;
    archiveObj.updatedAt = new Date().toISOString();
    atomicWrite(archiveFile(companyId), JSON.stringify(archiveObj, null, 2));

    return { record: stored, duplicate };
  });
}

/* Read helpers (used by GET /api/archive/:companyId). */
function get(companyId) {
  return readArchive(companyId);
}

function list() {
  const root = path.join(config.dataDir, 'archive');
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root)
    .filter((d) => fs.statSync(path.join(root, d)).isDirectory())
    .map((d) => readArchive(d))
    .filter(Boolean)
        .map((a) => ({ companyId: a.companyId, companyName: a.companyName, count: a.count, updatedAt: a.updatedAt }));
}

/* ── Dual-mode query ────────────────────────────────────────────────────
   Returns a filtered, read-only view of a company's archive without
   modifying the stored file. Supports the dual-mode querying of
   ARCHIVE candidates (bulk imports) vs NEW_APPLICANT candidates
   (newly received for a specific selection campaign), with strict
   per-campaign data isolation.

   opts:
     sourceTag   'ARCHIVE' | 'NEW_APPLICANT' | ['ARCHIVE','NEW_APPLICANT'] | null
     campaignId  string (selection-campaign / job-posting identifier) | null

   Rules:
     - sourceTag filter: if provided, only candidates whose sourceTag matches
       (records without an explicit sourceTag are treated as 'ARCHIVE') are
       returned.
     - campaignId filter: ARCHIVE candidates are returned regardless of
       campaignId (shared pool); NEW_APPLICANT candidates are only returned
       when their campaignId matches — this enforces strict per-campaign
       isolation.
     - When both are provided, both filters apply (NEW_APPLICANT candidates
       must match BOTH sourceTag and campaignId).
   Returns the same archive envelope shape ({companyId, companyName, count,
   candidates, ...}) or null when no archive exists for the company. */
function query(companyId, opts) {
  const arch = readArchive(companyId);
  if (!arch) return null;

  const { sourceTag, campaignId } = opts || {};
  const tags = sourceTag
    ? (Array.isArray(sourceTag) ? sourceTag : [sourceTag])
    : null;

  let candidates = arch.candidates || [];

  if (tags && campaignId) {
    /* Strict per-campaign dual-mode: ARCHIVE always passes the campaign
       check (shared pool); NEW_APPLICANT must match the campaignId. */
    candidates = candidates.filter((c) => {
      const tag = c.sourceTag || 'ARCHIVE';
      if (!tags.includes(tag)) return false;
      if (tag === 'NEW_APPLICANT' && (c.campaignId || '') !== campaignId) return false;
      return true;
    });
  } else if (tags) {
    /* Only sourceTag filtering (no campaign constraint). */
    candidates = candidates.filter((c) => tags.includes(c.sourceTag || 'ARCHIVE'));
  } else if (campaignId) {
    /* Only campaignId: ARCHIVE always included, NEW_APPLICANT scoped. */
    candidates = candidates.filter((c) => {
      const tag = c.sourceTag || 'ARCHIVE';
      if (tag === 'ARCHIVE') return true;
      return (c.campaignId || '') === campaignId;
    });
  }

  return {
    companyId: arch.companyId,
    companyName: arch.companyName,
    createdAt: arch.createdAt,
    updatedAt: arch.updatedAt,
    count: candidates.length,
    candidates,
  };
}

/* Integrity helper exposed via /healthz — sha256 of a stored file. */
function fileHash(companyId, storedPath) {
  const filePath = path.join(companyDir(companyId), storedPath);
  if (!fs.existsSync(filePath)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

/* Read a stored CV file back (prescreen lazy-enrichment). Path traversal safe. */
function fileRead(companyId, storedPath) {
  const safe = String(storedPath || '').replace(/\\/g, '/');
  if (!safe || safe.includes('..')) return null;
  const p = path.join(companyDir(companyId), safe);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p);
}

/* Merge an enrichment patch (e.g. {profile}) into one record. Never
   overwrites an already-present profile. */
function enrich(companyId, id, patch) {
  return withLock(companyId, () => {
    const arch = readArchive(companyId);
    if (!arch) return null;
    let found = null;
    arch.candidates = arch.candidates.map((c) => {
      if (c.id !== id) return c;
      found = Object.assign({}, c);
      if (patch.profile && !c.profile) found.profile = patch.profile;
      return found;
    });
    if (found) {
      arch.updatedAt = new Date().toISOString();
      atomicWrite(archiveFile(companyId), JSON.stringify(arch, null, 2));
    }
    return found;
  });
}

/* Permanently delete a stored CV file (prescreen/purge use). Returns true
   when a file was actually removed. */
function deleteFile(companyId, storedPath) {
  const safe = String(storedPath || '').replace(/\\/g, '/');
  if (!safe || safe.includes('..')) return false;
  const p = path.join(companyDir(companyId), safe);
  if (!fs.existsSync(p)) return false;
  fs.unlinkSync(p);
  return true;
}

/* Locked read-modify-write: mutator(archiveObj) mutates in place and returns
   a truthy value to persist (count + updatedAt refreshed automatically). */
function mutate(companyId, mutator) {
  return withLock(companyId, () => {
    const arch = readArchive(companyId);
    if (!arch) return null;
    const result = mutator(arch);
    if (result) {
      arch.updatedAt = new Date().toISOString();
      arch.count = arch.candidates.length;
      atomicWrite(archiveFile(companyId), JSON.stringify(arch, null, 2));
    }
    return result || null;
  });
}

module.exports = { save, get, list, query, fileHash, fileRead, enrich, companyDir, deleteFile, mutate };