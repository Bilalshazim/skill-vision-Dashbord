'use strict';
/* Pre-screening engine: evaluates CV archive records against criteria
   parsed from a natural-language prompt (degree, years of experience,
   native language, keywords).
   Core principle: a criterion that CANNOT be evaluated (missing data) is
   reported as 'unknown' and does NOT reject the candidate by default —
   users see exactly what was verified vs. unknown. strict mode flips that. */

const DEGREE_RANK = { diploma: 1, bachelor: 2, master: 3, phd: 4 };
const DEGREE_LABEL = {
  diploma: 'Diploma', bachelor: 'Laurea triennale / Bachelor',
  master: 'Laurea magistrale / Master', phd: 'Dottorato / PhD',
};
const LANG_TOKENS = {
  italian: ['italiano', 'italiana', 'italian'],
  english: ['inglese', 'inglesi', 'english'],
  french: ['francese', 'french'],
  spanish: ['spagnolo', 'spagnola', 'spanish'],
  german: ['tedesco', 'tedesca', 'german'],
  portuguese: ['portoghese', 'portuguese'],
};

function norm(s) {
  return String(s || '').toLowerCase()
    .replace(/[àá]/g, 'a').replace(/[èé]/g, 'e').replace(/[ìí]/g, 'i')
    .replace(/[òó]/g, 'o').replace(/[ùú]/g, 'u');
}

function tokenToLang(token) {
  const t = norm(token);
  for (const [lang, tokens] of Object.entries(LANG_TOKENS)) {
    if (tokens.includes(t)) return lang;
  }
  return null;
}

/* Parse a screening prompt (Italian or English) into structured criteria. */
function parseScreeningPrompt(prompt) {
  const q = norm(prompt);
  const criteria = {
    prompt: String(prompt || '').slice(0, 500),
    minYears: null,
    degree: null,
    nativeLanguages: [],
    keywordsAny: [],
    keywordsAll: [],
    strict: false,
  };

  let m;
  if ((m = q.match(/(?:almeno|minimo|min(?:imum)?|>=?|over)\s*(\d{1,2})\s*anni/))) {
    criteria.minYears = parseInt(m[1], 10);
  } else if ((m = q.match(/(\d{1,2})\s*\+?\s*anni\s*(?:di\s*)?esperienza/))) {
    criteria.minYears = parseInt(m[1], 10);
  } else if ((m = q.match(/(\d{1,2})\s*\+?\s*years?\s*(?:of\s*)?experience/))) {
    criteria.minYears = parseInt(m[1], 10);
  } else if ((m = q.match(/esperienza[:\s]+(?:almeno\s+)?(\d{1,2})/))) {
    criteria.minYears = parseInt(m[1], 10);
  }

  if (/\bdottorat|phd\b|doctorate/.test(q)) criteria.degree = 'phd';
  else if (/laurea magistral|specialistic|master degree|\bmaster\b/.test(q)) criteria.degree = 'master';
  else if (/laurea triennal|\bbachelor\b|\blaurea\b/.test(q)) criteria.degree = 'bachelor';
  else if (/\bdiploma\b/.test(q)) criteria.degree = 'diploma';

  let lm;
  const re1 = /(?:madrelingua|native(?:\s+speaker)?)\s+([a-z]+)/g;
  while ((lm = re1.exec(q)) !== null) {
    const lang = tokenToLang(lm[1]);
    if (lang && criteria.nativeLanguages.indexOf(lang) < 0) criteria.nativeLanguages.push(lang);
  }
  const re2 = /([a-z]+)\s+madrelingua/g;
  while ((lm = re2.exec(q)) !== null) {
    const lang = tokenToLang(lm[1]);
    if (lang && criteria.nativeLanguages.indexOf(lang) < 0) criteria.nativeLanguages.push(lang);
  }

  /* Quoted terms are treated as required keywords. */
  const quoted = /["“']([^"”']{2,40})["”']/g;
  while ((lm = quoted.exec(String(prompt || ''))) !== null) {
    criteria.keywordsAll.push(lm[1].trim());
  }

  return criteria;
}

