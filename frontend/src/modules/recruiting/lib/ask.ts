import { DEFAULT_FLAGS, DEFAULT_ROLE, ROLES, SKILLS, W } from '@/modules/recruiting/lib/constants'
import { ci, ranking } from '@/modules/recruiting/lib/scoring'
import type { Candidate, CvMatchingState } from '@/modules/recruiting/lib/types'

// Migrated from modules/recruiting.html's "Ask"/"Chiedi al Recruiting Lab"
// screen (#scr-ai, ~578-602) — askAI()/_composeAnswer()/QS quick-questions
// (~3316-3382, ~5037-5163) and the local pre-screening query engine
// (~5165-5370). Everything here is read-only and 100% local — no writes,
// no localStorage keys touched.
//
// DELIBERATELY NOT REPRODUCED: askAI()'s Claude API branch
// (_askClaudeAPI(), ~5054-5096) — it only ever runs when
// `window._CLAUDE_API_KEY` is a real "sk-..." key, which is set ONLY via
// the Admin panel's own config field (cfgClaudeKey, fillAdminForm() ~3475),
// an operator-only feature this migration has never touched and has no
// React equivalent for. In this exact deployment that key is never set, so
// askAI() always falls through to the local `_composeAnswer()` path below —
// reproducing ONLY that path is not "missing a feature", it is the actual
// observable behavior of this app today. No key is introduced or exposed
// here, and no fetch to api.anthropic.com is ever made.
//
// ALSO NOT REPRODUCED: _runPrescreenQuery()'s `fetch(.../api/prescreen)`
// half (~5299-5306) — it is wrapped in a try/catch whose only real-world
// outcome in this environment is the catch branch ("backend non
// raggiungibile → filtro locale"), since the entire `Recruiting apex 5D/
// server` backend this would call is not part of this deployment (the
// pre-existing, permanent local-only deletion flagged since Phase 1).
// Reproducing only the local-filter half is therefore the same reasoning
// as above: it is the only half that has ever actually run for a real user
// of this exact app, not an invented replacement for a working feature.

function normalizeText(s: string | null | undefined): string {
  return String(s || '')
    .toLowerCase()
    .replace(/[àá]/g, 'a')
    .replace(/[èé]/g, 'e')
    .replace(/[ìí]/g, 'i')
    .replace(/[òó]/g, 'o')
    .replace(/[ùú]/g, 'u')
}

// Ported verbatim from _isScreeningPrompt() (modules/recruiting.html ~5170-5172).
export function isScreeningPrompt(q: string): boolean {
  return /prescreen|pre-screen|screening|shortlist|filtra\s+(i\s+|le\s+)?candidat|filtro\s+(dei\s+)?candidat|seleziona\s+(i\s+|le\s+)?candidat|candidat[oi]\s+(con|che)\s|candidat[oi]\s+(con\s+)?almeno|madrelingua|anni\s+di\s+esperienza|years?\s+(of\s+)?experience|laurea\s+(triennale|magistrale)|native\s+(italian|english|french|spanish|german|portuguese)/i.test(
    normalizeText(q),
  )
}

function degreeOf(s: string | null | undefined): 'phd' | 'master' | 'bachelor' | 'diploma' | null {
  const v = normalizeText(s)
  if (/\bphd\b|dottorat|doctorate/.test(v)) return 'phd'
  if (/magistral|master|specialistic/.test(v)) return 'master'
  if (/triennal|bachelor|\blaurea\b|\bdegree\b/.test(v)) return 'bachelor'
  if (/\bdiploma\b/.test(v)) return 'diploma'
  return null
}

export type ScreeningCriteria = {
  prompt: string
  minYears: number | null
  degree: 'phd' | 'master' | 'bachelor' | 'diploma' | null
  nativeLanguages: string[]
  keywordsAll: string[]
  // Always empty/false in the current legacy implementation — _psParseCriteria
  // initializes these but never assigns them (confirmed by reading the full
  // function body). Kept for structural fidelity with evaluateArchiveRecord's
  // shared loop, not because anything currently sets them.
  keywordsAny: string[]
  strict: boolean
}

