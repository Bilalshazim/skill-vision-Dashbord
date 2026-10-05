import { X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { PersonRow } from '@/components/patterns/PersonRow'
import { ScatterMatrix, type ScatterGroup, type ScatterRegion } from '@/components/patterns/ScatterMatrix'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { getUI } from '@/modules/assessment/lib/legacy-utils'
import { fmt1 } from '@/modules/assessment/lib/legacy-utils'

type UI = ReturnType<typeof getUI>

export type MapPerson = { id: string; first: string; last: string; role: string; soft: number; hard: number; combined: number; tier: string }

// Le soglie delle due zone (scala 0–10, quelle della scala di punteggio: 7
// "buono", 5 "medio"): in alto a destra chi supera il 7 su entrambe, in basso
// a sinistra chi resta sotto il 5 su entrambe.
const TOP_ZONE: ScatterRegion = { x0: 7, y0: 7, x1: 10, y1: 10 }
const BOTTOM_ZONE: ScatterRegion = { x0: 0, y0: 0, x1: 5, y1: 5 }
const LIST_SIZE = 5

const inside = (p: MapPerson, r: ScatterRegion) => p.soft >= r.x0 && p.soft <= r.x1 && p.hard >= r.y0 && p.hard <= r.y1

// La mappa dei valori (Finestra 2, Foglio 3 di Assessment): ogni dipendente è
// un punto su competenze trasversali × professionali. Passando con il mouse
// sull'angolo in alto a destra compaiono i nomi dei più talentuosi, su quello
// in basso a sinistra l'elenco di chi richiede attenzione; trascinando si
// sceglie un'area qualsiasi, e un clic fuori la toglie. Gli stessi due elenchi
// si aprono anche con i pulsanti, per chi non usa il mouse. Fascia e nome di
// ogni persona sono anche in tabella sotto il grafico (ScatterMatrix).
export function ValueMap({
  ui,
  people,
  groups,
  onPersonClick,
}: {
  ui: UI
  people: MapPerson[]
  groups: ScatterGroup[]
  onPersonClick: (id: string) => void
}) {
  const [locked, setLocked] = useState<ScatterRegion | null>(null)
  const [previewZone, setPreviewZone] = useState<'top' | 'bottom' | null>(null)

  const zoneRegion = previewZone === 'top' ? TOP_ZONE : previewZone === 'bottom' ? BOTTOM_ZONE : null
  const region = zoneRegion ?? locked
  const members = useMemo(() => (region ? people.filter((p) => inside(p, region)).sort((a, b) => b.combined - a.combined) : []), [people, region])
  const ranked = useMemo(() => [...people].sort((a, b) => b.combined - a.combined), [people])
  const best = ranked.slice(0, LIST_SIZE)
  const worst = ranked.slice(-LIST_SIZE).reverse()

  const tierLabel = (key: string) => groups.find((g) => g.key === key)?.label ?? ''
  const listTitle = zoneRegion === TOP_ZONE ? ui.f3ZoneTop : zoneRegion === BOTTOM_ZONE ? ui.f3ZoneBottom : ui.f3ZoneSelected

  function row(p: MapPerson) {
    return (
      <PersonRow
        key={p.id}
        first={p.first}
        last={p.last}
        meta={`${p.role} · ${tierLabel(p.tier)}`}
        onClick={() => onPersonClick(p.id)}
        trailing={<Badge tone={p.combined >= 7 ? 'success' : p.combined >= 5 ? 'warning' : 'destructive'} dot>{fmt1(p.combined)}</Badge>}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border-2 border-primary bg-card p-4 shadow-[0_8px_16px_0_var(--border-strong)]">
      <div>
        <h4 className="text-app-section text-card-foreground">{ui.f3MapTitle}</h4>
        <p className="mt-1 text-app-small text-muted-foreground">{ui.f3MapSub}</p>
      </div>

      <ScatterMatrix
        title={ui.f3MapTitle}
        xLabel={ui.moduleASoft}
        yLabel={ui.moduleBHard}
        groups={groups}
        points={people.map((p) => ({ id: p.id, label: `${p.first} ${p.last}`, x: p.soft, y: p.hard, group: p.tier }))}
        onPointClick={onPersonClick}
        selection={{
          region,
          onRegionChange: (r) => {
            setPreviewZone(null)
            setLocked(r)
          },
          zones: [
            { key: 'top', label: ui.f3ZoneTop, region: TOP_ZONE },
            { key: 'bottom', label: ui.f3ZoneBottom, region: BOTTOM_ZONE },
          ],
          onZoneHover: (k) => setPreviewZone(k as 'top' | 'bottom' | null),
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant={locked === TOP_ZONE ? 'default' : 'outline'} onClick={() => setLocked(locked === TOP_ZONE ? null : TOP_ZONE)} aria-pressed={locked === TOP_ZONE}>
          {ui.f3ZoneTop}
        </Button>
        <Button type="button" size="sm" variant={locked === BOTTOM_ZONE ? 'default' : 'outline'} onClick={() => setLocked(locked === BOTTOM_ZONE ? null : BOTTOM_ZONE)} aria-pressed={locked === BOTTOM_ZONE}>
          {ui.f3ZoneBottom}
        </Button>
        {locked ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => setLocked(null)}>
            <X aria-hidden="true" />
            {ui.f3ZoneClear}
          </Button>
        ) : (
          <span className="text-app-caption text-muted-foreground">{ui.f3ZoneHint}</span>
        )}
      </div>

      {region ? (
        <div className="rounded-md border border-border bg-background p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-app-small font-semibold text-foreground">{listTitle}</span>
            <span className="ml-auto text-app-small text-muted-foreground tabular-nums">{members.length}</span>
          </div>
          <div className="max-h-64 overflow-y-auto">{members.length ? members.map(row) : <p className="py-4 text-center text-app-small text-muted-foreground">{ui.f3ZoneEmpty}</p>}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-md border border-border bg-background p-3">
            <div className="mb-2 text-app-small font-semibold text-foreground">{ui.f3ZoneTop}</div>
            {best.map(row)}
          </div>
          <div className="rounded-md border border-border bg-background p-3">
            <div className="mb-2 text-app-small font-semibold text-foreground">{ui.f3ZoneBottom}</div>
            {worst.map(row)}
          </div>
        </div>
      )}
    </div>
  )
}
