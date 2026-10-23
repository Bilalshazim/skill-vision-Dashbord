import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { getUI } from '@/modules/assessment/lib/legacy-utils'

type UI = ReturnType<typeof getUI>
export type ModuleMode = 'A' | 'B' | 'AB'

// La scelta fra Competenze trasversali (CT), Competenze professionali (CP) e
// Completo (CT + CP), nelle azioni dell'intestazione della Panoramica. Un
// ToggleGroup normale (CLAUDE.md, Fase 6, 2026-10-23): il lime lo mette il
// tema sulla voce scelta. Via il bordo di 2px, il rilievo e i colori dei
// grafici per le due aree, che facevano della scelta una decorazione. La
// scelta guida anche l'indice a sinistra (AssessmentNav).
export function ModeSwitch({ value, onChange, ui }: { value: ModuleMode; onChange: (mode: ModuleMode) => void; ui: UI }) {
  const items: { value: ModuleMode; label: string }[] = [
    { value: 'A', label: ui.f3ModeCT },
    { value: 'B', label: ui.f3ModeCP },
    { value: 'AB', label: ui.f3ModeBoth },
  ]
  return (
    <ToggleGroup type="single" value={value} onValueChange={(v) => v && onChange(v as ModuleMode)} aria-label={ui.f3ModeLabel}>
      {items.map((it) => (
        <ToggleGroupItem key={it.value} value={it.value}>
          {it.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
