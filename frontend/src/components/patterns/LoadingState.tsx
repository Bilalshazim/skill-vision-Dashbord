import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Stato di caricamento di un'area: righe di scheletro al posto del
// contenuto, distinte dallo stato vuoto (checklist §8). Il testo resta per
// i lettori di schermo (`label`, "Caricamento…" se non dato).
export function LoadingState({ label = 'Caricamento…', rows = 3, className }: { label?: string; rows?: number; className?: string }) {
  return (
    <div data-slot="loading-state" role="status" className={cn('flex flex-col gap-3 py-4', className)}>
      <span className="sr-only">{label}</span>
      <Skeleton className="h-6 w-1/3" />
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={cn('h-4', i % 3 === 2 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}
