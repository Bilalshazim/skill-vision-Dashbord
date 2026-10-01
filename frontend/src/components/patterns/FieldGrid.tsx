import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

// Campi affiancati: una colonna su schermi stretti, due o tre da sm in su.
// Sostituisce Grid2/Grid3 di Recruiting e .field-row di Assessment.
const COLUMNS = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3' } as const

export function FieldGrid({ columns = 2, className, children }: { columns?: 2 | 3; className?: string; children: ReactNode }) {
  return <div className={cn('grid grid-cols-1 gap-4', COLUMNS[columns], className)}>{children}</div>
}
