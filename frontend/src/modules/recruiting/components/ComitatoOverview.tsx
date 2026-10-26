import { CheckCircle2, Target, TrendingDown, Users } from 'lucide-react'
import { useMemo } from 'react'

import { CategoryBars } from '@/components/patterns/CategoryBars'
import { ChartCard } from '@/components/patterns/ChartCard'
import { StatCard } from '@/components/patterns/StatCard'
import type { OriginalSkillsPerson } from '@/lib/api/endpoints'
import { fmtDec } from '@/lib/format'
import { comitatoStats } from '@/modules/recruiting/lib/comitato-stats'

const pct = (n: number) => `${Math.round(n)}%`

// La sintesi in grafici dei risultati letti dal Comitato scientifico, sopra
// l'elenco delle persone. Tipi dalla tabella di CLAUDE.md (Fase 5): persona
// (qui il gruppo) contro l'atteso → barre raggruppate, `chart-mono` contro
// `chart-compare`; confronto fra competenze → barre a una serie. Il radar
// non serve qui: 36 assi non si leggono. Il punteggio complessivo resta
// fuori finché non c'è la formula di conversione su 10 (CLAUDE.md, cap. 7).
export function ComitatoOverview({ people }: { people: OriginalSkillsPerson[] }) {
  const s = useMemo(() => comitatoStats(people), [people])
  const farthest = s.role[0]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Persone lette" value={s.people} />
        <StatCard
          icon={Target}
          label="Competenze di ruolo raggiunte"
          value={s.reachedPct === null ? '—' : pct(s.reachedPct)}
          progress={s.reachedPct ?? undefined}
          note="Quota delle competenze di ruolo, persona per persona, con punteggio pari o sopra l'atteso"
        />
        <StatCard
          icon={CheckCircle2}
          label="Atteso raggiunto su tutto il ruolo"
          value={s.allReached}
          unit={`su ${s.withRole} persone`}
        />
        <StatCard
          icon={TrendingDown}
          label="Più lontana dall'atteso"
          valueKind="text"
          value={farthest ? farthest.name : '—'}
          note={farthest ? `Media ${fmtDec(farthest.score)} contro ${fmtDec(farthest.expected)} attesi, su ${farthest.people} persone` : 'Nessuna competenza di ruolo nei risultati'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Competenze di ruolo · media contro atteso"
          description="Punteggio medio su 10 delle persone che hanno la competenza nel ruolo. Dalla più lontana dall'atteso."
          height="auto"
          empty={s.role.length ? undefined : { title: 'Nessuna competenza di ruolo', description: 'Il Comitato scientifico non ha indicato competenze di ruolo per queste persone.' }}
        >
          <CategoryBars
            title="Competenze di ruolo, media contro atteso"
            orientation="horizontal"
            valueMax={10}
            height="auto"
            series={[
              { key: 'score', label: 'Media del gruppo' },
              { key: 'expected', label: 'Atteso medio', reference: true },
            ]}
            rows={s.role.map((r) => ({ label: r.name, values: { score: r.score, expected: r.expected } }))}
          />
        </ChartCard>

        <ChartCard
          title="Chi raggiunge l'atteso · per competenza di ruolo"
          description="Quota delle persone con la competenza nel ruolo che ha un punteggio pari o sopra l'atteso."
          height="auto"
          empty={s.role.length ? undefined : { title: 'Nessuna competenza di ruolo', description: 'Il Comitato scientifico non ha indicato competenze di ruolo per queste persone.' }}
        >
          <CategoryBars
            title="Quota di persone che raggiunge l'atteso, per competenza"
            orientation="horizontal"
            valueMax={100}
            height="auto"
            format={pct}
            series={[{ key: 'reached', label: 'Persone che raggiungono l’atteso' }]}
            rows={[...s.role].sort((a, b) => a.reachedPct - b.reachedPct).map((r) => ({ label: r.name, values: { reached: r.reachedPct } }))}
          />
        </ChartCard>
      </div>

      <ChartCard
        title="Tutte le competenze · media del gruppo"
        description="Punteggio medio su 10 per ogni competenza del questionario, dalla più alta."
        height="auto"
        empty={s.all.length ? undefined : { title: 'Nessuna competenza nei risultati', description: 'I questionari letti non contengono punteggi.' }}
      >
        <CategoryBars
          title="Tutte le competenze, media del gruppo"
          orientation="horizontal"
          valueMax={10}
          height="auto"
          series={[{ key: 'score', label: 'Media del gruppo' }]}
          rows={s.all.map((c) => ({ label: c.name, values: { score: c.score } }))}
        />
      </ChartCard>
    </div>
  )
}
