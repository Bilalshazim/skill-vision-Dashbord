"use client";

import { useChart } from "./chart-context";

// Skill Vision — il riferimento di una barra (atteso, benchmark) come segno
// tratteggiato sulla barra, non come seconda barra (fondamenta, "Riferimento:
// benchmark, valore atteso"; CLAUDE.md, Fase 5, rivisto il 2026-10-26).
// Bklit non ha un riferimento per riga nel BarChart (la sua ReferenceArea è
// una fascia unica sull'asse): questo strato legge le stesse scale delle
// barre dal contesto del grafico e disegna, per ogni categoria, un trattino
// perpendicolare alla barra al valore atteso. Non porta `dataKey`, quindi
// BarChart non lo conta fra le serie e le barre restano a tutta banda.
export interface BarReferenceProps {
  /** La chiave del valore atteso in ogni riga dei dati. */
  referenceKey: string;
  /** Default: `var(--chart-reference)`. */
  stroke?: string;
}

export function BarReference({
  referenceKey,
  stroke = "var(--chart-reference)",
}: BarReferenceProps) {
  const { data, yScale, orientation, barScale, bandWidth, barXAccessor } =
    useChart();
  if (!(barScale && bandWidth && barXAccessor)) {
    return null;
  }
  const isHorizontal = orientation === "horizontal";
  const overhang = Math.min(6, bandWidth / 4);
  return (
    <g data-slot="bar-reference" pointerEvents="none">
      {data.map((d) => {
        const value = d[referenceKey];
        if (typeof value !== "number") {
          return null;
        }
        const band = barScale(barXAccessor(d)) ?? 0;
        const pos = yScale(value) ?? 0;
        const [x1, y1, x2, y2] = isHorizontal
          ? [pos, band - overhang, pos, band + bandWidth + overhang]
          : [band - overhang, pos, band + bandWidth + overhang, pos];
        return (
          <line
            key={barXAccessor(d)}
            stroke={stroke}
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeWidth={2}
            x1={x1}
            x2={x2}
            y1={y1}
            y2={y2}
          />
        );
      })}
    </g>
  );
}

BarReference.displayName = "BarReference";
