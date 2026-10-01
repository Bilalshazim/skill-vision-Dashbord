import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

// Shared class-name constants for the 3 Protocollo di Intervista forms
// (campi e tendine sono passati a Input / Textarea / SelectField della libreria)
// (modules/recruiting.html .iv-field/.iv-table/.iv-check/.form-btn, ~4488-
// 5015) — kept in their own constants-only file (separate from
// protocol-ui.tsx's components) so Fast Refresh doesn't warn about a file
// exporting both.

export const ghostBtnClass = buttonVariants({ variant: 'outline', size: 'sm' })
export const dangerBtnClass = buttonVariants({ variant: 'destructive', size: 'sm' })
export const primaryBtnClass = buttonVariants({ size: 'sm' })
export const dashedBtnClass = cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'self-start border-dashed')

