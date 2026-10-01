import type { ComponentProps, ReactNode } from 'react'

import { Input } from '@/components/ui/input'

// Un campo con un'etichetta breve davanti, nella stessa riga: il numero di
// una voce in un elenco ordinato ("1", "2", "3") o una parola ("Altro").
// L'etichetta davanti non sostituisce il nome del campo: serve `aria-label`
// (o un Field attorno).
export function PrefixedInput({ lead, ...props }: { lead: ReactNode } & ComponentProps<typeof Input>) {
  return (
    <div data-slot="prefixed-input" className="flex items-center gap-3">
      <span aria-hidden="true" className="label-mono flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-secondary px-2 text-secondary-foreground">
        {lead}
      </span>
      <Input {...props} />
    </div>
  )
}
