import { W } from '@/modules/recruiting/lib/constants'
import { ensurePipeline } from '@/modules/recruiting/lib/pipeline'
import { countStages, positionCandidateIds, positionStages } from '@/modules/recruiting/lib/position-funnel'
import { bucketize } from '@/modules/recruiting/lib/quality-bands'
import { ahi, ranking } from '@/modules/recruiting/lib/scoring'
import type { Candidate, JobOpening, SoftSkillLevel } from '@/modules/recruiting/lib/types'

// I numeri delle tre pagine dei risultati di Recruiting (CLAUDE.md, Fase 6,
// "Recruiting · regole in più"): tutti sulla posizione attiva. Gli stati sono
// quelli dell'imbuto (lib/position-funnel.ts); i dati dei test vengono dalla
// classifica di Risultati sulla posizione (`ranking` sui candidati che la
// posizione conosce, come "Questa posizione" in Risultati), non da Migliori
// candidati.

const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : null)

// La Panoramica di Recruiting (CLAUDE.md, Fase 6, colonna Recruiting rivista
// il 2026-10-30): i numeri di una o più posizioni — la posizione attiva, o
// "Tutte le posizioni aperte" della società. Da fare adesso divide i candidati
// senza sovrapposizioni: CV da valutare (candidatura acquisita, non ancora in
// valutazione), link al test da inviare, test completati da leggere (non
// idonei e senza colloquio), colloqui da fissare (idonei senza colloquio).
export function recruitingPanoramica(openings: { title: string; opening: JobOpening }[], candidates: Candidate[]) {
  const byId = new Map(candidates.map((c) => [c.id, c]))
  const sum = { received: 0, inLine: 0, invited: 0, completed: 0, toEvaluate: 0, linksToSend: 0, testsToRead: 0, toSchedule: 0 }
  const counts = { cv: 0, preselezionati: 0, invitati: 0, completati: 0, idonei: 0, colloquio: 0, scelti: 0 }
  const upcoming: { id: string; date: string; name: string; meta: string; at: number }[] = []
  const ids = new Set<string>()
  for (const { title, opening } of openings) {
    const sets = positionStages(opening, byId)
    for (const k of Object.keys(counts) as (keyof typeof counts)[]) counts[k] += sets[k].size
    const p = ensurePipeline(opening)
    sum.toEvaluate += [...sets.cv].filter((id) => !sets.preselezionati.has(id)).length
    sum.linksToSend += p.prescreened.filter((r) => r.status === 'da_inviare' || r.status === 'link_pronto').length
    sum.testsToRead += [...sets.completati].filter((id) => !sets.idonei.has(id) && !sets.colloquio.has(id)).length
    sum.toSchedule += [...sets.idonei].filter((id) => !sets.colloquio.has(id)).length
    for (const iv of p.interviews) {
      if (iv.completed) continue
      const at = new Date(iv.scheduledAt).getTime()
      upcoming.push({ id: `${opening.id}-${iv.id}`, date: new Date(iv.scheduledAt).toLocaleDateString('it-IT'), name: iv.name || '—', meta: title, at })
    }
    positionCandidateIds(opening).forEach((id) => ids.add(id))
  }
  const rk = ranking(candidates.filter((c) => ids.has(c.id)))
  return {
    counts,
    received: counts.cv,
    inLine: counts.preselezionati,
    inLinePct: pct(counts.preselezionati, counts.cv),
    invited: counts.invitati,
    completed: counts.completati,
    completedPct: pct(counts.completati, counts.invitati),
    interviewsPlanned: upcoming.length,
    upcoming: upcoming.sort((a, b) => a.at - b.at).slice(0, 5),
    todo: sum,
    ranking: rk,
    buckets: bucketize(rk),
  }
}

export function recruitingResults(opening: JobOpening | undefined, candidates: Candidate[], flags: Record<string, SoftSkillLevel>) {
  const byId = new Map(candidates.map((c) => [c.id, c]))
  const empty = { cv: 0, preselezionati: 0, invitati: 0, completati: 0, idonei: 0, colloquio: 0, scelti: 0 }
  const sets = opening ? positionStages(opening, byId) : null
  const counts = sets ? countStages(sets) : empty

  // Chi è più adatto: la classifica della posizione e le sue fasce.
  const ids = positionCandidateIds(opening)
  const rk = ranking(candidates.filter((c) => ids.has(c.id)))
  const buckets = bucketize(rk)
  const pending = Math.max(0, counts.invitati - counts.completati)

  // Chi scegliamo: i finalisti sono "In fase di approfondimento" (con un
  // colloquio), dal punteggio più alto. Punteggio: l'indice AHI della scheda
  // del candidato, oppure il risultato del test inserito a mano.
  const p = opening ? ensurePipeline(opening) : null
  const testScore = new Map((p?.testResults ?? []).map((t) => [t.candidateId, t.score]))
  const names = new Map((p?.interviews ?? []).filter((iv) => iv.candidateId).map((iv) => [iv.candidateId as string, iv.name]))
  const finalists = [...(sets?.colloquio ?? [])]
    .map((id) => {
      const c = byId.get(id)
      const score = c ? ahi(c).v : testScore.get(id)
      return { id, name: c?.name ?? names.get(id) ?? '—', score: score ?? null, candidate: c }
    })
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
  const first = finalists[0]

  // Punto di forza e rischio del primo finalista: la competenza trasversale
  // scelta nel profilo con la distanza più alta sopra e sotto l'atteso (la
  // soglia del peso, W[livello].t, la stessa del metodo).
  let strength: { name: string; gap: number } | null = null
  let risk: { name: string; gap: number } | null = null
  if (first?.candidate) {
    for (const [sk, lv] of Object.entries(flags)) {
      const gap = (first.candidate.scores[sk] || 0) - W[lv].t
      if (gap > 0 && (!strength || gap > strength.gap)) strength = { name: sk, gap }
      if (gap < 0 && (!risk || gap < risk.gap)) risk = { name: sk, gap }
    }
  }

  return {
    counts,
    received: counts.cv,
    inLine: counts.preselezionati,
    inLinePct: pct(counts.preselezionati, counts.cv),
    completed: counts.completati,
    pending,
    completedPct: pct(counts.completati, counts.invitati),
    ranking: rk,
    buckets,
    leader: rk[0] ?? null,
    finalists,
    finalistsPct: pct(finalists.length, counts.cv),
    strength,
    risk,
    interviewsPlanned: (p?.interviews ?? []).filter((iv) => !iv.completed).length,
    softSkillsChosen: Object.keys(flags).length,
  }
}
