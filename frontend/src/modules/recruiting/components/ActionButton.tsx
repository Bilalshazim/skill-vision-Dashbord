import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

// Same footprint as LegacyBridgeButton (same size/border/hover recipe) but
// for a REAL, fully-migrated action — no ExternalLink icon, no "not
// migrated yet" tooltip. Keeping the two visually distinct (this one is
// plain; the bridge one always carries the external-link glyph) is
// deliberate, per the task's "clearly distinguish real functionality from
// a temporary bridge" rule — a recruiter should never have to guess which
// button actually does the thing in this app versus hands off to the old one.
export function ActionButton({
  icon: Icon,
  label,
  onClick,
  className,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-[11.5px] font-semibold text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {label}
    </button>
  )
}
