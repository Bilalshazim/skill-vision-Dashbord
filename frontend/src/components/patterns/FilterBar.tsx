import { Search } from 'lucide-react'
import type { ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Barra dei filtri sopra un elenco o una tabella: la ricerca con l'icona
// a sinistra, poi i filtri (SelectField compatti, Checkbox con etichetta,
// bottoni icona) in una riga che va a capo. Non filtra niente da sé:
// riceve il valore della ricerca e lo restituisce, i filtri sono figli.
export function FilterBar({
  search,
  children,
  className,
}: {
  search?: { value: string; onChange: (value: string) => void; placeholder: string; label?: string }
  children?: ReactNode
  className?: string
}) {
  return (
    <div data-slot="filter-bar" className={cn('flex flex-wrap items-center gap-2', className)}>
      {search ? (
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            size="sm"
            className="pl-9"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder}
            aria-label={search.label ?? search.placeholder}
          />
        </div>
      ) : null}
      {children}
    </div>
  )
}

