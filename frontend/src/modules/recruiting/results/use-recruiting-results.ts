import { useMemo } from 'react'

import { isDemoMode } from '@/lib/demo-mode'
import { PROFILE_PATH } from '@/modules/recruiting/components/RecruitingContextBar'
import { useActivePosition } from '@/modules/recruiting/lib/active-position'
import { recruitingResults } from '@/modules/recruiting/lib/results'
import { useSkillFlags } from '@/modules/recruiting/lib/skill-flags'
import { readCandidates } from '@/modules/recruiting/lib/storage'

/** I tre passi del Profilo della ricerca (CLAUDE.md, Fase 6): la card e la sua pagina dei risultati. */
export const RECRUITING_STEPS = [
  {
    slug: 'chi-cerchiamo',
    number: '01',
    title: 'Chi cerchiamo?',
    sub: 'Definire il candidato ideale',
    content: 'Ruolo, requisiti, hard e soft skill',
    verbs: 'Crea posizione · Pubblica · Ricevi CV',
  },
  { slug: 'chi-e-piu-adatto', number: '02', title: 'Chi è più adatto?', sub: 'Valutare tutti in un unico elenco', content: 'Matching CV, Test, Colloquio', verbs: 'Approfondisci · Esamina · Approva' },
  { slug: 'chi-scegliamo', number: '03', title: 'Chi scegliamo?', sub: 'Confrontare i finalisti', content: 'Punti di forza, Rischi', verbs: 'Confronta · Decidi · Chiudi' },
] as const

// Quello che le tre pagine dei risultati di Recruiting hanno in comune: la
// posizione attiva (stato condiviso), i numeri (lib/results.ts), la riga del
// percorso che parte da "Profilo della ricerca", la nota dei dati dimostrativi.
export function useRecruitingResults(slug: (typeof RECRUITING_STEPS)[number]['slug']) {
  const { company, opening } = useActivePosition()
  const flags = useSkillFlags()
  const data = useMemo(() => recruitingResults(opening, readCandidates(), flags), [opening, flags])
  const step = RECRUITING_STEPS.find((s) => s.slug === slug)!
  return {
    data,
    step,
    position: opening?.title ?? '—',
    crumbs: [{ label: 'Profilo della ricerca', to: PROFILE_PATH }],
    home: { label: 'Torna alla home', to: PROFILE_PATH },
    demoNote: isDemoMode() ? `${company?.name ?? '—'} · Le cifre in euro compaiono quando la formula è definita` : undefined,
  }
}

export const people = (n: number, one = 'candidato', many = 'candidati') => `${n} ${n === 1 ? one : many}`
