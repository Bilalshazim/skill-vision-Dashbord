import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Classi dei pulsanti dei tre documenti (Verbale, Scheda di valutazione,
// Report): i campi e le tendine usano Input / Textarea / SelectField della libreria.
export const ghostBtnClass = buttonVariants({ variant: 'outline', size: 'sm' })
export const dangerBtnClass = buttonVariants({ variant: 'destructive', size: 'sm' })
export const primaryBtnClass = buttonVariants({ size: 'sm' })
export const dashedBtnClass = cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'self-start border-dashed')
