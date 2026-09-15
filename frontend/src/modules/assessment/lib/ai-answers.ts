import {
  classifyPopulation,
  filterByArea,
  homeStats,
  moduleActive,
  orgCriticalAreas,
  orgWorstHardDims,
  orgWorstSoftSkills,
  primaryScore,
  primaryScoreLabel,
  priorityActions,
  rankedEmployees,
  worstCompetenza,
} from '@/modules/assessment/lib/calculations'
import { areasList } from '@/modules/assessment/lib/calculations'
import { avg, fmt1, getSoftClusters, getSoftSkills, getUI, round1, type AssessmentLang } from '@/modules/assessment/lib/legacy-utils'
import type { AssessmentState } from '@/modules/assessment/lib/types'

// Ported verbatim from js/assessment.js's local AI answer functions
// (~7974-8047) — all data-driven, all fully offline (no network call).
// Only handleFreeform()'s Anthropic fallback is NOT ported (see
// AssessmentAiPage.tsx's own note and the final report's AI Assistant
// section).
export function ansAndamento(state: AssessmentState, lang: AssessmentLang): string {
  const ui = getUI(lang)
  const hs = homeStats(state, lang)
  const rel = hs.orgAvg >= hs.benchmark ? ui.aiRelInLine : hs.orgAvg >= hs.benchmark - 1 ? ui.aiRelSlightlyBelow : ui.aiRelBelow
  return ui.aiAndamentoTemplate(fmt1(hs.orgAvg), primaryScoreLabel(state, lang), rel, fmt1(hs.benchmark), hs.tiers.top.length + hs.tiers.valorizzare.length, state.employees.length, hs.tiers.sviluppo.length + hs.tiers.critica.length, hs.feedbackDue)
}
export function ansAreeCritiche(state: AssessmentState, lang: AssessmentLang): string {
  const ui = getUI(lang)
  const a = orgCriticalAreas(state, lang, 3)
  return ui.aiAreeCriticheIntro + '\n' + a.map((x, i) => ui.aiAreeCriticheLine(i + 1, x.area, fmt1(x.avg), x.count)).join('\n')
}
export function ansTopTalent(state: AssessmentState, lang: AssessmentLang): string {
  const ui = getUI(lang)
  const tiers = classifyPopulation(state, lang)
  const list = [...tiers.top, ...tiers.valorizzare].sort((a, b) => primaryScore(b, state, lang) - primaryScore(a, state, lang)).slice(0, 8)
  if (!list.length) return ui.aiNoTopTalent
  return ui.aiTopTalentIntro + '\n' + list.map((e) => `• ${e.nome} ${e.cognome} (${e.ruolo}, ${e.area}) — ${fmt1(primaryScore(e, state, lang))}/10`).join('\n')
}
export function ansRischio(state: AssessmentState, lang: AssessmentLang): string {
  const ui = getUI(lang)
  const tiers = classifyPopulation(state, lang)
  const list = [...tiers.critica, ...tiers.sviluppo].sort((a, b) => primaryScore(a, state, lang) - primaryScore(b, state, lang)).slice(0, 8)
  if (!list.length) return ui.aiNoRischio
  return ui.aiRischioIntro + '\n' + list.map((e) => `• ${e.nome} ${e.cognome} (${e.ruolo}, ${e.area}) — ${fmt1(primaryScore(e, state, lang))}/10${e.feedbackNeeded ? ui.aiDebriefFlaggedSuffix : ''}`).join('\n')
}
export function ansGapCompetenze(state: AssessmentState, lang: AssessmentLang): string {
  const ui = getUI(lang)
  const A = moduleActive(state, 'A')
  const B = moduleActive(state, 'B')
  let out = ''
  if (A) out += ui.aiSoftGapIntro + '\n' + orgWorstSoftSkills(state, lang, 5).map((s) => ui.aiSoftGapLine(s.name, fmt1(s.ottenuto), fmt1(s.atteso), fmt1(s.gap))).join('\n')
  if (B) out += (out ? '\n\n' : '') + ui.aiHardGapIntro + '\n' + orgWorstHardDims(state, lang, 3).map((d) => ui.aiHardGapLine(d.name, fmt1(d.avg))).join('\n')
  return out || ui.aiNoModuleForGap
}
export function ansRanking(state: AssessmentState, lang: AssessmentLang): string {
  const ui = getUI(lang)
  const ranked = rankedEmployees(state, lang).slice(0, 10)
  return ui.aiRankingIntro(primaryScoreLabel(state, lang)) + '\n' + ranked.map((r, i) => `${i + 1}. ${r.emp.nome} ${r.emp.cognome} — ${fmt1(r.score)}/10`).join('\n')
}
export function ansFormazione(state: AssessmentState, lang: AssessmentLang): string {
  const ui = getUI(lang)
  const actions = priorityActions(state, lang)
  return (
    ui.aiFormazioneIntro +
    '\n' +
    actions
      .map((a) => `${a.icon} ${a.parts.map((p) => (typeof p === 'string' ? p : p.bold)).join('')}`)
      .join('\n')
  )
}
export function ansColloqui(state: AssessmentState, lang: AssessmentLang): string {
  const ui = getUI(lang)
  const list = state.employees.filter((e) => e.feedbackNeeded)
  if (!list.length) return ui.aiNoColloqui
  return ui.aiColloquiIntro(list.length) + '\n' + list.map((e) => `• ${e.nome} ${e.cognome} (${e.ruolo})`).join('\n')
}
export function ansAree(state: AssessmentState, lang: AssessmentLang): string {
  const ui = getUI(lang)
  return areasList(state)
    .map((a) => {
      const emps = filterByArea(state, a)
      return ui.aiAreeLine(a, emps.length, fmt1(avg(emps.map((e) => primaryScore(e, state, lang)))))
    })
    .join('\n')
}
export function ansBigFive(state: AssessmentState, lang: AssessmentLang): string {
  const ui = getUI(lang)
  if (!moduleActive(state, 'A')) return ui.aiNoModuleA
  const SOFT_SKILLS = getSoftSkills(lang)
  const bfOrder = ['O', 'C', 'E', 'A', 'S'] as const
  const bfLabels: Record<string, string> = { O: 'Apertura Mentale', C: 'Coscienziosità', E: 'Estroversione', A: 'Amicalità', S: 'Stabilità Emotiva' }
  const out = bfOrder
    .map((d) => {
      const ids = SOFT_SKILLS.filter((s) => s.dim === d).map((s) => s.id)
      const v = round1(avg(state.employees.flatMap((e) => ids.map((id) => (e.soft[id] || { ottenuto: 0 }).ottenuto))))
      return `• ${bfLabels[d]}: ${fmt1(v)}/10`
    })
    .join('\n')
  return ui.aiBigFiveIntro + '\n' + out
}
export function ansPromotionReady(state: AssessmentState, lang: AssessmentLang): string {
  const ui = getUI(lang)
  const tiers = classifyPopulation(state, lang)
  const list = [...tiers.top].sort((a, b) => primaryScore(b, state, lang) - primaryScore(a, state, lang))
  if (!list.length) return ui.aiNoPromotion
  return ui.aiPromotionIntro + '\n' + list.map((e) => `• ${e.nome} ${e.cognome} — ${e.ruolo}, ${e.area} — ${fmt1(primaryScore(e, state, lang))}/10`).join('\n')
}
export function ansUrgentTraining(state: AssessmentState, lang: AssessmentLang): string {
  const ui = getUI(lang)
  const tiers = classifyPopulation(state, lang)
  const list = [...tiers.critica, ...tiers.sviluppo].sort((a, b) => primaryScore(a, state, lang) - primaryScore(b, state, lang)).slice(0, 10)
  if (!list.length) return ui.aiNoUrgentTraining
  const worst = worstCompetenza(state, lang, { A: moduleActive(state, 'A'), B: moduleActive(state, 'B') })
  const worstLine = worst ? ui.aiWorstCompetencyLine(worst.name, fmt1(worst.gap)) : ''
  return ui.aiUrgentTrainingIntro(list.length) + '\n' + list.map((e) => `• ${e.nome} ${e.cognome} — ${e.ruolo}, ${e.area} — ${fmt1(primaryScore(e, state, lang))}/10`).join('\n') + worstLine
}
export function ansSoftSkillsSummary(state: AssessmentState, lang: AssessmentLang): string {
  const ui = getUI(lang)
  if (!state.employees.length) return ui.aiNoEmployeesSoft
  const SOFT_SKILLS = getSoftSkills(lang)
  const SOFT_CLUSTERS = getSoftClusters(lang)
  const overall = round1(avg(state.employees.flatMap((e) => SOFT_SKILLS.map((s) => (e.soft[s.id] || { ottenuto: 0 }).ottenuto))))
  const clusterLines = SOFT_CLUSTERS.map((c) => {
    const items = SOFT_SKILLS.filter((s) => s.cluster === c)
    const v = round1(avg(state.employees.flatMap((e) => items.map((i) => (e.soft[i.id] || { ottenuto: 0 }).ottenuto))))
    return `• ${c}: ${fmt1(v)}/10`
  }).join('\n')
  const worst = orgWorstSoftSkills(state, lang, 3)
    .map((s) => `• ${s.name} (Δ ${fmt1(s.gap)})`)
    .join('\n')
  return ui.aiSoftSummaryTemplate(fmt1(overall), state.employees.length, clusterLines, worst)
}

