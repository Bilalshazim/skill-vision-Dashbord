import { ChartCard } from '@/components/patterns/ChartCard'
import { CompletionRing } from '@/components/patterns/CompletionRing'
import { RingStat } from '@/components/patterns/RingStat'
import { StatCard } from '@/components/patterns/StatCard'
import type { OriginalSkillsPerson } from '@/lib/api/endpoints'
import { fmtDec } from '@/lib/format'

const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmtDec(Math.abs(n), 2)}`

// I risultati di una persona in anelli, nel pannello laterale (Bklit Ring,
// "punteggio singolo", CLAUDE.md, Fase 5). Competenze del ruolo: anello del
// punteggio e, dentro, quello dell'atteso; atteso e scarto scritti sotto, al
// posto della tabella degli scarti. Tutte le competenze: un anello ciascuna,
// dalla più alta. Il pannello è stretto: le barre verticali con questi nomi
// lunghi non ci starebbero.
export function ComitatoPersonCharts({ person }: { person: OriginalSkillsPerson }) {
  const role = person.roleCompetencies
    .filter((c) => c.score !== null && c.expected !== null)
    .map((c) => ({ name: c.name, score: c.score!, expected: c.expected!, diff: c.diff ?? c.score! - c.expected! }))
    .sort((a, b) => a.diff - b.diff)
  const reached = role.filter((c) => c.diff >= 0).length
  const all = person.competencies.filter((c) => c.score !== null).sort((a, b) => b.score! - a.score!)

  return (
    <div className="flex flex-col gap-6">
      {role.length ? (
        <StatCard label="Competenze di ruolo raggiunte" value={`${reached} / ${role.length}`} note="Punteggio pari o sopra l'atteso">
          <CompletionRing value={(reached / role.length) * 100} label="Competenze di ruolo raggiunte" className="mx-0" />
        </StatCard>
      ) : null}

      <ChartCard
        surface="none"
        title="Competenze del ruolo · punteggio contro atteso"
        description="Su 10, dalla più lontana dall'atteso. Anello pieno: punteggio; anello interno tenue: atteso."
        height="auto"
        empty={role.length ? undefined : { title: 'Nessuna competenza di ruolo', description: 'Il Comitato scientifico non ha indicato competenze di ruolo per questa persona.' }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {role.map((c) => (
            <RingStat
              key={c.name}
              label={c.name}
              value={c.score}
              reference={c.expected}
              note={`Atteso ${fmtDec(c.expected)} · scarto ${signed(c.diff)}${c.diff >= 0 ? ' · raggiunto' : ''}`}
            />
          ))}
        </div>
      </ChartCard>

      <ChartCard
        surface="none"
        title="Tutte le competenze"
        description="Su 10, dalla più alta."
        height="auto"
        empty={all.length ? undefined : { title: 'Nessuna competenza nel questionario' }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {all.map((c) => (
            <RingStat key={c.name} label={c.name} value={c.score!} />
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
