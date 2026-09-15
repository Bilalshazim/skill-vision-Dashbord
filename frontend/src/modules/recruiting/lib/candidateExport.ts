import { DEFAULT_FLAGS, DEFAULT_ROLE } from '@/modules/recruiting/lib/constants'
import { downloadFile } from '@/modules/recruiting/lib/download'
import { type AhiResult, ci, fasce, skillTierSums } from '@/modules/recruiting/lib/scoring'
import type { Candidate } from '@/modules/recruiting/lib/types'

const csvEsc = (v: unknown) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`
const safeFileName = (name: string) => name.replace(/[ .]/g, '_')

// Ported verbatim from downloadCandidateReport() (modules/recruiting.html
// ~2970-3003) — same rows, same order, same ';' delimiter and UTF-8 BOM
// (Italian-locale Excel convention), same trailing per-essential-skill
// breakdown section. `position`/`totalRanked` are passed in rather than
// recomputed here, since the caller (RankingCard) already has them from its
// own ranking() call — avoids a second ranking pass for one row.
export function downloadCandidateReport(c: Candidate, r: AhiResult, position: number, totalRanked: number): void {
  const f = fasce(r.v, r.capped)
  const sums = skillTierSums(c)
  const hardRf = r.rf.filter((x) => x.hard)

  const rows: [string, string | number][] = [
    ['Candidato', c.name],
    ['Ruolo', DEFAULT_ROLE],
    ['Posizione in classifica', `${position} / ${totalRanked}`],
    ['Fonte', c.src || ''],
    ['AHI /100', r.v],
    ['Fascia', f.txt],
    ['Fit competenze (55%)', r.fc],
    ['Affinità Big Five (30%)', r.ab],
    ['Indice CV — ML (15%)', r.icv],
    ['Skill essenziali (tot.)', sums.essential.sum.toFixed(1)],
    ['Skill importanti (tot.)', sums.important.sum.toFixed(1)],
    ['Skill utili (tot.)', sums.useful.sum.toFixed(1)],
    ['Red flag / sbarramento', r.capped ? 'SI' : 'NO'],
    ['Dettaglio sbarramento', hardRf.map((x) => `${x.sk} (${x.s.toFixed(1)} vs target ${x.t})`).join(' | ') || '—'],
  ]

  let csv = '﻿' + rows.map((row) => row.map(csvEsc).join(';')).join('\r\n') + '\r\n\r\nSkill essenziali vs target\r\n'
  Object.entries(DEFAULT_FLAGS)
    .filter(([, lv]) => lv === 3)
    .forEach(([sk]) => {
      csv += [sk, (c.scores[sk] || 0).toFixed(1), '/31'].map(csvEsc).join(';') + '\r\n'
    })

  downloadFile(`report_valutazione_${safeFileName(c.name)}.csv`, csv, 'text/csv')
}

// Ported verbatim from exportOneJSON() (modules/recruiting.html
// ~3286-3289) — same fields, same key names (kept in Italian, matching the
// legacy ATS-facing export format), same nested `dettaglio` shape.
export function downloadCandidateProfileJson(c: Candidate, r: AhiResult): void {
  const out = {
    nome: c.name,
    ruolo: DEFAULT_ROLE,
    ahi: r.v,
    dettaglio: r,
    compatibilita_interna: ci(c),
    soft_skills: c.scores,
    big_five: c.bf,
  }
  downloadFile(`profilo_${safeFileName(c.name)}.json`, JSON.stringify(out, null, 2), 'application/json')
}

// PHASE 16 (CV & Esportazione) — ported verbatim from exportCSV() (modules/
// recruiting.html ~3271-3277), the whole-ranking export behind "⬇ Scarica
// ranking (CSV)". Unlike downloadCandidateReport() above (one row per
// candidate, many fields), this is one row per RANKED candidate with a
// fixed, short column set — a different legacy export, not a duplicate of
// it. `rk` is the caller's own ranking() result (same convention as
// downloadCandidateReport's position/totalRanked — avoid a second ranking
// pass here).
export function downloadRankingCsv(rk: { c: Candidate; r: AhiResult }[]): void {
  let csv = 'Posizione;Candidato;AHI;FitCompetenze;AffinitaBigFive;IndiceCV;RedFlag;Ruolo\n'
  rk.forEach(({ c, r }, i) => {
    csv += `${i + 1};${c.name};${r.v};${r.fc};${r.ab};${r.icv};${r.capped ? 'SI' : 'NO'};${DEFAULT_ROLE}\n`
  })
  downloadFile(`ranking_${DEFAULT_ROLE.replace(/ /g, '_')}.csv`, csv, 'text/csv')
}

// PHASE 16 — ported verbatim from exportJSON() (modules/recruiting.html
// ~3278-3284), the whole-ranking export behind "⬇ Profili completi (JSON
// per ATS)". Same field names/order/nesting as legacy, including the
// embedded `formula` description string and `profilo_flag` (DEFAULT_FLAGS).
export function downloadRankingJson(rk: { c: Candidate; r: AhiResult }[]): void {
  const out = {
    generato: new Date().toISOString(),
    ruolo: DEFAULT_ROLE,
    profilo_flag: DEFAULT_FLAGS,
    formula: 'AHI = 0.55*FC + 0.30*AB + 0.15*ICV (cap 59 se essenziale < 60% target)',
    candidati: rk.map(({ c, r }, i) => ({
      posizione: i + 1,
      nome: c.name,
      ahi: r.v,
      fit_competenze: r.fc,
      affinita_bigfive: r.ab,
      indice_cv: r.icv,
      red_flag: r.capped,
      compatibilita_interna: ci(c),
      soft_skills: c.scores,
      big_five: c.bf,
    })),
  }
  downloadFile(`profili_ats_${DEFAULT_ROLE.replace(/ /g, '_')}.json`, JSON.stringify(out, null, 2), 'application/json')
}
