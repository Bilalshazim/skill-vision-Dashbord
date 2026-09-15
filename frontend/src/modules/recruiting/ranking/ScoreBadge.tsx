import { cn } from '@/lib/utils'
import type { Fascia } from '@/modules/recruiting/lib/scoring'

// Ported from legacy fasce() color mapping (green/amber/red) — reused
// exactly here since this is genuine severity grading (the same reserved
// meaning as Home's quality-distribution chart, see QualityChart.tsx), not
// a categorical distinction.
const TONE_TEXT: Record<Fascia['key'], string> = {
  excellent: 'text-success',
  developable: 'text-warning',
  gap: 'text-warning',
  'not-recommended': 'text-destructive',
}

export function ScoreBadge({ fascia, className }: { fascia: Fascia; className?: string }) {
  return <span className={cn('text-[11px] font-semibold', TONE_TEXT[fascia.key], className)}>{fascia.txt}</span>
}
