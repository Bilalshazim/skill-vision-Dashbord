import { cn } from '@/lib/utils'

// Shared class-name constants for the 3 Protocollo di Intervista forms
// (modules/recruiting.html .iv-field/.iv-table/.iv-check/.form-btn, ~4488-
// 5015) — kept in their own constants-only file (separate from
// protocol-ui.tsx's components) so Fast Refresh doesn't warn about a file
// exporting both.

export const inputClass =
  'w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
export const textareaClass = cn(inputClass, 'min-h-[64px] resize-y')
export const selectClass = cn(inputClass, 'appearance-auto')

export const ghostBtnClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-3.5 py-1.5 text-[12px] font-bold text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
export const dangerBtnClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-3.5 py-1.5 text-[12px] font-bold text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
export const primaryBtnClass =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-[12px] font-bold text-foreground transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
export const dashedBtnClass =
  'self-start rounded-full border border-dashed border-border px-3 py-1.5 text-[12px] font-bold text-foreground transition-colors hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:text-primary'

export const tableWrapClass = 'overflow-x-auto rounded-md border border-border'
export const tableClass = 'w-full min-w-[520px] border-collapse text-[12px]'
export const thClass = 'border-b border-border bg-secondary px-2 py-1.5 text-left font-semibold text-muted-foreground'
export const tdClass = 'border-b border-border px-2 py-1.5 align-top'
export const totalRowClass = 'font-semibold text-foreground'
