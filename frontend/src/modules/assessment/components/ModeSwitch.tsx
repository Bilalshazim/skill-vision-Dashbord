import { Check } from 'lucide-react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import type { getUI } from '@/modules/assessment/lib/legacy-utils'

type UI = ReturnType<typeof getUI>
export type ModuleMode = 'A' | 'B' | 'AB'

// La scelta fra Competenze trasversali (CT), Competenze professionali (CP) e
// Completo (CT + CP) della Home di Assessment. Il cliente (2026-10-13) la
// vuole più in evidenza e chiede che si veda che CT e CP sono due aree
// diverse: controllo a segmenti compatto, su una riga sotto l'intestazione,
// con un colore per area — lo stesso della scelta del modulo (chart-1
// petrolio per CT, chart-2 magenta per CP, Completo neutro con i due
// pallini). La voce scelta si riempie del suo colore; il colore non è l'unico
// segnale: c'è la spunta. La scelta guida anche l'indice a sinistra.
const AREA = {
  A: { dots: ['bg-chart-1'], code: 'text-chart-1', on: 'data-[state=on]:bg-chart-1' },
  B: { dots: ['bg-chart-2'], code: 'text-chart-2', on: 'data-[state=on]:bg-chart-2' },
  AB: { dots: ['bg-chart-1', 'bg-chart-2'], code: 'text-foreground', on: 'data-[state=on]:bg-foreground' },
} as const

export function ModeSwitch({ value, onChange, ui }: { value: ModuleMode; onChange: (mode: ModuleMode) => void; ui: UI }) {
  const items: { value: ModuleMode; label: string }[] = [
    { value: 'A', label: ui.f3ModeCT },
    { value: 'B', label: ui.f3ModeCP },
    { value: 'AB', label: ui.f3ModeBoth },
  ]
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <span id="mode-switch-label" className="label-mono text-muted-foreground">
        {ui.f3ModeLabel}
      </span>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => v && onChange(v as ModuleMode)}
        aria-labelledby="mode-switch-label"
        className="border-border-strong"
      >
        {items.map((it) => {
          const a = AREA[it.value]
          const on = value === it.value
          const [code, ...rest] = it.label.split(' · ')
          return (
            <ToggleGroupItem
              key={it.value}
              value={it.value}
              className={cn('h-9 px-3 text-foreground hover:bg-muted hover:text-foreground data-[state=on]:text-background', a.on)}
            >
              <span className="flex items-center gap-1" aria-hidden="true">
                {a.dots.map((d) => (
                  <span key={d} className={cn('size-2 rounded-full', d, on && 'ring-2 ring-background')} />
                ))}
              </span>
              <span className={cn('font-mono font-semibold', on ? 'text-background' : a.code)}>{code}</span>
              <span>{rest.join(' · ')}</span>
              {on ? <Check aria-hidden="true" /> : null}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
    </div>
  )
}
