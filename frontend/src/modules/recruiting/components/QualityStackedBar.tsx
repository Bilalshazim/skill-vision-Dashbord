import { DistributionBar } from '@/components/patterns/DistributionBar'
import { IDONEITA, idoneitaFromTone } from '@/lib/idoneita'
import type { QualityBucket } from '@/modules/recruiting/lib/use-recruiting-home-data'

// G9 (DECISIONI): la qualità del ranking per fascia, sul pattern
// DistributionBar — lo stesso componente della distribuzione per fascia
// nella Home di Assessment. Ogni fascia porta il nome di idoneità ("Idoneo",
// "Da valutare", "Non idoneo") davanti al suo nome AHI, e il conteggio.
export function QualityStackedBar({ buckets, total }: { buckets: QualityBucket[]; total: number }) {
  return (
    <DistributionBar
      segments={buckets.map((b, i) => ({
        key: String(i),
        label: `${IDONEITA[idoneitaFromTone(b.tone)].label} · ${b.label}`,
        pct: total ? (b.count / total) * 100 : 0,
        tone: b.tone,
        display: String(b.count),
      }))}
    />
  )
}
