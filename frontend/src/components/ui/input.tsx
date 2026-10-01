import { type VariantProps, cva } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '@/lib/utils'

// Il campo di testo della libreria. Raggio sm (10), bordo --input, fondo
// della pagina così il campo si stacca anche dentro una card. Focus ring
// accent-600 2px offset 2px, come il bottone. Errore: `aria-invalid`, che
// Field imposta da sé. Il corpo segue la scala: 15 normale, 14 compatto.
const inputVariants = cva(
  'w-full min-w-0 rounded-sm border border-input bg-background text-foreground transition-colors outline-none dark:scheme-dark placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 read-only:bg-muted aria-invalid:border-destructive file:mr-3 file:border-0 file:bg-transparent file:font-medium file:text-foreground',
  {
    variants: {
      size: {
        default: 'px-3 py-2 text-app-body',
        sm: 'px-3 py-1 text-app-small',
      },
    },
    defaultVariants: { size: 'default' },
  },
)

function Input({ className, type, size, ...props }: Omit<React.ComponentProps<'input'>, 'size'> & VariantProps<typeof inputVariants>) {
  return <input type={type} data-slot="input" className={cn(inputVariants({ size }), className)} {...props} />
}

export { Input }