/* Read the screening-relevant profile of a record (with cvData fallback for
   records imported from the dashboard side). */
function profileOf(record) {
  if (record.profile) return record.profile;
  const cv = record.cvData || {};
  const eduRaw = norm(cv.education || record.education || '');
  let education = null;
  if (/\bphd\b|dottorat|doctorate/.test(eduRaw)) education = 'phd';
  else if (/magistral|master|specialistic/.test(eduRaw)) education = 'master';
  else if (/triennal|bachelor|\blaurea\b|\bdegree\b/.test(eduRaw)) education = 'bachelor';
  else if (/\bdiploma\b/.test(eduRaw)) education = 'diploma';
  return {
    education,
    experienceYears: cv.experienceYears != null ? cv.experienceYears
      : (record.experienceYears != null ? record.experienceYears : null),
    nativeLanguages: (cv.nativeLanguages || record.nativeLanguages || []),
  };
}

/* Contactability: a candidate is contactable when at least one channel
   exists AND consent is not declined. */
function contactStatus(record) {
  const channels = [];
  if (record.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(record.email))) channels.push('email');
  if (record.phone) channels.push('phone');
  const consent = record.consent || 'unknown';
  return {
    contactable: channels.length > 0 && consent !== 'declined',
    channels,
    consent,
  };
}

/* Evaluate one candidate. Returns {pass, unknownCount, checks[]}.
   'unknown' never rejects unless criteria.strict is true. */
function evaluateCandidate(record, criteria) {
  const checks = [];
  const profile = profileOf(record);

  if (criteria.minYears != null) {
    const y = profile.experienceYears;
    checks.push({
      key: 'experience',
      label: `≥ ${criteria.minYears} anni di esperienza`,
      status: y == null ? 'unknown' : (y >= criteria.minYears ? 'pass' : 'fail'),
      detail: y == null ? 'non indicato nel CV' : `${y} anni`,
    });
  }

  if (criteria.degree) {
    const d = profile.education;
    checks.push({
      key: 'degree',
      label: `Titolo: ${DEGREE_LABEL[criteria.degree] || criteria.degree}`,
      status: !d ? 'unknown' : ((DEGREE_RANK[d] || 0) >= (DEGREE_RANK[criteria.degree] || 0) ? 'pass' : 'fail'),
      detail: d ? (DEGREE_LABEL[d] || d) : 'non indicato nel CV',
    });
  }

  (criteria.nativeLanguages || []).forEach((lang) => {
    const have = profile.nativeLanguages || [];
    checks.push({
      key: `native_${lang}`,
      label: `Madrelingua ${lang}`,
      status: !have.length ? 'unknown' : (have.indexOf(lang) >= 0 ? 'pass' : 'fail'),
      detail: have.length ? have.join(', ') : 'non indicata nel CV',
    });
  });

  const haystack = norm([record.name, record.role, record.job, record.src,
    record.companyName, record.file && record.file.originalName].filter(Boolean).join(' · '));

  (criteria.keywordsAll || []).forEach((kw) => {
    const k = norm(kw);
    checks.push({
      key: `kw_${k}`,
      label: `parola chiave: "${kw}"`,
      status: !haystack ? 'unknown' : (haystack.includes(k) ? 'pass' : 'fail'),
      detail: '',
    });
  });
  (criteria.keywordsAny || []).forEach((kw) => {
    const k = norm(kw);
    checks.push({
      key: `kw_${k}`,
      label: `contesto: "${kw}"`,
      status: !haystack ? 'unknown' : (haystack.includes(k) ? 'pass' : 'fail'),
      detail: '',
    });
  });

  const hasFail = checks.some((c) => c.status === 'fail');
  const unknownCount = checks.filter((c) => c.status === 'unknown').length;
  const pass = criteria.strict ? (!hasFail && unknownCount === 0) : !hasFail;

  return { pass, unknownCount, checks };
}

module.exports = { parseScreeningPrompt, evaluateCandidate, contactStatus, profileOf, DEGREE_RANK, DEGREE_LABEL };