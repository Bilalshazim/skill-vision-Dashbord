import type { LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export type DecisionTone = 'neutral' | 'success' | 'warning' | 'destructive'

const SURFACE: Record<DecisionTone, string> = {
  neutral: 'border border-border bg-background',
  success: 'surface-success',
  warning: 'surface-warning',
  destructive: 'surface-danger',
}
const INK: Record<DecisionTone, string> = {
  neutral: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
}

// Una riga di "Le Decisioni" nella Home di Assessment: l'azione consigliata,
// la sua nota modificabile sul posto (salvata nelle impostazioni del
// modulo, come prima), quante persone riguarda. Il tono segue l'urgenza
// dell'azione; l'etichetta dice di che azione si tratta.
export function DecisionRow({
  icon: Icon,
  label,
  note,
  onNoteChange,
  readOnly,
  count,
  unit,
  tone,
}: {
  icon: LucideIcon
  label: string
  note: string
  onNoteChange: (value: string) => void
  readOnly: boolean
  count: number
  unit: string
  tone: DecisionTone
}) {
  return (
    <div className={cn('flex items-center gap-3 rounded-sm p-3', SURFACE[tone])}>
      <Icon className={cn('size-4 shrink-0', INK[tone])} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-app-small font-medium text-foreground">{label}</p>
        <Textarea variant="inline" size="sm" rows={1} readOnly={readOnly} aria-label={label} value={note} onChange={(e) => onNoteChange(e.target.value)} className="-mx-1 text-muted-foreground" />
      </div>
      <Badge className="shrink-0">
        {count} {unit}
      </Badge>
    </div>
  )
}
