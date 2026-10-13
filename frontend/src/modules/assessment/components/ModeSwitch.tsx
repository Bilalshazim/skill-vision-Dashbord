import { Check } from 'lucide-react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import type { getUI } from '@/modules/assessment/lib/legacy-utils'

type UI = ReturnType<typeof getUI>
export type ModuleMode = 'A' | 'B' | 'AB'

// La scelta fra Competenze trasversali (CT), Competenze professionali (CP) e
// Completo (CT + CP) della Home di Assessment, a destra del titolo «Home».
// Richiesta del cliente (2026-10-13): in evidenza, CT e CP riconoscibili
// come due aree diverse, con un colore ciascuna. Aspetto delle folder card
// della Home: bordo 2px `primary`, fondo `card`, rilievo che diventa lime al
// passaggio del mouse (stessa eccezione alla regola 3, DECISIONI.md). Voce
// scelta piena del colore dell'area: CT `chart-1` petrolio, CP `chart-3`
// ambra, Completo lime (`primary`). Il colore non è l'unico segnale: c'è la
// spunta. La scelta guida anche l'indice a sinistra (AssessmentNav).
const AREA = {
  A: { dots: ['bg-chart-1'], code: 'text-chart-1', on: 'data-[state=on]:bg-chart-1 data-[state=on]:text-background' },
  B: { dots: ['bg-chart-3'], code: 'text-chart-3', on: 'data-[state=on]:bg-chart-3 data-[state=on]:text-background' },
  AB: { dots: ['bg-chart-1', 'bg-chart-3'], code: 'text-foreground', on: 'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground' },
} as const

export function ModeSwitch({ value, onChange, ui }: { value: ModuleMode; onChange: (mode: ModuleMode) => void; ui: UI }) {
  const items: { value: ModuleMode; label: string }[] = [
    { value: 'A', label: ui.f3ModeCT },
    { value: 'B', label: ui.f3ModeCP },
    { value: 'AB', label: ui.f3ModeBoth },
  ]
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as ModuleMode)}
      aria-label={ui.f3ModeLabel}
      className="rounded-lg border-2 border-primary bg-card p-1 shadow-[0_8px_16px_0_var(--border-strong)] transition-shadow hover:shadow-[0_8px_16px_0_var(--primary)]"
    >
      {items.map((it) => {
        const a = AREA[it.value]
        const on = value === it.value
        const [code, ...rest] = it.label.split(' · ')
        return (
          <ToggleGroupItem key={it.value} value={it.value} className={cn('h-9 rounded-md px-3 text-foreground hover:bg-muted hover:text-foreground', a.on)}>
            <span className="flex items-center gap-1" aria-hidden="true">
              {a.dots.map((d) => (
                <span key={d} className={cn('size-2 rounded-full', d, on && 'ring-2 ring-background')} />
              ))}
            </span>
            <span className={cn('font-mono font-semibold', !on && a.code)}>{code}</span>
            <span>{rest.join(' · ')}</span>
            {on ? <Check aria-hidden="true" /> : null}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