// featuredQuestions()/suggestedQuestions() — ported verbatim from
// js/assessment.js ~7951-7972. Note the exact legacy quirk: the first
// featured question uses UI.aiQAreeCritiche (the long form), while
// suggestedQuestions' area-gap entry uses the separate UI.aiQAreeCriticheShort
// label — both wired to the same ansAreeCritiche handler.
export function featuredQuestions(lang: AssessmentLang) {
  const ui = getUI(lang)
  return [
    { label: ui.aiQAreeCritiche, handler: ansAreeCritiche },
    { label: ui.aiQPromotionReady, handler: ansPromotionReady },
    { label: ui.aiQUrgentTraining, handler: ansUrgentTraining },
    { label: ui.aiQSoftSkillsSummary, handler: ansSoftSkillsSummary },
  ]
}
export function suggestedQuestions(lang: AssessmentLang) {
  const ui = getUI(lang)
  return [
    { label: ui.aiQAndamento, handler: ansAndamento },
    { label: ui.aiQAreeCriticheShort, handler: ansAreeCritiche },
    { label: ui.aiQTopTalent, handler: ansTopTalent },
    { label: ui.aiQRischio, handler: ansRischio },
    { label: ui.aiQGapCompetenze, handler: ansGapCompetenze },
    { label: ui.aiQRanking, handler: ansRanking },
    { label: ui.aiQFormazione, handler: ansFormazione },
    { label: ui.aiQColloqui, handler: ansColloqui },
    { label: ui.aiQAree, handler: ansAree },
    { label: ui.aiQBigFive, handler: ansBigFive },
  ]
}

