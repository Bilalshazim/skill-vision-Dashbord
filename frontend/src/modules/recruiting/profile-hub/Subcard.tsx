import { ChevronDown, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

// Riquadro secondario dentro una MasterCard, chiuso all'inizio. Intestazione
// con icona, voce e valore a destra; solo l'intestazione apre e chiude.
export function Subcard({ icon: Icon, label, value, children }: { icon: LucideIcon; label: string; value: string; children: ReactNode }) {
  return (
    <Collapsible className="overflow-hidden rounded-sm border border-border">
      <CollapsibleTrigger className="group flex w-full items-center gap-3 px-3 py-2 text-left outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="flex-1 text-app-body font-medium">{label}</span>
        <span className="text-app-small text-muted-foreground">{value}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" aria-hidden="true" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border p-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}
