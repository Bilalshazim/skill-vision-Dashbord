import { ensurePipeline } from '@/modules/recruiting/lib/pipeline'
import { ahi, fasce } from '@/modules/recruiting/lib/scoring'
import type { Candidate, JobOpening } from '@/modules/recruiting/lib/types'

// Gli stati della candidatura, le fasi dell'imbuto (CLAUDE.md, Fase 6, decisi
// da Roberto il 2026-10-23): Candidatura acquisita → Profilo in valutazione →
// Candidato di interesse → In fase di approfondimento → Selezione conclusa;
// a parte l'esito (ESITI, sotto). Sostituiscono le sette fasi del 2026-10-23
// (CV caricati … Scelti). Corrispondono agli stati del server
// (`BackendCampaignCandidateStatus`): IN_POOL · SHORTLISTED/TEST_DA_INVIARE ·
// TEST_INVIATO/HA_RISPOSTO/NON_HA_RISPOSTO · INTERVIEW · DECISION_*.
//
// Chi sta in uno stato sta anche nei precedenti: chi è in colloquio è stato
// preselezionato, chi ha il test è stato preselezionato. Le chiavi interne
// restano quelle di prima (si cambia l'etichetta, non i nomi nel codice);
// `completati` e `idonei` non sono stati della candidatura ma si contano
// ancora, perché il "prossimo passo" del Profilo della ricerca li usa.
export type StageKey = 'cv' | 'preselezionati' | 'invitati' | 'completati' | 'idonei' | 'colloquio' | 'scelti'

/** Gli stati che si mostrano, in ordine. */
export type StateKey = 'cv' | 'preselezionati' | 'invitati' | 'colloquio' | 'scelti'

export const STAGES: { key: StateKey; label: string; description: string; to: string; stuck: string }[] = [
  { key: 'cv', label: 'Candidatura acquisita', description: 'CV ricevuto', to: '/recruiting/cv-elaborati', stuck: 'non ancora in valutazione' },
  { key: 'preselezionati', label: 'Profilo in valutazione', description: 'confronto CV / profilo', to: '/recruiting/preselezionati', stuck: 'senza il test inviato' },
  { key: 'invitati', label: 'Candidato di interesse', description: 'approvato e test inviato', to: '/recruiting/classifica-test', stuck: 'senza un colloquio' },
  { key: 'colloquio', label: 'In fase di approfondimento', description: 'colloquio', to: '/recruiting/colloqui', stuck: 'senza una decisione' },
  { key: 'scelti', label: 'Selezione conclusa', description: 'decisione', to: '/recruiting/podio', stuck: '' },
]

/** L'esito, a parte dagli stati. Oggi si registra solo chi è scelto (`pipeline.winner` = Assunto): In riserva e Non selezionato non hanno ancora un dato. */
export const ESITI = [
  { key: 'assunto', label: 'Assunto' },
  { key: 'riserva', label: 'In riserva' },
  { key: 'non-selezionato', label: 'Non selezionato' },
] as const

/** Lo stato che segue, per contare chi è fermo in uno stato. */
export const NEXT: Record<StateKey, StateKey | null> = { cv: 'preselezionati', preselezionati: 'invitati', invitati: 'colloquio', colloquio: 'scelti', scelti: null }

/** Lo stato da cui si calcola la quota "sulla precedente". */
export const PREVIOUS: Record<StateKey, StateKey | null> = { cv: null, preselezionati: 'cv', invitati: 'preselezionati', colloquio: 'invitati', scelti: 'colloquio' }

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

const ALL_KEYS: StageKey[] = ['cv', 'preselezionati', 'invitati', 'completati', 'idonei', 'colloquio', 'scelti']

export function countStages(sets: Record<StageKey, Set<string>>): StageCounts {
  return Object.fromEntries(ALL_KEYS.map((k) => [k, sets[k].size])) as StageCounts
}

/** Somma di più posizioni (Tutte le posizioni aperte). */
export function sumStages(list: StageCounts[]): StageCounts {
  return Object.fromEntries(ALL_KEYS.map((k) => [k, list.reduce((n, c) => n + c[k], 0)])) as StageCounts
}

/** Tutti gli id dei candidati che una posizione conosce: è "questa posizione" per Risultati e Candidati per fascia. */
export function positionCandidateIds(opening: JobOpening | undefined): Set<string> {
  if (!opening) return new Set()
  const p = ensurePipeline(opening)
  return new Set([...(opening.candidatePool ?? []).map((r) => r.id), ...p.prescreened.map((r) => r.candidateId), ...p.testResults.map((t) => t.candidateId), ...p.interviews.map((iv) => iv.candidateId).filter((id): id is string => !!id)])
}

/** Dove si fermano: il calo maggiore fra due stati consecutivi, in una frase. `null` se nessun calo. */
export function biggestDrop(c: StageCounts): string | null {
  let best: { from: StateKey; to: StateKey; lost: number } | null = null
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
