import { ChevronDown, type LucideIcon } from 'lucide-react'
import { type KeyboardEvent, type MouseEvent, type ReactNode, useState } from 'react'

import { cn } from '@/lib/utils'

// Ported from the Area Valutatore master card's 3 sub-sections (modules/
// recruiting.html ~309-341, toggleSubcard()/mcSubcardToggleKd()
// ~4838-4850) — independent nested accordion rows inside a MasterCard,
// CLOSED by default (legacy's initial aria-expanded="false" on every
// subcard header, unlike the master cards themselves which start open).
// Every interaction stops propagation so it never also toggles the parent
// MasterCard, matching legacy's own event.stopPropagation() on both the
// subcard header and its body's action row.
export function Subcard({ icon: Icon, label, value, children }: { icon: LucideIcon; label: string; value: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)

  function toggle(event: MouseEvent) {
    event.stopPropagation()
    setOpen((o) => !o)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    event.stopPropagation()
    setOpen((o) => !o)
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="flex-1 text-[13px] font-medium text-foreground">{label}</span>
        <span className="text-[12px] text-muted-foreground">{value}</span>
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', !open && '-rotate-90')} aria-hidden="true" />
      </div>
      {open && (
        <div className="border-t border-border p-3" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      )}
    </div>
  )
}
