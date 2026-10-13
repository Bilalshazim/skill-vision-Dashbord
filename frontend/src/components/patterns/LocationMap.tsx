import { ParentSize } from '@visx/responsive'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import type { FeatureCollection, Geometry } from 'geojson'
import { useMemo, useState } from 'react'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import countries from 'world-atlas/countries-110m.json'

import { cn } from '@/lib/utils'

// Mappa delle sedi: il mondo con un segnaposto per ogni punto e, al passaggio
// del mouse o con il fuoco da tastiera, una scheda minima con quello che c'è
// lì (richiesta del cliente per "La mappa dei valori", 2026-10-13).
// Bklit ha solo il choropleth, che colora i paesi per valore e non ha
// segnaposti: questa è costruita con d3-geo, come prevede CLAUDE.md quando
// Bklit non copre il grafico (DECISIONI, "Mappa delle sedi").
// La vista si adatta ai punti: con sedi tutte in Italia mostra l'Italia e i
// paesi vicini, con sedi su più continenti il mondo. Terre scure in chiaro
// (`foreground`, come nel riferimento del cliente) e grigie in scuro
// (`border-strong`), confini nel colore della card, segnaposti `primary` con
// bordo scuro: leggibili nelle due modalità. Due segnaposti troppo vicini si
// scostano; un punto scuro resta sulla posizione vera. Il numero nel segnaposto è scritto, il
// colore non porta significato. Nessun dato dentro: riceve i punti.
export type MapPoint = {
  id: string
  /** Nome del punto (la sede). */
  label: string
  /** Riga sotto il nome, per esempio la città. */
  sub?: string
  /** [longitudine, latitudine]. */
  coords: [number, number]
  /** Il numero nel segnaposto (per esempio le persone). */
  count: number
  /** Righe della scheda, sotto il nome. */
  lines?: string[]
}

const WORLD = feature(countries as unknown as Topology, (countries as unknown as Topology<{ countries: GeometryCollection }>).objects.countries) as FeatureCollection<Geometry>

const HEIGHT = { md: 320, lg: 448 } as const
const PAD = 32
/** Ampiezza minima della vista, in gradi: una sede sola non diventa una via. */
const MIN_SPAN: [number, number] = [8, 6]
/** Distanza minima fra due segnaposti, in px: sotto, il secondo si scosta. */
const MIN_GAP = 26

function viewBox(points: MapPoint[]): FeatureCollection<Geometry> | null {
  if (!points.length) return null
  const lons = points.map((p) => p.coords[0])
  const lats = points.map((p) => p.coords[1])
  let [x0, x1, y0, y1] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)]
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  const w = Math.max(x1 - x0, MIN_SPAN[0]) * 1.3
  const h = Math.max(y1 - y0, MIN_SPAN[1]) * 1.3
  ;[x0, x1, y0, y1] = [Math.max(-180, cx - w / 2), Math.min(180, cx + w / 2), Math.max(-60, cy - h / 2), Math.min(80, cy + h / 2)]
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: { type: 'MultiPoint', coordinates: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] } }],
  }
}

export function LocationMap({ points, height = 'lg', label, className }: { points: MapPoint[]; height?: keyof typeof HEIGHT; label: string; className?: string }) {
  return (
    <div className={cn('relative w-full', className)} style={{ height: HEIGHT[height] }}>
      <ParentSize debounceTime={10}>{({ width }) => (width > 0 ? <MapSvg points={points} width={width} height={HEIGHT[height]} label={label} /> : null)}</ParentSize>
    </div>
  )
}

