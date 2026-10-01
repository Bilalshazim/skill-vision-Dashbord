import { Badge } from '@/components/ui/badge'
import { IDONEITA, type Idoneita } from '@/lib/idoneita'

// La fascia di idoneità come badge: la parola ("Idoneo", "Da valutare",
// "Non idoneo") con il tono di stato accanto (regola 10).
export function IdoneitaBadge({ fascia, className }: { fascia: Idoneita; className?: string }) {
  const f = IDONEITA[fascia]
  return (
    <Badge tone={f.tone} dot className={className}>
      {f.label}
    </Badge>
  )
}
