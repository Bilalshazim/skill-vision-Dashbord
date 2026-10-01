import type { ReactNode } from 'react'

import { IdoneitaBadge } from '@/components/patterns/IdoneitaBadge'
import { StatCard } from '@/components/patterns/StatCard'
import { idoneitaFromTone } from '@/lib/idoneita'
import { fmt1, round1 } from '@/modules/assessment/lib/legacy-utils'

// Il riquadro valore/etichetta/scarto di Soft, Hard e pannello dipendente
// (statTileHtml() del vecchio Assessment), su StatCard. La sparkline
// ApexCharts a una sola barra è diventata una Progress (MAPPATURA §2):
// verde se il valore raggiunge il riferimento, ambra se è entro un punto,
// rosso sotto; lo scarto con segno e freccia dice di quanto, e la fascia di
// idoneità ("Idoneo", "Da valutare", "Non idoneo") lo dice in parole.
export function StatTile({ label, value, benchmark, max = 10, children }: { label: string; value: number; benchmark: number; max?: number; children?: ReactNode }) {
  const delta = round1(value - benchmark)
  const band = value >= benchmark ? 'success' : value >= benchmark - 1 ? 'warning' : 'destructive'
  return (
    <StatCard
      size="sm"
      label={label}
      value={fmt1(value)}
      progress={(value / max) * 100}
      progressTone={band}
      delta={{ label: `${delta >= 0 ? '+' : ''}${fmt1(delta)}`, direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat', tone: delta >= 0 ? 'success' : 'destructive' }}
    >
      <IdoneitaBadge fascia={idoneitaFromTone(band)} className="self-start" />
      {children}
    </StatCard>
  )
}
