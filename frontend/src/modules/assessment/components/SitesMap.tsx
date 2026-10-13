import { LocationMap, type MapPoint } from '@/components/patterns/LocationMap'
import { Note } from '@/components/patterns/Note'
import { cityCoordinates } from '@/lib/city-coordinates'
import type { MapPerson } from '@/modules/assessment/components/ValueMap'
import type { getUI } from '@/modules/assessment/lib/legacy-utils'
import { fmt1it } from '@/modules/assessment/lib/legacy-utils'
import type { AssessmentState } from '@/modules/assessment/lib/types'

type UI = ReturnType<typeof getUI>

/** Quante persone si nominano nella scheda del segnaposto; le altre si contano. */
const NAMES_SHOWN = 5

// "Dove lavorano le tue persone": la mappa delle sedi in cima a "La mappa dei
// valori" (richiesta del cliente, 2026-10-13). Un segnaposto per sede di
// Dati aziendali con le persone che ci lavorano (Employee.sede); con una sola
// sede, chi non ne ha una indicata va lì. Nella scheda: città, persone,
// punteggio medio e i primi nomi, dal punteggio più alto. Sotto la mappa si
// dice chi manca e perché, così si sa cosa fare per farlo comparire.
export function SitesMap({ state, people, ui }: { state: AssessmentState; people: MapPerson[]; ui: UI }) {
  const sites = state.company.locations.filter((l) => l.name.trim())
  const single = sites.length === 1 ? sites[0].name.trim() : null
  const sedeOf = new Map(state.employees.filter((e) => !e.archived).map((e) => [e.id, e.sede?.trim() || single || '']))

  const points: MapPoint[] = []
  const unknown: string[] = []
  for (const s of sites) {
    const name = s.name.trim()
    const here = people.filter((p) => sedeOf.get(p.id) === name).sort((a, b) => b.combined - a.combined)
    const coords = cityCoordinates(s.city)
    if (!coords) {
      unknown.push(s.city.trim() ? `${name} (${s.city.trim()})` : name)
      continue
    }
    if (!here.length) continue
    const avg = here.reduce((t, p) => t + p.combined, 0) / here.length
    const names = here.slice(0, NAMES_SHOWN).map((p) => `${p.first} ${p.last}`)
    points.push({
      id: name,
      label: name,
      sub: [s.city.trim(), ui.mapGeoPeople(here.length)].filter(Boolean).join(' · '),
      coords,
      count: here.length,
      lines: [ui.mapGeoAvg(`${fmt1it(avg)} /10`), names.join(', ') + (here.length > NAMES_SHOWN ? `, ${ui.mapGeoOthers(here.length - NAMES_SHOWN)}` : '')],
    })
  }
  const noSede = people.filter((p) => sedeOf.has(p.id) && !sedeOf.get(p.id)).length

  return (
    <div className="flex flex-col gap-3 rounded-md border-2 border-primary bg-card p-4 shadow-[0_8px_16px_0_var(--border-strong)]">
      <div className="flex flex-col gap-1">
        <h3 className="text-app-section text-card-foreground">{ui.mapGeoTitle}</h3>
        <p className="text-app-small text-muted-foreground">{ui.mapGeoSub}</p>
      </div>
      {points.length ? <LocationMap points={points} label={ui.mapGeoLabel} /> : <Note>{ui.mapGeoEmpty}</Note>}
      {noSede && points.length ? <Note size="caption">{ui.mapGeoNoSede(noSede)}</Note> : null}
      {unknown.length ? <Note size="caption">{ui.mapGeoUnknown(unknown.join(', '))}</Note> : null}
    </div>
  )
}