// Ported verbatim from _psParseCriteria() (modules/recruiting.html ~5182-5202).
export function parseScreeningCriteria(q: string): ScreeningCriteria {
  const qn = normalizeText(q)
  const criteria: ScreeningCriteria = { prompt: q, minYears: null, degree: null, nativeLanguages: [], keywordsAll: [], keywordsAny: [], strict: false }

  let m = qn.match(/(?:almeno|minimo|min(?:imum)?|>=?)\s*(\d{1,2})\s*anni/)
  if (m) criteria.minYears = parseInt(m[1], 10)
  else if ((m = qn.match(/(\d{1,2})\s*\+?\s*anni\s*(?:di\s*)?esperienza/))) criteria.minYears = parseInt(m[1], 10)
  else if ((m = qn.match(/(\d{1,2})\s*\+?\s*years?\s*(?:of\s*)?experience/))) criteria.minYears = parseInt(m[1], 10)

  if (/\bdottorat|phd\b|doctorate/.test(qn)) criteria.degree = 'phd'
  else if (/laurea magistral|specialistic|master degree|\bmaster\b/.test(qn)) criteria.degree = 'master'
  else if (/laurea triennal|\bbachelor\b|\blaurea\b/.test(qn)) criteria.degree = 'bachelor'
  else if (/\bdiploma\b/.test(qn)) criteria.degree = 'diploma'

  const langs: Record<string, string[]> = {
    italian: ['italiano', 'italiana', 'italian'],
    english: ['inglese', 'inglesi', 'english'],
    french: ['francese', 'french'],
    spanish: ['spagnolo', 'spagnola', 'spanish'],
    german: ['tedesco', 'tedesca', 'german'],
    portuguese: ['portoghese', 'portuguese'],
  }
  const toLang = (t: string): string | null => {
    for (const k in langs) if (langs[k].indexOf(t) >= 0) return k
    return null
  }
  let lm: RegExpExecArray | null
  const r1 = /(?:madrelingua|native(?:\s+speaker)?)\s+([a-z]+)/g
  while ((lm = r1.exec(qn)) !== null) {
    const l = toLang(lm[1])
    if (l && criteria.nativeLanguages.indexOf(l) < 0) criteria.nativeLanguages.push(l)
  }
  const r2 = /([a-z]+)\s+madrelingua/g
  while ((lm = r2.exec(qn)) !== null) {
    const l = toLang(lm[1])
    if (l && criteria.nativeLanguages.indexOf(l) < 0) criteria.nativeLanguages.push(l)
  }
  const quoted = /["“']([^"”']{2,40})["”']/g
  while ((lm = quoted.exec(q)) !== null) criteria.keywordsAll.push(lm[1].trim())

  return criteria
}

export type ArchiveRecord = {
  id: string
  name: string
  role: string
  job: string
  src: string
  email: string
  phone: string
  icv: number | null
  consent: string
  profile: { education: string | null; experienceYears: number | null; nativeLanguages: string[] }
  file: { originalName?: string } | null
  source: string
  sourceTag: 'ARCHIVE' | 'NEW_APPLICANT'
  campaignId: string
}

// Ported verbatim from _psLocalArchiveRecords() (modules/recruiting.html
// ~5204-5253) — unifies CANDIDATES with every opening's candidatePool
// (across ALL companies, not just the active one) into one flat archive,
// pool records winning on sourceTag/campaignId/profile/file/source when a
// candidateId collides with both (`Object.assign({},base,{...})`, pool
// second — same precedence).
export function buildLocalArchiveRecords(candidates: Candidate[], cvState: CvMatchingState): ArchiveRecord[] {
  const byId = new Map<string, ArchiveRecord>()

  candidates.forEach((c) => {
    if (!c || !c.id) return
    byId.set(c.id, {
      id: c.id,
      name: c.name,
      role: c.role || '',
      job: c.job || '',
      src: c.src || '',
      email: c.email || '',
      phone: c.phone || '',
      icv: c.icv != null ? c.icv : null,
      consent: c.consent || 'unknown',
      profile: {
        education: degreeOf(c.cvData?.education || ''),
        experienceYears: c.cvData?.experienceYears != null ? c.cvData.experienceYears : null,
        nativeLanguages: c.cvData?.nativeLanguages || [],
      },
      file: c.file || null,
      source: c.source ?? 'dashboard',
      sourceTag: 'ARCHIVE',
      campaignId: '',
    })
  })

  for (const company of cvState.companies || []) {
    for (const opening of company.jobOpenings || []) {
      for (const r of opening.candidatePool || []) {
        if (!r || !r.id) continue
        const base = byId.get(r.id)
        const rawProfile = r.profile || base?.profile || { education: r.cvData?.education ?? null, experienceYears: r.cvData?.experienceYears ?? null, nativeLanguages: r.cvData?.nativeLanguages || [] }
        byId.set(r.id, {
          id: r.id,
          name: r.name || base?.name || '',
          role: r.role || base?.role || '',
          job: r.job || base?.job || '',
          src: r.src || base?.src || (r.name ? 'Nuovo candidato (da CV)' : ''),
          email: r.email || base?.email || '',
          phone: r.phone || base?.phone || '',
          icv: r.icv != null ? r.icv : (base?.icv ?? null),
          consent: r.consent || base?.consent || 'unknown',
          profile: { education: rawProfile.education ?? null, experienceYears: rawProfile.experienceYears ?? null, nativeLanguages: rawProfile.nativeLanguages || [] },
          file: r.file || base?.file || null,
          source: r.source || base?.source || 'cv-parser',
          sourceTag: 'NEW_APPLICANT',
          campaignId: opening.id,
        })
      }
    }
  }

  return Array.from(byId.values())
}

