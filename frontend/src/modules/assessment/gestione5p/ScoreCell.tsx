import { TableCell } from '@/components/ui/table'
import { LEVEL_CELL } from '@/modules/assessment/gestione5p/level-style'
import { fmt10, level } from '@/modules/assessment/gestione5p/model'
import { cn } from '@/lib/utils'

// Una cella di voto (su 10) con il fondo del suo livello (il livello è anche
// nel tooltip e nelle colonne "Livello" accanto: il colore accompagna).
export function ScoreCell({ value }: { value: number | null }) {
  const l = level(value)
  return (
    <TableCell title={l.t} className={cn('font-mono tabular-nums', LEVEL_CELL[l.c])}>
      <span className="font-semibold">{fmt10(value)}</span>
    </TableCell>
  )
}
