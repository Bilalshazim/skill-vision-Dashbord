import { fmtITpct } from '@/modules/recruiting/lib/format'
import type { SkillTierSums as SkillTierSumsData } from '@/modules/recruiting/lib/scoring'

// Ported from legacy .sums4 — same categorical-identity reasoning as
// SubScoreBoxes.tsx (three skill tiers + a total, not a severity grading).
const TIERS = [
  { key: 'essential', label: 'Skill essenziali', color: 'var(--chart-2)' },
  { key: 'important', label: 'Skill importanti', color: 'var(--chart-3)' },
  { key: 'useful', label: 'Skill utili', color: 'var(--chart-4)' },
] as const

export function SkillTierSums({ sums }: { sums: SkillTierSumsData }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {TIERS.map((t) => (
        <div
          key={t.key}
          className="flex flex-col items-center justify-center rounded-md border border-l-4 border-border bg-secondary px-3 py-3 text-center"
          style={{ borderLeftColor: t.color }}
          title={`${sums[t.key].sum.toFixed(1)} punti su ${sums[t.key].count * 31 || 0} disponibili`}
        >
          <div className="text-[10.5px] font-semibold uppercase tracking-wide font-mono">{t.label}</div>
          <div className="mt-0.5 text-lg font-black tracking-[-.045em] tabular-nums">{fmtITpct(sums[t.key].pct)}</div>
        </div>
      ))}
      <div
        className="flex flex-col items-center justify-center rounded-md border border-l-4 border-l-foreground border-border bg-secondary px-3 py-3 text-center"
        title={`${sums.total.sum.toFixed(1)} punti su ${sums.total.count * 31 || 0} disponibili`}
      >
        <div className="text-[10.5px] font-semibold uppercase tracking-wide font-mono">Punteggio totale</div>
        <div className="mt-0.5 text-lg font-black tracking-[-.045em] tabular-nums">{fmtITpct(sums.total.pct)}</div>
      </div>
    </div>
  )
}