export type CriterionCheck = { key: string; label: string; status: 'pass' | 'fail' | 'unknown'; detail: string }

// Ported verbatim from _psEvaluate() (modules/recruiting.html ~5254-5276).
export function evaluateArchiveRecord(rec: ArchiveRecord, criteria: ScreeningCriteria): { pass: boolean; checks: CriterionCheck[]; unknownCount: number } {
  const checks: CriterionCheck[] = []
  const prof = rec.profile
  const ranks: Record<string, number> = { diploma: 1, bachelor: 2, master: 3, phd: 4 }

  if (criteria.minYears != null) {
    const y = prof.experienceYears
    checks.push({
      key: 'experience',
      label: `≥ ${criteria.minYears} anni di esperienza`,
      status: y == null ? 'unknown' : y >= criteria.minYears ? 'pass' : 'fail',
      detail: y == null ? 'non indicato' : `${y} anni`,
    })
  }
  if (criteria.degree) {
    const d = prof.education
    checks.push({
      key: 'degree',
      label: `Titolo: ${criteria.degree}`,
      status: !d ? 'unknown' : (ranks[d] || 0) >= ranks[criteria.degree] ? 'pass' : 'fail',
      detail: d || 'non indicato',
    })
  }
  for (const l of criteria.nativeLanguages || []) {
    const have = prof.nativeLanguages || []
    checks.push({
      key: `native_${l}`,
      label: `Madrelingua ${l}`,
      status: !have.length ? 'unknown' : have.indexOf(l) >= 0 ? 'pass' : 'fail',
      detail: have.length ? have.join(', ') : 'non indicata',
    })
  }
  const hay = normalizeText([rec.name, rec.role, rec.job, rec.src, rec.file?.originalName || ''].filter(Boolean).join(' · '))
  for (const kw of criteria.keywordsAll || []) {
    const k = normalizeText(kw)
    checks.push({ key: `kw_${k}`, label: `parola chiave: "${kw}"`, status: !hay ? 'unknown' : hay.indexOf(k) >= 0 ? 'pass' : 'fail', detail: '' })
  }
  for (const kw of criteria.keywordsAny || []) {
    const k = normalizeText(kw)
    checks.push({ key: `kw_${k}`, label: `contesto: "${kw}"`, status: !hay ? 'unknown' : hay.indexOf(k) >= 0 ? 'pass' : 'fail', detail: '' })
  }

  const hasFail = checks.some((c) => c.status === 'fail')
  const unknownCount = checks.filter((c) => c.status === 'unknown').length
  return { pass: criteria.strict ? !hasFail && unknownCount === 0 : !hasFail, checks, unknownCount }
}

// Ported verbatim from _psContact() (modules/recruiting.html ~5277-5283).
export function contactStatus(rec: ArchiveRecord): { contactable: boolean; channels: string[]; consent: string } {
  const channels: string[] = []
  if (rec.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(rec.email))) channels.push('email')
  if (rec.phone) channels.push('phone')
  const consent = rec.consent || 'unknown'
  return { contactable: channels.length > 0 && consent !== 'declined', channels, consent }
}

