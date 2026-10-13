import { CircleCheck, CircleDashed, CircleHelp, CircleX } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { ReqStatus } from '@/modules/assessment/lib/role-change'

// Lo stato di una competenza rispetto al ruolo, come chiede il documento del
// cliente: verde posseduta, giallo da sviluppare, nero mancante. Sono stati,
// quindi toni di stato (success, warning) e neutro pieno per «mancante», con
// l'icona e la parola accanto (regola 10). «Non valutata» resta neutra.
const STYLE = {
  posseduta: { tone: 'success', Icon: CircleCheck },
  'da-sviluppare': { tone: 'warning', Icon: CircleDashed },
  mancante: { tone: 'strong', Icon: CircleX },
  'non-valutata': { tone: 'neutral', Icon: CircleHelp },
} as const

export function ReqStatusBadge({ status, label }: { status: ReqStatus; label: string }) {
  const { tone, Icon } = STYLE[status]
  return (
    <Badge tone={tone}>
      <Icon className="size-3" aria-hidden="true" />
      {label}
    </Badge>
  )
}