function MapSvg({ points, width, height, label }: { points: MapPoint[]; width: number; height: number; label: string }) {
  const [active, setActive] = useState<string | null>(null)
  const { path, place } = useMemo(() => {
    const projection = geoNaturalEarth1()
    const box = viewBox(points)
    if (box) projection.fitExtent([[PAD, PAD], [width - PAD, height - PAD]], box)
    else projection.fitExtent([[PAD, PAD], [width - PAD, height - PAD]], WORLD)
    return { path: geoPath(projection), place: (c: [number, number]) => projection(c) }
  }, [points, width, height])
  // I punti più a sud si disegnano per ultimi, così un segnaposto non copre
  // la punta di quello sotto.
  const placed: { p: MapPoint; at: [number, number]; xy: [number, number] }[] = []
  points
    .map((p) => ({ p, at: place(p.coords) }))
    .filter((x): x is { p: MapPoint; at: [number, number] } => !!x.at)
    .sort((a, b) => a.at[1] - b.at[1])
    .forEach(({ p, at }) => {
      // Scosta il segnaposto finché non è a MIN_GAP da quelli già messi,
      // alternando destra e sinistra.
      let xy: [number, number] = [at[0], at[1]]
      for (let k = 1; placed.some((o) => Math.hypot(o.xy[0] - xy[0], o.xy[1] - xy[1]) < MIN_GAP) && k < 12; k++) {
        xy = [at[0] + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * MIN_GAP, at[1]]
      }
      placed.push({ p, at, xy })
    })
  const current = placed.find((x) => x.p.id === active)

  return (
    <>
      <svg width={width} height={height} role="img" aria-label={label} className="block overflow-hidden">
        <g aria-hidden="true">
          {WORLD.features.map((f, i) => (
            <path key={i} d={path(f) ?? undefined} className="fill-foreground stroke-card dark:fill-border-strong" strokeWidth={0.6} />
          ))}
        </g>
        {placed.map(({ p, at, xy }) =>
          at[0] !== xy[0] ? <circle key={`${p.id}-at`} cx={at[0]} cy={at[1]} r={3} className="fill-primary stroke-primary-foreground" strokeWidth={1} aria-hidden="true" /> : null,
        )}
        {placed.map(({ p, xy }) => {
          const on = p.id === active
          return (
            <g
              key={p.id}
              transform={`translate(${xy[0]},${xy[1]})`}
              tabIndex={0}
              role="button"
              aria-label={`${p.label}${p.sub ? `, ${p.sub}` : ''}: ${p.count}`}
              aria-expanded={on}
              className="cursor-pointer outline-none"
              onMouseEnter={() => setActive(p.id)}
              onMouseLeave={() => setActive((a) => (a === p.id ? null : a))}
              onFocus={() => setActive(p.id)}
              onBlur={() => setActive((a) => (a === p.id ? null : a))}
              onKeyDown={(e) => e.key === 'Escape' && setActive(null)}
            >
              <g className="transition-transform duration-150" style={{ transform: on ? 'scale(1.15)' : undefined, transformOrigin: '0 0' }}>
                {/* Segnaposto a goccia: la punta sulla coordinata, la testa sopra. */}
                <path d="M0 0 C -4 -8 -12 -13 -12 -22 A 12 12 0 1 1 12 -22 C 12 -13 4 -8 0 0 Z" fill="var(--primary)" stroke="var(--primary-foreground)" strokeWidth={on ? 2 : 1.5} />
                <text y={-22} textAnchor="middle" dominantBaseline="central" className="fill-primary-foreground font-mono text-app-caption font-semibold tabular-nums">
                  {p.count}
                </text>
              </g>
            </g>
          )
        })}
      </svg>
      {current ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-(--z-popover) w-max max-w-64 -translate-x-1/2 -translate-y-full rounded-md border border-border-strong bg-popover px-3 py-2 text-app-small text-popover-foreground"
          style={{ left: current.xy[0], top: current.xy[1] - 40 }}
        >
          <p className="font-semibold">{current.p.label}</p>
          {current.p.sub ? <p className="text-app-caption text-muted-foreground">{current.p.sub}</p> : null}
          {current.p.lines?.length ? (
            <ul className="mt-1 flex flex-col gap-1 border-t border-border pt-1">
              {current.p.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