// Ported verbatim from _psCriteriaSummary() (modules/recruiting.html ~5346-5354).
export function criteriaSummary(c: ScreeningCriteria): string {
  const bits: string[] = []
  if (c.minYears != null) bits.push(`≥ ${c.minYears} anni di esperienza`)
  if (c.degree) bits.push(`titolo: ${c.degree}`)
  for (const l of c.nativeLanguages || []) bits.push(`madrelingua ${l}`)
  for (const k of c.keywordsAll || []) bits.push(`"${k}"`)
  for (const k of c.keywordsAny || []) bits.push(`contesto: ${k}`)
  return bits.length ? bits.join(' · ') : 'nessun criterio specifico rilevato'
}

export type ScreeningMatch = {
  name: string
  role: string
  job: string
  icv: number | null
  checks: CriterionCheck[]
  unknownCount: number
  contactable: boolean
  contactChannels: string[]
  consent: string
  email: string
  phone: string
  sourceTag: 'ARCHIVE' | 'NEW_APPLICANT'
  campaignId: string
}

export type ScreeningResult = { criteria: ScreeningCriteria; evaluated: number; total: number; matches: ScreeningMatch[]; source: string }

// Ported from the LOCAL half of _runPrescreenQuery() only (modules/
// recruiting.html ~5307-5324) — see this file's top comment for why the
// backend-fetch half is never attempted. Same per-opening isolation rule:
// ARCHIVE records (from CANDIDATES) are always shared/visible; NEW_APPLICANT
// records (from a candidatePool) are scoped to the currently active
// opening when one is set, otherwise all are visible.
export function runLocalScreeningQuery(q: string, candidates: Candidate[], cvState: CvMatchingState): ScreeningResult {
  const openingId = cvState.activeContext?.openingId || ''
  const criteria = parseScreeningCriteria(q)
  const records = buildLocalArchiveRecords(candidates, cvState).filter((rec) => {
    if (rec.sourceTag === 'ARCHIVE') return true
    return openingId ? rec.campaignId === openingId : true
  })

  const matches: ScreeningMatch[] = []
  for (const rec of records) {
    const ev = evaluateArchiveRecord(rec, criteria)
    if (!ev.pass) continue
    const ct = contactStatus(rec)
    matches.push({
      name: rec.name,
      role: rec.role,
      job: rec.job,
      icv: rec.icv,
      checks: ev.checks,
      unknownCount: ev.unknownCount,
      contactable: ct.contactable,
      contactChannels: ct.channels,
      consent: ct.consent,
      email: rec.email,
      phone: rec.phone,
      sourceTag: rec.sourceTag,
      campaignId: rec.campaignId,
    })
  }
  matches.sort((a, b) => a.unknownCount - b.unknownCount || (b.icv || 0) - (a.icv || 0))

  return { criteria, evaluated: records.length, total: matches.length, matches, source: 'candidati in pagina (servizio ingest non raggiungibile)' }
}

// ================= Q&A ANSWER MODEL =================
// Every canned/free-text answer is built as typed "blocks" instead of an
// HTML string (legacy's _composeAnswer()/QS[].fn() return raw innerHTML) —
// this app renders candidate names and other locally-sourced text as plain
// JSX everywhere else (never dangerouslySetInnerHTML), so answers are
// reproduced as the same structured data, rendered by ask/AskAnswerView.tsx.
// The computed VALUES and WORDING are byte-faithful to source; only the
// string-concatenation-vs-typed-blocks mechanism differs.
export type TextPart = string | { text: string; bold?: true }
export type AskAnswerBlock = { type: 'title'; parts: TextPart[] } | { type: 'paragraph'; parts: TextPart[] } | { type: 'list'; items: TextPart[][] } | { type: 'source'; text: string }
export type AskAnswer = { blocks: AskAnswerBlock[] }

function b(text: string): TextPart {
  return { text, bold: true }
}
function title(...parts: TextPart[]): AskAnswerBlock {
  return { type: 'title', parts }
}
function p(...parts: TextPart[]): AskAnswerBlock {
  return { type: 'paragraph', parts }
}
function list(items: TextPart[][]): AskAnswerBlock {
  return { type: 'list', items }
}
function source(text: string): AskAnswerBlock {
  return { type: 'source', text }
}

export type QuickQuestion = { id: string; question: string; actionTarget: 'ranking' | 'match' | 'formule' | 'profilo'; build: (candidates: Candidate[]) => AskAnswer }

