import { evaluatedEmployees, orgCriticalAreas, orgCriticalRoles, primaryScore, tierFor, worstCompetenza } from '@/modules/assessment/lib/calculations'
import { getSoftSkills, round1, type AssessmentLang } from '@/modules/assessment/lib/legacy-utils'
import { TIER_ORDER, type TierKey } from '@/modules/assessment/lib/tier-display'
import type { AssessmentState, Employee } from '@/modules/assessment/lib/types'

// I numeri delle pagine dei risultati di Assessment (CLAUDE.md, Fase 6, "Le
// pagine dei risultati"): tutto si calcola qui dai dati, le pagine scrivono
// le frasi. Una classificazione sola, le cinque fasce di `tierFor` (le stesse
// della Panoramica): sotto la norma = Da potenziare + Critici, sopra la norma
// = Alto potenziale + Alto valore. Le quote sono "sulle persone valutate", come
// dice CLAUDE.md: si classificano solo le persone con almeno una valutazione
// (chi non ne ha avrebbe punteggio 0 e finirebbe fra i Critici).

/** Il valore atteso, su 10: lo stesso benchmark di homeStats e della Panoramica. */
export const ATTESO = 7.0

export type RankedPerson = { e: Employee; score: number; tier: TierKey }

/** Gli interventi del piano di sviluppo, per fascia: gli stessi della Panoramica e dell'esportazione del piano d'azione. */
export const INTERVENTI: { key: 'training' | 'coaching' | 'reorg' | 'talent'; tier: TierKey }[] = [
  { key: 'training', tier: 'sviluppo' },
  { key: 'coaching', tier: 'valorizzare' },
  { key: 'reorg', tier: 'critica' },
  { key: 'talent', tier: 'top' },
]

export function assessmentResults(state: AssessmentState, lang: AssessmentLang) {
  const f = { A: state.settings.modulo === 'A' || state.settings.modulo === 'AB', B: state.settings.modulo === 'B' || state.settings.modulo === 'AB' }
  const evaluated = evaluatedEmployees(state)
  const ranked: RankedPerson[] = evaluated
    .map((e) => {
      const score = primaryScore(e, state, lang)
      return { e, score, tier: tierFor(score, lang).key as TierKey }
    })
    .sort((a, b) => b.score - a.score)
  const total = ranked.length
  const byTier = Object.fromEntries(TIER_ORDER.map((k) => [k, ranked.filter((r) => r.tier === k)])) as Record<TierKey, RankedPerson[]>
  const above = byTier.top.length + byTier.valorizzare.length
  const below = byTier.sviluppo.length + byTier.critica.length
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : null)

  // Interventi: ogni persona sta in una fascia sola, quindi ha un intervento
  // solo e conta una volta (CLAUDE.md: "una persona con più interventi conta
  // una volta"). "Nella norma" non ha un intervento.
  const interventi = INTERVENTI.map((i) => ({ ...i, count: byTier[i.tier].length }))
  const withIntervention = interventi.reduce((n, i) => n + i.count, 0)
  const mostFrequent = interventi.reduce((best, i) => (i.count > best.count ? i : best), interventi[0])

  // Competenza più forte: la competenza trasversale con la distanza positiva
  // più alta dall'atteso, sulla media delle persone valutate.
  let bestSoft: { name: string; gap: number } | null = null
  if (f.A && total) {
    for (const s of getSoftSkills(lang)) {
      const vals = evaluated.map((e) => e.soft[s.id]).filter((v): v is { ottenuto: number; atteso: number } => !!v && v.ottenuto > 0)
      if (!vals.length) continue
      const gap = round1(vals.reduce((n, v) => n + (v.ottenuto - v.atteso), 0) / vals.length)
      if (gap > 0 && (!bestSoft || gap > bestSoft.gap)) bestSoft = { name: s.name, gap }
    }
  }

  // Dove si perde: aree e mansioni sotto l'atteso, dalla più lontana (come
  // "Dove guardare" nella Panoramica), e la competenza più lontana.
  const gapRows = (list: { label: string; avg: number }[]) =>
    list
      .map((r) => ({ label: r.label, gap: round1(ATTESO - r.avg) }))
      .filter((r) => r.gap > 0.05)
      .sort((a, b) => b.gap - a.gap)
  const areasBelow = total ? gapRows(orgCriticalAreas(state, lang, 50).map((a) => ({ label: a.area, avg: a.avg }))) : []
  const rolesBelow = total ? gapRows(orgCriticalRoles(state, lang, 50).map((r) => ({ label: r.ruolo, avg: r.avg }))) : []
  const worstSkill = total ? worstCompetenza(state, lang, f) : null
  // La mansione più lontana dentro l'area più lontana: è da lì che si suggerisce di partire.
  const worstAreaName = areasBelow[0]?.label
  const inArea = new Map<string, number[]>()
  ranked.filter((r) => r.e.area === worstAreaName && r.e.ruolo).forEach((r) => inArea.set(r.e.ruolo, [...(inArea.get(r.e.ruolo) ?? []), r.score]))
  const mean = (l: number[]) => l.reduce((n, v) => n + v, 0) / l.length
  const worstRoleInArea = [...inArea.entries()].sort((a, b) => mean(a[1]) - mean(b[1]))[0]?.[0] ?? null

  return {
    total,
    employees: state.employees.length,
    ranked,
    byTier,
    above,
    below,
    abovePct: pct(above),
    belowPct: pct(below),
    interventi,
    withIntervention,
    withInterventionPct: pct(withIntervention),
    mostFrequent: mostFrequent && mostFrequent.count > 0 ? mostFrequent : null,
    feedbackDue: state.employees.filter((e) => e.feedbackNeeded).length,
    bestSoft,
    areasBelow,
    rolesBelow,
    worstArea: areasBelow[0] ?? null,
    worstRole: rolesBelow[0] ?? null,
    worstRoleInArea,
    worstSkill: worstSkill && worstSkill.gap < 0 ? worstSkill : null,
  }
}

export type AssessmentResults = ReturnType<typeof assessmentResults>
