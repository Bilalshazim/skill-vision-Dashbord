import { type VariantProps, cva } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

// Area di testo: stesso aspetto di Input, altezza minima 80px (quella di
// Assessment), ridimensionabile solo in verticale.
// `variant="inline"`: testo modificabile sul posto dentro una riga (le note
// delle azioni nella Home di Assessment). Senza bordo né fondo finché non
// ci si passa sopra o non prende il fuoco, una riga, non ridimensionabile.
const textareaVariants = cva(
  'w-full min-w-0 rounded-sm border text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default: 'min-h-20 resize-y border-input bg-background read-only:bg-muted',
        inline: 'field-sizing-content min-h-0 resize-none border-transparent bg-transparent hover:border-border focus-visible:bg-background read-only:hover:border-transparent',
      },
      size: {
        default: 'px-3 py-2 text-app-body',
        sm: 'px-3 py-2 text-app-small',
      },
    },
    compoundVariants: [{ variant: 'inline', className: 'px-1 py-0' }],
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Textarea({ className, size, variant, ...props }: React.ComponentProps<'textarea'> & VariantProps<typeof textareaVariants>) {
  return <textarea data-slot="textarea" className={cn(textareaVariants({ variant, size }), className)} {...props} />
}

export { Textarea }
