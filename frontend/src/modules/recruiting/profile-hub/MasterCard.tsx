import { ChevronDown, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

// Riquadro principale di "Profilo della ricerca", aperto all'inizio. Prima
// era un div role="button" con tutta la card cliccabile: un clic su uno
// spazio vuoto del contenuto la chiudeva, i bottoni stavano annidati dentro
// un bottone e i Dialog in portale richiedevano di fermare la propagazione a
// mano. Ora solo l'intestazione apre e chiude (Collapsible, con
// aria-expanded e aria-controls).
export function MasterCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <Collapsible defaultOpen asChild>
      <Card padding="none">
        <CollapsibleTrigger className="group flex w-full items-center gap-3 px-4 py-3 text-left outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="flex-1 text-app-section">{title}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" aria-hidden="true" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-3 border-t border-border p-4">{children}</div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
