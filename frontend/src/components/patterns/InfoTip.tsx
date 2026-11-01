import { Info } from 'lucide-react'
import type { ReactNode } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Il tooltip ⓘ accanto a un dato o a un termine da spiegare (CLAUDE.md, Fase
// 6): cosa vuol dire il dato e, se serve, come si legge. Due o tre righe,
// mai di più; non "a cosa serve". È un bottone, quindi si apre anche con il
// focus da tastiera (Tooltip di shadcn). `label` è il nome accessibile:
// dice di che cosa è la spiegazione.
export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-full align-middle text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Info className="size-4" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-app-small">
        {children}
      </TooltipContent>
    </Tooltip>
  )
}
