import { ChevronDown, type LucideIcon } from 'lucide-react'
import { type KeyboardEvent, type MouseEvent, type ReactNode, useState } from 'react'

import { cn } from '@/lib/utils'

// Ported from the "Profilo della ricerca" hub's 4 master cards (modules/
// recruiting.html #scr-profilo ~247-343, toggleMasterCard()/mcCardToggleKd()
// ~4822-4837) — the whole card header is the click/toggle target, expanded
// by default (legacy's initial aria-expanded="true" on all 4), collapse
// state is a plain, non-persisted UI toggle (legacy never writes it to
// storage either).
//
// Keyboard guard: legacy's mcCardToggleKd() ignores Enter/Space that
// originated on a NESTED focusable control (a Subcard header, or an inner
// action row) via `event.target.closest('button,a,...):not(#thisCard)'`, so
// a nested control's own key handling isn't hijacked by the outer card's
// toggle. React's onKeyDown here bubbles the same way; checking
// `event.target === event.currentTarget` reproduces the identical guard —
// only a key press landing directly on the card root (not on a descendant)
// toggles it.
//
// Click guard (React-portal gotcha, no legacy equivalent): Survey Link/Job
// Posting render their edit dialogs through a Radix Portal — the DOM node
// lives under document.body, but REACT'S SYNTHETIC EVENT SYSTEM still
// bubbles a click from inside that portal along the REACT TREE (this card
// is the Dialog's JSX ancestor), not the real DOM tree. Without this guard,
// clicking anything inside an open dialog — the URL input, "Salva & apri" —
// would ALSO reach this card's onClick and collapse it, unmounting the
// dialog mid-interaction. Checking real DOM containment (`contains`)
// instead of trusting the synthetic event's propagation path fixes it.
export function MasterCard({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  function toggle() {
    setCollapsed((c) => !c)
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.target as Node)) return
    toggle()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    if (event.target !== event.currentTarget) return
    event.preventDefault()
    toggle()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={!collapsed}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        <Icon className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="flex-1 text-[14px] font-semibold text-foreground">{title}</div>
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', collapsed && '-rotate-90')} aria-hidden="true" />
      </div>
      {!collapsed && <div className="flex flex-col gap-2.5 border-t border-border p-4">{children}</div>}
    </div>
  )
}
