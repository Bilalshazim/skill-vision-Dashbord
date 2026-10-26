import { CategoryBars } from '@/components/patterns/CategoryBars'
import { ChartCard } from '@/components/patterns/ChartCard'
import { StatCard } from '@/components/patterns/StatCard'
import type { OriginalSkillsPerson } from '@/lib/api/endpoints'

// I risultati di una persona in grafici, nel pannello laterale. Persona
// contro l'atteso del ruolo → barre raggruppate (CLAUDE.md, Fase 5); il
// profilo completo (36 competenze) → barre a una serie, dalla più alta: un
// radar a 36 assi non si legge. Scarti precisi nella tabella che segue.
export function ComitatoPersonCharts({ person }: { person: OriginalSkillsPerson }) {
  const role = person.roleCompetencies.filter((c) => c.score !== null && c.expected !== null)
  const reached = role.filter((c) => c.score! >= c.expected!).length
  const all = person.competencies.filter((c) => c.score !== null).sort((a, b) => b.score! - a.score!)

  return (
    <div className="flex flex-col gap-4">
      {role.length ? (
        <StatCard label="Competenze di ruolo raggiunte" value={`${reached} / ${role.length}`} progress={(reached / role.length) * 100} />
      ) : null}

      <ChartCard
        surface="none"
        title="Competenze del ruolo · punteggio contro atteso"
        description="Su 10, dalla più lontana dall'atteso."
        height="auto"
        empty={role.length ? undefined : { title: 'Nessuna competenza di ruolo', description: 'Il Comitato scientifico non ha indicato competenze di ruolo per questa persona.' }}
      >
        <CategoryBars
          title={`Competenze del ruolo di ${person.lastName} ${person.firstName}`}
          orientation="horizontal"
          valueMax={10}
          height="auto"
          series={[
            { key: 'score', label: 'Punteggio' },
            { key: 'expected', label: 'Atteso', reference: true },
          ]}
          rows={[...role].sort((a, b) => a.score! - a.expected! - (b.score! - b.expected!)).map((c) => ({ label: c.name, values: { score: c.score, expected: c.expected } }))}
        />
      </ChartCard>

      <ChartCard
        surface="none"
        title="Tutte le competenze"
        description="Su 10, dalla più alta."
        height="auto"
        empty={all.length ? undefined : { title: 'Nessuna competenza nel questionario' }}
      >
        <CategoryBars
          title={`Tutte le competenze di ${person.lastName} ${person.firstName}`}
          orientation="horizontal"
          valueMax={10}
          height="auto"
          series={[{ key: 'score', label: 'Punteggio' }]}
          rows={all.map((c) => ({ label: c.name, values: { score: c.score } }))}
        />
      </ChartCard>
    </div>
  )
}
