import { fmtIT100 } from '@/modules/recruiting/lib/format'

// Ported from legacy .sub3 (three fixed sub-scores that make up AHI).
// Fase 6: i colori categorici erano decorazione su metriche già etichettate
// e sono stati tolti — superfici neutre, il valore porta la gerarchia.
const BOXES = [
  { key: 'fc', label: 'Fit competenze (55%)' },
  { key: 'ab', label: 'Affinità Big Five (30%)' },
  { key: 'icv', label: 'Indice CV — ML (15%)' },
] as const

export function SubScoreBoxes({ fc, ab, icv }: { fc: number; ab: number; icv: number }) {
  const values: Record<(typeof BOXES)[number]['key'], number> = { fc, ab, icv }

  return (
    <div className="grid grid-cols-3 gap-3">
      {BOXES.map((b) => (
        <div
          key={b.key}
          className="flex flex-col items-center justify-center rounded-sm border border-border bg-secondary px-3 py-3 text-center"
        >
          <div className="label-mono">{b.label}</div>
          <div className="mt-1 text-app-section font-semibold tabular-nums">
            {fmtIT100(values[b.key])}
          </div>
        </div>
      ))}
    </div>
  )
}
