import { Card, CardLabel } from '@/components/ui/card'
import type { getUI } from '@/modules/assessment/lib/legacy-utils'
import type { Candidate } from '@/modules/assessment/lib/role-change'

type UI = ReturnType<typeof getUI>

const EASE_RANK = { alta: 0, media: 1, bassa: 2 } as const

// L'ultimo passo della logica del documento: QUAL È LA SCELTA MIGLIORE PER
// L'AZIENDA. La proposta è la persona più compatibile; se una delle
// alternative si inserisce più facilmente (meno sviluppo, nessuna competenza
// essenziale mancante) lo si dice, perché la decisione può dipendere da
// quanto in fretta va coperto il ruolo.
export function BestChoice({ top, ui }: { top: Candidate[]; ui: UI }) {
  const [best, ...rest] = top
  if (!best) return null
  const faster = rest.find((c) => EASE_RANK[c.ease] < EASE_RANK[best.ease] || (c.ease === best.ease && c.devPoints < best.devPoints - 1))
  return (
    <Card padding="lg" className="gap-2 border-2 border-primary">
      <CardLabel>{ui.rcBestChoice}</CardLabel>
      <p className="max-w-3xl text-app-body">
        {ui.rcChoice({
          best: `${best.emp.nome} ${best.emp.cognome}`,
          compat: best.compat,
          ease: ui.rcEase[best.ease],
          alt: faster ? `${faster.emp.nome} ${faster.emp.cognome}` : undefined,
          altCompat: faster?.compat,
        })}
      </p>
    </Card>
  )
}
