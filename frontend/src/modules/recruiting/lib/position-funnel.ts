import { ensurePipeline } from '@/modules/recruiting/lib/pipeline'
import { ahi, fasce } from '@/modules/recruiting/lib/scoring'
import type { Candidate, JobOpening } from '@/modules/recruiting/lib/types'

// Le fasi della selezione di una posizione, quelle del menu (CLAUDE.md, Fase
// 6, "Imbuto di selezione", 2026-10-23): CV caricati → Preselezionati →
// Invitati al test → Test completati → Idonei → In colloquio → Scelti. Prima
// l'imbuto aveva "Test tecnico" (che non esiste: il test è quello delle
// competenze trasversali di Original Skills) e "Assunti" spiegato con un
// asterisco, e contava l'archivio intero mescolato alle posizioni.
//
// Chi sta in una fase sta anche nelle precedenti: chi è in colloquio è stato
// preselezionato, chi ha completato il test è stato invitato. Fa eccezione
// "Idonei", che è un giudizio e non un passaggio: si può fare il colloquio a
// un candidato "Da valutare", quindi "In colloquio" non si somma a "Idonei"
// e la sua quota si calcola sui test completati.
export type StageKey = 'cv' | 'preselezionati' | 'invitati' | 'completati' | 'idonei' | 'colloquio' | 'scelti'

export const STAGES: { key: StageKey; label: string; to: string; stuck: string }[] = [
  { key: 'cv', label: 'CV caricati', to: '/recruiting/cv-elaborati', stuck: 'non ancora preselezionati' },
  { key: 'preselezionati', label: 'Preselezionati', to: '/recruiting/preselezionati', stuck: 'non ancora invitati al test' },
  { key: 'invitati', label: 'Invitati al test', to: '/recruiting/preselezionati', stuck: 'non hanno ancora completato il test' },
  { key: 'completati', label: 'Test completati', to: '/recruiting/classifica-test', stuck: 'senza un colloquio in programma' },
  { key: 'idonei', label: 'Idonei', to: '/recruiting/fasce-idoneita', stuck: 'non ancora in colloquio' },
  { key: 'colloquio', label: 'In colloquio', to: '/recruiting/colloqui', stuck: 'non ancora scelti' },
  { key: 'scelti', label: 'Scelti', to: '/recruiting/podio', stuck: '' },
]

/** La fase che segue, per contare chi è fermo in una fase (Test completati e Idonei vanno tutti e due verso il colloquio). */
export const NEXT: Record<StageKey, StageKey | null> = { cv: 'preselezionati', preselezionati: 'invitati', invitati: 'completati', completati: 'colloquio', idonei: 'colloquio', colloquio: 'scelti', scelti: null }

/** La fase da cui si calcola la quota "sulla precedente": In colloquio si confronta con i test completati (vedi sopra). */
export const PREVIOUS: Record<StageKey, StageKey | null> = { cv: null, preselezionati: 'cv', invitati: 'preselezionati', completati: 'invitati', idonei: 'completati', colloquio: 'completati', scelti: 'colloquio' }

const SENT = new Set(['inviato', 'completato', 'ha_risposto', 'non_ha_risposto'])
const DONE = new Set(['completato', 'ha_risposto'])

/** I candidati (per id) in ogni fase di una posizione. */
export function positionStages(opening: JobOpening, candidatesById: Map<string, Candidate>): Record<StageKey, Set<string>> {
  const p = ensurePipeline(opening)
  const scelti = new Set(p.winner ? [p.winner.candidateId] : [])
  const colloquio = new Set([...p.interviews.map((iv) => iv.candidateId).filter((id): id is string => !!id), ...scelti])
  const completati = new Set([...p.prescreened.filter((r) => DONE.has(r.status)).map((r) => r.candidateId), ...p.testResults.map((t) => t.candidateId), ...colloquio])
  const invitati = new Set([...p.prescreened.filter((r) => SENT.has(r.status)).map((r) => r.candidateId), ...completati])
  const preselezionati = new Set([...p.prescreened.map((r) => r.candidateId), ...invitati])
  const cv = new Set([...(opening.candidatePool ?? []).map((r) => r.id), ...preselezionati])
  // Idoneo: indice AHI nella fascia "Assumibile subito" (da 8,5 su 10), come in
  // classifica; senza la scheda del candidato, il risultato del test inserito a mano.
  const testScore = new Map(p.testResults.map((t) => [t.candidateId, t.score]))
  const idonei = new Set(
    [...completati].filter((id) => {
      const c = candidatesById.get(id)
      if (c && c.testCompleted !== false) {
        const r = ahi(c)
        return fasce(r.v, r.capped).key === 'excellent'
      }
      return (testScore.get(id) ?? 0) >= 85
    }),
  )
  return { cv, preselezionati, invitati, completati, idonei, colloquio, scelti }
}

export type StageCounts = Record<StageKey, number>

export function countStages(sets: Record<StageKey, Set<string>>): StageCounts {
  return Object.fromEntries(STAGES.map((s) => [s.key, sets[s.key].size])) as StageCounts
}

/** Somma di più posizioni (Tutte le posizioni aperte). */
export function sumStages(list: StageCounts[]): StageCounts {
  return Object.fromEntries(STAGES.map((s) => [s.key, list.reduce((n, c) => n + c[s.key], 0)])) as StageCounts
}

/** Tutti gli id dei candidati che una posizione conosce: è "questa posizione" per Risultati e Candidati per fascia. */
export function positionCandidateIds(opening: JobOpening | undefined): Set<string> {
  if (!opening) return new Set()
  const p = ensurePipeline(opening)
  return new Set([...(opening.candidatePool ?? []).map((r) => r.id), ...p.prescreened.map((r) => r.candidateId), ...p.testResults.map((t) => t.candidateId), ...p.interviews.map((iv) => iv.candidateId).filter((id): id is string => !!id)])
}

/** Dove si fermano: il calo maggiore fra due fasi consecutive, in una frase. `null` se nessun calo. */
export function biggestDrop(c: StageCounts): string | null {
  let best: { from: StageKey; to: StageKey; lost: number } | null = null
  for (const s of STAGES) {
    const prev = PREVIOUS[s.key]
    if (!prev) continue
    const lost = c[prev] - c[s.key]
    if (lost > 0 && (!best || lost > best.lost)) best = { from: prev, to: s.key, lost }
  }
  if (!best) return null
  const from = STAGES.find((s) => s.key === best.from)!
  const to = STAGES.find((s) => s.key === best.to)!
  return `Il calo maggiore è fra ${from.label} e ${to.label}: ${best.lost} su ${c[best.from]} ${best.lost === 1 ? 'non è arrivato' : 'non sono arrivati'} a «${to.label}».`
}