// localIntentMatch() — ported verbatim from js/assessment.js ~8124-8141.
// Keyword-based, offline, bilingual (checks both EN and IT phrasing
// regardless of current UI language, exactly as legacy does).
export function localIntentMatch(text: string, state: AssessmentState, lang: AssessmentLang): string | null {
  const q = text.toLowerCase()
  const has = (...words: string[]) => words.some((w) => q.includes(w))
  if (has('how is', 'doing overall', 'overall status', 'well or badly', 'come stiamo andando', 'andamento generale', 'bene o male')) return ansAndamento(state, lang)
  if (has('promotion', 'ready for promotion', 'promozione', 'pronti per la promozione')) return ansPromotionReady(state, lang)
  if (has('urgent', 'urgente') && has('training', 'intervention', 'formazione', 'intervento')) return ansUrgentTraining(state, lang)
  if (has('soft skill', 'competenze trasversali') && has('summary', 'status', 'state', 'overview', 'riepilogo', 'sintesi', 'panoramica', 'stato')) return ansSoftSkillsSummary(state, lang)
  if (has('critical', 'critich', 'critic') && has('area', 'aree')) return ansAreeCritiche(state, lang)
  if (has('top talent', 'talent', 'high value', 'best', 'talento', 'alto valore', 'migliori')) return ansTopTalent(state, lang)
  if (has('risk', 'critical', 'rischio', 'critic') && has('person', 'employee', 'who', 'persona', 'dipendente', 'chi')) return ansRischio(state, lang)
  if (has('gap', 'distance', 'distanza') && has('competenc', 'skill')) return ansGapCompetenze(state, lang)
  if (has('ranking', 'classifica')) return ansRanking(state, lang)
  if (has('training', 'coaching', 'priorit', 'suggestion', 'formazione', 'suggeriment')) return ansFormazione(state, lang)
  if (has('debrief', 'feedback', 'colloqui', 'colloquio')) return ansColloqui(state, lang)
  if (has('distribution', 'distribuzione') && has('area', 'aree')) return ansAree(state, lang)
  if (has('big five', 'ocean', 'personality', 'personalit')) return ansBigFive(state, lang)
  return null
}

// formatAIText() — ported verbatim from js/assessment.js ~8080-8097.
// Converts a plain-text bot answer ("• " bullets, blank-line paragraphs)
// into an array of block descriptors for JSX rendering (legacy builds raw
// HTML via esc(); here we return data and let the component render real
// <ul>/<li>/<p> elements, with "N/10", "N%", and "Δ N" spans emphasized).
export type AiTextBlock = { type: 'p' | 'li'; text: string }
export function formatAIBlocks(text: string): AiTextBlock[] {
  const lines = text.split('\n')
  const blocks: AiTextBlock[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('•')) {
      blocks.push({ type: 'li', text: trimmed.slice(1).trim() })
    } else if (trimmed) {
      blocks.push({ type: 'p', text: trimmed })
    }
  }
  return blocks
}
const EMPHASIS_RE = /(\d+(?:\.\d+)?\/10|\d+(?:\.\d+)?%|Δ ?-?\d+(?:\.\d+)?)/g
export function splitEmphasis(text: string): (string | { bold: string })[] {
  const parts: (string | { bold: string })[] = []
  let lastIndex = 0
  for (const m of text.matchAll(EMPHASIS_RE)) {
    if (m.index! > lastIndex) parts.push(text.slice(lastIndex, m.index))
    parts.push({ bold: m[0] })
    lastIndex = m.index! + m[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}
