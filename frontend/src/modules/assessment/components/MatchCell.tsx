import { ArrowDown, ArrowUp, Equal } from 'lucide-react'

import { TableCell } from '@/components/ui/table'
import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'
import { fmt1 } from '@/modules/assessment/lib/legacy-utils'
import { cn } from '@/lib/utils'

// Una cella del confronto fra dipendenti (Soft e Hard, "Confronto"). Il
// valore più alto e il più basso della riga, o valori tutti vicini, si
// leggono dall'icona e dal testo per i lettori di schermo; il fondo tenue
// del tono accompagna (regola 10). `match` è la classe calcolata da
// matchCellClasses: 'match-high' | 'match-low' | 'match-overlap' | ''.
export function MatchCell({ value, match, strong = false }: { value: number; match: string; strong?: boolean }) {
  const { ui } = useAssessment()
  const kind = match === 'match-high' ? 'high' : match === 'match-low' ? 'low' : match === 'match-overlap' ? 'overlap' : null
  const Icon = kind === 'high' ? ArrowUp : kind === 'low' ? ArrowDown : kind === 'overlap' ? Equal : null
  const label = kind === 'high' ? ui.matchHighest : kind === 'low' ? ui.matchLowest : kind === 'overlap' ? ui.matchOverlap : null
  return (
    <TableCell
      className={cn(
        (strong || kind) && 'font-medium',
        kind === 'high' && 'bg-success/10 text-success',
        kind === 'low' && 'bg-destructive/10 text-destructive',
        kind === 'overlap' && 'bg-accent',
      )}
    >
      <span className="inline-flex items-center gap-1">
        {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
        {fmt1(value)}
        {label ? <span className="sr-only">({label})</span> : null}
      </span>
    </TableCell>
  )
}
