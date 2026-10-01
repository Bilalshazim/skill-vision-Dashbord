import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

// I passi di una procedura, cliccabili per saltare a un passo. Ogni passo
// è un bottone; quello corrente ha `aria-current="step"` e il testo pieno,
// quelli fatti la spunta. Sotto i 640px restano i soli pallini (il nome
// resta per i lettori di schermo). Chi la usa decide se il salto è
// permesso (`onSelect` può rifiutarlo).
export function StepNav({ steps, current, onSelect, label }: { steps: readonly string[]; current: number; onSelect: (index: number) => void; label: string }) {
  return (
    <nav aria-label={label}>
      <ol className="flex flex-wrap justify-between gap-1">
        {steps.map((s, i) => {
          const done = i < current
          const on = i === current
          return (
            <li key={i} className="min-w-12 flex-1">
              <button
                type="button"
                aria-current={on ? 'step' : undefined}
                onClick={() => onSelect(i)}
                className={cn(
                  'flex w-full flex-col items-center gap-1 rounded-sm px-1 py-2 outline-none transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  on ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn('flex size-4 items-center justify-center rounded-full border', on ? 'border-2 border-primary bg-primary' : done ? 'border-foreground bg-foreground text-background' : 'border-input')}
                >
                  {done ? <Check className="size-3" /> : null}
                </span>
                <span className={cn('label-mono max-sm:sr-only', on && 'font-semibold')}>{s}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
