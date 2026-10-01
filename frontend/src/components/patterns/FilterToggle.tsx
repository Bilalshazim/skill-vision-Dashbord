import type { ReactNode } from 'react'

// Un filtro con la sua etichetta accanto (Checkbox, Switch) dentro
// FilterBar: l'etichetta intera è cliccabile e resta allineata agli altri
// controlli della riga.
export function FilterToggle({ children }: { children: ReactNode }) {
  return <label className="flex items-center gap-2 text-app-small text-muted-foreground">{children}</label>
}
