'use strict';
/* Shared CV ingestion pipeline used by all three entry sources (email,
   webform, ATS). Responsibilities:
     - validate the PDF (requirement: PDF format only)
     - extract embedded text and parse candidate metadata from it
     - normalize a candidate record compatible with the dashboard's data
       model (CANDIDATES: {id, name, src, role, job, icv, scores, bf}) plus
       ingestion metadata including sourceTag + campaignId for dual-mode
       querying (ARCHIVE vs NEW_APPLICANT, scoped per selection campaign)
     - persist record + original file into the per-company archive
   Frontend/pages are never touched — this service only produces data. */

const crypto = require('crypto');
const config = require('./config');
const { httpError } = require('./respond');
const { assertValidPdf, extractText } = require('./pdf');
const archive = require('./archive');

/* ── Metadata extraction heuristics ──────────────────────────────────── */

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RES = [
  /(?:\+39|0039)[\s.-]?(?:3\d{2}|0\d{1,4})[\s.-]?\d{5,8}/,
  /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{1,4}\)[\s.-]?)?\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/,
];
const NAME_LINE_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ'’.\- ]{4,48}$/;
const NAME_STOP_RE = /curriculum|vitae|resume|profilo|profile|anagrafic|persona|data di nascita|indirizzo|email|e-mail|tel|phone/i;

function firstMatch(text, regexes) {
  for (const re of regexes) {
    const m = re.exec(text);
    if (m) return m[0].trim();
  }
  return '';
}

function guessNameFromText(text) {
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i];
    if (line.length < 4 || line.length > 48) continue;
    if (EMAIL_RE.test(line) || /\d/.test(line)) continue;
    if (NAME_STOP_RE.test(line)) continue;
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && NAME_LINE_RE.test(line)) return line;
  }
  return '';
}

function nameFromFilename(filename) {
  return String(filename || '')
    .replace(/\.[^.]+$/, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 64);
}

/* "Mario Rossi" display name (strip quotes, skip bare addresses). */
function nameFromEmailDisplay(display) {
  const v = (display || '').replace(/^"|"$/g, '').trim();
  if (!v || v.includes('@')) return '';
  return v.slice(0, 64);
}

/* Extract structured metadata: explicit hints win, then the CV document
   itself (an agency may forward the email — the display name is often NOT
   the candidate), then email display name, then the filename. */
function extractMetadata({ text, hints, filename }) {
  const email = (hints.email || (EMAIL_RE.exec(text) || [''])[0] || '').toLowerCase();
  const phone = hints.phone || firstMatch(text, PHONE_RES);
  const name = hints.name || guessNameFromText(text) ||
    nameFromEmailDisplay(hints.emailDisplayName) ||
    nameFromFilename(filename) || 'Nuovo candidato (da CV)';
  const role = hints.role || '';
  const job = hints.job || '';
  const profile = deriveProfileFromText(text);
  return { name, email, phone, role, job, profile };
}

/* Role hints hidden in application email subjects, e.g.
   "Candidatura per la posizione di Junior Analyst — CV Mario Rossi". */
function roleFromSubject(subject) {
  const s = subject || '';
  const m = /(?:per (?:la )?(?:posizione|position|ruolo|role)|position|role|application for)\s*:?\s*(?:di|del|della|dei|per|for)?\s*(.{3,64})/i.exec(s);
  return m ? m[1].replace(/\s*[-–|].*$/, '').trim() : '';
}

/* ── Pre-screening profile extraction (education / experience / languages) ── */

const DEGREE_RANK = { diploma: 1, bachelor: 2, master: 3, phd: 4 };
const LANG_TOKENS = {
  italian: ['italiano', 'italiana', 'italian'],
  english: ['inglese', 'inglesi', 'english'],
  french: ['francese', 'french'],
  spanish: ['spagnolo', 'spagnola', 'spanish'],
  german: ['tedesco', 'tedesca', 'german'],
  portuguese: ['portoghese', 'portuguese'],
};

function normText(s) {
  return String(s || '').toLowerCase()
    .replace(/[àá]/g, 'a').replace(/[èé]/g, 'e').replace(/[ìí]/g, 'i')
    .replace(/[òó]/g, 'o').replace(/[ùú]/g, 'u');
}

function tokenToLang(token) {
  const t = normText(token);
  for (const [lang, tokens] of Object.entries(LANG_TOKENS)) {
    if (tokens.includes(t)) return lang;
  }
  return null;
}

