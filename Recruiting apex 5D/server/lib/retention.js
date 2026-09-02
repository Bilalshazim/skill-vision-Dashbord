'use strict';
/* GDPR data retention & scheduled deletion for candidate CVs (backend only).
   Implements Art. 5(1)(e) storage limitation:
     - configurable retention window per company: 6 / 12 / 24 / 48 months
     - DEFAULT: strictly 6 months from reception (receivedAt) when the client
       has not configured a custom preference
     - a background sweep permanently purges expired CV PDFs and the parsed
       personal record from the archive database
     - a pseudonymous deletion log (no names, no emails — only ids, dates and
       file digests) supports Art. 5(2) accountability without re-creating
       personal data
   Precedence for the effective window: client preference (retention.json)
   > RETENTION_MONTHS_<COMPANY> env > RETENTION_MONTHS env > default (6). */

const fs = require('fs');
const path = require('path');
const config = require('./config');
const archive = require('./archive');
const { httpError } = require('./respond');

const POLICY_FILE = () => path.join(config.dataDir, 'retention.json');

function readPrefs() {
  try {
    const parsed = JSON.parse(fs.readFileSync(POLICY_FILE(), 'utf8'));
    return parsed && parsed.companies && typeof parsed.companies === 'object' ? parsed.companies : {};
  } catch (e) {
    return {};
  }
}

