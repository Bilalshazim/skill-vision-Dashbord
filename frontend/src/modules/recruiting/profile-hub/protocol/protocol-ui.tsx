import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

// Shared small layout primitives for the 3 Protocollo di Intervista forms
// (modules/recruiting.html .iv-field/.iv-grid2/.iv-grid3/.iv-section-label/
// .iv-check, ~4488-5015) — extracted here because all 3 dialogs reuse the
// same field/grid/section/checkbox-row shapes dozens of times each. Class
// constants live in protocol-styles.ts (kept separate so this file only
// exports components).

export function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn('flex flex-col gap-1 text-[12px] font-medium text-foreground', className)}>
      {label}
      {children}
    </label>
  )
}

export function Grid2({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2', className)}>{children}</div>
}

export function Grid3({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-3', className)}>{children}</div>
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="mt-3 border-t border-border pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</div>
}

export function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-[12.5px] text-foreground">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-ring" />
      {children}
    </label>
  )
}

export function ModalEyebrow({ children }: { children: ReactNode }) {
  return <div className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</div>
}
