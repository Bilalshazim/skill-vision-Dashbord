import { type LucideIcon } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// Shared "this action isn't available in this build" affordance. HISTORICAL
// NOTE: this used to be an <a href="/modules/recruiting.html"> bridge into
// the legacy app — that page has since been removed from the repo entirely
// (no modules/ directory exists at either the repo root or frontend/public),
// so every one of these buttons navigated to a dead 404. It is now a real,
// DISABLED button: the action it stands for is genuinely unavailable (CV
// bulk import and the internal-talents Excel upload have no backend
// implementation to call), and pretending otherwise — either by faking the
// action or by linking to a deleted page — was never honest (§16: never a
// false success). Still always a visible icon + text label, never
// hover-only — the tooltip only supplements, per task section 12.
export function LegacyBridgeButton({
  icon: Icon,
  label,
  className,
}: {
  icon: LucideIcon
  label: string
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className={cn(
            'inline-flex cursor-not-allowed items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-[11.5px] font-semibold text-muted-foreground opacity-60',
            className,
          )}
        >
          <Icon className="size-3.5 shrink-0" aria-hidden="true" />
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent>Non disponibile in questa build — azione non ancora implementata</TooltipContent>
    </Tooltip>
  )
}
