import type { ReactNode } from 'react'

import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type CompetencyGroup = { label: string; rows: { key: string; label: string; a: number; b: number }[] }

// Il confronto a due, competenza per competenza (CLAUDE.md, Fase 6): una riga per
// competenza, due punti sulla scala da 1 a 10 uniti da un tratto. Cerchio per la
// prima persona, rombo per la seconda: si distinguono anche senza il colore
// (regola 10), e i due valori sono scritti in fondo alla riga. Al passaggio del
// mouse ogni punto dice persona, competenza e valore; se coincidono, tutti e due.
export function CompetencyRows({
  title,
  people,
  groups,
  format,
  tip,
  className,
}: {
  title: string
  people: [{ name: string; short: string; color: string }, { name: string; short: string; color: string }]
  groups: CompetencyGroup[]
  format: (n: number) => string
  /** Il testo del tooltip di un punto: «Nome · Competenza: 7 su 10». */
  tip: (name: string, competency: string, value: string) => string
  className?: string
}) {
  const at = (v: number) => `${((Math.min(10, Math.max(1, v)) - 1) / 9) * 100}%`
  return (
    <Card data-slot="competency-rows" className={cn('gap-3', className)}>
      <div className="grid grid-cols-5 items-baseline gap-3">
        <p className="label-mono col-span-2 text-muted-foreground">{title}</p>
        <p className="label-mono col-span-2 flex justify-between text-muted-foreground">
          <span>1</span>
          <span>10</span>
        </p>
        <p className="label-mono text-right text-muted-foreground">
          {people[0].short} · {people[1].short}
        </p>
      </div>
      {groups.map((g) => (
        <section key={g.label} className="flex flex-col gap-1">
          <h3 className="label-mono border-b border-border pb-1 text-muted-foreground">{g.label}</h3>
          <ul>
            {g.rows.map((r) => (
              <li key={r.key} className="grid grid-cols-5 items-center gap-3 py-1">
                <span className="col-span-2 min-w-0 text-app-small text-foreground">{r.label}</span>
                <span className="relative col-span-2 h-4" role="img" aria-label={`${people[0].name} ${format(r.a)}, ${people[1].name} ${format(r.b)}`}>
                  <span className="absolute inset-x-0 top-1/2 border-t border-border" />
                  <span className="absolute top-1/2 h-1 -translate-y-1/2 bg-muted-foreground" style={{ left: `min(${at(r.a)}, ${at(r.b)})`, width: `calc(max(${at(r.a)}, ${at(r.b)}) - min(${at(r.a)}, ${at(r.b)}))` }} />
                  <Dot left={at(r.a)} lines={[tip(people[0].name, r.label, format(r.a))]}>
                    <span className="size-3 rounded-full border border-background" style={{ background: people[0].color }} />
                  </Dot>
                  <Dot left={at(r.b)} lines={r.a === r.b ? [tip(people[0].name, r.label, format(r.a)), tip(people[1].name, r.label, format(r.b))] : [tip(people[1].name, r.label, format(r.b))]}>
                    <span className="size-3 rotate-45 border border-background" style={{ background: people[1].color }} />
                  </Dot>
                </span>
                <span className="text-right text-app-small tabular-nums text-foreground">
                  {format(r.a)} · {format(r.b)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Card>
  )
}

function Dot({ left, lines, children }: { left: string; lines: string[]; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span data-slot="competency-dot" className="absolute top-1/2 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center" style={{ left }}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {lines.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </TooltipContent>
    </Tooltip>
  )
}
