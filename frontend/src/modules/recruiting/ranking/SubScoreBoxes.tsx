import { fmtIT100 } from '@/modules/recruiting/lib/format'

// Ported from legacy .sub3 (three fixed sub-scores that make up AHI: Fit
// competenze 55%, Affinità Big Five 30%, Indice CV — ML 15%). These are
// three distinct metric IDENTITIES always shown together, not a severity
// grading of one value — legacy colored them teal-link/gold/green, which
// reuses the reserved severity green for a box that has nothing to do with
// candidate quality. Modernized here to the established categorical tokens
// (--chart-2/3/4) instead, consistent with how Home's chart avoids the same
// mistake in the other direction (see QualityChart.tsx) — severity tokens
// stay reserved for severity, categorical tokens for category identity.
const BOXES = [
  { key: 'fc', label: 'Fit competenze (55%)', color: 'var(--chart-2)' },
  { key: 'ab', label: 'Affinità Big Five (30%)', color: 'var(--chart-3)' },
  { key: 'icv', label: 'Indice CV — ML (15%)', color: 'var(--chart-4)' },
] as const

export function SubScoreBoxes({ fc, ab, icv }: { fc: number; ab: number; icv: number }) {
  const values: Record<(typeof BOXES)[number]['key'], number> = { fc, ab, icv }

  return (
    <div className="grid grid-cols-3 gap-3">
      {BOXES.map((b) => (
        <div
          key={b.key}
          className="flex flex-col items-center justify-center rounded-md border border-border bg-secondary px-3 py-3 text-center"
        >
          <div className="text-[11px] font-semibold uppercase tracking-wide">{b.label}</div>
          <div className="mt-1 text-lg font-bold" style={{ color: b.color }}>
            {fmtIT100(values[b.key])}
          </div>
        </div>
      ))}
    </div>
  )
}
