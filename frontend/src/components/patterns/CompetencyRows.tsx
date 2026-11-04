import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type CompetencyGroup = { label: string; rows: { key: string; label: string; a: number; b: number }[] }

// Il confronto a due, competenza per competenza (CLAUDE.md, Fase 6): una riga per
// competenza, due punti sulla scala da 1 a 10 uniti da un tratto. Cerchio per la
// prima persona, rombo per la seconda: si distinguono anche senza il colore
// (regola 10), e i due valori sono scritti in fondo alla riga.
export function CompetencyRows({
  title,
  people,
  groups,
  format,
  className,
}: {
  title: string
  people: [{ name: string; short: string; color: string }, { name: string; short: string; color: string }]
  groups: CompetencyGroup[]
  format: (n: number) => string
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
                  <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background" style={{ left: at(r.a), background: people[0].color }} />
                  <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-background" style={{ left: at(r.b), background: people[1].color }} />
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
