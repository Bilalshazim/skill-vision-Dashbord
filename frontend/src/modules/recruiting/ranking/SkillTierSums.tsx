import { fmtITpct } from '@/modules/recruiting/lib/format'
import type { SkillTierSums as SkillTierSumsData } from '@/modules/recruiting/lib/scoring'

// Ported from legacy .sums4 — same categorical-identity reasoning as
// SubScoreBoxes.tsx: superfici neutre, solo il totale ha il bordo marcato.
const TIERS = [
  { key: 'essential', label: 'Skill essenziali' },
  { key: 'important', label: 'Skill importanti' },
  { key: 'useful', label: 'Skill utili' },
] as const

export function SkillTierSums({ sums }: { sums: SkillTierSumsData }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {TIERS.map((t) => (
        <div
          key={t.key}
          className="flex flex-col items-center justify-center rounded-sm border border-border bg-secondary px-3 py-3 text-center"
          title={`${sums[t.key].sum.toFixed(1)} punti su ${sums[t.key].count * 31 || 0} disponibili`}
        >
          <div className="label-mono">{t.label}</div>
          <div className="mt-0.5 text-app-section font-semibold tabular-nums">{fmtITpct(sums[t.key].pct)}</div>
        </div>
      ))}
      <div
        className="flex flex-col items-center justify-center rounded-sm border-2 border-foreground bg-secondary px-3 py-3 text-center"
        title={`${sums.total.sum.toFixed(1)} punti su ${sums.total.count * 31 || 0} disponibili`}
      >
        <div className="label-mono">Punteggio totale</div>
        <div className="mt-0.5 text-app-section font-semibold tabular-nums">{fmtITpct(sums.total.pct)}</div>
      </div>
    </div>
  )
}