/* Derive the screening-relevant profile from CV text. Every field can come
   out null/[] — the prescreen evaluator treats "unknown" separately from
   "fail" so candidates are never rejected for missing data by default. */
function deriveProfileFromText(text) {
  const t = normText(text);

  let education = null;
  if (/\bdottorat|phd\b|doctorate/.test(t)) education = 'phd';
  else if (/laurea magistral|specialistic|master degree|\bmaster\b|\bm\.?s\.?c\b/.test(t)) education = 'master';
  else if (/laurea|bachelor|\bb\.?s\.?c\b|\bdegree\b/.test(t)) education = 'bachelor';
  else if (/\bdiploma\b|perito/.test(t)) education = 'diploma';

  let experienceYears = null;
  let mm;
  const yearsIt = /(\d{1,2})\s*\+?\s*anni\s*(?:di\s*)?esperienza/g;
  while ((mm = yearsIt.exec(t)) !== null) {
    const v = parseInt(mm[1], 10);
    if (Number.isFinite(v)) experienceYears = Math.max(experienceYears || 0, v);
  }
  const yearsEn = /(\d{1,2})\s*\+?\s*years?\s*(?:of\s*)?experience/g;
  while ((mm = yearsEn.exec(t)) !== null) {
    const v = parseInt(mm[1], 10);
    if (Number.isFinite(v)) experienceYears = Math.max(experienceYears || 0, v);
  }
  if (experienceYears === null) {
    const m2 = t.match(/esperienza[:\s]+(\d{1,2})\s*anni/) || t.match(/experience[:\s]+(\d{1,2})\s*years?/);
    if (m2) experienceYears = parseInt(m2[1], 10);
  }

  const nativeLanguages = [];
  const push = (token) => {
    const lang = tokenToLang(token);
    if (lang && nativeLanguages.indexOf(lang) < 0) nativeLanguages.push(lang);
  };
  let lm;
  const re1 = /(?:madrelingua|native(?:\s+speaker)?)\s+([a-z]+)/g;
  while ((lm = re1.exec(t)) !== null) push(lm[1]);
  const re2 = /([a-z]+)\s+madrelingua/g;
  while ((lm = re2.exec(t)) !== null) push(lm[1]);

  return { education, experienceYears, nativeLanguages };
}

/* ── Record normalization ────────────────────────────────────────────── */

