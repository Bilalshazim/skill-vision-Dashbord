import { Check } from 'lucide-react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { getUI } from '@/modules/assessment/lib/legacy-utils'

type UI = ReturnType<typeof getUI>
export type ModuleMode = 'A' | 'B' | 'AB'

// La scelta fra Competenze trasversali (CT), Competenze professionali (CP) e
// Completo (CT + CP) della Home di Assessment — in evidenza (Foglio 3,
// Roberto Feliciani): grande, con la scritta "Seleziona la vista", la voce
// scelta piena di lime e con la spunta (il colore non è l'unico segnale),
// le altre con bordo ben visibile. La scelta guida anche l'indice a
// sinistra (AssessmentNav).
export function ModeSwitch({ value, onChange, ui }: { value: ModuleMode; onChange: (mode: ModuleMode) => void; ui: UI }) {
  const items: { value: ModuleMode; label: string }[] = [
    { value: 'A', label: ui.f3ModeCT },
    { value: 'B', label: ui.f3ModeCP },
    { value: 'AB', label: ui.f3ModeBoth },
  ]
  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <span className="label-mono text-foreground">{ui.f3ModeLabel}</span>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => v && onChange(v as ModuleMode)}
        aria-label={ui.f3ModeLabel}
        className="gap-2 border-2 border-border-strong p-1.5"
      >
        {items.map((it) => (
          <ToggleGroupItem
            key={it.value}
            value={it.value}
            className="h-11 gap-2 border-2 border-transparent px-4 text-app-small font-semibold text-foreground hover:border-border-strong data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {value === it.value ? <Check aria-hidden="true" /> : null}
            {it.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
