import { IdoneitaBadge } from '@/components/patterns/IdoneitaBadge'
import { ProfileRadar } from '@/components/patterns/ProfileRadar'
import type { Idoneita } from '@/lib/idoneita'
import { BF, BF_SUB } from '@/modules/recruiting/lib/constants'
import type { Candidate, RoleProfile } from '@/modules/recruiting/lib/types'

// Distanza dal profilo ideale del ruolo, per dimensione: stessa soglia del
// vecchio Recruiting (≤10 punti / ≤25 / oltre), ora con il nome della fascia.
function fasciaFor(diff: number): Idoneita {
  if (diff <= 10) return 'idoneo'
  if (diff <= 25) return 'da-valutare'
  return 'non-idoneo'
}

// R6 (DECISIONI, "Grafici approvati"): il Big Five del candidato contro il
// profilo ideale del ruolo, come radar — lo stesso confronto atteso/reale
// del profilo individuale di Assessment. Sotto, per ogni dimensione, la
// fascia di idoneità con la sua parola. Stessi dati e stesse soglie delle
// barre di prima (renderBarRow del vecchio Recruiting). Scala 0–100.
export function BigFiveRows({ candidate, role }: { candidate: Candidate; role: RoleProfile }) {
  const axes = BF.map((k) => ({ key: k, label: k }))
  const person = Object.fromEntries(BF.map((k) => [k, candidate.bf[k] ?? 50]))
  const ideal = Object.fromEntries(BF.map((k) => [k, role.bf[k] ?? 50]))
  return (
    <div className="flex flex-col gap-3">
      <ProfileRadar
        size="sm"
        max={100}
        format={(n) => String(Math.round(n))}
        title={`Big Five di ${candidate.name} rispetto al profilo ideale`}
        axes={axes}
        series={[
          { label: 'Profilo ideale', values: ideal, reference: true },
          { label: candidate.name, values: person },
        ]}
      />
      <ul className="flex flex-col gap-1">
        {BF.map((k) => (
          <li key={k} className="flex items-center justify-between gap-3 text-app-small">
            <span className="truncate text-muted-foreground" title={BF_SUB[k].join(', ')}>
              {k}
            </span>
            <IdoneitaBadge fascia={fasciaFor(Math.abs((candidate.bf[k] ?? 50) - (role.bf[k] ?? 50)))} />
          </li>
        ))}
      </ul>
    </div>
  )
}
