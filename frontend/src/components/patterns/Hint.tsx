import { isValidElement, type ReactElement, type ReactNode } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Suggerimento su un controllo: sostituisce l'attributo `title`, che non si
// vede da tastiera né sugli schermi touch. Un controllo disabilitato non
// riceve eventi, quindi in quel caso il bersaglio del tooltip è uno span
// focalizzabile attorno al controllo: la spiegazione del perché è
// disabilitato resta raggiungibile (checklist §8, Stati).
export function Hint({ label, side = 'top', children }: { label: ReactNode; side?: 'top' | 'right' | 'bottom' | 'left'; children: ReactElement }) {
  const disabled = isValidElement<{ disabled?: boolean }>(children) && !!children.props.disabled
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {disabled ? (
          <span tabIndex={0} className="inline-flex">
            {children}
          </span>
        ) : (
          children
        )}
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}