// Ported verbatim from QS[] (modules/recruiting.html ~3316-3382) — same 5
// questions, same wording, same underlying computation (ranking()/ci()/
// flags/ROLES[currentRole].bench — currentRole is fixed to DEFAULT_ROLE in
// this migration, same as everywhere else scoring is used), same
// actionTarget per question (QS[0..4].actionTarget assignment, line 3382).
export const QUICK_QUESTIONS: QuickQuestion[] = [
  {
    id: 'chi-assumere',
    question: 'Chi devo assumere per questo ruolo?',
    actionTarget: 'ranking',
    build: (candidates) => {
      const rk = ranking(candidates)
      const t = rk[0]
      const s = rk[1]
      return {
        blocks: [
          title(`Per il ruolo ${DEFAULT_ROLE}: `, b(t.c.name), '.'),
          p(
            'AHI ',
            b(`${t.r.v}/100`),
            ` (Fit competenze ${t.r.fc} · Big Five ${t.r.ab} · CV ${t.r.icv}). Distacco sul secondo, ${s.c.name}: `,
            b(`${(t.r.v - s.r.v).toFixed(1)} punti`),
            '.',
          ),
          list([
            [`Compatibilità con il vostro benchmark interno (${ROLES[DEFAULT_ROLE].bench.name}): `, b(`${ci(t.c)}%`)],
            t.r.rf.length
              ? [`Attenzione: ${t.r.rf.map((x) => `${x.sk} sotto soglia (${x.s.toFixed(1)}/${x.t})`).join(', ')} — da verificare in colloquio.`]
              : ['Nessuna skill essenziale sotto soglia: profilo pulito.'],
          ]),
          p('La decisione finale resta a chi assume: il sistema motiva, non delibera.'),
          source('Calcolato ora: AHI = 0.55·FC + 0.30·AB + 0.15·ICV sui flag correnti'),
        ],
      }
    },
  },
  {
    id: 'assumere-o-promuovere',
    question: "Meglio assumere o promuovere dall'interno?",
    actionTarget: 'match',
    build: (candidates) => {
      const rk = ranking(candidates)
      const t = rk[0]
      const bench = ROLES[DEFAULT_ROLE].bench
      const civ = ci(t.c)
      return {
        blocks: [
          title(`Confronto esterno vs interno per ${DEFAULT_ROLE}:`),
          p(
            'Il migliore esterno è ',
            b(t.c.name),
            ` (AHI ${t.r.v}), il riferimento interno è `,
            b(bench.name),
            ` (APEX ${bench.apex}/31). Compatibilità tra i due profili: `,
            b(`${civ}%`),
            '.',
          ),
          list([
            [`Se ${bench.name} è promuovibile/spostabile → costo inferiore e rischio minimo, ma lascia scoperto il ruolo attuale.`],
            [`Se serve capacità aggiuntiva (crescita) → l'esterno ${t.c.name} porta un profilo ${civ >= 85 ? 'equivalente ai vostri migliori' : 'complementare a quello interno'}.`],
          ]),
          source('Fonte: Compatibilità Interna CI calcolata sulle skill flaggate'),
        ],
      }
    },
  },
  {
    id: 'rischi-primo',
    question: 'Quali rischi ha il primo in classifica?',
    actionTarget: 'ranking',
    build: (candidates) => {
      const t = ranking(candidates)[0]
      const gaps = Object.entries(DEFAULT_FLAGS)
        .map(([sk, lv]) => ({ sk, lv, gap: W[lv].t - (t.c.scores[sk] || 0) }))
        .filter((g) => g.gap > 0)
        .sort((a, b2) => b2.gap - a.gap)
        .slice(0, 3)
      return {
        blocks: [
          title(`I punti deboli di ${t.c.name} rispetto al profilo:`),
          gaps.length
            ? list(gaps.map((g) => [b(g.sk), ` (${W[g.lv].label.toLowerCase()}): ${t.c.scores[g.sk].toFixed(1)} vs target ${W[g.lv].t} → gap ${g.gap.toFixed(1)} punti`]))
            : p('Nessun gap rispetto ai target: tutte le skill flaggate sono coperte. I rischi residui sono di contesto (integrazione nel team), non di competenza.'),
          ...(gaps.length ? [p('Da indagare nel colloquio finale e da coprire nel piano dei primi 90 giorni.')] : []),
          source('Gap = target − punteggio APEX, sulle skill flaggate'),
        ],
      }
    },
  },
  {
    id: 'perche-red-flag',
    question: 'Perché il red flag blocca un candidato?',
    actionTarget: 'formule',
    build: (candidates) => {
      const rk = ranking(candidates)
      const flagged = rk.find((x) => x.r.capped)
      return {
        blocks: [
          title('Perché la media inganna.'),
          p(
            "Un candidato brillante su tutto ma carente su una skill essenziale fallirà proprio dove il ruolo non perdona. Per questo, se un'essenziale è sotto il 60% del target, l'AHI viene bloccato a 59 a prescindere dal resto.",
          ),
          flagged
            ? list([
                [
                  'Caso attuale: ',
                  b(flagged.c.name),
                  ` — ${flagged.r.rf
                    .filter((x) => x.hard)
                    .map((x) => `${x.sk} a ${x.s.toFixed(1)} vs target ${x.t}`)
                    .join(', ')}. Senza sbarramento sarebbe più in alto in classifica: ecco il valore della regola.`,
                ],
              ])
            : p('Nella classifica attuale nessun candidato è bloccato.'),
          source('Regola di sbarramento: essenziale < 60% del target → AHI ≤ 59'),
        ],
      }
    },
  },
  {
    id: 'classifica-flag',
    question: 'Come cambia la classifica se cambio i flag?',
    actionTarget: 'profilo',
    build: () => ({
      blocks: [
        title('In tempo reale — è il cuore del sistema.'),
        p(
          'Ogni flag modifica i pesi wᵢ e i target Tᵢ della formula del Fit Competenze. Prova: vai su «Profilo», sposta una skill da Utile a Essenziale, torna al ranking. Vedrai i punteggi ricalcolati e, spesso, l\'ordine cambiato.',
        ),
        list([['È anche il modo giusto di usarlo in riunione: chi decide discute ', b('sul profilo'), ' (cosa serve davvero al ruolo), non sulle simpatie.']]),
        source('FC = Σ wᵢ·min(Sᵢ/Tᵢ,1) / Σ wᵢ × 100 — ricalcolata a ogni modifica'),
      ],
    }),
  },
]

