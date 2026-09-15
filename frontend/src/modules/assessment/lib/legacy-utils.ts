import {
  APEX5D_DIMENSIONS_EN,
  APEX5D_DIMENSIONS_IT,
  APEX_SOURCES_EN,
  APEX_SOURCES_IT,
  BIGFIVE_DIMS_EN,
  BIGFIVE_DIMS_IT,
  LEVEL_ANCHORS_EN,
  LEVEL_ANCHORS_IT,
  NAV_CONFIG_EN,
  NAV_CONFIG_IT,
  PAGE_META_TEXT_EN,
  PAGE_META_TEXT_IT,
  SOFT_CLUSTERS_EN,
  SOFT_CLUSTERS_IT,
  SOFT_SKILLS_EN,
  SOFT_SKILLS_IT,
  TIER_DEFS_EN,
  TIER_DEFS_IT,
} from '@/modules/assessment/lib/legacy-taxonomy'
import { UI_EN, UI_IT } from '@/modules/assessment/lib/legacy-ui-text'

// Ported verbatim from js/assessment.js's small utility helpers (~2450-2484).
// Legacy keeps the "current language" as a mutable module-level `let UI = UI_IT`
// that every function reads implicitly; React has no equivalent of that
// (state must flow through props/context), so every helper below takes an
// explicit `lang` instead of reading a global. The math/formatting/labels
// themselves are unchanged.

export type AssessmentLang = 'it' | 'en'

export function getUI(lang: AssessmentLang) {
  return lang === 'it' ? UI_IT : UI_EN
}
export function getLevelAnchors(lang: AssessmentLang) {
  return lang === 'it' ? LEVEL_ANCHORS_IT : LEVEL_ANCHORS_EN
}
export function getNavConfig(lang: AssessmentLang) {
  return lang === 'it' ? NAV_CONFIG_IT : NAV_CONFIG_EN
}
export function getPageMeta(lang: AssessmentLang, pageId: string) {
  const table = lang === 'it' ? PAGE_META_TEXT_IT : PAGE_META_TEXT_EN
  return table[pageId] || { title: '', sub: '' }
}
export function getSoftSkills(lang: AssessmentLang) {
  return lang === 'it' ? SOFT_SKILLS_IT : SOFT_SKILLS_EN
}
export function getApex5dDimensions(lang: AssessmentLang) {
  return lang === 'it' ? APEX5D_DIMENSIONS_IT : APEX5D_DIMENSIONS_EN
}
export function getApexSources(lang: AssessmentLang) {
  return lang === 'it' ? APEX_SOURCES_IT : APEX_SOURCES_EN
}
export function getSoftClusters(lang: AssessmentLang) {
  return lang === 'it' ? SOFT_CLUSTERS_IT : SOFT_CLUSTERS_EN
}
export function getBigFiveDims(lang: AssessmentLang) {
  return lang === 'it' ? BIGFIVE_DIMS_IT : BIGFIVE_DIMS_EN
}
export function getTierDefs(lang: AssessmentLang) {
  return lang === 'it' ? TIER_DEFS_IT : TIER_DEFS_EN
}

export const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9)
export const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
export const round1 = (n: number) => Math.round(n * 10) / 10
export const fmt1 = (n: number) => (isFinite(n) ? round1(n).toFixed(1) : '–')
// Same one-decimal rounding as fmt1, but with an Italian decimal comma — used where the display
// is explicitly meant to read "-0,8" rather than "-0.8" (e.g. the Benchmark Gap card).
export const fmt1it = (n: number) => (isFinite(n) ? round1(n).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '–')
export const fmtCurrency = (n: number) => (isFinite(n) ? '€ ' + Math.round(n).toLocaleString('it-IT') : '–')
export const initials = (nome: string, cognome: string) => ((nome || ' ')[0] + (cognome || ' ')[0]).toUpperCase()

export function genderDisplayLabel(sesso: string, lang: AssessmentLang): string {
  const UI = getUI(lang)
  return ({ F: UI.genderFemale, M: UI.genderMale, Altro: UI.genderOther } as Record<string, string>)[sesso] || ''
}
export function contractTypeDisplayLabel(tipo: string, lang: AssessmentLang): string {
  const UI = getUI(lang)
  return (
    ({ dipendente: UI.contractTypeDipendente, cocopro: UI.contractTypeCocopro, partitaIva: UI.contractTypePartitaIva, esterno: UI.contractTypeEsterno } as Record<string, string>)[tipo] ||
    UI.contractTypeDipendente
  )
}

// Ported verbatim from archiveReasonLabel() (js/assessment.js ~5449-5452).
export function archiveReasonLabel(key: string, lang: AssessmentLang): string {
  const UI = getUI(lang) as unknown as Record<string, string>
  return ({ pensione: UI.archiveReasonPensione, licenziamento: UI.archiveReasonLicenziamento, probation: UI.archiveReasonProbation, altro: UI.archiveReasonAltro } as Record<string, string>)[key] || key
}
// Ported verbatim from assessmentSourceLabel() (js/assessment.js ~4134-4146).
export function assessmentSourceLabel(source: string, lang: AssessmentLang): string {
  const bySource = getApexSources(lang).find((s) => s.key === source)
  if (bySource) return bySource.label
  const UI = getUI(lang) as unknown as Record<string, string>
  if (source === 'import_xlsx') return UI.sourceLabelImportXlsx
  if (source === 'external_pdf') return UI.sourceLabelExternalPdf
  return source || '—'
}

export function levelFor(score: number, lang: AssessmentLang) {
  const anchors = getLevelAnchors(lang)
  for (const l of anchors) {
    if (score >= l.min && score <= l.max) return l
  }
  return anchors[0]
}
export function semanticChip(score: number, thresholds = { good: 7, mid: 5 }): 'chip-green' | 'chip-amber' | 'chip-red' {
  if (score >= thresholds.good) return 'chip-green'
  if (score >= thresholds.mid) return 'chip-amber'
  return 'chip-red'
}

// Ported verbatim from exiScoreTier()/exiRiskTier() (js/assessment.js
// ~5881-5890) — Executive Interview score tiers. Q5 (organizational risk)
// runs on an inverted scale (high = bad), so exiRiskTier flips it.
export function exiScoreTier(v: number, lang: AssessmentLang) {
  const UI = getUI(lang)
  if (v < 3) return { label: UI.exiTierCritico, color: 'var(--danger)' }
  if (v < 5) return { label: UI.exiTierInsufficiente, color: 'var(--warning)' }
  if (v < 6.5) return { label: UI.exiTierDiscreto, color: 'var(--text-2)' }
  if (v < 8) return { label: UI.exiTierBuono, color: 'var(--accent-dark)' }
  return { label: UI.exiTierEccellente, color: 'var(--success)' }
}
export function exiRiskTier(v: number, lang: AssessmentLang) {
  return exiScoreTier(10 - v, lang)
}
