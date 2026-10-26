import type { OriginalSkillsPerson } from '@/lib/api/endpoints'

// I conti dei grafici del Comitato scientifico, tutti dai dati letti al
// momento: niente si salva. Le competenze sono su 1–10 (PROPOSTA-ORIGINAL-
// SKILLS.md §4); un punteggio mancante non entra nelle medie. Se la forma
// dell'API cambia, cambia solo questo file.

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const isNum = (n: number | null): n is number => n !== null

export type RoleCompetencyStat = {
  name: string
  /** Persone che hanno la competenza fra quelle del ruolo, con punteggio. */
  people: number
  score: number
  expected: number
  /** Quota di quelle persone che raggiunge l'atteso, 0–100. */
  reachedPct: number
}

export type ComitatoStats = {
  people: number
  /** Persone con almeno una competenza di ruolo. */
  withRole: number
  /** Persone che raggiungono l'atteso su tutte le competenze del ruolo. */
  allReached: number
  /** Quota delle competenze di ruolo (persona × competenza) che raggiunge l'atteso, 0–100. */
  reachedPct: number | null
  /** Per competenza di ruolo, dalla più lontana dall'atteso alla più vicina. */
  role: RoleCompetencyStat[]
  /** Media del gruppo su ogni competenza del questionario, dalla più alta. */
  all: { name: string; score: number }[]
}

export function comitatoStats(people: OriginalSkillsPerson[]): ComitatoStats {
  const role = new Map<string, { score: number[]; expected: number[]; reached: number }>()
  const all = new Map<string, number[]>()
  let withRole = 0
  let allReached = 0
  let entries = 0
  let reachedEntries = 0

  for (const p of people) {
    const rated = p.roleCompetencies.filter((c) => isNum(c.score) && isNum(c.expected))
    if (rated.length) {
      withRole++
      if (rated.every((c) => c.score! >= c.expected!)) allReached++
    }
    for (const c of rated) {
      const r = role.get(c.name) ?? { score: [], expected: [], reached: 0 }
      r.score.push(c.score!)
      r.expected.push(c.expected!)
      if (c.score! >= c.expected!) r.reached++
      role.set(c.name, r)
      entries++
      if (c.score! >= c.expected!) reachedEntries++
    }
    for (const c of p.competencies) {
      if (!isNum(c.score)) continue
      all.set(c.name, [...(all.get(c.name) ?? []), c.score])
    }
  }

  return {
    people: people.length,
    withRole,
    allReached,
    reachedPct: entries ? (reachedEntries / entries) * 100 : null,
    role: [...role]
      .map(([name, r]) => ({ name, people: r.score.length, score: mean(r.score)!, expected: mean(r.expected)!, reachedPct: (r.reached / r.score.length) * 100 }))
      .sort((a, b) => a.score - a.expected - (b.score - b.expected)),
    all: [...all].map(([name, xs]) => ({ name, score: mean(xs)! })).sort((a, b) => b.score - a.score),
  }
}