// Ported verbatim from _composeAnswer() (modules/recruiting.html
// ~5098-5163), minus the "Protocollo di Intervista" branch's real data
// (INTERVIEW_DATA is a role-keyed store this migration has never ported —
// see PipelineDetail.tsx's own note distinguishing it from Pipeline's
// per-candidate interview scorecard). That branch is reproduced honestly as
// "always not yet compiled" — which is exactly what legacy itself shows
// whenever INTERVIEW_DATA has nothing saved for the current role, not a
// fabricated result. Likewise, INTERNAL_TALENTS' count (only referenced in
// the generic ctxSummary line) is omitted from the summary line rather than
// hardcoded, since this composer has no talents parameter — every other
// branch is otherwise byte-faithful.
export function composeAnswer(q: string, candidates: Candidate[]): AskAnswer {
  const qn = normalizeText(q)
  const rank = ranking(candidates)
  const essentials = Object.entries(DEFAULT_FLAGS)
    .filter(([, l]) => l === 3)
    .map(([s]) => s)

  const ctxSummary = (): TextPart[] => [
    `Ruolo: ${DEFAULT_ROLE}. Candidati: ${candidates.length}. Skill essenziali (${essentials.length}): ${essentials.join(', ') || '—'}. Top 5: ${rank
      .slice(0, 5)
      .map((r, i) => `#${i + 1} ${r.c.name} (${r.r.v.toFixed(1)}pt)`)
      .join('; ')}.`,
  ]

  if (/verbale|scheda di valutazione|report final|colloqui|intervista/.test(qn)) {
    const wantVerbale = /verbale|intervista/.test(qn)
    const wantValutazione = /scheda|valutazione/.test(qn)
    const wantReport = /report/.test(qn)
    const sections: string[] = []
    if (wantVerbale || (!wantValutazione && !wantReport)) sections.push('Scheda Intervista Strutturata')
    if (wantValutazione || (!wantVerbale && !wantReport)) sections.push('Scheda Valutazione Candidato')
    if (wantReport || (!wantVerbale && !wantValutazione)) sections.push('Report Finale Valutativo')
    return {
      blocks: [
        title('Protocollo di Intervista SKILL-VISION®'),
        p(...ctxSummary()),
        ...sections.map((title2) => p(b(title2), `: non ancora compilata per il ruolo «${DEFAULT_ROLE}»`)),
      ],
    }
  }

  const mentioned = candidates.filter((c) => {
    const n = normalizeText(c.name)
    return n.split(/\s+/).some((w) => w.length > 2 && qn.includes(w))
  })
  if (mentioned.length) {
    const c = mentioned[0]
    const total = rank.find((r) => r.c.id === c.id)?.r.v ?? 0
    const pos = rank.findIndex((r) => r.c.id === c.id) + 1
    const scores = Object.entries(c.scores || {}).sort((a, b2) => b2[1] - a[1])
    const top3 = scores.slice(0, 3).map(([n, v]) => `${n} (${v.toFixed(1)}/31)`)
    const weak3 = scores.slice(-3).map(([n, v]) => `${n} (${v.toFixed(1)}/31)`)
    const essCov = essentials.filter((s) => c.scores?.[s] != null)
    const compatPct = essentials.length ? Math.round((essCov.length / essentials.length) * 100) : null
    return {
      blocks: [
        title(`${c.name} — analisi`),
        p(...ctxSummary()),
        p('Ruolo: ', b(c.role || '—'), ' · Rank: ', b(`#${pos}/${candidates.length}`), ' · Score: ', b(total.toFixed(1))),
        ...(compatPct !== null ? [p('Compatibilità: ', b(`${compatPct}%`), ` — ${essCov.length}/${essentials.length} skill essenziali`)] : []),
        p('Punti di forza: ', top3.join(', ') || '—'),
        p('Aree di miglioramento: ', weak3.join(', ') || '—'),
        p('Giudizio: ', b(pos <= 3 ? 'Prima fascia' : pos <= 10 ? 'Profilo solido' : 'Candidato di riserva')),
      ],
    }
  }

  if (/miglior|top|piu adatt|primo|forte|best/.test(qn)) {
    return {
      blocks: [
        title(`Top 5 per "${DEFAULT_ROLE}"`),
        p(...ctxSummary()),
        list(
          rank.slice(0, 5).map((r) => {
            const cp = essentials.length ? Math.round((essentials.filter((s) => r.c.scores?.[s] != null).length / essentials.length) * 100) : null
            return [b(r.c.name), ` — ${r.r.v.toFixed(1)}pt${cp !== null ? ` · ${cp}% ess.` : ''}`]
          }),
        ),
      ],
    }
  }

  const skHit = SKILLS.find((s) => qn.includes(normalizeText(s)))
  if (skHit) {
    const vals = candidates
      .map((c) => ({ n: c.name, v: c.scores?.[skHit] }))
      .filter((x): x is { n: string; v: number } => x.v != null)
      .sort((a, b2) => b2.v - a.v)
    const avg = vals.length ? vals.reduce((a, b2) => a + b2.v, 0) / vals.length : 0
    return {
      blocks: [
        title(`Skill: ${skHit}`),
        p('Media: ', b(`${avg.toFixed(2)}/31`), ` · ${vals.length} candidati`),
        p('Top 3: ', vals.slice(0, 3).map((x) => `${x.n} (${x.v.toFixed(1)})`).join(', ')),
      ],
    }
  }

  if (/job descri|job prof|jd|scheda|mansione/.test(qn)) {
    return { blocks: [title('Job Profile'), p(...ctxSummary())] }
  }

  if (/confron|versus|vs |differ/.test(qn)) {
    return {
      blocks: [
        title('Confronto top 3'),
        ...rank.slice(0, 3).map((r, i) => {
          const cp = essentials.length ? Math.round((essentials.filter((s) => r.c.scores?.[s] != null).length / essentials.length) * 100) : null
          return p(b(`#${i + 1} ${r.c.name}`), ` · ${r.r.v.toFixed(1)}pt${cp !== null ? ` · ${cp}% ess.` : ''}`)
        }),
      ],
    }
  }

  return {
    blocks: [
      title('Panoramica'),
      p(...ctxSummary()),
      p('Top 3: ', rank.slice(0, 3).map((r, i) => `#${i + 1} ${r.c.name} (${r.r.v.toFixed(1)})`).join(' · ')),
      source('Prova: nome candidato · "chi è il migliore" · nome skill · "confronto" · "job profile"'),
    ],
  }
}
