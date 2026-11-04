import { Fragment, useState } from 'react'

import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export type HeatmapGroup = { label: string; rows: { key: string; label: string; values: (number | null)[] }[] }

// Le 35 competenze a confronto (CLAUDE.md, Fase 6, tavole del 2–4 novembre): ogni
// colonna nel colore della persona, intensità secondo il valore, il numero sempre
// scritto, il valore più alto della riga con il bordo scuro. L'intensità è il
// colore della persona mescolato alla superficie: non è una scala sequenziale del
// sistema, e vale solo qui (DECISIONI). Il dato si legge dal numero, non dal colore.
export function CompetencyHeatmap({
  title,
  highestLabel,
  columns,
  groups,
  format,
  focus,
  onFocus,
  className,
}: {
  title: string
  /** La casella che accende il bordo sul valore più alto della riga. */
  highestLabel: string
  columns: { id: string; label: string; color: string }[]
  groups: HeatmapGroup[]
  format: (n: number) => string
  focus?: string | null
  onFocus?: (id: string) => void
  className?: string
}) {
  const [showHighest, setShowHighest] = useState(true)
  // Da 1 a 10, dal 10% al 90% del colore; dall'8 in su il numero passa al colore del fondo, per restare leggibile.
  const strength = (v: number) => Math.round(10 + ((Math.min(10, Math.max(1, v)) - 1) / 9) * 80)
  return (
    <Card data-slot="competency-heatmap" className={cn('gap-3 overflow-x-auto', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="label-mono text-muted-foreground">{title}</p>
        <label className="inline-flex items-center gap-2 text-app-small text-muted-foreground">
          <Checkbox checked={showHighest} onCheckedChange={(c) => setShowHighest(c === true)} />
          {highestLabel}
        </label>
      </div>
      <table className="w-full min-w-xl table-fixed border-separate border-spacing-1 text-app-small">
        <thead>
          <tr>
            <th scope="col" className="w-1/3">
              <span className="sr-only">Competenza</span>
            </th>
            {columns.map((c) => (
              <th key={c.id} scope="col" className={cn('transition-opacity', focus && focus !== c.id && 'opacity-40')}>
                <button type="button" aria-pressed={focus === c.id} onClick={() => onFocus?.(c.id)} className="w-full truncate rounded-xs px-1 py-1 text-center font-semibold text-background outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" style={{ background: c.color }}>
                  {c.label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <Fragment key={g.label}>
              <tr>
                <th scope="colgroup" colSpan={columns.length + 1} className="label-mono pt-3 text-left font-normal text-muted-foreground">
                  {g.label}
                </th>
              </tr>
              {g.rows.map((r) => {
                const max = Math.max(...r.values.map((v) => v ?? -1))
                return (
                  <tr key={r.key}>
                    <th scope="row" className="pr-3 text-left font-normal text-foreground">
                      {r.label}
                    </th>
                    {r.values.map((v, i) => {
                      const s = v != null ? strength(v) : 0
                      return (
                        <td
                          key={columns[i].id}
                          className={cn('rounded-xs border text-center tabular-nums transition-opacity', s > 70 ? 'text-background' : 'text-foreground', showHighest && v != null && v === max ? 'border-foreground font-semibold' : 'border-transparent', focus && focus !== columns[i].id && 'opacity-40')}
                          style={v != null ? { background: `color-mix(in oklab, ${columns[i].color} ${s}%, var(--card))` } : undefined}
                        >
                          {v != null ? format(v) : '—'}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