function newCandidateId() {
  return `cv-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
}

/* Consent normalization: explicit webform checkbox / ATS flag wins, an
   emailed application implies consent to be contacted, anything else is
   unknown (never invented). */
function normalizeConsent(raw, source) {
  const v = String(raw == null ? '' : raw).toLowerCase().trim();
  if (['explicit', 'yes', 'true', 'on', '1', 'si', 'granted'].includes(v)) return 'explicit';
  if (['declined', 'no', 'false', '0', 'off', 'revoked'].includes(v)) return 'declined';
  if (v === 'implicit') return 'implicit';
  if (source === 'email') return 'implicit';
  return 'unknown';
}

/* Dashboard-compatible candidate record (matches the CANDIDATES model:
   {id, name, src, role, job, icv, scores, bf}) + ingestion metadata.
   Includes sourceTag ('ARCHIVE'|'NEW_APPLICANT') and campaignId for
   dual-mode querying and strict per-campaign data isolation. */
function normalizeRecord({ companyId, source, srcLabel, provided, file, parsedMeta, pdfInfo }) {
  const now = new Date().toISOString();
  const campaignId = (provided && provided.campaignId) ? String(provided.campaignId).trim() : '';
  const sourceTag = resolveSourceTag(source, campaignId, provided);
  return {
    id: newCandidateId(),
    companyId,
    companyName: config.companyName(companyId),
    source,                       /* 'email' | 'webform' | 'ats' */
    src: srcLabel,                /* human-readable provenance, dashboard-style */
    sourceTag,                    /* 'ARCHIVE' | 'NEW_APPLICANT' */
    campaignId,                   /* ties NEW_APPLICANT candidates to a selection campaign */
    name: parsedMeta.name,
    email: parsedMeta.email,
    phone: parsedMeta.phone,
    role: parsedMeta.role,
    job: parsedMeta.job,
    consent: normalizeConsent(provided.consent, source),
    profile: parsedMeta.profile || { education: null, experienceYears: null, nativeLanguages: [] },
    receivedAt: now,
    lastReceivedAt: now,
    receivedCount: 1,
    status: 'new',
    /* Filled later by the APEX evaluation — empty until then. */
    icv: null,
    scores: {},
    bf: {},
    file: {
      originalName: String(file.filename || 'cv.pdf').slice(0, 128),
      size: file.data.length,
      sha256: crypto.createHash('sha256').update(file.data).digest('hex'),
      storedPath: '', /* set by the archive writer */
    },
    parsed: {
      textExtracted: Boolean(pdfInfo.text && pdfInfo.text.trim().length),
      pages: pdfInfo.pages || 0,
      characters: (pdfInfo.text || '').length,
    },
  };
}

/* ── The shared pipeline ─────────────────────────────────────────────── */

/* options: {
     companyId, source ('email'|'webform'|'ats'), srcLabel,
           provided: {name, email, phone, role, job, emailDisplayName, consent,
                 campaignId?, sourceTag?},
     file:     {filename, contentType, data(Buffer)},
     meta:     {subject, bodyText}
   } */
async function ingestCv(options) {
  const { companyId, source, srcLabel, provided = {}, file } = options;

  if (!config.isKnownCompany(companyId)) {
    throw httpError(422, 'UNKNOWN_COMPANY',
      `Unknown company id "${companyId || ''}"`,
      { knownCompanies: config.knownCompanies });
  }
  assertValidPdf(file);

  const warnings = [];
  const pdfInfo = extractText(file.data, config.maxTextChars);
  if (!pdfInfo.text.trim()) {
    warnings.push('PDF_TEXT_EMPTY: no embedded text found (scanned or image-only CV?) — record stored with metadata from the submission itself');
  }

  /* Secondary metadata source: the email body / application note. */
  const secondaryText = [options.meta && options.meta.subject,
    options.meta && options.meta.bodyText]
    .filter(Boolean).join('\n');

  const textForMeta = [pdfInfo.text, secondaryText].filter(Boolean).join('\n');
  const parsedMeta = extractMetadata({
    text: textForMeta,
    hints: {
      name: provided.name,
      email: provided.email,
      phone: provided.phone,
      role: provided.role || (options.meta ? roleFromSubject(options.meta.subject) : ''),
      job: provided.job,
      emailDisplayName: provided.emailDisplayName,
    },
    filename: file.filename,
  });

  const record = normalizeRecord({ companyId, source, srcLabel, provided, file, parsedMeta, pdfInfo });
  const saved = await archive.save(companyId, record, file.data);

  /* Outbound ATS sync (bi-directional integration, lib/webhooks.js): notify
     any subscriber the moment a CV lands, whether brand new or a resubmission.
     Fire-and-forget — a slow/broken subscriber must never fail the ingest. */
  require('./webhooks').dispatch(
    companyId,
    saved.duplicate ? 'candidate.duplicate' : 'candidate.created',
    { candidateId: saved.record.id, name: saved.record.name, email: saved.record.email,
      role: saved.record.role, source, sourceTag: saved.record.sourceTag, campaignId: saved.record.campaignId || '' }
  ).catch(() => {});

  return {
    candidateId: saved.record.id,
    companyId,
    companyName: saved.record.companyName,
    sourceTag: saved.record.sourceTag,
    campaignId: saved.record.campaignId || '',
    duplicate: saved.duplicate,
    warnings,
    candidate: saved.record,
  };
}

/* Derive the sourceTag for a candidate:
   - 'ATS' entry source → 'ARCHIVE' (bulk ATS imports into the stored archive)
   - 'email'/'webform' with a campaignId → 'NEW_APPLICANT' (newly received for a
     specific active job posting / selection campaign)
   - anything else → 'ARCHIVE' (general archive pool)
   An explicitly provided sourceTag always wins. */
function resolveSourceTag(source, campaignId, provided) {
  if (provided && provided.sourceTag) return provided.sourceTag;
  if (source === 'ats') return 'ARCHIVE';
  if ((source === 'email' || source === 'webform') && campaignId) return 'NEW_APPLICANT';
  return 'ARCHIVE';
}

module.exports = { ingestCv, extractMetadata, deriveProfileFromText, roleFromSubject, newCandidateId, DEGREE_RANK, resolveSourceTag };