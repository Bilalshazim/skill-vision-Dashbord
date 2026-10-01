import { ArrowDown, ArrowUp, Equal } from 'lucide-react'

import { useAssessment } from '@/modules/assessment/lib/AssessmentContext'

// La legenda della tabella di confronto: le stesse icone di MatchCell, con la
// parola. Prima erano tre pallini colorati.
export function MatchLegend() {
  const { ui } = useAssessment()
  const items = [
    { Icon: ArrowUp, label: ui.legendHighest, ink: 'text-success' },
    { Icon: ArrowDown, label: ui.legendLowest, ink: 'text-destructive' },
    { Icon: Equal, label: ui.legendAligned, ink: 'text-muted-foreground' },
  ]
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-4 py-3 text-app-small text-muted-foreground">
      {items.map(({ Icon, label, ink }) => (
        <li key={label} className="inline-flex items-center gap-2">
          <Icon className={`size-3.5 ${ink}`} aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  )
}
