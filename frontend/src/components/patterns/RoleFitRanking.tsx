import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type RoleFitRow = { id: string; name: string; meta?: string; value: number; color: string }

// In cima a ogni confronto, la classifica di adattamento al ruolo (CLAUDE.md,
// Fase 6, tavole del 2–4 novembre): dal più alto, barra piena nel colore della
// persona, l'atteso 100 tratteggiato con il nome, un'etichetta lime con lo scarto
// per chi lo supera. Nessuno sfondo colorato oltre l'atteso. Barre in HTML, non
// Bklit: una barra per persona con il suo colore e il suo nome (DECISIONI).
// `focus`: la persona in evidenza; le altre si attenuano. Il clic sul nome la
// sceglie.
export function RoleFitRanking({
  label,
  sentence,
  rows,
  referenceLabel,
  focus,
  onFocus,
  className,
}: {
  label: string
  sentence: string
  rows: RoleFitRow[]
  referenceLabel: string
  focus?: string | null
  onFocus?: (id: string) => void
  className?: string
}) {
  const sorted = [...rows].sort((a, b) => b.value - a.value)
  const scale = Math.max(120, ...sorted.map((r) => r.value))
  const referenceAt = `${(100 / scale) * 100}%`
  return (
    <Card data-slot="role-fit-ranking" className={cn('gap-3', className)}>
      <p className="label-mono text-muted-foreground">{label}</p>
      <h2 className="max-w-4xl text-app-section text-foreground">{sentence}</h2>
      <ol className="flex flex-col gap-3 pt-2">
        {sorted.map((r) => {
          const over = r.value - 100
          return (
            <li key={r.id} className={cn('grid grid-cols-1 items-center gap-1 transition-opacity sm:grid-cols-5 sm:gap-4', focus && focus !== r.id && 'opacity-40')}>
              <button type="button" aria-pressed={focus === r.id} onClick={() => onFocus?.(r.id)} className="min-w-0 rounded-xs text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                <span className="block truncate text-app-small font-medium text-foreground">{r.name}</span>
                {r.meta ? <span className="block truncate text-app-caption text-muted-foreground">{r.meta}</span> : null}
              </button>
              <div className="flex items-center gap-3 sm:col-span-4">
                <div className="relative h-6 min-w-0 flex-1 rounded-xs bg-muted">
                  <div className="h-full rounded-xs" style={{ width: `${(r.value / scale) * 100}%`, background: r.color }} />
                  <span aria-hidden="true" className="absolute inset-y-0 border-l border-dashed border-foreground" style={{ left: referenceAt }} />
                </div>
                <span className="flex w-20 shrink-0 items-center justify-end gap-2">
                  {over > 0 ? <span className="rounded-xs bg-primary px-1 text-app-caption font-medium text-primary-foreground">+{over}</span> : null}
                  <span className="text-app-subtitle font-semibold tabular-nums text-foreground">{r.value}</span>
                </span>
              </div>
            </li>
          )
        })}
      </ol>
      <p className="text-right text-app-caption text-muted-foreground">
        <span aria-hidden="true" className="mr-2 inline-block w-4 border-t border-dashed border-foreground align-middle" />
        {referenceLabel}
      </p>
    </Card>
  )
}
