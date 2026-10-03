import { fmtDec } from '@/lib/format'
import { cn } from '@/lib/utils'

// I valori di un grafico in tabella: le righe sono le categorie (o i
// periodi), le colonne le serie. È l'alternativa testuale del grafico (il
// disegno SVG di Bklit è nascosto ai lettori di schermo) e, con `visible`,
// anche la lettura precisa dei valori sotto un radar. Cifre tabulari.
export function ChartDataTable({
  title,
  rowHeader = 'Voce',
  rows,
  columns,
  format,
  visible = false,
}: {
  title: string
  rowHeader?: string
  rows: { label: string; values: (number | null | undefined)[] }[]
  columns: { label: string; reference?: boolean }[]
  format?: (n: number) => string
  visible?: boolean
}) {
  // Senza `format`: un decimale fisso in tutta la tabella se c'è almeno un
  // valore non intero, così le colonne si allineano; interi altrimenti.
  const anyDecimal = rows.some((r) => r.values.some((v) => v != null && !Number.isInteger(v)))
  const fmt = format ?? ((n: number) => fmtDec(n, anyDecimal ? 1 : 0))
  return (
    <table className={cn('border-collapse text-app-caption tabular-nums', visible ? 'w-full' : 'sr-only')}>
      <caption className="sr-only">{title}</caption>
      <thead>
        <tr className="border-b border-border">
          <th scope="col" className="label-mono py-1 pr-2 text-left font-medium text-muted-foreground">
            <span className="sr-only">{rowHeader}</span>
          </th>
          {columns.map((c) => (
            <th key={c.label} scope="col" className="label-mono py-1 pl-2 text-right font-medium text-muted-foreground">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className="border-b border-border last:border-b-0">
            <th scope="row" className="py-1 pr-2 text-left font-normal text-muted-foreground">
              {r.label}
            </th>
            {r.values.map((v, i) => (
              <td key={columns[i]?.label ?? i} className={cn('py-1 pl-2 text-right', columns[i]?.reference ? 'text-muted-foreground' : 'text-foreground')}>
                {v == null ? '—' : fmt(v)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
