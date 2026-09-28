import { type LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Un'azione del vecchio Recruiting non ancora portata in React. Resta
// visibile, disabilitata, con la spiegazione nel tooltip: il disabilitato
// da solo non basta a dire perché (checklist §8, Stati). Lo span fa da
// bersaglio del tooltip, perché un bottone disabilitato non riceve eventi.
export function LegacyBridgeButton({ icon: Icon, label, className }: { icon: LucideIcon; label: string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className={className}>
          <Button variant="outline" size="sm" disabled aria-disabled="true">
            <Icon aria-hidden="true" />
            {label}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>Non disponibile in questa build — azione non ancora implementata</TooltipContent>
    </Tooltip>
  )
}
