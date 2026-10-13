import { Check } from 'lucide-react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import type { getUI } from '@/modules/assessment/lib/legacy-utils'

type UI = ReturnType<typeof getUI>
export type ModuleMode = 'A' | 'B' | 'AB'

// La scelta fra Competenze trasversali (CT), Competenze professionali (CP) e
// Completo (CT + CP) della Home di Assessment. Il cliente (2026-10-13) la
// vuole molto più in evidenza e chiede che si capisca che CT e CP sono due
// aree diverse: pannello a tutta riga sotto l'intestazione, tre riquadri
// grandi con una riga che dice cosa contiene l'area. Ogni area ha il suo
// colore, lo stesso della scelta del modulo (chart-1 petrolio per CT, chart-2
// magenta per CP); il riquadro scelto si riempie di quel colore, Completo di
// neutro pieno. Il colore non è l'unico segnale: spunta e «Selezionata».
// La scelta guida anche l'indice a sinistra (AssessmentNav).
const AREA = {
  A: { dots: ['bg-chart-1'], code: 'text-chart-1', on: 'data-[state=on]:border-chart-1 data-[state=on]:bg-chart-1', hover: 'hover:border-chart-1' },
  B: { dots: ['bg-chart-2'], code: 'text-chart-2', on: 'data-[state=on]:border-chart-2 data-[state=on]:bg-chart-2', hover: 'hover:border-chart-2' },
  AB: { dots: ['bg-chart-1', 'bg-chart-2'], code: 'text-foreground', on: 'data-[state=on]:border-foreground data-[state=on]:bg-foreground', hover: 'hover:border-foreground' },
} as const

export function ModeSwitch({ value, onChange, ui }: { value: ModuleMode; onChange: (mode: ModuleMode) => void; ui: UI }) {
  const items: { value: ModuleMode; label: string; desc: string }[] = [
    { value: 'A', label: ui.f3ModeCT, desc: ui.f3ModeCTDesc },
    { value: 'B', label: ui.f3ModeCP, desc: ui.f3ModeCPDesc },
    { value: 'AB', label: ui.f3ModeBoth, desc: ui.f3ModeBothDesc },
  ]
  return (
    <section aria-labelledby="mode-switch-title" className="mb-6 flex flex-col gap-3 rounded-lg border border-border-strong bg-card p-4">
      <div className="flex flex-col gap-1">
        <span className="label-mono text-muted-foreground">{ui.f3ModeLabel}</span>
        <h2 id="mode-switch-title" className="text-app-section text-foreground">
          {ui.f3ModeTitle}
        </h2>
        <p className="text-app-small text-muted-foreground">{ui.f3ModeSub}</p>
      </div>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => v && onChange(v as ModuleMode)}
        aria-labelledby="mode-switch-title"
        className="grid w-full max-w-none grid-cols-1 gap-3 border-0 bg-transparent p-0 md:grid-cols-3"
      >
        {items.map((it) => {
          const a = AREA[it.value]
          const on = value === it.value
          const [code, ...rest] = it.label.split(' · ')
          return (
            <ToggleGroupItem
              key={it.value}
              value={it.value}
              className={cn(
                'group h-auto w-full flex-col items-start justify-start gap-2 rounded-md border-2 border-border bg-background px-4 py-3 text-left whitespace-normal text-foreground hover:bg-background hover:text-foreground data-[state=on]:text-background',
                a.hover,
                a.on,
              )}
            >
              <span className="flex w-full items-center gap-2">
                <span className="flex items-center gap-1" aria-hidden="true">
                  {a.dots.map((d) => (
                    <span key={d} className={cn('size-3 rounded-full ring-2 ring-background', d)} />
                  ))}
                </span>
                <span className={cn('font-mono text-app-section font-semibold', on ? 'text-background' : a.code)}>{code}</span>
                {on ? (
                  <span className="ml-auto inline-flex items-center gap-1 text-app-caption font-semibold">
                    <Check aria-hidden="true" />
                    {ui.f3ModeSelected}
                  </span>
                ) : null}
              </span>
              <span className="text-app-body font-semibold">{rest.join(' · ')}</span>
              <span className={cn('text-app-small font-normal', on ? 'text-background' : 'text-muted-foreground')}>{it.desc}</span>
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
    </section>
  )
}
