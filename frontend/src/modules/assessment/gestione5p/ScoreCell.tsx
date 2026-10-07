import { TableCell } from '@/components/ui/table'
import { LEVEL_CELL } from '@/modules/assessment/gestione5p/level-style'
import { fmt, level } from '@/modules/assessment/gestione5p/model'
import { cn } from '@/lib/utils'

// Una cella di punteggio con il fondo del suo livello (il livello è anche
// nel tooltip e nelle colonne "Livello" accanto: il colore accompagna).
export function ScoreCell({ value }: { value: number | null }) {
  const l = level(value)
  return (
    <TableCell title={l.t} className={cn('text-center font-mono tabular-nums', LEVEL_CELL[l.c])}>
      <span className="font-semibold">{fmt(value)}</span>
    </TableCell>
  )
}