function writePrefs(prefs) {
  fs.mkdirSync(config.dataDir, { recursive: true });
  const payload = {
    _comment: 'GDPR Art. 5(1)(e) storage limitation — client-configured retention windows (months). Pseudonymous metadata only.',
    updatedAt: new Date().toISOString(),
    companies: prefs,
  };
  const tmp = `${POLICY_FILE()}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(payload, null, 2));
  fs.renameSync(tmp, POLICY_FILE());
}

function envCompanyVar(companyId) {
  return 'RETENTION_MONTHS_' + String(companyId).replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
}

/* Effective retention window for one company. */
function getRetention(companyId) {
  const pref = readPrefs()[companyId];
  if (pref && config.retention.allowedMonths.includes(pref.months)) {
    return {
      companyId,
      months: pref.months,
      source: 'client',
      basis: pref.basis || '',
      updatedAt: pref.updatedAt || null,
    };
  }
  const envCompany = parseInt(process.env[envCompanyVar(companyId)], 10);
  if (config.retention.allowedMonths.includes(envCompany)) {
    return { companyId, months: envCompany, source: 'env-company', basis: '', updatedAt: null };
  }
  if (config.retention.envDefaultMonths) {
    return { companyId, months: config.retention.envDefaultMonths, source: 'env-global', basis: '', updatedAt: null };
  }
  return { companyId, months: config.retention.defaultMonths, source: 'default', basis: '', updatedAt: null };
}

/* Configure the client preference (requirement #2: only 6/12/24/48 allowed). */
function setRetention(companyId, months, meta) {
  if (!config.isKnownCompany(companyId)) {
    throw httpError(422, 'UNKNOWN_COMPANY', `Unknown company id "${companyId || ''}"`,
      { knownCompanies: config.knownCompanies });
  }
  const m = parseInt(months, 10);
  if (!config.retention.allowedMonths.includes(m)) {
    throw httpError(422, 'INVALID_RETENTION_WINDOW',
      `Retention window must be one of: ${config.retention.allowedMonths.join(', ')} months`,
      { allowedMonths: config.retention.allowedMonths, received: months });
  }
  const prefs = readPrefs();
  prefs[companyId] = {
    months: m,
    updatedAt: new Date().toISOString(),
    basis: meta && meta.note ? String(meta.note).slice(0, 200) : 'GDPR Art. 5(1)(e) — storage limitation',
    updatedBy: meta && meta.updatedBy ? String(meta.updatedBy).slice(0, 64) : 'api',
  };
  writePrefs(prefs);
  return getRetention(companyId);
}

function listRetention() {
  const ids = new Set(config.knownCompanies);
  archive.list().forEach((a) => ids.add(a.companyId));
  return Array.from(ids).sort().map((id) => getRetention(id));
}

/* Expiry = reception date + retention window (calendar months, UTC). */
function computeExpiry(receivedIso, months) {
  const d = new Date(receivedIso);
  if (isNaN(d.getTime())) return null;
  d.setUTCMonth(d.getUTCMonth() + Number(months));
  return d.toISOString();
}

/* Pseudonymous deletion log (JSONL, per company). NEVER stores names,
   emails or CV content — only ids, timestamps, windows and file digests. */
function appendDeletionLog(companyId, entry) {
  const dir = archive.companyDir(companyId);
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(path.join(dir, 'deletions.jsonl'), JSON.stringify(entry) + '\n');
}

/* Permanently purge one candidate: PDF files + parsed personal record.
   reason: 'retention_expiry' | 'erasure_request'. */
async function purgeCandidate(companyId, record, reason, dryRun, expiryIso) {
  const deletedFiles = [];
  const storedPath = record.file && record.file.storedPath;

  if (dryRun) {
    if (storedPath) deletedFiles.push(storedPath);
    return { purged: true, dryRun: true, deletedFiles };
  }

  /* Original file. */
  if (storedPath && archive.deleteFile(companyId, storedPath)) deletedFiles.push(storedPath);
  /* Any legacy/variant file for the same id (files/<id>*.pdf). */
  const filesDir = path.join(archive.companyDir(companyId), 'files');
  try {
    if (fs.existsSync(filesDir)) {
      fs.readdirSync(filesDir)
        .filter((f) => f.startsWith(record.id) && f.endsWith('.pdf') && deletedFiles.indexOf('files/' + f) < 0)
        .forEach((f) => {
          if (archive.deleteFile(companyId, 'files/' + f)) deletedFiles.push('files/' + f);
        });
    }
  } catch (e) { /* non-fatal */ }

  /* Remove the parsed personal record from the database. */
  const removed = await archive.mutate(companyId, (arch) => {
    const before = arch.candidates.length;
    arch.candidates = arch.candidates.filter((c) => c.id !== record.id);
    return arch.candidates.length < before;
  });
  if (!removed) return { purged: false, reason: 'record_not_found', deletedFiles };

  appendDeletionLog(companyId, {
    type: reason,
    candidateId: record.id,
    companyId,
    retentionMonths: getRetention(companyId).months,
    receivedAt: record.receivedAt || null,
    expiryAt: expiryIso || null,
    fileSha256: (record.file && record.file.sha256) || null,
    filesDeleted: deletedFiles,
    deletedAt: new Date().toISOString(),
  });

  /* Outbound ATS sync: let a subscribed ATS know the record is gone (GDPR
     erasure, either scheduled or Art. 17) — pseudonymous like the log above,
     no name/email in the payload. Fire-and-forget. */
  require('./webhooks').dispatch(companyId, 'candidate.deleted', {
    candidateId: record.id, reason,
  }).catch(() => {});

  return { purged: true, deletedFiles };
}

/* Scheduled sweep: purge every candidate whose reception date is older than
   the company's retention window. Idempotent; supports dry-run. */
async function sweep(opts) {
  const o = opts || {};
  const dryRun = o.dryRun === true;
  const now = o.now ? new Date(o.now) : new Date();
  const summary = {
    startedAt: now.toISOString(),
    dryRun,
    checked: 0,
    purged: 0,
    kept: 0,
    skipped: 0,
    errors: [],
    companies: [],
    finishedAt: null,
  };

  for (const listed of archive.list()) {
    const companyId = listed.companyId;
    const arch = archive.get(companyId);
    if (!arch) continue;
    const policy = getRetention(companyId);
    const companySummary = {
      companyId,
      retentionMonths: policy.months,
      policySource: policy.source,
      checked: 0,
      purged: 0,
      kept: 0,
      skipped: 0,
      purgedIds: [],
    };

    const expired = [];
    (arch.candidates || []).forEach((rec) => {
      companySummary.checked += 1;
      summary.checked += 1;
      if (!rec.receivedAt) {
        companySummary.skipped += 1; summary.skipped += 1;
        return;
      }
      const expiryIso = computeExpiry(rec.receivedAt, policy.months);
      if (!expiryIso) {
        companySummary.skipped += 1; summary.skipped += 1;
        return;
      }
      if (now.getTime() >= new Date(expiryIso).getTime()) {
        expired.push({ rec, expiryIso });
      } else {
        companySummary.kept += 1; summary.kept += 1;
      }
    });

    for (const { rec, expiryIso } of expired) {
      try {
        const res = await purgeCandidate(companyId, rec, 'retention_expiry', dryRun, expiryIso);
        if (res.purged) {
          companySummary.purged += 1; summary.purged += 1;
          companySummary.purgedIds.push(rec.id);
        } else {
          companySummary.skipped += 1; summary.skipped += 1;
        }
      } catch (e) {
        summary.errors.push({ companyId, candidateId: rec.id, error: e.message });
      }
    }

    if (companySummary.checked || companySummary.purged) summary.companies.push(companySummary);
  }

  summary.finishedAt = new Date().toISOString();
  return summary;
}

/* ── Scheduler: background job per requirement #1 ─────────────────────── */
let sweepTimer = null;
let bootTimer = null;

function startScheduler() {
  const hours = config.retention.sweepIntervalHours;
  const intervalMs = Math.max(1, hours) * 3600 * 1000;

  if (config.retention.sweepOnBoot) {
    bootTimer = setTimeout(() => {
      sweep({})
        .then((s) => { if (s.purged) console.log(`[retention] boot sweep purged ${s.purged} candidate record(s)`); })
        .catch((e) => console.error('[retention] boot sweep failed:', e.message));
    }, config.retention.bootDelayMs);
    if (bootTimer.unref) bootTimer.unref();
  }

  sweepTimer = setInterval(() => {
    sweep({})
      .then((s) => { if (s.purged) console.log(`[retention] scheduled sweep purged ${s.purged} candidate record(s)`); })
      .catch((e) => console.error('[retention] scheduled sweep failed:', e.message));
  }, intervalMs);
  if (sweepTimer.unref) sweepTimer.unref();

  console.log(`[retention] scheduler active — sweep every ${hours}h, boot sweep: ${config.retention.sweepOnBoot ? 'yes' : 'no'}, default window: ${config.retention.defaultMonths} months`);
  return { intervalMs, sweepOnBoot: config.retention.sweepOnBoot };
}

function stopScheduler() {
  if (sweepTimer) { clearInterval(sweepTimer); sweepTimer = null; }
  if (bootTimer) { clearTimeout(bootTimer); bootTimer = null; }
}

module.exports = { getRetention, setRetention, listRetention, computeExpiry, purgeCandidate, sweep, startScheduler, stopScheduler };