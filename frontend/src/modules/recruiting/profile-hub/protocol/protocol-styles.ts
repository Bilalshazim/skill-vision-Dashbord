import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

// Shared class-name constants for the 3 Protocollo di Intervista forms
// (modules/recruiting.html .iv-field/.iv-table/.iv-check/.form-btn, ~4488-
// 5015) — kept in their own constants-only file (separate from
// protocol-ui.tsx's components) so Fast Refresh doesn't warn about a file
// exporting both.

export const inputClass =
  'w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50'
export const textareaClass = cn(inputClass, 'min-h-[64px] resize-y')
export const selectClass = cn(inputClass, 'appearance-auto')

export const ghostBtnClass = buttonVariants({ variant: 'outline', size: 'sm' })
export const dangerBtnClass = buttonVariants({ variant: 'destructive', size: 'sm' })
export const primaryBtnClass = buttonVariants({ size: 'sm' })
export const dashedBtnClass = cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'self-start border-dashed')

export const tableWrapClass = 'overflow-x-auto rounded-md border border-border'
export const tableClass = 'w-full min-w-[520px] border-collapse text-[12px]'
export const thClass = 'border-b border-border bg-secondary px-2 py-1.5 text-left font-semibold text-muted-foreground'
export const tdClass = 'border-b border-border px-2 py-1.5 align-top'
export const totalRowClass = 'font-semibold text-foreground'
